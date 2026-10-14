// ทดสอบความเป็นส่วนตัวของรายชื่อนักเรียน (รหัสห้องเรียน) กับ API จริงของ Code.gs — ต้องรัน tools/test/server.mjs ก่อน
// node tools/test/privacy.mjs
// สร้างโรงเรียนทดสอบเพิ่มของตัวเอง (โรงเรียนที่ 2) เพื่อไม่กระทบรหัสห้องที่ชุดทดสอบอื่นใช้
import fs from "fs";
import puppeteer from "puppeteer-core";
import { at, BLOCK_REAL_API } from "../lib.mjs";

const cfg = JSON.parse(fs.readFileSync(at("tools", ".cache", "admin.json"), "utf8"));
const BASE = `http://localhost:${cfg.port}`;
const raw = async (action, p = {}) => (await fetch(BASE + "/api", { method: "POST", body: JSON.stringify({ action, ...p }) })).json();
const api = async (action, p = {}) => { const r = await raw(action, p); if (!r.ok) throw new Error(r.error); return r.data; };
let bad = 0;
const t = (name, ok, info = "") => { if (!ok) bad++; console.log((ok ? "PASS " : "FAIL ") + name + (ok ? "" : "  " + info)); };
const denied = async (name, action, p, re = /รหัสห้องเรียนไม่ถูกต้อง|เข้าสู่ระบบใหม่|ไม่ได้|ไม่พบ|ไม่รู้จัก|เฉพาะ/) => {
  const r = await raw(action, p);
  t(name, r.ok === false && re.test(r.error || "") && !JSON.stringify(r).includes("เด็กหญิงทดสอบ"), JSON.stringify(r).slice(0, 120));
};

const token = (await api("login", { username: cfg.username, password: cfg.password })).token;
const P6 = cfg.rooms.P6, M3 = cfg.rooms.M3;
const stuP6 = (await api("listStudents", { code: P6 }))[0];

/* ไม่มีรหัส / รหัสผิด → ไม่ได้รายชื่อ */
await denied("listStudents ไม่ใส่รหัส", "listStudents", {});
await denied("listStudents ใส่ schoolId+level แบบเดิม (ไม่มีรหัส)", "listStudents", { schoolId: cfg.schoolId, level: "P6" });
await denied("listStudents รหัสผิด", "listStudents", { code: "AAAAAA" });
await denied("listStudents รหัสสั้นเกิน", "listStudents", { code: "ABC" });
await denied("joinRoom ไม่ใส่รหัส", "joinRoom", {});
await denied("listSchools ถูกถอดออก (ไม่เปิดรายชื่อโรงเรียน)", "listSchools", {});
await denied("overview ไม่ใส่รหัส", "overview", { level: "P6", studentId: stuP6.id });
await denied("overview รหัสห้อง ม.3 กับนักเรียน ป.6", "overview", { code: M3, studentId: stuP6.id });
await denied("submit ไม่ใส่รหัส", "submit", { studentId: stuP6.id, ids: [], answers: {} });
await denied("submit รหัสผิด", "submit", { code: "ZZZZZZ", studentId: stuP6.id, ids: [], answers: {} });
await denied("submit รหัสห้อง ม.3 กับนักเรียน ป.6", "submit", { code: M3, studentId: stuP6.id, ids: [], answers: {} });
await denied("students (แอดมิน) ไม่มี token", "students", { schoolId: cfg.schoolId, level: "P6" });
await denied("report (แอดมิน) ไม่มี token", "report", { schoolId: cfg.schoolId, level: "P6" });
await denied("roomCodes ไม่มี token", "roomCodes", { schoolId: cfg.schoolId, level: "P6" });
await denied("students token ปลอม", "students", { token: "fake", schoolId: cfg.schoolId, level: "P6" });
await denied("resetRoomCode ไม่มี token", "resetRoomCode", { code: P6 });

/* รหัสถูก → ได้เฉพาะห้องตัวเอง */
const j = await api("joinRoom", { code: " " + P6.toLowerCase().slice(0, 3) + "-" + P6.slice(3) + " " });
t("joinRoom รับรหัสพิมพ์เล็ก/มีช่องว่าง/ขีด และบอกโรงเรียน-ระดับ-ห้อง", j.level === "P6" && j.room === "6/1" && /ทดสอบ/.test(j.school), JSON.stringify(j));
const ls = await api("listStudents", { code: P6 });
t("listStudents รหัสถูก ได้เฉพาะห้องของรหัส", ls.length === 1 && ls[0].name.includes("ป.หก") && !ls.some(s => s.name.includes("ม.สาม")), JSON.stringify(ls));
t("รหัสห้อง ม.3 ได้เฉพาะ ม.3", (await api("listStudents", { code: M3 })).every(s => s.name.includes("ม.สาม")));
const ov = await api("overview", { code: P6, studentId: stuP6.id });
t("overview รหัสถูก + นักเรียนในห้อง ใช้ได้", Array.isArray(ov.standards));
t("รหัสเป็นตัวอักษร 6 ตัว ไม่มี 0 O 1 I L", /^[A-HJKMNP-Z2-9]{6}$/.test(P6) && /^[A-HJKMNP-Z2-9]{6}$/.test(M3) && P6 !== M3, P6 + " " + M3);

/* แยกโรงเรียน: โรงเรียนที่ 2 มีรหัสของตัวเอง แอดมินโรงเรียนอื่นดูไม่ได้ */
const s2 = (await api("saveSchool", { token, name: "โรงเรียนที่สองทดสอบ" })).id;
await api("addStudents", { token, schoolId: s2, level: "P6", text: "6/1,1,เด็กชายโรงเรียนสอง\n6/2,1,เด็กหญิงห้องสอง" });
const rc2 = await api("roomCodes", { token, schoolId: s2, level: "P6" });
t("สร้างรหัสให้ทุกห้องอัตโนมัติ (2 ห้อง) และรหัสไม่ซ้ำ", rc2.length === 2 && rc2[0].code !== rc2[1].code && !rc2.some(r => r.code === P6));
t("รหัสห้องเดิมไม่เปลี่ยนเมื่อเรียกซ้ำ", JSON.stringify(await api("roomCodes", { token, schoolId: s2, level: "P6" })) === JSON.stringify(rc2));
t("โรงเรียนที่ 2 ห้อง 6/1 เห็นเฉพาะห้องนั้น", (await api("listStudents", { code: rc2[0].code })).map(s => s.name).join() === "เด็กชายโรงเรียนสอง");
await api("saveAdmin", { token, username: "t2admin", password: "secret123", name: "ครูสอง", role: "school", schoolId: s2 });
const t2 = (await api("login", { username: "t2admin", password: "secret123" })).token;
const own = await api("students", { token: t2, schoolId: cfg.schoolId, level: "P6" }); // พยายามขอโรงเรียนแรก ต้องได้โรงเรียนของตัวเอง
t("แอดมินโรงเรียนอื่นขอ schoolId ของโรงเรียนแรก ได้แต่ของตัวเอง", own.length === 2 && !own.some(s => s.name.includes("ป.หก")), JSON.stringify(own));
const rcOwn = await api("roomCodes", { token: t2, schoolId: cfg.schoolId, level: "P6" });
t("roomCodes ของแอดมินโรงเรียนอื่น ไม่เห็นรหัสโรงเรียนแรก", !rcOwn.some(r => r.code === P6));
await denied("แอดมินโรงเรียนอื่นรีเซ็ตรหัสของโรงเรียนแรกไม่ได้", "resetRoomCode", { token: t2, code: P6 }, /ไม่มีสิทธิ์/);

/* รีเซ็ตรหัส: รหัสเก่าใช้ไม่ได้ทันที */
const old = rc2[0].code, nw = (await api("resetRoomCode", { token: t2, code: old })).code;
t("รีเซ็ตรหัสแล้วรหัสใหม่ต่างจากเดิม", nw !== old && /^[A-Z2-9]{6}$/.test(nw));
await denied("รหัสเก่าหลังรีเซ็ตใช้ไม่ได้", "listStudents", { code: old });
t("รหัสใหม่ใช้ได้", (await api("listStudents", { code: nw })).length === 1);

/* หน้าเว็บ: หน้าแรกไม่แสดงรายชื่อโรงเรียนหรือนักเรียน ต้องกรอกรหัสก่อน */
const EDGE = ["C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "C:/Program Files/Microsoft/Edge/Application/msedge.exe", "C:/Program Files/Google/Chrome/Application/chrome.exe"].find(f => fs.existsSync(f));
const b = await puppeteer.launch({ executablePath: EDGE, headless: true, args: BLOCK_REAL_API }), p = await b.newPage();
await p.goto(BASE + "/", { waitUntil: "networkidle0" });
await p.evaluate(() => localStorage.clear()); await p.goto(BASE + "/", { waitUntil: "networkidle0" });
let txt = await p.evaluate(() => document.body.innerText);
t("หน้าแรกไม่มีชื่อโรงเรียน/นักเรียน มีช่องกรอกรหัส", !/โรงเรียน(ทดสอบ|ที่สอง)|เด็กหญิงทดสอบ|เด็กชายทดสอบ/.test(txt) && !!(await p.$("#cc")));
await p.type("#cc", "AAAAAA"); await p.click("#cf button"); await p.waitForNetworkIdle({ idleTime: 400 });
txt = await p.evaluate(() => document.body.innerText);
t("กรอกรหัสผิด แจ้งเตือนและยังไม่เห็นรายชื่อ", /รหัสห้องเรียนไม่ถูกต้อง/.test(txt) && !/เด็กหญิงทดสอบ/.test(txt));
await p.$eval("#cc", e => (e.value = "")); await p.type("#cc", P6.toLowerCase()); await p.click("#cf button"); await p.waitForNetworkIdle({ idleTime: 400 });
txt = await p.evaluate(() => document.body.innerText);
t("กรอกรหัสถูก เห็นชื่อโรงเรียน ห้อง และรายชื่อห้องตัวเอง", /โรงเรียนทดสอบ/.test(txt) && /ห้อง 6\/1/.test(txt) && /เด็กหญิงทดสอบ/.test(txt) && !/เด็กชายทดสอบ ม\.สาม/.test(txt));
await p.reload({ waitUntil: "networkidle0" });
txt = await p.evaluate(() => document.body.innerText);
t("เครื่องจำรหัสไว้ รีเฟรชแล้วไม่ต้องกรอกซ้ำ", /เด็กหญิงทดสอบ/.test(txt) && !(await p.$("#cc")));
await p.evaluate(c => { const s = JSON.parse(localStorage.getItem("onet")); s.code = "QQQQQQ"; localStorage.setItem("onet", JSON.stringify(s)); }); // รหัสที่ถูกรีเซ็ต/ปิดแล้ว
await p.reload({ waitUntil: "networkidle0" }); await p.waitForNetworkIdle({ idleTime: 400 });
t("รหัสที่จำไว้ใช้ไม่ได้แล้ว หน้าเว็บกลับไปขอรหัสใหม่", !!(await p.$("#cc")));
await b.close();
process.exit(bad ? 1 : 0);
