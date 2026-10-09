// ตรวจไฟล์เฉลยละเอียด data/solutions/<ระดับ>-<ปี>.txt : node tools/solutions.mjs [ไฟล์ ...]
// ตรวจ: หัวข้อ @@ ระดับ | ปี | ข้อ | มาตรฐาน | ตัวชี้วัด | ชื่อหัวข้อ ตรงกับข้อสอบในคลัง · มีหัวข้อบังคับครบ (ตามชนิดข้อ) ·
//       คำตอบในเฉลยละเอียดตรงกับเฉลย สทศ. ในคลังข้อสอบ · อธิบายตัวเลือก/ข้อย่อยครบทุกข้อ · เศษส่วน {เศษ/ส่วน} ถูกรูปแบบ ·
//       ลิงก์ไปสรุปเนื้อหา (>> มาตรฐาน | ตัวชี้วัด | หัวข้อ) ชี้ไปหัวข้อที่มีจริง · ข้อที่มีภาพต้องมีหัวข้อ "ดูอะไรในภาพ"
//       ข้อที่เฉลยละเอียดมี "ob:" (ข้อสังเกต) ต้องมีบรรทัดตรงกันใน data/REVIEW.md หัวข้อ "เฉลยละเอียด"
import fs from "fs";
import path from "path";
import { at, imgsOf } from "./lib.mjs";

const DIR = at("data", "solutions");
const files = process.argv.length > 2 ? process.argv.slice(2) : fs.existsSync(DIR) ? fs.readdirSync(DIR).filter(f => /^(P6|M3)-\d{4}\.txt$/.test(f)).map(f => path.join(DIR, f)) : [];
const readTsv = f => fs.readFileSync(at("data", f), "utf8").trim().split("\n").map(l => l.split("\t"));
const qs = {};
for (const f of fs.readdirSync(at("data")).filter(f => /^questions-(P6|M3)-\d{4}\.tsv$/.test(f)))
  for (const r of readTsv(f)) qs[`${r[0]}-${r[1]}/${r[2]}`] = { lv: r[0], y: r[1], no: r[2], std: r[3], ind: r[4], stem: r[5], img: r[6], ch: (r[7] || "").split("||").filter(Boolean), ans: r[8], type: r[10] || (r[7] ? "mc" : "fill"), all: imgsOf(r) };
const review = fs.existsSync(at("data", "REVIEW.md")) ? fs.readFileSync(at("data", "REVIEW.md"), "utf8") : "";
const reviewSec = (review.split(/^# /m).find(s => s.startsWith("เฉลยละเอียด")) || "");
const flagged = new Set([...reviewSec.matchAll(/\*\*(P6|M3)-(\d{4}) ข้อ (\d+)\*\*/g)].map(m => `${m[1]}-${m[2]}/${m[3]}`));
// หัวข้อในสรุปเนื้อหา: lv|std|ind -> ชุดชื่อหัวข้อ ##
const sums = {};
const SD = at("data", "summaries");
for (const f of fs.readdirSync(SD).filter(f => /^(P6|M3)-.*\.txt$/.test(f))) {
  let cur = null;
  for (const l of fs.readFileSync(path.join(SD, f), "utf8").split(/\r?\n/)) {
    if (/^@@\s/.test(l)) { const c = l.slice(2).split("|").map(x => x.trim()); cur = `${c[0]}|${c[1]}|${c[2]}`; sums[cur] = sums[cur] || []; sums[cur].push(c.slice(3).join(" | ")); }
    else if (cur && l.startsWith("## ")) sums[cur].push(l.slice(3).trim());
  }
}
let errs = 0, warns = 0, nBlocks = 0;
const bad = (f, m) => { errs++; console.log(`✗ ${path.basename(f)}: ${m}`); };
const warn = (f, m) => { warns++; console.log(`! ${path.basename(f)}: ${m}`); };
export const parseSolutions = text => {
  const list = []; let cur = null;
  text.split(/\r?\n/).forEach((l, i) => {
    if (/^@@\s/.test(l)) { const c = l.slice(2).split("|").map(x => x.trim()); cur = { lv: c[0], y: c[1], no: c[2], std: c[3], ind: c[4], title: c.slice(5).join(" | "), n: c.length, body: [], at: i + 1 }; list.push(cur); }
    else if (cur) cur.body.push(l);
  });
  return list;
};
const secOf = (body, name) => { const i = body.findIndex(l => l.startsWith("## ") && l.slice(3).trim().startsWith(name)); if (i < 0) return null; let j = body.findIndex((l, k) => k > i && l.startsWith("## ")); if (j < 0) j = body.length; return body.slice(i + 1, j); };

if (import.meta.url === new URL(`file:///${process.argv[1].replace(/\\/g, "/")}`).href || process.argv[1].endsWith("solutions.mjs")) {
  for (const f of files) {
    const base = path.basename(f), [flv, fy] = base.replace(".txt", "").split("-");
    const list = parseSolutions(fs.readFileSync(f, "utf8"));
    if (!list.length) { bad(f, "ไม่มีหัวข้อ @@"); continue; }
    const seen = new Set();
    for (const s of list) {
      nBlocks++;
      const id = `${s.lv}-${s.y}/${s.no}`, q = qs[id], at0 = `${id} (บรรทัด ${s.at})`;
      if (s.n < 6 || !s.title) { bad(f, `${at0}: หัวข้อไม่ครบ 6 ช่อง`); continue; }
      if (s.lv !== flv || s.y !== fy) bad(f, `${at0}: ระดับ/ปีในหัวข้อต้องตรงชื่อไฟล์ (${flv}-${fy})`);
      if (seen.has(id)) bad(f, `${at0}: ซ้ำ`); seen.add(id);
      if (!q) { bad(f, `${at0}: ไม่พบข้อนี้ในคลังข้อสอบ`); continue; }
      if (q.std !== s.std || q.ind !== s.ind) bad(f, `${at0}: มาตรฐาน/ตัวชี้วัดไม่ตรงคลังข้อสอบ (${q.std} ${q.ind})`);
      const body = s.body, text = body.join("\n");
      if (text.replace(/\s/g, "").length < 350) bad(f, `${at0}: เฉลยสั้นเกินไป`);
      const need = ["คำตอบตามเฉลย สทศ.", "ข้อนี้วัดอะไร", "วิธีคิดทีละขั้น"];
      need.push(q.type === "mc" ? "ตัวเลือกแต่ละข้อ" : q.type === "complex" ? "ทีละข้อย่อย" : q.type === "order" ? "เหตุผลของลำดับ" : "ตัวเลือกแต่ละข้อ");
      if (q.all.length) need.push("ดูอะไรในภาพ");
      for (const h of need) if (!secOf(body, h)) bad(f, `${at0}: ขาดหัวข้อ "## ${h}"`);
      // คำตอบตรงเฉลย สทศ.
      const a = (secOf(body, "คำตอบตามเฉลย สทศ.") || []).map(x => x.trim()).filter(Boolean)[0] || "";
      if (q.type === "mc") { const k = q.ans.split("|"); const m = a.match(/^ข้อ\s*(\d)/); if (!m || !k.includes(m[1])) bad(f, `${at0}: คำตอบ "${a.slice(0, 30)}" ไม่ตรงเฉลย ข้อ ${q.ans}`); }
      else if (q.type === "complex") { const k = q.ans.split(","); const m = a.split(/\s*[,،]\s*|\s+/).filter(Boolean); const got = a.replace(/^ข้อ[^:：]*[:：]\s*/, "").match(/ไม่ใช่|ใช่/g) || []; if (got.length < k.length || !k.every((t, i) => t.split("|").includes(got[i]))) bad(f, `${at0}: คำตอบ "${a.slice(0, 40)}" ไม่ตรงเฉลย ${q.ans}`); }
      else if (q.type === "order") { const got = (a.match(/\d+/g) || []).join(","); if (got !== q.ans) bad(f, `${at0}: คำตอบ "${a.slice(0, 30)}" ไม่ตรงเฉลย ${q.ans}`); }
      // ตัวเลือก/ข้อย่อยครบ
      if (q.type === "mc") {
        const sec = secOf(body, "ตัวเลือกแต่ละข้อ") || [];
        for (const n of [1, 2, 3, 4]) {
          const l = sec.find(x => new RegExp(`^•\\s*ข้อ\\s*${n}\\b`).test(x.trim()));
          if (!l) { bad(f, `${at0}: ไม่อธิบายตัวเลือกข้อ ${n}`); continue; }
          const ok = q.ans.split("|").includes(String(n));
          if (ok && !l.includes("✓")) bad(f, `${at0}: ตัวเลือกข้อ ${n} เป็นคำตอบที่ถูก ต้องมี ✓`);
          if (!ok && !l.includes("✗")) bad(f, `${at0}: ตัวเลือกข้อ ${n} เป็นตัวเลือกที่ผิด ต้องมี ✗ พร้อมเหตุผล`);
          if (!ok && l.replace(/[•\s]|ข้อ\s*\d|✗/g, "").length < 14) bad(f, `${at0}: เหตุผลของตัวเลือกข้อ ${n} สั้นเกินไป`);
        }
      } else if (q.type === "complex") {
        const sec = secOf(body, "ทีละข้อย่อย") || [], k = q.ans.split(",");
        k.forEach((t, i) => {
          const l = sec.find(x => new RegExp(`^•\\s*(ข้อ\\s*)?${q.no}\\.${i + 1}\\b`).test(x.trim()));
          if (!l) bad(f, `${at0}: ไม่อธิบายข้อย่อย ${q.no}.${i + 1}`);
          else { const v = (l.match(/ไม่ใช่|ใช่/) || [])[0]; if (!t.split("|").includes(v)) bad(f, `${at0}: ข้อย่อย ${q.no}.${i + 1} เขียน "${v}" ไม่ตรงเฉลย ${t}`); if (l.length < 40) bad(f, `${at0}: เหตุผลข้อย่อย ${i + 1} สั้นเกินไป`); }
        });
      } else if (q.type === "order") {
        const sec = secOf(body, "เหตุผลของลำดับ") || []; const k = q.ans.split(",");
        if (sec.filter(x => x.trim().startsWith("•")).length < k.length) bad(f, `${at0}: ต้องอธิบายทุกลำดับ (${k.length} ลำดับ)`);
      }
      // เศษส่วน
      for (const m of text.matchAll(/\{([^{}]*)\}/g)) { if ((m[1].match(/\//g) || []).length !== 1) bad(f, `${at0}: เศษส่วน {${m[1]}} ต้องมี / เพียงตัวเดียว ห้ามซ้อน`); }
      if (/\{[^{}]*$/m.test(text.replace(/\{[^{}]*\}/g, ""))) bad(f, `${at0}: วงเล็บปีกกาไม่ปิด`);
      // ลิงก์ไปสรุป
      const links = body.filter(l => l.startsWith(">> "));
      const outCurr = !q.ind; // ข้อนอกหลักสูตรปัจจุบัน (ตัวชี้วัดว่าง): ไม่ต้องมีลิงก์ แต่ต้องบอกในเฉลยว่าไม่อยู่ในหลักสูตรปัจจุบัน
      if (outCurr && !text.includes("ไม่อยู่ในหลักสูตรปัจจุบัน")) bad(f, `${at0}: ข้อนอกหลักสูตรปัจจุบัน ต้องบอกในเฉลยว่า "เนื้อหานี้ไม่อยู่ในหลักสูตรปัจจุบัน"`);
      if (!links.length && !outCurr) bad(f, `${at0}: ไม่มีลิงก์ ">> มาตรฐาน | ตัวชี้วัด | หัวข้อ" ไปสรุปเนื้อหา`);
      for (const l of links) {
        const c = l.slice(3).split("|").map(x => x.trim());
        const heads = sums[`${s.lv}|${c[0]}|${c[1]}`];
        if (!heads) bad(f, `${at0}: ลิงก์ ${c[0]} ${c[1]} ไม่มีในสรุปเนื้อหา`);
        else if (!heads.some(h => h.includes(c[2]))) bad(f, `${at0}: ไม่พบหัวข้อ "${c[2]}" ในสรุป ${c[0]} ${c[1]}`);
      }
      // ข้อสังเกต ⇔ REVIEW.md
      const hasOb = body.some(l => l.startsWith("ob: "));
      if (hasOb && !flagged.has(id)) bad(f, `${at0}: มี ob: แต่ไม่มีบรรทัด "**${id.replace("/", " ข้อ ")}**" ใน REVIEW.md หัวข้อ "เฉลยละเอียด"`);
      if (!hasOb && flagged.has(id)) warn(f, `${at0}: อยู่ใน REVIEW.md แต่เฉลยละเอียดไม่มี ob:`);
      // ภาษา: ป.6 ห้ามศัพท์ระดับ ม.3 ที่หนักเกิน
      if (s.lv === "P6" && /แรงโน้มถ่วงสากล|กฎของนิวตัน|โมเมนต์|ไมโอซิส|แอลลีล|พันธุวิศวกรรม/.test(text)) warn(f, `${at0}: มีศัพท์ระดับ ม.3 ในเฉลย ป.6`);
      if (s.lv === "M3" && /ป\.[4-6]\/\d|ประถม/.test(text)) warn(f, `${at0}: อ้างถึงระดับ ป.`);
    }
    if (fy === "2568") { const want = Object.keys(qs).filter(k => k.startsWith(`${flv}-2568/`)).length; if (list.length < want) bad(f, `ครอบคลุม ${list.length} จาก ${want} ข้อ`); }
  }
  console.log(`${errs ? "✗" : "✓"} เฉลยละเอียด ${nBlocks} ข้อ · ผิดพลาด ${errs} · คำเตือน ${warns}`);
  if (errs) process.exit(1);
}
