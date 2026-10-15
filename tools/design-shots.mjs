// ถ่ายภาพหน้าจอมือถือ 390 px ของแบบดีไซน์ใน design/ (หลังรัน node design/build.mjs) แล้วรวมเป็น design/COMPARE.pdf
//   node tools/design-shots.mjs
// ผล: design/shots/<แนว>-<ระดับ>-<หน้า>.png · design/COMPARE.html · design/COMPARE.pdf · ตารางตรวจขนาดปุ่ม/เลื่อนแนวนอนของแต่ละหน้า
import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import { ROOT } from "./lib.mjs";

const EDGE = ["C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "C:/Program Files/Microsoft/Edge/Application/msedge.exe", "C:/Program Files/Google/Chrome/Application/chrome.exe"].find(f => fs.existsSync(f));
const DES = path.join(ROOT, "design"), SH = path.join(DES, "shots");
fs.mkdirSync(SH, { recursive: true });
const DESIGNS = [["1-lab", "แนว 1 · สมุดแล็บ"], ["2-periodic", "แนว 2 · ตารางธาตุ"], ["3-space", "แนว 3 · อวกาศ"]];
const SCREENS = [["code", "กรอกรหัสห้องเรียน", ""], ["home", "หน้าแรกนักเรียน", ""], ["exam", "ทำข้อสอบทีละข้อ", "&sel=2"], ["solution", "เฉลย", ""], ["summary", "สรุปเนื้อหา", ""], ["teacher", "หน้าแรกของครู", ""]];
const LVN = { P6: "ประถมศึกษาปีที่ 6", M3: "มัธยมศึกษาปีที่ 3" };
const CAP = 2100;
const browser = await puppeteer.launch({ executablePath: EDGE, headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
const report = [];
for (const [f, dn] of DESIGNS) for (const lv of ["P6", "M3"]) for (const [s, , extra] of SCREENS) {
  await page.goto(pathToFileURL(path.join(DES, f + ".html")).href + `?lv=${lv}&s=${s}${extra}`, { waitUntil: "networkidle0" });
  await page.evaluate(() => document.fonts.ready); await new Promise(r => setTimeout(r, 250));
  const m = await page.evaluate(() => {
    const vis = e => { const r = e.getBoundingClientRect(), c = getComputedStyle(e); return r.width > 0 && r.height > 0 && c.visibility !== "hidden" && c.display !== "none"; };
    const ctl = [...document.querySelectorAll("button,a[href],input")].filter(vis).filter(e => !e.closest(".devsw"));
    const small = ctl.filter(e => e.getBoundingClientRect().height < 44 || e.getBoundingClientRect().width < 44);
    const fonts = [...document.querySelectorAll(".phone *")].filter(e => [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())).map(e => parseFloat(getComputedStyle(e).fontSize));
    const nav = document.querySelectorAll(".nav button");
    return { h: document.documentElement.scrollHeight, small: small.map(e => (e.textContent || e.className).trim().slice(0, 14)), minFont: Math.min(...fonts), ox: document.documentElement.scrollWidth > innerWidth + 1, nav: nav.length, navMin: nav.length ? Math.min(...[...nav].map(e => e.getBoundingClientRect().height)) : null };
  });
  report.push({ f, lv, s, ...m });
  const h = Math.min(m.h, CAP);
  await page.setViewport({ width: 390, height: h, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }); // เมนู/แถบล่างแบบ fixed จะอยู่ท้ายภาพ
  await new Promise(r => setTimeout(r, 150));
  await page.screenshot({ path: path.join(SH, `${f}-${lv}-${s}.png`) });
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
}
await browser.close();

console.log("แนว            ระดับ  หน้า      สูง(px) ปุ่มเล็ก<44  ฟอนต์เล็กสุด  เลื่อนแนวนอน  เมนูล่าง(ปุ่ม/สูง)");
for (const r of report) console.log(`${r.f.padEnd(14)} ${r.lv.padEnd(5)}  ${r.s.padEnd(9)} ${String(r.h).padStart(6)}  ${String(r.small.length).padStart(5)}${r.small.length ? " [" + [...new Set(r.small)].slice(0, 3).join(",") + "]" : ""}  ${String(r.minFont).padStart(8)}px  ${r.ox ? "ใช่" : "ไม่"}  ${r.nav ? r.nav + "/" + Math.round(r.navMin) + "px" : "-"}`);

/* ---------- COMPARE.html → PDF ---------- */
const PAL = JSON.parse(fs.readFileSync(path.join(DES, "palette.json"), "utf8"));
const W = 3 * 390 + 4 * 30, H = CAP + 170;
const img = (f, lv, s) => `<img src="shots/${f}-${lv}-${s}.png">`;
let html = `<!doctype html><meta charset="utf-8"><style>
@page{size:${W}px ${H}px;margin:0}
body{margin:0;font:16px/1.5 'Noto Sans Thai','Sarabun',sans-serif;color:#111;background:#fff}
.pg{width:${W}px;height:${H}px;box-sizing:border-box;padding:24px 30px;page-break-after:always;overflow:hidden;background:#f1f3f6}
h1{margin:0 0 4px;font-size:28px}h2{margin:0;font-size:22px}.sub{color:#555;margin-bottom:14px}
.cols{display:grid;grid-template-columns:repeat(3,390px);gap:30px;align-items:start}
.col h3{margin:0 0 8px;font-size:16px}.col img{width:390px;display:block;border-radius:10px;box-shadow:0 2px 12px #0003;background:#fff}
.sw{display:flex;gap:6px;margin:6px 0}.sw i{display:block;width:62px;height:40px;border-radius:8px;font:11px/40px sans-serif;text-align:center;font-style:normal}
table{border-collapse:collapse}td,th{padding:6px 12px;border-bottom:1px solid #ccd;text-align:left}
.n{max-width:1100px}.n li{margin:6px 0}
</style>`;
html += `<div class="pg"><h1>เปรียบเทียบแบบดีไซน์ 3 แนว — จอมือถือ 390 px</h1><div class="sub">ข้อมูลจริงจาก data/ (ผังข้อสอบ ข้อสอบ ปี 2568 สรุป เฉลย) · เปอร์เซ็นต์ความคืบหน้า ชื่อนักเรียน โรงเรียน และรหัสห้องเป็นข้อมูลตัวอย่าง</div>
<div class="cols">${DESIGNS.map(([f, n]) => `<div class="col"><h2>${n}</h2><div class="sub">สีตามสาระ</div><div class="sw">${["bio", "phys", "earth", "tech"].map(k => `<i style="background:${PAL[f][k].soft};color:${PAL[f][k].ink}">${{ bio: "ชีวภาพ", phys: "กายภาพ", earth: "โลก-อวกาศ", tech: "เทคโนโลยี" }[k]}</i>`).join("")}</div><div class="sw">${["bio", "phys", "earth", "tech"].map(k => `<i style="background:${PAL[f][k].solid};color:${PAL[f][k].on}">ปุ่ม</i>`).join("")}</div></div>`).join("")}</div>
<h2 style="margin-top:26px">สิ่งที่ตรวจในทุกแนว</h2><ul class="n"><li>ตัวหนังสือบนพื้นของทุกสาระและทุกระดับ ผ่านเกณฑ์ความเปรียบต่าง 4.5:1 ขึ้นไป (54 คู่ ดู design/contrast-report.txt)</li><li>ป.6: ตัวอักษร 18 px มุมโค้งมาก ปุ่มสูง 58 px สีสด · ม.3: ตัวอักษร 16 px มุมเล็ก เส้นบาง ปุ่มสูง 48 px สีเรียบ</li><li>เมนูล่าง 4 ปุ่ม (หน้าแรก · ข้อสอบ · สรุป · เฉลย) สูงเกิน 56 px ใช้ทุกหน้านักเรียน ยกเว้นหน้ากรอกรหัสและหน้าทำข้อสอบ/สรุป ที่ใช้แถบปุ่ม "ก่อนหน้า/ถัดไป" ติดล่างแทน กันกดพลาด · ครูมีเมนูล่างของตัวเอง 4 ปุ่ม</li><li>ปุ่มหลัก = พื้นทึบสีเด่น · ปุ่มรอง = เส้นขอบ · ปุ่มเบา = ตัวหนังสือขีดเส้นใต้</li></ul></div>`;
for (const lv of ["P6", "M3"]) for (const [s, sn] of SCREENS) html += `<div class="pg"><h1>${lv === "P6" ? "ป.6" : "ม.3"} · ${sn}</h1><div class="sub">${LVN[lv]}</div><div class="cols">${DESIGNS.map(([f, n]) => `<div class="col"><h3>${n}</h3>${img(f, lv, s)}</div>`).join("")}</div></div>`;
fs.writeFileSync(path.join(DES, "COMPARE.html"), html);
const b2 = await puppeteer.launch({ executablePath: EDGE, headless: true });
const p2 = await b2.newPage();
await p2.goto(pathToFileURL(path.join(DES, "COMPARE.html")).href, { waitUntil: "networkidle0" });
await p2.pdf({ path: path.join(DES, "COMPARE.pdf"), width: W + "px", height: H + "px", printBackground: true, preferCSSPageSize: true });
await b2.close();
console.log("\nสร้าง design/COMPARE.pdf แล้ว (" + (fs.statSync(path.join(DES, "COMPARE.pdf")).size / 1e6).toFixed(1) + " MB)");
