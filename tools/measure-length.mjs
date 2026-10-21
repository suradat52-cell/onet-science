// วัดความยาวหน้าสรุปทุกมาตรฐาน (มือถือ 360 px ตอนหัวข้อกลุ่ม ค พับ · จำนวนหน้า PDF) ของเซิร์ฟเวอร์จำลองหนึ่งตัว
//   ONET_CFG=<admin.json> node tools/measure-length.mjs <ชื่อไฟล์ผลลัพธ์.json>
import puppeteer from "puppeteer-core";
import * as mupdf from "mupdf";
import fs from "fs";
import path from "path";
import { TOOLS, BLOCK_REAL_API } from "./lib.mjs";
const cfg = JSON.parse(fs.readFileSync(process.env.ONET_CFG || path.join(TOOLS, ".cache", "admin.json"), "utf8"));
const b = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true, args: BLOCK_REAL_API });
const p = await b.newPage(); await p.setViewport({ width: 360, height: 800, isMobile: true, hasTouch: true });
const res = {};
for (const lv of ["P6", "M3"]) {
  await p.goto(`http://localhost:${cfg.port}/`, { waitUntil: "networkidle0" }); await p.evaluate(() => localStorage.clear()); await p.goto(`http://localhost:${cfg.port}/`, { waitUntil: "networkidle0" });
  await p.type("#cc", cfg.rooms[lv]); await p.$eval("#cf button", x => x.click()); await p.waitForSelector('button[data-a="pick"]'); await p.$eval('button[data-a="pick"]', x => x.click()); await p.waitForSelector(".scard");
  const stds = await p.evaluate(async lv => { const m = await cj(lv + "/meta.json"); return m.standards.filter(s => (m.summaries || []).includes(s.standard)).map(s => s.standard); }, lv);
  for (const std of stds) {
    await p.evaluate(s => study(s, ""), std); await p.waitForSelector(".rich"); await p.waitForNetworkIdle({ idleTime: 250 }); await new Promise(r => setTimeout(r, 250));
    const h = await p.evaluate(() => document.documentElement.scrollHeight);
    await p.evaluate(() => { window.print = () => {}; ACT.pdf(); }); await p.emulateMediaType("print");
    const buf = await p.pdf({ format: "A4", margin: { top: "12mm", bottom: "12mm", left: "12mm", right: "12mm" }, printBackground: true }); await p.emulateMediaType(null);
    res[lv + " " + std] = { h, pages: mupdf.Document.openDocument(buf, "application/pdf").countPages() };
  }
}
await b.close(); fs.writeFileSync(process.argv[2], JSON.stringify(res, null, 1)); console.log(Object.keys(res).length, "มาตรฐาน →", process.argv[2]);
