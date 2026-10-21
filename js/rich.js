/* สรุปเนื้อหา: ภาพ SVG ในตัว (FIG) · ตัวแปลง markup ของสรุป/เฉลย (rich) · ภาพ SVG ของแต่ละระดับโหลดจาก figs/<ระดับ>.js */
/* ---------- ภาพประกอบในตัว (SVG) ใช้ในสรุปด้วย [[fig:ชื่อ|คำบรรยาย]] ---------- */
const W = 'fill="none" stroke="currentColor" stroke-width="2"';
const lamp = (x, y) => `<circle cx="${x}" cy="${y}" r="12" fill="#fff" stroke="currentColor" stroke-width="2"/><path d="M${x - 8} ${y - 8}l16 16M${x + 8} ${y - 8}l-16 16" ${W}/>`;
const batt = '<rect x="30" y="69" width="20" height="12" fill="#fff" stroke="none"/><path d="M26 68H54" ' + W + '/><path d="M33 82H47" fill="none" stroke="currentColor" stroke-width="5"/><text x="12" y="72">+</text><text x="12" y="88">–</text><text x="58" y="79">ถ่านไฟฉาย</text>';
const FIG = {
  series: '<svg viewBox="0 0 260 150" role="img" aria-label="วงจรอนุกรม"><path d="M40 30H220V120H40Z" ' + W + '/>' + batt + lamp(105, 30) + lamp(175, 30) +
    '<text x="105" y="58" text-anchor="middle">หลอด 1</text><text x="175" y="58" text-anchor="middle">หลอด 2</text><polygon points="136,114 124,120 136,126"/><text x="130" y="140" text-anchor="middle">ทิศกระแสไฟฟ้า (ทางเดียว)</text></svg>',
  parallel: '<svg viewBox="0 0 260 150" role="img" aria-label="วงจรขนาน"><path d="M40 20H220V125H40Z" ' + W + '/><path d="M130 20V125" ' + W + '/>' + batt + lamp(130, 75) + lamp(220, 75) +
    '<text x="146" y="52">หลอด 1</text><text x="204" y="104" text-anchor="end">หลอด 2</text><polygon points="91,119 79,125 91,131"/><text x="130" y="144" text-anchor="middle">กระแสไฟฟ้าแยกไหล 2 ทาง</text></svg>'
};

/* ---------- แปลงข้อความสรุปเป็นหน้าติว: ## หัวข้อ, • รายการ, !! จำให้แม่น, ?? ข้อสอบชอบถาม, ex: ตัวอย่าง, = สมการ, {เศษ/ส่วน}, | ตาราง | ---------- */
function inl(s) {
  return esc(s).replace(/\{([^{}\/]+)\/([^{}\/]+)\}/g, '<span class="fr"><span>$1</span><span>$2</span></span>').replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
}
/* ภาพ SVG ของสรุปแต่ละระดับอยู่ในไฟล์ figs/P6.js และ figs/M3.js (แยกกันเด็ดขาด) โหลดเมื่อเปิดหน้าสรุปของระดับนั้น */
const FIGS = { P6: {}, M3: {} };
const figLoaded = {};
function loadFigs(lv) {
  if (!figLoaded[lv]) figLoaded[lv] = new Promise(ok => { const s = document.createElement('script'); s.src = 'figs/' + lv + '.js'; s.onload = s.onerror = () => ok(); document.head.appendChild(s); });
  return figLoaded[lv];
}
const figOf = n => FIG[n] || (FIGS[S.level || 'P6'] || {})[n];
/* ชื่อหัวข้อในไฟล์สรุปมีป้ายท้ายชื่อ "(ออก N ข้อ)" / "(ยังไม่เคยออกสอบ)" → แยกเป็นชื่อกับป้าย (หน้าเว็บคำนวณจำนวนข้อจริงจากคลังข้อสอบเอง) */
function titleParts(t) {
  const m = String(t).match(/^(.*?)\s*\((ออกบ่อยที่สุด\s*(\d+)\s*ข้อ|ออก\s*(\d+)\s*ข้อ|ยังไม่เคยออกสอบ[^)]*)\)\s*$/);
  if (!m) return { name: String(t), n: null, never: false };
  const never = /^ยังไม่เคยออก/.test(m[2]);
  return { name: m[1], n: never ? 0 : +(m[3] || m[4]), never };
}
/* ตารางเปรียบเทียบ: 2 คอลัมน์ = ตารางปกติ · 3 คอลัมน์ขึ้นไป = บนมือถือแตกเป็นการ์ดต่อแถว (ไม่ต้องเลื่อนซ้าย-ขวา) ตอนพิมพ์กลับเป็นตาราง */
function tableHtml(rows) {
  const n = Math.max(...rows.map(r => r.length)), head = rows[0].map(c => c.replace(/\*\*|\{|\}/g, ''));
  const long = Math.max(...rows.flat().map(c => c.replace(/\*\*|\{|\}/g, '').length)) > 24, stk = n >= 4 || (n === 3 && long);
  return '<div class="tw"><table class="ctab' + (stk ? ' stk' : '') + '" data-n="' + n + '"><tr class="hd">' + rows[0].map(c => '<th>' + inl(c) + '</th>').join('') + '</tr>' +
    rows.slice(1).map(r => '<tr>' + r.map((c, i) => '<td data-l="' + esc(head[i] || '') + '">' + inl(c) + '</td>').join('') + '</tr>').join('') + '</table></div>';
}
/* ctx (ไม่บังคับ): { pre: 'รหัสนำหน้า id ของหัวข้อย่อย', exams: { 'ชื่อหัวข้อย่อย': ['2565 ข้อ 20', …] } } */
function rich(t, ctx) {
  ctx = ctx || {};
  let h = '', ul = false, tb = null, box = '', cs = '', fl = 0, hn = 0, cur = '', boxPos = 0, boxN = 0, boxHd = false;
  const lines = String(t).split(/\r?\n/).map(x => x.trim());
  const close = () => {
    if (ul) { h += '</ul>'; ul = false; }
    if (tb) { h += tableHtml(tb); tb = null; }
    if (box) { h += '</div>'; if (boxN > 1) h = h.slice(0, boxPos) + h.slice(boxPos).replace('class="box ', 'class="box multi '); box = ''; }
    if (cs) { h += cs === 'th' ? '</ol></div></div>' : '</div></div>'; cs = ''; }
    if (fl) { h += '</ol>'; fl = 0; }
  };
  const yearsOf = () => [...new Set(((ctx.exams || {})[cur] || []).map(x => x.split(' ')[0]))].sort().reverse();
  // บรรทัดติดกันที่ขึ้นต้นเหมือนกัน (kc: / !! / ?? / tr: / ex: แบบเดิม) รวมเป็นกล่องเดียว
  const boxLine = (kind, cls, title, text) => { if (/^[·.–— -]*$/.test(text)) return; if (box !== kind) { close(); box = kind; boxN = 0; boxHd = false; boxPos = h.length; h += '<div class="box ' + cls + '"><b class="t">' + title + '</b>'; } boxN++; const hd = /:$/.test(text.trim()), sub = boxHd; boxHd = hd; h += '<div class="bl' + (hd ? ' hd' : '') + (sub ? ' sub' : '') + '">' + inl(text) + '</div>'; }; // บรรทัดลงท้าย ":" = หัวโจทย์ บรรทัดถัดไปเป็นคำตอบของหัวนั้น (ไม่ขึ้นแถวใหม่)
  lines.forEach((l, i) => {
    let m;
    if (!l) return close();
    if (l.startsWith('kc: ')) return boxLine('kc', 'kc', 'แนวคิดหลัก', l.slice(4));
    if (l.startsWith('!! ')) return boxLine('!!', 'key', 'จำให้แม่น', l.slice(3));
    if (l.startsWith('?? ')) { const ys = yearsOf(); return boxLine('??', 'ask', 'ข้อสอบชอบถาม' + (ys.length ? '<span class="yrs">ออกปี ' + ys.join(' · ') + '</span>' : ''), l.slice(3)); }
    if (l.startsWith('tr: ')) return boxLine('tr', 'trap', 'กับดักที่พลาดบ่อย', l.slice(4));
    if (l.startsWith('xx: ')) return boxLine('xx', 'tip', 'จุดที่มักพลาด', l.slice(4));
    if (l.startsWith('ob: ')) return boxLine('ob', 'warn', 'ข้อสังเกต (ควรตรวจกับครู)', l.slice(4));
    if (l.startsWith('ex: ')) {
      const nx = lines.slice(i + 1).find(x => x) || '';
      if (/^(th|an): /.test(nx)) { close(); cs = 'q'; h += '<div class="exm"><div class="exq"><b class="t">โจทย์</b>' + inl(l.slice(4)); return; }
      return boxLine('ex', 'ex', 'ตัวอย่าง', l.slice(4));
    }
    if (cs && (m = l.match(/^(th|an): (.*)$/))) {
      if (m[1] === 'th') { if (cs === 'q') { h += '</div><div class="exth"><b class="t">คิดอย่างไร</b><ol>'; cs = 'th'; } h += '<li>' + inl(m[2]) + '</li>'; return; }
      if (cs === 'th') h += '</ol></div>'; else if (cs === 'q') h += '</div>';
      if (cs !== 'an') { h += '<div class="exan"><b class="t">คำตอบ</b>' + inl(m[2]); cs = 'an'; } else h += '<br>' + inl(m[2]);
      return;
    }
    if ((m = l.match(/^fl: ([^|]+?)(?:\s*\|\s*(.*))?$/))) { if (!fl) { close(); h += '<ol class="flow">'; } fl++; h += '<li><span class="n">' + fl + '</span><div><b>' + inl(m[1]) + '</b>' + (m[2] ? '<span>' + inl(m[2]) + '</span>' : '') + '</div></li>'; return; }
    if (/^[•\-] /.test(l)) { if (tb || box || cs || fl) close(); if (!ul) { h += '<ul>'; ul = true; } h += '<li>' + inl(l.slice(2)) + '</li>'; return; }
    if (l[0] === '|') { if (ul || box || cs || fl) close(); (tb = tb || []).push(l.replace(/^\||\|$/g, '').split('|').map(c => c.trim())); return; }
    close();
    if ((m = l.match(/^>> ([^|]+)\|([^|]*)\|(.+)$/))) { h += '<p class="lnk">อ่านต่อในสรุปเนื้อหา: <a target="_blank" rel="noopener" href="?sum=' + encodeURIComponent(m[1].trim() + '|' + m[2].trim() + '|' + m[3].trim()) + '">' + esc(m[1].trim()) + (m[2].trim() ? ' · ' + esc(m[2].trim()) : '') + ' · ' + esc(m[3].trim()) + '</a></p>'; return; }
    if (l.startsWith('## ')) {
      cur = l.slice(3).trim(); hn++;
      h += '<h3' + (ctx.pre ? ' id="' + ctx.pre + '-' + hn + '"' : '') + '>' + inl(cur) + '</h3>';
      const ex = (ctx.exams || {})[cur];
      if (ex && ex.length) h += '<p class="seen"><b class="t">ข้อสอบจริงที่เคยออก</b> ' + ex.map(esc).join(' · ') + '</p>';
    }
    else if (l.startsWith('= ')) h += '<div class="eq">' + l.slice(2).split(/\s{2,}/).map(x => '<span class="e">' + inl(x) + '</span>').join('') + '</div>';
    else if ((m = l.match(/^\[\[fig:([\w-]+)(?:\|(.*))?\]\]$/)) && figOf(m[1])) h += '<figure data-fig="1">' + figOf(m[1]) + '<button type="button" class="figtip noprint">แตะภาพเพื่อขยายเต็มจอ · หมุนจอแนวนอนได้</button>' + (m[2] ? '<figcaption>' + inl(m[2]) + '</figcaption>' : '') + '</figure>';
    else if ((m = l.match(/^\[\[img:(https:\/\/[^|\]\s]+)(?:\|(.*))?\]\]$/))) h += '<figure><img src="' + esc(m[1]) + '" alt="' + esc(m[2] || 'ภาพประกอบ') + '">' + (m[2] ? '<figcaption>' + inl(m[2]) + '</figcaption>' : '') + '</figure>';
    else h += '<p>' + inl(l) + '</p>';
  });
  close(); return h;
}

/* แผนผังความคิดของมาตรฐาน (สร้างอัตโนมัติจากหัวข้อ @@ ในไฟล์สรุป) เรียงแนวตั้ง: ชื่อมาตรฐาน → กลุ่มตามความถี่ที่ข้อสอบออก → หัวข้อ · กดหัวข้อ = เลื่อนไปส่วนนั้น
   notes = [{indicator,title,content}] · count(indicator) = จำนวนข้อสอบจริงในคลัง · เฉพาะหัวข้อที่มีตัวชี้วัด (ไม่รวมสรุปย่อ) */
function mindMap(std, name, notes, count) {
  const bands = [['ออกบ่อย (4 ข้อขึ้นไป)', n => n >= 4, 'b1'], ['ออกบ้าง (2–3 ข้อ)', n => n >= 2 && n <= 3, 'b2'], ['ออกนาน ๆ ครั้ง (1 ข้อ)', n => n === 1, 'b3'], ['ยังไม่เคยออก (ย่อไว้)', n => n === 0, 'b4']];
  const items = notes.map((n, i) => ({ i, n, p: titleParts(n.title), c: count(n.indicator) })).filter(x => x.n.indicator);
  let h = '<nav class="mm" aria-label="แผนผังความคิด"><div class="mm-root"><b>' + esc(std) + '</b> ' + esc(name || '') + '<span>แตะหัวข้อเพื่อเลื่อนไปอ่าน</span></div>';
  bands.forEach(([label, test, cls]) => {
    const g = items.filter(x => test(x.c)); if (!g.length) return;
    h += '<div class="mm-g ' + cls + '"><div class="mm-h">' + label + ' · ' + g.length + ' หัวข้อ</div><ul>' +
      g.map(x => '<li><button type="button" data-a="goto" data-id="s' + x.i + '"><span class="tag">' + esc(x.n.indicator) + '</span><span class="mm-t" title="' + esc(x.p.name) + '">' + esc(x.p.name.split(':')[0]) + '</span><span class="mm-n">' + (x.c ? x.c + ' ข้อ' : 'ไม่มี') + '</span></button></li>').join('') + '</ul></div>';
  });
  return h + '</nav>';
}

/* ตัวอักษรในภาพ SVG ต้องไม่เล็กกว่า 12 px บนหน้าจอจริง: ภาพส่วนใหญ่กว้าง 360 หน่วยแต่ถูกย่อให้พอดีจอมือถือ ตัวหนังสือเลยเหลือ 7–9 px
   ภาพที่เล็กเกินไปจะถูกขยายให้กว้างพอ (ตัวอักษรเล็กสุดเท่ากับ 11 px) แล้วเลื่อนดูซ้าย-ขวาในกรอบ แทนการบีบตัวอักษรให้ทับกัน */
const MIN_SVG_TEXT = 12;
function fitFigures(root) {
  (root || document).querySelectorAll('figure svg').forEach(svg => {
    const fig = svg.closest('figure'), vb = (svg.getAttribute('viewBox') || '').split(/\s+/).map(Number);
    if (vb.length < 4 || !vb[2]) return;
    let wrap = fig.querySelector('.figscroll');
    if (!wrap) { wrap = document.createElement('div'); wrap.className = 'figscroll'; svg.replaceWith(wrap); wrap.appendChild(svg); }
    svg.style.width = ''; svg.style.maxWidth = '';
    const texts = [...svg.querySelectorAll('text')].filter(t => t.textContent.trim());
    if (!texts.length) return;
    const minFs = Math.min(...texts.map(t => parseFloat(getComputedStyle(t).fontSize) || 11));
    const need = Math.ceil(vb[2] * MIN_SVG_TEXT / minFs), have = wrap.clientWidth || fig.clientWidth || 0;
    if (have && need > have) { svg.style.width = need + 'px'; svg.style.maxWidth = 'none'; wrap.classList.add('wide'); }
    else wrap.classList.remove('wide');
  });
}

/* แตะภาพ SVG → เปิดเต็มจอ: ภาพกว้างเท่าจอหรือกว้างพอให้ตัวอักษรเล็กสุด ≥ 11 px (เลื่อนดูได้) · ซูมสองนิ้วได้ · หมุนจอเป็นแนวนอนแล้วภาพขยายตามอัตโนมัติ */
function openFig(fig) {
  closeFig();
  const src = fig.querySelector('svg'); if (!src) return;
  const v = document.createElement('div'); v.id = 'figview'; v.setAttribute('role', 'dialog'); v.setAttribute('aria-label', 'ภาพขยายเต็มจอ');
  const cap = fig.querySelector('figcaption');
  v.innerHTML = '<div class="fv-bar"><button class="btn sm" data-a="figclose">ปิด</button><span class="small">' + (cap ? esc(cap.textContent) : 'ภาพประกอบ') + ' · ซูมสองนิ้วได้</span></div><div class="fv-box"></div>';
  const svg = src.cloneNode(true); svg.removeAttribute('style'); v.querySelector('.fv-box').appendChild(svg);
  document.body.appendChild(v); document.body.classList.add('fv-open');
  const fit = () => {
    const vb = svg.getAttribute('viewBox').split(/\s+/).map(Number), texts = [...svg.querySelectorAll('text')].filter(t => t.textContent.trim());
    const minFs = texts.length ? Math.min(...texts.map(t => parseFloat(getComputedStyle(t).fontSize) || 11)) : 11;
    const w = Math.max(v.querySelector('.fv-box').clientWidth - 16, Math.ceil(vb[2] * MIN_SVG_TEXT / minFs));
    svg.style.width = w + 'px'; svg.style.maxWidth = 'none';
  };
  fit(); window.__fvfit = fit; window.addEventListener('resize', fit); window.addEventListener('orientationchange', fit);
}
function closeFig() { const v = document.getElementById('figview'); if (v) v.remove(); document.body.classList.remove('fv-open'); window.removeEventListener('resize', window.__fvfit || (() => {})); }
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeFig(); });

/* ---------- รูปข้อสอบเต็มจอ: แตะรูปเพื่อเปิด · ซูมสองนิ้ว (หรือปุ่ม + − / ล้อเมาส์) · ลากเลื่อนเมื่อซูม · แตะครั้งเดียวเพื่อปิด ---------- */
function openImg(img) {
  closeFig();
  const v = document.createElement('div'); v.id = 'figview'; v.className = 'imgv'; v.setAttribute('role', 'dialog'); v.setAttribute('aria-modal', 'true'); v.setAttribute('aria-label', 'รูปข้อสอบเต็มจอ');
  v.innerHTML = '<div class="fv-bar"><button class="btn sm" data-a="figclose">ปิด</button><button class="btn sm zb" data-z="1.5" aria-label="ขยาย">+</button><button class="btn sm zb" data-z="0.667" aria-label="ย่อ">−</button><span class="small">ซูมสองนิ้วได้ · แตะรูปเพื่อปิด</span></div><div class="fv-box iv"><img alt="' + esc(img.alt || 'รูปข้อสอบ') + '" src="' + esc(img.currentSrc || img.src) + '" draggable="false"></div>';
  document.body.appendChild(v); document.body.classList.add('fv-open');
  const box = v.querySelector('.iv'), im = box.querySelector('img'), P = new Map();
  let tapOk = false, sc = 1, tx = 0, ty = 0, start = null, moved = false, multi = false, pinch = null;
  const clamp = () => { sc = Math.min(6, Math.max(1, sc)); if (sc === 1) { tx = ty = 0; } const mx = (im.clientWidth * (sc - 1)) / 2, my = (im.clientHeight * (sc - 1)) / 2; tx = Math.max(-mx, Math.min(mx, tx)); ty = Math.max(-my, Math.min(my, ty)); };
  const draw = () => { clamp(); im.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + sc + ')'; v.dataset.scale = sc.toFixed(2); };
  const zoomAt = (f, cx, cy) => { const r = box.getBoundingClientRect(), ox = cx - (r.left + r.width / 2) - tx, oy = cy - (r.top + r.height / 2) - ty, n = Math.min(6, Math.max(1, sc * f)), k = n / sc; tx -= ox * (k - 1); ty -= oy * (k - 1); sc = n; draw(); };
  box.addEventListener('pointerdown', e => { if (e.isPrimary) { P.clear(); pinch = null; } box.setPointerCapture(e.pointerId); P.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (P.size === 1) { start = { x: e.clientX, y: e.clientY, t: Date.now(), tx, ty }; moved = false; multi = false; } if (P.size === 2) { multi = true; const [a, b] = [...P.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), sc }; } });
  box.addEventListener('pointermove', e => {
    if (!P.has(e.pointerId)) return; P.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (P.size === 2 && pinch) { const [a, b] = [...P.values()], d = Math.hypot(a.x - b.x, a.y - b.y); zoomAt((pinch.sc * d / pinch.d) / sc, (a.x + b.x) / 2, (a.y + b.y) / 2); moved = true; return; }
    if (P.size === 1 && start) { const dx = e.clientX - start.x, dy = e.clientY - start.y; if (Math.abs(dx) + Math.abs(dy) > 8) moved = true; if (sc > 1) { tx = start.tx + dx; ty = start.ty + dy; draw(); } }
  });
  const up = e => { P.delete(e.pointerId); if (P.size < 2) pinch = null; if (P.size === 0) { tapOk = !!(start && !moved && !multi && Date.now() - start.t < 400); start = null; } else if (P.size === 1) { const [p] = [...P.values()]; start = { x: p.x, y: p.y, t: 0, tx, ty }; } };
  box.addEventListener('pointerup', up); box.addEventListener('pointercancel', up);
  box.addEventListener('click', e => { e.stopPropagation(); e.preventDefault(); if (tapOk) closeFig(); tapOk = false; }); // ปิดตอน click (หลังยกนิ้ว) กันคลิกทะลุไปเปิดรูปซ้ำ
  box.addEventListener('wheel', e => { e.preventDefault(); zoomAt(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX, e.clientY); }, { passive: false });
  v.querySelectorAll('.zb').forEach(b => b.addEventListener('click', () => { const r = box.getBoundingClientRect(); zoomAt(+b.dataset.z, r.left + r.width / 2, r.top + r.height / 2); }));
  v.querySelector('[data-a=figclose]').focus();
  draw();
}
document.addEventListener('click', e => { const im = e.target.closest && e.target.closest('img.qimg'); if (im && !im.closest('#figview')) { e.preventDefault(); openImg(im); } });
document.addEventListener('keydown', e => { const im = e.target.closest && e.target.closest('img.qimg'); if (im && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openImg(im); } });
