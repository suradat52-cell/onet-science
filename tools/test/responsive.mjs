// ทุกหน้าหลักที่ 3 ขนาดจอ (มือถือ 360 · แท็บเล็ต 768 · เดสก์ท็อป 1280): ไม่ล้นแนวนอน · เมนูล่างไม่บังปุ่ม · ไม่มี JS error · ถ่ายภาพไว้ที่ tools/.cache/responsive/
//   node tools/test/responsive.mjs   (ต้องรัน tools/test/server.mjs ก่อน)
import fs from "fs";
import path from "path";
import puppeteer from "puppeteer-core";
import { TOOLS, BLOCK_REAL_API } from "../lib.mjs";

const cfg = JSON.parse(fs.readFileSync(path.join(TOOLS, ".cache", "admin.json"), "utf8")), BASE = `http://localhost:${cfg.port}/`;
const OUT = path.join(TOOLS, ".cache", "responsive"); fs.mkdirSync(OUT, { recursive: true });
let bad = 0;
const t = (name, ok, info = "") => { if (!ok) bad++; console.log((ok ? "PASS " : "FAIL ") + name + (ok || !info ? "" : "  " + info)); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"].find(f => fs.existsSync(f)), headless: true, args: BLOCK_REAL_API });
for (const [W, H, tag] of [[360, 780, "มือถือ"], [768, 1024, "แท็บเล็ต"], [1280, 860, "เดสก์ท็อป"]]) {
  const page = await browser.newPage(); await page.setViewport({ width: W, height: H, isMobile: W < 700, hasTouch: W < 700 });
  const errs = []; page.on("pageerror", e => errs.push(e.message)); page.on("dialog", d => d.accept());
  const waitText = re => page.waitForFunction(r => new RegExp(r).test(document.getElementById("app").textContent), { timeout: 20000 }, re.source);
  const check = async name => {
    await page.waitForNetworkIdle({ idleTime: 300 }).catch(() => {}); await sleep(300);
    const r = await page.evaluate(() => ({ over: document.documentElement.scrollWidth - innerWidth, nav: (() => { const n = document.querySelector("#bnav.on > div"); return n ? n.getBoundingClientRect().height : 0; })(), pad: parseFloat(getComputedStyle(document.getElementById("app")).paddingBottom) }));
    t(`${tag} ${W}px · ${name}: ไม่ล้นแนวนอน`, r.over <= 1, r.over + "px");
    t(`${tag} ${W}px · ${name}: เว้นที่ด้านล่างพอให้เมนูล่างไม่บังเนื้อหา`, !r.nav || r.pad >= r.nav, `pad ${r.pad} < nav ${r.nav}`);
    await page.screenshot({ path: path.join(OUT, `${W}-${name.replace(/[^\wก-๙]+/g, "_")}.png`) });
  };
  await page.goto(BASE, { waitUntil: "networkidle0" }); await page.evaluate(() => localStorage.clear()); await page.goto(BASE, { waitUntil: "networkidle0" });
  await check("เข้าห้องเรียน");
  await page.type("#cc", cfg.rooms.M3); await page.$eval("#cf", f => f.requestSubmit()); await page.waitForSelector(".pickgrid button"); await page.$eval(".pickgrid button", b => b.click()); await waitText(/ภารกิจวันนี้/);
  await check("หน้าแรก");
  for (const [fn, re, n] of [[() => ACT.nav({ kind: "s", k: "exams" }), /ข้อสอบจำลอง/, "ข้อสอบ"], [() => ACT.nav({ kind: "s", k: "learn" }), /สรุปเนื้อหา/, "สรุป"], [() => ACT.study({ std: "ว 2.3", ind: "" }), /./, "สรุปเนื้อหา"], [() => ACT.review(), /สมุดข้อผิด/, "ทบทวน"], [() => ACT.cards(), /ดูคำตอบ/, "บัตรคำ"], [() => ACT.nav({ kind: "s", k: "mine" }), /ตั้งค่า/, "ผลของฉัน"], [() => ACT.prac({ std: "ว 2.3", ind: "" }), /./, "ทำข้อสอบ"]]) {
    await page.evaluate(fn); await waitText(re); if (n === "ทำข้อสอบ") await page.waitForSelector("#qcard"); await check(n);
  }
  await page.evaluate(() => { saveExam(); clearExam(); S.token = null; S.student = null; save(); admin(); }); await page.waitForSelector("#lg");
  await page.type("#lg [name=u]", cfg.username); await page.type("#lg [name=p]", cfg.password); await page.$eval("#lg", f => f.requestSubmit()); await page.waitForSelector("#bnav [data-k=report]");
  await check("ครู นักเรียน");
  await page.$eval("#bnav [data-k=report]", b => b.click()); await waitText(/ภาพรวม/); await page.$eval("[data-a=rsub][data-s=room]", b => b.click()); await waitText(/ค่าเฉลี่ยตามมาตรฐาน/); await check("ครู รายงาน");
  await page.$eval("[data-a=rmode][data-m=ind]", b => b.click()); await waitText(/ตัวชี้วัด/); await check("ครู heatmap ตัวชี้วัด");
  t(`${tag} ${W}px: ไม่มี JS error`, !errs.length, errs.slice(0, 2).join(" | "));
  await page.close();
}
await browser.close();
console.log(bad ? `\nล้มเหลว ${bad} รายการ` : "\nผ่านทั้งหมด");
process.exit(bad ? 1 : 0);
