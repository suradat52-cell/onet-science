/* พิมพ์เล่มติว (สำหรับแอดมินกลาง/แอดมินโรงเรียน): เล่ม 1 = สรุปแต่ละมาตรฐาน ตามด้วยโจทย์คัดของมาตรฐานนั้น · เล่ม 2 = เฉลย
   ประกอบในเบราว์เซอร์จากไฟล์เนื้อหา แล้วสั่งพิมพ์/บันทึกเป็น PDF (A4 สองคอลัมน์ พื้นขาว) · ใส่ชื่อโรงเรียนบนปกได้
   เกณฑ์คัด (ให้เล่ม 1 ไม่เกิน 100 หน้า): สรุปเฉพาะหัวข้อที่เคยออกสอบ — ออกบ่อยได้เนื้อหาเต็ม ออกน้อยได้เฉพาะ แนวคิดหลัก/จำให้แม่น/กับดัก ·
   โจทย์: ทุกตัวชี้วัดที่เคยออกได้อย่างน้อย 1 ข้อ แล้วเติมข้อของตัวชี้วัดที่ออกบ่อยจากปีล่าสุดจนครบโควตา (BOOK_CFG.qMax) */
const BOOK_CFG = {
  P6: { qMax: 400, full: 2 },  // 400 = ใส่ทุกข้อที่เคยออก (ป.6 มี 171 ข้อ) ยังได้ไม่ถึง 100 หน้า  // full = ตัวชี้วัดที่มีข้อสอบจริงตั้งแต่กี่ข้อขึ้นไปจึงได้สรุปเต็ม
  M3: { qMax: 100, full: 3 }
};
const BOOK_YEARS = lv => ({ P6: 'ปีการศึกษา 2561–2568', M3: 'ปีการศึกษา 2561–2568' }[lv]);

/* สรุปแบบย่อ: เก็บหัวข้อ ## + บรรทัด kc: !! tr: (ตัดตาราง ตัวอย่าง ภาพ ผังขั้นตอน) */
const bookCompact = txt => String(txt).split('\n').filter(l => { const t = l.trim(); return t.startsWith('## ') || /^(kc|tr):\s/.test(t) || t.startsWith('!! '); }).join('\n');

/* เล่มพิมพ์ไม่เอาตัวอย่างคำนวณหลายขั้น: ตัด ex: ที่ตามด้วย th:/an: และ ex: ที่เป็นสมการตัวเลขยาว (สูตรสั้น ๆ ในกล่อง = ยังอยู่) */
function bookStrip(txt) {
  const L = String(txt).split('\n'), out = [];
  for (let i = 0; i < L.length; i++) {
    const t = L[i].trim();
    if (/^(th|an):\s/.test(t)) continue;
    if (/^ex:\s/.test(t)) { const nx = (L.slice(i + 1).find(x => x.trim()) || '').trim(); if (/^(th|an):\s/.test(nx)) continue; if ((t.match(/[0-9]/g) || []).length >= 5 && /[×÷=+]/.test(t)) continue; }
    out.push(L[i]);
  }
  return out.join('\n');
}
const bkPlain = t => String(t).replace(/\*\*/g, '').replace(/\{([^{}\/]+)\/([^{}\/]+)\}/g, '$1/$2').replace(/\s+/g, ' ').trim();
const bkWords = (t, w) => { const seg = typeof Intl !== 'undefined' && Intl.Segmenter ? [...new Intl.Segmenter('th', { granularity: 'word' }).segment(t)].map(x => x.segment) : t.split(''); const lines = []; let cur = ''; seg.forEach(x => { if ((cur + x).length > w && cur) { lines.push(cur.trim()); cur = x; } else cur += x; }); if (cur.trim()) lines.push(cur.trim()); return lines; };
const BK_COLORS = [['#dbeafe', '#1d4ed8'], ['#dcfce7', '#15803d'], ['#fef3c7', '#b45309'], ['#fce7f3', '#be185d'], ['#ede9fe', '#6d28d9'], ['#ccfbf1', '#0f766e'], ['#ffedd5', '#c2410c'], ['#e0e7ff', '#4338ca']];
/* แผนที่ความคิดของมาตรฐาน (SVG หน้าเต็ม): กลาง = มาตรฐาน · กิ่ง = หัวข้อที่เคยออกสอบ (ดาวบอกความถี่) · ใต้ชื่อ = คำสำคัญจากแนวคิดหลัก */
function bookMap(std, name, topics) {
  const n = topics.length; if (!n) return '';
  const L = Math.ceil(n / 2), R = n - L, rows = Math.max(L, R), NH = 84, H = Math.max(500, rows * NH + 40), cx = 340, cy = H / 2, NW = 238;
  let svg = '<svg class="bk-svg" viewBox="0 0 680 ' + H + '" role="img" aria-label="แผนที่ความคิด ' + esc(std) + '">';
  const node = (t, i, side) => {
    const k = side === 'L' ? i : i - L, cnt = side === 'L' ? L : R, y = (H / cnt) * (k + .5), x = side === 'L' ? 6 : 680 - 6 - NW, col = BK_COLORS[i % BK_COLORS.length], stars = t.c >= 6 ? '★★★' : t.c >= 3 ? '★★' : '★';
    const ex = side === 'L' ? x + NW : x, path = 'M' + (side === 'L' ? cx - 96 : cx + 96) + ' ' + cy + ' C' + (side === 'L' ? cx - 150 : cx + 150) + ' ' + cy + ' ' + (side === 'L' ? ex + 54 : ex - 54) + ' ' + y + ' ' + ex + ' ' + y;
    const lines = bkWords(t.name, 24).slice(0, 2), kw = t.kw.slice(0, 3);
    let g = '<path d="' + path + '" fill="none" stroke="' + col[1] + '" stroke-width="3" stroke-linecap="round" opacity=".75"/>';
    g += '<rect x="' + x + '" y="' + (y - 36) + '" width="' + NW + '" height="72" rx="12" fill="' + col[0] + '" stroke="' + col[1] + '" stroke-width="1.6"/>';
    lines.forEach((l, j) => { g += '<text x="' + (x + 10) + '" y="' + (y - 14 + j * 15) + '" font-size="13" font-weight="700" fill="#111">' + esc(l) + '</text>'; });
    g += '<text x="' + (x + NW - 8) + '" y="' + (y - 17) + '" font-size="12" text-anchor="end" fill="' + col[1] + '">' + stars + '</text>';
    const ky = y - 14 + lines.length * 15 + 1; if (kw.length) g += '<text x="' + (x + 10) + '" y="' + ky + '" font-size="11.5" fill="#333">' + esc(bkWords(kw.join(' · '), 34)[0] || '') + '</text>';
    g += '<text x="' + (x + 10) + '" y="' + (y + 31) + '" font-size="11" fill="' + col[1] + '">' + esc(t.ind) + ' · ออกสอบ ' + t.c + ' ข้อ</text>';
    return g;
  };
  topics.forEach((t, i) => { svg += node(t, i, i < L ? 'L' : 'R'); });
  const nm = bkWords(name || '', 14);
  svg += '<ellipse cx="' + cx + '" cy="' + cy + '" rx="96" ry="52" fill="#3730a3"/><text x="' + cx + '" y="' + (cy - 8) + '" text-anchor="middle" font-size="17" font-weight="700" fill="#fff">' + esc(std) + '</text>';
  nm.slice(0, 2).forEach((l, j) => { svg += '<text x="' + cx + '" y="' + (cy + 12 + j * 16) + '" text-anchor="middle" font-size="13" fill="#e0e7ff">' + esc(l) + '</text>'; });
  return svg + '</svg>';
}
/* ตารางสรุปก่อนสอบ: หัวข้อ | จำให้แม่น | กับดัก (ดึงจากกล่อง !! และ tr: ของแต่ละหัวข้อ) */
function bookCheat(std, topics) {
  // การ์ดสรุปก่อนสอบ: หัวการ์ดสีตามหัวข้อ + ดาวความถี่ · 1 บรรทัด "จำ" + 1 บรรทัด "กับดัก" (ตัดให้สั้น) · มีภาพย่อของหัวข้อถ้ามี
  const short = (x, n) => { const p = bkPlain(x); if (p.length <= n) return x; const cut = bkWords(p, n)[0]; return cut + '…'; };
  const rows = topics.map((t, i) => {
    const lines = String(t.content).split('\n').map(x => x.trim()), pick = re => lines.filter(l => re.test(l)).map(l => l.replace(re, '').trim()).filter(x => bkPlain(x).length > 6);
    const keep = (pick(/^!!\s/)[0] || pick(/^kc:\s/)[0] || ''), trap = pick(/^tr:\s/)[0] || '', ask = pick(/^\?\?\s/)[0] || '';
    if (!keep && !trap && !ask) return '';
    const fm = /\[\[fig:([\w-]+)/.exec(t.content), fig = t.c >= 3 && fm && figOf(fm[1]), col = BK_COLORS[i % BK_COLORS.length], stars = t.c >= 6 ? '★★★' : t.c >= 3 ? '★★' : '★';
    const row = (cls, ic, lab, x, n) => x ? '<div class="bk-r ' + cls + '"><span class="bk-ic">' + ic + '</span><div><span class="bk-lb">' + lab + '</span>' + inl(short(x, n)) + '</div></div>' : '';
    return '<div class="bk-cc" style="--c1:' + col[0] + ';--c2:' + col[1] + '"><div class="bk-cct"><span class="bk-ind">' + esc(t.ind) + '</span><span class="bk-nm">' + esc(t.name) + '</span><span class="bk-st">' + stars + '</span></div>' +
      '<div class="bk-cb' + (fig ? ' hasfig' : '') + '"><div>' + row('k', '✔', 'จำให้แม่น', keep, 95) + row('t', '!', 'กับดัก', trap, 85) + (!trap ? row('a', '?', 'ข้อสอบมักถาม', ask, 85) : '') + '</div>' + (fig ? '<div class="bk-thumb">' + fig + '</div>' : '') + '</div></div>';
  }).filter(Boolean).join('');
  return rows ? '<h3 class="bk-qh bk-ch">⭐ สรุปก่อนสอบ ' + esc(std) + '</h3>' + rows : '';
}

/* เลือกโจทย์: ครอบคลุมทุกตัวชี้วัดที่เคยออก (1 ข้อ/ตัวชี้วัด จากปีล่าสุด) แล้วเติมของตัวชี้วัดที่ออกบ่อยจนครบโควตา */
function bookPick(lv, m, byKey, budget) {
  const picks = [], seen = new Set(), stdOrder = m.summaries.slice();
  const slots = [];
  for (const std of stdOrder) {
    const asked = (m.asked || {})[std] || {};
    for (const ind of Object.keys(asked).sort()) {
      const keys = (m.pool[std + '|' + ind] || []).filter(k => byKey[k]);   // pool เรียงปีล่าสุดก่อนอยู่แล้ว
      if (keys.length) slots.push({ std, ind, keys, freq: keys.length });
    }
  }
  const take = (s, i) => { const k = s.keys[i]; if (k && !seen.has(k)) { seen.add(k); picks.push(k); return true; } return false; };
  slots.forEach(s => { let i = 0; while (i < s.keys.length && !take(s, i)) i++; });
  // รอบเติม: เรียงตัวชี้วัดที่ออกบ่อยก่อน ทีละข้อ (เลือกคนละปีกับที่มีแล้วก่อน)
  const order = slots.slice().sort((a, b) => b.freq - a.freq || a.ind.localeCompare(b.ind));
  for (let round = 0; picks.length < budget && round < 6; round++) {
    for (const s of order) {
      if (picks.length >= budget) break;
      if (s.freq <= 1 + round) continue;
      const have = new Set(picks.filter(k => s.keys.includes(k)).map(k => k.split('/')[0]));
      const k = s.keys.find(x => !seen.has(x) && !have.has(x.split('/')[0])) || s.keys.find(x => !seen.has(x));
      if (k) { seen.add(k); picks.push(k); }
    }
  }
  // ข้อที่ใช้บทอ่านร่วมกัน (เช่น "ใช้ตอบข้อ 27–28") ต้องมาครบทั้งกลุ่ม
  const grp = q => { const m2 = /(?:ข้อ\s*)(\d+)\s*[-–]\s*(\d+)/.exec(String(q.stem).slice(0, 80)); return m2 ? q.examYear + ':' + m2[1] + '-' + m2[2] : ''; };
  new Set(picks.map(k => grp(byKey[k])).filter(Boolean)).forEach(g => Object.keys(byKey).forEach(k => { if (grp(byKey[k]) === g && !seen.has(k)) { seen.add(k); picks.push(k); } }));
  const rank = {}; stdOrder.forEach((s, i) => { rank[s] = i; });
  return picks.map(k => byKey[k]).sort((a, b) => rank[a.standard] - rank[b.standard] || (a.indicator || '').localeCompare(b.indicator || '') || (+b.examYear - +a.examYear) || (+a.itemNo - +b.itemNo));
}

const BK_MM = 0.127, BK_COL = 86, BK_SIDE = 100, BK_FULL = 172, BK_MAXH = 80; // มม. ต่อพิกเซล · กว้างคอลัมน์ · กว้างเต็มหน้า · สูงสุดของรูป
function bookImgSize(src) { return new Promise(res => { const i = new Image(); i.onload = () => res({ w: i.naturalWidth, h: i.naturalHeight }); i.onerror = () => res(null); i.src = src; }); }
const bookW = z => z ? Math.min(BK_FULL, z.w * BK_MM, z.h ? BK_MAXH * z.w / z.h : 1e9) : 0; // ความกว้างที่จะแสดง (มม.)
/* โจทย์หนึ่งข้อ (ย่อ): เลขข้อในเล่ม · ที่มา (ปี/ข้อ) · โจทย์ · ภาพ · ตัวเลือก */
function bookQ(q, n, z) {
  const src = imgSrc(q.imageUrl), wmm = bookW(z), wide = wmm > BK_COL, side = wide && wmm <= BK_SIDE, tag = '<span class="bq-src">O-NET ' + esc(q.examYear) + ' ข้อ ' + esc(q.itemNo) + ' · ' + esc(q.indicator) + '</span>';
  let body = '';
  if (q.type === 'complex') body = '<table class="bq-cx">' + q.choices.map((c, k) => '<tr><td class="k">' + (k + 1) + '</td><td>' + cell(c) + '</td><td class="yn">☐ ใช่ ☐ ไม่ใช่</td></tr>').join('') + '</table>';
  else if (q.type === 'order') body = '<div class="bq-ord">' + q.choices.map((c, j) => '<span>' + (j + 1) + ') ' + fmt(c) + '</span>').join('') + '<div>ลำดับ: …………………………</div></div>';
  else if (q.type === 'fill') body = '<div>คำตอบ ………………………………</div>';
  else if (!q.choices.length) body = '<div class="bq-pick">ตอบ ☐ 1 &nbsp; ☐ 2 &nbsp; ☐ 3 &nbsp; ☐ 4 (ตัวเลือกอยู่ในภาพ)</div>';
  else { const short = q.choices.every(c => plain(c).length <= 26 && !/\.(png|jpe?g|webp|gif)/i.test(c)); body = '<ol class="bq-ch' + (short ? ' two' : '') + '">' + q.choices.map((c, j) => '<li><b>' + (j + 1) + '</b> ' + (/\.(png|jpe?g|webp|gif)$/i.test(String(c).trim()) ? '<img class="subimg" src="' + esc(imgSrc(c)) + '" alt="ตัวเลือก ' + (j + 1) + '">' : fmt(c)) + '</li>').join('') + '</ol>'; }
  const im = src ? '<img class="bq-img" style="width:' + (wmm ? wmm.toFixed(1) + 'mm' : 'auto') + '" src="' + esc(src) + '" alt="ภาพประกอบข้อ ' + n + '">' : '';
  if (side) return '<div class="bq wide side"><div class="bq-h"><b class="bq-n">' + n + '</b>' + tag + '</div><div class="bq-sd"><div><div class="bq-stem">' + fmt(q.stem) + '</div>' + body + '</div>' + im + '</div></div>';
  return '<div class="bq' + (wide ? ' wide' : '') + '"><div class="bq-h"><b class="bq-n">' + n + '</b>' + tag + '</div><div class="bq-stem">' + fmt(q.stem) + '</div>' + im + body + '</div>';
}

/* ประกอบเล่ม: kind = 'main' (สรุป + โจทย์) | 'ans' (เฉลย) */
async function bookBuild(lv, school, kind, logo) {
  logo = logo !== undefined ? logo : (typeof store !== 'undefined' ? store.get('bklogo') : '') || '';
  const prevLv = S.level; S.level = lv;
  try {
    await loadFigs(lv);
    const m = await cj(lv + '/meta.json'), cfg = BOOK_CFG[lv], years = Object.keys(m.bankYears);
    const all = (await Promise.all(years.map(y => cj(`${lv}/q-${y}.json`)))).flat(), byKey = {}; all.forEach(q => { byKey[qkey(q)] = q; });
    const picked = bookPick(lv, m, byKey, cfg.qMax), size = {};
    await Promise.all(picked.map(async q => { const u = imgSrc(q.imageUrl); if (u) size[qkey(q)] = await bookImgSize(u); }));
    const wideOf = q => { const w = bookW(size[qkey(q)]); return w > BK_SIDE ? 2 : w > BK_COL ? 1 : 0; }, rk = {}; m.summaries.forEach((x, i) => { rk[x] = i; });
    const picks = picked.map((q, i) => ({ q, i })).sort((a, b) => rk[a.q.standard] - rk[b.q.standard] || wideOf(b.q) - wideOf(a.q) || a.i - b.i).map(x => x.q), num = {};
    picks.forEach((q, i) => { num[qkey(q)] = i + 1; });
    const by = {}; picks.forEach(q => { (by[q.standard] = by[q.standard] || []).push(q); });
    const title = (kind === 'ans' ? 'เฉลย' : 'สรุปเนื้อหา + โจทย์') + ' O-NET วิทยาศาสตร์ ' + LV[lv];
    const cover = '<section class="bk-cover"><div class="bk-logo">' + (logo ? '<img src="' + esc(logo) + '" alt="โลโก้โรงเรียน">' : BRAND) + '</div><div class="bk-sch">' + esc(school || '') + '</div><h1>' + (kind === 'ans' ? 'เฉลย' : 'ติวสอบ O-NET วิทยาศาสตร์') + '</h1><div class="bk-lv">ชั้น' + (lv === 'P6' ? 'ประถมศึกษาปีที่ 6' : 'มัธยมศึกษาปีที่ 3') + '</div><div class="bk-sub">' + (kind === 'ans' ? 'เฉลยโจทย์ข้อสอบจริงที่คัดไว้ในเล่ม “สรุปเนื้อหา + โจทย์” (' + picks.length + ' ข้อ)' : 'สรุปเนื้อหาตามมาตรฐาน พร้อมโจทย์ข้อสอบจริงคัดข้อ ' + picks.length + ' ข้อ') + '</div><div class="bk-meta">โจทย์ข้อสอบ O-NET ' + BOOK_YEARS(lv) + '<br>ใช้เพื่อการศึกษา · ที่มาของข้อสอบ: สถาบันทดสอบทางการศึกษาแห่งชาติ (สทศ.)<br>ฝึกข้อสอบเพิ่มเติมและดูเฉลยละเอียดได้ที่เว็บติว O-NET</div></section>';
    let html;
    if (kind === 'ans') {
      const ks = {}, ss = {};
      await Promise.all(years.map(async y => { ks[y] = await cj(`${lv}/k-${y}.json`); ss[y] = (await cj(`${lv}/s-${y}.json`, true)) || {}; }));
      const ansTxt = q => { const e = ks[q.examYear][q.itemNo] || {}, a = String(e.a || ''); return e.t === 'complex' ? a.split(',').map(x => x.split('|').map(v => v === 'ใช่' ? '✓' : '✗').join('/')).join(' ') : e.t === 'order' ? a.split(',').join(' → ') : a.split('|').join(' หรือ '); };
      html = cover + '<section class="bk-body"><h2 class="bk-band">เฉลยย่อ</h2><div class="bk-grid">' + picks.map(q => '<div><b>' + num[qkey(q)] + '</b> ' + esc(ansTxt(q)) + '</div>').join('') + '</div><p class="bk-note">ข้อเชิงซ้อน: ✓ = ใช่, ✗ = ไม่ใช่ เรียงตามข้อย่อย 1, 2, 3, …</p>' +
        '<h2 class="bk-band">เฉลยละเอียด</h2>' + picks.map(q => { const e = ks[q.examYear][q.itemNo] || {}, s = ss[q.examYear][q.itemNo]; return '<div class="bq bq-sol"><div class="bq-h"><b class="bq-n">' + num[qkey(q)] + '</b><span class="bq-src">ตอบ ' + esc(ansTxt(q)) + ' · O-NET ' + esc(q.examYear) + ' ข้อ ' + esc(q.itemNo) + '</span></div>' + (s ? '<div class="rich">' + rich(s.c) + '</div>' : e.e ? '<div class="bq-stem">' + fmt(e.e) + '</div>' : '') + '</div>'; }).join('') + '</section>';
    } else {
      const toc = '<section class="bk-toc"><h2 class="bk-band">สารบัญ</h2><ol>' + m.summaries.map(std => '<li><b>' + esc(std) + '</b> ' + esc(SHORT[std] || '') + ' <span>โจทย์ ' + ((by[std] || []).length) + ' ข้อ</span></li>').join('') + '</ol></section>';
      const parts = [];
      for (const std of m.summaries) {
        const sf = (await cj(lv + '/sum-' + std.replace(/^ว\s*/, '').trim() + '.json', true)) || [], cnt = k => Object.values(((m.asked || {})[std] || {})[k] || {}).reduce((a, b) => a + b, 0);
        const tops = sf.filter(n => n.content && n.indicator && cnt(n.indicator) > 0).map(n => { const p = titleParts(n.title), kcm = /(^|\n)kc:\s*(.*)/.exec(n.content), kw = kcm ? (kcm[2].match(/\*\*([^*]+)\*\*/g) || []).map(x => x.replace(/\*/g, '').trim()).filter(x => x.length <= 14) : []; return { ind: n.indicator, name: p.name, c: cnt(n.indicator), kw, content: n.content }; });
        const sums = sf.filter(n => n.content).map((n, i) => {
          const c = n.indicator ? cnt(n.indicator) : -1; if (c === 0) return '';
          const p = titleParts(n.title), full = c >= cfg.full, txt = bookStrip(full ? n.content : bookCompact(n.content));
          if (!txt.trim()) return '';
          return '<section class="topic bk-topic"><h3 class="th">' + (n.indicator ? '<span class="tag">' + esc(n.indicator) + '</span>' : '') + esc(p.name) + (c > 0 ? ' <span class="bk-c">ออกสอบ ' + c + ' ข้อ</span>' : '') + '</h3>' + rich(txt, { pre: '' }) + '</section>';
        }).join('');
        const map = bookMap(std, SHORT[std] || '', tops);
        parts.push('<h2 class="bk-band s-' + strandOf(std) + '">' + esc(std) + ' ' + esc(SHORT[std] || '') + '</h2>' + (map ? '<figure class="bk-map">' + map + '<figcaption>แผนที่ความคิด ' + esc(std) + ' · ดาว ★ = จำนวนข้อสอบจริงที่เคยออก (★ 1–2 ข้อ · ★★ 3–5 ข้อ · ★★★ 6 ข้อขึ้นไป) อ่านกิ่งที่มีดาวมากก่อน</figcaption></figure>' : '') + sums + bookCheat(std, tops) + ((by[std] || []).length ? '<h3 class="bk-qh">โจทย์ฝึก ' + esc(std) + '</h3>' + by[std].map(q => bookQ(q, num[qkey(q)], size[qkey(q)])).join('') : ''));
      }
      html = cover + toc + '<section class="bk-body">' + parts.join('') + '</section>';
    }
    const tmp = document.createElement('div'); tmp.innerHTML = html; // ตารางสั้น (≤ 8 แถว) ห้ามถูกหั่นข้ามคอลัมน์/หน้า
    tmp.querySelectorAll('.tw').forEach(w => { if (w.querySelectorAll('tr').length <= 8) w.classList.add('sm'); }); html = tmp.innerHTML;
    return { html, title, n: picks.length };
  } finally { S.level = prevLv; }
}

/* ย่อรูปเป็น JPEG ก่อนพิมพ์: Chrome ฝังรูป WebP ลง PDF แบบไม่บีบอัด ไฟล์ใหญ่หลายสิบ MB → แปลงเป็น JPEG (กว้างไม่เกิน 1000 px) เหลือไม่กี่ MB */
async function bookJpeg(root) {
  for (const im of root.querySelectorAll('img.bq-img,img.subimg')) {
    try {
      if (!im.naturalWidth) continue; const k = Math.min(1, 1000 / im.naturalWidth), c = document.createElement('canvas'); c.width = Math.round(im.naturalWidth * k); c.height = Math.round(im.naturalHeight * k);
      const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0, c.width, c.height); im.src = c.toDataURL('image/jpeg', 0.88);
      await im.decode().catch(() => {});
    } catch (e) { /* รูปจากโดเมนอื่น/ถอดรหัสไม่ได้: ใช้รูปเดิม */ }
  }
}
/* สั่งพิมพ์: วางเล่มในหน้า (ซ่อนบนจอ) → พิมพ์ → เก็บกวาด */
async function bookPrint(lv, school, kind) {
  toast('กำลังประกอบเล่ม… (เล่มหนา อาจใช้เวลาครู่หนึ่ง · แนะนำให้พิมพ์จากคอมพิวเตอร์)');
  const b = await bookBuild(lv, school, kind);
  let d = document.getElementById('bookdoc'); if (d) d.remove();
  d = document.createElement('div'); d.id = 'bookdoc'; d.innerHTML = b.html; document.body.appendChild(d);
  document.documentElement.style.setProperty('--bkhead', JSON.stringify((school ? school + ' · ' : '') + b.title));
  document.body.classList.add('print-book'); document.title = b.title + (school ? ' - ' + school : '');
  await Promise.all([...d.querySelectorAll('img')].map(i => { i.loading = 'eager'; return i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; }); }));
  await bookJpeg(d);
  if (typeof fitFigures === 'function') fitFigures(d);
  window.print();
  return b;
}
function bookCleanup() { const d = document.getElementById('bookdoc'); if (d) d.remove(); document.body.classList.remove('print-book'); }
window.addEventListener('afterprint', bookCleanup);

/* โลโก้โรงเรียน: เลือกไฟล์รูป → ย่อเหลือไม่เกิน 480 px เก็บในเครื่องนี้ (localStorage) ใช้บนปกทุกเล่ม · ไม่ส่งขึ้นเซิร์ฟเวอร์ */
function bookLogoLoad(file) {
  return new Promise((res, rej) => { const fr = new FileReader(); fr.onerror = () => rej(new Error('อ่านไฟล์รูปไม่ได้')); fr.onload = () => { const im = new Image(); im.onerror = () => rej(new Error('ไฟล์นี้ไม่ใช่รูปภาพ (ใช้ PNG หรือ JPG)')); im.onload = () => { const k = Math.min(1, 480 / Math.max(im.naturalWidth, im.naturalHeight)), c = document.createElement('canvas'); c.width = Math.round(im.naturalWidth * k); c.height = Math.round(im.naturalHeight * k); const g = c.getContext('2d'); g.drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL('image/png')); }; im.src = fr.result; }; fr.readAsDataURL(file); });
}
document.addEventListener('change', async e => {
  if (e.target.id !== 'bk-logo' || !e.target.files[0]) return;
  try { const url = await bookLogoLoad(e.target.files[0]); store.set('bklogo', url); document.getElementById('bk-lg').innerHTML = '<img src="' + url + '" alt="โลโก้ที่เลือก"> <button class="btn ghost" data-a="bklogoclear">ลบโลโก้</button>'; toast('ตั้งโลโก้บนปกแล้ว'); } catch (err) { toast(err.message); }
});
function bookHtml(schoolName) {
  const lg = store.get('bklogo');
  return '<section class="glass noprint"><h2>พิมพ์เล่มติว</h2><p class="mute small">เล่ม 1 = สรุปแต่ละมาตรฐาน ตามด้วยโจทย์ข้อสอบจริงที่คัดไว้ (ไม่เกิน 100 หน้า A4) · เล่ม 2 = เฉลย · ใส่ชื่อโรงเรียนบนปกได้ · ประกอบในเบราว์เซอร์ แล้วเลือก "บันทึกเป็น PDF" หรือสั่งพิมพ์ · แนะนำให้ใช้คอมพิวเตอร์ (เล่มหนา)</p>' +
    '<label for="bk-s">ชื่อโรงเรียนบนปก</label><input id="bk-s" maxlength="80" value="' + esc(schoolName || '') + '"><label for="bk-logo">โลโก้โรงเรียนบนปก (ไม่บังคับ · PNG/JPG)</label><input id="bk-logo" type="file" accept="image/png,image/jpeg"><div id="bk-lg" class="bk-lg">' + (lg ? '<img src="' + lg + '" alt="โลโก้ที่เลือก"> <button class="btn ghost" data-a="bklogoclear">ลบโลโก้</button>' : '') + '</div><label for="bk-l">ระดับชั้น</label><select id="bk-l"><option value="P6">ป.6</option><option value="M3">ม.3</option></select>' +
    '<div class="sp"></div><button class="btn" data-a="bookmain">พิมพ์เล่ม 1 · สรุป + โจทย์</button><div class="sp"></div><button class="btn sec" data-a="bookans">พิมพ์เล่ม 2 · เฉลย</button><p class="mute small" id="bk-st"></p></section>';
}
Object.assign(ACT, {
  bklogoclear: () => { store.del('bklogo'); document.getElementById('bk-lg').innerHTML = ''; toast('ลบโลโก้แล้ว'); },
  bookmain: () => bookPrint($('#bk-l').value, $('#bk-s').value.trim(), 'main'),
  bookans: () => bookPrint($('#bk-l').value, $('#bk-s').value.trim(), 'ans')
});
