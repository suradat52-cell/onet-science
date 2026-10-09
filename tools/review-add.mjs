// เพิ่มหัวข้อมาตรฐานใหม่ในส่วน "สรุปเนื้อหา" ของ data/REVIEW.md : node tools/review-add.mjs "ม.3 ว 2.1" bullets.txt
// (bullets.txt = รายการ "- ..." ที่ต้องให้ครูตรวจ) ถ้ามีหัวข้อนี้อยู่แล้วจะแทนที่เนื้อหาเดิม
import fs from "fs";
import { at } from "./lib.mjs";
const [title, file] = process.argv.slice(2);
const f = at("data", "REVIEW.md"); let t = fs.readFileSync(f, "utf8");
const body = fs.readFileSync(file, "utf8").trim();
const mark = "## ข้อควรรู้เกี่ยวกับรูปแบบสมการ";
const head = `## ${title}\n`;
const i = t.indexOf(head);
if (i >= 0) { const j = t.indexOf("\n## ", i + head.length); t = t.slice(0, i) + head + body + "\n" + t.slice(j); }
else t = t.replace(mark, head + body + "\n\n" + mark);
fs.writeFileSync(f, t);
console.log("เพิ่ม/แทนที่ REVIEW:", title);
