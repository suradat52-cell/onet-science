// ภาพหน้าจอมือถือ (360 px) และภาพหน้า PDF ของหน้าสรุปเนื้อหา สำหรับต้นแบบรูปแบบสรุปใหม่
//   node tools/proto-shots.mjs <ชื่อชุด=before|after> [ระดับ|มาตรฐาน ...]     (ต้องรัน tools/test/server.mjs ก่อน)
//   ผล: review/proto/<ชุด>/<ระดับ>-<มาตรฐาน>-m<n>.png (ตัดเป็นแผ่นสูง 1800 px) · -p<n>.png (หน้า PDF) · <ระดับ>-<มาตรฐาน>.pdf · และรายงานการล้นแนวนอน
import puppeteer from "puppeteer-core";
import * as mupdf from "mupdf";
import fs from "fs";
import path from "path";
import { ROOT, TOOLS, BLOCK_REAL_API } from "./lib.mjs";

const [set = "before", ...rest] = process.argv.slice(2);
const targets = rest.length ? rest.map(x => x.split("|")) : [["P6", "ว 2.1"], ["M3", "ว 2.3"]];
const EDGE = ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "C:/Program Files/Microsoft/Edge/Application/msedge.exe"].find(f => fs.existsSync(f));
const cfg = JSON.parse(fs.readFileSync(process.env.ONET_CFG || path.join(TOOLS, ".cache", "admin.json"), "utf8")); // ONET_CFG = admin.json ของเซิร์ฟเวอร์จำลองอีกตัว (ใช้เทียบก่อน/หลัง)
const OUT = path.join(ROOT, "review", "proto", set); fs.mkdirSync(OUT, { recursive: true });
fs.readdirSync(OUT).forEach(f => fs.unlinkSync(path.join(OUT, f)));
const SLICE = 1800;
const b = await puppeteer.launch({ executablePath: EDGE, headless: true, args: BLOCK_REAL_API });
const p = await b.newPage(); p.on("pageerror", e => console.log("JS error:", e.message));
const result = [];
for (const [lv, std] of targets) {
  const tag = `${lv}-${std.replace(/\s/g, "")}`;
  await p.setViewport({ width: 360, height: 800, deviceScaleFactor: 1.5, isMobile: true, hasTouch: true });
  await p.goto(`http://localhost:${cfg.port}/`, { waitUntil: "networkidle0" }); await p.evaluate(() => localStorage.clear());
  await p.goto(`http://localhost:${cfg.port}/`, { waitUntil: "networkidle0" });
  await p.type("#cc", cfg.rooms[lv]); await p.$eval("#cf button", x => x.click());
  await p.waitForSelector('button[data-a="pick"]'); await p.$eval('button[data-a="pick"]', x => x.click()); await p.waitForSelector(".scard");
  await p.evaluate(s => study(s, ""), std); await p.waitForSelector(".rich"); await p.waitForNetworkIdle({ idleTime: 400 });
  await new Promise(r => setTimeout(r, 400));
  // ตรวจการล้นแนวนอนและขนาดตัวอักษรเล็กสุด
  const m = await p.evaluate(() => {
    const w = document.documentElement.clientWidth;
    const over = [...document.querySelectorAll(".rich *, .paper *")].filter(e => !e.closest("svg") && e.getBoundingClientRect().right > w + 1).map(e => e.tagName.toLowerCase() + "." + e.className + ":" + e.textContent.slice(0, 24));
    const scrollers = [...document.querySelectorAll(".paper *")].filter(e => !e.closest("svg") && e.scrollWidth > e.clientWidth + 1 && /auto|scroll/.test(getComputedStyle(e).overflowX)).map(e => e.tagName.toLowerCase() + "." + e.className);
    const svgMin = [...document.querySelectorAll(".paper figure svg")].map(s => { const vb = s.viewBox.baseVal, sc = s.getBoundingClientRect().width / vb.width, t = [...s.querySelectorAll("text")].filter(x => x.textContent.trim()); return { label: s.getAttribute("aria-label"), min: t.length ? Math.min(...t.map(x => parseFloat(getComputedStyle(x).fontSize) * sc)) : 99 }; });
    const small = [...document.querySelectorAll(".paper .rich *")].filter(e => !e.closest("svg") && e.childNodes.length && [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) && parseFloat(getComputedStyle(e).fontSize) < 12).length;
    return { w, scrollW: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight, over: over.slice(0, 6), scrollers: scrollers.slice(0, 6), svgMin, small, figs: svgMin.length };
  });
  result.push({ tag, ...m });
  for (let i = 0, y = 0; y < m.h; i++, y += SLICE) await p.screenshot({ path: path.join(OUT, `${tag}-m${String(i + 1).padStart(2, "0")}.png`), clip: { x: 0, y, width: 360, height: Math.min(SLICE, m.h - y) }, captureBeyondViewport: true });
  // PDF (ขั้นตอนเดียวกับปุ่ม "ดาวน์โหลดสรุป PDF")
  await p.evaluate(() => { window.print = () => {}; ACT.pdf(); });
  await p.emulateMediaType("print");
  const buf = await p.pdf({ format: "A4", margin: { top: "12mm", bottom: "12mm", left: "12mm", right: "12mm" }, printBackground: true });
  await p.emulateMediaType(null);
  await p.evaluate(() => { if (typeof cleanupPrint === "function") cleanupPrint(); });
  fs.writeFileSync(path.join(OUT, `${tag}.pdf`), buf);
  const doc = mupdf.Document.openDocument(buf, "application/pdf"), n = doc.countPages();
  for (let i = 0; i < n; i++) fs.writeFileSync(path.join(OUT, `${tag}-p${String(i + 1).padStart(2, "0")}.png`), doc.loadPage(i).toPixmap(mupdf.Matrix.scale(1.1, 1.1), mupdf.ColorSpace.DeviceRGB, false, true).asPNG());
  result.at(-1).pdfPages = n;
}
await b.close();
fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify(result, null, 1));
for (const r of result) console.log(`${r.tag}: สูง ${r.h}px · scrollWidth ${r.scrollW}/${r.w} · PDF ${r.pdfPages} หน้า · ภาพ ${r.figs} · ตัวอักษร<12px ${r.small} จุด · เลื่อนแนวนอน ${r.scrollers.length ? r.scrollers.join(",") : "ไม่มี"} · ล้นจอ ${r.over.length ? r.over.join(" | ") : "ไม่มี"}\n  ภาพเล็กสุด: ` + r.svgMin.map(s => s.label + "=" + s.min.toFixed(1)).join(", "));
