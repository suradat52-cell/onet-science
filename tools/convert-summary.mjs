// แปลงไฟล์สรุปรูปแบบเก่า (• !! ?? ex:) เป็นรูปแบบใหม่เป็นร่างแรก (kc: tr: ex/th/an) แล้วให้คนตรวจแก้ต่อ
//   node tools/convert-summary.mjs data/summaries/M3-4.1.txt [...]     (แก้ไฟล์ในที่เดิม · ไฟล์ที่แปลงแล้ว (มี "kc: ") จะถูกข้าม · ย้อนได้ด้วย git)
// กติกา: บรรทัดยาวเกิน 140 ตัวอักษรแบ่งที่ " · " · "• " แรกของหัวข้อย่อยที่มี ** → kc: · "?? " แยกเป็น ?? (รูปแบบคำถาม) กับ tr: (จุดที่พลาด/ข้อควรระวัง)
//        "ex: โจทย์ → … → ผล" ที่เป็นโจทย์คำนวณ (มีตัวเลขและ = × ÷ +) และมีลูกศร ≥ 2 → ex/th/an · นอกนั้นคงเป็นบรรทัดเดียว
import fs from "fs";

const LONG = 140;
const plain = s => s.replace(/\*\*|\{|\}/g, "");
const balanced = t => ((t.match(/\*\*/g) || []).length % 2) === 0;
function splitAt(text, seps) {   // แบ่งที่ตัวคั่น โดยไม่ตัดกลาง ** ... **
  for (const sep of seps) {
    const parts = text.split(sep), out = []; let cur = "";
    for (const p of parts) { const nx = cur ? cur + sep + p : p; if (cur && plain(nx).length > LONG && balanced(cur)) { out.push(cur); cur = p; } else cur = nx; }
    if (cur) out.push(cur);
    if (out.every(x => plain(x).length <= LONG)) return out;
    if (out.length > 1) text = out.join(""), seps = [];  // ยังมีท่อนยาว: ลองตัวคั่นถัดไปกับท่อนเหล่านั้น
    else continue;
    const fin = []; for (const o of text.split("")) fin.push(...(plain(o).length > LONG ? splitAt(o, [" → "]) : [o])); return fin;
  }
  return [text];
}
function pack(prefix, text) {
  if (plain(text).length <= LONG) return [prefix + text];
  if (/^(ex|th|an): /.test(prefix)) return [prefix + text];   // ตัวอย่างไม่ตัด (ให้คนแก้)
  return splitAt(text, [" · ", " → "]).map(x => prefix + x);
}
const MIS = /พลาด|ระวัง|ผิด|ไม่ใช่|ไม่ได้|อย่า|มักเลือก|มักคิด|สลับ|ลืม|ไม่ควร|ห้าม/;
function splitBal(text, sep) {   // แบ่งที่ตัวคั่น โดยไม่ตัดกลาง ** วงเล็บ หรือเครื่องหมายคำพูด
  const out = []; let cur = "";
  for (const p of text.split(sep)) { cur = cur ? cur + sep + p : p; if (balanced(cur)) { out.push(cur); cur = ""; } }
  if (cur) out.push(cur); return out;
}
function qLines(text) {
  const out = [];
  let t = text.replace(/ที่พลาดบ่อย(คือ)?\s*:?\s*/g, "· ").replace(/จุดที่พลาด(คือ)?\s*:?\s*/g, "· ");
  for (const seg of splitBal(t, " · ").map(x => x.trim()).filter(Boolean)) {
    for (const item of seg.split(/\s(?=\(\d\)\s)/).map(x => x.trim()).filter(Boolean)) out.push([MIS.test(item) && !/^โจทย์/.test(item) ? "tr: " : "?? ", item.replace(/^\(\d\)\s*/, "")]);
  }
  // รวมบรรทัดติดกันชนิดเดียวกันที่สั้นให้อยู่ในกล่องเดียวกัน (กล่องรวมเองตามบรรทัดต่อเนื่อง)
  return out;
}
const isCalc = s => /\d/.test(s) && /[=×÷+−]/.test(s);
export function convert(text) {
  const lines = text.replace(/\r\n/g, "\n").split("\n"), out = []; let firstBullet = false, overview = false;
  for (const l of lines) {
    if (l.startsWith("@@ ")) { out.push(l); firstBullet = false; overview = /สรุปย่อ 1 หน้า/.test(l); continue; }
    if (l.startsWith("## ")) { out.push(l); firstBullet = !overview; continue; }
    if (l.startsWith("• ") || l.startsWith("- ")) {
      const t = l.slice(2);
      if (firstBullet && /\*\*/.test(t)) { out.push(...pack("kc: ", t)); firstBullet = false; continue; }
      firstBullet = false; out.push(...pack("• ", t)); continue;
    }
    if (l.startsWith("!! ")) { out.push(...pack("!! ", l.slice(3))); firstBullet = false; continue; }
    if (l.startsWith("?? ")) { const q = qLines(l.slice(3)); for (const [pf, tx] of q) out.push(...pack(pf, tx)); firstBullet = false; continue; }
    if (l.startsWith("ex: ")) {
      firstBullet = false; const t = l.slice(4), seg = t.split(" → ");
      if (!overview && seg.length >= 3 && isCalc(t)) { out.push(...pack("ex: ", seg[0])); for (const m of seg.slice(1, -1)) out.push(...pack("th: ", m)); out.push(...pack("an: ", seg[seg.length - 1])); }
      else out.push(...pack("ex: ", t));
      continue;
    }
    out.push(l);
  }
  return out.join("\n").replace(/(\/\/ รูปแบบ.*\n)?/g, "$1");
}
if (process.argv[1] && process.argv[1].endsWith("convert-summary.mjs")) {
  for (const f of process.argv.slice(2)) {
    const s = fs.readFileSync(f, "utf8"), crlf = s.includes("\r\n");
    if (/^kc: /m.test(s)) { console.log("ข้าม (แปลงแล้ว):", f); continue; }
    let o = convert(s);
    o = o.replace(/\n(\/\/[^\n]*\n)*(?=@@ )/, m => m.replace(/\n$/, "") + "\n// รูปแบบสรุปใหม่: kc: แนวคิดหลัก · !! จำให้แม่น · ?? ข้อสอบชอบถาม · tr: กับดัก · ex:/th:/an: ตัวอย่างโจทย์คิด/คำนวณ · fl: ผังขั้นตอน (ดู README) · ภาพ SVG กว้าง 300 ตัวอักษร ≥ 12\n");
    fs.writeFileSync(f, crlf ? o.replace(/\n/g, "\r\n") : o); console.log("แปลง", f, s.split("\n").length, "→", o.split("\n").length, "บรรทัด");
  }
}
