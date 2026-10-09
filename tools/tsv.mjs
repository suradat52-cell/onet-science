// เขียนและตรวจไฟล์ข้อสอบ 11 คอลัมน์ (ไม่มีหัวตาราง)
// level | ปีการศึกษา | ข้อที่ | มาตรฐาน | ตัวชี้วัด | โจทย์ | ลิงก์รูป | ตัวเลือก | เฉลย | คำอธิบาย | type
import fs from "fs";
import { at } from "./lib.mjs";

export const TYPES = ["mc", "complex", "order", "fill"];
const STD = /^ว [1-4]\.[1-3]$/, IND = /^[ปม]\.[1-6]\/\d{1,2}$/;

// คืนรายการปัญหาของแถวหนึ่ง (cells = 11 ช่อง)
export function problems(cells) {
  const out = [], [level, year, no, std, ind, stem, img, choices, ans, exp, type] = cells;
  const bad = m => out.push(m);
  if (cells.length !== 11) bad(`มี ${cells.length} คอลัมน์ (ต้อง 11)`);
  if (cells.some(c => /[\t\r\n]/.test(c))) bad("มี tab/ขึ้นบรรทัดใหม่ในเซลล์");
  if (!["P6", "M3"].includes(level)) bad("level ต้องเป็น P6/M3");
  if (!/^25\d\d$/.test(year)) bad("ปีการศึกษา");
  if (!/^\d+$/.test(no)) bad("ข้อที่");
  if (!STD.test(std)) bad(`มาตรฐาน "${std}"`);
  if (ind && !IND.test(ind)) bad(`ตัวชี้วัด "${ind}"`);
  if (ind && ind[0] !== (level === "P6" ? "ป" : "ม")) bad(`ตัวชี้วัด ${ind} ไม่ตรงระดับ`);
  if (!stem) bad("ไม่มีโจทย์");
  if (!TYPES.includes(type)) bad(`type "${type}"`);
  // เฉลยหลายคำตอบคั่นด้วย | ภายในช่องเดียว (ใช้เมื่อกระดาษเฉลย สทศ. ระบายสองช่อง) เช่น mc "1|2" · complex "ใช่,ใช่|ไม่ใช่,ไม่ใช่"
  const ch = choices ? choices.split("||") : [], a = String(ans).split(","), isAlts = tok => tok.split("|");
  if (type === "mc") {
    if (ch.length && ch.length !== 4) bad(`ตัวเลือก ${ch.length} ตัว`);
    if (!/^[1-4](\|[1-4])*$/.test(ans) || new Set(ans.split("|")).size !== ans.split("|").length) bad(`เฉลยปรนัย "${ans}"`);
    if (!ch.length && !img) bad("ตัวเลือกว่างแต่ไม่มีภาพ");
    if (/ดูภาพ/.test(choices)) bad("ยังมีคำว่า (ดูภาพ)");
  } else if (type === "complex") {
    if (ch.length < 2 || a.length !== ch.length || a.some(x => isAlts(x).some(y => y !== "ใช่" && y !== "ไม่ใช่"))) bad("ข้อเชิงซ้อน: ข้อความย่อยกับเฉลย ใช่/ไม่ใช่ ไม่เท่ากัน");
  } else if (type === "order") {
    if (a.some(x => isAlts(x).some(y => !(+y >= 1 && +y <= ch.length)))) bad("เฉลยเรียงลำดับเกินจำนวนรายการ");
  } else if (type === "fill") {
    if (choices) bad("ข้อเติมคำต้องเว้นตัวเลือกว่าง");
    if (!ans) bad("ไม่มีเฉลย");
  }
  for (const [k, v] of [["โจทย์", stem], ["ตัวเลือก", choices], ["คำอธิบาย", exp]]) if (String(v).split("__").length % 2 !== 1) bad(`__ ไม่ครบคู่ใน${k}`);
  if (img && !/^https:\/\//.test(img)) {
    if (!fs.existsSync(at("images", img))) bad(`ไม่พบ images/${img}`);
    else if (!img.startsWith(`${level}-${year}-`)) bad(`ชื่อภาพ ${img} ไม่ตรงระดับ/ปี`);
  }
  if (!exp) bad("ไม่มีคำอธิบาย");
  return out;
}

// row: [itemNo, standard, indicator, stem, image, choices, answer, explanation, type="mc"]
export function writeTsv(level, year, rows) {
  const file = at("data", `questions-${level}-${year}.tsv`);
  const lines = rows.map(([no, std, ind, stem, img, choices, ans, exp, type = "mc"]) => {
    const cells = [level, String(year), String(no), std, ind, stem, img, choices, String(ans), exp, type];
    const p = problems(cells);
    if (p.length) throw new Error(`${level}-${year} ข้อ ${no}: ${p.join("; ")}`);
    return cells.join("\t");
  });
  const nos = rows.map(r => +r[0]);
  nos.forEach((n, i) => { if (n !== i + 1) throw new Error(`${level}-${year}: ลำดับข้อไม่ต่อเนื่องที่ ${n}`); });
  fs.writeFileSync(file, lines.join("\n") + "\n", "utf8");
  console.log(`data/questions-${level}-${year}.tsv`, lines.length, "ข้อ");
}
