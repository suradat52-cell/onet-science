// ทดสอบหน้าเว็บกับเซิร์ฟเวอร์จำลอง (ต้องรัน tools/test/server.mjs ก่อน)
// node tools/test/browser.mjs [ปี,...]   ไม่ระบุปี = ทุกปีที่มีใน data/
// ทุกปี ทุกระดับ: ทำข้อสอบทั้งฉบับ (ตั้งใจตอบผิดบางข้อ) ตรวจคะแนนกับเฉลยใน TSV, ภาพโหลดครบ, ขีดเส้นใต้, ป้ายนอกผัง, พิมพ์ PDF
// ผลอยู่ที่ tools/.cache/test/ (ภาพหน้าจอ, PDF, results.json)
import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import { at, TOOLS, POINTS, expectedScore, imgsOf, alts, isRight } from "../lib.mjs";

const EDGE = ["C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Google/Chrome/Application/chrome.exe"].find(f => fs.existsSync(f));
const cfg = JSON.parse(fs.readFileSync(path.join(TOOLS, ".cache", "admin.json"), "utf8"));
const BASE = `http://localhost:${cfg.port}/`, OUT = path.join(TOOLS, ".cache", "test");
fs.mkdirSync(OUT, { recursive: true });
// allSets = ทุกไฟล์ที่เซิร์ฟเวอร์จำลองโหลด (ใช้กับหน้าสรุปผัง) · sets = เฉพาะปีที่สั่งทดสอบ
const allSets = fs.readdirSync(at("data")).map(f => f.match(/^questions-(P6|M3)-(\d+)\.tsv$/)).filter(Boolean)
  .map(m => ({ lv: m[1], year: m[2], rows: fs.readFileSync(at("data", m[0]), "utf8").replace(/\n$/, "").split("\n").map(l => l.split("\t")) }))
  .sort((a, b) => b.year - a.year || a.lv.localeCompare(b.lv));
const sets = allSets.filter(s => !process.argv[2] || process.argv[2].split(",").includes(s.year));
const inPlan = new Set(fs.readFileSync(at("data", "blueprint.tsv"), "utf8").trim().split("\n").slice(1).map(l => l.split("\t")).filter(r => r[4]).map(r => `${r[0]}|${r[3]}|${r[4]}`));

// คำตอบผิดที่ตั้งใจใส่: ทุก 4 ข้อเปลี่ยน 1 ข้อ
// ข้อเชิงซ้อน: ข้อแรกของฉบับผิด 1 ข้อย่อย (ทดสอบคะแนนบางส่วน) ข้อถัดไปผิด 2 ข้อย่อย · ข้อเรียงลำดับผิด 1 ตำแหน่งต้องได้ 0
const flip = v => v === "ใช่" ? "ไม่ใช่" : "ใช่";
// เฉลยหลายคำตอบ (a|b): ตอบถูกโดยสลับใช้ทางเลือกต่าง ๆ ตามเลขข้อ · ตอบผิดต้องเลือกค่านอกทุกทางเลือก
const pick = (key, n) => key.split(",").map(t => alts(t)[n % alts(t).length]).join(",");
function wrongOf(type, key, nChoices, nth) {
  const a = key.split(",").map(t => alts(t)[nth % alts(t).length]);
  if (type === "complex") { a[a.length - 1] = flip(alts(key.split(",").pop())[0]); if (nth % 2) a[0] = flip(alts(key.split(",")[0])[0]); return a.join(","); }
  if (type === "order") { if (a.length > 1) [a[0], a[1]] = [a[1], a[0]]; else a[0] = String(a[0] % nChoices + 1); return a.join(","); }
  if (type === "fill") return key + "x";
  return String([1, 2, 3, 4].find(n => !alts(key).includes(String(n))));
}
const results = [];
const check = (name, ok, info = "") => { results.push({ name, ok, info }); console.log((ok ? "PASS " : "FAIL ") + name + (ok || !info ? "" : "  " + info)); };

const browser = await puppeteer.launch({ executablePath: EDGE, headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 900, height: 1000 });
page.on("dialog", d => d.accept());
page.on("pageerror", e => check("ไม่มี JS error", false, e.message));
const click = async sel => { await page.waitForSelector(sel); await page.$eval(sel, b => b.click()); };
const idle = () => page.waitForNetworkIdle({ idleTime: 250 });
const loadImgs = () => page.evaluate(async () => { for (const i of document.images) { i.scrollIntoView(); if (!i.complete) await new Promise(r => { i.onload = i.onerror = r; }); } });
const shot = async (sel, file) => { const el = await page.$(sel); if (!el) return; await el.scrollIntoView(); await el.screenshot({ path: path.join(OUT, file) }); };
const pdf = async file => { await page.emulateMediaType("print"); await page.pdf({ path: path.join(OUT, file), format: "A4", margin: { top: "12mm", bottom: "12mm", left: "12mm", right: "12mm" }, printBackground: true }); await page.emulateMediaType(null); };
async function enter(lv) {
  await page.goto(BASE, { waitUntil: "networkidle0" });
  await page.evaluate(() => localStorage.clear());
  await page.goto(BASE, { waitUntil: "networkidle0" });
  await page.waitForSelector("#cc"); await page.type("#cc", cfg.rooms[lv].toLowerCase()); await click("#cf button"); await idle();
  await click('button[data-a="pick"]'); await idle();
}

let total = { img: 0 };
for (const { lv, year, rows } of sets) {
  const tag = `${lv}-${year}`;
  await enter(lv);
  await click(`button[data-a="year"][data-y="${year}"]`); await idle();
  await page.waitForSelector("#f");
  await loadImgs();
  const imgs = await page.$$eval("#f img", a => a.map(i => ({ src: i.getAttribute("src"), ok: i.complete && i.naturalWidth > 0 })));
  const nImg = rows.reduce((n, r) => n + imgsOf(r).length, 0); total.img += nImg;
  check(`${tag} ภาพหน้าข้อสอบ ${imgs.filter(i => i.ok).length}/${nImg}`, imgs.length === nImg && imgs.every(i => i.ok), imgs.filter(i => !i.ok).map(i => i.src).join(","));
  const nU = rows.reduce((n, r) => n + (r[5] + "||" + r[7]).split("__").length - 1, 0) / 2;
  const u = await page.$$eval("#f u", x => x.length);
  check(`${tag} ขีดเส้นใต้ ${u}/${nU}`, u === nU && !(await page.$eval("#f", f => /__|ดูภาพ/.test(f.textContent))));
  const offExp = rows.filter(r => r[4] && !inPlan.has(`${lv}|${r[3]}|${r[4]}`)).length;
  const offGot = await page.$$eval("#f .tag.off", x => x.length);
  check(`${tag} ป้ายนอกผัง ${offGot}/${offExp}`, offGot === offExp);
  const outExp = rows.filter(r => !r[4]).length, outGot = await page.$$eval("#f .tag.out", x => x.length);
  check(`${tag} ป้ายนอกหลักสูตรปัจจุบัน ${outGot}/${outExp}`, outGot === outExp);
  let exp = 0, max = 0, ok = 0, nCx = 0;
  for (const [i, r] of rows.entries()) {
    const [type, key, nCh] = [r[10], r[8], r[7] ? r[7].split("||").length : 4];
    // ข้อเชิงซ้อนทุกข้อตอบผิดบางข้อย่อย (สลับผิด 1 / ผิด 2) เพื่อทดสอบเกณฑ์บางส่วน
    const ans = type === "complex" ? wrongOf(type, key, nCh, nCx++) : i % 4 === 3 ? wrongOf(type, key, nCh, 0) : pick(key, i);
    max += POINTS[lv][type]; exp += expectedScore(lv, year, type, ans, key); if (isRight(type, ans, key)) ok++;
    await page.evaluate((i, type, ans) => {
      const q = document.querySelectorAll("#f .q")[i], v = ans.split(",");
      if (type === "complex") v.forEach((x, k) => q.querySelector(`input[name$="__${k}"][value="${x}"]`).click());
      else if (type === "order") v.forEach((x, k) => { const s = q.querySelector(`select[name$="__${k}"]`); s.value = x; });
      else if (type === "fill") q.querySelector("input:not([type=radio])").value = ans;
      else q.querySelector(`input[type=radio][value="${ans}"]`).click();
    }, i, type, ans);
  }
  exp = Math.round(exp * 100) / 100; max = Math.round(max * 100) / 100;
  for (const t of ["complex", "order", "fill"]) { const i = rows.findIndex(r => r[10] === t); if (i >= 0) await shot(`#f .q:nth-of-type(${i + 1})`, `${tag}-${t}.png`); }
  { const i = rows.findIndex(r => r[10] === "mc" && !r[7]); if (i >= 0) await shot(`#f .q:nth-of-type(${i + 1})`, `${tag}-mc-image.png`); }
  await pdf(`${tag}-exam.pdf`);
  await page.$eval("#f button:not([type])", b => b.click());
  await page.waitForFunction(() => /ได้ .*%/.test(document.querySelector("h2")?.textContent || ""), { timeout: 20000 });
  // โหมดรายปี: แสดงร้อยละและจำนวนข้อที่ถูก ไม่แสดงคะแนนเต็ม
  const h2 = await page.$eval("h2", h => h.textContent), m = h2.match(/ได้ (\d+)%.*ถูก (\d+) จาก (\d+) ข้อ/), pctExp = Math.round(exp * 100 / max);
  check(`${tag} ร้อยละ ${m?.[1]}% ถูก ${m?.[2]}/${m?.[3]} (คาด ${pctExp}% ถูก ${ok}/${rows.length})`, m && +m[1] === pctExp && +m[2] === ok && +m[3] === rows.length, h2);
  check(`${tag} ไม่แสดงคะแนนเต็ม`, !/\d+(\.\d+)?\s*\/\s*\d+(\.\d+)?\s*คะแนน/.test(await page.$eval("main", x => x.textContent)), "พบคะแนนเต็ม");
  await loadImgs();
  const rImg = await page.$$eval("main img", a => a.filter(i => i.complete && i.naturalWidth > 0).length);
  check(`${tag} ภาพหน้าเฉลย ${rImg}/${nImg}`, rImg === nImg);
  await pdf(`${tag}-answers.pdf`);
}
// หน้าสรุปผังของแต่ละระดับมีป้ายนอกผังเท่ากับจำนวนตัวชี้วัดนอกผังที่มีในคลัง
for (const lv of [...new Set(sets.map(s => s.lv))]) {
  await enter(lv);
  const exp = new Set(allSets.filter(s => s.lv === lv).flatMap(s => s.rows).filter(r => r[4] && !inPlan.has(`${lv}|${r[3]}|${r[4]}`)).map(r => r[3] + "|" + r[4])).size;
  const got = await page.$$eval("td .tag.off", x => x.length);
  check(`${lv} หน้าสรุปผัง ป้ายนอกผัง ${got}/${exp}`, got === exp);
}
await browser.close();
fs.writeFileSync(path.join(OUT, "results.json"), JSON.stringify(results, null, 1));
const fail = results.filter(r => !r.ok).length;
console.log(`\nภาพรวม ${total.img} ภาพ · ${fail ? "ไม่ผ่าน " + fail + " รายการ" : "ผ่านทั้งหมด " + results.length + " รายการ"} · ผลอยู่ที่ ${OUT}`);
process.exit(fail ? 1 : 0);
