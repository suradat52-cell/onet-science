/**
 * ติว O-NET วิทยาศาสตร์ ป.6 / ม.3 — Backend (Google Apps Script + Google Sheets)
 * เหลือหน้าที่เดียว: ห้องเรียน นักเรียน แอดมิน และบันทึกคะแนน · เนื้อหา (ผังข้อสอบ ข้อสอบ สรุป เฉลย) อยู่ในไฟล์ JSON บน GitHub Pages (โฟลเดอร์ content/)
 * ผูกสคริปต์นี้กับ Google Sheet 1 ไฟล์ แล้วรัน setup() หนึ่งครั้ง จากนั้น Deploy เป็น Web app (Anyone)
 * สคริปต์นี้ตรวจคะแนนซ้ำเองก่อนบันทึกทุกครั้ง (submitAttempt) โดยโหลดกุญแจเฉลย k-<ปี>.json จาก CONTENT_BASE
 */

const SHEETS = {
  Schools:   ['id', 'name', 'active'],
  Admins:    ['id', 'username', 'salt', 'hash', 'name', 'role', 'schoolId', 'active'],
  Students:  ['id', 'schoolId', 'level', 'room', 'no', 'name', 'active'],
  Rooms:     ['code', 'schoolId', 'level', 'room', 'active'], // รหัสห้องเรียน 6 ตัว ต่อ (โรงเรียน + ระดับ + ห้อง)
  Attempts:  ['id', 'ts', 'schoolId', 'studentId', 'level', 'mode', 'standard', 'total', 'correct', 'detail', 'score', 'maxScore', 'status', 'answers', 'ms'] // status: ok = ตรวจซ้ำแล้ว · pending = ดึงเฉลยไม่ได้ตอนนั้น (เก็บคำตอบไว้ใน answers รอ regrade) · ms = เวลาที่ใช้บันทึก
};
const WRITES = ['roomCodes', 'resetRoomCode', 'saveSchool', 'saveAdmin', 'removeAdmin', 'addStudents', 'removeStudent', 'regrade']; // submitAttempt ล็อกเฉพาะตอนเขียน (หลังโหลดเฉลยเสร็จ)
// ที่อยู่ไฟล์เนื้อหาของเว็บ (GitHub Pages) — ต้องแก้ถ้าย้ายโดเมน
const CONTENT_BASE = 'https://suradat52-cell.github.io/onet-science/content/';

/* GRADING:BEGIN — ช่วงนี้ต้องเหมือนกันทุกตัวอักษรกับ apps-script/Code.gs (ตรวจโดย tools/test/grading.mjs) ใช้ตรวจคะแนนทั้งในเครื่องนักเรียนและบน Apps Script */
/* ชนิดข้อสอบ: mc = ปรนัย (ตัวเลือกว่าง = ตัวเลือกอยู่ในภาพ), complex = เลือกตอบเชิงซ้อน ใช่/ไม่ใช่, order = เรียงลำดับ, fill = เติมคำตอบ */
const TYPES = ['mc', 'complex', 'order', 'fill'];
/* คะแนนต่อข้อตามผังข้อสอบ (Test Blueprint) O-NET ปีการศึกษา 2569
   ป.6: ปรนัย 5 · เลือกตอบเชิงซ้อน 5 | ม.3: ปรนัย 2.75 · เรียงลำดับ 2.75 · เลือกตอบเชิงซ้อน 4
   ชนิดที่ผังของระดับนั้นไม่มี (P6 order/fill, M3 fill) ใช้คะแนนเท่าข้อปรนัย */
const POINTS = { P6: { mc: 5, complex: 5, order: 5, fill: 5 }, M3: { mc: 2.75, complex: 4, order: 2.75, fill: 2.75 } };
/* คะแนนบางส่วนของข้อเชิงซ้อน ตาม "เกณฑ์การให้คะแนน" ในคำชี้แจงของข้อสอบแต่ละฉบับ (ระดับ-ปี)
   ค่า = { จำนวนข้อย่อยที่ตอบถูก: สัดส่วนของคะแนนเต็ม } · ถูกครบทุกข้อย่อยได้คะแนนเต็มเสมอ · ไม่อยู่ในตารางได้ 0
   เก็บเป็นสัดส่วนเพราะคะแนนเต็มต่อข้อใช้ตามผัง 2569 (POINTS) ซึ่งบางปีต่างจากที่พิมพ์ในฉบับนั้น
   เช่น ป.6 2563 พิมพ์ "ข้อละ 6.3 · ถูก 2 ข้อย่อยได้ 3.15" = ครึ่งหนึ่ง · ป.6 2564–2568 "5 · 2.5" · ม.3 2564–2567 "4 · 2"
   ฉบับที่ไม่มีเกณฑ์ในไฟล์ (M3-2568 ไม่มีหน้าคำชี้แจง) ใช้เกณฑ์ของ M3-2567 · ฉบับที่ไม่ใส่ในตารางจะต้องถูกทั้งข้อจึงได้คะแนน
   ข้อเรียงลำดับไม่มีฉบับใดพิมพ์เกณฑ์บางส่วน → ถูกทุกลำดับจึงได้คะแนน */
const HALF = { 2: 0.5 };
const PARTIAL = {
  'P6-2561': HALF, 'P6-2562': { 2: 5 / 9 }, // ป.6 2562 พิมพ์ ข้อละ 4.5 · ถูก 2 ข้อย่อยได้ 2.5
  'P6-2563': HALF, 'P6-2564': HALF, 'P6-2565': HALF, 'P6-2566': HALF, 'P6-2567': HALF, 'P6-2568': HALF,
  'M3-2562': HALF, 'M3-2563': HALF, 'M3-2564': HALF, 'M3-2565': HALF, 'M3-2566': HALF, 'M3-2567': HALF,
  'M3-2568': HALF // ไม่มีหน้าคำชี้แจงในไฟล์ ใช้เกณฑ์เดียวกับ M3-2567 (ตามคำสั่งผู้ใช้)
};
/* เฉลยหลายคำตอบ: คั่นด้วย | ภายในช่องเดียว ใช้เมื่อกระดาษเฉลยของ สทศ. ระบายสองช่องในข้อเดียวกัน (ถือว่าถูกทั้งสองคำตอบ)
   ปรนัย "1|2" · ข้อเชิงซ้อน "ใช่,ใช่|ไม่ใช่,ไม่ใช่" (ข้อย่อยที่ 2 รับได้ทั้ง ใช่ และ ไม่ใช่) */
function tokOk(v, k) { return String(k).split('|').indexOf(v) >= 0; }
function isRight(type, a, key) {
  if (a === '') return false;
  if (type === 'complex' || type === 'order') {
    const x = a.split(','), k = key.split(',');
    return x.length === k.length && k.every(function (t, i) { return tokOk(x[i], t); });
  }
  return tokOk(a, key);
}
function earnedOf(level, year, type, a, key, pts) {
  if (isRight(type, a, key)) return pts;
  const rule = type === 'complex' && PARTIAL[level + '-' + year];
  if (!rule || !a) return 0;
  const x = a.split(','), k = key.split(',');
  const n = k.filter(function (v, i) { return tokOk(x[i], v); }).length;
  return Math.round((rule[n] || 0) * pts * 100) / 100;
}
// complex/order เก็บคำตอบเป็น "ใช่,ไม่ใช่,ใช่" หรือ "5,6,4" — ถ้าไม่ได้ตอบเลยคืนค่าว่าง
function normAns(type, s) {
  s = String(s == null ? '' : s).trim();
  if (type !== 'complex' && type !== 'order') return s;
  const p = s.split(/\s*(?:,|\|\|)\s*/).map(function (x) { return x.trim(); });
  return p.every(function (x) { return !x; }) ? '' : p.join(',');
}
function points(level, type) { return (POINTS[level] || POINTS.P6)[type] || 1; }
/* GRADING:END */
function qType(q) { return TYPES.indexOf(q.type) >= 0 ? q.type : (q.choices ? 'mc' : 'fill'); }

/* ---------- helpers ---------- */
function ss() { return SpreadsheetApp.getActiveSpreadsheet(); }
function uid() { return Utilities.getUuid().replace(/-/g, '').slice(0, 10); }
function on(r) { return String(r.active).toUpperCase() !== 'N'; }
const CACHED_TABLES = { Schools: 1, Students: 1, Rooms: 1 }, TBL_TTL = 120; // แคช 2 นาที: enter/progress ไม่ต้องเปิดชีตทุกครั้ง (ลดคำขอที่ชนกันที่ชีต)
let NOCACHE = false;       // true ระหว่างคำสั่งที่เขียนข้อมูล: อ่านสดจากชีตเสมอ (เลขแถวต้องตรง)
function dropTblCache() { try { CacheService.getScriptCache().removeAll(['t_Schools', 't_Students', 't_Rooms']); } catch (e) {} }
function tbl(name) {
  const cache = CACHED_TABLES[name] ? CacheService.getScriptCache() : null;
  if (cache && !NOCACHE) { const hit = cache.get('t_' + name); if (hit) return JSON.parse(hit); }
  const v = ss().getSheetByName(name).getDataRange().getValues(), h = v.shift();
  const rows = v.map(function (r, i) { const o = { _row: i + 2 }; h.forEach(function (k, j) { o[k] = String(r[j]); }); return o; });
  if (cache) { try { cache.put('t_' + name, JSON.stringify(rows), TBL_TTL); } catch (e) { /* เกิน 100 KB = ไม่แคช */ } }
  return rows;
}
// เติมหัวคอลัมน์ใหม่ที่ขาดในชีตเดิมให้เอง (ไม่ต้องรัน setup ซ้ำเมื่อเพิ่มคอลัมน์)
function ensureHeaders(name) {
  const c = CacheService.getScriptCache(); if (c.get('h_' + name)) return;
  const s = ss().getSheetByName(name), head = s.getRange(1, 1, 1, Math.max(s.getLastColumn(), 1)).getValues()[0].map(String);
  SHEETS[name].forEach(function (k, i) { if (head.indexOf(k) < 0) s.getRange(1, i + 1).setValue(k); });
  c.put('h_' + name, '1', 3600);
}
function toRow(name, o) { return SHEETS[name].map(function (k) { return o[k] === undefined || o[k] === null ? '' : String(o[k]); }); }
function add(name, o) { addMany(name, [o]); }
function addMany(name, list) {
  if (!list.length) return;
  ensureHeaders(name); if (CACHED_TABLES[name]) dropTblCache();
  const s = ss().getSheetByName(name);
  s.getRange(s.getLastRow() + 1, 1, list.length, SHEETS[name].length).setNumberFormat('@')
    .setValues(list.map(function (o) { return toRow(name, o); }));
}
function setRow(name, o) { if (CACHED_TABLES[name]) dropTblCache(); ss().getSheetByName(name).getRange(o._row, 1, 1, SHEETS[name].length).setValues([toRow(name, o)]); }
function hash(salt, pw) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + String(pw), Utilities.Charset.UTF_8)
    .map(function (b) { return ('0' + (b & 255).toString(16)).slice(-2); }).join('');
}
function auth(p, needSuper) {
  const s = p.token && CacheService.getScriptCache().get('s_' + p.token);
  if (!s) throw new Error('กรุณาเข้าสู่ระบบใหม่');
  const a = JSON.parse(s);
  if (needSuper && a.role !== 'super') throw new Error('เฉพาะผู้ดูแลระบบกลาง');
  return a;
}
function scope(a, schoolId) { return a.role === 'super' ? String(schoolId || '') : String(a.schoolId); }
function parseDetail(t) { try { return JSON.parse(t.detail || '[]'); } catch (e) { return []; } }

/* ---------- กุญแจเฉลย ----------
   ค่าเริ่มต้น: โหลด content/<ระดับ>/k-<ปี>.json จาก GitHub Pages (rev = ฉบับที่หน้าเว็บของนักเรียนใช้ตรวจ) แล้วแคชไว้ 6 ชั่วโมง
   โหมดสอบของครู (อนาคต): ถ้ามีแท็บ "Keys" (level, year, itemNo, type, answer, standard) ในชีต จะใช้แท็บนั้นก่อน → เฉลยไม่ต้องอยู่ในไฟล์สาธารณะ ดู README.md */
function privateKeys(level, year) {
  const s = ss().getSheetByName('Keys'); if (!s || s.getLastRow() < 2) return null;
  const out = {}; let n = 0;
  tbl('Keys').forEach(function (r) { if (r.level === level && r.year === String(year)) { out[r.itemNo] = { t: r.type, a: normAns(r.type, r.answer), s: r.standard, e: '' }; n++; } });
  return n ? out : null;
}
function loadKeys(level, year, rev) {
  const priv = privateKeys(level, year); if (priv) return priv;
  const ck = 'k_' + level + '_' + year + '_' + String(rev || ''), cache = CacheService.getScriptCache(), hit = cache.get(ck);
  if (hit) return JSON.parse(hit);
  const r = UrlFetchApp.fetch(CONTENT_BASE + level + '/k-' + year + '.json' + (rev ? '?v=' + encodeURIComponent(rev) : ''), { muteHttpExceptions: true });
  if (r.getResponseCode() !== 200) throw new Error('โหลดเฉลยปี ' + year + ' ไม่ได้ (HTTP ' + r.getResponseCode() + ')');
  const txt = r.getContentText();
  try { cache.put(ck, txt, 21600); } catch (e) { /* ไฟล์ใหญ่เกิน 100 KB = ไม่แคช */ }
  return JSON.parse(txt);
}

/* ---------- รหัสห้องเรียน (ความเป็นส่วนตัวของรายชื่อนักเรียน) ----------
   นักเรียนต้องมีรหัสห้อง 6 ตัวจึงเห็นรายชื่อของห้องนั้น · ระบบรู้โรงเรียน/ระดับ/ห้องจากรหัส ไม่แสดงรายชื่อโรงเรียนแบบเปิด
   ตัวอักษรตัดตัวที่สับสนออก (0 O 1 I L) */
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
function newCode() {
  const used = {}; tbl('Rooms').forEach(function (r) { used[r.code] = 1; });
  for (let tries = 0; tries < 50; tries++) {
    const h = Utilities.getUuid().replace(/-/g, ''); let c = '';
    for (let i = 0; i < 6; i++) c += CODE_CHARS.charAt(parseInt(h.substr(i * 2, 2), 16) % CODE_CHARS.length);
    if (!used[c]) return c;
  }
  throw new Error('สร้างรหัสห้องไม่สำเร็จ ลองใหม่อีกครั้ง');
}
function normCode(c) { return String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); }
// รหัสห้อง → แถวของห้อง · รหัสผิด/ไม่มี/ถูกปิด = error (หน่วงเวลาเพื่อกันการเดารหัส)
function roomOf(p) {
  const c = normCode(p && p.code);
  const r = c.length === 6 && tbl('Rooms').filter(function (x) { return x.code === c && on(x); })[0];
  if (!r) { Utilities.sleep(600); throw new Error('รหัสห้องเรียนไม่ถูกต้อง'); }
  return r;
}
// นักเรียนต้องอยู่ในห้องของรหัสนั้นจริง
function studentIn(room, id) {
  const s = tbl('Students').filter(function (x) { return x.id === String(id) && x.schoolId === room.schoolId && x.level === room.level && x.room === room.room && on(x); })[0];
  if (!s) throw new Error('ไม่พบนักเรียนในห้องนี้');
  return s;
}
function studentsOf(schoolId, level, room) {
  return tbl('Students').filter(function (s) { return s.schoolId === String(schoolId) && s.level === level && (room === undefined || s.room === room) && on(s); })
    .sort(function (a, b) { return a.room.localeCompare(b.room) || (+a.no - +b.no); })
    .map(function (s) { return { id: s.id, room: s.room, no: s.no, name: s.name }; });
}
// สร้างรหัสให้ห้องที่มีนักเรียนแต่ยังไม่มีรหัส แล้วคืนรายการห้อง+รหัส
function ensureRooms(schoolId, level) {
  const have = {}; tbl('Rooms').filter(function (r) { return r.schoolId === schoolId && r.level === level && on(r); }).forEach(function (r) { have[r.room] = r; });
  const cnt = {}; studentsOf(schoolId, level).forEach(function (s) { cnt[s.room] = (cnt[s.room] || 0) + 1; });
  Object.keys(cnt).forEach(function (room) { if (!have[room]) { have[room] = { code: newCode(), schoolId: schoolId, level: level, room: room, active: 'Y' }; add('Rooms', have[room]); } });
  return Object.keys(cnt).sort().map(function (room) { return { room: room, code: have[room].code, count: cnt[room] }; });
}
// ค้นหา attemptId โดยอ่านเฉพาะคอลัมน์ id (ไม่อ่านทั้งแท็บ) แล้วอ่านแถวที่เจอ
function findAttempt(aid) {
  const s = ss().getSheetByName('Attempts'), n = s.getLastRow() - 1; if (n < 1) return null;
  const ids = s.getRange(2, 1, n, 1).getValues(); let at = -1;
  for (let i = ids.length - 1; i >= 0; i--) if (String(ids[i][0]) === aid) { at = i; break; }
  if (at < 0) return null;
  const row = s.getRange(at + 2, 1, 1, SHEETS.Attempts.length).getValues()[0], o = { _row: at + 2 };
  SHEETS.Attempts.forEach(function (k, j) { o[k] = String(row[j]); });
  return o;
}
function regradePending() {
  let done = 0, still = 0, left = 0;
  tbl('Attempts').filter(function (t) { return t.status === 'pending'; }).forEach(function (t, i) {
    if (i >= 40) { left++; return; }
    try {
      const d = JSON.parse(t.answers || '{}'), files = {}, items = [];
      (d.keys || []).forEach(function (k) {
        const m = /^(\d{4})\/(\d+)$/.exec(k); if (!m) return;
        const f = files[m[1]] = files[m[1]] || loadKeys(t.level, m[1], (d.rev || {})[m[1]]), e = f[m[2]]; if (!e) return;
        const ty = e.t, a = normAns(ty, (d.answers || {})[k]), key = normAns(ty, e.a), pts = points(t.level, ty), ok = isRight(ty, a, key) ? 1 : 0;
        items.push({ k: k, ok: ok, earned: earnedOf(t.level, m[1], ty, a, key, pts), points: pts, s: e.s });
      });
      const sum = function (f) { return Math.round(items.reduce(function (n, x) { return n + x[f]; }, 0) * 100) / 100; };
      t.total = items.length; t.correct = sum('ok'); t.score = sum('earned'); t.maxScore = sum('points'); t.status = 'ok'; t.answers = '';
      t.detail = JSON.stringify(items.map(function (x) { return { q: t.level + '-' + x.k.replace('/', '-'), ok: x.ok, s: x.s }; }));
      setRow('Attempts', t); done++;
    } catch (e) { still++; }
  });
  return { regraded: done, stillPending: still, notTried: left };
}
/* ---------- entry points ---------- */
function doGet() { return ContentService.createTextOutput(JSON.stringify({ ok: true, data: 'onet-science api' })).setMimeType(ContentService.MimeType.JSON); }
function doPost(e) {
  let out, lock = null, p; const T0 = Date.now();
  try {
    p = JSON.parse((e.postData && e.postData.contents) || '{}');
    const fn = API[p.action];
    if (!fn) throw new Error('ไม่รู้จักคำสั่ง: ' + p.action);
    if (WRITES.indexOf(p.action) >= 0) { lock = LockService.getScriptLock(); lock.waitLock(25000); NOCACHE = true; }
    out = { ok: true, data: fn(p) };
  } catch (err) { out = { ok: false, error: String(err.message || err) }; }
  finally { NOCACHE = false; if (lock) { dropTblCache(); lock.releaseLock(); } }
  try {
    const ms = Date.now() - T0, act = (out && out.ok ? '' : 'ERR ') + (p ? p.action : '');
    console.log(JSON.stringify({ act: act, ms: ms })); // เวลาที่ใช้ต่อคำสั่ง ดูได้ในหน้า "การดำเนินการ"
    if (ms > 5000) { const c = CacheService.getScriptCache(), a = JSON.parse(c.get('slowlog') || '[]'); a.push({ t: new Date().toISOString(), act: act, ms: ms }); c.put('slowlog', JSON.stringify(a.slice(-30)), 21600); } // คำสั่งที่ช้าเกิน 5 วินาที เก็บไว้ให้ diag ดู (เฉพาะที่ทำเสร็จ)
  } catch (e) {}
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

const API = {
  /* ----- นักเรียน (ไม่ต้องล็อกอิน แต่ต้องมีรหัสห้องเรียน) ----- */
  // กรอกรหัสห้อง → โรงเรียน ระดับ ห้อง และรายชื่อนักเรียนของห้อง ใน 1 คำขอ
  enter: function (p) {
    const r = roomOf(p), sc = tbl('Schools').filter(function (s) { return s.id === r.schoolId && on(s); })[0];
    if (!sc) throw new Error('รหัสห้องเรียนไม่ถูกต้อง');
    return { school: sc.name, level: r.level, room: r.room, students: studentsOf(r.schoolId, r.level, r.room) };
  },
  // ประวัติและความคืบหน้าของนักเรียนคนนี้ (โหลดเบื้องหลังหลังเปิดหน้าแรก)
  progress: function (p) {
    const room = roomOf(p), stu = studentIn(room, p.studentId);
    const at = tbl('Attempts').filter(function (t) { return t.studentId === stu.id; }), done = {};
    at.forEach(function (t) { parseDetail(t).forEach(function (d) { const x = done[d.s] = done[d.s] || { done: 0, correct: 0 }; x.done++; x.correct += d.ok; }); });
    return { done: done, history: at.slice(-8).reverse().map(function (t) { return { ts: t.ts, mode: t.mode, standard: t.standard, total: t.total, correct: t.correct, score: t.score, maxScore: t.maxScore }; }) };
  },
  // บันทึกผลการทำข้อสอบ: ตรวจคำตอบซ้ำจากกุญแจเฉลยเอง แล้วบันทึกค่าที่ตรวจได้ (ไม่เชื่อคะแนนจากเครื่องนักเรียน)
  // p = { code, studentId, attemptId, mode, standard, keys: ["ปี/ข้อ",...], answers: { "ปี/ข้อ": "คำตอบ" }, rev: { "ปี": "<hash ของ k-ปี.json>" }, reveal?: true }
  // secure: true = โหมดสอบของครู: ตอบกลับรายข้อเฉพาะถูก/ผิดและคะแนน ไม่ส่งเฉลยหรือคำตอบที่ถูก · reveal: true = ส่งเฉลยรายข้อด้วย (โหมดฝึก/เทียบผล)
  // attemptId เดิมส่งซ้ำ = ไม่บันทึกซ้ำ
  submitAttempt: function (p) {
    const T = Date.now(), room = roomOf(p), st = studentIn(room, p.studentId), level = st.level;
    const keys = (p.keys || []).map(String).slice(0, 150), ans = p.answers || {}, rev = p.rev || {}, files = {};
    let items = [], pending = false, why = '';
    try {
      keys.forEach(function (k) {
        const m = /^(\d{4})\/(\d+)$/.exec(k); if (!m) return;
        const f = files[m[1]] = files[m[1]] || loadKeys(level, m[1], rev[m[1]]), e = f[m[2]]; if (!e) return;
        const t = e.t, a = normAns(t, ans[k]), key = normAns(t, e.a), pts = points(level, t), ok = isRight(t, a, key) ? 1 : 0;
        items.push({ k: k, ok: ok, earned: earnedOf(level, m[1], t, a, key, pts), points: pts, s: e.s, answer: key, yours: a });
      });
    } catch (err) { pending = true; why = String(err.message || err); items = []; } // ดึงเฉลยไม่ได้ (GitHub ช้า/ไฟล์ยังไม่ขึ้น): ไม่ทำให้คะแนนหาย
    const sum = function (f) { return Math.round(items.reduce(function (n, i) { return n + i[f]; }, 0) * 100) / 100; };
    const ck = p.chk || {};
    const res = pending ? { total: keys.length, correct: +ck.correct || 0, score: +ck.score || 0, maxScore: 0, pending: true } : { total: items.length, correct: sum('ok'), score: sum('earned'), maxScore: sum('points') };
    const aid = String(p.attemptId || '').replace(/[^\w-]/g, '').slice(0, 40) || uid();
    const lock = LockService.getScriptLock(); lock.waitLock(25000); // ล็อกเฉพาะตอนเขียน (หลังโหลดเฉลยเสร็จแล้ว)
    try {
      const prior = findAttempt(aid);
      if (prior) { res.total = +prior.total; res.correct = +prior.correct; res.score = +prior.score; res.maxScore = +prior.maxScore; res.pending = prior.status === 'pending'; res.dup = true; }
      else add('Attempts', { id: aid, ts: new Date().toISOString(), schoolId: st.schoolId, studentId: st.id, level: level, mode: p.mode || '', standard: p.standard || '', total: res.total, correct: res.correct,
        detail: pending ? '' : JSON.stringify(items.map(function (i) { return { q: level + '-' + i.k.replace('/', '-'), ok: i.ok, s: i.s }; })), score: res.score, maxScore: res.maxScore,
        status: pending ? 'pending' : 'ok', answers: pending ? JSON.stringify({ keys: keys, answers: ans, rev: rev, why: why.slice(0, 120) }) : '', ms: Date.now() - T });
    } finally { lock.releaseLock(); }
    if (p.reveal || p.secure) res.items = items.map(function (i) { const o = { k: i.k, ok: i.ok, earned: i.earned, points: i.points }; if (p.reveal && !p.secure) { o.answer = i.answer; o.yours = i.yours; } return o; });
    return res;
  },
  // ตรวจซ้ำคะแนนที่ค้างเป็น pending (ผู้ดูแลกลางเรียก หรือรัน regradePending() ในตัวแก้ไข) ครั้งละไม่เกิน 40 รายการ
  regrade: function (p) {
    auth(p, true); return regradePending();
  },
  // ตรวจความช้า (อ่านอย่างเดียว ไม่เขียนข้อมูล): จับเวลาแต่ละขั้น — เปิดชีต นับเซลล์ทุกแท็บ อ่านแต่ละแท็บ ขอล็อก แคช UrlFetch ไป GitHub
  // เรียกได้นาทีละครั้ง (กันถูกยิงรัว) ไม่ต้องล็อกอิน เพราะถ้าระบบช้า/ค้างจะล็อกอินไม่ได้ · ผลลัพธ์มีแต่ชื่อแท็บ ขนาด และเวลา ไม่มีข้อมูลนักเรียน
  diag: function (p) {
    const cache = CacheService.getScriptCache();
    if (cache.get('diag_busy')) throw new Error('diag ถูกเรียกไปเมื่อสักครู่ รอ 60 วินาทีแล้วลองใหม่');
    cache.put('diag_busy', '1', 60);
    const T0 = Date.now(), out = [], step = function (name, fn) { const t = Date.now(); let note = ''; try { note = fn() || ''; } catch (e) { note = 'ผิดพลาด: ' + e; } out.push({ step: name, ms: Date.now() - t, note: String(note) }); };
    let book, sheets = [], cells = 0;
    step('เปิดสเปรดชีต', function () { book = ss(); return book.getName(); });
    step('รายชื่อแท็บ', function () { sheets = book.getSheets(); return sheets.length + ' แท็บ'; });
    sheets.forEach(function (s) { step('ขนาดแท็บ ' + s.getName(), function () { const mr = s.getMaxRows(), mc = s.getMaxColumns(); cells += mr * mc; return 'แถวสูงสุด ' + mr + ' คอลัมน์สูงสุด ' + mc + ' · แถวข้อมูล ' + s.getLastRow() + ' คอลัมน์ข้อมูล ' + s.getLastColumn(); }); });
    out.push({ step: 'เซลล์รวมทุกแท็บ (รวมที่ว่าง)', ms: 0, note: cells + ' จากเพดาน 10,000,000' });
    sheets.forEach(function (s) {
      if (!s.getLastRow()) return;
      if (Date.now() - T0 > 150000) { out.push({ step: 'อ่านแท็บ ' + s.getName(), ms: 0, note: 'ข้าม (เกิน 150 วินาทีแล้ว)' }); return; }
      step('อ่านแท็บ ' + s.getName(), function () { const v = s.getDataRange().getValues(); let ch = 0; v.forEach(function (r) { r.forEach(function (x) { ch += String(x).length; }); }); return v.length + ' แถว · ' + ch + ' ตัวอักษร'; });
    });
    step('ขอล็อก (tryLock 3 วินาที)', function () { const l = LockService.getScriptLock(), got = l.tryLock(3000); if (got) l.releaseLock(); return 'ได้ล็อก = ' + got; });
    step('แคช (เขียน+อ่าน)', function () { cache.put('diag_x', 'x', 30); return 'อ่านกลับได้ = ' + (cache.get('diag_x') === 'x'); });
    ['manifest.json', 'P6/k-2568.json'].forEach(function (f) { step('UrlFetch ' + f, function () { const r = UrlFetchApp.fetch(CONTENT_BASE + f, { muteHttpExceptions: true }); return 'HTTP ' + r.getResponseCode() + ' · ' + r.getContentText().length + ' ตัวอักษร'; }); });
    let slow = []; try { slow = JSON.parse(cache.get('slowlog') || '[]'); } catch (e) {}
    return { totalMs: Date.now() - T0, steps: out, slow: slow };
  },

  /* ----- แอดมิน ----- */
  login: function (p) {
    const u = String(p.username || '').trim().toLowerCase();
    const a = tbl('Admins').filter(function (x) { return x.username.toLowerCase() === u && on(x); })[0];
    if (!a || hash(a.salt, p.password) !== a.hash) { Utilities.sleep(600); throw new Error('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'); }
    const token = Utilities.getUuid();
    CacheService.getScriptCache().put('s_' + token, JSON.stringify({ id: a.id, name: a.name, role: a.role, schoolId: a.schoolId }), 21600);
    return { token: token };
  },
  adminData: function (p) {
    const a = auth(p), sup = a.role === 'super';
    return {
      me: a,
      schools: tbl('Schools').filter(function (s) { return on(s) && (sup || s.id === a.schoolId); }).map(function (s) { return { id: s.id, name: s.name }; }),
      admins: tbl('Admins').filter(function (x) { return on(x) && (sup || x.schoolId === a.schoolId); })
        .map(function (x) { return { id: x.id, username: x.username, name: x.name, role: x.role, schoolId: x.schoolId }; })
    };
  },
  saveSchool: function (p) {
    auth(p, true);
    if (!String(p.name || '').trim()) throw new Error('กรุณาใส่ชื่อโรงเรียน');
    const id = uid(); add('Schools', { id: id, name: String(p.name).trim(), active: 'Y' }); return { id: id };
  },
  saveAdmin: function (p) {
    const a = auth(p), role = a.role === 'super' && p.role === 'super' ? 'super' : 'school';
    const sid = role === 'super' ? '' : scope(a, p.schoolId), u = String(p.username || '').trim();
    if (role === 'school' && !sid) throw new Error('กรุณาเลือกโรงเรียน');
    if (!u || String(p.password || '').length < 6) throw new Error('ต้องมีชื่อผู้ใช้ และรหัสผ่านอย่างน้อย 6 ตัวอักษร');
    if (tbl('Admins').some(function (x) { return x.username.toLowerCase() === u.toLowerCase(); })) throw new Error('ชื่อผู้ใช้นี้ถูกใช้แล้ว');
    const salt = uid();
    add('Admins', { id: uid(), username: u, salt: salt, hash: hash(salt, p.password), name: p.name || u, role: role, schoolId: sid, active: 'Y' });
    return true;
  },
  removeAdmin: function (p) {
    const a = auth(p), t = tbl('Admins').filter(function (x) { return x.id === p.id; })[0];
    if (!t) throw new Error('ไม่พบแอดมิน');
    if (t.id === a.id) throw new Error('ลบบัญชีของตัวเองไม่ได้');
    if (a.role !== 'super' && (t.role === 'super' || t.schoolId !== a.schoolId)) throw new Error('ไม่มีสิทธิ์');
    t.active = 'N'; setRow('Admins', t); return true;
  },
  students: function (p) {
    const a = auth(p), sid = scope(a, p.schoolId);
    return studentsOf(sid, p.level);
  },
  roomCodes: function (p) {
    const a = auth(p), sid = scope(a, p.schoolId);
    if (!sid) throw new Error('กรุณาเลือกโรงเรียน');
    if (p.level !== 'P6' && p.level !== 'M3') throw new Error('ระดับชั้นไม่ถูกต้อง');
    return ensureRooms(sid, p.level);
  },
  resetRoomCode: function (p) {
    const a = auth(p), c = normCode(p.code), r = tbl('Rooms').filter(function (x) { return x.code === c && on(x); })[0];
    if (!r) throw new Error('ไม่พบรหัสห้อง');
    if (a.role !== 'super' && r.schoolId !== a.schoolId) throw new Error('ไม่มีสิทธิ์');
    r.code = newCode(); setRow('Rooms', r); return { code: r.code };
  },
  addStudents: function (p) {
    const a = auth(p), sid = scope(a, p.schoolId);
    if (!sid) throw new Error('กรุณาเลือกโรงเรียน');
    if (p.level !== 'P6' && p.level !== 'M3') throw new Error('ระดับชั้นไม่ถูกต้อง');
    const list = String(p.text || '').split(/\r?\n/).map(function (l) { return l.split(/\t|,/).map(function (c) { return c.trim(); }); })
      .filter(function (c) { return c.length >= 3 && c[2]; })
      .map(function (c) { return { id: uid(), schoolId: sid, level: p.level, room: c[0], no: c[1], name: c.slice(2).join(' '), active: 'Y' }; });
    if (!list.length) throw new Error('รูปแบบไม่ถูกต้อง ใช้: ห้อง,เลขที่,ชื่อ-สกุล (บรรทัดละคน)');
    addMany('Students', list);
    ensureRooms(sid, p.level);
    return { added: list.length };
  },
  removeStudent: function (p) {
    const a = auth(p), s = tbl('Students').filter(function (x) { return x.id === p.id; })[0];
    if (!s) throw new Error('ไม่พบนักเรียน');
    if (a.role !== 'super' && s.schoolId !== a.schoolId) throw new Error('ไม่มีสิทธิ์');
    s.active = 'N'; setRow('Students', s); return true;
  },
  report: function (p) {
    const a = auth(p), sid = scope(a, p.schoolId), by = {}, std = {};
    const stu = studentsOf(sid, p.level);
    tbl('Attempts').filter(function (t) { return t.schoolId === sid && t.level === p.level; }).forEach(function (t) {
      const b = by[t.studentId] = by[t.studentId] || { n: 0, total: 0, correct: 0, last: '' };
      b.n++; b.total += +t.total; b.correct += +t.correct; b.last = t.ts;
      parseDetail(t).forEach(function (d) { const x = std[d.s] = std[d.s] || { total: 0, correct: 0 }; x.total++; x.correct += d.ok; });
    });
    return {
      students: stu.map(function (s) { const b = by[s.id] || { n: 0, total: 0, correct: 0, last: '' }; return { room: s.room, no: s.no, name: s.name, n: b.n, total: b.total, correct: b.correct, last: b.last }; }),
      standards: Object.keys(std).sort().map(function (k) { return { standard: k, total: std[k].total, correct: std[k].correct }; })
    };
  },
};

/* ---------- รันครั้งแรก (รันซ้ำได้ จะเพิ่มเฉพาะชีตและคอลัมน์ที่ยังไม่มี) ---------- */
function setup() {
  Object.keys(SHEETS).forEach(function (n) {
    const s = ss().getSheetByName(n) || ss().insertSheet(n);
    s.getRange(1, 1, s.getMaxRows(), SHEETS[n].length).setNumberFormat('@');
    if (s.getLastRow() === 0) { s.appendRow(SHEETS[n]); s.setFrozenRows(1); return; }
    const head = s.getRange(1, 1, 1, Math.max(s.getLastColumn(), 1)).getValues()[0].map(String);
    SHEETS[n].forEach(function (k, i) { if (head.indexOf(k) < 0) s.getRange(1, i + 1).setValue(k); });
  });
  if (!tbl('Admins').length) {
    const pw = uid(), salt = uid();
    add('Admins', { id: uid(), username: 'admin', salt: salt, hash: hash(salt, pw), name: 'ผู้ดูแลระบบกลาง', role: 'super', schoolId: '', active: 'Y' });
    Logger.log('สร้างผู้ดูแลกลางแล้ว → ชื่อผู้ใช้: admin  รหัสผ่าน: ' + pw + '  (จดไว้ รหัสนี้แสดงครั้งเดียว)');
  }
}
