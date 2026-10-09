// เรนเดอร์หน้า PDF ต้นฉบับเป็น PNG ไว้ที่ tools/.cache/<ระดับ>-<ปี>/<dpi>/p-NN.png
// node tools/render.mjs P6 2567 [dpi=200] [หน้า เช่น 1-5,8]   (ใช้ dpi 100 สำหรับอ่าน, 200 สำหรับครอป)
import * as mupdf from "mupdf";
import fs from "fs";
import path from "path";
import { at, pageFile } from "./lib.mjs";

const [, , lv, year, dpiArg = "200", pagesArg] = process.argv;
if (!lv || !year) { console.error("ใช้: node tools/render.mjs P6 2567 [dpi] [pages]"); process.exit(1); }
const dpi = +dpiArg;
const doc = mupdf.Document.openDocument(fs.readFileSync(at("source", `${lv}-${year}.pdf`)), "application/pdf");
const n = doc.countPages();
let pages = [];
if (pagesArg) for (const part of pagesArg.split(",")) { const [a, b] = part.split("-").map(Number); for (let p = a; p <= (b || a); p++) pages.push(p); }
else pages = Array.from({ length: n }, (_, i) => i + 1);
for (const p of pages) {
  const out = pageFile(lv, year, p, dpi);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const pix = doc.loadPage(p - 1).toPixmap(mupdf.Matrix.scale(dpi / 72, dpi / 72), mupdf.ColorSpace.DeviceRGB, false, true);
  fs.writeFileSync(out, pix.asPNG());
}
console.log(`${lv}-${year}: ${pages.length}/${n} หน้า @ ${dpi} dpi → ${path.dirname(pageFile(lv, year, 1, dpi))}`);
