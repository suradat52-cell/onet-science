/* หน้ารายงานของครู (ช่วง 3): ภาพรวมห้อง (heatmap นักเรียน×ตัวชี้วัด) · วิเคราะห์ข้อสอบ · มอบหมายงาน · เทียบก่อน/หลังเรียน · ส่งออก CSV/PDF · ระบบ (สถานะ)
   ข้อมูลมาจากคำขอเดียว (analytics) แล้วคำนวณในเครื่องครู: จัดกลุ่มตามมาตรฐาน/ตัวชี้วัดด้วย content/<ระดับ>/qidx.json */
const RS = { sub: 'room', room: '', mode: 'std', an: null, key: '', picked: [] };
const hmClass = p => p === null ? 'hm-' : p >= 80 ? 'hm4' : p >= 65 ? 'hm3' : p >= 50 ? 'hm2' : 'hm1';
const pctOf = x => x && x.n ? Math.round(x.c * 100 / x.n) : null;
const addTo = (m, k, n, c) => { const x = m[k] = m[k] || { n: 0, c: 0 }; x.n += n; x.c += c; };
const shortStd = s => String(s).replace(/^ว\s*/, '');
const fmtDate = ts => { const d = new Date(ts); return isNaN(d) ? '–' : d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }); };

async function loadAn() {
  const key = A.school + '|' + A.level;
  if (!RS.an || RS.key !== key) { RS.an = await api('analytics', { token: S.token, schoolId: A.school, level: A.level }); RS.key = key; RS.room = ''; RS.picked = []; }
  const lv = A.level, [qidx, meta, srch] = await Promise.all([cj(lv + '/qidx.json'), cj(lv + '/meta.json'), cj(lv + '/search.json', true)]);
  RS.qidx = qidx; RS.meta = meta; RS.stem = {}; (srch || []).forEach(r => { if (r[0] === 'q') RS.stem[r[3]] = r[4]; });
  return RS.an;
}
// รวมผลต่อมาตรฐาน/ตัวชี้วัด ต่อนักเรียน
function rollup(students) {
  const per = students.map(s => { const std = {}, ind = {}; let n = 0, c = 0;
    Object.keys(s.qs).forEach(qid => { const t = RS.qidx[keyOfQid(qid)]; if (!t) return; const y = s.qs[qid]; addTo(std, t[0], y.n, y.c); addTo(ind, t[0] + '|' + t[1], y.n, y.c); n += y.n; c += y.c; });
    return { s, std, ind, n, c }; });
  const cls = { std: {}, ind: {} }; per.forEach(r => { Object.keys(r.std).forEach(k => addTo(cls.std, k, r.std[k].n, r.std[k].c)); Object.keys(r.ind).forEach(k => addTo(cls.ind, k, r.ind[k].n, r.ind[k].c)); });
  return { per, cls };
}
const inRoom = s => !RS.room || s.room === RS.room;

async function reportBody() {
  if (!A.school) return '<p class="mute">เลือกโรงเรียนก่อน</p>';
  const an = await loadAn(), rooms = [...new Set(an.students.map(s => s.room))].sort();
  const subs = [['room', 'ภาพรวมห้อง'], ['item', 'วิเคราะห์ข้อสอบ'], ['asg', 'มอบหมายงาน'], ['cmp', 'ก่อน/หลังเรียน'], ['exp', 'ส่งออก']];
  const head = '<div class="seg tsub" role="tablist">' + subs.map(([k, t]) => '<button role="tab" aria-selected="' + (RS.sub === k) + '" data-a="rsub" data-s="' + k + '" class="' + (RS.sub === k ? 'on' : '') + '">' + t + '</button>').join('') + '</div>' +
    '<div class="row noprint" style="margin-bottom:12px"><select id="rr" aria-label="ห้อง"><option value="">ทุกห้อง (' + an.students.length + ' คน)</option>' + rooms.map(r => '<option value="' + esc(r) + '"' + (r === RS.room ? ' selected' : '') + '>ห้อง ' + esc(r) + ' (' + an.students.filter(s => s.room === r).length + ' คน)</option>').join('') + '</select><button class="btn sec sm" data-a="rrefresh">' + ico('refresh') + 'โหลดข้อมูลใหม่</button></div>';
  return head + ({ room: roomView, item: itemView, asg: asgView, cmp: cmpView, exp: exportView })[RS.sub](an);
}

/* ---------- ภาพรวมห้อง ---------- */
function roomView(an) {
  const st = an.students.filter(inRoom), { per, cls } = rollup(st), m = RS.meta, now = Date.now();
  const active = per.filter(r => r.s.n > 0), all = per.reduce((a, r) => ({ n: a.n + r.n, c: a.c + r.c }), { n: 0, c: 0 });
  const idle = per.filter(r => !r.s.n || now - Date.parse(r.s.last) > 7 * 864e5);
  const cols = RS.mode === 'ind' ? m.standards.flatMap(x => x.ind.map(i => ({ k: x.standard + '|' + i.indicator, std: x.standard, lab: i.indicator, desc: i.description }))) : m.standards.map(x => ({ k: x.standard, std: x.standard, lab: shortStd(x.standard), desc: SHORT[x.standard] || '' }));
  const cell = (r, c) => { const x = (RS.mode === 'ind' ? r.ind : r.std)[c.k], p = pctOf(x); return '<td class="' + hmClass(p) + '" title="' + esc(r.s.name + ' · ' + c.k + (x ? ' · ถูก ' + x.c + '/' + x.n : ' · ยังไม่ได้ทำ')) + '">' + (p === null ? '–' : p) + '</td>'; };
  let h1 = '';
  if (RS.mode === 'ind') { const g = []; cols.forEach(c => { if (g.length && g[g.length - 1].std === c.std) g[g.length - 1].n++; else g.push({ std: c.std, n: 1 }); }); h1 = '<tr><th rowspan="2" class="sticky">นักเรียน</th>' + g.map(x => '<th colspan="' + x.n + '">' + esc(shortStd(x.std)) + '</th>').join('') + '</tr><tr>' + cols.map(c => '<th title="' + esc(c.desc) + '">' + esc(c.lab.replace(/^[ปม]\.\d+\//, '')) + '</th>').join('') + '</tr>'; }
  else h1 = '<tr><th class="sticky">นักเรียน</th>' + cols.map(c => '<th title="' + esc(c.desc) + '">' + esc(c.lab) + '</th>').join('') + '</tr>';
  const avgRow = '<tr class="avg"><th class="sticky">เฉลี่ยทั้งกลุ่ม</th>' + cols.map(c => { const p = pctOf((RS.mode === 'ind' ? cls.ind : cls.std)[c.k]); return '<td class="' + hmClass(p) + '">' + (p === null ? '–' : p) + '</td>'; }).join('') + '</tr>';
  const stdRows = m.standards.map(x => ({ x, p: pctOf(cls.std[x.standard]), n: (cls.std[x.standard] || {}).n || 0 })).sort((a, b) => (a.p === null) - (b.p === null) || a.p - b.p);
  const title = 'รายงานห้องเรียน ' + esc(A.schoolName || '') + ' · ' + LV[A.level] + (RS.room ? ' · ห้อง ' + esc(RS.room) : ' · ทุกห้อง');
  return '<div class="onlyprint printhead"><h2>' + title + '</h2><p>พิมพ์เมื่อ ' + new Date().toLocaleString('th-TH') + '</p></div>' +
    '<article class="paper"><h2 class="noprint">ภาพรวม</h2><div class="kpis"><div><b>' + st.length + '</b><span>นักเรียน</span></div><div><b>' + active.length + '</b><span>เคยทำแล้ว</span></div><div><b>' + (all.n ? Math.round(all.c * 100 / all.n) + '%' : '–') + '</b><span>ถูกเฉลี่ย</span></div><div><b>' + all.n + '</b><span>ข้อที่ทำรวม</span></div></div></article>' +
    '<article class="paper"><h2>ค่าเฉลี่ยตามมาตรฐาน</h2><p class="small pmute">เรียงจากที่ต่ำที่สุดก่อน — ควรสอนซ้ำมาตรฐานด้านบน</p>' + stdRows.map(r => '<div class="avgrow"><span class="nm">' + esc(stdName(r.x)) + '</span><span class="bar"><i class="' + hmClass(r.p) + '" style="width:' + (r.p || 0) + '%"></i></span><b>' + (r.p === null ? '–' : r.p + '%') + '</b><span class="small pmute">' + (r.n ? r.n + ' ข้อ' : 'ยังไม่มีข้อมูล') + '</span></div>').join('') + '</article>' +
    '<article class="paper hmwrap"><div class="row noprint" style="margin-bottom:8px"><h2 style="flex:1 1 auto">นักเรียน × ' + (RS.mode === 'ind' ? 'ตัวชี้วัด' : 'มาตรฐาน') + '</h2><button class="btn sm sec" data-a="rmode" data-m="' + (RS.mode === 'ind' ? 'std' : 'ind') + '">ดูแบบ' + (RS.mode === 'ind' ? 'มาตรฐาน' : 'ตัวชี้วัด') + '</button></div>' +
    '<p class="small pmute">ตัวเลข = % ที่ทำถูก · <span class="lg hm4">≥ 80</span> <span class="lg hm3">65–79</span> <span class="lg hm2">50–64</span> <span class="lg hm1">&lt; 50</span> <span class="lg hm-">ยังไม่ได้ทำ</span></p>' +
    (st.length ? '<div class="scroll"><table class="hm">' + h1 + per.map(r => '<tr><th class="sticky">' + esc(r.s.room + '/' + r.s.no + ' ' + r.s.name) + '</th>' + cols.map(c => cell(r, c)).join('') + '</tr>').join('') + avgRow + '</table></div>' : '<div class="empty"><p><b>ยังไม่มีนักเรียน</b></p></div>') + '</article>' +
    '<article class="paper"><h2>ยังไม่ได้ทำ / หายไปเกิน 7 วัน (' + idle.length + ' คน)</h2>' + (idle.length ? '<div class="scroll"><table class="wide"><tr><th>ห้อง</th><th>เลขที่</th><th>ชื่อ</th><th>ล่าสุด</th></tr>' + idle.map(r => '<tr><td>' + esc(r.s.room) + '</td><td>' + esc(r.s.no) + '</td><td>' + esc(r.s.name) + '</td><td>' + (r.s.n ? fmtDate(r.s.last) : 'ยังไม่เคยทำ') + '</td></tr>').join('') + '</table></div>' : '<div class="empty"><p><b>ทุกคนทำภายใน 7 วัน</b></p></div>') + '</article>';
}

/* ---------- วิเคราะห์ข้อสอบ: ความยาก (p) และตัวลวงที่ถูกเลือกมากที่สุด ---------- */
function itemView(an) {
  const rows = Object.keys(an.items).map(qid => { const it = an.items[qid], key = keyOfQid(qid), t = RS.qidx[key] || ['', '']; const w = Object.keys(it.w).filter(k => k !== '-').sort((a, b) => it.w[b] - it.w[a]);
    return { key, std: t[0], ind: t[1], n: it.n, p: Math.round(it.c * 100 / it.n), top: w[0], topN: w[0] ? it.w[w[0]] : 0, blank: it.w['-'] || 0, wrong: it.n - it.c }; })
    .filter(r => r.n >= 2).sort((a, b) => a.p - b.p || b.n - a.n);
  const lab = p => p < 30 ? 'ยากมาก' : p < 50 ? 'ยาก' : p < 80 ? 'ปานกลาง' : 'ง่าย';
  return '<article class="paper"><h2>วิเคราะห์ข้อสอบ (ทั้งโรงเรียน · ' + LV[A.level] + ')</h2><p class="small pmute">p = สัดส่วนที่ตอบถูก ยิ่งต่ำยิ่งยาก · แสดงเฉพาะข้อที่มีคนทำตั้งแต่ 2 ครั้ง · "ตัวลวง" = คำตอบผิดที่ถูกเลือกมากที่สุด (ข้อที่ทำก่อนระบบเก็บคำตอบจะไม่มีข้อมูลตัวลวง)</p>' +
    (rows.length ? '<div class="scroll"><table class="wide"><tr><th>ข้อ</th><th>ตัวชี้วัด</th><th class="n">ถูก %</th><th class="n">ทำ</th><th>ระดับ</th><th>ตัวลวงที่เลือกมากสุด</th></tr>' + rows.slice(0, 60).map(r => '<tr><td><b>' + esc(r.key.replace('/', ' ข้อ ')) + '</b><div class="small pmute">' + esc((RS.stem[r.key] || '').slice(0, 60)) + '</div></td><td>' + esc(r.std + ' ' + r.ind) + '</td><td class="n ' + hmClass(r.p) + '">' + r.p + '</td><td class="n">' + r.n + '</td><td>' + lab(r.p) + '</td><td>' + (r.top ? 'ตอบ <b>' + esc(r.top) + '</b> · ' + r.topN + ' ครั้ง (' + Math.round(r.topN * 100 / r.wrong) + '% ของคำตอบผิด)' : r.blank ? 'ไม่ตอบ ' + r.blank + ' ครั้ง' : '–') + '</td></tr>').join('') + '</table></div>' + (rows.length > 60 ? '<p class="small pmute">แสดง 60 ข้อที่ยากที่สุดจากทั้งหมด ' + rows.length + ' ข้อ</p>' : '') : '<div class="empty"><p><b>ยังมีข้อมูลไม่พอ</b></p><p class="mute small">เมื่อนักเรียนทำข้อเดียวกันตั้งแต่ 2 ครั้งขึ้นไป จะแสดงที่นี่</p></div>') + '</article>';
}

/* ---------- มอบหมายงาน ---------- */
const today10 = () => dstr(new Date());
function asgStats(a, an) {
  const target = an.students.filter(s => !a.room || s.room === a.room), best = {};
  an.asg.filter(x => x.a === a.id).forEach(x => { const p = x.mx ? Math.round(x.sc * 100 / x.mx) : 0; best[x.s] = Math.max(best[x.s] || 0, p); });
  const doneIds = Object.keys(best), ids = new Set(target.map(s => s.id)), done = doneIds.filter(i => ids.has(i));
  return { target, done, best, avg: done.length ? Math.round(done.reduce((n, i) => n + best[i], 0) / done.length) : null, todo: target.filter(s => !(s.id in best)) };
}
function asgView(an) {
  const m = RS.meta, rooms = [...new Set(an.students.map(s => s.room))].sort(), pres = an.assignments.filter(a => a.kind === 'pre');
  const list = an.assignments.slice().sort((a, b) => (b.ts || '').localeCompare(a.ts || '')).map(a => { const s = asgStats(a, an), late = a.due && a.due < today10() && s.todo.length;
    return '<section class="glass"><div class="row" style="flex-wrap:nowrap"><div style="flex:1;min-width:0"><b>' + esc(a.title) + '</b><div class="mute small">' + KIND[a.kind] + ' · ' + (a.room ? 'ห้อง ' + esc(a.room) : 'ทุกห้อง') + (a.kind === 'read' ? ' · ' + esc(a.std) : ' · ' + a.keys.length + ' ข้อ') + (a.due ? ' · กำหนดส่ง ' + fmtDate(a.due + 'T00:00') : '') + '</div></div><button class="btn danger" data-a="adel" data-id="' + esc(a.id) + '">ปิดงาน</button></div>' +
      (a.kind === 'read' ? '<p class="mute small">งานอ่านสรุป — ระบบไม่ติดตามว่าอ่านแล้วหรือยัง</p>' : '<div class="avgrow"><span class="nm">ส่งแล้ว ' + s.done.length + '/' + s.target.length + ' คน</span><span class="bar"><i class="hm4" style="width:' + (s.target.length ? Math.round(s.done.length * 100 / s.target.length) : 0) + '%"></i></span><b>' + (s.avg === null ? '–' : s.avg + '%') + '</b><span class="small mute">คะแนนเฉลี่ย (ครั้งที่ดีที่สุด)</span></div>' +
      (s.todo.length ? '<details class="nblist"><summary>ยังไม่ส่ง ' + s.todo.length + ' คน' + (late ? ' · เลยกำหนด' : '') + '</summary><div class="small">' + s.todo.map(x => esc(x.room + '/' + x.no + ' ' + x.name)).join(' · ') + '</div></details>' : '<p class="small" style="color:var(--ok)">ส่งครบทุกคน</p>')) + '</section>'; }).join('');
  return '<section class="glass noprint"><h2>มอบงานใหม่</h2>' +
    '<label for="at">ชื่องาน</label><input id="at" maxlength="80" placeholder="เช่น ฝึกแรงและการเคลื่อนที่ (สัปดาห์ที่ 3)">' +
    '<div class="row"><div><label for="ak">ชนิดงาน</label><select id="ak">' + Object.keys(KIND).map(k => '<option value="' + k + '">' + KIND[k] + '</option>').join('') + '</select></div><div><label for="aroom">มอบให้</label><select id="aroom"><option value="">ทุกห้อง</option>' + rooms.map(r => '<option value="' + esc(r) + '">ห้อง ' + esc(r) + '</option>').join('') + '</select></div></div>' +
    '<label for="as2">มาตรฐาน</label><select id="as2">' + m.standards.map(x => '<option value="' + esc(x.standard) + '">' + esc(stdName(x)) + ' (' + x.bank + ' ข้อ)</option>').join('') + '</select>' +
    '<label for="ai">ตัวชี้วัด</label><select id="ai"></select>' +
    '<div id="apw"><div class="row"><div><label for="an2">สุ่มกี่ข้อ</label><select id="an2"><option>5</option><option selected>10</option><option>15</option><option>20</option></select></div><div style="align-self:end"><button type="button" class="btn sec" data-a="apick">สุ่มข้อมาให้เลือก</button></div></div><div id="apool" class="apool" aria-live="polite"></div></div>' +
    '<div id="apairw" hidden><label for="apair">ใช้ชุดข้อเดียวกับแบบทดสอบก่อนเรียน</label><select id="apair"><option value="">— เลือก —</option>' + pres.map(p => '<option value="' + esc(p.id) + '">' + esc(p.title) + ' (' + p.keys.length + ' ข้อ)</option>').join('') + '</select></div>' +
    '<div class="row"><div><label for="ad2">กำหนดส่ง (ไม่บังคับ)</label><input id="ad2" type="date" min="' + today10() + '"></div></div><label for="ano">ข้อความถึงนักเรียน (ไม่บังคับ)</label><input id="ano" maxlength="200"><div class="sp"></div><button class="btn" data-a="asave">มอบงาน</button></section>' +
    '<h2 style="margin:8px 2px 10px">งานที่มอบแล้ว (' + an.assignments.length + ')</h2>' + (list || '<div class="empty"><p><b>ยังไม่มีงานที่มอบ</b></p><p class="mute small">มอบงานด้านบน นักเรียนจะเห็นที่หน้าแรกของตัวเอง</p></div>');
}
function asgFormInit() {
  const m = RS.meta, ks = $('#ak'); if (!ks) return;
  const fillI = () => { const x = m.standards.find(s => s.standard === $('#as2').value); $('#ai').innerHTML = '<option value="">ทุกตัวชี้วัด</option>' + (x ? x.ind.map(i => '<option value="' + esc(i.indicator) + '">' + esc(i.indicator) + ' (' + i.bank + ' ข้อ)</option>').join('') : ''); RS.picked = []; const p = $('#apool'); if (p) p.innerHTML = ''; };
  const kind = () => { const k = ks.value; $('#apw').hidden = k === 'read' || k === 'post'; $('#apairw').hidden = k !== 'post'; };
  $('#as2').onchange = fillI; $('#ai').onchange = () => { RS.picked = []; $('#apool').innerHTML = ''; }; ks.onchange = kind; fillI(); kind();
}
function pickPool() {
  const m = RS.meta, std = $('#as2').value, ind = $('#ai').value, n = +$('#an2').value, keys = (m.pool[ind ? std + '|' + ind : std] || []).slice();
  if (!keys.length) { $('#apool').innerHTML = '<p class="mute small">ไม่มีข้อสอบในหัวข้อนี้</p>'; return; }
  const pick = new Set(shuffle(keys).slice(0, n));
  $('#apool').innerHTML = '<p class="mute small">ติ๊กเลือก/ยกเลิกได้ (เลือกอยู่ <b id="apc">' + pick.size + '</b> ข้อ)</p>' + keys.slice().sort().slice(0, 80).map(k => '<label class="chk apk"><input type="checkbox" value="' + esc(k) + '"' + (pick.has(k) ? ' checked' : '') + '><span><b>ปี ' + esc(k.replace('/', ' ข้อ ')) + '</b> <span class="mute small">' + esc((RS.stem[k] || '').slice(0, 50)) + '</span></span></label>').join('');
}
app.addEventListener('change', e => { if (e.target.closest && e.target.closest('#apool')) { const c = $('#apc'); if (c) c.textContent = document.querySelectorAll('#apool input:checked').length; } if (e.target.id === 'rr') { RS.room = e.target.value; run(admin); } });

/* ---------- เทียบก่อน/หลังเรียน ---------- */
function cmpView(an) {
  const posts = an.assignments.filter(a => a.kind === 'post' && a.pair && an.assignments.some(p => p.id === a.pair));
  if (!posts.length) return '<div class="empty"><p><b>ยังไม่มีคู่แบบทดสอบก่อน/หลังเรียน</b></p><p class="mute small">มอบ "แบบทดสอบก่อนเรียน" แล้วมอบ "แบบทดสอบหลังเรียน" โดยเลือกใช้ชุดข้อเดียวกัน ระบบจะเทียบให้ที่นี่</p></div>';
  return posts.map(po => { const pre = an.assignments.find(p => p.id === po.pair), st = an.students.filter(s => (!po.room || s.room === po.room) && inRoom(s));
    const first = {}, last = {}, preQ = {}, postQ = {};
    an.asg.filter(x => x.a === pre.id).sort((a, b) => a.ts.localeCompare(b.ts)).forEach(x => { if (!first[x.s]) first[x.s] = x; });
    an.asg.filter(x => x.a === po.id).sort((a, b) => a.ts.localeCompare(b.ts)).forEach(x => { last[x.s] = x; });
    const ids = new Set(st.map(s => s.id)), sc = x => x && x.mx ? Math.round(x.sc * 100 / x.mx) : null;
    const tally = (m, x) => x.q.forEach(z => { const [qid, ok] = z.split(':'), t = RS.qidx[keyOfQid(qid)]; if (t) addTo(m, t[0] + '|' + t[1], 1, +ok); });
    Object.keys(first).filter(i => ids.has(i)).forEach(i => tally(preQ, first[i])); Object.keys(last).filter(i => ids.has(i)).forEach(i => tally(postQ, last[i]));
    const both = st.filter(s => first[s.id] && last[s.id]), avg = f => both.length ? Math.round(both.reduce((n, s) => n + sc(f[s.id]), 0) / both.length) : null;
    const dl = (a, b) => a === null || b === null ? '–' : (b - a >= 0 ? '+' : '') + (b - a);
    const inds = Object.keys(Object.assign({}, preQ, postQ)).sort();
    return '<article class="paper"><h2>' + esc(po.title) + ' เทียบกับ ' + esc(pre.title) + '</h2><p class="small pmute">ก่อนเรียน = ครั้งแรกที่ทำ · หลังเรียน = ครั้งล่าสุดที่ทำ · เทียบเฉพาะนักเรียนที่ทำครบทั้งสองชุด (' + both.length + ' คน)</p>' +
      '<div class="kpis"><div><b>' + (avg(first) === null ? '–' : avg(first) + '%') + '</b><span>ก่อนเรียน</span></div><div><b>' + (avg(last) === null ? '–' : avg(last) + '%') + '</b><span>หลังเรียน</span></div><div><b>' + dl(avg(first), avg(last)) + '</b><span>เปลี่ยน (จุด%)</span></div></div>' +
      '<h3 style="margin-top:12px">รายตัวชี้วัด</h3>' + (inds.length ? '<div class="scroll"><table class="wide"><tr><th>ตัวชี้วัด</th><th class="n">ก่อน %</th><th class="n">หลัง %</th><th class="n">เปลี่ยน</th></tr>' + inds.map(k => { const a = pctOf(preQ[k]), b = pctOf(postQ[k]); return '<tr><td>' + esc(k.replace('|', ' ')) + '</td><td class="n ' + hmClass(a) + '">' + (a === null ? '–' : a) + '</td><td class="n ' + hmClass(b) + '">' + (b === null ? '–' : b) + '</td><td class="n">' + dl(a, b) + '</td></tr>'; }).join('') + '</table></div>' : '<p class="mute small">ยังไม่มีข้อมูล</p>') +
      '<h3 style="margin-top:12px">รายนักเรียน</h3><div class="scroll"><table class="wide"><tr><th>ห้อง/เลขที่</th><th>ชื่อ</th><th class="n">ก่อน %</th><th class="n">หลัง %</th><th class="n">เปลี่ยน</th></tr>' + st.map(s => { const a = sc(first[s.id]), b = sc(last[s.id]); return '<tr><td>' + esc(s.room + '/' + s.no) + '</td><td>' + esc(s.name) + '</td><td class="n">' + (a === null ? '–' : a) + '</td><td class="n">' + (b === null ? '–' : b) + '</td><td class="n">' + dl(a, b) + '</td></tr>'; }).join('') + '</table></div></article>';
  }).join('');
}

/* ---------- ส่งออก CSV / PDF ---------- */
function csvText() {
  const st = RS.an.students.filter(inRoom), { per, cls } = rollup(st), m = RS.meta, q = v => '"' + String(v).replace(/"/g, '""') + '"';
  const head = ['ห้อง', 'เลขที่', 'ชื่อ-สกุล', 'จำนวนครั้งที่ทำ', 'ข้อที่ทำ', 'ข้อที่ถูก', 'ถูก %', 'ทำล่าสุด'].concat(m.standards.map(x => x.standard + ' ถูก %'));
  const rows = per.map(r => [r.s.room, r.s.no, r.s.name, r.s.n, r.n, r.c, r.n ? Math.round(r.c * 100 / r.n) : '', r.s.n ? r.s.last.slice(0, 10) : ''].concat(m.standards.map(x => { const p = pctOf(r.std[x.standard]); return p === null ? '' : p; })));
  rows.push(['', '', 'เฉลี่ยทั้งกลุ่ม', '', per.reduce((n, r) => n + r.n, 0), per.reduce((n, r) => n + r.c, 0), '', ''].concat(m.standards.map(x => { const p = pctOf(cls.std[x.standard]); return p === null ? '' : p; })));
  return '﻿' + [head].concat(rows).map(r => r.map(q).join(',')).join('\r\n');
}
function exportView() {
  const st = RS.an.students.filter(inRoom).length;
  return '<section class="glass"><h2>ส่งออกรายงาน</h2><p class="mute small">ข้อมูล ' + st + ' คน' + (RS.room ? ' (ห้อง ' + esc(RS.room) + ')' : ' (ทุกห้อง)') + ' · ใช้ตัวกรองห้องด้านบนเลือกห้องก่อน</p><div class="sp"></div>' +
    '<button class="btn" data-a="csv">' + ico('copy') + 'ดาวน์โหลด CSV (เปิดด้วย Excel ได้)</button><div class="sp"></div>' +
    '<button class="btn sec" data-a="repdf">' + ico('print') + 'รายงานห้องเรียน PDF (ภาพรวม + heatmap)</button></section>';
}

/* ---------- ระบบ (ผู้ดูแลกลาง): ตรวจสถานะ ---------- */
function diagHtml(d) {
  return '<article class="paper"><h2>ผลตรวจระบบ (รวม ' + (d.totalMs / 1000).toFixed(1) + ' วินาที)</h2><div class="scroll"><table class="wide"><tr><th>ขั้น</th><th class="n">ms</th><th>หมายเหตุ</th></tr>' + d.steps.map(s => '<tr><td>' + esc(s.step) + '</td><td class="n">' + esc(s.ms) + '</td><td>' + esc(s.note) + '</td></tr>').join('') + '</table></div>' +
    (d.slow && d.slow.length ? '<h3>คำสั่งที่ช้า (> 5 วินาที) ล่าสุด</h3><div class="small">' + d.slow.slice(-10).map(x => esc(x.t.slice(0, 16).replace('T', ' ') + ' ' + x.act + ' ' + x.ms + ' ms')).join('<br>') + '</div>' : '<p class="mute small">ไม่มีคำสั่งที่ช้าเกิน 5 วินาที</p>') + '</article>';
}

Object.assign(ACT, {
  rsub: d => { RS.sub = d.s; return admin(); },
  rmode: d => { RS.mode = d.m; return admin(); },
  rrefresh: () => { RS.an = null; return admin(); },
  apick: () => pickPool(),
  asave: async () => {
    const kind = $('#ak').value; let keys = [...document.querySelectorAll('#apool input:checked')].map(i => i.value);
    if (kind === 'post') { const pre = RS.an.assignments.find(p => p.id === $('#apair').value); if (!pre) return toast('เลือกชุดข้อของแบบทดสอบก่อนเรียน'); keys = pre.keys; }
    if (kind !== 'read' && kind !== 'post' && !keys.length) return toast('กด "สุ่มข้อมาให้เลือก" แล้วติ๊กข้อที่ต้องการก่อน');
    await api('saveAssignment', { token: S.token, schoolId: A.school, level: A.level, room: $('#aroom').value, title: $('#at').value, kind, std: $('#as2').value, ind: $('#ai').value, keys, due: $('#ad2').value, note: $('#ano').value, pair: kind === 'post' ? $('#apair').value : '' });
    RS.an = null; toast('มอบงานแล้ว'); await admin();
  },
  adel: async d => { if (confirm('ปิดงานนี้? นักเรียนจะไม่เห็นงานนี้อีก (ผลที่ทำไปแล้วยังอยู่)')) { await api('removeAssignment', { token: S.token, id: d.id }); RS.an = null; toast('ปิดงานแล้ว'); await admin(); } },
  csv: () => { const b = new Blob([csvText()], { type: 'text/csv;charset=utf-8' }), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'รายงาน-' + LV[A.level] + (RS.room ? '-ห้อง' + RS.room.replace(/[\\/]/g, '-') : '') + '-' + dstr(new Date()) + '.csv'; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); toast('ดาวน์โหลดไฟล์ CSV แล้ว'); },
  repdf: async () => { RS.sub = 'room'; await admin(); await prepPrintPage(); window.print(); },
  schoolact: async d => { await api('setSchoolActive', { token: S.token, id: d.id, active: d.on === '1' }); toast(d.on === '1' ? 'เปิดใช้งานโรงเรียนแล้ว' : 'ปิดใช้งานโรงเรียนแล้ว (ข้อมูลยังอยู่ครบ)'); await admin(); },
  diag: async () => { const b = $('#diagout'); b.innerHTML = '<p class="mute">กำลังตรวจ (ใช้เวลาหลายวินาที)…</p>'; try { b.innerHTML = diagHtml(await api('diag', {})); } catch (e) { b.innerHTML = '<p class="mute">' + esc(e.message) + '</p>'; } }
});
