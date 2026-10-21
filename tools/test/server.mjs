// รัน apps-script/Code.gs จริงใน Node กับ Google Sheets จำลอง (in-memory) แล้วเสิร์ฟ index.html + images/
// node tools/test/server.mjs [port=8765]
// ตอนเริ่ม: สร้าง content/ จาก data/ (tools/build-content.mjs) → setup() → สร้างโรงเรียนและนักเรียนทดสอบ · เนื้อหาเสิร์ฟจาก /content/ เหมือน GitHub Pages
// Apps Script จำลองรัน Code.gs จริง: UrlFetchApp.fetch ของกุญแจเฉลย อ่านจาก content/ ในเครื่อง
// API_URL ของหน้าเว็บถูกแทนเป็น /api ตอนเสิร์ฟเท่านั้น (ไม่แก้ไฟล์จริง)
import fs from "fs";
import http from "http";
import path from "path";
import vm from "vm";
import crypto from "crypto";
import { ROOT, at, TOOLS } from "../lib.mjs";
import { buildContent } from "../build-content.mjs";

const built = buildContent(); // เนื้อหาใหม่จาก data/ ทุกครั้งที่เริ่มเซิร์ฟเวอร์ทดสอบ
const fetchLog = [];

const PORT = +(process.argv[2] || 8765);
const logs = [];

/* ---------- Apps Script services จำลอง ---------- */
class Range {
  constructor(sh, r, c, nr, nc) { Object.assign(this, { sh, r, c, nr, nc }); }
  getValues() { return Array.from({ length: this.nr }, (_, i) => Array.from({ length: this.nc }, (_, j) => (this.sh.data[this.r - 1 + i] || [])[this.c - 1 + j] ?? "")); }
  setValues(v) { v.forEach((row, i) => row.forEach((x, j) => this.sh.set(this.r + i, this.c + j, x))); return this; }
  setValue(x) { this.sh.set(this.r, this.c, x); return this; }
  setNumberFormat() { return this; }
  clearContent() { for (let i = 0; i < this.nr; i++) for (let j = 0; j < this.nc; j++) this.sh.set(this.r + i, this.c + j, ""); this.sh.trim(); return this; }
}
class Sheet {
  constructor(name) { this.name = name; this.data = []; }
  set(r, c, x) { while (this.data.length < r) this.data.push([]); const row = this.data[r - 1]; while (row.length < c) row.push(""); row[c - 1] = x; }
  trim() { while (this.data.length && this.data[this.data.length - 1].every(x => x === "")) this.data.pop(); }
  getLastRow() { this.trim(); return this.data.length; }
  getLastColumn() { return Math.max(0, ...this.data.map(r => { let n = r.length; while (n && r[n - 1] === "") n--; return n; })); }
  getMaxRows() { return Math.max(1000, this.data.length); }
  getRange(r, c, nr = 1, nc = 1) { return new Range(this, r, c, nr, nc); }
  getDataRange() { return new Range(this, 1, 1, this.getLastRow(), this.getLastColumn()); }
  appendRow(v) { this.getRange(this.getLastRow() + 1, 1, 1, v.length).setValues([v]); }
  setFrozenRows() {}
}
const book = {}, cache = {};
const ctx = vm.createContext({
  SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheetByName: n => book[n] || null, insertSheet: n => (book[n] = new Sheet(n)) }) },
  Utilities: {
    getUuid: () => crypto.randomUUID(), sleep: () => {},
    DigestAlgorithm: { SHA_256: "sha256" }, Charset: { UTF_8: "utf8" },
    computeDigest: (alg, s) => [...crypto.createHash("sha256").update(s, "utf8").digest()].map(b => (b > 127 ? b - 256 : b)),
  },
  UrlFetchApp: { fetch: url => { fetchLog.push(url); if (globalThis.__FETCH_FAIL) throw new Error('Exception: Address unavailable (จำลอง)'); const m = /\/content\/([^?]+)/.exec(url), f = m && path.join(ROOT, "content", m[1]); const ok = f && fs.existsSync(f); return { getResponseCode: () => (ok ? 200 : 404), getContentText: () => (ok ? fs.readFileSync(f, "utf8") : "") }; } },
  CacheService: { getScriptCache: () => ({ get: k => cache[k] ?? null, put: (k, v) => { cache[k] = v; }, remove: k => { delete cache[k]; }, removeAll: ks => ks.forEach(k => delete cache[k]) }) },
  LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
  ContentService: { MimeType: { JSON: "json" }, createTextOutput: s => ({ s, setMimeType() { return this; } }) },
  Logger: { log: m => logs.push(String(m)) },
  console,
});
vm.runInContext(fs.readFileSync(at("apps-script", "Code.gs"), "utf8"), ctx);
const call = p => JSON.parse(ctx.doPost({ postData: { contents: JSON.stringify(p) } }).s);
const must = r => { if (!r.ok) throw new Error(r.error); return r.data; };

/* ---------- ข้อมูลเริ่มต้น ---------- */
ctx.setup();
const password = logs.join("\n").match(/รหัสผ่าน: (\w+)/)[1];
const token = must(call({ action: "login", username: "admin", password })).token;
export { built, fetchLog };
const sid = must(call({ action: "saveSchool", token, name: "โรงเรียนทดสอบ" })).id;
must(call({ action: "addStudents", token, schoolId: sid, level: "P6", text: "6/1,1,เด็กหญิงทดสอบ ป.หก" }));
must(call({ action: "addStudents", token, schoolId: sid, level: "M3", text: "3/1,1,เด็กชายทดสอบ ม.สาม" }));
fs.mkdirSync(path.join(TOOLS, ".cache"), { recursive: true });
const rooms = {};
for (const lv of ["P6", "M3"]) rooms[lv] = must(call({ action: "roomCodes", token, schoolId: sid, level: lv }))[0].code;
fs.writeFileSync(path.join(TOOLS, ".cache", "admin.json"), JSON.stringify({ username: "admin", password, port: PORT, schoolId: sid, rooms }));

/* ---------- http ---------- */
const MIME = { ".html": "text/html; charset=utf-8", ".png": "image/png", ".webp": "image/webp", ".jpg": "image/jpeg", ".js": "text/javascript", ".json": "application/json", ".css": "text/css", ".webmanifest": "application/manifest+json", ".svg": "image/svg+xml" };
http.createServer((req, res) => {
  if (req.url.startsWith("/__fail")) { globalThis.__FETCH_FAIL = /on=1/.test(req.url); res.writeHead(200); return res.end("fetchfail=" + globalThis.__FETCH_FAIL); } // ทดสอบ: ให้ UrlFetch (โหลดเฉลย) ล้มเหลว
  if (req.method === "POST" && req.url === "/api") {
    let b = ""; req.on("data", d => (b += d));
    req.on("end", () => { res.writeHead(200, { "Content-Type": "application/json" }); res.end(ctx.doPost({ postData: { contents: b } }).s); });
    return;
  }
  const rel = decodeURIComponent(req.url.split("?")[0]).replace(/^\/+/, "") || "index.html";
  const file = path.join(ROOT, rel);
  if (!file.startsWith(ROOT) || !/^(index\.html|grade\.js|app\.css|sw\.js|manifest\.webmanifest|icons\/|js\/|images\/|figs\/|content\/)/.test(rel.replace(/\\/g, "/")) || !fs.existsSync(file)) { res.writeHead(404); return res.end("not found"); }
  let body = fs.readFileSync(file);
  if (rel === "index.html") { body = body.toString("utf8").replace(/const API_URL = '[^']*';/, "const API_URL = '/api';"); if (/script\.google\.com/.test(body)) { res.writeHead(500); return res.end("ปฏิเสธ: index.html ยังมี URL Apps Script จริง (กันชุดทดสอบยิงระบบจริง)"); } }
  res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream" });
  res.end(body);
}).listen(PORT, () => console.log(`เปิด http://localhost:${PORT} (ผู้ใช้ admin รหัสผ่านอยู่ใน tools/.cache/admin.json)`));
