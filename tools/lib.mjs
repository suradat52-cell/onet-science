// ค่ากลางที่สคริปต์ใน tools/ ใช้ร่วมกัน
import path from "path";
import { fileURLToPath } from "url";

export const TOOLS = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.dirname(TOOLS);
export const CACHE = path.join(TOOLS, ".cache"); // ภาพเรนเดอร์หน้า PDF (ไม่เข้า repo)
export const at = (...p) => path.join(ROOT, ...p);
export const pageFile = (lv, year, page, dpi = 200) => path.join(CACHE, `${lv}-${year}`, `${dpi}`, `p-${String(page).padStart(2, "0")}.png`);
export const LEVELS = ["P6", "M3"];
// คะแนนต่อข้อตามผัง 2569 — ต้องตรงกับ POINTS ใน apps-script/Code.gs
export const POINTS = { P6: { mc: 5, complex: 5, order: 5, fill: 5 }, M3: { mc: 2.75, complex: 4, order: 2.75, fill: 2.75 } };
// เกณฑ์คะแนนบางส่วนของข้อเชิงซ้อนตามคำชี้แจงแต่ละฉบับ — อ่านจาก PARTIAL ใน Code.gs โดยตรงเพื่อไม่ให้สองที่ไม่ตรงกัน
import fs from "fs";
const gs = fs.readFileSync(path.join(ROOT, "apps-script", "Code.gs"), "utf8");
export const PARTIAL = new Function(gs.match(/const HALF = .*;/)[0] + " return " + gs.match(/const PARTIAL = (\{[\s\S]*?\n\});/)[1])();
// คะแนนที่ควรได้ (คำนวณแยกจาก Code.gs) — ans/key เป็น "ใช่,ไม่ใช่,…" สำหรับข้อเชิงซ้อน
// เฉลยหลายคำตอบ (สทศ. ระบายสองช่อง): คั่นด้วย | ในช่องเดียว เช่น ปรนัย "1|2" · เชิงซ้อน "ใช่,ใช่|ไม่ใช่,ไม่ใช่"
export const alts = tok => String(tok).split("|");
export const tokOk = (v, k) => alts(k).includes(v);
export function isRight(type, ans, key) {
  if (ans === "") return false;
  if (type === "complex" || type === "order") { const a = ans.split(","), k = key.split(","); return a.length === k.length && k.every((t, i) => tokOk(a[i], t)); }
  return tokOk(ans, key);
}
export function expectedScore(lv, year, type, ans, key) {
  const full = POINTS[lv][type];
  if (isRight(type, ans, key)) return full;
  if (type !== "complex") return 0;
  const rule = PARTIAL[`${lv}-${year}`] || {}, a = ans.split(","), k = key.split(",");
  return Math.round((rule[k.filter((v, i) => tokOk(a[i], v)).length] || 0) * full * 100) / 100;
}
// ไฟล์ภาพทั้งหมดของหนึ่งแถว TSV: ลิงก์รูป (คอลัมน์ 7) + ข้อความย่อย/ตัวเลือกที่เป็นชื่อไฟล์ภาพล้วน (เช่น M3-2567-34-1.png)
export const IMG_NAME = /^[\w.-]+\.(png|jpe?g|gif|webp)$/i;
export const imgsOf = c => [c[6], ...(c[7] || "").split("||")].map(s => (s || "").trim()).filter(s => IMG_NAME.test(s));

// ชุดทดสอบเบราว์เซอร์ต้องคุยกับเซิร์ฟเวอร์จำลอง (/api) เท่านั้น: บล็อกการเชื่อมต่อไป Apps Script จริง ถ้าหลุดไปจะ error ทันที
export const BLOCK_REAL_API = ['--host-resolver-rules=MAP script.google.com ~NOTFOUND, MAP script.googleusercontent.com ~NOTFOUND'];
