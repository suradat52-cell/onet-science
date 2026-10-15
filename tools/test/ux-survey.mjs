// สำรวจ UX ของ index.html ปัจจุบันบนจอมือถือ 390 px กับเซิร์ฟเวอร์จำลอง (ต้องรัน tools/test/server.mjs [พอร์ต] ก่อน)
//   node tools/test/ux-survey.mjs [พอร์ต=8766]   → design/current/<ระดับ>-<หน้า>.png + design/current/survey.json
// วัดต่อหน้า: ความสูง (กี่จอ) · ปุ่ม/ช่องกรอกที่เล็กกว่า 44 px · ฟอนต์เล็กสุด · เลื่อนแนวนอน · ตำแหน่งปุ่มหลักตัวแรก
import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import { ROOT, TOOLS } from "../lib.mjs";

const EDGE = ["C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "C:/Program Files/Microsoft/Edge/Application/msedge.exe", "C:/Program Files/Google/Chrome/Application/chrome.exe"].find(f => fs.existsSync(f));
const port = process.argv[2] || "8766";
const cfg = JSON.parse(fs.readFileSync(path.join(TOOLS, ".cache", "admin.json"), "utf8"));
if (String(cfg.port) !== port) { console.error("admin.json เป็นของพอร์ต " + cfg.port + " (รัน server.mjs " + port + " ใหม่)"); process.exit(1); }
const BASE = `http://localhost:${port}/`, OUT = path.join(ROOT, "design", "current");
fs.mkdirSync(OUT, { recursive: true });
const browser = await puppeteer.launch({ executablePath: EDGE, headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
page.on("dialog", d => d.accept());
const results = [];
const idle = () => page.waitForNetworkIdle({ idleTime: 300 });
const click = async sel => { await page.waitForSelector(sel); await page.$eval(sel, b => b.click()); await idle(); };
const loadImgs = () => page.evaluate(async () => { for (const i of document.images) if (!i.complete) await new Promise(r => { i.onload = i.onerror = r; }); });

async function toDash() { await page.goto(BASE, { waitUntil: "networkidle0" }); await idle(); if (await page.$('button[data-a="pick"]')) await click('button[data-a="pick"]'); if (!(await page.$('button[data-a="mock"]'))) { await page.evaluate(() => home()); await idle(); if (await page.$('button[data-a="pick"]')) await click('button[data-a="pick"]'); } }
async function measure(lv, name, title) {
  await loadImgs();
  const m = await page.evaluate(() => {
    const vh = innerHeight, vis = e => { const r = e.getBoundingClientRect(), s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none"; };
    const ctl = [...document.querySelectorAll("button,a[href],select,input:not([type=hidden]),textarea,label.yn span")].filter(vis);
    const small = ctl.filter(e => { const r = e.getBoundingClientRect(); return r.height < 44; });
    const fs = [...document.querySelectorAll("main *")].filter(e => e.childNodes.length && [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())).map(e => parseFloat(getComputedStyle(e).fontSize));
    const first = document.querySelector("main button:not(.ghost):not(.link)");
    return {
      height: document.documentElement.scrollHeight, screens: +(document.documentElement.scrollHeight / vh).toFixed(1),
      controls: ctl.length, small: small.length, smallSample: [...new Set(small.map(e => (e.textContent || e.name || e.tagName).trim().slice(0, 18)))].slice(0, 6),
      minFont: Math.min(...fs), overflowX: document.documentElement.scrollWidth > innerWidth + 1, firstPrimaryY: first ? Math.round(first.getBoundingClientRect().top + scrollY) : null,
      buttons: document.querySelectorAll("main button").length, tables: document.querySelectorAll("main table").length,
    };
  });
  m.page = title; m.level = lv; results.push(m);
  await page.screenshot({ path: path.join(OUT, `${lv}-${name}.png`), fullPage: true });
  console.log(`${lv} ${title}: สูง ${m.screens} จอ · ปุ่ม/ช่อง ${m.controls} (เล็กกว่า 44px: ${m.small}) · ฟอนต์เล็กสุด ${m.minFont}px · เลื่อนแนวนอน ${m.overflowX ? "ใช่" : "ไม่"}`);
}

for (const lv of ["P6", "M3"]) {
  await page.goto(BASE, { waitUntil: "networkidle0" });
  await page.evaluate(() => localStorage.clear());
  await page.goto(BASE, { waitUntil: "networkidle0" });
  await measure(lv, "01-code", "กรอกรหัสห้องเรียน");
  await page.type("#cc", cfg.rooms[lv]); await click("#cf button");
  await measure(lv, "02-roster", "เลือกชื่อ");
  await click('button[data-a="pick"]');
  await measure(lv, "03-dashboard", "หน้าแรกนักเรียน");
  const year = await page.$eval('button[data-a="year"]', b => b.dataset.y);
  await click(`button[data-a="year"][data-y="${year}"]`);
  await measure(lv, "04-exam", "ทำข้อสอบรายปี (ทั้งฉบับในหน้าเดียว)");
  await page.evaluate(() => { const qs = [...document.querySelectorAll("#f .q")]; qs.forEach((q, i) => { const r = q.querySelector('input[type=radio][value="1"]'); if (r && i % 3) r.click(); }); });
  await page.$eval("#f button:not([type])", b => b.click());
  await page.waitForFunction(() => /ได้ .*%/.test(document.querySelector("h2")?.textContent || ""), { timeout: 20000 }); await idle();
  await measure(lv, "05-result", "ผลคะแนน/เฉลย");
  await page.$$eval('button[data-a="sol"]', bs => bs.slice(0, 3).forEach(b => b.click()));
  await measure(lv, "06-solution", "เฉลยละเอียด (เปิด 3 ข้อ)");
  await click('button[data-a="dash"]');
  await click('button[data-a="study"]');
  await measure(lv, "07-study", "สรุปเนื้อหาของมาตรฐาน");
  await toDash();
  await click('button[data-a="mock"]');
  await measure(lv, "08-mock", "ข้อสอบจำลองตามผัง");
  await page.goto(BASE, { waitUntil: "networkidle0" }); await idle();
  await click('button[data-a="res"]');
  await measure(lv, "09-resources", "ผังข้อสอบและข้อสอบจาก สทศ.");
}
// ครู
await page.goto(BASE, { waitUntil: "networkidle0" });
await page.evaluate(() => localStorage.clear());
await page.goto(BASE, { waitUntil: "networkidle0" });
await click('button[data-a="admin"]');
await measure("T", "10-admin-login", "ครู: ล็อกอิน");
await page.type('#lg input[name="u"]', cfg.username); await page.type('#lg input[name="p"]', cfg.password); await page.$eval("#lg button", b => b.click());
await page.waitForFunction(() => /ออกจากระบบ/.test(document.body.innerText), { timeout: 20000 }); await idle();
await measure("T", "11-admin-home", "ครู: หน้าแรก (นักเรียน/รหัสห้อง)");
for (const [k, t] of [["report", "ครู: รายงานผล"], ["bank", "ครู: คลังข้อสอบ"]]) {
  await page.evaluate(n => [...document.querySelectorAll('button[data-a="tab"]')].find(b => b.textContent.trim() === n).click(), { report: "รายงานผล", bank: "คลังข้อสอบ" }[k]);
  await idle(); await measure("T", "12-admin-" + k, t);
}
fs.writeFileSync(path.join(OUT, "survey.json"), JSON.stringify(results, null, 1));
await browser.close();
