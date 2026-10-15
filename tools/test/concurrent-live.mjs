// ทดสอบคำขอซ้อนกันกับระบบจริง (เฉพาะโรงเรียนทดสอบ) เป็นขั้น: 1 = ส่งพร้อมกัน 3 · 2 = ส่งพร้อมกัน 10 · 3 = ห้อง 30 คน (เข้าห้อง→ความคืบหน้า→ส่งคำตอบ เริ่มห่างกันสุ่ม 0–30 วินาที ปิด trace)
//   ONET_CONC_TARGET=live ONET_ALLOW_LIVE=yes ONET_LIVE_ROOM=<ป.6> ONET_LIVE_ROOM2=<ม.3> node tools/test/concurrent-live.mjs <1|2|3> [trace=0|1]
// หยุดทันทีที่มีคำขอใดช้ากว่า 20 วินาที (ไม่ส่งเพิ่ม) → อ่าน traces แล้วรอดูว่าฟื้นไหม (probe enter ทุก 30 วินาที สูงสุด 10 นาที)
// ผลสอบที่สร้างมี id ขึ้นต้น "conc-" → ลบด้วย purgeAttempts (prefix conc-)
import fs from "fs";
import path from "path";
import { at, TOOLS } from "../lib.mjs";

const LIVE = process.env.ONET_CONC_TARGET === "live";
if (LIVE && (process.env.ONET_ALLOW_LIVE !== "yes" || !process.env.ONET_LIVE_ROOM)) { console.error("ปฏิเสธ: ยิงระบบจริงต้องตั้ง ONET_ALLOW_LIVE=yes และ ONET_LIVE_ROOM"); process.exit(2); }
const STEP = +(process.argv[2] || 1), TRACE = process.argv[3] === undefined ? STEP < 3 : process.argv[3] === "1", LIMIT = 20000;
const cfg = JSON.parse(fs.readFileSync(path.join(TOOLS, ".cache", "admin.json"), "utf8"));
const API = LIVE ? fs.readFileSync(at("index.html"), "utf8").match(/const API_URL = '([^']+)'/)[1] : `http://localhost:${cfg.port}/api`;
const rooms = LIVE ? [process.env.ONET_LIVE_ROOM, process.env.ONET_LIVE_ROOM2].filter(Boolean) : [cfg.rooms.P6, cfg.rooms.M3];
const J = rel => LIVE ? fetch("https://suradat52-cell.github.io/onet-science/content/" + rel).then(r => r.json()) : Promise.resolve(JSON.parse(fs.readFileSync(at("content", rel), "utf8")));
let stopped = false; const rows = [];
const call = async (label, action, p = {}) => {
  const t0 = Date.now(); let r;
  try { r = await (await fetch(API, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action, ...p }), signal: AbortSignal.timeout(LIMIT + 25000) })).json(); }
  catch (e) { r = { ok: false, error: String(e.name === "TimeoutError" ? "หมดเวลา" : e) }; }
  const ms = Date.now() - t0; rows.push({ label, ms, ok: r.ok, err: r.error }); if (ms > LIMIT || !r.ok) stopped = true; return { ...r, ms };
};
const mf = await J("manifest.json"); const lv = {};
for (const [i, code] of rooms.entries()) {
  const e = await call("setup-enter", "enter", { code }); rows.pop(); if (!e.ok) { console.error("เข้าห้องไม่ได้", code, e.error); process.exit(1); }
  if (!/ทดสอบ/.test(e.data.school)) { console.error("ปฏิเสธ: ไม่ใช่โรงเรียนทดสอบ", e.data.school); process.exit(2); }
  const L = e.data.level, meta = await J(`${L}/meta.json`), y = meta.years[0], qs = await J(`${L}/q-${y}.json`), ks = await J(`${L}/k-${y}.json`);
  lv[code] = { L, y, qs, ks, stu: e.data.students[0], rev: mf.files[`${L}/k-${y}.json`] };
}
const run = Date.now(); let seed = 11; const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const submit = (code, tag) => { const c = lv[code], answers = {}; c.qs.forEach(q => { answers[`${c.y}/${q.itemNo}`] = rnd() < 0.6 ? c.ks[q.itemNo].a.split("|")[0].split(",")[0] : "1"; });
  return call("submitAttempt", "submitAttempt", { code, studentId: c.stu.id, attemptId: `conc-${STEP}-${run}-${tag}`, mode: "year", standard: c.y, keys: c.qs.map(q => `${c.y}/${q.itemNo}`), answers, rev: { [c.y]: c.rev }, ...(TRACE ? { trace: 1 } : {}) }); };
const t0 = Date.now(); const sleep = ms => new Promise(r => setTimeout(r, ms));
if (STEP === 1 || STEP === 2) {
  const n = STEP === 1 ? 3 : 10;
  await Promise.all(Array.from({ length: n }, (_, i) => submit(rooms[i % rooms.length], i)));
} else {
  await Promise.all(Array.from({ length: 30 }, async (_, i) => {
    await sleep(Math.floor(rnd() * 30000)); if (stopped) return;
    const code = rooms[i % rooms.length], c = lv[code];
    const e = await call("enter", "enter", { code }); if (stopped || !e.ok) return;
    await sleep(1000 + Math.floor(rnd() * 2000));                       // เลือกชื่อ
    await call("progress", "progress", { code, studentId: c.stu.id }); if (stopped) return;
    await sleep(2000 + Math.floor(rnd() * 3000));                       // ทำข้อสอบ (ย่อ)
    await submit(code, i);
  }));
}
const wall = ((Date.now() - t0) / 1000).toFixed(1);
const by = {}; rows.forEach(r => (by[r.label] = by[r.label] || []).push(r));
console.log(`\nขั้น ${STEP} · ${LIVE ? "ระบบจริง" : "เซิร์ฟเวอร์จำลอง"} · trace ${TRACE ? "เปิด" : "ปิด"} · ใช้เวลารวม ${wall} วินาที`);
console.log("คำสั่ง              จำนวน  เฉลี่ย(ms)  ช้าสุด(ms)  ล้มเหลว/เกิน 20 วินาที");
for (const [k, v] of Object.entries(by)) { const m = v.map(x => x.ms); console.log(`${k.padEnd(18)} ${String(v.length).padStart(5)} ${String(Math.round(m.reduce((a, b) => a + b, 0) / m.length)).padStart(10)} ${String(Math.max(...m)).padStart(11)}  ${v.filter(x => !x.ok || x.ms > LIMIT).length}`); }
if (TRACE && !stopped) {
  const tr = await call("traces", "traces", { n: 40 }), all = (tr.data || []).filter(t => t.s.some(x => x[0] === "end")).sort((p, q) => q.s.at(-1)[1] - p.s.at(-1)[1]);
  console.log("\nรอยเวลาของ 4 งานที่ช้าสุด (ขั้น ms นับจากรับคำขอ):"); all.slice(0, 4).forEach(t => console.log(" - " + t.a + ": " + t.s.map(([n, ms]) => n + " " + ms).join(" → ")));
  const dur = {}; all.forEach(t => t.s.forEach(([n, ms], k) => { const d = ms - (k ? t.s[k - 1][1] : 0); (dur[n] = dur[n] || []).push(d); }));
  console.log("ขั้นที่ใช้เวลาต่อครั้งสูงสุด (ms): " + Object.entries(dur).map(([n, v]) => [n, Math.max(...v)]).sort((p, q) => q[1] - p[1]).slice(0, 6).map(x => x.join("=")).join(" · "));
}
if (stopped) {
  console.log(`\n>>> พบคำขอช้ากว่า ${LIMIT / 1000} วินาทีหรือล้มเหลว: ` + JSON.stringify(rows.filter(r => !r.ok || r.ms > LIMIT).slice(0, 4)));
  const tr = await call("traces", "traces", { n: 40 }); const mine = (tr.data || []).filter(t => String(t.id).length);
  const stuck = mine.filter(t => !t.s.some(s => s[0] === "end")); console.log(`รอยเวลาที่ไม่ถึงขั้น end (ค้าง/ถูกยกเลิก) ${stuck.length} งาน`);
  stuck.slice(0, 5).forEach(t => console.log(" - " + t.a + " หยุดที่ขั้น: " + t.s.at(-1)?.[0] + " @" + t.s.at(-1)?.[1] + " ms · " + t.s.map(([n, ms]) => `${n} ${ms}`).join(" → ")));
  // รอดูว่าฟื้นไหม
  const start = Date.now(); let ok = false;
  while (Date.now() - start < 600000) { const r = await call("probe", "enter", { code: rooms[0] }); if (r.ok && r.ms < 15000) { ok = true; break; } await sleep(30000); }
  console.log(ok ? `ฟื้นแล้วหลัง ${Math.round((Date.now() - start) / 1000)} วินาที` : ">>> ไม่ฟื้นภายใน 10 นาที — หยุดและรายงาน");
}
console.log(`\nprefix สำหรับลบ: conc-${STEP}-${run}`);
