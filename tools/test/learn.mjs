// ทดสอบฟีเจอร์ฝั่งนักเรียนช่วง 2: แดชบอร์ด/ภารกิจ · สมุดข้อผิด · ทบทวน · ฝึกเลือกเอง · บัตรคำ · ค้นหา · ข้อสอบจับเวลา · ตั้งค่า (ตัวอักษร/โหมดสี)
// node tools/test/learn.mjs   (ต้องรัน tools/test/server.mjs ก่อน · ยิงเฉพาะเซิร์ฟเวอร์จำลอง)
import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import { TOOLS, BLOCK_REAL_API } from "../lib.mjs";

const CHROME = ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"].find(f => fs.existsSync(f));
const cfg = JSON.parse(fs.readFileSync(path.join(TOOLS, ".cache", "admin.json"), "utf8")), BASE = process.env.ONET_BASE || `http://localhost:${cfg.port}/`; // ONET_BASE = ทดสอบหน้าทดลองที่สร้างแล้ว (ดู pv-server.mjs)
const OUT = path.join(TOOLS, ".cache", "learn"); fs.mkdirSync(OUT, { recursive: true });
let bad = 0;
const t = (name, ok, info = "") => { if (!ok) bad++; console.log((ok ? "PASS " : "FAIL ") + name + (ok || !info ? "" : "  " + info)); };
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: BLOCK_REAL_API });
const page = await browser.newPage();
await page.setViewport({ width: 360, height: 780, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
page.on("dialog", d => d.accept());
page.on("pageerror", e => t("ไม่มี JS error", false, e.message));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const click = async sel => { await page.waitForSelector(sel); await page.$eval(sel, b => b.click()); };
const text = sel => page.$eval(sel, e => e.textContent).catch(() => "");
const noOverflow = async name => t("ไม่มีแถบเลื่อนแนวนอน (360px): " + name, await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), await page.evaluate(() => document.documentElement.scrollWidth));
const shot = n => page.screenshot({ path: path.join(OUT, n + ".png") });
const waitText = (re, ms = 15000) => page.waitForFunction(r => new RegExp(r).test(document.getElementById("app").textContent), { timeout: ms }, re.source);

await page.goto(BASE.replace(/[/]$/, "") + "/", { waitUntil: "networkidle0" });
await page.type("#cc", cfg.rooms.P6); await page.$eval("#cf", f => f.requestSubmit()); await page.waitForSelector(".pickgrid button");
await click(".pickgrid button"); await waitText(/ภารกิจวันนี้/);
t("แดชบอร์ด: มีหัวข้อภารกิจวันนี้ + ชื่อ", /สวัสดี/.test(await text("#app h1")) && /ภารกิจวันนี้/.test(await text("#app")));
t("เมนูล่าง 5 ปุ่ม (มี ทบทวน)", (await page.$$eval("#bnav button", b => b.map(x => x.textContent.trim()))).join() === "หน้าแรก,ข้อสอบ,สรุป,ทบทวน,ผลของฉัน", await text("#bnav"));
t("ปุ่มเมนูล่างสูง ≥ 44px", await page.$$eval("#bnav button", b => b.every(x => x.getBoundingClientRect().height >= 44)));
await noOverflow("แดชบอร์ด"); await shot("dash-empty");

/* ทำโจทย์ฝึกให้ผิดเยอะ ๆ (เลือกข้อ 4 ทุกข้อ) → เข้าสมุดข้อผิด */
const answerAll = async () => {
  for (let i = 0; i < 60; i++) {
    await page.waitForSelector("#qcard");
    await page.evaluate(() => { const r = document.querySelector('#qcard input[type=radio][value="4"]'); if (r) { r.checked = true; r.dispatchEvent(new Event("change", { bubbles: true })); } });
    const last = await page.$("[data-a=submit]"); if (last) { await last.evaluate(b => b.click()); break; }
    await page.$eval("[data-a=qnext]", b => b.click()); await sleep(40);
  }
  await page.waitForSelector(".resultbox", { timeout: 20000 });
};
await page.evaluate(() => ACT.prac({ std: "ว 2.1", ind: "" })); await answerAll();
const wrongN = await page.$$eval(".qres.bad-item", e => e.length);
t("ฝึก ว 2.1: มีข้อที่ผิด (เพื่อทดสอบสมุดข้อผิด)", wrongN > 0, wrongN);
await page.waitForFunction(() => /บันทึกคะแนนแล้ว/.test(document.getElementById("savestat")?.textContent || ""), { timeout: 20000 });
await page.evaluate(() => ACT.dash()); await waitText(/สมุดข้อผิด/);
t("แดชบอร์ด: การ์ดสมุดข้อผิด + ข้อรอทบทวน", /ถึงเวลาทบทวน \d+ ข้อ/.test(await text(".nbcard")), await text(".nbcard"));
t("ภารกิจ: นับโจทย์ที่ทำวันนี้", /วันนี้ทำแล้ว \d+\/10 ข้อ/.test(await text("#app")));
t("เรียนต่อเนื่อง 1 วัน แสดงบนหัวหน้า", /เรียนต่อเนื่อง 1 วัน/.test(await text(".hero")), await text(".hero"));
await noOverflow("แดชบอร์ดหลังฝึก"); await shot("dash-after");

/* สมุดข้อผิด → โหมดทบทวน */
const nbBefore = +(await text(".nbcard")).match(/ทั้งหมด (\d+) ข้อ/)[1];
t("สมุดข้อผิดเท่ากับจำนวนข้อที่ผิด", nbBefore === wrongN, nbBefore + " vs " + wrongN);
await click("[data-a=nbstart]"); await page.waitForSelector("#qcard");
t("โหมดทบทวน: หัวข้อ 'ทบทวนสมุดข้อผิด'", /ทบทวนสมุดข้อผิด/.test(await text(".examtop")));
await answerAll();
await page.waitForFunction(() => /บันทึกคะแนนแล้ว/.test(document.getElementById("savestat")?.textContent || ""), { timeout: 20000 });
const hist = await page.evaluate(async () => (await api("progress", { code: S.code, studentId: S.student.id })).history.map(h => h.mode + "/" + h.standard));
t("เซิร์ฟเวอร์บันทึกโหมดทบทวนเป็น practice/ทบทวน", hist.includes("practice/ทบทวน"), JSON.stringify(hist));
await page.evaluate(() => ACT.review()); await waitText(/สมุดข้อผิด/); await sleep(300);
t("หน้าทบทวนมีครบ 4 ส่วน", (await page.$$eval("#app h2", h => h.map(x => x.textContent))).join("|") === "สมุดข้อผิด|บัตรคำ|ฝึกเลือกเอง|ค้นหา");
await noOverflow("ทบทวน"); await shot("review");

/* ฝึกเลือกเอง */
await page.select("#cs", "ว 2.1"); await page.select("#cn", "5"); await page.select("#co", "y");
const inds = await page.$$eval("#ci option", o => o.length);
t("เลือกมาตรฐานแล้วตัวชี้วัดถูกเติม", inds > 1, inds);
await click("[data-a=cgo]"); await page.waitForSelector("#qcard");
t("ฝึกเลือกเอง: 5 ข้อ ชื่อหัวข้อถูก", /ข้อ 1\/5/.test(await text("#pcount")) && /ฝึกเลือกเอง/.test(await text(".examtop")), await text(".examtop"));
await answerAll();

/* บัตรคำ */
await page.evaluate(() => ACT.review()); await waitText(/บัตรคำ/);
await click("[data-a=cards]"); await page.waitForSelector(".fcard");
const front = await text(".fcard");
await click("[data-a=cardflip]"); await sleep(50);
t("บัตรคำ: พลิกแล้วเห็นคำตอบ", (await text(".fcard")) !== front);
for (let i = 0; i < 30; i++) { const y = await page.$("[data-a=cardyes]"); if (!y) { const f = await page.$("[data-a=cardflip]"); if (f) await f.evaluate(b => b.click()); else break; continue; } await y.evaluate(b => b.click()); await sleep(30); }
await waitText(/ทบทวนครบแล้ว/).catch(() => {});
t("บัตรคำ: ทบทวนครบ 10 ใบจบรอบ", /ทบทวนครบแล้ว/.test(await text("#app")), (await text("#app")).slice(0, 80));
await page.evaluate(() => ACT.dash()); await waitText(/ภารกิจวันนี้/); await sleep(400);
t("ภารกิจบัตรคำสำเร็จ", /ทบทวนบัตรคำ 10 ใบ[\s\S]*สำเร็จแล้ว/.test(await text("#app")), "");

/* ค้นหา */
await page.evaluate(() => ACT.search()); await page.waitForSelector("#sq"); await page.type("#sq", "แรง"); await sleep(500);
const nres = await page.$$eval(".sr", e => e.length);
t("ค้นหา 'แรง' พบรายการ", nres > 0, nres);
await page.$eval("#sq", i => { i.value = "zzzzqx"; i.dispatchEvent(new Event("input", { bubbles: true })); }); await sleep(400);
t("ค้นหาไม่พบ: มีข้อความสถานะว่าง", /ไม่พบคำว่า/.test(await text("#sres")));
await noOverflow("ค้นหา");

/* ข้อสอบจับเวลา */
await page.evaluate(() => ACT.nav({ kind: "s", k: "exams" })); await waitText(/เริ่มแบบจับเวลา/);
await shot("exams");
await click("[data-a=mockt]"); await page.waitForSelector("#tmr");
t("จับเวลา: แสดง mm:ss", /^\d\d:\d\d$/.test(await text("#tmr")), await text("#tmr"));
await page.reload({ waitUntil: "networkidle0" }); await waitText(/มีข้อสอบที่ทำค้างไว้/);
await click("[data-a=resume]"); await page.waitForSelector("#tmr");
t("รีเฟรชแล้วทำต่อ: ตัวจับเวลายังอยู่ (เวลาไม่รีเซ็ต)", await page.evaluate(() => Q.end > Date.now() && Q.end - Date.now() < 3.7e6));
await page.evaluate(() => { Q.end = Date.now() + 2000; saveExam(); });
await page.waitForSelector(".resultbox", { timeout: 15000 });
t("หมดเวลา: ส่งคำตอบอัตโนมัติ", /ข้อสอบจำลอง/.test(await text("#app")));

/* ตั้งค่า */
await page.evaluate(() => ACT.nav({ kind: "s", k: "mine" })); await page.waitForSelector("#settings");
t("หน้าผลของฉันมีส่วนเหรียญ + ตั้งค่า", /เหรียญของฉัน/.test(await text("#app")));
const f0 = await page.evaluate(() => parseFloat(getComputedStyle(document.body).fontSize));
await click('[data-a=fz][data-v="1.3"]'); const f1 = await page.evaluate(() => parseFloat(getComputedStyle(document.body).fontSize));
t("ตั้งค่าตัวอักษรใหญ่มาก: ขนาดเพิ่ม ~30%", f1 / f0 > 1.25 && f1 / f0 < 1.35, f0 + "→" + f1);
await click('[data-a=lite][data-v="1"]');
t("โหมดกลางวัน: ใส่คลาส light", await page.evaluate(() => document.body.classList.contains("light")));
await shot("mine-light");
await page.reload({ waitUntil: "networkidle0" }); await waitText(/ภารกิจวันนี้/);
t("ตั้งค่าอยู่หลังรีเฟรช", await page.evaluate(() => document.body.classList.contains("light") && document.documentElement.style.getPropertyValue("--fz") === "1.3"));
await noOverflow("แดชบอร์ด (โหมดกลางวัน ตัวใหญ่มาก)"); await shot("dash-light");
await page.evaluate(() => { store.del("set"); applySet(); });
/* ออกจากระบบนักเรียน (เครื่องใช้ร่วมกัน) */
await page.evaluate(() => run(() => ACT.dash())); await waitText(/ภารกิจวันนี้/);
t("แถบหัวมีปุ่ม 'ออกจากระบบ' ระหว่างเป็นนักเรียน", await page.evaluate(() => { const b = document.getElementById("who"); return b && !b.hidden && b.dataset.a === "slogout" && /ออกจากระบบ/.test(b.textContent) && b.getBoundingClientRect().height >= 44 && b.getBoundingClientRect().right <= innerWidth; }));
await page.$eval("#who", b => b.click()); await page.waitForSelector(".pickgrid button");
t("กดออกจากระบบ → กลับหน้าเลือกชื่อ ห้องเดิม (ไม่ต้องกรอกรหัสใหม่)", await page.evaluate(() => !S.student && !!S.code && document.getElementById("who").hidden));
t("หน้าเลือกชื่อมีทางเข้า 'สำหรับครู'", !!(await page.$("[data-a=admin]")));
await page.reload({ waitUntil: "networkidle0" }); await page.waitForSelector(".pickgrid button");
t("รีเฟรชหลังออกจากระบบ ยังอยู่หน้าเลือกชื่อ (เครื่องไม่จำนักเรียนคนเดิม)", await page.evaluate(() => !S.student));
await page.$eval("[data-a=admin]", b => b.click()); await page.waitForSelector("#lg");
t("กด 'สำหรับครู' → หน้าเข้าสู่ระบบแอดมิน", true);
await browser.close();
console.log(bad ? `\nล้มเหลว ${bad} รายการ` : "\nผ่านทั้งหมด");
process.exit(bad ? 1 : 0);
