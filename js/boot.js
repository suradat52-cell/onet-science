/* เริ่มระบบ: ปุ่มทั้งหมด (data-a) → ACT · ส่งคะแนนที่ค้าง · เปิดหน้าแรก */
document.addEventListener('click', e => {
  const fg = e.target.closest('figure[data-fig]'); if (fg && !e.target.closest('#figview')) { if (!e.target.closest('.figscroll.wide') || !fg.dataset.drag) openFig(fg); return; }
  if (e.target.closest('[data-a=figclose]')) { closeFig(); return; }
  const b = e.target.closest('[data-a]'); if (!b || !ACT[b.dataset.a]) return;
  e.preventDefault();
  // กดซ้ำระหว่างรอ (ปุ่มเดียวกัน ข้อมูลเดียวกัน) ไม่ทำซ้ำ · ปุ่มจางลงจนกว่าจะเสร็จ
  const key = b.dataset.a + JSON.stringify(Object.assign({}, b.dataset));
  if (BUSY.has(key)) return;
  b.setAttribute('aria-busy', 'true');
  run(() => ACT[b.dataset.a](b.dataset), key).finally(() => b.removeAttribute('aria-busy'));
});
flushQ(); // คะแนนที่ยังไม่ได้ส่ง (เช่น ปิดเว็บ/เน็ตหลุดตอนส่ง) ส่งต่อเมื่อเปิดเว็บใหม่
const SUMQ = new URLSearchParams(location.search).get('sum');
run(() => { theme(); if (SUMQ && S.level && API_URL) { const [std, ind, hl] = SUMQ.split('|'); return study(std, ind, hl); } return S.student && S.code && API_URL ? dash() : home(); });
