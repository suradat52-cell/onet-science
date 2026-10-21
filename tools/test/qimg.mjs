// รูปข้อสอบบนมือถือ: แตะรูป → เต็มจอ · ซูมสองนิ้ว (จำลองสัมผัส 2 จุด) · ปุ่ม + − · ลากเลื่อน · แตะครั้งเดียวปิด · คีย์บอร์ด Enter/Esc
//   node tools/test/qimg.mjs   (ต้องรัน tools/test/server.mjs ก่อน)
import fs from "fs";
import path from "path";
import puppeteer from "puppeteer-core";
import { TOOLS, BLOCK_REAL_API } from "../lib.mjs";

const cfg = JSON.parse(fs.readFileSync(path.join(TOOLS, ".cache", "admin.json"), "utf8")), BASE = `http://localhost:${cfg.port}/`;
let bad = 0;
const t = (name, ok, info = "") => { if (!ok) bad++; console.log((ok ? "PASS " : "FAIL ") + name + (ok || !info ? "" : "  " + String(info).slice(0, 200))); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"].find(f => fs.existsSync(f)), headless: true, args: BLOCK_REAL_API });
try {
  const page = await browser.newPage(); await page.setViewport({ width: 360, height: 780, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const errs = []; page.on("pageerror", e => errs.push(e.message)); page.on("dialog", d => d.accept());
  const cdp = await page.createCDPSession();
  const touch = (type, pts) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: pts.map(([x, y], i) => ({ x, y, id: i })) });
  const scale = () => page.evaluate(() => +(document.getElementById("figview")?.dataset.scale || 0));
  await page.goto(BASE, { waitUntil: "networkidle0" }); await page.evaluate(() => localStorage.clear()); await page.goto(BASE, { waitUntil: "networkidle0" });
  await page.type("#cc", cfg.rooms.M3); await page.$eval("#cf", f => f.requestSubmit()); await page.waitForSelector(".pickgrid button"); await page.$eval(".pickgrid button", b => b.click());
  await page.waitForFunction(() => S.student); await page.evaluate(() => run(() => ACT.year({ y: "2562" }))); await page.waitForSelector("#qcard");
  for (let i = 0; i < 50 && !(await page.$("#qcard img.qimg")); i++) { await page.$eval("[data-a=qnext]", b => b.click()); await sleep(60); }
  await page.waitForFunction(() => { const i = document.querySelector("#qcard img.qimg"); return i && i.complete && i.naturalWidth; });
  const r = await page.$eval("#qcard img.qimg", i => { const b = i.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + Math.min(b.height / 2, 200), alt: i.alt }; });
  t("รูปข้อสอบบอกผู้ใช้ว่าแตะเพื่อขยายได้", /แตะเพื่อขยาย/.test(r.alt));
  await page.evaluate(y => window.scrollTo(0, 0), 0);
  const r2 = await page.$eval("#qcard img.qimg", i => { i.scrollIntoView({ block: "center" }); const b = i.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; });
  await page.touchscreen.tap(r2.x, r2.y); await page.waitForSelector("#figview.imgv", { timeout: 5000 }).catch(() => {});
  t("แตะรูป → เปิดเต็มจอ", !!(await page.$("#figview.imgv")));
  t("เต็มจอ: รูปพอดีจอ ไม่ล้น", await page.evaluate(() => { const i = document.querySelector("#figview img"), b = i.getBoundingClientRect(); return b.width <= innerWidth + 1 && b.height <= innerHeight; }));
  await page.screenshot({ path: path.join(TOOLS, ".cache", "qimg-open.png") });
  const c = await page.evaluate(() => { const b = document.querySelector("#figview .iv").getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; });
  await touch("touchStart", [[c.x - 30, c.y], [c.x + 30, c.y]]);
  for (let k = 1; k <= 6; k++) { await touch("touchMove", [[c.x - 30 - k * 15, c.y], [c.x + 30 + k * 15, c.y]]); await sleep(20); }
  await touch("touchEnd", []);
  const s1 = await scale();
  t("ซูมสองนิ้ว → รูปขยาย (มากกว่า 2 เท่า)", s1 > 2, s1);
  t("ซูมสองนิ้วแล้วยังไม่ปิด", !!(await page.$("#figview.imgv")));
  await touch("touchStart", [[c.x, c.y]]); for (let k = 1; k <= 5; k++) { await touch("touchMove", [[c.x - k * 20, c.y]]); await sleep(15); } await touch("touchEnd", []);
  t("ลากนิ้วเดียวเมื่อซูมอยู่ → เลื่อนดูรูปได้ ไม่ปิด", !!(await page.$("#figview.imgv")) && /translate\(-/.test(await page.$eval("#figview img", i => i.style.transform)));
  await page.$eval("#figview .zb[data-z='0.667']", b => b.click()); const s2 = await scale();
  t("ปุ่ม − ย่อลง", s2 < s1, s1 + "→" + s2);
  await page.$eval("#figview .zb[data-z='1.5']", b => b.click());
  t("ปุ่ม + ขยาย", (await scale()) > s2);
  await page.screenshot({ path: path.join(TOOLS, ".cache", "qimg-zoom.png") });
  await page.touchscreen.tap(c.x, c.y); await sleep(200);
  t("แตะครั้งเดียว → ปิด กลับมาที่ข้อสอบ", !(await page.$("#figview")) && !!(await page.$("#qcard")));
  await page.focus("#qcard img.qimg"); await page.keyboard.press("Enter"); await sleep(100);
  t("คีย์บอร์ด: Enter บนรูป → เปิด", !!(await page.$("#figview.imgv")));
  await page.keyboard.press("Escape"); await sleep(100);
  t("คีย์บอร์ด: Esc → ปิด", !(await page.$("#figview")));
  t("ไม่มี JS error", !errs.length, errs.join(" | "));
} finally { await browser.close(); }
console.log(bad ? `\nล้มเหลว ${bad} รายการ` : "\nผ่านทั้งหมด");
process.exit(bad ? 1 : 0);
