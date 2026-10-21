// ตรวจหน้าสรุปทั้ง 19 มาตรฐานแบบที่นักเรียนเห็นจริง (มือถือ 360 px): markup หลุด · ท่อนประโยคขาด · ล้นจอ · ภาพหาย · กล่องยาวเกิน
// + ตรวจบัตรคำและไฟล์ค้นหา · node tools/test/sum-audit.mjs  (ต้องรัน tools/test/server.mjs ก่อน)
import fs from "fs";
import path from "path";
import puppeteer from "puppeteer-core";
import { ROOT, TOOLS, BLOCK_REAL_API } from "../lib.mjs";

const cfg = JSON.parse(fs.readFileSync(path.join(TOOLS, ".cache", "admin.json"), "utf8")), BASE = `http://localhost:${cfg.port}/`;
let bad = 0, warn = 0;
const t = (name, ok, info = "") => { if (!ok) bad++; console.log((ok ? "PASS " : "FAIL ") + name + (ok || !info ? "" : "\n     " + info)); };
const w = (name, info) => { warn++; console.log("WARN " + name + "  " + info); };
const LEAK = /\*\*|\[\[|@@|\{[^{}\s]*\/[^{}\s]*\}|(^|\n)\s*(\?\?|!!|tr:|kc:|ex:|th:|an:|fl:|xx:|ob:) |undefined|NaN|\[object/;

/* บัตรคำและไฟล์ค้นหา */
for (const lv of ["P6", "M3"]) {
  const cards = JSON.parse(fs.readFileSync(path.join(ROOT, "content", lv, "cards.json"), "utf8"));
  const badC = cards.filter(c => (c.t === "c" && !/\*\*[^*]+\*\*/.test(c.b)) || /\[\[|@@|undefined/.test(c.b + c.f) || c.b.replace(/\*\*/g, "").length < 8);
  t(`${lv} บัตรคำ ${cards.length} ใบ: เติมคำมีคำเว้นว่าง ไม่มี markup หลุด ไม่สั้นผิดปกติ`, !badC.length, badC.slice(0, 3).map(c => c.id + " " + c.b.slice(0, 60)).join(" | "));
  const ids = new Set(cards.map(c => c.id)); t(`${lv} บัตรคำ id ไม่ซ้ำ`, ids.size === cards.length);
  const s = JSON.parse(fs.readFileSync(path.join(ROOT, "content", lv, "search.json"), "utf8"));
  const badS = s.filter(r => r.length !== 5 || /\[\[|@@|\*\*/.test(r[3] + r[4]));
  t(`${lv} ค้นหา ${s.length} รายการ: รูปแบบถูก ไม่มี markup หลุด`, !badS.length, JSON.stringify(badS.slice(0, 2)));
}

const browser = await puppeteer.launch({ executablePath: ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"].find(f => fs.existsSync(f)), headless: true, args: BLOCK_REAL_API });
const page = await browser.newPage(); await page.setViewport({ width: 360, height: 780, isMobile: true, hasTouch: true });
const errs = []; page.on("pageerror", e => errs.push(e.message));
for (const lv of ["P6", "M3"]) {
  await page.goto(BASE, { waitUntil: "networkidle0" }); await page.evaluate(() => localStorage.clear()); await page.goto(BASE, { waitUntil: "networkidle0" });
  await page.type("#cc", cfg.rooms[lv]); await page.$eval("#cf", f => f.requestSubmit()); await page.waitForSelector(".pickgrid button"); await page.$eval(".pickgrid button", b => b.click());
  await page.waitForFunction(() => /ภารกิจวันนี้/.test(document.getElementById("app").textContent), { timeout: 20000 });
  const meta = JSON.parse(fs.readFileSync(path.join(ROOT, "content", lv, "meta.json"), "utf8"));
  for (const std of meta.summaries) {
    await page.evaluate(s => study(s, ""), std); await page.waitForSelector(".rich"); await page.waitForNetworkIdle({ idleTime: 300 }).catch(() => {});
    await page.evaluate(() => document.querySelectorAll("details").forEach(d => { d.open = true; })); await new Promise(r => setTimeout(r, 200));
    const r = await page.evaluate(LEAKsrc => {
      const LEAK = new RegExp(LEAKsrc.slice(1, LEAKsrc.lastIndexOf("/")));
      const rich = [...document.querySelectorAll(".rich")], txt = rich.map(x => x.innerText).join("\n");
      const leak = (txt.match(new RegExp(".{0,30}(" + LEAK.source + ").{0,30}", "g")) || []).slice(0, 3);
      const frag = [...document.querySelectorAll(".box .bl")].map(b => b.innerText.trim()).filter(s => /^[·,]|[·,]$/.test(s) || s.replace(/\s/g, "").length < 4).concat([...document.querySelectorAll(".box .bl.hd")].filter(b => !b.nextElementSibling || !b.nextElementSibling.classList.contains("sub")).map(b => "หัวโจทย์ไม่มีคำตอบ: " + b.innerText.trim())).slice(0, 5);
      const unb = [...document.querySelectorAll(".box .bl")].map(b => b.innerText).filter(s => (s.match(/\(/g) || []).length !== (s.match(/\)/g) || []).length).slice(0, 3);
      const over = document.documentElement.scrollWidth > innerWidth + 1;
      const wide = [...document.querySelectorAll(".rich *")].filter(e => { const b = e.getBoundingClientRect(); return b.width > 0 && b.right > innerWidth + 1 && !e.closest(".tw,.figscroll,.scroll,table"); }).slice(0, 3).map(e => e.tagName + "." + e.className);
      const figs = [...document.querySelectorAll(".rich figure")], noSvg = figs.filter(f => !f.querySelector("svg,img")).length;
      const longBox = [...document.querySelectorAll(".box")].filter(b => b.querySelectorAll(".bl").length > 8).map(b => b.querySelector("b.t").innerText + " " + b.querySelectorAll(".bl").length + " แถว");
      const emptyBox = [...document.querySelectorAll(".box")].filter(b => !b.querySelector(".bl")).length;
      const tiny = [...document.querySelectorAll(".rich p,.rich li,.rich .bl,.rich td")].filter(e => parseFloat(getComputedStyle(e).fontSize) < 12).length;
      return { leak, frag, unb, over, wide, figs: figs.length, noSvg, longBox, emptyBox, tiny, h: document.documentElement.scrollHeight };
    }, LEAK.toString());
    const name = `${lv} ${std}`;
    t(`${name}: ไม่มี markup หลุด`, !r.leak.length, r.leak.join(" | "));
    t(`${name}: ไม่มีท่อนประโยคขาด/วงเล็บไม่ครบในกล่อง`, !r.frag.length && !r.unb.length, [...r.frag, ...r.unb].join(" | ").slice(0, 300));
    t(`${name}: ไม่ล้นจอ 360px`, !r.over && !r.wide.length, r.wide.join(","));
    t(`${name}: ภาพ ${r.figs} ภาพแสดงครบ · กล่องไม่ว่าง · ตัวอักษร ≥ 12px`, !r.noSvg && !r.emptyBox && !r.tiny, `ภาพหาย ${r.noSvg} · กล่องว่าง ${r.emptyBox} · ตัวเล็ก ${r.tiny}`);
    if (r.longBox.length) w(`${name}: กล่องยาวเกิน 8 แถว`, r.longBox.join(" · "));
  }
}
t("ไม่มี JS error ระหว่างเปิดสรุปทุกหน้า", !errs.length, errs.slice(0, 2).join(" | "));
await browser.close();
console.log(bad ? `\nล้มเหลว ${bad} รายการ · เตือน ${warn}` : `\nผ่านทั้งหมด · เตือน ${warn}`);
process.exit(bad ? 1 : 0);
