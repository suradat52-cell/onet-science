// แยกผลสอบของโรงเรียนทดสอบ (Schools.isTest = TRUE) ไปแท็บ Attempts_test:
//  ตั้ง isTest (เฉพาะแอดมินกลาง) · ผลเดิมย้ายครบ ไม่หาย ไม่ซ้ำ · ผลใหม่เขียนลงแท็บทดสอบ · ความคืบหน้า/รายงาน/กันส่งซ้ำ อ่านจากแท็บทดสอบ
//  · โรงเรียนจริงไม่ถูกแตะ · ตัดสินจาก isTest ไม่ใช่ชื่อโรงเรียน
//   node tools/test/testschool.mjs   (ต้องรัน tools/test/server.mjs ก่อน)
import fs from "fs";
import path from "path";
import { ROOT, TOOLS } from "../lib.mjs";

const cfg = JSON.parse(fs.readFileSync(path.join(TOOLS, ".cache", "admin.json"), "utf8")), BASE = `http://localhost:${cfg.port}`;
const raw = async (action, p = {}) => (await fetch(BASE + "/api", { method: "POST", body: JSON.stringify({ action, ...p }) })).json();
const api = async (action, p = {}) => { const r = await raw(action, p); if (!r.ok) throw new Error(action + ": " + r.error); return r.data; };
const sheet = n => fetch(BASE + "/__sheet?n=" + n).then(r => r.json());
let bad = 0;
const t = (name, ok, info = "") => { if (!ok) bad++; console.log((ok ? "PASS " : "FAIL ") + name + (ok || !info ? "" : "  " + String(info).slice(0, 200))); };
const sup = (await api("login", { username: cfg.username, password: cfg.password })).token;
const keys = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "P6", "meta.json"), "utf8")).mock.slice(0, 3);

// โรงเรียนจริง R (ชื่อมีคำว่า "ทดสอบ" แต่ไม่ได้ตั้ง isTest → ต้องถือเป็นของจริง) และโรงเรียนทดสอบ T
const codeT = cfg.rooms.P6, stuT = (await api("enter", { code: codeT })).students[0];
const R = (await api("saveSchool", { token: sup, name: "โรงเรียนจริง (ชื่อมีคำว่าทดสอบ)" })).id;
await api("addStudents", { token: sup, schoolId: R, level: "P6", text: "6/1,1,นักเรียนจริง" });
const codeR = (await api("roomCodes", { token: sup, schoolId: R, level: "P6" }))[0].code, stuR = (await api("enter", { code: codeR })).students[0];
const sub = (code, st, id) => api("submitAttempt", { attemptId: id, code, studentId: st.id, mode: "practice", standard: "ว 2.1", keys, answers: {}, rev: {} });

await sub(codeT, stuT, "ts-old-1"); await sub(codeT, stuT, "ts-old-2"); await sub(codeR, stuR, "ts-real-1");
let A = await sheet("Attempts"), AT = await sheet("Attempts_test");
const oldT = A.filter(r => r.schoolId === cfg.schoolId).map(r => r.id).sort();
t("ก่อนตั้งค่า: ผลทั้งสองโรงเรียนอยู่ในแท็บ Attempts · ยังไม่มีแท็บทดสอบ", oldT.length >= 2 && A.some(r => r.id === "ts-real-1") && (AT === null || AT.length === 0));
const before = await api("progress", { code: codeT, studentId: stuT.id });

t("แอดมินโรงเรียนตั้ง isTest ไม่ได้", await (async () => { await api("saveAdmin", { token: sup, username: "admT", password: "admT1234", role: "school", schoolId: cfg.schoolId }); const tk = (await api("login", { username: "admT", password: "admT1234" })).token; return (await raw("setSchoolTest", { token: tk, id: cfg.schoolId, isTest: true })).ok === false; })());
t("ยังไม่ตั้ง isTest → ย้ายไม่ได้ (ไม่มีโรงเรียนทดสอบ)", (await raw("moveTestAttempts", { token: sup, confirm: "ย้าย" })).ok === false);
t("ย้ายโดยไม่ยืนยัน → ปฏิเสธ", (await raw("moveTestAttempts", { token: sup })).ok === false);
await api("setSchoolTest", { token: sup, id: cfg.schoolId, isTest: true });
const ad = await api("adminData", { token: sup });
t("ตั้ง isTest = TRUE ในแท็บ Schools และหน้าแอดมินเห็นสถานะ", (await sheet("Schools")).find(s => s.id === cfg.schoolId).isTest === "TRUE" && ad.allSchools.find(s => s.id === cfg.schoolId).isTest === true && ad.allSchools.find(s => s.id === R).isTest === false);

/* ย้ายผลเดิม */
const mv = await api("moveTestAttempts", { token: sup, confirm: "ย้าย" });
A = await sheet("Attempts"); AT = await sheet("Attempts_test");
t("ย้ายผลเดิมของโรงเรียนทดสอบครบทุกแถว", mv.moved === oldT.length && JSON.stringify(AT.map(r => r.id).sort()) === JSON.stringify(oldT), JSON.stringify(mv));
t("แถวที่ย้ายแล้วไม่เหลือในแท็บ Attempts (ไม่ซ้ำ)", !A.some(r => r.schoolId === cfg.schoolId));
t("ข้อมูลทุกคอลัมน์ของแถวที่ย้ายเหมือนเดิม (คะแนน รายละเอียด คำตอบ)", AT.every(r => r.detail && r.score !== "" && r.studentId === stuT.id));
t("ผลของโรงเรียนจริงไม่ถูกแตะ", A.some(r => r.id === "ts-real-1"));
t("ย้ายซ้ำ → 0 แถว ไม่ซ้ำในแท็บทดสอบ", (await api("moveTestAttempts", { token: sup, confirm: "ย้าย" })).moved === 0 && (await sheet("Attempts_test")).length === oldT.length);
const after = await api("progress", { code: codeT, studentId: stuT.id });
t("ความคืบหน้าของนักเรียนทดสอบเหมือนก่อนย้าย (อ่านจากแท็บทดสอบ)", JSON.stringify(after.done) === JSON.stringify(before.done) && after.history.length === before.history.length);

/* ผลใหม่ */
await sub(codeT, stuT, "ts-new-1"); await sub(codeR, stuR, "ts-real-2");
A = await sheet("Attempts"); AT = await sheet("Attempts_test");
t("ผลใหม่ของโรงเรียนทดสอบเขียนลง Attempts_test", AT.some(r => r.id === "ts-new-1") && !A.some(r => r.id === "ts-new-1"));
t("ผลใหม่ของโรงเรียนจริงยังเขียนลง Attempts", A.some(r => r.id === "ts-real-2") && !AT.some(r => r.id === "ts-real-2"));
t("ส่งซ้ำ (เกินแคช) ของโรงเรียนทดสอบ ตรวจจากแท็บทดสอบได้ ไม่บันทึกซ้ำ", await (async () => { await fetch(BASE + "/__clearcache"); const r = await api("submitAttempt", { attemptId: "ts-new-1", code: codeT, studentId: stuT.id, mode: "practice", keys, answers: {}, rev: {}, tries: 2 }); return r.dup === true && (await sheet("Attempts_test")).filter(x => x.id === "ts-new-1").length === 1; })());
const an = await api("analytics", { token: sup, schoolId: cfg.schoolId, level: "P6" }), rp = await api("report", { token: sup, schoolId: cfg.schoolId, level: "P6" });
t("รายงาน/analytics ของโรงเรียนทดสอบอ่านจากแท็บทดสอบ (เห็นผลครบ)", an.students.find(s => s.id === stuT.id).n === oldT.filter(Boolean).length + 1 && rp.students.find(s => s.no === "1").n >= 3);
t("รายงานโรงเรียนจริงไม่มีผลของโรงเรียนทดสอบ", (await api("analytics", { token: sup, schoolId: R, level: "P6" })).students.every(s => s.id === stuR.id));
t("ลบผลทดสอบ (purge) ใช้กับโรงเรียนทดสอบได้ และลบจากแท็บทดสอบ", (await api("purgeAttempts", { token: sup, schoolId: cfg.schoolId, prefix: "ts-new" })).deleted === 1 && !(await sheet("Attempts_test")).some(r => r.id === "ts-new-1"));
t("ลบผลทดสอบใช้กับโรงเรียนจริงไม่ได้ (แม้ชื่อมีคำว่า ทดสอบ)", (await raw("purgeAttempts", { token: sup, schoolId: R, prefix: "ts-real" })).ok === false);
await api("setSchoolTest", { token: sup, id: cfg.schoolId, isTest: false });
t("ยกเลิก isTest แล้วผลใหม่กลับไปแท็บ Attempts", await (async () => { await sub(codeT, stuT, "ts-back-1"); return (await sheet("Attempts")).some(r => r.id === "ts-back-1"); })());
console.log(bad ? `\nล้มเหลว ${bad} รายการ` : "\nผ่านทั้งหมด");
process.exit(bad ? 1 : 0);
