// ครูโรงเรียนอื่นขอใช้งานเอง: สมัคร → รออนุมัติ (ล็อกอินไม่ได้) → แอดมินกลางอนุมัติ/ปฏิเสธ (เลือกหรือสร้างโรงเรียน) → ล็อกอินได้
// · ปิด/เปิดบัญชีครูรายคน (token เดิมใช้ไม่ได้ทันที ข้อมูลไม่หาย) · จำกัดคำขอต่อชั่วโมง · ช่องกับดักบอท · หน้าเว็บ
//   node tools/test/signup.mjs   (ต้องรัน tools/test/server.mjs ก่อน · ยิงเฉพาะเซิร์ฟเวอร์จำลอง)
import fs from "fs";
import path from "path";
import puppeteer from "puppeteer-core";
import { TOOLS, BLOCK_REAL_API } from "../lib.mjs";

const cfg = JSON.parse(fs.readFileSync(path.join(TOOLS, ".cache", "admin.json"), "utf8")), BASE = `http://localhost:${cfg.port}`;
const raw = async (action, p = {}) => (await fetch(BASE + "/api", { method: "POST", body: JSON.stringify({ action, ...p }) })).json();
const api = async (action, p = {}) => { const r = await raw(action, p); if (!r.ok) throw new Error(action + ": " + r.error); return r.data; };
let bad = 0;
const t = (name, ok, info = "") => { if (!ok) bad++; console.log((ok ? "PASS " : "FAIL ") + name + (ok || !info ? "" : "  " + String(info).slice(0, 200))); };
const sup = (await api("login", { username: cfg.username, password: cfg.password })).token;
const form = (n, extra = {}) => ({ name: "ครู " + n, school: "โรงเรียนใหม่ " + n, email: `t${n}@school.ac.th`, reason: "ใช้ติว O-NET ห้อง ม.3/1", username: "teacher" + n, password: "secret-" + n + "x", ...extra });

/* สมัคร + รออนุมัติ */
t("สมัครได้", (await raw("requestAccess", form(1))).ok);
const l1 = await raw("login", { username: "teacher1", password: "secret-1x" });
t("รออนุมัติ: ล็อกอินไม่ได้ และบอกว่ารออนุมัติ", !l1.ok && /รอผู้ดูแลระบบอนุมัติ/.test(l1.error), l1.error);
t("รออนุมัติ: รหัสผ่านผิดได้ข้อความทั่วไป (ไม่บอกสถานะ)", /ไม่ถูกต้อง/.test((await raw("login", { username: "teacher1", password: "wrong-pass" })).error));
t("ชื่อผู้ใช้ซ้ำกับคำขอที่รออยู่ → ปฏิเสธ", (await raw("requestAccess", form(2, { username: "teacher1" }))).ok === false);
t("ชื่อผู้ใช้ซ้ำกับแอดมินเดิม → ปฏิเสธ", (await raw("requestAccess", form(3, { username: cfg.username }))).ok === false);
t("ข้อมูลไม่ครบ/อีเมลผิด/รหัสผ่านสั้น → ปฏิเสธ", (await raw("requestAccess", form(4, { reason: "" }))).ok === false && (await raw("requestAccess", form(5, { email: "abc" }))).ok === false && (await raw("requestAccess", form(6, { password: "123" }))).ok === false);
t("คนทั่วไป/แอดมินโรงเรียนดูรายการคำขอไม่ได้", (await raw("requests", {})).ok === false);
let rq = await api("requests", { token: sup });
t("แอดมินกลางเห็นคำขอรออนุมัติ (ไม่มีแฮชรหัสผ่านในข้อมูลที่ส่งออก)", rq.some(r => r.username === "teacher1") && !JSON.stringify(rq).includes("hash") && !JSON.stringify(rq).includes("salt"));
t("หน้าแอดมินบอกจำนวนรออนุมัติ", (await api("adminData", { token: sup })).pending >= 1);

/* อนุมัติ: สร้างโรงเรียนใหม่ */
const r1 = rq.find(r => r.username === "teacher1");
const ok1 = await api("decideRequest", { token: sup, id: r1.id, decision: "approve" });
t("อนุมัติ (สร้างโรงเรียนใหม่) → ได้บัญชีแอดมินโรงเรียน", ok1.status === "approved" && ok1.schoolId);
const tk1 = (await api("login", { username: "teacher1", password: "secret-1x" })).token, d1 = await api("adminData", { token: tk1 });
t("อนุมัติแล้วล็อกอินด้วยรหัสที่ตั้งไว้ได้ เป็นแอดมินโรงเรียนของโรงเรียนใหม่เท่านั้น", d1.me.role === "school" && d1.me.schoolId === ok1.schoolId && d1.schools.length === 1 && d1.schools[0].name === "โรงเรียนใหม่ 1");
t("ตัดสินคำขอเดิมซ้ำไม่ได้", (await raw("decideRequest", { token: sup, id: r1.id, decision: "reject" })).ok === false);

/* อนุมัติ: ผูกกับโรงเรียนเดิม · ปฏิเสธ */
await api("requestAccess", form(7)); await api("requestAccess", form(8));
rq = await api("requests", { token: sup });
await api("decideRequest", { token: sup, id: rq.find(r => r.username === "teacher7").id, decision: "approve", schoolId: cfg.schoolId });
const d7 = await api("adminData", { token: (await api("login", { username: "teacher7", password: "secret-7x" })).token });
t("อนุมัติแบบเลือกโรงเรียนเดิม → เป็นแอดมินของโรงเรียนนั้น", d7.me.schoolId === cfg.schoolId);
await api("decideRequest", { token: sup, id: rq.find(r => r.username === "teacher8").id, decision: "reject" });
const l8 = await raw("login", { username: "teacher8", password: "secret-8x" });
t("ปฏิเสธแล้ว → ล็อกอินไม่ได้ และบอกว่าไม่ได้รับอนุมัติ", !l8.ok && /ไม่ได้รับอนุมัติ/.test(l8.error), l8.error);
t("แอดมินโรงเรียนอนุมัติคำขอไม่ได้", (await raw("decideRequest", { token: tk1, id: r1.id, decision: "approve" })).ok === false);

/* ปิด/เปิดใช้งานรายคน */
const adm1 = (await api("adminData", { token: sup })).admins.find(a => a.username === "teacher1");
await api("setAdminActive", { token: sup, id: adm1.id, active: false });
t("ปิดใช้งานแล้ว token ที่ล็อกอินค้างอยู่ใช้ต่อไม่ได้ทันที", (await raw("adminData", { token: tk1 })).ok === false);
const loff = await raw("login", { username: "teacher1", password: "secret-1x" });
t("ปิดใช้งานแล้วล็อกอินใหม่ไม่ได้ และบอกว่าถูกปิดใช้งาน", !loff.ok && /ปิดใช้งาน/.test(loff.error), loff.error);
t("ปิดใช้งานแล้วบัญชียังอยู่ในรายการ (ไม่ถูกลบ) พร้อมสถานะ", (await api("adminData", { token: sup })).admins.some(a => a.id === adm1.id && a.active === false));
t("แอดมินโรงเรียนปิดบัญชีคนอื่นด้วยคำสั่งนี้ไม่ได้", (await raw("setAdminActive", { token: (await api("login", { username: "teacher7", password: "secret-7x" })).token, id: adm1.id, active: true })).ok === false);
await api("setAdminActive", { token: sup, id: adm1.id, active: true });
t("เปิดใช้งานกลับ → ล็อกอินได้เหมือนเดิม", (await raw("login", { username: "teacher1", password: "secret-1x" })).ok);

/* กันสมัครรัว */
t("ช่องกับดักบอท (website) มีค่า → ตอบว่าสำเร็จแต่ไม่บันทึก", (await raw("requestAccess", form(9, { website: "http://spam" }))).ok && !(await api("requests", { token: sup })).some(r => r.username === "teacher9"));
const same = []; for (let i = 0; i < 4; i++) same.push((await raw("requestAccess", form(20 + i, { email: "same@school.ac.th" }))).ok);
t("อีเมลเดียวกันส่งได้ไม่เกิน 3 ครั้ง/ชั่วโมง (และมีคำขอรออยู่แล้วก็ไม่รับซ้ำ)", same.filter(Boolean).length === 1 && same[3] === false, JSON.stringify(same));
let okN = 0, lastErr = ""; for (let i = 0; i < 25; i++) { const r = await raw("requestAccess", form(100 + i)); if (r.ok) okN++; else lastErr = r.error; }
t("ทั้งระบบรับคำขอใหม่ไม่เกิน 20 ต่อชั่วโมง", okN <= 20 && /จำนวนมาก/.test(lastErr), okN + " · " + lastErr);

/* หน้าเว็บ */
const browser = await puppeteer.launch({ executablePath: ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"].find(f => fs.existsSync(f)), headless: true, args: BLOCK_REAL_API });
try {
  const page = await browser.newPage(); await page.setViewport({ width: 360, height: 780, isMobile: true }); page.on("dialog", d => d.accept());
  const errs = []; page.on("pageerror", e => errs.push(e.message));
  await page.goto(BASE + "/", { waitUntil: "networkidle0" }); await page.evaluate(() => { localStorage.clear(); S.token = null; admin(); });
  await page.waitForSelector("[data-a=signup]"); await page.$eval("[data-a=signup]", b => b.click()); await page.waitForSelector("#su");
  t("หน้าเข้าสู่ระบบมีปุ่ม 'ขอใช้งาน' → เปิดฟอร์มสมัคร", true);
  t("ฟอร์มสมัครมีช่อง ชื่อ โรงเรียน อีเมล เหตุผล ชื่อผู้ใช้ รหัสผ่าน", await page.evaluate(() => ["name", "school", "email", "reason", "username", "password"].every(n => document.querySelector('#su [name="' + n + '"]'))));
  t("ช่องกับดักบอทถูกซ่อนจากผู้ใช้และโปรแกรมอ่านหน้าจอ", await page.evaluate(() => { const h = document.querySelector(".hp"); return h.getAttribute("aria-hidden") === "true" && h.getBoundingClientRect().left < -1000; }));
  // ชั่วโมงนี้โควตาเต็มจากการทดสอบด้านบน → หน้าเว็บต้องแสดงข้อความปฏิเสธอย่างสุภาพ
  await page.evaluate(() => { const f = document.getElementById("su"); f.name.value = "ครูหน้าเว็บ"; f.school.value = "โรงเรียนหน้าเว็บ"; f.email.value = "web@school.ac.th"; f.reason.value = "ทดสอบ"; f.username.value = "webteacher"; f.password.value = "webpass123"; f.requestSubmit(); });
  await page.waitForFunction(() => /จำนวนมาก|ส่งคำขอแล้ว/.test(document.body.textContent), { timeout: 15000 });
  t("หน้าเว็บ: ส่งฟอร์มแล้วแสดงผลลัพธ์ (โควตาเต็ม → แจ้งให้ลองใหม่ภายหลัง)", await page.evaluate(() => /จำนวนมาก/.test(document.getElementById("msg").textContent)));
  await page.evaluate(() => { S.token = null; save(); admin(); }); await page.waitForSelector("#lg");
  await page.type("#lg [name=u]", cfg.username); await page.type("#lg [name=p]", cfg.password); await page.$eval("#lg", f => f.requestSubmit());
  await page.waitForSelector("#bnav [data-k=admins]"); await page.$eval("#bnav [data-k=admins]", b => b.click());
  await page.waitForFunction(() => /คำขอใช้งานรออนุมัติ/.test(document.getElementById("app").textContent), { timeout: 15000 });
  const n0 = await page.$$eval("[data-a=rqok]", b => b.length);
  t("หน้าแอดมินกลาง: เห็นรายการรออนุมัติพร้อมปุ่ม อนุมัติ/ปฏิเสธ และตัวเลือกโรงเรียน", n0 > 0 && (await page.$$("[data-a=rqno]")).length === n0 && (await page.$$(".rq select")).length === n0);
  await page.$eval("[data-a=rqok]", b => b.click()); await page.waitForFunction(n => document.querySelectorAll("[data-a=rqok]").length === n - 1, { timeout: 15000 }, n0);
  t("หน้าแอดมินกลาง: กดอนุมัติแล้วรายการลดลง 1", true);
  t("หน้าแอดมินกลาง: ตารางแอดมินมีปุ่มปิด/เปิดใช้งาน", (await page.$$("[data-a=adact]")).length >= 2);
  t("ไม่มี JS error", !errs.length, errs.join(" | "));
} finally { await browser.close(); }
console.log(bad ? `\nล้มเหลว ${bad} รายการ` : "\nผ่านทั้งหมด");
process.exit(bad ? 1 : 0);
