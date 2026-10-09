// ตรวจไฟล์ data/questions-*.tsv ทั้งหมด + ภาพใน images/ + เทียบกับ data/blueprint.tsv
// node tools/check-tsv.mjs [--table]      (--table พิมพ์ตารางจำนวนข้อต่อมาตรฐาน/ตัวชี้วัด)
import fs from "fs";
import { at, POINTS, imgsOf } from "./lib.mjs";
import { problems } from "./tsv.mjs";

const table = process.argv.includes("--table");
const files = fs.readdirSync(at("data")).filter(f => /^questions-(P6|M3)-25\d\d\.tsv$/.test(f)).sort();
const bp = fs.readFileSync(at("data", "blueprint.tsv"), "utf8").trim().split("\n").slice(1).map(l => l.split("\t"));
const inPlan = new Set(bp.filter(r => r[4]).map(r => `${r[0]}|${r[3]}|${r[4]}`));
let errors = 0;
const used = new Set(), summary = [], all = [];
for (const f of files) {
  const [, lv, year] = f.match(/questions-(P6|M3)-(\d+)/);
  const rows = fs.readFileSync(at("data", f), "utf8").replace(/\n$/, "").split("\n").map(l => l.split("\t"));
  const types = {}, off = [];
  let pts = 0;
  rows.forEach((c, i) => {
    const p = problems(c);
    if (c[0] !== lv || c[1] !== year) p.push("level/ปีไม่ตรงชื่อไฟล์");
    if (+c[2] !== i + 1) p.push(`ลำดับข้อ ${c[2]} (ควรเป็น ${i + 1})`);
    p.forEach(m => { console.log(`✗ ${f} ข้อ ${c[2]}: ${m}`); errors++; });
    types[c[10]] = (types[c[10]] || 0) + 1;
    pts += POINTS[lv][c[10]] || 0;
    imgsOf(c).forEach(x => { used.add(x); if (!fs.existsSync(at("images", x))) { console.log(`✗ ${f} ข้อ ${c[2]}: ไม่มีไฟล์ images/${x}`); errors++; } });
    if (c[4] && !inPlan.has(`${lv}|${c[3]}|${c[4]}`)) off.push(`${c[2]}(${c[3]} ${c[4]})`);
    if (!c[4]) off.push(`${c[2]}(${c[3]} ไม่มีตัวชี้วัด)`);
    all.push(c);
  });
  const imgs = rows.reduce((n, c) => n + imgsOf(c).length, 0);
  summary.push({ ไฟล์: f, ข้อ: rows.length, ภาพ: imgs, ชนิด: Object.entries(types).map(([k, v]) => `${k} ${v}`).join(", "), คะแนนเต็ม: Math.round(pts * 100) / 100, นอกผัง2569: off.join(" ") || "-" });
}
// ภาพที่ไม่มีข้อไหนใช้
for (const img of fs.readdirSync(at("images")).filter(f => /\.(png|webp)$/.test(f)))
  if (!used.has(img)) { console.log(`✗ images/${img} ไม่มีข้อไหนอ้างถึง`); errors++; }
console.table(summary);
if (table) {
  for (const lv of ["P6", "M3"]) {
    const m = {};
    all.filter(c => c[0] === lv).forEach(c => { const k = c[3] + " " + (c[4] || "(ไม่ระบุ)"); (m[k] = m[k] || []).push(c[1]); });
    console.log(`\n${lv} มาตรฐาน/ตัวชี้วัด เรียงจากออกบ่อย`);
    Object.entries(m).sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))
      .forEach(([k, ys]) => console.log(`${String(ys.length).padStart(3)}  ${k}${inPlan.has(`${lv}|${k.split(" ").slice(0, 2).join(" ")}|${k.split(" ")[2]}`) ? "" : "  *นอกผัง"}  [${[...new Set(ys)].sort().join(",")}]`));
  }
}
console.log(errors ? `พบปัญหา ${errors} รายการ` : "ผ่านทั้งหมด");
process.exit(errors ? 1 : 0);
