// ทดสอบการนำเข้าผ่านหน้าแอดมินจริง (เหมือนที่ครูจะทำ): ล็อกอิน → นำเข้า import-bundles/* ทีละไฟล์ตามลำดับ → ตรวจจำนวนกับไฟล์ข้อมูล
// ต้องรัน tools/test/server.mjs และ node tools/bundle-import.mjs ก่อน · นำเข้าซ้ำต้องไม่ทำให้จำนวนเพิ่ม (ทดสอบ 2 รอบ)
// node tools/test/import-ui.mjs
import fs from "fs";
import path from "path";
import puppeteer from "puppeteer-core";
import { at, BLOCK_REAL_API } from "../lib.mjs";

const cfg = JSON.parse(fs.readFileSync(at("tools", ".cache", "admin.json"), "utf8"));
const BASE = `http://localhost:${cfg.port}`;
const api = async (action, p = {}) => { const r = await (await fetch(BASE + "/api", { method: "POST", body: JSON.stringify({ action, ...p }) })).json(); if (!r.ok) throw new Error(r.error); return r.data; };
let bad = 0;
const t = (name, ok, info = "") => { if (!ok) bad++; console.log((ok ? "PASS " : "FAIL ") + name + (ok ? "" : "  " + info)); };
const EDGE = ["C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "C:/Program Files/Microsoft/Edge/Application/msedge.exe", "C:/Program Files/Google/Chrome/Application/chrome.exe"].find(f => fs.existsSync(f));
const dir = at("import-bundles");
const files = fs.readdirSync(dir).sort();
const TAB = { 1: ["bp", "#bpt", "impbp"], 2: ["bank", "#qt", "impq"], 3: ["sm", "#smt", "impsm"], 4: ["sol", "#slt", "impsol"] };

const b = await puppeteer.launch({ executablePath: EDGE, headless: true, args: BLOCK_REAL_API }), p = await b.newPage();
await p.setViewport({ width: 1000, height: 900 });
const idle = () => p.waitForNetworkIdle({ idleTime: 300 });
await p.goto(BASE + "/", { waitUntil: "networkidle0" }); await p.evaluate(() => localStorage.clear());
await p.goto(BASE + "/", { waitUntil: "networkidle0" });
await p.$eval('button[data-a="admin"]', e => e.click()); await p.waitForSelector("#lg");
await p.type('input[name="u"]', cfg.username); await p.type('input[name="p"]', cfg.password); await p.click("#lg button"); await p.waitForSelector(".tabs");
const tab = async k => { await p.$eval(`button[data-a="tab"][data-t="${k}"]`, e => e.click()); await idle(); };
const toastText = () => p.$eval("#msg", e => e.textContent);

const stats = async () => ({
  bank: (await api("bankStats", { token: await tok() })).reduce((n, x) => n + x.n, 0),
  sol: (await api("solutionStats", { token: await tok() })).reduce((n, x) => n + x.n, 0),
  sm: (await api("summaryStats", { token: await tok() })).reduce((n, x) => n + x.sections, 0),
  bp: (await api("blueprintStats", { token: await tok() })).reduce((n, x) => n + x.standards + x.indicators, 0)
});
let _t; const tok = async () => _t || (_t = (await api("login", { username: cfg.username, password: cfg.password })).token);
const rows = (re, dirName) => fs.readdirSync(at("data", dirName || "")).filter(f => re.test(f)).reduce((n, f) => n + fs.readFileSync(at("data", dirName || "", f), "utf8").split("\n").filter(l => /^(P6|M3)\t/.test(l)).length, 0);
const want = {
  bank: rows(/^questions-(P6|M3)-\d{4}\.tsv$/),
  sol: fs.readdirSync(at("data", "solutions")).filter(f => /^(P6|M3)-\d{4}\.txt$/.test(f)).reduce((n, f) => n + (fs.readFileSync(at("data", "solutions", f), "utf8").match(/^@@ /gm) || []).length, 0),
  sm: fs.readdirSync(at("data", "summaries")).filter(f => /^(P6|M3)-\d.*\.txt$/.test(f)).reduce((n, f) => n + (fs.readFileSync(at("data", "summaries", f), "utf8").match(/^@@ /gm) || []).length, 0),
  bp: fs.readFileSync(at("data", "blueprint.tsv"), "utf8").split("\n").filter(l => /^(P6|M3)\t/.test(l)).length
};
let sizeBad = files.filter(f => fs.statSync(path.join(dir, f)).size > 450 * 1024);
t(`ไฟล์ import-bundles ${files.length} ไฟล์ ไม่มีไฟล์ใหญ่เกิน 450 KB`, files.length > 0 && !sizeBad.length, sizeBad.join());

for (const round of [1, 2]) {
  for (const f of files) {
    const [tabKey, ta, btn] = TAB[f[0]];
    await tab(tabKey);
    const text = fs.readFileSync(path.join(dir, f), "utf8");
    await p.$eval(ta, (e, v) => { e.value = v; }, text);
    const t0 = Date.now();
    await p.$eval(`button[data-a="${btn}"]`, e => e.click()); await idle();
    const msg = await toastText();
    t(`รอบ ${round} นำเข้า ${f} (${Math.round(text.length / 1024)} KB, ${Date.now() - t0} ms) → ${msg}`, /นำเข้า/.test(msg) && !/ไม่|ผิด/.test(msg), msg);
  }
  const s = await stats();
  for (const k of Object.keys(want)) t(`รอบ ${round} จำนวน ${k} = ${s[k]} (ต้องเป็น ${want[k]})`, s[k] === want[k]);
}
await b.close();
process.exit(bad ? 1 : 0);
