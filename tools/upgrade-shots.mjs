// ภาพหน้าจอมือถือ (360 px) ของทุกหน้าหลัก ก่อน/หลังการยกระดับ สำหรับ review/UPGRADE.pdf
//   node tools/upgrade-shots.mjs <before|after>      (ต้องรัน tools/test/server.mjs ของฝั่งนั้นไว้ก่อน)
//   ก่อน = โฟลเดอร์ %LOCALAPPDATA%/Temp/onet-before (git worktree ที่ commit 26cbb8b) รันพอร์ต 8766 · หลัง = โฟลเดอร์งานนี้ (พอร์ตจาก tools/.cache/admin.json)
//   ผล: review/upgrade/<ชุด>/NN-ชื่อ.png + shots.json (รายการ)
import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import { ROOT, TOOLS, BLOCK_REAL_API } from "./lib.mjs";

const set = process.argv[2] || "after", AFTER = set === "after";
const cfgFile = AFTER ? path.join(TOOLS, ".cache", "admin.json") : path.join(process.env.LOCALAPPDATA, "Temp", "onet-before", "tools", ".cache", "admin.json");
const cfg = JSON.parse(fs.readFileSync(cfgFile, "utf8")), BASE = `http://localhost:${cfg.port}`;
const OUT = path.join(ROOT, "review", "upgrade", set); fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
const raw = async (action, p = {}) => (await fetch(BASE + "/api", { method: "POST", body: JSON.stringify({ action, ...p }) })).json();
const api = async (a, p) => { const r = await raw(a, p); if (!r.ok) throw new Error(a + ": " + r.error); return r.data; };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const shots = [];
const b = await puppeteer.launch({ executablePath: ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"].find(f => fs.existsSync(f)), headless: true, args: BLOCK_REAL_API });
const p = await b.newPage(); p.on("pageerror", e => console.log("JS error:", e.message)); p.on("dialog", d => d.accept());
await p.setViewport({ width: 360, height: 780, deviceScaleFactor: 1.5, isMobile: true, hasTouch: true });
let n = 0;
const snap = async (key, label, opt = {}) => { await sleep(opt.wait || 500); const f = `${String(++n).padStart(2, "0")}-${key}.png`; await p.evaluate(() => window.scrollTo(0, 0)); await p.screenshot({ path: path.join(OUT, f) }); shots.push({ file: f, key, label }); };
const waitText = (re, ms = 20000) => p.waitForFunction(r => new RegExp(r).test(document.getElementById("app").textContent), { timeout: ms }, re.source);
const go = async fn => { await p.evaluate(fn); await p.waitForNetworkIdle({ idleTime: 350 }).catch(() => {}); };

/* ข้อมูลตัวอย่าง (เฉพาะเซิร์ฟเวอร์จำลอง) ให้หน้าที่เกี่ยวกับสถิติไม่ว่างเปล่า */
const token = (await api("login", { username: cfg.username, password: cfg.password })).token;
const code = cfg.rooms.P6, stu = (await api("enter", { code })).students[0];
const meta = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "P6", "meta.json"), "utf8")), stdKey = Object.keys(meta.pool).find(k => !k.includes("|") && meta.pool[k].length >= 6), keys = meta.pool[stdKey].slice(0, 6);
const sub = (mode, ks, ans) => api("submitAttempt", { attemptId: "us" + Math.random().toString(36).slice(2, 10), code, studentId: stu.id, mode, standard: "ฝึก", keys: ks, answers: Object.fromEntries(ks.map(k => [k, ans])), rev: {} });
if (AFTER) {
  const pre = (await api("saveAssignment", { token, schoolId: cfg.schoolId, level: "P6", room: "", title: "ก่อนเรียน: แรงและการเคลื่อนที่", kind: "pre", std: stdKey, keys: keys.slice(0, 4) })).id;
  const post = (await api("saveAssignment", { token, schoolId: cfg.schoolId, level: "P6", room: "", title: "หลังเรียน: แรงและการเคลื่อนที่", kind: "post", std: stdKey, keys: keys.slice(0, 4), pair: pre })).id;
  await api("saveAssignment", { token, schoolId: cfg.schoolId, level: "P6", room: "", title: "ฝึก 6 ข้อ สัปดาห์นี้", kind: "practice", std: stdKey, keys, due: "2099-12-31", note: "ทำให้เสร็จก่อนสอบย่อย" });
  await sub("asg:" + pre, keys.slice(0, 4), "9");
  await sub("asg:" + post, keys.slice(0, 4), "1");
}
for (const k of meta.pool[stdKey].slice(0, 12)) await sub("practice", [k], "4");

/* นักเรียน */
await p.goto(BASE + "/", { waitUntil: "networkidle0" }); await p.evaluate(() => localStorage.clear()); await p.goto(BASE + "/", { waitUntil: "networkidle0" });
await snap("code", "เข้าห้องเรียน (กรอกรหัส)");
await p.type("#cc", code); await p.$eval("#cf", f => f.requestSubmit()); await p.waitForSelector(".pickgrid button"); await snap("pick", "เลือกชื่อนักเรียน");
await p.$eval(".pickgrid button", x => x.click()); await waitText(/ความคืบหน้า|ภารกิจ/); await p.waitForNetworkIdle({ idleTime: 400 }).catch(() => {});
await snap("dash", "หน้าแรก", { wait: 1200 });
await go(() => ACT.nav({ kind: "s", k: "exams" })); await snap("exams", "แท็บข้อสอบ");
await go(() => ACT.nav({ kind: "s", k: "learn" })); await snap("learn", "แท็บสรุป (รายการมาตรฐาน)", { wait: 900 });
await go(() => ACT.study({ std: "ว 2.1", ind: "" })); await p.waitForSelector(".rich"); await snap("study", "สรุปเนื้อหา ว 2.1 (ส่วนบนของหน้า)", { wait: 800 });
await go(() => ACT.prac({ std: "ว 2.1", ind: "" })); await p.waitForSelector("#qcard"); await snap("quiz", "ทำข้อสอบทีละข้อ");
for (let i = 0; i < 40; i++) { await p.evaluate(() => { const r = document.querySelector('#qcard input[type=radio][value="4"]'); if (r) { r.checked = true; r.dispatchEvent(new Event("change", { bubbles: true })); } }); const last = await p.$("[data-a=submit]"); if (last) { await last.evaluate(x => x.click()); break; } await p.$eval("[data-a=qnext]", x => x.click()); await sleep(30); }
await p.waitForSelector(".resultbox"); await p.waitForFunction(() => /บันทึกคะแนนแล้ว/.test(document.getElementById("savestat")?.textContent || ""), { timeout: 20000 }).catch(() => {}); await snap("result", "ผลลัพธ์และเฉลย");
await go(() => ACT.nav({ kind: "s", k: "home" })); await waitText(/ความคืบหน้า|ภารกิจ/); await p.waitForNetworkIdle({ idleTime: 500 }).catch(() => {}); await snap("dash2", "หน้าแรกหลังทำข้อสอบ", { wait: 1200 });
await go(() => ACT.nav({ kind: "s", k: "mine" })); await snap("mine", "แท็บผลของฉัน", { wait: 900 });
if (AFTER) {
  await go(() => ACT.review()); await waitText(/สมุดข้อผิด/); await snap("review", "แท็บทบทวน (สมุดข้อผิด บัตรคำ ฝึกเลือกเอง)", { wait: 900 });
  await go(() => ACT.cards()); await p.waitForSelector(".fcard"); await snap("cards", "บัตรคำ (ด้านคำถาม)");
  await go(() => ACT.search()); await p.waitForSelector("#sq"); await p.type("#sq", "แรง"); await snap("search", "ค้นหาสรุปและโจทย์", { wait: 800 });
  await go(() => ACT.nav({ kind: "s", k: "exams" })); await waitText(/แบบจับเวลา/); await p.$eval("[data-a=mockt]", x => x.click()); await p.waitForSelector("#tmr"); await snap("timed", "ข้อสอบจำลองแบบจับเวลา");
  await p.evaluate(() => { clearExam(); Q = null; }); await go(() => ACT.nav({ kind: "s", k: "mine" })); await p.waitForSelector("#settings"); await p.evaluate(() => document.getElementById("settings").scrollIntoView()); await sleep(400);
  const f = `${String(++n).padStart(2, "0")}-settings.png`; await p.screenshot({ path: path.join(OUT, f) }); shots.push({ file: f, key: "settings", label: "ตั้งค่า (ตัวอักษร โหมดสี ออฟไลน์ ติดตั้ง)" });
  await p.evaluate(() => { const s = { fz: 1.15, light: true }; store.set("set", s); applySet(); }); await go(() => ACT.dash()); await waitText(/ภารกิจวันนี้/); await p.waitForNetworkIdle({ idleTime: 500 }).catch(() => {}); await snap("dash-light", "หน้าแรก โหมดกลางวัน ตัวอักษรใหญ่", { wait: 1200 });
  await p.evaluate(() => { store.del("set"); applySet(); });
}
/* ครู */
await p.evaluate(() => { S.token = null; S.student = null; save(); admin(); }); await p.waitForSelector("#lg"); await snap("t-login", "ครู: เข้าสู่ระบบ");
await p.type("#lg [name=u]", cfg.username); await p.type("#lg [name=p]", cfg.password); await p.$eval("#lg", f => f.requestSubmit()); await p.waitForSelector("#bnav [data-k=students]"); await sleep(700);
await snap("t-students", "ครู: นักเรียนและรหัสห้อง", { wait: 900 });
await p.$eval("#bnav [data-k=report]", x => x.click()); await waitText(/ผลรวม|ภาพรวม/); await p.waitForNetworkIdle({ idleTime: 400 }).catch(() => {}); await snap("t-report", "ครู: รายงาน", { wait: 900 });
if (AFTER) {
  for (const [s, re, key, label] of [["item", /วิเคราะห์ข้อสอบ/, "t-item", "ครู: วิเคราะห์ข้อสอบ (ความยาก ตัวลวง)"], ["asg", /มอบงานใหม่/, "t-asg", "ครู: มอบหมายงาน"], ["cmp", /ก่อนเรียน/, "t-cmp", "ครู: เทียบก่อน/หลังเรียน"], ["exp", /ส่งออกรายงาน/, "t-exp", "ครู: ส่งออก CSV/PDF"]]) { await p.$eval(`[data-a=rsub][data-s=${s}]`, x => x.click()); await waitText(re); await snap(key, label, { wait: 800 }); }
}
await p.$eval("#bnav [data-k=admins]", x => x.click()); await waitText(/เพิ่มแอดมิน/); await snap("t-admins", "ครู: แอดมิน");
await p.$eval("#bnav [data-k=more]", x => x.click()); await waitText(/โรงเรียน/); await snap("t-more", "ครู: อื่น ๆ (โรงเรียน)");
if (AFTER) { await p.$eval("[data-a=moresub][data-s=system]", x => x.click()); await waitText(/สถานะระบบ/); await snap("t-system", "ครู: สถานะระบบ"); }
fs.writeFileSync(path.join(OUT, "shots.json"), JSON.stringify(shots, null, 1));
await b.close(); console.log(`${set}: ${shots.length} ภาพ → ${OUT}`);
