/* แกนกลางของหน้าเว็บ: สถานะ · เรียก Apps Script · โหลดเนื้อหา JSON · บันทึกคะแนนเบื้องหลัง · เมนูล่าง · ไอคอน
   (API_URL ตั้งไว้ใน index.html) */
const LV = { P6: 'ป.6', M3: 'ม.3' };
const $ = s => document.querySelector(s), app = $('#app');
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pct = (c, t) => t ? Math.round(c * 100 / t) + '%' : '–';
/* PREVIEW (ตั้งใน index.html): หน้าทดลอง /preview/ ใช้ที่เก็บในเครื่องแยกชื่อ (pv.*) ไม่ปนกับเว็บหลักที่โดเมนเดียวกัน */
const NS = typeof PREVIEW !== 'undefined' && PREVIEW ? 'pv.' : '';
const store = { get(k) { try { return JSON.parse(localStorage.getItem(NS + k)); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(NS + k, JSON.stringify(v)); } catch (e) {} }, del(k) { try { localStorage.removeItem(NS + k); } catch (e) {} } };
let S = store.get('onet') || {}, Q = null, A = { tab: 'students', level: 'P6' };
const save = () => store.set('onet', { code: S.code, school: S.school, room: S.room, level: S.level, student: S.student, token: S.token });

function toast(t) { const m = $('#msg'); m.textContent = t; m.style.display = 'block'; clearTimeout(toast.t); toast.t = setTimeout(() => { m.style.display = 'none'; }, 3800); }
/* เรียก Apps Script: ตั้งเวลาหมด (อ่าน 30 วินาที · เขียน 60 วินาที) · คำขออ่านที่เหมือนกันและยังรอผลอยู่ใช้คำขอเดิมร่วมกัน ไม่ยิงซ้ำ
   ส่งคะแนนซ้ำได้ปลอดภัย: attemptId เดิมไม่บันทึกซ้ำ · เวลาหมดฝั่งเว็บไม่ได้ยกเลิกงานที่เซิร์ฟเวอร์ (Apps Script ทำต่อจนจบ) */
let API_TIMEOUT = { read: 30000, write: 60000 };
const WRITE_ACTIONS = ['setSchoolTest', 'moveTestAttempts', 'requestAccess', 'decideRequest', 'setAdminActive', 'submitAttempt', 'saveSchool', 'saveAdmin', 'removeAdmin', 'addStudents', 'removeStudent', 'resetRoomCode', 'roomCodes'];
const INFLIGHT = {};
function api(action, data) {
  if (!API_URL) return Promise.reject(new Error('ยังไม่ได้ตั้งค่า API_URL ในไฟล์ index.html'));
  const body = JSON.stringify(Object.assign({ action }, data || {})), write = WRITE_ACTIONS.includes(action);
  if (!write && INFLIGHT[body]) return INFLIGHT[body];
  const p = (async () => {
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), write ? API_TIMEOUT.write : API_TIMEOUT.read);
    try {
      const r = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body, signal: ctl.signal });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error);
      return j.data;
    } catch (e) {
      if (e.name === 'AbortError') throw new Error('เซิร์ฟเวอร์ตอบช้า ลองใหม่อีกครั้ง' + (write ? ' (ถ้าส่งไปแล้ว ระบบจะไม่บันทึกซ้ำ)' : ''));
      if (e instanceof SyntaxError) throw new Error('เซิร์ฟเวอร์ตอบผิดปกติ ลองใหม่อีกครั้ง');
      throw e;
    } finally { clearTimeout(t); }
  })();
  if (!write) { INFLIGHT[body] = p; const clr = () => { delete INFLIGHT[body]; }; p.then(clr, clr); }
  return p;
}
let VIEW = 0; // เพิ่มทุกครั้งที่ผู้ใช้กดปุ่ม: งานเบื้องหลังที่เสร็จช้ากว่านั้นจะไม่วาดทับหน้าใหม่
const BUSY = new Set(); let RETRY = null; // BUSY = ปุ่ม/ฟอร์มที่กำลังทำงานอยู่ กดซ้ำไม่ได้
async function run(fn, key) {
  if (key) { if (BUSY.has(key)) return; BUSY.add(key); }
  VIEW++;
  try { await fn(); theme(); }
  catch (e) {
    toast(e.message);
    if (/กำลัง/.test(app.textContent) && !/เข้าสู่ระบบใหม่|รหัสห้องเรียนไม่ถูกต้อง/.test(e.message)) { RETRY = fn; page('<section class="glass errcard" role="alert"><div class="eic">' + ico('refresh') + '</div><h2>เชื่อมต่อไม่สำเร็จ</h2><p class="mute">' + esc(e.message) + '</p><p class="mute small">ตรวจสอบอินเทอร์เน็ตแล้วกด "ลองใหม่" · คำตอบที่ทำไว้ไม่หาย</p><button class="btn" data-a="retry">ลองใหม่</button></section>', null); }
    if (/เข้าสู่ระบบใหม่/.test(e.message)) { S.token = null; save(); admin(); }
    else if (/รหัสห้องเรียนไม่ถูกต้อง/.test(e.message) && S.code) { S.code = S.student = null; ROSTER = null; save(); home(); }
  } finally { if (key) BUSY.delete(key); }
}
const loading = t => { app.innerHTML = '<div class="glass skel" role="status" aria-busy="true"><p class="mute">' + esc(t || 'กำลังโหลด…') + '</p><div class="sk l1"></div><div class="sk l2"></div><div class="sk l3"></div><p id="slowhint" class="small" hidden>ช้ากว่าปกติ กำลังรอเซิร์ฟเวอร์ (ถ้ารอเกิน 30 วินาทีจะแจ้งให้ลองใหม่)</p></div><div class="glass skel" aria-hidden="true"><div class="sk l1"></div><div class="sk l2"></div></div>'; clearTimeout(loading.t); loading.t = setTimeout(() => { const h = document.getElementById('slowhint'); if (h) h.hidden = false; }, 12000); };

/* ---------- ธีมตามระดับชั้น: ป.6 สด ตัวใหญ่ ปุ่มอวบ · ม.3 เรียบ ตัวเล็กลง เส้นบาง ---------- */
function theme() {
  const lv = S.level || 'P6';
  document.body.classList.remove('lv-P6', 'lv-M3'); document.body.classList.add('lv-' + lv);
  $('#lvb').textContent = LV[lv];
}

/* ---------- เนื้อหา: โหลดจากไฟล์ JSON บน GitHub Pages (โฟลเดอร์ content/) ไม่ผ่าน Apps Script ---------- */
let MFP = null, MFV = null; const CJ = {};
const manifest = () => MFP || (MFP = fetch('content/manifest.json', { cache: 'no-cache' }).then(r => { if (!r.ok) throw new Error('โหลดเนื้อหาไม่ได้ (HTTP ' + r.status + ')'); return r.json(); }).then(j => (MFV = j)).catch(e => { MFP = null; throw e; }));
async function cj(rel, optional) {
  const m = await manifest(), v = m.files[rel];
  if (v === undefined) { if (optional) return null; throw new Error('ไม่พบไฟล์เนื้อหา ' + rel); }
  const k = rel + '@' + v;
  return CJ[k] || (CJ[k] = fetch('content/' + rel + '?v=' + v).then(r => { if (!r.ok) throw new Error('โหลดเนื้อหาไม่ได้ ' + rel + ' (HTTP ' + r.status + ')'); return r.json(); }).catch(e => { delete CJ[k]; throw e; }));
}
const revOf = rel => (MFV && MFV.files[rel]) || '';
manifest().catch(() => {}); // เริ่มโหลดรายการไฟล์ตั้งแต่เปิดหน้า
const yearsOf = qs => [...new Set(qs.map(q => q.examYear))];
async function questionsFor(keys) {
  const files = await Promise.all(yearsOf(keys.map(k => ({ examYear: k.split('/')[0] }))).map(y => cj(S.level + '/q-' + y + '.json')));
  const idx = {}; files.forEach(arr => arr.forEach(q => { idx[q.examYear + '/' + q.itemNo] = q; }));
  return keys.map(k => idx[k]).filter(Boolean);
}
const qkey = q => q.examYear + '/' + q.itemNo;
const strandOf = std => ({ 1: 'bio', 2: 'phys', 3: 'earth', 4: 'tech' }[(String(std).match(/ว\s*(\d)/) || [])[1]] || 'phys');

/* ---------- บันทึกคะแนนเบื้องหลัง: เก็บในเครื่องก่อน ส่งซ้ำอัตโนมัติถ้าเน็ตหลุด · attemptId เดิมส่งซ้ำไม่บันทึกซ้ำ ---------- */
const uuid = () => (window.crypto && crypto.randomUUID ? crypto.randomUUID() : 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 12));
const PEND = 'onet_pending', pend = () => store.get(PEND) || [];
let flushing = false, flushTimer = 0;
function saveState(att, txt, cls) { const el = document.getElementById('savestat'); if (el && el.dataset.id === att.attemptId) { el.textContent = txt; el.className = 'mute small ' + (cls || ''); } }
async function flushQ() {
  if (flushing) return; flushing = true; clearTimeout(flushTimer);
  try {
    for (;;) {
      const att = pend()[0]; if (!att) break;
      const drop = () => store.set(PEND, pend().filter(x => x.attemptId !== att.attemptId));
      try {
        const r = await api('submitAttempt', att); drop();
        if (r.pending) { saveState(att, 'บันทึกคะแนนแล้ว (ระบบจะตรวจซ้ำภายหลัง)', 'ok'); PR = null; continue; }
        const ch = att.chk, diff = ch && (+r.score !== +ch.score || +r.correct !== +ch.correct);
        saveState(att, diff ? 'บันทึกแล้ว · ระบบตรวจซ้ำได้ ' + r.correct + ' ข้อ ' + r.score + ' คะแนน (ใช้ค่านี้บันทึก)' : 'บันทึกคะแนนแล้ว ✓', diff ? 'bad' : 'ok');
        PR = null; // ความคืบหน้าเปลี่ยนแล้ว
      } catch (e) {
        if (/ไม่ถูกต้อง|ไม่พบนักเรียน|ไม่รู้จักคำสั่ง/.test(e.message)) { drop(); saveState(att, 'บันทึกคะแนนไม่ได้: ' + e.message, 'bad'); continue; }
        att.tries = (att.tries || 0) + 1;
        if (att.tries > 40) { drop(); continue; }
        store.set(PEND, pend().map(x => (x.attemptId === att.attemptId ? att : x)));
        saveState(att, 'ยังบันทึกคะแนนไม่สำเร็จ ระบบจะลองใหม่อัตโนมัติ', 'bad');
        flushTimer = setTimeout(flushQ, Math.min(60000, 4000 * att.tries)); break;
      }
    }
  } finally { flushing = false; }
}
window.addEventListener('online', flushQ);
const enqueue = att => { store.set(PEND, pend().concat([att])); flushQ(); };
let PR = null; // ความคืบหน้า/ประวัติของนักเรียนที่เปิดอยู่ (ได้จาก progress)
function loadProgress() { return PR ? Promise.resolve(PR) : api('progress', { code: S.code, studentId: S.student.id }).then(r => (PR = r)); }

/* ---------- ไอคอนเส้นบาง ---------- */
const ICO = {
  home: '<path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
  exam: '<path d="M9 3h6v3H9z"/><path d="M7 5H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-2"/><path d="M8 12h8M8 16h5"/>',
  book: '<path d="M12 6v14"/><path d="M12 6c-1.5-1.5-4-2-8-2v14c4 0 6.5.5 8 2 1.5-1.5 4-2 8-2V4c-4 0-6.5.5-8 2z"/>',
  bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
  users: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
  bio: '<path d="M20 4C9 4 4 9 4 15a5 5 0 0 0 5 5c6 0 11-5 11-16z"/><path d="M4 20c4-6 8-9 12-11"/>',
  phys: '<circle cx="12" cy="12" r="1.6"/><ellipse cx="12" cy="12" rx="10" ry="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"/>',
  earth: '<circle cx="12" cy="12" r="5"/><ellipse cx="12" cy="12" rx="10.5" ry="3.4" transform="rotate(-20 12 12)"/>',
  tech: '<rect x="7" y="7" width="10" height="10" rx="1.5"/><path d="M10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4"/>',
  back: '<path d="M15 5l-7 7 7 7"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>', flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>', check: '<path d="M5 12l5 5 9-10"/>',
  play: '<path d="M8 5l11 7-11 7z"/>', grid: '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h8"/>', refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l5 5"/>', flame: '<path d="M12 3c1 4 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 .3 1.5 1 2 2 2-1-3-.5-5 1-8z"/>',
  print: '<path d="M7 9V3h10v6M7 17H5a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-2"/><rect x="7" y="14" width="10" height="7"/>', out: '<path d="M10 4H5v16h5M15 8l4 4-4 4M19 12H9"/>'
};
const ico = (n, st) => '<svg class="ico" viewBox="0 0 24 24"' + (st ? ' style="' + st + '"' : '') + ' aria-hidden="true">' + ICO[n] + '</svg>';
const BRAND = '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="7" fill="#fbbf24"/><ellipse cx="16" cy="16" rx="14" ry="5" fill="none" stroke="#a5b4fc" stroke-width="2" transform="rotate(-24 16 16)"/><circle cx="27" cy="9" r="2.4" fill="#4ade80"/></svg>';

/* ---------- ภาพประดับหน้าแรก: ป.6 สดใสมีจรวด · ม.3 เส้นวงโคจรบาง ๆ ---------- */
function heroArt() {
  const P = S.level === 'M3' ? 0 : 1;
  const planets = [['#4ade80', 62, .16, 'bio'], ['#60a5fa', 112, .44, 'phys'], ['#fbbf24', 162, .66, 'earth'], ['#c084fc', 212, .86, 'tech']];
  let g = '<svg class="art" viewBox="0 0 360 176" aria-hidden="true"><defs><radialGradient id="sun"><stop offset="0" stop-color="' + (P ? '#fbbf24' : '#a5b4fc') + '"/><stop offset="1" stop-color="' + (P ? '#fbbf24' : '#a5b4fc') + '" stop-opacity="0"/></radialGradient></defs>';
  g += '<circle cx="46" cy="138" r="' + (P ? 52 : 38) + '" fill="url(#sun)" opacity=".6"/><circle cx="46" cy="138" r="' + (P ? 21 : 14) + '" fill="' + (P ? '#fbbf24' : '#a5b4fc') + '"/>';
  planets.forEach(([c, rad, a, k], i) => {
    const rx = rad * 1.4, ry = rad * .95, x = 46 + rx * Math.cos(-a * 1.4), y = 138 + ry * Math.sin(-a * 1.4 - .1), r = P ? 10 - i * 1.2 : 6.5 - i * .6;
    g += '<ellipse cx="46" cy="138" rx="' + rx + '" ry="' + ry + '" fill="none" stroke="' + c + '" stroke-opacity="' + (P ? .55 : .4) + '" stroke-width="' + (P ? 1.6 : 1) + '" stroke-dasharray="' + (P ? '3 5' : '2 6') + '"/>';
    g += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + r.toFixed(1) + '" fill="' + c + '"/>';
    if (P && i === 1) g += '<ellipse cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" rx="' + (r + 6) + '" ry="3.2" fill="none" stroke="#fde68a" stroke-width="1.6" transform="rotate(-18 ' + x.toFixed(1) + ' ' + y.toFixed(1) + ')"/>';
  });
  if (P) g += '<g transform="translate(300 24) rotate(35)"><path d="M0 -20c9 8 9 22 0 32c-9 -10 -9 -24 0 -32z" fill="#f8fafc"/><circle cx="0" cy="-6" r="3.6" fill="#60a5fa"/><path d="M-8 6l-8 8 9-1zM8 6l8 8-9-1z" fill="#f87171"/><path d="M-3 12h6l-3 12z" fill="#fbbf24"/></g>';
  else g += '<path d="M250 30l32 14 26-20M282 44l14 40" fill="none" stroke="#a5b4fc" stroke-opacity=".5" stroke-width="1"/><circle cx="250" cy="30" r="2.4" fill="#e0e7ff"/><circle cx="282" cy="44" r="2.4" fill="#e0e7ff"/><circle cx="308" cy="24" r="2.4" fill="#e0e7ff"/><circle cx="296" cy="84" r="2.4" fill="#e0e7ff"/>';
  g += '<g fill="#fff" class="twinkle"><circle cx="190" cy="22" r="1.6"/><circle cx="330" cy="70" r="1.4"/><circle cx="140" cy="48" r="1.2"/><circle cx="230" cy="96" r="1.4"/></g></svg>';
  return g;
}

/* ---------- เมนูล่าง 4 ปุ่ม (นักเรียน / ครู) ---------- */
const NAV_S = [['home', 'หน้าแรก', 'home'], ['exams', 'ข้อสอบ', 'exam'], ['learn', 'สรุป', 'book'], ['review', 'ทบทวน', 'bulb'], ['mine', 'ผลของฉัน', 'chart']];
const NAV_T = [['students', 'นักเรียน', 'users'], ['report', 'รายงาน', 'chart'], ['admins', 'แอดมิน', 'shield'], ['more', 'อื่น ๆ', 'list']];
function setNav(kind, cur) {
  $('#lvb').style.display = kind === 't' ? 'none' : ''; // หน้าครูไม่ผูกกับระดับชั้น ซ่อนป้ายระดับ
  const n = $('#bnav');
  if (!kind) { n.classList.remove('on'); n.innerHTML = ''; app.classList.add('nonav'); return; }
  app.classList.remove('nonav'); n.classList.add('on'); app.classList.toggle('wide', kind === 't');
  n.innerHTML = '<div>' + (kind === 't' ? NAV_T : NAV_S).map(([k, t, i]) => '<button data-a="nav" data-k="' + k + '" data-kind="' + kind + '" class="' + (k === cur ? 'on' : '') + '" aria-label="' + t + '">' + ico(i) + t + '</button>').join('') + '</div>';
}
/* การเข้าถึง: ผูกป้ายกับช่องกรอกที่อยู่ถัดจากป้าย · ตารางที่เลื่อนได้ต้องโฟกัสด้วยคีย์บอร์ดได้ */
let LBL = 0;
function a11yFix(root) {
  root.querySelectorAll('label:not([for])').forEach(l => { const n = l.nextElementSibling; if (n && /^(INPUT|SELECT|TEXTAREA)$/.test(n.tagName) && !l.querySelector('input,select,textarea')) { if (!n.id) n.id = 'f' + (++LBL); l.setAttribute('for', n.id); } });
  root.querySelectorAll('.scroll').forEach(s => { s.tabIndex = 0; s.setAttribute('role', 'region'); if (!s.hasAttribute('aria-label')) s.setAttribute('aria-label', 'ตาราง เลื่อนดูได้'); });
}
function page(html, kind, cur) { app.innerHTML = html; a11yFix(app); setNav(kind, cur); }
const bar = html => '<div class="bar"><div>' + html + '</div></div>';

/* ---------- สถานะข้อสอบที่ทำค้างไว้: ปิดเว็บกลางคันแล้วเปิดใหม่ ทำต่อได้ ---------- */
const EXK = 'onet_exam';
const loadExam = () => { const e = store.get(EXK); return e && S.student && e.studentId === S.student.id && e.code === S.code ? e : null; };
const clearExam = () => store.del(EXK);
