/* ===== ชุดทดสอบที่กดรันเองในหน้าแก้ไข Apps Script (ต้องใช้ Google จริง จึงรันบนเครื่องไม่ได้) =====
   วิธีรัน: เปิด script.google.com → โปรเจกต์นี้ → ไฟล์ Tests.gs → เลือกฟังก์ชันในช่องด้านบน → กด "เรียกใช้" → ดูผลที่ "บันทึกการดำเนินการ"
   - testAll()                  อ่านอย่างเดียว ไม่เขียนชีต: 1 ตรวจคะแนน · 2 คลังข้อสอบ · 3 จัดกลุ่ม/เรียงปี · 4 รายชื่อห้อง · 5 สิทธิ์แอดมิน
   - testRecordOnTestSchool()   เขียนผลสอบ 1 แถวให้นักเรียนของโรงเรียนที่ isTest = TRUE (ลงแท็บ Attempts_test) แล้วลบแถวนั้นทิ้งทันที (ใช้เมื่ออยากยืนยันการบันทึกผลรายคน)
   ทุกฟังก์ชันจบด้วย "ผ่านทั้งหมด" หรือโยนข้อผิดพลาด "ไม่ผ่าน N รายการ" (หน้า "การดำเนินการ" จะขึ้นสถานะล้มเหลว) */
var T_ = { bad: 0, n: 0 }, T_LOG = [];
function t_(name, ok, info) { T_.n++; if (!ok) T_.bad++; T_LOG.push((ok ? 'PASS ' : 'FAIL ') + name); Logger.log((ok ? 'PASS ' : 'FAIL ') + name + (ok || info === undefined ? '' : '  ' + String(typeof info === 'string' ? info : JSON.stringify(info)).slice(0, 300))); }
function fetchJson_(rel) { var r = UrlFetchApp.fetch(CONTENT_BASE + rel + '?t=' + Date.now(), { muteHttpExceptions: true }); if (r.getResponseCode() !== 200) throw new Error('โหลด ' + rel + ' ไม่ได้ (HTTP ' + r.getResponseCode() + ')'); return JSON.parse(r.getContentText()); }
function finish_(name) { Logger.log((T_.bad ? 'ไม่ผ่าน ' + T_.bad : 'ผ่านทั้งหมด') + ' · ' + name + ' ' + T_.n + ' รายการ'); var b = T_.bad; T_ = { bad: 0, n: 0 }; if (b) throw new Error('ไม่ผ่าน ' + b + ' รายการ (ดูบรรทัด FAIL ในบันทึก)'); }
var LV_TAG_ = { P6: /^ป\.[456]\//, M3: /^ม\.[123]\// };

function testAll() {
  var bank = testBank_();
  testGrading_(bank); testGrouping_(bank); testRoster_(); testAdminScope_();
  finish_('testAll');
}

/* 2) คลังข้อสอบ: ทุกข้อมีปี มีเฉลย ไม่ซ้ำ ป.6/ม.3 ไม่ปน */
function testBank_() {
  var bank = {};
  ['P6', 'M3'].forEach(function (lv) {
    var meta = fetchJson_(lv + '/meta.json'), years = Object.keys(meta.bankYears), qs = [], keys = {};
    years.forEach(function (y) { qs = qs.concat(fetchJson_(lv + '/q-' + y + '.json')); keys[y] = loadKeys(lv, y, ''); });
    bank[lv] = { meta: meta, years: years, qs: qs, keys: keys };
    t_(lv + ' ทุกข้อมีปีและเลขข้อ (' + qs.length + ' ข้อ)', qs.every(function (q) { return /^\d{4}$/.test(q.examYear) && /^\d+$/.test(String(q.itemNo)); }));
    var noKey = qs.filter(function (q) { var k = keys[q.examYear][q.itemNo]; return !k || !String(k.a || '').trim(); }).map(function (q) { return q.examYear + '/' + q.itemNo; });
    t_(lv + ' ทุกข้อมีเฉลย', !noKey.length, noKey.slice(0, 5));
    var seen = {}, dup = [];
    qs.forEach(function (q) { var id = q.examYear + '/' + q.itemNo; if (seen[id]) dup.push(id); seen[id] = 1; });
    t_(lv + ' ไม่มีข้อซ้ำ (ปี/ข้อ)', !dup.length, dup);
    var stems = {}, dupStem = [];
    qs.forEach(function (q) { var s = String(q.stem).replace(/\s+/g, '').slice(0, 120); if (s.length <= 40) return; if (stems[s] && stems[s] !== q.examYear) dupStem.push(q.examYear + '/' + q.itemNo); stems[s] = stems[s] || q.examYear; });
    t_(lv + ' ไม่มีโจทย์ซ้ำข้ามปี', !dupStem.length, dupStem);
    var other = qs.filter(function (q) { return q.indicator && !LV_TAG_[lv].test(q.indicator); }).map(function (q) { return q.examYear + '/' + q.itemNo + ' ' + q.indicator; });
    t_(lv + ' ตัวชี้วัดเป็นของระดับตัวเอง (ป.6 กับ ม.3 ไม่ปน)', !other.length, other.slice(0, 5));
    var noStd = qs.filter(function (q) { return !/^ว \d\.\d$/.test(q.standard) || (!q.indicator && q.outCurr !== '1'); }).map(function (q) { return q.examYear + '/' + q.itemNo; });
    t_(lv + ' ทุกข้อมีมาตรฐาน · ข้อในหลักสูตรมีตัวชี้วัด', !noStd.length, noStd.slice(0, 5));
  });
  return bank;
}

/* 1) ตรวจคำตอบ: ตอบตามเฉลยได้เต็มทุกข้อ · ตอบผิดได้ 0 ข้อถูก (ใช้ฟังก์ชันตรวจตัวเดียวกับ submitAttempt) */
function testGrading_(bank) {
  ['P6', 'M3'].forEach(function (lv) {
    bank[lv].years.forEach(function (y) {
      var K = bank[lv].keys[y], items = Object.keys(K), full = 0, got = 0, okN = 0, wrongOk = 0;
      items.forEach(function (n) {
        var e = K[n], t = e.t, key = normAns(t, e.a), right = key.split(',').map(function (x) { return x.split('|')[0]; }).join(','), pts = points(lv, t);
        full += pts; if (isRight(t, normAns(t, right), key)) okN++; got += earnedOf(lv, y, t, normAns(t, right), key, pts);
        var w = t === 'complex' ? right.split(',').map(function (v) { return v === 'ใช่' ? 'ไม่ใช่' : 'ใช่'; }).join(',') : t === 'fill' ? right + 'x' : t === 'order' ? right.split(',').reverse().join(',') : String([1, 2, 3, 4].filter(function (v) { return key.split('|').indexOf(String(v)) < 0; })[0]);
        if (t === 'order' && w === right) w = '';
        if (isRight(t, normAns(t, w), key)) wrongOk++;
      });
      t_(lv + ' ' + y + ': ตอบตามเฉลยถูกครบ ' + items.length + ' ข้อ ได้คะแนนเต็ม ' + Math.round(full * 100) / 100, okN === items.length && Math.abs(got - full) < 0.001, { ok: okN, got: got, full: full });
      t_(lv + ' ' + y + ': ตอบผิดทุกข้อ ไม่มีข้อใดถูก', wrongOk === 0, wrongOk);
    });
  });
}

/* 3) จัดกลุ่มตามมาตรฐาน/ตัวชี้วัด และเรียงปีล่าสุดก่อน */
function testGrouping_(bank) {
  ['P6', 'M3'].forEach(function (lv) {
    var meta = bank[lv].meta, byKey = {}, wrong = [], order = [];
    bank[lv].qs.forEach(function (q) { byKey[q.examYear + '/' + q.itemNo] = q; });
    Object.keys(meta.pool).forEach(function (k) {
      var p = k.split('|'), list = meta.pool[k];
      list.forEach(function (key) { var q = byKey[key]; if (!q || q.standard !== p[0] || (p[1] && q.indicator !== p[1])) wrong.push(k + ' ← ' + key); });
      for (var i = 1; i < list.length; i++) if (+list[i].split('/')[0] > +list[i - 1].split('/')[0]) { order.push(k); break; }
    });
    t_(lv + ' ทุกข้อในกลุ่มมาตรฐาน/ตัวชี้วัดเป็นของกลุ่มนั้นจริง', !wrong.length, wrong.slice(0, 5));
    t_(lv + ' ทุกกลุ่มเรียงปีล่าสุดก่อน', !order.length, order.slice(0, 5));
  });
}

/* 4) เลือกชื่อจากรายชื่อห้อง (อ่านอย่างเดียว): ทุกห้องที่เปิดอยู่ คืนรายชื่อเฉพาะห้องนั้น */
function testRoster_() {
  var rooms = tbl('Rooms').filter(on), schools = {}, badRoom = [], n = 0;
  tbl('Schools').forEach(function (s) { schools[s.id] = on(s); });
  rooms.filter(function (r) { return schools[r.schoolId]; }).forEach(function (r) {
    var e = API.enter({ code: r.code }); n++;
    if (e.level !== r.level || e.room !== r.room || e.students.some(function (s) { return s.room !== r.room; })) badRoom.push(r.code);
    e.students.forEach(function (s) { try { studentIn(r, s.id); } catch (x) { badRoom.push(r.code + ':' + s.id); } });
  });
  t_('รหัสห้อง ' + n + ' ห้อง: รายชื่อที่ได้เป็นของห้องนั้นเท่านั้น และทุกชื่อใช้ต่อได้', !badRoom.length, badRoom.slice(0, 5));
  var wrong = false; try { API.enter({ code: 'ZZZZZZ' }); } catch (x) { wrong = /รหัสห้องเรียนไม่ถูกต้อง/.test(x.message); }
  t_('รหัสห้องผิด → ปฏิเสธ', wrong);
  if (rooms.length >= 2) {
    var a = rooms[0], b = rooms.filter(function (r) { return r.schoolId !== a.schoolId || r.room !== a.room || r.level !== a.level; })[0], other = b && studentsOf(b.schoolId, b.level, b.room)[0], denied = true;
    if (other) { try { API.progress({ code: a.code, studentId: other.id }); denied = false; } catch (x) {} t_('ใช้รหัสห้องหนึ่งดูผลของนักเรียนอีกห้องไม่ได้', denied); }
  }
}

/* 5) สิทธิ์แอดมิน: แอดมินโรงเรียนหนึ่งไม่เห็นข้อมูลนักเรียนอีกโรงเรียน (ใช้ session ชั่วคราวในแคช ไม่สร้างบัญชี ไม่เขียนชีต) */
function testAdminScope_() {
  var sch = tbl('Schools').filter(on);
  if (sch.length < 2) { t_('สิทธิ์แอดมิน: ต้องมีอย่างน้อย 2 โรงเรียน (ข้าม)', true); return; }
  var cache = CacheService.getScriptCache();
  sch.slice(0, 5).forEach(function (A) {
    var tok = 'selftest-' + Utilities.getUuid(); cache.put('s_' + tok, JSON.stringify({ id: 'selftest', name: 'ทดสอบสิทธิ์', role: 'school', schoolId: A.id }), 120);
    try {
      var others = sch.filter(function (s) { return s.id !== A.id; }), mine = {};
      ['P6', 'M3'].forEach(function (lv) { studentsOf(A.id, lv).forEach(function (s) { mine[s.id] = 1; }); });
      var leak = [];
      others.slice(0, 3).forEach(function (B) {
        ['P6', 'M3'].forEach(function (lv) {
          API.students({ token: tok, schoolId: B.id, level: lv }).forEach(function (s) { if (!mine[s.id]) leak.push('students ' + s.id); });
          API.analytics({ token: tok, schoolId: B.id, level: lv }).students.forEach(function (s) { if (!mine[s.id]) leak.push('analytics ' + s.id); });
          var rep = API.report({ token: tok, schoolId: B.id, level: lv }); if (rep.students.length > Object.keys(mine).length) leak.push('report');
        });
      });
      t_('แอดมินโรงเรียน "' + A.name + '" ขอข้อมูลโรงเรียนอื่น → ได้แค่นักเรียนโรงเรียนตัวเอง', !leak.length, leak.slice(0, 5));
      var data = API.adminData({ token: tok });
      t_('แอดมินโรงเรียน "' + A.name + '" เห็นรายการโรงเรียนแค่โรงเรียนตัวเอง', data.schools.length === 1 && data.schools[0].id === A.id && !data.allSchools);
      var sup = true; try { API.setSchoolActive({ token: tok, id: A.id, active: true }); sup = false; } catch (x) {}
      t_('แอดมินโรงเรียนใช้คำสั่งของแอดมินกลางไม่ได้', sup);
    } finally { cache.remove('s_' + tok); }
  });
}

/* 4) บันทึกผลรายคน (เขียนจริง 1 แถว แล้วลบทิ้ง): เฉพาะโรงเรียนที่ชื่อมีคำว่า "ทดสอบ" */
function testRecordOnTestSchool() {
  var sc = tbl('Schools').filter(function (s) { return on(s) && isTestSchool(s.id); })[0];
  if (!sc) throw new Error('ไม่พบโรงเรียนที่ตั้ง isTest = TRUE ในแท็บ Schools');
  var room = tbl('Rooms').filter(function (r) { return r.schoolId === sc.id && on(r); })[0]; if (!room) throw new Error('โรงเรียนทดสอบยังไม่มีรหัสห้อง');
  var st = studentsOf(sc.id, room.level, room.room); if (st.length < 1) throw new Error('ห้องทดสอบยังไม่มีนักเรียน');
  var meta = fetchJson_(room.level + '/meta.json'), keys = meta.mock.slice(0, 3), aid = 'selftest' + Date.now();
  var before = API.progress({ code: room.code, studentId: st[0].id }).history.length, other = st[1] ? API.progress({ code: room.code, studentId: st[1].id }).history.length : null;
  try {
    var r = API.submitAttempt({ attemptId: aid, code: room.code, studentId: st[0].id, mode: 'practice', standard: 'selftest', keys: keys, answers: {}, rev: {} });
    t_('บันทึกผลได้ (ตรวจ ' + r.total + ' ข้อ)', r.total === keys.length);
    CacheService.getScriptCache().remove('p_' + st[0].id);
    var after = API.progress({ code: room.code, studentId: st[0].id });
    t_('ผลไปอยู่ที่นักเรียนคนนั้น', after.history.length === Math.min(before + 1, 8) && after.history[0].standard === 'selftest');
    if (other !== null) t_('นักเรียนอีกคนในห้องไม่ได้ผลนี้', API.progress({ code: room.code, studentId: st[1].id }).history.length === other);
    t_('ส่ง attemptId เดิมซ้ำ ไม่บันทึกซ้ำ', API.submitAttempt({ attemptId: aid, code: room.code, studentId: st[0].id, mode: 'practice', keys: keys, answers: {}, rev: {} }).dup === true);
  } finally {
    var s = ss().getSheetByName(atSheet(sc.id)), ids = s.getRange(2, 1, Math.max(s.getLastRow() - 1, 1), 1).getValues();
    for (var i = ids.length - 1; i >= 0; i--) if (String(ids[i][0]) === aid) s.deleteRow(i + 2);
    CacheService.getScriptCache().removeAll(['p_' + st[0].id, 'aid_' + aid]);
    Logger.log('ลบแถวทดสอบ ' + aid + ' แล้ว');
  }
  finish_('testRecordOnTestSchool');
}

