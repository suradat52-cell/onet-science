// ทดสอบข้อ "นอกหลักสูตรปัจจุบัน" (เว้นตัวชี้วัดว่าง) กับไฟล์เนื้อหา content/ (สร้างจาก data/ โดย tools/build-content.mjs)
// node tools/test/outcurr.mjs      (ไม่ต้องเปิดเซิร์ฟเวอร์ · สร้าง content/ ใหม่ให้ก่อน)
import fs from "fs";
import { at } from "../lib.mjs";
import { buildContent } from "../build-content.mjs";

buildContent();
const J = rel => JSON.parse(fs.readFileSync(at("content", rel), "utf8"));
let bad = 0;
const t = (name, ok, info = "") => { if (!ok) bad++; console.log((ok ? "PASS " : "FAIL ") + name + (ok ? "" : "  " + info)); };

for (const lv of ["P6", "M3"]) {
  const rows = [];
  for (const f of fs.readdirSync(at("data")).filter(f => f.startsWith(`questions-${lv}-`))) for (const l of fs.readFileSync(at("data", f), "utf8").trim().split("\n")) rows.push(l.split("\t"));
  const out = rows.filter(r => !r[4]);
  const years = [...new Set(out.map(r => r[1]))];
  const meta = J(`${lv}/meta.json`);
  const byKey = {};
  for (const y of meta.years) for (const q of J(`${lv}/q-${y}.json`)) byKey[`${q.examYear}/${q.itemNo}`] = q;
  // โหมดรายปี: ต้องมีครบทุกข้อและติดป้าย outCurr เฉพาะข้อที่เว้นว่าง
  for (const y of years) {
    const q = J(`${lv}/q-${y}.json`);
    const want = rows.filter(r => r[1] === y).length, wantOut = out.filter(r => r[1] === y).length;
    t(`${lv}-${y} รายปีมีครบ ${q.length}/${want}`, q.length === want);
    t(`${lv}-${y} ป้ายนอกหลักสูตร ${q.filter(x => x.outCurr).length}/${wantOut}`, q.filter(x => x.outCurr).length === wantOut);
  }
  // ฝึกรายมาตรฐาน: ไม่มีข้อนอกหลักสูตรเลย
  const stds = [...new Set(rows.map(r => r[3]))];
  let leak = 0, got = 0;
  for (const s of stds) { const q = (meta.pool[s] || []).map(k => byKey[k]); got += q.length; leak += q.filter(x => x.outCurr || !x.indicator).length; }
  t(`${lv} ฝึกรายมาตรฐานไม่มีข้อนอกหลักสูตร (${got} ข้อ)`, leak === 0, `พบ ${leak}`);
  const mock = meta.mock.map(k => byKey[k]);
  t(`${lv} ข้อสอบจำลองไม่มีข้อนอกหลักสูตร (${mock.length} ข้อ)`, mock.every(x => x && x.indicator && !x.outCurr));
  // ตารางสรุป/ผัง: นับเฉพาะข้อในหลักสูตร
  let sumBank = 0;
  for (const s of stds) for (const ys of Object.values(meta.asked[s] || {})) sumBank += Object.values(ys).reduce((a, b) => a + b, 0);
  t(`${lv} ตารางสรุปนับเฉพาะข้อในหลักสูตร ${sumBank}/${rows.length - out.length}`, sumBank === rows.length - out.length);
  t(`${lv} ภาพรวมผังนับเฉพาะข้อในหลักสูตร`, meta.standards.reduce((n, s) => n + s.bank, 0) === rows.length - out.length);
  t(`${lv} ปุ่มรายปียังเห็นทุกข้อ`, Object.values(meta.bankYears).reduce((a, b) => a + b, 0) === rows.length);
}
process.exit(bad ? 1 : 0);
