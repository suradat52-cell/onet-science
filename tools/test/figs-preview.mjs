// ดูภาพ SVG ของสรุปเนื้อหาโดยไม่ต้องเปิดเว็บ: node tools/test/figs-preview.mjs M3 m3-particles m3-solubility ...
// ถ้าไม่ระบุชื่อ จะแสดงทุกภาพที่ยังไม่มีในไฟล์ tools/.cache/figs/seen-<ระดับ>.json (ภาพใหม่)
// ผล: tools/.cache/figs/<ชื่อ>.png (กว้าง 460px เท่าหน้าเว็บ) + รายงานป้ายที่ทับกัน/เกินกรอบ
import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import { at, TOOLS, BLOCK_REAL_API } from "../lib.mjs";

const [lv, ...names0] = process.argv.slice(2);
const EDGE = ["C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "C:/Program Files/Microsoft/Edge/Application/msedge.exe", "C:/Program Files/Google/Chrome/Application/chrome.exe"].find(f => fs.existsSync(f));
const OUT = path.join(TOOLS, ".cache", "figs"); fs.mkdirSync(OUT, { recursive: true });
const src = fs.readFileSync(at("figs", `${lv}.js`), "utf8");
const FIGS = { P6: {}, M3: {} };
new Function("FIGS", src)(FIGS);
const seenF = path.join(OUT, `seen-${lv}.json`), seen = fs.existsSync(seenF) ? JSON.parse(fs.readFileSync(seenF, "utf8")) : [];
const all = Object.keys(FIGS[lv]);
const names = names0.length ? names0 : all.filter(n => !seen.includes(n));
if (!names.length) { console.log("ไม่มีภาพใหม่ (ระบุชื่อภาพเพื่อดูซ้ำ)"); process.exit(0); }
const browser = await puppeteer.launch({ executablePath: EDGE, headless: true, args: BLOCK_REAL_API });
const page = await browser.newPage(); await page.setViewport({ width: 480, height: 800, deviceScaleFactor: 2 });
for (const n of names) {
  if (!FIGS[lv][n]) { console.log("ไม่มีภาพ", n); continue; }
  await page.setContent(`<!doctype html><meta charset="utf-8"><style>body{margin:10px;font-family:Sarabun,Tahoma,sans-serif;background:#fff;color:#111}figure{margin:0;max-width:460px}svg{width:100%;height:auto;font:11px Sarabun,Tahoma,sans-serif;fill:currentColor}</style><figure id="f">${FIGS[lv][n]}</figure>`);
  const probs = await page.evaluate(() => {
    const s = document.querySelector("svg"), vb = s.viewBox.baseVal, out = [];
    const texts = [...s.querySelectorAll("text")].map(t => { const b = t.getBBox(), tr = t.getAttribute("transform"); return { t: t.textContent, x: b.x, y: b.y, w: b.width, h: b.height, rot: !!tr }; });
    texts.forEach(a => { if (!a.rot && (a.x < -1 || a.x + a.w > vb.width + 1 || a.y < -1 || a.y + a.h > vb.height + 1)) out.push(`"${a.t}" เกินกรอบ`); });
    for (let p = 0; p < texts.length; p++) for (let q = p + 1; q < texts.length; q++) {
      const a = texts[p], b = texts[q]; if (!a.t.trim() || !b.t.trim()) continue;
      const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x), oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
      if (ox > 2 && oy > 0.55 * Math.min(a.h, b.h)) out.push(`"${a.t}" ทับ "${b.t}"`);
    }
    return out;
  });
  await (await page.$("#f")).screenshot({ path: path.join(OUT, `${n}.png`) });
  console.log(n, probs.length ? "ปัญหา: " + probs.join(" | ") : "ป้ายไม่ทับ/ไม่เกินกรอบ");
}
if (!names0.length) fs.writeFileSync(seenF, JSON.stringify([...new Set([...seen, ...names])]));
await browser.close();
