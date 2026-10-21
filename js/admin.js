/* หน้าครู/แอดมิน: นักเรียน+รหัสห้อง · รายงานผล · แอดมิน · อื่น ๆ (โรงเรียน, เนื้อหา, ออกจากระบบ) — เมนูล่าง 4 ปุ่มของครู */
async function admin() {
  theme();
  if (!S.token) {
    page('<section class="glass"><h1>เข้าสู่ระบบครู/แอดมิน</h1><p class="mute">สำหรับครูและผู้ดูแลระบบ นักเรียนไม่ต้องเข้าหน้านี้</p><form id="lg"><label>ชื่อผู้ใช้</label><input name="u" autocomplete="username" required><label>รหัสผ่าน</label><input name="p" type="password" autocomplete="current-password" required><div class="sp"></div><button class="btn">เข้าสู่ระบบ</button></form></section><section class="glass"><h2>ครูโรงเรียนอื่นอยากใช้ระบบนี้</h2><p class="mute small">ส่งคำขอใช้งาน ผู้ดูแลระบบจะตรวจและอนุมัติ แล้วจึงเข้าสู่ระบบได้</p><button class="btn sec" data-a="signup">ขอใช้งาน (สมัคร)</button></section><button class="btn ghost" data-a="home">กลับหน้านักเรียน</button>', null);
    $('#lg').onsubmit = e => { e.preventDefault(); run(async () => { const f = new FormData(e.target); S.token = (await api('login', { username: f.get('u'), password: f.get('p') })).token; save(); await admin(); }, 'form:lg'); };
    return;
  }
  loading();
  const d = await api('adminData', { token: S.token }), sup = d.me.role === 'super';
  A.school = sup ? (A.school || (d.schools[0] || {}).id || '') : d.me.schoolId;
  if (!['students', 'report', 'admins', 'more'].includes(A.tab)) A.tab = 'students';
  const sName = id => (d.schools.find(s => s.id === id) || {}).name || '';
  A.schoolName = sName(A.school);
  const pick = '<div class="row" style="margin-bottom:12px">' + (sup ? '<select id="as" aria-label="โรงเรียน">' + d.schools.map(s => '<option value="' + esc(s.id) + '"' + (s.id === A.school ? ' selected' : '') + '>' + esc(s.name) + '</option>').join('') + '</select>' : '<b>' + esc(sName(A.school)) + '</b>') +
    '<select id="al" aria-label="ระดับชั้น">' + Object.keys(LV).map(k => '<option value="' + k + '"' + (k === A.level ? ' selected' : '') + '>' + LV[k] + '</option>').join('') + '</select></div>';
  const head = '<div class="examtop"><div class="grow"><b>' + esc(d.me.name) + '</b><span class="mute small">' + (sup ? 'ผู้ดูแลระบบกลาง' : 'แอดมินโรงเรียน · ' + esc(sName(A.school))) + '</span></div></div>';
  let body = '';
  if (A.tab === 'students') {
    const st = A.school ? await api('students', { token: S.token, schoolId: A.school, level: A.level }) : [];
    const rc = A.school ? await api('roomCodes', { token: S.token, schoolId: A.school, level: A.level }) : [];
    body = pick + '<h2 style="margin:4px 2px 8px">รหัสห้องเรียน</h2><p class="mute small" style="margin:0 2px 10px">ให้นักเรียนกรอกเพื่อเห็นรายชื่อห้องตัวเอง (รหัสหลุด กด "สร้างรหัสใหม่" รหัสเดิมใช้ไม่ได้ทันที)</p>' +
      (rc.length ? rc.map(x => '<section class="glass"><div class="row" style="flex-wrap:nowrap"><div style="flex:1"><div class="mute small">ห้อง ' + esc(x.room) + ' · ' + x.count + ' คน</div><div class="codebox">' + esc(x.code) + '</div></div></div><div class="sp"></div><div class="row"><button class="btn sm" data-a="copycode" data-code="' + esc(x.code) + '">' + ico('copy') + 'คัดลอกรหัส</button><button class="btn sm sec noprint" data-a="rcreset" data-code="' + esc(x.code) + '">' + ico('refresh') + 'สร้างรหัสใหม่</button></div></section>').join('') : '<section class="glass mute">ยังไม่มีห้อง: เพิ่มรายชื่อนักเรียนด้านล่าง ระบบจะสร้างรหัสให้ทุกห้องอัตโนมัติ</section>') +
      '<section class="glass noprint"><h2>เพิ่มรายชื่อนักเรียน</h2><p class="mute small">บรรทัดละคน: ห้อง,เลขที่,ชื่อ-สกุล (วางจาก Excel ได้)</p><textarea id="st" aria-label="รายชื่อนักเรียน"></textarea><div class="sp"></div><button class="btn" data-a="addst">เพิ่มนักเรียน</button></section>' +
      '<article class="paper"><h2>รายชื่อ ' + st.length + ' คน</h2><div class="scroll"><table class="wide" style="min-width:420px">' + st.map(s => '<tr><td>' + esc(s.room) + '</td><td>' + esc(s.no) + '</td><td>' + esc(s.name) + '</td><td class="n noprint"><button class="btn danger" data-a="delst" data-id="' + esc(s.id) + '">ลบ</button></td></tr>').join('') + '</table></div></article>';
  } else if (A.tab === 'report') {
    body = pick + await reportBody(); // js/teacher.js
  } else if (A.tab === 'admins') {
    body = (sup ? await requestsHtml(d) : '') + '<article class="paper"><h2>แอดมิน</h2><div class="scroll"><table class="wide">' + d.admins.map(x => '<tr class="' + (x.active === false ? 'off' : '') + '"><td>' + esc(x.username) + (x.active === false ? ' <span class="chip late">ปิดใช้งาน</span>' : '') + '</td><td>' + esc(x.name) + '</td><td>' + (x.role === 'super' ? 'ผู้ดูแลกลาง' : esc(sName(x.schoolId) || ((d.allSchools || []).find(s => s.id === x.schoolId) || {}).name || '')) + '</td><td class="n">' + (x.id === d.me.id ? '' : sup ? '<button class="btn ' + (x.active === false ? 'sec sm' : 'danger') + '" data-a="adact" data-id="' + esc(x.id) + '" data-on="' + (x.active === false ? '1' : '0') + '">' + (x.active === false ? 'เปิดใช้งาน' : 'ปิดใช้งาน') + '</button>' : '<button class="btn danger" data-a="delad" data-id="' + esc(x.id) + '">ปิดใช้งาน</button>') + '</td></tr>').join('') + '</table></div><p class="mute small">ปิดใช้งานแล้วบัญชีนั้นเข้าสู่ระบบไม่ได้ทันที ข้อมูลทั้งหมดยังอยู่ (ไม่มีการลบ)</p></article>' +
      '<section class="glass"><h2>เพิ่มแอดมิน</h2><form id="ad"><label>ชื่อผู้ใช้</label><input name="username" required><label>ชื่อ-สกุล</label><input name="name"><label>รหัสผ่าน (6 ตัวขึ้นไป)</label><input name="password" type="password" required autocomplete="new-password">' +
      (sup ? '<label>บทบาท</label><select name="role"><option value="school">แอดมินโรงเรียน</option><option value="super">ผู้ดูแลกลาง</option></select><label>โรงเรียน</label><select name="schoolId">' + d.schools.map(s => '<option value="' + esc(s.id) + '">' + esc(s.name) + '</option>').join('') + '</select>' : '') + '<div class="sp"></div><button class="btn">เพิ่มแอดมิน</button></form></section>';
  } else {
    const sub = sup ? (A.sub || 'schools') : '';
    body = (sup ? '<div class="seg"><button data-a="moresub" data-s="schools" class="' + (sub === 'schools' ? 'on' : '') + '">โรงเรียน</button><button data-a="moresub" data-s="content" class="' + (sub === 'content' ? 'on' : '') + '">เนื้อหา</button><button data-a="moresub" data-s="system" class="' + (sub === 'system' ? 'on' : '') + '">ระบบ</button></div>' : '');
    if (sub === 'schools') body += '<article class="paper"><h2>โรงเรียน</h2><table>' + (d.allSchools || d.schools.map(x => Object.assign({ active: true }, x))).map(s => '<tr class="' + (s.active ? '' : 'off') + '"><td>' + esc(s.name) + (s.active ? '' : ' <span class="chip late">ปิดใช้งาน</span>') + (s.isTest ? ' <span class="chip">โรงเรียนทดสอบ</span>' : '') + (d.allSchools ? '<br><button class="btn ghost" data-a="schooltest" data-id="' + esc(s.id) + '" data-on="' + (s.isTest ? '0' : '1') + '">' + (s.isTest ? 'ยกเลิกการเป็นโรงเรียนทดสอบ' : 'ตั้งเป็นโรงเรียนทดสอบ') + '</button>' : '') + '</td><td class="n noprint"><button class="btn ' + (s.active ? 'danger' : 'sec sm') + '" data-a="schoolact" data-id="' + esc(s.id) + '" data-on="' + (s.active ? '0' : '1') + '">' + (s.active ? 'ปิดใช้งาน' : 'เปิดใช้งาน') + '</button></td></tr>').join('') + '</table><p class="mute small">ปิดใช้งานแล้วนักเรียนของโรงเรียนนั้นเข้าห้องไม่ได้ แต่ข้อมูลทั้งหมดยังอยู่ครบ เปิดกลับมาได้ทุกเมื่อ (ไม่มีการลบโรงเรียน)</p></article><section class="glass"><form id="sc"><label>ชื่อโรงเรียนใหม่</label><input name="name" required><div class="sp"></div><button class="btn">เพิ่มโรงเรียน</button></form><p class="mute small">เพิ่มโรงเรียนแล้วไปที่แท็บ "แอดมิน" เพื่อสร้างบัญชีแอดมินของโรงเรียนนั้น</p></section>';
    else if (sub === 'system') body += '<section class="glass"><h2>สถานะระบบ</h2><p class="mute small">ตรวจความเร็วของฐานข้อมูล (อ่านอย่างเดียว ไม่เขียนข้อมูล) เรียกได้นาทีละครั้ง</p><button class="btn" data-a="diag">ตรวจสถานะระบบ</button></section><div id="diagout"></div>' + '<section class="glass"><h2>แยกผลสอบของโรงเรียนทดสอบ</h2><p class="mute small">ผลสอบใหม่ของโรงเรียนที่ตั้งเป็น "โรงเรียนทดสอบ" จะไปอยู่แท็บ Attempts_test เอง · ปุ่มนี้ย้ายผลเก่าที่ค้างอยู่ในแท็บ Attempts ไปด้วย (คัดลอกก่อน ตรวจว่าครบ แล้วจึงเอาออก ไม่ลบข้อมูล) · ควรทำสำเนาชีตสำรองก่อนกด</p><button class="btn sec" data-a="movetest">ย้ายผลสอบของโรงเรียนทดสอบไปแท็บ Attempts_test</button></section>';
    else if (sub === 'content') {
      const st = await cj('stats.json'), mf = await manifest(), sumN = (a, f) => a.reduce((n, x) => n + f(x), 0);
      const t = (head, rows) => '<div class="scroll"><table><tr>' + head.map(h => '<th' + (h[1] ? ' class="n"' : '') + '>' + h[0] + '</th>').join('') + '</tr>' + rows.map(r => '<tr>' + r.map((x, i) => '<td' + (head[i][1] ? ' class="n"' : '') + '>' + esc(x) + '</td>').join('') + '</tr>').join('') + '</table></div>';
      body += '<article class="paper"><p class="mute">เนื้อหา (ผังข้อสอบ ข้อสอบ สรุป เฉลย) โหลดจากไฟล์ JSON บนเว็บนี้ ไม่ได้เก็บในชีต · แก้ที่โฟลเดอร์ data/ แล้วรัน node tools/publish.mjs (ไม่ต้องนำเข้า) · ฉบับ ' + esc(mf.rev) + ' สร้างเมื่อ ' + esc(new Date(mf.built).toLocaleString('th-TH')) + '</p>' +
        '<h3>คลังข้อสอบ รวม ' + sumN(st.bank, x => x.n) + ' ข้อ</h3>' + t([['ระดับ'], ['ปีการศึกษา'], ['จำนวนข้อ', 1]], st.bank.map(x => [LV[x.level] || x.level, x.examYear, x.n])) +
        '<h3>เฉลยละเอียด รวม ' + sumN(st.sol, x => x.n) + ' ข้อ</h3>' + t([['ระดับ'], ['ปีการศึกษา'], ['จำนวนข้อ', 1]], st.sol.map(x => [LV[x.level] || x.level, x.examYear, x.n])) +
        '<h3>ผังข้อสอบ</h3>' + t([['ระดับ'], ['ปีการศึกษา'], ['มาตรฐาน', 1], ['ตัวชี้วัด', 1], ['จำนวนข้อ', 1]], st.bp.map(x => [LV[x.level] || x.level, x.year, x.standards, x.indicators, x.items])) +
        '<h3>สรุปเนื้อหา รวม ' + sumN(st.sm, x => x.sections) + ' หัวข้อ</h3>' + t([['ระดับ'], ['มาตรฐาน'], ['หัวข้อ', 1], ['ตัวอักษร', 1]], st.sm.map(x => [LV[x.level] || x.level, x.standard, x.sections, x.chars])) + '</article>';
    }
    body += '<div class="sp"></div><button class="btn sec" data-a="logout">' + ico('out') + 'ออกจากระบบ</button><div class="sp"></div><button class="btn ghost" data-a="home">กลับหน้านักเรียน</button>';
  }
  page(head + body, 't', A.tab);
  if (A.tab === 'report' && RS.sub === 'asg') asgFormInit();
  if ($('#as')) $('#as').onchange = e => { A.school = e.target.value; run(admin); };
  if ($('#al')) $('#al').onchange = e => { A.level = e.target.value; run(admin); };
  const form = (id, act) => { if ($(id)) $(id).onsubmit = e => { e.preventDefault(); run(async () => { await api(act, Object.assign({ token: S.token }, Object.fromEntries(new FormData(e.target)))); toast('บันทึกแล้ว'); await admin(); }, 'form:' + id); }; };
  form('#ad', 'saveAdmin'); form('#sc', 'saveSchool');
}
Object.assign(ACT, {
  admin,
  tab: d => { A.tab = d.t; return admin(); },
  moresub: d => { A.sub = d.s; return admin(); },
  logout: () => { S.token = null; save(); return admin(); },
  copycode: async d => { try { await navigator.clipboard.writeText(d.code); toast('คัดลอกรหัส ' + d.code + ' แล้ว'); } catch (e) { toast('รหัสห้อง: ' + d.code); } },
  addst: async () => { const r = await api('addStudents', { token: S.token, schoolId: A.school, level: A.level, text: $('#st').value }); toast('เพิ่มแล้ว ' + r.added + ' คน'); await admin(); },
  rcreset: async d => { if (confirm('สร้างรหัสใหม่? รหัสเดิมจะใช้ไม่ได้ทันที นักเรียนต้องกรอกรหัสใหม่')) { const r = await api('resetRoomCode', { token: S.token, code: d.code }); toast('รหัสใหม่: ' + r.code); await admin(); } },
  delst: async d => { if (confirm('ลบนักเรียนคนนี้?')) { await api('removeStudent', { token: S.token, id: d.id }); await admin(); } },
  delad: async d => { if (confirm('ลบแอดมินคนนี้?')) { await api('removeAdmin', { token: S.token, id: d.id }); await admin(); } }
});

/* ---------- ขอใช้งาน (ครูโรงเรียนอื่น) + อนุมัติ (แอดมินกลาง) ---------- */
function signupPage() {
  page('<section class="glass"><h1>ขอใช้งานสำหรับครู</h1><p class="mute">กรอกข้อมูลแล้วส่งคำขอ ผู้ดูแลระบบจะตรวจและอนุมัติ ระหว่างรออนุมัติยังเข้าสู่ระบบไม่ได้</p>' +
    '<form id="su" novalidate><label>ชื่อ-สกุล</label><input name="name" required maxlength="80" autocomplete="name"><label>โรงเรียน</label><input name="school" required maxlength="120"><label>อีเมล</label><input name="email" type="email" required maxlength="120" autocomplete="email">' +
    '<label>เหตุผลที่ใช้ (เช่น ห้องไหน ใช้ติวช่วงใด)</label><textarea name="reason" required maxlength="500"></textarea>' +
    '<label>ตั้งชื่อผู้ใช้ (a-z 0-9 . _ - ยาว 4–30 ตัว)</label><input name="username" required pattern="[a-zA-Z0-9._-]{4,30}" autocomplete="username"><label>ตั้งรหัสผ่าน (อย่างน้อย 8 ตัว)</label><input name="password" type="password" required minlength="8" autocomplete="new-password">' +
    '<div class="hp" aria-hidden="true"><label>เว็บไซต์</label><input name="website" tabindex="-1" autocomplete="off"></div><div class="sp"></div><button class="btn">ส่งคำขอใช้งาน</button></form></section><button class="btn ghost" data-a="admin">กลับหน้าเข้าสู่ระบบ</button>', null);
  $('#su').onsubmit = e => { e.preventDefault(); run(async () => {
    const f = Object.fromEntries(new FormData(e.target));
    await api('requestAccess', f);
    page('<section class="glass"><h1>ส่งคำขอแล้ว</h1><p>สถานะ: <b>รออนุมัติ</b></p><p class="mute">เมื่อผู้ดูแลระบบอนุมัติแล้ว เข้าสู่ระบบด้วยชื่อผู้ใช้ <b>' + esc(f.username) + '</b> และรหัสผ่านที่ตั้งไว้ได้เลย</p><button class="btn" data-a="admin">ไปหน้าเข้าสู่ระบบ</button></section>', null);
  }, 'form:su'); };
}
async function requestsHtml(d) {
  if (!d.pending) return '';
  const rq = await api('requests', { token: S.token }), sch = d.allSchools || d.schools;
  return '<section class="glass"><h2>คำขอใช้งานรออนุมัติ (' + rq.length + ')</h2>' + rq.map(r => '<div class="rq"><b>' + esc(r.name) + '</b> <span class="mute small">' + esc(r.email) + ' · ชื่อผู้ใช้ ' + esc(r.username) + ' · ' + esc(new Date(r.ts).toLocaleString('th-TH')) + '</span>' +
    '<div class="small">โรงเรียน: ' + esc(r.school) + '<br>เหตุผล: ' + esc(r.reason) + '</div>' +
    '<label for="rs-' + esc(r.id) + '">ผูกกับโรงเรียน</label><select id="rs-' + esc(r.id) + '"><option value="">สร้างโรงเรียนใหม่: ' + esc(r.school) + '</option>' + sch.filter(s => s.active !== false).map(s => '<option value="' + esc(s.id) + '"' + (s.name.trim() === r.school.trim() ? ' selected' : '') + '>' + esc(s.name) + '</option>').join('') + '</select>' +
    '<div class="row" style="margin-top:8px"><button class="btn sm" data-a="rqok" data-id="' + esc(r.id) + '">อนุมัติ</button><button class="btn danger" data-a="rqno" data-id="' + esc(r.id) + '">ปฏิเสธ</button></div></div>').join('') + '</section>';
}
Object.assign(ACT, {
  signup: () => signupPage(),
  rqok: async d => { const sid = $('#rs-' + d.id).value; await api('decideRequest', { token: S.token, id: d.id, decision: 'approve', schoolId: sid }); toast('อนุมัติแล้ว สร้างบัญชีแอดมินโรงเรียนให้แล้ว'); await admin(); },
  rqno: async d => { if (confirm('ปฏิเสธคำขอนี้?')) { await api('decideRequest', { token: S.token, id: d.id, decision: 'reject' }); toast('ปฏิเสธคำขอแล้ว'); await admin(); } },
  adact: async d => { if (d.on === '1' || confirm('ปิดใช้งานบัญชีนี้? (ข้อมูลไม่ถูกลบ เปิดกลับได้)')) { await api('setAdminActive', { token: S.token, id: d.id, active: d.on === '1' }); toast(d.on === '1' ? 'เปิดใช้งานแล้ว' : 'ปิดใช้งานแล้ว'); await admin(); } }
});
Object.assign(ACT, {
  schooltest: async d => { await api('setSchoolTest', { token: S.token, id: d.id, isTest: d.on === '1' }); toast(d.on === '1' ? 'ตั้งเป็นโรงเรียนทดสอบแล้ว ผลสอบใหม่จะไปแท็บ Attempts_test' : 'ยกเลิกแล้ว'); await admin(); },
  movetest: async () => { if (!confirm('ย้ายผลสอบของโรงเรียนทดสอบทั้งหมดจากแท็บ Attempts ไป Attempts_test? (ทำสำเนาชีตสำรองแล้วหรือยัง)')) return; const r = await api('moveTestAttempts', { token: S.token, confirm: 'ย้าย' }); toast('ย้ายแล้ว ' + r.moved + ' แถว จาก ' + r.schools + ' โรงเรียน'); }
});
