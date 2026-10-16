/* หน้าครู/แอดมิน: นักเรียน+รหัสห้อง · รายงานผล · แอดมิน · อื่น ๆ (โรงเรียน, เนื้อหา, ออกจากระบบ) — เมนูล่าง 4 ปุ่มของครู */
async function admin() {
  theme();
  if (!S.token) {
    page('<section class="glass"><h1>เข้าสู่ระบบครู/แอดมิน</h1><p class="mute">สำหรับครูและผู้ดูแลระบบ นักเรียนไม่ต้องเข้าหน้านี้</p><form id="lg"><label>ชื่อผู้ใช้</label><input name="u" autocomplete="username" required><label>รหัสผ่าน</label><input name="p" type="password" autocomplete="current-password" required><div class="sp"></div><button class="btn">เข้าสู่ระบบ</button></form></section><button class="btn sec" data-a="home">กลับหน้านักเรียน</button>', null);
    $('#lg').onsubmit = e => { e.preventDefault(); run(async () => { const f = new FormData(e.target); S.token = (await api('login', { username: f.get('u'), password: f.get('p') })).token; save(); await admin(); }, 'form:lg'); };
    return;
  }
  loading();
  const d = await api('adminData', { token: S.token }), sup = d.me.role === 'super';
  A.school = sup ? (A.school || (d.schools[0] || {}).id || '') : d.me.schoolId;
  if (!['students', 'report', 'admins', 'more'].includes(A.tab)) A.tab = 'students';
  const sName = id => (d.schools.find(s => s.id === id) || {}).name || '';
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
    const r = A.school ? await api('report', { token: S.token, schoolId: A.school, level: A.level }) : { students: [], standards: [] };
    body = pick + '<div class="row noprint" style="margin-bottom:12px"><button class="btn sec sm" data-a="pdf">' + ico('print') + 'พิมพ์/PDF</button></div><article class="paper"><h2>ผลรวมตามมาตรฐาน</h2><div class="scroll"><table><tr><th>มาตรฐาน</th><th class="n">ทำ (ข้อ)</th><th class="n">ถูก</th></tr>' + r.standards.map(x => '<tr><td>' + esc(x.standard) + '</td><td class="n">' + x.total + '</td><td class="n">' + pct(x.correct, x.total) + '</td></tr>').join('') + '</table></div></article>' +
      '<article class="paper"><h2>รายบุคคล</h2><div class="scroll"><table class="wide"><tr><th>ห้อง</th><th>เลขที่</th><th>ชื่อ</th><th class="n">ครั้ง</th><th class="n">ถูก/ทำ</th><th class="n">%</th><th>ล่าสุด</th></tr>' + r.students.map(s => '<tr><td>' + esc(s.room) + '</td><td>' + esc(s.no) + '</td><td>' + esc(s.name) + '</td><td class="n">' + s.n + '</td><td class="n">' + s.correct + '/' + s.total + '</td><td class="n">' + pct(s.correct, s.total) + '</td><td>' + (s.last ? esc(new Date(s.last).toLocaleDateString('th-TH')) : '–') + '</td></tr>').join('') + '</table></div></article>';
  } else if (A.tab === 'admins') {
    body = '<article class="paper"><h2>แอดมิน</h2><div class="scroll"><table class="wide">' + d.admins.map(x => '<tr><td>' + esc(x.username) + '</td><td>' + esc(x.name) + '</td><td>' + (x.role === 'super' ? 'ผู้ดูแลกลาง' : esc(sName(x.schoolId))) + '</td><td class="n">' + (x.id === d.me.id ? '' : '<button class="btn danger" data-a="delad" data-id="' + esc(x.id) + '">ลบ</button>') + '</td></tr>').join('') + '</table></div></article>' +
      '<section class="glass"><h2>เพิ่มแอดมิน</h2><form id="ad"><label>ชื่อผู้ใช้</label><input name="username" required><label>ชื่อ-สกุล</label><input name="name"><label>รหัสผ่าน (6 ตัวขึ้นไป)</label><input name="password" type="password" required autocomplete="new-password">' +
      (sup ? '<label>บทบาท</label><select name="role"><option value="school">แอดมินโรงเรียน</option><option value="super">ผู้ดูแลกลาง</option></select><label>โรงเรียน</label><select name="schoolId">' + d.schools.map(s => '<option value="' + esc(s.id) + '">' + esc(s.name) + '</option>').join('') + '</select>' : '') + '<div class="sp"></div><button class="btn">เพิ่มแอดมิน</button></form></section>';
  } else {
    const sub = sup ? (A.sub || 'schools') : '';
    body = (sup ? '<div class="seg"><button data-a="moresub" data-s="schools" class="' + (sub === 'schools' ? 'on' : '') + '">โรงเรียน</button><button data-a="moresub" data-s="content" class="' + (sub === 'content' ? 'on' : '') + '">เนื้อหา</button></div>' : '');
    if (sub === 'schools') body += '<article class="paper"><h2>โรงเรียน</h2><table>' + d.schools.map(s => '<tr><td>' + esc(s.name) + '</td></tr>').join('') + '</table></article><section class="glass"><form id="sc"><label>ชื่อโรงเรียนใหม่</label><input name="name" required><div class="sp"></div><button class="btn">เพิ่มโรงเรียน</button></form><p class="mute small">เพิ่มโรงเรียนแล้วไปที่แท็บ "แอดมิน" เพื่อสร้างบัญชีแอดมินของโรงเรียนนั้น</p></section>';
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
