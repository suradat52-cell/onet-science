// กติกาตรวจคะแนน (ใช้ในเครื่องนักเรียน เบราว์เซอร์โหลดไฟล์นี้) — ช่วง GRADING ต้องเหมือน apps-script/Code.gs ทุกตัวอักษร
/* GRADING:BEGIN — ช่วงนี้ต้องเหมือนกันทุกตัวอักษรกับ apps-script/Code.gs (ตรวจโดย tools/test/grading.mjs) ใช้ตรวจคะแนนทั้งในเครื่องนักเรียนและบน Apps Script */
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
// complex/order เก็บคำตอบเป็น "ใช่,ไม่ใช่,ใช่" หรือ "5,6,4" — ถ้าไม่ได้ตอบเลยคืนค่าว่าง
function normAns(type, s) {
  s = String(s == null ? '' : s).trim();
  if (type !== 'complex' && type !== 'order') return s;
  const p = s.split(/\s*(?:,|\|\|)\s*/).map(function (x) { return x.trim(); });
  return p.every(function (x) { return !x; }) ? '' : p.join(',');
}
function points(level, type) { return (POINTS[level] || POINTS.P6)[type] || 1; }
/* GRADING:END */
if (typeof module !== 'undefined') module.exports = { TYPES, POINTS, PARTIAL, tokOk, isRight, earnedOf, normAns, points };
