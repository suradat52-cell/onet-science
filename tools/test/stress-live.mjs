// ส่งผลสอบของโรงเรียนทดสอบทีละชุด ห่างกัน 10 วินาที (สูงสุด 20 ชุด) เพื่อหาขั้นที่ค้างใน Apps Script · หยุดทันทีที่ชุดใดช้ากว่า 20 วินาที
//   node tools/test/stress-live.mjs [ชุด=20] [ห่าง(วินาที)=10]
// ทุกคำขอส่ง trace:1 → Apps Script เก็บรอยเวลาทุกขั้นลงแคช แล้วสคริปต์นี้อ่านกลับด้วย action "traces" (อ่านได้แม้ชีตค้าง)
// เป้าหมายเริ่มต้น = เซิร์ฟเวอร์จำลอง · ระบบจริง: ONET_STRESS_TARGET=live ONET_ALLOW_LIVE=yes ONET_LIVE_ROOM=<รหัสห้องโรงเรียนทดสอบ>
// id ของผลที่สร้างขึ้นขึ้นต้นด้วย "stress-" ทั้งหมด → ลบทิ้งได้เฉพาะชุดนี้ด้วย action purgeAttempts (prefix "stress-") ไม่แตะข้อมูลอื่น
import fs from "fs";
import path from "path";
import { at, TOOLS } from "../lib.mjs";

const LIVE = process.env.ONET_STRESS_TARGET === "live";
if (LIVE && (process.env.ONET_ALLOW_LIVE !== "yes" || !process.env.ONET_LIVE_ROOM)) { console.error("ปฏิเสธ: ยิงระบบจริงต้องตั้ง ONET_ALLOW_LIVE=yes และ ONET_LIVE_ROOM=<รหัสห้อง>"); process.exit(2); }
const N = Math.min(20, +(process.argv[2] || 20)), GAP = +(process.argv[3] || 10) * 1000, LIMIT = 20000;
const html = fs.readFileSync(at("index.html"), "utf8");
const cfg = JSON.parse(fs.readFileSync(path.join(TOOLS, ".cache", "admin.json"), "utf8"));
const API = LIVE ? html.match(/const API_URL = '([^']+)'/)[1] : `http://localhost:${cfg.port}/api`;
const code = LIVE ? process.env.ONET_LIVE_ROOM : cfg.rooms.P6;
const call = async (action, p = {}, ms = 60000) => { const t0 = Date.now(); try { const r = await (await fetch(API, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action, ...p }), signal: AbortSignal.timeout(ms) })).json(); return { ok: r.ok, data: r.data, error: r.error, ms: Date.now() - t0 }; } catch (e) { return { ok: false, error: String(e.name === "TimeoutError" ? "หมดเวลา " + ms / 1000 + " วินาที" : e), ms: Date.now() - t0, timeout: true }; } };
const J = rel => LIVE ? fetch("https://suradat52-cell.github.io/onet-science/content/" + rel).then(r => r.json()) : JSON.parse(fs.readFileSync(at("content", rel), "utf8"));
const mf = await J("manifest.json"), meta = await J("P6/meta.json"), y = meta.years[0], qs = await J(`P6/q-${y}.json`), ks = await J(`P6/k-${y}.json`);
const rev = mf.files[`P6/k-${y}.json`];
const e = await call("enter", { code }, 30000);
if (!e.ok) { console.error("เข้าห้องไม่ได้:", e.error); process.exit(1); }
if (!/ทดสอบ/.test(e.data.school)) { console.error("ปฏิเสธ: ห้องนี้ไม่ใช่ของโรงเรียนทดสอบ (" + e.data.school + ")"); process.exit(2); }
const stu = e.data.students[0];
console.log(`เป้าหมาย: ${LIVE ? "ระบบจริง" : "เซิร์ฟเวอร์จำลอง"} · โรงเรียน "${e.data.school}" · นักเรียน ${stu.name} · enter ใช้ ${e.ms} ms · ส่ง ${N} ชุด ห่าง ${GAP / 1000} วินาที (หยุดถ้าช้ากว่า ${LIMIT / 1000} วินาที)`);
const run = Date.now(), ids = [], rows = [];
let seed = 3; const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
for (let i = 0; i < N; i++) {
  const answers = {}; qs.forEach(q => { answers[`${y}/${q.itemNo}`] = rnd() < 0.6 ? ks[q.itemNo].a.split("|")[0].split(",")[0] : "1"; });
  const aid = `stress-${run}-${i}`; ids.push(aid);
  const r = await call("submitAttempt", { code, studentId: stu.id, attemptId: aid, mode: "year", standard: y, keys: qs.map(q => `${y}/${q.itemNo}`), answers, rev: { [y]: rev }, trace: 1 }, LIMIT + 5000);
  rows.push({ i, aid, ms: r.ms, ok: r.ok, err: r.error });
  console.log(`#${String(i + 1).padStart(2)} ${r.ok ? "สำเร็จ" : "ล้มเหลว (" + r.error + ")"} ${r.ms} ms`);
  if (r.ms > LIMIT || !r.ok) { console.log(`>>> หยุด: ชุดที่ ${i + 1} ${r.ok ? "ช้ากว่า " + LIMIT / 1000 + " วินาที" : "ไม่สำเร็จ"}`); break; }
  if (i < N - 1) await new Promise(res => setTimeout(res, GAP));
}
// อ่านรอยเวลา (ไม่แตะชีต)
await new Promise(res => setTimeout(res, 1500));
const tr = await call("traces", { n: 40 }, 30000);
const mine = (tr.data || []).filter(t => t.a === "submitAttempt");
const worst = [...mine].sort((a, b) => (b.s.at(-1)?.[1] || 0) - (a.s.at(-1)?.[1] || 0)).slice(0, 3);
console.log(`\nสรุป: ส่งแล้ว ${rows.length} ชุด · เร็วสุด ${Math.min(...rows.map(r => r.ms))} ms · ช้าสุด ${Math.max(...rows.map(r => r.ms))} ms · เฉลี่ย ${Math.round(rows.reduce((a, r) => a + r.ms, 0) / rows.length)} ms · ผลสอบที่สร้าง id ขึ้นต้น "stress-${run}"`);
console.log(`รอยเวลา (ขั้น: ms นับจากรับคำขอ) ของ 3 งานที่ช้าสุด จากที่เก็บไว้ ${mine.length} งาน:`);
for (const t of worst) console.log(` - ${t.id}: ` + t.s.map(([n, ms]) => `${n} ${ms}`).join(" → "));
const last = mine.at(-1); if (last && !rows.at(-1).ok) console.log("งานสุดท้าย (ที่ล้ม/ช้า) หยุดอยู่ที่ขั้น: " + (last.s.at(-1)?.[0] || "?"));
// ขั้นที่กินเวลานานสุดเฉลี่ย
const dur = {}; mine.forEach(t => t.s.forEach(([n, ms], k) => { const d = ms - (k ? t.s[k - 1][1] : 0); (dur[n] = dur[n] || []).push(d); }));
console.log("เวลาเฉลี่ยก่อนถึงแต่ละขั้น (ms): " + Object.entries(dur).map(([n, v]) => `${n}=${Math.round(v.reduce((a, b) => a + b, 0) / v.length)}`).join(" · "));
fs.writeFileSync(path.join(TOOLS, ".cache", "stress-" + (LIVE ? "live" : "mock") + ".json"), JSON.stringify({ run, rows, traces: mine }, null, 1));
console.log(`\nprefix สำหรับลบ: stress-${run}`);
