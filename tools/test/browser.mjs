// ทดสอบหน้าเว็บกับเซิร์ฟเวอร์จำลอง (ต้องรัน tools/test/server.mjs ก่อน)
// node tools/test/browser.mjs [ปี,...]   ไม่ระบุปี = ทุกปีที่มีใน data/
// ทุกปี ทุกระดับ: ทำข้อสอบทีละข้อตามหน้าจอจริง (ตั้งใจตอบผิดบางข้อ) ตรวจคะแนนกับเฉลยใน TSV, ภาพโหลดครบทุกข้อ, ขีดเส้นใต้, ป้ายนอกผัง/นอกหลักสูตร,
// หน้าผลลัพธ์ ภาพหน้าเฉลย, บันทึกคะแนนเบื้องหลัง, พิมพ์ PDF (ข้อสอบ/เฉลย) · ปิดเว็บกลางคันแล้วทำต่อได้ · แผงเลขข้อ/ปักธง
// ผลอยู่ที่ tools/.cache/test/ (ภาพหน้าจอ, PDF, results.json)
import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import { at, TOOLS, POINTS, expectedScore, imgsOf, alts, isRight, BLOCK_REAL_API } from "../lib.mjs";

const EDGE = ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe"].find(f => fs.existsSync(f));
// ทดสอบกับเว็บจริง: ONET_LIVE_BASE=https://…/ ONET_ROOMS="P6=รหัส,M3=รหัส" (ห้องของโรงเรียนทดสอบ) · ONET_VIEWPORT=390x844 = จอมือถือ
const LIVE = process.env.ONET_LIVE_BASE;
if (LIVE && process.env.ONET_ALLOW_LIVE !== "yes") { console.error("ปฏิเสธ: ทดสอบเว็บจริงยิง Apps Script จริงและเขียนข้อมูลลงชีต — ต้องตั้ง ONET_ALLOW_LIVE=yes เมื่อเจ้าของระบบสั่งเท่านั้น"); process.exit(2); }
const cfg = LIVE ? { rooms: Object.fromEntries(process.env.ONET_ROOMS.split(",").map(x => x.split("="))) } : JSON.parse(fs.readFileSync(path.join(TOOLS, ".cache", "admin.json"), "utf8"));
const [VW, VH] = (process.env.ONET_VIEWPORT || "900x1000").split("x").map(Number), MOBILE = VW < 600;
const BASE = LIVE || `http://localhost:${cfg.port}/`, OUT = path.join(TOOLS, ".cache", LIVE ? "test-live" + (MOBILE ? "-mobile" : "") : "test");
const timing = [];
const timed = async (name, fn) => { const t = Date.now(); const r = await fn(); timing.push([name, Date.now() - t]); return r; };
fs.mkdirSync(OUT, { recursive: true });
// allSets = ทุกไฟล์ที่เซิร์ฟเวอร์จำลองโหลด (ใช้กับหน้าสรุปผัง) · sets = เฉพาะปีที่สั่งทดสอบ
const allSets = fs.readdirSync(at("data")).map(f => f.match(/^questions-(P6|M3)-(\d+)\.tsv$/)).filter(Boolean)
  .map(m => ({ lv: m[1], year: m[2], rows: fs.readFileSync(at("data", m[0]), "utf8").replace(/\n$/, "").split("\n").map(l => l.split("\t")) }))
  .sort((a, b) => b.year - a.year || a.lv.localeCompare(b.lv));
const sets = allSets.filter(s => !process.argv[2] || process.argv[2].split(",").includes(s.year));
const inPlan = new Set(fs.readFileSync(at("data", "blueprint.tsv"), "utf8").trim().split("\n").slice(1).map(l => l.split("\t")).filter(r => r[4]).map(r => `${r[0]}|${r[3]}|${r[4]}`));

// คำตอบผิดที่ตั้งใจใส่: ทุก 4 ข้อเปลี่ยน 1 ข้อ
// ข้อเชิงซ้อน: ข้อแรกของฉบับผิด 1 ข้อย่อย (ทดสอบคะแนนบางส่วน) ข้อถัดไปผิด 2 ข้อย่อย · ข้อเรียงลำดับ/เติมคำ: สลับ/ใส่ค่าผิด
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

const browser = await puppeteer.launch({ executablePath: EDGE, headless: true, args: LIVE ? [] : BLOCK_REAL_API });
const page = await browser.newPage();
await page.setViewport({ width: VW, height: VH, isMobile: MOBILE, hasTouch: MOBILE, deviceScaleFactor: MOBILE ? 2 : 1 });
page.on("dialog", d => d.accept());
page.on("pageerror", e => check("ไม่มี JS error", false, e.message));
const click = async sel => { await page.waitForSelector(sel); await page.$eval(sel, b => b.click()); };
const idle = () => page.waitForNetworkIdle({ idleTime: 250 });
const loadImgs = () => page.evaluate(async () => { for (const i of document.images) { i.scrollIntoView(); if (!i.complete) await new Promise(r => { i.onload = i.onerror = r; }); } window.scrollTo(0, 0); });
const shot = async (sel, file) => { const el = await page.$(sel); if (!el) return; await el.scrollIntoView(); await el.screenshot({ path: path.join(OUT, file) }); };
// พิมพ์ PDF พื้นขาว: ข้อสอบ = ใช้ prepPrintExam() จริงของหน้าเว็บ · หน้าอื่นพิมพ์ตรง ๆ
const pdf = async (file, exam) => {
  if (exam) await page.evaluate(() => prepPrintExam());
  await page.emulateMediaType("print");
  await page.pdf({ path: path.join(OUT, file), format: "A4", margin: { top: "12mm", bottom: "12mm", left: "12mm", right: "12mm" }, printBackground: true });
  await page.emulateMediaType(null);
  if (exam) await page.evaluate(() => cleanupPrint());
};
async function enter(lv) {
  await page.goto(BASE, { waitUntil: "networkidle0" });
  await page.evaluate(() => localStorage.clear());
  await page.goto(BASE, { waitUntil: "networkidle0" });
  await page.waitForSelector("#cc");
  await timed(lv + " กรอกรหัสห้อง→เห็นรายชื่อ", async () => { await page.type("#cc", cfg.rooms[lv].toLowerCase()); await click("#cf button"); await page.waitForSelector('button[data-a="pick"]'); });
  await timed(lv + " เลือกชื่อ→หน้าแรกนักเรียน", async () => { await click('button[data-a="pick"]'); await page.waitForSelector("#bnav.on"); await page.waitForSelector(".scard"); });
}
const openYear = async year => { await click('#bnav [data-k="exams"]'); await click(`button[data-a="year"][data-y="${year}"]`); await page.waitForSelector("#qcard"); };
// ใส่คำตอบของข้อที่เปิดอยู่บนหน้าจอ (ผ่านช่องจริง)
const fillAnswer = (type, ans) => page.evaluate((type, ans) => {
  const card = document.querySelector("#qcard"), v = ans.split(",");
  if (type === "complex") v.forEach((x, k) => card.querySelector(`input[name="a__${k}"][value="${x}"]`).click());
  else if (type === "order") v.forEach((x, k) => { const s = card.querySelector(`select[name="a__${k}"]`); s.value = x; s.dispatchEvent(new Event("change", { bubbles: true })); });
  else if (type === "fill") { const i = card.querySelector('input[name="a"]'); i.value = ans; i.dispatchEvent(new Event("input", { bubbles: true })); }
  else card.querySelector(`input[name="a"][value="${ans}"]`).click();
}, type, ans);
const waitQ = i => page.waitForFunction(i => document.querySelector("#qcard")?.dataset.i == i, {}, i);

let total = { img: 0 };
for (const { lv, year, rows } of sets) {
  const tag = `${lv}-${year}`;
  await enter(lv);
  await timed(`${tag} เปิดข้อสอบรายปี`, () => openYear(year));
  // ตรวจรายข้อบนหน้าจอ แล้วตอบ
  const nImg = rows.reduce((n, r) => n + imgsOf(r).length, 0); total.img += nImg;
  let exp = 0, max = 0, ok = 0, nCx = 0, imgOk = 0, imgSeen = 0, u = 0, offGot = 0, outGot = 0, badText = 0, tImg = 0;
  const badImgs = [];
  for (const [i, r] of rows.entries()) {
    await waitQ(i);
    const t0 = Date.now();
    await page.evaluate(async () => { for (const im of document.querySelectorAll("#qcard img")) { im.scrollIntoView(); if (!im.complete) await new Promise(r => { im.onload = im.onerror = r; }); } window.scrollTo(0, 0); });
    tImg += Date.now() - t0;
    const info = await page.evaluate(() => { const c = document.querySelector("#qcard"); return { imgs: [...c.querySelectorAll("img")].map(i => ({ src: i.getAttribute("src"), ok: i.complete && i.naturalWidth > 0 })), u: c.querySelectorAll("u").length, off: c.querySelectorAll(".tag.off").length, out: c.querySelectorAll(".tag.out").length, bad: /__|ดูภาพ/.test(c.textContent) }; });
    imgSeen += info.imgs.length; imgOk += info.imgs.filter(x => x.ok).length; badImgs.push(...info.imgs.filter(x => !x.ok).map(x => x.src)); u += info.u; offGot += info.off; outGot += info.out; badText += info.bad ? 1 : 0;
    const [type, key, nCh] = [r[10], r[8], r[7] ? r[7].split("||").length : 4];
    // ข้อเชิงซ้อนทุกข้อตอบผิดบางข้อย่อย (สลับผิด 1 / ผิด 2) เพื่อทดสอบเกณฑ์บางส่วน
    const ans = type === "complex" ? wrongOf(type, key, nCh, nCx++) : i % 4 === 3 ? wrongOf(type, key, nCh, 0) : pick(key, i);
    max += POINTS[lv][type]; exp += expectedScore(lv, year, type, ans, key); if (isRight(type, ans, key)) ok++;
    await fillAnswer(type, ans);
    if (!MOBILE || i < 2) for (const t of ["complex", "order", "fill"]) if (type === t && !fs.existsSync(path.join(OUT, `${tag}-${t}.png`))) await shot("#qcard", `${tag}-${t}.png`);
    if (type === "mc" && !r[7] && !fs.existsSync(path.join(OUT, `${tag}-mc-image.png`))) await shot("#qcard", `${tag}-mc-image.png`);
    if (i < rows.length - 1) await click('[data-a="qnext"]');
  }
  timing.push([`${tag} โหลดภาพรวมทุกข้อ (หลังเปิดข้อ)`, tImg]);
  check(`${tag} ภาพหน้าข้อสอบ ${imgOk}/${nImg}`, imgSeen === nImg && imgOk === imgSeen, badImgs.join(","));
  const nU = rows.reduce((n, r) => n + (r[5] + "||" + r[7]).split("__").length - 1, 0) / 2;
  check(`${tag} ขีดเส้นใต้ ${u}/${nU}`, u === nU && !badText);
  const offExp = rows.filter(r => r[4] && !inPlan.has(`${lv}|${r[3]}|${r[4]}`)).length;
  check(`${tag} ป้ายนอกผัง ${offGot}/${offExp}`, offGot === offExp);
  const outExp = rows.filter(r => !r[4]).length;
  check(`${tag} ป้ายนอกหลักสูตรปัจจุบัน ${outGot}/${outExp}`, outGot === outExp);
  exp = Math.round(exp * 100) / 100; max = Math.round(max * 100) / 100;
  // แผงเลขข้อ: ตอบครบทุกข้อ / ธง
  await click('[data-a="sheet"]');
  const sheet = await page.$eval("#sheet", s => ({ done: s.querySelectorAll(".nums .done").length, n: s.querySelectorAll(".nums button").length, txt: s.textContent }));
  check(`${tag} แผงเลขข้อนับตอบแล้ว ${sheet.done}/${rows.length}`, sheet.n === rows.length && sheet.done === rows.length, sheet.txt.slice(0, 80));
  await click('#sheet [data-a="closesheet"]');
  await pdf(`${tag}-exam.pdf`, true);
  await timed(`${tag} ส่งคำตอบ→เห็นคะแนน`, async () => { await click('[data-a="submit"]'); await page.waitForFunction(() => /ได้ .*%/.test(document.querySelector("h2")?.textContent || ""), { timeout: 60000 }); });
  // โหมดรายปี: แสดงร้อยละและจำนวนข้อที่ถูก ไม่แสดงคะแนนเต็ม
  const h2 = await page.$eval("h2", h => h.textContent), m = h2.match(/ได้ (\d+)%.*ถูก (\d+) จาก (\d+) ข้อ/), pctExp = Math.round(exp * 100 / max);
  check(`${tag} ร้อยละ ${m?.[1]}% ถูก ${m?.[2]}/${m?.[3]} (คาด ${pctExp}% ถูก ${ok}/${rows.length})`, m && +m[1] === pctExp && +m[2] === ok && +m[3] === rows.length, h2);
  check(`${tag} ไม่แสดงคะแนนเต็ม`, !/\d+(\.\d+)?\s*\/\s*\d+(\.\d+)?\s*คะแนน/.test(await page.$eval("main", x => x.textContent)), "พบคะแนนเต็ม");
  // คะแนนเห็นทันทีที่ตรวจในเครื่อง แล้วบันทึกเบื้องหลัง: Apps Script ตรวจซ้ำต้องได้ค่าเดียวกัน (ถ้าต่างจะขึ้นข้อความ "ระบบตรวจซ้ำ")
  await page.waitForFunction(() => /บันทึกคะแนนแล้ว/.test(document.getElementById("savestat")?.textContent || ""), { timeout: 90000 }).catch(() => {});
  { const sv = await page.$eval("#savestat", e => e.textContent).catch(() => "ไม่พบ #savestat"); check(`${tag} บันทึกคะแนนเบื้องหลังสำเร็จ และ Apps Script ตรวจซ้ำได้ค่าเดียวกัน`, sv === "บันทึกคะแนนแล้ว ✓", sv); }
  await loadImgs();
  const rImg = await page.$$eval("main img", a => a.filter(i => i.complete && i.naturalWidth > 0).length);
  check(`${tag} ภาพหน้าเฉลย ${rImg}/${nImg}`, rImg === nImg);
  await pdf(`${tag}-answers.pdf`);
}
// ปิดเว็บกลางคัน → เปิดใหม่ ทำต่อได้ คำตอบ/ธง/ข้อที่ค้างอยู่ไม่หาย
for (const lv of [...new Set(sets.map(s => s.lv))]) {
  const s = sets.find(x => x.lv === lv), tag = `${lv}-${s.year}`;
  await enter(lv); await openYear(s.year);
  const q0 = s.rows[0], q1 = s.rows[1];
  const a0 = pick(q0[8], 0), a1 = pick(q1[8], 1);
  await fillAnswer(q0[10], a0); await click('[data-a="qnext"]'); await waitQ(1);
  await fillAnswer(q1[10], a1); await click('[data-a="flag"]'); await click('[data-a="qnext"]'); await waitQ(2);
  await page.reload({ waitUntil: "networkidle0" });
  await page.waitForSelector(".scard");
  const hasResume = await page.$('[data-a="resume"]');
  check(`${tag} ปิดเว็บแล้วเปิดใหม่ หน้าแรกมีปุ่ม "ทำต่อ"`, !!hasResume);
  await click('[data-a="resume"]'); await page.waitForSelector("#qcard");
  const idx = await page.$eval("#qcard", c => +c.dataset.i);
  check(`${tag} ทำต่อแล้วกลับมาที่ข้อ 3 ที่ค้างไว้`, idx === 2, "ข้อที่ " + (idx + 1));
  await click('[data-a="qprev"]'); await waitQ(1);
  const st1 = await page.evaluate(() => ({ flagged: document.querySelector("#flagb").classList.contains("on"), checked: [...document.querySelectorAll("#qcard input:checked,#qcard select")].map(e => e.value).join(",") }));
  await click('[data-a="qprev"]'); await waitQ(0);
  const st0 = await page.evaluate(() => [...document.querySelectorAll("#qcard input:checked,#qcard select")].map(e => e.value).join(","));
  const norm = (t, a) => a.split(",").map(x => alts(x)[0]).join(",");
  check(`${tag} คำตอบข้อ 1-2 และธงข้อ 2 ยังอยู่หลังเปิดใหม่`, st1.flagged && st1.checked === norm(q1[10], a1) && st0 === norm(q0[10], a0), JSON.stringify({ st0, st1, a0, a1 }));
  await click('[data-a="sheet"]');
  const sh = await page.$eval("#sheet", x => ({ done: x.querySelectorAll(".nums .done").length, flag: x.querySelectorAll(".nums .flag").length }));
  check(`${tag} แผงเลขข้อ: ตอบแล้ว 2 ข้อ ปักธง 1 ข้อ`, sh.done === 2 && sh.flag === 1, JSON.stringify(sh));
  await click('#sheet [data-a="closesheet"]');
  await page.evaluate(() => { clearExam(); });
}
// หน้าสรุปผังของแต่ละระดับมีป้ายนอกผังเท่ากับจำนวนตัวชี้วัดนอกผังที่มีในคลัง (หน้า "สรุป" แท็บตัวชี้วัด)
for (const lv of [...new Set(sets.map(s => s.lv))]) {
  await enter(lv);
  await click('#bnav [data-k="learn"]'); await page.waitForSelector("details.ind");
  await page.evaluate(() => document.querySelectorAll("details.ind").forEach(d => { d.open = true; }));
  const exp = new Set(allSets.filter(s => s.lv === lv).flatMap(s => s.rows).filter(r => r[4] && !inPlan.has(`${lv}|${r[3]}|${r[4]}`)).map(r => r[3] + "|" + r[4])).size;
  const got = await page.$$eval("details.ind .chip", x => x.filter(c => /ไม่อยู่ในผัง/.test(c.textContent)).length);
  check(`${lv} หน้าสรุปผัง ป้ายนอกผัง ${got}/${exp}`, got === exp);
}
await browser.close();
if (LIVE) { console.log("\nเวลาแต่ละขั้น (ms)"); for (const [n, ms] of timing) console.log(String(ms).padStart(7) + "  " + n); }
fs.writeFileSync(path.join(OUT, "results.json"), JSON.stringify(results, null, 1));
const fail = results.filter(r => !r.ok).length;
console.log(`\nภาพรวม ${total.img} ภาพ · ${fail ? "ไม่ผ่าน " + fail + " รายการ" : "ผ่านทั้งหมด " + results.length + " รายการ"} · ผลอยู่ที่ ${OUT}`);
process.exit(fail ? 1 : 0);
