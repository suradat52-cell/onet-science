// ทดสอบการใช้งานออฟไลน์ (PWA) ของหน้าทดลองที่สร้างแล้ว: service worker + ดาวน์โหลดเนื้อหาไว้ในเครื่อง → ตัดเน็ต → เปิดใหม่ → ทำข้อสอบ → เปิดเน็ต → คะแนนส่งเอง
//   node tools/test/offline.mjs      (สร้างหน้าทดลองลง tools/.cache/pv-off เอง · ต้องรัน tools/test/server.mjs ไว้ก่อน · ยิงเฉพาะเซิร์ฟเวอร์จำลอง)
import fs from "fs";
import path from "path";
import { spawn, spawnSync } from "child_process";
import puppeteer from "puppeteer-core";
import { TOOLS, ROOT, BLOCK_REAL_API } from "../lib.mjs";

const cfg = JSON.parse(fs.readFileSync(path.join(TOOLS, ".cache", "admin.json"), "utf8")), OUT = path.join(TOOLS, ".cache", "pv-off"), PORT = 8794, BASE = `http://localhost:${PORT}/preview/`;
let bad = 0;
const t = (name, ok, info = "") => { if (!ok) bad++; console.log((ok ? "PASS " : "FAIL ") + name + (ok || !info ? "" : "  " + info)); };
const b0 = spawnSync("node", [path.join(ROOT, "tools", "build-preview.mjs"), "--out=" + OUT], { cwd: ROOT, encoding: "utf8" });
if (b0.status) { console.log(b0.stderr); process.exit(1); }
spawnSync("powershell", ["-NoProfile", "-Command", `Get-NetTCPConnection -LocalPort ${PORT} -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }`]);
const srv = spawn("node", [path.join(TOOLS, "test", "pv-server.mjs"), OUT, String(PORT)], { stdio: "ignore" });
const sleep = ms => new Promise(r => setTimeout(r, ms));
await sleep(1500);
const browser = await puppeteer.launch({ executablePath: ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"].find(f => fs.existsSync(f)), headless: true, args: BLOCK_REAL_API });
try {
  const page = await browser.newPage(); await page.setViewport({ width: 360, height: 780, isMobile: true, hasTouch: true });
  page.on("dialog", d => d.accept()); page.on("pageerror", e => t("ไม่มี JS error", false, e.message));
  const waitText = (re, ms = 20000) => page.waitForFunction(r => new RegExp(r).test(document.getElementById("app").textContent), { timeout: ms }, re.source);
  await page.goto(BASE, { waitUntil: "networkidle0" });
  await page.waitForFunction(() => navigator.serviceWorker && navigator.serviceWorker.controller || navigator.serviceWorker.ready.then(() => true), { timeout: 15000 });
  await page.evaluate(() => navigator.serviceWorker.ready); await sleep(1500); await page.reload({ waitUntil: "networkidle0" });
  t("service worker ทำงานและคุมหน้า", await page.evaluate(() => !!navigator.serviceWorker.controller));
  await page.type("#cc", cfg.rooms.P6); await page.$eval("#cf", f => f.requestSubmit()); await page.waitForSelector(".pickgrid button"); await page.$eval(".pickgrid button", b => b.click()); await waitText(/ภารกิจวันนี้/);
  await page.evaluate(() => run(() => ACT.nav({ kind: "s", k: "mine" }))); // ผ่าน run() เหมือนกดปุ่มจริง (กันหน้าแรกที่โหลดช้าวาดทับ) await page.waitForSelector("#settings");
  await page.$eval("[data-a=offline]", b => b.click()); await page.waitForFunction(() => /เตรียมไว้แล้วเมื่อ/.test(document.getElementById("offst").textContent), { timeout: 120000 });
  t("ดาวน์โหลดเนื้อหาไว้ในเครื่อง: เสร็จ + บันทึกเวลา", true);
  const cached = await page.evaluate(async () => { const ks = await caches.keys(); let n = 0; for (const k of ks) n += (await (await caches.open(k)).keys()).length; return n; });
  t("แคชมีไฟล์เนื้อหาและภาพข้อสอบ (> 40 รายการ)", cached > 40, cached);
  /* ตัดเน็ต → เปิดหน้าใหม่ */
  await page.setOfflineMode(true);
  await page.reload({ waitUntil: "domcontentloaded" }); await waitText(/ภารกิจวันนี้|เข้าห้องเรียน|ตั้งค่า|ผลของฉัน/, 20000).catch(() => {});
  t("ออฟไลน์: เปิดแอปได้จากแคช", /ผลของฉัน|ภารกิจวันนี้|ตั้งค่า/.test(await page.$eval("#app", e => e.textContent)), (await page.$eval("#app", e => e.textContent)).slice(0, 80));
  t("ออฟไลน์: แสดงแถบ 'ออฟไลน์อยู่'", await page.evaluate(() => !document.getElementById("offline").hidden));
  await page.evaluate(() => ACT.nav({ kind: "s", k: "exams" })); await waitText(/เริ่มแบบไม่จับเวลา/);
  await page.$eval("[data-a=mock]", b => b.click()); await page.waitForSelector("#qcard", { timeout: 20000 });
  t("ออฟไลน์: เริ่มข้อสอบจำลองได้ (ภาพข้อสอบมาจากแคช)", await page.evaluate(async () => { const im = document.querySelector("#qcard img.qimg"); return !im || (im.complete && im.naturalWidth > 0); }));
  for (let i = 0; i < 40; i++) { await page.evaluate(() => { const r = document.querySelector('#qcard input[type=radio][value="1"]'); if (r) { r.checked = true; r.dispatchEvent(new Event("change", { bubbles: true })); } }); const last = await page.$("[data-a=submit]"); if (last) { await last.evaluate(b => b.click()); break; } await page.$eval("[data-a=qnext]", b => b.click()); await sleep(30); }
  await page.waitForSelector(".resultbox", { timeout: 30000 });
  t("ออฟไลน์: ตรวจคำตอบและแสดงผลในเครื่องได้", /ได้ \d+/.test(await page.$eval(".resultbox", e => e.textContent)));
  const pending = await page.evaluate(() => pend().length);
  t("ออฟไลน์: คะแนนรอส่งในเครื่อง (1 รายการ)", pending === 1, pending);
  /* กลับมามีเน็ต */
  await page.setOfflineMode(false); await page.evaluate(() => window.dispatchEvent(new Event("online")));
  await page.waitForFunction(() => pend().length === 0, { timeout: 30000 }).catch(() => {});
  t("กลับมามีเน็ต: คะแนนส่งขึ้นเซิร์ฟเวอร์เอง", await page.evaluate(() => pend().length === 0));
  const hist = await page.evaluate(async () => (await api("progress", { code: S.code, studentId: S.student.id })).history.map(h => h.mode));
  t("เซิร์ฟเวอร์ได้ผลข้อสอบจำลองที่ทำออฟไลน์", hist.includes("mock"), JSON.stringify(hist));
} finally { await browser.close(); srv.kill(); }
console.log(bad ? `\nล้มเหลว ${bad} รายการ` : "\nผ่านทั้งหมด");
process.exit(bad ? 1 : 0);
