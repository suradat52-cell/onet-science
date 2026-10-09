// รวมภาพใน images/ ที่ขึ้นต้นด้วยคำนำหน้าเดียวกันเป็นแผ่นเดียว (มีชื่อไฟล์กำกับ) ไว้เปิดตรวจครอปทีละหลายภาพ
// node tools/contact.mjs M3-2564 [คอลัมน์=3] [ความกว้างช่อง=520]   → tools/.cache/contact-M3-2564-<n>.png (แผ่นละ 9 ภาพ)
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { at, CACHE } from "./lib.mjs";

const [prefix, colsArg, wArg] = process.argv.slice(2);
const cols = +colsArg || 3, cw = +wArg || 520, per = cols * 3, label = 34, pad = 12;
const files = fs.readdirSync(at("images")).filter(f => f.startsWith(prefix) && /\.(png|webp)$/.test(f)).sort();
for (let s = 0; s * per < files.length; s++) {
  const batch = files.slice(s * per, (s + 1) * per);
  const cells = await Promise.all(batch.map(async f => {
    const img = await sharp(at("images", f)).resize({ width: cw, height: cw, fit: "inside" }).png().toBuffer();
    const m = await sharp(img).metadata();
    return { f, img, w: m.width, h: m.height };
  }));
  const rows = [];
  for (let i = 0; i < cells.length; i += cols) rows.push(cells.slice(i, i + cols));
  const rowH = rows.map(r => Math.max(...r.map(c => c.h)) + label + pad);
  const W = cols * (cw + pad) + pad, H = rowH.reduce((a, b) => a + b, 0) + pad;
  const comp = [];
  let y = pad;
  rows.forEach((r, ri) => {
    r.forEach((c, ci) => {
      const x = pad + ci * (cw + pad);
      const svg = `<svg width="${cw}" height="${label}"><rect width="100%" height="100%" fill="#222"/><text x="6" y="24" font-size="20" font-family="Arial" fill="#fff">${c.f} (${c.w}x${c.h})</text></svg>`;
      comp.push({ input: Buffer.from(svg), left: x, top: y });
      comp.push({ input: c.img, left: x, top: y + label });
    });
    y += rowH[ri];
  });
  const out = path.join(CACHE, `contact-${prefix}-${s + 1}.png`);
  await sharp({ create: { width: W, height: H, channels: 3, background: "#bbb" } }).composite(comp).png().toFile(out);
  console.log(out, batch.length);
}
