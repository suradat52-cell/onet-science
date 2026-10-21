// ทดสอบฝั่งครู/แอดมิน (ช่วง 3) กับเซิร์ฟเวอร์จำลอง: มอบงาน · งานที่นักเรียนเห็น · analytics · ก่อน/หลังเรียน · ปิด/เปิดโรงเรียน · สิทธิ์ · หน้ารายงานในเบราว์เซอร์ (heatmap, วิเคราะห์ข้อสอบ, CSV)
// node tools/test/teacher.mjs   (ต้องรัน tools/test/server.mjs ก่อน · ใช้บัญชีแอดมินของชุดทดสอบจำลองเท่านั้น ไม่ยิงระบบจริง)
import fs from "fs";
import path from "path";
import puppeteer from "puppeteer-core";
import { TOOLS, ROOT, BLOCK_REAL_API } from "../lib.mjs";

const cfg = JSON.parse(fs.readFileSync(path.join(TOOLS, ".cache", "admin.json"), "utf8")), BASE = `http://localhost:${cfg.port}`;
const raw = async (action, p = {}) => (await fetch(BASE + "/api", { method: "POST", body: JSON.stringify({ action, ...p }) })).json();
const api = async (action, p = {}) => { const r = await raw(action, p); if (!r.ok) throw new Error(action + ": " + r.error); return r.data; };
let bad = 0;
const t = (name, ok, info = "") => { if (!ok) bad++; console.log((ok ? "PASS " : "FAIL ") + name + (ok || !info ? "" : "  " + info)); };
const meta = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "P6", "meta.json"), "utf8"));
const stdKey = Object.keys(meta.pool).find(k => !k.includes("|") && meta.pool[k].length >= 6), keys = meta.pool[stdKey].slice(0, 6);

const token = (await api("login", { username: cfg.username, password: cfg.password })).token;
const code = cfg.rooms.P6, stu = (await api("enter", { code })).students[0];
const enter = await api("enter", { code });
t("enter ยังมีรูปแบบเดิม (school/level/room/students) ไม่มีฟิลด์แปลกปลอม", ["school", "level", "room", "students"].every(k => k in enter) && !("asg" in enter), Object.keys(enter).join());
const submit = (mode, ks, ans) => api("submitAttempt", { attemptId: "tt" + Math.random().toString(36).slice(2, 10), code, studentId: stu.id, mode, standard: "งานมอบหมาย", keys: ks, answers: Object.fromEntries(ks.map(k => [k, ans])), rev: {} });

/* มอบงาน */
const a1 = (await api("saveAssignment", { token, schoolId: cfg.schoolId, level: "P6", room: "", title: "ฝึกทดสอบ 1", kind: "practice", std: stdKey, keys, due: "2099-01-01", note: "ทำให้เสร็จ" })).id;
let pr = await api("progress", { code, studentId: stu.id });
t("นักเรียนเห็นงานที่มอบ (progress.assignments) พร้อมชุดข้อ", pr.assignments.length === 1 && pr.assignments[0].id === a1 && pr.assignments[0].keys.length === 6 && pr.assignments[0].due === "2099-01-01", JSON.stringify(pr.assignments));
await api("saveAssignment", { token, schoolId: cfg.schoolId, level: "P6", room: "ห้องที่ไม่มี", title: "งานห้องอื่น", kind: "practice", keys });
pr = await api("progress", { code, studentId: stu.id });
t("งานที่มอบให้ห้องอื่นไม่โผล่ในห้องนี้", pr.assignments.length === 1);
t("มอบงานโดยไม่มีชุดข้อ/ไม่มีชื่อ → ปฏิเสธ", (await raw("saveAssignment", { token, schoolId: cfg.schoolId, level: "P6", title: "x", kind: "practice", keys: [] })).ok === false && (await raw("saveAssignment", { token, schoolId: cfg.schoolId, level: "P6", title: " ", kind: "practice", keys })).ok === false);
const r1 = await submit("asg:" + a1, keys, "9");
pr = await api("progress", { code, studentId: stu.id });
t("ทำงานแล้ว: progress.asg นับครั้ง/คะแนนดีที่สุด", pr.asg["asg:" + a1] && pr.asg["asg:" + a1].n === 1 && pr.asg["asg:" + a1].best >= 0, JSON.stringify(pr.asg));
t("progress.qs มีรายข้อ (h = ประวัติถูกผิด)", Object.keys(pr.qs).length === 6 && Object.values(pr.qs).every(q => /^[01]+$/.test(q.h)));

/* ก่อน/หลังเรียน */
const pre = (await api("saveAssignment", { token, schoolId: cfg.schoolId, level: "P6", room: "", title: "ก่อนเรียน A", kind: "pre", std: stdKey, keys: keys.slice(0, 4) })).id;
const post = (await api("saveAssignment", { token, schoolId: cfg.schoolId, level: "P6", room: "", title: "หลังเรียน A", kind: "post", std: stdKey, keys: keys.slice(0, 4), pair: pre })).id;
await submit("asg:" + pre, keys.slice(0, 4), "9");
await submit("asg:" + post, keys.slice(0, 4), "9");

/* analytics */
const an = await api("analytics", { token, schoolId: cfg.schoolId, level: "P6" });
const me = an.students.find(s => s.id === stu.id);
t("analytics: นักเรียนมีผลรายข้อ", me && me.n >= 3 && Object.keys(me.qs).length === 6, JSON.stringify(me).slice(0, 200));
t("analytics: ผลรายข้อรวม + ตัวลวง (ตอบ 9 ผิดทุกข้อ)", Object.values(an.items).every(i => i.n >= 1 && i.w["9"] >= 1), JSON.stringify(Object.values(an.items)[0]));
t("analytics: ผลของงานที่มอบหมายครบทั้ง 3 งาน", ["asg", "pre", "post"].length === 3 && new Set(an.asg.map(x => x.a)).size === 3 && an.asg.every(x => x.q.length >= 4));
t("analytics: รายการงาน (ไม่รวมงานที่ปิด)", an.assignments.length === 4);
await api("removeAssignment", { token, id: (an.assignments.find(x => x.title === "งานห้องอื่น")).id });
t("ปิดงานแล้วหายจากรายการ แต่ผลที่ทำไว้ยังอยู่", (await api("assignments", { token, schoolId: cfg.schoolId, level: "P6" })).length === 3 && (await api("analytics", { token, schoolId: cfg.schoolId, level: "P6" })).asg.length === 3);

/* สิทธิ์ + ปิด/เปิดโรงเรียน */
const s2 = (await api("saveSchool", { token, name: "โรงเรียนทดสอบ ปิดเปิด" })).id;
await api("addStudents", { token, schoolId: s2, level: "P6", text: "6/9,1,เด็กทดสอบ ปิดเปิด" });
const c2 = (await api("roomCodes", { token, schoolId: s2, level: "P6" }))[0].code;
t("โรงเรียนใหม่เข้าห้องได้", (await api("enter", { code: c2 })).students.length === 1);
await api("saveAdmin", { token, username: "teacher_t", password: "teachpass1", name: "ครูทดสอบ", role: "school", schoolId: s2 });
const tk2 = (await api("login", { username: "teacher_t", password: "teachpass1" })).token;
t("แอดมินโรงเรียนปิด/เปิดโรงเรียนไม่ได้ (เฉพาะแอดมินกลาง)", (await raw("setSchoolActive", { token: tk2, id: s2, active: false })).ok === false);
t("แอดมินโรงเรียนเห็นเฉพาะข้อมูลโรงเรียนตัวเอง (analytics)", (await api("analytics", { token: tk2, schoolId: cfg.schoolId, level: "P6" })).students.every(s => s.name.includes("ปิดเปิด")));
t("แอดมินโรงเรียนมอบงานให้โรงเรียนอื่นไม่ได้ (บังคับเป็นโรงเรียนตัวเอง)", await (async () => { const id = (await api("saveAssignment", { token: tk2, schoolId: cfg.schoolId, level: "P6", title: "x", kind: "practice", keys })).id; return (await api("assignments", { token: tk2, schoolId: cfg.schoolId, level: "P6" })).some(x => x.id === id) && !(await api("assignments", { token, schoolId: cfg.schoolId, level: "P6" })).some(x => x.id === id); })());
t("แอดมินโรงเรียนปิดงานของโรงเรียนอื่นไม่ได้", (await raw("removeAssignment", { token: tk2, id: a1 })).ok === false);
await api("setSchoolActive", { token, id: s2, active: false });
t("ปิดโรงเรียนแล้ว: นักเรียนเข้าห้องไม่ได้", (await raw("enter", { code: c2 })).ok === false);
t("ปิดโรงเรียนแล้ว: รายชื่อโรงเรียนยังอยู่ใน allSchools (active=false) ข้อมูลไม่หาย", (await api("adminData", { token })).allSchools.some(s => s.id === s2 && s.active === false));
await api("setSchoolActive", { token, id: s2, active: true });
t("เปิดโรงเรียนกลับ: เข้าห้องได้เหมือนเดิม", (await api("enter", { code: c2 })).students.length === 1);

/* หน้าเว็บของครู */
const browser = await puppeteer.launch({ executablePath: ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"].find(f => fs.existsSync(f)), headless: true, args: BLOCK_REAL_API });
const page = await browser.newPage(); await page.setViewport({ width: 390, height: 800, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
page.on("dialog", d => d.accept()); page.on("pageerror", e => t("ไม่มี JS error", false, e.message));
const OUT = path.join(TOOLS, ".cache", "teacher"); fs.mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms)), click = async s => { await page.waitForSelector(s); await page.$eval(s, b => b.click()); };
const text = s => page.$eval(s, e => e.textContent).catch(() => "");
const waitText = (re, ms = 15000) => page.waitForFunction(r => new RegExp(r).test(document.getElementById("app").textContent), { timeout: ms }, re.source);
const noOverflow = async n => t("ไม่มีแถบเลื่อนแนวนอนทั้งหน้า: " + n, await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), await page.evaluate(() => document.documentElement.scrollWidth));
await page.goto(BASE + "/", { waitUntil: "networkidle0" });
await page.evaluate(() => { S.token = null; save(); admin(); }); await page.waitForSelector("#lg");
await page.type("#lg [name=u]", cfg.username); await page.type("#lg [name=p]", cfg.password); await page.$eval("#lg", f => f.requestSubmit());
await page.waitForSelector("#bnav [data-k=report]"); await click("#bnav [data-k=report]"); await waitText(/ภาพรวม/); await click("[data-a=rsub][data-s=room]"); await waitText(/ค่าเฉลี่ยตามมาตรฐาน/);
await page.select("#al", "P6").catch(() => {}); await page.waitForSelector("table.hm");
t("รายงาน: heatmap แสดง นักเรียน × มาตรฐาน + แถวเฉลี่ย", (await page.$$("table.hm tr.avg")).length === 1 && (await page.$$eval("table.hm tbody tr, table.hm tr", r => r.length)) >= 3);
t("รายงาน: ค่าเฉลี่ยตามมาตรฐาน + ผู้ที่ยังไม่ทำ", /ค่าเฉลี่ยตามมาตรฐาน/.test(await text("#app")) && /ยังไม่ได้ทำ/.test(await text("#app")));
await noOverflow("รายงาน/ภาพรวมห้อง"); await page.screenshot({ path: path.join(OUT, "room.png"), fullPage: false });
await click('[data-a=rmode][data-m=ind]'); await sleep(600); await page.waitForSelector("table.hm");
t("heatmap สลับเป็นตัวชี้วัดได้ (คอลัมน์เพิ่ม)", (await page.$$eval("table.hm tr:nth-child(2) th", h => h.length)) > 5);
await click('[data-a=rsub][data-s=item]'); await waitText(/วิเคราะห์ข้อสอบ/);
t("วิเคราะห์ข้อสอบ: แสดงข้อ ความยาก ตัวลวง", /ตอบ 9/.test(await text("#app")) && /ยาก/.test(await text("#app")), (await text("#app")).slice(0, 200));
await noOverflow("วิเคราะห์ข้อสอบ"); await page.screenshot({ path: path.join(OUT, "item.png") });
await click('[data-a=rsub][data-s=asg]'); await waitText(/มอบงานใหม่/);
await page.type("#at", "งานจากหน้าเว็บ"); await page.select("#as2", stdKey); await click('[data-a=apick]'); await page.waitForSelector("#apool input");
const picked = await page.$$eval("#apool input:checked", e => e.length);
t("มอบงาน: สุ่มข้อมาให้เลือกได้ 10 ข้อ", picked === 10, picked);
await page.$eval("#ad2", i => { i.value = "2099-12-31"; });
await noOverflow("มอบหมายงาน"); await page.screenshot({ path: path.join(OUT, "asg.png") });
await click('[data-a=asave]'); await waitText(/งานจากหน้าเว็บ/);
t("มอบงานผ่านหน้าเว็บสำเร็จ แสดงในรายการ + นับส่งแล้ว", /งานจากหน้าเว็บ[\s\S]*ส่งแล้ว 0\//.test(await text("#app")));
await click('[data-a=rsub][data-s=cmp]'); await waitText(/ก่อนเรียน/);
t("เทียบก่อน/หลัง: แสดงคู่งาน + รายตัวชี้วัด + รายนักเรียน", /ก่อนเรียน A/.test(await text("#app")) && /รายตัวชี้วัด/.test(await text("#app")) && /รายนักเรียน/.test(await text("#app")));
await noOverflow("ก่อน/หลังเรียน"); await page.screenshot({ path: path.join(OUT, "cmp.png") });
await click('[data-a=rsub][data-s=exp]'); await waitText(/ส่งออกรายงาน/);
const csv = await page.evaluate(() => csvText()), rows = csv.replace(/^\ufeff/, "").split("\r\n");
t("CSV: BOM + หัวตาราง + แถวนักเรียน + แถวเฉลี่ย (ไทยอ่านใน Excel ได้)", csv.charCodeAt(0) === 0xfeff && /^"ห้อง","เลขที่","ชื่อ-สกุล"/.test(rows[0]) && rows.length >= 3 && /เฉลี่ยทั้งกลุ่ม/.test(rows[rows.length - 1]), rows.slice(0, 2).join(" | ").slice(0, 200));
t("CSV: จำนวนคอลัมน์ทุกแถวเท่ากัน", new Set(rows.map(r => r.split('","').length)).size === 1);
await click('[data-k=more]'); await waitText(/โรงเรียน/); await click('[data-a=moresub][data-s=schools]'); await waitText(/ปิดใช้งาน/);
t("แอดมินกลาง: รายการโรงเรียนมีปุ่มปิด/เปิดใช้งาน", (await page.$$('[data-a=schoolact]')).length >= 2);
await noOverflow("โรงเรียน"); await click('[data-a=moresub][data-s=system]'); await waitText(/สถานะระบบ/);
await click('[data-a=diag]'); await waitText(/ผลตรวจระบบ/, 30000);
t("ตรวจสถานะระบบ (diag) แสดงตารางขั้นตอน", /เปิดสเปรดชีต/.test(await text("#app")));
/* นักเรียนเห็นและทำงานที่ครูมอบ */
const sp = await browser.newPage(); await sp.setViewport({ width: 360, height: 780, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
sp.on("dialog", d => d.accept()); sp.on("pageerror", e => t("ไม่มี JS error (นักเรียน)", false, e.message));
await sp.goto(BASE + "/", { waitUntil: "networkidle0" });
await sp.type("#cc", cfg.rooms.P6); await sp.$eval("#cf", f => f.requestSubmit()); await sp.waitForSelector(".pickgrid button"); await sp.$eval(".pickgrid button", b => b.click());
await sp.waitForFunction(() => /งานจากครู/.test(document.getElementById("app").textContent), { timeout: 15000 });
t("นักเรียนเห็นการ์ด 'งานจากครู' ที่หน้าแรก (มีงานฝึก + งานใหม่จากหน้าเว็บ)", await sp.evaluate(() => /ฝึกทดสอบ 1/.test(document.getElementById("app").textContent) && /งานจากหน้าเว็บ/.test(document.getElementById("app").textContent)));
t("งานที่ทำแล้วแสดงสถานะ ทำแล้ว 1 ครั้ง", await sp.evaluate(() => /ทำแล้ว 1 ครั้ง/.test(document.getElementById("app").textContent)));
await sp.screenshot({ path: path.join(OUT, "student-asg.png") });
await sp.evaluate(() => { const b = [...document.querySelectorAll("[data-a=asgstart]")].find(x => /ฝึกทดสอบ 1/.test(x.closest(".mis").textContent)); b.click(); });
await sp.waitForSelector("#qcard");
t("เริ่มงาน: ชื่อ 'งานที่ครูมอบหมาย' และมี 6 ข้อตามชุดที่ครูเลือก", await sp.evaluate(() => /งานที่ครูมอบหมาย/.test(document.querySelector(".examtop").textContent) && /ข้อ 1[/]6/.test(document.getElementById("pcount").textContent)));
await sp.close();
await browser.close();
console.log(bad ? `\nล้มเหลว ${bad} รายการ` : "\nผ่านทั้งหมด");
process.exit(bad ? 1 : 0);
