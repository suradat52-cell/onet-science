/* ภาพประกอบสรุปเนื้อหา ม.3 (SVG วาดเอง) — ใช้ใน data/summaries/M3-*.txt ด้วย [[fig:ชื่อ|คำบรรยาย]]
   โหลดโดย index.html เมื่อเปิดหน้าสรุปของระดับ ม.3 เท่านั้น · ห้ามใช้ร่วมกับ ป.6 (ป.6 อยู่ใน figs/P6.js) */
(function () {
  const F = FIGS.M3;
  const RED = '#b91c1c', BLUE = '#1d4ed8', GRN = '#15803d', GRY = '#64748b', ORG = '#c2410c', PUR = '#7e22ce';
  const mk = (id, c) => `<marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="${c}"/></marker>`;
  const MK = mk('ah', 'currentColor') + mk('ahR', RED) + mk('ahB', BLUE) + mk('ahG', GRY) + mk('ahN', GRN) + mk('ahP', PUR) + mk('ahO', ORG);
  const svg = (h, label, body) => `<svg viewBox="0 0 360 ${h}" role="img" aria-label="${label}" style="font-size:13px"><defs>${MK}</defs>${body}</svg>`;
  const T = (x, y, s, o = '') => `<text x="${x}" y="${y}" ${o}>${s}</text>`;
  const C = (x, y, s, o = '') => T(x, y, s, `text-anchor="middle" ${o}`);
  const L = (x1, y1, x2, y2, c = 'currentColor', w = 2, extra = '') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="${w}" ${extra}/>`;
  const R = (x, y, w, h, fill = 'none', stroke = 'currentColor', extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${stroke}" stroke-width="2" ${extra}/>`;
  const O = (x, y, r, fill, stroke = 'none') => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;
  const mid = c => (c === RED ? 'ahR' : c === BLUE ? 'ahB' : c === GRY ? 'ahG' : c === GRN ? 'ahN' : c === PUR ? 'ahP' : c === ORG ? 'ahO' : 'ah');
  const arrow = (d, c = 'currentColor', w = 2.2, extra = '') => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" marker-end="url(#${mid(c)})" ${extra}/>`;
  const line = (x1, y1, x2, y2, c, w = 2, arr = false, dash = false) => arr ? arrow(`M${x1} ${y1}L${x2} ${y2}`, c, w, dash ? 'stroke-dasharray="5 4"' : '') : L(x1, y1, x2, y2, c, w, dash ? 'stroke-dasharray="5 4"' : '');
  const HALO = 'style="paint-order:stroke;stroke:#fff;stroke-width:3.5px;stroke-linejoin:round"';
  const num = v => Math.round(v * 10) / 10;
  // ตัวต้านทาน (กล่อง) ในแนวนอน / แนวตั้ง
  const resH = (x, y, name) => R(x, y - 8, 36, 16, '#fef9c3') + C(x + 18, y + 4, name, 'font-size="11" font-weight="700"');
  const resV = (x, y, name) => R(x - 8, y, 16, 36, '#fef9c3') + C(x + 20, y + 22, name, 'font-size="11" font-weight="700"');
  const battery = (x, y) => L(x - 10, y - 6, x + 10, y - 6, 'currentColor', 2.5) + L(x - 5, y + 6, x + 5, y + 6, 'currentColor', 5) + T(x + 14, y - 3, '+', 'font-size="11"') + T(x + 14, y + 12, '–', 'font-size="11"');

  /* 1) พลังงานกลคงตัวขณะไถลลงพื้นเอียงลื่น */
  const sx = t => 20 + t * 180, sy = t => 40 + t * 130;
  const blk = (t, name) => `<g transform="rotate(35 ${sx(t)} ${sy(t) - 9})"><rect x="${sx(t) - 9}" y="${sy(t) - 18}" width="18" height="16" fill="#fde68a" stroke="currentColor" stroke-width="2"/></g>` + C(sx(t) + 24, sy(t) - 18, name, 'font-weight="700"');
  const bar = (x, ep, ek, name) => `<rect x="${x}" y="${180 - ep}" width="30" height="${ep}" fill="#93c5fd" stroke="currentColor" stroke-width="1.5"/><rect x="${x}" y="${180 - ep - ek}" width="30" height="${ek}" fill="#fca5a5" stroke="currentColor" stroke-width="1.5"/>` + C(x + 15, 196, name, 'font-weight="700"');
  F['m3-energy-slope'] = svg(232,
    'วัตถุไถลลงพื้นเอียงลื่น พลังงานศักย์ลดลง พลังงานจลน์เพิ่ม พลังงานกลคงที่',
    L(20, 40, 200, 170, 'currentColor', 3) + L(20, 170, 205, 170, GRY, 2) + blk(0.12, 'A') + blk(0.5, 'B') + blk(0.9, 'C') +
    L(222, 180, 340, 180, 'currentColor', 2) + bar(228, 90, 10, 'A') + bar(272, 50, 50, 'B') + bar(316, 10, 90, 'C') +
    L(222, 80, 346, 80, GRY, 1.5, 'stroke-dasharray="5 4"') + T(224, 72, 'พลังงานกลคงที่', `font-size="11" fill="${GRY}" font-weight="600"`) +
    `<rect x="40" y="206" width="12" height="10" fill="#93c5fd" stroke="currentColor"/>` + T(56, 215, 'Ep (ศักย์)', 'font-size="11"') + `<rect x="130" y="206" width="12" height="10" fill="#fca5a5" stroke="currentColor"/>` + T(146, 215, 'Ek (จลน์)', 'font-size="11"') +
    C(110, 22, 'ไถลลงพื้นเอียงลื่น', 'font-weight="700"') + C(285, 22, 'พลังงานแต่ละแบบ', 'font-weight="700"'));

  /* 2) กระจกเงาราบ */
  const hatch = (x, y1, y2) => { let s = ''; for (let y = y1; y < y2; y += 12) s += L(x, y, x + 10, y + 10, GRY, 1.5); return s; };
  F['m3-plane-mirror'] = svg(246,
    'การเกิดภาพในกระจกเงาราบ: ภาพเสมือนอยู่หลังกระจก ระยะภาพเท่าระยะวัตถุ มุมตกกระทบเท่ามุมสะท้อน',
    L(180, 28, 180, 214, 'currentColor', 4) + hatch(182, 30, 206) + C(180, 18, 'กระจกเงาราบ', 'font-weight="700"') +
    arrow('M90 190V130', 'currentColor', 3) + C(90, 206, 'วัตถุ', 'font-weight="700"') +
    arrow('M270 190V130', GRY, 3, 'stroke-dasharray="5 4"') + C(270, 206, 'ภาพเสมือน', `font-weight="700" fill="${GRY}"`) +
    L(120, 100, 240, 100, GRY, 1.2, 'stroke-dasharray="4 4"') + T(250, 94, 'เส้นแนวฉาก', 'font-size="10.5"') +
    line(90, 130, 180, 100, RED, 2.2, true) + line(180, 100, 62, 60, RED, 2.2, true) + line(180, 100, 270, 130, GRY, 1.8, false, true) +
    `<ellipse cx="54" cy="56" rx="12" ry="8" fill="#fff" stroke="currentColor" stroke-width="1.5"/>` + O(54, 56, 3.5, '#1f2937') + T(22, 44, 'ตา', 'font-size="12"') +
    T(142, 128, 'i', `font-size="15" fill="${RED}" font-weight="700" ${HALO}`) + T(142, 84, 'r', `font-size="15" fill="${RED}" font-weight="700" ${HALO}`) + T(214, 60, 'i = มุมตกกระทบ', `font-size="11.5" fill="${RED}" font-weight="600"`) + T(214, 76, 'r = มุมสะท้อน (i = r)', `font-size="11.5" fill="${RED}" font-weight="600"`) +
    L(90, 224, 178, 224, BLUE, 1.5) + L(182, 224, 270, 224, BLUE, 1.5) + C(134, 238, 'ระยะวัตถุ d', `font-size="11" fill="${BLUE}"`) + C(226, 238, 'ระยะภาพ d (เท่ากัน)', `font-size="11" fill="${BLUE}"`));

  /* 3) กระจกเว้า: รังสีสำคัญ (วงกลมศูนย์กลาง C รัศมี 160, F อยู่กึ่งกลาง) */
  F['m3-concave-rays'] = svg(236,
    'กระจกเว้า รังสีขนานแกนสะท้อนผ่านจุดโฟกัส รังสีผ่านโฟกัสสะท้อนขนานแกน รังสีผ่านจุดศูนย์กลางความโค้งย้อนกลับทางเดิม',
    `<path d="M291 28A160 160 0 0 1 291 212" fill="none" stroke="currentColor" stroke-width="4"/>` + L(20, 120, 330, 120, GRY, 1.5) + C(200, 14, 'แกนมุขสำคัญ', 'font-size="11"') +
    arrow('M90 120V80', 'currentColor', 3) + T(50, 104, 'วัตถุ', 'font-size="12" font-weight="700"') +
    arrow('M200.7 120V141', GRY, 3) + T(206, 168, 'ภาพจริง หัวกลับ', `font-size="11" font-weight="700" fill="#334155" ${HALO}`) +
    line(90, 80, 314.9, 80, RED, 2, false) + line(314.9, 80, 130, 178.8, RED, 2, true) +
    line(90, 80, 318.8, 141, BLUE, 2, false) + line(318.8, 141, 130, 141, BLUE, 2, true) +
    line(90, 80, 298.9, 199.4, GRN, 2, false, true) +
    O(160, 120, 3, 'currentColor') + T(156, 138, 'C', 'font-weight="700"') + O(240, 120, 3, 'currentColor') + T(236, 138, 'F', 'font-weight="700"') +
    T(20, 198, '① ขนานแกน → สะท้อนผ่าน F', `font-size="11" fill="${RED}" font-weight="600"`) + T(20, 213, '② ผ่าน F → สะท้อนขนานแกน', `font-size="11" fill="${BLUE}" font-weight="600"`) + T(20, 228, '③ ผ่าน C → สะท้อนย้อนทางเดิม', `font-size="11" fill="${GRN}" font-weight="600"`));

  /* 4) อนุกรมและขนาน */
  F['m3-series-parallel'] = svg(236,
    'วงจรอนุกรม กระแสเท่ากัน และวงจรขนาน ความต่างศักย์เท่ากัน',
    C(90, 16, 'อนุกรม', 'font-weight="700"') + `<path d="M20 50H50M86 50H116M152 50H170V160H20V50" fill="none" stroke="currentColor" stroke-width="2"/>` + resH(50, 50, 'R₁') + resH(116, 50, 'R₂').replace('x="116"', 'x="116"') +
    battery(20, 105) + arrow('M60 78H110', BLUE) + C(85, 72, 'I เท่ากัน', `font-size="11" fill="${BLUE}" font-weight="700"`) +
    C(95, 182, 'V รวม = V₁ + V₂', 'font-size="12"') + C(95, 198, 'R รวม = R₁ + R₂', 'font-size="12"') +
    C(270, 16, 'ขนาน', 'font-weight="700"') + `<path d="M200 50H230M230 50H240M300 50H345V160H200V50M240 50V70M240 106V160M300 50V70M300 106V160" fill="none" stroke="currentColor" stroke-width="2"/>` +
    `<path d="M230 50H300" fill="none" stroke="currentColor" stroke-width="2"/>` + resV(240, 70, 'R₁') + resV(300, 70, 'R₂') + battery(200, 105) +
    C(262, 134, 'I₁', `font-size="11" fill="${BLUE}" font-weight="700"`) + C(322, 134, 'I₂', `font-size="11" fill="${BLUE}" font-weight="700"`) +
    C(270, 182, 'V เท่ากันทุกสาขา', 'font-size="12"') + C(270, 198, 'I รวม = I₁ + I₂', 'font-size="12"') + C(270, 220, '{1/R รวม} = ผลรวมของ {1/R}'.replace(/\{|\}/g, ''), 'font-size="11.5"'));

  /* 5) สีของวัตถุ */
  F['m3-color-light'] = svg(210,
    'วัตถุสีเขียวสะท้อนแสงสีเขียวเข้าตา ดูดกลืนแสงสีแดงและน้ำเงิน',
    C(180, 16, 'แสงขาว = แสงหลายสีรวมกัน', 'font-size="12"') +
    arrow('M20 70L120 100', RED) + arrow('M20 100L120 100', GRN) + arrow('M20 130L120 100', BLUE) +
    T(22, 62, 'แดง', `font-size="11" fill="${RED}" font-weight="700"`) + T(22, 94, 'เขียว', `font-size="11" fill="${GRN}" font-weight="700"`) + T(22, 148, 'น้ำเงิน', `font-size="11" fill="${BLUE}" font-weight="700"`) +
    R(120, 70, 70, 60, '#86efac') + C(155, 105, 'วัตถุ', 'font-weight="700"') + C(155, 150, 'สีเขียว', `font-size="12" fill="${GRN}" font-weight="700"`) +
    arrow('M190 90L280 50', GRN, 2.6) + `<ellipse cx="305" cy="48" rx="20" ry="12" fill="#fff" stroke="currentColor" stroke-width="2"/>` + O(305, 48, 6, '#1f2937') + C(305, 78, 'เห็นเป็นสีเขียว', `font-size="12" fill="${GRN}" font-weight="700"`) + T(215, 62, 'สะท้อน', `font-size="11" fill="${GRN}" font-weight="700"`) +
    T(196, 116, '✕ แดง ถูกดูดกลืน', `font-size="11" fill="${RED}" font-weight="600"`) + T(196, 136, '✕ น้ำเงิน ถูกดูดกลืน', `font-size="11" fill="${BLUE}" font-weight="600"`) +
    C(180, 190, 'ฉายแสงสีที่ถูกดูดกลืน → ไม่มีแสงสะท้อนเข้าตา → มองเห็นเป็นสีดำ', 'font-size="11.5"'));

  /* 6) แว่นขยาย (วัตถุอยู่ภายในระยะโฟกัส f = 60) */
  F['m3-magnifier'] = svg(228,
    'แว่นขยาย: วัตถุอยู่ภายในระยะโฟกัส ได้ภาพเสมือน หัวตั้ง ขนาดใหญ่ขึ้น อยู่ด้านเดียวกับวัตถุ',
    L(20, 120, 340, 120, GRY, 1.5) + `<path d="M180 38Q204 120 180 202Q156 120 180 38Z" fill="#dbeafe" stroke="currentColor" stroke-width="2.5"/>` + C(180, 28, 'เลนส์นูน', 'font-weight="700"') +
    O(120, 120, 3, 'currentColor') + T(114, 138, 'F', 'font-weight="700"') + O(240, 120, 3, 'currentColor') + T(236, 138, 'F', 'font-weight="700"') +
    arrow('M150 120V85', 'currentColor', 3) + T(128, 160, 'วัตถุ', 'font-size="12" font-weight="700"') +
    line(150, 85, 180, 85, RED, 2, false) + line(180, 85, 300, 155, RED, 2, true) + line(180, 85, 120, 50, RED, 1.6, false, true) +
    line(150, 85, 235, 184, BLUE, 2, true) + line(150, 85, 120, 50, BLUE, 1.6, false, true) +
    arrow('M120 120V50', GRY, 3, 'stroke-dasharray="5 4"') + T(14, 38, 'ภาพเสมือน', `font-size="12" font-weight="700" fill="${GRY}"`) + T(14, 54, 'หัวตั้ง ใหญ่ขึ้น', `font-size="11" fill="${GRY}"`) +
    C(180, 222, 'ภาพเสมือน: รังสีไม่ได้มาตัดกันจริง (เส้นประ) รับด้วยฉากไม่ได้', 'font-size="11"'));

  /* 7) การถ่ายโอนความร้อน */
  const flame = x => `<path d="M${x} 198c-10 -10 -4 -20 0 -30c4 10 10 18 0 30z" fill="#f97316" stroke="${RED}" stroke-width="1.5"/>`;
  F['m3-heat-transfer'] = svg(236,
    'การนำความร้อนผ่านก้นหม้อ การพาความร้อนของน้ำ และการแผ่รังสีความร้อนจากดวงอาทิตย์',
    `<path d="M100 60L112 160H238L250 60" fill="#dbeafe" stroke="currentColor" stroke-width="3"/>` + L(100, 160, 250, 160, 'currentColor', 5) + R(95, 198, 160, 18, '#cbd5e1') + flame(130) + flame(175) + flame(220) +
    arrow('M130 190V170', RED) + arrow('M175 190V170', RED) + arrow('M220 190V170', RED) + T(262, 186, 'นำความร้อน', `font-size="12" font-weight="700" fill="${RED}"`) + T(262, 200, '(ก้นหม้อ → น้ำ)', 'font-size="11"') +
    arrow('M175 150V92', BLUE) + arrow('M175 92Q175 76 148 76Q124 76 124 100V138', BLUE, 2.2) + arrow('M175 92Q175 76 202 76Q226 76 226 100V138', BLUE, 2.2) +
    T(262, 100, 'พาความร้อน', `font-size="12" font-weight="700" fill="${BLUE}"`) + T(262, 114, '(น้ำร้อนลอยขึ้น', 'font-size="11"') + T(262, 128, 'น้ำเย็นจมลง)', 'font-size="11"') +
    O(34, 44, 16, '#fde047', ORG) + arrow('M48 54Q70 70 96 74', ORG, 2.4, 'stroke-dasharray="5 4"') + arrow('M42 60Q62 90 94 104', ORG, 2.4, 'stroke-dasharray="5 4"') +
    T(8, 126, 'แผ่รังสี', `font-size="12" font-weight="700" fill="${ORG}"`) + T(8, 141, 'ความร้อน', `font-size="12" font-weight="700" fill="${ORG}"`) + T(8, 156, 'ไม่ต้องมี', 'font-size="11"') + T(8, 170, 'ตัวกลาง', 'font-size="11"') +
    C(175, 28, 'ความร้อนไปจากที่ร้อนไปที่เย็น', 'font-size="12"'));

  /* 8) การขยายตัวของแก๊สเมื่อร้อน */
  const parts = (x0, y0, w, h, n, vlen) => { let s = ''; for (let i = 0; i < n; i++) { const x = x0 + 14 + ((i * 41) % (w - 28)), y = y0 + 14 + ((i * 29 + (i % 3) * 13) % (h - 28)); s += O(x, y, 4.5, '#f87171', '#7f1d1d') + (vlen ? arrow(`M${x} ${y}l${vlen} ${(i % 2 ? -1 : 1) * vlen * 0.35}`, ORG, 1.6) : ''); } return s; };
  F['m3-expansion'] = svg(214,
    'เมื่อแก๊สได้รับความร้อน อนุภาคขยับเร็วขึ้นและห่างกันมากขึ้น ปริมาตรเพิ่ม ลูกโป่งพอง',
    C(90, 14, 'เย็น', `font-weight="700" fill="${BLUE}"`) + `<ellipse cx="90" cy="52" rx="16" ry="18" fill="#bfdbfe" stroke="currentColor" stroke-width="2"/>` + R(52, 70, 76, 80) + parts(52, 70, 76, 80, 8, 6) +
    C(90, 170, 'อนุภาคเคลื่อนที่ช้า', 'font-size="11.5"') + C(90, 186, 'ชิดกันกว่า ปริมาตรน้อย', 'font-size="11.5"') +
    arrow('M150 110H200', GRY) + C(175, 100, 'ให้ความร้อน', `font-size="11" fill="${RED}" font-weight="700"`) +
    C(270, 14, 'ร้อน', `font-weight="700" fill="${RED}"`) + `<ellipse cx="270" cy="46" rx="30" ry="20" fill="#fecaca" stroke="currentColor" stroke-width="2"/>` + R(210, 64, 120, 90) + parts(210, 64, 120, 90, 8, 16) +
    C(270, 170, 'อนุภาคเคลื่อนที่เร็ว (ลูกศรยาว)', 'font-size="11.5"') + C(270, 186, 'ห่างกันมากขึ้น ปริมาตรมาก', 'font-size="11.5"'));

  /* 9) กราฟ I–V */
  const gx = v => 50 + v * 35, gy = i => 170 - i * 108;
  F['m3-ohm-graph'] = svg(214,
    'กราฟ กระแสไฟฟ้ากับความต่างศักย์ของตัวต้านทานคงตัว เป็นเส้นตรงผ่านจุดกำเนิด',
    L(50, 170, 340, 170, 'currentColor', 2) + L(50, 170, 50, 20, 'currentColor', 2) + C(194, 208, 'ความต่างศักย์ V (โวลต์)', 'font-size="12"') + `<text transform="translate(12 100) rotate(-90)" text-anchor="middle" font-size="11.5">กระแส I (แอมแปร์)</text>` +
    [0, 2, 4, 6, 8].map(v => L(gx(v), 170, gx(v), 175, 'currentColor', 1.5) + C(gx(v), 189, v, 'font-size="11"')).join('') +
    [0.4, 0.8, 1.2].map(i => L(45, gy(i), 50, gy(i), 'currentColor', 1.5) + T(18, gy(i) + 4, i, 'font-size="11"')).join('') +
    L(50, 170, gx(6), gy(1.2), RED, 2.6) + [2, 4, 6].map(v => O(gx(v), gy(v / 5), 4, RED)).join('') + T(gx(6) + 6, gy(1.2) + 4, 'R = 5 Ω', `font-size="12" fill="${RED}" font-weight="700"`) +
    L(50, 170, gx(8), gy(0.8), BLUE, 2.6) + [2, 4, 6, 8].map(v => O(gx(v), gy(v / 10), 4, BLUE)).join('') + T(gx(8) - 54, gy(0.8) - 8, 'R = 10 Ω', `font-size="12" fill="${BLUE}" font-weight="700"`) +
    L(gx(4), 170, gx(4), gy(0.8), GRY, 1.2, 'stroke-dasharray="4 4"') + L(50, gy(0.8), gx(4), gy(0.8), GRY, 1.2, 'stroke-dasharray="4 4"') + T(gx(4) - 118, gy(0.8) - 6, 'อ่านค่า: 4 V → 0.8 A', 'font-size="10.5"') +
    C(262, 128, 'ความชัน = I/V = 1/R', 'font-size="12"') + C(262, 144, 'R น้อย → เส้นชันกว่า', `font-size="11.5" fill="${GRY}"`));

  /* 10) เลนส์นูน: วัตถุไกลกว่า 2F (f = 60) */
  F['m3-lens-convex'] = svg(222,
    'เลนส์นูน รังสีขนานแกนหักเหผ่านจุดโฟกัส รังสีผ่านโฟกัสออกขนานแกน รังสีผ่านกึ่งกลางเลนส์ตรง ภาพจริงหัวกลับ',
    L(10, 120, 350, 120, GRY, 1.5) + `<path d="M180 36Q206 120 180 204Q154 120 180 36Z" fill="#dbeafe" stroke="currentColor" stroke-width="2.5"/>` +
    [[60, '2F'], [120, 'F'], [240, 'F'], [300, '2F']].map(([x, n]) => O(x, 120, 3, 'currentColor') + C(x + (x === 300 ? 14 : 0), 140, n, 'font-size="12" font-weight="700"')).join('') +
    arrow('M40 120V80', 'currentColor', 3) + C(40, 70, 'วัตถุ', 'font-size="12" font-weight="700"') +
    arrow('M285 120V150', GRY, 3) + C(285, 178, 'ภาพจริง หัวกลับ เล็กกว่า', `font-size="11" font-weight="700" fill="${GRY}"`) +
    line(40, 80, 180, 80, RED, 2, false) + line(180, 80, 285, 150, RED, 2, true) +
    line(40, 80, 180, 120, BLUE, 2, false) + line(180, 120, 285, 150, BLUE, 2, true) +
    line(40, 80, 180, 150, GRN, 2, false) + line(180, 150, 285, 150, GRN, 2, true) +
    T(14, 196, '① ขนานแกน → ผ่าน F', `font-size="11" fill="${RED}" font-weight="600"`) + T(14, 211, '② ผ่านกึ่งกลาง → ตรง', `font-size="11" fill="${BLUE}" font-weight="600"`) + T(190, 196, '③ ผ่าน F → ขนานแกน', `font-size="11" fill="${GRN}" font-weight="600"`) +
    C(180, 24, 'วัตถุไกลกว่า 2F', 'font-weight="700"'));

  /* 11) เลนส์เว้า (f = 70) */
  F['m3-lens-concave'] = svg(214,
    'เลนส์เว้ากระจายแสง ได้ภาพเสมือน หัวตั้ง เล็กกว่าวัตถุ',
    L(10, 120, 350, 120, GRY, 1.5) + `<path d="M162 36L198 36Q184 120 198 204L162 204Q176 120 162 36Z" fill="#dbeafe" stroke="currentColor" stroke-width="2.5"/>` +
    O(110, 120, 3, 'currentColor') + T(104, 138, 'F', 'font-weight="700"') + O(250, 120, 3, 'currentColor') + T(246, 138, 'F', 'font-weight="700"') +
    arrow('M50 120V80', 'currentColor', 3) + C(50, 70, 'วัตถุ', 'font-size="12" font-weight="700"') +
    arrow('M134.5 120V106', GRY, 3, 'stroke-dasharray="4 3"') + T(76, 162, 'ภาพเสมือน หัวตั้ง', `font-size="11" font-weight="700" fill="${GRY}"`) + T(76, 177, 'เล็กกว่าวัตถุ', `font-size="11" fill="${GRY}"`) +
    line(50, 80, 180, 80, RED, 2, false) + line(180, 80, 270, 28.6, RED, 2, true) + line(180, 80, 110, 120, RED, 1.4, false, true) +
    line(50, 80, 180, 106, GRN, 2, false) + line(180, 106, 300, 106, GRN, 2, true) + line(180, 106, 134.5, 106, GRN, 1.4, false, true) +
    line(50, 80, 180, 120, BLUE, 2, false) + line(180, 120, 300, 156.9, BLUE, 2, true) +
    T(204, 196, '① ขนานแกน → แยกออก', `font-size="11" fill="${RED}" font-weight="600"`) + T(204, 211, '② ผ่านกึ่งกลาง → ตรง', `font-size="11" fill="${BLUE}" font-weight="600"`) + T(18, 211, '③ มุ่ง F → ออกขนานแกน', `font-size="11" fill="${GRN}" font-weight="600"`));

  /* 12) กราฟการให้ความร้อนแก่น้ำแข็ง */
  const hy = t => 150 - t * 1.1;
  F['m3-heating-curve'] = svg(232,
    'กราฟอุณหภูมิกับเวลาเมื่อให้ความร้อนแก่น้ำแข็ง ส่วนราบคือช่วงเปลี่ยนสถานะ',
    L(40, 200, 345, 200, 'currentColor', 2) + L(40, 200, 40, 14, 'currentColor', 2) + C(200, 224, 'เวลา (ให้ความร้อนอัตราคงที่)', 'font-size="12"') + `<text transform="translate(18 108) rotate(-90)" text-anchor="middle" font-size="12">อุณหภูมิ (°C)</text>` +
    L(36, hy(0), 345, hy(0), GRY, 1, 'stroke-dasharray="4 4"') + L(36, hy(100), 345, hy(100), GRY, 1, 'stroke-dasharray="4 4"') + T(14, hy(0) + 4, '0', 'font-size="11"') + T(8, hy(100) + 4, '100', 'font-size="11"') +
    `<polyline points="42,${hy(-20)} 95,${hy(0)} 160,${hy(0)} 225,${hy(100)} 290,${hy(100)} 340,${hy(125)}" fill="none" stroke="${RED}" stroke-width="3"/>` +
    T(44, hy(-20) + 16, 'น้ำแข็ง', 'font-size="11.5" font-weight="700"') + C(128, hy(0) + 18, 'น้ำแข็ง + น้ำ', 'font-size="11.5" font-weight="700"') + C(128, hy(0) + 33, 'Q = m × L', `font-size="11" fill="${RED}"`) +
    C(112, hy(50), 'น้ำ', 'font-size="11.5" font-weight="700"') + C(112, hy(50) + 15, 'Q = m × c × Δt', `font-size="11" fill="${RED}"`) +
    C(258, hy(100) + 18, 'น้ำ + ไอน้ำ', 'font-size="11.5" font-weight="700"') + C(258, hy(100) + 33, 'Q = m × L', `font-size="11" fill="${RED}"`) + T(300, hy(125) + 32, 'ไอน้ำ', 'font-size="11.5" font-weight="700"') +
    '');

  /* 13) งาน: เฉพาะช่วงที่เคลื่อนที่ตามแนวแรง (แรงหิ้ว F ชี้ขึ้นเสมอ) */
  const wrow = (y, vertical, title, res, col) => (vertical ? arrow(`M44 ${y + 52}V${y + 8}`, RED, 2.6) + arrow(`M66 ${y + 52}V${y + 8}`, BLUE, 2.6) : arrow(`M24 ${y + 38}H96`, RED, 2.6) + arrow(`M60 ${y + 52}V${y + 12}`, BLUE, 2.6)) +
    T(vertical ? 74 : 68, y + 24, 'F', `font-size="12" fill="${BLUE}" font-weight="700"`) + T(124, y + 22, title, 'font-size="12" font-weight="700"') + T(124, y + 40, res, `font-size="12" font-weight="700" fill="${col}"`) + L(14, y + 60, 346, y + 60, GRY, 1, 'stroke-dasharray="3 4"');
  F['m3-work'] = svg(236,
    'แรงหิ้วชี้ขึ้น ทำงานเฉพาะช่วงที่ของเคลื่อนที่ขึ้นลง ช่วงเคลื่อนที่ในแนวระดับงานเป็นศูนย์',
    C(180, 14, 'ลูกศรแดง = การเคลื่อนที่ · ลูกศรน้ำเงิน = แรงหิ้ว F', 'font-size="11.5"') +
    wrow(24, true, 'ช่วงขึ้นลิฟต์/ขึ้นบันได (ขึ้น h)', 'แรงกับการเคลื่อนที่ทิศเดียวกัน → W = F × h', GRN) +
    wrow(88, false, 'ช่วงเดินไปตามพื้นระดับ', 'แรงตั้งฉากกับการเคลื่อนที่ → W = 0', RED) +
    wrow(152, true, 'ช่วงขึ้นอีกครั้ง (ขึ้น h₂)', 'W = F × h₂  ·  รวมทุกช่วงที่ W ≠ 0', GRN));

  /* 14) คาน */
  F['m3-lever'] = svg(214,
    'คานงัดวัตถุ แขนแรงยาวกว่าแขนน้ำหนัก ออกแรงน้อยแต่กดเป็นระยะทางมาก',
    `<polygon points="110,122 90,170 130,170" fill="#cbd5e1" stroke="currentColor" stroke-width="2"/>` + C(110, 188, 'จุดหมุน', 'font-weight="700"') +
    L(30, 120, 330, 120, 'currentColor', 6) + `<polygon points="40,120 50,100 70,100 80,120" fill="#a8a29e" stroke="currentColor" stroke-width="2"/>` + 
    arrow('M60 56V84', RED, 3.2) + C(60, 48, 'W (น้ำหนักหิน)', `font-size="11.5" fill="${RED}" font-weight="700"`) +
    arrow('M310 56V108', BLUE, 3.2) + C(300, 48, 'F (แรงที่กด)', `font-size="11.5" fill="${BLUE}" font-weight="700"`) +
    L(60, 140, 108, 140, GRN, 1.5) + C(84, 156, 'แขนน้ำหนัก', `font-size="11" fill="${GRN}"`) + L(112, 140, 310, 140, BLUE, 1.5) + C(211, 156, 'แขนแรง (ยาวกว่า)', `font-size="11" fill="${BLUE}"`) +
    L(50, 111, 310, 150, GRY, 1.5, 'stroke-dasharray="5 4"') + T(222, 112, 'กดลงเป็นระยะยาว', 'font-size="11"') +
    C(180, 208, 'แรงน้อยลง แต่ระยะที่ออกแรงมากขึ้น → งานเท่าเดิม', 'font-size="11.5"'));

  /* 15) การสะท้อนกลับหมด (แหล่งกำเนิดใต้น้ำ ลึก 90) */
  F['m3-critical'] = svg(232,
    'แสงจากใต้น้ำสู่อากาศ มุมตกกระทบน้อยกว่ามุมวิกฤตหักเหออก เท่ากับมุมวิกฤตหักเหเลียดผิว มากกว่ามุมวิกฤตสะท้อนกลับหมด',
    R(10, 110, 340, 112, '#dbeafe', 'none') + L(10, 110, 350, 110, BLUE, 3) + T(14, 128, 'น้ำ (ทึบกว่า)', `font-size="12" font-weight="700" fill="${BLUE}"`) + T(14, 100, 'อากาศ', 'font-size="12" font-weight="700"') +
    O(110, 200, 6, '#fde047', ORG) + T(60, 218, 'แหล่งกำเนิดแสง', 'font-size="11"') +
    line(110, 200, 162, 110, GRN, 2.2, true) + line(162, 110, 224, 40, GRN, 2.2, true) + L(162, 70, 162, 150, GRY, 1, 'stroke-dasharray="3 3"') + T(228, 36, 'A: น้อยกว่ามุมวิกฤต', `font-size="11" fill="${GRN}" font-weight="700"`) + T(228, 49, 'หักเหออกสู่อากาศ', `font-size="11" fill="${GRN}"`) +
    line(110, 200, 213.5, 110, ORG, 2.2, true) + L(213.5, 70, 213.5, 150, GRY, 1, 'stroke-dasharray="3 3"') + line(213.5, 110, 300, 110, ORG, 2.2, true) + T(222, 84, 'B: = มุมวิกฤต', `font-size="11" fill="${ORG}" font-weight="700"`) + T(222, 97, 'หักเหเลียดผิว 90°', `font-size="11" fill="${ORG}"`) +
    line(110, 200, 303, 110, RED, 2.2, true) + line(303, 110, 350, 131.9, RED, 2.2, true) + L(303, 70, 303, 150, GRY, 1, 'stroke-dasharray="3 3"') + T(262, 170, 'C: มากกว่ามุมวิกฤต', `font-size="11" fill="${RED}" font-weight="700"`) + T(262, 183, 'สะท้อนกลับหมด', `font-size="11" fill="${RED}"`) +
    `<path d="M213.5 140A32 32 0 0 0 188 125" fill="none" stroke="${ORG}" stroke-width="1.5"/>` + T(176, 156, 'มุมวิกฤต', `font-size="10.5" fill="${ORG}"`));

  /* 16) ปริซึมสามเหลี่ยม */
  const spec = [['#ef4444', 140], ['#f97316', 148], ['#facc15', 156], ['#22c55e', 164], ['#3b82f6', 174], ['#8b5cf6', 184]];
  F['m3-prism'] = svg(212,
    'แสงขาวผ่านปริซึมสามเหลี่ยม แยกเป็นแถบสี แดงเบนน้อยที่สุด ม่วงเบนมากที่สุด',
    `<polygon points="170,40 110,144 230,144" fill="#e0f2fe" stroke="currentColor" stroke-width="2.5"/>` + C(170, 164, 'ปริซึมสามเหลี่ยม', 'font-weight="700"') +
    arrow('M24 112L132.5 105', 'currentColor', 3) + C(66, 100, 'แสงขาว', 'font-weight="700"') + L(132.5, 105, 216, 120, 'currentColor', 2.4) +
    spec.map(([c, y]) => `<line x1="216" y1="120" x2="316" y2="${y}" stroke="${c}" stroke-width="2.6"/>`).join('') +
    spec.map(([c, y], i) => `<rect x="318" y="${y - 5}" width="14" height="10" fill="${c}"/>`).join('') + L(318, 128, 318, 196, 'currentColor', 2) +
    T(226, 112, 'แดง: เบนน้อยสุด', `font-size="11" fill="#b91c1c" font-weight="700"`) + T(196, 192, 'ม่วง: เบนมากสุด', `font-size="11" fill="#6d28d9" font-weight="700"`) +
    C(170, 20, 'ต้องมีทั้งแสงขาวและปริซึมสามเหลี่ยม', 'font-size="12"'));

  /* 17) คลื่น */
  let wp = ''; for (let x = 30; x <= 330; x += 3) wp += (x === 30 ? 'M' : 'L') + x + ' ' + num(120 - 40 * Math.sin(2 * Math.PI * (x - 30) / 120)) + ' ';
  F['m3-wave'] = svg(222,
    'ส่วนประกอบของคลื่น แอมพลิจูด ความยาวคลื่น สันคลื่น ท้องคลื่น',
    L(20, 120, 345, 120, GRY, 1.5, 'stroke-dasharray="5 4"') + T(292, 138, 'แนวสมดุล', 'font-size="11"') + `<path d="${wp}" fill="none" stroke="${BLUE}" stroke-width="3"/>` +
    arrow('M60 120V84', RED, 2.4) + T(66, 106, 'A', `font-size="13" fill="${RED}" font-weight="700"`) +
    L(60, 34, 60, 80, GRY, 1, 'stroke-dasharray="3 3"') + L(180, 34, 180, 80, GRY, 1, 'stroke-dasharray="3 3"') + line(60, 40, 180, 40, GRN, 2.2, true) + line(180, 40, 60, 40, GRN, 2.2, true) + C(120, 30, 'λ = ความยาวคลื่น (สัน → สัน)', `font-size="12" fill="${GRN}" font-weight="700"`) +
    C(180, 72, 'สันคลื่น', 'font-size="11.5" font-weight="700"') + C(120, 172, 'ท้องคลื่น', 'font-size="11.5" font-weight="700"') +
    C(190, 192, 'A = ระยะการกระจัดสูงสุดจากแนวสมดุล', `font-size="11.5" fill="${RED}" font-weight="600"`) + C(190, 210, 'T = เวลาที่เกิด 1 ลูกคลื่น · f = 1/T', 'font-size="12"'));

  /* 18) สายตาสั้นและการแก้ด้วยเลนส์เว้า */
  const eye = (cx, cy, focusX) => `<ellipse cx="${cx}" cy="${cy}" rx="62" ry="46" fill="#fff7ed" stroke="currentColor" stroke-width="2.5"/>` + `<path d="M${cx - 44} ${cy - 26}Q${cx - 34} ${cy} ${cx - 44} ${cy + 26}Q${cx - 54} ${cy} ${cx - 44} ${cy - 26}Z" fill="#bfdbfe" stroke="currentColor" stroke-width="2"/>` + `<path d="M${cx + 52} ${cy - 26}Q${cx + 66} ${cy} ${cx + 52} ${cy + 26}" fill="none" stroke="${RED}" stroke-width="4"/>`;
  F['m3-eye'] = svg(220,
    'สายตาสั้น แสงรวมกันก่อนถึงเรตินา แก้ด้วยเลนส์เว้าให้ภาพตกที่เรตินา',
    C(90, 16, 'สายตาสั้น', `font-weight="700" fill="${RED}"`) + eye(95, 90) +
    line(10, 75, 51, 75, 'currentColor', 2) + line(10, 90, 51, 90, 'currentColor', 2) + line(10, 105, 51, 105, 'currentColor', 2) +
    line(51, 75, 117, 90, ORG, 2) + line(51, 90, 117, 90, ORG, 2) + line(51, 105, 117, 90, ORG, 2) + line(117, 90, 147, 98, ORG, 2) + line(117, 90, 147, 82, ORG, 2) + line(117, 90, 147, 90, ORG, 2) +
    O(117, 90, 4, RED) + T(70, 160, 'ภาพรวมกันก่อน', `font-size="11" fill="${RED}" font-weight="700"`) + T(76, 174, 'ถึงเรตินา', `font-size="11" fill="${RED}" font-weight="700"`) + L(117, 98, 117, 150, GRY, 1, 'stroke-dasharray="3 3"') +
    C(270, 16, 'แก้ด้วยเลนส์เว้า', `font-weight="700" fill="${GRN}"`) + eye(285, 90) +
    `<path d="M196 56L208 56Q202 90 208 124L196 124Q202 90 196 56Z" fill="#bbf7d0" stroke="currentColor" stroke-width="2"/>` + T(184, 144, 'เลนส์เว้า', `font-size="11" fill="${GRN}" font-weight="700"`) +
    line(176, 80, 196, 78, 'currentColor', 2) + line(176, 100, 196, 102, 'currentColor', 2) + line(208, 74, 241, 76, ORG, 2) + line(208, 106, 241, 104, ORG, 2) + line(241, 76, 337, 90, ORG, 2) + line(241, 104, 337, 90, ORG, 2) + O(337, 90, 4, RED) +
    T(236, 160, 'ภาพตกที่เรตินาพอดี', `font-size="11" fill="${GRN}" font-weight="700"`) +
    C(180, 204, 'เรตินา = เส้นแดงด้านหลังตา', `font-size="11" fill="${RED}"`));

  /* 19) มิเตอร์ */
  F['m3-meters'] = svg(210,
    'แอมมิเตอร์ต่ออนุกรมกับตัวต้านทาน โวลต์มิเตอร์ต่อขนานคร่อมตัวต้านทาน',
    `<path d="M40 50H98M142 50H200M236 50H300V160H40V50" fill="none" stroke="currentColor" stroke-width="2"/>` + battery(40, 105) +
    O(120, 50, 20, '#fff', 'currentColor') + C(120, 56, 'A', 'font-size="17" font-weight="700"') + resH(200, 50, 'R') +
    `<path d="M206 50V102M230 50V102" fill="none" stroke="${PUR}" stroke-width="2"/>` + O(218, 112, 20, '#fff', PUR) + C(218, 118, 'V', `font-size="17" font-weight="700" fill="${PUR}"`) +
    T(30, 26, 'แอมมิเตอร์ A: ต่ออนุกรม (วัดกระแส)', `font-size="12" font-weight="700"`) + T(150, 176, 'โวลต์มิเตอร์ V: ต่อขนานคร่อมตัวต้านทาน (วัดความต่างศักย์)', `font-size="11.5" font-weight="700" fill="${PUR}"`).replace('x="150"', 'x="20"') +
    C(180, 198, 'แอมมิเตอร์ความต้านทานภายในน้อย · โวลต์มิเตอร์ความต้านทานภายในมาก', 'font-size="11"'));

  /* ===== ว 2.1 สสารและการเปลี่ยนแปลง ===== */
  const BLU2 = '#93c5fd', PNK = '#fca5a5', YEL = '#fde68a', GRN2 = '#86efac', WHT = '#ffffff';
  const P = (x, y, r = 6, fill = BLU2) => O(x, y, r, fill, 'currentColor');
  const sm = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="#fff" stroke="currentColor" stroke-width="1.5"/>`;

  /* 20) อนุภาคของสสาร 3 สถานะ */
  (function () {
    let solid = '', liquid = '', gas = '';
    for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) solid += P(26 + c * 17, 62 + r * 17, 6.5, BLU2);
    const lq = [[144, 130], [162, 130], [180, 130], [198, 130], [216, 130], [153, 117], [171, 117], [189, 117], [207, 117], [162, 104], [180, 104], [198, 104], [171, 91], [189, 91]];
    lq.forEach(p => { liquid += P(p[0], p[1], 6.5, BLU2); });
    const gs = [[272, 62, 1, -1], [320, 70, -1, 1], [290, 100, 1, 1], [336, 118, -1, -1], [268, 132, 1, -1], [310, 138, -1, 1], [286, 78, -1, -1]];
    gs.forEach(p => { gas += P(p[0], p[1], 6.5, BLU2) + arrow(`M${p[0]} ${p[1]}l${p[2] * 17} ${p[3] * 9}`, RED, 1.6); });
    F['m3-particles'] = svg(238,
      'แบบจำลองอนุภาคของของแข็ง ของเหลว และแก๊ส เรียงชิด ชิดกันแต่เลื่อนได้ ห่างกันมาก',
      R(14, 40, 100, 100, 'none', 'currentColor') + R(134, 40, 100, 100, 'none', 'currentColor') + R(254, 40, 100, 100, 'none', 'currentColor') + solid + liquid + gas +
      C(64, 28, 'ของแข็ง', 'font-size="13" font-weight="700"') + C(184, 28, 'ของเหลว', 'font-size="13" font-weight="700"') + C(304, 28, 'แก๊ส', 'font-size="13" font-weight="700"') +
      C(64, 160, 'อนุภาคชิดกัน', 'font-size="11"') + C(64, 174, 'เรียงเป็นระเบียบ', 'font-size="11"') + C(64, 188, 'สั่นอยู่กับที่', 'font-size="11"') + C(64, 206, 'แรงยึดเหนี่ยวมาก', `font-size="11" font-weight="700" fill="${GRN}"`) +
      C(184, 160, 'อนุภาคชิดกัน', 'font-size="11"') + C(184, 174, 'เรียงไม่เป็นระเบียบ', 'font-size="11"') + C(184, 188, 'เลื่อนที่ไปมาได้', 'font-size="11"') + C(184, 206, 'แรงยึดเหนี่ยวปานกลาง', `font-size="11" font-weight="700" fill="${ORG}"`) +
      C(304, 160, 'อนุภาคอยู่ห่างกันมาก', 'font-size="11"') + C(304, 174, 'เคลื่อนที่อิสระ', 'font-size="11"') + C(304, 188, 'ทุกทิศทางเร็วมาก', 'font-size="11"') + C(304, 206, 'แรงยึดเหนี่ยวน้อยมาก', `font-size="11" font-weight="700" fill="${RED}"`) +
      C(180, 226, 'ลูกศรแดง = ทิศการเคลื่อนที่ (ยาว = เร็ว)', `font-size="10.5" fill="${GRY}"`));
  })();

  /* 21) กราฟการให้ความร้อน สารบริสุทธิ์ กับ สารผสม */
  F['m3-curve-pure-mix'] = svg(262,
    'กราฟอุณหภูมิกับเวลาขณะให้ความร้อน สารบริสุทธิ์มีช่วงอุณหภูมิคงที่ขณะเปลี่ยนสถานะ สารผสมไม่มีช่วงราบชัดเจน',
    L(46, 200, 346, 200, 'currentColor', 2) + L(46, 200, 46, 12, 'currentColor', 2) + C(200, 220, 'เวลา (ให้ความร้อนอย่างสม่ำเสมอ)', 'font-size="12"') +
    `<text transform="translate(16 106) rotate(-90)" text-anchor="middle" font-size="12">อุณหภูมิ</text>` +
    L(46, 132, 346, 132, GRY, 1, 'stroke-dasharray="4 4"') + L(46, 64, 346, 64, GRY, 1, 'stroke-dasharray="4 4"') +
    T(52, 126, 'จุดหลอมเหลว', `font-size="10.5" fill="${GRY}"`) + T(52, 58, 'จุดเดือด', `font-size="10.5" fill="${GRY}"`) +
    `<polyline points="52,176 100,132 158,132 214,64 272,64 336,28" fill="none" stroke="${RED}" stroke-width="3"/>` +
    `<polyline points="52,180 96,150 174,110 232,76 290,52 336,34" fill="none" stroke="${BLUE}" stroke-width="3" stroke-dasharray="7 4"/>` +
    C(130, 156, 'หลอมเหลว', `font-size="11" font-weight="700" fill="${RED}"`) + C(243, 56, 'เดือด', `font-size="11" font-weight="700" fill="${RED}"`) +
    L(14, 238, 40, 238, RED, 3) + T(46, 242, 'สารบริสุทธิ์: ขณะเปลี่ยนสถานะอุณหภูมิคงที่ (เส้นราบ)', 'font-size="11"') +
    `<line x1="14" y1="254" x2="40" y2="254" stroke="${BLUE}" stroke-width="3" stroke-dasharray="7 4"/>` + T(46, 258, 'สารผสม: อุณหภูมิเปลี่ยนต่อเนื่อง ไม่มีเส้นราบชัดเจน', 'font-size="11"'));

  /* 22) โครมาโทกราฟีแบบกระดาษ */
  F['m3-chromatography'] = svg(238,
    'โครมาโทกราฟีแบบกระดาษ สารเคลื่อนที่ไปกับตัวทำละลายด้วยระยะต่างกัน',
    `<path d="M14 66V204H138V66" fill="none" stroke="currentColor" stroke-width="2.5"/>` + `<rect x="15" y="172" width="122" height="31" fill="#bfdbfe"/>` + C(76, 218, 'ตัวทำละลาย', 'font-size="11"') +
    `<rect x="58" y="30" width="36" height="154" fill="#fff" stroke="currentColor" stroke-width="2"/>` + `<rect x="59" y="140" width="34" height="43" fill="#dbeafe"/>` +
    L(58, 160, 94, 160, GRY, 1.5, 'stroke-dasharray="3 3"') + L(58, 52, 94, 52, BLUE, 2, 'stroke-dasharray="5 3"') +
    `<ellipse cx="76" cy="148" rx="9" ry="4" fill="#eab308"/>` + `<ellipse cx="76" cy="108" rx="9" ry="5" fill="#16a34a"/>` + `<ellipse cx="76" cy="74" rx="9" ry="5" fill="#2563eb"/>` +
    T(150, 50, 'แนวหน้าตัวทำละลาย (ไปถึงสูงสุด)', `font-size="10.5" fill="${BLUE}"`) +
    line(148, 76, 88, 76, '#2563eb', 1.4, true) + T(152, 70, 'สารสีน้ำเงิน: ละลายในตัวทำละลายดี', 'font-size="10.5"') + T(152, 84, 'ถูกตัวดูดซับยึดน้อย → เคลื่อนที่ไกลสุด', 'font-size="10.5"') +
    line(148, 108, 88, 108, '#16a34a', 1.4, true) + T(152, 112, 'สารสีเขียว: เคลื่อนที่ปานกลาง', 'font-size="10.5"') +
    line(148, 148, 88, 148, '#eab308', 1.4, true) + T(152, 144, 'สารสีเหลือง: ถูกตัวดูดซับยึดมาก', 'font-size="10.5"') + T(152, 158, 'เคลื่อนที่ช้าสุด อยู่ใกล้เส้นเริ่มต้น', 'font-size="10.5"') +
    T(152, 176, 'เส้นเริ่มต้น (ขีดด้วยดินสอ', 'font-size="10.5"') + T(152, 190, 'อยู่เหนือระดับตัวทำละลาย)', 'font-size="10.5"') + line(148, 182, 98, 162, GRY, 1.3, true));

  /* 23) การกลั่นอย่างง่าย */
  F['m3-distillation'] = svg(240,
    'ชุดการกลั่นอย่างง่าย น้ำหล่อเย็นเข้าทางล่างและออกทางบนของเครื่องควบแน่น',
    `<circle cx="64" cy="150" r="34" fill="#fde68a" stroke="currentColor" stroke-width="2.5"/>` + `<path d="M31 150a34 34 0 0 0 66 0z" fill="#fcd34d"/>` +
    `<rect x="56" y="92" width="16" height="30" fill="#fff" stroke="currentColor" stroke-width="2.5"/>` + L(50, 84, 78, 84, 'currentColor', 4) +
    L(64, 56, 64, 100, 'currentColor', 2) + O(64, 103, 4, RED) + C(64, 46, 'เทอร์มอมิเตอร์', 'font-size="10.5"') +
    `<path d="M72 100L108 106" stroke="currentColor" stroke-width="2.5" fill="none"/>` +
    `<g transform="rotate(20 108 106)"><rect x="124" y="92" width="136" height="28" fill="#bfdbfe" stroke="currentColor" stroke-width="2"/><rect x="108" y="102" width="170" height="8" fill="#fff" stroke="currentColor" stroke-width="2"/></g>` +
    arrow('M232 202V176', BLUE, 2.4) + T(112, 222, 'น้ำเย็นเข้า (ทางล่าง)', `font-size="10.5" fill="${BLUE}" font-weight="700"`) + arrow('M143 98V66', BLUE, 2.4) + T(152, 78, 'น้ำออก (ทางบน)', `font-size="10.5" fill="${BLUE}" font-weight="700"`) +
    `<path d="M268 168V190H320V168" fill="none" stroke="currentColor" stroke-width="2"/>` + `<rect x="269" y="186" width="50" height="3" fill="#93c5fd"/>` + O(278, 168, 2.5, BLUE) + C(294, 206, 'ตัวกลั่น', 'font-size="11" font-weight="700"') + C(294, 220, '(ของเหลวบริสุทธิ์)', 'font-size="10.5"') +
    `<g transform="translate(0 22)"><path d="M54 190q-6 -12 0 -22q4 10 10 -2q8 14 0 24z" fill="#f97316" stroke="#c2410c" stroke-width="1.5"/><path d="M74 190q-4 -10 2 -18q6 8 8 18z" fill="#f97316" stroke="#c2410c" stroke-width="1.5"/></g>` + C(64, 232, 'ให้ความร้อน', 'font-size="11" font-weight="700"') +
    C(300, 90, 'ไอเย็นลง → ควบแน่น', 'font-size="11" font-weight="700"') + C(300, 106, 'เป็นของเหลว', 'font-size="11" font-weight="700"'));

  /* 24) กราฟสภาพละลายได้ */
  (function () {
    const gx = t => 56 + t * 2.8, gy = s => 204 - s * 1.5;
    const pts = (a) => a.map((s, i) => `${gx(i * 20)},${gy(s)}`).join(' ');
    const Pc = [20, 30, 43, 58, 76, 96], Qc = [34, 35, 37, 39, 41, 44], Rc = [60, 50, 41, 33, 26, 20];
    let ticks = '';
    for (let t = 0; t <= 100; t += 20) ticks += L(gx(t), 204, gx(t), 208, 'currentColor', 1.5) + C(gx(t), 220, t, 'font-size="11"');
    for (let s = 0; s <= 120; s += 40) ticks += L(52, gy(s), 56, gy(s), 'currentColor', 1.5) + T(26, gy(s) + 4, s, 'font-size="11"');
    F['m3-solubility'] = svg(262,
      'กราฟสภาพละลายได้ของสาร P Q R ในน้ำ 100 กรัมที่อุณหภูมิต่าง ๆ',
      L(56, 204, 346, 204, 'currentColor', 2) + L(56, 204, 56, 18, 'currentColor', 2) + ticks + C(200, 238, 'อุณหภูมิ (°C)', 'font-size="12"') +
      `<text transform="translate(12 112) rotate(-90)" text-anchor="middle" font-size="11">สภาพละลายได้ (g ต่อน้ำ 100 g)</text>` +
      `<polyline points="${pts(Pc)}" fill="none" stroke="${RED}" stroke-width="3"/>` + `<polyline points="${pts(Qc)}" fill="none" stroke="${BLUE}" stroke-width="3"/>` + `<polyline points="${pts(Rc)}" fill="none" stroke="${GRN}" stroke-width="3"/>` +
      T(gx(100) + 3, gy(96) + 4, 'P', `font-size="13" font-weight="700" fill="${RED}"`) + T(gx(100) + 3, gy(44) + 4, 'Q', `font-size="13" font-weight="700" fill="${BLUE}"`) + T(gx(100) + 3, gy(20) + 4, 'R', `font-size="13" font-weight="700" fill="${GRN}"`) +
      L(gx(60), gy(58), gx(60), 204, GRY, 1.2, 'stroke-dasharray="4 4"') + O(gx(60), gy(58), 4, RED) + O(gx(60), gy(39), 4, BLUE) + O(gx(60), gy(33), 4, GRN) +
      T(gx(60) - 118, gy(58) - 8, 'ที่ 60 °C: P ละลายได้ 58 g', `font-size="10.5" fill="${RED}" font-weight="600"`));
  })();

  /* 25) กฎทรงมวล: ระบบเปิด / ระบบปิด */
  F['m3-open-closed'] = svg(244,
    'เปรียบเทียบระบบเปิดที่แก๊สหลุดออกจนมวลลดลง กับระบบปิดที่เก็บแก๊สไว้ มวลรวมคงที่',
    C(90, 16, 'ระบบเปิด', 'font-size="13" font-weight="700"') + C(270, 16, 'ระบบปิด', 'font-size="13" font-weight="700"') +
    `<path d="M50 62V134H130V62" fill="none" stroke="currentColor" stroke-width="2.5"/>` + `<rect x="51" y="100" width="78" height="33" fill="#bfdbfe"/>` + P(70, 118, 3, '#fff') + P(96, 112, 3, '#fff') + P(112, 122, 3, '#fff') +
    arrow('M72 96V54', RED, 2.2) + arrow('M104 96V50', RED, 2.2) + T(34, 44, 'แก๊สหลุดออก', `font-size="11" fill="${RED}" font-weight="700"`) +
    `<polygon points="50,138 130,138 138,150 42,150" fill="#d1d5db" stroke="currentColor" stroke-width="2"/>` + sm(54, 158, 72, 22) + C(90, 174, '98.4 g', 'font-size="13" font-weight="700"') + C(90, 196, 'ก่อนทำปฏิกิริยา 100.0 g', 'font-size="11"') + C(90, 212, 'มวลลดลง (แก๊สออกจากระบบ)', `font-size="11" font-weight="700" fill="${RED}"`) +
    `<path d="M252 84L240 134H300L288 84z" fill="#bfdbfe" stroke="currentColor" stroke-width="2.5"/>` + `<rect x="259" y="68" width="22" height="18" fill="#fff" stroke="currentColor" stroke-width="2.5"/>` +
    `<ellipse cx="270" cy="46" rx="22" ry="22" fill="#fecaca" stroke="${RED}" stroke-width="2"/>` + C(270, 44, 'แก๊ส', 'font-size="11" font-weight="700"') + C(270, 57, 'ในลูกโป่ง', 'font-size="10"') +
    `<polygon points="226,138 314,138 322,150 218,150" fill="#d1d5db" stroke="currentColor" stroke-width="2"/>` + sm(234, 158, 72, 22) + C(270, 174, '100.0 g', 'font-size="13" font-weight="700"') + C(270, 196, 'ก่อนทำปฏิกิริยา 100.0 g', 'font-size="11"') + C(270, 212, 'มวลคงที่ (เก็บแก๊สไว้ในระบบ)', `font-size="11" font-weight="700" fill="${GRN}"`));

  /* 26) พลังงานของปฏิกิริยาดูดความร้อน / คายความร้อน */
  F['m3-energy-diagram'] = svg(226,
    'แผนภาพพลังงาน ปฏิกิริยาดูดความร้อน ผลิตภัณฑ์มีพลังงานมากกว่า ปฏิกิริยาคายความร้อน ผลิตภัณฑ์มีพลังงานน้อยกว่า',
    C(98, 16, 'ปฏิกิริยาดูดความร้อน', `font-size="12.5" font-weight="700" fill="${BLUE}"`) + C(272, 16, 'ปฏิกิริยาคายความร้อน', `font-size="12.5" font-weight="700" fill="${RED}"`) +
    arrow('M22 160V30', 'currentColor', 2) + T(8, 24, 'พลังงาน', 'font-size="10.5"') + arrow('M196 160V30', 'currentColor', 2) + T(166, 24, 'พลังงาน', 'font-size="10.5"') +
    L(34, 138, 90, 138, 'currentColor', 3.5) + T(36, 154, 'สารตั้งต้น', 'font-size="11" font-weight="700"') + L(124, 70, 180, 70, 'currentColor', 3.5) + T(124, 62, 'ผลิตภัณฑ์', 'font-size="11" font-weight="700"') + arrow('M108 134V76', BLUE, 2.4) + T(114, 108, 'รับพลังงาน', `font-size="11" fill="${BLUE}" font-weight="700"`) +
    L(206, 62, 260, 62, 'currentColor', 3.5) + T(206, 54, 'สารตั้งต้น', 'font-size="11" font-weight="700"') + L(296, 134, 350, 134, 'currentColor', 3.5) + T(296, 150, 'ผลิตภัณฑ์', 'font-size="11" font-weight="700"') + arrow('M280 66V130', RED, 2.4) + T(288, 104, 'ปล่อยพลังงาน', `font-size="11" fill="${RED}" font-weight="700"`) +
    C(98, 182, 'ผลิตภัณฑ์พลังงานมากกว่า', 'font-size="11"') + C(98, 198, 'ดูดความร้อนจากสิ่งแวดล้อม', 'font-size="11" font-weight="700"') + C(98, 214, 'อุณหภูมิรอบข้าง ↓ (เย็นลง)', `font-size="11" fill="${BLUE}" font-weight="700"`) +
    C(272, 182, 'ผลิตภัณฑ์พลังงานน้อยกว่า', 'font-size="11"') + C(272, 198, 'ถ่ายโอนความร้อนสู่สิ่งแวดล้อม', 'font-size="11" font-weight="700"') + C(272, 214, 'อุณหภูมิรอบข้าง ↑ (ร้อนขึ้น)', `font-size="11" fill="${RED}" font-weight="700"`));

  /* 27) แบบจำลองธาตุ สารประกอบ สารผสม */
  (function () {
    const A = (x, y) => P(x, y, 7, BLU2), B = (x, y) => P(x, y, 7, PNK), G = (x, y) => P(x, y, 5, GRN2);
    const pair = (x, y) => A(x, y) + B(x + 12, y);
    let el = '', cp = '', mx = '';
    [[34, 58], [64, 58], [94, 58], [34, 86], [64, 86], [94, 86], [34, 114], [64, 114], [94, 114]].forEach(p => { el += A(p[0], p[1]); });
    [[24, 58], [64, 66], [24, 90], [64, 98], [24, 122], [64, 130]].forEach(p => { cp += pair(p[0] + 140 - 14, p[1]); });
    mx += pair(268, 62) + A(306, 72) + A(338, 60) + pair(270, 100) + pair(304, 112) + A(338, 98) + A(280, 128) + pair(308, 134) + A(340, 130);
    F['m3-matter-models'] = svg(200,
      'แบบจำลองของธาตุ สารประกอบ และสารผสม',
      R(14, 40, 112, 106, 'none', 'currentColor') + R(134, 40, 112, 106, 'none', 'currentColor') + R(254, 40, 100, 106, 'none', 'currentColor') + el + cp + mx +
      C(70, 28, 'ธาตุ', 'font-size="13" font-weight="700"') + C(190, 28, 'สารประกอบ', 'font-size="13" font-weight="700"') + C(304, 28, 'สารผสม', 'font-size="13" font-weight="700"') +
      C(70, 164, 'อะตอมชนิดเดียวกัน', 'font-size="10.5"') + C(70, 178, 'ทั้งหมด', 'font-size="10.5"') +
      C(190, 164, 'อะตอมต่างชนิด จับกัน', 'font-size="10.5"') + C(190, 178, 'เป็นหน่วยเดียวกัน', 'font-size="10.5"') +
      C(304, 164, 'มีสารหลายชนิด', 'font-size="10.5"') + C(304, 178, 'ปนกัน (ไม่ได้เกิดสารใหม่)', 'font-size="10.5"'));
  })();

  /* 28) ช่วง pH และการเปลี่ยนสีของอินดิเคเตอร์ */
  (function () {
    const px = v => 24 + v * 23;
    const bar = (y, a, b, c1, c2, name, rng) => `<rect x="${px(a)}" y="${y}" width="${px(b) - px(a)}" height="16" fill="${c1}" stroke="currentColor" stroke-width="1.2"/>` + `<rect x="${px(a) + (px(b) - px(a)) * 0.5}" y="${y}" width="${(px(b) - px(a)) * 0.5}" height="16" fill="${c2}" stroke="currentColor" stroke-width="1.2"/>` +
      (b >= 9 ? T(px(a) - 6, y + 12, `${name} (${rng})`, 'font-size="10.5" text-anchor="end"') : T(px(b) + 6, y + 12, `${name} (${rng})`, 'font-size="10.5"'));
    let tk = '';
    for (let v = 0; v <= 14; v += 2) tk += L(px(v), 46, px(v), 52, 'currentColor', 1.5) + C(px(v), 66, v, 'font-size="11"');
    F['m3-ph-range'] = svg(240,
      'ช่วง pH ที่อินดิเคเตอร์เปลี่ยนสี เทียบกับสเกล pH 0 ถึง 14',
      `<rect x="${px(0)}" y="28" width="${px(7) - px(0)}" height="16" fill="#fecaca"/><rect x="${px(7)}" y="28" width="${px(14) - px(7)}" height="16" fill="#bfdbfe"/>` + L(px(0), 46, px(14), 46, 'currentColor', 2) + tk +
      C(px(3.5), 22, 'กรด (pH < 7)', `font-size="11" font-weight="700" fill="${RED}"`) + C(px(10.5), 22, 'เบส (pH > 7)', `font-size="11" font-weight="700" fill="${BLUE}"`) + L(px(7), 28, px(7), 52, 'currentColor', 2) + C(px(7), 80, 'pH 7 = กลาง', 'font-size="11" font-weight="700"') +
      bar(112, 4.4, 6.2, '#fca5a5', '#fde047', 'เมทิลเรด', '4.4–6.2') + bar(136, 6.0, 7.6, '#fde047', '#93c5fd', 'โบรโมไทมอลบลู', '6.0–7.6') + bar(160, 6.8, 8.4, '#fde047', '#f87171', 'ฟีนอลเรด', '6.8–8.4') + bar(184, 8.3, 10.0, '#ffffff', '#f9a8d4', 'ฟีนอล์ฟทาลีน', '8.3–10.0') +
      T(24, 102, 'แถบ = ช่วง pH ที่เปลี่ยนสี (ซ้ายของแถบ = สีที่ pH ต่ำ · ขวา = สีที่ pH สูง)', 'font-size="10.5"') + C(180, 226, 'เลือกอินดิเคเตอร์ที่ช่วงเปลี่ยนสี "คร่อม" ค่า pH ที่ต้องการแยก', 'font-size="11" font-weight="700"'));
  })();

  /* 29) ปฏิกิริยาเคมี: อะตอมจัดเรียงใหม่ จำนวนอะตอมเท่าเดิม */
  F['m3-atoms-rearrange'] = svg(196,
    'อะตอมจัดเรียงตัวใหม่ในปฏิกิริยา จำนวนอะตอมแต่ละชนิดก่อนและหลังปฏิกิริยาเท่ากัน',
    C(80, 16, 'สารตั้งต้น', 'font-size="12.5" font-weight="700"') + C(274, 16, 'ผลิตภัณฑ์', 'font-size="12.5" font-weight="700"') +
    P(34, 54, 6, BLU2) + P(46, 54, 6, BLU2) + P(80, 54, 6, BLU2) + P(92, 54, 6, BLU2) + T(112, 58, '+', 'font-size="16" font-weight="700"') + P(140, 54, 9, PNK) + P(158, 54, 9, PNK) +
    arrow('M180 54H212', 'currentColor', 2.6) +
    P(246, 40, 9, PNK) + P(232, 56, 6, BLU2) + P(260, 56, 6, BLU2) + P(310, 40, 9, PNK) + P(296, 56, 6, BLU2) + P(324, 56, 6, BLU2) +
    C(90, 92, 'ไฮโดรเจน (2 ชุด) + ออกซิเจน', 'font-size="11"') + C(278, 92, 'น้ำ (2 ชุด)', 'font-size="11"') +
    C(90, 122, 'H 4 อะตอม · O 2 อะตอม', `font-size="11.5" font-weight="700"`) + C(278, 122, 'H 4 อะตอม · O 2 อะตอม', `font-size="11.5" font-weight="700"`) +
    C(180, 152, 'อะตอมไม่หาย ไม่เกิดขึ้นใหม่ เปลี่ยนแค่การจัดเรียงตัว', `font-size="11.5" font-weight="700" fill="${GRN}"`) + C(180, 172, 'ไฮโดรเจน + ออกซิเจน → น้ำ  (สมการข้อความ)', 'font-size="11"') + C(180, 188, '● ชมพู = ออกซิเจน · ● ฟ้า = ไฮโดรเจน', 'font-size="10.5"'));

  /* 30) โครงสร้างอะตอม */
  F['m3-atom'] = svg(200,
    'โครงสร้างอะตอม นิวเคลียสมีโปรตอนกับนิวตรอน อิเล็กตรอนอยู่รอบนิวเคลียส',
    `<circle cx="84" cy="100" r="34" fill="none" stroke="${GRY}" stroke-width="1.5" stroke-dasharray="4 3"/><circle cx="84" cy="100" r="70" fill="none" stroke="${GRY}" stroke-width="1.5" stroke-dasharray="4 3"/>` +
    P(76, 94, 4.6, PNK) + P(86, 92, 4.6, PNK) + P(82, 103, 4.6, PNK) + P(95, 98, 4.6, '#e5e7eb') + P(72, 104, 4.6, '#e5e7eb') + P(92, 108, 4.6, '#e5e7eb') + P(79, 113, 4.6, '#e5e7eb') +
    P(118, 100, 5, '#fde68a') + P(50, 100, 5, '#fde68a') + P(84, 30, 5, '#fde68a') +
    T(168, 44, 'นิวเคลียส (มวลเกือบทั้งหมด)', 'font-size="10.5" font-weight="700"') + line(166, 50, 100, 94, GRY, 1.2, true) +
    T(168, 80, '● โปรตอน (ประจุ +)', `font-size="10.5" fill="${RED}" font-weight="700"`) + T(168, 96, '● นิวตรอน (ไม่มีประจุ)', `font-size="10.5" font-weight="700" fill="${GRY}"`) + T(168, 112, '● อิเล็กตรอน (ประจุ −)', `font-size="10.5" font-weight="700" fill="#a16207"`) +
    T(168, 140, 'เลขอะตอม = จำนวนโปรตอน', 'font-size="10.5"') + T(168, 156, 'เป็นกลาง: โปรตอน = อิเล็กตรอน', 'font-size="10.5"') + T(168, 172, 'ภาพนี้: โปรตอน 3 นิวตรอน 4', 'font-size="10.5"') + T(168, 186, 'อิเล็กตรอน 3', 'font-size="10.5"'));

  /* ===== ว 1.2 ชีววิทยา: เซลล์ พืช (ส่วนที่ 1) ===== */
  const YEL2 = '#fef9c3', LGRN = '#bbf7d0', PINK = '#fecdd3', LBL = '#dbeafe', OR2 = '#fdba74';
  const mk2 = (x, y, n) => `<circle cx="${x}" cy="${y}" r="7.5" fill="#fff" stroke="currentColor" stroke-width="1.5"/>` + C(x, y + 3.4, n, 'font-size="9.5" font-weight="700"');
  const E = (cx, cy, rx, ry, fill, stroke = 'currentColor', sw = 1.5, extra = '') => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" ${extra}/>`;

  /* 31) เซลล์พืชและเซลล์สัตว์ */
  F['m3-plant-animal-cell'] = svg(312,
    'เซลล์พืชมีผนังเซลล์ คลอโรพลาสต์ และแวคิวโอลขนาดใหญ่ เซลล์สัตว์ไม่มีผนังเซลล์และคลอโรพลาสต์',
    C(92, 14, 'เซลล์พืช', 'font-size="13" font-weight="700"') + C(272, 14, 'เซลล์สัตว์', 'font-size="13" font-weight="700"') +
    `<rect x="12" y="24" width="160" height="148" rx="10" fill="${YEL2}" stroke="#15803d" stroke-width="5"/><rect x="18" y="30" width="148" height="136" rx="6" fill="none" stroke="#db2777" stroke-width="1.5"/>` +
    E(100, 112, 40, 32, LBL, '#2563eb', 1.5) + E(52, 64, 15, 13, '#e9d5ff', '#6b21a8', 2) + O(54, 64, 4, '#6b21a8') +
    E(34, 120, 9, 5, LGRN, '#166534') + E(40, 142, 9, 5, LGRN, '#166534') + E(142, 52, 9, 5, LGRN, '#166534') + E(150, 140, 9, 5, LGRN, '#166534') + E(116, 48, 9, 5, LGRN, '#166534') +
    E(86, 156, 8, 4, OR2, '#9a3412') + E(150, 96, 8, 4, OR2, '#9a3412') +
    mk2(12, 98, 1) + mk2(24, 82, 2) + mk2(78, 38, 3) + mk2(52, 64, 4) + mk2(100, 112, 5) + mk2(86, 156, 6) + mk2(142, 52, 7) +
    `<circle cx="272" cy="98" r="66" fill="${YEL2}" stroke="#db2777" stroke-width="2.5"/>` + E(272, 92, 20, 18, '#e9d5ff', '#6b21a8', 2) + O(274, 92, 5, '#6b21a8') +
    E(236, 128, 9, 4, OR2, '#9a3412') + E(300, 132, 9, 4, OR2, '#9a3412') + E(312, 76, 9, 4, OR2, '#9a3412') + O(240, 70, 6, LBL, '#2563eb') + O(296, 56, 5, LBL, '#2563eb') +
    mk2(206, 98, 2) + mk2(256, 60, 3) + mk2(272, 92, 4) + mk2(300, 132, 6) + mk2(240, 70, 5) +
    T(8, 196, '① ผนังเซลล์ — ค้ำจุน ป้องกัน (เซลล์พืชเท่านั้น)', 'font-size="11"') + T(8, 212, '② เยื่อหุ้มเซลล์ — ควบคุมการผ่านเข้า-ออกของสาร', 'font-size="11"') + T(8, 228, '③ ไซโทพลาสซึม — ที่อยู่ของออร์แกเนลล์ เกิดปฏิกิริยาเคมี', 'font-size="11"') +
    T(8, 244, '④ นิวเคลียส — ควบคุมกิจกรรมของเซลล์ เก็บสารพันธุกรรม', 'font-size="11"') + T(8, 260, '⑤ แวคิวโอล — เก็บน้ำและสาร (เซลล์พืชมีขนาดใหญ่ ตรงกลาง)', 'font-size="11"') +
    T(8, 276, '⑥ ไมโทคอนเดรีย — ปลดปล่อยพลังงานจากอาหาร (ทั้งพืชและสัตว์)', 'font-size="11"') + T(8, 292, '⑦ คลอโรพลาสต์ — สังเคราะห์ด้วยแสง (เซลล์พืชที่มีสีเขียว)', 'font-size="11"'));

  /* 32) กำลังขยายกับพื้นที่ที่เห็น */
  (function () {
    const hex = (cx, cy, r) => { let s = ''; for (let i = 0; i < 6; i++) { const a = Math.PI / 3 * i + Math.PI / 6; s += `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)} `; } return `<polygon points="${s}" fill="#bbf7d0" stroke="#166534" stroke-width="1.2"/>` + O(cx, cy, r * 0.28, '#6b21a8'); };
    let low = '', high = '';
    const cs = [[-30, -34], [0, -38], [30, -34], [-44, -10], [-14, -14], [16, -10], [46, -14], [-30, 14], [0, 16], [30, 14], [-14, 40], [16, 40]];
    cs.forEach(c => { low += hex(90 + c[0], 96 + c[1], 11); });
    [[-18, -22], [26, 6], [-14, 30]].forEach(c => { high += hex(270 + c[0], 96 + c[1], 30); });
    F['m3-microscope-fov'] = svg(214,
      'กำลังขยายต่ำเห็นพื้นที่กว้างและเซลล์จำนวนมาก กำลังขยายสูงเห็นพื้นที่แคบและเซลล์ใหญ่จำนวนน้อย',
      `<clipPath id="fv1"><circle cx="90" cy="96" r="66"/></clipPath><clipPath id="fv2"><circle cx="270" cy="96" r="66"/></clipPath>` + `<circle cx="90" cy="96" r="66" fill="#f8fafc"/><circle cx="270" cy="96" r="66" fill="#f8fafc"/><g clip-path="url(#fv1)">${low}</g><g clip-path="url(#fv2)">${high}</g>` +
      `<circle cx="90" cy="96" r="66" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="270" cy="96" r="66" fill="none" stroke="currentColor" stroke-width="3"/>` +
      C(90, 14, 'เลนส์ใกล้วัตถุกำลังขยายต่ำ (10X)', 'font-size="11" font-weight="700"') + C(270, 14, 'เลนส์ใกล้วัตถุกำลังขยายสูง (40X)', 'font-size="11" font-weight="700"') +
      C(90, 178, 'เห็นพื้นที่กว้าง เซลล์เล็ก จำนวนมาก', 'font-size="11"') + C(270, 178, 'เห็นพื้นที่แคบ เซลล์ใหญ่ จำนวนน้อย', 'font-size="11"') +
      C(180, 202, 'กำลังขยายรวม = กำลังขยายเลนส์ใกล้ตา × กำลังขยายเลนส์ใกล้วัตถุ', 'font-size="11" font-weight="700"'));
  })();

  /* 33) ออสโมซิสของเซลล์ในสารละลายต่างความเข้มข้น */
  (function () {
    const bk = (x, tag, cellR, solute, water) => `<path d="M${x} 52V170H${x + 100}V52" fill="none" stroke="currentColor" stroke-width="2.5"/><rect x="${x + 1}" y="74" width="98" height="95" fill="#bfdbfe"/>` + (() => { let s = ''; for (let i = 0; i < solute; i++) s += O(x + 12 + (i * 37) % 76, 84 + (i * 23) % 80, 2.2, '#b45309'); return s; })() +
      `<circle cx="${x + 50}" cy="122" r="${cellR}" fill="${YEL2}" stroke="#db2777" stroke-width="2.5"/>` + O(x + 50, 122, 5, '#6b21a8') + C(x + 50, 192, tag[0], 'font-size="11" font-weight="700"') + C(x + 50, 206, tag[1], 'font-size="10.5"');
    F['m3-osmosis'] = svg(300,
      'เซลล์ในสารละลายเจือจางกว่าจะพองขึ้นเพราะน้ำเข้า ในสารละลายเข้มข้นกว่าจะเหี่ยวลงเพราะน้ำออก',
      C(60, 14, 'สารละลายนอกเซลล์', 'font-size="10.5" font-weight="700"') + C(60, 28, 'เจือจางกว่าในเซลล์', 'font-size="10.5" font-weight="700"') + C(180, 14, 'สารละลายนอกเซลล์', 'font-size="10.5" font-weight="700"') + C(180, 28, 'เข้มข้นเท่ากับในเซลล์', 'font-size="10.5" font-weight="700"') + C(300, 14, 'สารละลายนอกเซลล์', 'font-size="10.5" font-weight="700"') + C(300, 28, 'เข้มข้นกว่าในเซลล์', 'font-size="10.5" font-weight="700"') +
      bk(10, ['น้ำเข้าเซลล์', 'เซลล์พองใหญ่'], 36, 3) + bk(130, ['น้ำเข้า = ออก', 'ขนาดคงที่'], 26, 8) + bk(250, ['น้ำออกจากเซลล์', 'เซลล์เหี่ยวเล็กลง'], 17, 16) +
      arrow('M24 96L40 108', BLUE) + arrow('M96 96L80 108', BLUE) + arrow('M60 184V164', BLUE) + arrow('M170 112H158', BLUE) + arrow('M190 112H202', BLUE) + arrow('M146 132H156', BLUE) + arrow('M214 132H204', BLUE) + arrow('M292 114L276 102', BLUE) + arrow('M308 114L324 102', BLUE) +
      C(180, 232, 'น้ำออสโมซิส: จากที่มีน้ำมาก (สารละลายเจือจาง) → ที่มีน้ำน้อย (เข้มข้น)', 'font-size="11" font-weight="700"') + C(180, 250, 'ผ่านเยื่อหุ้มเซลล์ซึ่งยอมให้น้ำผ่านได้ดีกว่าตัวละลาย', 'font-size="10.5"') +
      C(180, 270, '● จุดสีน้ำตาล = ตัวละลาย (มากขึ้น = เข้มข้นขึ้น)', 'font-size="10.5"') + C(180, 288, 'ลูกศรน้ำเงิน = ทิศทางที่น้ำเคลื่อนที่', `font-size="10.5" fill="${BLUE}"`));
  })();

  /* 34) ทดสอบแป้งในใบ: แสง และ CO2 */
  (function () {
    const leaf = (x, y, col = '#4ade80') => `<path d="M${x} ${y}q22 -40 46 0q-22 40 -46 0z" fill="${col}" stroke="#166534" stroke-width="1.5"/>` + L(x + 2, y, x + 44, y, '#166534', 1);
    const bag = (x, fill, op) => `<rect x="${x}" y="34" width="104" height="92" rx="8" fill="${fill}" fill-opacity="${op}" stroke="${GRY}" stroke-width="2.5"/>`;
    F['m3-leaf-test'] = svg(284,
      'ใบพืชที่ผ่านที่มืดมาแล้ว ตากแดดในถุงต่างชนิด แล้วทดสอบแป้งด้วยไอโอดีน',
      C(180, 14, 'ใบพืชที่ไม่มีแป้งก่อนทดลอง (วางที่มืด 2 วัน) ตากแดด 5 ชั่วโมง', 'font-size="11" font-weight="700"') +
      bag(8, '#ffffff', 0.5) + leaf(34, 80) + bag(128, '#1f2937', 0.85) + leaf(154, 80, '#16a34a') + bag(248, '#ffffff', 0.5) + leaf(274, 70) + R(266, 98, 28, 20, '#e5e7eb', 'currentColor') + C(280, 112, 'NaOH', 'font-size="9.5" font-weight="700"') +
      C(60, 148, 'ถุงโปร่งแสง', 'font-size="11" font-weight="700"') + C(60, 162, 'มีแสง มี CO₂', 'font-size="10.5"') + C(180, 148, 'ถุงทึบแสง', 'font-size="11" font-weight="700"') + C(180, 162, 'ไม่มีแสง มี CO₂', 'font-size="10.5"') + C(300, 148, 'ถุงโปร่งแสง + NaOH', 'font-size="11" font-weight="700"') + C(300, 162, 'มีแสง ไม่มี CO₂', 'font-size="10.5"') +
      C(60, 184, 'หยดไอโอดีน', 'font-size="10.5"') + R(34, 190, 52, 20, '#1e3a8a') + C(60, 224, 'น้ำเงินเข้ม', `font-size="10.5" font-weight="700"`) + C(60, 238, '= มีแป้ง', 'font-size="10.5"') +
      C(180, 184, 'หยดไอโอดีน', 'font-size="10.5"') + R(154, 190, 52, 20, '#b45309') + C(180, 224, 'สีน้ำตาลเหลือง', 'font-size="10.5" font-weight="700"') + C(180, 238, '= ไม่มีแป้ง', 'font-size="10.5"') +
      C(300, 184, 'หยดไอโอดีน', 'font-size="10.5"') + R(274, 190, 52, 20, '#b45309') + C(300, 224, 'สีน้ำตาลเหลือง', 'font-size="10.5" font-weight="700"') + C(300, 238, '= ไม่มีแป้ง (หรือน้อย)', 'font-size="10.5"') +
      C(180, 262, 'ซ้าย-กลาง: ศึกษาแสง · ซ้าย-ขวา: ศึกษา CO₂ (ต่างตัวแปรเดียว)', `font-size="11" font-weight="700" fill="${RED}"`) + C(180, 278, 'NaOH ดูดซับ CO₂ ในถุง', 'font-size="10.5"'));
  })();

  /* 35) อัตราการสังเคราะห์ด้วยแสงกับความเข้มแสง (ฟองออกซิเจนจากพืชน้ำ) */
  F['m3-photo-rate'] = svg(262,
    'ชุดทดลองพืชน้ำเก็บฟองแก๊สออกซิเจน และกราฟจำนวนฟองกับระยะห่างจากหลอดไฟ ยิ่งใกล้ยิ่งมีฟองมาก',
    `<circle cx="26" cy="132" r="14" fill="#fde047" stroke="#ca8a04" stroke-width="2"/>` + L(26, 106, 26, 96, '#ca8a04', 2) + L(2, 132, -2, 132, '#ca8a04', 2) + L(46, 118, 56, 110, '#ca8a04', 2) + L(46, 146, 56, 154, '#ca8a04', 2) + T(2, 172, 'หลอดไฟ', 'font-size="10.5" font-weight="700"') +
    `<path d="M86 124V196H166V124" fill="none" stroke="currentColor" stroke-width="2.5"/><rect x="87" y="136" width="78" height="59" fill="#bfdbfe"/>` +
    `<path d="M104 190L110 168L120 168L120 186" fill="none" stroke="#166534" stroke-width="2"/><path d="M136 190L132 160L146 150" fill="none" stroke="#166534" stroke-width="2"/><path d="M112 168q-10 -6 -4 -14M140 156q-10 -4 -2 -14" fill="none" stroke="#166534" stroke-width="2"/>` +
    `<path d="M106 164L146 164L134 118L118 118Z" fill="#e0f2fe" stroke="currentColor" stroke-width="2"/><rect x="119" y="52" width="14" height="66" fill="#e0f2fe" stroke="currentColor" stroke-width="2"/><rect x="120" y="76" width="12" height="42" fill="#bfdbfe"/><rect x="120" y="53" width="12" height="24" fill="#fff"/>` +
    O(126, 66, 2.5, '#94a3b8') + O(110, 148, 2.5, '#fff', '#64748b') + O(126, 140, 2, '#fff', '#64748b') + T(138, 66, 'ฟองแก๊ส O₂', 'font-size="10.5" font-weight="700"') +
    arrow('M57 212H32') + arrow('M57 212H84') + C(57, 228, 'ระยะ d', 'font-size="10.5" font-weight="700"') +
    L(206, 214, 348, 214, 'currentColor', 2) + L(206, 214, 206, 40, 'currentColor', 2) + `<polyline points="214,56 238,92 266,130 300,164 336,184" fill="none" stroke="${RED}" stroke-width="3"/>` + O(214, 56, 3.5, RED) + O(266, 130, 3.5, RED) + O(336, 184, 3.5, RED) +
    C(277, 232, 'ระยะ d จากหลอดไฟ (ไกลขึ้น →)', 'font-size="10.5"') + `<text transform="translate(196 126) rotate(-90)" text-anchor="middle" font-size="10.5">จำนวนฟอง/นาที</text>` +
    T(222, 46, 'ใกล้ = แสงเข้ม ฟองมาก', `font-size="10.5" fill="${RED}" font-weight="700"`) + T(266, 200, 'ไกล = ฟองน้อย', `font-size="10.5" fill="${RED}"`));

  /* ===== ว 1.2 ชีววิทยา: พืช ระบบลำเลียงและการสืบพันธุ์ (ส่วนที่ 2) ===== */
  /* 36) ไซเล็มและโฟลเอ็ม */
  (function () {
    let bundles = '';
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4, cx = 282 + 36 * Math.cos(a), cy = 108 + 36 * Math.sin(a), rot = i * 45 + 90;
      bundles += `<g transform="rotate(${rot} ${cx.toFixed(1)} ${cy.toFixed(1)})"><ellipse cx="${cx.toFixed(1)}" cy="${(cy - 8).toFixed(1)}" rx="8" ry="5" fill="#fdba74" stroke="#9a3412" stroke-width="1.2"/><ellipse cx="${cx.toFixed(1)}" cy="${(cy + 4).toFixed(1)}" rx="7" ry="6" fill="#60a5fa" stroke="#1e3a8a" stroke-width="1.2"/></g>`;
    }
    F['m3-stem-vascular'] = svg(262,
      'ไซเล็มลำเลียงน้ำและแร่ธาตุจากรากขึ้นไปทางเดียว โฟลเอ็มลำเลียงอาหารจากใบไปส่วนต่าง ๆ ได้ทั้งขึ้นและลง ภาคตัดขวางลำต้น โฟลเอ็มอยู่ด้านนอก ไซเล็มอยู่ด้านใน',
      `<path d="M60 218V90" stroke="#15803d" stroke-width="7"/><path d="M60 150Q30 138 18 110Q46 114 60 138" fill="#4ade80" stroke="#166534" stroke-width="2"/><path d="M60 126Q90 116 104 88Q74 92 60 114" fill="#4ade80" stroke="#166534" stroke-width="2"/><path d="M60 96Q44 76 52 50Q70 66 60 96" fill="#4ade80" stroke="#166534" stroke-width="2"/>` +
      `<path d="M60 218L36 246M60 218L60 252M60 218L86 246" stroke="#92400e" stroke-width="3" fill="none"/><rect x="0" y="214" width="110" height="3" fill="#92400e" opacity="0.4"/>` +
      arrow('M76 236V150', BLUE) + arrow('M44 146V208', ORG) + arrow('M92 170V120', ORG) +
      T(112, 40, 'ไซเล็ม (ลูกศรน้ำเงิน)', `font-size="10.5" font-weight="700" fill="${BLUE}"`) + T(112, 54, 'น้ำและแร่ธาตุ จากรากขึ้นใบ', `font-size="10.5" fill="${BLUE}"`) + T(112, 68, '(ทางเดียว)', `font-size="10.5" fill="${BLUE}"`) +
      T(106, 100, 'โฟลเอ็ม (ลูกศรส้ม)', `font-size="10.5" font-weight="700" fill="#9a3412"`) + T(106, 114, 'อาหารจากใบไปทุกส่วน', `font-size="10.5" fill="#9a3412"`) + T(106, 128, 'ได้ทั้งขึ้นและลง', `font-size="10.5" fill="#9a3412"`) +
      `<circle cx="282" cy="108" r="64" fill="#fef9c3" stroke="#15803d" stroke-width="3"/><circle cx="282" cy="108" r="14" fill="#fef3c7" stroke="${GRY}" stroke-width="1.2"/>` + bundles + C(282, 112, 'ไส้', 'font-size="9" fill="#78716c"') +
      C(282, 196, 'ภาคตัดขวางลำต้นพืชใบเลี้ยงคู่', 'font-size="10.5" font-weight="700"') + C(282, 212, 'โฟลเอ็ม (ส้ม) = ด้านนอก', `font-size="10.5" font-weight="700" fill="#9a3412"`) + C(282, 228, 'ไซเล็ม (ฟ้า) = ด้านใน', `font-size="10.5" font-weight="700" fill="#1e3a8a"`));
  })();

  /* 37) โครงสร้างดอก */
  F['m3-flower'] = svg(276,
    'ภาคตัดตามยาวของดอกสมบูรณ์เพศ แสดงกลีบเลี้ยง กลีบดอก เกสรเพศผู้ และเกสรเพศเมีย',
    `<rect x="170" y="206" width="20" height="60" fill="#86efac" stroke="#166534" stroke-width="2"/><ellipse cx="180" cy="204" rx="26" ry="9" fill="#bbf7d0" stroke="#166534" stroke-width="2"/>` +
    `<path d="M156 200Q132 196 126 176Q148 178 160 194" fill="#4ade80" stroke="#166534" stroke-width="2"/><path d="M204 200Q228 196 234 176Q212 178 200 194" fill="#4ade80" stroke="#166534" stroke-width="2"/>` +
    `<path d="M162 194Q116 170 130 98Q164 120 170 176" fill="#fbcfe8" stroke="#be185d" stroke-width="2"/><path d="M198 194Q244 170 230 98Q196 120 190 176" fill="#fbcfe8" stroke="#be185d" stroke-width="2"/>` +
    `<path d="M168 194V150" stroke="#166534" stroke-width="3"/><ellipse cx="168" cy="140" rx="9" ry="14" fill="#fde047" stroke="#a16207" stroke-width="2"/><path d="M192 194V150" stroke="#166534" stroke-width="3"/><ellipse cx="192" cy="140" rx="9" ry="14" fill="#fde047" stroke="#a16207" stroke-width="2"/>` +
    `<ellipse cx="180" cy="176" rx="15" ry="20" fill="#bbf7d0" stroke="#166534" stroke-width="2"/>` + O(175, 178, 4, '#fff', '#166534') + O(185, 174, 4, '#fff', '#166534') + O(180, 186, 4, '#fff', '#166534') +
    `<path d="M180 156V92" stroke="#166534" stroke-width="3"/><ellipse cx="180" cy="86" rx="12" ry="7" fill="#fca5a5" stroke="#b91c1c" stroke-width="2"/>` +
    T(10, 98, 'อับเรณู', 'font-size="11" font-weight="700"') + line(60, 96, 158, 132, GRY, 1.3, true) +
    T(10, 132, '(สร้างละอองเรณู)', 'font-size="10"') +
    T(10, 158, 'ก้านชูอับเรณู', 'font-size="11" font-weight="700"') + line(82, 156, 164, 168, GRY, 1.3, true) +
    T(10, 196, 'กลีบดอก', 'font-size="11" font-weight="700"') + line(56, 194, 136, 158, GRY, 1.3, true) +
    T(10, 232, 'กลีบเลี้ยง', 'font-size="11" font-weight="700"') + line(60, 230, 134, 190, GRY, 1.3, true) +
    T(238, 70, 'ยอดเกสรเพศเมีย', 'font-size="11" font-weight="700"') + line(236, 74, 194, 86, GRY, 1.3, true) +
    T(238, 120, 'ก้านเกสรเพศเมีย', 'font-size="11" font-weight="700"') + line(236, 124, 184, 124, GRY, 1.3, true) +
    T(238, 176, 'รังไข่', 'font-size="11" font-weight="700"') + line(236, 176, 198, 176, GRY, 1.3, true) + T(238, 204, 'ออวุล (ในรังไข่)', 'font-size="11" font-weight="700"') + line(236, 208, 188, 184, GRY, 1.3, true) +
    T(238, 244, 'ฐานรองดอก', 'font-size="11" font-weight="700"') + line(236, 244, 200, 208, GRY, 1.3, true));

  /* 38) การปฏิสนธิซ้อน */
  F['m3-double-fert'] = svg(282,
    'หลอดละอองเรณูนำสเปิร์ม 2 เซลล์เข้าสู่ออวุล เซลล์หนึ่งผสมกับเซลล์ไข่เป็นไซโกต อีกเซลล์ผสมกับโพลาร์นิวคลีไอเป็นเอนโดสเปิร์ม',
    `<ellipse cx="170" cy="168" rx="86" ry="100" fill="#fef3c7" stroke="#a16207" stroke-width="3"/><ellipse cx="170" cy="170" rx="56" ry="76" fill="#fffbeb" stroke="#a16207" stroke-width="1.8" stroke-dasharray="5 3"/>` +
    `<path d="M170 8V84" stroke="#ca8a04" stroke-width="12" stroke-linecap="round" opacity="0.35"/><path d="M170 8V84" stroke="#a16207" stroke-width="2" fill="none"/>` +
    O(165, 36, 5, '#1f2937') + O(176, 62, 5, '#1f2937') +
    O(170, 120, 11, '#fecdd3', '#be185d') + O(150, 108, 6, '#e5e7eb', '#64748b') + O(190, 108, 6, '#e5e7eb', '#64748b') + O(160, 168, 7, '#e9d5ff', '#6b21a8') + O(182, 172, 7, '#e9d5ff', '#6b21a8') + O(150, 226, 5, '#e5e7eb', '#64748b') + O(170, 232, 5, '#e5e7eb', '#64748b') + O(190, 226, 5, '#e5e7eb', '#64748b') +
    arrow('M172 70L170 108', RED) + arrow('M180 74Q214 120 190 164', BLUE) +
    T(206, 22, 'ละอองเรณู งอกเป็น', 'font-size="10.5" font-weight="700"') + T(206, 36, 'หลอดละอองเรณู', 'font-size="10.5" font-weight="700"') + line(204, 30, 176, 28, GRY, 1.3, true) +
    T(204, 62, 'สเปิร์ม (นิวเคลียส) 2 เซลล์', 'font-size="10.5" font-weight="700"') + line(202, 60, 182, 62, GRY, 1.3, true) +
    T(6, 124, 'เซลล์ไข่', `font-size="10.5" font-weight="700" fill="#be185d"`) + line(52, 122, 158, 120, GRY, 1.3, true) +
    T(6, 172, 'โพลาร์นิวคลีไอ', `font-size="10.5" font-weight="700" fill="#6b21a8"`) + line(78, 170, 152, 170, GRY, 1.3, true) +
    T(6, 214, 'ถุงเอ็มบริโอ', 'font-size="10.5" font-weight="700"') + line(60, 210, 122, 196, GRY, 1.3, true) + T(6, 254, 'ออวุล (ผนังหนาสีเหลือง)', 'font-size="10.5" font-weight="700"') + line(96, 250, 96, 228, GRY, 1.3, true) +
    T(228, 112, '① สเปิร์ม + เซลล์ไข่', `font-size="10.5" font-weight="700" fill="${RED}"`) + T(228, 126, '= ไซโกต → เอ็มบริโอ', `font-size="10.5" fill="${RED}"`) +
    T(228, 176, '② สเปิร์ม + โพลาร์', `font-size="10.5" font-weight="700" fill="${BLUE}"`) + T(228, 190, 'นิวคลีไอ = เอนโดสเปิร์ม', `font-size="10.5" fill="${BLUE}"`) + T(228, 204, '(อาหารสะสมในเมล็ด)', `font-size="10.5" fill="${BLUE}"`) +
    C(180, 276, 'เกิดการปฏิสนธิ 2 ครั้งพร้อมกัน เรียกว่า การปฏิสนธิซ้อน', 'font-size="11" font-weight="700"'));

  /* ===== ว 1.2 ชีววิทยา: ระบบอวัยวะของมนุษย์ (ส่วนที่ 3) ===== */
  const RBLOOD = '#fca5a5', BBLOOD = '#93c5fd', LUNG = '#fbcfe8';
  const ln = (x1, y1, x2, y2, c = GRY, w = 1.3) => line(x1, y1, x2, y2, c, w, true);

  /* 39) กลไกการหายใจเข้า-ออก */
  (function () {
    const panel = (ox, inh) => {
      const cx = ox + 85, w = inh ? 66 : 54, top = 62, bot = inh ? 168 : 156;
      const lr = inh ? [30, 46] : [25, 38];
      const cage = `<path d="M${cx - w} ${top + 10}Q${cx - w - 14} ${(top + bot) / 2} ${cx - w + 6} ${bot}" fill="none" stroke="#a16207" stroke-width="3.5"/><path d="M${cx + w} ${top + 10}Q${cx + w + 14} ${(top + bot) / 2} ${cx + w - 6} ${bot}" fill="none" stroke="#a16207" stroke-width="3.5"/><path d="M${cx - w} ${top + 10}Q${cx} ${top - 14} ${cx + w} ${top + 10}" fill="none" stroke="#a16207" stroke-width="3.5"/>`;
      const lungs = E(cx - 32, 112, lr[0], lr[1], LUNG, '#be185d', 2) + E(cx + 32, 112, lr[0], lr[1], LUNG, '#be185d', 2);
      const dia = inh ? `<path d="M${cx - w + 6} ${bot}Q${cx} ${bot + 8} ${cx + w - 6} ${bot}" fill="none" stroke="${GRN}" stroke-width="5"/>` : `<path d="M${cx - w + 6} ${bot}Q${cx} ${bot - 40} ${cx + w - 6} ${bot}" fill="none" stroke="${GRN}" stroke-width="5"/>`;
      const tr = `<rect x="${cx - 5}" y="22" width="10" height="46" fill="#e0f2fe" stroke="currentColor" stroke-width="1.5"/>` + arrow(inh ? `M${cx} 10V32` : `M${cx} 34V8`, BLUE);
      const ar = inh ? arrow(`M${cx - w - 18} ${bot - 30}L${cx - w - 14} ${top + 18}`, ORG) + arrow(`M${cx + w + 18} ${bot - 30}L${cx + w + 14} ${top + 18}`, ORG) + arrow(`M${cx} ${bot + 10}V${bot + 24}`, GRN) : arrow(`M${cx - w - 12} ${top + 18}L${cx - w - 8} ${bot - 30}`, ORG) + arrow(`M${cx + w + 12} ${top + 18}L${cx + w + 8} ${bot - 30}`, ORG) + arrow(`M${cx} ${bot + 18}V${bot - 6}`, GRN);
      return cage + lungs + dia + tr + ar;
    };
    const tx = (x, lines) => lines.map((s, i) => C(x, 206 + i * 14, s, i === 0 ? 'font-size="12" font-weight="700"' : 'font-size="10.5"')).join('');
    F['m3-breathing'] = svg(262,
      'หายใจเข้า กะบังลมหดตัวเลื่อนต่ำลง ซี่โครงยกขึ้น ปริมาตรช่องอกเพิ่ม ความดันลด อากาศเข้าปอด หายใจออกตรงข้ามกัน',
      panel(0, true) + panel(180, false) + tx(85, ['หายใจเข้า', 'กะบังลมหดตัว เลื่อนต่ำลง', 'กล้ามเนื้อซี่โครงหดตัว ยกขึ้น', 'ปริมาตรช่องอก ↑ ความดัน ↓']) + tx(265, ['หายใจออก', 'กะบังลมคลายตัว ดันขึ้น', 'กล้ามเนื้อซี่โครงคลายตัว ลดลง', 'ปริมาตรช่องอก ↓ ความดัน ↑']));
  })();

  /* 40) การแลกเปลี่ยนแก๊สที่ถุงลม */
  F['m3-alveolus'] = svg(250,
    'การแลกเปลี่ยนแก๊สที่ถุงลม ออกซิเจนแพร่จากถุงลมเข้าหลอดเลือดฝอย คาร์บอนไดออกไซด์แพร่จากหลอดเลือดฝอยเข้าถุงลม',
    `<rect x="4" y="94" width="52" height="24" fill="#e0f2fe" stroke="currentColor" stroke-width="2"/>` + arrow('M10 106H62', BLUE) + T(4, 86, 'อากาศเข้า-ออก', 'font-size="10"') +
    `<circle cx="130" cy="106" r="66" fill="#e0f2fe" stroke="#be185d" stroke-width="3"/>` + C(120, 100, 'ถุงลม', 'font-size="12" font-weight="700"') + C(120, 116, 'O₂ สูง · CO₂ ต่ำ', 'font-size="10"') +
    `<path d="M260 14Q260 60 214 76" fill="none" stroke="${BBLOOD}" stroke-width="14" stroke-linecap="round"/><path d="M214 76Q196 106 214 136" fill="none" stroke="#c4b5fd" stroke-width="14" stroke-linecap="round"/><path d="M214 136Q260 152 260 200" fill="none" stroke="${RBLOOD}" stroke-width="14" stroke-linecap="round"/>` +
    arrow('M184 92H212', RED) + arrow('M212 122H184', BLUE) + T(158, 86, 'O₂', `font-size="11" font-weight="700" fill="${RED}"`) + T(152, 142, 'CO₂', `font-size="11" font-weight="700" fill="${BLUE}"`) +
    T(274, 40, 'เลือดจากหัวใจ', 'font-size="10" font-weight="700"') + T(274, 54, 'O₂ ต่ำ CO₂ สูง', 'font-size="10"') + T(274, 190, 'เลือดไปหัวใจ', 'font-size="10" font-weight="700"') + T(274, 204, 'O₂ สูง CO₂ ต่ำ', 'font-size="10"') +
    T(246, 110, 'ผนังบาง', 'font-size="10" font-weight="700"') + ln(244, 108, 224, 108) +
    C(180, 232, 'แก๊สแพร่จากที่ความเข้มข้นสูง → ต่ำ ผ่านผนังบางชั้นเดียว', 'font-size="10.5" font-weight="700"'));

  /* 41) หัวใจ 4 ห้อง */
  F['m3-heart'] = svg(338,
    'หัวใจสี่ห้องมองด้านหน้า ห้องบนขวาและล่างขวามีเลือดออกซิเจนต่ำ ห้องบนซ้ายและล่างซ้ายมีเลือดออกซิเจนสูง',
    `<clipPath id="hc"><path d="M180 262Q96 214 112 134Q122 90 180 102Q238 90 248 134Q264 214 180 262Z"/></clipPath>` +
    `<g clip-path="url(#hc)"><rect x="100" y="90" width="80" height="60" fill="${BBLOOD}"/><rect x="180" y="90" width="80" height="60" fill="${RBLOOD}"/><rect x="100" y="150" width="80" height="120" fill="#60a5fa"/><rect x="180" y="150" width="80" height="120" fill="#f87171"/></g>` +
    `<path d="M180 262Q96 214 112 134Q122 90 180 102Q238 90 248 134Q264 214 180 262Z" fill="none" stroke="currentColor" stroke-width="3"/>` + L(180, 102, 180, 262, 'currentColor', 3) + L(110, 150, 250, 150, 'currentColor', 2) +
    L(138, 150, 160, 150, '#fff', 5) + L(200, 150, 222, 150, '#fff', 5) +
    `<path d="M24 120H112" stroke="${BBLOOD}" stroke-width="14"/>` + arrow('M40 120H110', BLUE) + T(8, 104, 'เวนาคาวา', 'font-size="10.5" font-weight="700"') + T(8, 142, '(เลือดจากร่างกาย)', 'font-size="10"') +
    `<path d="M168 150V84Q168 62 128 62H70" fill="none" stroke="${BBLOOD}" stroke-width="14"/>` + arrow('M130 62H74', BLUE) + T(6, 46, 'อาร์เทอรีพัลโมนารี → ไปปอด', 'font-size="10.5" font-weight="700"') +
    `<path d="M192 150V76Q192 46 238 46H300" fill="none" stroke="${RBLOOD}" stroke-width="14"/>` + arrow('M262 46H302', RED) + T(246, 32, 'เอออร์ตา → ไปร่างกาย', 'font-size="10.5" font-weight="700"') +
    `<path d="M336 134H260" stroke="${RBLOOD}" stroke-width="14"/>` + arrow('M334 134H262', RED) + T(268, 100, 'จากปอด', 'font-size="10.5" font-weight="700"') + T(268, 112, 'หลอดเลือดดำ', 'font-size="10"') + T(268, 124, 'พัลโมนารี', 'font-size="10"') +
    C(146, 124, 'ห้องบนขวา', 'font-size="9.5" font-weight="700"') + C(216, 124, 'ห้องบนซ้าย', 'font-size="9.5" font-weight="700"') + C(150, 196, 'ห้องล่างขวา', 'font-size="9.5" font-weight="700"') + C(212, 196, 'ห้องล่างซ้าย', 'font-size="9.5" font-weight="700"') +
    C(150, 208, 'O₂ ต่ำ', 'font-size="9.5"') + C(212, 208, 'O₂ สูง', 'font-size="9.5"') + C(146, 137, 'O₂ ต่ำ', 'font-size="9.5"') + C(216, 137, 'O₂ สูง', 'font-size="9.5"') +
    C(180, 282, 'อาร์เทอรีพัลโมนารีออกจากห้องล่างขวา · เอออร์ตาออกจากห้องล่างซ้าย', 'font-size="10"') + C(180, 296, 'แถบขาว = ลิ้นหัวใจ (กั้นห้องบน-ล่าง ให้เลือดไหลทางเดียว)', 'font-size="10.5"') + C(180, 310, 'ซ้าย-ขวา ดูจากตัวคนไข้ (ซ้ายของคนไข้ อยู่ขวามือของผู้ดู)', 'font-size="10.5" font-weight="700"') + C(180, 326, 'แดง = เลือดออกซิเจนสูง · น้ำเงิน = เลือดออกซิเจนต่ำ', 'font-size="10.5"'));

  /* 42) เส้นทางหมุนเวียนเลือด */
  F['m3-circulation-loop'] = svg(280,
    'เส้นทางหมุนเวียนเลือด ร่างกายไปหัวใจซีกขวา ไปปอด กลับหัวใจซีกซ้าย แล้วไปร่างกาย',
    R(130, 12, 100, 40, '#fce7f3') + C(180, 36, 'ปอด', 'font-size="13" font-weight="700"') + R(130, 200, 100, 40, '#fef9c3') + C(180, 218, 'ร่างกาย', 'font-size="13" font-weight="700"') + C(180, 232, '(อวัยวะต่าง ๆ)', 'font-size="10"') +
    R(8, 104, 106, 56, BBLOOD) + C(61, 126, 'หัวใจซีกขวา', 'font-size="12" font-weight="700"') + C(61, 142, 'ห้องบนขวา → ล่างขวา', 'font-size="10"') + R(246, 104, 106, 56, RBLOOD) + C(299, 126, 'หัวใจซีกซ้าย', 'font-size="12" font-weight="700"') + C(299, 142, 'ห้องบนซ้าย → ล่างซ้าย', 'font-size="10"') +
    arrow('M128 220Q61 224 61 164', BLUE) + arrow('M61 100Q61 32 126 32', BLUE) + arrow('M234 32Q299 32 299 100', RED) + arrow('M299 164Q299 224 234 220', RED) +
    T(4, 206, 'เวนาคาวา', `font-size="10.5" font-weight="700" fill="${BLUE}"`) + T(4, 60, 'อาร์เทอรี', `font-size="10.5" font-weight="700" fill="${BLUE}"`) + T(4, 72, 'พัลโมนารี', `font-size="10.5" font-weight="700" fill="${BLUE}"`) + T(304, 60, 'เวนพัลโมนารี', `font-size="10.5" font-weight="700" fill="${RED}"`).replace('x="304"', 'x="262"').replace('y="60"', 'y="76"') + T(304, 206, 'เอออร์ตา', `font-size="10.5" font-weight="700" fill="${RED}"`).replace('x="304"', 'x="290"') +
    C(180, 90, 'เลือด O₂ ต่ำ (น้ำเงิน) · เลือด O₂ สูง (แดง)', 'font-size="10.5"') + C(180, 256, 'ร่างกาย → ห้องบนขวา → ห้องล่างขวา → ปอด', 'font-size="10.5" font-weight="700"') + C(180, 270, '→ ห้องบนซ้าย → ห้องล่างซ้าย → ร่างกาย', 'font-size="10.5" font-weight="700"'));

  /* 43) หน่วยไต */
  F['m3-nephron'] = svg(282,
    'หน่วยไต โกลเมอรูลัสกรองเลือดเข้าโบว์แมนแคปซูล ท่อหน่วยไตดูดสารที่มีประโยชน์กลับเข้าหลอดเลือดฝอย ที่เหลือเป็นปัสสาวะ',
    `<path d="M60 96q-14 12 0 24q14 12 0 24q-14 12 0 24" fill="none" stroke="#a16207" stroke-width="5"/><path d="M60 168V232Q80 254 100 232V176" fill="none" stroke="#a16207" stroke-width="5"/><path d="M100 176q14 -10 0 -20q-14 -10 0 -20H140V262" fill="none" stroke="#a16207" stroke-width="5"/>` +
    `<path d="M44 108Q28 134 44 162" fill="none" stroke="${RED}" stroke-width="3" stroke-dasharray="5 3"/><path d="M82 108Q98 134 82 162" fill="none" stroke="${RED}" stroke-width="3" stroke-dasharray="5 3"/>` +
    `<circle cx="60" cy="66" r="30" fill="#fef3c7" stroke="#a16207" stroke-width="3"/><circle cx="60" cy="64" r="16" fill="#fecaca" stroke="${RED}" stroke-width="2.5"/><path d="M52 58q8 -4 14 2M50 68q8 4 16 -2" fill="none" stroke="${RED}" stroke-width="1.5"/>` +
    arrow('M4 36L46 56', RED) + arrow('M72 78L92 98', RED).replace('M72 78L92 98', 'M74 56L96 40') +
    arrow('M44 122L38 122', GRN).replace('M44 122L38 122', 'M58 122L48 122') + arrow('M64 150L50 150', GRN).replace('M64 150L50 150', 'M62 140L50 140') +
    T(100, 56, 'โกลเมอรูลัส', `font-size="10.5" font-weight="700" fill="${RED}"`).replace('x="100" y="56"', 'x="96" y="30"') + T(2, 24, 'หลอดเลือดเข้า', 'font-size="10"') +
    T(96, 98, 'โบว์แมนแคปซูล', 'font-size="10.5" font-weight="700"').replace('x="96" y="98"', 'x="94" y="84"') +
    T(104, 126, 'ท่อหน่วยไต', 'font-size="10.5" font-weight="700"').replace('x="104" y="126"', 'x="108" y="206"') + T(146, 250, 'ท่อรวม → ปัสสาวะ', 'font-size="10.5" font-weight="700"').replace('x="146" y="250"', 'x="146" y="272"') +
    T(2, 182, 'หลอดเลือดฝอย', `font-size="10" fill="${RED}"`).replace('x="2" y="182"', 'x="2" y="186"') +
    T(180, 24, '① กรอง (โกลเมอรูลัส → แคปซูล)', 'font-size="11" font-weight="700"') + T(180, 38, 'น้ำ กลูโคส กรดแอมิโน เกลือแร่ ยูเรีย', 'font-size="10.5"') + T(180, 52, '(เม็ดเลือดและโปรตีนตัวใหญ่ผ่านไม่ได้)', 'font-size="10.5"') +
    T(180, 94, '② ดูดกลับ (ท่อหน่วยไต → เลือด)', 'font-size="11" font-weight="700"') + T(180, 108, 'กลูโคสและกรดแอมิโน (ทั้งหมด)', 'font-size="10.5"') + T(180, 122, 'น้ำและเกลือแร่ (ส่วนใหญ่)', 'font-size="10.5"') +
    T(180, 164, '③ ที่เหลือ = ปัสสาวะ', 'font-size="11" font-weight="700"') + T(180, 178, 'น้ำ ยูเรีย เกลือแร่ส่วนเกิน', 'font-size="10.5"') + T(180, 192, 'ไปที่กระเพาะปัสสาวะ', 'font-size="10.5"') +
    T(180, 232, 'คนปกติ: ไม่พบกลูโคส', `font-size="10.5" font-weight="700" fill="${RED}"`) + T(180, 246, 'และโปรตีนในปัสสาวะ', `font-size="10.5" font-weight="700" fill="${RED}"`));

  /* 44) วงจรประสาทรีเฟล็กซ์ */
  F['m3-reflex'] = svg(262,
    'วงจรรีเฟล็กซ์ ตัวรับความรู้สึกที่ปลายนิ้ว เซลล์ประสาทรับความรู้สึก เซลล์ประสาทประสานงานในไขสันหลัง เซลล์ประสาทสั่งการ กล้ามเนื้อแขน',
    R(6, 14, 96, 38, '#fef3c7') + C(54, 30, 'ปลายนิ้ว', 'font-size="11" font-weight="700"') + C(54, 44, '(ตัวรับความรู้สึก)', 'font-size="9.5"') +
    `<circle cx="256" cy="120" r="76" fill="#f1f5f9" stroke="${GRY}" stroke-width="3"/><path d="M256 96Q226 70 214 96Q206 124 238 126Q226 148 214 160Q234 180 256 148Q278 180 298 160Q286 148 274 126Q306 124 298 96Q286 70 256 96Z" fill="#cbd5e1" stroke="#475569" stroke-width="2"/>` +
    `<path d="M102 36Q166 28 214 70" fill="none" stroke="${BLUE}" stroke-width="3"/>` + arrow('M200 58L216 74', BLUE) + O(222, 82, 6, '#bfdbfe', BLUE) + `<path d="M222 88Q236 112 240 128" fill="none" stroke="#7e22ce" stroke-width="3"/>` + O(242, 134, 6, '#e9d5ff', '#7e22ce') +
    `<path d="M246 138Q250 168 232 190" fill="none" stroke="${RED}" stroke-width="3"/>` + `<path d="M232 190Q160 226 104 222" fill="none" stroke="${RED}" stroke-width="3"/>` + arrow('M130 222L106 222', RED) +
    R(6, 204, 98, 40, '#fecaca') + C(55, 222, 'กล้ามเนื้อแขน', 'font-size="11" font-weight="700"') + C(55, 236, '(หน่วยตอบสนอง)', 'font-size="9.5"') +
    T(110, 12, 'เซลล์ประสาทรับความรู้สึก', `font-size="10.5" font-weight="700" fill="${BLUE}"`).replace('x="110" y="12"', 'x="112" y="24"') + T(262, 86, 'ประสานงาน', `font-size="10.5" font-weight="700" fill="#7e22ce"`).replace('x="262" y="86"', 'x="262" y="108"') +
    T(112, 190, 'เซลล์ประสาทสั่งการ', `font-size="10.5" font-weight="700" fill="${RED}"`).replace('x="112" y="190"', 'x="112" y="250"') +
    C(256, 218, 'ไขสันหลัง', 'font-size="11" font-weight="700"') + C(256, 232, '(ภาคตัดขวาง)', 'font-size="10"') + C(180, 258, 'ตัวรับ → รับความรู้สึก → ประสานงาน → สั่งการ → กล้ามเนื้อ', 'font-size="10" font-weight="700"'));

  /* 45) วัฏจักรประจำเดือน 28 วัน */
  (function () {
    const dx = d => 40 + d * 10.7;
    const est = [[0, 128], [4, 122], [8, 92], [11, 42], [13, 34], [15, 64], [17, 88], [21, 70], [24, 96], [28, 126]], pro = [[0, 134], [13, 134], [15, 120], [18, 64], [21, 50], [24, 84], [27, 128], [28, 134]];
    const pl = a => a.map(p => `${dx(p[0]).toFixed(1)},${p[1]}`).join(' ');
    const lining = `${dx(0)},212 ${dx(1)},206 ${dx(5)},206 ${dx(14)},182 ${dx(28)},172 ${dx(28)},212`;
    F['m3-menstrual'] = svg(292,
      'วัฏจักรประจำเดือน 28 วัน ฮอร์โมนอีสโทรเจนและโปรเจสเทอโรนกับความหนาของผนังมดลูก ตกไข่ประมาณวันที่ 14',
      R(dx(0), 20, dx(5) - dx(0), 190, '#fecaca', 'none') + L(dx(14), 20, dx(14), 212, GRY, 1.5, 'stroke-dasharray="5 4"') + L(40, 142, 342, 142, '#cbd5e1', 1) +
      L(40, 212, 342, 212, 'currentColor', 2) + L(40, 20, 40, 212, 'currentColor', 2) +
      `<polygon points="${lining}" fill="#fed7aa" stroke="#c2410c" stroke-width="1.5"/>` + `<polyline points="${pl(est)}" fill="none" stroke="${RED}" stroke-width="3"/>` + `<polyline points="${pl(pro)}" fill="none" stroke="${BLUE}" stroke-width="3"/>` +
      T(dx(14) + 4, 30, 'ตกไข่ (วันที่ ~14)', `font-size="10.5" font-weight="700" fill="#374151"`) + C(dx(2.5), 34, 'ประจำเดือน', `font-size="10" font-weight="700" fill="#b91c1c"`) + C(dx(2.5), 47, 'วัน 1–5', 'font-size="10"') +
      T(dx(5) + 2, 168, 'ผนังมดลูกค่อย ๆ หนาขึ้น', 'font-size="10"') + T(dx(15) + 4, 166, 'หนา เตรียมรับตัวอ่อน', 'font-size="10"') +
      T(dx(14) + 8, 74, 'อีสโทรเจน (แดง)', `font-size="10.5" font-weight="700" fill="${RED}"`).replace('x=', 'x=').replace(/y="74"/, 'y="104"').replace(/x="[\d.]+"/, 'x="46"') + T(224, 48, 'โปรเจสเทอโรน (น้ำเงิน)', `font-size="10.5" font-weight="700" fill="${BLUE}"`).replace('y="48"', 'y="46"') +
      T(36, 226, '0', 'font-size="10"') + T(dx(7) - 2, 226, '7', 'font-size="10"').replace('y="226"', 'y="224"') + T(dx(14) - 4, 226, '14', 'font-size="10"').replace('y="226"', 'y="224"') + T(dx(21) - 4, 226, '21', 'font-size="10"').replace('y="226"', 'y="224"') + T(dx(28) - 4, 226, '28', 'font-size="10"').replace('y="226"', 'y="224"') +
      C(190, 244, 'วันที่ในรอบเดือน', 'font-size="10.5"') + C(180, 266, 'ถ้าไม่มีการปฏิสนธิ ฮอร์โมนลดลง ผนังมดลูกหลุดลอก เป็นประจำเดือนรอบถัดไป', 'font-size="10"') + C(180, 280, 'ถ้ามีการปฏิสนธิ ตัวอ่อนฝังตัวที่ผนังมดลูก ไม่มีประจำเดือน', 'font-size="10"'));
  })();

  /* 46) ระบบสืบพันธุ์เพศหญิง */
  F['m3-female-repro'] = svg(254,
    'ระบบสืบพันธุ์เพศหญิง รังไข่สร้างไข่ ท่อนำไข่เป็นที่ปฏิสนธิ มดลูกเป็นที่ฝังตัวและเจริญของทารก',
    `<path d="M140 76Q180 60 220 76L238 128Q238 156 214 168V196H146V168Q122 156 122 128Z" fill="#fecdd3" stroke="#be185d" stroke-width="3"/><path d="M146 168H214V196H146Z" fill="#fda4af" stroke="#be185d" stroke-width="2"/>` +
    `<path d="M140 80Q104 66 90 92" fill="none" stroke="#a16207" stroke-width="6" stroke-linecap="round"/><path d="M220 80Q256 66 270 92" fill="none" stroke="#a16207" stroke-width="6" stroke-linecap="round"/>` +
    L(86, 94, 74, 100, '#a16207', 3) + L(88, 98, 78, 110, '#a16207', 3) + L(274, 94, 286, 100, '#a16207', 3) + L(272, 98, 282, 110, '#a16207', 3) +
    E(64, 126, 22, 16, '#fef3c7', '#a16207', 2.5) + O(58, 124, 5, '#fff', '#a16207') + E(296, 126, 22, 16, '#fef3c7', '#a16207', 2.5) + O(302, 124, 5, '#fff', '#a16207') +
    `<path d="M158 196V240M202 196V240" stroke="#be185d" stroke-width="3"/>` + E(180, 126, 40, 36, '#fff1f2', '#be185d', 1.5, 'stroke-dasharray="4 3"') + C(180, 120, 'มดลูก', 'font-size="11" font-weight="700"') + C(180, 133, 'ตัวอ่อนฝังตัว', 'font-size="9.5"') + C(180, 145, 'และเจริญ', 'font-size="9.5"') +
    T(2, 62, 'ท่อนำไข่', 'font-size="11" font-weight="700"') + T(2, 76, '(ปฏิสนธิที่นี่)', 'font-size="10"') + ln(56, 80, 94, 86) +
    T(2, 164, 'รังไข่', 'font-size="11" font-weight="700"') + T(2, 178, '(สร้างไข่ ฮอร์โมน)', 'font-size="10"') + ln(40, 150, 56, 136) +
    T(264, 62, 'ท่อนำไข่', 'font-size="11" font-weight="700"') + ln(300, 68, 270, 86) + T(280, 164, 'รังไข่', 'font-size="11" font-weight="700"') + ln(300, 150, 304, 136) +
    
    T(236, 184, 'ปากมดลูก', 'font-size="11" font-weight="700"') + ln(234, 182, 214, 182) + T(210, 236, 'ช่องคลอด', 'font-size="11" font-weight="700"') + ln(208, 232, 200, 226) +
    C(180, 12, 'ไข่ตกจากรังไข่ → ท่อนำไข่ (ปฏิสนธิ)', 'font-size="10.5" font-weight="700"') + C(180, 26, '→ ไซโกตเคลื่อนลงมดลูก → ฝังตัว', 'font-size="10.5" font-weight="700"'));

  /* 47) สมองและไขสันหลัง */
  F['m3-brain'] = svg(214,
    'สมองใหญ่ สมองน้อย ก้านสมอง และไขสันหลัง',
    `<path d="M70 108Q50 50 120 36Q196 24 226 66Q250 100 214 130Q190 144 150 140Q110 138 70 108Z" fill="#fbcfe8" stroke="#be185d" stroke-width="3"/>` + `<path d="M96 70Q120 56 140 76M150 52Q176 50 190 72M110 104Q140 90 168 104M180 84Q206 86 214 108" fill="none" stroke="#be185d" stroke-width="2"/>` +
    `<path d="M168 140Q196 138 214 160Q212 178 188 180Q164 176 160 156Z" fill="#fde68a" stroke="#a16207" stroke-width="2.5"/>` + `<path d="M172 150Q190 148 204 160M170 160Q188 160 202 170" fill="none" stroke="#a16207" stroke-width="1.5"/>` +
    `<path d="M120 138L134 176L156 182L152 140Z" fill="#c7d2fe" stroke="#4338ca" stroke-width="2.5"/>` + `<path d="M138 178V214" stroke="#94a3b8" stroke-width="10" stroke-linecap="round"/>` +
    T(2, 56, 'สมองใหญ่', 'font-size="11" font-weight="700"') + T(2, 70, 'คิด จำ รับรู้ สั่งการ', 'font-size="10"') + ln(62, 74, 92, 82) +
    T(238, 130, 'สมองน้อย', 'font-size="11" font-weight="700"') + T(238, 144, 'ทรงตัว ประสานงาน', 'font-size="10"') + T(238, 156, 'ของกล้ามเนื้อ', 'font-size="10"') + ln(236, 138, 214, 152) +
    T(2, 176, 'ก้านสมอง (เมดัลลา)', 'font-size="11" font-weight="700"') + T(2, 190, 'ควบคุมหายใจ หัวใจเต้น', 'font-size="10"') + ln(100, 170, 126, 168) +
    T(150, 208, 'ไขสันหลัง: รีเฟล็กซ์ และเส้นทางสัญญาณ', 'font-size="10.5" font-weight="700"').replace('x="150" y="208"', 'x="152" y="206"'));

  /* 48) ระบบหายใจ */
  F['m3-respiratory-system'] = svg(262,
    'ระบบหายใจ จมูก หลอดลม ปอด ถุงลม และกะบังลม',
    `<path d="M140 100Q108 112 100 170Q100 214 140 214Q172 214 176 184V108Q160 96 140 100Z" fill="${LUNG}" stroke="#be185d" stroke-width="3"/><path d="M220 100Q252 112 260 170Q260 214 220 214Q188 214 184 184V108Q200 96 220 100Z" fill="${LUNG}" stroke="#be185d" stroke-width="3"/>` +
    `<rect x="168" y="16" width="24" height="44" rx="10" fill="#e0f2fe" stroke="currentColor" stroke-width="2.5"/><rect x="174" y="60" width="12" height="64" fill="#e0f2fe" stroke="currentColor" stroke-width="2.5"/><path d="M174 72H186M174 82H186M174 92H186M174 102H186M174 112H186" stroke="currentColor" stroke-width="1.5"/><path d="M180 112V126M180 126Q154 132 138 154M180 126Q206 132 222 154" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>` +
    `<path d="M138 154Q126 164 120 180M138 154Q144 172 142 192M222 154Q234 164 240 180M222 154Q216 172 218 192" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>` +
    `<path d="M92 222Q180 188 268 222" fill="none" stroke="${GRN}" stroke-width="6"/>` + O(118, 192, 4, '#fff', '#be185d') + O(128, 198, 4, '#fff', '#be185d') + O(112, 200, 4, '#fff', '#be185d') + O(242, 192, 4, '#fff', '#be185d') + O(232, 198, 4, '#fff', '#be185d') + O(248, 200, 4, '#fff', '#be185d') +
    T(204, 30, 'โพรงจมูก', 'font-size="11" font-weight="700"') + T(204, 44, '(กรอง ทำให้อุ่นและชื้น)', 'font-size="10"') + ln(202, 28, 192, 30) +
    T(2, 76, 'หลอดลม', 'font-size="11" font-weight="700"') + T(2, 90, '(มีวงแหวนกระดูกอ่อน)', 'font-size="10"') + ln(70, 74, 176, 84) +
    T(2, 140, 'หลอดลมแขนง', 'font-size="11" font-weight="700"') + ln(74, 138, 130, 150) +
    T(268, 150, 'ปอด', 'font-size="11" font-weight="700"') + ln(284, 154, 258, 160) +
    T(2, 192, 'ถุงลม', 'font-size="11" font-weight="700"') + T(2, 206, '(แลกเปลี่ยนแก๊ส)', 'font-size="10"') + ln(40, 188, 108, 192) +
    T(270, 240, 'กะบังลม', 'font-size="11" font-weight="700"') + ln(286, 232, 262, 224) +
    C(180, 252, 'อากาศ: จมูก → หลอดลม → หลอดลมแขนง → ถุงลม', 'font-size="10.5" font-weight="700"'));

  /* ===== ว 2.2 แรงและการเคลื่อนที่ (ม.3) ===== */
  const WATER = '#bfdbfe', BOX = '#fde68a';
  const fArr = (x, y1, y2, c) => arrow(`M${x} ${y1}V${y2}`, c);
  const tx = (x, y, s, c = 'currentColor', w = 600, sz = 10.5) => T(x, y, s, `font-size="${sz}" font-weight="${w}" fill="${c}"`);

  /* 49) ความดันอากาศกับความสูง */
  (function () {
    let dots = '';
    for (let i = 0; i < 90; i++) { const rnd = (i * 9301 + 49297) % 233280 / 233280, rnd2 = (i * 7919 + 1237) % 10007 / 10007; dots += O(14 + rnd2 * 100, 210 - Math.pow(rnd, 2.2) * 190, 2, '#64748b'); }
    F['m3-pressure-altitude'] = svg(266,
      'ยิ่งสูงจากระดับน้ำทะเล อากาศยิ่งเบาบางและความดันอากาศยิ่งต่ำ ถุงขนมปิดสนิทบนยอดเขาจึงพองกว่าที่พื้นราบ',
      `<rect x="6" y="14" width="116" height="204" fill="#f1f5f9" stroke="${GRY}" stroke-width="1.5"/>` + dots + tx(64, 234, 'จุด = อนุภาคอากาศ', GRY, 600, 10).replace('x="64"', 'x="12"') + tx(12, 248, 'ล่างหนาแน่น บนเบาบาง', GRY, 600, 10) +
      `<polygon points="150,218 250,84 350,218" fill="#86efac" stroke="#166534" stroke-width="2"/>` + R(150, 218, 200, 8, '#a16207', '#a16207') +
      `<ellipse cx="176" cy="206" rx="12" ry="8" fill="#fde047" stroke="#a16207" stroke-width="2"/>` + `<ellipse cx="250" cy="66" rx="24" ry="17" fill="#fde047" stroke="#a16207" stroke-width="2"/>` +
      arrow('M274 66H300', RED) + arrow('M226 66H200', RED) + tx(140, 22, 'ยอดเขา: ความดันอากาศภายนอกต่ำ', '#374151', 700, 10.5) + tx(150, 36, 'อากาศในถุงดันออก ถุงจึงพอง', RED, 600, 10) +
      tx(140, 246, 'พื้นราบ: ความดันอากาศสูง ถุงขนมขนาดเดิม', '#374151', 700, 10) + tx(140, 260, '(ถุงปิดสนิท ปริมาณอากาศในถุงเท่าเดิม)', GRY, 600, 9.5));
  })();

  /* 50) ความดันของของเหลว */
  F['m3-liquid-pressure'] = svg(272,
    'ความดันของของเหลวเพิ่มตามความลึก น้ำพุ่งไกลกว่าที่รูลึกกว่า ฐานเขื่อนจึงต้องหนากว่า',
    `<path d="M14 24V204H114V24" fill="none" stroke="currentColor" stroke-width="3"/><rect x="15" y="52" width="98" height="151" fill="${WATER}"/>` + L(15, 52, 113, 52, '#3b82f6', 2) + tx(18, 44, 'ผิวน้ำ', '#1d4ed8', 700, 10) +
    O(114, 90, 4, '#fff', 'currentColor') + O(114, 132, 4, '#fff', 'currentColor') + O(114, 176, 4, '#fff', 'currentColor') +
    `<path d="M118 90Q130 92 142 112" fill="none" stroke="#3b82f6" stroke-width="3"/><path d="M118 132Q146 134 168 164" fill="none" stroke="#3b82f6" stroke-width="3"/><path d="M118 176Q168 176 196 198" fill="none" stroke="#3b82f6" stroke-width="3"/>` +
    tx(122, 84, 'รูตื้น', '#374151', 600, 10) + tx(150, 126, 'รูกลาง', '#374151', 600, 10) + tx(122, 170, 'รูลึก: ไกลสุด', '#374151', 700, 10) +
    R(226, 52, 50, 152, WATER, 'none') + L(226, 52, 276, 52, '#3b82f6', 2) + `<polygon points="276,52 296,52 322,204 276,204" fill="#d6d3d1" stroke="currentColor" stroke-width="2.5"/>` +
    arrow('M272 72H244', BLUE) + arrow('M272 112H234', BLUE) + arrow('M272 152H228', BLUE) + arrow('M272 190H224', BLUE) +
    tx(222, 44, 'น้ำหลังเขื่อน', '#1d4ed8', 700, 10) + tx(250, 222, 'ฐานหนา', '#374151', 700, 10.5) +
    tx(8, 244, 'ยิ่งลึก → ความดันน้ำยิ่งมาก (ลูกศรยาวขึ้น)', '#374151', 700, 10.5) + tx(8, 260, 'ขึ้นกับความลึกและความหนาแน่นของของเหลว', '#374151', 600, 10));

  /* 51) แรงพยุง: ผลต่างของแรงดันบนและล่าง */
  F['m3-buoyancy-cube'] = svg(268,
    'ลูกบาศก์จมอยู่ในของเหลว แรงที่ผิวล่างมากกว่าผิวบน ผลต่างคือแรงพยุงทิศขึ้น แรงที่ผิวข้างหักล้างกัน',
    R(40, 20, 180, 220, WATER, 'none') + R(110, 96, 70, 70, BOX) +
    arrow('M145 40V92', RED) + tx(150, 62, 'บน 4 N (ลง)', RED, 700, 10.5) + arrow('M145 222V170', GRN) + tx(150, 214, 'ล่าง 6.5 N (ขึ้น)', GRN, 700, 10.5) +
    arrow('M60 130H106', BLUE) + arrow('M230 130H184', BLUE) + tx(48, 120, 'ข้าง 5 N', BLUE, 700, 10) + tx(186, 120, 'ข้าง 5 N', BLUE, 700, 10).replace('x="186"', 'x="190"') +
    tx(232, 60, 'แรงที่ข้างซ้าย-ขวา', '#374151', 600, 10) + tx(232, 74, 'เท่ากัน ตรงข้าม', '#374151', 600, 10) + tx(232, 88, '→ หักล้างกัน', '#374151', 600, 10) +
    tx(232, 168, 'แรงพยุง', GRN, 700, 12) + tx(232, 184, '= 6.5 − 4', GRN, 700, 11) + tx(232, 200, '= 2.5 N ขึ้น', GRN, 700, 11) +
    tx(30, 258, 'แรงพยุง = แรงที่ผิวล่าง − แรงที่ผิวบน (ผิวล่างลึกกว่า จึงถูกดันแรงกว่า)', '#374151', 700, 10));

  /* 52) ลอย จม ลอยขึ้น */
  (function () {
    const bk = (x, w) => `<path d="M${x} 36V196H${x + w}V36" fill="none" stroke="currentColor" stroke-width="2.5"/><rect x="${x + 1}" y="70" width="${w - 2}" height="125" fill="${WATER}"/>`;
    F['m3-float-sink'] = svg(262,
      'วัตถุลอยนิ่งเมื่อแรงพยุงเท่ากับน้ำหนัก จมเมื่อแรงพยุงน้อยกว่าน้ำหนัก ลอยขึ้นเมื่อแรงพยุงมากกว่าน้ำหนัก',
      bk(6, 108) + bk(126, 108) + bk(246, 108) +
      R(34, 84, 52, 40, BOX) + arrow('M60 104V158', RED) + arrow('M60 104V50', GRN) + tx(12, 26, 'ลอยนิ่ง', '#111827', 700, 11) +
      R(154, 146, 52, 40, '#d1d5db') + arrow('M180 166V192', RED) + arrow('M180 166V140', GRN) + tx(132, 26, 'จมนิ่งที่ก้น', '#111827', 700, 11) +
      R(274, 110, 52, 40, BOX) + arrow('M300 130V180', RED) + arrow('M300 130V56', GRN) + tx(252, 26, 'ลอยขึ้น', '#111827', 700, 11) +
      tx(10, 214, 'แรงพยุง = น้ำหนัก', '#111827', 700, 10) + tx(130, 214, 'แรงพยุง < น้ำหนัก', '#111827', 700, 10) + tx(130, 227, '(พื้นภาชนะดันขึ้นอีก)', '#374151', 600, 9.5) + tx(250, 214, 'แรงพยุง > น้ำหนัก', '#111827', 700, 10) + tx(250, 227, '(เช่น เติมอากาศ', '#374151', 600, 9.5) + tx(250, 239, 'ในเสื้อชูชีพ)', '#374151', 600, 9.5) +
      tx(10, 252, 'แดง = น้ำหนัก (ลง) · เขียว = แรงพยุง (ขึ้น)', '#374151', 700, 10));
  })();

  /* 53) โมเมนต์ของแรงและคานสมดุล */
  F['m3-moment-beam'] = svg(260,
    'คานเบายาว 2.4 เมตร มีจุดหมุนห่างปลายซ้าย 0.8 เมตร ถ้าแขวนวัตถุ 6 นิวตันที่ปลายซ้าย ต้องออกแรง 3 นิวตันทิศลงที่ปลายขวาจึงสมดุล',
    `<polygon points="120,142 106,172 134,172" fill="#94a3b8" stroke="currentColor" stroke-width="2"/>` + R(40, 130, 240, 12, '#fde68a') + O(120, 136, 4, '#111827') +
    arrow('M40 80V126', RED) + tx(48, 78, '6 N (ลง)', RED, 700, 11) + arrow('M280 80V126', RED) + tx(200, 78, 'F = 3 N (ลง)', RED, 700, 11) +
    tx(6, 164, 'ทวนเข็มนาฬิกา', ORG, 700, 10) + tx(6, 178, '6 × 0.8 = 4.8 N·m', ORG, 700, 10) + tx(176, 164, 'ตามเข็มนาฬิกา', BLUE, 700, 10) + tx(176, 178, '3 × 1.6 = 4.8 N·m', BLUE, 700, 10) +
    arrow('M80 196H44', GRY) + arrow('M80 196H116', GRY) + tx(48, 214, 'l₁ = 0.8 m', '#374151', 700, 10.5) + arrow('M200 196H124', GRY) + arrow('M200 196H278', GRY) + tx(150, 214, 'l₂ = 1.6 m', '#374151', 700, 10.5) +
    tx(8, 236, 'โมเมนต์ = แรง × ระยะตั้งฉากจากจุดหมุน', '#374151', 700, 10) + tx(8, 250, 'สมดุลเมื่อ โมเมนต์ตามเข็ม = โมเมนต์ทวนเข็ม', '#374151', 700, 10));

  /* 54) แรงลัพธ์และการเคลื่อนที่ */
  F['m3-net-force'] = svg(262,
    'แรงลัพธ์ไม่เป็นศูนย์และคงตัวทำให้เคลื่อนที่ด้วยความเร่งคงตัว แรงลัพธ์เป็นศูนย์ทำให้ความเร็วคงตัวหรืออยู่นิ่ง',
    tx(40, 16, 'ดึงของขึ้นด้วยเชือก', '#111827', 700, 11) + R(52, 100, 36, 30, BOX) + arrow('M70 98V30', GRN) + tx(84, 46, 'ดึง 9 N (ขึ้น)', GRN, 700, 10) + arrow('M70 132V168', RED) + tx(84, 156, 'น้ำหนัก 6 N (ลง)', RED, 700, 10) +
    tx(8, 196, 'แรงลัพธ์ = 9 − 6 = 3 N ขึ้น', '#111827', 700, 10.5) + tx(8, 212, 'คงตัวไม่เป็นศูนย์', '#374151', 600, 10) + tx(8, 226, '→ ความเร่งคงตัว (เร็วขึ้นเรื่อย ๆ)', GRN, 700, 10) +
    L(190, 24, 190, 236, '#cbd5e1', 1, 'stroke-dasharray="4 4"') + tx(205, 16, 'บนพื้นไร้แรงเสียดทาน', '#111827', 700, 11) +
    tx(200, 40, 'ช่วงที่ 1', '#374151', 700, 10.5) + R(250, 50, 36, 26, BOX) + arrow('M248 63H206', ORG) + tx(206, 92, 'F₁ = 40 N', ORG, 700, 10) + arrow('M288 63H342', BLUE) + tx(290, 92, 'F₂ = 55 N', BLUE, 700, 10) +
    tx(200, 112, 'ลัพธ์ 15 N ไปทาง F₂ → ความเร่ง', GRN, 700, 10) +
    tx(200, 148, 'ช่วงที่ 2', '#374151', 700, 10.5) + R(250, 158, 36, 26, BOX) + arrow('M248 171H206', ORG) + tx(206, 200, 'F₁ = 70 N', ORG, 700, 10) + arrow('M288 171H332', BLUE) + tx(290, 200, 'F₂ = 70 N', BLUE, 700, 10) +
    tx(200, 220, 'ลัพธ์ 0 → ความเร็วคงตัว', GRN, 700, 10) + tx(200, 234, '(เท่าความเร็วที่ได้ในช่วงที่ 1)', '#374151', 600, 9.5));

  /* 55) แรงเสียดทานสถิตและจลน์ */
  F['m3-friction-graph'] = svg(250,
    'กราฟแรงเสียดทานกับแรงดึง แรงเสียดทานสถิตเท่ากับแรงดึงจนถึงค่าสูงสุด หลังวัตถุเคลื่อนที่เหลือแรงเสียดทานจลน์ซึ่งคงตัวและต่ำกว่า',
    L(50, 200, 340, 200, 'currentColor', 2) + L(50, 200, 50, 20, 'currentColor', 2) + `<polyline points="50,200 190,60" fill="none" stroke="${BLUE}" stroke-width="3.5"/><polyline points="190,60 190,116" fill="none" stroke="${GRY}" stroke-width="2" stroke-dasharray="4 3"/><polyline points="190,116 336,116" fill="none" stroke="${RED}" stroke-width="3.5"/>` +
    O(190, 60, 4.5, BLUE) + L(50, 60, 190, 60, '#cbd5e1', 1, 'stroke-dasharray="4 4"') + L(50, 116, 190, 116, '#cbd5e1', 1, 'stroke-dasharray="4 4"') +
    tx(198, 58, 'สถิตสูงสุด', BLUE, 700, 10) + tx(70, 150, 'ยังนิ่ง', BLUE, 700, 11) + tx(70, 164, 'แรงเสียดทานสถิต', BLUE, 600, 10) + tx(70, 178, '= แรงดึง', BLUE, 600, 10) + tx(206, 100, 'เคลื่อนที่แล้ว', RED, 700, 11) + tx(206, 140, 'แรงเสียดทานจลน์ คงตัว', RED, 600, 10) + tx(206, 154, 'ต่ำกว่าสถิตสูงสุด', RED, 600, 10) +
    tx(196, 220, 'แรงดึงที่ออก →', '#374151', 600, 10.5) + `<text transform="translate(18 120) rotate(-90)" text-anchor="middle" font-size="10.5">แรงเสียดทาน</text>` +
    tx(8, 240, 'จุดสูงสุด = แรงที่ทำให้วัตถุ "เริ่ม" เคลื่อนที่', '#374151', 700, 10));

  /* 56) ปัจจัยของแรงเสียดทาน: แรงกดตั้งฉาก ไม่ใช่พื้นที่ผิวสัมผัส */
  F['m3-friction-test'] = svg(236,
    'ดึงกล่องที่มีถุงทรายด้วยเครื่องชั่งสปริงจนเริ่มเคลื่อนที่ แรงเสียดทานเพิ่มตามแรงกดตั้งฉาก ไม่ขึ้นกับพื้นที่ผิวสัมผัส',
    R(30, 110, 76, 36, BOX) + R(40, 92, 20, 18, '#d6d3d1') + R(64, 92, 20, 18, '#d6d3d1') + R(20, 146, 160, 8, '#a16207', '#a16207') + arrow('M30 128H8', BLUE).replace('M30 128H8', 'M106 128H168') + R(168, 118, 26, 20, '#f8fafc') + tx(170, 132, 'สปริง', '#111827', 700, 8.5) +
    tx(14, 176, 'น้ำหนักกล่อง+ทราย กดพื้น → แรงกด', '#374151', 600, 9.5) +
    tx(206, 40, 'ผลการทดลอง', '#111827', 700, 11) + tx(206, 62, 'ทราย 1 ถุง: เริ่มเลื่อนที่ 3 N', '#374151', 600, 10) + tx(206, 78, 'ทราย 2 ถุง: เริ่มเลื่อนที่ 6 N', '#374151', 600, 10) + tx(206, 94, 'ทราย 3 ถุง: เริ่มเลื่อนที่ 9 N', '#374151', 600, 10) +
    tx(206, 116, 'แรงกดมาก → เสียดทานมาก', RED, 700, 10.5) + R(206, 134, 40, 24, BOX) + R(258, 144, 80, 14, BOX) + tx(206, 176, 'วางตั้ง', '#374151', 600, 10) + tx(262, 176, 'วางนอน (พื้นที่มากกว่า)', '#374151', 600, 9.5).replace('x="262"', 'x="258"') +
    tx(206, 196, 'ทั้งสองแบบ เริ่มเลื่อนที่ 3 N เท่ากัน', GRN, 700, 10) + tx(206, 210, '→ พื้นที่ผิวสัมผัสไม่มีผล', GRN, 700, 10) + tx(8, 226, 'ต้องควบคุมชนิดผิวสัมผัสให้เหมือนกัน เปลี่ยนเฉพาะ "แรงกดตั้งฉาก"', '#374151', 700, 9.5));

  /* 57) ระยะทางกับการกระจัด และกราฟตำแหน่ง-เวลา */
  F['m3-displacement'] = svg(276,
    'เดินทาง 12 เมตรไปทางตะวันออกแล้ว 5 เมตรไปทางเหนือ ระยะทาง 17 เมตร การกระจัด 13 เมตรตามเส้นตรง และกราฟระยะทางกับเวลาที่มีช่วงหยุดนิ่ง',
    `<polyline points="40,120 160,120 160,60" fill="none" stroke="${BLUE}" stroke-width="3.5"/>` + arrow('M40 120L156 64', RED) + O(40, 120, 5, GRN) + O(160, 60, 5, RED) +
    tx(30, 138, 'เริ่มต้น', GRN, 700, 10.5) + tx(166, 58, 'สิ้นสุด', RED, 700, 10.5) + tx(76, 134, '12 m (ตะวันออก)', BLUE, 700, 10).replace('y="134"', 'y="140"') + tx(166, 94, '5 m', BLUE, 700, 10.5).replace('x="166"', 'x="168"') +
    tx(8, 28, 'การกระจัด 13 m', RED, 700, 10.5) + arrow('M70 32L98 88', RED) +
    tx(206, 40, 'ระยะทาง = ความยาวตามเส้นทาง', BLUE, 700, 10) + tx(206, 54, '= 12 + 5 = 17 m', BLUE, 700, 10) + tx(206, 76, 'การกระจัด = เส้นตรงจาก', RED, 700, 10) + tx(206, 90, 'จุดเริ่มไปจุดสุดท้าย (มีทิศ)', RED, 700, 10) + tx(206, 112, 'อัตราเร็วเฉลี่ย = 17/13 m/s', '#374151', 600, 10) + tx(206, 126, 'ความเร็วเฉลี่ย = 13/13 = 1 m/s', '#374151', 600, 10) +
    L(60, 252, 340, 252, 'currentColor', 2) + L(60, 252, 60, 160, 'currentColor', 2) + `<polyline points="60,252 130,206 200,206 330,166" fill="none" stroke="${RED}" stroke-width="3.5"/>` +
    tx(100, 196, 'วิ่ง', RED, 700, 10) + tx(150, 198, 'หยุด', GRY, 700, 10) + tx(262, 178, 'วิ่ง', RED, 700, 10) + tx(6, 168, 'ระยะทาง', '#374151', 600, 9.5) + tx(318, 246, 'เวลา', '#374151', 600, 10) + tx(6, 270, 'ช่วงราบ = หยุดนิ่ง ยังนับเวลาในอัตราเร็วเฉลี่ย', '#374151', 700, 9.5).replace('x="6" y="270"', 'x="60" y="270"'));

  /* 58) สนามแม่เหล็กและแรงกับระยะห่าง */
  F['m3-field'] = svg(256,
    'เส้นสนามแม่เหล็กออกจากขั้วเหนือเข้าขั้วใต้ เข็มทิศชี้ตามสนาม และแรงจากแหล่งสนามลดลงเมื่อระยะห่างมากขึ้น',
    R(70, 108, 50, 26, '#fecaca') + R(120, 108, 50, 26, '#bfdbfe') + tx(88, 126, 'N', RED, 700, 14) + tx(138, 126, 'S', BLUE, 700, 14) +
    `<path d="M70 121C20 121 20 50 120 50C220 50 220 121 170 121" fill="none" stroke="${GRY}" stroke-width="2"/><path d="M70 121C20 121 20 192 120 192C220 192 220 121 170 121" fill="none" stroke="${GRY}" stroke-width="2"/>` +
    arrow('M60 70L58 82', GRY).replace('M60 70L58 82', 'M96 52L104 50') + arrow('M154 52L168 56', GRY) + arrow('M96 190L106 192', GRY).replace('M96 190L106 192', 'M102 192L112 192') + arrow('M172 182L180 170', GRY) +
    `<circle cx="120" cy="30" r="12" fill="#fff" stroke="currentColor" stroke-width="2"/><polygon points="132,30 120,26 120,34" fill="${RED}"/><polygon points="108,30 120,26 120,34" fill="#cbd5e1"/>` +
    `<circle cx="120" cy="226" r="12" fill="#fff" stroke="currentColor" stroke-width="2"/><polygon points="132,226 120,222 120,230" fill="${RED}"/><polygon points="108,226 120,222 120,230" fill="#cbd5e1"/>` +
    tx(138, 34, 'เข็มทิศ', '#374151', 600, 10) + tx(138, 230, 'เข็มทิศ', '#374151', 600, 10) + tx(8, 252, 'ปลายแดงเข็มทิศ ชี้ตามทิศสนาม (N → S)', '#374151', 700, 9.5) +
    L(236, 210, 348, 210, 'currentColor', 2) + L(236, 210, 236, 40, 'currentColor', 2) + `<path d="M240 52C262 112 296 170 344 196" fill="none" stroke="${RED}" stroke-width="3.5"/>` + tx(238, 232, 'ระยะห่างจากแหล่งสนาม →', '#374151', 600, 9.5) + tx(244, 36, 'ขนาดแรง/สนาม', '#374151', 700, 10.5) +
    tx(284, 76, 'แรงแม่เหล็ก', RED, 700, 10) + tx(284, 90, 'แรงไฟฟ้า', RED, 700, 10) + tx(284, 104, 'สนามโน้มถ่วง', RED, 700, 10) + tx(284, 120, 'ไกลขึ้น →', RED, 700, 10) + tx(284, 134, 'น้อยลง', RED, 700, 10));

  /* ===== ว 3.2 โลก ลมฟ้าอากาศ ดิน น้ำ ===== */
  const SANDC = '#fde68a', BRN = '#a16207', LAKE = '#7dd3fc';

  /* 59) แม่น้ำคดเคี้ยว: นอกโค้งกร่อน ในโค้งสะสม */
  F['m3-meander'] = svg(280,
    'ที่โค้งของแม่น้ำ น้ำไหลเร็วที่นอกโค้งจึงกัดเซาะตลิ่งชันและท้องน้ำลึก น้ำไหลช้าที่ในโค้งจึงสะสมตะกอนตื้นและลาดเอียง',
    R(0, 0, 360, 150, '#ecfccb', 'none') + `<path d="M20 44H160C230 44 230 112 160 112H20" fill="none" stroke="${LAKE}" stroke-width="34" stroke-linecap="butt"/>` +
    `<path d="M186 62C204 66 204 90 186 94C176 90 176 66 186 62Z" fill="${SANDC}" stroke="${BRN}" stroke-width="1.5"/>` +
    arrow('M40 40H120', BLUE) + arrow('M222 66Q232 78 222 90', BLUE) + arrow('M120 116H40', BLUE) + `<path d="M232 62Q244 78 232 94" fill="none" stroke="${BLUE}" stroke-width="2.4"/>` +
    tx(250, 62, 'นอกโค้ง', RED, 700, 11) + tx(250, 76, 'น้ำเร็ว กัดเซาะ', RED, 600, 10) + tx(250, 90, 'ตลิ่งชันถอยร่น', RED, 600, 10) +
    tx(14, 84, 'ในโค้ง: น้ำช้า', '#92400e', 700, 10.5).replace('x="14"', 'x="60"') + tx(60, 98, 'ตะกอนสะสม', '#92400e', 600, 10) + L(110, 84, 186, 78, GRY, 1.2) +
    tx(8, 14, 'ภาพมุมสูง (น้ำไหลจากซ้ายไปขวาตามเส้นทางโค้ง)', '#374151', 600, 10) +
    L(10, 168, 350, 168, '#a16207', 4) + `<path d="M40 168L100 196L170 218Q200 222 226 218L246 168Z" fill="${LAKE}" stroke="${BLUE}" stroke-width="2"/>` + `<path d="M10 168H40L100 196L170 218Q200 222 226 218L246 168H350V240H10Z" fill="#fde68a" fill-opacity="0.45" stroke="none"/>` +
    tx(8, 186, 'ในโค้ง: ตื้น ลาดเอียง', '#92400e', 700, 10) + tx(8, 200, 'ตะกอนทับถม', '#92400e', 600, 10) + tx(252, 186, 'นอกโค้ง: ลึก', RED, 700, 10) + tx(252, 200, 'ตลิ่งชัน ถูกกัดเซาะ', RED, 600, 10) +
    tx(8, 262, 'ภาพตัดขวางตามแนวที่โค้ง: ฝั่งน้ำไหลเร็วลึกชัน ฝั่งน้ำไหลช้าตื้นลาด', '#374151', 700, 9.5));

  /* 60) ภูมิลักษณ์จากการสะสมตัวของตะกอน */
  (function () {
    const panel = (ox, title, body, l1, l2) => R(ox, 22, 110, 120, '#f8fafc', 'currentColor') + C(ox + 55, 14, title, 'font-size="11" font-weight="700"') + body + C(ox + 55, 158, l1, 'font-size="10" font-weight="700"') + C(ox + 55, 172, l2, 'font-size="9.5"');
    F['m3-river-landforms'] = svg(204,
      'ตะกอนน้ำพารูปพัดเกิดที่เชิงเขา ดินดอนสามเหลี่ยมเกิดที่ปากแม่น้ำ ทะเลสาบรูปแอกเกิดจากโค้งแม่น้ำที่ถูกตัดขาด',
      panel(4, 'ตะกอนน้ำพารูปพัด', `<polygon points="14,30 54,30 84,104 14,104" fill="#86efac" stroke="#166534" stroke-width="1.5"/>` + `<polygon points="40,104 70,92 100,104 100,134 20,134" fill="${SANDC}" stroke="${BRN}" stroke-width="1.5"/>` + `<path d="M50 60L62 104M56 104L50 134M62 104L72 134" fill="none" stroke="${BLUE}" stroke-width="2"/>`, 'เชิงเขา ที่ลาดชัน → ราบ', 'น้ำช้าลงทันที ตะกอนตก') +
      panel(126, 'ดินดอนสามเหลี่ยม', `<rect x="130" y="100" width="102" height="38" fill="${LAKE}"/>` + `<path d="M171 26V104" stroke="${LAKE}" stroke-width="12"/>` + `<polygon points="171,98 144,124 198,124" fill="${SANDC}" stroke="${BRN}" stroke-width="1.5"/>` + `<polygon points="171,98 150,114 192,114" fill="#fcd34d" stroke="none" opacity="0.5"/>`, 'ปากแม่น้ำ ไหลลงทะเล', 'น้ำช้าลง ตะกอนทับถม') +
      panel(248, 'ทะเลสาบรูปแอก', `<path d="M254 122H352" fill="none" stroke="${LAKE}" stroke-width="10"/>` + `<path d="M272 84Q300 36 330 84Q300 62 272 84Z" fill="${LAKE}" stroke="${BLUE}" stroke-width="1.5"/>` + C(302, 104, 'ทะเลสาบรูปพระจันทร์เสี้ยว', 'font-size="8.5"'), 'โค้งถูกตัดขาด', 'ตะกอนปิดทางน้ำเดิม') +
      C(180, 196, 'ทั้งหมดเกิดจากการ "สะสมตัว" · แคนยอน กุมภลักษณ์ เกิดจากการ "กร่อน"', 'font-size="10" font-weight="700"'));
  })();

  /* 61) หินงอก หินย้อย แท่งเสา */
  F['m3-cave'] = svg(236,
    'น้ำที่ละลายหินปูนหยดจากเพดานถ้ำ ตกตะกอนแคลเซียมคาร์บอเนตเกิดหินย้อยที่เพดานและหินงอกที่พื้น เมื่อต่อกันเป็นแท่งเสา',
    `<path d="M0 0H360V28H0Z" fill="#a8a29e" stroke="currentColor" stroke-width="2"/><path d="M0 206H360V236H0Z" fill="#a8a29e" stroke="currentColor" stroke-width="2"/>` +
    `<polygon points="40,28 66,28 53,96" fill="#e7e5e4" stroke="currentColor" stroke-width="2"/><polygon points="120,28 144,28 132,70" fill="#e7e5e4" stroke="currentColor" stroke-width="2"/>` +
    `<polygon points="35,206 71,206 53,138" fill="#e7e5e4" stroke="currentColor" stroke-width="2"/>` +
    `<polygon points="238,28 276,28 262,206 252,206" fill="#e7e5e4" stroke="currentColor" stroke-width="2"/>` + `<polygon points="250,28 264,28 276,206 240,206" fill="#d6d3d1" opacity="0.4"/>` +
    `<path d="M132 74V130" stroke="${BLUE}" stroke-width="2" stroke-dasharray="3 4"/>` + O(132, 134, 3, BLUE) + `<polygon points="110,206 150,206 130,150" fill="#e7e5e4" stroke="currentColor" stroke-width="2"/>` +
    tx(8, 18, 'เพดานถ้ำหินปูน', '#111827', 700, 10.5).replace('fill="#111827"', 'fill="#fff"') + tx(8, 226, 'พื้นถ้ำ', '#111827', 700, 10.5).replace('fill="#111827"', 'fill="#fff"') +
    tx(22, 118, 'หินย้อย', '#111827', 700, 11).replace('x="22"', 'x="70"').replace('y="118"', 'y="62"') + tx(144, 120, 'หินงอก', '#111827', 700, 11).replace('y="120"', 'y="186"').replace('x="144"', 'x="156"') + tx(284, 120, 'แท่งเสา', '#111827', 700, 11) +
    tx(270, 136, '(ย้อยต่องอก)', '#374151', 600, 9.5) + tx(160, 100, 'น้ำหยดช้า ๆ', BLUE, 700, 10).replace('x="160"', 'x="140"') +
    tx(160, 50, 'น้ำฝนละลาย CO₂', '#374151', 600, 9.5) + tx(160, 63, 'เป็นกรดอ่อน ละลาย', '#374151', 600, 9.5) + tx(160, 76, 'หินปูน ไหลซึมลงมา', '#374151', 600, 9.5) +
    tx(8, 252, '', '#111827'));

  /* 62) ความชื้นสัมพัทธ์: ไอน้ำอิ่มตัวกับอุณหภูมิ */
  (function () {
    const gx = t => 56 + t * 7, gy = v => 206 - v * 3.4;
    const pts = [[0, 5], [10, 9], [20, 17], [30, 30], [40, 51]].map(p => `${gx(p[0])},${gy(p[1])}`).join(' ');
    F['m3-vapor-curve'] = svg(262,
      'ปริมาณไอน้ำอิ่มตัวเพิ่มขึ้นเมื่ออุณหภูมิสูงขึ้น เมื่ออากาศเย็นลงจนไอน้ำจริงเท่ากับไอน้ำอิ่มตัว ความชื้นสัมพัทธ์ 100% เกิดการควบแน่น',
      L(56, 206, 340, 206, 'currentColor', 2) + L(56, 206, 56, 24, 'currentColor', 2) + `<polyline points="${pts}" fill="none" stroke="${RED}" stroke-width="3.5"/>` +
      L(56, gy(18), gx(30), gy(18), BLUE, 2, 'stroke-dasharray="5 4"') + L(gx(30), gy(18), gx(30), gy(30), '#374151', 1.5, 'stroke-dasharray="3 3"') + O(gx(30), gy(30), 4.5, RED) + O(gx(30), gy(18), 4.5, BLUE) + O(gx(21), gy(18), 4.5, '#0f766e') +
      tx(gx(31) + 4, gy(30) - 2, 'อิ่มตัว 30', RED, 700, 10) + tx(gx(31) + 4, gy(18) + 14, 'ไอน้ำจริง 18', BLUE, 700, 10) + tx(62, gy(18) - 6, 'ไอน้ำจริงคงที่', BLUE, 700, 10) +
      tx(gx(22), 176, 'เย็นลงถึง ≈ 21 °C', '#0f766e', 700, 10) + tx(gx(22), 190, '= จุดน้ำค้าง', '#0f766e', 700, 10) + L(gx(21), gy(18), gx(21), 206, '#0f766e', 1.2, 'stroke-dasharray="3 3"') +
      tx(30, 206, '0', '#374151', 600, 10) + tx(gx(10) - 6, 220, '10', '#374151', 600, 10) + tx(gx(20) - 6, 220, '20', '#374151', 600, 10) + tx(gx(30) - 6, 220, '30', '#374151', 600, 10) + tx(gx(40) - 6, 220, '40', '#374151', 600, 10) +
      tx(190, 236, 'อุณหภูมิ (°C)', '#374151', 600, 10.5) + `<text transform="translate(18 120) rotate(-90)" text-anchor="middle" font-size="10">ไอน้ำ (g/m³)</text>` +
      tx(8, 254, 'ที่ 30 °C: RH = 18/30 × 100 = 60% (ค่าประมาณเพื่ออธิบาย)', '#374151', 700, 9));
  })();

  /* 63) ไซครอมิเตอร์ และกระดาษโคบอลต์คลอไรด์ */
  F['m3-psychrometer'] = svg(250,
    'ไซครอมิเตอร์ใช้เทอร์มอมิเตอร์กระเปาะแห้งและกระเปาะเปียก ผลต่างของอุณหภูมิมากแสดงว่าอากาศแห้ง ผลต่างน้อยแสดงว่าอากาศชื้น',
    `<rect x="60" y="24" width="14" height="130" rx="6" fill="#fff" stroke="currentColor" stroke-width="2"/><rect x="63" y="68" width="8" height="86" fill="${RED}"/>` + O(67, 160, 11, RED, 'currentColor') + tx(40, 18, 'กระเปาะแห้ง', '#111827', 700, 10.5) + tx(20, 60, '30 °C', RED, 700, 11) +
    `<rect x="150" y="24" width="14" height="130" rx="6" fill="#fff" stroke="currentColor" stroke-width="2"/><rect x="153" y="84" width="8" height="70" fill="${RED}"/>` + O(157, 160, 11, '#fecaca', 'currentColor') + `<path d="M146 160H168V178H146Z" fill="#dbeafe" stroke="${BLUE}" stroke-width="1.5"/>` + tx(130, 18, 'กระเปาะเปียก', '#111827', 700, 10.5) + tx(178, 76, '27 °C', RED, 700, 11) +
    R(130, 190, 56, 28, '#bfdbfe') + L(157, 178, 157, 202, BLUE, 2) + tx(110, 244, 'น้ำ + ผ้าก๊อซหุ้มกระเปาะ', '#374151', 600, 9.5) +
    tx(200, 52, 'กระเปาะเปียกเย็นกว่า เพราะ', '#374151', 600, 10) + tx(200, 66, 'น้ำระเหยดูดความร้อน', '#374151', 600, 10) + tx(200, 90, 'ผลต่าง = 30 − 27 = 3 °C', '#111827', 700, 10.5) + tx(200, 106, 'เปิดตารางหาค่า RH', '#374151', 600, 10) +
    tx(200, 132, 'ผลต่างมาก → แห้ง (RH ต่ำ)', RED, 700, 10) + tx(200, 146, 'ผลต่างน้อย → ชื้น (RH สูง)', BLUE, 700, 10) +
    R(206, 168, 36, 22, '#3b82f6') + R(244, 168, 36, 22, '#c084fc') + R(282, 168, 36, 22, '#f9a8d4') + tx(206, 204, 'กระดาษโคบอลต์ (II) คลอไรด์', '#374151', 600, 9) + tx(206, 218, 'น้ำเงิน → ม่วง → ชมพู', '#374151', 700, 9.5) + tx(206, 232, 'แห้ง ───────→ ชื้น', '#374151', 600, 9.5));

  /* 64) ระยะของพายุฝนฟ้าคะนอง */
  (function () {
    const DARKC = '#6b7280';
    F['m3-thunderstorm'] = svg(250,
      'พายุฝนฟ้าคะนองมีสามระยะ เจริญเติบโตมีกระแสอากาศขึ้น เจริญเต็มที่มีทั้งขึ้นลงและฝนหนัก ฟ้าผ่า สลายตัวมีกระแสอากาศลงและฝนเบา',
      C(60, 14, 'ระยะเจริญเติบโต', 'font-size="10.5" font-weight="700"') + C(180, 14, 'ระยะเจริญเต็มที่', 'font-size="10.5" font-weight="700"') + C(300, 14, 'ระยะสลายตัว', 'font-size="10.5" font-weight="700"') +
      `<ellipse cx="60" cy="86" rx="24" ry="16" fill="#e5e7eb" stroke="${DARKC}" stroke-width="2"/><ellipse cx="50" cy="70" rx="18" ry="14" fill="#e5e7eb" stroke="${DARKC}" stroke-width="2"/>` + arrow('M40 150V110', RED) + arrow('M60 150V108', RED) + arrow('M80 150V110', RED) +
      `<path d="M152 94C144 66 156 40 170 38C172 24 196 22 200 36C226 34 220 70 212 94Z" fill="#9ca3af" stroke="${DARKC}" stroke-width="2"/><ellipse cx="182" cy="40" rx="46" ry="9" fill="#6b7280" opacity="0.55"/>` +
      arrow('M160 150V96', RED) + arrow('M200 100V150', BLUE) + `<path d="M186 96L176 116L188 114L178 136" fill="none" stroke="#eab308" stroke-width="3"/>` + L(196, 104, 190, 132, BLUE, 1.5, 'stroke-dasharray="2 3"') +
      `<ellipse cx="300" cy="60" rx="40" ry="14" fill="#e5e7eb" stroke="${DARKC}" stroke-width="2"/>` + arrow('M290 80V140', BLUE) + arrow('M310 84V132', BLUE) + L(280, 100, 276, 124, BLUE, 1.2, 'stroke-dasharray="2 3"') +
      R(10, 168, 340, 10, '#86efac', 'none') +
      C(60, 190, 'อากาศร้อนชื้นลอยขึ้น', 'font-size="9.5"') + C(60, 203, 'เกิดเมฆก้อน (คิวมูลัส)', 'font-size="9.5"') + C(60, 216, 'ยังไม่มีฝนตก', 'font-size="9.5"') +
      C(180, 190, 'คิวมูโลนิมบัส', 'font-size="9.5" font-weight="700"') + C(180, 203, 'ฝนหนัก ลมกระโชก', 'font-size="9.5"') + C(180, 216, 'ฟ้าร้อง ฟ้าแลบ ฟ้าผ่า', 'font-size="9.5"') +
      C(300, 190, 'กระแสอากาศลงเด่น', 'font-size="9.5"') + C(300, 203, 'ฝนเบา ฝนพรำ', 'font-size="9.5"') + C(300, 216, 'แล้วสลายไป', 'font-size="9.5"') +
      C(180, 238, 'แดง = อากาศขึ้น · น้ำเงิน = อากาศลง/ฝน · เหลือง = ฟ้าแลบ', 'font-size="9.5"'));
  })();

  /* 65) พายุหมุนเขตร้อน */
  (function () {
    const spiral = (cx, cy, ccw) => { let d = ''; for (let i = 28; i >= 0; i--) { const a = i * 0.32, r = 6 + i * 2.1, x = cx + r * Math.cos(ccw ? -a : a), y = cy + r * Math.sin(ccw ? -a : a); d += (i === 28 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1); } return `<path d="${d}" fill="none" stroke="${BLUE}" stroke-width="2.4" marker-end="url(#ahB)"/>`; };
    F['m3-cyclone'] = svg(268,
      'พายุหมุนเขตร้อนซีกโลกเหนือลมพัดเวียนเข้าทวนเข็มนาฬิกา ซีกโลกใต้ตามเข็มนาฬิกา ตาพายุลมสงบ กำแพงตาพายุลมแรงที่สุด',
      C(90, 14, 'ซีกโลกเหนือ: ทวนเข็ม', 'font-size="10.5" font-weight="700"') + C(270, 14, 'ซีกโลกใต้: ตามเข็ม', 'font-size="10.5" font-weight="700"') +
      spiral(90, 84, false) + spiral(270, 84, true) + O(90, 84, 6, '#fff', 'currentColor') + O(270, 84, 6, '#fff', 'currentColor') + C(90, 150, 'มองจากด้านบน ลมเวียนเข้าหาศูนย์กลาง', 'font-size="9.5"') + C(270, 150, 'มองจากด้านบน ลมเวียนเข้าหาศูนย์กลาง', 'font-size="9.5"') +
      L(14, 164, 346, 164, '#cbd5e1', 1, 'stroke-dasharray="4 4"') +
      `<path d="M30 238H330" stroke="${BLUE}" stroke-width="10" opacity="0.45"/>` + `<path d="M60 238C70 190 100 180 130 176M300 238C290 190 260 180 230 176" fill="none" stroke="${GRY}" stroke-width="2"/>` +
      `<rect x="148" y="176" width="64" height="62" fill="#e0f2fe" stroke="none"/>` + `<path d="M124 232C130 196 136 180 142 176M236 232C230 196 224 180 218 176" fill="none" stroke="#6b7280" stroke-width="12" opacity="0.8"/>` +
      C(180, 214, 'ตาพายุ', 'font-size="10.5" font-weight="700"') + C(180, 227, 'ลมสงบ ท้องฟ้าโปร่ง', 'font-size="9.5"') + tx(8, 188, 'กำแพง', RED, 700, 10) + tx(8, 200, 'ตาพายุ', RED, 700, 10) + tx(8, 212, 'ลมแรงสุด', RED, 600, 9.5) + tx(250, 192, 'อากาศพัดเวียนเข้า', '#374151', 600, 9.5) + tx(250, 205, 'ยกตัวขึ้นแล้วกระจาย', '#374151', 600, 9) + tx(250, 168, 'ภาพตัดขวาง', '#374151', 700, 10) +
      C(180, 258, 'ก่อตัวเหนือทะเลอุ่น (≥ 26 °C) · ขึ้นฝั่ง ขาดไอน้ำ จึงอ่อนกำลังลง', 'font-size="9.5" font-weight="700"'));
  })();

  /* 66) ลำดับชั้นของถ่านหิน */
  F['m3-coal-rank'] = svg(232,
    'พืชทับถมกลายเป็นพีต ลิกไนต์ ซับบิทูมินัส บิทูมินัส แอนทราไซต์ ยิ่งถูกความร้อนและความดันนานและลึก ปริมาณคาร์บอนและค่าความร้อนยิ่งสูง',
    arrow('M12 30H348', GRY) + tx(14, 22, 'ความลึก ความร้อน ความดัน และเวลา มากขึ้น', '#374151', 700, 10.5) +
    R(8, 40, 60, 34, '#a16207', 'none') + R(76, 40, 62, 34, '#78350f', 'none') + R(146, 40, 66, 34, '#57534e', 'none') + R(220, 40, 62, 34, '#1f2937', 'none') + R(290, 40, 62, 34, '#000', 'none') +
    tx(18, 62, 'พีต', '#fff', 700, 11) + tx(88, 62, 'ลิกไนต์', '#fff', 700, 11) + tx(148, 62, 'ซับบิทูมินัส', '#fff', 700, 10) + tx(228, 62, 'บิทูมินัส', '#fff', 700, 11) + tx(293, 62, 'แอนทราไซต์', '#fff', 700, 8.5) +
    R(24, 140, 20, 30, '#a16207', 'none') + R(94, 128, 20, 42, '#78350f', 'none') + R(170, 112, 20, 58, '#57534e', 'none') + R(240, 96, 20, 74, '#1f2937', 'none') + R(310, 84, 20, 86, '#000', 'none') + L(10, 170, 350, 170, 'currentColor', 2) +
    tx(8, 88, 'ต้นกำเนิด: พืชบก (ต้นไม้ใหญ่ พืชน้ำจืดในหนอง) ทับถมในที่ชื้นแฉะ', '#374151', 600, 9.5) +
    tx(8, 192, 'แท่ง = ปริมาณคาร์บอน (สูงขึ้น) · ค่าความร้อนจากการเผาก็สูงขึ้นตาม', '#111827', 700, 10) + tx(8, 208, 'ลำดับคาร์บอนมาก → น้อย: แอนทราไซต์ > บิทูมินัส > ซับบิทูมินัส > ลิกไนต์', '#374151', 700, 9.5) +
    tx(8, 224, 'เชื้อเพลิงซากดึกดำบรรพ์: ถ่านหินจากพืชบก · ปิโตรเลียมจากแพลงก์ตอนทะเล', '#374151', 600, 9.5));

  /* 67) แหล่งกักเก็บปิโตรเลียม */
  F['m3-oil-trap'] = svg(262,
    'แหล่งปิโตรเลียมประกอบด้วยชั้นหินต้นกำเนิด ชั้นหินกักเก็บที่มีรูพรุน และชั้นหินปิดกั้นเนื้อละเอียด แก๊สเบาอยู่บน น้ำมันอยู่กลาง น้ำอยู่ล่าง',
    tx(8, 14, '① ชั้นหินปิดกั้น: หินดินดาน เนื้อละเอียด น้ำมันซึมผ่านยาก', '#374151', 700, 9.5) +
    tx(8, 28, '② ชั้นหินกักเก็บ: หินทราย/หินปูน มีรูพรุนมาก เก็บน้ำมันได้', '#374151', 700, 9.5) +
    tx(8, 42, '③ ชั้นหินต้นกำเนิด: หินตะกอนเนื้อละเอียด มีสารอินทรีย์มาก', '#374151', 700, 9.5) +
    `<path d="M10 176Q180 50 350 176V240H10Z" fill="#fde68a" stroke="none"/>` +
    `<clipPath id="trapc"><path d="M10 176Q180 50 350 176V240H10Z"/></clipPath><g clip-path="url(#trapc)"><rect x="10" y="100" width="340" height="52" fill="#fbcfe8"/><rect x="10" y="152" width="340" height="30" fill="#b45309"/><rect x="10" y="182" width="340" height="40" fill="#93c5fd"/></g>` +
    `<path d="M10 176Q180 50 350 176" fill="none" stroke="#475569" stroke-width="14"/>` +
    `<rect x="10" y="222" width="340" height="20" fill="#78716c"/>` +
    tx(150, 150, 'แก๊ส (เบาสุด)', '#831843', 700, 10.5) + tx(150, 172, 'น้ำมัน', '#fff', 700, 10.5) + tx(120, 206, 'น้ำ (หนาแน่นสุด)', '#1e3a8a', 700, 10.5) +
    tx(174, 104, '①', '#fff', 700, 11) + tx(40, 206, '②', '#1e3a8a', 700, 12) + tx(20, 236, '③', '#fff', 700, 11) +
    tx(8, 258, 'ความหนาแน่นมาก → น้อย: น้ำ > น้ำมัน > แก๊ส (ของเบากว่าลอยอยู่บน)', '#374151', 700, 9.5));
  /* 68) น้ำใต้ดินและบ่อน้ำ */
  F['m3-groundwater'] = svg(274,
    'ระดับน้ำใต้ดินสูงในฤดูฝนและต่ำในฤดูแล้ง บ่อที่ก้นบ่ออยู่ต่ำกว่าระดับน้ำใต้ดินฤดูแล้งมีน้ำตลอดปี บ่อที่ก้นอยู่ระหว่างสองระดับมีน้ำเฉพาะฤดูฝน',
    `<path d="M0 60Q90 40 180 56T360 50V274H0Z" fill="#fde68a" stroke="${BRN}" stroke-width="2"/><rect x="0" y="168" width="360" height="22" fill="#a8a29e" opacity="0.7"/><rect x="0" y="232" width="360" height="42" fill="#78716c" opacity="0.8"/>` +
    L(0, 110, 360, 110, BLUE, 2.5, 'stroke-dasharray="7 4"') + L(0, 150, 360, 150, '#0e7490', 2.5, 'stroke-dasharray="7 4"') +
    `<rect x="46" y="58" width="22" height="130" fill="#fff" stroke="currentColor" stroke-width="2.5"/><rect x="47" y="152" width="20" height="35" fill="${LAKE}"/>` +
    `<rect x="150" y="56" width="22" height="70" fill="#fff" stroke="currentColor" stroke-width="2.5"/><rect x="151" y="112" width="20" height="13" fill="${LAKE}" opacity="0.5"/>` +
    `<rect x="254" y="54" width="22" height="42" fill="#fff" stroke="currentColor" stroke-width="2.5"/>` +
    tx(40, 50, 'บ่อ A', '#111827', 700, 11) + tx(144, 48, 'บ่อ B', '#111827', 700, 11) + tx(248, 46, 'บ่อ C', '#111827', 700, 11) +
    tx(284, 106, 'ระดับฤดูฝน', BLUE, 700, 10) + tx(284, 164, 'ระดับฤดูแล้ง', '#0e7490', 700, 10) +
    tx(8, 182, 'ชั้นหินอุ้มน้ำ (ทราย กรวด) น้ำซึมผ่าน/กักเก็บได้ดี', '#111827', 700, 9.5).replace('x="8"', 'x="76"').replace('y="182"', 'y="184"') + tx(8, 250, 'ชั้นหินที่น้ำซึมผ่านยาก (ดินเหนียว หินดินดาน)', '#fff', 700, 9.5) +
    tx(8, 212, 'A: ก้นบ่อต่ำกว่าระดับฤดูแล้ง → มีน้ำตลอดปี', '#111827', 700, 9.5).replace('y="212"', 'y="204"') + tx(8, 218, 'B: ก้นอยู่ระหว่างสองระดับ → มีน้ำเฉพาะฤดูฝน', '#111827', 700, 9.5).replace('y="218"', 'y="216"').replace('x="8"', 'x="76"') + tx(76, 228, 'C: ก้นบ่ออยู่สูงกว่าระดับฤดูฝน → แห้งตลอด', '#111827', 700, 9.5) +
    tx(8, 268, '', '#111827'));

  /* 69) ชนิดของเมฆกับลมฟ้าอากาศ */
  F['m3-cloud-types'] = svg(240,
    'เมฆชั้นสูงบางสีขาวมักอากาศดี เมฆแผ่นหนาสีเทาเข้มให้ฝนพรำต่อเนื่อง เมฆก้อนสูงใหญ่คิวมูโลนิมบัสให้ฝนหนักและฟ้าคะนอง',
    R(0, 0, 360, 240, '#e0f2fe', 'none') +
    `<path d="M20 36Q50 22 80 34M30 46Q70 34 104 44M40 54Q64 46 96 52" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/>` + tx(14, 78, 'เมฆชั้นสูง (ซีร์โรสเตรตัส)', '#111827', 700, 9.5) + tx(14, 91, 'บางสีขาว → อากาศดี', GRN, 700, 9.5) +
    `<rect x="136" y="48" width="96" height="30" rx="10" fill="#6b7280"/>` + L(150, 80, 146, 112, BLUE, 1.6, 'stroke-dasharray="2 3"') + L(172, 80, 168, 116, BLUE, 1.6, 'stroke-dasharray="2 3"') + L(194, 80, 190, 112, BLUE, 1.6, 'stroke-dasharray="2 3"') + L(216, 80, 212, 116, BLUE, 1.6, 'stroke-dasharray="2 3"') +
    tx(128, 40, 'นิมโบสเตรตัส', '#111827', 700, 9.5).replace('y="40"', 'y="38"') + tx(128, 130, 'แผ่นหนาสีเทาเข้ม', '#111827', 700, 9.5) + tx(128, 143, 'ฝนพรำต่อเนื่อง', BLUE, 700, 9.5) +
    `<path d="M262 156C256 122 262 92 270 72C262 56 280 40 296 52C312 38 334 54 324 72C336 100 332 130 324 156Z" fill="#9ca3af" stroke="#4b5563" stroke-width="2"/><ellipse cx="294" cy="48" rx="54" ry="9" fill="#6b7280" opacity="0.5"/>` + `<path d="M296 100L286 124L298 122L288 148" fill="none" stroke="#eab308" stroke-width="3"/>` +
    tx(244, 30, 'คิวมูโลนิมบัส', '#111827', 700, 9.5) + tx(244, 172, 'ก้อนสูงใหญ่ → ฝนหนัก', RED, 700, 9.5) + tx(244, 185, 'ฟ้าร้อง ฟ้าผ่า ลมกระโชก', RED, 700, 9.5) +
    R(0, 200, 360, 40, '#86efac', 'none') + tx(8, 222, 'ดูเมฆ + ท้องฟ้า + ลม ความกดอากาศ เพื่อพยากรณ์ช่วงสั้น', '#111827', 700, 9.5));

  /* 70) ชั้นหน้าตัดดิน */
  F['m3-soil-profile'] = svg(250,
    'ชั้นหน้าตัดดิน ชั้นอินทรียวัตถุ หน้าดิน ดินชั้นล่าง หินผุ และหินต้นกำเนิด',
    R(30, 14, 150, 22, '#3f3f46', 'currentColor') + R(30, 36, 150, 44, '#78350f', 'currentColor') + R(30, 80, 150, 54, '#c2410c', 'currentColor') + R(30, 134, 150, 46, '#d6a86f', 'currentColor') + R(30, 180, 150, 54, '#9ca3af', 'currentColor') +
    tx(44, 29, 'ชั้น O', '#fff', 700, 10.5) + tx(44, 62, 'ชั้น A (หน้าดิน)', '#fff', 700, 10.5) + tx(44, 110, 'ชั้น B (ดินชั้นล่าง)', '#fff', 700, 10.5) + tx(44, 160, 'ชั้น C (หินผุ)', '#111827', 700, 10.5) + tx(44, 212, 'ชั้น R หินต้นกำเนิด', '#111827', 700, 10.5) +
    tx(190, 28, 'ซากพืชซากสัตว์ทับถม', '#374151', 600, 9.5) + tx(190, 56, 'สีเข้ม มีฮิวมัส ธาตุอาหาร', '#374151', 600, 9.5) + tx(190, 70, 'รากพืชอยู่มาก', '#374151', 600, 9.5) +
    tx(190, 102, 'ดินละเอียดขึ้น สะสมแร่ธาตุ', '#374151', 600, 9.5) + tx(190, 116, 'ที่ถูกชะล้างลงมา', '#374151', 600, 9.5) + tx(190, 156, 'หินที่แตกผุเป็นก้อน', '#374151', 600, 9.5) + tx(190, 170, 'ชิ้นเล็ก ๆ ยังไม่เป็นดิน', '#374151', 600, 9.5) + tx(190, 212, 'หินแข็ง ยังไม่ผุพัง', '#374151', 600, 9.5) +
    arrow('M16 214V20', GRN) + tx(2, 244, 'ผุพังต่อเนื่องจากล่างขึ้นบน', '#374151', 700, 9.5) + tx(190, 244, 'ดินเกิดจากหินผุ + อินทรียวัตถุ', '#374151', 700, 9.5).replace('y="244"', 'y="242"'));

  /* ===== ว 1.3 พันธุกรรม การแบ่งเซลล์ โรคพันธุกรรม GMO ความหลากหลายทางชีวภาพ ===== */
  const tg = (x, y, s, c = '#111827', w = 600, sz = 10.5, extra = '') => T(x, y, s, `fill="${c}" font-weight="${w}" font-size="${sz}" ${extra}`);
  const tgc = (x, y, s, c = '#111827', w = 600, sz = 10.5) => tg(x, y, s, c, w, sz, 'text-anchor="middle"');

  /* 1) ยีน ดีเอ็นเอ โครโมโซม */
  (function () {
    let helix = '';
    for (let i = 0; i < 6; i++) {
      const y = 36 + i * 22;
      helix += `<path d="M232 ${y}C262 ${y + 6} 262 ${y + 16} 292 ${y + 22}" fill="none" stroke="#1d4ed8" stroke-width="3"/><path d="M292 ${y}C262 ${y + 6} 262 ${y + 16} 232 ${y + 22}" fill="none" stroke="#b91c1c" stroke-width="3"/>`;
      helix += L(240, y + 11, 284, y + 11, '#94a3b8', 1.2);
    }
    F['m3-dna-chromosome'] = svg(248,
      'นิวเคลียสมีโครโมโซม โครโมโซมประกอบด้วยดีเอ็นเอพันเกลียวคู่ ยีนคือช่วงของดีเอ็นเอที่กำหนดลักษณะ',
      `<circle cx="52" cy="84" r="42" fill="#f1f5f9" stroke="currentColor" stroke-width="2.5"/>` + `<path d="M34 70L56 98M56 70L34 98" stroke="#7e22ce" stroke-width="6" stroke-linecap="round"/><path d="M62 66L74 94M74 66L62 94" stroke="#7e22ce" stroke-width="5" stroke-linecap="round"/>` +
      tgc(52, 140, 'นิวเคลียส', '#111827', 700, 11) + tgc(52, 154, 'มีโครโมโซมหลายแท่ง', '#374151', 600, 9) +
      arrow('M100 84H128', GRY) +
      `<path d="M148 40C140 66 164 78 154 96C142 116 142 130 148 148" fill="none" stroke="#7e22ce" stroke-width="12" stroke-linecap="round"/><path d="M168 40C176 66 152 78 162 96C174 116 174 130 168 148" fill="none" stroke="#a855f7" stroke-width="12" stroke-linecap="round"/><circle cx="158" cy="94" r="7" fill="#c4b5fd" stroke="#7e22ce" stroke-width="1.5"/>` +
      tgc(158, 168, 'โครโมโซม', '#7e22ce', 700, 11) + tgc(158, 182, '(จำลองตัวแล้ว', '#374151', 600, 9) + tgc(158, 194, 'มี 2 โครมาทิด)', '#374151', 600, 9) +
      arrow('M184 84H214', GRY) + helix +
      R(222, 80, 80, 26, '#fde047', 'none', 'opacity="0.55"') + tg(308, 96, 'ยีน', '#a16207', 700, 12) +
      tgc(262, 188, 'ดีเอ็นเอ (DNA)', '#1d4ed8', 700, 11) + tgc(262, 202, 'เกลียวคู่ 2 สาย', '#374151', 600, 9) +
      tgc(180, 222, 'ยีน = ช่วงของ DNA ที่กำหนดลักษณะ · DNA อยู่บนโครโมโซม', '#111827', 700, 9.5) + tgc(180, 234, 'โครโมโซมอยู่ในนิวเคลียส', '#111827', 700, 9.5));
  })();

  /* 2) ตารางพันเนตต์ */
  (function () {
    const sq = (ox, title, top, left, cells, note1, note2) => {
      let b = tgc(ox + 54, 14, title, '#111827', 700, 11);
      top.forEach((a, i) => { b += tgc(ox + 42 + i * 40, 36, a, '#1d4ed8', 700, 12); });
      left.forEach((a, j) => { b += tgc(ox + 14, 72 + j * 40, a, '#b91c1c', 700, 12); });
      cells.forEach((c, k) => {
        const i = k % 2, j = Math.floor(k / 2);
        const dom = /[A-Z]/.test(c[0]);
        b += R(ox + 24 + i * 40, 42 + j * 40, 40, 40, dom ? '#bbf7d0' : '#fecaca') + tgc(ox + 44 + i * 40, 67 + j * 40, c, '#111827', 700, 12);
      });
      return b + tgc(ox + 54, 140, note1, '#111827', 700, 9.5) + tgc(ox + 54, 153, note2, '#374151', 600, 9);
    };
    F['m3-punnett'] = svg(204,
      'ตารางพันเนตต์ของการผสมพันธุ์ PP คูณ pp รุ่นลูกเป็น Pp ทั้งหมด Aa คูณ Aa ได้ AA Aa Aa aa และ Aa คูณ aa ได้ Aa กับ aa อย่างละครึ่ง',
      sq(0, 'PP × pp', ['p', 'p'], ['P', 'P'], ['Pp', 'Pp', 'Pp', 'Pp'], 'ลูกทุกตัว Pp', 'ลักษณะเด่น 100%') +
      sq(120, 'Aa × Aa', ['A', 'a'], ['A', 'a'], ['AA', 'Aa', 'Aa', 'aa'], 'จีโนไทป์ 1 : 2 : 1', 'ฟีโนไทป์ 3 : 1 (เด่น:ด้อย)') +
      sq(240, 'Aa × aa', ['a', 'a'], ['A', 'a'], ['Aa', 'Aa', 'aa', 'aa'], 'จีโนไทป์ 1 : 1', 'ฟีโนไทป์ 1 : 1 (เด่น:ด้อย)') +
      tgc(180, 178, 'พันธุ์แท้ = ยีนเหมือนกันทั้งคู่ (PP หรือ pp) · พันธุ์ทาง = ยีนต่างกัน (Aa)', '#111827', 700, 9.5) +
      tgc(180, 194, 'ตัวอักษรใหญ่ = แอลลีลเด่น · เขียว = แสดงลักษณะเด่น · แดง = ลักษณะด้อย', '#374151', 600, 9));
  })();

  /* 3) พันธุประวัติ โรคด้อยบนออโตโซม */
  (function () {
    const sym = (cx, cy, male, filled, half) => (male ? R(cx - 14, cy - 14, 28, 28, filled ? '#111827' : '#fff') : O(cx, cy, 14, filled ? '#111827' : '#fff', 'currentColor')) +
      (half ? `<circle cx="${cx}" cy="${cy}" r="5" fill="#111827"/>` : '');
    F['m3-pedigree'] = svg(262,
      'พันธุประวัติ พ่อแม่ไม่เป็นโรคแต่ลูกเป็นโรค แสดงว่าโรคเกิดจากยีนด้อยบนออโตโซมและพ่อแม่เป็นพาหะ Aa',
      L(94, 48, 166, 48, 'currentColor', 2) + L(130, 48, 130, 118, 'currentColor', 2) + L(70, 118, 190, 118, 'currentColor', 2) + L(70, 118, 70, 134, 'currentColor', 2) + L(130, 118, 130, 134, 'currentColor', 2) + L(190, 118, 190, 134, 'currentColor', 2) +
      sym(80, 48, true, false) + sym(180, 48, false, false) + sym(70, 150, true, true) + sym(130, 150, false, false) + sym(190, 150, true, false) +
      tg(26, 36, 'I', '#374151', 700, 11) + tg(26, 156, 'II', '#374151', 700, 11) +
      tgc(80, 76, 'Aa', '#1d4ed8', 700, 11) + tgc(180, 76, 'Aa', '#1d4ed8', 700, 11) +
      tgc(70, 184, 'aa', '#b91c1c', 700, 11) + tgc(130, 184, 'AA หรือ Aa', '#374151', 700, 9.5) + tgc(190, 184, 'AA หรือ Aa', '#374151', 700, 9.5) +
      R(224, 30, 14, 14, '#fff') + tg(244, 42, 'ชาย', '#111827', 600, 10) + O(231, 62, 7, '#fff', 'currentColor') + tg(244, 66, 'หญิง', '#111827', 600, 10) + R(224, 78, 14, 14, '#111827') + tg(244, 90, 'เป็นโรค', '#111827', 600, 10) + R(224, 98, 14, 14, '#fff') + tg(244, 110, 'ไม่เป็นโรค', '#111827', 600, 10) +
      tgc(180, 212, 'พ่อแม่ไม่เป็นโรค แต่ลูกเป็นโรค → โรคเกิดจากยีน ด้อย', '#111827', 700, 10) +
      tgc(180, 228, 'ลูกเป็นโรค aa ได้ a จากพ่อและจากแม่ → พ่อแม่เป็นพาหะ Aa', '#111827', 700, 10) +
      tgc(180, 244, 'Aa × Aa → ลูกเป็นโรค 1 ใน 4 (25%) · เป็นพาหะ 50% · ปกติ 25%', '#b91c1c', 700, 10));
  })();

  /* 4) ไมโทซิส เทียบ ไมโอซิส */
  (function () {
    const cell = (cx, cy, r, bars) => O(cx, cy, r, '#f8fafc', 'currentColor') + bars.map(([dx, dy, h, col]) => R(cx + dx - 2.5, cy + dy - h / 2, 5, h, col, 'none')).join('');
    const A = '#7e22ce', B = '#c2410c';
    const full = (cx, cy, r) => cell(cx, cy, r, [[-9, -2, 20, A], [-3, -2, 20, A], [3, 4, 12, B], [9, 4, 12, B]]);
    const half = (cx, cy, r, ra) => cell(cx, cy, r, [[-4, -2, 20, A], [4, 4, 12, B]]);
    F['m3-mito-meio'] = svg(284,
      'ไมโทซิสให้ 2 เซลล์ที่มีโครโมโซมเท่าเดิม ใช้กับเซลล์ร่างกาย ไมโอซิสให้ 4 เซลล์ที่มีโครโมโซมครึ่งหนึ่ง ใช้สร้างเซลล์สืบพันธุ์',
      tgc(90, 16, 'ไมโทซิส (เซลล์ร่างกาย)', '#111827', 700, 11.5) + tgc(270, 16, 'ไมโอซิส (เซลล์สืบพันธุ์)', '#111827', 700, 11.5) +
      L(180, 24, 180, 232, '#cbd5e1', 1.2, 'stroke-dasharray="4 4"') +
      full(90, 52, 24) + tgc(90, 90, '2n = 4', '#374151', 700, 10) + arrow('M90 96V118', GRY) +
      full(56, 148, 22) + full(124, 148, 22) + tgc(90, 190, '2 เซลล์ ได้ 2n = 4', '#111827', 700, 10) + tgc(90, 204, '(เท่าเซลล์เดิม)', '#374151', 600, 9.5) + tgc(90, 218, 'แต่ละแท่ง 1 โครมาทิด', '#374151', 600, 9) +
      full(270, 52, 24) + tgc(270, 90, '2n = 4', '#374151', 700, 10) + arrow('M270 96V118', GRY) +
      half(210, 148, 18) + half(250, 148, 18) + half(290, 148, 18) + half(330, 148, 18) + tgc(270, 190, '4 เซลล์ ได้ n = 2', '#111827', 700, 10) + tgc(270, 204, '(ครึ่งหนึ่ง ได้จากแต่ละคู่ 1 แท่ง)', '#374151', 600, 9.5) +
      tgc(180, 250, 'ไมโทซิส: ซ่อมแซม เจริญเติบโต · ไมโอซิส: สร้างอสุจิ/ไข่', '#111827', 700, 9.5) +
      tgc(180, 266, 'ปฏิสนธิ n + n → 2n คืนจำนวนโครโมโซมของสปีชีส์', '#374151', 600, 9.5) + tgc(180, 280, '', '#111827'));
  })();

  /* 5) กลุ่มอาการดาวน์ */
  (function () {
    const rod = (x, y, col) => `<rect x="${x - 3}" y="${y - 16}" width="6" height="32" rx="3" fill="${col}"/>`;
    const gx = a => 50 + (a - 20) * 9, gy = v => 232 - v * 0.9;
    const pts = [[20, 8], [25, 10], [30, 13], [35, 22], [40, 50], [45, 100]].map(p => `${gx(p[0])},${gy(p[1])}`).join(' ');
    F['m3-downs'] = svg(284,
      'กลุ่มอาการดาวน์เกิดจากโครโมโซมคู่ที่ 21 เกินมาหนึ่งแท่งเป็นสามแท่ง รวม 47 แท่ง โอกาสเกิดสูงขึ้นเมื่อมารดาอายุมาก',
      tgc(90, 14, 'คนปกติ: 46 แท่ง', '#111827', 700, 11) + tgc(270, 14, 'กลุ่มอาการดาวน์: 47 แท่ง', '#b91c1c', 700, 11) +
      R(30, 22, 120, 62, '#f8fafc') + R(210, 22, 120, 62, '#fef2f2') +
      rod(70, 54, '#7e22ce') + rod(84, 54, '#7e22ce') + tgc(77, 100, 'คู่ที่ 21 = 2 แท่ง', '#374151', 700, 9.5) + rod(116, 54, GRY) + rod(128, 54, GRY) +
      rod(236, 54, '#7e22ce') + rod(250, 54, '#7e22ce') + rod(264, 54, '#b91c1c') + tgc(250, 100, 'คู่ที่ 21 = 3 แท่ง', '#b91c1c', 700, 9.5) + rod(298, 54, GRY) + rod(310, 54, GRY) +
      tgc(180, 112, '(ภาพแสดงเฉพาะบางคู่)', '#64748b', 600, 8.5) + tg(34, 128, 'ลักษณะ: ตาชี้ขึ้น ดั้งจมูกแบน นิ้วสั้นป้อม พัฒนาการทางสมองช้า', '#111827', 700, 9.5) +
      L(50, 232, 340, 232, 'currentColor', 2) + L(50, 232, 50, 134, 'currentColor', 2) + `<polyline points="${pts}" fill="none" stroke="#b91c1c" stroke-width="3"/>` +
      [20, 30, 40, 50].map(a => tgc(gx(a), 246, String(a), '#374151', 600, 9.5)).join('') + tgc(210, 262, 'อายุของมารดา (ปี)', '#374151', 700, 10) +
      `<text transform="translate(16 186) rotate(-90)" text-anchor="middle" font-size="9.5" font-weight="700">โอกาสเกิด (เพิ่มขึ้น)</text>` +
      tg(62, 162, 'อายุมารดามากขึ้น', '#b91c1c', 700, 10) + tg(62, 175, 'โอกาสสูงขึ้น', '#b91c1c', 700, 10) + tg(62, 190, '(แสดงแนวโน้ม ไม่ใช่ค่าจริง)', '#374151', 600, 9));
  })();

  /* 6) สิ่งมีชีวิตดัดแปรพันธุกรรม */
  F['m3-gmo'] = svg(216,
    'ขั้นตอนพันธุวิศวกรรม ตัดยีนที่ต้องการจากสิ่งมีชีวิตหนึ่ง ใส่ในพาหะ แล้วนำเข้าสู่เซลล์ของสิ่งมีชีวิตอีกชนิด ได้สิ่งมีชีวิตดัดแปรพันธุกรรม',
    [['① ตัดยีน', 'ที่ต้องการ', '#fde68a'], ['② ใส่ยีนใน', 'พาหะ', '#bfdbfe'], ['③ นำเข้าสู่', 'เซลล์ใหม่', '#bbf7d0'], ['④ ได้ GMO', 'แสดงลักษณะใหม่', '#fecaca']].map((s, i) => {
      const x = 8 + i * 88;
      return R(x, 40, 76, 64, s[2]) + tgc(x + 38, 66, s[0], '#111827', 700, 10.5) + tgc(x + 38, 82, s[1], '#111827', 700, 9.5) + (i < 3 ? arrow(`M${x + 78} 72H${x + 88}`, GRY) : '');
    }).join('') +
    tgc(180, 24, 'พันธุวิศวกรรม = ตัดต่อสารพันธุกรรม (ยีน) ข้ามสิ่งมีชีวิต', '#111827', 700, 11) +
    tgc(46, 120, 'เอนไซม์ตัด', '#374151', 600, 9) + tgc(134, 120, 'พลาสมิด/ไวรัส', '#374151', 600, 9) + tgc(222, 120, 'แบคทีเรีย พืช สัตว์', '#374151', 600, 9) + tgc(310, 120, 'ถ่ายทอดสู่รุ่นลูก', '#374151', 600, 9) +
    tgc(180, 150, 'ประโยชน์: แบคทีเรียผลิตอินซูลิน · พืชต้านแมลง · ข้าวมีวิตามินเอ', '#111827', 700, 9) +
    tgc(180, 168, 'ข้อกังวล: สารก่อภูมิแพ้ ผลต่อความหลากหลายทางชีวภาพ แมลง/วัชพืชดื้อสาร', '#b91c1c', 700, 9) +
    tgc(180, 190, 'ผลที่เกิดต้อง "มีข้อมูลสนับสนุน" จึงจะเผยแพร่ได้', '#374151', 600, 9.5) + tgc(180, 206, '', '#111827'));

  /* 7) เปรียบเทียบความหลากหลาย */
  F['m3-biodiv-compare'] = svg(222,
    'ความหลากหลายของชนิดดูจากจำนวนชนิดที่พบ ไม่ใช่จำนวนตัว ความหลากหลายของระบบนิเวศดูจากจำนวนแบบระบบนิเวศ',
    R(6, 22, 168, 98, '#f8fafc') + R(186, 22, 168, 98, '#f8fafc') +
    tgc(90, 16, 'บริเวณ M', '#111827', 700, 11.5) + tgc(270, 16, 'บริเวณ N', '#111827', 700, 11.5) +
    R(14, 30, 48, 36, '#bae6fd') + tgc(38, 52, 'ทะเลสาบ', '#111827', 600, 9) + R(66, 30, 48, 36, '#bbf7d0') + tgc(90, 52, 'ทุ่งหญ้า', '#111827', 600, 9) + R(118, 30, 48, 36, '#86efac') + tgc(142, 52, 'ป่าละเมาะ', '#111827', 600, 9) +
    R(194, 30, 152, 36, '#4ade80') + tgc(270, 52, 'ป่าดิบชื้น (ระบบเดียว)', '#111827', 600, 9.5) +
    tgc(90, 88, '3 ระบบนิเวศ', '#1d4ed8', 700, 10.5) + tgc(90, 104, '40 ชนิด · 600 ตัว', '#111827', 700, 10) +
    tgc(270, 88, '1 ระบบนิเวศ', '#1d4ed8', 700, 10.5) + tgc(270, 104, '90 ชนิด · 250 ตัว', '#111827', 700, 10) +
    tgc(180, 144, 'ความหลากหลายของระบบนิเวศ: M > N (3 > 1)', '#1d4ed8', 700, 10) +
    tgc(180, 162, 'ความหลากหลายของชนิดสิ่งมีชีวิต: N > M (90 > 40)', '#15803d', 700, 10) +
    tgc(180, 182, 'ดู "จำนวนชนิด" ไม่ใช่ "จำนวนตัว" (600 ตัว มากกว่า แต่ชนิดน้อยกว่า)', '#b91c1c', 700, 9.5) +
    tgc(180, 202, 'ความหลากหลายมี 3 ระดับ: พันธุกรรม · ชนิด · ระบบนิเวศ', '#374151', 700, 9.5));

  /* 8) สายใยอาหารในนาข้าว */
  (function () {
    const nd = (x, y, name, col) => R(x - 34, y - 12, 68, 24, col) + tgc(x, y + 4, name, '#111827', 700, 10.5);
    const ar = (x1, y1, x2, y2) => line(x1, y1, x2, y2, GRN, 2.2, true);
    F['m3-foodweb'] = svg(252,
      'สายใยอาหารในนา ข้าวถูกกินโดยหนูและตั๊กแตน หนูถูกกินโดยงู ตั๊กแตนถูกกินโดยกบ งูและกบถูกกินโดยเหยี่ยว ลูกศรชี้ไปยังผู้กิน',
      ar(112, 202, 80, 168) + ar(130, 202, 228, 168) + ar(76, 140, 140, 106) + ar(250, 140, 290, 106) + ar(266, 92, 190, 92) + ar(160, 80, 172, 44) + ar(290, 80, 206, 42) +
      nd(120, 214, 'ข้าว', '#bbf7d0') + nd(70, 152, 'หนูนา', '#fde68a') + nd(240, 152, 'ตั๊กแตน', '#fde68a') + nd(300, 92, 'กบ', '#fed7aa') + nd(150, 92, 'งู', '#fed7aa') + nd(180, 30, 'เหยี่ยว', '#fecaca') +
      tgc(180, 244, 'ลูกศรชี้ไปที่ผู้กิน · จับหนูนาออกบางส่วน ชนิดยังครบ ความหลากหลายของชนิดเท่าเดิม', '#111827', 700, 9));
  })();
  /* ===== ว 4.2 แนวคิดเชิงคำนวณ อัลกอริทึม โปรแกรม ข้อมูลและสารสนเทศ ===== */
  const MONO = 'font-family="Consolas,Menlo,monospace"';

  /* 1) แนวคิดเชิงคำนวณ 4 ด้าน */
  (function () {
    const bx = (x, y, col, t1, t2, t3) => R(x, y, 172, 92, col) + tgc(x + 86, y + 20, t1, '#111827', 700, 11.5) + tgc(x + 86, y + 40, t2, '#374151', 600, 9.5) + tgc(x + 86, y + 56, t3, '#1d4ed8', 600, 9);
    F['m3-ct-four'] = svg(222,
      'แนวคิดเชิงคำนวณ 4 ด้าน การแยกส่วนประกอบ การพิจารณารูปแบบ การคิดเชิงนามธรรม และการออกแบบอัลกอริทึม',
      bx(4, 8, '#dbeafe', 'แยกส่วนประกอบ', 'แบ่งปัญหาใหญ่', 'เป็นปัญหาย่อย') + bx(184, 8, '#dcfce7', 'พิจารณารูปแบบ', 'มองหาสิ่งที่เหมือนกัน/ซ้ำกัน', 'เพื่อจัดกลุ่ม') +
      bx(4, 108, '#fef9c3', 'คิดเชิงนามธรรม', 'ตัดรายละเอียดที่ไม่จำเป็น', 'เหลือสาระสำคัญ') + bx(184, 108, '#fee2e2', 'ออกแบบอัลกอริทึม', 'เขียนขั้นตอนแก้ปัญหา', 'ทีละข้ออย่างเป็นระบบ') +
      tgc(180, 216, 'จัดเสื้อเป็นกลุ่มตามประเภทก่อน แล้วเรียงตามสี = แยกส่วน + จัดกลุ่มตามรูปแบบ', '#111827', 700, 9));
  })();

  /* 2) ผังงาน (Flowchart) */
  F['m3-flowchart'] = svg(318,
    'ผังงานของอัลกอริทึมหาผลบวก 1 ถึง n เริ่มต้น รับค่า n ตั้งค่า s เป็น 0 และ i เป็น 1 ถ้า i น้อยกว่าหรือเท่ากับ n ให้บวก i เข้า s เพิ่ม i ทีละ 1 แล้ววนซ้ำ ถ้าไม่ใช่แสดงค่า s',
    `<rect x="130" y="6" width="80" height="26" rx="13" fill="#bbf7d0" stroke="currentColor" stroke-width="2"/>` + tgc(170, 24, 'เริ่มต้น', '#111827', 700, 10.5) +
    arrow('M170 32V48', GRY) + `<polygon points="120,48 220,48 210,76 110,76" fill="#e0f2fe" stroke="currentColor" stroke-width="2"/>` + tgc(165, 66, 'รับค่า n', '#111827', 700, 10.5) +
    arrow('M165 76V92', GRY) + R(105, 92, 120, 28, '#fef9c3') + tgc(165, 110, 's ← 0 · i ← 1', '#111827', 700, 10.5) +
    arrow('M165 120V138', GRY) + `<polygon points="165,138 235,172 165,206 95,172" fill="#fde68a" stroke="currentColor" stroke-width="2"/>` + tgc(165, 176, 'i ≤ n ?', '#111827', 700, 11) +
    arrow('M165 206V232', GRY) + tgc(176, 222, 'ไม่ใช่', '#b91c1c', 700, 9.5) +
    `<polygon points="115,232 225,232 215,260 105,260" fill="#e0f2fe" stroke="currentColor" stroke-width="2"/>` + tgc(165, 250, 'แสดงค่า s', '#111827', 700, 10.5) + arrow('M165 260V274', GRY) +
    `<rect x="125" y="274" width="80" height="26" rx="13" fill="#fecaca" stroke="currentColor" stroke-width="2"/>` + tgc(165, 292, 'จบ', '#111827', 700, 10.5) +
    arrow('M235 172H270', GRY) + tgc(252, 164, 'ใช่', '#15803d', 700, 9.5) + R(270, 126, 84, 28, '#fef9c3') + tgc(312, 144, 's ← s + i', '#111827', 700, 10.5) +
    arrow('M312 154V170', GRY) + R(270, 170, 84, 28, '#fef9c3') + tgc(312, 188, 'i ← i + 1', '#111827', 700, 10.5) +
    `<path d="M312 198V212H60V172H93" fill="none" stroke="${GRY}" stroke-width="2.2" marker-end="url(#ahG)"/>` + tgc(312, 226, 'วนซ้ำ (กลับไปตรวจ)', '#374151', 700, 8.5) +
    tg(8, 30, 'วงรี = เริ่ม/จบ', '#374151', 600, 8.5) + tg(8, 42, 'สี่เหลี่ยมด้านขนาน', '#374151', 600, 8.5) + tg(8, 54, '= รับ/แสดงค่า', '#374151', 600, 8.5) + tg(8, 70, 'สี่เหลี่ยม = คำนวณ', '#374151', 600, 8.5) + tg(8, 82, 'ข้าวหลามตัด = ตัดสินใจ', '#374151', 600, 8.5));

  /* 3) กราฟเส้นทางและเส้นทางที่สั้นที่สุด */
  (function () {
    const N = { H: [30, 120], A: [100, 46], B: [100, 196], C: [200, 120], D: [262, 200], W: [330, 120] };
    const E = [['H', 'A', 4], ['H', 'B', 7], ['A', 'B', 2], ['A', 'C', 5], ['B', 'C', 3], ['B', 'D', 7], ['C', 'D', 1], ['C', 'W', 6], ['D', 'W', 2]];
    const best = new Set(['H-A', 'A-B', 'B-C', 'C-D', 'D-W']);
    let b = '';
    E.forEach(([u, v, w]) => {
      const [x1, y1] = N[u], [x2, y2] = N[v], on = best.has(u + '-' + v);
      b += L(x1, y1, x2, y2, on ? '#b91c1c' : '#94a3b8', on ? 4 : 2) + `<rect x="${(x1 + x2) / 2 - 9}" y="${(y1 + y2) / 2 - 9}" width="18" height="16" rx="4" fill="#fff" stroke="none"/>` + tgc((x1 + x2) / 2, (y1 + y2) / 2 + 4, String(w), on ? '#b91c1c' : '#374151', 700, 11);
    });
    Object.entries(N).forEach(([k, [x, y]]) => { b += O(x, y, 15, k === 'H' ? '#bbf7d0' : k === 'W' ? '#fecaca' : '#e0f2fe', 'currentColor') + tgc(x, y + 4, k, '#111827', 700, 11); });
    F['m3-shortest-path'] = svg(250,
      'กราฟเส้นทางจาก H ไป W ตัวเลขบนเส้นคือเวลา เส้นทางที่รวมเวลาน้อยที่สุดคือ H A B C D W รวม 12 นาที',
      b + tgc(180, 14, 'แผนที่: ตัวเลขบนเส้น = เวลา (นาที)', '#111827', 700, 10.5) +
      tgc(180, 238, 'สั้นที่สุด: H→A→B→C→D→W = 4 + 2 + 3 + 1 + 2 = 12 นาที', '#b91c1c', 700, 10));
  })();

  /* 4) การสลับทีละคู่ (bubble sort) */
  (function () {
    const rows = [['เริ่ม', [45, 30, 50, 20, 40], []], ['รอบ 1 (3 ครั้ง)', [30, 45, 20, 40, 50], [0, 2, 3]], ['รอบ 2 (2 ครั้ง)', [30, 20, 40, 45, 50], [1, 2]], ['รอบ 3 (1 ครั้ง)', [20, 30, 40, 45, 50], [0]]];
    let b = '';
    rows.forEach((r, j) => {
      const y = 12 + j * 52;
      b += tg(8, y + 24, r[0], '#111827', 700, 10);
      r[1].forEach((v, i) => { b += R(120 + i * 46, y, 40, 34, r[2].includes(i) ? '#fde68a' : '#f1f5f9') + tgc(140 + i * 46, y + 22, String(v), '#111827', 700, 12); });
    });
    F['m3-bubble'] = svg(238,
      'การสลับตำแหน่งเพื่อนบ้านทีละคู่ ลำดับ 45 30 50 20 40 ใช้การสลับรวม 6 ครั้ง เท่ากับจำนวนคู่ที่เรียงผิดลำดับ',
      b + tgc(180, 224, 'จำนวนครั้งที่สลับ = จำนวนคู่ที่เรียงผิดลำดับ = 3 + 2 + 1 = 6', '#b91c1c', 700, 10.5) + tg(8, 206, 'เหลือง = ตัวที่ขยับไปทางซ้าย', '#92400e', 700, 9));
  })();

  /* 5) กราฟเส้นอ่านข้อมูล */
  (function () {
    const gx = y => 40 + (y - 2008) * 21.4, gy = v => 200 - v * 1.5;
    const series = [['X', '#1d4ed8', 2008, [4, 18, 40, 70, 90, 100]], ['Y', '#b91c1c', 2013, [4, 20, 50, 80, 95]], ['Z', '#15803d', 2018, [6, 24, 52]]];
    let b = L(40, 200, 346, 200, 'currentColor', 2) + L(40, 200, 40, 30, 'currentColor', 2);
    for (let y = 2008; y <= 2022; y += 2) b += L(gx(y), 200, gx(y), 205, 'currentColor', 1.5) + tgc(gx(y), 218, String(y), '#374151', 600, 9);
    series.forEach(([n, c, s, vals]) => {
      const pts = vals.map((v, i) => `${gx(s + i * (n === 'X' ? 2.8 : n === 'Y' ? 2.25 : 2))},${gy(v)}`).join(' ');
      b += `<polyline points="${pts}" fill="none" stroke="${c}" stroke-width="3"/>` + tg(52, n === 'X' ? 40 : n === 'Y' ? 54 : 68, n + ' เริ่มปี ' + s, c, 700, 10);
    });
    b += L(gx(2016), 200, gx(2016), 36, '#a16207', 1.8, 'stroke-dasharray="5 4"') + tg(gx(2016) + 4, 44, 'ก่อนปี 2016 = เกิน 6 ปี (ถึง 2022)', '#a16207', 700, 9);
    F['m3-line-chart'] = svg(236,
      'กราฟจำนวนผู้ใช้ของแพลตฟอร์ม X Y Z ตั้งแต่ปีที่เริ่มมีข้อมูล เลือกแพลตฟอร์มที่เริ่มก่อนปี 2016 จึงอยู่ในตลาดเกิน 6 ปีเมื่อถึงปี 2022',
      b + `<text transform="translate(12 120) rotate(-90)" text-anchor="middle" font-size="9.5" font-weight="700">จำนวนผู้ใช้ (สมมติ)</text>` + tg(40, 18, 'ดูว่าเส้นเริ่มปีใด แล้วนับถึงปีสิ้นสุดของข้อมูล', '#111827', 700, 9.5));
  })();

  /* 6) เครื่องมือรวบรวม ประมวลผล นำเสนอ */
  (function () {
    const st = (x, col, t1, t2, t3) => R(x, 28, 108, 78, col) + tgc(x + 54, 50, t1, '#111827', 700, 11) + tgc(x + 54, 70, t2, '#1d4ed8', 700, 10) + tgc(x + 54, 88, t3, '#374151', 600, 9);
    F['m3-data-pipeline'] = svg(236,
      'ขั้นตอนการทำงานกับข้อมูล รวบรวมด้วยแบบฟอร์มออนไลน์ ประมวลผลด้วยสเปรดชีต นำเสนอด้วยโปรแกรมนำเสนอ แล้วเผยแพร่ด้วยสื่อออนไลน์',
      st(4, '#dbeafe', '① รวบรวมข้อมูล', 'แบบฟอร์มออนไลน์', '(Google Form)') + arrow('M114 67H128', GRY) + st(126, '#dcfce7', '② ประมวลผล', 'สเปรดชีต', '(Google Sheets)') + arrow('M236 67H250', GRY) + st(248, '#fef9c3', '③ นำเสนอ', 'โปรแกรมนำเสนอ', '(Google Slides)') +
      tgc(180, 16, 'เลือกเครื่องมือให้ตรงกับงาน', '#111827', 700, 10.5) +
      R(4, 124, 352, 62, '#f8fafc') + tg(12, 142, 'เผยแพร่สู่คนทั่วไปได้กว้าง:', '#15803d', 700, 10) + tg(12, 158, 'YouTube · Facebook · TikTok · บล็อก (ผ่านอินเทอร์เน็ต)', '#111827', 700, 10) + tg(12, 176, 'ไม่กว้าง: โปสเตอร์ · Google Form เก็บข้อมูล ไม่ใช่ช่องทางเผยแพร่', '#b91c1c', 700, 9) +
      tgc(180, 212, 'ข้อมูลปฐมภูมิ = ข้อมูลที่ผู้ศึกษารวบรวมเองโดยตรง (สำรวจ ทดลอง สัมภาษณ์)', '#111827', 700, 9) + tgc(180, 228, '', ''));
  })();

  /* 7) ลำดับการค้นหา (การ์ดชี้กัน) */
  (function () {
    const c = (x, y, name, col = '#fef9c3') => R(x - 38, y - 16, 76, 32, col) + tgc(x, y + 4, name, '#111827', 700, 11);
    F['m3-dependency'] = svg(214,
      'การ์ดสูตรลับ ลูกศรชี้ไปยังส่วนผสมถัดไปที่ต้องหา การ์ดที่ไม่มีลูกศรชี้เข้าหาคือจุดเริ่มต้น ได้แก่ เนย จากนั้นไปไข่ นม แป้ง โกโก้ และน้ำตาล',
      arrow('M110 52H148', GRN) + arrow('M222 52H254', GRN) + arrow('M70 68V142', GRN) + arrow('M110 160H148', GRN) + arrow('M222 160H254', GRN) +
      c(70, 50, 'เนย', '#bbf7d0') + c(185, 50, 'ไข่') + c(300, 50, 'นม') + c(70, 160, 'แป้ง') + c(185, 160, 'โกโก้') + c(300, 160, 'น้ำตาล', '#fecaca') +
      tgc(180, 14, 'ลูกศร = "ไปค้นหาส่วนผสมนี้ต่อ"', '#111827', 700, 10) +
      tgc(180, 196, 'ไม่มีลูกศรชี้เข้า → ต้องเริ่มค้นหาที่การ์ดนั้นก่อน (เนย)', '#b91c1c', 700, 9));
  })();

  /* 8) ตรวจสอบโปรแกรม (trace) */
  (function () {
    const code = ['i = 1', 'while i < 8:', '    if i % 3 == 0:', '        print("True")', '    i = i + 1'];
    let b = R(6, 16, 190, 112, '#1e293b', 'none') + code.map((s, i) => T(14, 38 + i * 20, s.replace(/ /g, '&#160;'), `fill="#e2e8f0" font-size="12" ${MONO}`)).join('');
    b += tgc(100, 12, 'โปรแกรม', '#111827', 700, 10.5) + tgc(274, 12, 'ตรวจทีละรอบ (trace)', '#111827', 700, 10.5);
    const rows = [[1, 'ไม่'], [2, 'ไม่'], [3, 'ใช่ → True'], [4, 'ไม่'], [5, 'ไม่'], [6, 'ใช่ → True'], [7, 'ไม่']];
    b += R(206, 18, 148, 22, '#e2e8f0') + tgc(228, 33, 'i', '#111827', 700, 10.5) + tgc(300, 33, 'i % 3 == 0 ?', '#111827', 700, 10.5);
    rows.forEach((r, k) => { const y = 40 + k * 17; b += R(206, y, 148, 17, r[1] === 'ไม่' ? '#f8fafc' : '#bbf7d0', '#94a3b8') + tgc(228, y + 13, String(r[0]), '#111827', 700, 10) + tgc(300, y + 13, r[1], '#111827', 600, 9.5); });
    b += tgc(180, 180, 'วนซ้ำเมื่อ i < 8 → i = 1 ถึง 7 (ไม่ถึง 8) · พิมพ์ True เมื่อ i หาร 3 ลงตัว', '#111827', 700, 9.5) +
      tgc(180, 198, 'i = 3 และ 6 → พิมพ์ True ทั้งหมด 2 ครั้ง', '#b91c1c', 700, 10.5) + tgc(180, 216, '% = เศษจากการหาร · == = เท่ากับ', '#374151', 600, 9.5);
    F['m3-loop-trace'] = svg(228, 'โปรแกรมวนซ้ำ ตรวจทีละรอบ ได้ว่าพิมพ์ True เมื่อ i เท่ากับ 3 และ 6 รวม 2 ครั้ง', b);
  })();

  /* ===== ว 3.1 แรงโน้มถ่วง ฤดู การเคลื่อนที่ของดวงอาทิตย์ ข้างขึ้นข้างแรม น้ำขึ้นน้ำลง ===== */
  const SUNY = '#fde68a';

  /* 1) กฎแรงโน้มถ่วง */
  (function () {
    const bars = [[1, 100, '1'], [2, 25, '1/4'], [3, 11, '1/9']];
    let b = tgc(86, 14, 'แรงดึงดูดระหว่างมวล 2 ก้อน', '#111827', 700, 10.5) + tgc(270, 14, 'F กับระยะ r', '#111827', 700, 10.5);
    b += O(36, 88, 24, '#93c5fd', 'currentColor') + tgc(36, 92, 'm₁', '#111827', 700, 11) + O(138, 88, 15, '#fca5a5', 'currentColor') + tgc(138, 92, 'm₂', '#111827', 700, 11);
    b += arrow('M62 88H80', RED) + arrow('M120 88H102', RED) + L(36, 130, 138, 130, 'currentColor', 1.5) + tgc(86, 146, 'ระยะห่าง r (ศูนย์กลาง)', '#374151', 700, 9.5);
    b += tgc(86, 66, 'F  ดึงกันและกัน เท่ากัน', '#b91c1c', 700, 9.5);
    b += L(206, 170, 346, 170, 'currentColor', 2) + L(206, 170, 206, 30, 'currentColor', 2);
    bars.forEach(([r, h, lab], i) => { const x = 224 + i * 44; b += R(x, 170 - h, 32, h, '#93c5fd') + tgc(x + 16, 186, 'r = ' + r, '#374151', 700, 9.5) + tgc(x + 16, 170 - h - 6, 'F = ' + lab, '#b91c1c', 700, 9.5); });
    b += tgc(86, 178, 'F ∝ m₁ × m₂', '#111827', 700, 11) + tgc(86, 194, 'F ∝ 1/r²  (r มาก → F น้อยลงเร็ว)', '#111827', 700, 10) + tgc(86, 214, 'ระยะเป็น 2 เท่า → แรงเหลือ 1/4', '#b91c1c', 700, 9.5) + tgc(86, 228, 'มวลเป็น 2 เท่า → แรงเป็น 2 เท่า', '#1d4ed8', 700, 9.5);
    F['m3-gravity-law'] = svg(240, 'แรงโน้มถ่วงแปรผันตรงกับผลคูณของมวลและแปรผกผันกับระยะห่างกำลังสอง', b);
  })();

  /* 2) โลกโคจรรอบดวงอาทิตย์และฤดู */
  (function () {
    const earth = (cx, cy, date, note, col) => {
      const sx = 22 * Math.sin(23.5 * Math.PI / 180), sy = 22 * Math.cos(23.5 * Math.PI / 180);
      return L(cx - sx, cy + sy, cx + sx, cy - sy, '#111827', 2) + O(cx, cy, 14, '#93c5fd', 'currentColor') + tgc(cx + sx + 6, cy - sy - 2, 'N', '#b91c1c', 700, 9.5) +
        date.map((s, i) => tgc(cx + (col === 'L' ? 0 : 0), cy + 34 + i * 12, s, '#111827', i ? 600 : 700, i ? 8.5 : 9.5)).join('');
    };
    F['m3-season-orbit'] = svg(304,
      'โลกโคจรรอบดวงอาทิตย์โดยแกนเอียง 23.5 องศาทิศเดิม ครีษมายันซีกเหนือเอียงเข้าหาดวงอาทิตย์ เหมายันเอียงออก วสันตวิษุวัตและศารทวิษุวัตแกนตั้งฉากกับแสง',
      `<circle cx="180" cy="136" r="104" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="5 4"/>` + O(180, 136, 22, SUNY, '#ca8a04') + tgc(180, 140, 'อาทิตย์', '#92400e', 700, 9) +
      earth(180, 32, ['21–22 มี.ค.', 'วสันตวิษุวัต'], '', 'T') + earth(76, 136, ['21–22 มิ.ย.', 'ครีษมายัน'], '', 'L') + earth(180, 240, ['22–23 ก.ย.', 'ศารทวิษุวัต'], '', 'B') + earth(284, 136, ['21–22 ธ.ค.', 'เหมายัน'], '', 'R') +
      `<path d="M240 70A112 112 0 0 0 214 54" fill="none" stroke="${GRY}" stroke-width="2" marker-end="url(#ahG)"/>` +
      tgc(60, 84, 'ซีกเหนือเอียงเข้าหา', '#b91c1c', 700, 8.5) + tgc(60, 96, 'อาทิตย์: ร้อน', '#b91c1c', 700, 8.5) + tgc(304, 84, 'ซีกเหนือเอียงออก', '#1d4ed8', 700, 8.5) + tgc(304, 96, 'ห่างอาทิตย์: หนาว', '#1d4ed8', 700, 8.5) +
      tgc(180, 298, 'มี.ค. และ ก.ย.: แสงตั้งฉากที่เส้นศูนย์สูตร กลางวัน = กลางคืน', '#111827', 700, 8.5));
  })();

  /* 3) เส้นทางการขึ้น-ตกของดวงอาทิตย์ (มองจากข้างบน) */
  (function () {
    const cx = 130, cy = 130, r = 100, ang = d => [cx + r * Math.sin(d * Math.PI / 180), cy - r * Math.cos(d * Math.PI / 180)];
    const path = (rise, set, ctrlY, col, name) => { const [x1, y1] = ang(rise), [x2, y2] = ang(set); return `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)}Q${cx} ${ctrlY} ${x2.toFixed(1)} ${y2.toFixed(1)}" fill="none" stroke="${col}" stroke-width="3.5" marker-end="url(#${col === RED ? 'ahR' : col === GRN ? 'ahN' : 'ahB'})"/>` + O(x1, y1, 4.5, col); };
    F['m3-sun-path'] = svg(278,
      'เส้นทางดวงอาทิตย์เมื่อมองจากข้างบน ดวงอาทิตย์ขึ้นตะวันออกเฉียงเหนือและตกตะวันตกเฉียงเหนือในเดือนมิถุนายน ขึ้นตะวันออกตกตะวันตกเดือนมีนาคมและกันยายน ขึ้นตะวันออกเฉียงใต้ตกตะวันตกเฉียงใต้เดือนธันวาคม',
      O(cx, cy, r, '#f8fafc', 'currentColor') + L(cx, cy - r, cx, cy + r, GRY, 1) + L(cx - r, cy, cx + r, cy, GRY, 1) +
      tgc(cx, cy - r - 6, 'เหนือ', '#111827', 700, 10) + tgc(cx + r - 30, cy - 6, 'ตะวันออก', '#111827', 700, 9.5) + tgc(cx, cy + r + 14, 'ใต้', '#111827', 700, 10) + tgc(cx - r + 30, cy - 6, 'ตะวันตก', '#111827', 700, 9.5) +
      path(62, 298, cy + 8, RED, '') + path(90, 270, cy + 56, GRN, '') + path(118, 242, cy + 130, BLUE, '') +
      O(cx, cy, 4, '#111827') + tgc(cx, cy + 16, 'ผู้สังเกต', '#374151', 700, 8.5) +
      tg(250, 60, 'มิถุนายน', RED, 700, 10.5) + tg(250, 74, 'ขึ้น ตอ.เฉียงเหนือ', '#374151', 600, 9) + tg(250, 86, 'ตก ตต.เฉียงเหนือ', '#374151', 600, 9) +
      tg(250, 122, 'มีนาคม · กันยายน', GRN, 700, 10) + tg(250, 136, 'ขึ้นทิศตะวันออก', '#374151', 600, 9) + tg(250, 148, 'ตกทิศตะวันตก', '#374151', 600, 9) +
      tg(250, 184, 'ธันวาคม', BLUE, 700, 10.5) + tg(250, 198, 'ขึ้น ตอ.เฉียงใต้', '#374151', 600, 9) + tg(250, 210, 'ตก ตต.เฉียงใต้', '#374151', 600, 9) +
      tgc(180, 272, 'วงกลม = ขอบฟ้า · เส้นโค้ง = แนวดวงอาทิตย์ (ไทย ซีกโลกเหนือ)', '#111827', 700, 9));
  })();

  /* 4) ตำแหน่งดวงจันทร์ เวลาขึ้น-ตก */
  (function () {
    const mn = (cx, cy) => `<circle cx="${cx}" cy="${cy}" r="10" fill="#374151" stroke="currentColor" stroke-width="1.5"/><path d="M${cx} ${cy - 10}A10 10 0 0 0 ${cx} ${cy + 10}Z" fill="${SUNY}"/>`;
    F['m3-moon-geo'] = svg(284,
      'ตำแหน่งดวงจันทร์ในวงโคจร เดือนดับอยู่ระหว่างโลกกับอาทิตย์ ขึ้น 8 ค่ำเห็นครึ่งดวงขึ้นเวลาเที่ยง ตกเที่ยงคืน เต็มดวงขึ้นหัวค่ำ แรม 8 ค่ำขึ้นเที่ยงคืน',
      O(30, 100, 22, SUNY, '#ca8a04') + tgc(30, 140, 'อาทิตย์', '#92400e', 700, 9) +
      L(56, 62, 108, 62, '#f59e0b', 1.5, 'stroke-dasharray="5 4"') + L(56, 100, 90, 100, '#f59e0b', 1.5, 'stroke-dasharray="5 4"') + L(56, 138, 108, 138, '#f59e0b', 1.5, 'stroke-dasharray="5 4"') +
      `<circle cx="190" cy="100" r="62" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="4 4"/>` + O(190, 100, 13, '#60a5fa', '#1d4ed8') + tgc(190, 104, 'โลก', '#111827', 700, 9) +
      mn(128, 100) + mn(190, 162) + mn(252, 100) + mn(190, 38) +
      tgc(128, 82, 'เดือนดับ', '#111827', 700, 9) + tgc(190, 186, 'ขึ้น 8 ค่ำ', '#15803d', 700, 9.5) + tgc(268, 82, 'เต็มดวง', '#111827', 700, 9) + tgc(190, 24, 'แรม 8 ค่ำ', '#b91c1c', 700, 9.5) +
      R(8, 198, 344, 76, '#f8fafc', 'currentColor') +
      tg(14, 214, 'วัน', '#111827', 700, 9.5) + tg(84, 214, 'ดวงจันทร์ขึ้น', '#111827', 700, 9.5) + tg(180, 214, 'ดวงจันทร์ตก', '#111827', 700, 9.5) + tg(262, 214, 'ที่เห็น', '#111827', 700, 9.5) +
      tg(14, 228, 'เดือนดับ', '#374151', 600, 9) + tg(84, 228, '06.00 น.', '#374151', 600, 9) + tg(180, 228, '18.00 น.', '#374151', 600, 9) + tg(262, 228, 'ไม่เห็น', '#374151', 600, 9) +
      tg(14, 242, 'ขึ้น 8 ค่ำ', '#374151', 600, 9) + tg(84, 242, '12.00 น.', '#374151', 600, 9) + tg(180, 242, '24.00 น.', '#374151', 600, 9) + tg(262, 242, 'ครึ่งดวง', '#374151', 600, 9) +
      tg(14, 256, 'เต็มดวง', '#374151', 600, 9) + tg(84, 256, '18.00 น.', '#374151', 600, 9) + tg(180, 256, '06.00 น.', '#374151', 600, 9) + tg(262, 256, 'เต็มดวง', '#374151', 600, 9) +
      tg(14, 270, 'แรม 8 ค่ำ', '#374151', 600, 9) + tg(84, 270, '24.00 น.', '#374151', 600, 9) + tg(180, 270, '12.00 น.', '#374151', 600, 9) + tg(262, 270, 'ครึ่งดวง', '#374151', 600, 9));
  })();

  /* 5) น้ำเกิด น้ำตาย */
  (function () {
    const panel = (ox, title, moonPos, tide, note1, note2) => {
      const cx = ox + 78, cy = 100;
      return tgc(cx, 14, title, '#111827', 700, 11) + O(ox + 24, 100, 14, SUNY, '#ca8a04') + tgc(ox + 24, 124, 'อาทิตย์', '#92400e', 700, 8.5) +
        `<ellipse cx="${cx}" cy="${cy}" rx="${tide[0]}" ry="${tide[1]}" fill="#bae6fd" stroke="#1d4ed8" stroke-width="1.5"/>` + O(cx, cy, 20, '#86efac', '#166534') + tgc(cx, cy + 3, 'โลก', '#111827', 700, 8.5) +
        O(moonPos[0], moonPos[1], 8, '#d1d5db', 'currentColor') + tgc(moonPos[0], moonPos[1] + 20, 'ดวงจันทร์', '#374151', 700, 8.5) +
        tgc(cx, 168, note1, '#111827', 700, 9.5) + tgc(cx, 182, note2, '#374151', 700, 9);
    };
    F['m3-tides'] = svg(212,
      'น้ำเกิดเมื่ออาทิตย์ โลก ดวงจันทร์อยู่ในแนวเดียวกัน ตอนเดือนดับและเต็มดวง ระดับน้ำขึ้นสูงสุดลงต่ำสุด น้ำตายเมื่อดวงจันทร์ตั้งฉากกับอาทิตย์ ตอนขึ้นหรือแรม 8 ค่ำ ระดับน้ำต่างกันน้อย',
      panel(0, 'น้ำเกิด (ขึ้น/แรม 15 ค่ำ)', [152, 100], [46, 30], 'อาทิตย์–โลก–จันทร์ ตรงแนว', 'น้ำขึ้นสูงสุด · ลงต่ำสุด') +
      panel(180, 'น้ำตาย (ขึ้น/แรม 8 ค่ำ)', [258, 40], [34, 30], 'จันทร์ตั้งฉากกับอาทิตย์', 'น้ำขึ้นลงต่างกันน้อย') +
      tgc(180, 206, 'น้ำเกิด: ขึ้นสูงกว่าและลงต่ำกว่าน้ำตาย', '#b91c1c', 700, 9));
  })();

  /* ===== ว 1.1 ระบบนิเวศ สายใยอาหาร พลังงาน วัฏจักร สารพิษสะสม ===== */

  /* 1) สายใยอาหารตัวอย่าง */
  (function () {
    const nd = (x, y, name, col) => R(x - 36, y - 12, 72, 24, col) + tgc(x, y + 4, name, '#111827', 700, 10.5);
    const ar = (x1, y1, x2, y2) => line(x1, y1, x2, y2, GRN, 2.2, true);
    F['m3-foodweb-ex'] = svg(300,
      'สายใยอาหาร หญ้าเป็นผู้ผลิต หนูและตั๊กแตนกินหญ้า งูกินหนูและกบ กบและนกกินแมลงกินตั๊กแตน เหยี่ยวกินงูและนก ลูกศรชี้ไปยังผู้กิน',
      ar(150, 266, 98, 240) + ar(190, 266, 246, 240) + ar(80, 214, 100, 184) + ar(250, 214, 224, 184) + ar(278, 214, 302, 184) + ar(174, 170, 150, 170) + ar(124, 158, 168, 114) + ar(300, 158, 230, 114) +
      nd(170, 278, 'หญ้า (ผู้ผลิต)', '#bbf7d0') + nd(70, 226, 'หนู', '#fde68a') + nd(260, 226, 'ตั๊กแตน', '#fde68a') +
      nd(110, 170, 'งู', '#fed7aa') + nd(210, 170, 'กบ', '#fed7aa') + nd(312, 170, 'นกกินแมลง', '#fed7aa') + nd(200, 100, 'เหยี่ยว', '#fecaca') +
      tg(6, 124, 'ผู้บริโภค 2–3: กินสัตว์', '#374151', 600, 9) +
      tg(6, 18, 'ผู้ย่อยสลาย (เห็ด รา แบคทีเรีย) ย่อยซากของทุกลำดับ', '#7c2d12', 700, 9));
  })();
  /* 2) พีระมิดพลังงาน */
  F['m3-energy-pyramid'] = svg(228,
    'พีระมิดพลังงาน พลังงานเหลือประมาณร้อยละสิบในแต่ละลำดับขั้นการกิน ผู้ผลิตมีพลังงานมากที่สุด ผู้บริโภคลำดับสุดท้ายน้อยที่สุด',
    `<polygon points="180,10 220,60 140,60" fill="#fecaca" stroke="currentColor" stroke-width="2"/><polygon points="140,60 220,60 250,110 110,110" fill="#fed7aa" stroke="currentColor" stroke-width="2"/><polygon points="110,110 250,110 280,160 80,160" fill="#fde68a" stroke="currentColor" stroke-width="2"/><polygon points="80,160 280,160 310,210 50,210" fill="#bbf7d0" stroke="currentColor" stroke-width="2"/>` +
    tgc(180, 48, '20 kJ', '#111827', 700, 10) + tgc(180, 90, '200 kJ', '#111827', 700, 10.5) + tgc(180, 140, '2,000 kJ', '#111827', 700, 11) + tgc(180, 190, '20,000 kJ', '#111827', 700, 11.5) +
    tg(318, 34, 'ผู้บริโภค ลำดับ 3', '#374151', 700, 8.5).replace('x="318"', 'x="254"') + tg(262, 86, 'ผู้บริโภค ลำดับ 2', '#374151', 700, 9) + tg(284, 136, 'ผู้บริโภค ลำดับ 1', '#374151', 700, 9).replace('x="284"', 'x="284"') + tg(4, 190, 'ผู้ผลิต', '#166534', 700, 9.5).replace('x="4"', 'x="4"') +
    tgc(180, 224, 'ส่งต่อแต่ละขั้นได้ประมาณ 10% (ที่เหลือเป็นความร้อน/ใช้เอง)', '#b91c1c', 700, 9));

  /* 3) วัฏจักรคาร์บอนและออกซิเจน */
  (function () {
    const bx = (x, y, w, name, col) => R(x, y, w, 30, col) + tgc(x + w / 2, y + 20, name, '#111827', 700, 10);
    F['m3-carbon-cycle'] = svg(236,
      'วัฏจักรคาร์บอน พืชสังเคราะห์ด้วยแสงใช้คาร์บอนไดออกไซด์และปล่อยออกซิเจน พืช สัตว์ ผู้ย่อยสลายหายใจใช้ออกซิเจนและปล่อยคาร์บอนไดออกไซด์ การเผาเชื้อเพลิงเพิ่มคาร์บอนไดออกไซด์',
      bx(110, 8, 140, 'CO₂ และ O₂ ในอากาศ', '#e0f2fe') + bx(10, 110, 80, 'พืช', '#bbf7d0') + bx(140, 110, 80, 'สัตว์', '#fed7aa') + bx(262, 110, 90, 'ผู้ย่อยสลาย', '#e7e5e4') +
      arrow('M114 36C74 52 52 80 52 108', GRN) + tg(4, 154, 'ก. สังเคราะห์ด้วยแสง', '#15803d', 700, 8.5) + tg(4, 166, 'ใช้ CO₂ ปล่อย O₂', '#15803d', 700, 8.5) +
      arrow('M180 108V40', RED) + tg(186, 66, 'ข. หายใจ', '#b91c1c', 700, 9) + tg(186, 78, 'ใช้ O₂ ปล่อย CO₂', '#b91c1c', 700, 8.5) +
      arrow('M306 108C298 70 276 44 250 30', RED) + tg(262, 64, 'ค. ย่อยสลาย', '#b91c1c', 700, 8.5) + tg(262, 76, 'ปล่อย CO₂', '#b91c1c', 700, 8.5) +
      arrow('M92 126H138', GRY) + tgc(115, 118, 'ถูกกิน', '#374151', 600, 8) + arrow('M222 126H260', GRY) + tgc(241, 118, 'ซาก', '#374151', 600, 8) +
      tgc(220, 176, 'ง. การเผาเชื้อเพลิง (ถ่านหิน น้ำมัน) ปล่อย CO₂ เพิ่ม', '#a16207', 700, 9) +
      tgc(180, 196, 'ก = ลด CO₂ เพิ่ม O₂  ·  ข ค ง = เพิ่ม CO₂ ลด O₂', '#111827', 700, 9.5) + tgc(180, 214, 'พืชก็หายใจด้วย (ใช้ O₂ ปล่อย CO₂) แต่สังเคราะห์ด้วยแสงมากกว่า', '#374151', 600, 9));
  })();
  /* 4) สารพิษสะสมในโซ่อาหาร */
  (function () {
    const lv = [['น้ำ', 1, '#bae6fd'], ['แพลงก์ตอนพืช', 10, '#bbf7d0'], ['ปลาเล็ก', 100, '#fde68a'], ['ปลาใหญ่', 1000, '#fdba74'], ['คน/นกกินปลา', 10000, '#fecaca']];
    let b = tgc(180, 14, 'ความเข้มข้นของสารพิษที่ย่อยสลายยาก (เทียบ, เท่า)', '#111827', 700, 10.5);
    lv.forEach((l, i) => { const w = 12 + Math.log10(l[1] * 10) * 56 / 4 * 1.0; const ww = 20 + i * 62; b += R(8, 28 + i * 34, ww, 26, l[2]) + tg(14, 46 + i * 34, l[0], '#111827', 700, 10) + tg(8 + ww + 6, 46 + i * 34, '× ' + l[1].toLocaleString('en-US'), '#b91c1c', 700, 10.5); });
    b += tgc(180, 214, 'สะสมเพิ่มทุกลำดับการกิน · ผู้บริโภคลำดับสุดท้ายสะสมมากที่สุด', '#111827', 700, 9.5) + tgc(180, 230, 'ตัวอย่างสาร: DDT · แคดเมียม · ปรอท (สลายยาก ขับออกยาก)', '#374151', 600, 9);
    F['m3-biomagnification'] = svg(240, 'ความเข้มข้นของสารพิษที่สลายยากเพิ่มขึ้นในแต่ละลำดับของโซ่อาหาร ผู้บริโภคลำดับสุดท้ายสะสมมากที่สุด', b);
  })();

  /* 5) ความสัมพันธ์ระหว่างสิ่งมีชีวิต */
  F['m3-symbiosis'] = svg(236,
    'ความสัมพันธ์ระหว่างสิ่งมีชีวิต ภาวะการล่า ภาวะแข่งขัน ภาวะพึ่งพา ภาวะอาศัย และภาวะปรสิต',
    [['ภาวะการล่า', 'ผู้ล่า + / เหยื่อ −', 'งูกินหนู', '#fee2e2'], ['ภาวะแข่งขัน', 'ทั้งสอง −', 'ลิงกับนกแย่งอาหาร', '#fef9c3'], ['ภาวะพึ่งพากัน', 'ทั้งสอง +', 'ผึ้งกับดอกไม้', '#dcfce7'], ['ภาวะอาศัย', 'ฝ่ายหนึ่ง + / อีกฝ่าย 0', 'เหาฉลามกับฉลาม', '#e0f2fe'], ['ภาวะปรสิต', 'ปรสิต + / เจ้าบ้าน −', 'เห็บกับสุนัข', '#fae8ff']].map((r, i) => {
      const y = 8 + i * 44;
      return R(6, y, 348, 38, r[3]) + tg(14, y + 16, r[0], '#111827', 700, 11) + tg(14, y + 31, r[2], '#374151', 600, 9.5) + tg(190, y + 24, r[1], '#b91c1c', 700, 10.5);
    }).join('') + tgc(180, 232, '+ = ได้ประโยชน์ · − = เสียประโยชน์ · 0 = ไม่ได้ไม่เสีย', '#111827', 700, 9.5));

  /* ===== ว 4.1 เทคโนโลยี กระบวนการออกแบบเชิงวิศวกรรม ===== */

  /* 1) กระบวนการออกแบบเชิงวิศวกรรม */
  (function () {
    const st = [['1', 'ระบุปัญหา', 'ความต้องการ', '#fee2e2'], ['2', 'รวบรวมข้อมูล', 'ค้น สำรวจ', '#fef9c3'], ['3', 'เลือกแนวทาง', 'เทียบ ตัดสินใจ', '#dcfce7'], ['4', 'ออกแบบ วางแผน', 'ภาพร่าง ขั้นตอน', '#e0f2fe'], ['5', 'สร้าง ติดตั้ง', 'ลงมือทำ', '#dbeafe'], ['6', 'ทดสอบ ประเมิน', 'ในสภาพจริง', '#fae8ff'], ['7', 'ปรับปรุง นำเสนอ', 'แก้ข้อบกพร่อง', '#fde68a']];
    let b = '';
    st.forEach((s, i) => {
      const col = i % 2, row = Math.floor(i / 2), x = 8 + col * 176, y = 10 + row * 58;
      b += R(x, y, 164, 46, s[3]) + `<circle cx="${x + 20}" cy="${y + 23}" r="12" fill="#fff" stroke="currentColor" stroke-width="1.5"/>` + tgc(x + 20, y + 28, s[0], '#111827', 700, 11) + tg(x + 38, y + 21, s[1], '#111827', 700, 11) + tg(x + 38, y + 36, s[2], '#374151', 600, 9.5);
    });
    b += tgc(180, 262, 'ถ้ายังมีข้อบกพร่อง → กลับไปปรับปรุงและทดสอบซ้ำ (วนจนได้ผลตามต้องการ)', '#b91c1c', 700, 9.5) + tgc(180, 246, 'อ่านตามลำดับเลข 1 → 7 (ซ้าย → ขวา แล้วลงแถวถัดไป)', '#374151', 600, 9);
    F['m3-eng-process'] = svg(272, 'กระบวนการออกแบบเชิงวิศวกรรม ระบุปัญหา รวบรวมข้อมูล เลือกแนวทาง ออกแบบวางแผน สร้าง ทดสอบประเมิน และปรับปรุงนำเสนอ', b);
  })();

  /* 2) ปัจจัยที่ทำให้เทคโนโลยีเปลี่ยน */
  F['m3-tech-change'] = svg(244,
    'ปัจจัยที่ทำให้เทคโนโลยีเปลี่ยนแปลง ความก้าวหน้าของวิทยาศาสตร์และศาสตร์อื่น ความต้องการและปัญหา ต้นทุนเศรษฐกิจ สิ่งแวดล้อม กฎระเบียบสังคม',
    O(180, 112, 38, '#bfdbfe', 'currentColor') + tgc(180, 108, 'เทคโนโลยี', '#111827', 700, 10.5) + tgc(180, 122, 'เปลี่ยนแปลง', '#111827', 700, 10.5) +
    [[56, 38, 'ความก้าวหน้าของ', 'วิทยาศาสตร์/ศาสตร์อื่น', '#dcfce7'], [304, 38, 'ความต้องการ', 'และปัญหา', '#fef9c3'], [56, 190, 'ต้นทุน', 'เศรษฐกิจ', '#fee2e2'], [304, 190, 'สิ่งแวดล้อม', '', '#ecfccb'], [180, 20, '', '', 'none']].map(p => p[4] === 'none' ? '' : R(p[0] - 54, p[1] - 22, 108, 44, p[4]) + tgc(p[0], p[1] - 2, p[2], '#111827', 700, 9.5) + (p[3] ? tgc(p[0], p[1] + 12, p[3], '#111827', 700, 9) : '')).join('') +
    arrow('M96 60L148 94', GRN) + arrow('M264 60L212 94', GRN) + arrow('M96 168L148 132', GRN) + arrow('M264 168L212 132', GRN) +
    R(130, 190, 100, 36, '#e9d5ff') + tgc(180, 205, 'กฎระเบียบสังคม', '#111827', 700, 9.5) + tgc(180, 218, 'ความปลอดภัย', '#111827', 700, 9) + arrow('M180 190V152', GRN) +
    tgc(180, 14, 'ตัวอย่าง: หน้ากากกรองฝุ่นหลายชั้น ← วิทยาศาสตร์วัสดุ (สาเหตุที่มากที่สุด)', '#b91c1c', 700, 9) +
    tgc(180, 234, 'แอนะล็อก → ดิจิทัล: เสถียร คมชัด แม่นยำ', '#374151', 700, 9));

  /* 3) แอนะล็อกและดิจิทัล */
  (function () {
    let a = '', d = '';
    for (let i = 0; i <= 60; i++) { const x = 20 + i * 5.4, v = Math.sin(i / 60 * 4 * Math.PI) * 24 + (i % 7 === 3 ? 6 : 0) * Math.sin(i); a += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + (62 - v).toFixed(1); }
    const bits = [1, 0, 1, 1, 0, 0, 1, 0]; let pd = '';
    bits.forEach((bt, i) => { const x0 = 20 + i * 40.5, y = bt ? 138 : 178, yp = i ? (bits[i - 1] ? 138 : 178) : y; pd += (i ? `L${x0} ${yp}L${x0} ${y}` : `M${x0} ${y}`) + `L${x0 + 40.5} ${y}`; });
    F['m3-analog-digital'] = svg(236,
      'สัญญาณแอนะล็อกต่อเนื่อง เมื่อมีสัญญาณรบกวนค่าเปลี่ยนไปคุณภาพลดลง สัญญาณดิจิทัลมีสองค่า 0 และ 1 เมื่อมีสัญญาณรบกวนสามารถกู้คืนค่าเดิมได้',
      tgc(180, 14, 'แอนะล็อก: ต่อเนื่อง · รบกวนแล้วคุณภาพลดทันที', '#111827', 700, 10) + L(20, 62, 346, 62, '#cbd5e1', 1) + `<path d="${a}" fill="none" stroke="#b91c1c" stroke-width="2.5"/>` + tgc(180, 100, 'ค่าเปลี่ยนไปจากสัญญาณเดิม (ไม่กลับคืน)', '#b91c1c', 700, 9) +
      tgc(180, 120, 'ดิจิทัล: 2 ค่า (0 กับ 1) · รบกวนแล้วกู้คืนได้', '#111827', 700, 10) + L(20, 158, 346, 158, '#94a3b8', 1.2, 'stroke-dasharray="4 3"') + tg(24, 154, 'เกณฑ์ตัดสิน', '#64748b', 600, 8.5) + `<path d="${pd}" fill="none" stroke="#1d4ed8" stroke-width="3"/>` +
      tg(8, 142, '1', '#1d4ed8', 700, 10) + tg(8, 182, '0', '#1d4ed8', 700, 10) +
      tgc(180, 206, 'สัญญาณดิจิทัลทนต่อสัญญาณรบกวนได้ดีกว่า → คุณภาพคมชัด ความเสถียร ความแม่นยำ', '#15803d', 700, 9) + tgc(180, 224, 'ไม่ได้ทำให้สัญญาณรบกวน "เกิดน้อยลง" แค่ "ทนต่อ" ได้', '#b91c1c', 700, 9));
  })();

  /* 4) เปรียบเทียบทางเลือกด้วยเงื่อนไข */
  (function () {
    const cols = ['ทางเลือก', 'ในงบ', 'ไม่กระทบ', 'แก้ที่สาเหตุ'];
    const rows = [['A ซื้อระบบใหม่ทั้งหมด', '✗', '✗', '✓'], ['B เพิ่มคนทำงานซ้ำ', '✗', '✓', '✗'], ['C อบรมผู้ใช้ อย่างเดียว', '✓', '✓', '✗'], ['D ปรับทีละขั้น', '✓', '✓', '✓']];
    let b = '';
    cols.forEach((c, i) => { const x = i ? 140 + (i - 1) * 74 : 4, w = i ? 72 : 134; b += R(x, 8, w, 30, '#e5e7eb') + tgc(x + w / 2, 27, c, '#111827', 700, 9); });
    rows.forEach((r, j) => {
      const y = 40 + j * 38, best = j === 3;
      b += R(4, y, 134, 36, best ? '#bbf7d0' : '#f8fafc') + tg(8, y + 22, r[0], '#111827', 700, 9);
      for (let i = 1; i < 4; i++) b += R(140 + (i - 1) * 74, y, 72, 36, best ? '#bbf7d0' : '#fff', '#94a3b8') + tgc(140 + (i - 1) * 74 + 36, y + 24, r[i], r[i] === '✓' ? '#15803d' : '#b91c1c', 700, 14);
    });
    b += tgc(180, 206, 'เลือกข้อที่ผ่าน "เงื่อนไข" ครบทุกข้อ (งบ · ไม่กระทบงานเดิม · แก้ถูกจุด)', '#111827', 700, 9.5) + tgc(180, 222, 'แล้ววางแผนทีละขั้นตอน', '#374151', 600, 9.5);
    F['m3-option-matrix'] = svg(232, 'ตารางเปรียบเทียบทางเลือกกับเงื่อนไข เลือกทางเลือกที่ผ่านเงื่อนไขครบ คือวิเคราะห์จุดอ่อนแล้วปรับปรุงทีละขั้นตอน', b);
  })();

  /* 5) ทรัพย์สินทางปัญญา */
  F['m3-ip'] = svg(198,
    'ทรัพย์สินทางปัญญา ลิขสิทธิ์คุ้มครองงานสร้างสรรค์ สิทธิบัตรคุ้มครองการประดิษฐ์และการออกแบบ เครื่องหมายการค้าคุ้มครองชื่อและสัญลักษณ์สินค้า',
    [['ลิขสิทธิ์', 'งานสร้างสรรค์', 'หนังสือ เพลง ภาพ', '#fef9c3'], ['สิทธิบัตร', 'ประดิษฐ์/ออกแบบ', 'สิ่งประดิษฐ์ใหม่', '#dcfce7'], ['เครื่องหมายการค้า', 'ชื่อ · ตรา', 'แบรนด์สินค้า', '#e0f2fe']].map((r, i) => { const x = 4 + i * 119; return R(x, 8, 113, 100, r[3]) + tgc(x + 56, 28, r[0], '#111827', 700, 10.5) + tgc(x + 56, 52, r[1], '#374151', 700, 9) + tgc(x + 56, 74, r[2], '#374151', 600, 8.5); }).join('') +
    tgc(180, 130, 'ก่อนนำผลงานผู้อื่นมาใช้: ขออนุญาต · อ้างอิงแหล่งที่มา · ไม่คัดลอกโดยไม่ได้รับอนุญาต', '#111827', 700, 9) + tgc(180, 148, 'พัฒนางานอาชีพ/ชุมชน ต้องไม่ละเมิดทรัพย์สินทางปัญญาของผู้อื่น', '#b91c1c', 700, 9.5) + tgc(180, 168, 'ขอเก็บรักษาผลงานตนเอง: จดลิขสิทธิ์ ยื่นสิทธิบัตร จดเครื่องหมายการค้า', '#15803d', 700, 9));
})();
