// คะแนนต้องไม่หายและไม่บันทึกซ้ำ (รีวิวข้อ 1 + 7):
//  1) เขียนแถวลงชีตล้มเหลว → ส่งซ้ำแล้วบันทึกได้จริง 1 แถว (เดิม: ตอบ "ส่งแล้ว" ทั้งที่ไม่มีแถว = คะแนนหาย)
//  2) แคชหมดอายุ/ถูกล้าง (เกิน 6 ชม.) แล้วเครื่องเดิมส่งซ้ำ → ไม่บันทึกแถวที่สอง (ตรวจจากชีต)
//  3) คำขอซ้ำระหว่างกำลังเขียน → ถูกปฏิเสธชั่วคราว ไม่เขียนซ้ำ · 4) หน้าเว็บจริง: ส่งไม่สำเร็จแล้วระบบส่งซ้ำเองจนบันทึกได้
//   node tools/test/save.mjs   (ต้องรัน tools/test/server.mjs ก่อน)
import fs from "fs";
import path from "path";
import puppeteer from "puppeteer-core";
import { TOOLS, BLOCK_REAL_API } from "../lib.mjs";

const cfg = JSON.parse(fs.readFileSync(path.join(TOOLS, ".cache", "admin.json"), "utf8")), BASE = `http://localhost:${cfg.port}`;
const raw = async (action, p = {}) => (await fetch(BASE + "/api", { method: "POST", body: JSON.stringify({ action, ...p }) })).json();
const api = async (action, p = {}) => { const r = await raw(action, p); if (!r.ok) throw new Error(action + ": " + r.error); return r.data; };
const hook = u => fetch(BASE + u).then(r => r.text());
let bad = 0;
const t = (name, ok, info = "") => { if (!ok) bad++; console.log((ok ? "PASS " : "FAIL ") + name + (ok || !info ? "" : "  " + String(info).slice(0, 200))); };
const code = cfg.rooms.P6, stu = (await api("enter", { code })).students[0];
const token = (await api("login", { username: cfg.username, password: cfg.password })).token;
const meta = JSON.parse(fs.readFileSync(path.join(TOOLS, "..", "content", "P6", "meta.json"), "utf8")), keys = meta.mock.slice(0, 4);
const rows = async () => (await api("analytics", { token, schoolId: cfg.schoolId, level: "P6" })).students.find(s => s.id === stu.id).n;
const att = (id, tries) => ({ attemptId: id, code, studentId: stu.id, mode: "practice", standard: "ว 2.1", keys, answers: {}, rev: {}, ...(tries ? { tries } : {}) });

/* 1) เขียนแถวล้มเหลว */
let n0 = await rows();
await hook("/__appendfail?on=1");
const r1 = await raw("submitAttempt", att("save-1"));
await hook("/__appendfail?on=0");
t("เขียนแถวล้มเหลว → ตอบกลับเป็นข้อผิดพลาด (ไม่หลอกว่าบันทึกแล้ว)", r1.ok === false, JSON.stringify(r1));
t("เขียนแถวล้มเหลว → ไม่มีแถวเกิดขึ้น", (await rows()) === n0);
const r1b = await raw("submitAttempt", att("save-1", 1));
t("ส่งซ้ำหลังล้มเหลว → บันทึกได้จริง (ไม่ใช่ตอบว่าซ้ำ)", r1b.ok && !r1b.data.dup, JSON.stringify(r1b));
t("หลังส่งซ้ำ มีแถวเพิ่ม 1 แถวพอดี", (await rows()) === n0 + 1);
const r1c = await raw("submitAttempt", att("save-1", 2));
t("ส่งซ้ำอีกครั้ง → ตอบว่าซ้ำ ไม่เพิ่มแถว", r1c.ok && r1c.data.dup === true && (await rows()) === n0 + 1);

/* 2) แคชหมดอายุแล้วส่งซ้ำ */
n0 = await rows();
const r2 = await api("submitAttempt", att("save-2"));
await hook("/__clearcache");
const r2b = await raw("submitAttempt", att("save-2", 3));
t("แคชหมดอายุแล้วเครื่องเดิมส่งซ้ำ → ตอบว่าซ้ำ (ตรวจจากชีต)", r2b.ok && r2b.data.dup === true, JSON.stringify(r2b));
t("แคชหมดอายุแล้วส่งซ้ำ → คะแนนที่ตอบกลับเท่าครั้งแรก", r2b.ok && r2b.data.score === r2.score && r2b.data.correct === r2.correct);
t("แคชหมดอายุแล้วส่งซ้ำ → แถวไม่เพิ่ม (มีแค่ 1 แถว)", (await rows()) === n0 + 1);

/* 3) คำขอซ้ำระหว่างกำลังเขียน: จำลองโดยวางเครื่องหมาย "กำลังเขียน" ผ่านการเขียนที่ล้มกลางทางไม่ได้ → ใช้ submit คู่ขนาน */
n0 = await rows();
const [a, b] = await Promise.all([raw("submitAttempt", att("save-3")), raw("submitAttempt", att("save-3"))]);
t("ส่งชุดเดียวกันพร้อมกัน 2 คำขอ → บันทึก 1 แถว", (await rows()) === n0 + 1, JSON.stringify([a, b]).slice(0, 200));

/* 4) หน้าเว็บจริง: ส่งไม่สำเร็จ → คิวส่งซ้ำอัตโนมัติจนบันทึกได้ */
const browser = await puppeteer.launch({ executablePath: ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"].find(f => fs.existsSync(f)), headless: true, args: BLOCK_REAL_API });
try {
  const page = await browser.newPage(); page.on("dialog", d => d.accept());
  await page.goto(BASE + "/", { waitUntil: "networkidle0" }); await page.evaluate(() => localStorage.clear()); await page.goto(BASE + "/", { waitUntil: "networkidle0" });
  await page.type("#cc", code); await page.$eval("#cf", f => f.requestSubmit()); await page.waitForSelector(".pickgrid button"); await page.$eval(".pickgrid button", x => x.click());
  await page.waitForFunction(() => typeof S !== "undefined" && S.student, { timeout: 15000 });
  n0 = await rows();
  await hook("/__appendfail?on=1");
  await page.evaluate(() => ACT.prac({ std: "ว 2.1", ind: "" })); await page.waitForSelector("#qcard");
  for (let i = 0; i < 40; i++) { const last = await page.$("[data-a=submit]"); if (last) { await last.evaluate(x => x.click()); break; } await page.$eval("[data-a=qnext]", x => x.click()); }
  await page.waitForSelector(".resultbox");
  await page.waitForFunction(() => /ยังบันทึกคะแนนไม่สำเร็จ/.test(document.getElementById("savestat")?.textContent || ""), { timeout: 20000 }).catch(() => {});
  t("หน้าเว็บ: เขียนชีตล้มเหลว → แจ้ง \"ยังบันทึกคะแนนไม่สำเร็จ ระบบจะลองใหม่อัตโนมัติ\" และคะแนนยังอยู่ในคิว", await page.evaluate(() => pend().length === 1));
  await hook("/__appendfail?on=0");
  await page.evaluate(() => flushQ());
  await page.waitForFunction(() => pend().length === 0, { timeout: 30000 }).catch(() => {});
  t("หน้าเว็บ: ระบบกลับมา → ส่งซ้ำเองแล้วบันทึกได้ คิวว่าง", await page.evaluate(() => pend().length === 0));
  t("หน้าเว็บ: มีแถวเพิ่ม 1 แถวพอดี (ไม่หาย ไม่ซ้ำ)", (await rows()) === n0 + 1);
} finally { await hook("/__appendfail?on=0"); await browser.close(); }

console.log(bad ? `\nล้มเหลว ${bad} รายการ` : "\nผ่านทั้งหมด");
process.exit(bad ? 1 : 0);
