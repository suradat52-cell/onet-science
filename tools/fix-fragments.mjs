// ซ่อมท่อนประโยคที่ตัวแปลงสรุป (ช่วง 1) หั่นผิดที่เครื่องหมาย · ในกล่อง ?? / tr: / !! / kc:
//   node tools/fix-fragments.mjs [--write]     (ไม่ใส่ --write = แสดงสิ่งที่จะแก้เท่านั้น)
// กฎ: (1) บรรทัดที่มีแต่ · ทิ้ง (2) วงเล็บเปิดค้าง → รวมบรรทัดถัดไปจนวงเล็บปิด (3) ท่อนที่ขึ้นต้น "· " (เศษของ "ที่พลาดบ่อย: …") → กล่องกับดัก tr:
//     (4) ท่อนสั้น (< 14 ตัวอักษร) ที่มาจากประโยคเดียวกับบรรทัดข้างเคียงในสรุปฉบับก่อนแปลง (commit 26cbb8b) → รวมกลับด้วย " · "
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { ROOT } from "./lib.mjs";

const WRITE = process.argv.includes("--write"), DIR = path.join(ROOT, "data", "summaries");
const norm = s => s.replace(/\*\*/g, "").replace(/^[·\s]+|[·\s]+$/g, "").trim();
const BOX = /^(\?\?|tr:|!!|kc:) (.*)$/;
const opens = s => (s.match(/\(/g) || []).length - (s.match(/\)/g) || []).length;
let changes = 0;
for (const f of fs.readdirSync(DIR).filter(x => x.endsWith(".txt"))) {
  let old = [];
  try { old = execSync(`git show 26cbb8b:data/summaries/${f}`, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).split("\n").map(norm); } catch {}
  const origin = t => { const n = norm(t); return n.length >= 2 ? old.findIndex(o => o.includes(n)) : -1; };
  const L = fs.readFileSync(path.join(DIR, f), "utf8").split("\n"), out = [], log = [];
  for (let i = 0; i < L.length; i++) {
    const m = BOX.exec(L[i].trim());
    if (!m) { out.push(L[i]); continue; }
    let pre = m[1], t = m[2].trim();
    // เศษหัวเรื่อง เช่น "จุด·" (จาก "จุดที่พลาดบ่อย:") ทิ้ง
    if (/^[·.\s]*$/.test(t) || /^.{0,8}·$/.test(t)) { log.push(`ทิ้ง  ${L[i]}`); continue; }
    // (2) วงเล็บค้าง
    while (opens(t) > 0 && i + 1 < L.length && BOX.test(L[i + 1].trim())) { const n = BOX.exec(L[++i].trim())[2].trim(); log.push(`รวมวงเล็บ  ${pre} ${t}  ⟵  ${n}`); t = t + " · " + n; }
    // (3) เศษ "ที่พลาดบ่อย"
    if (/^·\s*/.test(t)) { const n = t.replace(/^·\s*/, ""); log.push(`เป็นกับดัก  ${L[i]}`); pre = "tr:"; t = n; }
    // (4) ท่อนสั้นที่มาจากประโยคเดียวกัน
    const prevM = out.length && BOX.exec(out[out.length - 1].trim());
    if (norm(t).length < 14 && prevM && origin(t) >= 0 && origin(t) === origin(prevM[2])) { log.push(`รวมท่อนสั้นกับบรรทัดก่อน  ${pre} ${t}`); out[out.length - 1] = out[out.length - 1].replace(/\s*$/, "") + " · " + t; continue; }
    const nxM = i + 1 < L.length && BOX.exec(L[i + 1].trim());
    if (norm(t).length < 14 && nxM && origin(t) >= 0 && origin(t) === origin(nxM[2]) && !(prevM && origin(prevM[2]) === origin(t))) { const n = nxM[2].trim(); i++; log.push(`รวมท่อนสั้นกับบรรทัดถัดไป  ${pre} ${t} · ${n}`); t = t + " · " + n; }
    out.push(pre + " " + t);
  }
  if (log.length) { changes += log.length; console.log("== " + f); log.forEach(x => console.log("  " + x.slice(0, 200))); if (WRITE) fs.writeFileSync(path.join(DIR, f), out.join("\n")); }
}
console.log(`\n${changes} จุด${WRITE ? " (เขียนแล้ว)" : " (ยังไม่เขียน — ใส่ --write)"}`);
