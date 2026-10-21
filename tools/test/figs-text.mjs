// ตรวจตัวอักษรในภาพ SVG ของสรุปทุกภาพ (ป.6 และ ม.3) บนจอมือถือ 390 px: ขนาดที่เห็นจริงต้องไม่เล็กกว่า 11 px
//   node tools/test/figs-text.mjs [พอร์ต=8765]     (ต้องรัน tools/test/server.mjs ก่อน)
import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import { TOOLS, BLOCK_REAL_API } from "../lib.mjs";

const EDGE = ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "C:/Program Files/Microsoft/Edge/Application/msedge.exe"].find(f => fs.existsSync(f));
const cfg = JSON.parse(fs.readFileSync(path.join(TOOLS, ".cache", "admin.json"), "utf8"));
const b = await puppeteer.launch({ executablePath: EDGE, headless: true, args: BLOCK_REAL_API });
const p = await b.newPage(); await p.setViewport({ width: 390, height: 844, isMobile: true, deviceScaleFactor: 1 });
await p.goto(`http://localhost:${process.argv[2] || cfg.port}/`, { waitUntil: "networkidle0" });
const res = await p.evaluate(async () => {
  await document.fonts.ready;
  const out = [];
  for (const lv of ["P6", "M3"]) {
    S.level = lv; theme(); await loadFigs(lv);
    for (const n of new Set(Object.keys(FIG).concat(Object.keys(FIGS[lv])))) {
      const html = figOf(n); if (!html) continue;
      page('<article class="paper"><div class="rich"><figure>' + html + '</figure></div></article>', null);
      fitFigures(app);
      const svg = app.querySelector('figure svg'), vb = svg.getAttribute('viewBox').split(/\s+/).map(Number), sc = svg.getBoundingClientRect().width / vb[2];
      const sizes = [...svg.querySelectorAll('text')].filter(t => t.textContent.trim()).map(t => parseFloat(getComputedStyle(t).fontSize) * sc);
      out.push({ lv, n, min: sizes.length ? Math.min(...sizes) : 99, wide: !!app.querySelector('.figscroll.wide'), docW: document.documentElement.scrollWidth, texts: sizes.length });
    }
  }
  return out;
});
await b.close();
const bad = res.filter(r => r.min < 10.99), wide = res.filter(r => r.wide), over = res.filter(r => r.docW > 391);
console.log(`ภาพ SVG ${res.length} ภาพ · ตัวอักษรเล็กสุด ${Math.min(...res.map(r => r.min)).toFixed(2)} px · ต่ำกว่า 11px ${bad.length} ภาพ · ต้องเลื่อนดู ${wide.length} ภาพ · ดันหน้าให้กว้างเกินจอ ${over.length} ภาพ`);
bad.slice(0, 10).forEach(r => console.log("  ต่ำกว่า 11px:", r.lv, r.n, r.min.toFixed(2)));
over.slice(0, 5).forEach(r => console.log("  หน้ากว้างเกิน:", r.lv, r.n, r.docW));
process.exit(bad.length || over.length ? 1 : 0);
