// ทดสอบตัวกันยิงซ้ำ/ค้างของหน้าเว็บ: กดซ้ำระหว่างรอ · คำขออ่านซ้ำใช้คำขอเดียว · เวลาหมดแล้วขึ้นข้อความ+ปุ่มลองใหม่ · ลองใหม่แล้วใช้ได้
//   node tools/test/guards.mjs      (ต้องรัน tools/test/server.mjs ก่อน · ไม่ยิง Apps Script จริง)
import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import { TOOLS, BLOCK_REAL_API } from "../lib.mjs";

const EDGE = ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "C:/Program Files/Microsoft/Edge/Application/msedge.exe"].find(f => fs.existsSync(f));
const cfg = JSON.parse(fs.readFileSync(path.join(TOOLS, ".cache", "admin.json"), "utf8")), BASE = `http://localhost:${cfg.port}/`;
let bad = 0;
const t = (name, ok, info = "") => { if (!ok) bad++; console.log((ok ? "PASS " : "FAIL ") + name + (ok ? "" : "  " + info)); };
const b = await puppeteer.launch({ executablePath: EDGE, headless: true, args: BLOCK_REAL_API });
const p = await b.newPage(); await p.setViewport({ width: 390, height: 844, isMobile: true });
let hang = false; const calls = [];
await p.setRequestInterception(true);
p.on("request", r => {
  if (r.method() === "POST" && /\/api$/.test(r.url())) { let a = ""; try { a = JSON.parse(r.postData()).action; } catch (e) {} calls.push(a); if (hang && a === "enter") return; /* ไม่ตอบ = เซิร์ฟเวอร์ค้าง */ }
  r.continue();
});
await p.goto(BASE, { waitUntil: "networkidle0" }); await p.evaluate(() => localStorage.clear()); await p.goto(BASE, { waitUntil: "networkidle0" });

// 1) กดปุ่ม "เข้าห้องเรียน" รัว ๆ 5 ครั้ง → ยิง enter ครั้งเดียว
await p.type("#cc", cfg.rooms.P6);
await p.evaluate(() => { const f = document.querySelector("#cf"); for (let i = 0; i < 5; i++) f.requestSubmit(); });
await p.waitForSelector('button[data-a="pick"]');
t("กดเข้าห้อง 5 ครั้งติดกัน ยิง enter ครั้งเดียว", calls.filter(a => a === "enter").length === 1, JSON.stringify(calls));

// 2) คำขออ่านเหมือนกันพร้อมกัน → ใช้คำขอเดียว
calls.length = 0;
await p.evaluate(() => Promise.all([1, 2, 3, 4].map(() => api("enter", { code: S.code }))));
t("คำขออ่านเหมือนกัน 4 ครั้งพร้อมกัน ยิงครั้งเดียว", calls.filter(a => a === "enter").length === 1, JSON.stringify(calls));

// 3) เวลาหมด: เซิร์ฟเวอร์ไม่ตอบ → ขึ้นข้อความและปุ่มลองใหม่ ภายในเวลาที่ตั้ง
await p.evaluate(() => { API_TIMEOUT = { read: 1500, write: 2000 }; ROSTER = null; });
hang = true; calls.length = 0;
await p.evaluate(() => { ACT.home(); });
await p.evaluate(() => run(() => { S.student = null; return home(); }));
await p.waitForSelector('[data-a="retry"]', { timeout: 6000 }).catch(() => {});
const txt = await p.$eval("main", m => m.innerText).catch(() => "");
t("เซิร์ฟเวอร์ไม่ตอบ: ขึ้น \"เชื่อมต่อไม่สำเร็จ\" + ข้อความให้ลองใหม่ + ปุ่มลองใหม่", /เชื่อมต่อไม่สำเร็จ/.test(txt) && /ตอบช้า/.test(txt) && !!(await p.$('[data-a="retry"]')), txt.slice(0, 120));
t("ระหว่างรอไม่ยิงซ้ำเอง (enter 1–2 ครั้งต่อการกด)", calls.filter(a => a === "enter").length <= 2, JSON.stringify(calls));

// 4) เซิร์ฟเวอร์กลับมา → กดลองใหม่ ใช้ได้
hang = false;
await p.$eval('[data-a="retry"]', b => b.click());
await p.waitForSelector('button[data-a="pick"]', { timeout: 8000 }).catch(() => {});
t("กด \"ลองใหม่\" แล้วเข้าสู่หน้าเลือกชื่อได้", !!(await p.$('button[data-a="pick"]')));
await b.close();
process.exit(bad ? 1 : 0);
