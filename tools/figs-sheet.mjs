// แผ่นรวมภาพ SVG ของสรุป (ขนาดจริงบนมือถือ กว้าง 300 px) + ตรวจตัวอักษร ≥ 12 px และป้ายที่ซ้อนทับกัน
//   node tools/figs-sheet.mjs <P6|M3> <ชื่อภาพ ...>     → tools/.cache/figs/sheet-<ระดับ>-<n>.png (6 ภาพต่อแผ่น) และรายงาน
//   ถ้าไม่ระบุชื่อ = ทุกภาพที่ถูกใช้ในสรุปของมาตรฐานต้นแบบ (P6 ว 2.1, M3 ว 2.3)
import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import { ROOT, TOOLS, BLOCK_REAL_API } from "./lib.mjs";

const [lv, ...names0] = process.argv.slice(2);
const std = lv === "P6" ? "2.1" : "2.3";
const used = [...new Set([...fs.readFileSync(path.join(ROOT, "data", "summaries", `${lv}-${std}.txt`), "utf8").matchAll(/\[\[fig:([\w-]+)/g)].map(m => m[1]))];
const FIGS = { P6: {}, M3: {} }; new Function("FIGS", fs.readFileSync(path.join(ROOT, "figs", `${lv}.js`), "utf8"))(FIGS);
const names = names0[0] === "all" ? Object.keys(FIGS[lv]) : names0.length ? names0 : used;
const OUT = path.join(TOOLS, ".cache", "figs"); fs.mkdirSync(OUT, { recursive: true });
const EDGE = ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"].find(f => fs.existsSync(f));
const b = await puppeteer.launch({ executablePath: EDGE, headless: true, args: BLOCK_REAL_API });
const p = await b.newPage(); await p.setViewport({ width: 960, height: 900, deviceScaleFactor: 1.5 });
const css = `body{margin:0;padding:10px;background:#e5e7eb;font:13px 'Noto Sans Thai',Sarabun,sans-serif;display:grid;grid-template-columns:repeat(3,316px);gap:10px;align-items:start}
.c{background:#f7f8fd;border:1px solid #bbb;padding:8px;color:#151a33}.c small{display:block;color:#555;font-size:10px;margin-bottom:4px}
.c svg{display:block;width:300px;height:auto;font:11px 'Noto Sans Thai',Sarabun,sans-serif;fill:currentColor}`;
const rep = [];
for (let i = 0; i < names.length; i += 6) {
  const grp = names.slice(i, i + 6);
  await p.setContent(`<style>${css}</style>` + grp.map(n => `<div class="c"><small>${n}</small>${FIGS[lv][n] || "<i>ไม่มีภาพ</i>"}</div>`).join(""));
  await p.evaluate(() => document.fonts.ready);
  const r = await p.evaluate(() => [...document.querySelectorAll(".c")].map(c => {
    const s = c.querySelector("svg"); if (!s) return { n: c.querySelector("small").textContent, err: "ไม่มีภาพ" };
    const vb = s.viewBox.baseVal, sc = s.getBoundingClientRect().width / vb.width, t = [...s.querySelectorAll("text")].filter(x => x.textContent.trim());
    const boxes = t.map(x => ({ x, r: x.getBBox(), s: x.textContent.trim() }));
    const sizes = t.map(x => parseFloat(getComputedStyle(x).fontSize) * sc);
    const ov = [], out = [];
    for (let a = 0; a < boxes.length; a++) {
      const A = boxes[a].r; if (A.x < -1 || A.y < -1 || A.x + A.width > vb.width + 1 || A.y + A.height > vb.height + 1) out.push(boxes[a].s);
      for (let k = a + 1; k < boxes.length; k++) { const B = boxes[k].r; if (A.x < B.x + B.width - 1.5 && B.x < A.x + A.width - 1.5 && A.y < B.y + B.height - 2.5 && B.y < A.y + A.height - 2.5) ov.push(boxes[a].s + " × " + boxes[k].s); }
    }
    return { n: c.querySelector("small").textContent, vb: vb.width + "x" + vb.height, min: t.length ? Math.min(...sizes) : 99, ov, out };
  }));
  rep.push(...r);
  await p.screenshot({ path: path.join(OUT, `sheet-${lv}-${Math.floor(i / 6) + 1}.png`), fullPage: true });
}
await b.close();
for (const r of rep) console.log(r.err ? `✗ ${r.n}: ${r.err}` : `${r.min >= 11.95 && !r.ov.length && !r.out.length ? "✓" : "✗"} ${r.n.padEnd(20)} ${r.vb} · ตัวอักษรเล็กสุด ${r.min.toFixed(1)} px` + (r.ov.length ? ` · ทับกัน: ${r.ov.slice(0, 4).join(" | ")}` : "") + (r.out.length ? ` · เกินกรอบ: ${r.out.slice(0, 3).join(" | ")}` : ""));
process.exitCode = rep.some(r => r.err || r.min < 11.95 || r.ov.length || r.out.length) ? 1 : 0;
