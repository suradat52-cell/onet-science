// เทสต์แกนหลัก 5 เรื่อง (รันบนเครื่องกับเซิร์ฟเวอร์จำลองที่รัน Code.gs จริง):
//  1) ตรวจคำตอบ/คิดคะแนนตรงเฉลยทุกข้อ  2) คลังข้อสอบ: มีปี มีเฉลย ไม่ซ้ำ ป.6/ม.3 ไม่ปน  3) จัดกลุ่มมาตรฐาน/ตัวชี้วัด เรียงปีล่าสุดก่อน
//  4) เลือกชื่อจากรายชื่อห้อง + บันทึกผลรายคน  5) แอดมินโรงเรียนหนึ่งไม่เห็นข้อมูลอีกโรงเรียน
//   node tools/test/core.mjs      (ต้องรัน tools/test/server.mjs ก่อน · หรือ node tools/test/run-all.mjs core)
import fs from "fs";
import path from "path";
import { ROOT, TOOLS, POINTS, isRight, expectedScore, alts } from "../lib.mjs";

const cfg = JSON.parse(fs.readFileSync(path.join(TOOLS, ".cache", "admin.json"), "utf8")), BASE = `http://localhost:${cfg.port}`;
const raw = async (action, p = {}) => (await fetch(BASE + "/api", { method: "POST", body: JSON.stringify({ action, ...p }) })).json();
const api = async (action, p = {}) => { const r = await raw(action, p); if (!r.ok) throw new Error(action + ": " + r.error); return r.data; };
let bad = 0;
const t = (name, ok, info = "") => { if (!ok) bad++; console.log((ok ? "PASS " : "FAIL ") + name + (ok || !info ? "" : "  " + String(info).slice(0, 300))); };
const C = rel => JSON.parse(fs.readFileSync(path.join(ROOT, "content", rel), "utf8"));
const LV = ["P6", "M3"];

/* ---------- 2) คลังข้อสอบ ---------- */
const bank = {};
for (const lv of LV) {
  const meta = C(lv + "/meta.json"), years = Object.keys(meta.bankYears);
  const qs = years.flatMap(y => C(`${lv}/q-${y}.json`));
  bank[lv] = { meta, years, qs, keys: Object.fromEntries(years.map(y => [y, C(`${lv}/k-${y}.json`)])) };
  t(`${lv} ทุกข้อมีปี (4 หลัก) และเลขข้อ`, qs.every(q => /^\d{4}$/.test(q.examYear) && /^\d+$/.test(String(q.itemNo))), qs.find(q => !/^\d{4}$/.test(q.examYear)));
  const noKey = qs.filter(q => { const k = bank[lv].keys[q.examYear][q.itemNo]; return !k || !String(k.a || "").trim(); });
  t(`${lv} ทุกข้อมีเฉลย (${qs.length} ข้อ)`, !noKey.length, noKey.slice(0, 5).map(q => q.examYear + "/" + q.itemNo));
  const extraKey = years.flatMap(y => Object.keys(bank[lv].keys[y]).filter(n => !qs.some(q => q.examYear === y && String(q.itemNo) === n)).map(n => y + "/" + n));
  t(`${lv} ไม่มีเฉลยลอย (เฉลยที่ไม่มีข้อสอบ)`, !extraKey.length, extraKey.slice(0, 5));
  const ids = qs.map(q => q.examYear + "/" + q.itemNo), dupId = ids.filter((x, i) => ids.indexOf(x) !== i);
  t(`${lv} ไม่มีข้อซ้ำ (ปี/ข้อ)`, !dupId.length, dupId.slice(0, 5));
  const stems = {}; qs.forEach(q => { const s = String(q.stem).replace(/\s+/g, "").slice(0, 120); if (s.length > 40) (stems[s] = stems[s] || []).push(q.examYear + "/" + q.itemNo); });
  const dupStem = Object.values(stems).filter(a => new Set(a.map(k => k.split("/")[0])).size > 1); // ข้อในปีเดียวกันที่ใช้บทอ่านร่วม (เช่น "ใช้ตอบข้อ 27-28") ไม่นับซ้ำ
  t(`${lv} ไม่มีโจทย์ซ้ำกันข้ามปี (ตัวโจทย์ 120 ตัวอักษรแรก)`, !dupStem.length, JSON.stringify(dupStem.slice(0, 3)));
  t(`${lv} จำนวนข้อตรงกับ meta.bankYears`, years.every(y => bank[lv].qs.filter(q => q.examYear === y).length === meta.bankYears[y]));
  const noInd = qs.filter(q => !/^ว \d\.\d$/.test(q.standard) || (!q.indicator && q.outCurr !== "1"));
  t(`${lv} ทุกข้อมีมาตรฐาน · ข้อในหลักสูตรมีตัวชี้วัด (ข้อนอกหลักสูตรปัจจุบันไม่มีตัวชี้วัดได้)`, !noInd.length, noInd.slice(0, 5).map(q => q.examYear + "/" + q.itemNo));
}
const lvTag = { P6: /^ป\.[456]\//, M3: /^ม\.[123]\// };
for (const lv of LV) {
  const other = bank[lv].qs.filter(q => q.indicator && !lvTag[lv].test(q.indicator));
  t(`${lv} ตัวชี้วัดเป็นของระดับตัวเองทั้งหมด (ป.6 กับ ม.3 ไม่ปน)`, !other.length, other.slice(0, 5).map(q => q.examYear + "/" + q.itemNo + " " + q.indicator));
  const imgOther = bank[lv].qs.filter(q => q.imageUrl && !new RegExp("(^|/)" + lv + "-").test(q.imageUrl));
  t(`${lv} ภาพข้อสอบเป็นไฟล์ของระดับตัวเอง`, !imgOther.length, imgOther.slice(0, 3).map(q => q.imageUrl));
}
const both = Object.keys(bank.P6.meta.pool).filter(k => (bank.P6.meta.pool[k] || []).some(x => (bank.M3.meta.pool[k] || []).includes(x)) && lvTag.M3.test(k.split("|")[1] || "ม."));
t("pool ของ ป.6 และ ม.3 แยกไฟล์ ไม่มีรายการของอีกระดับ", !both.length, both.slice(0, 3));

/* ---------- 3) จัดกลุ่มมาตรฐาน/ตัวชี้วัด + ปีล่าสุดก่อน ---------- */
for (const lv of LV) {
  const { meta, qs } = bank[lv], q = Object.fromEntries(qs.map(x => [x.examYear + "/" + x.itemNo, x]));
  const wrong = [], order = [];
  for (const [k, list] of Object.entries(meta.pool)) {
    const [std, ind] = k.split("|");
    list.forEach(key => { const x = q[key]; if (!x || x.standard !== std || (ind && x.indicator !== ind)) wrong.push(k + " ← " + key); });
    for (let i = 1; i < list.length; i++) { const a = +list[i - 1].split("/")[0], b = +list[i].split("/")[0]; if (b > a) { order.push(k + ": " + list[i - 1] + " ก่อน " + list[i]); break; } }
  }
  t(`${lv} ทุกข้อในกลุ่ม (มาตรฐาน/ตัวชี้วัด) เป็นของกลุ่มนั้นจริง`, !wrong.length, wrong.slice(0, 5));
  t(`${lv} ข้อในทุกกลุ่มเรียงปีล่าสุดก่อน`, !order.length, order.slice(0, 5));
  const stdKeys = Object.keys(meta.pool).filter(k => !k.includes("|")), indKeys = Object.keys(meta.pool).filter(k => k.includes("|"));
  const sumInd = std => indKeys.filter(k => k.startsWith(std + "|")).reduce((n, k) => n + meta.pool[k].length, 0);
  t(`${lv} จำนวนข้อของมาตรฐาน = ผลรวมของตัวชี้วัดย่อย`, stdKeys.every(s => meta.pool[s].length === sumInd(s)), stdKeys.map(s => s + " " + meta.pool[s].length + "/" + sumInd(s)).join(" "));
  t(`${lv} ข้อสอบจำลองเรียงตามมาตรฐาน และปีล่าสุดก่อนภายในมาตรฐาน`, meta.mock.every((k, i) => { if (!i) return true; const a = q[meta.mock[i - 1]], b = q[k]; return a.standard < b.standard || (a.standard === b.standard && +a.examYear >= +b.examYear); }));
}

/* ---------- 1) ตรวจคำตอบ: ตอบถูกทุกข้อ = เต็ม · ตอบผิดทุกข้อ = 0 · ทุกข้อคะแนนตรงตัวคำนวณแยก ---------- */
const code = cfg.rooms.P6, codeM = cfg.rooms.M3;
const stuP = (await api("enter", { code })).students[0], stuM = (await api("enter", { code: codeM })).students[0];
const wrongOf = (type, key, n) => { const a = key.split(",").map(x => alts(x)[0]); if (type === "complex") return a.map(v => v === "ใช่" ? "ไม่ใช่" : "ใช่").join(","); if (type === "order") return a.length > 1 ? [a[1], a[0], ...a.slice(2)].join(",") : "9"; if (type === "fill") return key + "x"; return String([1, 2, 3, 4].find(v => !alts(key).includes(String(v)))); };
for (const lv of LV) {
  const { years, keys } = bank[lv], st = lv === "P6" ? stuP : stuM, cd = lv === "P6" ? code : codeM;
  for (const y of years) {
    const ks = Object.keys(keys[y]).map(n => y + "/" + n), K = keys[y];
    const right = Object.fromEntries(ks.map(k => { const e = K[k.split("/")[1]]; return [k, e.a.split(",").map(x => alts(x)[0]).join(",")]; }));
    const wrong = Object.fromEntries(ks.map(k => { const e = K[k.split("/")[1]]; return [k, wrongOf(e.t, e.a)]; }));
    const full = ks.reduce((n, k) => n + POINTS[lv][K[k.split("/")[1]].t], 0);
    const rR = await api("submitAttempt", { attemptId: "core-r-" + lv + y, code: cd, studentId: st.id, mode: "year", standard: y, keys: ks, answers: right, rev: {}, reveal: true });
    t(`${lv} ${y}: ตอบตามเฉลยทุกข้อ ได้เต็ม ${Math.round(full * 100) / 100} (${ks.length} ข้อ)`, rR.correct === ks.length && Math.abs(rR.score - full) < 0.01, JSON.stringify({ c: rR.correct, s: rR.score }));
    const rW = await api("submitAttempt", { attemptId: "core-w-" + lv + y, code: cd, studentId: st.id, mode: "year", standard: y, keys: ks, answers: wrong, rev: {}, reveal: true });
    const exp = ks.reduce((n, k) => { const e = K[k.split("/")[1]]; return n + expectedScore(lv, y, e.t, wrong[k], e.a); }, 0);
    t(`${lv} ${y}: ตอบผิดทุกข้อ ได้ 0 ข้อถูก · คะแนนบางส่วนตรงตัวคำนวณแยก (${Math.round(exp * 100) / 100})`, rW.correct === 0 && Math.abs(rW.score - exp) < 0.01, JSON.stringify({ c: rW.correct, s: rW.score, exp }));
    const perItem = (rR.items || []).every(i => i.ok === 1 && isRight(K[i.k.split("/")[1]].t, i.yours, i.answer));
    t(`${lv} ${y}: ผลรายข้อ (reveal) ตรงเฉลยทุกข้อ`, perItem && (rR.items || []).length === ks.length);
  }
}

/* ---------- 4) เลือกชื่อจากรายชื่อห้อง + บันทึกผลรายคน ---------- */
const room = await api("enter", { code });
t("กรอกรหัสห้อง → ได้โรงเรียน ระดับ ห้อง และรายชื่อเฉพาะห้องนี้", room.level === "P6" && room.students.length >= 1 && room.students.every(s => s.room === room.room), JSON.stringify(room).slice(0, 200));
t("รายชื่อไม่มีข้อมูลเกินจำเป็น (มีแค่ id ห้อง เลขที่ ชื่อ)", room.students.every(s => Object.keys(s).sort().join() === "id,name,no,room"));
await api("addStudents", { token: (await api("login", { username: cfg.username, password: cfg.password })).token, schoolId: cfg.schoolId, level: "P6", text: room.room + ",2,นักเรียนคนที่สอง ทดสอบ" });
const two = (await api("enter", { code })).students, s2 = two.find(s => s.name.includes("คนที่สอง"));
t("เพิ่มนักเรียนในห้องแล้วเห็นในรายชื่อทันที", !!s2);
const before2 = (await api("progress", { code, studentId: s2.id })).history.length;
await api("submitAttempt", { attemptId: "core-p2", code, studentId: s2.id, mode: "practice", standard: "ว 2.1", keys: bank.P6.meta.pool["ว 2.1"].slice(0, 3), answers: {}, rev: {} });
const p1 = await api("progress", { code, studentId: stuP.id }), p2 = await api("progress", { code, studentId: s2.id });
t("บันทึกผลแยกรายคน: คนที่สองมีประวัติเพิ่ม 1 ครั้งเฉพาะของตัวเอง", p2.history.length === before2 + 1 && p2.history[0].standard === "ว 2.1" && !p2.history.some(h => h.mode === "year"));
t("บันทึกผลแยกรายคน: คนแรกมีผลรายปีที่ทำ ไม่มีผลของคนที่สอง", p1.history.some(h => h.mode === "year") && !p1.history.some(h => h.standard === "ว 2.1"));
t("ส่ง attemptId เดิมซ้ำ ไม่บันทึกซ้ำ", (await api("submitAttempt", { attemptId: "core-p2", code, studentId: s2.id, mode: "practice", standard: "ว 2.1", keys: [], answers: {}, rev: {} })).dup === true && (await api("progress", { code, studentId: s2.id })).history.length === before2 + 1);
t("ใช้รหัสห้อง ป.6 ส่งผลแทนนักเรียน ม.3 ไม่ได้", (await raw("submitAttempt", { attemptId: "core-x", code, studentId: stuM.id, keys: [], answers: {} })).ok === false);
t("ดูประวัติของนักเรียนต่างห้องไม่ได้", (await raw("progress", { code, studentId: stuM.id })).ok === false);

/* ---------- 5) สิทธิ์แอดมิน ---------- */
const sup = (await api("login", { username: cfg.username, password: cfg.password })).token;
const sB = (await api("saveSchool", { token: sup, name: "โรงเรียน B (เทสต์สิทธิ์)" })).id;
await api("addStudents", { token: sup, schoolId: sB, level: "P6", text: "6/2,1,นักเรียนโรงเรียนบี" });
await api("saveAdmin", { token: sup, username: "adminB", password: "passwordB1", name: "แอดมิน B", role: "school", schoolId: sB });
const tB = (await api("login", { username: "adminB", password: "passwordB1" })).token;
const A = cfg.schoolId, leak = s => JSON.stringify(s).includes("ทดสอบ ป.หก") || JSON.stringify(s).includes("ทดสอบ ม.สาม") || JSON.stringify(s).includes("คนที่สอง");
const dB = await api("adminData", { token: tB });
t("แอดมิน B เห็นเฉพาะโรงเรียนตัวเองในรายการโรงเรียน", dB.schools.length === 1 && dB.schools[0].id === sB && !dB.allSchools);
for (const [act, p] of [["students", { level: "P6" }], ["report", { level: "P6" }], ["analytics", { level: "P6" }], ["roomCodes", { level: "P6" }], ["assignments", { level: "P6" }]]) {
  const r = await raw(act, { token: tB, schoolId: A, ...p });
  t(`แอดมิน B ขอ ${act} ของโรงเรียน A → ได้แค่ข้อมูลโรงเรียน B`, !r.ok || !leak(r.data), JSON.stringify(r).slice(0, 150));
}
const sA = await api("students", { token: sup, schoolId: A, level: "P6" });
t("แอดมิน B ลบนักเรียนโรงเรียน A ไม่ได้", (await raw("removeStudent", { token: tB, id: sA[0].id })).ok === false);
t("แอดมิน B รีเซ็ตรหัสห้องโรงเรียน A ไม่ได้", (await raw("resetRoomCode", { token: tB, code })).ok === false);
t("แอดมิน B สร้างแอดมินกลางไม่ได้ (ถูกบังคับเป็นแอดมินโรงเรียน B)", await (async () => { await api("saveAdmin", { token: tB, username: "sneaky", password: "sneaky123", role: "super", schoolId: A }); const x = (await api("adminData", { token: sup })).admins.find(a => a.username === "sneaky"); return x && x.role === "school" && x.schoolId === sB; })());
t("แอดมิน B ปิดโรงเรียน/ลบผลสอบไม่ได้ (เฉพาะแอดมินกลาง)", (await raw("setSchoolActive", { token: tB, id: A, active: false })).ok === false && (await raw("purgeAttempts", { token: tB, schoolId: A, prefix: "core" })).ok === false);
t("ไม่มี token / token ปลอม → ขอข้อมูลแอดมินไม่ได้", (await raw("students", { schoolId: A, level: "P6" })).ok === false && (await raw("analytics", { token: "fake", schoolId: A, level: "P6" })).ok === false);

console.log(bad ? `\nล้มเหลว ${bad} รายการ` : "\nผ่านทั้งหมด");
process.exit(bad ? 1 : 0);
