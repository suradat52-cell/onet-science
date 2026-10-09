// ทดสอบข้อ "นอกหลักสูตรปัจจุบัน" (เว้นตัวชี้วัดว่าง) กับ API จริงของ Code.gs — ต้องรัน tools/test/server.mjs ก่อน
// node tools/test/outcurr.mjs
import fs from "fs";
import { at } from "../lib.mjs";

const BASE = "http://localhost:8765/api";
const api = async (action, p = {}) => { const r = await (await fetch(BASE, { method: "POST", body: JSON.stringify({ action, ...p }) })).json(); if (!r.ok) throw new Error(r.error); return r.data; };
let bad = 0;
const t = (name, ok, info = "") => { if (!ok) bad++; console.log((ok ? "PASS " : "FAIL ") + name + (ok ? "" : "  " + info)); };

const cfg = JSON.parse(fs.readFileSync(at("tools", ".cache", "admin.json"), "utf8"));
const stu = await api("listStudents", { code: cfg.rooms.P6 });
for (const lv of ["P6", "M3"]) {
  const rows = [];
  for (const f of fs.readdirSync(at("data")).filter(f => f.startsWith(`questions-${lv}-`))) for (const l of fs.readFileSync(at("data", f), "utf8").trim().split("\n")) rows.push(l.split("\t"));
  const out = rows.filter(r => !r[4]);
  const years = [...new Set(out.map(r => r[1]))];
  // โหมดรายปี: ต้องมีครบทุกข้อและติดป้าย outCurr เฉพาะข้อที่เว้นว่าง
  for (const y of years) {
    const q = await api("getQuiz", { level: lv, mode: "year", year: y });
    const want = rows.filter(r => r[1] === y).length, wantOut = out.filter(r => r[1] === y).length;
    t(`${lv}-${y} รายปีมีครบ ${q.length}/${want}`, q.length === want);
    t(`${lv}-${y} ป้ายนอกหลักสูตร ${q.filter(x => x.outCurr).length}/${wantOut}`, q.filter(x => x.outCurr).length === wantOut);
  }
  // ฝึกรายมาตรฐาน: ไม่มีข้อนอกหลักสูตรเลย
  const stds = [...new Set(rows.map(r => r[3]))];
  let leak = 0, got = 0;
  for (const s of stds) { const q = await api("getQuiz", { level: lv, mode: "practice", standard: s }); got += q.length; leak += q.filter(x => x.outCurr || !x.indicator).length; }
  t(`${lv} ฝึกรายมาตรฐานไม่มีข้อนอกหลักสูตร (${got} ข้อ)`, leak === 0, `พบ ${leak}`);
  const mock = await api("getQuiz", { level: lv, mode: "mock" });
  t(`${lv} ข้อสอบจำลองไม่มีข้อนอกหลักสูตร (${mock.length} ข้อ)`, mock.every(x => x.indicator && !x.outCurr));
  // ตารางสรุป/ผัง: นับเฉพาะข้อในหลักสูตร
  let sumBank = 0;
  for (const s of stds) sumBank += (await api("summary", { level: lv, standard: s })).bank;
  t(`${lv} ตารางสรุปนับเฉพาะข้อในหลักสูตร ${sumBank}/${rows.length - out.length}`, sumBank === rows.length - out.length);
  const ov = await api("overview", { code: cfg.rooms[lv], studentId: (await api("listStudents", { code: cfg.rooms[lv] }))[0].id });
  t(`${lv} ภาพรวมผังนับเฉพาะข้อในหลักสูตร`, ov.standards.reduce((n, s) => n + s.bank, 0) === rows.length - out.length);
  t(`${lv} ปุ่มรายปียังเห็นทุกข้อ`, Object.values(ov.bankYears).reduce((a, b) => a + b, 0) === rows.length);
}
process.exit(bad ? 1 : 0);
