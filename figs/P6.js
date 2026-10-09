/* ภาพประกอบสรุปเนื้อหา ป.6 (SVG วาดเอง) — ใช้ใน data/summaries/P6-*.txt ด้วย [[fig:ชื่อ|คำบรรยาย]]
   โหลดโดย index.html เมื่อเปิดหน้าสรุปของระดับ ป.6 เท่านั้น · ห้ามใช้ร่วมกับ ม.3 (ม.3 อยู่ใน figs/M3.js) */
(function () {
  const F = FIGS.P6;
  const RED = '#b91c1c', BLUE = '#1d4ed8', GRN = '#15803d', GRY = '#64748b', ORG = '#c2410c';
  const mk = (id, c) => `<marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="${c}"/></marker>`;
  const MK = mk('ah', 'currentColor') + mk('ahR', RED) + mk('ahB', BLUE) + mk('ahG', GRY) + mk('ahN', GRN) + mk('ahO', ORG);
  const svg = (h, label, body) => `<svg viewBox="0 0 360 ${h}" role="img" aria-label="${label}" style="font-size:13px"><defs>${MK}</defs>${body}</svg>`;
  const T = (x, y, s, o = '') => `<text x="${x}" y="${y}" ${o}>${s}</text>`;
  const C = (x, y, s, o = '') => T(x, y, s, `text-anchor="middle" ${o}`);
  const L = (x1, y1, x2, y2, c = 'currentColor', w = 2, extra = '') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="${w}" ${extra}/>`;
  const R = (x, y, w, h, fill = 'none', stroke = 'currentColor', extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${stroke}" stroke-width="2" ${extra}/>`;
  const O = (x, y, r, fill, stroke = 'none') => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;
  const arrow = (d, c = 'currentColor', extra = '') => `<path d="${d}" fill="none" stroke="${c}" stroke-width="2.2" marker-end="url(#${c === RED ? 'ahR' : c === BLUE ? 'ahB' : c === GRY ? 'ahG' : c === GRN ? 'ahN' : c === ORG ? 'ahO' : 'ah'})" ${extra}/>`;
  const line = (x1, y1, x2, y2, c, dash = false) => arrow(`M${x1} ${y1}L${x2} ${y2}`, c, dash ? 'stroke-dasharray="5 4"' : '');
  const HALO = 'style="paint-order:stroke;stroke:#fff;stroke-width:3.5px;stroke-linejoin:round"';

  /* 1) สภาพยืดหยุ่น: ยืดแล้วกลับ / ยืดแล้วไม่กลับ */
  const strip2 = (cx, y0, len, load, name, col) => R(cx - 7, y0, 14, len, col) + (load ? R(cx - 15, y0 + len, 30, 20, '#94a3b8') + C(cx, y0 + len + 14, 'ตุ้ม', 'font-size="11" fill="#fff"') : '') + C(cx, y0 + len + (load ? 38 : 18), name, 'font-weight="600"');
  F['p6-elastic'] = svg(334,
    'เปรียบเทียบวัสดุยืดหยุ่นกับวัสดุที่ไม่ยืดหยุ่น',
    C(180, 14, 'แถวบน: วัสดุยืดหยุ่นดี · แถวล่าง: วัสดุไม่ยืดหยุ่น', 'font-size="12"') +
    L(20, 22, 340, 22, 'currentColor', 3) + strip2(60, 22, 45, false, '15 ซม.', '#fde68a') + strip2(180, 22, 69, true, 'ยืดเป็น 23 ซม.', '#fde68a') + strip2(300, 22, 45, false, 'กลับเป็น 15 ซม.', '#fde68a') +
    arrow('M96 60H146', GRY) + C(121, 52, 'แขวนตุ้ม', 'font-size="11"') + arrow('M216 60H266', GRY) + C(241, 52, 'เอาตุ้มออก', 'font-size="11"') +
    C(180, 152, 'กลับมายาวเท่าเดิม → ยืดหยุ่นดี', `font-weight="700" fill="${GRN}"`) +
    L(20, 174, 340, 174, 'currentColor', 3) + strip2(60, 174, 45, false, '15 ซม.', '#e2e8f0') + strip2(180, 174, 69, true, 'ยืดเป็น 23 ซม.', '#e2e8f0') + strip2(300, 174, 69, false, 'ยังยาว 23 ซม.', '#e2e8f0') +
    arrow('M96 212H146', GRY) + C(121, 204, 'แขวนตุ้ม', 'font-size="11"') + arrow('M216 212H266', GRY) + C(241, 204, 'เอาตุ้มออก', 'font-size="11"') +
    C(180, 322, 'ไม่กลับความยาวเดิม → ไม่ยืดหยุ่น', `font-weight="700" fill="${RED}"`));

  /* 2) การนำความร้อน: แท่งโลหะกับแท่งไม้ ขี้ผึ้งหลุดเร็ว-ช้า */
  const flame = (x, y) => `<path d="M${x} ${y}c-10 -10 -4 -20 0 -30c4 10 10 18 0 30z" fill="#f97316" stroke="${RED}" stroke-width="1.5"/>`;
  const rod = (y, name, fell, col) => R(70, y, 250, 14, col) + flame(52, y + 22) + T(70, y - 6, name, 'font-weight="700"') +
    [110, 160, 210, 260, 305].map((x, i) => i < fell ? O(x, y + 40 + (i % 2) * 8, 5, '#facc15', '#a16207') + L(x, y + 14, x, y + 33, GRY, 1, 'stroke-dasharray="3 3"') : O(x, y + 19, 5, '#facc15', '#a16207')).join('');
  F['p6-heatrod'] = svg(236,
    'แท่งเหล็กกับแท่งไม้ให้ความร้อนที่ปลายข้างเดียว ขี้ผึ้งบนแท่งเหล็กหลุดก่อน',
    C(180, 16, 'ให้ความร้อนปลายซ้าย · จุดเหลือง = ขี้ผึ้ง', 'font-size="12"') +
    rod(40, 'เหล็ก', 4, '#cbd5e1') + C(190, 114, 'ขี้ผึ้งหลุดเกือบหมดภายใน 2 นาที → นำความร้อนดี', `font-size="12" fill="${GRN}" font-weight="600"`) +
    rod(150, 'ไม้', 1, '#d6b98c') + C(190, 224, 'หลุดแค่เม็ดแรกใน 8 นาที → นำความร้อนไม่ดี', `font-size="12" fill="${RED}" font-weight="600"`));

  /* 3) ทดสอบการนำไฟฟ้า */
  const test = (ox, lit, name, res, col) => {
    const x0 = ox, x1 = ox + 150, y0 = 36, y1 = 116;
    return `<path d="M${x0} ${y1}V${y0}H${ox + 55}M${ox + 95} ${y0}H${x1}V${y1}H${ox + 112}M${ox + 38} ${y1}H${x0}" fill="none" stroke="currentColor" stroke-width="2"/>` +
      O(ox + 75, y0, 14, lit ? '#fde047' : '#fff', 'currentColor') + (lit ? L(ox + 75, 6, ox + 75, 16, '#ca8a04', 2) + L(ox + 55, 12, ox + 62, 20, '#ca8a04', 2) + L(ox + 95, 12, ox + 88, 20, '#ca8a04', 2) : '') +
      L(ox + 67, y0 - 8, ox + 83, y0 + 8, 'currentColor', 1.5) + L(ox + 83, y0 - 8, ox + 67, y0 + 8, 'currentColor', 1.5) +
      R(ox + 38, y1 - 9, 74, 18, col, 'currentColor') + O(ox + 38, y1, 4, '#fff', 'currentColor') + O(ox + 112, y1, 4, '#fff', 'currentColor') +
      C(ox + 75, y1 + 4, name, 'font-size="11"') +
      L(x0 - 6, 66, x0 + 6, 66, 'currentColor', 2) + L(x0 - 3, 74, x0 + 3, 74, 'currentColor', 5) + T(x0 + 10, 72, 'ถ่านไฟฉาย', 'font-size="10"') +
      C(ox + 75, 150, res, `font-weight="700" fill="${lit ? GRN : RED}"`);
  };
  F['p6-circuit-test'] = svg(170,
    'ต่อวัตถุในวงจรไฟฟ้า ถ้าหลอดสว่างวัตถุนั้นเป็นตัวนำไฟฟ้า',
    test(8, true, 'เหรียญ', 'หลอดสว่าง → ตัวนำไฟฟ้า', '#e2e8f0') + test(200, false, 'ไม้', 'หลอดไม่สว่าง → ฉนวนไฟฟ้า', '#d6b98c'));

  /* 4) อนุภาคของสสารสามสถานะ */
  const pts = (arr, r, fill) => arr.map(([x, y]) => O(x, y, r, fill, '#334155')).join('');
  const grid = []; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) grid.push([34 + j * 16, 38 + i * 16]);
  const liq = [[22, 78], [38, 72], [54, 80], [70, 74], [86, 78], [30, 90], [46, 92], [62, 88], [78, 92], [94, 88], [22, 100], [38, 104], [54, 100], [70, 104], [86, 100], [96, 102]].map(([x, y]) => [x + 120, y]);
  const gas = [[262, 36], [300, 50], [340, 38], [276, 70], [322, 82], [336, 66], [268, 100], [300, 112], [344, 106], [286, 90], [330, 54]];
  F['p6-states'] = svg(190,
    'แบบจำลองอนุภาคของของแข็ง ของเหลว และแก๊ส',
    R(20, 25, 100, 90) + pts(grid, 6, '#fbbf24') +
    R(130, 25, 100, 90) + R(131, 66, 98, 48, '#dbeafe', 'none') + L(131, 66, 229, 66, BLUE, 2) + pts(liq, 5.5, '#60a5fa') +
    R(240, 25, 110, 90) + pts(gas, 5, '#f87171') +
    C(70, 134, 'ของแข็ง', 'font-weight="700"') + C(70, 150, 'เรียงชิดกันเป็นระเบียบ', 'font-size="11"') + C(70, 164, 'สั่นอยู่กับที่', 'font-size="11"') + C(70, 178, 'รูปร่าง+ปริมาตรคงที่', 'font-size="11"') +
    C(180, 134, 'ของเหลว', 'font-weight="700"') + C(180, 150, 'อยู่ชิดกันแต่เลื่อนไถลได้', 'font-size="11"') + C(180, 164, 'เปลี่ยนรูปตามภาชนะ', 'font-size="11"') + C(180, 178, 'ปริมาตรคงที่ ผิวหน้าเรียบ', 'font-size="11"') +
    C(295, 134, 'แก๊ส', 'font-weight="700"') + C(295, 150, 'อยู่ห่างกันมาก เคลื่อนที่เร็ว', 'font-size="11"') + C(295, 164, 'ฟุ้งเต็มภาชนะ', 'font-size="11"') + C(295, 178, 'รูปร่าง+ปริมาตรไม่คงที่', 'font-size="11"') +
    C(180, 14, 'จุด = อนุภาคของสาร', 'font-size="12"'));

  /* 5) การเปลี่ยนสถานะ */
  const node = (x, name, col) => `<rect x="${x - 42}" y="95" width="84" height="34" rx="10" fill="${col}" stroke="currentColor" stroke-width="2"/>` + C(x, 117, name, 'font-weight="700" font-size="14"');
  F['p6-statechange'] = svg(256,
    'การเปลี่ยนสถานะของสสาร แดง = รับความร้อน น้ำเงิน = คายความร้อน',
    node(55, 'ของแข็ง', '#fde68a') + node(180, 'ของเหลว', '#bfdbfe') + node(305, 'แก๊ส', '#fecaca') +
    arrow('M100 103H138', RED) + C(119, 96, 'หลอมเหลว', `font-size="10.5" fill="${RED}" font-weight="600"`) +
    arrow('M138 121H100', BLUE) + C(119, 138, 'แข็งตัว', `font-size="10.5" fill="${BLUE}" font-weight="600"`) +
    arrow('M225 103H263', RED) + C(244, 96, 'กลายเป็นไอ', `font-size="10.5" fill="${RED}" font-weight="600"`) +
    arrow('M263 121H225', BLUE) + C(244, 138, 'ควบแน่น', `font-size="10.5" fill="${BLUE}" font-weight="600"`) +
    arrow('M55 93C55 30 305 30 305 93', RED) + C(180, 46, 'ระเหิด (ของแข็ง → แก๊ส) รับความร้อน', `font-weight="600" fill="${RED}" font-size="12"`) +
    arrow('M305 131C305 200 55 200 55 131', BLUE) + C(180, 196, 'ระเหิดกลับ (แก๊ส → ของแข็ง) คายความร้อน', `font-weight="600" fill="${BLUE}" font-size="12"`) +
    C(180, 226, 'ไปทางแก๊ส ต้องใส่ความร้อนเข้าไป', 'font-size="11.5"') + C(180, 242, 'ย้อนกลับ ต้องเอาความร้อนออก', 'font-size="11.5"') +
    C(180, 14, 'แดง = รับความร้อน   น้ำเงิน = คายความร้อน', 'font-size="12"'));

  /* 6) การกรอง */
  F['p6-filter'] = svg(230,
    'การกรอง: กระดาษกรองกักของแข็งที่ไม่ละลาย น้ำและสารที่ละลายผ่านลงไป',
    C(60, 24, 'ส่วนผสม', 'font-weight="700"') + R(30, 34, 60, 42, '#e0f2fe') + O(45, 60, 4, '#92400e') + O(62, 66, 5, '#92400e') + O(76, 56, 4, '#92400e') + O(54, 48, 3, '#f9a8d4') + O(70, 44, 3, '#f9a8d4') +
    arrow('M92 56H128') +
    `<polygon points="130,40 250,40 200,106 180,106" fill="#fff" stroke="currentColor" stroke-width="2"/>` +
    `<polygon points="138,46 242,46 198,100 182,100" fill="#fef9c3" stroke="${GRY}" stroke-width="1.5"/>` +
    O(186, 96, 4, '#92400e') + O(194, 98, 4, '#92400e') + O(190, 91, 4, '#92400e') + O(180, 90, 3.5, '#92400e') +
    R(180, 106, 20, 26, '#fff') + O(190, 142, 3, '#60a5fa') +
    R(150, 152, 80, 66, '#dbeafe') + L(150, 164, 230, 164, BLUE, 1.5) + O(170, 190, 2.5, '#f472b6') + O(200, 200, 2.5, '#f472b6') + O(212, 182, 2.5, '#f472b6') +
    T(258, 56, 'กระดาษกรอง', 'font-size="12"') + L(256, 54, 226, 62, GRY, 1) +
    T(236, 100, 'กากที่ค้าง', 'font-size="12" font-weight="700"') + T(236, 115, '(ไม่ละลาย', 'font-size="11"') + T(236, 128, 'ใหญ่กว่ารูกระดาษ)', 'font-size="11"') + L(234, 98, 210, 95, GRY, 1) +
    T(240, 185, 'น้ำที่กรองได้', 'font-size="12" font-weight="700"') + T(240, 200, '(สารที่ละลาย', 'font-size="11"') + T(240, 213, 'ปนอยู่ด้วย)', 'font-size="11"') +
    T(12, 200, 'ดินสีน้ำตาล = ไม่ละลาย', 'font-size="10.5"') + T(12, 214, 'จุดชมพู = ละลายอยู่ในน้ำ', 'font-size="10.5"'));

  /* 7) การร่อน */
  F['p6-sieve'] = svg(220,
    'การร่อน: ตะแกรงปล่อยให้ชิ้นเล็กกว่ารูผ่าน ชิ้นใหญ่กว่ารูค้างอยู่',
    `<path d="M70 50L90 100H250L270 50" fill="none" stroke="currentColor" stroke-width="3"/>` +
    L(90, 100, 250, 100, '#78350f', 2.5, 'stroke-dasharray="4 4"') +
    O(120, 88, 10, '#a8a29e', '#44403c') + O(165, 85, 12, '#a8a29e', '#44403c') + O(210, 89, 9, '#a8a29e', '#44403c') +
    [[110, 120], [140, 135], [170, 118], [196, 140], [226, 124], [150, 160], [185, 168], [215, 160]].map(([x, y]) => O(x, y, 2.5, '#d6a756')).join('') +
    R(100, 175, 140, 8, '#cbd5e1') + [120, 150, 180, 210, 226].map((x, i) => O(x, 172, 2.5, '#d6a756')).join('') +
    T(278, 82, 'ก้อนใหญ่กว่ารู', 'font-size="12" font-weight="700"') + T(278, 97, 'ค้างบนตะแกรง', 'font-size="12"') + L(276, 82, 224, 86, GRY, 1) +
    T(262, 150, 'ทรายเล็กกว่ารู', 'font-size="12" font-weight="700"') + T(262, 165, 'ตกลงสู่ภาชนะ', 'font-size="12"') + L(260, 150, 230, 145, GRY, 1) +
    C(180, 24, 'รูตะแกรง', 'font-weight="700"') + arrow('M180 30V96', GRY) +
    C(180, 212, 'ขนาดรูต้องอยู่ระหว่างขนาดของสองสารที่จะแยก', 'font-size="11.5"'));

  /* 8) แม่เหล็กดูดผงเหล็ก */
  F['p6-magnet'] = svg(212,
    'ใช้แม่เหล็กดูดผงเหล็กออกจากทราย',
    R(130, 18, 100, 28, '#fff') + `<rect x="130" y="18" width="50" height="28" fill="${RED}" stroke="currentColor" stroke-width="2"/><rect x="180" y="18" width="50" height="28" fill="${BLUE}" stroke="currentColor" stroke-width="2"/>` +
    C(155, 38, 'N', 'fill="#fff" font-weight="700"') + C(205, 38, 'S', 'fill="#fff" font-weight="700"') +
    [[150, 62], [165, 70], [180, 60], [195, 70], [210, 62]].map(([x, y]) => O(x, y, 3.5, '#1f2937')).join('') +
    `<path d="M70 150Q180 190 290 150V135H70z" fill="#fde68a" stroke="currentColor" stroke-width="2"/>` +
    [[100, 140], [125, 145], [150, 147], [175, 150], [200, 148], [225, 146], [250, 142], [115, 138], [235, 138]].map(([x, y]) => O(x, y, 3, '#d6a756')).join('') +
    [[140, 140], [190, 143], [240, 146]].map(([x, y]) => O(x, y, 3.5, '#1f2937')).join('') +
    T(240, 66, 'ผงเหล็กถูกดูดขึ้นมา', 'font-size="12" font-weight="700"') + L(238, 64, 214, 64, GRY, 1) +
    T(24, 120, 'ทราย', 'font-size="12" font-weight="700"') + T(24, 134, '(ไม่ถูกดูด)', 'font-size="11"') +
    C(180, 202, 'ใช้ได้เมื่อมีสารหนึ่งเป็นสารแม่เหล็ก (เช่น เหล็ก)', 'font-size="11.5"'));

  /* 9) การละลาย: อนุภาคน้ำตาลกระจายระหว่างอนุภาคน้ำ */
  const water = (x0, y0, w, h, seed, avoid) => { let s = ''; for (let gy = y0 + 12, r = 0; gy < y0 + h - 6; gy += 16, r++) for (let gx = x0 + 12 + (r % 2) * 8; gx < x0 + w - 8; gx += 16) { const x = gx + ((gx * 7 + gy * 3 + seed) % 5) - 2, y = gy + ((gx * 5 + gy * 11 + seed) % 5) - 2; if (avoid.some(([ax, ay]) => Math.hypot(ax - x, ay - y) < 12)) continue; s += O(x, y, 3.5, '#93c5fd', '#2563eb'); } return s; };
  const sugL = [[60, 112], [72, 112], [84, 112], [66, 102], [78, 102]], sugR = [[240, 52], [270, 70], [300, 48], [250, 100], [286, 110], [320, 84], [232, 78], [310, 116]];
  F['p6-dissolve'] = svg(190,
    'น้ำตาลละลายในน้ำ: อนุภาคน้ำตาลแยกจากกันและกระจายอยู่ระหว่างอนุภาคน้ำ',
    R(20, 30, 110, 100, '#eff6ff') + water(20, 30, 110, 100, 3, sugL) + sugL.map(([x, y]) => `<rect x="${x - 6}" y="${y - 6}" width="12" height="12" fill="#f9a8d4" stroke="#be185d" stroke-width="1.5"/>`).join('') +
    arrow('M142 80H208', GRY) + C(175, 70, 'คนจนละลาย', 'font-size="11"') +
    R(220, 30, 120, 100, '#eff6ff') + water(220, 30, 120, 100, 11, sugR) + sugR.map(([x, y]) => `<rect x="${x - 5}" y="${y - 5}" width="10" height="10" fill="#f9a8d4" stroke="#be185d" stroke-width="1.5"/>`).join('') +
    C(75, 148, 'ก่อนละลาย', 'font-weight="700"') + C(280, 148, 'หลังละลาย (สารละลาย)', 'font-weight="700"') +
    O(30, 172, 3.5, '#93c5fd', '#2563eb') + T(38, 176, 'อนุภาคน้ำ', 'font-size="11"') + `<rect x="110" y="166" width="10" height="10" fill="#f9a8d4" stroke="#be185d" stroke-width="1.5"/>` + T(126, 176, 'อนุภาคน้ำตาล (ยังเป็นน้ำตาลเหมือนเดิม)', 'font-size="11"') +
    C(180, 16, 'ผสมกันเป็นเนื้อเดียว มองไม่เห็นเกล็ดน้ำตาล', 'font-size="12"'));

  /* 10) เครื่องมือวัดมวลและปริมาตร */
  const ticks = []; for (let v = 0; v <= 100; v += 10) { const y = 170 - v * 1.4; ticks.push(L(110, y, v % 50 === 0 ? 124 : 118, y, 'currentColor', 1.5) + (v % 20 === 0 ? T(128, y + 4, v, 'font-size="10"') : '')); }
  F['p6-measure'] = svg(210,
    'เครื่องมือวัด: กระบอกตวงวัดปริมาตร เครื่องชั่งวัดมวล',
    `<path d="M70 28V170H112V28" fill="none" stroke="currentColor" stroke-width="2.5"/>` + R(60, 170, 62, 8, '#cbd5e1') +
    `<path d="M71 114Q91 120 111 114V169H71z" fill="#bfdbfe" stroke="none"/>` + `<path d="M71 114Q91 120 111 114" fill="none" stroke="${BLUE}" stroke-width="2"/>` + ticks.join('') +
    L(26, 120, 86, 120, RED, 1.5, 'stroke-dasharray="4 3"') + `<ellipse cx="18" cy="120" rx="10" ry="6" fill="#fff" stroke="currentColor" stroke-width="1.5"/>` + O(18, 120, 3, '#1f2937') +
    T(4, 140, 'ตามอง', 'font-size="11"') + T(4, 154, 'ระดับเดียวกัน', 'font-size="11"') +
    C(91, 16, 'กระบอกตวง', 'font-weight="700"') + T(160, 100, 'อ่านที่ท้องน้ำ', 'font-size="11.5" font-weight="700"') + T(160, 114, '= 40 mL', 'font-size="11.5"') + L(158, 104, 114, 116, GRY, 1) +
    R(210, 120, 130, 30, '#e2e8f0') + `<path d="M225 120l10 -22h60l10 22" fill="#fff" stroke="currentColor" stroke-width="2"/>` + R(235, 92, 60, 6, '#94a3b8') +
    R(236, 134, 56, 12, '#dcfce7') + C(264, 144, '250 g', 'font-size="11" font-weight="700"') +
    O(265, 78, 12, '#fbbf24', '#b45309') + C(275, 168, 'เครื่องชั่ง', 'font-weight="700"') + C(275, 184, 'วัดมวล (g, kg)', 'font-size="11"') +
    C(91, 200, 'วัดปริมาตร (mL, cm³)', 'font-size="11"'));

  /* ===== ว 3.2 โลก ดิน หิน ลมฟ้าอากาศ ===== */
  const SKY = '#e0f2fe', LAND = '#bbf7d0', SEA = '#bfdbfe', TAN = '#fcd9a8';
  const nm = (x, y, w, h, fill, t1, t2) => R(x, y, w, h, fill) + C(x + w / 2, y + (t2 ? 17 : 24), t1, 'font-size="13" font-weight="700"') + (t2 ? C(x + w / 2, y + 32, t2, 'font-size="10.5"') : '');

  /* 11) วัฏจักรหิน */
  F['p6-rock-cycle'] = svg(236,
    'วัฏจักรหิน แมกมาเย็นตัวเป็นหินอัคนี ผุพังทับถมเป็นหินตะกอน ความร้อนและความดันทำให้เป็นหินแปร และหลอมเป็นแมกมา',
    nm(246, 14, 100, 40, '#fecaca', 'แมกมา', '(หินหลอมเหลว)') + nm(14, 14, 100, 40, '#fde68a', 'หินอัคนี') + nm(14, 160, 100, 40, '#bbf7d0', 'หินตะกอน') + nm(246, 160, 100, 40, '#ddd6fe', 'หินแปร') +
    arrow('M244 34H118', RED) + C(181, 26, 'เย็นตัวและแข็งตัว', 'font-size="11"') +
    arrow('M64 58V156', GRY) + T(74, 92, 'ผุพัง ถูกพัดพา', 'font-size="11"') + T(74, 108, 'ทับถมเป็นชั้น', 'font-size="11"') + T(74, 124, 'แข็งตัวเป็นหิน', 'font-size="11"') +
    arrow('M118 180H242', ORG) + C(180, 172, 'ความร้อนและความดัน', 'font-size="11"') +
    arrow('M296 156V58', RED) + T(288, 112, 'หลอมเหลว', 'font-size="11" text-anchor="end"') +
    line(112, 58, 250, 158, ORG, true) +
    C(180, 222, 'เส้นประ: หินอัคนีก็เปลี่ยนเป็นหินแปรได้ · หินทุกชนิดผุพังเป็นตะกอนได้', 'font-size="10.5"'));

  /* 12) ลักษณะของหินสี่แบบ */
  (function () {
    const sq = (x, y, id, inner) => `<clipPath id="${id}"><rect x="${x}" y="${y}" width="64" height="64"/></clipPath><g clip-path="url(#${id})">${inner}</g>` + R(x, y, 64, 64, 'none', 'currentColor');
    const blk = (x, y, w, h, fill) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="#334155" stroke-width="0.8"/>`;
    const gx = 10, gy = 14;
    const granite = [[0, 0, 26, 20, '#fbcfe8'], [26, 0, 22, 26, '#f8fafc'], [48, 0, 16, 18, '#475569'], [0, 20, 18, 24, '#475569'], [18, 26, 24, 20, '#fde68a'], [42, 26, 22, 22, '#fbcfe8'], [0, 44, 22, 20, '#f8fafc'], [22, 46, 20, 18, '#fbcfe8'], [42, 48, 22, 16, '#475569']]
      .map(b => blk(gx + b[0], gy + b[1], b[2], b[3], b[4])).join('');
    const px = 188, py = 14;
    let pum = `<rect x="${px}" y="${py}" width="64" height="64" fill="#e5e7eb"/>`;
    [[10, 12, 5], [28, 9, 3], [46, 14, 6], [14, 30, 3.5], [32, 26, 6], [52, 34, 4], [8, 48, 5], [26, 44, 3], [44, 52, 5], [58, 54, 3], [20, 58, 3.5], [38, 36, 3]].forEach(c => { pum += `<circle cx="${px + c[0]}" cy="${py + c[1]}" r="${c[2]}" fill="#fff" stroke="${GRY}" stroke-width="1"/>`; });
    const sx = 10, sy = 116;
    let sand = `<rect x="${sx}" y="${sy}" width="64" height="64" fill="${TAN}"/>`;
    for (let k = 1; k < 5; k++) sand += L(sx, sy + k * 13, sx + 64, sy + k * 13, '#b45309', 1);
    [[8, 6], [22, 8], [40, 5], [54, 9], [12, 19], [30, 21], [48, 18], [8, 32], [26, 34], [44, 31], [58, 36], [14, 45], [34, 47], [52, 44], [20, 58], [42, 60]].forEach(d => { sand += `<circle cx="${sx + d[0]}" cy="${sy + d[1]}" r="1.6" fill="#92400e"/>`; });
    sand += `<path d="M${sx + 28} ${sy + 50}q-14 -4 -12 -16q12 -2 24 0q2 12 -12 16z" fill="#fff" stroke="#78350f" stroke-width="1.5"/>` + L(sx + 28, sy + 50, sx + 24, sy + 36, '#78350f', 1) + L(sx + 28, sy + 50, sx + 30, sy + 36, '#78350f', 1) + L(sx + 28, sy + 50, sx + 36, sy + 38, '#78350f', 1);
    const mx = 188, my = 116;
    let gn = `<rect x="${mx}" y="${my}" width="64" height="64" fill="#e2e8f0"/>`;
    for (let k = 0; k < 6; k++) gn += `<path d="M${mx - 4} ${my + 6 + k * 11}q18 -7 34 0t38 0" fill="none" stroke="${k % 2 ? '#e2e8f0' : '#475569'}" stroke-width="7"/>`;
    const info = (x, y, l1, l2, d) => T(x, y + 12, l1, 'font-size="12" font-weight="700"') + (l2 ? T(x, y + 27, l2, 'font-size="11" font-weight="700"') : '') + d.map((s, i) => T(x, y + (l2 ? 43 : 28) + i * 14, s, 'font-size="10.5"')).join('');
    F['p6-rock-textures'] = svg(204,
      'ลักษณะของหินแกรนิต หินพัมมิซ หินทราย และหินไนส์',
      sq(gx, gy, 'rt1', granite) + sq(px, py, 'rt2', pum) + sq(sx, sy, 'rt3', sand) + sq(mx, my, 'rt4', gn) +
      info(80, 14, 'หินอัคนี', '(แกรนิต)', ['ผลึกใหญ่ มองเห็นชัด', 'แข็ง ทนทาน']) + info(258, 14, 'หินอัคนี', '(พัมมิซ)', ['เนื้อคล้ายแก้ว มีรูพรุน', 'เบา ลอยน้ำได้']) +
      info(80, 116, 'หินตะกอน', '(หินทราย)', ['เป็นเม็ด ๆ ซ้อนเป็นชั้น', 'อาจพบซากดึกดำบรรพ์']) + info(258, 116, 'หินแปร', '(หินไนส์)', ['เป็นแถบ ๆ ขนานกัน', 'ความร้อน+ความดันสูง']));
  })();

  /* 13) ชั้นหินและซากดึกดำบรรพ์ดัชนี */
  (function () {
    const sym = (k, x, y) => k === 'c' ? O(x, y, 7, '#fb923c', '#7c2d12') : k === 's' ? `<rect x="${x - 7}" y="${y - 7}" width="14" height="14" fill="#a78bfa" stroke="#4c1d95" stroke-width="1.5"/>` : `<polygon points="${x},${y - 8} ${x + 8},${y} ${x},${y + 8} ${x - 8},${y}" fill="#f472b6" stroke="#9d174d" stroke-width="1.5"/>`;
    const lay = (x, y, f, k) => R(x, y, 110, 44, f) + sym(k, x + 55, y + 22);
    F['p6-strata'] = svg(250,
      'ชั้นหินสองบริเวณ ซากดึกดำบรรพ์ดัชนีชนิดเดียวกันแสดงว่าชั้นหินมีอายุเท่ากัน ชั้นล่างอายุมากกว่าชั้นบน',
      C(120, 17, 'บริเวณที่ 1', 'font-size="12" font-weight="700"') + C(290, 17, 'บริเวณที่ 2', 'font-size="12" font-weight="700"') +
      lay(65, 24, '#fde68a', 's') + lay(65, 68, '#fed7aa', 'c') + lay(65, 112, '#fbcfe8', 'd') +
      lay(235, 112, '#fed7aa', 'c') + lay(235, 156, '#fbcfe8', 'd') +
      L(175, 90, 235, 134, RED, 1.5, 'stroke-dasharray="4 3"') + L(175, 134, 235, 178, RED, 1.5, 'stroke-dasharray="4 3"') + T(184, 70, 'ซากเหมือนกัน', `font-size="11" font-weight="700" fill="${RED}"`) + T(184, 84, 'อายุเท่ากัน', `font-size="11" font-weight="700" fill="${RED}"`) +
      arrow('M26 180V30', GRY) + T(2, 196, 'อายุมาก', 'font-size="10.5"') + T(2, 24, 'อายุน้อย', 'font-size="10.5"') +
      C(180, 222, 'รูปร่างเดียวกัน = ซากดึกดำบรรพ์ดัชนีชนิดเดียวกัน', 'font-size="10.5"') + C(180, 242, 'ชั้นหินวางตัวปกติ: ชั้นล่างแก่กว่า ชั้นบนอ่อนกว่า', 'font-size="10.5"'));
  })();

  /* ===== ว 3.2 (ต่อ) ซากดึกดำบรรพ์ ลม วัฏจักรน้ำ หยาดน้ำฟ้า ฤดู เรือนกระจก ===== */
  const SAND = '#fde68a', DARK = '#64748b';
  const fishBones = (x, y, s = 1, col = '#fff') => `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="0" rx="16" ry="6" fill="none" stroke="${col}" stroke-width="2"/>${L(-12, 0, 10, 0, col, 2)}${L(-6, -5, -6, 5, col, 1.5)}${L(0, -6, 0, 6, col, 1.5)}${L(6, -5, 6, 5, col, 1.5)}<polygon points="16,0 26,-8 26,8" fill="none" stroke="${col}" stroke-width="2"/></g>`;

  /* 14) การเกิดซากดึกดำบรรพ์ 4 ขั้น */
  (function () {
    const pn = (x, n) => R(x, 10, 84, 100, '#e0f2fe') + `<circle cx="${x + 11}" cy="22" r="9" fill="#fff" stroke="currentColor" stroke-width="1.5"/>` + C(x + 11, 26, n, 'font-size="11" font-weight="700"');
    const cap = (x, a, b) => C(x + 42, 128, a, 'font-size="10.5"') + C(x + 42, 142, b, 'font-size="10.5"');
    F['p6-fossil-steps'] = svg(152,
      'ขั้นตอนการเกิดซากดึกดำบรรพ์ สัตว์จมลง ตะกอนทับถม กลายเป็นหิน แล้วถูกพบเมื่อหินสึกกร่อน',
      pn(3, 1) + R(3, 82, 84, 28, SAND) + fishBones(45, 76, 0.9, '#334155') + pn(93, 2) + R(93, 82, 84, 28, SAND) + R(93, 56, 84, 26, '#fdba74') + fishBones(135, 78, 0.9, '#334155') + L(93, 56, 177, 56, '#334155', 1) +
      pn(183, 3) + R(183, 40, 84, 70, '#cbd5e1') + R(183, 70, 84, 40, '#94a3b8') + fishBones(225, 96, 0.9, '#f8fafc') + pn(273, 4) + `<path d="M273 110V70L291 58L309 66L330 50L357 62V110Z" fill="#cbd5e1" stroke="currentColor" stroke-width="2"/>` + fishBones(322, 84, 0.8, '#334155') +
      cap(3, 'สัตว์ตาย', 'จมลงก้นน้ำ') + cap(93, 'ตะกอนทับถม', 'ปิดทับซาก') + cap(183, 'นานล้านปี', 'กลายเป็นหิน') + cap(273, 'หินสึกกร่อน', 'พบซากดึกดำบรรพ์'));
  })();

  /* 15) ลมบกและลมทะเล */
  (function () {
    const panel = (y0, day) => {
      const land = R(0, y0 + 96, 170, 28, TAN, 'currentColor') + C(85, y0 + 114, day ? 'พื้นดิน (ร้อนเร็ว)' : 'พื้นดิน (เย็นเร็ว)', 'font-size="10.5"');
      const sea = R(170, y0 + 96, 190, 28, SEA, 'currentColor') + C(265, y0 + 114, day ? 'ทะเล (ร้อนช้า)' : 'ทะเล (เย็นช้า)', 'font-size="10.5"');
      const lx = day ? [50, 100] : [240, 300], hx = day ? 265 : 85;
      const rise = lx.map(x => arrow(`M${x} ${y0 + 90}V${y0 + 44}`, ORG)).join('');
      const wind = day ? arrow(`M340 ${y0 + 80}H132`, BLUE) + C(236, y0 + 72, 'ลมทะเล (ทะเล → บก)', `font-size="11" font-weight="700" fill="${BLUE}"`) : arrow(`M20 ${y0 + 80}H228`, BLUE) + C(124, y0 + 72, 'ลมบก (บก → ทะเล)', `font-size="11" font-weight="700" fill="${BLUE}"`);
      const body = day ? `<circle cx="338" cy="${y0 + 24}" r="10" fill="#fde047" stroke="#ca8a04" stroke-width="1.5"/>` : `<circle cx="330" cy="${y0 + 24}" r="11" fill="#e2e8f0" stroke="${DARK}" stroke-width="1.5"/><circle cx="336" cy="${y0 + 21}" r="10" fill="#e0f2fe"/>`;
      return land + sea + rise + wind + body +
        T(6, y0 + 14, day ? 'ลมทะเล: เกิดตอนกลางวัน' : 'ลมบก: เกิดตอนกลางคืน', 'font-size="12" font-weight="700"') +
        C(lx[0] + (day ? 25 : 0), y0 + 38, 'ความกดอากาศต่ำ', `font-size="10.5" fill="${ORG}" font-weight="700"`) + C(hx, y0 + 38, 'ความกดอากาศสูง', `font-size="10.5" fill="${BLUE}" font-weight="700"`) +
        T(day ? lx[1] + 8 : lx[0] - 100, y0 + 56, 'อากาศอุ่นลอยขึ้น', `font-size="10.5" fill="${ORG}"`);
    };
    F['p6-breeze'] = svg(262,
      'ลมทะเลกลางวัน พื้นดินร้อนกว่า อากาศเหนือบกลอยขึ้น ลมพัดจากทะเลเข้าหาบก ลมบกกลางคืน ทะเลอุ่นกว่า ลมพัดจากบกออกสู่ทะเล',
      panel(0, true) + L(0, 131, 360, 131, GRY, 1, 'stroke-dasharray="4 4"') + panel(136, false));
  })();

  /* 16) ศรลมและทิศ */
  (function () {
    const cx = 180, cy = 112, r = 56, d = 40;
    let ticks = '';
    for (let a = 0; a < 360; a += 45) { const rad = a * Math.PI / 180, x1 = cx + (r - 6) * Math.sin(rad), y1 = cy - (r - 6) * Math.cos(rad), x2 = cx + r * Math.sin(rad), y2 = cy - r * Math.cos(rad); ticks += L(x1.toFixed(1), y1.toFixed(1), x2.toFixed(1), y2.toFixed(1), 'currentColor', 2); }
    F['p6-windvane'] = svg(226,
      'ศรลมหันหัวลูกศรไปทางที่ลมพัดมา หัวลูกศรชี้ทิศตะวันตกเฉียงเหนือ แสดงว่าลมพัดมาจากทิศตะวันตกเฉียงเหนือ',
      `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#f8fafc" stroke="currentColor" stroke-width="2"/>` + ticks +
      C(cx, cy - r - 8, 'เหนือ', 'font-size="12" font-weight="700"') + C(cx, cy + r + 18, 'ใต้', 'font-size="12" font-weight="700"') + T(cx + r + 8, cy + 4, 'ตะวันออก', 'font-size="12" font-weight="700"') + T(cx - r - 8, cy + 4, 'ตะวันตก', 'font-size="12" font-weight="700" text-anchor="end"') +
      arrow(`M${cx + d * 0.6} ${cy + d * 0.6}L${cx - d} ${cy - d}`, RED) + L(cx + d * 0.6, cy + d * 0.6, cx + d * 0.6 + 12, cy + d * 0.6 - 4, RED, 2.5) + L(cx + d * 0.6, cy + d * 0.6, cx + d * 0.6 + 4, cy + d * 0.6 - 12, RED, 2.5) + O(cx, cy, 4, '#fff', 'currentColor') +
      T(6, 20, 'หัวลูกศรชี้ไปทางทิศตะวันตกเฉียงเหนือ', `font-size="11" fill="${RED}" font-weight="700"`) + line(120, 26, cx - d - 4, cy - d - 4, RED) +
      C(180, 202, 'ลมพัดมาจากทิศตะวันตกเฉียงเหนือ (พัดไปทางตะวันออกเฉียงใต้)', 'font-size="11" font-weight="700"') + C(180, 218, 'บ้านที่ลมพัดเข้าหน้าบ้าน = หน้าบ้านหันไปทางทิศที่ลมพัดมา', 'font-size="10.5"'));
  })();

  /* 17) วัฏจักรน้ำ */
  F['p6-watercycle'] = svg(262,
    'วัฏจักรน้ำ น้ำระเหยจากทะเลและพืชคายน้ำ ควบแน่นเป็นเมฆ ตกเป็นฝน ไหลลงทะเลและซึมลงใต้ดิน',
    R(0, 0, 360, 262, SKY, 'none') + `<circle cx="32" cy="30" r="12" fill="#fde047" stroke="#ca8a04" stroke-width="1.5"/>` + C(32, 54, 'ดวงอาทิตย์', 'font-size="10.5"') +
    `<path d="M0 262V160L70 108L130 156L210 186V262Z" fill="${LAND}" stroke="currentColor" stroke-width="2"/>` + R(210, 186, 150, 76, SEA, 'currentColor') + C(285, 250, 'ทะเล', 'font-size="11" font-weight="700"') +
    L(0, 232, 210, 232, '#78350f', 1.5, 'stroke-dasharray="5 3"') + T(8, 250, 'น้ำใต้ดิน', 'font-size="10.5"') +
    `<ellipse cx="165" cy="46" rx="40" ry="16" fill="#fff" stroke="${DARK}" stroke-width="2"/><ellipse cx="140" cy="54" rx="26" ry="12" fill="#fff" stroke="${DARK}" stroke-width="2"/><ellipse cx="192" cy="56" rx="28" ry="12" fill="#fff" stroke="${DARK}" stroke-width="2"/><ellipse cx="166" cy="56" rx="40" ry="10" fill="#fff"/>` + C(165, 22, 'ควบแน่นเป็นเมฆ', `font-size="11" font-weight="700"`) +
    arrow('M300 182V110Q300 78 232 62', ORG) + T(308, 150, 'ระเหย', `font-size="11" font-weight="700" fill="${ORG}"`) +
    `<rect x="27" y="124" width="6" height="12" fill="#92400e"/><circle cx="30" cy="118" r="11" fill="#4ade80" stroke="#166534" stroke-width="1.5"/>` + arrow('M30 104V80', ORG) + T(38, 84, 'พืชคายน้ำ', `font-size="10.5" font-weight="700" fill="${ORG}"`) +
    arrow('M148 76V108', BLUE) + arrow('M168 76V116', BLUE) + arrow('M188 76V124', BLUE) + T(198, 100, 'ฝนตก', `font-size="11" font-weight="700" fill="${BLUE}"`) +
    arrow('M92 134L130 168L200 196', BLUE) + T(112, 214, 'น้ำไหลบนผิวดิน', 'font-size="10.5"') + arrow('M54 164V222', BLUE) + T(60, 200, 'ซึมลงใต้ดิน', 'font-size="10.5"'));

  /* 18) หยาดน้ำฟ้า ฝน หิมะ ลูกเห็บ */
  (function () {
    const drop = (x, y) => `<path d="M${x} ${y - 10}q8 12 0 18q-8 -6 0 -18z" fill="#60a5fa" stroke="${BLUE}" stroke-width="1.5"/>`;
    let snow = '';
    for (let a = 0; a < 180; a += 60) { const r = a * Math.PI / 180, dx = 16 * Math.cos(r), dy = 16 * Math.sin(r); snow += L(180 - dx, 168 - dy, 180 + dx, 168 + dy, '#38bdf8', 2.5); for (const s of [-1, 1]) { const bx = 180 + s * dx * 0.55, by = 168 + s * dy * 0.55; snow += L(bx, by, bx + 6 * Math.cos(r + 1), by + 6 * Math.sin(r + 1), '#38bdf8', 1.5) + L(bx, by, bx + 6 * Math.cos(r - 1), by + 6 * Math.sin(r - 1), '#38bdf8', 1.5); } }
    const hail = (x, y, k = 1) => `<circle cx="${x}" cy="${y}" r="${16 * k}" fill="#e0f2fe" stroke="${DARK}" stroke-width="2"/><circle cx="${x}" cy="${y}" r="${11 * k}" fill="#fff" stroke="${DARK}" stroke-width="1.5"/><circle cx="${x}" cy="${y}" r="${6 * k}" fill="#bae6fd" stroke="${DARK}" stroke-width="1.5"/>`;
    F['p6-hail'] = svg(258,
      'ลูกเห็บเกิดในเมฆฝนฟ้าคะนองที่มีลมขึ้นลงแรง ก้อนน้ำแข็งพอกเป็นชั้น เปรียบเทียบฝน หิมะ ลูกเห็บ',
      `<ellipse cx="130" cy="48" rx="80" ry="28" fill="#94a3b8" stroke="${DARK}" stroke-width="2"/><ellipse cx="78" cy="62" rx="38" ry="20" fill="#94a3b8" stroke="${DARK}" stroke-width="2"/><ellipse cx="184" cy="64" rx="40" ry="20" fill="#94a3b8" stroke="${DARK}" stroke-width="2"/><ellipse cx="130" cy="66" rx="80" ry="16" fill="#94a3b8"/>` +
      C(130, 12, 'เมฆฝนฟ้าคะนอง', 'font-size="11" font-weight="700"') + arrow('M70 122V82', RED) + arrow('M92 122V82', RED) + T(10, 134, 'ลมพัดขึ้นแรง', `font-size="10.5" fill="${RED}" font-weight="700"`) + arrow('M168 82V122', BLUE) + arrow('M190 82V122', BLUE) + T(168, 134, 'ลมพัดลง', `font-size="10.5" fill="${BLUE}" font-weight="700"`) +
      hail(246, 70, 1.4) + T(212, 108, 'ก้อนน้ำแข็งพอก', 'font-size="10.5" font-weight="700"') + T(214, 122, 'เป็นชั้น ๆ', 'font-size="10.5" font-weight="700"') +
      L(14, 146, 346, 146, GRY, 1, 'stroke-dasharray="4 4"') +
      drop(60, 166) + drop(78, 176) + drop(48, 182) + snow + hail(300, 170, 0.9) +
      C(64, 206, 'ฝน', 'font-size="12" font-weight="700"') + C(64, 220, 'หยดน้ำรวมกัน', 'font-size="10.5"') + C(64, 233, 'จนหนักแล้วตก', 'font-size="10.5"') +
      C(180, 206, 'หิมะ', 'font-size="12" font-weight="700"') + C(180, 220, 'ผลึกน้ำแข็งสีขาว', 'font-size="10.5"') + C(180, 233, 'เกิดในอากาศเย็นจัด', 'font-size="10.5"') +
      C(300, 206, 'ลูกเห็บ', 'font-size="12" font-weight="700"') + C(300, 220, 'น้ำแข็งพอกเป็นชั้น', 'font-size="10.5"') + C(300, 233, 'ในเมฆฝนฟ้าคะนอง', 'font-size="10.5"'));
  })();

  /* 19) ปริมาณน้ำฝนรายเดือนกับฤดู */
  (function () {
    const rain = [10, 20, 35, 90, 210, 180, 170, 200, 330, 250, 60, 10], mon = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const bx = i => 40 + i * 26, by = v => 200 - v * 0.42;
    let bars = '', lab = '', ticks = '';
    rain.forEach((v, i) => { bars += `<rect x="${bx(i) + 4}" y="${by(v)}" width="18" height="${v * 0.42}" fill="#60a5fa" stroke="${BLUE}" stroke-width="1"/>`; lab += C(bx(i) + 13, 214, mon[i], 'font-size="9"'); });
    for (let v = 0; v <= 400; v += 100) ticks += L(36, by(v), 40, by(v), 'currentColor', 1.5) + T(8, by(v) + 4, v, 'font-size="10"') + (v ? L(40, by(v), 352, by(v), '#cbd5e1', 1, 'stroke-dasharray="3 4"') : '');
    const band = (x1, x2, f, t) => R(x1, 222, x2 - x1, 16, f, 'currentColor').replace('stroke-width="2"', 'stroke-width="1"') + C((x1 + x2) / 2, 234, t, 'font-size="10.5" font-weight="700"');
    F['p6-rain-chart'] = svg(284,
      'ตัวอย่างปริมาณน้ำฝนรายเดือน ช่วงฤดูฝนมีฝนมาก ช่วงฤดูหนาวและฤดูร้อนมีฝนน้อย',
      L(40, 200, 352, 200, 'currentColor', 2) + L(40, 200, 40, 30, 'currentColor', 2) + ticks + bars + lab + C(196, 16, 'ปริมาณน้ำฝนรายเดือน (มม.) · ตัวเลขสมมติ', 'font-size="11" font-weight="700"') +
      band(40, 79, '#bfdbfe', 'หนาว') + band(79, 157, '#fecaca', 'ร้อน') + band(157, 287, '#bbf7d0', 'ฝน') + band(287, 352, '#bfdbfe', 'หนาว') +
      C(196, 256, 'ฤดูฝน: มรสุมตะวันตกเฉียงใต้ พาความชื้นเข้ามา ฝนมาก', 'font-size="10.5"') + C(196, 272, 'ฤดูหนาว: มรสุมตะวันออกเฉียงเหนือ พาอากาศเย็นและแห้งเข้ามา ฝนน้อย', 'font-size="10.5"'));
  })();

  /* 20) ปรากฏการณ์เรือนกระจก */
  F['p6-greenhouse'] = svg(278,
    'ปรากฏการณ์เรือนกระจก แสงอาทิตย์ผ่านบรรยากาศ พื้นโลกปล่อยความร้อน แก๊สเรือนกระจกดูดกลืนและส่งกลับลงมาบางส่วน',
    R(0, 0, 360, 278, '#f1f5f9', 'none') + `<circle cx="26" cy="26" r="13" fill="#fde047" stroke="#ca8a04" stroke-width="1.5"/>` + T(46, 22, 'แสงอาทิตย์', 'font-size="11" font-weight="700"') +
    `<rect x="0" y="92" width="360" height="62" fill="#ede9fe"/>` + (() => { let s = ''; [[24, 106], [70, 132], [112, 108], [160, 138], [205, 110], [250, 134], [296, 108], [336, 132], [140, 114], [226, 128]].forEach(p => { s += O(p[0], p[1], 4, '#a78bfa', '#5b21b6'); }); return s; })() +
    T(72, 86, '● แก๊สเรือนกระจกในชั้นบรรยากาศ', 'font-size="10.5" font-weight="700"') +
    R(0, 214, 360, 40, '#86efac', 'currentColor') + C(180, 238, 'พื้นผิวโลก', 'font-size="12" font-weight="700"') +
    arrow('M30 44L64 208', ORG) + T(72, 190, 'แสงส่องลงมา', `font-size="10.5" fill="${ORG}" font-weight="700"`) +
    arrow('M150 210V160', RED) + T(158, 194, 'ความร้อนจากโลก', `font-size="10.5" fill="${RED}" font-weight="700"`) +
    arrow('M330 210V24', RED) + T(322, 52, 'ความร้อนส่วนหนึ่ง', `font-size="10.5" fill="${RED}" font-weight="700" text-anchor="end"`) + T(322, 66, 'หลุดออกสู่อวกาศ', `font-size="10.5" fill="${RED}" font-weight="700" text-anchor="end"`) +
    arrow('M250 158V206', RED, 'stroke-dasharray="5 3"') + T(258, 180, 'ส่งกลับ', `font-size="10.5" fill="${RED}" font-weight="700"`) + T(258, 194, 'ลงมา', `font-size="10.5" fill="${RED}" font-weight="700"`) +
    C(180, 270, 'ความร้อนจากพื้นโลกถูกแก๊สดูดกลืน แล้วส่งกลับลงมาบางส่วน → โลกอุ่นขึ้น', 'font-size="10.5" font-weight="700"'));

  /* 21) สึนามิ */
  F['p6-tsunami'] = svg(214,
    'สึนามิเกิดจากแผ่นดินไหวใต้ทะเล คลื่นยักษ์เข้าชายฝั่ง ให้หนีไปที่สูงห่างชายหาด',
    R(0, 0, 360, 214, SKY, 'none') + `<path d="M0 90Q40 80 80 90T160 90T230 92L215 150L175 170H0Z" fill="${SEA}"/>` + `<path d="M0 170H175L215 150H360V214H0Z" fill="#d6b88a" stroke="currentColor" stroke-width="2"/>` +
    `<polygon points="30,176 36,162 42,176 52,172 38,190 26,184" fill="#facc15" stroke="${RED}" stroke-width="1.5"/>` + T(58, 188, 'แผ่นดินไหวใต้ทะเล', 'font-size="10.5" font-weight="700"') +
    `<path d="M86 156Q120 112 160 156" fill="#93c5fd" stroke="${BLUE}" stroke-width="2"/>` + arrow('M100 128H168', BLUE) + T(98, 108, 'คลื่นยักษ์พัดเข้าฝั่ง', `font-size="10.5" fill="${BLUE}" font-weight="700"`) +
    `<path d="M215 150L280 80L360 120V150Z" fill="#86efac" stroke="currentColor" stroke-width="2"/>` + T(250, 70, 'ที่สูง (ปลอดภัย)', `font-size="10.5" fill="${GRN}" font-weight="700"`) +
    O(234, 128, 4, '#fde68a', 'currentColor') + L(234, 132, 234, 142, 'currentColor', 2) + arrow('M240 126L268 104', GRN) + C(262, 178, 'หนีไปที่สูง ห่างจากชายหาดทันที', `font-size="10.5" font-weight="700" fill="${GRN}"`) +
    C(180, 204, 'ไม่ควรหลบอยู่ริมชายหาดหรือหลังก้อนหินใกล้ชายหาด', `font-size="10.5" fill="${RED}"`));

  /* 22) น้ำบนโลก */
  F['p6-water-share'] = svg(186,
    'น้ำบนโลกเป็นน้ำเค็มประมาณ 97 เปอร์เซ็นต์ น้ำจืดประมาณ 3 เปอร์เซ็นต์ และน้ำจืดส่วนใหญ่เป็นน้ำแข็ง',
    C(180, 16, 'น้ำทั้งหมดบนโลก (ประมาณ)', 'font-size="12" font-weight="700"') + R(20, 26, 310, 26, SEA, 'currentColor') + R(330, 26, 10, 26, '#34d399', 'currentColor') + C(175, 44, 'น้ำเค็ม ประมาณ 97%', 'font-size="12" font-weight="700"') + L(335, 54, 335, 70, GRN, 1.5) + T(184, 80, 'น้ำจืด ประมาณ 3%', `font-size="11" font-weight="700" fill="${GRN}"`).replace('x="184"', 'x="226"') +
    C(180, 104, 'น้ำจืดทั้งหมด (ขยาย)', 'font-size="12" font-weight="700"') + R(20, 112, 206, 26, '#e0f2fe', 'currentColor') + R(226, 112, 104, 26, '#6ee7b7', 'currentColor') + C(123, 130, 'น้ำแข็ง ธารน้ำแข็ง (ส่วนใหญ่)', 'font-size="10.5" font-weight="700"') + C(278, 130, 'น้ำใต้ดิน อื่น ๆ', 'font-size="10.5" font-weight="700"') +
    C(180, 158, 'น้ำที่ใช้ประโยชน์ได้ง่าย (แม่น้ำ ทะเลสาบ น้ำบาดาล) มีน้อยมาก', 'font-size="10.5"') + C(180, 174, 'จึงต้องช่วยกันใช้น้ำอย่างประหยัด', 'font-size="10.5" font-weight="700"'));

  /* ===== ว 2.2 แรงและการเคลื่อนที่ ===== */
  /* 23) แรงโน้มถ่วงชี้ลงเสมอ น้ำหนักเท่ากันเมื่อมวลเท่ากัน */
  F['p6-gravity'] = svg(226,
    'วัตถุมวลเท่ากันขนาดต่างกันถูกโลกดึงด้วยแรงเท่ากัน และแรงโน้มถ่วงชี้ลงเสมอแม้เครื่องบินกำลังบิน',
    C(88, 16, 'มวลเท่ากัน ขนาดต่างกัน', 'font-size="12" font-weight="700"') + C(272, 16, 'เครื่องบินกำลังบิน', 'font-size="12" font-weight="700"') +
    O(56, 58, 13, '#94a3b8', 'currentColor') + `<ellipse cx="120" cy="58" rx="28" ry="20" fill="#86efac" stroke="#166534" stroke-width="2"/>` +
    arrow('M56 74V138', BLUE) + arrow('M120 80V138', BLUE) + R(10, 142, 164, 12, '#a7f3d0') + C(92, 152, 'พื้นโลก', 'font-size="9.5"') +
    C(56, 172, 'ก้อนหิน', 'font-size="11"') + C(120, 172, 'ถุงใบไม้', 'font-size="11"') +
    `<ellipse cx="272" cy="60" rx="38" ry="9" fill="#fff" stroke="currentColor" stroke-width="2"/><polygon points="262,58 252,40 282,58" fill="#e2e8f0" stroke="currentColor" stroke-width="2"/><polygon points="236,56 228,44 244,54" fill="#e2e8f0" stroke="currentColor" stroke-width="2"/>` +
    arrow('M314 60H348', GRN) + T(300, 44, 'ไปทางนี้', `font-size="10" fill="${GRN}" font-weight="700"`) + arrow('M272 74V138', BLUE) + R(190, 142, 164, 12, '#a7f3d0') + C(272, 152, 'พื้นโลก', 'font-size="9.5"') +
    T(286, 108, 'แรงโน้มถ่วง', `font-size="10.5" font-weight="700" fill="${BLUE}"`) + T(286, 122, 'ชี้ลงเสมอ', `font-size="10.5" font-weight="700" fill="${BLUE}"`) +
    C(88, 192, 'โลกดึงด้วยแรงเท่ากัน', `font-size="10.5" font-weight="700" fill="${BLUE}"`) + C(88, 206, 'น้ำหนักเท่ากัน เพราะมวลเท่ากัน', 'font-size="10.5"') +
    C(272, 192, 'ไม่ว่าวัตถุจะนิ่งหรือเคลื่อนที่', 'font-size="10.5" font-weight="700"') + C(272, 206, 'แรงโน้มถ่วงก็ยังชี้ลง', 'font-size="10.5"'));

  /* 24) เครื่องชั่งสปริง */
  (function () {
    const sy = v => 30 + v * 2.2;
    let ticks = '';
    for (let v = 0; v <= 50; v += 10) ticks += L(150, sy(v), 162, sy(v), 'currentColor', 1.5) + T(128, sy(v) + 4, v, 'font-size="10.5"');
    F['p6-spring-scale'] = svg(262,
      'เครื่องชั่งสปริงวัดน้ำหนักของวัตถุ อ่านค่าที่ตัวชี้ หน่วยเป็นนิวตัน',
      `<path d="M176 6V16" stroke="currentColor" stroke-width="3"/><circle cx="176" cy="6" r="4" fill="none" stroke="currentColor" stroke-width="2"/>` +
      `<rect x="146" y="18" width="62" height="140" rx="6" fill="#f8fafc" stroke="currentColor" stroke-width="2.5"/>` + ticks + L(168, 30, 168, 140, '#cbd5e1', 1) +
      `<polygon points="170,${sy(30)} 188,${sy(30) - 5} 188,${sy(30) + 5}" fill="${RED}"/>` + L(188, sy(30), 206, sy(30), RED, 2) + `<path d="M176 158V176" stroke="currentColor" stroke-width="3"/><path d="M168 176H184V184H168Z" fill="none" stroke="currentColor" stroke-width="2"/>` +
      `<path d="M176 184V196" stroke="currentColor" stroke-width="2"/><path d="M140 196H212L222 230H130Z" fill="#fde68a" stroke="#92400e" stroke-width="2.5"/>` + C(176, 218, 'กระสอบหิน', 'font-size="11" font-weight="700"') +
      T(224, sy(30) - 6, 'ตัวชี้', `font-size="11" font-weight="700" fill="${RED}"`) + T(224, sy(30) + 8, 'อ่านได้ 30 N', `font-size="11" font-weight="700" fill="${RED}"`) +
      T(4, 48, 'วัดน้ำหนัก = แรงที่โลก', 'font-size="10.5"') + T(4, 62, 'ดึงวัตถุ หน่วยเป็น', 'font-size="10.5"') + T(4, 76, 'นิวตัน (N)', 'font-size="10.5" font-weight="700"') +
      T(4, 108, 'แขวนให้นิ่งก่อน', 'font-size="10.5"') + T(4, 122, 'แล้วอ่านค่า โดยให้', 'font-size="10.5"') + T(4, 136, 'ตาอยู่ระดับเดียว', 'font-size="10.5"') + T(4, 150, 'กับตัวชี้', 'font-size="10.5"') +
      C(180, 252, 'ค่ามาก = วัตถุถูกโลกดึงแรงมาก (น้ำหนักมาก)', 'font-size="10.5" font-weight="700"'));
  })();

  /* 25) แรงลัพธ์ของแรงในแนวเดียวกัน */
  (function () {
    const U = 6, bx = 190, bw = 56;
    const row = (y, left, right, lines) => R(bx, y, bw, 30, '#fde68a') + right.map((n, i) => arrow(`M${bx + bw} ${y + 9 + i * 12}H${bx + bw + n * U}`, BLUE) + T(bx + bw + n * U + 4, y + 13 + i * 12, n + ' N', `font-size="10.5" font-weight="700" fill="${BLUE}"`)).join('') + left.map((n, i) => arrow(`M${bx} ${y + 9 + i * 12}H${bx - n * U}`, ORG) + T(bx - n * U - 28, y + 13 + i * 12, n + ' N', `font-size="10.5" font-weight="700" fill="${ORG}"`)).join('') + lines.map((s, i) => T(8, y + 8 + i * 13, s, i < 2 ? 'font-size="11" font-weight="700"' : `font-size="10.5" font-weight="700" fill="${RED}"`)).join('');
    F['p6-force-sum'] = svg(272,
      'แรงในแนวเดียวกัน ทิศเดียวกันรวมกัน ทิศตรงข้ามหักล้างกัน แรงลัพธ์เป็นศูนย์วัตถุอยู่นิ่ง',
      row(16, [], [10, 5], ['ทิศเดียวกัน', '', 'ลัพธ์ = 10 + 5', '= 15 N ไปขวา']) + row(94, [8], [8], ['ทิศตรงข้าม', 'เท่ากัน', 'ลัพธ์ = 0', '(วัตถุนิ่ง)']) + row(172, [7], [3], ['ทิศตรงข้าม', 'ไม่เท่ากัน', 'ลัพธ์ = 7 − 3', '= 4 N ไปซ้าย']) +
      L(8, 82, 352, 82, '#cbd5e1', 1, 'stroke-dasharray="4 4"') + L(8, 160, 352, 160, '#cbd5e1', 1, 'stroke-dasharray="4 4"') +
      C(180, 242, 'ขวา = ลูกศรน้ำเงิน · ซ้าย = ลูกศรส้ม · ลูกศรยาว = แรงมาก', 'font-size="10.5"') + C(180, 260, 'แรงลัพธ์ = 0 → วัตถุที่อยู่นิ่งยังนิ่ง', `font-size="11" font-weight="700" fill="${RED}"`));
  })();

  /* 26) แรงเสียดทาน */
  F['p6-friction'] = svg(300,
    'ผิวหยาบเกิดแรงเสียดทานมากวัตถุไปได้ใกล้ ผิวลื่นแรงเสียดทานน้อยไปได้ไกล และกล่องที่ยังนิ่งมีแรงเสียดทานเท่ากับแรงดัน',
    C(180, 14, 'ผลักด้วยความเร็วเริ่มต้นเท่ากัน แล้วปล่อยให้เลื่อนเอง', 'font-size="11" font-weight="700"') +
    R(10, 50, 340, 8, '#d6d3d1') + R(20, 34, 22, 16, '#fde68a') + R(112, 34, 22, 16, '#fef3c7', 'currentColor', 'stroke-dasharray="3 2"') + arrow('M44 42H108', BLUE) +
    C(180, 76, 'พื้นยาง (ผิวหยาบ): ไปได้ใกล้ → แรงเสียดทานมาก', `font-size="11" font-weight="700" fill="${RED}"`) +
    R(10, 110, 340, 8, '#bae6fd') + R(20, 94, 22, 16, '#fde68a') + R(292, 94, 22, 16, '#fef3c7', 'currentColor', 'stroke-dasharray="3 2"') + arrow('M44 102H288', BLUE) +
    C(180, 136, 'พื้นกระจก (ผิวเรียบ): ไปได้ไกล → แรงเสียดทานน้อย', `font-size="11" font-weight="700" fill="${GRN}"`) +
    L(8, 152, 352, 152, '#cbd5e1', 1, 'stroke-dasharray="4 4"') +
    C(180, 172, 'กล่องยังนิ่งอยู่', 'font-size="11" font-weight="700"') +
    R(150, 186, 64, 38, '#fde68a') + R(110, 224, 144, 8, '#d6d3d1') + arrow('M80 205H146', BLUE) + T(8, 200, 'ดัน 3 N', `font-size="11" font-weight="700" fill="${BLUE}"`) + T(8, 214, '(ไปทางขวา)', `font-size="10" fill="${BLUE}"`) +
    arrow('M210 244H150', RED) + T(220, 242, 'แรงเสียดทาน 3 N', `font-size="11" font-weight="700" fill="${RED}"`) + T(220, 256, '(ไปทางซ้าย)', `font-size="10" fill="${RED}"`) +
    C(180, 280, 'แรงเสียดทานเกิดที่ผิวสัมผัส ต้านการเคลื่อนที่ ทิศตรงข้ามแรงที่พยายามทำให้เคลื่อน', 'font-size="10"') + C(180, 294, 'กล่องนิ่ง → แรงลัพธ์ = 0 → แรงเสียดทาน = แรงดัน', 'font-size="10.5" font-weight="700"'));

  /* 27) แรงเสียดทานเมื่อมีแรงดันสองแรง (ภาพสรุปการหาแรงเสียดทาน) */
  F['p6-friction-two'] = svg(176,
    'กล่องอยู่นิ่ง ถูกดัน 3 นิวตันไปทางขวาและ 7 นิวตันไปทางซ้าย แรงลัพธ์จากการดัน 4 นิวตันไปทางซ้าย แรงเสียดทาน 4 นิวตันไปทางขวา',
    R(130, 40, 70, 40, '#fde68a') + R(100, 80, 130, 8, '#d6d3d1') + arrow('M78 52H126', BLUE) + T(8, 56, 'ดำ 3 N', `font-size="10.5" font-weight="700" fill="${BLUE}"`) + arrow('M316 52H204', ORG) + T(318, 40, 'แดง 7 N', `font-size="10.5" font-weight="700" fill="${ORG}"`).replace('x="318"', 'x="296"') +
    arrow('M152 108H206', RED) + T(212, 112, 'แรงเสียดทาน 4 N (ขวา)', `font-size="10.5" font-weight="700" fill="${RED}"`) +
    C(180, 142, 'แรงดันสองแรงรวมกัน: 7 − 3 = 4 N ไปทางซ้าย', 'font-size="10.5"') + C(180, 158, 'กล่องนิ่ง → แรงเสียดทาน 4 N ตรงข้าม (ไปทางขวา)', 'font-size="10.5" font-weight="700"') + C(180, 14, 'ตัวอย่าง: ดันกล่องจากสองด้าน', 'font-size="11" font-weight="700"'));

  /* 28) ประจุไฟฟ้าจากการถู */
  F['p6-charge-rub'] = svg(204,
    'ถูแท่งกับผ้า อิเล็กตรอนซึ่งเป็นประจุลบย้ายจากแท่งไปผ้า แท่งมีประจุบวก ผ้ามีประจุลบ',
    C(90, 14, 'ก่อนถู: เป็นกลาง', 'font-size="11" font-weight="700"') + C(270, 14, 'หลังถู: เกิดประจุ', 'font-size="11" font-weight="700"') +
    R(14, 26, 150, 26, '#fecaca') + T(24, 44, '+ − + − + − + −', 'font-size="12" font-weight="700"') + R(14, 70, 150, 26, '#bfdbfe') + T(24, 88, '+ − + − + − + −', 'font-size="12" font-weight="700"') + T(18, 112, 'แท่ง (บน) ผ้า (ล่าง): บวก-ลบเท่ากัน', 'font-size="9.5"') +
    R(194, 26, 150, 26, '#fecaca') + T(204, 44, '+ + + +  − − −', 'font-size="12" font-weight="700"').replace('+ + + +  − − −', '+ + + + + +') + R(194, 70, 150, 26, '#bfdbfe') + T(204, 88, '− − − −  + +', 'font-size="12" font-weight="700"').replace('− − − −  + +', '− − − − − −') +
    arrow('M300 56V68', GRN) + T(220, 66, 'ประจุลบย้าย', `font-size="9.5" font-weight="700" fill="${GRN}"`) + T(194, 112, 'แท่งเป็นบวก · ผ้าเป็นลบ', 'font-size="9.5"') +
    C(180, 140, 'การขัดถู ทำให้ประจุลบ (อิเล็กตรอน) ย้ายจากวัตถุหนึ่งไปอีกวัตถุหนึ่ง', 'font-size="10.5" font-weight="700"') + C(180, 158, 'ตัวที่เสียประจุลบ = ประจุบวก · ตัวที่ได้รับประจุลบ = ประจุลบ', 'font-size="10.5"') +
    C(180, 180, 'ปริมาณประจุบวกที่เกิด เท่ากับปริมาณประจุลบที่เกิด', 'font-size="10.5"') + C(180, 196, '(ประจุไม่ได้เกิดขึ้นใหม่ แต่ย้ายที่)', 'font-size="10"'));

  /* 29) แรงดูด แรงผลักของประจุ */
  (function () {
    const ball = (x, y, s) => O(x, y, 15, s === '+' ? '#fecaca' : '#bfdbfe', 'currentColor') + C(x, y + 5, s === '+' ? '+' : '−', 'font-size="17" font-weight="700"');
    const row = (y, a, b, kind) => ball(130, y, a) + ball(230, y, b) + (kind === 'push' ? arrow(`M112 ${y}H78`, RED) + arrow(`M248 ${y}H282`, RED) : arrow(`M150 ${y}H176`, GRN) + arrow(`M210 ${y}H184`, GRN));
    F['p6-charge-force'] = svg(196,
      'ประจุชนิดเดียวกันผลักกัน ประจุต่างชนิดดูดกัน แรงไฟฟ้าเกิดได้โดยวัตถุไม่ต้องสัมผัสกัน',
      row(26, '+', '+', 'push') + T(4, 20, 'บวก-บวก', 'font-size="10.5"') + T(296, 24, 'ผลักกัน', `font-size="11" font-weight="700" fill="${RED}"`) +
      row(76, '−', '−', 'push') + T(4, 70, 'ลบ-ลบ', 'font-size="10.5"') + T(296, 74, 'ผลักกัน', `font-size="11" font-weight="700" fill="${RED}"`) +
      row(126, '+', '−', 'pull') + T(4, 120, 'บวก-ลบ', 'font-size="10.5"') + T(296, 124, 'ดูดกัน', `font-size="11" font-weight="700" fill="${GRN}"`) +
      C(180, 164, 'ประจุชนิดเดียวกัน ผลักกัน · ประจุต่างชนิด ดูดกัน', 'font-size="10.5" font-weight="700"') + C(180, 182, 'แรงไฟฟ้ากระทำได้แม้วัตถุไม่สัมผัสกัน', 'font-size="10.5"'));
  })();

  /* 30) วัตถุที่มีประจุดูดวัตถุที่เป็นกลาง */
  F['p6-induce'] = svg(220,
    'วัตถุที่มีประจุชนิดใดก็ดูดเศษกระดาษที่เป็นกลางได้ เพราะด้านที่ใกล้เกิดประจุตรงข้าม',
    R(30, 24, 80, 22, '#bfdbfe', 'currentColor') + T(40, 40, '− − − −', 'font-size="12" font-weight="700"') + T(8, 22, 'แท่งประจุลบ', 'font-size="10.5" font-weight="700"') + R(170, 22, 56, 26, '#fef9c3') + T(176, 40, '+', 'font-size="14" font-weight="700"') + T(210, 40, '−', 'font-size="14" font-weight="700"') + arrow('M168 35H116', GRN) + T(236, 40, 'เศษกระดาษ (เป็นกลาง)', 'font-size="10"') +
    T(150, 68, 'ด้านที่ใกล้แท่งเป็นประจุตรงข้ามกับแท่ง', 'font-size="9.5"') +
    R(30, 96, 80, 22, '#fecaca', 'currentColor') + T(40, 112, '+ + + +', 'font-size="12" font-weight="700"') + T(8, 94, 'แท่งประจุบวก', 'font-size="10.5" font-weight="700"') + R(170, 94, 56, 26, '#fef9c3') + T(176, 112, '−', 'font-size="14" font-weight="700"') + T(210, 112, '+', 'font-size="14" font-weight="700"') + arrow('M168 107H116', GRN) + T(236, 112, 'เศษกระดาษ (เป็นกลาง)', 'font-size="10"') +
    C(180, 150, 'วัตถุที่มีประจุ (บวกหรือลบ) ดูดวัตถุที่เป็นกลางได้', 'font-size="10.5" font-weight="700"') + C(180, 168, 'เพราะประจุในวัตถุกลางเรียงใหม่: ด้านใกล้เป็นประจุตรงข้าม', 'font-size="10.5"') + C(180, 186, 'ถู A กับ B แล้ว A ดูดกระดาษ → B ก็ดูดกระดาษได้', 'font-size="10.5"') + C(180, 204, '(A กับ B มีประจุคนละชนิด แต่ทั้งสองดูดวัตถุที่เป็นกลาง)', 'font-size="10"'));

  /* 31) มวลกับการเปลี่ยนการเคลื่อนที่ */
  F['p6-mass-cart'] = svg(168,
    'ออกแรงผลักเท่ากัน รถที่มีมวลน้อยเปลี่ยนการเคลื่อนที่ง่ายกว่า เคลื่อนที่ไปได้ไกลกว่ารถที่มีมวลมาก',
    L(10, 70, 350, 70, 'currentColor', 3) + L(10, 140, 350, 140, 'currentColor', 3) + R(30, 40, 40, 26, '#fde68a') + R(30, 110, 40, 26, '#fde68a') + R(36, 92, 12, 18, '#94a3b8') + R(50, 92, 12, 18, '#94a3b8') + R(36, 80, 12, 12, '#94a3b8') +
    arrow('M12 53H28', BLUE) + arrow('M12 123H28', BLUE) + R(250, 40, 40, 26, '#fef3c7', 'currentColor', 'stroke-dasharray="3 2"') + R(130, 110, 40, 26, '#fef3c7', 'currentColor', 'stroke-dasharray="3 2"') +
    arrow('M74 53H246', GRN) + arrow('M74 123H126', GRN) + T(98, 36, 'มวลน้อย: ไปได้ไกล', `font-size="11" font-weight="700" fill="${GRN}"`) + T(84, 104, 'มวลมาก: ไปได้ใกล้', `font-size="11" font-weight="700" fill="${RED}"`).replace('x="84" y="104"', 'x="178" y="128"') +
    C(180, 160, 'ผลักด้วยแรงเท่ากัน เวลาเท่ากัน', 'font-size="10.5"'));

  /* ===== ว 2.3 ไฟฟ้า เสียง แสง ===== */
  const WIRE = 'currentColor';
  const lampG = (x, y, on = true) => `<circle cx="${x}" cy="${y}" r="11" fill="${on ? '#fde047' : '#f1f5f9'}" stroke="currentColor" stroke-width="2"/>` + L(x - 7, y - 7, x + 7, y + 7, 'currentColor', 1.8) + L(x - 7, y + 7, x + 7, y - 7, 'currentColor', 1.8) + (on ? L(x - 18, y - 12, x - 14, y - 9, '#ca8a04', 2) + L(x + 18, y - 12, x + 14, y - 9, '#ca8a04', 2) + L(x, y - 20, x, y - 15, '#ca8a04', 2) : '');
  const cellH = (x, y) => L(x, y - 10, x, y + 10, 'currentColor', 3) + L(x + 8, y - 5, x + 8, y + 5, 'currentColor', 3) + T(x - 8, y - 12, '+', 'font-size="10" font-weight="700"') + T(x + 12, y - 8, '−', 'font-size="10" font-weight="700"');
  const sw = (x1, x2, y, open) => O(x1, y, 2.5, 'currentColor') + O(x2, y, 2.5, 'currentColor') + (open ? L(x1, y, x2 - 6, y - 14, 'currentColor', 2.2) : L(x1, y, x2, y, 'currentColor', 2.2));
  const motor = (x, y, on) => `<circle cx="${x}" cy="${y}" r="12" fill="${on ? '#bbf7d0' : '#f1f5f9'}" stroke="currentColor" stroke-width="2"/>` + C(x, y + 5, 'M', 'font-size="13" font-weight="700"');

  /* 32) ส่วนประกอบของวงจรไฟฟ้าอย่างง่าย */
  F['p6-circuit-parts'] = svg(236,
    'วงจรไฟฟ้าอย่างง่ายประกอบด้วย เซลล์ไฟฟ้า สายไฟ สวิตช์ และหลอดไฟหรือมอเตอร์ ต่อครบวงเป็นวงจรปิด',
    `<path d="M40 50V100M40 110V160H168M196 160H320V50H284M256 50H156M104 50H40" fill="none" stroke="${WIRE}" stroke-width="2.5"/>` +
    L(26, 100, 54, 100, 'currentColor', 3.5) + L(32, 110, 48, 110, 'currentColor', 3.5) + T(58, 104, '+', 'font-size="11" font-weight="700"') + T(58, 118, '−', 'font-size="11" font-weight="700"') +
    sw(104, 156, 50, false) + lampG(270, 50) + motor(182, 160, true) +
    C(40, 182, 'เซลล์ไฟฟ้า', 'font-size="10.5" font-weight="700"') + C(130, 30, 'สวิตช์', 'font-size="10.5" font-weight="700"') + C(270, 28, 'หลอดไฟ', 'font-size="10.5" font-weight="700"') + C(182, 184, 'มอเตอร์', 'font-size="10.5" font-weight="700"') + C(292, 110, 'สายไฟ', 'font-size="10.5" font-weight="700"') +
    T(8, 204, 'เซลล์ไฟฟ้า = แหล่งพลังงาน · สายไฟ = ทางเดินของกระแสไฟฟ้า', 'font-size="10"') + T(8, 218, 'สวิตช์ = เปิด/ปิดวงจร · หลอดไฟ มอเตอร์ = ใช้พลังงานไฟฟ้า', 'font-size="10"') + T(8, 232, 'ครบวงและสวิตช์ปิด = วงจรปิด กระแสไหลได้', `font-size="10" font-weight="700" fill="${GRN}"`));

  /* 33) ต่อหลอดแบบอนุกรมและแบบขนาน */
  F['p6-series-parallel'] = svg(276,
    'ต่อหลอดอนุกรมมีทางเดียว ถอดหลอดหนึ่งหลอดอื่นดับหมด ต่อขนานมีหลายทาง ถอดหลอดหนึ่งหลอดอื่นยังสว่าง',
    C(86, 16, 'อนุกรม', 'font-size="13" font-weight="700"') + C(270, 16, 'ขนาน', 'font-size="13" font-weight="700"') +
    `<path d="M14 50H34M46 50H72M84 50H110M122 50H160V130H14V50" fill="none" stroke="${WIRE}" stroke-width="2.5"/>` + `<rect x="8" y="80" width="12" height="20" fill="#fff"/>` + L(8, 84, 20, 84, 'currentColor', 3) + L(11, 92, 17, 92, 'currentColor', 3) +
    lampG(40, 50) + lampG(78, 50) + lampG(116, 50) +
    C(86, 190, 'หลอดทั้งหมดอยู่ในทางเดียว', 'font-size="10.5"') + C(86, 206, 'ถอดหลอดหนึ่ง → วงจรขาด', 'font-size="10.5" font-weight="700"') + C(86, 222, 'หลอดที่เหลือดับทั้งหมด', `font-size="10.5" font-weight="700" fill="${RED}"`) + C(86, 238, 'หลอดมาก → แต่ละหลอดสว่างน้อยลง', 'font-size="10.5"') +
    `<path d="M200 50V150M320 50V150M200 50H251M273 50H320M200 90H251M273 90H320M200 120H251M273 120H320M200 150H252M268 150H320" fill="none" stroke="${WIRE}" stroke-width="2.5"/>` + cellH(256, 150) +
    lampG(262, 50) + lampG(262, 90) + `<circle cx="262" cy="120" r="11" fill="none" stroke="${GRY}" stroke-width="1.5" stroke-dasharray="3 3"/>` + T(284, 124, 'ถอดออก', `font-size="9.5" fill="${RED}" font-weight="700"`) +
    C(270, 190, 'แยกเป็นหลายทาง', 'font-size="10.5"') + C(270, 206, 'ถอดหลอดหนึ่ง → ทางอื่นยังครบวง', 'font-size="10.5" font-weight="700"') + C(270, 222, 'หลอดที่เหลือยังสว่าง', `font-size="10.5" font-weight="700" fill="${GRN}"`) + C(270, 238, 'แต่ละหลอดสว่างเท่ากับต่อเดี่ยว', 'font-size="10.5"') +
    C(180, 264, 'หลอดที่ต่ออนุกรมกับเซลล์ (อยู่ในสายหลัก) ถอดแล้วทุกหลอดดับ', 'font-size="10" font-weight="700"'));

  /* 34) สวิตช์ในสายเดียวกับมอเตอร์ */
  F['p6-motor-switch'] = svg(214,
    'หลอดไฟอยู่ในสายที่ครบวงจึงสว่าง มอเตอร์อยู่ในสายเดียวกับสวิตช์ที่เปิดอยู่ วงจรสายนั้นขาด มอเตอร์ไม่หมุน',
    `<path d="M40 40H199M221 40H320M40 40V70M40 80V150H320V40" fill="none" stroke="${WIRE}" stroke-width="2.5"/>` + L(26, 70, 54, 70, 'currentColor', 3.5) + L(32, 80, 48, 80, 'currentColor', 3.5) +
    `<path d="M170 40V16M170 16" fill="none" stroke="${WIRE}" stroke-width="0"/>` +
    lampG(210, 40).replace('r="11"', 'r="11"') + `<path d="M40 100H110M138 100H230M258 100H320" fill="none" stroke="${WIRE}" stroke-width="2.5"/>` + sw(110, 138, 100, true) + motor(244, 100, false) +
    T(8, 28, 'สายบน: หลอดไฟ', 'font-size="10.5" font-weight="700"').replace('x="8" y="28"', 'x="60" y="28"') + C(210, 22, 'สว่าง', `font-size="10.5" font-weight="700" fill="${GRN}"`).replace('y="22"', 'y="14"') +
    C(124, 126, 'สวิตช์เปิด', `font-size="10.5" font-weight="700" fill="${RED}"`) + C(244, 126, 'มอเตอร์', 'font-size="10.5" font-weight="700"') + C(244, 140, 'ไม่หมุน', `font-size="10.5" font-weight="700" fill="${RED}"`).replace('y="140"', 'y="142"') +
    C(180, 176, 'สวิตช์ตัดวงจรเฉพาะสายที่มันอยู่', 'font-size="10.5" font-weight="700"') + C(180, 192, 'สายที่ไม่มีสวิตช์เปิดอยู่ ยังมีกระแสผ่าน', 'font-size="10.5"') + C(180, 208, 'สวิตช์อยู่สายหลัก → ตัดทุกอย่าง', 'font-size="10.5"'));

  /* 35) ตัวกลางโปร่งใส โปร่งแสง วัตถุทึบแสง */
  (function () {
    const candle = (x, y) => R(x, y + 12, 12, 26, '#fff7ed') + `<path d="M${x + 6} ${y}q-7 8 0 14q7 -6 0 -14z" fill="#f97316" stroke="#c2410c" stroke-width="1.2"/>`;
    const eye = (x, y) => `<path d="M${x - 14} ${y}q14 -12 28 0q-14 12 -28 0z" fill="#fff" stroke="currentColor" stroke-width="1.8"/>` + O(x, y, 4, '#1f2937');
    const panel = (ox, plate, ray, name1, name2, name3) => candle(ox + 4, 36) + plate + eye(ox + 98, 56) + ray + C(ox + 56, 112, name1, 'font-size="11" font-weight="700"') + C(ox + 56, 126, name2, 'font-size="9.5"') + C(ox + 56, 139, name3, 'font-size="9.5"');
    F['p6-media'] = svg(168,
      'ตัวกลางโปร่งใสมองเห็นชัดเจน ตัวกลางโปร่งแสงมองเห็นไม่ชัดเจน วัตถุทึบแสงมองไม่เห็นเลย',
      panel(4, `<rect x="52" y="22" width="10" height="70" fill="#dbeafe" fill-opacity="0.6" stroke="#3b82f6" stroke-width="2"/>`, arrow('M24 56H46', ORG) + arrow('M66 56H82', ORG), 'โปร่งใส', 'มองเห็นชัดเจน', 'แก้วใส พลาสติกใส') +
      panel(124, `<rect x="172" y="22" width="10" height="70" fill="#fff" stroke="#94a3b8" stroke-width="2"/>`, arrow('M144 56H166', ORG) + `<path d="M186 56H202" stroke="${ORG}" stroke-width="2" stroke-dasharray="3 3"/>`, 'โปร่งแสง', 'เห็นไม่ชัดเจน', 'กระดาษไข ฝ้า') +
      panel(244, `<rect x="292" y="22" width="10" height="70" fill="#a16207" stroke="#78350f" stroke-width="2"/>`, arrow('M264 56H286', ORG) + `<path d="M296 40l8 8M304 40l-8 8" stroke="${RED}" stroke-width="2"/>`, 'ทึบแสง', 'มองไม่เห็นเลย', 'กระดาษแข็ง ไม้'));
  })();

  /* 36) เสียงสูงต่ำ */
  (function () {
    const bar = (x, w, name, col) => R(x, 44, w, 20, col) + C(x + w / 2, 80, name, 'font-size="10"');
    const bottle = (x, lv, name) => `<path d="M${x} 154V216Q${x} 222 ${x + 6} 222H${x + 34}Q${x + 40} 222 ${x + 40} 216V154H${x + 28}V144H${x + 12}V154Z" fill="#fff" stroke="currentColor" stroke-width="2"/>` + R(x + 1, 222 - lv, 38, lv, '#bfdbfe', 'none') + C(x + 20, 238, name, 'font-size="10"');
    F['p6-pitch'] = svg(276,
      'แผ่นระนาดสั้นให้เสียงสูงยาวให้เสียงต่ำ ขวดที่มีน้ำมากเมื่อเคาะให้เสียงต่ำกว่าขวดที่มีน้ำน้อย',
      C(180, 16, 'ตีแผ่นระนาด (หนาเท่ากัน)', 'font-size="11.5" font-weight="700"') + bar(30, 50, 'สั้น', '#fbbf24') + bar(100, 76, 'กลาง', '#f59e0b') + bar(196, 108, 'ยาว', '#d97706') +
      arrow('M54 24V42', RED) + C(54, 100, 'สั่นเร็ว', `font-size="10" font-weight="700" fill="${RED}"`) + C(54, 113, 'เสียงสูง', `font-size="10" font-weight="700" fill="${RED}"`) + C(250, 100, 'สั่นช้า', `font-size="10" font-weight="700" fill="${BLUE}"`) + C(250, 113, 'เสียงต่ำ', `font-size="10" font-weight="700" fill="${BLUE}"`) +
      L(14, 126, 346, 126, '#cbd5e1', 1, 'stroke-dasharray="4 4"') + C(180, 140, 'เคาะขวดแก้วที่ใส่น้ำต่างกัน (แรงเท่ากัน)', 'font-size="11.5" font-weight="700"').replace('y="140"', 'y="138"') +
      bottle(50, 14, 'น้ำน้อย → เสียงสูง') + bottle(160, 30, 'น้ำปานกลาง') + bottle(270, 50, 'น้ำมาก → เสียงต่ำ') +
      C(180, 262, 'สั้น/เล็ก/บาง/ตึง สั่นเร็ว เสียงสูง · ยาว/ใหญ่/หนา/หย่อน สั่นช้า เสียงต่ำ', 'font-size="9.5"'));
  })();

  /* 37) เสียงดัง เสียงค่อย */
  F['p6-loudness'] = svg(256,
    'สั่นแรงแอมพลิจูดมากเสียงดัง สั่นเบาแอมพลิจูดน้อยเสียงค่อย และเสียงค่อยลงเมื่อห่างจากแหล่งกำเนิดเสียงมากขึ้น',
    C(90, 14, 'ตีเบา: สั่นน้อย → เสียงค่อย', 'font-size="10.5" font-weight="700"') + C(270, 14, 'ตีแรง: สั่นมาก → เสียงดัง', 'font-size="10.5" font-weight="700"') +
    L(14, 54, 166, 54, '#cbd5e1', 1) + L(194, 54, 346, 54, '#cbd5e1', 1) +
    `<path d="M14 54Q32 44 50 54T86 54T122 54T158 54" fill="none" stroke="${BLUE}" stroke-width="3"/>` + `<path d="M194 54Q212 14 230 54T266 94T302 54T338 14" fill="none" stroke="${RED}" stroke-width="3"/>`.replace('M194 54Q212 14 230 54T266 94T302 54T338 14', 'M194 54Q212 16 230 54T266 92T302 54T338 16') +
    C(90, 84, 'ความถี่เท่ากัน เสียงสูงต่ำเท่ากัน', 'font-size="9.5"') + C(270, 112, 'แอมพลิจูดมาก (สั่นสูง) เสียงดัง', 'font-size="9.5"') +
    L(14, 124, 346, 124, '#cbd5e1', 1, 'stroke-dasharray="4 4"') +
    R(150, 150, 60, 36, '#e5e7eb') + C(180, 173, 'วิทยุ', 'font-size="12" font-weight="700"') + O(126, 168, 8, '#fde68a', 'currentColor') + O(56, 168, 8, '#fde68a', 'currentColor') + O(326, 168, 8, '#fde68a', 'currentColor') +
    C(126, 190, 'A ใกล้: ดัง', 'font-size="10" font-weight="700"') + C(56, 190, 'B กลาง', 'font-size="10" font-weight="700"') + C(326, 190, 'C ไกล: ค่อย', 'font-size="10" font-weight="700"') +
    arrow('M146 168H138', GRY) + arrow('M146 168H68', GRY) + arrow('M214 168H312', GRY) +
    C(180, 236, 'ตัวแปรต้น = ระยะห่างจากแหล่งกำเนิดเสียง · ตัวแปรตาม = ความดังที่ได้ยิน', 'font-size="10" font-weight="700"') + C(180, 250, 'ต้องวางตำแหน่งให้ห่างจากวิทยุไม่เท่ากัน', 'font-size="10"'));

  /* 38) เสียงต้องอาศัยตัวกลาง */
  F['p6-sound-medium'] = svg(206,
    'เสียงเดินทางผ่านตัวกลางแก๊ส ของเหลว หรือของแข็ง ในสุญญากาศไม่มีตัวกลาง จึงไม่ได้ยินเสียง',
    C(90, 16, 'มีตัวกลาง (อากาศ น้ำ ของแข็ง)', 'font-size="10.5" font-weight="700"') + C(272, 16, 'สุญญากาศ ไม่มีตัวกลาง', 'font-size="10.5" font-weight="700"') +
    `<path d="M24 80q-8 -14 8 -22q16 -8 22 8q-6 16 -14 18z" fill="#fbbf24" stroke="#92400e" stroke-width="2"/>` + L(34, 82, 34, 92, '#92400e', 2) +
    `<path d="M62 56Q72 70 62 86M72 50Q86 70 72 92M82 44Q100 70 82 98" fill="none" stroke="${BLUE}" stroke-width="2"/>` + (() => { let s = ''; for (let i = 0; i < 10; i++) s += O(92 + (i % 5) * 9, 50 + Math.floor(i / 5) * 40, 2.2, '#64748b'); return s; })() +
    `<path d="M160 70q8 -16 20 -6q8 14 -6 22" fill="#fde68a" stroke="currentColor" stroke-width="2"/>` + C(164, 108, 'ได้ยิน', `font-size="11" font-weight="700" fill="${GRN}"`) +
    `<rect x="200" y="36" width="80" height="80" rx="8" fill="#f1f5f9" stroke="currentColor" stroke-width="2.5"/>` + `<path d="M226 90q-8 -14 8 -22q16 -8 22 8q-6 16 -14 18z" fill="#fbbf24" stroke="#92400e" stroke-width="2"/>` + C(240, 52, 'ไม่มีอากาศ', 'font-size="10"') +
    `<path d="M320 70q8 -16 20 -6q8 14 -6 22" fill="#fde68a" stroke="currentColor" stroke-width="2"/>` + L(318, 62, 346, 92, RED, 3) + L(346, 62, 318, 92, RED, 3) + C(332, 108, 'ไม่ได้ยิน', `font-size="11" font-weight="700" fill="${RED}"`) +
    C(180, 142, 'เสียงเกิดจากการสั่น แล้วส่งต่อผ่านตัวกลางเป็นทอด ๆ จนถึงหู', 'font-size="10.5" font-weight="700"') + C(180, 160, 'เช่น เคาะเหล็กบนบก ผู้ฟังใต้น้ำก็ได้ยิน (ผ่านอากาศ น้ำ)', 'font-size="10"') + C(180, 176, 'ในยานอวกาศมีอากาศภายใน จึงได้ยินเสียงภายในยาน', 'font-size="10"') + C(180, 192, 'ในห้องสุญญากาศไม่มีอนุภาคส่งต่อ จึงไม่ได้ยินเสียงออกมาข้างนอก', 'font-size="10"'));

  /* 39) เงามืดและเงามัว */
  F['p6-shadow'] = svg(262,
    'แหล่งกำเนิดแสงขนาดใหญ่ส่องวัตถุทึบแสง เกิดเงามืดตรงกลางและเงามัวรอบ ๆ บนฉาก แสงเดินทางเป็นเส้นตรง',
    R(24, 56, 12, 100, '#fde047', 'currentColor') + T(6, 44, 'แหล่งกำเนิดแสง', 'font-size="10.5" font-weight="700"') + T(6, 176, 'ขนาดใหญ่', 'font-size="10"') +
    R(144, 95, 12, 30, '#78716c', '#1c1917') + C(150, 84, 'วัตถุทึบแสง', 'font-size="10.5" font-weight="700"') +
    L(300, 20, 300, 236, 'currentColor', 3) + C(300, 252, 'ฉาก', 'font-size="11" font-weight="700"') +
    L(36, 60, 300, 138.75, ORG, 1.5) + L(36, 60, 300, 206.25, ORG, 1.5) + L(36, 156, 300, 13.75, ORG, 1.5) + L(36, 156, 300, 81.25, ORG, 1.5) +
    L(36, 108, 144, 108, '#fcd34d', 1.5, 'stroke-dasharray="3 3"') + R(296, 81, 8, 58, '#111827', 'none') + R(296, 14, 8, 67, '#9ca3af', 'none') + R(296, 139, 8, 67, '#9ca3af', 'none') +
    T(310, 114, 'เงามืด', 'font-size="10.5" font-weight="700"') + T(310, 54, 'เงามัว', 'font-size="10.5" font-weight="700"') + T(310, 174, 'เงามัว', 'font-size="10.5" font-weight="700"') +
    T(8, 214, 'เงามืด = แสงถูกกั้นหมด · เงามัว = ได้รับแสงบางส่วน', 'font-size="10" font-weight="700"') + T(8, 230, 'แหล่งกำเนิดแสงใหญ่ (หลายจุด) → เกิดเงามัวรอบเงามืด', 'font-size="10"') + T(8, 246, 'วัตถุใกล้ฉาก → เงาเล็กลง · ใกล้แหล่งกำเนิดแสง → เงาใหญ่', 'font-size="10"'));

  /* ===== ว 1.2 ระบบย่อยอาหาร พืชดอก สารอาหาร ===== */
  const tt = (x, y, s, c = '#111827', w = 600, sz = 10.5) => T(x, y, s, `fill="${c}" font-weight="${w}" font-size="${sz}"`);

  /* 1) ระบบย่อยอาหาร */
  F['p6-digest-system'] = svg(262,
    'อวัยวะในระบบย่อยอาหาร ปาก หลอดอาหาร กระเพาะอาหาร ตับ ตับอ่อน ลำไส้เล็ก ลำไส้ใหญ่ ทวารหนัก',
    `<ellipse cx="180" cy="22" rx="22" ry="11" fill="#fecaca" stroke="currentColor" stroke-width="2"/>` + L(166, 22, 194, 22, '#991b1b', 2) +
    L(180, 33, 180, 74, '#f9a8d4', 9) +
    `<ellipse cx="198" cy="96" rx="28" ry="21" fill="#fda4af" stroke="currentColor" stroke-width="2"/>` +
    `<ellipse cx="140" cy="90" rx="34" ry="16" fill="#b45309" stroke="currentColor" stroke-width="2"/>` +
    `<ellipse cx="190" cy="132" rx="32" ry="6" fill="#fde047" stroke="currentColor" stroke-width="1.5"/>` +
    `<rect x="132" y="142" width="96" height="84" rx="10" fill="none" stroke="#a16207" stroke-width="12"/>` +
    `<polyline points="150,154 210,154 150,168 210,168 150,182 210,182 150,196 210,196 160,210" fill="none" stroke="#f472b6" stroke-width="8" stroke-linejoin="round"/>` +
    O(180, 244, 6, '#a16207') +
    tt(236, 26, 'ปาก', '#111827', 700) + tt(236, 39, 'บดอาหาร น้ำลายย่อยแป้ง', '#374151', 600, 9) +
    tt(236, 92, 'กระเพาะอาหาร', '#111827', 700) + tt(236, 105, 'ย่อยโปรตีนเริ่มที่นี่', '#374151', 600, 9) +
    tt(236, 134, 'ตับอ่อน', '#111827', 700) + tt(236, 147, 'สร้างเอนไซม์ย่อย', '#374151', 600, 9) +
    tt(236, 176, 'ลำไส้เล็ก', '#be185d', 700) + tt(236, 189, 'ย่อยให้เสร็จ', '#374151', 600, 9) + tt(236, 201, 'ดูดซึมสารอาหาร', '#be185d', 700, 9.5) +
    tt(236, 224, 'ลำไส้ใหญ่', '#a16207', 700) + tt(236, 237, 'ดูดน้ำ แร่ธาตุ', '#374151', 600, 9) +
    tt(2, 56, 'หลอดอาหาร', '#111827', 700) + L(62, 52, 174, 52, GRY, 1) +
    tt(2, 86, 'ตับ', '#111827', 700) + tt(2, 99, 'สร้างน้ำดี', '#374151', 600, 9) + tt(2, 111, 'ช่วยย่อยไขมัน', '#374151', 600, 9) +
    tt(120, 258, 'ทวารหนัก ขับกากอาหาร', '#374151', 600, 9.5));

  /* 2) ย่อยที่ไหน */
  (function () {
    const rows = [['แป้ง', ['เริ่มย่อย', '-', 'ย่อยจนเสร็จ']], ['โปรตีน', ['-', 'เริ่มย่อย', 'ย่อยจนเสร็จ']], ['ไขมัน', ['-', '-', 'ย่อยจนเสร็จ']]];
    const cols = ['ปาก', 'กระเพาะอาหาร', 'ลำไส้เล็ก'];
    let b = '';
    cols.forEach((c, i) => { b += R(90 + i * 90, 14, 86, 30, '#e5e7eb') + C(133 + i * 90, 34, c, 'font-size="11" font-weight="700"'); });
    rows.forEach((r, j) => {
      const y = 50 + j * 40;
      b += R(8, y, 78, 34, '#fef9c3') + C(47, y + 22, r[0], 'font-size="11.5" font-weight="700"');
      r[1].forEach((s, i) => {
        const on = s !== '-', col = s === 'เริ่มย่อย' ? '#bbf7d0' : s === 'ย่อยจนเสร็จ' ? '#bfdbfe' : '#f8fafc';
        b += R(90 + i * 90, y, 86, 34, col) + C(133 + i * 90, y + 21, on ? s : 'ไม่ย่อย', `font-size="10.5" font-weight="${on ? 700 : 400}" fill="${on ? '#111827' : '#94a3b8'}"`);
      });
    });
    b += C(180, 186, 'สารอาหารที่ย่อยแล้วดูดซึมที่ ลำไส้เล็ก เป็นส่วนใหญ่', 'font-size="10.5" font-weight="700"') +
      C(180, 202, 'ตับสร้างน้ำดี ตับอ่อนสร้างเอนไซม์ ส่งมาที่ลำไส้เล็ก', 'font-size="10"') +
      C(180, 217, 'ลำไส้ใหญ่ ไม่ย่อยอาหาร (ดูดน้ำและเกลือแร่)', 'font-size="10"');
    F['p6-digest-where'] = svg(228, 'ตารางแสดงว่าแป้ง โปรตีน ไขมัน เริ่มย่อยที่ใดและย่อยจนเสร็จที่ใด', b);
  })();

  /* 3) เลือดไหลเวียนระหว่างปอด หัวใจ และอวัยวะ */
  F['p6-blood-loop'] = svg(250,
    'เลือดจากปอดมีออกซิเจนสูงไปหัวใจ แล้วไปเลี้ยงอวัยวะ เลือดจากอวัยวะมีคาร์บอนไดออกไซด์สูงกลับหัวใจแล้วไปปอด',
    R(8, 70, 80, 90, '#dbeafe') + C(48, 112, 'ปอด', 'font-size="13" font-weight="700"') + C(48, 128, 'รับ O₂', 'font-size="10"') + C(48, 141, 'ปล่อย CO₂', 'font-size="10"') +
    R(140, 70, 80, 90, '#fecaca') + C(180, 120, 'หัวใจ', 'font-size="13" font-weight="700"') +
    R(272, 70, 80, 90, '#fef3c7') + C(312, 108, 'อวัยวะต่าง ๆ', 'font-size="11" font-weight="700"') + C(312, 122, 'ลำไส้ สมอง', 'font-size="10"') + C(312, 135, 'กล้ามเนื้อ', 'font-size="10"') + C(312, 148, 'ใช้ O₂ สร้างพลังงาน', 'font-size="8.5"') +
    arrow('M90 92H138', RED) + arrow('M222 92H270', RED) + arrow('M270 138H222', BLUE) + arrow('M138 138H90', BLUE) +
    C(114, 84, 'O₂ สูง', 'font-size="10" font-weight="700" fill="#b91c1c"') + C(246, 84, 'O₂ สูง', 'font-size="10" font-weight="700" fill="#b91c1c"') +
    C(246, 156, 'CO₂ สูง', 'font-size="10" font-weight="700" fill="#1d4ed8"') + C(114, 156, 'CO₂ สูง', 'font-size="10" font-weight="700" fill="#1d4ed8"') +
    C(180, 20, 'แดง = เลือดมีออกซิเจนสูง · น้ำเงิน = เลือดมีคาร์บอนไดออกไซด์สูง', 'font-size="10" font-weight="700"') +
    C(180, 196, 'ถ้าปอดทำงานบกพร่อง: ออกซิเจนเข้าเลือดน้อยลง', 'font-size="10.5" font-weight="700"') +
    C(180, 212, 'หัวใจสูบฉีดเลือดบ่อยขึ้น · สลายอาหารเป็นพลังงานลดลง', 'font-size="10"') +
    C(180, 227, 'CO₂ ออกจากเลือดสู่ปอดน้อยลง (ไม่ใช่มากขึ้น)', 'font-size="10"'));

  /* 4) ส่วนของพืชดอก */
  F['p6-plant-parts'] = svg(284,
    'พืชดอกมีราก ลำต้น ใบ และดอก รากดูดน้ำและยึดลำต้น ลำต้นลำเลียงน้ำและอาหาร ใบสร้างอาหารและคายน้ำ ดอกสืบพันธุ์',
    L(20, 176, 340, 176, '#78350f', 3) + R(20, 177, 320, 100, '#fde68a', 'none', 'opacity="0.45"') +
    L(120, 176, 120, 82, '#15803d', 7) +
    `<path d="M120 130C88 120 74 134 70 146C92 150 110 144 120 130Z" fill="#4ade80" stroke="#166534" stroke-width="1.5"/>` +
    `<path d="M120 110C150 98 164 112 168 124C146 128 128 122 120 110Z" fill="#4ade80" stroke="#166534" stroke-width="1.5"/>` +
    O(120, 66, 8, '#fde047', '#a16207') + `<path d="M120 58C114 46 126 46 120 58M120 74C114 86 126 86 120 74M112 66C100 60 100 72 112 66M128 66C140 60 140 72 128 66" fill="#f472b6" stroke="#be185d" stroke-width="1.2"/>` +
    L(120, 176, 120, 236, '#a16207', 4) + L(120, 190, 92, 224, '#a16207', 2.5) + L(120, 196, 148, 232, '#a16207', 2.5) + L(120, 210, 84, 214, '#a16207', 2) + L(120, 214, 160, 218, '#a16207', 2) +
    tt(190, 62, 'ดอก', '#be185d', 700, 12) + tt(190, 76, 'สืบพันธุ์ สร้างเมล็ดและผล', '#374151', 600, 9.5) + L(140, 64, 186, 64, GRY, 1) +
    tt(190, 112, 'ใบ', '#15803d', 700, 12) + tt(190, 126, 'สร้างอาหาร (สังเคราะห์ด้วยแสง)', '#374151', 600, 9.5) + tt(190, 138, 'คายน้ำทางปากใบ', '#374151', 600, 9.5) + L(170, 118, 186, 116, GRY, 1) +
    tt(190, 160, 'ลำต้น', '#166534', 700, 12) + tt(8, 160, 'ลำเลียงน้ำและอาหาร', '#374151', 600, 9.5).replace('x="8"', 'x="190"').replace('y="160"', 'y="172"') +
    tt(8, 92, 'ลำต้นมี ข้อ ปล้อง ตา', '#374151', 600, 9.5) + tt(8, 104, 'ชูใบและดอก', '#374151', 600, 9.5) + L(70, 108, 114, 112, GRY, 1) +
    tt(176, 224, 'ราก', '#78350f', 700, 12) + tt(176, 238, 'ดูดน้ำและแร่ธาตุ', '#374151', 600, 9.5) + tt(176, 250, 'ยึดลำต้นกับดิน', '#374151', 600, 9.5) +
    tt(8, 270, 'ราก: ไม่มีข้อ ปล้อง ตา ปากใบ (สีขาว/น้ำตาล) · ใบ: มีปากใบ สีเขียว', '#111827', 700, 9.5));

  /* 5) สังเคราะห์ด้วยแสง */
  F['p6-photosynthesis'] = svg(236,
    'พืชใช้แสง น้ำ และคาร์บอนไดออกไซด์ สร้างน้ำตาลและปล่อยออกซิเจน',
    `<path d="M120 120C150 60 230 60 262 120C230 170 150 170 120 120Z" fill="#4ade80" stroke="#166534" stroke-width="2.5"/>` + L(120, 120, 262, 120, '#166534', 2) +
    O(40, 36, 16, '#fde047', '#ca8a04') + L(26, 48, 26, 48, '#ca8a04', 1) + arrow('M56 48L128 100', ORG) + tt(8, 70, 'แสง', ORG, 700, 12) +
    arrow('M30 118H110', GRY) + tt(8, 110, 'CO₂ เข้าทางปากใบ', GRY, 700, 10) +
    arrow('M190 224V172', BLUE) + tt(132, 224, 'น้ำจากราก ผ่านลำต้น', BLUE, 700, 10).replace('y="224"', 'y="232"') +
    arrow('M268 100L330 60', GRN) + tt(278, 52, 'O₂ ออกจากใบ', GRN, 700, 10).replace('x="278"', 'x="262"') +
    arrow('M268 140L330 176', '#a16207') + tt(270, 192, 'น้ำตาล (อาหาร)', '#a16207', 700, 10) +
    tt(96, 14, 'วัตถุดิบ: แสง + น้ำ + CO₂', '#111827', 700, 10) +
    tt(96, 27, 'ผลผลิต: น้ำตาล + O₂ (คน-สัตว์ใช้หายใจ)', '#111827', 700, 10) + tt(188, 106, 'ใบ', '#111827', 700, 11));

  /* 6) ลำต้นใต้ดิน เทียบกับรากสะสมอาหาร */
  F['p6-tuber-root'] = svg(204,
    'หัวมีตาและงอกยอดได้คือลำต้นใต้ดิน เช่น มันฝรั่ง รากสะสมอาหารไม่มีตา เช่น มันเทศ แครอท',
    R(4, 22, 170, 130, '#fef3c7', 'currentColor') + R(186, 22, 170, 130, '#fef3c7', 'currentColor') +
    C(89, 16, 'ลำต้นใต้ดิน (มันฝรั่ง)', 'font-size="11" font-weight="700"') + C(271, 16, 'รากสะสมอาหาร (มันเทศ)', 'font-size="11" font-weight="700"') +
    `<ellipse cx="80" cy="100" rx="40" ry="26" fill="#d6a86f" stroke="#78350f" stroke-width="2"/>` + O(62, 96, 3, '#44403c') + O(86, 106, 3, '#44403c') + O(100, 90, 3, '#44403c') + L(100, 88, 112, 62, '#4ade80', 4) + `<path d="M112 62C122 54 128 58 124 66C120 66 116 66 112 62Z" fill="#4ade80"/>` +
    C(89, 140, 'มี ตา → งอกยอดได้', 'font-size="10" font-weight="700"') +
    `<path d="M230 52C240 90 262 126 330 122C300 84 268 66 230 52Z" fill="#fb923c" stroke="#9a3412" stroke-width="2"/>` + L(300, 112, 314, 128, '#9a3412', 1.5) + L(262, 100, 266, 122, '#9a3412', 1.5) +
    C(271, 146, 'ไม่มีตา ไม่มีข้อปล้อง', 'font-size="10" font-weight="700"') +
    C(180, 174, 'ใช้ขยายพันธุ์ได้ (ปลูกหัวที่มีตา)', 'font-size="10" font-weight="700"').replace('x="180"', 'x="89"') + C(271, 174, 'เก็บอาหารไว้ในราก', 'font-size="10" font-weight="700"') +
    C(180, 196, 'ตาพบเฉพาะบนลำต้น · หัวที่มีตา = ลำต้น ไม่ใช่ราก', 'font-size="10" font-weight="700" fill="#b91c1c"'));

  /* 7) คายน้ำ: ถุงพลาสติกครอบต้นไม้ */
  F['p6-bag-transpire'] = svg(236,
    'ต้นไม้ในถุงพลาสติกมัดปาก ไอน้ำที่ใบคายออกมากลั่นเป็นหยดน้ำที่ผิวด้านในของถุง แสดงว่าพืชมีชีวิตและดูดน้ำได้',
    `<path d="M92 36C60 60 60 150 92 176H270C302 150 302 60 270 36Z" fill="#e0f2fe" fill-opacity="0.55" stroke="#0e7490" stroke-width="2.5"/>` +
    `<path d="M150 188L160 214H202L212 188Z" fill="#c2410c" stroke="currentColor" stroke-width="2"/>` +
    L(181, 188, 181, 100, '#15803d', 6) + `<path d="M181 130C150 118 134 130 132 146C156 148 174 142 181 130Z" fill="#4ade80" stroke="#166534" stroke-width="1.5"/><path d="M181 104C212 92 228 106 230 120C206 124 188 118 181 104Z" fill="#4ade80" stroke="#166534" stroke-width="1.5"/>` +
    O(98, 80, 3.5, '#38bdf8') + O(102, 110, 3.5, '#38bdf8') + O(264, 90, 3.5, '#38bdf8') + O(262, 126, 3.5, '#38bdf8') + O(120, 54, 3.5, '#38bdf8') + O(240, 56, 3.5, '#38bdf8') +
    arrow('M150 120C128 112 116 100 104 88', BLUE) + arrow('M230 104C250 100 258 96 262 94', BLUE) +
    arrow('M181 214V190', BLUE) + C(181, 232, 'น้ำจากดิน → ราก → ลำต้น → ใบ', 'font-size="10" font-weight="700" fill="#1d4ed8"') +
    tt(4, 16, 'หยดน้ำที่ผิวด้านในถุง', '#0e7490', 700, 10) + tt(226, 200, 'มัดปากถุงแน่น', '#374151', 600, 10) +
    tt(4, 30, 'มาจาก "การคายน้ำ" ของใบ (ไอน้ำ)', '#374151', 600, 9.5) +
    tt(4, 196, 'พืชมีชีวิต → ดูดน้ำ → คายน้ำ', '#111827', 700, 9.5) + tt(4, 210, 'หยดน้ำไม่ได้มาจากการหายใจ', '#b91c1c', 700, 9.5));

  /* 8) แผนภาพเวลา: ช่วงที่ดอกทั้งสองเพศพร้อมผสม */
  (function () {
    const x = d => 28 + d * 6.4;
    let b = L(28, 150, 346, 150, 'currentColor', 2);
    for (let d = 0; d <= 50; d += 10) b += L(x(d), 150, x(d), 156, 'currentColor', 2) + C(x(d), 170, String(d), 'font-size="10"');
    b += C(190, 186, 'วัน (นับจากวันเพาะเมล็ด)', 'font-size="10" font-weight="700"');
    b += R(x(0), 28, x(20) - x(0), 22, '#bbf7d0') + C((x(0) + x(20)) / 2, 43, 'เป็นต้นพืชโตเต็มที่', 'font-size="10" font-weight="700"');
    b += R(x(30), 64, x(36) - x(30), 24, '#93c5fd') + T(x(36) + 6, 80, 'เพศผู้ วัน 30–36', 'font-size="10" font-weight="700"');
    b += R(x(34), 100, x(44) - x(34), 24, '#fda4af') + T(x(34) - 6, 116, 'เพศเมีย วัน 34–44', 'font-size="10" font-weight="700" text-anchor="end"');
    b += `<rect x="${x(34)}" y="58" width="${x(36) - x(34)}" height="72" fill="#fde047" fill-opacity="0.55" stroke="#a16207" stroke-width="1.5" stroke-dasharray="4 3"/>`;
    b += arrow(`M${x(35)} 140V132`, '#a16207') + C(x(35), 142, '', '');
    b += tt(10, 214, 'ช่วงที่ซ้อนกัน = วัน 34–36 → ผสมเกสรในต้นเดียวกันได้ตั้งแต่วัน 34', '#a16207', 700, 10);
    F['p6-flower-timeline'] = svg(228, 'แผนภาพเวลาแสดงช่วงที่ดอกเพศผู้และดอกเพศเมียบานพร้อมกัน เพื่อช่วยผสมเกสรในต้นเดียวกัน', b);
  })();

  /* 9) ทดสอบแป้งและไขมัน */
  F['p6-food-tests'] = svg(204,
    'ทดสอบแป้งด้วยสารละลายไอโอดีน เปลี่ยนเป็นสีน้ำเงินเข้ม ทดสอบไขมันด้วยกระดาษ ถูอาหารแล้วเป็นรอยโปร่งแสง',
    R(4, 22, 172, 130, '#f8fafc', 'currentColor') + R(184, 22, 172, 130, '#f8fafc', 'currentColor') +
    C(90, 16, 'ทดสอบแป้ง', 'font-size="11.5" font-weight="700"') + C(270, 16, 'ทดสอบไขมัน', 'font-size="11.5" font-weight="700"') +
    `<ellipse cx="90" cy="112" rx="50" ry="14" fill="#fde68a" stroke="currentColor" stroke-width="1.5"/>` + `<path d="M84 40H96L94 62H86Z" fill="#92400e"/><path d="M90 62V84" stroke="#92400e" stroke-width="3" stroke-dasharray="3 3"/>` + tt(30, 52, 'ไอโอดีน', '#92400e', 700, 10).replace('x="30"', 'x="102"').replace('y="52"', 'y="52"') +
    `<ellipse cx="90" cy="112" rx="30" ry="8" fill="#1e1b4b"/>` + C(90, 140, 'น้ำเงินเข้ม = มีแป้ง', 'font-size="10.5" font-weight="700" fill="#1e3a8a"') +
    R(214, 60, 112, 60, '#fff7ed', 'currentColor') + `<ellipse cx="270" cy="90" rx="22" ry="12" fill="#fef9c3" stroke="#a16207" stroke-width="1.5"/>` + tt(190, 48, 'กระดาษที่ถูอาหาร', '#374151', 600, 9.5) +
    arrow('M340 28V54', ORG) + tt(298, 44, 'ส่องแสง', ORG, 700, 9.5) + C(270, 140, 'รอยโปร่งแสง = มีไขมัน', 'font-size="10.5" font-weight="700" fill="#a16207"') +
    C(180, 176, 'ไม่เปลี่ยนสีเป็นน้ำเงินเข้ม → ไม่มีแป้ง · ไม่เป็นรอยโปร่งแสง → ไม่มีไขมัน', 'font-size="10" font-weight="700"') +
    C(180, 194, '(รอยโปร่งแสงบนกระดาษคือน้ำมันที่ซึมออกมา)', 'font-size="9.5"'));

  /* ===== ว 3.1 ดวงจันทร์ ดาว สุริยุปราคา จันทรุปราคา ดาวเทียม ระบบสุริยะ ===== */
  const ttc = (x, y, s, c = '#111827', w = 600, sz = 10.5) => T(x, y, s, `fill="${c}" font-weight="${w}" font-size="${sz}" text-anchor="middle"`);
  const YEL = '#fde68a';

  /* 1) ข้างขึ้นข้างแรม */
  (function () {
    const moon = (cx, cy, r, f, right) => {
      let lit = '';
      if (f >= 0.99) lit = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${YEL}"/>`;
      else if (f > 0.01) {
        const rx = r * Math.abs(1 - 2 * f), s = f < 0.5 ? 0 : 1;
        const d = f === 0.5 ? `M${cx} ${cy - r}A${r} ${r} 0 0 1 ${cx} ${cy + r}Z` : `M${cx} ${cy - r}A${r} ${r} 0 0 1 ${cx} ${cy + r}A${rx.toFixed(1)} ${r} 0 0 ${s} ${cx} ${cy - r}Z`;
        lit = right ? `<path d="${d}" fill="${YEL}"/>` : `<g transform="translate(${2 * cx} 0) scale(-1 1)"><path d="${d}" fill="${YEL}"/></g>`;
      }
      return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#374151"/>` + lit + `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="currentColor" stroke-width="1.5"/>`;
    };
    const cell = (i, y, name, sub, f, right) => moon(45 + i * 90, y, 24, f, right) + ttc(45 + i * 90, y + 40, name, '#111827', 700, 10.5) + ttc(45 + i * 90, y + 53, sub, '#374151', 600, 9);
    F['p6-moon-phases'] = svg(232,
      'รูปร่างดวงจันทร์ในหนึ่งรอบเดือน ข้างขึ้นส่วนสว่างเพิ่มขึ้น ขึ้น 8 ค่ำสว่างครึ่งดวง ขึ้น 15 ค่ำเต็มดวง ข้างแรมส่วนสว่างลดลง แรม 15 ค่ำมืดสนิท',
      ttc(180, 12, 'ข้างขึ้น: สว่างเพิ่ม (ด้านขวา) →', '#15803d', 700, 10.5) +
      cell(0, 44, 'แรม 15 ค่ำ', 'เดือนดับ ไม่เห็น', 0, true) + cell(1, 44, 'ขึ้น 4 ค่ำ', 'เสี้ยว', 0.2, true) + cell(2, 44, 'ขึ้น 8 ค่ำ', 'ครึ่งดวง', 0.5, true) + cell(3, 44, 'ขึ้น 12 ค่ำ', 'เกือบเต็ม', 0.85, true) +
      ttc(180, 126, 'ข้างแรม: สว่างลด (ด้านซ้าย) →', '#b91c1c', 700, 10.5) +
      cell(0, 158, 'ขึ้น 15 ค่ำ', 'เต็มดวง', 1, true) + cell(1, 158, 'แรม 4 ค่ำ', 'เกือบเต็ม', 0.85, false) + cell(2, 158, 'แรม 8 ค่ำ', 'ครึ่งดวง', 0.5, false) + cell(3, 158, 'แรม 12 ค่ำ', 'เสี้ยว', 0.2, false) +
      ttc(180, 226, 'วงจรประมาณ 29–30 วัน · ดูจากประเทศไทย', '#111827', 700, 9.5));
  })();

  /* 2) ดวงจันทร์โคจรรอบโลก */
  (function () {
    const mn = (cx, cy) => `<circle cx="${cx}" cy="${cy}" r="10" fill="#374151" stroke="currentColor" stroke-width="1.5"/><path d="M${cx} ${cy - 10}A10 10 0 0 0 ${cx} ${cy + 10}Z" fill="${YEL}"/>`;
    F['p6-moon-orbit'] = svg(246,
      'ดวงจันทร์โคจรรอบโลก ได้รับแสงอาทิตย์ครึ่งดวงเสมอ ตำแหน่งที่ต่างกันทำให้เห็นส่วนสว่างต่างกัน',
      O(32, 116, 24, YEL, '#ca8a04') + ttc(32, 156, 'ดวงอาทิตย์', '#92400e', 700, 10) +
      L(62, 74, 118, 74, '#f59e0b', 1.5, 'stroke-dasharray="5 4"') + L(62, 116, 100, 116, '#f59e0b', 1.5, 'stroke-dasharray="5 4"') + L(62, 158, 118, 158, '#f59e0b', 1.5, 'stroke-dasharray="5 4"') +
      `<circle cx="204" cy="116" r="74" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="4 4"/>` +
      O(204, 116, 15, '#60a5fa', '#1d4ed8') + ttc(204, 120, 'โลก', '#111827', 700, 9.5) +
      mn(130, 116) + mn(204, 42) + mn(278, 116) + mn(204, 190) +
      ttc(130, 98, 'เดือนดับ', '#111827', 700, 9.5) + ttc(130, 140, '(ด้านหันหาโลกมืด)', '#374151', 600, 8.5) +
      ttc(204, 24, 'แรม 8 ค่ำ (ครึ่งดวง)', '#b91c1c', 700, 9.5) + ttc(204, 212, 'ขึ้น 8 ค่ำ (ครึ่งดวง)', '#15803d', 700, 9.5) +
      ttc(298, 98, 'ขึ้น 15 ค่ำ', '#111827', 700, 9.5).replace('x="298"', 'x="306"') + ttc(306, 140, '(เต็มดวง)', '#374151', 600, 8.5) +
      ttc(204, 232, 'ครึ่งที่หันหาดวงอาทิตย์สว่างเสมอ · เห็นส่วนสว่างมากหรือน้อยขึ้นกับตำแหน่ง', '#111827', 700, 8.5));
  })();

  /* 3) สุริยุปราคา */
  (function () {
    const panel = (oy, mx, title, note) => {
      const y = oy + 62, sx = 34, rs = 26, rm = 8, ex = 322, re = 24, d = mx - sx;
      const hw = x => rm + (x - mx) * (rs + rm) / d;
      const ax = mx + d * rm / (rs - rm);
      let b = ttc(180, oy + 10, title, '#111827', 700, 10.5);
      b += `<polygon points="${mx},${y - rm} ${ex + 20},${y - hw(ex + 20)} ${ex + 20},${y + hw(ex + 20)} ${mx},${y + rm}" fill="#cbd5e1" opacity="0.7"/>`;
      if (ax < ex + 20) {
        b += `<polygon points="${mx},${y - rm} ${ax},${y} ${mx},${y + rm}" fill="#334155"/>`;
        const w = (ex + 20 - ax) * (rs - rm) / d;
        b += `<polygon points="${ax},${y} ${ex + 20},${y - w} ${ex + 20},${y + w}" fill="#fdba74" opacity="0.55"/>`;
      }
      b += O(sx, y, rs, YEL, '#ca8a04') + O(mx, y, rm, '#374151', 'currentColor') + O(ex, y, re, '#93c5fd', '#1d4ed8');
      b += O(298, y, 4, '#b91c1c') + ttc(290, y + 4, 'B', '#b91c1c', 700, 10.5) + O(304, y - 16, 4, '#1d4ed8') + ttc(296, y - 14, 'A', '#1d4ed8', 700, 10.5);
      b += ttc(sx, y + 40, 'อาทิตย์', '#92400e', 700, 9) + ttc(mx, y + 22, 'ดวงจันทร์', '#111827', 700, 9) + ttc(ex + 6, y + 40, 'โลก', '#1d4ed8', 700, 9);
      b += ttc(180, oy + 112, note, '#374151', 700, 9.5);
      return b;
    };
    F['p6-eclipse-solar'] = svg(272,
      'สุริยุปราคา ดวงจันทร์อยู่ระหว่างโลกกับดวงอาทิตย์ เงามืดทำให้เห็นเต็มดวงหรือวงแหวน เงามัวเห็นบางส่วน',
      panel(0, 238, 'จันทร์ใกล้โลก: เงามืดถึงพื้น', 'A (เงามัว) = บางส่วน · B (เงามืด) = เต็มดวง') +
      panel(140, 176, 'จันทร์ไกลโลก: เงามืดไม่ถึงพื้น', 'A (เงามัว) = บางส่วน · B (หลังปลายเงามืด) = วงแหวน') +
      ttc(180, 266, '(ภาพไม่ได้สัดส่วน) เกิดช่วงเดือนดับ เห็นเฉพาะบริเวณแคบบนโลก', '#111827', 600, 9));
  })();

  /* 4) จันทรุปราคา */
  (function () {
    const y = 66, sx = 28, rs = 24, ex = 150, re = 12, d = ex - sx;
    const ax = ex + d * re / (rs - re);
    const hw = x => re + (x - ex) * (rs + re) / d;
    F['p6-eclipse-lunar'] = svg(168,
      'จันทรุปราคา โลกอยู่ระหว่างดวงอาทิตย์กับดวงจันทร์ ดวงจันทร์เข้าเงามืดของโลก เกิดตอนพระจันทร์เต็มดวง',
      `<polygon points="${ex},${y - re} 346,${y - hw(346)} 346,${y + hw(346)} ${ex},${y + re}" fill="#cbd5e1" opacity="0.7"/>` +
      `<polygon points="${ex},${y - re} 346,${y - 4} 346,${y + 4} ${ex},${y + re}" fill="#334155" opacity="0.85"/>` +
      O(sx, y, rs, YEL, '#ca8a04') + O(ex, y, re, '#93c5fd', '#1d4ed8') + O(250, y, 5, '#7f1d1d', 'currentColor') + O(222, y + 15, 5, '#a8a29e', 'currentColor') +
      ttc(sx, y + 38, 'ดวงอาทิตย์', '#92400e', 700, 9) + ttc(ex, y + 28, 'โลก', '#1d4ed8', 700, 9.5) +
      ttc(250, y - 14, 'ในเงามืด', '#7f1d1d', 700, 9.5) + ttc(250, y - 3, '', '') + ttc(222, y + 36, 'ในเงามัว', '#57534e', 700, 9) +
      ttc(180, 128, 'ผู้คนฝั่งกลางคืนของโลกเห็นได้ทั่วกัน · เกิดตอนดวงจันทร์เต็มดวง (ขึ้น 15 ค่ำ)', '#111827', 700, 9.5) +
      ttc(180, 144, 'ในเงามืดทั้งดวง = เต็มดวง (สีแดงคล้ำ) · เข้าบางส่วน = บางส่วน', '#374151', 700, 9.5) +
      ttc(180, 160, '(ภาพไม่ได้สัดส่วน)', '#64748b', 600, 9));
  })();

  /* 5) มุมทิศและมุมเงย */
  (function () {
    const cx = 92, cy = 104, r = 52;
    const sa = 35 * Math.PI / 180, ox = 262, oy = 168, len = 62;
    F['p6-star-sky'] = svg(232,
      'มุมทิศวัดจากทิศเหนือตามเข็มนาฬิกา เหนือ 0 ตะวันออก 90 ใต้ 180 ตะวันตก 270 มุมเงยวัดจากขอบฟ้า 0 ถึงจุดเหนือศีรษะ 90 องศา',
      ttc(92, 14, 'มุมทิศ (มองจากข้างบน)', '#111827', 700, 10.5) + ttc(280, 14, 'มุมเงย (มองจากข้าง)', '#111827', 700, 10.5) +
      O(cx, cy, r, '#f1f5f9', 'currentColor') + L(cx, cy - r, cx, cy + r, GRY, 1) + L(cx - r, cy, cx + r, cy, GRY, 1) +
      ttc(cx, cy - r - 6, 'เหนือ 0°', '#111827', 700, 10) + ttc(cx + r + 8, cy + 4, 'ตะวันออก', '#111827', 700, 9.5).replace('x="146"', 'x="150"') + ttc(cx + r + 8, cy + 16, '90°', '#111827', 700, 9.5) + ttc(cx, cy + r + 14, 'ใต้ 180°', '#111827', 700, 10) + ttc(cx - r - 14, cy + 4, 'ตะวันตก', '#111827', 700, 9.5) + ttc(cx - r - 14, cy + 16, '270°', '#111827', 700, 9.5) +
      `<path d="M${cx} ${cy - 38}A38 38 0 0 1 ${cx + 38} ${cy}" fill="none" stroke="${RED}" stroke-width="2.4" marker-end="url(#ahR)"/>` + ttc(cx + 30, cy - 30, '', '') + tt(cx + 12, cy - 24, 'วัดตามเข็ม', '#b91c1c', 700, 8.5) +
      L(ox - 70, oy, ox + 62, oy, 'currentColor', 2.5) + L(ox, oy, ox, oy - 112, GRY, 1.5, 'stroke-dasharray="4 4"') +
      L(ox, oy, ox + len * Math.cos(sa), oy - len * Math.sin(sa), '#1d4ed8', 2) + `<path d="M${ox + 36} ${oy}A36 36 0 0 0 ${ox + 36 * Math.cos(sa)} ${oy - 36 * Math.sin(sa)}" fill="none" stroke="${RED}" stroke-width="2.2"/>` +
      O(ox + len * Math.cos(sa), oy - len * Math.sin(sa), 6, YEL, '#ca8a04') + ttc(ox + 56, oy - 10, '35°', '#b91c1c', 700, 10) +
      tt(ox - 66, oy + 14, 'ขอบฟ้า (0°)', '#111827', 700, 9.5) + tt(ox - 40, oy - 118, 'เหนือศีรษะ 90°', '#111827', 700, 9.5) + ttc(ox, oy + 30, 'ผู้สังเกต', '#374151', 600, 9) +
      ttc(180, 224, 'มุมทิศ = วัดไปทางขวาตามเข็มจากทิศเหนือ · มุมเงย = วัดขึ้นจากขอบฟ้า', '#111827', 700, 9));
  })();

  /* 6) แผนที่ดาวด้านทิศใต้ ขึ้นทางตะวันออก ตกทางตะวันตก */
  F['p6-star-map'] = svg(238,
    'แผนที่ดาวหันหน้าไปทางทิศใต้ ตะวันออกอยู่ทางซ้าย ตะวันตกอยู่ทางขวา ดาวขึ้นทางตะวันออกและตกทางตะวันตก ดาวใกล้ขอบฟ้าตะวันตกจะตกก่อน',
    L(14, 190, 346, 190, 'currentColor', 3) + R(14, 190, 332, 30, '#86efac', 'none', 'opacity="0.6"') +
    `<path d="M24 190Q70 40 180 36Q290 40 336 190" fill="none" stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="4 4"/>` +
    arrow('M50 130Q70 80 112 62', '#94a3b8') + arrow('M170 38Q216 36 252 60', '#94a3b8') + arrow('M300 120Q310 150 316 178', '#94a3b8') +
    O(50, 130, 6, YEL, '#ca8a04') + ttc(66, 150, 'ดาว A', '#111827', 700, 10) + O(170, 38, 6, YEL, '#ca8a04') + ttc(186, 26, 'ดาว B', '#111827', 700, 10) + O(300, 120, 6, YEL, '#ca8a04') + ttc(318, 112, 'ดาว C', '#111827', 700, 10) +
    ttc(32, 208, 'ตะวันออก 90°', '#111827', 700, 9.5) + ttc(180, 208, 'ทิศใต้ 180°', '#111827', 700, 9.5) + ttc(328, 208, 'ตะวันตก 270°', '#111827', 700, 9.5) +
    ttc(32, 232, '(ซ้าย)', '#374151', 600, 9) + ttc(328, 232, '(ขวา)', '#374151', 600, 9) +
    ttc(180, 96, 'ขึ้นทางตะวันออก → ตกทางตะวันตก', '#111827', 700, 10) + ttc(180, 112, 'ใกล้ขอบฟ้าตะวันตก = ตกก่อน', '#b91c1c', 700, 9.5) + ttc(180, 126, 'ใกล้ขอบฟ้าตะวันออก = ตกทีหลังสุด', '#1d4ed8', 700, 9.5));

  /* 7) ประเภทดาวเทียม */
  (function () {
    const card = (x, y, title, l1, l2, col) => R(x, y, 172, 66, col) + `<rect x="${x + 10}" y="${y + 24}" width="14" height="14" fill="#64748b" stroke="currentColor" stroke-width="1.5"/><rect x="${x + 2}" y="${y + 28}" width="8" height="6" fill="#3b82f6"/><rect x="${x + 24}" y="${y + 28}" width="8" height="6" fill="#3b82f6"/>` +
      tt(x + 40, y + 20, title, '#111827', 700, 10.5) + tt(x + 40, y + 36, l1, '#374151', 600, 9.5) + tt(x + 40, y + 50, l2, '#374151', 600, 9.5);
    F['p6-sat-types'] = svg(252,
      'ดาวเทียมมีหลายประเภท ดาวเทียมสื่อสาร ดาวเทียมอุตุนิยมวิทยา ดาวเทียมสำรวจทรัพยากรโลก และดาวเทียมดาราศาสตร์',
      card(4, 6, 'สื่อสาร', 'ส่งโทรทัศน์ โทรศัพท์', 'อินเทอร์เน็ต', '#dbeafe') + card(184, 6, 'อุตุนิยมวิทยา', 'ถ่ายภาพเมฆ พายุ', 'อุณหภูมิ พยากรณ์อากาศ', '#e0f2fe') +
      O(180, 119, 26, '#60a5fa', '#1d4ed8') + ttc(180, 123, 'โลก', '#111827', 700, 10) +
      card(4, 164, 'สำรวจทรัพยากรโลก', 'ถ่ายภาพป่าไม้ แหล่งน้ำ', 'ภูมิประเทศ พื้นที่เพาะปลูก', '#dcfce7') + card(184, 164, 'ดาราศาสตร์', 'ถ่ายภาพดาว กาแล็กซี', 'จากนอกชั้นบรรยากาศ', '#ede9fe') +
      ttc(180, 247, 'ดาวเทียมโคจรรอบโลก · ใช้ดูอะไร ก็เป็นดาวเทียมประเภทนั้น', '#111827', 700, 9));
  })();

  /* 8) ระบบสุริยะ (ไม่ได้สัดส่วน) */
  (function () {
    const pl = [['พุธ', 76, 4, '#a8a29e'], ['ศุกร์', 104, 7, '#fcd34d'], ['โลก', 132, 7.5, '#60a5fa'], ['อังคาร', 160, 5, '#f87171'], ['พฤหัสบดี', 200, 17, '#fdba74'], ['เสาร์', 252, 14, '#fde68a'], ['ยูเรนัส', 296, 9, '#67e8f9'], ['เนปจูน', 334, 9, '#818cf8']];
    let b = O(0, 100, 46, '#f59e0b', '#ca8a04') + ttc(40, 160, 'ดวงอาทิตย์', '#92400e', 700, 9);
    pl.forEach((p, i) => {
      b += O(p[1], 100, p[2], p[3], 'currentColor');
      if (p[0] === 'เสาร์') b += `<ellipse cx="${p[1]}" cy="100" rx="22" ry="5" fill="none" stroke="#a16207" stroke-width="1.5"/>`;
      b += ttc(p[1], i % 2 ? 144 : 132, p[0], '#111827', 700, 9.5);
      b += ttc(p[1], i % 2 ? 130 + 28 : 130 + 16, '', '');
    });
    b += `<path d="M64 62H174" stroke="#b45309" stroke-width="2.5"/>` + ttc(119, 54, 'วงใน (เป็นหิน) 4 ดวง', '#b45309', 700, 9.5) +
      `<path d="M184 36H354" stroke="#1d4ed8" stroke-width="2.5"/>` + ttc(269, 28, 'วงนอก (ก๊าซ/น้ำแข็ง) 4 ดวง', '#1d4ed8', 700, 9.5) +
      L(180, 40, 180, 64, GRY, 1, 'stroke-dasharray="3 3"') + ttc(180, 176, 'ระหว่างอังคารกับพฤหัสบดีมีแถบดาวเคราะห์น้อย', '#374151', 600, 9.5) +
      ttc(180, 194, 'พุธ ศุกร์ โลก อังคาร พฤหัสบดี เสาร์ ยูเรนัส เนปจูน (จากใกล้ไปไกลดวงอาทิตย์)', '#111827', 700, 9) + ttc(180, 210, '(ภาพไม่ได้สัดส่วนขนาดและระยะ)', '#64748b', 600, 9);
    F['p6-solar-system'] = svg(220, 'ระบบสุริยะมีดวงอาทิตย์และดาวเคราะห์แปดดวงเรียงจากใกล้ไปไกล พุธ ศุกร์ โลก อังคาร พฤหัสบดี เสาร์ ยูเรนัส เนปจูน', b);
  })();

  /* ===== ว 1.3 การจำแนกสิ่งมีชีวิต และลักษณะทางพันธุกรรม ===== */
  const MNT = '#dcfce7', SND = '#fef9c3', SKB = '#e0f2fe';

  /* 1) แผนผังกลุ่มสิ่งมีชีวิต */
  (function () {
    const bx = (x, y, w, h, col, l1, l2, l3) => R(x, y, w, h, col) + ttc(x + w / 2, y + 16, l1, '#111827', 700, 10.5) + (l2 ? ttc(x + w / 2, y + 30, l2, '#374151', 600, 8.5) : '') + (l3 ? ttc(x + w / 2, y + 42, l3, '#374151', 600, 8.5) : '');
    F['p6-groups-living'] = svg(250,
      'การจำแนกสิ่งมีชีวิตเป็นพืช สัตว์ และกลุ่มที่ไม่ใช่พืชและสัตว์ พืชแบ่งเป็นพืชดอกและพืชไม่มีดอก สัตว์แบ่งเป็นมีและไม่มีกระดูกสันหลัง',
      bx(120, 6, 120, 30, '#e5e7eb', 'สิ่งมีชีวิต', '', '') +
      L(180, 36, 180, 48, GRY, 1.5) + L(58, 48, 304, 48, GRY, 1.5) + L(58, 48, 58, 60, GRY, 1.5) + L(184, 48, 184, 60, GRY, 1.5) + L(304, 48, 304, 60, GRY, 1.5) +
      bx(8, 60, 100, 28, MNT, 'พืช', '', '') + bx(116, 60, 136, 28, SKB, 'สัตว์', '', '') + bx(260, 60, 94, 40, SND, 'ไม่ใช่พืช', 'และสัตว์', '') +
      bx(8, 104, 100, 56, '#bbf7d0', 'พืชดอก', 'ข้าว มะพร้าว ชบา', 'มีดอก ผล เมล็ด') + bx(8, 168, 100, 56, '#d9f99d', 'พืชไม่มีดอก', 'เฟิน มอส สน', 'ไม่มีดอก') +
      bx(116, 104, 136, 66, '#bae6fd', 'มีกระดูกสันหลัง', 'ปลา สะเทินน้ำสะเทินบก', 'เลื้อยคลาน นก เลี้ยงลูกด้วยนม') + bx(116, 178, 136, 46, '#e0f2fe', 'ไม่มีกระดูกสันหลัง', 'ปู แมลง หอย หนอน', '') +
      bx(260, 108, 94, 80, '#fde68a', 'เห็ด รา ยีสต์', 'ไม่มีคลอโรฟิลล์', 'สร้างอาหารเองไม่ได้') +
      ttc(180, 244, 'จัดกลุ่มโดยดู ลักษณะที่เหมือนและต่างกัน เช่น มีดอก มีกระดูกสันหลัง', '#111827', 700, 9));
  })();

  /* 2) สัตว์มีกระดูกสันหลัง 5 กลุ่ม */
  (function () {
    const heads = ['ผิวหนัง', 'หายใจ', 'การออกลูก', 'อุณหภูมิกาย'];
    const rows = [['ปลา', ['เกล็ด'], ['เหงือก'], ['ไข่'], ['เลือดเย็น']], ['สะเทินน้ำ', ['เปียกชื้น', 'ไม่มีเกล็ด'], ['เหงือก→ปอด', 'และผิวหนัง'], ['ไข่ในน้ำ'], ['เลือดเย็น']], ['เลื้อยคลาน', ['เกล็ดแห้ง'], ['ปอด'], ['ไข่', 'เปลือกแข็ง'], ['เลือดเย็น']], ['นก', ['ขนเป็นแผง', '(ขนนก)'], ['ปอด'], ['ไข่', 'เปลือกแข็ง'], ['เลือดอุ่น']], ['เลี้ยงลูก', ['ขนเป็นเส้น'], ['ปอด'], ['ออกลูกเป็นตัว', 'กินนม'], ['เลือดอุ่น']]];
    const cols = ['#bae6fd', '#bbf7d0', '#fde68a', '#fecaca', '#e9d5ff'];
    let b = '';
    heads.forEach((h, i) => { b += R(86 + i * 68, 8, 66, 22, '#e5e7eb') + ttc(119 + i * 68, 23, h, '#111827', 700, 9.5); });
    rows.forEach((r, j) => {
      const y = 34 + j * 40;
      b += R(4, y, 80, 36, cols[j]) + ttc(44, y + 22, r[0], '#111827', 700, 10);
      for (let i = 0; i < 4; i++) {
        const hot = (i === 3) ? (r[4][0] === 'เลือดอุ่น' ? '#fee2e2' : '#e0f2fe') : '#fff';
        b += R(86 + i * 68, y, 66, 36, hot, '#94a3b8');
        r[i + 1].forEach((s, k) => { b += ttc(119 + i * 68, y + (r[i + 1].length === 1 ? 22 : 15 + k * 12), s, '#111827', 600, 8.5); });
      }
    });
    b += ttc(180, 244, 'เลือดเย็น = อุณหภูมิกายเปลี่ยนตามแวดล้อม · เลือดอุ่น = คงที่', '#111827', 700, 9) + ttc(180, 258, 'ตุ่นปากเป็ด (สัตว์เลี้ยงลูกด้วยนม) ออกลูกเป็นไข่', '#374151', 600, 9);
    F['p6-vertebrate-groups'] = svg(266, 'ตารางเปรียบเทียบสัตว์มีกระดูกสันหลัง 5 กลุ่ม ผิวหนัง การหายใจ การออกลูก และอุณหภูมิร่างกาย', b);
  })();

  /* 3) พืชดอก เฟิน มอส */
  F['p6-plant-groups'] = svg(240,
    'พืชดอกมีดอกผลเมล็ด เฟินไม่มีดอกแต่มีสปอร์ใต้ใบ มอสตัวเล็กเป็นพรมไม่มีลำต้นจริง ทั้งหมดมีสีเขียวสร้างอาหารเองได้',
    R(4, 22, 112, 152, '#f0fdf4') + R(124, 22, 112, 152, '#f0fdf4') + R(244, 22, 112, 152, '#f0fdf4') +
    ttc(60, 16, 'พืชดอก', '#166534', 700, 11) + ttc(180, 16, 'เฟิน', '#166534', 700, 11) + ttc(300, 16, 'มอส', '#166534', 700, 11) +
    L(60, 164, 60, 90, '#15803d', 4) + `<path d="M60 130C36 120 26 130 24 140C42 144 54 140 60 130Z" fill="#4ade80"/><path d="M60 112C84 102 94 112 96 122C78 126 66 122 60 112Z" fill="#4ade80"/>` +
    O(60, 78, 8, '#fde047', '#a16207') + `<path d="M60 70C54 58 66 58 60 70M60 86C54 98 66 98 60 86M52 78C40 72 40 84 52 78M68 78C80 72 80 84 68 78" fill="#f472b6" stroke="#be185d"/>` + O(86, 150, 6, '#dc2626', '#7f1d1d') +
    ttc(60, 184, 'มีดอก ผล เมล็ด', '#111827', 700, 9.5) + ttc(60, 198, 'เรณู + เซลล์ไข่ ในดอก', '#374151', 600, 9) + ttc(60, 212, 'ข้าว มะพร้าว ชบา', '#374151', 600, 9) +
    `<path d="M180 164C176 130 176 100 180 60" stroke="#15803d" stroke-width="3" fill="none"/>` +
    [0, 1, 2, 3, 4].map(i => `<path d="M180 ${68 + i * 20}C${158 - i} ${62 + i * 20} ${146 - i} ${70 + i * 20} ${140 - i} ${80 + i * 20}" stroke="#16a34a" stroke-width="3" fill="none"/><path d="M180 ${68 + i * 20}C${202 + i} ${62 + i * 20} ${214 + i} ${70 + i * 20} ${220 + i} ${80 + i * 20}" stroke="#16a34a" stroke-width="3" fill="none"/>`).join('') +
    [0, 1, 2].map(i => O(150 - i * 2, 84 + i * 22, 2.4, '#7c2d12') + O(210 + i * 2, 84 + i * 22, 2.4, '#7c2d12')).join('') +
    ttc(180, 184, 'ไม่มีดอก', '#111827', 700, 9.5) + ttc(180, 198, 'สปอร์ใต้ใบ (จุดสีน้ำตาล)', '#374151', 600, 9) + ttc(180, 212, 'ใบอ่อนม้วนเป็นวง', '#374151', 600, 9) +
    L(256, 138, 344, 138, '#a16207', 2) + [0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => `<path d="M${262 + i * 10} 138C${260 + i * 10} 124 ${268 + i * 10} 118 ${266 + i * 10} 112" stroke="#22c55e" stroke-width="5" fill="none" stroke-linecap="round"/>`).join('') +
    [0, 1, 2, 3, 4].map(i => L(266 + i * 18, 138, 262 + i * 18, 152, '#a16207', 1.2)).join('') +
    ttc(300, 184, 'ไม่มีดอก ตัวเล็กเป็นพรม', '#111827', 700, 9.5) + ttc(300, 198, 'ไม่มีรากจริง (ไรซอยด์)', '#374151', 600, 9) + ttc(300, 212, 'ชอบที่ชื้นแฉะ', '#374151', 600, 9) +
    ttc(180, 234, 'พืชทั้งสามกลุ่มสีเขียว มีคลอโรฟิลล์ สร้างอาหารเองได้', '#b91c1c', 700, 9));

  /* 4) ลักษณะแฝง */
  (function () {
    const per = (x, y, name, shown, col, hid) => O(x, y, 22, col, 'currentColor') + ttc(x, y + 4, shown, '#111827', 700, 9.5) + ttc(x, y + 40, name, '#374151', 700, 9.5) + (hid ? R(x + 14, y - 28, 24, 16, '#fed7aa') + ttc(x + 26, y - 17, 'แฝง', '#9a3412', 700, 8.5) : '');
    F['p6-latent-trait'] = svg(246,
      'พ่อแม่ห่อลิ้นได้ แต่มีลักษณะห่อลิ้นไม่ได้แฝงอยู่ ลูกบางคนได้รับลักษณะแฝงทั้งสองจึงปรากฏห่อลิ้นไม่ได้',
      per(100, 50, 'พ่อ', 'ห่อได้', '#bbf7d0', true) + per(260, 50, 'แม่', 'ห่อได้', '#bbf7d0', true) +
      L(122, 50, 238, 50, 'currentColor', 2) + L(180, 50, 180, 108, 'currentColor', 2) + L(100, 108, 260, 108, 'currentColor', 2) + L(100, 108, 100, 124, 'currentColor', 2) + L(260, 108, 260, 124, 'currentColor', 2) +
      per(100, 146, 'พี่สาว', 'ห่อได้', '#bbf7d0', false) + per(260, 146, 'น้องชาย', 'ห่อไม่ได้', '#fecaca', false) +
      ttc(180, 206, 'ลักษณะแฝง = มีอยู่ในพ่อแม่ แต่ไม่แสดงออก', '#9a3412', 700, 10) +
      ttc(180, 222, 'ถ่ายทอดไปปรากฏในลูกได้ · ลูกจึงไม่ต้องเหมือนพ่อแม่ทุกลักษณะ', '#111827', 700, 9.5) + ttc(180, 238, 'ไม่ขึ้นกับเพศ · ฝึกให้เปลี่ยนไม่ได้', '#374151', 600, 9.5));
  })();

  /* 5) สืบพันธุ์แบบไม่อาศัยเพศ เทียบอาศัยเพศ */
  F['p6-reproduction-two'] = svg(238,
    'การสืบพันธุ์แบบไม่อาศัยเพศไม่มีการผสมของเซลล์สืบพันธุ์ เช่น หน่อกล้วย การสืบพันธุ์แบบอาศัยเพศมีการปฏิสนธิ เช่น เมล็ด การผสมพันธุ์ การผสมเทียม',
    R(4, 22, 172, 150, '#f0fdf4') + R(184, 22, 172, 150, '#fff7ed') +
    ttc(90, 16, 'ไม่อาศัยเพศ', '#166534', 700, 11.5) + ttc(270, 16, 'อาศัยเพศ', '#9a3412', 700, 11.5) +
    L(60, 150, 60, 80, '#15803d', 7) + `<path d="M60 112C34 102 26 112 24 122C42 126 54 122 60 112Z" fill="#4ade80"/><path d="M60 96C84 86 92 96 94 106C78 110 66 106 60 96Z" fill="#4ade80"/>` +
    L(60, 150, 124, 150, '#a16207', 2) + L(110, 150, 110, 118, '#4ade80', 6) + `<path d="M110 118C102 108 112 100 118 108Z" fill="#4ade80"/>` + arrow('M66 138H100', GRY) +
    ttc(90, 166, 'ต้นแม่ → หน่อ', '#111827', 700, 9.5) +
    O(222, 70, 12, '#fde047', '#a16207') + ttc(222, 74, 'เรณู', '#111827', 700, 8.5) + O(222, 124, 14, '#fda4af', '#9f1239') + ttc(222, 128, 'ไข่', '#111827', 700, 9) + arrow('M222 84V108', GRY) +
    arrow('M244 98H290', GRY) + O(318, 98, 16, '#bef264', '#4d7c0f') + ttc(318, 102, 'เมล็ด', '#111827', 700, 9) +
    ttc(270, 150, 'เซลล์สืบพันธุ์ผสมกัน', '#111827', 700, 9.5) + ttc(270, 164, '(ปฏิสนธิ)', '#374151', 600, 9) +
    ttc(90, 190, 'ไม่มีการผสมของเซลล์สืบพันธุ์', '#166534', 700, 9.5) + ttc(90, 204, 'หน่อกล้วย หัวมันฝรั่ง ปักชำ', '#374151', 600, 9.5) + ttc(90, 218, 'ลูกเหมือนต้นแม่', '#374151', 600, 9.5) +
    ttc(270, 190, 'เมล็ด · ผสมพันธุ์ · ผสมเทียมปลา', '#9a3412', 700, 9.5) + ttc(270, 204, 'ลูกต่างจากพ่อแม่ได้บ้าง', '#374151', 600, 9.5) + ttc(270, 218, 'ผสมเทียม ก็ยังเป็นอาศัยเพศ', '#374151', 600, 9.5));

  /* ===== ว 4.2 เหตุผลเชิงตรรกะ ผังงาน โปรแกรม การค้นหาข้อมูล ===== */

  /* 1) ผังงาน ซื้อทีละชิ้นจนครบ */
  F['p6-flow-buy'] = svg(284,
    'ผังงานซื้อผลไม้ทีละชิ้น ตรวจว่าเงินพอหรือไม่ ถ้าพอซื้อหนึ่งชิ้น แล้วตรวจว่าได้วิตามินครบหรือยัง ถ้ายังไม่ครบวนกลับไปตรวจเงินอีก ถ้าครบก็จบ',
    `<rect x="110" y="6" width="80" height="26" rx="13" fill="#bbf7d0" stroke="currentColor" stroke-width="2"/>` + ttc(150, 24, 'เริ่ม', '#111827', 700, 10.5) +
    arrow('M150 32V46', GRY) + `<polygon points="150,46 224,72 150,98 76,72" fill="#fde68a" stroke="currentColor" stroke-width="2"/>` + ttc(150, 76, 'เงินพอไหม ?', '#111827', 700, 10.5) +
    arrow('M224 72H252', GRY) + ttc(238, 64, 'ไม่พอ', '#b91c1c', 700, 9) + `<rect x="254" y="58" width="76" height="28" rx="14" fill="#fecaca" stroke="currentColor" stroke-width="2"/>` + ttc(292, 76, 'หยุดซื้อ', '#111827', 700, 10) +
    arrow('M150 98V116', GRY) + ttc(166, 110, 'พอ', '#15803d', 700, 9) + R(100, 116, 100, 28, '#fef9c3') + ttc(150, 134, 'ซื้อ 1 ชิ้น', '#111827', 700, 10.5) +
    arrow('M150 144V160', GRY) + `<polygon points="150,160 224,186 150,212 76,186" fill="#fde68a" stroke="currentColor" stroke-width="2"/>` + ttc(150, 184, 'วิตามินครบ', '#111827', 700, 9.5) + ttc(150, 196, 'หรือยัง ?', '#111827', 700, 9.5) +
    arrow('M150 212V232', GRY) + ttc(166, 226, 'ครบ', '#15803d', 700, 9) + `<rect x="110" y="232" width="80" height="26" rx="13" fill="#bbf7d0" stroke="currentColor" stroke-width="2"/>` + ttc(150, 250, 'จบ', '#111827', 700, 10.5) +
    `<path d="M76 186H24V72H72" fill="none" stroke="${GRY}" stroke-width="2.2" marker-end="url(#ahG)"/>` + ttc(48, 178, 'ยังไม่ครบ', '#b91c1c', 700, 9) + ttc(48, 190, '(วนซ้ำ)', '#374151', 600, 9) +
    tt(236, 186, 'ตรวจเงินก่อนซื้อ', '#374151', 700, 9) + tt(236, 200, 'ซื้อทีละชิ้น', '#374151', 700, 9) + tt(236, 214, 'ตรวจครบ แล้ววนซ้ำ', '#374151', 700, 9));

  /* 2) ตารางเหตุผล ขึ้นรถ */
  (function () {
    const people = ['ก', 'ข', 'ค', 'ง'], ans = [0, 0, 2, 1];
    let b = tt(6, 16, '① ค ขึ้นคันที่ 3 คนเดียว  ② ก กับ ข ขึ้นคันเดียวกัน', '#111827', 700, 9.5) + tt(6, 30, '③ ง ไม่ได้ขึ้นคันเดียวกับ ก  ④ คันที่ 2 มีผู้โดยสาร 1 คน', '#111827', 700, 9.5);
    ['คันที่ 1', 'คันที่ 2', 'คันที่ 3'].forEach((h, i) => { b += R(70 + i * 70, 42, 68, 24, '#e5e7eb') + ttc(104 + i * 70, 58, h, '#111827', 700, 10); });
    people.forEach((p, j) => {
      const y = 68 + j * 30;
      b += R(30, y, 38, 28, '#fef9c3') + ttc(49, y + 19, p, '#111827', 700, 11);
      for (let i = 0; i < 3; i++) { const ok = ans[j] === i; b += R(70 + i * 70, y, 68, 28, ok ? '#bbf7d0' : '#fff', '#94a3b8') + ttc(104 + i * 70, y + 19, ok ? '✓' : '✗', ok ? '#15803d' : '#b91c1c', 700, 12); }
    });
    b += ttc(180, 204, 'ค คนเดียวคันที่ 3 → ก ข ง เหลือคันที่ 1, 2 · ก ข อยู่คู่กัน ง แยก', '#111827', 700, 9) + ttc(180, 218, 'คันที่ 2 มี 1 คน = ง → ก และ ข อยู่คันที่ 1', '#b91c1c', 700, 9.5);
    F['p6-logic-grid'] = svg(228, 'ตารางตัดตัวเลือกจากเงื่อนไข ค คนเดียวขึ้นคันที่ 3 ก กับ ข ขึ้นคันที่ 1 ง ขึ้นคันที่ 2', b);
  })();

  /* 3) การค้นหาข้อมูลและโดเมน */
  F['p6-search-ops'] = svg(266,
    'การค้นหาข้อมูลในอินเทอร์เน็ต ใช้ site จำกัดโดเมน filetype จำกัดชนิดไฟล์ และกำหนดช่วงเวลา เว็บที่น่าเชื่อถือลงท้ายด้วย go.th และ ac.th',
    R(6, 8, 348, 32, '#fff', '#64748b') + tt(14, 29, '"โลมา" site:ac.th filetype:pdf', '#111827', 700, 11.5) + tt(12, 56, 'ช่วงเวลา: 1 ม.ค. 2566 – 31 ม.ค. 2566 (ตั้งในเครื่องมือค้นหา)', '#374151', 700, 9.5) +
    R(6, 66, 170, 108, '#f0fdf4') + R(184, 66, 170, 108, '#eff6ff') +
    ttc(91, 82, 'คำสั่งช่วยค้น', '#166534', 700, 10.5) + tt(14, 98, 'site:go.th', '#111827', 700, 10) + tt(14, 111, 'เฉพาะเว็บหน่วยงานรัฐ', '#374151', 600, 9) + tt(14, 128, 'filetype:pdf', '#111827', 700, 10) + tt(14, 141, 'เฉพาะไฟล์ PDF', '#374151', 600, 9) + tt(14, 158, '"ข้อความ"', '#111827', 700, 10) + tt(14, 170, 'ต้องมีข้อความนี้ตรงตัว', '#374151', 600, 9) +
    ttc(269, 82, 'ชื่อโดเมน บอกที่มา', '#1d4ed8', 700, 10.5) + tt(192, 98, '.go.th  หน่วยงานรัฐ', '#111827', 700, 9.5) + tt(192, 113, '.ac.th  สถาบันการศึกษา', '#111827', 700, 9.5) + tt(192, 128, '.or.th  องค์กร มูลนิธิ', '#111827', 700, 9.5) + tt(192, 143, '.co.th  บริษัท ธุรกิจ', '#111827', 700, 9.5) + tt(192, 158, '.com .net  ทั่วไป ใครก็ใช้ได้', '#111827', 700, 9.5) +
    R(6, 182, 348, 78, '#fef2f2') + tt(14, 200, 'แหล่งข้อมูลที่น่าเชื่อถือ: หน่วยงานรัฐ (go.th) · สถาบันการศึกษา (ac.th)', '#15803d', 700, 9.5) + tt(14, 216, 'องค์กรเฉพาะทาง เช่น องค์การอนามัยโลก · ระบุผู้เขียนและวันที่', '#15803d', 700, 9.5) +
    tt(14, 236, 'ไม่ควรใช้เป็นหลัก: เว็บบันเทิง · สารานุกรมที่ใครก็แก้ไขได้', '#b91c1c', 700, 9.5) + tt(14, 252, 'คำค้นยิ่งเฉพาะ ยิ่งเจอข้อมูลตรงกับที่ต้องการ', '#374151', 700, 9.5));

  /* 4) โค้ดบล็อก: ผิดกับถูก */
  (function () {
    const blk = (x, y, w, h, col, txt) => R(x, y, w, h, col, '#7c2d12') + tt(x + 6, y + 14, txt, '#fff', 700, 9);
    const half = (ox, title, bad) => {
      let b = ttc(ox + 84, 14, title, bad ? '#b91c1c' : '#15803d', 700, 10.5);
      b += blk(ox, 22, 170, 22, '#d97706', 'วนซ้ำตลอดไป (forever)');
      b += blk(ox + 10, 44, 150, 22, '#2563eb', 'ถ้า เมาส์ขยับ');
      b += blk(ox + 22, 66, 126, 20, '#8b5cf6', 'ตั้งตัวจับเวลา = 0');
      b += blk(ox + 10, 86, 150, 20, '#2563eb', 'ไม่เช่นนั้น');
      b += blk(ox + 22, 106, 126, 20, '#8b5cf6', 'เพิ่มตัวจับเวลา 1');
      if (bad) {
        b += blk(ox + 22, 126, 126, 22, '#2563eb', 'ถ้า ตัวจับเวลา > 50') + blk(ox + 34, 148, 100, 20, '#16a34a', 'ซ่อน sprite') + R(ox + 22, 124, 126, 46, 'none', '#b91c1c', 'stroke-dasharray="4 3"') + tt(ox + 4, 188, 'ผิด: ตรวจเวลา อยู่ใน "ไม่เช่นนั้น"', '#b91c1c', 700, 9) + tt(ox + 4, 202, 'ทำงานเฉพาะตอนเมาส์ขยับ (เพิ่งรีเซ็ตเป็น 0)', '#374151', 600, 8.5);
      } else {
        b += blk(ox + 10, 130, 150, 22, '#2563eb', 'ถ้า ตัวจับเวลา > 50') + blk(ox + 22, 152, 126, 20, '#16a34a', 'ซ่อน sprite') + R(ox + 10, 128, 150, 46, 'none', '#15803d', 'stroke-dasharray="4 3"') + tt(ox + 4, 188, 'ถูก: ตรวจเวลา อยู่ระดับเดียวกับ if แรก', '#15803d', 700, 9) + tt(ox + 4, 202, 'ตรวจทุกรอบ ตัวจับเวลาถึง 50 จึงซ่อน', '#374151', 600, 8.5);
      }
      return b;
    };
    F['p6-scratch-bug'] = svg(214,
      'โค้ดบล็อกปิดไฟอัตโนมัติ แบบผิดคือบล็อกตรวจตัวจับเวลาอยู่ในส่วนไม่เช่นนั้น แบบถูกคือวางระดับเดียวกับบล็อกถ้าแรกในลูปวนซ้ำ',
      half(4, 'แบบผิด', true) + half(188, 'แบบถูก', false) + ttc(180, 212, '', ''));
  })();

  /* 5) การวาดรูปด้วยคำสั่งเดิน-หมุน */
  F['p6-turtle'] = svg(220,
    'ตัวละครเดินหน้าแล้วหมุนซ้ำ เดิน 50 หมุนขวา 90 ทำ 4 ครั้งได้สี่เหลี่ยมจัตุรัส เดิน 60 หมุน 120 ทำ 3 ครั้งได้สามเหลี่ยมด้านเท่า',
    R(4, 8, 172, 160, '#f8fafc') + R(184, 8, 172, 160, '#f8fafc') +
    `<polygon points="48,54 128,54 128,134 48,134" fill="none" stroke="#1d4ed8" stroke-width="3"/>` + arrow('M48 54H92', RED) + arrow('M128 54V98', RED) + arrow('M128 134H84', RED) + arrow('M48 134V90', RED) + O(48, 54, 5, '#15803d') +
    ttc(90, 30, 'ทำซ้ำ 4 ครั้ง', '#111827', 700, 10.5) + ttc(90, 44, 'เดิน 50 · หมุนขวา 90°', '#374151', 700, 9.5) + ttc(90, 156, 'ได้ สี่เหลี่ยมจัตุรัส', '#1d4ed8', 700, 10) +
    `<polygon points="270,62 330,62 300,114" fill="none" stroke="#1d4ed8" stroke-width="3"/>` + arrow('M270 62H306', RED) + arrow('M330 62L316 86', RED) + arrow('M300 114L286 90', RED) + O(270, 62, 5, '#15803d') +
    ttc(270, 30, 'ทำซ้ำ 3 ครั้ง', '#111827', 700, 10.5) + ttc(270, 44, 'เดิน 60 · หมุน 120°', '#374151', 700, 9.5) + ttc(270, 156, 'ได้ สามเหลี่ยมด้านเท่า', '#b91c1c', 700, 10) +
    ttc(180, 188, 'มุมหมุนต่อรอบ = 360° ÷ จำนวนด้าน (4 ด้าน → 90° · 3 ด้าน → 120°)', '#111827', 700, 9.5) + ttc(180, 206, 'รอบเดียวไม่ครบรูป · ทำซ้ำครบจึงกลับจุดเริ่ม', '#374151', 600, 9.5));

  /* 6) ลำดับขั้นตอนของโปรแกรม */
  (function () {
    const st = [['1', 'กำหนดตัวแปร', '#e0f2fe'], ['2', 'เก็บข้อมูล', '#dbeafe'], ['3', 'วิเคราะห์ข้อมูล', '#dcfce7'], ['4', 'สร้างทางเลือก', '#fef9c3'], ['5', 'คำนวณเปรียบเทียบ', '#fde68a'], ['6', 'แสดงผล', '#fecaca']];
    let b = '';
    st.forEach((s, i) => { const x = 8 + i * 56, y = 150 - i * 22; b += R(x, y, 54, 28 + i * 22, s[2]) + ttc(x + 27, y + 18, s[0], '#111827', 700, 12) + (i < 5 ? '' : ''); b += tt(x + 2, 188 + 0, '', ''); });
    st.forEach((s, i) => { b += ttc(8 + i * 56 + 27, 214 + (i % 2) * 12, s[1], '#111827', 700, 8.5); });
    b += ttc(180, 14, 'ลำดับการทำงานของโปรแกรมวิเคราะห์การใช้น้ำ', '#111827', 700, 10.5) + ttc(180, 246, 'ต้องมี "ตัวแปร" ก่อน → เก็บข้อมูล → วิเคราะห์ → ทางเลือก → เทียบ → แสดงผล', '#b91c1c', 700, 9);
    F['p6-steps-order'] = svg(256, 'ลำดับขั้นตอนของโปรแกรม กำหนดตัวแปร เก็บข้อมูล วิเคราะห์ สร้างทางเลือก คำนวณเปรียบเทียบ แสดงผล', b);
  })();

  /* ===== ว 1.1 ความสัมพันธ์ในระบบนิเวศ โซ่อาหาร การปรับตัว ===== */

  /* 1) ความสัมพันธ์ระหว่างสิ่งมีชีวิต */
  F['p6-symbiosis'] = svg(256,
    'ความสัมพันธ์ระหว่างสิ่งมีชีวิต พึ่งพาอาศัยกันได้ประโยชน์ทั้งคู่ อิงอาศัยฝ่ายหนึ่งได้ อีกฝ่ายไม่เสีย ปรสิตฝ่ายหนึ่งได้ อีกฝ่ายเสีย การล่าผู้ล่าได้เหยื่อเสีย การแข่งขันเสียทั้งคู่',
    [['พึ่งพาอาศัยกัน', 'ได้ประโยชน์ทั้งสองฝ่าย', 'ผึ้ง กับ ดอกไม้', '#dcfce7'], ['อิงอาศัย', 'ฝ่ายหนึ่งได้ อีกฝ่ายไม่ได้ ไม่เสีย', 'กล้วยไม้ กับ ต้นไม้ใหญ่', '#e0f2fe'], ['ปรสิต', 'ฝ่ายหนึ่งได้ อีกฝ่ายเสีย', 'เห็บ กับ สุนัข', '#fae8ff'], ['ล่าเหยื่อ', 'ผู้ล่าได้ เหยื่อเสีย', 'งู กับ หนู', '#fee2e2'], ['แข่งขัน', 'เสียทั้งสองฝ่าย', 'นกสองชนิดแย่งผลไม้', '#fef9c3']].map((r, i) => {
      const y = 6 + i * 50;
      return R(6, y, 348, 44, r[3]) + tt(14, y + 18, r[0], '#111827', 700, 11.5) + tt(14, y + 35, r[2], '#374151', 600, 9.5) + tt(150, y + 28, r[1], '#b91c1c', 700, 10);
    }).join(''));

  /* 2) โครงสร้างที่เหมาะกับแหล่งที่อยู่ */
  F['p6-adaptation'] = svg(252,
    'โครงสร้างที่เหมาะกับแหล่งที่อยู่ กบมีพังผืดว่ายน้ำ ปลามีครีบและเหงือก ผักตบชวามีก้านใบพองลอยน้ำ ผักกระเฉดมีนวมลอยน้ำ อูฐมีโหนกเก็บไขมัน เพนกวินมีขนแน่นและไขมันกันหนาว',
    [['กบ', 'พังผืดระหว่างนิ้วเท้า', 'พุ้ยน้ำ ว่ายน้ำได้ดี', '#d1fae5'], ['ปลา', 'ครีบ · เหงือก', 'ว่ายน้ำ · หายใจในน้ำ', '#dbeafe'], ['ผักตบชวา', 'ก้านใบพอง มีช่องอากาศ', 'ลอยน้ำได้', '#dcfce7'], ['ผักกระเฉด', 'นวมสีขาวหุ้มลำต้น', 'ช่วยให้ลอยน้ำ', '#f0fdf4'], ['อูฐ', 'โหนกเก็บ ไขมัน', 'ใช้พลังงานในทะเลทราย (ไม่ใช่เก็บน้ำ)', '#fef3c7'], ['เพนกวิน', 'ขนแน่น ชั้นไขมัน', 'กันหนาว รักษาความอบอุ่น', '#e0f2fe']].map((r, i) => {
      const x = 6 + (i % 2) * 176, y = 6 + Math.floor(i / 2) * 76;
      return R(x, y, 170, 70, r[3]) + tt(x + 8, y + 18, r[0], '#111827', 700, 11.5) + tt(x + 8, y + 36, r[1], '#374151', 700, 9.5) + tt(x + 8, y + 52, r[2], '#15803d', 700, 9);
    }).join('') + ttc(180, 246, 'ดูที่ "โครงสร้างช่วยอะไร" ในแหล่งที่อยู่นั้น', '#111827', 700, 9.5));

  /* 3) โซ่อาหารและบทบาท */
  (function () {
    const nodes = [['หญ้า', 'ผู้ผลิต', '#bbf7d0'], ['ตั๊กแตน', 'ผู้บริโภคลำดับ 1', '#fde68a'], ['นกกระจิบ', 'ผู้บริโภคลำดับ 2', '#fed7aa'], ['งู', 'ผู้บริโภคลำดับ 3', '#fecaca']];
    let b = '';
    nodes.forEach((n, i) => { const x = 6 + i * 90; b += R(x, 36, 72, 34, n[2]) + ttc(x + 36, 58, n[0], '#111827', 700, 11) + ttc(x + 36, 92, n[1], '#374151', 700, 8.5) + (i < 3 ? arrow(`M${x + 76} 53H${x + 88}`, GRN) : ''); });
    b += ttc(180, 14, 'ลูกศร = ถูกกิน (ชี้ไปหาผู้กิน)', '#111827', 700, 10.5);
    b += R(6, 112, 348, 98, '#fef2f2') + tt(14, 130, 'ผิด: นกกระจิบ → งู (เริ่มที่ผู้บริโภค ไม่ได้เริ่มที่ผู้ผลิต)', '#b91c1c', 700, 9.5) +
      tt(14, 148, 'ผิด: ตั๊กแตน → หญ้า (ลูกศรสลับ ตั๊กแตนกินหญ้า ไม่ใช่หญ้ากินตั๊กแตน)', '#b91c1c', 700, 9.5) +
      tt(14, 166, 'ผิด: ต้นมะม่วง → ตั๊กแตน (ตั๊กแตนแค่เกาะต้นไม้ ไม่ได้กินต้นมะม่วง)', '#b91c1c', 700, 9.5) +
      tt(14, 188, 'ถูก: เริ่มที่ ผู้ผลิต · ลูกศรชี้ไปผู้กิน · คู่ที่กินกันจริงเท่านั้น', '#15803d', 700, 9.5) + tt(14, 202, 'ผู้บริโภค ลำดับ 1 กินผู้ผลิต โดยตรง', '#15803d', 700, 9.5);
    F['p6-food-chain-ex'] = svg(218, 'โซ่อาหาร หญ้า ตั๊กแตน นกกระจิบ งู ลูกศรชี้ไปยังผู้กิน และตัวอย่างโซ่อาหารที่เขียนผิด', b);
  })();

  /* 4) วงจรชีวิตแมลงศัตรูพืชและเวลาควบคุม */
  (function () {
    const x = d => 20 + d * 14;
    let b = ttc(180, 14, 'วงจรชีวิตแมลงศัตรูพืช (ตัวอย่าง) และเวลาควบคุม', '#111827', 700, 10.5);
    b += R(x(0), 28, x(3) - x(0), 30, '#fef9c3') + ttc((x(0) + x(3)) / 2, 48, 'ไข่', '#111827', 700, 10.5) + R(x(3), 28, x(11) - x(3), 30, '#bbf7d0') + ttc((x(3) + x(11)) / 2, 48, 'ตัวอ่อน (หนอน)', '#111827', 700, 10.5) + R(x(11), 28, x(16) - x(11), 30, '#fed7aa') + ttc((x(11) + x(16)) / 2, 48, 'ดักแด้', '#111827', 700, 10.5) + R(x(16), 28, 348 - x(16), 30, '#e9d5ff') + ttc((x(16) + 348) / 2, 48, 'ตัวเต็มวัย', '#111827', 700, 10.5);
    b += L(20, 74, 348, 74, 'currentColor', 2);
    [0, 3, 11, 16].forEach(d => { b += L(x(d), 68, x(d), 80, 'currentColor', 2) + ttc(x(d), 94, 'วัน ' + d, '#374151', 700, 9); });
    b += tt(8, 122, 'ระยะไข่ (วัน 0–3): เก็บทำลายกลุ่มไข่', '#92400e', 700, 9.5) + tt(8, 138, 'ระยะตัวอ่อน (วัน 3–11): ใช้ศัตรูธรรมชาติกินตัวอ่อน', '#166534', 700, 9.5) + tt(8, 154, 'ระยะดักแด้ (วัน 11–16): ไถพรวนดินกำจัดดักแด้', '#9a3412', 700, 9.5) + tt(8, 170, 'ระยะตัวเต็มวัย: ใช้กาวดักจับ', '#6b21a8', 700, 9.5);
    b += R(6, 184, 348, 38, '#f8fafc') + tt(14, 200, 'ใช้วิธีให้ตรงกับระยะ: วัน 5 = ตัวอ่อน → ใช้ศัตรูธรรมชาติได้', '#b91c1c', 700, 9.5) + tt(14, 214, 'วัน 12 = ดักแด้ → ใช้ศัตรูที่กินตัวอ่อนไม่ได้แล้ว', '#b91c1c', 700, 9.5);
    F['p6-pest-cycle'] = svg(230, 'ช่วงเวลาของระยะไข่ ตัวอ่อน ดักแด้ ตัวเต็มวัย และวิธีควบคุมให้ตรงกับแต่ละระยะ', b);
  })();

  /* 5) อ่านผลสำรวจสิ่งแวดล้อมกับจำนวนสัตว์ */
  (function () {
    const bars = (ox, title, items, col) => {
      let b = ttc(ox + 80, 14, title, '#111827', 700, 10.5) + L(ox + 10, 150, ox + 160, 150, 'currentColor', 2) + L(ox + 10, 150, ox + 10, 24, 'currentColor', 2);
      items.forEach(([lab, v], i) => { const h = v * 3.2; b += R(ox + 24 + i * 44, 150 - h, 32, h, col) + ttc(ox + 40 + i * 44, 150 - h - 5, String(v), '#111827', 700, 9.5) + ttc(ox + 40 + i * 44, 164, lab, '#374151', 700, 9); });
      return b;
    };
    F['p6-env-chart'] = svg(214,
      'จำนวนสัตว์ตามความชื้นและอุณหภูมิ ยิ่งชื้นพบมากขึ้น ยิ่งอุณหภูมิต่ำพบมากขึ้น',
      bars(0, 'ตามความชื้น (%)', [['30', 5], ['50', 12], ['70', 30]], '#93c5fd') + bars(180, 'ตามอุณหภูมิ (°C)', [['25', 28], ['30', 14], ['40', 4]], '#fca5a5') +
      ttc(90, 184, 'ชื้นมาก → จำนวนมาก', '#1d4ed8', 700, 9.5) + ttc(270, 184, 'อุณหภูมิต่ำ → จำนวนมาก', '#b91c1c', 700, 9.5) + ttc(180, 204, 'อยากเพิ่มจำนวน: เพิ่มความชื้น ลดอุณหภูมิ (ตามข้อมูลของตัวอย่างนี้)', '#111827', 700, 9));
  })();
})();
