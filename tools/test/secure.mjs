// ทดสอบโครงของ "โหมดสอบของครู" (secure): เฉลยไม่ถูกส่งไปเครื่องนักเรียน — ต้องรัน tools/test/server.mjs ก่อน
// node tools/test/secure.mjs
// ยังไม่มีหน้าจอสำหรับครู: ทดสอบโดยเรียก quiz(..., secure=true) ในหน้าเว็บตรง ๆ เพื่อยืนยันว่าโครงใช้งานได้ ไม่ต้องรื้อภายหลัง
import fs from "fs";
import puppeteer from "puppeteer-core";
import { at, BLOCK_REAL_API, expectedScore } from "../lib.mjs";

const EDGE = ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "C:/Program Files/Microsoft/Edge/Application/msedge.exe"].find(f => fs.existsSync(f));
const cfg = JSON.parse(fs.readFileSync(at("tools", ".cache", "admin.json"), "utf8"));
const BASE = `http://localhost:${cfg.port}/`;
const api = async (action, p = {}) => { const r = await (await fetch(BASE + "api", { method: "POST", body: JSON.stringify({ action, ...p }) })).json(); if (!r.ok) throw new Error(r.error); return r.data; };
let bad = 0;
const t = (name, ok, info = "") => { if (!ok) bad++; console.log((ok ? "PASS " : "FAIL ") + name + (ok ? "" : "  " + info)); };

const token = (await api("login", { username: cfg.username, password: cfg.password })).token;
const count = async () => (await api("report", { token, schoolId: cfg.schoolId, level: "P6" })).students.reduce((n, s) => n + s.n, 0);
const before = await count();

const browser = await puppeteer.launch({ executablePath: EDGE, headless: true, args: BLOCK_REAL_API });
const page = await browser.newPage();
const reqs = []; page.on("request", r => reqs.push(r.url()));
page.on("dialog", d => d.accept());
await page.goto(BASE, { waitUntil: "networkidle0" }); await page.evaluate(() => localStorage.clear()); await page.goto(BASE, { waitUntil: "networkidle0" });
await page.type("#cc", cfg.rooms.P6); await page.$eval("#cf button", b => b.click());
await page.waitForSelector('button[data-a="pick"]'); await page.$eval('button[data-a="pick"]', b => b.click());
await page.waitForSelector(".scard");
const year = await page.evaluate(async () => (await cj(S.level + "/meta.json")).years[0]);
const mark = reqs.length;
await page.evaluate(y => quiz("year", y, undefined, 0, true), year);
await page.waitForSelector("#qcard");
await page.evaluate(() => { Q.qs.forEach(q => { if (q.type === "mc") Q.ans[q.id] = "1"; }); }); // ตอบข้อ 1 ทุกข้อปรนัย (ผ่าน state เดียวกับที่ช่องตอบเขียน)
await page.$eval('[data-a="sheet"]', b => b.click()); await page.$eval('#sheet [data-a="submit"]', b => b.click());
await page.waitForFunction(() => /ได้ .*%/.test(document.querySelector("h2")?.textContent || ""), { timeout: 30000 });
const text = await page.$eval("main", m => m.innerText), h2 = await page.$eval("h2", h => h.textContent);
await browser.close();

const k = JSON.parse(fs.readFileSync(at("content", "P6", `k-${year}.json`), "utf8")), q = JSON.parse(fs.readFileSync(at("content", "P6", `q-${year}.json`), "utf8"));
let exp = 0, max = 0;
q.forEach(x => { const e = k[x.itemNo], ans = e.t === "mc" ? "1" : ""; exp += expectedScore("P6", year, e.t, ans, e.a); max += x.points; });
const pctExp = Math.round(exp * 100 / max);
t(`โหมด secure: ผลที่แสดงมาจากเซิร์ฟเวอร์ (${h2.trim()}) ตรงกับที่คำนวณแยก ${pctExp}%`, new RegExp("ได้ " + pctExp + "%").test(h2), h2);
t("โหมด secure: ไม่มีคำว่า เฉลย: / ไม่มีเฉลยละเอียด ในหน้าผลลัพธ์", !/เฉลย:|ดูเฉลยละเอียด/.test(text));
const after = reqs.slice(mark);
t("โหมด secure: เครื่องนักเรียนไม่ได้ขอไฟล์เฉลย (k-*.json) และไม่ขอเฉลยละเอียด (s-*.json)", !after.some(u => /\/content\/[A-Z0-9]+\/(k|s)-\d+\.json/.test(u)), after.filter(u => /\/content\//.test(u)).join(" "));
t("โหมด secure: บันทึกคะแนนแล้ว 1 ครั้ง (ในคำขอเดียวกับการตรวจ)", (await count()) === before + 1);
process.exit(bad ? 1 : 0);
