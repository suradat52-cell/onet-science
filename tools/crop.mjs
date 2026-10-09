// ครอปภาพประกอบข้อสอบจากหน้า 200 dpi ตามไฟล์ tools/crops/<ระดับ>-<ปี>.json แล้วบันทึกที่ images/
// รูปแบบ: { "P6-2567-04.png": [[หน้า, x0, y0, x1, y1], ...] }  หลายส่วนจะต่อกันแนวตั้งเป็นภาพเดียว
// node tools/crop.mjs P6 2567 [ชื่อไฟล์,...]      ต้องรัน render.mjs ที่ 200 dpi ก่อน
// node tools/crop.mjs --peek <ภาพ.png> <ออก.png> x0 y0 x1 y1   ครอปดูเฉพาะจุด (ค่า ≤1 = สัดส่วน)
import sharp from "sharp";
import fs from "fs";
import { at, pageFile } from "./lib.mjs";

const args = process.argv.slice(2);
if (args[0] === "--peek") {
  const [, inp, out, ...c] = args, m = await sharp(inp).metadata();
  const px = (v, full) => Math.round(+v <= 1 ? +v * full : +v);
  const [l, t, r, b] = [px(c[0], m.width), px(c[1], m.height), px(c[2], m.width), px(c[3], m.height)];
  await sharp(inp).extract({ left: l, top: t, width: r - l, height: b - t }).png().toFile(out);
  console.log(out, `${r - l}x${b - t}`);
  process.exit(0);
}
const [lv, year, only] = args;
const specFile = at("tools", "crops", `${lv}-${year}.json`);
const spec = JSON.parse(fs.readFileSync(specFile, "utf8").replace(/^﻿/, ""));
for (const [name, regions] of Object.entries(spec)) {
  if (only && !only.split(",").includes(name)) continue;
  const parts = [];
  for (const [page, x0, y0, x1, y1] of regions)
    parts.push(await sharp(pageFile(lv, year, page)).extract({ left: x0, top: y0, width: x1 - x0, height: y1 - y0 }).png().toBuffer());
  const metas = await Promise.all(parts.map(b => sharp(b).metadata()));
  const W = Math.max(...metas.map(m => m.width)), gap = 24;
  const H = metas.reduce((s, m) => s + m.height, 0) + gap * (parts.length - 1);
  let y = 0;
  const comp = parts.map((b, i) => { const o = { input: b, left: 0, top: y }; y += metas[i].height + gap; return o; });
  await sharp({ create: { width: W, height: H, channels: 3, background: "#ffffff" } }).composite(comp).png().toFile(at("images", name));
  console.log(name, `${W}x${H}`);
}
