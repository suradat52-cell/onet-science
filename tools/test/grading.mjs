// ทดสอบการตรวจคะแนนและบันทึกคะแนนของ Apps Script (Code.gs จริงบนเซิร์ฟเวอร์จำลอง) — ต้องรัน tools/test/server.mjs ก่อน
// node tools/test/grading.mjs
//  1) โค้ดตรวจคะแนนใน grade.js (ฝั่งนักเรียน) กับ apps-script/Code.gs ต้องเหมือนกันทุกตัวอักษร
//  2) เนื้อหา content/: ทุกข้อมีกุญแจเฉลย · ไฟล์ k-/q- จำนวนเท่ากัน
//  3) submitAttempt: สุ่มคำตอบทุกปีทุกระดับ แล้วเทียบคะแนนที่เซิร์ฟเวอร์ตรวจซ้ำกับคะแนนที่คำนวณแยกต่างหาก (lib.mjs)
//  4) ส่ง attemptId เดิมซ้ำ = ไม่บันทึกซ้ำ · ไม่ส่งเฉลยกลับถ้าไม่ขอ (reveal) · คำตอบนอกขอบเขตไม่ทำให้ล้ม
import fs from "fs";
import { at, expectedScore, isRight, POINTS } from "../lib.mjs";

let bad = 0;
const t = (name, ok, info = "") => { if (!ok) bad++; console.log((ok ? "PASS " : "FAIL ") + name + (ok ? "" : "  " + info)); };
const block = f => { const s = fs.readFileSync(at(...f), "utf8").replace(/\r/g, ""); const a = s.indexOf("/* GRADING:BEGIN"), b = s.indexOf("/* GRADING:END */"); return a >= 0 && b > a ? s.slice(a, b) : null; };
const g1 = block(["grade.js"]), g2 = block(["apps-script", "Code.gs"]);
t("ตัวตรวจคะแนน grade.js เหมือน Code.gs ทุกตัวอักษร", !!g1 && g1 === g2, g1 && g2 ? "ต่างกัน — แก้ให้ตรงกันทั้งสองไฟล์" : "ไม่พบเครื่องหมาย GRADING");

const cfg = JSON.parse(fs.readFileSync(at("tools", ".cache", "admin.json"), "utf8"));
const BASE = `http://localhost:${cfg.port}/api`;
const api = async (action, p = {}) => { const r = await (await fetch(BASE, { method: "POST", body: JSON.stringify({ action, ...p }) })).json(); if (!r.ok) throw new Error(r.error); return r.data; };
const J = rel => JSON.parse(fs.readFileSync(at("content", rel), "utf8"));
let seed = 12345; const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const pickOf = a => a[Math.floor(rnd() * a.length)];
const token = (await api("login", { username: cfg.username, password: cfg.password })).token;

for (const lv of ["P6", "M3"]) {
  const meta = J(`${lv}/meta.json`), code = cfg.rooms[lv];
  const stu = (await api("enter", { code })).students[0];
  let okAll = 0, nAll = 0, nItems = 0;
  for (const y of meta.years) {
    const qs = J(`${lv}/q-${y}.json`), ks = J(`${lv}/k-${y}.json`);
    if (Object.keys(ks).length !== qs.length || !qs.every(q => ks[q.itemNo])) t(`${lv}-${y} กุญแจเฉลยครบทุกข้อ`, false, "จำนวน/รายการไม่ตรง");
    for (let rep = 0; rep < 3; rep++) {
      const answers = {}; let exp = 0, max = 0, right = 0;
      for (const q of qs) {
        const k = ks[q.itemNo], key = k.a, key1 = key.split(",");
        let a;
        const r = rnd();
        if (r < 0.15) a = "";                                                   // ไม่ตอบ
        else if (q.type === "complex") a = key1.map(x => (rnd() < 0.7 ? x.split("|")[0] : pickOf(["ใช่", "ไม่ใช่"]))).join(",");
        else if (q.type === "order") a = rnd() < 0.5 ? key : key1.map(() => String(1 + Math.floor(rnd() * Math.max(2, q.choices.length)))).join(",");
        else if (q.type === "fill") a = rnd() < 0.5 ? key : "x";
        else a = rnd() < 0.5 ? key.split("|")[0] : String(1 + Math.floor(rnd() * 4));
        answers[`${y}/${q.itemNo}`] = a;
        const pts = POINTS[lv][k.t]; max += pts; exp += expectedScore(lv, y, k.t, a, key); if (isRight(k.t, a, key)) right++;
      }
      exp = Math.round(exp * 100) / 100; max = Math.round(max * 100) / 100;
      const res = await api("submitAttempt", { code, studentId: stu.id, attemptId: `t-${lv}-${y}-${rep}`, mode: "year", standard: y, keys: qs.map(q => `${y}/${q.itemNo}`), answers, rev: { [y]: "" } });
      nAll++; nItems += qs.length;
      if (res.total === qs.length && res.correct === right && Math.abs(res.score - exp) < 0.011 && Math.abs(res.maxScore - max) < 0.011 && !res.items) okAll++;
      else t(`${lv}-${y} รอบ ${rep}`, false, JSON.stringify(res).slice(0, 200) + ` คาด correct ${right} score ${exp}/${max}`);
    }
  }
  t(`${lv} Apps Script ตรวจซ้ำ ${nAll} ชุด (${nItems} ข้อ) ได้คะแนนเท่ากับที่คำนวณแยกทุกชุด`, okAll === nAll, `${okAll}/${nAll}`);
}

/* ส่งซ้ำ / reveal / ข้อมูลแปลก */
const code = cfg.rooms.P6, stu = (await api("enter", { code })).students[0];
const y0 = J("P6/meta.json").years[0], q0 = J(`P6/q-${y0}.json`);
const keysAll = q0.map(q => `${y0}/${q.itemNo}`);
const before = (await api("report", { token, schoolId: cfg.schoolId, level: "P6" })).students.find(s => s.name === stu.name).n;
const payload = { code, studentId: stu.id, attemptId: "dup-test-1", mode: "practice", standard: "ว 1.1", keys: keysAll, answers: {}, rev: {} };
const r1 = await api("submitAttempt", payload), r2 = await api("submitAttempt", { ...payload, answers: { [keysAll[0]]: "1" } });
const after = (await api("report", { token, schoolId: cfg.schoolId, level: "P6" })).students.find(s => s.name === stu.name).n;
t("ส่ง attemptId เดิมซ้ำ ไม่บันทึกซ้ำ และตอบค่าที่บันทึกไว้", !r1.dup && r2.dup === true && r2.correct === r1.correct && after === before + 1, `before ${before} after ${after} ${JSON.stringify(r2)}`);
const rv = await api("submitAttempt", { ...payload, attemptId: "dup-test-2", reveal: true, answers: { [keysAll[0]]: "1" } });
t("reveal: true ส่งเฉลยรายข้อกลับ / ไม่ขอไม่ส่ง", Array.isArray(rv.items) && rv.items.length === keysAll.length && r1.items === undefined);
const odd = await api("submitAttempt", { code, studentId: stu.id, attemptId: "odd-test", mode: "mock", keys: ["abc", "../x", `${y0}/999999`, keysAll[0]], answers: { [keysAll[0]]: { x: 1 } }, rev: {} });
t("คีย์แปลก/ข้อที่ไม่มี ถูกข้าม ไม่ทำให้ล้ม", odd.total <= 1, JSON.stringify(odd));
const noYear = await api("submitAttempt", { code, studentId: stu.id, attemptId: "odd-year", keys: ["9999/1"], answers: {}, rev: {}, chk: { score: 0, correct: 0 } });
t("ปีที่ไม่มีไฟล์เฉลย: ไม่ล้ม บันทึกเป็น pending (ไม่ให้คะแนนผิด ๆ) รอตรวจซ้ำ", noYear.pending === true, JSON.stringify(noYear));
let rejected = false; try { await api("submitAttempt", { code: "ZZZZZZ", studentId: stu.id, keys: [], answers: {} }); } catch (e) { rejected = /รหัสห้องเรียนไม่ถูกต้อง/.test(e.message); }
t("รหัสห้องผิด บันทึกคะแนนไม่ได้", rejected);

/* ดึงเฉลยไม่ได้ → บันทึกไว้ก่อน (pending) แล้วตรวจซ้ำภายหลังได้คะแนนเท่ากับที่คำนวณแยก */
const kk = J(`P6/k-${y0}.json`), qq = J(`P6/q-${y0}.json`); const ansP = {}; let expP = 0, rightP = 0;
qq.forEach((q, i) => { const e = kk[q.itemNo], a = e.t === "mc" ? (i % 3 ? e.a.split("|")[0] : "1") : ""; ansP[`${y0}/${q.itemNo}`] = a; expP += expectedScore("P6", y0, e.t, a, e.a); if (isRight(e.t, a, e.a)) rightP++; });
const pk = { code, studentId: stu.id, attemptId: "pend-1", mode: "year", standard: y0, keys: qq.map(q => `${y0}/${q.itemNo}`), answers: ansP, rev: { [y0]: "no-cache-rev" }, chk: { score: 1, correct: 1 } };
await fetch(BASE.replace("/api", "/__fail?on=1"));
const pr1 = await api("submitAttempt", pk);
await fetch(BASE.replace("/api", "/__fail?on=0"));
t("โหลดเฉลยไม่ได้: ไม่ล้ม ตอบ pending และเก็บคะแนนที่นักเรียนเห็นไว้ก่อน", pr1.pending === true && pr1.total === qq.length, JSON.stringify(pr1));
const pr2 = await api("submitAttempt", pk);
t("ส่ง attemptId ที่ค้าง pending ซ้ำ ไม่บันทึกซ้ำ", pr2.dup === true && pr2.pending === true, JSON.stringify(pr2));
const rg = await api("regrade", { token });
t("regrade: ตรวจซ้ำรายการที่ค้างได้ " + rg.regraded + " รายการ (ปี 9999 ที่ไม่มีไฟล์ยังค้างอยู่ 1)", rg.regraded === 1 && rg.stillPending === 1, JSON.stringify(rg));
const rg2 = await api("regrade", { token });
t("regrade ซ้ำ ไม่มีของที่ตรวจได้เพิ่ม", rg2.regraded === 0 && rg2.stillPending === 1, JSON.stringify(rg2));
const prog = await api("progress", { code, studentId: stu.id });
t("หลัง regrade ความคืบหน้านับข้อถูกตามเฉลยจริง", Object.values(prog.done).reduce((n, d) => n + d.done, 0) >= qq.length, JSON.stringify(prog.history[0]));
const h0 = prog.history.find(h => h.standard === y0 && +h.total === qq.length && Math.abs(+h.score - Math.round(expP * 100) / 100) < 0.011);
t("คะแนนที่ตรวจซ้ำตรงกับที่คำนวณแยก (" + Math.round(expP * 100) / 100 + ")", !!h0, JSON.stringify(prog.history.slice(0, 2)));

/* แคชรายชื่อ: เพิ่มนักเรียนแล้ว enter เห็นทันที (ไม่รอแคชหมดอายุ) */
const e0 = (await api("enter", { code })).students.length;
await api("enter", { code }); // อุ่นแคช
await api("addStudents", { token, schoolId: cfg.schoolId, level: "P6", text: "6/1,9,นักเรียนแคชทดสอบ" });
const e1 = (await api("enter", { code })).students;
t("เพิ่มนักเรียนแล้ว enter เห็นทันที (ล้างแคชหลังเขียน)", e1.length === e0 + 1 && e1.some(s => s.name === "นักเรียนแคชทดสอบ"), e1.length + "/" + e0);
await api("removeStudent", { token, id: e1.find(s => s.name === "นักเรียนแคชทดสอบ").id });
t("ลบนักเรียนแล้ว enter ไม่เห็นทันที", (await api("enter", { code })).students.length === e0);
process.exit(bad ? 1 : 0);
