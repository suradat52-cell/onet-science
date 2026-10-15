// ทดสอบแตะภาพ SVG เปิดเต็มจอ: ตัวอักษร ≥ 11 px · ซูมสองนิ้วได้ (touch-action) · หมุนจอแนวนอนแล้วภาพขยาย · ปิดได้
//   node tools/test/figzoom.mjs      (ต้องรัน tools/test/server.mjs ก่อน)
import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import { TOOLS, BLOCK_REAL_API } from "../lib.mjs";

const EDGE = ["C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "C:/Program Files/Microsoft/Edge/Application/msedge.exe", "C:/Program Files/Google/Chrome/Application/chrome.exe"].find(f => fs.existsSync(f));
const cfg = JSON.parse(fs.readFileSync(path.join(TOOLS, ".cache", "admin.json"), "utf8"));
let bad = 0; const t = (n, ok, i = "") => { if (!ok) bad++; console.log((ok ? "PASS " : "FAIL ") + n + (ok ? "" : "  " + i)); };
const b = await puppeteer.launch({ executablePath: EDGE, headless: true, args: BLOCK_REAL_API });
const p = await b.newPage(); await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
await p.goto(`http://localhost:${cfg.port}/`, { waitUntil: "networkidle0" }); await p.evaluate(() => localStorage.clear()); await p.goto(`http://localhost:${cfg.port}/`, { waitUntil: "networkidle0" });
await p.type("#cc", cfg.rooms.P6); await p.$eval("#cf button", x => x.click()); await p.waitForSelector('button[data-a="pick"]'); await p.$eval('button[data-a="pick"]', x => x.click()); await p.waitForSelector(".scard");
await p.evaluate(() => study("ว 2.3", "")); await p.waitForSelector("figure[data-fig]");
const eff = () => p.evaluate(() => { const s = document.querySelector("#figview svg"); if (!s) return null; const vb = s.getAttribute("viewBox").split(/\s+/).map(Number), sc = s.getBoundingClientRect().width / vb[2]; return Math.min(...[...s.querySelectorAll("text")].filter(x => x.textContent.trim()).map(x => parseFloat(getComputedStyle(x).fontSize) * sc)); });
await p.tap("figure[data-fig] svg");
await p.waitForSelector("#figview");
const portrait = await eff();
t(`แตะภาพแล้วเปิดเต็มจอ ตัวอักษรเล็กสุด ${portrait?.toFixed(1)} px (แนวตั้ง)`, portrait >= 10.99, String(portrait));
const ta = await p.$eval("#figview .fv-box", e => getComputedStyle(e).touchAction);
t("กรอบเต็มจอยอมให้ซูมสองนิ้ว/เลื่อน (touch-action = " + ta + ")", /pinch-zoom|auto|manipulation/.test(ta) && !/none/.test(ta), ta);
await p.setViewport({ width: 844, height: 390, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
await new Promise(r => setTimeout(r, 400));
const land = await eff();
t(`หมุนเป็นแนวนอน ภาพขยายตาม ตัวอักษรเล็กสุด ${land?.toFixed(1)} px (มากกว่าแนวตั้ง)`, land >= 10.99 && land > portrait, `${land} vs ${portrait}`);
const ox = await p.evaluate(() => document.documentElement.scrollWidth <= 845);
t("หน้าเว็บด้านหลังไม่กว้างเกินจอ", ox);
await p.$eval("[data-a=figclose]", x => x.click());
t("กดปิดแล้วกลับหน้าสรุป", !(await p.$("#figview")) && !(await p.evaluate(() => document.body.classList.contains("fv-open"))));
await b.close();
process.exit(bad ? 1 : 0);
