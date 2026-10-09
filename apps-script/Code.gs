/**
 * ติว O-NET วิทยาศาสตร์ ป.6 / ม.3 — Backend (Google Apps Script + Google Sheets)
 * ผูกสคริปต์นี้กับ Google Sheet 1 ไฟล์ แล้วรัน setup() หนึ่งครั้ง จากนั้น Deploy เป็น Web app (Anyone)
 */
const SHEETS = {
  Schools:   ['id', 'name', 'active'],
  Admins:    ['id', 'username', 'salt', 'hash', 'name', 'role', 'schoolId', 'active'],
  Students:  ['id', 'schoolId', 'level', 'room', 'no', 'name', 'active'],
  Rooms:     ['code', 'schoolId', 'level', 'room', 'active'], // รหัสห้องเรียน 6 ตัว ต่อ (โรงเรียน + ระดับ + ห้อง)
  Blueprint: ['level', 'year', 'strand', 'standard', 'indicator', 'description', 'items', 'format', 'points'],
  Questions: ['id', 'level', 'examYear', 'itemNo', 'standard', 'indicator', 'stem', 'imageUrl', 'choices', 'answer', 'explanation', 'active', 'type'],
  Summaries: ['level', 'standard', 'indicator', 'title', 'content'],
  Solutions: ['level', 'examYear', 'itemNo', 'title', 'content'], // เฉลยละเอียดรายข้อ (นำเข้าจาก data/solutions/*.txt)
  Attempts:  ['id', 'ts', 'schoolId', 'studentId', 'level', 'mode', 'standard', 'total', 'correct', 'detail', 'score', 'maxScore']
};
const WRITES = ['submit', 'roomCodes', 'resetRoomCode', 'saveSchool', 'saveAdmin', 'removeAdmin', 'addStudents', 'removeStudent', 'importQuestions', 'importBlueprint', 'importSummaries', 'importSolutions'];

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

/* ---------- helpers ---------- */
function ss() { return SpreadsheetApp.getActiveSpreadsheet(); }
function uid() { return Utilities.getUuid().replace(/-/g, '').slice(0, 10); }
function on(r) { return String(r.active).toUpperCase() !== 'N'; }
function tbl(name) {
  const v = ss().getSheetByName(name).getDataRange().getValues(), h = v.shift();
  return v.map(function (r, i) { const o = { _row: i + 2 }; h.forEach(function (k, j) { o[k] = String(r[j]); }); return o; });
}
function toRow(name, o) { return SHEETS[name].map(function (k) { return o[k] === undefined || o[k] === null ? '' : String(o[k]); }); }
function add(name, o) { addMany(name, [o]); }
function addMany(name, list) {
  if (!list.length) return;
  const s = ss().getSheetByName(name);
  s.getRange(s.getLastRow() + 1, 1, list.length, SHEETS[name].length).setNumberFormat('@')
    .setValues(list.map(function (o) { return toRow(name, o); }));
}
function setRow(name, o) { ss().getSheetByName(name).getRange(o._row, 1, 1, SHEETS[name].length).setValues([toRow(name, o)]); }
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
function qType(q) { return TYPES.indexOf(q.type) >= 0 ? q.type : (q.choices ? 'mc' : 'fill'); }
function splitChoices(s) { return String(s || '').split('||').map(function (x) { return x.trim(); }).filter(String); }
// complex/order เก็บคำตอบเป็น "ใช่,ไม่ใช่,ใช่" หรือ "5,6,4" — ถ้าไม่ได้ตอบเลยคืนค่าว่าง
function normAns(type, s) {
  s = String(s == null ? '' : s).trim();
  if (type !== 'complex' && type !== 'order') return s;
  const p = s.split(/\s*(?:,|\|\|)\s*/).map(function (x) { return x.trim(); });
  return p.every(function (x) { return !x; }) ? '' : p.join(',');
}
function points(level, type) { return (POINTS[level] || POINTS.P6)[type] || 1; }
// ตัวชี้วัดในผังปีล่าสุดของระดับนั้น ใช้ติดป้าย "ไม่อยู่ในผัง"
function planOf(level) {
  const bp = tbl('Blueprint').filter(function (r) { return r.level === level && r.standard; });
  const year = bp.reduce(function (y, r) { return r.year > y ? r.year : y; }, '');
  const set = {}; let n = 0;
  bp.forEach(function (r) { if (r.year === year && r.indicator) { set[r.standard + '|' + r.indicator] = 1; n++; } });
  return { year: year, off: function (std, ind) { return n && ind && !set[std + '|' + ind] ? year : ''; } };
}

/* ข้อสอบที่เว้นตัวชี้วัดว่าง = เนื้อหานอกหลักสูตรปัจจุบัน (ฉบับปรับปรุง 2560) ของระดับนั้น
   คงไว้เฉพาะโหมดข้อสอบรายปี (ติดป้าย) · ไม่ใช้ในโหมดฝึกรายมาตรฐาน ข้อสอบจำลอง และไม่นับในตารางสรุป/ผัง */
function inCurr(q) { return !!String(q.indicator || '').trim(); }

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
/* ---------- entry points ---------- */
function doGet() { return ContentService.createTextOutput(JSON.stringify({ ok: true, data: 'onet-science api' })).setMimeType(ContentService.MimeType.JSON); }
function doPost(e) {
  let out, lock = null;
  try {
    const p = JSON.parse((e.postData && e.postData.contents) || '{}');
    const fn = API[p.action];
    if (!fn) throw new Error('ไม่รู้จักคำสั่ง: ' + p.action);
    if (WRITES.indexOf(p.action) >= 0) { lock = LockService.getScriptLock(); lock.waitLock(25000); }
    out = { ok: true, data: fn(p) };
  } catch (err) { out = { ok: false, error: String(err.message || err) }; }
  finally { if (lock) lock.releaseLock(); }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

const API = {
  /* ----- นักเรียน (ไม่ต้องล็อกอิน แต่ต้องมีรหัสห้องเรียน) ----- */
  joinRoom: function (p) {
    const r = roomOf(p), sc = tbl('Schools').filter(function (s) { return s.id === r.schoolId && on(s); })[0];
    if (!sc) throw new Error('รหัสห้องเรียนไม่ถูกต้อง');
    return { school: sc.name, level: r.level, room: r.room };
  },
  listStudents: function (p) {
    const r = roomOf(p);
    return studentsOf(r.schoolId, r.level, r.room);
  },  overview: function (p) {
    const room = roomOf(p), stu = studentIn(room, p.studentId);
    p.level = room.level;
    const bp = tbl('Blueprint').filter(function (r) { return r.level === p.level && r.standard; });
    const all = tbl('Questions').filter(function (q) { return q.level === p.level && on(q) && q.stem && q.standard; });
    const qs = all.filter(inCurr);
    const m = {};
    const std = function (s) { return m[s] = m[s] || { standard: s, strand: '', description: '', items: 0, bank: 0, done: 0, correct: 0, ind: {} }; };
    const ind = function (x, i) { return x.ind[i] = x.ind[i] || { indicator: i, description: '', items: 0, bank: 0 }; };
    bp.forEach(function (r) {
      const x = std(r.standard), n = +r.items || 0;
      if (r.strand) x.strand = r.strand;
      x.items += n;
      if (r.indicator) { const i = ind(x, r.indicator); i.description = r.description; i.items += n; }
      else if (r.description) x.description = r.description;
    });
    const plan = planOf(p.level);
    qs.forEach(function (q) {
      const x = std(q.standard); x.bank++;
      if (q.indicator) { const i = ind(x, q.indicator); i.bank++; i.offPlan = plan.off(q.standard, q.indicator); }
    });
    const at = tbl('Attempts').filter(function (t) { return t.studentId === stu.id; });
    at.forEach(function (t) { parseDetail(t).forEach(function (d) { if (m[d.s]) { m[d.s].done++; m[d.s].correct += d.ok; } }); });
    const years = {};
    all.forEach(function (q) { years[q.examYear] = (years[q.examYear] || 0) + 1; });
    return {
      year: (bp[0] || {}).year || '',
      bankYears: years,
      standards: Object.keys(m).sort().map(function (k) {
        const x = m[k]; x.ind = Object.keys(x.ind).sort().map(function (i) { return x.ind[i]; }); return x;
      }),
      history: at.slice(-8).reverse().map(function (t) { return { ts: t.ts, mode: t.mode, standard: t.standard, total: t.total, correct: t.correct, score: t.score, maxScore: t.maxScore }; })
    };
  },
  getQuiz: function (p) {
    // เรียงข้อสอบปีล่าสุดขึ้นก่อนเสมอ
    let qs = tbl('Questions').filter(function (q) { return q.level === p.level && on(q) && q.stem; })
      .sort(function (a, b) { return (+b.examYear - +a.examYear) || (+a.itemNo - +b.itemNo); });
    let out;
    if (p.mode === 'year') {
      out = qs.filter(function (q) { return q.examYear === String(p.year); }).sort(function (a, b) { return +a.itemNo - +b.itemNo; });
    } else if (p.mode === 'mock') {
      qs = qs.filter(inCurr);
      const need = {}, cnt = {};
      tbl('Blueprint').filter(function (r) { return r.level === p.level; })
        .forEach(function (r) { need[r.standard] = (need[r.standard] || 0) + (+r.items || 0); });
      const has = Object.keys(need).some(function (k) { return need[k] > 0; });
      out = qs.filter(function (q) { cnt[q.standard] = (cnt[q.standard] || 0) + 1; return cnt[q.standard] <= (has ? (need[q.standard] || 0) : 5); });
      out.sort(function (a, b) { return a.standard.localeCompare(b.standard) || (+b.examYear - +a.examYear); });
    } else {
      const skip = +p.skip || 0;
      out = qs.filter(inCurr).filter(function (q) { return q.standard === p.standard && (!p.indicator || q.indicator === p.indicator); }).slice(skip, skip + 20);
    }
    const plan = planOf(p.level);
    return out.map(function (q) {
      const t = qType(q);
      return {
        id: q.id, examYear: q.examYear, itemNo: q.itemNo, standard: q.standard, indicator: q.indicator, stem: q.stem, imageUrl: q.imageUrl,
        type: t, choices: splitChoices(q.choices), slots: t === 'order' ? normAns(t, q.answer).split(',').length : 0,
        points: points(p.level, t), offPlan: plan.off(q.standard, q.indicator), outCurr: inCurr(q) ? '' : '1'
      };
    });
  },
  summary: function (p) {
    // สรุปเนื้อหาของมาตรฐาน/ตัวชี้วัด + รายการว่าข้อสอบจริงเคยออกปีไหน กี่ข้อ
    const notes = tbl('Summaries').filter(function (r) { return r.level === p.level && r.standard === p.standard && r.content && (!p.indicator ? true : (r.indicator ? r.indicator === p.indicator : false)); })
      .map(function (r) { return { indicator: r.indicator, title: r.title, content: r.content }; });
    const m = {}; let bank = 0;
    tbl('Questions').filter(function (q) { return q.level === p.level && on(q) && q.stem && inCurr(q) && q.standard === p.standard && (!p.indicator || q.indicator === p.indicator); })
      .forEach(function (q) { bank++; const k = q.indicator || '(ไม่ระบุตัวชี้วัด)'; m[k] = m[k] || {}; m[k][q.examYear] = (m[k][q.examYear] || 0) + 1; });
    const plan = planOf(p.level);
    return {
      notes: notes, bank: bank,
      asked: Object.keys(m).sort().map(function (k) {
        return { indicator: k, offPlan: plan.off(p.standard, k), years: Object.keys(m[k]).sort().reverse().map(function (y) { return { y: y, n: m[k][y] }; }) };
      })
    };
  },
  submit: function (p) {
    const st = studentIn(roomOf(p), p.studentId);
    const map = {};
    tbl('Questions').forEach(function (q) { map[q.id] = q; });
    const ans = p.answers || {};
    const items = (p.ids || []).map(function (id) {
      const q = map[id]; if (!q) return null;
      const t = qType(q), a = normAns(t, ans[id]), key = normAns(t, q.answer), pts = points(st.level, t);
      const ok = isRight(t, a, key) ? 1 : 0;
      return { id: id, type: t, yours: a, ok: ok, answer: key, explanation: q.explanation, s: q.standard, points: pts, earned: earnedOf(st.level, q.examYear, t, a, key, pts) };
    }).filter(Boolean);
    const sum = function (k) { return Math.round(items.reduce(function (n, i) { return n + i[k]; }, 0) * 100) / 100; };
    const correct = sum('ok'), score = sum('earned'), maxScore = sum('points');
    add('Attempts', {
      id: uid(), ts: new Date().toISOString(), schoolId: st.schoolId, studentId: st.id, level: st.level, mode: p.mode || '', standard: p.standard || '',
      total: items.length, correct: correct, detail: JSON.stringify(items.map(function (i) { return { q: i.id, ok: i.ok, s: i.s }; })), score: score, maxScore: maxScore
    });
    return { total: items.length, correct: correct, score: score, maxScore: maxScore, items: items };
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
  bankStats: function (p) {
    auth(p, true); const m = {};
    tbl('Questions').filter(on).forEach(function (q) { const k = q.level + '|' + q.examYear; m[k] = (m[k] || 0) + 1; });
    return Object.keys(m).sort().reverse().map(function (k) { return { level: k.split('|')[0], examYear: k.split('|')[1], n: m[k] }; });
  },
  importQuestions: function (p) {
    auth(p, true);
    // TSV: level, examYear, itemNo, standard, indicator, stem, imageUrl, choices(คั่นด้วย ||), answer, explanation, type
    const list = String(p.text || '').split(/\r?\n/).map(function (l) { return l.split('\t'); })
      .filter(function (c) { return (c[0] === 'P6' || c[0] === 'M3') && c[5]; })
      .map(function (c) {
        const q = { id: uid(), level: c[0], examYear: (c[1] || '').trim(), itemNo: (c[2] || '').trim(), standard: (c[3] || '').trim(), indicator: (c[4] || '').trim(),
          stem: c[5], imageUrl: (c[6] || '').trim(), choices: (c[7] || '').trim(), answer: (c[8] || '').trim(), explanation: c[9] || '', active: 'Y', type: (c[10] || '').trim().toLowerCase() };
        q.type = q.type || (q.choices ? 'mc' : 'fill');
        q.answer = normAns(q.type, q.answer);
        return q;
      });
    if (!list.length) throw new Error('ไม่พบแถวที่ถูกต้อง (คอลัมน์แรกต้องเป็น P6 หรือ M3)');
    list.forEach(function (q) {
      const at = 'ข้อ ' + q.examYear + '/' + q.itemNo + ': ', ch = splitChoices(q.choices), a = q.answer.split(',');
      if (!q.examYear || !q.standard || !q.answer) throw new Error(at + 'ต้องมี ปีการศึกษา มาตรฐาน และเฉลย');
      if (TYPES.indexOf(q.type) < 0) throw new Error(at + 'ชนิดข้อสอบต้องเป็น ' + TYPES.join(' / '));
      if (q.type === 'mc' && !q.answer.split('|').every(function (x) { return +x >= 1 && +x <= (ch.length || 4); })) throw new Error(at + 'เฉลยปรนัยต้องเป็นเลขตัวเลือก (หลายคำตอบคั่นด้วย | เช่น 1|2)');
      if (q.type === 'complex' && (a.length !== ch.length || a.some(function (x) { return x.split('|').some(function (y) { return y !== 'ใช่' && y !== 'ไม่ใช่'; }); })))
        throw new Error(at + 'ข้อเชิงซ้อนต้องมีข้อความย่อยคั่นด้วย || และเฉลย ใช่/ไม่ใช่ เท่าจำนวนข้อย่อย');
      if (q.type === 'order' && a.some(function (x) { return x.split('|').some(function (y) { return !(+y >= 1 && +y <= ch.length); }); })) throw new Error(at + 'เฉลยข้อเรียงลำดับต้องเป็นเลขของรายการ');
    });
    // นำเข้าซ้ำได้: ข้อเดิม (ระดับ + ปี + ข้อที่) ที่อยู่ในไฟล์จะถูกแทนที่และคง id เดิมไว้ · ข้ออื่นคงไว้
    const key = function (q) { return q.level + '|' + q.examYear + '|' + q.itemNo; };
    const old = {}; tbl('Questions').forEach(function (q) { old[key(q)] = q; });
    const now = {}; list.forEach(function (q) { now[key(q)] = 1; if (old[key(q)]) q.id = old[key(q)].id; });
    const keep = Object.keys(old).filter(function (k) { return !now[k]; }).map(function (k) { return old[k]; });
    const s = ss().getSheetByName('Questions');
    if (s.getLastRow() > 1) s.getRange(2, 1, s.getLastRow() - 1, s.getLastColumn()).clearContent();
    addMany('Questions', keep.concat(list));
    return { added: list.length };
  },
  blueprintStats: function (p) {
    auth(p, true); const m = {};
    tbl('Blueprint').forEach(function (r) {
      const k = r.level + '|' + r.year, x = m[k] = m[k] || { level: r.level, year: r.year, standards: 0, indicators: 0, items: 0 };
      if (r.indicator) x.indicators++; else x.standards++;
      x.items += +r.items || 0;
    });
    return Object.keys(m).sort().map(function (k) { return m[k]; });
  },
  summaryStats: function (p) {
    auth(p, true); const m = {};
    tbl('Summaries').forEach(function (r) { const k = r.level + '|' + r.standard; m[k] = m[k] || { level: r.level, standard: r.standard, sections: 0, chars: 0 }; m[k].sections++; m[k].chars += String(r.content).length; });
    return Object.keys(m).sort().map(function (k) { return m[k]; });
  },
  importSummaries: function (p) {
    auth(p, true);
    // ไฟล์ data/summaries/<ระดับ>-<มาตรฐาน>.txt : แต่ละหัวข้อขึ้นต้นด้วยบรรทัด  @@ ระดับ | มาตรฐาน | ตัวชี้วัด | ชื่อหัวข้อ  ตามด้วยเนื้อหา (markup ของหน้าสรุป)
    // บรรทัดก่อน @@ แรกถือเป็นหมายเหตุ ไม่นำเข้า · ตัวชี้วัดเว้นว่างได้ (= ภาพรวมของมาตรฐาน) · เรียงตามลำดับในไฟล์
    const list = []; let cur = null;
    String(p.text || '').split(/\r?\n/).forEach(function (line) {
      if (/^@@\s/.test(line)) {
        const c = line.slice(2).split('|').map(function (x) { return x.trim(); });
        if (c.length < 4 || (c[0] !== 'P6' && c[0] !== 'M3') || !c[1] || !c[3]) throw new Error('หัวข้อไม่ถูกต้อง: ' + line);
        cur = { level: c[0], standard: c[1], indicator: c[2], title: c.slice(3).join(' | '), lines: [] }; list.push(cur);
      } else if (cur) cur.lines.push(line.replace(/\t/g, ' '));
    });
    if (!list.length) throw new Error('ไม่พบหัวข้อ (ต้องขึ้นต้นด้วย @@ ระดับ | มาตรฐาน | ตัวชี้วัด | ชื่อหัวข้อ)');
    const rows = list.map(function (s) {
      const content = s.lines.join('\n').replace(/^\n+|\n+$/g, '');
      if (!content) throw new Error('หัวข้อ ' + s.standard + ' ' + s.indicator + ' ไม่มีเนื้อหา');
      if (content.length > 45000) throw new Error('หัวข้อ ' + s.standard + ' ' + s.indicator + ' ยาวเกินเซลล์ของ Google Sheets');
      return { level: s.level, standard: s.standard, indicator: s.indicator, title: s.title, content: content };
    });
    // แทนที่สรุปเดิมของมาตรฐาน (ระดับ+มาตรฐาน) ที่อยู่ในไฟล์ · มาตรฐานอื่นคงไว้
    const key = {}; rows.forEach(function (r) { key[r.level + '|' + r.standard] = 1; });
    const keep = tbl('Summaries').filter(function (r) { return !key[r.level + '|' + r.standard]; });
    const s = ss().getSheetByName('Summaries');
    if (s.getLastRow() > 1) s.getRange(2, 1, s.getLastRow() - 1, s.getLastColumn()).clearContent();
    addMany('Summaries', keep.concat(rows));
    return { added: rows.length, standards: Object.keys(key) };
  },
  importSolutions: function (p) {
    auth(p, true);
    // ไฟล์ data/solutions/<ระดับ>-<ปี>.txt : แต่ละข้อขึ้นต้นด้วย  @@ ระดับ | ปีการศึกษา | ข้อที่ | มาตรฐาน | ตัวชี้วัด | ชื่อหัวข้อ  ตามด้วยเฉลยละเอียด (markup เดียวกับสรุปเนื้อหา)
    // เฉลยเดิมของ (ระดับ + ปี + ข้อ) ที่อยู่ในไฟล์จะถูกแทนที่ · ข้ออื่นคงไว้
    const list = []; let cur = null;
    String(p.text || '').split(/\r?\n/).forEach(function (line) {
      if (/^@@\s/.test(line)) {
        const c = line.slice(2).split('|').map(function (x) { return x.trim(); });
        if (c.length < 6 || (c[0] !== 'P6' && c[0] !== 'M3') || !/^\d{4}$/.test(c[1]) || !/^\d+$/.test(c[2])) throw new Error('หัวข้อไม่ถูกต้อง: ' + line);
        cur = { level: c[0], examYear: c[1], itemNo: c[2], title: c.slice(5).join(' | '), lines: [] }; list.push(cur);
      } else if (cur) cur.lines.push(line.replace(/\t/g, ' '));
    });
    if (!list.length) throw new Error('ไม่พบข้อ (ต้องขึ้นต้นด้วย @@ ระดับ | ปี | ข้อที่ | มาตรฐาน | ตัวชี้วัด | ชื่อหัวข้อ)');
    const rows = list.map(function (s) {
      const content = s.lines.join('\n').replace(/^\n+|\n+$/g, '');
      const at = 'ข้อ ' + s.level + ' ' + s.examYear + '/' + s.itemNo + ': ';
      if (!content) throw new Error(at + 'ไม่มีเนื้อหา');
      if (content.length > 45000) throw new Error(at + 'ยาวเกินเซลล์ของ Google Sheets');
      return { level: s.level, examYear: s.examYear, itemNo: s.itemNo, title: s.title, content: content };
    });
    const key = {}; rows.forEach(function (r) { key[r.level + '|' + r.examYear + '|' + r.itemNo] = 1; });
    const keep = tbl('Solutions').filter(function (r) { return !key[r.level + '|' + r.examYear + '|' + r.itemNo]; });
    const s = ss().getSheetByName('Solutions');
    if (s.getLastRow() > 1) s.getRange(2, 1, s.getLastRow() - 1, s.getLastColumn()).clearContent();
    addMany('Solutions', keep.concat(rows));
    return { added: rows.length };
  },
  solutions: function (p) {
    // เฉลยละเอียดตามรายการ keys ["ปี/ข้อ", ...] ของระดับที่ระบุ → { "ปี/ข้อ": { title, content } }
    const want = {}; (p.keys || []).forEach(function (k) { want[String(k)] = 1; });
    const out = {};
    tbl('Solutions').forEach(function (r) { const k = r.examYear + '/' + r.itemNo; if (r.level === p.level && want[k]) out[k] = { title: r.title, content: r.content }; });
    return out;
  },
  solutionStats: function (p) {
    auth(p, true); const m = {};
    tbl('Solutions').forEach(function (r) { const k = r.level + '|' + r.examYear; m[k] = (m[k] || 0) + 1; });
    return Object.keys(m).sort().reverse().map(function (k) { return { level: k.split('|')[0], examYear: k.split('|')[1], n: m[k] }; });
  },
  importBlueprint: function (p) {
    auth(p, true);
    // TSV ตามหัวชีต Blueprint (ไฟล์ data/blueprint.tsv): level, year, strand, standard, indicator, description, items, format, points
    const list = String(p.text || '').split(/\r?\n/).map(function (l) { return l.split('\t').map(function (c) { return c.trim(); }); })
      .filter(function (c) { return (c[0] === 'P6' || c[0] === 'M3') && c[3]; })
      .map(function (c) { return { level: c[0], year: c[1], strand: c[2], standard: c[3], indicator: c[4] || '', description: c[5] || '', items: c[6] || '', format: c[7] || '', points: c[8] || '' }; });
    if (!list.length) throw new Error('ไม่พบแถวที่ถูกต้อง (คอลัมน์แรกต้องเป็น P6 หรือ M3)');
    // แทนที่ผังเดิมของระดับที่นำเข้า ระดับอื่นคงไว้
    const levels = list.map(function (r) { return r.level; }).filter(function (v, i, a) { return a.indexOf(v) === i; });
    const keep = tbl('Blueprint').filter(function (r) { return levels.indexOf(r.level) < 0; });
    const s = ss().getSheetByName('Blueprint');
    if (s.getLastRow() > 1) s.getRange(2, 1, s.getLastRow() - 1, s.getLastColumn()).clearContent();
    addMany('Blueprint', keep.concat(list));
    return { added: list.length, levels: levels };
  }
};


/* สรุปเนื้อหาตั้งต้นรายมาตรฐาน (เขียนตามตัวชี้วัดหลักสูตรฯ ฉบับปรับปรุง 2560) แก้ไข/เพิ่มรายตัวชี้วัดได้ที่ชีต Summaries */
const SEED_SUMMARIES = [
  ['P6', 'ว 1.1', 'สิ่งมีชีวิตกับสิ่งแวดล้อม', '• โครงสร้างและลักษณะของสิ่งมีชีวิตเหมาะกับแหล่งที่อยู่ เช่น ผักตบชวามีช่องอากาศในก้านใบช่วยให้ลอยน้ำ อูฐมีขนตายาวกันทราย\n• ความสัมพันธ์ระหว่างสิ่งมีชีวิตกับสิ่งมีชีวิต (กินกันเป็นอาหาร อยู่ร่วมกัน) และกับสิ่งไม่มีชีวิต (แสง น้ำ อากาศ ดิน)\n• โซ่อาหาร: ผู้ผลิต → ผู้บริโภคพืช → ผู้บริโภคสัตว์ ลูกศรชี้จากผู้ถูกกินไปหาผู้กิน\n• ถ้าสิ่งมีชีวิตชนิดหนึ่งในโซ่อาหารเปลี่ยนจำนวน จะกระทบชนิดอื่นต่อกันเป็นทอด\n• การดูแลรักษาสิ่งแวดล้อม'],
  ['P6', 'ว 1.2', 'ส่วนต่าง ๆ ของพืช สารอาหาร และระบบย่อยอาหาร', '• ราก ดูดน้ำและธาตุอาหาร · ลำต้น ลำเลียงและชูกิ่งใบ · ใบ สร้างอาหาร (สังเคราะห์ด้วยแสง) และคายน้ำ · ดอก สืบพันธุ์\n• การสังเคราะห์ด้วยแสงต้องใช้แสง น้ำ แก๊สคาร์บอนไดออกไซด์ และคลอโรฟิลล์ ได้น้ำตาลและแก๊สออกซิเจน\n• สารอาหาร: คาร์โบไฮเดรต โปรตีน ไขมัน ให้พลังงาน · วิตามิน เกลือแร่ น้ำ ไม่ให้พลังงาน\n• เลือกกินให้ครบ 5 หมู่ ในสัดส่วนเหมาะกับเพศและวัย\n• ระบบย่อยอาหาร: ปาก → หลอดอาหาร → กระเพาะอาหาร → ลำไส้เล็ก (ย่อยและดูดซึมมากที่สุด) → ลำไส้ใหญ่ (ดูดน้ำ) → ทวารหนัก โดยมีตับและตับอ่อนช่วยสร้างน้ำย่อย/น้ำดี'],
  ['P6', 'ว 1.3', 'การจำแนกสิ่งมีชีวิตและลักษณะทางพันธุกรรม', '• สิ่งมีชีวิตแบ่งเป็น กลุ่มพืช กลุ่มสัตว์ และกลุ่มที่ไม่ใช่พืชและสัตว์ (เช่น เห็ด รา จุลินทรีย์)\n• พืชดอก / พืชไม่มีดอก (เฟิน มอส สน)\n• สัตว์มีกระดูกสันหลัง 5 กลุ่ม: ปลา สัตว์สะเทินน้ำสะเทินบก สัตว์เลื้อยคลาน นก สัตว์เลี้ยงลูกด้วยน้ำนม และสัตว์ไม่มีกระดูกสันหลัง\n• ลักษณะทางพันธุกรรมถ่ายทอดจากพ่อแม่สู่ลูก เช่น สีตา ลักยิ้ม ติ่งหู ห่อลิ้น ส่วนแผลเป็นหรือทักษะที่ฝึกเองไม่ใช่ลักษณะทางพันธุกรรม'],
  ['P6', 'ว 2.1', 'วัสดุ สสาร และการแยกสาร', '• สมบัติทางกายภาพของวัสดุ: ความแข็ง สภาพยืดหยุ่น การนำความร้อน การนำไฟฟ้า ใช้เลือกวัสดุให้เหมาะกับงาน\n• สถานะของสสาร: ของแข็ง (รูปร่างและปริมาตรคงที่) ของเหลว (ปริมาตรคงที่ รูปร่างตามภาชนะ) แก๊ส (ฟุ้งเต็มภาชนะ)\n• การเปลี่ยนสถานะ: หลอมเหลว แข็งตัว กลายเป็นไอ ควบแน่น ระเหิด ระเหิดกลับ\n• การละลาย · การเปลี่ยนแปลงทางเคมี (มีสารใหม่ สังเกตจากสี กลิ่น ฟองแก๊ส ตะกอน อุณหภูมิ) · การเปลี่ยนแปลงที่ผันกลับได้และผันกลับไม่ได้\n• การแยกสารผสม: หยิบออก ร่อน ใช้แม่เหล็กดึงดูด รินออก กรอง ตกตะกอน เลือกวิธีตามสมบัติของสาร'],
  ['P6', 'ว 2.2', 'แรงและการเคลื่อนที่', '• แรงโน้มถ่วงของโลกดึงวัตถุเข้าหาศูนย์กลางโลก · มวลคือปริมาณเนื้อสาร (กิโลกรัม) · น้ำหนักคือแรงโน้มถ่วงที่กระทำต่อมวล (นิวตัน) วัดด้วยเครื่องชั่งสปริง\n• แรงลัพธ์: แรงทิศเดียวกันนำมาบวกกัน ทิศตรงข้ามนำมาลบกัน แรงลัพธ์เป็นศูนย์วัตถุหยุดนิ่งหรือเคลื่อนที่แบบเดิม\n• แรงเสียดทานต้านการเคลื่อนที่ ขึ้นกับลักษณะผิวสัมผัสและน้ำหนักที่กด\n• แรงไฟฟ้าจากการขัดถู: ประจุชนิดเดียวกันผลักกัน ต่างชนิดกันดึงดูดกัน'],
  ['P6', 'ว 2.3', 'แสง เสียง และวงจรไฟฟ้า', '• ตัวกลางโปร่งใส โปร่งแสง และวัตถุทึบแสง · การเกิดเงามืดและเงามัว\n• เสียงเกิดจากการสั่นของแหล่งกำเนิดและต้องอาศัยตัวกลาง · เสียงสูง-ต่ำขึ้นกับความถี่ เสียงดัง-ค่อยขึ้นกับพลังงานการสั่น · ระดับเสียงวัดเป็นเดซิเบล\n• วงจรไฟฟ้าอย่างง่าย: แหล่งกำเนิดไฟฟ้า สายไฟ อุปกรณ์ไฟฟ้า ต้องต่อครบวงจร\n• ต่อเซลล์ไฟฟ้าแบบอนุกรมหลอดสว่างขึ้น · ต่อหลอดไฟแบบอนุกรม ถ้าหลอดหนึ่งดับจะดับทั้งหมด · ต่อแบบขนาน หลอดที่เหลือยังสว่าง (ไฟในบ้านต่อแบบขนาน)'],
  ['P6', 'ว 3.1', 'ดวงจันทร์ ดาว และอุปราคา', '• ดวงจันทร์ขึ้นทางตะวันออก ตกทางตะวันตก รูปร่างที่เห็นเปลี่ยนเป็นวัฏจักร (ข้างขึ้น-ข้างแรม)\n• ระบบสุริยะ: ดวงอาทิตย์เป็นศูนย์กลาง มีดาวเคราะห์ 8 ดวงและบริวารอื่น\n• ดาวฤกษ์มีแสงในตัวเอง ดาวเคราะห์สะท้อนแสงดวงอาทิตย์ · กลุ่มดาวและการใช้แผนที่ดาว (มุมทิศ มุมเงย)\n• สุริยุปราคา: ดวงจันทร์อยู่ระหว่างดวงอาทิตย์กับโลก · จันทรุปราคา: โลกอยู่ระหว่างดวงอาทิตย์กับดวงจันทร์\n• เทคโนโลยีอวกาศและประโยชน์ เช่น ดาวเทียมสื่อสาร ดาวเทียมอุตุนิยมวิทยา'],
  ['P6', 'ว 3.2', 'น้ำ ลมฟ้าอากาศ หิน และภัยธรรมชาติ', '• แหล่งน้ำบนโลกส่วนใหญ่เป็นน้ำเค็ม น้ำจืดที่ใช้ได้มีน้อย · วัฏจักรน้ำ: ระเหย ควบแน่น หยาดน้ำฟ้า\n• เมฆ หมอก น้ำค้าง น้ำค้างแข็ง · ฝน หิมะ ลูกเห็บ\n• หินอัคนี หินตะกอน หินแปร และวัฏจักรหิน · ซากดึกดำบรรพ์บอกสภาพแวดล้อมในอดีต\n• ลมบก (กลางคืน พัดจากบกสู่ทะเล) ลมทะเล (กลางวัน พัดจากทะเลสู่บก) และมรสุม\n• ภัยธรรมชาติ: น้ำท่วม การกัดเซาะชายฝั่ง ดินถล่ม แผ่นดินไหว สึนามิ และการปฏิบัติตน\n• ปรากฏการณ์เรือนกระจกและผลต่อสิ่งมีชีวิต'],
  ['M3', 'ว 1.1', 'ระบบนิเวศ', '• องค์ประกอบของระบบนิเวศ: มีชีวิต (ผู้ผลิต ผู้บริโภค ผู้ย่อยสลายสารอินทรีย์) และไม่มีชีวิต\n• ความสัมพันธ์ระหว่างสิ่งมีชีวิต: ภาวะพึ่งพากัน ภาวะอิงอาศัย ภาวะปรสิต การล่าเหยื่อ การแข่งขัน\n• โซ่อาหารและสายใยอาหาร · พลังงานถ่ายทอดสู่ลำดับถัดไปได้ราวร้อยละ 10\n• การสะสมสารพิษเพิ่มขึ้นตามลำดับขั้นการกิน\n• สมดุลของระบบนิเวศและการอนุรักษ์'],
  ['M3', 'ว 1.2', 'เซลล์ พืช และระบบร่างกายมนุษย์', '• เซลล์พืชมีผนังเซลล์และคลอโรพลาสต์ เซลล์สัตว์ไม่มี · หน้าที่ของนิวเคลียส เยื่อหุ้มเซลล์ ไมโทคอนเดรีย แวคิวโอล · การใช้กล้องจุลทรรศน์ใช้แสง\n• การแพร่ (สารจากเข้มข้นมากไปน้อย) และออสโมซิส (น้ำผ่านเยื่อเลือกผ่าน)\n• การสังเคราะห์ด้วยแสง · ไซเล็มลำเลียงน้ำและธาตุอาหาร โฟลเอ็มลำเลียงอาหาร · การสืบพันธุ์ของพืชดอก การถ่ายเรณู การปฏิสนธิ · ธาตุอาหารของพืช\n• ระบบหายใจ ระบบขับถ่าย (ไต หน่วยไต) ระบบหมุนเวียนเลือด (หัวใจ 4 ห้อง หลอดเลือด) ระบบประสาท ระบบสืบพันธุ์ ฮอร์โมนเพศ การคุมกำเนิด'],
  ['M3', 'ว 1.3', 'พันธุกรรมและความหลากหลายทางชีวภาพ', '• ยีนอยู่บนดีเอ็นเอ ดีเอ็นเอขดเป็นโครโมโซม มนุษย์มีโครโมโซม 46 แท่ง (23 คู่)\n• การทดลองของเมนเดล: แอลลีลเด่น-ด้อย จีโนไทป์ ฟีโนไทป์ อัตราส่วนรุ่นลูกจากตารางพันเนตต์ เช่น Tt × Tt ได้ฟีโนไทป์ 3 : 1\n• ไมโทซิส (ได้ 2 เซลล์ โครโมโซมเท่าเดิม) ไมโอซิส (ได้ 4 เซลล์ โครโมโซมลดครึ่ง)\n• โรคทางพันธุกรรม เช่น ธาลัสซีเมีย ตาบอดสี กลุ่มอาการดาวน์\n• สิ่งมีชีวิตดัดแปรพันธุกรรม ประโยชน์และข้อควรระวัง\n• ความหลากหลายทางชีวภาพและความสำคัญ'],
  ['M3', 'ว 2.1', 'สมบัติของสาร การแยกสาร และปฏิกิริยาเคมี', '• ธาตุโลหะ อโลหะ กึ่งโลหะ · ธาตุกัมมันตรังสี\n• สารบริสุทธิ์มีจุดเดือดและจุดหลอมเหลวคงที่ สารผสมไม่คงที่ · ความหนาแน่น = มวล ÷ ปริมาตร\n• อะตอมประกอบด้วยโปรตอน นิวตรอน อิเล็กตรอน · ธาตุ สารประกอบ\n• การแยกสาร: ระเหยแห้ง ตกผลึก กลั่นอย่างง่าย โครมาโทกราฟีแบบกระดาษ สกัดด้วยตัวทำละลาย\n• สารละลาย สภาพละลายได้ ความเข้มข้นเป็นร้อยละ\n• ปฏิกิริยาเคมี: กฎทรงมวล ปฏิกิริยาดูดความร้อนและคายความร้อน การเกิดสนิม การเผาไหม้ ปฏิกิริยาของกรดกับโลหะ กรดกับเบส ฝนกรด\n• พอลิเมอร์ เซรามิก วัสดุผสม'],
  ['M3', 'ว 2.2', 'แรงและการเคลื่อนที่', '• แรงลัพธ์ของแรงหลายแรงในระนาบเดียวกัน\n• ความดันของของเหลวเพิ่มตามความลึก · แรงพยุงเท่ากับน้ำหนักของของเหลวที่ถูกแทนที่ การจมและการลอย\n• แรงเสียดทานสถิตและแรงเสียดทานจลน์\n• โมเมนต์ของแรง = แรง × ระยะตั้งฉากจากจุดหมุน สมดุลเมื่อโมเมนต์ทวนเข็ม = โมเมนต์ตามเข็ม\n• สนามแม่เหล็ก สนามไฟฟ้า สนามโน้มถ่วง\n• ระยะทางกับการกระจัด อัตราเร็ว = ระยะทาง ÷ เวลา ความเร็ว = การกระจัด ÷ เวลา'],
  ['M3', 'ว 2.3', 'ความร้อน งานและพลังงาน ไฟฟ้า คลื่นและแสง', '• ความร้อนทำให้สารเปลี่ยนอุณหภูมิ ขยายตัว หรือเปลี่ยนสถานะ · การถ่ายโอนความร้อน: การนำ การพา การแผ่รังสี · สมดุลความร้อน\n• งาน W = F × s · กำลัง P = W ÷ t · เครื่องกลอย่างง่าย\n• พลังงานจลน์ พลังงานศักย์โน้มถ่วง และกฎการอนุรักษ์พลังงาน\n• ไฟฟ้า: กฎของโอห์ม V = IR · ตัวต้านทานต่ออนุกรม (กระแสเท่ากัน) ต่อขนาน (ความต่างศักย์เท่ากัน) · พลังงานไฟฟ้า (หน่วย) = กิโลวัตต์ × ชั่วโมง และการคิดค่าไฟ · ตัวต้านทาน ไดโอด ทรานซิสเตอร์ ตัวเก็บประจุ\n• คลื่นและส่วนประกอบของคลื่น สเปกตรัมคลื่นแม่เหล็กไฟฟ้า\n• แสง: กฎการสะท้อน การหักเห กระจกเงา เลนส์นูน เลนส์เว้า การมองเห็นและความสว่าง'],
  ['M3', 'ว 3.1', 'ระบบสุริยะและปฏิสัมพันธ์โลก ดวงจันทร์ ดวงอาทิตย์', '• แรงโน้มถ่วงทำให้ดาวเคราะห์โคจรรอบดวงอาทิตย์\n• ฤดูกาลเกิดจากแกนโลกเอียงขณะโคจรรอบดวงอาทิตย์ ไม่ได้เกิดจากระยะใกล้-ไกล\n• ข้างขึ้น-ข้างแรมเกิดจากตำแหน่งของดวงจันทร์ที่โคจรรอบโลก\n• น้ำขึ้น-น้ำลง: น้ำเกิด (วันขึ้น/แรม 15 ค่ำ) น้ำตาย (วันขึ้น/แรม 8 ค่ำ)\n• เทคโนโลยีอวกาศ: กล้องโทรทรรศน์ ดาวเทียม ยานอวกาศ และการนำไปใช้ประโยชน์'],
  ['M3', 'ว 3.2', 'บรรยากาศ ลมฟ้าอากาศ ทรัพยากรและภัยพิบัติ', '• ชั้นบรรยากาศ: โทรโพสเฟียร์ สตราโตสเฟียร์ (มีโอโซน) มีโซสเฟียร์ เทอร์โมสเฟียร์ เอกโซสเฟียร์\n• องค์ประกอบของลมฟ้าอากาศ: อุณหภูมิ ความกดอากาศ ลม ความชื้น เมฆ หยาดน้ำฟ้า · พายุฝนฟ้าคะนอง พายุหมุนเขตร้อน · การพยากรณ์อากาศ\n• การเปลี่ยนแปลงภูมิอากาศโลกและแก๊สเรือนกระจก\n• เชื้อเพลิงซากดึกดำบรรพ์ (ถ่านหิน ปิโตรเลียม หินน้ำมัน) และพลังงานทดแทน\n• โครงสร้างภายในโลก: เปลือกโลก เนื้อโลก แก่นโลก · การผุพังอยู่กับที่ การกร่อน การสะสมตัวของตะกอน\n• ดินและชั้นหน้าตัดดิน · น้ำผิวดินและน้ำใต้ดิน\n• ภัยพิบัติ: น้ำท่วม การกัดเซาะชายฝั่ง ดินถล่ม หลุมยุบ แผ่นดินทรุด']
];

/* สรุปแบบละเอียด (ตัวอย่างรูปแบบใหม่ 2 หัวข้อ) — ใช้แทนสรุปสั้นด้านบนเมื่อรัน setup */
const RICH = {
'P6|ว 2.3': `## 1. แสงผ่านอะไรได้บ้าง
| ชนิด | แสงผ่านได้ | มองของที่อยู่ข้างหลัง | ตัวอย่าง |
| ตัวกลางโปร่งใส | เกือบทั้งหมด | เห็นชัดเจน | กระจกใส น้ำใส อากาศ |
| ตัวกลางโปร่งแสง | บางส่วน | เห็นไม่ชัด | กระจกฝ้า กระดาษไข |
| วัตถุทึบแสง | ไม่ได้เลย | มองไม่เห็น | ไม้ เหล็ก กระเบื้อง |
!! เงาเกิดเมื่อวัตถุทึบแสงกั้นทางเดินของแสง · **เงามืด** คือบริเวณที่แสงไปไม่ถึงเลย · **เงามัว** คือบริเวณที่แสงไปถึงได้บางส่วน
• วัตถุอยู่ใกล้แหล่งกำเนิดแสง เงาจะใหญ่ขึ้น · วัตถุอยู่ใกล้ฉาก เงาจะเล็กลงและคมชัดขึ้น
## 2. เสียง
• เสียงเกิดจาก **การสั่น** ของแหล่งกำเนิดเสียง
• เสียงต้องอาศัย **ตัวกลาง** (ของแข็ง ของเหลว แก๊ส) ในการเดินทางมาถึงหู ที่ไม่มีอากาศจึงไม่ได้ยินเสียง
| สิ่งที่เปลี่ยน | ผลที่ได้ยิน |
| สั่นเร็ว (ความถี่สูง) | เสียงสูง (แหลม) |
| สั่นช้า (ความถี่ต่ำ) | เสียงต่ำ (ทุ้ม) |
| สั่นแรง (พลังงานมาก) | เสียงดัง |
| สั่นเบา (พลังงานน้อย) | เสียงค่อย |
?? โจทย์ชอบให้เปรียบเทียบเครื่องดนตรี: สายที่ **สั้นกว่า ตึงกว่า หรือเส้นเล็กกว่า** สั่นเร็วกว่า จึงให้เสียงสูงกว่า ส่วนการดีดแรงขึ้นทำให้เสียง **ดัง** ขึ้น ไม่ได้ทำให้เสียงสูงขึ้น
• ความดังของเสียงวัดเป็นหน่วย **เดซิเบล (dB)** การฟังเสียงดังมากต่อเนื่องนาน ๆ เป็นอันตรายต่อการได้ยิน
## 3. วงจรไฟฟ้าอย่างง่าย
• ส่วนประกอบ: แหล่งกำเนิดไฟฟ้า (ถ่านไฟฉาย) สายไฟ และอุปกรณ์ไฟฟ้า (หลอดไฟ)
• **วงจรปิด** ต่อครบวงจร กระแสไฟฟ้าไหลได้ หลอดสว่าง · **วงจรเปิด** วงจรขาดตอน หลอดดับ
• ต่อถ่านไฟฉายหลายก้อนแบบอนุกรม (ขั้วบวกต่อกับขั้วลบเรียงกัน) หลอดไฟสว่างมากขึ้น
[[fig:series|ต่อหลอดไฟแบบอนุกรม: ถอดหลอดใดหลอดหนึ่งออก อีกหลอดดับด้วย]]
[[fig:parallel|ต่อหลอดไฟแบบขนาน: ถอดหลอดหนึ่งออก อีกหลอดยังสว่าง]]
| เปรียบเทียบ | ต่อหลอดแบบอนุกรม | ต่อหลอดแบบขนาน |
| ทางเดินของกระแสไฟฟ้า | ทางเดียว | แยกหลายทาง |
| ถ้าหลอดหนึ่งขาด | ดับทุกหลอด | หลอดอื่นยังสว่าง |
| ความสว่าง (หลอดเหมือนกัน ถ่านเท่ากัน) | สว่างน้อยกว่า | สว่างมากกว่า |
!! ไฟฟ้าในบ้านต่อแบบขนาน เพราะเปิด-ปิดอุปกรณ์แต่ละชิ้นได้โดยไม่กระทบชิ้นอื่น
ex: หลอดไฟ 3 หลอดต่อแบบอนุกรม ถ้าหลอดกลางขาด หลอดที่เหลือจะเป็นอย่างไร → ดับทั้งหมด เพราะวงจรขาด กระแสไฟฟ้าไหลไม่ครบวงจร`,
'M3|ว 2.3': `## 1. ความร้อน
• ความร้อนถ่ายโอนจากที่อุณหภูมิสูงไปที่อุณหภูมิต่ำ จนอุณหภูมิเท่ากัน เรียกว่า **สมดุลความร้อน**
• การนำ (ผ่านของแข็ง) · การพา (ของเหลวและแก๊สเคลื่อนที่พาความร้อนไป) · การแผ่รังสี (ไม่ต้องอาศัยตัวกลาง)
= Q = m c Δt
• Q ความร้อน (J หรือ cal) · m มวล · c ความร้อนจำเพาะ · Δt อุณหภูมิที่เปลี่ยนไป
!! ขณะสารเปลี่ยนสถานะ อุณหภูมิคงที่ ความร้อนที่ได้รับใช้เปลี่ยนสถานะ (ความร้อนแฝง)
## 2. งาน กำลัง และพลังงานกล
= W = F × s          P = {W/t}
= Eₖ = {1/2} m v²          Eₚ = m g h
• W งาน (J) · F แรงในแนวเดียวกับการเคลื่อนที่ (N) · s ระยะทาง (m) · P กำลัง (W) · t เวลา (s)
!! ถ้าแรงตั้งฉากกับการเคลื่อนที่ หรือวัตถุไม่เคลื่อนที่ งานเป็นศูนย์
• กฎการอนุรักษ์พลังงาน: พลังงานไม่สูญหาย แต่เปลี่ยนรูปได้ วัตถุตกอิสระ Eₚ ลดลงเท่ากับ Eₖ ที่เพิ่มขึ้น
ex: ยกกล่องหนัก 50 N ขึ้นสูง 2 m ในเวลา 4 s → W = 50 × 2 = 100 J และ P = {100/4} = 25 W
## 3. ไฟฟ้า
= V = I R          I = {V/R}          R = {V/I}
• V ความต่างศักย์ (โวลต์ V) · I กระแสไฟฟ้า (แอมแปร์ A) · R ความต้านทาน (โอห์ม Ω)
[[fig:series|ต่ออนุกรม: กระแสไฟฟ้าเท่ากันทุกจุด]]
[[fig:parallel|ต่อขนาน: ความต่างศักย์คร่อมแต่ละสาขาเท่ากัน]]
| เปรียบเทียบ | ต่ออนุกรม | ต่อขนาน |
| กระแสไฟฟ้า | เท่ากันทุกตัว | แยกไหล รวมกันเท่ากระแสรวม |
| ความต่างศักย์ | แบ่งกัน รวมกันเท่าแหล่งจ่าย | เท่ากันทุกสาขา |
| ความต้านทานรวม | R = R₁ + R₂ | {1/R} = {1/R₁} + {1/R₂} |
ex: ตัวต้านทาน 2 Ω และ 3 Ω ต่ออนุกรมกับแบตเตอรี่ 10 V → R = 2 + 3 = 5 Ω และ I = {10/5} = 2 A
ex: ตัวต้านทาน 6 Ω และ 3 Ω ต่อขนาน → {1/R} = {1/6} + {1/3} = {3/6} ดังนั้น R = 2 Ω (น้อยกว่าตัวที่น้อยที่สุดเสมอ)
= P = I V          พลังงานไฟฟ้า (หน่วย) = {กำลังไฟฟ้า (วัตต์) × เวลา (ชั่วโมง)/1000}
ex: เตารีด 1,000 W ใช้งาน 2 ชั่วโมง → {1000 × 2/1000} = 2 หน่วย ถ้าค่าไฟหน่วยละ 4 บาท จ่าย 8 บาท
?? โจทย์ค่าไฟมักให้กำลังเป็นวัตต์และเวลาเป็นนาทีหรือเป็นวัน ต้องแปลงเป็นกิโลวัตต์และชั่วโมงก่อนคูณ
• ชิ้นส่วนอิเล็กทรอนิกส์: ตัวต้านทาน (จำกัดกระแส) · ไดโอด (ให้กระแสผ่านทางเดียว) · ทรานซิสเตอร์ (สวิตช์/ขยายสัญญาณ) · ตัวเก็บประจุ (เก็บและคายประจุ)
## 4. คลื่นและแสง
= v = f λ
• v อัตราเร็วคลื่น (m/s) · f ความถี่ (Hz) · λ ความยาวคลื่น (m)
• คลื่นแม่เหล็กไฟฟ้าเรียงจากความถี่ต่ำไปสูง: วิทยุ ไมโครเวฟ อินฟราเรด แสงที่มองเห็น อัลตราไวโอเลต รังสีเอกซ์ รังสีแกมมา ทุกชนิดมีอัตราเร็วในสุญญากาศเท่ากัน
• กฎการสะท้อน: มุมตกกระทบ = มุมสะท้อน (วัดจากเส้นแนวฉาก)
• การหักเห: แสงจากอากาศเข้าสู่น้ำหรือแก้ว เบนเข้าหาเส้นแนวฉาก · จากน้ำหรือแก้วออกสู่อากาศ เบนออกจากเส้นแนวฉาก
• เลนส์นูนรวมแสง (แก้สายตายาว) · เลนส์เว้ากระจายแสง (แก้สายตาสั้น)`
};

/* ---------- รันครั้งแรก (รันซ้ำได้ จะเพิ่มเฉพาะชีตและคอลัมน์ที่ยังไม่มี) ---------- */
function setup() {
  Object.keys(SHEETS).forEach(function (n) {
    const s = ss().getSheetByName(n) || ss().insertSheet(n);
    s.getRange(1, 1, s.getMaxRows(), SHEETS[n].length).setNumberFormat('@');
    if (s.getLastRow() === 0) { s.appendRow(SHEETS[n]); s.setFrozenRows(1); return; }
    // ชีตเดิมจากเวอร์ชันก่อน: เติมหัวคอลัมน์ใหม่ที่ต่อท้าย (เช่น Questions.type, Attempts.score)
    const head = s.getRange(1, 1, 1, Math.max(s.getLastColumn(), 1)).getValues()[0].map(String);
    SHEETS[n].forEach(function (k, i) { if (head.indexOf(k) < 0) s.getRange(1, i + 1).setValue(k); });
  });
  if (!tbl('Blueprint').length) {
    // โครงมาตรฐานตามผังข้อสอบ 2569 — จำนวนข้อเว้นว่างไว้ นำเข้าผังเต็มจาก data/blueprint.tsv ที่แท็บ "ผังข้อสอบ" ในหน้าแอดมิน
    const S = [['วิทยาศาสตร์ชีวภาพ', ['ว 1.1', 'ว 1.2', 'ว 1.3']], ['วิทยาศาสตร์กายภาพ', ['ว 2.1', 'ว 2.2', 'ว 2.3']], ['วิทยาศาสตร์โลกและอวกาศ', ['ว 3.1', 'ว 3.2']]];
    const TECH = { P6: ['ว 4.2'], M3: ['ว 4.1', 'ว 4.2'] }; // ผัง ป.6 ไม่มี ว 4.1
    const rows = [];
    ['P6', 'M3'].forEach(function (lv) {
      S.concat([['เทคโนโลยี', TECH[lv]]]).forEach(function (g) { g[1].forEach(function (st) { rows.push({ level: lv, year: '2569', strand: g[0], standard: st }); }); });
    });
    addMany('Blueprint', rows);
  }
  if (!tbl('Summaries').length) {
    addMany('Summaries', SEED_SUMMARIES.map(function (r) { return { level: r[0], standard: r[1], indicator: '', title: r[2], content: RICH[r[0] + '|' + r[1]] || r[3] }; }));
  }
  if (!tbl('Admins').length) {
    const pw = uid(), salt = uid();
    add('Admins', { id: uid(), username: 'admin', salt: salt, hash: hash(salt, pw), name: 'ผู้ดูแลระบบกลาง', role: 'super', schoolId: '', active: 'Y' });
    Logger.log('สร้างผู้ดูแลกลางแล้ว → ชื่อผู้ใช้: admin  รหัสผ่าน: ' + pw + '  (จดไว้ รหัสนี้แสดงครั้งเดียว)');
  }
}
