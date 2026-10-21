// หน้าคะแนนรายคนของครู: เลือกห้อง → ตารางทุกคน → กดชื่อ → ตัวชี้วัดที่อ่อน · ดาวน์โหลด Excel (.xlsx ที่เปิดได้จริง)
//   node tools/test/scores.mjs   (ต้องรัน tools/test/server.mjs ก่อน · ยิงเฉพาะเซิร์ฟเวอร์จำลอง)
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import puppeteer from "puppeteer-core";
import { ROOT, TOOLS, BLOCK_REAL_API } from "../lib.mjs";

const cfg = JSON.parse(fs.readFileSync(path.join(TOOLS, ".cache", "admin.json"), "utf8")), BASE = `http://localhost:${cfg.port}`;
const raw = async (action, p = {}) => (await fetch(BASE + "/api", { method: "POST", body: JSON.stringify({ action, ...p }) })).json();
const api = async (action, p = {}) => { const r = await raw(action, p); if (!r.ok) throw new Error(action + ": " + r.error); return r.data; };
let bad = 0;
const t = (name, ok, info = "") => { if (!ok) bad++; console.log((ok ? "PASS " : "FAIL ") + name + (ok || !info ? "" : "  " + String(info).slice(0, 200))); };
const OUT = path.join(TOOLS, ".cache", "scores"); fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });

// ข้อมูล: 2 ห้อง · คนที่ 1 ตอบผิดทั้งหมดในมาตรฐานหนึ่ง (ต้องเป็นตัวชี้วัดที่อ่อน)
const sup = (await api("login", { username: cfg.username, password: cfg.password })).token;
await api("addStudents", { token: sup, schoolId: cfg.schoolId, level: "P6", text: "6/1,2,นักเรียนคนที่สอง\n6/2,1,นักเรียนห้องสอง" });
await api("roomCodes", { token: sup, schoolId: cfg.schoolId, level: "P6" });
const code = cfg.rooms.P6, stu = (await api("enter", { code })).students.find(s => s.no === "1");
const meta = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "P6", "meta.json"), "utf8")), k = Object.keys(meta.pool).find(x => x.includes("|") && meta.pool[x].length >= 4), weakInd = k.split("|")[1];
await api("submitAttempt", { attemptId: "sc-1", code, studentId: stu.id, mode: "practice", standard: k.split("|")[0], keys: meta.pool[k].slice(0, 4), answers: {}, rev: {} });

const browser = await puppeteer.launch({ executablePath: ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"].find(f => fs.existsSync(f)), headless: true, args: BLOCK_REAL_API });
try {
  const page = await browser.newPage(); await page.setViewport({ width: 390, height: 820, isMobile: true, hasTouch: true });
  const errs = []; page.on("pageerror", e => errs.push(e.message));
  const cdp = await page.createCDPSession(); await cdp.send("Browser.setDownloadBehavior", { behavior: "allow", downloadPath: OUT });
  const waitText = (re, ms = 15000) => page.waitForFunction(r => new RegExp(r).test(document.getElementById("app").textContent), { timeout: ms }, re.source);
  await page.goto(BASE + "/", { waitUntil: "networkidle0" }); await page.evaluate(() => { localStorage.clear(); S.token = null; admin(); });
  await page.waitForSelector("#lg"); await page.type("#lg [name=u]", cfg.username); await page.type("#lg [name=p]", cfg.password); await page.$eval("#lg", f => f.requestSubmit());
  await page.waitForSelector("#bnav [data-k=report]"); await page.$eval("#bnav [data-k=report]", b => b.click()); await waitText(/คะแนนนักเรียน/);
  t("รายงานเปิดมาที่แท็บ 'คะแนนรายคน' เป็นอย่างแรก", await page.evaluate(() => document.querySelector("[data-a=rsub].on")?.textContent === "คะแนนรายคน"));
  await page.select("#rr", "6/1"); await waitText(/ห้อง 6\/1/);
  const names = await page.$$eval("table.sc [data-a=stu]", b => b.map(x => x.textContent));
  t("เลือกห้อง 6/1 → ตารางมีนักเรียนทุกคนของห้องนั้น เรียงเลขที่ และไม่มีห้องอื่น", names.length === 2 && /^1\./.test(names[0]) && /^2\./.test(names[1]) && !names.some(n => /ห้องสอง/.test(n)), JSON.stringify(names));
  t("ตารางมีคอลัมน์ ถูกรวม + ทุกมาตรฐาน + ทำล่าสุด", await page.evaluate(n => document.querySelectorAll("table.sc tr:first-child th").length === 3 + n + 1, meta.standards.length));
  t("คนที่ยังไม่ทำแสดง 'ยังไม่เคยทำ'", /ยังไม่เคยทำ/.test(await page.$eval("table.sc", e => e.textContent)));
  t("ไม่ล้นจอ 390px (ตารางเลื่อนในกรอบ)", await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await page.screenshot({ path: path.join(OUT, "table.png") });
  await page.$eval("table.sc [data-a=stu]", b => b.click()); await waitText(/ตัวชี้วัดที่ควรเสริม/);
  const txt = await page.$eval("#app", e => e.textContent);
  t("กดชื่อ → หน้ารายคน: ชื่อ ครั้งที่ทำ ถูกรวม", txt.includes(stu.name) && /ครั้งที่ทำ/.test(txt) && /ถูกรวม/.test(txt));
  t(`กดชื่อ → เห็นตัวชี้วัดที่อ่อน (${weakInd} ถูก 0%)`, txt.includes(weakInd) && /0%/.test(txt), txt.slice(0, 200));
  t("หน้ารายคนบอกตัวชี้วัดที่ยังไม่เคยทำ", /ยังไม่เคยทำ \(\d+ ตัวชี้วัด\)/.test(txt));
  await page.screenshot({ path: path.join(OUT, "student.png") });
  await page.$eval("[data-a=stu][data-id='']", b => b.click()); await waitText(/คะแนนนักเรียน/);
  t("ปุ่มกลับตารางคะแนนทำงาน และยังอยู่ห้องเดิม", /ห้อง 6\/1/.test(await page.$eval("#app", e => e.textContent)));
  await page.$eval("[data-a=xlsx]", b => b.click());
  let f = ""; for (let i = 0; i < 40 && !f; i++) { await new Promise(r => setTimeout(r, 250)); f = fs.readdirSync(OUT).find(x => x.endsWith(".xlsx")) || ""; }
  t("ดาวน์โหลดไฟล์ .xlsx ได้ ชื่อไฟล์บอกระดับและห้อง", /^คะแนน-ป\.6-ห้อง6-1-\d{4}-\d{2}-\d{2}\.xlsx$/.test(f), f);
  if (f) {
    const dir = path.join(OUT, "unz"); const r = spawnSync("powershell", ["-NoProfile", "-Command", `Copy-Item -LiteralPath '${path.join(OUT, f)}' '${path.join(OUT, "x.zip")}'; Expand-Archive -LiteralPath '${path.join(OUT, "x.zip")}' -DestinationPath '${dir}' -Force`], { encoding: "utf8" });
    const sheet = fs.existsSync(path.join(dir, "xl", "worksheets", "sheet1.xml")) ? fs.readFileSync(path.join(dir, "xl", "worksheets", "sheet1.xml"), "utf8") : "";
    t("ไฟล์ Excel เป็น zip ถูกต้อง มีโครงสร้าง xlsx ครบ (เปิดด้วย Excel/Google Sheets ได้)", !r.status && sheet && ["[Content_Types].xml", "xl/workbook.xml", "xl/styles.xml", "_rels/.rels"].every(p => fs.existsSync(path.join(dir, p))), r.stderr);
    t("ไฟล์ Excel: ภาษาไทยถูกต้อง หัวตาราง + นักเรียน 2 คน (ไม่มีห้องอื่น)", sheet.includes("ชื่อ-สกุล") && sheet.includes(stu.name) && sheet.includes("นักเรียนคนที่สอง") && !sheet.includes("ห้องสอง") && (sheet.match(/<row /g) || []).length === 3);
    t("ไฟล์ Excel: คะแนนเป็นตัวเลข (คำนวณต่อใน Excel ได้) และมีคอลัมน์ตัวชี้วัดที่อ่อน", /<c r="D2"><v>1<\/v><\/c>/.test(sheet) && sheet.includes(weakInd));
  }
  t("ไม่มี JS error", !errs.length, errs.join(" | "));
} finally { await browser.close(); }
console.log(bad ? `\nล้มเหลว ${bad} รายการ` : "\nผ่านทั้งหมด");
process.exit(bad ? 1 : 0);
