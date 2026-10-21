/* ฟีเจอร์การเรียนของนักเรียน (ช่วง 2): ตั้งค่า · แดชบอร์ด · ภารกิจ · สมุดข้อผิด · แนะนำตัวชี้วัดอ่อน · ฝึกเลือกเอง · ข้อสอบจับเวลา · บัตรคำ · ค้นหา · เหรียญ/สตรีค
   หลักการ: คำนวณฝั่งเว็บทั้งหมด ไม่เรียก Apps Script เพิ่ม (ใช้ progress ที่โหลดอยู่แล้ว + ไฟล์เนื้อหาแบบ static)
   ข้อมูลที่เก็บในเครื่อง (ต่อนักเรียน): วันที่ใช้งาน · ผลฝึกวันนี้ · ระดับกล่องของบัตรคำ · ผลที่ยังไม่ถึงเซิร์ฟเวอร์ (lq) */
const DAYMS = 864e5, pad2 = n => String(n).padStart(2, '0');
const dstr = d => d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
const LK = () => 'lrn.' + (S.student ? S.student.id : '_');
const LS = () => Object.assign({ days: {}, cards: {}, lq: [] }, store.get(LK()) || {});
function lsave(o) { const ks = Object.keys(o.days).sort(); ks.slice(0, Math.max(0, ks.length - 120)).forEach(k => delete o.days[k]); store.set(LK(), o); }
function logDay(k, n) { const o = LS(), t = dstr(new Date()), d = o.days[t] = o.days[t] || { q: 0, rev: 0, cards: 0, read: 0 }; d[k] = (d[k] || 0) + (n || 1); lsave(o); }
const qidOf = key => S.level + '-' + key.replace('/', '-');
const keyOfQid = qid => qid.replace(/^[A-Z0-9]+-/, '').replace('-', '/');
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/* ---------- ตั้งค่า: ขนาดตัวอักษร · โหมดสว่าง · ติดตั้งลงหน้าจอ ---------- */
const SET = () => Object.assign({ fz: 1, light: false }, store.get('set') || {});
function applySet() {
  const s = SET(); document.documentElement.style.setProperty('--fz', s.fz);
  document.body.classList.toggle('light', !!s.light);
  const tc = document.querySelector('meta[name=theme-color]'); if (tc) tc.content = s.light ? '#f4f6ff' : '#080d24';
}
applySet();
let DEFER = null; window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); DEFER = e; });

/* ---------- สถิติจากประวัติรายข้อ (progress.qs ที่ได้จากเซิร์ฟเวอร์ + ผลที่ยังค้างในเครื่อง) ---------- */
async function prSafe() { try { return await loadProgress(); } catch (e) { return PR || { done: {}, qs: {}, history: [] }; } }
let IS = null;
async function getStats() {
  const pr = await prSafe(), by = {}, o = LS(), pending = new Set(pend().map(a => a.attemptId));
  Object.keys(pr.qs || {}).forEach(k => { if (k.indexOf(S.level + '-') === 0) by[k] = { h: pr.qs[k].h || '', ts: pr.qs[k].ts || '' }; });
  const keep = o.lq.filter(e => pending.has(e.aid)); if (keep.length !== o.lq.length) { o.lq = keep; lsave(o); }
  keep.forEach(e => e.items.forEach(i => { const b = by[i.q] = by[i.q] || { h: '', ts: '' }; b.h = (b.h + i.ok).slice(-8); b.ts = e.ts; }));
  const qidx = (await cj(S.level + '/qidx.json', true).catch(() => null)) || {}, ind = {}, nb = [], now = Date.now();
  Object.keys(by).forEach(qid => {
    const key = keyOfQid(qid), t = qidx[key], h = by[qid].h; if (!t) return;
    const x = ind[t[0] + '|' + t[1]] = ind[t[0] + '|' + t[1]] || { std: t[0], ind: t[1], n: 0, c: 0 };
    for (const ch of h) { x.n++; if (ch === '1') x.c++; }
    if (h.indexOf('0') >= 0 && !/11$/.test(h)) { const due = h.slice(-1) === '0' ? 0 : (Date.parse(by[qid].ts) || 0) + 3 * DAYMS; nb.push({ qid, key, std: t[0], ind: t[1], due, ready: due <= now }); }
  });
  nb.sort((a, b) => a.due - b.due);
  const weak = Object.values(ind).filter(x => x.n >= 3 && x.c / x.n < .6).sort((a, b) => a.c / a.n - b.c / b.n || b.n - a.n);
  const days = new Set(Object.keys(o.days)); (pr.history || []).forEach(h => { const d = new Date(h.ts); if (!isNaN(d)) days.add(dstr(d)); });
  let st = 0, d = new Date(); if (!days.has(dstr(d))) d = new Date(Date.now() - DAYMS); while (days.has(dstr(d))) { st++; d = new Date(d.getTime() - DAYMS); }
  return (IS = { pr, by, ind, nb, due: nb.filter(x => x.ready), weak, streak: st, today: o.days[dstr(new Date())] || { q: 0, rev: 0, cards: 0, read: 0 }, o });
}
const medalOf = d => !d || !d.done ? 0 : d.correct >= 60 && d.correct / d.done >= .8 ? 3 : d.correct >= 30 && d.correct / d.done >= .7 ? 2 : d.correct >= 10 ? 1 : 0;
const MEDAL = ['', 'ทองแดง', 'เงิน', 'ทอง'], MCOL = ['', '#c98a4b', '#cbd5e1', '#fbbf24'];
const medalSvg = n => n ? '<svg class="medal" viewBox="0 0 24 24" role="img" aria-label="เหรียญ' + MEDAL[n] + '"><path d="M7 2l5 8 5-8" fill="none" stroke="#818cf8" stroke-width="2.4"/><circle cx="12" cy="15" r="6.5" fill="' + MCOL[n] + '" stroke="#0004" stroke-width="1"/><text x="12" y="18.2" text-anchor="middle" font-size="9" font-weight="700" fill="#2b1d02">' + n + '</text></svg>' : '';
const indInfo = (m, std, ind) => { const s = m.standards.find(x => x.standard === std), i = s && s.ind.find(x => x.indicator === ind); return i ? i.description : ''; };

/* ---------- หน้าแรก (แดชบอร์ด) ---------- */
async function dash() {
  loading();
  const my = VIEW, lv = S.level, m = await cj(lv + '/meta.json');
  const years = Object.keys(m.bankYears).sort().reverse(), bank = m.standards.reduce((n, x) => n + x.bank, 0);
  const paint = (s) => {
    const pr = s && s.pr, agg = {}; Object.keys(STRAND_NAME).forEach(k => { agg[k] = { done: 0, correct: 0, n: 0 }; });
    m.standards.forEach(x => { const k = strandOf(x.standard), d = pr && pr.done[x.standard]; agg[k].n++; if (d) { agg[k].done += d.done; agg[k].correct += d.correct; } });
    const mis = s ? missionsHtml(s, m) : '', w = s && s.weak[0];
    page('<section class="glass hero">' + heroArt() + '<div class="tx"><div class="row" style="flex-wrap:nowrap"><span class="chip lv" style="flex:none">' + LV[lv] + '</span>' + (s && s.streak ? '<span class="chip streak" style="flex:none">' + ico('flame') + 'เรียนต่อเนื่อง ' + s.streak + ' วัน</span>' : '') + '</div><h1>สวัสดี ' + esc(S.student.name) + '</h1>' +
      '<p class="mute small">คลังข้อสอบจริง ' + bank + ' ข้อ' + (years.length ? ' · ปีการศึกษา ' + esc(years[years.length - 1]) + '–' + esc(years[0]) : '') + '</p></div></section>' +
      resumeCard() + (s ? asgHtml(s) : '') +
      '<section class="glass"><h2>ภารกิจวันนี้</h2>' + (mis || '<p class="mute small">กำลังโหลด…</p>') + '</section>' +
      (s && s.nb.length ? '<section class="glass nbcard"><div class="row" style="flex-wrap:nowrap"><div class="tx" style="flex:1"><h2>สมุดข้อผิด</h2><p class="mute small">' + (s.due.length ? 'ถึงเวลาทบทวน ' + s.due.length + ' ข้อ' : 'ยังไม่ถึงเวลาทบทวน') + ' · ทั้งหมด ' + s.nb.length + ' ข้อ</p></div><button class="btn sm" style="flex:none" data-a="nbstart"' + (s.due.length ? '' : ' disabled') + '>ทบทวน</button></div></section>' : '') +
      (w ? '<section class="glass s-' + strandOf(w.std) + '"><h2>ตัวชี้วัดที่ควรเสริม</h2><p class="mute">' + esc(w.std) + ' · ' + esc(w.ind) + ' <span class="small">(ทำถูก ' + Math.round(w.c * 100 / w.n) + '% จาก ' + w.n + ' ครั้ง)</span></p><p class="mute small">' + esc(indInfo(m, w.std, w.ind)) + '</p><div class="row"><button class="btn sec sm" data-a="study" data-std="' + esc(w.std) + '" data-ind="' + esc(w.ind) + '">อ่านสรุป</button><button class="btn sm" data-a="prac" data-std="' + esc(w.std) + '" data-ind="' + esc(w.ind) + '">ฝึกตัวชี้วัดนี้</button></div></section>' : '') +
      '<h2 style="margin:8px 2px 10px">ความคืบหน้าตามสาระ</h2><div class="sgrid">' + Object.keys(STRAND_NAME).map(k => { const a = agg[k], p = a.done ? Math.round(a.correct * 100 / a.done) : 0;
        return '<button class="scard s-' + k + '" data-a="nav" data-k="learn" data-kind="s"><div class="row"><div class="ring" style="--p:' + p + '"><b>' + (a.done ? p + '%' : '–') + '</b></div><div><div class="t">' + ico(k, 'width:1.1em;height:1.1em;vertical-align:-3px') + ' ' + STRAND_NAME[k] + '</div><div class="mute small">' + (a.done ? 'ถูก ' + a.correct + '/' + a.done + ' ข้อ' : a.n + ' มาตรฐาน') + '</div></div></div></button>'; }).join('') + '</div>' +
      '<div class="row" style="margin-bottom:10px"><button class="btn sec" data-a="nav" data-k="exams" data-kind="s">ข้อสอบจำลอง / รายปี</button><button class="btn sec" data-a="search">' + ico('search') + 'ค้นหา</button></div><button class="btn ghost" data-a="home">เปลี่ยนผู้ใช้</button>', 's', 'home');
  };
  paint(null);
  getStats().then(s => { if (VIEW === my) paint(s); }).catch(() => {});
}
function missionsHtml(s, m) {
  const t = s.today, w = s.weak[0], row = (done, title, sub, btn) => '<div class="mis' + (done ? ' done' : '') + '"><span class="mk" aria-hidden="true">' + (done ? ico('check') : '') + '</span><div class="tx"><b>' + title + '</b><span class="mute small">' + sub + (done ? ' · สำเร็จแล้ว' : '') + '</span></div>' + (done ? '' : btn) + '</div>';
  const q = row(t.q >= 10, 'ทำโจทย์ 10 ข้อ', 'วันนี้ทำแล้ว ' + Math.min(t.q, 10) + '/10 ข้อ', w ? '<button class="btn sm" data-a="prac" data-std="' + esc(w.std) + '" data-ind="' + esc(w.ind) + '">ฝึก ' + esc(w.ind) + '</button>' : '<button class="btn sm" data-a="nav" data-k="learn" data-kind="s">เลือกหัวข้อ</button>');
  const r = s.nb.length ? row(t.rev >= 1, 'ทบทวนสมุดข้อผิด', s.due.length ? s.due.length + ' ข้อรอทบทวน' : 'ยังไม่ถึงเวลาทบทวน', s.due.length ? '<button class="btn sm" data-a="nbstart">ทบทวน</button>' : '')
    : row(t.read >= 1, 'อ่านสรุป 1 หัวข้อ', 'เริ่มจากมาตรฐานที่ยังไม่เคยฝึก', '<button class="btn sm" data-a="nav" data-k="learn" data-kind="s">เลือกหัวข้อ</button>');
  const c = row(t.cards >= 10, 'ทบทวนบัตรคำ 10 ใบ', 'วันนี้ทบทวนแล้ว ' + Math.min(t.cards, 10) + '/10 ใบ', '<button class="btn sm" data-a="cards">เริ่ม</button>');
  return q + r + c;
}
/* งานที่ครูมอบหมาย (มากับ progress.assignments · สถานะต่องานอยู่ใน progress.asg) */
const KIND = { practice: 'ฝึกตามชุดข้อ', pre: 'แบบทดสอบก่อนเรียน', post: 'แบบทดสอบหลังเรียน', read: 'อ่านสรุป' };
function asgHtml(s) {
  const list = (s.pr && s.pr.assignments) || [], o = s.o, today = dstr(new Date());
  if (!list.length) return '';
  const rows = list.map(a => {
    const st = (s.pr.asg || {})['asg:' + a.id], done = a.kind === 'read' ? !!(o.rd && o.rd[a.id]) : !!st, late = a.due && a.due < today && !done;
    return '<div class="mis' + (done ? ' done' : '') + '"><span class="mk" aria-hidden="true">' + (done ? ico('check') : '') + '</span><div class="tx"><b>' + esc(a.title) + '</b><span class="mute small">' + KIND[a.kind] + (a.kind === 'read' ? ' · ' + esc(a.std) + (a.ind ? ' ' + esc(a.ind) : '') : ' · ' + a.keys.length + ' ข้อ') + (a.due ? ' · กำหนดส่ง ' + new Date(a.due + 'T00:00').toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }) : '') + (st ? ' · ทำแล้ว ' + st.n + ' ครั้ง ดีที่สุด ' + st.best + '%' : '') + '</span>' + (late ? '<span class="chip late">เลยกำหนด</span>' : '') + (a.note ? '<span class="small">' + esc(a.note) + '</span>' : '') + '</div><button class="btn sm' + (done ? ' sec' : '') + '" data-a="asgstart" data-id="' + esc(a.id) + '">' + (a.kind === 'read' ? 'อ่าน' : done ? 'ทำอีกครั้ง' : 'เริ่มทำ') + '</button></div>';
  }).join('');
  return '<section class="glass asgcard"><h2>งานจากครู</h2>' + rows + '</section>';
}
function asgStart(id) {
  const a = (IS && IS.pr.assignments || []).find(x => x.id === id); if (!a) return toast('ไม่พบงานนี้');
  if (a.kind === 'read') { const o = LS(); o.rd = o.rd || {}; o.rd[id] = Date.now(); lsave(o); return study(a.std, a.ind || ''); }
  return quiz('asg', a.std, a.ind, 0, false, null, a.keys, false, id);
}

/* ---------- แท็บ ทบทวน: สมุดข้อผิด · บัตรคำ · ฝึกเลือกเอง · ค้นหา ---------- */
async function reviewPage() {
  loading();
  const my = VIEW, lv = S.level, m = await cj(lv + '/meta.json'), cards = (await cj(lv + '/cards.json', true).catch(() => null)) || [];
  const paint = s => {
    const o = LS(), now = Date.now(), dueC = cards.filter(c => !o.cards[c.id] || o.cards[c.id][1] <= now).length;
    const sd = (s && s.nb.length) ? '<details class="nblist"><summary>ดูรายการในสมุด (' + s.nb.length + ' ข้อ)</summary>' + s.nb.slice(0, 40).map(x => '<div class="it"><div class="tx"><b>ปี ' + esc(x.key.split('/')[0]) + ' ข้อ ' + esc(x.key.split('/')[1]) + '</b> <span class="mute small">' + esc(x.std) + ' · ' + esc(x.ind) + '</span><br><span class="mute small">' + (x.ready ? 'ถึงเวลาทบทวน' : 'ทบทวนอีกครั้งหลัง ' + new Date(x.due).toLocaleDateString('th-TH')) + '</span></div></div>').join('') + '</details>' : '';
    page('<h1 style="margin:4px 2px 12px">ทบทวน</h1>' +
      '<section class="glass"><h2>สมุดข้อผิด</h2>' + (s ? (s.nb.length ? '<p class="mute">มี ' + s.nb.length + ' ข้อ · ถึงเวลาทบทวน <b>' + s.due.length + '</b> ข้อ</p><p class="mute small">ข้อที่เคยทำผิดจะเข้าสมุดเอง ตอบถูกติดกัน 2 ครั้งจึงออกจากสมุด</p>' + sd : '<p class="mute">สมุดยังว่าง ข้อที่ทำผิดจะมาอยู่ที่นี่เอง') : '<p class="mute">กำลังโหลด…</p>') + '</p>' +
      '<div class="sp"></div><button class="btn" data-a="nbstart"' + (s && s.due.length ? '' : ' disabled') + '>ทบทวนข้อผิด' + (s && s.due.length ? ' (' + Math.min(10, s.due.length) + ' ข้อ)' : '') + '</button></section>' +
      '<section class="glass"><h2>บัตรคำ</h2><p class="mute">จากหัวข้อ "จำให้แม่น" ในสรุป · ทั้งหมด ' + cards.length + ' ใบ · ถึงเวลาทบทวน ' + dueC + ' ใบ</p><div class="sp"></div><button class="btn" data-a="cards"' + (cards.length ? '' : ' disabled') + '>เริ่มทบทวนบัตรคำ</button></section>' +
      '<section class="glass"><h2>ฝึกเลือกเอง</h2>' + customForm(m) + '</section>' +
      '<section class="glass"><h2>ค้นหา</h2><p class="mute small">ค้นในสรุปเนื้อหาและโจทย์ข้อสอบ</p><button class="btn sec" data-a="search">' + ico('search') + 'ค้นหา</button></section>', 's', 'review');
    fillInds(m);
  };
  paint(null); getStats().then(s => { if (VIEW === my) paint(s); }).catch(() => {});
}
function customForm(m) {
  return '<label for="cs">มาตรฐาน</label><select id="cs">' + m.standards.map(x => '<option value="' + esc(x.standard) + '">' + esc(stdName(x)) + ' (' + x.bank + ' ข้อ)</option>').join('') + '</select>' +
    '<label for="ci">ตัวชี้วัด</label><select id="ci"></select>' +
    '<div class="row"><div><label for="cn">จำนวนข้อ</label><select id="cn"><option>5</option><option selected>10</option><option>20</option></select></div><div><label for="co">ลำดับข้อ</label><select id="co"><option value="r">สุ่ม</option><option value="y">เรียงตามปี</option></select></div></div>' +
    '<label class="chk"><input type="checkbox" id="cu"> เฉพาะข้อที่ยังไม่เคยทำ</label><div class="sp"></div><button class="btn" data-a="cgo">เริ่มฝึก</button>';
}
function fillInds(m) {
  const cs = document.getElementById('cs'), ci = document.getElementById('ci'); if (!cs || !ci) return;
  const x = m.standards.find(s => s.standard === cs.value);
  ci.innerHTML = '<option value="">ทุกตัวชี้วัด</option>' + (x ? x.ind.map(i => '<option value="' + esc(i.indicator) + '">' + esc(i.indicator) + ' (' + i.bank + ' ข้อ)</option>').join('') : '');
}
app.addEventListener('change', e => { if (e.target.id === 'cs') cj(S.level + '/meta.json').then(fillInds); });
async function customGo() {
  const m = await cj(S.level + '/meta.json'), std = $('#cs').value, ind = $('#ci').value, n = +$('#cn').value, rnd = $('#co').value === 'r', fresh = $('#cu').checked;
  let keys = (m.pool[ind ? std + '|' + ind : std] || []).slice();
  if (fresh) { const s = await getStats(); keys = keys.filter(k => !s.by[qidOf(k)]); }
  if (!keys.length) return toast(fresh ? 'ข้อในหัวข้อนี้ทำครบแล้ว ลองเอาเครื่องหมายออก' : 'ยังไม่มีข้อสอบในหัวข้อนี้');
  keys = rnd ? shuffle(keys) : keys.sort(); return quiz('custom', std, ind, 0, false, null, keys.slice(0, n));
}
async function nbStart() {
  const s = await getStats(); if (!s.due.length) return toast('ยังไม่มีข้อที่ถึงเวลาทบทวน');
  return quiz('review', '', '', 0, false, null, s.due.slice(0, 10).map(x => x.key));
}

/* ---------- บัตรคำ (กล่อง Leitner: ถูก = กล่องถัดไป ผิด = กลับกล่องแรก) ---------- */
const BOXD = [0, 1, 3, 7, 14, 30];
let CD = null;
const cardImg = c => { const f = c.fig && typeof figOf === 'function' && figOf(c.fig); return f ? '<div class="cimg">' + f + '</div>' : ''; };
// บัตรถาม-ตอบจากตาราง: f = "หัวข้อ — คำถาม" → หัวข้อเป็นบรรทัดเล็กด้านบน คำถามตัวใหญ่ · บัตรเติมคำ: ซ่อนคำสำคัญ
const cardKey = c => { const k = c.f.split(' — '); if (k.length > 1) return { sub: k[0], q: k.slice(1).join(' — ') }; const m = c.f.split(' › '); return { sub: m[0], q: m.slice(1).join(' › ') || c.f }; };
const cardFront = c => c.t === 'c' ? '<div class="cf">' + esc(c.b).replace(/\*\*([^*]+)\*\*/g, '<span class="blank" aria-label="ช่องว่าง">………</span>') + '</div>' : '<div class="cf"><b class="fq">' + esc(cardKey(c).q || c.f) + '</b><p class="small fh">นึกคำตอบก่อน แล้วค่อยพลิกดู</p></div>';
const cardBack = c => c.t === 'c' ? '<div class="cf">' + esc(c.b).replace(/\*\*([^*]+)\*\*/g, '<b class="hit">$1</b>') + '</div>' : '<div class="cf"><b class="fq">' + esc(cardKey(c).q || c.f) + '</b><ul class="fa">' + c.b.split(' · ').map(x => '<li>' + esc(x) + '</li>').join('') + '</ul></div>';
async function cardsStart() {
  await loadFigs(S.level); const cards = (await cj(S.level + '/cards.json', true)) || [], o = LS(), now = Date.now();
  const due = cards.filter(c => o.cards[c.id] && o.cards[c.id][1] <= now).sort((a, b) => o.cards[a.id][1] - o.cards[b.id][1]), fresh = shuffle(cards.filter(c => !o.cards[c.id]));
  const list = due.concat(fresh).slice(0, 10); if (!list.length) return toast('ยังไม่มีบัตรที่ถึงเวลาทบทวน');
  CD = { list, i: 0, flip: false, ok: 0, again: {} }; cardShow();
}
function cardShow() {
  const c = CD.list[CD.i], n = CD.list.length;
  page('<div class="examtop"><button class="xbtn" data-a="cardend" aria-label="จบการทบทวน">' + ico('x') + '</button><div class="grow"><b>บัตรคำ</b><div class="prog" style="margin-top:6px"><i style="width:' + Math.round(CD.i * 100 / n) + '%"></i></div></div><span class="small mute">' + (CD.i + 1) + '/' + n + '</span></div>' +
    '<article class="paper fcard s-' + strandOf(c.std) + (CD.flip ? ' back' : '') + '"' + (CD.flip ? '' : ' role="button" tabindex="0" data-a="cardflip"') + ' aria-live="polite"><div class="fhd"><span class="fchip">' + esc(c.std) + (c.ind ? ' · ' + esc(c.ind) : '') + '</span><span class="fside">' + (CD.flip ? 'คำตอบ' : 'คำถาม') + '</span></div><div class="fsub">' + esc(cardKey(c).sub) + '</div>' + (CD.flip ? cardImg(c) : '') + (CD.flip ? cardBack(c) : cardFront(c)) + (CD.flip ? '' : '<div class="ftap">แตะการ์ดเพื่อดูคำตอบ</div>') + '</article>' +
    bar(CD.flip ? '<button class="btn sec" data-a="cardno">ยังไม่แน่ใจ</button><button class="btn" data-a="cardyes">' + ico('check') + 'จำได้</button>' : '<button class="btn" data-a="cardflip">ดูคำตอบ</button>'), null);
}
function cardRate(ok) {
  const c = CD.list[CD.i], o = LS(), box = (o.cards[c.id] || [0])[0], nb = ok ? Math.min(BOXD.length - 1, box + 1) : 0;
  o.cards[c.id] = [nb, Date.now() + (ok ? BOXD[nb] * DAYMS : 10 * 60e3)]; lsave(o);
  if (ok) CD.ok++; else if (!CD.again[c.id]) { CD.again[c.id] = 1; CD.list.push(c); }
  CD.i++; CD.flip = false; logDay('cards');
  if (CD.i >= CD.list.length) return cardDone(); cardShow();
}
function cardDone() {
  page('<section class="glass" style="text-align:center"><h1>ทบทวนครบแล้ว</h1><p class="mute">จำได้ ' + CD.ok + ' จาก ' + CD.list.length + ' ใบ · ใบที่ยังไม่แน่ใจจะกลับมาให้ทบทวนใหม่</p><div class="sp"></div><button class="btn" data-a="nav" data-k="review" data-kind="s">กลับหน้าทบทวน</button></section>', 's', 'review'); CD = null;
}

/* ---------- ค้นหา: สรุปเนื้อหา + โจทย์ ---------- */
let SRCH = null;
async function searchPage(q0) {
  const lv = S.level; page('<div class="examtop"><button class="xbtn" data-a="nav" data-k="review" data-kind="s" aria-label="กลับ">' + ico('back') + '</button><div class="grow"><b>ค้นหา</b></div></div><input id="sq" type="search" placeholder="เช่น แรงเสียดทาน, ห่วงโซ่อาหาร" aria-label="คำค้นหา" autocomplete="off" value="' + esc(q0 || '') + '"><div id="sres" class="sres" aria-live="polite"></div>', 's', 'review');
  SRCH = (await cj(lv + '/search.json', true).catch(() => null)) || []; searchRun();
  const i = $('#sq'); if (i) i.focus();
}
function searchRun() {
  const el = $('#sres'), i = $('#sq'); if (!el || !i) return;
  const tk = i.value.toLowerCase().split(/\s+/).filter(Boolean);
  if (!tk.length) { el.innerHTML = '<p class="mute small">พิมพ์คำที่อยากหา ระบบค้นจากชื่อหัวข้อ เนื้อหาสรุป และโจทย์</p>'; return; }
  const hit = SRCH.filter(r => { const t = (r[3] + ' ' + r[4] + ' ' + r[1] + ' ' + r[2]).toLowerCase(); return tk.every(x => t.indexOf(x) >= 0); });
  const kind = { s: 'หัวข้อในสรุป', t: 'สรุป', q: 'โจทย์' };
  el.innerHTML = hit.length ? '<p class="mute small">พบ ' + hit.length + ' รายการ' + (hit.length > 40 ? ' (แสดง 40 รายการแรก)' : '') + '</p>' + hit.slice(0, 40).map(r => r[0] === 'q'
    ? '<button class="sr s-' + strandOf(r[1]) + '" data-a="qone" data-k="' + esc(r[3]) + '"><span class="chip">' + kind.q + '</span> <b>ปี ' + esc(r[3].split('/')[0]) + ' ข้อ ' + esc(r[3].split('/')[1]) + '</b> <span class="mute small">' + esc(r[1]) + ' · ' + esc(r[2]) + '</span><span class="mute small d">' + esc(r[4]) + '</span></button>'
    : '<button class="sr s-' + strandOf(r[1]) + '" data-a="study" data-std="' + esc(r[1]) + '" data-ind="' + esc(r[2] || '') + '"><span class="chip">' + kind[r[0]] + '</span> <b>' + esc(r[3]) + '</b> <span class="mute small">' + esc(r[1]) + (r[2] ? ' · ' + esc(r[2]) : '') + '</span>' + (r[0] === 't' ? '<span class="mute small d">' + esc(r[4]) + '</span>' : '<span class="mute small d">' + esc(r[4]) + '</span>') + '</button>').join('')
    : '<div class="empty"><p><b>ไม่พบคำว่า "' + esc(i.value) + '"</b></p><p class="mute small">ลองคำที่สั้นลง หรือค้นด้วยคำสำคัญคำเดียว</p></div>';
}
app.addEventListener('input', e => { if (e.target.id === 'sq') { clearTimeout(searchRun.t); searchRun.t = setTimeout(searchRun, 120); } });

/* ---------- ข้อสอบจับเวลา ---------- */
const mockMinutes = () => (S.level === "M3" ? 90 : 60); // เวลาสอบจริงจากหน้าปกข้อสอบ สทศ. ปีการศึกษา 2568: ป.6 13.30–14.30 น. = 60 นาที · ม.3 13.00–14.30 น. = 90 นาที
let TMR = 0;
const mmss = ms => { const s = Math.max(0, Math.ceil(ms / 1000)); return pad2(Math.floor(s / 60)) + ':' + pad2(s % 60); };
function timerStart() {
  clearInterval(TMR); if (!Q || !Q.end) return;
  const tick = () => {
    const el = document.getElementById('tmr'); if (!el || !Q || !Q.end) { clearInterval(TMR); return; }
    const left = Q.end - Date.now(); el.textContent = mmss(left); el.classList.toggle('low', left <= 300000);
    if (left <= 0) { clearInterval(TMR); toast('หมดเวลา — ส่งคำตอบที่ทำไว้ให้อัตโนมัติ'); Q.auto = true; submit(); }
  };
  tick(); TMR = setInterval(tick, 1000);
}
const timerHtml = () => Q && Q.end ? '<span class="tmr" id="tmr" role="timer" aria-label="เวลาที่เหลือ">' + mmss(Q.end - Date.now()) + '</span>' : '';

/* ---------- หลังส่งคำตอบ: จดผลในเครื่อง (ใช้จนกว่าเซิร์ฟเวอร์จะได้ผลนี้) ---------- */
function afterSubmit(att, items) {
  clearInterval(TMR);
  const o = LS(); o.lq.push({ aid: att.attemptId, ts: new Date().toISOString(), items: Q.qs.map((q, i) => ({ q: qidOf(qkey(q)), ok: items[i] ? items[i].ok : 0 })) }); lsave(o);
  logDay('q', items.length); if (Q.mode === 'review') logDay('rev'); IS = null;
}
const SRV = { review: ['practice', 'ทบทวน'], custom: ['practice', 'เลือกเอง'] };

/* ---------- ตั้งค่า (อยู่ในแท็บ ผลของฉัน) ---------- */
function settingsHtml() {
  const s = SET(), o = LS();
  return '<section class="glass" id="settings"><h2>ตั้งค่า</h2>' +
    '<p class="mute small" style="margin:0 0 6px">ขนาดตัวอักษร</p><div class="row seg" role="group" aria-label="ขนาดตัวอักษร">' + [[.9, 'เล็ก'], [1, 'ปกติ'], [1.15, 'ใหญ่'], [1.3, 'ใหญ่มาก']].map(([v, t]) => '<button class="btn sm sec' + (s.fz === v ? ' on' : '') + '" data-a="fz" data-v="' + v + '" aria-pressed="' + (s.fz === v) + '">' + t + '</button>').join('') + '</div>' +
    '<p class="mute small" style="margin:14px 0 6px">โหมดสี</p><div class="row seg" role="group" aria-label="โหมดสี"><button class="btn sm sec' + (!s.light ? ' on' : '') + '" data-a="lite" data-v="0" aria-pressed="' + !s.light + '">โหมดกลางคืน</button><button class="btn sm sec' + (s.light ? ' on' : '') + '" data-a="lite" data-v="1" aria-pressed="' + !!s.light + '">โหมดกลางวัน</button></div>' +
    '<p class="mute small" style="margin:14px 0 6px">ใช้งานโดยไม่มีอินเทอร์เน็ต</p><button class="btn sec" data-a="offline">ดาวน์โหลดเนื้อหาไว้ในเครื่อง</button><p class="mute small" id="offst" style="margin:6px 0 0">' + (o.off ? 'เตรียมไว้แล้วเมื่อ ' + new Date(o.off).toLocaleString('th-TH') : 'ทำครั้งเดียวขณะมีเน็ต แล้วทำข้อสอบได้แม้ออฟไลน์ คะแนนจะส่งเองเมื่อมีเน็ต') + '</p>' +
    '<p class="mute small" style="margin:14px 0 6px">ติดตั้งเป็นแอป</p><button class="btn sec" data-a="install">เพิ่มลงหน้าจอหลัก</button></section>';
}
async function offlinePrep() {
  const st = $('#offst'), set = t => { if (st) st.textContent = t; }, m = await manifest(), lv = S.level;
  const files = Object.keys(m.files).filter(f => f.indexOf(lv + '/') === 0 && !/\/s-\d/.test(f)); let n = 0;
  for (const f of files) { await cj(f, true).catch(() => {}); set('กำลังเตรียมไฟล์ ' + (++n) + '/' + files.length + ' …'); }
  const mt = await cj(lv + '/meta.json'), qs = await questionsFor(mt.mock); let k = 0;
  for (const q of qs) { const src = imgSrc(q.imageUrl); if (src) { await fetch(src).catch(() => {}); } set('กำลังเตรียมภาพข้อสอบ ' + (++k) + '/' + qs.length + ' …'); }
  const o = LS(); o.off = Date.now(); lsave(o); set('เตรียมไว้แล้วเมื่อ ' + new Date(o.off).toLocaleString('th-TH') + ' · ข้อสอบจำลองใช้ออฟไลน์ได้');
}

/* ---------- ปุ่ม ---------- */
Object.assign(ACT, {
  review: () => reviewPage(), search: () => searchPage(), cgo: () => customGo(), nbstart: () => nbStart(),
  cards: () => cardsStart(), cardflip: () => { CD.flip = true; cardShow(); }, cardyes: () => cardRate(true), cardno: () => cardRate(false),
  cardend: () => { CD = null; return reviewPage(); },
  asgstart: d => asgStart(d.id),
  qone: d => quiz('custom', '', '', 0, false, null, [d.k]),
  mockt: () => quiz('mock', '', '', 0, false, null, null, true),
  fz: d => { const s = SET(); s.fz = +d.v; store.set('set', s); applySet(); document.querySelectorAll('[data-a=fz]').forEach(b => { const on = +b.dataset.v === s.fz; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); }); },
  lite: d => { const s = SET(); s.light = d.v === '1'; store.set('set', s); applySet(); document.querySelectorAll('[data-a=lite]').forEach(b => { const on = (b.dataset.v === '1') === s.light; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); }); },
  install: async () => { if (DEFER) { DEFER.prompt(); await DEFER.userChoice.catch(() => {}); DEFER = null; } else toast('เปิดเมนูของเบราว์เซอร์ แล้วเลือก "เพิ่มลงหน้าจอหลัก" (ถ้าเป็น iPhone: ปุ่มแชร์ → เพิ่มลงหน้าจอโฮม)'); },
  offline: () => offlinePrep()
});

/* ---------- เหรียญรางวัลรายมาตรฐาน + สถิติส่วนตัว (ไม่มีกระดานอันดับ) ---------- */
function medalsHtml(pr) {
  const rows = Object.keys(pr.done || {}).sort().map(k => ({ k, d: pr.done[k], n: medalOf(pr.done[k]) }));
  const tot = rows.reduce((a, r) => ({ d: a.d + r.d.done, c: a.c + r.d.correct }), { d: 0, c: 0 });
  return '<section class="glass"><h2>เหรียญของฉัน</h2><p class="mute small">ทองแดง = ถูก 10 ข้อ · เงิน = ถูก 30 ข้อและแม่น ≥ 70% · ทอง = ถูก 60 ข้อและแม่น ≥ 80% (นับเฉพาะของตัวเอง ไม่มีการจัดอันดับ)</p>' +
    (rows.length ? '<div class="medals">' + rows.map(r => '<div class="mdl s-' + strandOf(r.k) + '" title="' + esc(r.k) + '">' + (r.n ? medalSvg(r.n) : '<span class="medal off" aria-hidden="true"></span>') + '<b>' + esc(r.k) + '</b><span class="mute small">' + esc(SHORT[r.k] || '') + '</span><span class="small">' + (r.n ? 'เหรียญ' + MEDAL[r.n] : 'ถูก ' + r.d.correct + ' ข้อ') + '</span></div>').join('') + '</div>' +
      '<p class="mute small" style="margin:10px 0 0">ทำไปทั้งหมด ' + tot.d + ' ข้อ ถูก ' + tot.c + ' ข้อ (' + pct(tot.c, tot.d) + ')</p>' : '<div class="empty"><p><b>ยังไม่มีเหรียญ</b></p><p class="mute small">ฝึกโจทย์ให้ถูก 10 ข้อในมาตรฐานเดียวกันเพื่อรับเหรียญแรก</p></div>') + '</section>';
}
const indPct = (std, ind) => { const x = IS && IS.ind[std + '|' + ind]; return x && x.n ? ' · ทำถูก ' + Math.round(x.c * 100 / x.n) + '% (' + x.c + '/' + x.n + ')' : ''; };
