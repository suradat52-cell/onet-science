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
function rich(t) {
  let h = '', ul = false, tb = false, box = '';
  const close = () => { if (ul) { h += '</ul>'; ul = false; } if (tb) { h += '</table></div>'; tb = false; } if (box) { h += '</div>'; box = ''; } };
  // บรรทัดติดกันที่ขึ้นต้นเหมือนกัน (ex: / !! / ??) รวมเป็นกล่องเดียว
  const boxLine = (kind, cls, title, text) => { if (box !== kind) { close(); box = kind; h += '<div class="box ' + cls + '"><b class="t">' + title + '</b>'; } else h += '<br>'; h += inl(text); };
  String(t).split(/\r?\n/).forEach(raw => {
    const l = raw.trim(); let m;
    if (!l) return close();
    if (l.startsWith('!! ')) return boxLine('!!', 'key', 'จำให้แม่น', l.slice(3));
    if (l.startsWith('?? ')) return boxLine('??', 'tip', 'ข้อสอบชอบถาม', l.slice(3));
    if (l.startsWith('ex: ')) return boxLine('ex', 'ex', 'ตัวอย่าง', l.slice(4));
    if (l.startsWith('xx: ')) return boxLine('xx', 'tip', 'จุดที่มักพลาด', l.slice(4));
    if (l.startsWith('ob: ')) return boxLine('ob', 'warn', 'ข้อสังเกต (ควรตรวจกับครู)', l.slice(4));
    if (/^[•\-] /.test(l)) { if (tb || box) close(); if (!ul) { h += '<ul>'; ul = true; } h += '<li>' + inl(l.slice(2)) + '</li>'; return; }
    if (l[0] === '|') { if (ul || box) close(); if (!tb) { h += '<div class="scroll"><table>'; tb = true; } h += '<tr>' + l.replace(/^\||\|$/g, '').split('|').map(c => '<td>' + inl(c.trim()) + '</td>').join('') + '</tr>'; return; }
    close();
    if ((m = l.match(/^>> ([^|]+)\|([^|]*)\|(.+)$/))) { h += '<p class="lnk">อ่านต่อในสรุปเนื้อหา: <a target="_blank" rel="noopener" href="?sum=' + encodeURIComponent(m[1].trim() + '|' + m[2].trim() + '|' + m[3].trim()) + '">' + esc(m[1].trim()) + (m[2].trim() ? ' · ' + esc(m[2].trim()) : '') + ' · ' + esc(m[3].trim()) + '</a></p>'; return; }
    if (l.startsWith('## ')) h += '<h3>' + inl(l.slice(3)) + '</h3>';
    else if (l.startsWith('= ')) h += '<div class="eq">' + l.slice(2).split(/\s{2,}/).map(x => '<span class="e">' + inl(x) + '</span>').join('') + '</div>';
    else if ((m = l.match(/^\[\[fig:([\w-]+)(?:\|(.*))?\]\]$/)) && figOf(m[1])) h += '<figure data-fig="1" tabindex="0" role="button" aria-label="แตะเพื่อขยายภาพเต็มจอ">' + figOf(m[1]) + '<div class="figtip noprint">แตะภาพเพื่อขยายเต็มจอ · หมุนจอแนวนอนได้</div>' + (m[2] ? '<figcaption>' + inl(m[2]) + '</figcaption>' : '') + '</figure>';
    else if ((m = l.match(/^\[\[img:(https:\/\/[^|\]\s]+)(?:\|(.*))?\]\]$/))) h += '<figure><img src="' + esc(m[1]) + '" alt="' + esc(m[2] || 'ภาพประกอบ') + '">' + (m[2] ? '<figcaption>' + inl(m[2]) + '</figcaption>' : '') + '</figure>';
    else h += '<p>' + inl(l) + '</p>';
  });
  close(); return h;
}

/* ตัวอักษรในภาพ SVG ต้องไม่เล็กกว่า 11 px บนหน้าจอจริง: ภาพส่วนใหญ่กว้าง 360 หน่วยแต่ถูกย่อให้พอดีจอมือถือ ตัวหนังสือเลยเหลือ 7–9 px
   ภาพที่เล็กเกินไปจะถูกขยายให้กว้างพอ (ตัวอักษรเล็กสุดเท่ากับ 11 px) แล้วเลื่อนดูซ้าย-ขวาในกรอบ แทนการบีบตัวอักษรให้ทับกัน */
const MIN_SVG_TEXT = 11;
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
