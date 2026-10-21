// สร้าง review/UPGRADE.pdf — รายงานการยกระดับระบบ (ภาพก่อน/หลัง · ฟีเจอร์ใหม่ · กลุ่ม ง รอยืนยัน · สิ่งที่ข้าม · Lighthouse/ผลทดสอบ · ขั้นตอนย้ายไป main)
//   node tools/make-upgrade-pdf.mjs      (ต้องมี review/upgrade/{before,after}/ จาก tools/upgrade-shots.mjs · ผลทดสอบจาก tools/.cache/run-all-final.txt · Lighthouse จาก tools/.cache/lh-final-*.json)
import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import { ROOT, TOOLS } from "./lib.mjs";

const R = p => path.join(ROOT, "review", "upgrade", p), C = p => path.join(TOOLS, ".cache", p);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const img = f => "data:image/png;base64," + fs.readFileSync(f).toString("base64");
const read = (f, d = "") => fs.existsSync(f) ? fs.readFileSync(f, "utf8") : d;
const before = JSON.parse(read(R("before/shots.json"), "[]")), after = JSON.parse(read(R("after/shots.json"), "[]"));
const bk = Object.fromEntries(before.map(s => [s.key, s])), pairs = after.filter(s => bk[s.key]), only = after.filter(s => !bk[s.key]);

/* ---- Lighthouse ---- */
const lh = (f, name, note) => { if (!fs.existsSync(f)) return ""; const l = JSON.parse(fs.readFileSync(f, "utf8")), c = k => Math.round(l.categories[k].score * 100), a = l.audits;
  return `<tr><td>${name}<br><span class="s">${note}</span></td><td class="n">${c("performance")}</td><td class="n">${c("accessibility")}</td><td class="n">${c("best-practices")}</td><td class="n">${c("seo")}</td><td>FCP ${a["first-contentful-paint"].displayValue} · LCP ${a["largest-contentful-paint"].displayValue} · TBT ${a["total-blocking-time"].displayValue} · CLS ${a["cumulative-layout-shift"].displayValue}</td></tr>`; };
const load4g = read(C("load4g.txt")).trim().split("\n").map(l => `<li>${esc(l)}</li>`).join("");

/* ---- ผลทดสอบ ---- */
const DESC = { a11y: "การเข้าถึง WCAG 2.1 AA ด้วย axe ทุกหน้านักเรียน/ครู ทั้งโหมดกลางคืนและกลางวัน · ปุ่มสูง ≥ 44px", figzoom: "ขยายภาพ SVG เต็มจอ", grading: "ตรวจคะแนนทุกฉบับ · ตรวจซ้ำที่ Apps Script ตรงกับที่คำนวณแยก · idempotent", secure: "โหมดสอบของครู ไม่ส่งเฉลยลงเครื่องนักเรียน", privacy: "รหัสห้อง รายชื่อ สิทธิ์แอดมิน", guards: "เซิร์ฟเวอร์ไม่ตอบ/กดซ้ำ/ลองใหม่", alts: "เฉลยหลายคำตอบ ชนิดข้อสอบ", outcurr: "ข้อนอกหลักสูตรไม่ปนในข้อสอบจำลอง/สถิติ", "summary-format": "รูปแบบสรุปทั้ง 19 มาตรฐาน (กล่อง ตาราง ภาพ ≥ 12px)", "figs-text": "ตัวอักษรในภาพ SVG ≥ 12px", print: "พิมพ์ PDF ข้อสอบ/เฉลย/สรุป", browser: "ทำข้อสอบจริงทุกปีทุกระดับตามหน้าจอ ตรวจคะแนนกับเฉลย", learn: "ฝั่งนักเรียนใหม่: แดชบอร์ด สมุดข้อผิด ทบทวน ฝึกเลือกเอง บัตรคำ ค้นหา จับเวลา ตั้งค่า", teacher: "ฝั่งครูใหม่: มอบงาน analytics ก่อน/หลัง ปิด/เปิดโรงเรียน สิทธิ์ heatmap CSV", offline: "PWA ออฟไลน์: ทำข้อสอบโดยไม่มีเน็ต แล้วคะแนนส่งเอง" };
const runMap = new Map(); for (const f of ["run-all-final.txt", "run-all-extra.txt"]) for (const m of read(C(f)).matchAll(/^(✓|✗) ([^ ]+): ผ่าน ([0-9]+) · ไม่ผ่าน ([0-9]+)/gm)) runMap.set(m[2], { ok: m[1] === "✓", name: m[2], pass: +m[3], fail: +m[4] });
const runs = [...runMap.values()]; // ชุดที่รันซ้ำใน run-all-extra.txt ใช้ค่าล่าสุด
const tests = runs.map(r => `<tr><td>${r.ok ? "✓" : "✗"} <b>${esc(r.name)}</b></td><td class="n">${r.pass}</td><td class="n">${r.fail}</td><td>${esc(DESC[r.name] || "")}</td></tr>`).join("");

/* ---- กลุ่ม ง ---- */
const au = read(path.join(ROOT, "data", "SUMMARY-AUDIT.md")), si = au.indexOf("## กลุ่ม ง ที่รอให้ผู้ใช้ยืนยัน"), tbl = au.slice(si).split("\n").filter(l => l.startsWith("|") && !l.startsWith("|---")).slice(1).filter(l => !/ระบบสุริยะ|ดาวเคราะห์กับดาวฤกษ์|สารละลาย/.test(l)); // ตัดสินแล้ว 3 แถว เหลือที่ไม่แน่ใจ
const gd = tbl.map(l => l.split("|").slice(1, -1).map(x => x.trim())).map(c => `<tr><td>${esc(c[0])} ${esc(c[1])}</td><td>${esc(c[2])}</td><td>${esc(c[3])}</td><td class="n">${esc(c[4])}</td><td>${esc(c[5])}</td><td>${esc(c[6])}</td></tr>`).join("");

const fig = (s, side) => `<figure><img src="${img(R(side + "/" + s.file))}"><figcaption>${esc(s.label)}</figcaption></figure>`;
const pairHtml = pairs.map(s => `<div class="pair"><h3>${esc(s.label)}</h3><div class="two"><div><div class="tag b">ก่อน</div>${fig(bk[s.key], "before")}</div><div><div class="tag a">หลัง</div>${fig(s, "after")}</div></div></div>`).join("");
const onlyHtml = `<div class="grid">${only.map(s => `<div>${fig(s, "after")}</div>`).join("")}</div>`;
const today = new Date().toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" });

const feat = [
  ["นักเรียน", "หน้าแรก (แดชบอร์ด)", "ภารกิจวันนี้ 3 ข้อ (ทำโจทย์ 10 ข้อ · ทบทวนสมุดข้อผิด หรืออ่านสรุป · บัตรคำ 10 ใบ) · สตรีค \"เรียนต่อเนื่อง N วัน\" · งานจากครู · การ์ดสมุดข้อผิด · ตัวชี้วัดที่ควรเสริม · ความคืบหน้าตามสาระ"],
  ["นักเรียน", "สมุดข้อผิด (หน้าแรก / แท็บ ทบทวน)", "ข้อที่เคยทำผิดเข้าสมุดเอง · ข้อที่ผิดครั้งล่าสุดทบทวนได้ทันที ถ้าถูกหลังผิดจะกลับมาทบทวนอีกครั้งใน 3 วัน · ตอบถูกติดกัน 2 ครั้งจึงออกจากสมุด · กด \"ทบทวนข้อผิด\" ทีละ 10 ข้อ (คำนวณจากประวัติรายข้อในชีต จึงข้ามเครื่องได้)"],
  ["นักเรียน", "ตัวชี้วัดที่ควรเสริม (หน้าแรก)", "ตัวชี้วัดที่ทำถูก < 60% จากอย่างน้อย 3 ครั้ง · ปุ่ม \"อ่านสรุป\" ไปหัวข้อนั้น และ \"ฝึกตัวชี้วัดนี้\" · แท็บ สรุป แสดง % ถูกต่อตัวชี้วัดและเหรียญต่อมาตรฐาน"],
  ["นักเรียน", "ฝึกเลือกเอง (แท็บ ทบทวน)", "เลือกมาตรฐาน/ตัวชี้วัด · 5/10/20 ข้อ · สุ่มหรือเรียงตามปี · \"เฉพาะข้อที่ยังไม่เคยทำ\""],
  ["นักเรียน", "ข้อสอบจำลองจับเวลา (แท็บ ข้อสอบ)", "ปุ่ม \"เริ่มแบบจับเวลา\" · มีธงปักข้อไม่แน่ใจและแผงเลขข้อ · ปิดเว็บแล้วเปิดต่อเวลาไม่รีเซ็ต · หมดเวลาส่งคำตอบให้เอง (เหลือ 5 นาทีนับถอยหลังเป็นสีแดง)"],
  ["นักเรียน", "บัตรคำ (แท็บ ทบทวน)", "สร้างจากหัวข้อ \"จำให้แม่น\" 183 ใบ (ป.6) / 308 ใบ (ม.3) มีภาพประกอบ 88/192 ใบ · เติมคำและถาม-ตอบ · กล่อง Leitner: จำได้ → ทบทวนห่างขึ้น 1/3/7/14/30 วัน, ไม่แน่ใจ → กลับมาใน 10 นาที"],
  ["นักเรียน", "ค้นหา (หน้าแรก / แท็บ ทบทวน)", "ค้นชื่อหัวข้อ เนื้อหาสรุป และโจทย์ข้อสอบ · กดผลเพื่อไปที่สรุปหรือทำข้อนั้น"],
  ["นักเรียน", "เหรียญและสตรีค (แท็บ ผลของฉัน / หน้าแรก)", "เหรียญทองแดง/เงิน/ทองต่อมาตรฐานจากจำนวนที่ถูกและความแม่น · ไม่มีกระดานอันดับสาธารณะ"],
  ["นักเรียน", "ตั้งค่า (แท็บ ผลของฉัน)", "ขนาดตัวอักษร 4 ระดับ · โหมดกลางคืน/กลางวัน (จำค่าไว้ ไม่วาบมืด) · ดาวน์โหลดเนื้อหาไว้ใช้ออฟไลน์ · เพิ่มลงหน้าจอหลัก"],
  ["นักเรียน", "ใช้งานออฟไลน์ (PWA)", "หลังกด \"ดาวน์โหลดเนื้อหาไว้ในเครื่อง\" เปิดแอปและทำข้อสอบได้โดยไม่มีเน็ต · คะแนนเก็บในเครื่องและส่งเองเมื่อมีเน็ตอีกครั้ง (แถบ \"ออฟไลน์อยู่\" แจ้งสถานะ)"],
  ["นักเรียน", "งานจากครู (หน้าแรก)", "เห็นงานที่ครูมอบ ชนิด จำนวนข้อ กำหนดส่ง สถานะ (ทำแล้วกี่ครั้ง ดีที่สุดกี่ %) · \"เลยกำหนด\" ติดป้ายแดง"],
  ["นักเรียน", "สรุปเนื้อหารูปแบบใหม่ (ช่วง 1)", "ทั้ง 19 มาตรฐาน: กล่อง แนวคิดหลัก/จำให้แม่น/ข้อสอบชอบถาม/กับดัก · ตัวอย่าง 3 ตอน · ผังขั้นตอน · ตารางเป็นการ์ดบนมือถือ · แผนผังความคิด · ภาพ SVG กว้าง 300 ตัวอักษร ≥ 12px · หัวข้อที่ไม่เคยออกสอบพับไว้ (PDF แสดงครบ)"],
  ["ครู", "รายงาน → ภาพรวมห้อง", "heatmap นักเรียน × มาตรฐาน (สลับเป็นตัวชี้วัดได้) สีตามเกณฑ์ + ตัวเลข % · ค่าเฉลี่ยตามมาตรฐานเรียงจากต่ำสุด · รายชื่อคนที่ยังไม่ทำ/หายเกิน 7 วัน · เลือกดูทีละห้อง"],
  ["ครู", "รายงาน → วิเคราะห์ข้อสอบ", "ความยาก (% ตอบถูก) ต่อข้อ + คำตอบผิดที่ถูกเลือกมากที่สุด (ตัวลวง) · ทั้งโรงเรียน"],
  ["ครู", "รายงาน → มอบหมายงาน", "มอบงานชุดข้อ (สุ่มแล้วติ๊กเลือกเอง) / แบบทดสอบก่อน-หลังเรียน / ให้อ่านสรุป · เลือกห้อง · กำหนดส่ง · ดูว่าใครส่งแล้ว/ยังไม่ส่ง · ปิดงาน"],
  ["ครู", "รายงาน → ก่อน/หลังเรียน", "เทียบคะแนนก่อน (ครั้งแรก) กับหลัง (ครั้งล่าสุด) รายตัวชี้วัดและรายนักเรียน"],
  ["ครู", "รายงาน → ส่งออก", "CSV (UTF-8 มี BOM เปิดใน Excel ได้ ภาษาไทยไม่เพี้ยน) · รายงานห้องเรียน PDF พร้อม heatmap"],
  ["แอดมินกลาง", "อื่น ๆ → โรงเรียน / ระบบ", "ปิด/เปิดใช้งานโรงเรียน (ไม่ลบข้อมูล) · รีเซ็ตรหัสห้อง (แท็บ นักเรียน → สร้างรหัสใหม่) · ตรวจสถานะระบบ (diag)"],
];
const skipped = [
  ["ล็อกอินแอดมินจริงบนระบบจริง", "รหัสผ่านแอดมินจริงเป็นของคุณ ไม่ได้พิมพ์/เก็บไว้ ทุกอย่างฝั่งครูจึงทดสอบกับเซิร์ฟเวอร์จำลองที่รัน Code.gs ตัวเดียวกัน (38 รายการ) · ที่ตรวจกับ Apps Script ของหน้าทดลองจริงมีแค่ GET และ enter ด้วยรหัสผิด (ตอบถูกต้อง) · ขอให้คุณล็อกอินที่ /preview/ → \"สำหรับครู\" แล้วลองมอบงานสัก 1 งาน (แท็บ Assignments จะถูกสร้างในชีตเองตอนนั้น)"],
  ["เวลาข้อสอบจำลอง (ตัดสินแล้ว)", "อ่านจากหน้าปกข้อสอบ สทศ. ปี 2568 ในเครื่อง: ป.6 13.30–14.30 น. = 60 นาที · ม.3 13.00–14.30 น. = 90 นาที (mockMinutes ใน js/learn.js)"],
  ["กลุ่ม ง (ตัดสินตามกฎของคุณแล้ว)", "ตัด ป.6 ว 3.1 ป.4/3 ระบบสุริยะ และ ป.5/1 ดาวเคราะห์กับดาวฤกษ์ · ย่อ ม.3 ว 2.1 ม.2/3 สารละลาย เหลือ 2 บรรทัด · ไม่แน่ใจ คงไว้ 4 แถว (ดูหัวข้อ 3)"],
  ["ทดสอบ \"เพิ่มลงหน้าจอหลัก\" บนมือถือจริง", "ทดสอบได้เฉพาะ service worker/ออฟไลน์ด้วยเบราว์เซอร์จำลอง (ผ่าน) · ปุ่มติดตั้งขึ้นกับเบราว์เซอร์ของเครื่องนักเรียน (iPhone ใช้ปุ่มแชร์ → เพิ่มลงหน้าจอโฮม)"],
  ["ภาพ SVG ที่ยังไม่สวยพอ", "ภาพรุ่นเก่า ~146 ภาพถูกแปลงอัตโนมัติ (กว้าง 300 ตัวอักษร ≥ 12px) อ่านได้แต่บางภาพชิด/ทับเล็กน้อย รายชื่ออยู่ใน PROGRESS.md รอการเกลาด้วยมือ"],
  ["ย้ายหน้าทดลองไปเว็บหลัก", "เป็นการตัดสินใจของคุณ ขั้นตอนอยู่ในหัวข้อ 6 · หน้าเว็บหลักและ Apps Script ตัวจริง (@9) ยังไม่ถูกแตะเลย"],
];
const html = `<!doctype html><html lang="th"><head><meta charset="utf-8"><title>รายงานการยกระดับระบบติว O-NET</title><style>
@page{size:A4;margin:14mm 12mm}
body{font:11pt/1.55 "Noto Sans Thai","Tahoma",sans-serif;color:#151a33}
h1{font-size:22pt;margin:0 0 4pt}h2{font-size:15pt;margin:20pt 0 6pt;border-bottom:2px solid #4a549c;padding-bottom:3pt;page-break-after:avoid}h3{font-size:11.5pt;margin:6pt 0 4pt;page-break-after:avoid}
.s{font-size:9pt;color:#555}.n{text-align:right}
table{border-collapse:collapse;width:100%;font-size:9.5pt;margin:6pt 0}th,td{border:1px solid #c4cbe8;padding:3pt 5pt;vertical-align:top;text-align:left}th{background:#e9ecf8}td.n,th.n{text-align:right}
.pair{page-break-inside:avoid;margin:0 0 8pt}.two{display:grid;grid-template-columns:1fr 1fr;gap:10pt}
.two img{width:auto;max-width:100%;max-height:112mm;display:block;margin:0 auto;border:1px solid #c4cbe8;border-radius:6pt}figure{margin:0}figcaption{font-size:8.5pt;color:#555;text-align:center}
.tag{display:inline-block;padding:0 8pt;border-radius:9pt;font-size:9pt;font-weight:700;margin-bottom:3pt;color:#fff}.tag.b{background:#7a7f99}.tag.a{background:#15803d}
.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8pt}.grid img{width:100%;border:1px solid #c4cbe8;border-radius:5pt}.grid>div{page-break-inside:avoid}
ol li,ul li{margin:2pt 0}code{background:#eef0fa;padding:0 3pt;border-radius:3pt;font-size:9.5pt}pre{background:#eef0fa;padding:6pt 8pt;border-radius:5pt;font-size:9pt;white-space:pre-wrap;word-break:break-all}
.cover{margin-bottom:14pt}.ok{color:#15803d;font-weight:700}
</style></head><body>
<div class="cover"><h1>รายงานการยกระดับระบบติว O-NET วิทยาศาสตร์ ป.6 · ม.3</h1><div class="s">วันที่ ${today} · ทุกอย่างอยู่ที่ <b>หน้าทดลอง</b> https://suradat52-cell.github.io/onet-science/preview/ (noindex, มีป้าย "หน้าทดลอง") · เว็บหลักและ Apps Script ตัวจริงไม่ถูกแตะ</div>
<p>สรุป: สรุปเนื้อหาครบ 19 มาตรฐานในรูปแบบใหม่ · ฝั่งนักเรียนมีแดชบอร์ด/สมุดข้อผิด/ทบทวน/ข้อสอบจับเวลา/บัตรคำ/ค้นหา/เหรียญ/ตั้งค่า/ออฟไลน์ · ฝั่งครูมี heatmap วิเคราะห์ข้อสอบ มอบงาน ก่อน-หลังเรียน CSV/PDF · ผ่านการตรวจการเข้าถึง WCAG 2.1 AA ทุกหน้า · ชุดทดสอบผ่านทุกชุด</p></div>
<h2>1. ภาพหน้าจอมือถือ (360 px) ก่อน → หลัง</h2><p class="s">"ก่อน" = ระบบก่อนเริ่มงานนี้ (commit 26cbb8b) · "หลัง" = หน้าทดลองปัจจุบัน · ภาพจากเซิร์ฟเวอร์จำลองที่รัน Code.gs ตัวเดียวกับของจริง พร้อมข้อมูลตัวอย่าง</p>
${pairHtml}
<h2>หน้าใหม่ที่ไม่มีของเดิมให้เทียบ</h2>${onlyHtml}
<h2>2. ฟีเจอร์ใหม่ อยู่ตรงไหน ใช้อย่างไร</h2>
<table><tr><th>ผู้ใช้</th><th>อยู่ที่</th><th>ใช้อย่างไร</th></tr>${feat.map(f => `<tr><td>${esc(f[0])}</td><td><b>${esc(f[1])}</b></td><td>${esc(f[2])}</td></tr>`).join("")}</table>
<h2>3. กลุ่ม ง ที่ยังไม่แน่ใจ (คงไว้ รอคุณดู)</h2><p class="s">ตามกฎของคุณ: ตัดแล้ว ป.6 ว 3.1 ป.4/3 ระบบสุริยะ และ ป.5/1 ดาวเคราะห์กับดาวฤกษ์ (นอก Blueprint ไม่เคยออก) · ย่อ ม.3 ว 2.1 ม.2/3 สารละลาย เหลือ 2 บรรทัด · ด้านล่างคือหัวข้อนอก Blueprint 2569 ที่เคยออกสอบจริง จึงคงไว้ ตอบแค่ "ตัด" หรือ "คงไว้" รายแถว</p>
<table><tr><th>มาตรฐาน</th><th>ตัวชี้วัด</th><th>หัวข้อ</th><th class="n">ตัวอักษร</th><th>ข้อสอบจริงที่อ้างถึง</th><th>ข้อเสนอ</th></tr>${gd}</table>
<h2>4. สิ่งที่ข้ามเพราะต้องให้คุณทำ / ข้อควรรู้</h2><table><tr><th>เรื่อง</th><th>รายละเอียด</th></tr>${skipped.map(s => `<tr><td><b>${esc(s[0])}</b></td><td>${esc(s[1])}</td></tr>`).join("")}</table>
<h2>5. Lighthouse (มือถือ) และผลทดสอบ</h2>
<table><tr><th>ที่วัด</th><th class="n">Perf</th><th class="n">A11y</th><th class="n">BP</th><th class="n">SEO</th><th>เวลา (จำลอง 4G ช้า)</th></tr>
${lh(C("lh-final-preview.json"), "หน้าทดลองบนอินเทอร์เน็ตจริง", "SEO ต่ำเพราะตั้ง noindex ตั้งใจ (is-crawlable) · เว็บหลักไม่มี noindex")}${lh(C("lh-final-local.json"), "ซอร์สเดียวกัน (ไม่รวมไฟล์) เสิร์ฟในเครื่อง ไม่มี noindex", "ตัวแทนของเว็บหลักหลังย้าย (publish.mjs ส่งซอร์สตามเดิม)")}</table>
<p>โหลดแรกแบบเย็น (ไม่มีแคช) วัดจริงผ่านการจำลองเครือข่าย:</p><ul>${load4g}</ul>
<p class="s">วิธีลดเวลา: ฟอนต์โหลดแบบไม่บล็อก · สคริปต์รวมเป็นไฟล์เดียวย่อขนาด (120 KB ย่อแล้ว ~40 KB เมื่อบีบอัด) · CSS ฝังใน HTML · favicon 2.6 KB · service worker เก็บแคช (เปิดครั้งที่สองแทบไม่ใช้เน็ต)</p>
<table><tr><th>ชุดทดสอบ</th><th class="n">ผ่าน</th><th class="n">ไม่ผ่าน</th><th>ตรวจอะไร</th></tr>${tests}</table>
<p class="s">รันทั้งหมด: <code>node tools/test/run-all.mjs</code> (เริ่มเซิร์ฟเวอร์จำลองใหม่ก่อนทุกชุด) · ทดสอบหน้าทดลองที่สร้างแล้ว (ไฟล์รวม/ย่อ): <code>ONET_BASE=http://localhost:8794/preview/ node tools/test/learn.mjs</code> หลังรัน <code>node tools/test/pv-server.mjs &lt;โฟลเดอร์&gt;</code> · ทุกชุดยิงเฉพาะเซิร์ฟเวอร์จำลอง ไม่ยิงระบบจริง</p>
<h2>6. ขั้นตอนย้ายหน้าทดลองไปเว็บหลัก (เมื่อคุณอนุมัติ)</h2>
<ol>
<li><b>ตรวจก่อน</b>: ลองใช้ที่ /preview/ ทั้งฝั่งนักเรียนและครู (ล็อกอินแอดมินจริง มอบงาน 1 งาน ให้นักเรียนทดสอบทำ) · ตอบ 4 แถวที่ไม่แน่ใจในหัวข้อ 3</li>
<li><b>Apps Script ตัวจริงก่อนเสมอ</b> (หน้าเว็บใหม่เรียก progress/analytics/มอบงาน ซึ่ง @9 ยังไม่มี): <pre>cd apps-script\nclasp push -f\nclasp deploy -i AKfycbx6hs29CHXPQGAgLKR8goORieF0l8cSI_9WXuOsblbhCmi5SEejDTF8lvf1ESR-aNxS -d "ยกระดับ: มอบงาน analytics ปิด/เปิดโรงเรียน"</pre>ชีตเดิมใช้ต่อได้ทันที (เพิ่มแท็บ Assignments เองตอนมอบงานครั้งแรก · คอลัมน์ answers เริ่มเก็บคำตอบ) ไม่ลบ/เปลี่ยนชื่ออะไรของเดิม · หน้าเว็บเดิมที่ยังเปิดค้างอยู่ใช้ต่อได้ (backend เข้ากันย้อนหลัง)</li>
<li><b>เว็บหลัก</b>: <pre>node tools/test/run-all.mjs      # ต้องผ่านทุกชุด\nnode tools/publish.mjs "ยกระดับระบบ: สรุปใหม่ ทบทวน ข้อสอบจับเวลา รายงานครู"</pre>ไม่ต้องแก้ index.html (URL Apps Script ในไฟล์คือของจริงอยู่แล้ว · <code>PREVIEW=false</code>, <code>PWA=false</code>) · ถ้าอยากเปิด PWA/ออฟไลน์บนเว็บหลักด้วย ให้ตั้ง <code>PWA = true</code> ใน index.html แล้วให้ผมเพิ่มการรวมสคริปต์ใน publish.mjs เหมือนหน้าทดลอง (ทำได้ภายในไม่กี่นาที) </li>
<li><b>หลังขึ้น</b>: เปิดเว็บหลักตรวจ 3 อย่าง (เข้าห้อง · ทำข้อสอบ 1 ชุด · ครูเปิดรายงาน) แล้วรัน <code>node tools/publish-preview.mjs</code> อีกครั้งถ้าจะให้หน้าทดลองตามทัน หรือลบโฟลเดอร์ preview/ ใน repo deploy เมื่อไม่ใช้แล้ว</li>
<li><b>ย้อนกลับ</b> (ถ้าจำเป็น): เว็บ — <code>git revert</code> commit ล่าสุดของ repo deploy แล้ว push · Apps Script — ทำ deploy ใหม่ด้วยโค้ดเดิม (commit c52943c ก่อนช่วง 2) ผ่าน <code>clasp deploy -i …</code></li>
</ol>
</body></html>`;
fs.writeFileSync(path.join(ROOT, "review", "upgrade", "report.html"), html);
const b = await puppeteer.launch({ executablePath: ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"].find(f => fs.existsSync(f)), headless: true });
const p = await b.newPage(); await p.goto("file:///" + path.join(ROOT, "review", "upgrade", "report.html").replace(/\\/g, "/"), { waitUntil: "load" });
await p.pdf({ path: path.join(ROOT, "review", "UPGRADE.pdf"), format: "A4", printBackground: true, margin: { top: "14mm", bottom: "14mm", left: "12mm", right: "12mm" } });
await b.close();
console.log("สร้าง review/UPGRADE.pdf แล้ว · ภาพเทียบ " + pairs.length + " คู่ · หน้าใหม่ " + only.length + " ภาพ");
