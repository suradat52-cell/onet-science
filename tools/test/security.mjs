// รอบ 2 ความปลอดภัย: กันเดารหัสห้อง · วันหมดอายุรหัสห้อง · ล็อกแอดมิน 15 นาทีหลังผิด 5 ครั้ง · diag/traces เฉพาะแอดมินกลาง
// · ย้ายบัญชีแอดมินกลาง (ปิด admin เดิมได้ก็ต่อเมื่อบัญชีใหม่ล็อกอินได้จริงแล้ว) · เปลี่ยนรหัสผ่านตัวเอง · หน้าเว็บ
//   node tools/test/security.mjs   (ต้องรัน tools/test/server.mjs ก่อน · ยิงเฉพาะเซิร์ฟเวอร์จำลอง)
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
const code = cfg.rooms.P6, stu = (await api("enter", { code })).students[0];
const iso = d => new Date(Date.now() + d * 864e5 + 7 * 3600e3).toISOString().slice(0, 10);

/* diag / traces */
t("diag ไม่ล็อกอิน → ปฏิเสธ", (await raw("diag", {})).ok === false);
t("traces ไม่ล็อกอิน → ปฏิเสธ", (await raw("traces", {})).ok === false);
await api("saveAdmin", { token: sup, username: "schooladm", password: "schoolpass1", role: "school", schoolId: cfg.schoolId });
const tkS = (await api("login", { username: "schooladm", password: "schoolpass1" })).token;
t("diag/traces แอดมินโรงเรียน → ปฏิเสธ", (await raw("diag", { token: tkS })).ok === false && (await raw("traces", { token: tkS })).ok === false);
t("diag/traces แอดมินกลาง → ได้", (await raw("diag", { token: sup })).ok && (await raw("traces", { token: sup })).ok);

/* วันหมดอายุของรหัสห้อง */
t("ตั้งวันหมดอายุ: แอดมินโรงเรียนอื่นตั้งไม่ได้", await (async () => { const sB = (await api("saveSchool", { token: sup, name: "โรงเรียน B" })).id; await api("saveAdmin", { token: sup, username: "admb", password: "admbpass1", role: "school", schoolId: sB }); const tk = (await api("login", { username: "admb", password: "admbpass1" })).token; return (await raw("setRoomExpiry", { token: tk, code, expires: iso(1) })).ok === false; })());
t("วันที่ผิดรูปแบบ → ปฏิเสธ", (await raw("setRoomExpiry", { token: tkS, code, expires: "31/12/2026" })).ok === false);
await api("setRoomExpiry", { token: tkS, code, expires: iso(0) });
t("หมดอายุวันนี้ → ยังใช้ได้ถึงสิ้นวัน", (await raw("enter", { code })).ok);
t("รายการรหัสห้องส่งวันหมดอายุกลับมา", (await api("roomCodes", { token: tkS, schoolId: cfg.schoolId, level: "P6" })).some(r => r.code === code && r.expires === iso(0)));
await api("setRoomExpiry", { token: tkS, code, expires: iso(-1) });
const ex = await raw("enter", { code });
t("หมดอายุเมื่อวาน → กรอกรหัสไม่ได้ ข้อความบอกว่าหมดอายุ", !ex.ok && /หมดอายุ/.test(ex.error), ex.error);
t("หมดอายุแล้ว → ส่งคะแนน/ดูผลด้วยรหัสนี้ไม่ได้", (await raw("progress", { code, studentId: stu.id })).ok === false);
await api("setRoomExpiry", { token: tkS, code, expires: "" });
t("ล้างวันหมดอายุ → ใช้ได้อีกครั้ง", (await raw("enter", { code })).ok);

/* ล็อกบัญชีแอดมิน */
let msg = []; for (let i = 0; i < 5; i++) msg.push((await raw("login", { username: "schooladm", password: "wrong" + i })).error);
t("ผิดครั้งที่ 1–4 บอกจำนวนครั้งที่เหลือ", /เหลืออีก 4/.test(msg[0]) && /เหลืออีก 1/.test(msg[3]), msg[0]);
t("ผิดครั้งที่ 5 → ล็อก 15 นาที", /ล็อก/.test(msg[4]), msg[4]);
const lk = await raw("login", { username: "schooladm", password: "schoolpass1" });
t("ระหว่างล็อก แม้รหัสถูกก็เข้าไม่ได้", !lk.ok && /ล็อก/.test(lk.error), lk.error);
t("ล็อกเฉพาะบัญชีนั้น บัญชีอื่นเข้าได้ปกติ", (await raw("login", { username: cfg.username, password: cfg.password })).ok);
await fetch(BASE + "/__uncache?k=ll_schooladm"); // จำลองครบ 15 นาที
t("พ้นเวลาล็อกแล้วเข้าได้ และนับผิดใหม่จาก 0", (await raw("login", { username: "schooladm", password: "schoolpass1" })).ok && /เหลืออีก 4/.test((await raw("login", { username: "schooladm", password: "x" })).error));

/* กันเดารหัสห้อง */
let lockMsg = "";
for (let i = 0; i < 70 && !lockMsg; i++) { const r = await raw("enter", { code: "ZZ" + String(1000 + i) }); if (r.error && /ปิดการกรอกรหัสใหม่/.test(r.error)) lockMsg = r.error; }
t("เดารหัสผิดรัว ๆ → ระบบปิดการกรอกรหัสใหม่ชั่วคราว", !!lockMsg, lockMsg);
const okCode = await raw("enter", { code });
t("ระหว่างปิด: แม้รหัสถูกก็กรอกใหม่ไม่ได้ (เดาต่อไม่ได้)", !okCode.ok && /ปิดการกรอกรหัสใหม่/.test(okCode.error));
t("ระหว่างปิด: นักเรียนที่อยู่ในห้องแล้วยังดูผล/ส่งคะแนนได้", (await raw("progress", { code, studentId: stu.id })).ok && (await raw("submitAttempt", { attemptId: "sec-1", code, studentId: stu.id, mode: "practice", keys: [], answers: {}, rev: {} })).ok);
t("ระหว่างปิด: ใช้ studentId ปลอมเป็นทางลัดเดารหัสไม่ได้", (await raw("progress", { code, studentId: "abcdef1234" })).ok === false);
await fetch(BASE + "/__uncache?k=rc_lock");
t("พ้นเวลาปิดแล้วกรอกรหัสได้ตามปกติ", (await raw("enter", { code })).ok);

/* ย้ายบัญชีแอดมินกลาง */
const admins = () => api("adminData", { token: sup }).then(d => d.admins);
const old = (await admins()).find(a => a.username === cfg.username);
await api("saveAdmin", { token: sup, username: "newboss", password: "newbosspass1", name: "แอดมินกลางใหม่", role: "super" });
const nb = (await admins()).find(a => a.username === "newboss");
t("สร้างแอดมินกลางใหม่ได้ (role = super)", nb.role === "super");
const tkNew0 = await raw("setAdminActive", { token: sup, id: old.id, active: false });
t("บัญชีใหม่ยังไม่เคยล็อกอิน → ปิด admin เดิมไม่ได้ (กันล็อกตัวเองออกจากระบบ)", tkNew0.ok === false, tkNew0.error);
const tkNew = (await api("login", { username: "newboss", password: "newbosspass1" })).token;
t("บัญชีใหม่ล็อกอินได้และเป็นแอดมินกลาง", (await api("adminData", { token: tkNew })).me.role === "super");
t("หลังบัญชีใหม่ล็อกอินได้ → ปิด admin เดิมได้", (await raw("setAdminActive", { token: tkNew, id: old.id, active: false })).ok);
t("admin เดิมถูกปิดแล้วเข้าสู่ระบบไม่ได้ (บัญชียังอยู่ ไม่ถูกลบ)", !(await raw("login", { username: cfg.username, password: cfg.password })).ok && (await api("adminData", { token: tkNew })).admins.some(a => a.id === old.id && a.active === false));
t("ปิดแอดมินกลางคนสุดท้ายที่เหลือไม่ได้", (await raw("setAdminActive", { token: tkNew, id: nb.id, active: false })).ok === false);
await api("setAdminActive", { token: tkNew, id: old.id, active: true });

/* เปลี่ยนรหัสผ่านตัวเอง */
t("รหัสเดิมผิด → เปลี่ยนไม่ได้", (await raw("changePassword", { token: tkNew, oldPassword: "nope", newPassword: "brandnew123" })).ok === false);
t("รหัสใหม่สั้นเกิน → เปลี่ยนไม่ได้", (await raw("changePassword", { token: tkNew, oldPassword: "newbosspass1", newPassword: "short" })).ok === false);
await api("changePassword", { token: tkNew, oldPassword: "newbosspass1", newPassword: "brandnew123" });
t("เปลี่ยนแล้ว: รหัสเดิมใช้ไม่ได้ รหัสใหม่ใช้ได้", !(await raw("login", { username: "newboss", password: "newbosspass1" })).ok && (await raw("login", { username: "newboss", password: "brandnew123" })).ok);

/* หน้าเว็บ */
const browser = await puppeteer.launch({ executablePath: ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"].find(f => fs.existsSync(f)), headless: true, args: BLOCK_REAL_API });
try {
  const page = await browser.newPage(); await page.setViewport({ width: 390, height: 820, isMobile: true }); page.on("dialog", d => d.accept());
  const errs = []; page.on("pageerror", e => errs.push(e.message));
  await page.goto(BASE + "/", { waitUntil: "networkidle0" }); await page.evaluate(() => { localStorage.clear(); S.token = null; admin(); });
  await page.waitForSelector("#lg"); await page.type("#lg [name=u]", "schooladm"); await page.type("#lg [name=p]", "schoolpass1"); await page.$eval("#lg", f => f.requestSubmit());
  await page.waitForSelector("[data-a=rcexp]");
  t("หน้านักเรียน/รหัสห้อง: มีช่องวันหมดอายุและปุ่มบันทึก", !!(await page.$("input[type=date][id^=ex-]")));
  await page.$eval("input[type=date][id^=ex-]", (i, v) => { i.value = v; }, iso(-1)); await page.$eval("[data-a=rcexp]", b => b.click());
  await page.waitForFunction(() => /หมดอายุแล้ว/.test(document.getElementById("app").textContent), { timeout: 15000 });
  t("บันทึกวันที่ผ่านมาแล้ว → หน้าเว็บเตือน 'หมดอายุแล้ว'", true);
  await page.$eval("input[type=date][id^=ex-]", i => { i.value = ""; }); await page.$eval("[data-a=rcexp]", b => b.click());
  await page.waitForFunction(() => !/หมดอายุแล้ว/.test(document.getElementById("app").textContent), { timeout: 15000 });
  await page.$eval("#bnav [data-k=more]", b => b.click()); await page.waitForSelector("#pw");
  await page.evaluate(() => { const f = document.getElementById("pw"); f.oldPassword.value = "schoolpass1"; f.newPassword.value = "schoolpass2"; f.confirm.value = "schoolpass9"; f.requestSubmit(); });
  await page.waitForFunction(() => /ไม่ตรงกัน/.test(document.getElementById("msg").textContent), { timeout: 5000 }).catch(() => {});
  t("เปลี่ยนรหัสผ่าน: ช่องยืนยันไม่ตรง → เตือน", /ไม่ตรงกัน/.test(await page.$eval("#msg", e => e.textContent)));
  await page.evaluate(() => { const f = document.getElementById("pw"); f.oldPassword.value = "schoolpass1"; f.newPassword.value = "schoolpass2"; f.confirm.value = "schoolpass2"; f.requestSubmit(); });
  await page.waitForFunction(() => /เปลี่ยนรหัสผ่านแล้ว/.test(document.getElementById("msg").textContent), { timeout: 15000 }).catch(() => {});
  t("เปลี่ยนรหัสผ่านผ่านหน้าเว็บสำเร็จ และใช้รหัสใหม่ได้", /เปลี่ยนรหัสผ่านแล้ว/.test(await page.$eval("#msg", e => e.textContent)) && (await raw("login", { username: "schooladm", password: "schoolpass2" })).ok);
  t("ไม่มี JS error", !errs.length, errs.join(" | "));
} finally { await browser.close(); }
console.log(bad ? `\nล้มเหลว ${bad} รายการ` : "\nผ่านทั้งหมด");
process.exit(bad ? 1 : 0);
