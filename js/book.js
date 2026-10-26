/* พิมพ์เล่มติว (สำหรับแอดมินกลาง/แอดมินโรงเรียน): เล่ม 1 = สรุปแต่ละมาตรฐาน ตามด้วยโจทย์คัดของมาตรฐานนั้น · เล่ม 2 = เฉลย
   ประกอบในเบราว์เซอร์จากไฟล์เนื้อหา แล้วสั่งพิมพ์/บันทึกเป็น PDF (A4 สองคอลัมน์ พื้นขาว) · ใส่ชื่อโรงเรียนบนปกได้
   เกณฑ์คัด (ให้เล่ม 1 ไม่เกิน 100 หน้า): สรุปเฉพาะหัวข้อที่เคยออกสอบ — ออกบ่อยได้เนื้อหาเต็ม ออกน้อยได้เฉพาะ แนวคิดหลัก/จำให้แม่น/กับดัก ·
   โจทย์: ทุกตัวชี้วัดที่เคยออกได้อย่างน้อย 1 ข้อ แล้วเติมข้อของตัวชี้วัดที่ออกบ่อยจากปีล่าสุดจนครบโควตา (BOOK_CFG.qMax) */
const BOOK_CFG = {
  P6: { qMax: 400, full: 1 },  // 400 = ใส่ทุกข้อที่เคยออก (ป.6 มี 171 ข้อ) ยังได้ไม่ถึง 100 หน้า  // full = ตัวชี้วัดที่มีข้อสอบจริงตั้งแต่กี่ข้อขึ้นไปจึงได้สรุปเต็ม
  M3: { qMax: 140, full: 1 }
};
const BOOK_YEARS = lv => ({ P6: 'ปีการศึกษา 2561–2568', M3: 'ปีการศึกษา 2561–2568' }[lv]);

/* สรุปแบบย่อ: เก็บหัวข้อ ## + บรรทัด kc: !! tr: (ตัดตาราง ตัวอย่าง ภาพ ผังขั้นตอน) */
const bookCompact = txt => String(txt).split('\n').filter(l => { const t = l.trim(); return t.startsWith('## ') || /^(kc|tr):\s/.test(t) || t.startsWith('!! '); }).join('\n');

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

/* โจทย์หนึ่งข้อ (ย่อ): เลขข้อในเล่ม · ที่มา (ปี/ข้อ) · โจทย์ · ภาพ · ตัวเลือก */
function bookQ(q, n) {
  const src = imgSrc(q.imageUrl), tag = '<span class="bq-src">O-NET ' + esc(q.examYear) + ' ข้อ ' + esc(q.itemNo) + ' · ' + esc(q.indicator) + '</span>';
  let body = '';
  if (q.type === 'complex') body = '<table class="bq-cx">' + q.choices.map((c, k) => '<tr><td class="k">' + (k + 1) + '</td><td>' + cell(c) + '</td><td class="yn">☐ ใช่ ☐ ไม่ใช่</td></tr>').join('') + '</table>';
  else if (q.type === 'order') body = '<div class="bq-ord">' + q.choices.map((c, j) => '<span>' + (j + 1) + ') ' + fmt(c) + '</span>').join('') + '<div>ลำดับ: …………………………</div></div>';
  else if (q.type === 'fill') body = '<div>คำตอบ ………………………………</div>';
  else if (!q.choices.length) body = '<div class="bq-pick">ตอบ ☐ 1 &nbsp; ☐ 2 &nbsp; ☐ 3 &nbsp; ☐ 4 (ตัวเลือกอยู่ในภาพ)</div>';
  else { const short = q.choices.every(c => plain(c).length <= 26 && !/\.(png|jpe?g|webp|gif)/i.test(c)); body = '<ol class="bq-ch' + (short ? ' two' : '') + '">' + q.choices.map((c, j) => '<li><b>' + (j + 1) + '</b> ' + (/\.(png|jpe?g|webp|gif)$/i.test(String(c).trim()) ? '<img class="subimg" src="' + esc(imgSrc(c)) + '" alt="ตัวเลือก ' + (j + 1) + '">' : fmt(c)) + '</li>').join('') + '</ol>'; }
  return '<div class="bq"><div class="bq-h"><b class="bq-n">' + n + '</b>' + tag + '</div><div class="bq-stem">' + fmt(q.stem) + '</div>' + (src ? '<img class="bq-img" src="' + esc(src) + '" alt="ภาพประกอบข้อ ' + n + '">' : '') + body + '</div>';
}

/* ประกอบเล่ม: kind = 'main' (สรุป + โจทย์) | 'ans' (เฉลย) */
async function bookBuild(lv, school, kind) {
  const prevLv = S.level; S.level = lv;
  try {
    await loadFigs(lv);
    const m = await cj(lv + '/meta.json'), cfg = BOOK_CFG[lv], years = Object.keys(m.bankYears);
    const all = (await Promise.all(years.map(y => cj(`${lv}/q-${y}.json`)))).flat(), byKey = {}; all.forEach(q => { byKey[qkey(q)] = q; });
    const picks = bookPick(lv, m, byKey, cfg.qMax), num = {}; picks.forEach((q, i) => { num[qkey(q)] = i + 1; });
    const by = {}; picks.forEach(q => { (by[q.standard] = by[q.standard] || []).push(q); });
    const title = (kind === 'ans' ? 'เฉลย' : 'สรุปเนื้อหา + โจทย์') + ' O-NET วิทยาศาสตร์ ' + LV[lv];
    const cover = '<section class="bk-cover"><div class="bk-logo">' + BRAND + '</div><div class="bk-sch">' + esc(school || '') + '</div><h1>' + (kind === 'ans' ? 'เฉลย' : 'ติวสอบ O-NET วิทยาศาสตร์') + '</h1><div class="bk-lv">ชั้น' + (lv === 'P6' ? 'ประถมศึกษาปีที่ 6' : 'มัธยมศึกษาปีที่ 3') + '</div><div class="bk-sub">' + (kind === 'ans' ? 'เฉลยโจทย์ข้อสอบจริงที่คัดไว้ในเล่ม “สรุปเนื้อหา + โจทย์” (' + picks.length + ' ข้อ)' : 'สรุปเนื้อหาตามมาตรฐาน พร้อมโจทย์ข้อสอบจริงคัดข้อ ' + picks.length + ' ข้อ') + '</div><div class="bk-meta">โจทย์ข้อสอบ O-NET ' + BOOK_YEARS(lv) + '<br>ใช้เพื่อการศึกษา · ที่มาของข้อสอบ: สถาบันทดสอบทางการศึกษาแห่งชาติ (สทศ.)<br>ฝึกข้อสอบเพิ่มเติมและดูเฉลยละเอียดได้ที่เว็บติว O-NET</div></section>';
    let html;
    if (kind === 'ans') {
      const ks = {}, ss = {};
      await Promise.all(years.map(async y => { ks[y] = await cj(`${lv}/k-${y}.json`); ss[y] = (await cj(`${lv}/s-${y}.json`, true)) || {}; }));
      const ansTxt = q => { const e = ks[q.examYear][q.itemNo] || {}, a = String(e.a || ''); return e.t === 'complex' ? a.split(',').map(x => x.split('|').map(v => v === 'ใช่' ? '✓' : '✗').join('/')).join(' ') : e.t === 'order' ? a.split(',').join(' → ') : a.split('|').join(' หรือ '); };
      html = cover + '<section class="bk-body"><h2 class="bk-band">เฉลยย่อ</h2><div class="bk-grid">' + picks.map(q => '<div><b>' + num[qkey(q)] + '</b> ' + esc(ansTxt(q)) + '</div>').join('') + '</div><p class="bk-note">ข้อเชิงซ้อน: ✓ = ใช่, ✗ = ไม่ใช่ เรียงตามข้อย่อย 1, 2, 3, …</p>' +
        '<h2 class="bk-band">เฉลยละเอียด</h2>' + picks.map(q => { const e = ks[q.examYear][q.itemNo] || {}, s = ss[q.examYear][q.itemNo]; return '<div class="bq bq-sol"><div class="bq-h"><b class="bq-n">' + num[qkey(q)] + '</b><span class="bq-src">ตอบ ' + esc(ansTxt(q)) + ' · O-NET ' + esc(q.examYear) + ' ข้อ ' + esc(q.itemNo) + '</span></div>' + (s ? '<div class="rich">' + rich(s.c) + '</div>' : e.e ? '<div class="bq-stem">' + fmt(e.e) + '</div>' : '') + '</div>'; }).join('') + '</section>';
    } else {
      const toc = '<section class="bk-toc"><h2 class="bk-band">สารบัญ</h2><ol>' + m.summaries.map(std => '<li><b>' + esc(std) + '</b> ' + esc(SHORT[std] || '') + ' <span>โจทย์ ' + ((by[std] || []).length) + ' ข้อ</span></li>').join('') + '</ol><p class="bk-note">วิธีใช้เล่มนี้: อ่านสรุปของมาตรฐานก่อน แล้วลองทำโจทย์ท้ายมาตรฐาน จากนั้นตรวจกับ “เล่มเฉลย” · หัวข้อที่ไม่เคยออกสอบจริงไม่ได้ใส่ไว้ในเล่มนี้ (ดูได้ที่เว็บ)</p></section>';
      const parts = [];
      for (const std of m.summaries) {
        const sf = (await cj(lv + '/sum-' + std.replace(/^ว\s*/, '').trim() + '.json', true)) || [], cnt = k => Object.values(((m.asked || {})[std] || {})[k] || {}).reduce((a, b) => a + b, 0);
        const sums = sf.filter(n => n.content).map((n, i) => {
          const c = n.indicator ? cnt(n.indicator) : -1; if (c === 0) return '';
          const p = titleParts(n.title), full = c >= cfg.full, txt = full ? n.content : bookCompact(n.content);
          if (!txt.trim()) return '';
          return '<section class="topic bk-topic"><h3 class="th">' + (n.indicator ? '<span class="tag">' + esc(n.indicator) + '</span>' : '') + esc(p.name) + (c > 0 ? ' <span class="bk-c">ออกสอบ ' + c + ' ข้อ</span>' : '') + '</h3>' + rich(txt, { pre: '' }) + '</section>';
        }).join('');
        parts.push('<h2 class="bk-band s-' + strandOf(std) + '">' + esc(std) + ' ' + esc(SHORT[std] || '') + '</h2>' + sums + ((by[std] || []).length ? '<h3 class="bk-qh">โจทย์ฝึก ' + esc(std) + '</h3>' + by[std].map(q => bookQ(q, num[qkey(q)])).join('') : ''));
      }
      html = cover + toc + '<section class="bk-body">' + parts.join('') + '</section>';
    }
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

function bookHtml(schoolName) {
  return '<section class="glass noprint"><h2>พิมพ์เล่มติว</h2><p class="mute small">เล่ม 1 = สรุปแต่ละมาตรฐาน ตามด้วยโจทย์ข้อสอบจริงที่คัดไว้ (ไม่เกิน 100 หน้า A4) · เล่ม 2 = เฉลย · ใส่ชื่อโรงเรียนบนปกได้ · ประกอบในเบราว์เซอร์ แล้วเลือก "บันทึกเป็น PDF" หรือสั่งพิมพ์ · แนะนำให้ใช้คอมพิวเตอร์ (เล่มหนา)</p>' +
    '<label for="bk-s">ชื่อโรงเรียนบนปก</label><input id="bk-s" maxlength="80" value="' + esc(schoolName || '') + '"><label for="bk-l">ระดับชั้น</label><select id="bk-l"><option value="P6">ป.6</option><option value="M3">ม.3</option></select>' +
    '<div class="sp"></div><button class="btn" data-a="bookmain">พิมพ์เล่ม 1 · สรุป + โจทย์</button><div class="sp"></div><button class="btn sec" data-a="bookans">พิมพ์เล่ม 2 · เฉลย</button><p class="mute small" id="bk-st"></p></section>';
}
Object.assign(ACT, {
  bookmain: () => bookPrint($('#bk-l').value, $('#bk-s').value.trim(), 'main'),
  bookans: () => bookPrint($('#bk-l').value, $('#bk-s').value.trim(), 'ans')
});
