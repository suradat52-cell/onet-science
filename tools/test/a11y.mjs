// ตรวจการเข้าถึง (WCAG 2.1 AA) ด้วย axe-core ทุกหน้าหลักของนักเรียนและครู ทั้งโหมดกลางคืน/กลางวัน ที่จอ 360px
//   node tools/test/a11y.mjs   (ต้องรัน tools/test/server.mjs ก่อน · npm i axe-core --no-save ในโฟลเดอร์ tools)
// เกณฑ์: ไม่มีข้อผิดพลาดระดับ wcag2a/2aa/21a/21aa (รวมคอนทราสต์ ชื่อปุ่ม ป้ายฟอร์ม) · ปุ่ม/ช่องกรอกที่มองเห็นสูง ≥ 44px
import fs from "fs";
import path from "path";
import puppeteer from "puppeteer-core";
import { TOOLS, BLOCK_REAL_API } from "../lib.mjs";

const cfg = JSON.parse(fs.readFileSync(path.join(TOOLS, ".cache", "admin.json"), "utf8")), BASE = process.env.ONET_BASE || `http://localhost:${cfg.port}`;
const AXE = fs.readFileSync(path.join(TOOLS, "node_modules", "axe-core", "axe.min.js"), "utf8");
let bad = 0;
const t = (name, ok, info = "") => { if (!ok) bad++; console.log((ok ? "PASS " : "FAIL ") + name + (ok || !info ? "" : "\n     " + info)); };
const browser = await puppeteer.launch({ executablePath: ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"].find(f => fs.existsSync(f)), headless: true, args: BLOCK_REAL_API });
const page = await browser.newPage(); await page.setViewport({ width: 360, height: 780, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
page.on("dialog", d => d.accept()); page.on("pageerror", e => t("ไม่มี JS error", false, e.message));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const waitText = (re, ms = 15000) => page.waitForFunction(r => new RegExp(r).test(document.getElementById("app").textContent), { timeout: ms }, re.source);
await page.goto(BASE.replace(/[/]$/, "") + "/", { waitUntil: "networkidle0" }); await page.evaluate(AXE);

const check = async name => {
  for (const light of [false, true]) {
    await page.evaluate(l => document.body.classList.toggle("light", l), light);
    const res = await page.evaluate(async () => (await axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] }, resultTypes: ["violations"] })).violations.map(v => ({ id: v.id, impact: v.impact, n: v.nodes.length, ex: v.nodes.slice(0, 2).map(n => n.target.join(" ") + " :: " + (n.any[0] || n.all[0] || n.none[0] || {}).message) })));
    t(`${name} (${light ? "กลางวัน" : "กลางคืน"}): ไม่มีข้อบกพร่อง WCAG 2.1 AA`, !res.length, res.map(v => `${v.id}[${v.impact}] x${v.n} ${v.ex.join(" | ")}`).join("\n     ").slice(0, 900));
  }
  const small = await page.evaluate(() => [...document.querySelectorAll("button,input:not([type=hidden]):not([type=checkbox]):not([type=radio]),select,textarea,a.btn,summary,[role=tab]")].filter(e => { const r = e.getBoundingClientRect(), cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && r.height < 43.5 && !e.closest(".nums") && !(e.matches("a") && !e.classList.contains("btn")); }).slice(0, 5).map(e => (e.getAttribute("data-a") || e.id || e.tagName) + ":" + Math.round(e.getBoundingClientRect().height) + "px " + (e.textContent || "").trim().slice(0, 20)));
  t(`${name}: ปุ่ม/ช่องกรอกสูง ≥ 44px`, !small.length, small.join(" ; "));
  await page.evaluate(() => document.body.classList.remove("light"));
};
const go = async (fn, re) => { await page.evaluate(fn); await waitText(re); await sleep(500); };

await check("เข้าห้องเรียน (รหัส)");
await page.type("#cc", cfg.rooms.P6); await page.$eval("#cf", f => f.requestSubmit()); await page.waitForSelector(".pickgrid button"); await check("เลือกชื่อ");
await page.$eval(".pickgrid button", b => b.click()); await waitText(/ภารกิจวันนี้/); await sleep(600);
// ให้มีข้อมูลทำข้อสอบเล็กน้อย (สมุดข้อผิด, เหรียญ, ตัวชี้วัดอ่อน)
await page.evaluate(() => ACT.prac({ std: "ว 2.1", ind: "" })); await page.waitForSelector("#qcard");
for (let i = 0; i < 40; i++) { await page.evaluate(() => { const r = document.querySelector('#qcard input[type=radio][value="4"]'); if (r) { r.checked = true; r.dispatchEvent(new Event("change", { bubbles: true })); } }); const last = await page.$("[data-a=submit]"); if (last) { await check("ทำข้อสอบ (ข้อสุดท้าย)"); await last.evaluate(b => b.click()); break; } await page.$eval("[data-a=qnext]", b => b.click()); await sleep(30); }
await page.waitForSelector(".resultbox"); await sleep(1500); await check("ผลลัพธ์ + เฉลย");
await go(() => ACT.dash(), /ภารกิจวันนี้/); await check("หน้าแรก");
await go(() => ACT.nav({ kind: "s", k: "exams" }), /ข้อสอบจำลอง/); await check("ข้อสอบ");
await go(() => ACT.nav({ kind: "s", k: "learn" }), /สรุปเนื้อหา/); await page.evaluate(() => document.querySelectorAll("details.ind").forEach(d => { d.open = true; })); await check("สรุป (รายการมาตรฐาน)");
await go(() => ACT.study({ std: "ว 2.1", ind: "" }), /./); await page.evaluate(() => document.querySelectorAll("details.fold").forEach(d => { d.open = true; })); await check("สรุปเนื้อหา ว 2.1");
await go(() => ACT.review(), /สมุดข้อผิด/); await page.evaluate(() => document.querySelectorAll("details").forEach(d => { d.open = true; })); await check("ทบทวน");
await go(() => ACT.cards(), /ดูคำตอบ/); await check("บัตรคำ (หน้าคำถาม)"); await page.$eval("[data-a=cardflip]", b => b.click()); await sleep(200); await check("บัตรคำ (หน้าคำตอบ)");
await go(() => ACT.search(), /พิมพ์คำ/); await page.type("#sq", "แรง"); await sleep(500); await check("ค้นหา");
await go(() => ACT.nav({ kind: "s", k: "mine" }), /ตั้งค่า/); await check("ผลของฉัน + ตั้งค่า");

/* ครู */
await page.evaluate(() => { S.token = null; S.student = null; save(); admin(); }); await page.waitForSelector("#lg"); await check("เข้าสู่ระบบครู");
await page.type("#lg [name=u]", cfg.username); await page.type("#lg [name=p]", cfg.password); await page.$eval("#lg", f => f.requestSubmit()); await page.waitForSelector("#bnav [data-k=students]"); await sleep(800); await check("ครู: นักเรียน/รหัสห้อง");
for (const [s, re, nm] of [["room", /ภาพรวม/, "ภาพรวมห้อง"], ["item", /วิเคราะห์ข้อสอบ/, "วิเคราะห์ข้อสอบ"], ["asg", /มอบงานใหม่/, "มอบหมายงาน"], ["cmp", /ก่อน|เทียบ/, "ก่อน/หลังเรียน"], ["exp", /ส่งออก/, "ส่งออก"]]) {
  await page.$eval("#bnav [data-k=report]", b => b.click()); await waitText(/ภาพรวม|ข้อมูล/); await page.$eval(`[data-a=rsub][data-s=${s}]`, b => b.click()); await waitText(re); await sleep(500); await check("ครู: รายงาน/" + nm);
}
await page.$eval("#bnav [data-k=admins]", b => b.click()); await waitText(/เพิ่มแอดมิน/); await check("ครู: แอดมิน");
await page.$eval("#bnav [data-k=more]", b => b.click()); await waitText(/โรงเรียน/); await check("ครู: อื่น ๆ (โรงเรียน)");
await browser.close();
console.log(bad ? `\nล้มเหลว ${bad} รายการ` : "\nผ่านทั้งหมด");
process.exit(bad ? 1 : 0);
