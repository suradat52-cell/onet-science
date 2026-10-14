// นำเข้าไฟล์ทั้ง 12 ไฟล์ใน import-bundles/ เข้า Google Sheets ผ่าน Apps Script เดียวกับหน้าเว็บ (ทีละไฟล์ ตามลำดับ)
//   node tools/import-all.mjs [--api=URL] [--dir=โฟลเดอร์] [--user=ชื่อผู้ใช้]
//   ถามชื่อผู้ใช้ (ค่าเริ่มต้น admin) และรหัสผ่าน (ไม่แสดงตัวอักษร) ในหน้าต่างคำสั่ง · ไม่เก็บรหัสผ่านหรือ token ลงไฟล์/จอ
//   ใช้บัญชีผู้ดูแลกลาง (super) · หยุดทันทีถ้าไฟล์ใดผิดพลาดหรือจำนวนไม่ตรง · exit 0 = ผ่านครบ
// API_URL ค่าเริ่มต้นอ่านจาก index.html (ตัวเดียวกับที่เว็บใช้) ; ทดสอบกับเซิร์ฟเวอร์จำลอง: --api=http://localhost:8765/api
import fs from "fs";
import path from "path";
import { ROOT } from "./lib.mjs";

const arg = n => process.argv.find(a => a.startsWith("--" + n + "="))?.slice(n.length + 3);
const DIR = path.resolve(arg("dir") || path.join(ROOT, "import-bundles"));
const API = arg("api") || fs.readFileSync(path.join(ROOT, "index.html"), "utf8").match(/const API_URL = '([^']+)'/)?.[1];
if (!API) { console.error("✗ ไม่พบ API_URL ใน index.html (ใส่ --api=URL)"); process.exit(1); }

// ลำดับและจำนวนที่ควรได้ (ตรงกับตารางใน DEPLOY.md ขั้น 3.6)
const STEPS = [
  { tab: "bp", file: "1-blueprint.tsv", action: "importBlueprint", want: 203 },
  { tab: "bank", file: "2-questions-P6.tsv", action: "importQuestions", want: 185 },
  { tab: "bank", file: "2-questions-M3-a.tsv", action: "importQuestions", want: 215 },
  { tab: "bank", file: "2-questions-M3-b.tsv", action: "importQuestions", want: 89 },
  { tab: "sm", file: "3-summaries-P6.txt", action: "importSummaries", want: 75 },
  { tab: "sm", file: "3-summaries-M3-a.txt", action: "importSummaries", want: 104 },
  { tab: "sm", file: "3-summaries-M3-b.txt", action: "importSummaries", want: 31 },
  { tab: "sol", file: "4-solutions-P6-a.txt", action: "importSolutions", want: 125 },
  { tab: "sol", file: "4-solutions-P6-b.txt", action: "importSolutions", want: 60 },
  { tab: "sol", file: "4-solutions-M3-a.txt", action: "importSolutions", want: 105 },
  { tab: "sol", file: "4-solutions-M3-b.txt", action: "importSolutions", want: 110 },
  { tab: "sol", file: "4-solutions-M3-c.txt", action: "importSolutions", want: 89 },
];
// ยอดรวมสุดท้ายของแต่ละแท็บที่อ่านจากระบบ (ตามระดับ)
const TOTALS = {
  bp: { label: "ผังข้อสอบ (แถว)", want: { P6: null, M3: null, all: 203 } },
  bank: { label: "คลังข้อสอบ (ข้อ)", want: { P6: 185, M3: 304, all: 489 } },
  sm: { label: "สรุปเนื้อหา (หัวข้อ)", want: { P6: 75, M3: 135, all: 210 } },
  sol: { label: "เฉลยละเอียด (ข้อ)", want: { P6: 185, M3: 304, all: 489 } },
};

/* ---------- รับข้อมูลจากแป้นพิมพ์ ---------- */
const piped = [];
let pipedLoaded = false;
async function loadPiped() {
  if (pipedLoaded) return; pipedLoaded = true;
  let s = ""; for await (const c of process.stdin) s += c;
  piped.push(...s.split(/\r?\n/));
}
async function ask(q, hidden) {
  process.stdout.write(q);
  if (!process.stdin.isTTY) { await loadPiped(); process.stdout.write("\n"); return piped.shift() ?? ""; }
  return new Promise(resolve => {
    let buf = "";
    const { stdin } = process;
    stdin.setRawMode(true); stdin.resume(); stdin.setEncoding("utf8");
    const on = chunk => {
      for (const ch of chunk) {
        if (ch === "\u0003") { stdin.setRawMode(false); process.stdout.write("\n"); process.exit(130); }
        if (ch === "\r" || ch === "\n") { stdin.setRawMode(false); stdin.pause(); stdin.off("data", on); process.stdout.write("\n"); return resolve(buf); }
        if (ch === "\u007f" || ch === "\b") { buf = buf.slice(0, -1); if (!hidden) process.stdout.write("\b \b"); continue; }
        buf += ch; if (!hidden) process.stdout.write(ch);
      }
    };
    stdin.on("data", on);
  });
}

/* ---------- เรียก API ---------- */
async function api(action, data) {
  let r;
  try {
    r = await fetch(API, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action, ...data }), signal: AbortSignal.timeout(5 * 60e3) });
  } catch (e) { throw new Error("เชื่อมต่อ API ไม่ได้ (" + (e.name === "TimeoutError" ? "หมดเวลา 5 นาที" : e.cause?.code || e.message) + ")"); }
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { throw new Error(`API ไม่ได้ตอบ JSON (HTTP ${r.status}) — Deploy ต้องตั้ง "ผู้มีสิทธิ์เข้าถึง: ทุกคน"`); }
  if (!j.ok) throw new Error(j.error);
  return j.data;
}

const rows = [];
const pad = (s, n) => { s = String(s); return s + " ".repeat(Math.max(0, n - [...s].length)); };
function table(head, body) {
  const w = head.map((h, i) => Math.max(...[head, ...body].map(r => [...String(r[i])].length)));
  const line = r => r.map((c, i) => pad(c, w[i])).join("  ");
  console.log(line(head)); console.log(w.map(x => "-".repeat(x)).join("  ")); body.forEach(r => console.log(line(r)));
}
function finish(code, failMsg) {
  if (rows.length) { console.log("\nสรุปไฟล์ที่นำเข้า"); table(["ไฟล์", "ควรได้", "ได้จริง", "ผล"], rows); }
  if (failMsg) console.error("\n✗ " + failMsg);
  process.exitCode = code; process.exit(code);
}

/* ---------- เริ่มทำงาน ---------- */
for (const s of STEPS) if (!fs.existsSync(path.join(DIR, s.file))) { console.error("✗ ไม่พบไฟล์ " + path.join(DIR, s.file) + " (สร้างใหม่ด้วย node tools/bundle-import.mjs)"); process.exit(1); }
console.log("API: " + API.replace(/\/s\/[^/]+\//, "/s/…/"));
const user = (await ask("ชื่อผู้ใช้ [admin]: ", false)).trim() || arg("user") || "admin";
const pass = await ask("รหัสผ่าน (พิมพ์แล้วไม่แสดงบนจอ): ", true);
if (!pass) { console.error("✗ ไม่ได้กรอกรหัสผ่าน"); process.exit(1); }

let token;
try { token = (await api("login", { username: user, password: pass })).token; } catch (e) { finish(1, "ล็อกอินไม่สำเร็จ: " + e.message); }
console.log("ล็อกอินสำเร็จ\n");

for (const [i, s] of STEPS.entries()) {
  const label = `[${i + 1}/${STEPS.length}] ${s.file}`;
  const text = fs.readFileSync(path.join(DIR, s.file), "utf8").replace(/^﻿/, "");
  const t0 = Date.now();
  process.stdout.write(`${label} … `);
  let r;
  try { r = await api(s.action, { token, text }); } catch (e) { rows.push([s.file, s.want, "-", "ผิดพลาด"]); console.log("ผิดพลาด"); finish(1, `${s.file} ผิดพลาด: ${e.message}\nหยุดแล้ว ไฟล์ก่อนหน้านี้นำเข้าไปแล้ว (นำเข้าซ้ำได้ปลอดภัย)`); }
  const ok = r.added === s.want;
  rows.push([s.file, s.want, r.added, ok ? "ผ่าน" : "ไม่ตรง"]);
  console.log(`${r.added} (${((Date.now() - t0) / 1000).toFixed(1)} วินาที)${ok ? "" : " ✗ ไม่ตรง"}`);
  if (!ok) finish(1, `${s.file}: ควรได้ ${s.want} แต่ระบบตอบ ${r.added} — หยุดแล้ว`);
}

/* ---------- ยอดรวมที่อ่านจากระบบจริง ---------- */
let allOk = true;
const total = [];
const stat = async a => api(a, { token });
try {
  const [bp, bank, sm, sol] = [await stat("blueprintStats"), await stat("bankStats"), await stat("summaryStats"), await stat("solutionStats")];
  const sum = (arr, f, lv) => arr.filter(x => !lv || x.level === lv).reduce((a, x) => a + f(x), 0);
  const got = {
    bp: { all: sum(bp, x => x.standards + x.indicators) },
    bank: { P6: sum(bank, x => x.n, "P6"), M3: sum(bank, x => x.n, "M3"), all: sum(bank, x => x.n) },
    sm: { P6: sum(sm, x => x.sections, "P6"), M3: sum(sm, x => x.sections, "M3"), all: sum(sm, x => x.sections) },
    sol: { P6: sum(sol, x => x.n, "P6"), M3: sum(sol, x => x.n, "M3"), all: sum(sol, x => x.n) },
  };
  for (const [tab, t] of Object.entries(TOTALS)) for (const k of ["P6", "M3", "all"]) {
    const want = t.want[k]; if (want == null) continue;
    const g = got[tab][k], ok = g === want; if (!ok) allOk = false;
    total.push([t.label, k === "all" ? "รวม" : k === "P6" ? "ป.6" : "ม.3", want, g, ok ? "ผ่าน" : "ไม่ตรง"]);
  }
} catch (e) { finish(1, "อ่านยอดรวมจากระบบไม่สำเร็จ: " + e.message); }

console.log("\nสรุปไฟล์ที่นำเข้า"); table(["ไฟล์", "ควรได้", "ได้จริง", "ผล"], rows);
console.log("\nยอดรวมที่อ่านจากระบบจริง"); table(["แท็บ", "ระดับ", "ควรได้", "ได้จริง", "ผล"], total);
if (!allOk) { console.error("\n✗ ยอดรวมบางแท็บไม่ตรง"); process.exit(1); }
console.log("\n✓ นำเข้าครบ 12 ไฟล์ ยอดรวมตรงทุกแท็บ");
process.exit(0);
