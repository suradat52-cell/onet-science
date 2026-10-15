// จำลองนักเรียน N คน (ค่าเริ่มต้น 30) เข้าห้อง → ความคืบหน้า → ส่งคำตอบ พร้อมกัน แล้ววัดเวลาของแต่ละคำสั่ง
// และของคำขอ enter ที่ยิงทุก 300 ms ระหว่างนั้น (เหมือนนักเรียนอีกคนที่เพิ่งเข้าห้อง)
//   node tools/test/load.mjs [จำนวนคน=30]
// ปลอดภัยโดยปริยาย: ต้องตั้ง ONET_ALLOW_LOAD=yes (ไม่ตั้ง = ปฏิเสธ) · เป้าหมายเริ่มต้น = เซิร์ฟเวอร์จำลองในเครื่อง (ต้องรัน tools/test/server.mjs ก่อน)
// ยิงระบบจริง (เขียนข้อมูลลงชีตจริง!): ต้องตั้ง ONET_LOAD_TARGET=live และ ONET_ALLOW_LIVE=yes และ ONET_LIVE_ROOM=<รหัสห้องทดสอบ> เพิ่ม — ใช้เมื่อเจ้าของระบบสั่งเท่านั้น
import fs from "fs";
import path from "path";
import { at, TOOLS } from "../lib.mjs";

if (process.env.ONET_ALLOW_LOAD !== "yes") { console.error("ปฏิเสธ: ทดสอบนักเรียนพร้อมกันต้องตั้ง ONET_ALLOW_LOAD=yes ก่อน (เจ้าของระบบเป็นคนสั่ง)"); process.exit(2); }
const LIVE = process.env.ONET_LOAD_TARGET === "live";
if (LIVE && (process.env.ONET_ALLOW_LIVE !== "yes" || !process.env.ONET_LIVE_ROOM)) { console.error("ปฏิเสธ: ยิงระบบจริงต้องตั้ง ONET_ALLOW_LIVE=yes และ ONET_LIVE_ROOM=<รหัสห้อง>"); process.exit(2); }
const N = +(process.argv[2] || 30);
const cfg = JSON.parse(fs.readFileSync(path.join(TOOLS, ".cache", "admin.json"), "utf8"));
const API = LIVE ? fs.readFileSync(at("index.html"), "utf8").match(/const API_URL = '([^']+)'/)[1] : `http://localhost:${cfg.port}/api`;
const lat = {}; const rec = (a, ms, ok) => { (lat[a] = lat[a] || []).push([ms, ok]); };
const call = async (action, p = {}, label) => { const t0 = Date.now(); let ok = false; try { const r = await (await fetch(API, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action, ...p }), signal: AbortSignal.timeout(90000) })).json(); ok = r.ok; return r; } catch (e) { return { ok: false, error: String(e) }; } finally { rec(label || action, Date.now() - t0, ok); } };
const J = rel => JSON.parse(fs.readFileSync(at("content", rel), "utf8"));
let code, students;
if (LIVE) { code = process.env.ONET_LIVE_ROOM; students = (await call("enter", { code })).data?.students || []; lat.enter = []; if (!students.length) { console.error("ห้องทดสอบไม่มีนักเรียน"); process.exit(1); } }
else {
  const token = (await call("login", { username: cfg.username, password: cfg.password })).data.token;
  const sid = (await call("saveSchool", { token, name: "โรงเรียนทดสอบโหลด " + Date.now() })).data.id;
  await call("addStudents", { token, schoolId: sid, level: "P6", text: Array.from({ length: N }, (_, i) => `6/9,${i + 1},นักเรียนโหลด ${i + 1}`).join("\n") });
  code = (await call("roomCodes", { token, schoolId: sid, level: "P6" })).data[0].code;
  students = (await call("enter", { code })).data.students; Object.keys(lat).forEach(k => delete lat[k]);
}
const y = J("P6/meta.json").years[0], qs = J(`P6/q-${y}.json`), ks = J(`P6/k-${y}.json`);
let seed = 7; const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const stu = i => students[i % students.length];
let stop = false;
const probe = (async () => { while (!stop) { await call("enter", { code }, "enter (ตัวตรวจ)"); await new Promise(r => setTimeout(r, 300)); } })();
const t0 = Date.now();
await Promise.all(Array.from({ length: N }, async (_, i) => {
  const s = stu(i);
  const e = await call("enter", { code }); if (!e.ok) return;
  await call("progress", { code, studentId: s.id });
  const answers = {}; qs.forEach(q => { const k = ks[q.itemNo]; answers[`${y}/${q.itemNo}`] = rnd() < 0.6 ? k.a.split("|")[0].split(",")[0] : "1"; });
  await call("submitAttempt", { code, studentId: s.id, attemptId: "load-" + Date.now() + "-" + i, mode: "year", standard: y, keys: qs.map(q => `${y}/${q.itemNo}`), answers, rev: { [y]: "" } });
}));
stop = true; await probe;
const pct = (a, p) => { const s = [...a].sort((x, z) => x - z); return s[Math.min(s.length - 1, Math.floor(s.length * p))]; };
console.log(`\nนักเรียน ${N} คน พร้อมกัน เป้าหมาย: ${LIVE ? "ระบบจริง (Apps Script)" : "เซิร์ฟเวอร์จำลองในเครื่อง"} · ใช้เวลารวม ${((Date.now() - t0) / 1000).toFixed(1)} วินาที`);
console.log("คำสั่ง              ครั้ง   ล้มเหลว   p50 (ms)   p95 (ms)   สูงสุด (ms)");
for (const [a, v] of Object.entries(lat)) { const ms = v.map(x => x[0]); console.log(`${a.padEnd(18)} ${String(v.length).padStart(5)} ${String(v.filter(x => !x[1]).length).padStart(9)} ${String(pct(ms, .5)).padStart(10)} ${String(pct(ms, .95)).padStart(10)} ${String(Math.max(...ms)).padStart(12)}`); }
