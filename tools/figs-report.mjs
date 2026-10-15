// รายชื่อภาพ SVG ในสรุปที่ควรวาดใหม่ให้แคบ/เป็นแนวตั้ง (ตัวอักษร ≥ 11 px โดยไม่ต้องเลื่อน) เรียงตามมาตรฐานที่ออกสอบบ่อย
//   node tools/figs-report.mjs [พอร์ต=8765]     (ต้องรัน tools/test/server.mjs ก่อน) → design/FIGS-REDRAW.md (ยังไม่ต้องวาดจริง)
// เกณฑ์: ภาพที่ viewBox กว้างเกิน (ความกว้างที่เนื้อหาจอมือถือให้ได้ × ตัวอักษรเล็กสุดของภาพ ÷ 11) ต้องเลื่อนดู → ควรวาดใหม่ให้กว้างไม่เกินค่านี้ (≈ 250 หน่วย) แนวตั้ง
// ลำดับความสำคัญ = จำนวนข้อสอบจริงในคลังของมาตรฐานที่ใช้ภาพนั้น (ยิ่งออกบ่อยยิ่งก่อน) แล้วค่อยดูว่าภาพต้องเลื่อนมากแค่ไหน
import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import { ROOT, TOOLS, BLOCK_REAL_API } from "./lib.mjs";

const EDGE = ["C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "C:/Program Files/Microsoft/Edge/Application/msedge.exe", "C:/Program Files/Google/Chrome/Application/chrome.exe"].find(f => fs.existsSync(f));
const cfg = JSON.parse(fs.readFileSync(path.join(TOOLS, ".cache", "admin.json"), "utf8"));
const AVAIL = 326; // ความกว้างพื้นที่เนื้อหาบนมือถือ 390 px (การ์ดกระดาษ)
// ภาพไหนถูกใช้ในสรุปมาตรฐานไหน
const refs = {};
const sd = path.join(ROOT, "data", "summaries");
for (const f of fs.readdirSync(sd).filter(f => /^(P6|M3)-.*\.txt$/.test(f))) {
  const [lv, std] = f.replace(/\.txt$/, "").split("-");
  for (const m of fs.readFileSync(path.join(sd, f), "utf8").matchAll(/\[\[fig:([\w-]+)/g)) { const k = lv + "|" + m[1]; (refs[k] = refs[k] || new Set()).add("ว " + std); }
}
const b = await puppeteer.launch({ executablePath: EDGE, headless: true, args: BLOCK_REAL_API });
const p = await b.newPage(); await p.setViewport({ width: 390, height: 844, isMobile: true });
await p.goto(`http://localhost:${process.argv[2] || cfg.port}/`, { waitUntil: "networkidle0" });
const figs = await p.evaluate(async () => {
  await document.fonts.ready; const out = [];
  for (const lv of ["P6", "M3"]) { S.level = lv; await loadFigs(lv);
    for (const n of new Set(Object.keys(FIG).concat(Object.keys(FIGS[lv])))) {
      const html = figOf(n); if (!html) continue;
      page('<article class="paper"><div class="rich"><figure>' + html + '</figure></div></article>', null);
      const svg = app.querySelector("figure svg"), vb = svg.getAttribute("viewBox").split(/\s+/).map(Number);
      const tx = [...svg.querySelectorAll("text")].filter(t => t.textContent.trim()), minFs = tx.length ? Math.min(...tx.map(t => parseFloat(getComputedStyle(t).fontSize))) : 11;
      out.push({ lv, n, w: Math.round(vb[2]), h: Math.round(vb[3]), minFs: +minFs.toFixed(1), texts: tx.length, label: svg.getAttribute("aria-label") || "" });
    } }
  return out;
});
const bank = {};
for (const lv of ["P6", "M3"]) { const meta = JSON.parse(fs.readFileSync(path.join(ROOT, "content", lv, "meta.json"), "utf8")); meta.standards.forEach(s => { bank[lv + "|" + s.standard] = s.bank; }); }
await b.close();
const rows = figs.filter(f => refs[f.lv + "|" + f.n]).map(f => {
  const need = Math.ceil(f.w * 11 / f.minFs), stds = [...refs[f.lv + "|" + f.n]];
  return { ...f, need, ratio: +(need / AVAIL).toFixed(2), stds, freq: Math.max(...stds.map(s => bank[f.lv + "|" + s] || 0)), maxW: Math.floor(AVAIL * f.minFs / 11) };
});
rows.sort((a, c) => c.freq - a.freq || c.ratio - a.ratio);
const wide = rows.filter(r => r.ratio > 1);
let md = `# ภาพ SVG ในสรุปที่ควรวาดใหม่ (แนวตั้ง/แคบ)\n\nสร้างโดย \`node tools/figs-report.mjs\` · พื้นที่เนื้อหาบนมือถือ ${AVAIL} px · ตัวอักษรเล็กสุดต้อง ≥ 11 px\n\n` +
  `- ภาพที่ใช้ในสรุปจริง ${rows.length} ภาพ · ต้องเลื่อนดูซ้าย-ขวา ${wide.length} ภาพ (${Math.round(wide.length * 100 / rows.length)}%) · แตะเต็มจอ/หมุนจอช่วยได้แล้ว แต่วาดใหม่ให้แคบจะอ่านสบายสุด\n- "ความกว้างสูงสุดที่ไม่ต้องเลื่อน" = viewBox กว้างไม่เกินค่านี้ (ถ้าตัวอักษรเล็กสุดของภาพเท่าเดิม) — วาดใหม่เป็นแนวตั้ง กว้าง ≤ ค่านี้ สูงได้ตามต้องการ\n- เรียงตาม: จำนวนข้อสอบจริงในคลังของมาตรฐานที่ใช้ภาพ (มาก → น้อย) แล้วตามด้วยว่าภาพกว้างเกินแค่ไหน\n\n` +
  `| ลำดับ | ระดับ | ภาพ | มาตรฐานที่ใช้ | ข้อสอบจริงในคลัง | ตอนนี้ viewBox | ตัวอักษรเล็กสุด | ต้องกว้าง (px) | เกินจอ (เท่า) | ควรวาดให้กว้าง ≤ |\n|---|---|---|---|---|---|---|---|---|---|\n` +
  wide.map((r, i) => `| ${i + 1} | ${r.lv === "P6" ? "ป.6" : "ม.3"} | \`${r.n}\` ${r.label ? "— " + r.label : ""} | ${r.stds.join(", ")} | ${r.freq} | ${r.w}×${r.h} | ${r.minFs} | ${r.need} | ${r.ratio} | ${r.maxW} |`).join("\n") + "\n\n## สรุปตามมาตรฐาน (ภาพที่ต้องเลื่อน)\n\n| ระดับ | มาตรฐาน | ข้อสอบจริงในคลัง | จำนวนภาพที่ควรวาดใหม่ |\n|---|---|---|---|\n";
const by = {}; wide.forEach(r => r.stds.forEach(s => { const k = r.lv + "|" + s; by[k] = (by[k] || 0) + 1; }));
md += Object.entries(by).sort((a, c) => (bank[c[0]] || 0) - (bank[a[0]] || 0)).map(([k, n]) => `| ${k.split("|")[0] === "P6" ? "ป.6" : "ม.3"} | ${k.split("|")[1]} | ${bank[k] || 0} | ${n} |`).join("\n") + "\n";
fs.mkdirSync(path.join(ROOT, "design"), { recursive: true }); fs.writeFileSync(path.join(ROOT, "design", "FIGS-REDRAW.md"), md);
console.log(`ภาพที่ใช้ในสรุป ${rows.length} · ต้องเลื่อน ${wide.length} · เขียน design/FIGS-REDRAW.md แล้ว`);
console.log(wide.slice(0, 8).map(r => `${r.lv} ${r.n} (ข้อสอบ ${r.freq} ข้อ, เกินจอ ${r.ratio}×)`).join("\n"));
