// รวมไฟล์ข้อมูลเป็นชุดสำหรับนำเข้าที่หน้าแอดมิน (นำเข้าได้ทีละไฟล์ ไฟล์ละไม่เกิน ~380 KB เพื่อไม่ให้ช้า/ค้างตอนส่งไป Apps Script)
//   node tools/bundle-import.mjs         → import-bundles/ (ไม่เก็บใน repo, สร้างใหม่ได้เสมอ)
// ลำดับนำเข้า: 1 ผังข้อสอบ → 2 ข้อสอบ → 3 สรุปเนื้อหา → 4 เฉลยละเอียด (ทุกชนิดนำเข้าซ้ำได้ ข้อเดิมถูกแทนที่)
// ไฟล์ .txt (สรุป/เฉลย): ตัดบรรทัดหมายเหตุที่อยู่ก่อน @@ แรกของแต่ละไฟล์ออก ไม่ให้ไปต่อท้ายหัวข้อสุดท้ายของไฟล์ก่อนหน้า
import fs from "fs";
import path from "path";
import { at } from "./lib.mjs";

const CAP = 380 * 1024, OUT = at("import-bundles");
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const size = s => Buffer.byteLength(s, "utf8");
const rd = f => fs.readFileSync(f, "utf8").replace(/\r\n/g, "\n");
const out = [];
function write(name, text) { fs.writeFileSync(path.join(OUT, name), text.endsWith("\n") ? text : text + "\n"); out.push([name, size(text)]); }
// รวมไฟล์ที่เรียงแล้วเป็นก้อน ก้อนละไม่เกิน CAP (ไม่ตัดกลางไฟล์)
function chunk(items) { const g = []; let cur = [], n = 0; for (const it of items) { if (cur.length && n + size(it.text) > CAP) { g.push(cur); cur = []; n = 0; } cur.push(it); n += size(it.text); } if (cur.length) g.push(cur); return g; }
const letter = i => String.fromCharCode(97 + i);

write("1-blueprint.tsv", rd(at("data", "blueprint.tsv")));
const sortYear = (a, b) => b.localeCompare(a);
for (const lv of ["P6", "M3"]) {
  const qs = fs.readdirSync(at("data")).filter(f => f.startsWith(`questions-${lv}-`) && f.endsWith(".tsv")).sort(sortYear).map(f => ({ f, text: rd(at("data", f)).replace(/\n+$/, "") + "\n" }));
  chunk(qs).forEach((g, i, a) => write(`2-questions-${lv}${a.length > 1 ? "-" + letter(i) : ""}.tsv`, g.map(x => x.text).join("")));
}
const strip = t => { const i = t.search(/^@@\s/m); return i < 0 ? "" : t.slice(i).replace(/\n+$/, "") + "\n\n"; };
for (const [n, dir, re] of [[3, "summaries", /^(P6|M3)-\d.*\.txt$/], [4, "solutions", /^(P6|M3)-\d{4}\.txt$/]]) {
  for (const lv of ["P6", "M3"]) {
    const items = fs.readdirSync(at("data", dir)).filter(f => re.test(f) && f.startsWith(lv + "-")).sort(dir === "solutions" ? sortYear : undefined).map(f => ({ f, text: strip(rd(at("data", dir, f))) })).filter(x => x.text);
    chunk(items).forEach((g, i, a) => write(`${n}-${dir}-${lv}${a.length > 1 ? "-" + letter(i) : ""}.txt`, g.map(x => x.text).join("")));
  }
}
for (const [n, b] of out) console.log(n.padEnd(28), Math.round(b / 1024) + " KB");
console.log("รวม", out.length, "ไฟล์ ที่", path.relative(at(), OUT));
