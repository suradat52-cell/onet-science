// วางทุกหน้าของ PDF เป็นตารางภาพเดียว ใช้ตรวจว่าภาพไม่ขาดข้ามหน้าตอนพิมพ์
// node tools/sheet.mjs file.pdf out.png [cols=7] [dpi=40] [หน้าเริ่ม=1] [หน้าสุดท้าย=ทั้งหมด]
import * as mupdf from "mupdf";
import sharp from "sharp";
import fs from "fs";

const [, , file, out, colsArg = "7", dpiArg = "40", fromArg = "1", toArg = "9999"] = process.argv;
const doc = mupdf.Document.openDocument(fs.readFileSync(file), "application/pdf");
const total = doc.countPages(), a = Math.max(1, +fromArg) - 1, n = Math.min(total, +toArg) - a, cols = +colsArg, dpi = +dpiArg, tiles = [];
for (let i = a; i < a + n; i++)
  tiles.push(Buffer.from(doc.loadPage(i).toPixmap(mupdf.Matrix.scale(dpi / 72, dpi / 72), mupdf.ColorSpace.DeviceRGB, false, true).asPNG()));
const m = await sharp(tiles[0]).metadata(), W = m.width + 8, H = m.height + 8;
await sharp({ create: { width: W * cols, height: H * Math.ceil(n / cols), channels: 3, background: "#888" } })
  .composite(tiles.map((t, i) => ({ input: t, left: (i % cols) * W + 4, top: Math.floor(i / cols) * H + 4 }))).png().toFile(out);
console.log(file, "pages", total, "(แสดงหน้า " + (a + 1) + "-" + (a + n) + ")");
