/* หน้านักเรียน: กรอกรหัสห้อง → เลือกชื่อ → หน้าแรก · ข้อสอบ · สรุป · ผลของฉัน → ทำข้อสอบทีละข้อ → ผลลัพธ์ */
const ACT = {};
const SHORT = { 'ว 1.1': 'ระบบนิเวศ', 'ว 1.2': 'สิ่งมีชีวิตและเซลล์', 'ว 1.3': 'พันธุกรรม', 'ว 2.1': 'สสารและสาร', 'ว 2.2': 'แรงและการเคลื่อนที่', 'ว 2.3': 'พลังงาน', 'ว 3.1': 'เอกภพและอวกาศ', 'ว 3.2': 'ระบบโลก', 'ว 4.1': 'เทคโนโลยีเพื่อชีวิต', 'ว 4.2': 'แนวคิดเชิงคำนวณ' };
const STRAND_NAME = { bio: 'ชีวภาพ', phys: 'กายภาพ', earth: 'โลกและอวกาศ', tech: 'เทคโนโลยี' };
const stdName = x => x.standard + ' ' + (SHORT[x.standard] || '');

/* ---------- กรอกรหัสห้องเรียน → เลือกชื่อ ---------- */
function codeForm() {
  theme();
  page('<section class="glass hero">' + heroArt() + '<div class="tx"><h1>เข้าห้องเรียน</h1><p class="mute">ขอรหัส 6 ตัวอักษรจากครู แล้วกรอกด้านล่าง (เครื่องนี้จะจำรหัสไว้ ไม่ต้องกรอกซ้ำ)</p>' +
    '<form id="cf"><input id="cc" class="code-in" name="code" maxlength="6" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="K7M2XQ" required aria-label="รหัสห้องเรียน"><div class="sp"></div><button class="btn">เข้าห้องเรียน</button></form></div></section>' +
    '<div class="row"><button class="btn sec" data-a="res">ผังข้อสอบ สทศ.</button><button class="btn sec" data-a="admin">สำหรับครู</button></div>', null);
  $('#cf').onsubmit = e => { e.preventDefault(); run(async () => {
    const code = $('#cc').value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const r = await api('enter', { code });
    S.code = code; S.school = r.school; S.room = r.room; S.level = r.level; S.student = null; ROSTER = r.students; PR = null; save(); await home();
  }, 'form:cf'); };
}
let ROSTER = null; // รายชื่อห้อง (ได้มากับ enter) เก็บไว้ในหน้านี้ ไม่ต้องถามซ้ำ
async function home() {
  if (!API_URL) { page('<div class="note">ยังไม่ได้เชื่อมต่อฐานข้อมูล: ใส่ URL ของ Apps Script ในตัวแปร <b>API_URL</b> ที่ไฟล์ index.html (ดู README)</div>', null); return; }
  if (!S.code) { S.level = S.level || 'P6'; return codeForm(); }
  if (!ROSTER) { loading(); const r = await api('enter', { code: S.code }); S.school = r.school; S.level = r.level; S.room = r.room; ROSTER = r.students; save(); }
  theme();
  cj(S.level + '/meta.json').catch(() => {}); // เตรียมผังข้อสอบของระดับนี้ไว้ล่วงหน้า
  page('<section class="glass"><h1>เลือกชื่อของนักเรียน</h1><p class="mute">' + esc(S.school || '') + ' · ' + LV[S.level] + ' · ห้อง ' + esc(S.room || '') + '</p><div class="sp"></div>' +
    (ROSTER.length ? '<div class="pickgrid">' + ROSTER.map(s => '<button data-a="pick" data-id="' + esc(s.id) + '" data-name="' + esc(s.name) + '"><span class="av">' + esc(s.no) + '</span><span>' + esc(s.no) + '. ' + esc(s.name) + '</span></button>').join('') + '</div>' : '<p class="mute">ห้องนี้ยังไม่มีรายชื่อนักเรียน ให้ครูเพิ่มในเมนูแอดมิน</p>') + '</section>' +
    '<div class="row"><button class="btn sec" data-a="room">เปลี่ยนห้อง (ใส่รหัสใหม่)</button><button class="btn ghost" data-a="res">ผังข้อสอบ สทศ.</button></div>', null);
}

/* ---------- หน้าแรก ---------- */
const resumeCard = () => {
  const e = loadExam(); if (!e) return '';
  const done = Object.values(e.ans || {}).filter(v => v && String(v).replace(/,/g, '')).length;
  const t = modeText(e.mode, e.std, e.ind);
  return '<section class="glass" style="border-color:var(--acc-line)"><h2>มีข้อสอบที่ทำค้างไว้</h2><p class="mute">' + esc(t) + ' · ตอบแล้ว ' + done + ' จาก ' + e.keys.length + ' ข้อ (คำตอบถูกเก็บไว้ในเครื่องนี้)</p><div class="row"><button class="btn" data-a="resume">ทำต่อ</button><button class="btn sec" data-a="dropexam">ทิ้งชุดนี้</button></div></section>';
};
/* ---------- แท็บ ข้อสอบ ---------- */
async function examsPage() {
  loading();
  const lv = S.level, m = await cj(lv + '/meta.json'), years = Object.keys(m.bankYears).sort().reverse(), bank = m.standards.reduce((n, x) => n + x.bank, 0);
  page('<h1 style="margin:4px 2px 12px">ข้อสอบ</h1>' + resumeCard() +
    '<section class="glass"><h2>ข้อสอบจำลองตาม Test Blueprint</h2><p class="mute">เลือกข้อตามจำนวนของแต่ละมาตรฐานในผังข้อสอบ ปีการศึกษา ' + esc(m.year) + ' · ' + m.mock.length + ' ข้อ</p><div class="row"><button class="btn" data-a="mockt"' + (bank ? '' : ' disabled') + '>เริ่มแบบจับเวลา (' + mockMinutes(m.mock.length) + ' นาที)</button><button class="btn sec" data-a="mock"' + (bank ? '' : ' disabled') + '>เริ่มแบบไม่จับเวลา</button></div></section>' +
    (years.length ? '<h2 style="margin:8px 2px 10px">ข้อสอบจริงรายปี</h2><div class="yeargrid">' + years.map(y => '<button class="yearbtn" data-a="year" data-y="' + esc(y) + '"><b>ปีการศึกษา ' + esc(y) + '</b><span>' + m.bankYears[y] + ' ข้อ · ทำทั้งฉบับ</span></button>').join('') + '</div>' : '') +
    '<p class="mute small" style="margin-top:14px">อยากฝึกเป็นรายมาตรฐาน/ตัวชี้วัด ไปที่แท็บ "สรุป"</p>', 's', 'exams');
}

/* ---------- แท็บ สรุป: มาตรฐานทั้งหมด → สรุป + ฝึก ---------- */
async function learnPage() {
  loading();
  const my = VIEW, lv = S.level, m = await cj(lv + '/meta.json');
  const paint = pr => page('<h1 style="margin:4px 2px 4px">สรุปเนื้อหา + ฝึก</h1><p class="mute small" style="margin:0 2px 12px">ตาม Test Blueprint ปีการศึกษา ' + esc(m.year) + ' · ตัวเลข % คือที่ทำถูกของเธอ</p>' +
    m.standards.map(x => {
      const k = strandOf(x.standard), d = (pr && pr.done[x.standard]) || { done: 0, correct: 0 }, p = d.done ? Math.round(d.correct * 100 / d.done) : 0;
      return '<button class="std s-' + k + '" data-a="study" data-std="' + esc(x.standard) + '"><span class="pl">' + ico(k) + '</span><span class="tx"><b>' + esc(stdName(x)) + '</b><span class="mute small">' + STRAND_NAME[k] + ' · ในคลัง ' + x.bank + ' ข้อ · ออกสอบ ' + (x.items || '–') + ' ข้อ</span><div class="prog"><i style="width:' + p + '%"></i></div></span><span class="pc">' + medalSvg(medalOf(d)) + (d.done ? p + '%' : '–') + '</span></button>' +
        (x.ind.length ? '<details class="ind s-' + k + '"><summary>ตัวชี้วัด ' + x.ind.length + ' ข้อ</summary>' + x.ind.map(i => '<div class="it"><div class="tx"><b>' + esc(i.indicator) + '</b>' + (i.offPlan ? ' <span class="chip" style="min-height:22px;background:var(--badbg);color:var(--badp)">ไม่อยู่ในผัง ' + esc(i.offPlan) + '</span>' : '') + ' <span class="mute">' + esc(i.description) + '</span><br><span class="mute small">ในคลัง ' + i.bank + ' ข้อ · ออกสอบ ' + (i.items || '–') + ' ข้อ' + indPct(x.standard, i.indicator) + '</span></div><button class="btn sm sec" data-a="study" data-std="' + esc(x.standard) + '" data-ind="' + esc(i.indicator) + '">สรุป + ฝึก</button></div>').join('') + '</details>' : '');
    }).join(''), 's', 'learn');
  paint(null);
  getStats().then(s => { if (VIEW === my) paint(s.pr); }).catch(() => {});
}

/* ---------- แท็บ ผลของฉัน ---------- */
async function minePage() {
  loading();
  const my = VIEW, last = store.get('onet_last');
  const paint = pr => page('<h1 style="margin:4px 2px 12px">ผลของฉัน</h1>' +
    (last && last.studentId === S.student.id ? '<section class="glass"><h2>ผลล่าสุด</h2><p class="mute">' + modeText(last.mode, last.std, last.ind) + ' · ' + esc(new Date(last.ts).toLocaleString('th-TH')) + '</p><button class="btn" data-a="showlast">ดูผลและเฉลยอีกครั้ง</button></section>' : '') +
    '<section class="paper"><h2>ประวัติล่าสุด</h2>' + (pr ? (pr.history.length ? pr.history.map(h => '<div class="hrow"><div><b>' + (h.mode === 'mock' ? 'ข้อสอบจำลอง' : h.mode === 'year' ? 'ข้อสอบปีการศึกษา ' + esc(h.standard) : h.standard === 'ทบทวน' ? 'ทบทวนสมุดข้อผิด' : h.standard === 'เลือกเอง' ? 'ฝึกเลือกเอง' : /^asg:/.test(h.mode) ? 'งานที่ครูมอบหมาย' : 'ฝึก ' + esc(h.standard)) + '</b><span class="when">' + esc(new Date(h.ts).toLocaleString('th-TH')) + '</span></div><div class="sc">' + (h.maxScore && h.mode !== 'year' ? esc(h.score) + '/' + esc(h.maxScore) + ' คะแนน' : h.maxScore ? pct(h.score, h.maxScore) + '<br><span class="when">' + esc(h.correct) + '/' + esc(h.total) + ' ข้อ</span>' : esc(h.correct) + '/' + esc(h.total) + ' ข้อ') + '</div></div>').join('') : '<div class="empty"><p><b>ยังไม่เคยทำข้อสอบ</b></p><p class="mute small">ลองเริ่มจากข้อสอบจำลองดูนะ</p></div>') : '<p class="mute">กำลังโหลดประวัติ…</p>') + '</section>' + (pr ? medalsHtml(pr) : '') + settingsHtml(), 's', 'mine');
  paint(PR);
  if (!PR) loadProgress().then(pr => { if (VIEW === my) paint(pr); }).catch(() => {});
}
const modeText = (mode, std, ind) => mode === 'mock' ? 'ข้อสอบจำลอง' : mode === 'review' ? 'ทบทวนสมุดข้อผิด' : mode === 'custom' ? 'ฝึกเลือกเอง' + (std ? ' · ' + esc(std) + (ind ? ' ' + esc(ind) : '') : '') : mode === 'year' ? 'ข้อสอบปีการศึกษา ' + esc(std) : 'ฝึก ' + esc(std) + (ind ? ' · ' + esc(ind) : '');

/* ---------- สรุปเนื้อหาก่อนฝึก ---------- */
async function study(std, ind, hl) {
  loading(); logDay('read');
  const m = await cj(S.level + '/meta.json'), sf = await cj(S.level + '/sum-' + std.replace(/^ว\s*/, '').trim() + '.json', true);
  const si = m.standards.find(x => x.standard === std), offOf = k => ((si && si.ind.find(i => i.indicator === k)) || {}).offPlan || '';
  let bank = 0;
  const asked = Object.keys((m.asked || {})[std] || {}).filter(k => !ind || k === ind).sort().map(k => {
    const ys = m.asked[std][k]; Object.keys(ys).forEach(y => { bank += ys[y]; });
    return { indicator: k, offPlan: offOf(k), years: Object.keys(ys).sort().reverse().map(y => ({ y, n: ys[y] })) };
  });
  const cnt = k => Object.values(((m.asked || {})[std] || {})[k] || {}).reduce((a, b) => a + b, 0);
  const r = { notes: (sf || []).filter(x => x.content && (!ind ? true : (x.indicator ? x.indicator === ind : false))), bank, asked };
  await loadFigs(S.level);
  const acts = '<div class="row col noprint">' + (r.bank ? '<button class="btn" data-a="prac" data-std="' + esc(std) + '" data-ind="' + esc(ind) + '">' + ico('play') + 'เริ่มฝึกข้อสอบ ' + r.bank + ' ข้อ</button>' : '') + '<button class="btn sec" data-a="pdf">' + ico('print') + 'ดาวน์โหลดสรุป PDF</button></div>';
  page('<div class="examtop"><button class="xbtn" data-a="nav" data-k="learn" data-kind="s" aria-label="กลับ">' + ico('back') + '</button><div class="grow"><b>สรุปเนื้อหา ' + esc(std) + (ind ? ' · ' + esc(ind) : '') + '</b><span class="mute small">' + esc(SHORT[std] || '') + ' · ' + LV[S.level] + '</span></div></div>' + acts + '<div class="sp"></div>' +
    '<article class="paper sum s-' + strandOf(std) + '"><h2>สรุปเนื้อหา ' + esc(std) + (ind ? ' · ' + esc(ind) : '') + ' <span class="tag">' + LV[S.level] + '</span></h2>' +
    (r.notes.length ? (ind ? '' : mindMap(std, SHORT[std] || '', r.notes, cnt)) + r.notes.map((n, i) => { const p = titleParts(n.title), c = n.indicator ? cnt(n.indicator) : 0; const head = '<h3 class="th">' + (n.indicator ? '<span class="tag">' + esc(n.indicator) + '</span>' : '') + esc(p.name) + '</h3>', meta = n.indicator ? '<p class="tmeta">' + (c ? '<span class="chip y">ออกสอบจริง ' + c + ' ข้อ</span>' : '<span class="chip never">ยังไม่เคยออก</span>') + '</p>' : '', body = '<div class="rich">' + rich(n.content, { pre: 's' + i, exams: n.x }) + '</div>';
      // หัวข้อที่ยังไม่เคยออก (กลุ่ม ค) พับไว้บนเว็บ · ตอนพิมพ์ PDF เปิดครบ (prepPrintPage)
      if (n.indicator && !c && !ind) return '<section class="topic" id="s' + i + '"><details class="fold"><summary>' + head + meta + '<span class="fold-hint noprint">แตะเพื่ออ่าน</span></summary>' + body + '</details></section>';
      return '<section class="topic' + (n.indicator ? '' : ' sheet1') + '" id="s' + i + '">' + head + meta + body + '</section>'; }).join('') : '<p class="mute">ยังไม่มีสรุปของหัวข้อนี้</p>') +
    '<h3>ข้อสอบจริงที่เคยออกในหัวข้อนี้</h3>' +
    (r.asked.length ? '<div class="scroll"><table><tr><th>ตัวชี้วัด</th><th>ปีการศึกษาที่ออก (จำนวนข้อ)</th></tr>' + r.asked.map(a => '<tr><td>' + esc(a.indicator) + (a.offPlan ? ' <span class="tag off">ไม่อยู่ในผัง ' + esc(a.offPlan) + '</span>' : '') + '</td><td>' + a.years.map(y => esc(y.y) + ' (' + y.n + ')').join(' · ') + '</td></tr>').join('') + '</table></div>' : '<p class="mute">ยังไม่มีข้อสอบจริงในหัวข้อนี้</p>') +
    '</article>' + acts, 's', 'learn');
  fitFigures(app);
  window.scrollTo(0, 0);
  if (hl) { const h = [...app.querySelectorAll('h3')].find(x => x.textContent.includes(hl)); if (h) { h.scrollIntoView(); h.style.background = '#fef9c3'; } }
}

/* ---------- ทำข้อสอบ ---------- */
// __ข้อความ__ = ขีดเส้นใต้ตามต้นฉบับ
const fmt = s => esc(s).replace(/__(.+?)__/g, '<u>$1</u>');
const plain = s => String(s == null ? '' : s).replace(/__/g, '');
// ลิงก์รูป: https://… ใช้ตามนั้น · ชื่อไฟล์ (เช่น P6-2568-07.webp) แสดงจากโฟลเดอร์ images/ ของเว็บ
const imgSrc = u => { u = String(u || '').trim(); return /^https:\/\//.test(u) ? u : /^[\w.-]+\.(png|jpe?g|gif|webp|svg)$/i.test(u) ? (typeof IMG_BASE !== 'undefined' ? IMG_BASE : 'images/') + u : ''; };
// ข้อความย่อยที่เป็นชื่อไฟล์ภาพล้วน (เช่น M3-2567-34-1.webp) แสดงเป็นภาพที่แคปจากต้นฉบับ
const cell = c => /^[\w.-]+\.(png|jpe?g|gif|webp)$/i.test(String(c).trim()) ? '<img class="subimg" src="' + esc(imgSrc(c)) + '" alt="ข้อย่อย" loading="lazy" decoding="async">' : fmt(c);
const sub = (q, i, k) => (q.itemNo || i + 1) + '.' + (k + 1);
const parts = v => String(v || '').split(',');
const nYN = ['ใช่', 'ไม่ใช่'];
const answered = (q, v) => q.type === 'complex' || q.type === 'order' ? parts(v).every(Boolean) : !!v;
// หัวข้อ + โจทย์ + ภาพ (ภาพข้อสอบเป็นพื้นขาว อยู่บนการ์ดกระดาษสว่างเสมอ) · lazy = ภาพนอกจอแรก
function qHead(q, i, lazy, num) {
  const src = imgSrc(q.imageUrl), k = strandOf(q.standard);
  return '<div class="tags"><span class="tag y">O-NET ปีการศึกษา ' + esc(q.examYear) + (q.itemNo ? ' ข้อ ' + esc(q.itemNo) : '') + '</span><span class="tag" style="background:var(--pc);color:var(--pi)">' + esc(q.standard) + (q.indicator ? ' · ' + esc(q.indicator) : '') + '</span>' +
    (q.offPlan ? '<span class="tag off">ไม่อยู่ในผัง ' + esc(q.offPlan) + '</span>' : '') + (q.outCurr ? '<span class="tag out">นอกหลักสูตรปัจจุบัน</span>' : '') + '</div><div class="stem"><b>' + (num || i + 1) + '.</b> ' + fmt(q.stem) + '</div>' +
    (src ? '<img class="qimg" src="' + esc(src) + '" alt="ภาพประกอบข้อ ' + (i + 1) + '"' + (lazy ? ' loading="lazy" decoding="async"' : '') + '>' : '');
}
// ช่องตอบของข้อที่กำลังทำ (ทีละข้อ) — ชื่อ input: a (ปรนัย/เติมคำ) · a__k (ข้อเชิงซ้อน/เรียงลำดับ ข้อย่อยที่ k)
function qInput(q, i) {
  const opt = (name, v, label, cls) => '<label class="opt ' + (cls || '') + '"><input type="radio" name="' + name + '" value="' + esc(v) + '"><span class="n">' + esc(v === 'ใช่' || v === 'ไม่ใช่' ? (v === 'ใช่' ? '✓' : '✗') : v) + '</span><span>' + label + '</span></label>';
  if (q.type === 'complex') return q.choices.map((c, k) => '<div class="cxrow"><div class="small pmute">' + sub(q, i, k) + '</div><div>' + cell(c) + '</div><div class="yn">' + nYN.map(v => '<label class="opt"><input type="radio" name="a__' + k + '" value="' + v + '"><span>' + v + '</span></label>').join('') + '</div></div>').join('');
  if (q.type === 'order') return Array.from({ length: q.slots }, (_, k) => '<div class="ordrow"><b>' + sub(q, i, k) + '</b><select name="a__' + k + '" aria-label="ลำดับ ' + sub(q, i, k) + '"><option value="">— เลือก —</option>' + q.choices.map((c, j) => '<option value="' + (j + 1) + '">' + (j + 1) + ' ' + esc(plain(c)) + '</option>').join('') + '</select></div>').join('');
  if (q.type === 'fill') return '<input name="a" type="text" placeholder="พิมพ์คำตอบ" autocomplete="off" aria-label="คำตอบ">';
  if (!q.choices.length) return '<div class="small pmute" style="margin-top:6px">เลือกคำตอบ (ตัวเลือกอยู่ในภาพ)</div><div class="pick4">' + [1, 2, 3, 4].map(v => '<label class="opt"><input type="radio" name="a" value="' + v + '"><span>' + v + '</span></label>').join('') + '</div>';
  return q.choices.map((c, j) => opt('a', String(j + 1), fmt(c))).join('');
}
// คำตอบที่ตอบไว้ → ใส่กลับในช่อง
function fillInputs(q, v) {
  const card = $('#qcard'); if (!card || !v) return;
  if (q.type === 'complex' || q.type === 'order') parts(v).forEach((x, k) => { if (!x) return; const r = card.querySelector('[name="a__' + k + '"][value="' + x + '"]'); if (r) r.checked = true; const s = card.querySelector('select[name="a__' + k + '"]'); if (s) s.value = x; });
  else if (q.type === 'fill') { const i = card.querySelector('input[name="a"]'); if (i) i.value = v; }
  else { const r = card.querySelector('input[name="a"][value="' + v + '"]'); if (r) r.checked = true; }
  card.querySelectorAll('.opt').forEach(o => o.classList.toggle('on', !!o.querySelector('input:checked')));
}
function readAnswer(q) {
  const card = $('#qcard'); if (!card) return '';
  if (q.type === 'complex') return q.choices.map((_, k) => { const r = card.querySelector('[name="a__' + k + '"]:checked'); return r ? r.value : ''; }).join(',');
  if (q.type === 'order') return Array.from({ length: q.slots }, (_, k) => card.querySelector('select[name="a__' + k + '"]').value || '').join(',');
  if (q.type === 'fill') return card.querySelector('input[name="a"]').value.trim();
  const r = card.querySelector('input[name="a"]:checked'); return r ? r.value : '';
}
const ansDone = () => Q.qs.filter(q => answered(q, Q.ans[q.id])).length;
function saveExam() {
  if (!Q || Q.secure && false) return;
  const ans = {}, flags = {}; Q.qs.forEach(q => { if (Q.ans[q.id]) ans[qkey(q)] = Q.ans[q.id]; if (Q.flags[q.id]) flags[qkey(q)] = 1; });
  store.set(EXK, { code: S.code, studentId: S.student.id, level: S.level, mode: Q.mode, std: Q.std || '', ind: Q.ind || '', skip: Q.skip || 0, secure: !!Q.secure, keys: Q.qs.map(qkey), ans, flags, idx: Q.idx, end: Q.end || 0, ts: Date.now() });
}
async function quiz(mode, std, ind, skip, secure, resume, keys, timed) {
  loading('กำลังเตรียมข้อสอบ…');
  const lv = S.level, m = await cj(lv + '/meta.json');
  let qs;
  if (resume) qs = await questionsFor(resume.keys);
  else if (keys) qs = await questionsFor(keys);
  else qs = mode === 'year' ? (await cj(lv + '/q-' + std + '.json')).slice()
    : await questionsFor(mode === 'mock' ? m.mock : (m.pool[ind ? std + '|' + ind : std] || []).slice(skip || 0, (skip || 0) + 20));
  if (!qs.length) { toast(skip ? 'ทำครบทุกข้อในหัวข้อนี้แล้ว' : 'ยังไม่มีข้อสอบในหัวข้อนี้'); return dash(); }
  Q = { mode, std, ind, skip: skip || 0, qs, secure: !!secure, idx: 0, ans: {}, flags: {}, sols: null, end: timed ? Date.now() + mockMinutes(qs.length) * 60000 : 0 }; // secure = โหมดสอบของครู (ดู README: ไม่โหลดไฟล์เฉลยลงเครื่องนักเรียน ให้ Apps Script ตรวจและตอบเฉพาะถูก/ผิด)
  if (resume) { qs.forEach(q => { const k = qkey(q); if (resume.ans[k]) Q.ans[q.id] = resume.ans[k]; if (resume.flags[k]) Q.flags[q.id] = 1; }); Q.idx = Math.min(resume.idx || 0, qs.length - 1); Q.end = resume.end || 0; }
  if (!secure) yearsOf(qs).forEach(y => { cj(lv + '/k-' + y + '.json').catch(() => {}); if (mode === 'year') cj(lv + '/s-' + y + '.json', true).catch(() => {}); }); // เตรียมเฉลยไว้ตรวจทันที
  saveExam();
  if (Q.end && Q.end <= Date.now()) { toast('หมดเวลาแล้ว ระบบส่งคำตอบที่ทำไว้ให้'); Q.auto = true; return submit(); }
  showQ();
}
function examTitle() { return modeText(Q.mode, Q.std, Q.ind); }
function showQ() {
  const q = Q.qs[Q.idx], n = Q.qs.length, i = Q.idx, last = i === n - 1;
  page('<div class="examtop"><button class="xbtn" data-a="leave" aria-label="ออกจากข้อสอบ (คำตอบถูกเก็บไว้)">' + ico('x') + '</button><div class="grow"><b>' + esc(examTitle()) + '</b><div class="prog" style="margin-top:6px"><i id="pbar" style="width:' + Math.round(ansDone() * 100 / n) + '%"></i></div></div><span class="small mute" id="pcount">ข้อ ' + (i + 1) + '/' + n + '</span>' + timerHtml() + '</div>' +
    '<article class="paper q s-' + strandOf(q.standard) + '" id="qcard" data-i="' + i + '">' + qHead(q, i) + '<div class="sp"></div>' + qInput(q, i) + '<div class="sp"></div>' +
    '<button type="button" class="flagbtn' + (Q.flags[q.id] ? ' on' : '') + '" data-a="flag" id="flagb" aria-pressed="' + !!Q.flags[q.id] + '">' + ico('flag') + (Q.flags[q.id] ? ' ปักธงไว้แล้ว (ไม่แน่ใจ)' : ' ปักธงข้อที่ไม่แน่ใจ') + '</button></article>' +
    bar('<button class="btn sec gridbtn" data-a="sheet" aria-label="แผงเลขข้อ">' + ico('grid') + '</button><button class="btn sec" data-a="qprev"' + (i ? '' : ' disabled') + '>ก่อนหน้า</button><button class="btn" data-a="' + (last ? 'submit' : 'qnext') + '">' + (last ? ico('check') + 'ตรวจคำตอบ' : 'ถัดไป') + '</button>'), null);
  fillInputs(q, Q.ans[q.id]); timerStart();
  window.scrollTo(0, 0);
  const nx = Q.qs[i + 1]; if (nx && imgSrc(nx.imageUrl)) { const im = new Image(); im.src = imgSrc(nx.imageUrl); } // โหลดภาพข้อถัดไปรอไว้
}
function updateProgress() {
  const n = Q.qs.length; const b = $('#pbar'); if (b) b.style.width = Math.round(ansDone() * 100 / n) + '%';
}
function goQ(i) { Q.idx = Math.max(0, Math.min(Q.qs.length - 1, i)); closeSheet(); saveExam(); showQ(); }
function openSheet() {
  const n = Q.qs.length, left = n - ansDone(), fl = Q.qs.filter(q => Q.flags[q.id]).length;
  $('#sheet').innerHTML = '<div class="bg" data-a="closesheet"></div><div class="box" role="dialog" aria-label="แผงเลขข้อ"><div class="row" style="flex-wrap:nowrap"><h2 style="flex:1">แผงเลขข้อ</h2><button class="btn ghost" data-a="closesheet">ปิด</button></div>' +
    '<p class="mute small">ตอบแล้ว ' + ansDone() + ' จาก ' + n + ' ข้อ' + (fl ? ' · ปักธง ' + fl + ' ข้อ' : '') + '</p>' +
    '<div class="nums">' + Q.qs.map((q, i) => '<button data-a="qgo" data-i="' + i + '" class="' + (answered(q, Q.ans[q.id]) ? 'done ' : '') + (Q.flags[q.id] ? 'flag ' : '') + (i === Q.idx ? 'cur' : '') + '" aria-label="ข้อ ' + (i + 1) + (answered(q, Q.ans[q.id]) ? ' ตอบแล้ว' : ' ยังไม่ตอบ') + (Q.flags[q.id] ? ' ปักธง' : '') + '">' + (i + 1) + '</button>').join('') + '</div>' +
    '<div class="legend"><span><i style="background:var(--acc);border-color:var(--acc)"></i>ตอบแล้ว</span><span><i></i>ยังไม่ตอบ</span><span>⚑ ปักธง</span></div><div class="sp"></div>' +
    '<button class="btn" data-a="submit">' + ico('check') + 'ตรวจคำตอบ' + (left ? ' (ยังไม่ตอบ ' + left + ' ข้อ)' : '') + '</button><div class="sp"></div><button class="btn sec" data-a="pdfexam">' + ico('print') + 'ดาวน์โหลดข้อสอบ PDF</button></div>';
  $('#sheet').classList.add('on');
}
const closeSheet = () => { $('#sheet').classList.remove('on'); };

/* ---------- ตรวจคำตอบ → ผลลัพธ์ ---------- */
function showAns(q, v) {
  if (!v) return '–';
  if (q.type === 'order') return parts(v).map(x => x ? esc(x) + (q.choices[x - 1] ? ' ' + fmt(q.choices[x - 1]) : '') : '–').join(' → ');
  if (q.type === 'mc') return String(v).split('|').map(n => q.choices[n - 1] ? esc(n) + ') ' + fmt(q.choices[n - 1]) : 'ข้อ ' + esc(n)).join(' <i>หรือ</i> ');
  return esc(v);
}
function review(q, i, x) {
  if (x.hidden) return ''; // โหมดสอบของครู: ไม่มีเฉลยในเครื่องนักเรียน
  if (q.type === 'complex') {
    const y = parts(x.yours), a = parts(x.answer);
    return '<div class="scroll"><table class="cx"><tr><th>ข้อ</th><th>ข้อความ</th><th>ตอบ</th><th>เฉลย</th><th></th></tr>' + q.choices.map((c, k) =>
      '<tr><td>' + sub(q, i, k) + '</td><td>' + cell(c) + '</td><td>' + esc(y[k] || '–') + '</td><td><b>' + esc(String(a[k]).split('|').join(' หรือ ')) + '</b></td><td class="' + (String(a[k]).split('|').includes(y[k]) ? 'ok">✓' : 'bad">✗') + '</td></tr>').join('') + '</table></div>';
  }
  return x.ok ? '' : '<div class="cmp you">ตอบ: ' + showAns(q, x.yours) + '</div><div class="cmp key">เฉลย: <b>' + showAns(q, x.answer) + '</b></div>';
}
const solBlock = (s, i) => s ? '<p class="row noprint" style="margin:8px 0"><button type="button" class="btn sm sec" data-a="sol" data-k="' + i + '">ดูเฉลยละเอียด</button></p><div class="sol" id="sol-' + i + '"><h3 class="solh">เฉลยละเอียด · ' + esc(s.title) + '</h3><div class="rich">' + rich(s.content) + '</div></div>' : '';
function trySubmit() {
  const left = Q.qs.length - ansDone(), fl = Q.qs.filter(q => Q.flags[q.id]).length;
  if (!Q.auto && (left || fl) && !confirm((left ? 'ยังตอบไม่ครบ ' + left + ' ข้อ (ข้อเชิงซ้อน/เรียงลำดับต้องตอบทุกข้อย่อย)' : '') + (left && fl ? ' และ ' : '') + (fl ? 'มีข้อที่ปักธงไว้ ' + fl + ' ข้อ' : '') + ' ส่งคำตอบเลยหรือไม่?')) return false;
  return true;
}
async function submit() {
  if (!trySubmit()) return;
  closeSheet();
  loading('กำลังตรวจคำตอบ…');
  const lv = S.level, years = yearsOf(Q.qs), answers = {}; Q.qs.forEach(q => { answers[q.id] = Q.ans[q.id] || ''; });
  const att = { attemptId: uuid(), code: S.code, studentId: S.student.id, mode: (SRV[Q.mode] || [Q.mode])[0], standard: SRV[Q.mode] ? SRV[Q.mode][1] : Q.std || '', keys: Q.qs.map(qkey), answers: {}, rev: {} };
  Q.qs.forEach(q => { att.answers[qkey(q)] = answers[q.id]; });
  years.forEach(y => { att.rev[y] = revOf(lv + '/k-' + y + '.json'); });
  let items, r;
  if (Q.secure) {
    // โหมดสอบของครู: เฉลยไม่ถูกส่งมาเครื่องนี้ ให้ Apps Script ตรวจและบันทึกในคำขอเดียว ได้กลับมาเฉพาะถูก/ผิดและคะแนน
    const sr = await api('submitAttempt', Object.assign({}, att, { secure: true })), mm = {};
    (sr.items || []).forEach(i => { mm[i.k] = i; });
    items = Q.qs.map(q => { const i = mm[qkey(q)] || {}; return { id: q.id, type: q.type, yours: normAns(q.type, answers[q.id]), ok: i.ok || 0, answer: '', explanation: '', hidden: true, s: q.standard, points: i.points || q.points, earned: i.earned || 0 }; });
    r = { total: sr.total, correct: sr.correct, score: sr.score, maxScore: sr.maxScore };
  } else {
    const kf = {};
    await Promise.all(years.map(async y => { kf[y] = await cj(lv + '/k-' + y + '.json'); }));
    // ตรวจคำตอบในเครื่อง (กติกาเดียวกับ Apps Script: grade.js) เห็นผลทันที
    items = gradeLocal(Q.qs, answers, kf, lv);
    const sum0 = f => Math.round(items.reduce((n, i) => n + i[f], 0) * 100) / 100;
    r = { total: items.length, correct: sum0('ok'), score: sum0('earned'), maxScore: sum0('points') };
    att.chk = { score: r.score, correct: r.correct };
  }
  clearExam();
  store.set('onet_last', { studentId: S.student.id, code: S.code, level: lv, mode: Q.mode, std: Q.std || '', ind: Q.ind || '', keys: att.keys, answers: att.answers, flags: Object.keys(Q.flags).filter(k => Q.flags[k]).map(k => k), ts: Date.now() });
  renderResult(Q.qs, items, r, att, Q.mode, Q.std, Q.ind, Q.secure, Q.flags);
  if (!Q.secure) { afterSubmit(att, items); enqueue(att); } // บันทึกคะแนนเบื้องหลัง (Apps Script ตรวจซ้ำก่อนบันทึก)
}
function gradeLocal(qs, answers, kf, lv) {
  return qs.map(q => {
    const e = kf[q.examYear][q.itemNo] || {}, t = e.t || q.type, a = normAns(t, answers[q.id]), key = normAns(t, e.a), pts = points(lv, t), ok = isRight(t, a, key) ? 1 : 0;
    return { id: q.id, type: t, yours: a, ok, answer: key, explanation: e.e || '', s: q.standard, points: pts, earned: earnedOf(lv, q.examYear, t, a, key, pts) };
  });
}
function renderResult(qs, items, r, att, mode, std, ind, secure, flags) {
  const my = VIEW, lv = S.level, by = {}; items.forEach(i => { by[i.id] = i; });
  const p = r.maxScore ? Math.round(r.score * 100 / r.maxScore) : 0, years = yearsOf(qs);
  page('<section class="glass"><div class="resultbox"><div class="ring" style="--p:' + p + '"><b>' + p + '%</b></div><div><h2>' + (mode === 'year' ? 'ได้ ' + pct(r.score, r.maxScore) : 'ได้ ' + r.score + ' / ' + r.maxScore + ' คะแนน (' + pct(r.score, r.maxScore) + ')') + ' <span class="mute">ถูก ' + r.correct + ' จาก ' + r.total + ' ข้อ</span></h2>' +
    '<div class="mute small">' + modeText(mode, std, ind) + '</div>' + (att ? '<div class="mute small" id="savestat" data-id="' + att.attemptId + '">' + (secure ? 'บันทึกคะแนนแล้ว ✓' : 'กำลังบันทึกคะแนน…') + '</div>' : '') + '</div></div>' +
    '<p class="mute small" style="margin:10px 0 0">ข้อเชิงซ้อนให้คะแนนบางส่วนตามเกณฑ์ในคำชี้แจงของข้อสอบแต่ละฉบับ · ข้อเรียงลำดับได้คะแนนเมื่อถูกทุกลำดับ</p></section>' +
    '<div class="row noprint" style="margin-bottom:12px"><button class="btn sec sm" data-a="onlywrong" aria-pressed="false">แสดงเฉพาะข้อที่ยังไม่ถูก</button></div><div id="rlist">' +
    qs.map((q, i) => { const x = by[q.id] || {}, cls = x.ok ? 'ok-item' : x.earned > 0 ? 'part-item' : 'bad-item';
      return '<article class="paper qres ' + cls + ' s-' + strandOf(q.standard) + '">' + qHead(q, i, i > 1) + '<div class="stat ' + (x.ok ? 'ok' : x.earned > 0 ? 'part' : 'bad') + '">' + (x.ok ? '✓ ถูก' : x.earned > 0 ? '◐ ถูกบางส่วน' : '✗ ' + (x.yours ? 'ผิด' : 'ไม่ได้ตอบ')) + (mode === 'year' ? '' : ' <span class="pmute">(' + (x.earned || 0) + '/' + (x.points || 0) + ' คะแนน)</span>') + (flags && flags[q.id] ? ' <span class="pmute">· ⚑ ปักธงไว้</span>' : '') + '</div>' +
        review(q, i, x) + (x.explanation ? '<div class="pmute small">' + fmt(x.explanation) + '</div>' : '') + '<div id="slot-' + i + '"></div></article>'; }).join('') + '</div>' +
    '<div class="row noprint">' + (mode === 'practice' ? '<button class="btn" data-a="next">ชุดถัดไป</button>' : mode === 'review' || mode === 'custom' ? '<button class="btn" data-a="nav" data-k="review" data-kind="s">กลับหน้าทบทวน</button>' : '') + '<button class="btn sec" data-a="pdf">' + ico('print') + 'ดาวน์โหลดเฉลย PDF</button><button class="btn sec" data-a="dash">กลับหน้าแรก</button></div>', 's', 'mine');
  window.scrollTo(0, 0); fitFigures(app);
  if (secure) return;
  Q.sols = Promise.all(years.map(async y => { try { return (await cj(lv + '/s-' + y + '.json', true)) || {}; } catch (e) { return {}; } })).then(fs => {
    const sf = {}; years.forEach((y, i) => { sf[y] = fs[i]; });
    if (VIEW !== my) return;
    qs.forEach((q, i) => { const s = (sf[q.examYear] || {})[q.itemNo], el = document.getElementById('slot-' + i); if (s && el) el.outerHTML = solBlock({ title: s.t, content: s.c }, i); });
    fitFigures(app);
  });
}
async function showLast() {
  const l = store.get('onet_last'); if (!l || l.studentId !== S.student.id) return toast('ยังไม่มีผลล่าสุดในเครื่องนี้');
  loading();
  const qs = await questionsFor(l.keys), lv = S.level, kf = {}; const answers = {};
  qs.forEach(q => { answers[q.id] = l.answers[qkey(q)] || ''; });
  await Promise.all(yearsOf(qs).map(async y => { kf[y] = await cj(lv + '/k-' + y + '.json'); }));
  const items = gradeLocal(qs, answers, kf, lv), sum0 = f => Math.round(items.reduce((n, i) => n + i[f], 0) * 100) / 100;
  const fl = {}; qs.forEach(q => { if ((l.flags || []).includes(qkey(q))) fl[q.id] = 1; });
  Q = { mode: l.mode, std: l.std, ind: l.ind, skip: 0, qs, secure: false, idx: 0, ans: answers, flags: fl, sols: null };
  renderResult(qs, items, { total: items.length, correct: sum0('ok'), score: sum0('earned'), maxScore: sum0('points') }, null, l.mode, l.std, l.ind, false, fl);
}

/* ---------- พิมพ์ PDF: พื้นขาว ตัวหนังสือดำ ไม่มีพื้นหลังอวกาศ ---------- */
function staticInput(q, i) {
  if (q.type === 'complex') return '<table class="cx"><tr><th>ข้อ</th><th>ข้อความ</th><th>ใช่ หรือ ไม่ใช่</th></tr>' + q.choices.map((c, k) => '<tr><td>' + sub(q, i, k) + '</td><td>' + cell(c) + '</td><td>☐ ใช่ &nbsp; ☐ ไม่ใช่</td></tr>').join('') + '</table>';
  if (q.type === 'order') return Array.from({ length: q.slots }, (_, k) => '<div>' + sub(q, i, k) + ' ลำดับที่ ………… </div>').join('') + '<div class="small">ตัวเลือก: ' + q.choices.map((c, j) => (j + 1) + ') ' + fmt(c)).join(' · ') + '</div>';
  if (q.type === 'fill') return '<div>คำตอบ ………………………………………………</div>';
  if (!q.choices.length) return '<div>คำตอบ (ดูตัวเลือกในภาพ): ☐ 1 &nbsp; ☐ 2 &nbsp; ☐ 3 &nbsp; ☐ 4</div>';
  return q.choices.map((c, j) => '<div class="opt"><span class="n">' + (j + 1) + ')</span> ' + fmt(c) + '</div>').join('');
}
async function prepPrintExam() {
  const el = $('#printq'); el.innerHTML = '<h2>' + esc(examTitle()) + ' · ' + LV[S.level] + '</h2>' + Q.qs.map((q, i) => '<div class="pq paper">' + qHead(q, i) + staticInput(q, i) + '</div>').join('');
  document.title = 'O-NET วิทย์ ' + LV[S.level] + ' - ' + examTitle();
  document.body.classList.add('print-exam');
  await Promise.all([...el.querySelectorAll('img')].map(i => (i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; }))));
}
function cleanupPrint() { document.body.classList.remove('print-exam'); }
window.addEventListener('afterprint', cleanupPrint);
async function prepPrintPage() {
  if (Q && Q.sols) await Q.sols;
  app.querySelectorAll('img[loading=lazy]').forEach(i => { i.loading = 'eager'; });
  await Promise.all([...app.querySelectorAll('img')].map(i => (i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; }))));
  app.querySelectorAll('.sol').forEach(s => s.classList.add('open'));
  app.querySelectorAll('details.fold').forEach(d => { d.open = true; });
  const h = app.querySelector('h2'); document.title = 'O-NET วิทย์ ' + LV[S.level || 'P6'] + ' - ' + (h ? h.textContent.trim() : '');
}

/* ---------- แหล่งข้อมูล สทศ. ---------- */
function res() {
  page('<div class="examtop"><button class="xbtn" data-a="' + (S.code && S.student ? 'dash' : 'home') + '" aria-label="กลับ">' + ico('back') + '</button><div class="grow"><b>ผังข้อสอบและข้อสอบจาก สทศ.</b></div></div>' +
    '<section class="glass"><h2>Test Blueprint วิทยาศาสตร์ ปีการศึกษา 2569</h2><div class="row"><a class="btn sec" target="_blank" rel="noopener" href="' + BLUEPRINT.P6 + '">ผังข้อสอบ ป.6</a><a class="btn sec" target="_blank" rel="noopener" href="' + BLUEPRINT.M3 + '">ผังข้อสอบ ม.3</a></div></section>' +
    '<h2 style="margin:8px 2px 10px">ข้อสอบ O-NET วิทยาศาสตร์พร้อมเฉลย</h2>' + EXAMS.map(e => '<section class="glass"><div class="row" style="flex-wrap:nowrap"><h3 style="flex:0 0 auto;min-width:5.5em">ปี ' + e.y + '</h3>' + ['P6', 'M3'].map(l => e[l] ? '<a class="btn sm sec" target="_blank" rel="noopener" href="' + NIETS + encodeURI(e[l]) + '">' + LV[l] + ' PDF</a>' : '<span class="mute small" style="text-align:center">' + LV[l] + ' –</span>').join('') + '<a class="btn sm ghost" target="_blank" rel="noopener" href="' + PAGE + e.page + '">สทศ.</a></div></section>').join('') +
    '<p class="mute small">ไฟล์ทั้งหมดอยู่บนเว็บไซต์ สทศ. (niets.or.th) ถ้าลิงก์ PDF เปิดไม่ได้ให้เข้าจากหน้าประกาศของ สทศ. ปีที่เก่ากว่านี้ดูได้ที่หน้ารวมข้อสอบ:</p><a class="btn sm sec" target="_blank" rel="noopener" href="https://www.niets.or.th/th/catalog/view/630">หน้ารวมข้อสอบ O-NET</a>', S.student ? 's' : null, 'home');
}

/* ---------- ปุ่มของนักเรียน ---------- */
Object.assign(ACT, {
  home: () => { S.student = null; save(); return home(); },
  dash: () => S.student && S.code ? dash() : home(), res,
  nav: d => { if (d.kind === 't') { A.tab = d.k; return admin(); } return ({ home: dash, exams: examsPage, learn: learnPage, review: reviewPage, mine: minePage })[d.k](); },
  pick: d => { S.student = { id: d.id, name: d.name }; PR = null; save(); return dash(); },
  room: () => { S.code = S.student = null; ROSTER = null; PR = null; save(); return home(); },
  sol: d => { const b = $('#sol-' + d.k), on = b.classList.toggle('open'); document.querySelector('[data-a=sol][data-k="' + d.k + '"]').textContent = on ? 'ซ่อนเฉลยละเอียด' : 'ดูเฉลยละเอียด'; },
  pdf: async () => { await prepPrintPage(); window.print(); },
  pdfexam: async () => { closeSheet(); await prepPrintExam(); window.print(); },
  mock: () => quiz('mock'),
  year: d => quiz('year', d.y),
  study: d => study(d.std, d.ind || ''),
  goto: d => { const el = document.getElementById(d.id); if (!el) return; const fd = el.querySelector('details.fold'); if (fd) { fd.open = true; fitFigures(fd); } const far = Math.abs(el.getBoundingClientRect().top) > 2500; el.scrollIntoView({ behavior: far || matchMedia('(prefers-reduced-motion:reduce)').matches ? 'auto' : 'smooth', block: 'start' }); el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); },
  prac: d => quiz('practice', d.std, d.ind || ''),
  next: () => quiz('practice', Q.std, Q.ind, Q.skip + Q.qs.length),
  resume: async () => { const e = loadExam(); if (!e) return dash(); await quiz(e.mode, e.std, e.ind, e.skip, e.secure, e); },
  dropexam: () => { if (confirm('ทิ้งข้อสอบที่ทำค้างไว้? คำตอบที่เก็บไว้จะหายไป')) { clearExam(); return dash(); } },
  qnext: () => goQ(Q.idx + 1), qprev: () => goQ(Q.idx - 1),
  qgo: d => goQ(+d.i),
  sheet: () => openSheet(), closesheet: closeSheet,
  leave: () => { saveExam(); toast('เก็บคำตอบไว้แล้ว เปิดข้อสอบต่อได้จากหน้าแรกหรือแท็บ "ข้อสอบ"'); return examsPage(); },
  flag: () => { const q = Q.qs[Q.idx]; Q.flags[q.id] = !Q.flags[q.id]; saveExam(); const b = $('#flagb'); b.classList.toggle('on', !!Q.flags[q.id]); b.setAttribute('aria-pressed', !!Q.flags[q.id]); b.innerHTML = ico('flag') + (Q.flags[q.id] ? ' ปักธงไว้แล้ว (ไม่แน่ใจ)' : ' ปักธงข้อที่ไม่แน่ใจ'); },
  submit: () => submit(),
  retry: () => (RETRY ? RETRY() : dash()),
  showlast: () => showLast(),
  onlywrong: () => { const l = $('#rlist'), on = l.classList.toggle('only-wrong'); const b = document.querySelector('[data-a=onlywrong]'); b.setAttribute('aria-pressed', on); b.textContent = on ? 'แสดงทุกข้อ' : 'แสดงเฉพาะข้อที่ยังไม่ถูก'; }
});
/* คำตอบเปลี่ยน → เก็บทันที (ปิดเว็บกลางคันแล้วไม่หาย) */
const onAnswer = e => {
  const card = e.target.closest && e.target.closest('#qcard'); if (!card || !Q) return;
  const q = Q.qs[Q.idx]; Q.ans[q.id] = readAnswer(q);
  card.querySelectorAll('.opt').forEach(o => o.classList.toggle('on', !!o.querySelector('input:checked')));
  saveExam(); updateProgress();
};
app.addEventListener('change', onAnswer); app.addEventListener('input', onAnswer);
