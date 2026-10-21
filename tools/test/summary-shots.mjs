// เรนเดอร์หน้าสรุปเนื้อหาของมาตรฐานหนึ่ง: ภาพหน้าจอมือถือ (ตัดเป็นแผ่น) + PDF + ตรวจป้ายทับกัน/ข้อความล้นของ SVG
// node tools/test/summary-shots.mjs P6 "ว 2.1"   (ต้องเปิด tools/test/server.mjs ค้างไว้)
// ผล: tools/.cache/summary/<ระดับ>-<มาตรฐาน>-m<n>.png, -print.pdf และรายงานปัญหาของ SVG
import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import { TOOLS, BLOCK_REAL_API } from "../lib.mjs";

const [lv, std] = process.argv.slice(2);
const EDGE = ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "C:/Program Files/Microsoft/Edge/Application/msedge.exe"].find(f => fs.existsSync(f));
const cfg = JSON.parse(fs.readFileSync(path.join(TOOLS, ".cache", "admin.json"), "utf8"));
const OUT = path.join(TOOLS, ".cache", "summary"); fs.mkdirSync(OUT, { recursive: true });
const tag = `${lv}-${std.replace(/\s/g, "")}`;
const browser = await puppeteer.launch({ executablePath: EDGE, headless: true, args: BLOCK_REAL_API });
const page = await browser.newPage();
page.on("pageerror", e => console.log("JS error:", e.message));
async function open() {
  await page.goto(`http://localhost:${cfg.port}/`, { waitUntil: "networkidle0" });
  await page.evaluate(() => localStorage.clear());
  await page.goto(`http://localhost:${cfg.port}/`, { waitUntil: "networkidle0" });
  await page.$eval(`button[data-a="lv"][data-l="${lv}"]`, b => b.click()); await page.waitForNetworkIdle({ idleTime: 250 });
  await page.$eval('button[data-a="pick"]', b => b.click()); await page.waitForNetworkIdle({ idleTime: 250 });
  await page.waitForSelector(`button.ghost[data-a="study"][data-std="${std}"]`);
  await page.$eval(`button.ghost[data-a="study"][data-std="${std}"]`, b => b.click());
  await page.waitForSelector(".rich"); await page.waitForNetworkIdle({ idleTime: 400 });
}

// 1) มือถือ 390px
await page.setViewport({ width: 390, height: 800, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await open();
const info = await page.evaluate(() => {
  const w = document.documentElement.clientWidth, over = [...document.querySelectorAll(".rich *")].filter(e => e.getBoundingClientRect().right > w + 1 && !e.closest(".scroll") && !e.closest("svg")).map(e => e.tagName + ":" + e.textContent.slice(0, 20));
  return { scrollW: document.documentElement.scrollWidth, w, over: over.slice(0, 8), figs: document.querySelectorAll("figure svg").length, h: document.documentElement.scrollHeight };
});
console.log("มือถือ: กว้างหน้า", info.w, "scrollWidth", info.scrollW, "ภาพ", info.figs, "สูง", info.h, info.over.length ? "ล้น: " + info.over.join(" | ") : "ไม่ล้น");
// ตรวจ SVG: ข้อความซ้อนทับกัน และข้อความเกินกรอบ viewBox
const svgProblems = await page.evaluate(() => {
  const out = [];
  document.querySelectorAll("figure svg").forEach((s, i) => {
    const vb = s.viewBox.baseVal, cap = s.getAttribute("aria-label");
    const texts = [...s.querySelectorAll("text")].map(t => { const b = t.getBBox(); return { t: t.textContent, x: b.x, y: b.y, w: b.width, h: b.height, rot: !!t.getAttribute("transform") }; });
    texts.forEach(a => { if (!a.rot && (a.x < -1 || a.x + a.w > vb.width + 1 || a.y < -1 || a.y + a.h > vb.height + 1)) out.push(`#${i + 1} ${cap}: "${a.t}" เกินกรอบภาพ`); });
    for (let p = 0; p < texts.length; p++) for (let q = p + 1; q < texts.length; q++) {
      const a = texts[p], b = texts[q], ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x), oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
      if (ox > 2 && oy > 0.55 * Math.min(a.h, b.h)) out.push(`#${i + 1} ${cap}: "${a.t}" ทับ "${b.t}"`);
    }
  });
  return out;
});
console.log(svgProblems.length ? "ปัญหา SVG:\n  " + svgProblems.join("\n  ") : "ป้ายใน SVG ไม่ทับกันและไม่เกินกรอบ");
const H = await page.evaluate(() => document.documentElement.scrollHeight), SLICE = 1700;
for (let i = 0, y = 0; y < H; i++, y += SLICE) { await page.screenshot({ path: path.join(OUT, `${tag}-m${i + 1}.png`), clip: { x: 0, y, width: 390, height: Math.min(SLICE, H - y) }, captureBeyondViewport: true }); }
{ const els = await page.$$("figure"); for (const [i, el] of els.entries()) { await el.scrollIntoView(); await el.screenshot({ path: path.join(OUT, `${tag}-fig${String(i + 1).padStart(2, "0")}.png`) }); } }
console.log("ภาพมือถือ", Math.ceil(H / SLICE), "แผ่น →", OUT);

// 1.5) สรุปย่อ 1 หน้า ต้องจบก่อนขอบล่างของหน้า A4 แรก (กว้างพื้นที่พิมพ์ 186 มม. = 703px, สูง 273 มม. = 1032px)
await page.setViewport({ width: 703, height: 1000, isMobile: false, hasTouch: false, deviceScaleFactor: 1 });
await open(); await page.emulateMediaType("print");
const sheet = await page.evaluate(() => { const s = document.querySelector(".sheet1"); return s ? Math.round(s.getBoundingClientRect().bottom + scrollY) : -1; });
await page.emulateMediaType(null);
console.log(sheet < 0 ? "ไม่พบสรุปย่อ 1 หน้า" : "สรุปย่อ 1 หน้า: จบที่ " + sheet + "px จากหน้าแรกสูง 1032px " + (sheet <= 1032 ? "พอดี 1 หน้า" : "เกิน 1 หน้า!"));

// 2) พิมพ์ PDF (A4) + ตรวจว่ากล่อง/ตาราง/ภาพไม่ถูกตัดข้ามหน้า
await page.setViewport({ width: 900, height: 1000, isMobile: false, hasTouch: false, deviceScaleFactor: 1 });
await open(); // เปลี่ยนโหมดมือถือแล้วหน้าถูกโหลดใหม่ ต้องเปิดหน้าสรุปซ้ำ
await page.emulateMediaType("print");
await page.pdf({ path: path.join(OUT, `${tag}-print.pdf`), format: "A4", margin: { top: "12mm", bottom: "12mm", left: "12mm", right: "12mm" }, printBackground: true });
await page.emulateMediaType(null);
console.log("PDF →", path.join(OUT, `${tag}-print.pdf`));
await browser.close();
