// รวมภาพหน้าจอมือถือ (design/final/) เป็น PDF เดียว: แต่ละหน้า = ป.6 เทียบ ม.3 ของหน้าเดียวกัน (ครูอยู่หน้าเดียว)
//   node tools/test/ui-pdf.mjs [โฟลเดอร์ภาพ=design/final]  → design/FINAL.pdf
import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import sharp from "sharp";
import { ROOT, BLOCK_REAL_API } from "../lib.mjs";

const EDGE = ["C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "C:/Program Files/Microsoft/Edge/Application/msedge.exe", "C:/Program Files/Google/Chrome/Application/chrome.exe"].find(f => fs.existsSync(f));
const DIR = path.resolve(process.argv[2] || path.join(ROOT, "design", "final")), CAP = 2300; // px ของภาพ (ที่ 390 px กว้าง) ต่อหน้า PDF — หน้าที่ยาวกว่านี้ตัดท้าย
const files = fs.readdirSync(DIR).filter(f => /\.png$/.test(f));
const parse = f => { const m = f.match(/^(P6|M3|T)-(\d+)-(.+)\.png$/); return m && { lv: m[1], n: +m[2], name: m[3], f }; };
const all = files.map(parse).filter(Boolean);
const NAMES = { code: "กรอกรหัสห้องเรียน", roster: "เลือกชื่อนักเรียน", home: "หน้าแรก", exams: "แท็บ ข้อสอบ", learn: "แท็บ สรุป (มาตรฐานและตัวชี้วัด)", study: "สรุปเนื้อหา (การ์ดกระดาษ + ภาพ SVG)", "question-text": "ทำข้อสอบทีละข้อ · ข้อความ", "question-image": "ทำข้อสอบทีละข้อ · มีภาพ", "question-complex": "ทำข้อสอบทีละข้อ · ใช่/ไม่ใช่", "question-order": "ทำข้อสอบทีละข้อ · เรียงลำดับ", "question-sheet": "แผงเลขข้อ + ปักธง", result: "ผลลัพธ์", "result-solution": "เฉลยละเอียด", mine: "แท็บ ผลของฉัน", resources: "ผังข้อสอบและข้อสอบจาก สทศ.", "home-resume": "หน้าแรก · มีข้อสอบที่ทำค้างไว้", "home-progress": "หน้าแรก · มีความคืบหน้า", "admin-login": "ครู: เข้าสู่ระบบ", "admin-students": "ครู: นักเรียน + รหัสห้อง", "admin-report": "ครู: รายงานผล", "admin-admins": "ครู: แอดมิน", "admin-more-schools": "ครู: อื่น ๆ · โรงเรียน", "admin-more-content": "ครู: อื่น ๆ · เนื้อหา" };
const order = [...new Set(all.filter(x => x.lv === "P6").sort((a, b) => a.n - b.n).map(x => x.name))];
const teacher = all.filter(x => x.lv === "T").sort((a, b) => a.n - b.n);
const thumb = async f => { const buf = await sharp(path.join(DIR, f)).resize({ width: 390 }).png().toBuffer(); const m = await sharp(buf).metadata(); const h = Math.min(m.height, CAP); const out = path.join(DIR, ".tmp-" + f); await sharp(buf).extract({ left: 0, top: 0, width: 390, height: h }).toFile(out); return { src: pathToFileURL(out).href, cut: m.height > CAP, h }; };
let html = `<!doctype html><meta charset="utf-8"><style>@page{size:900px ${CAP + 120}px;margin:0}body{margin:0;font:16px/1.4 'Noto Sans Thai',sans-serif;background:#fff}.pg{width:900px;height:${CAP + 120}px;box-sizing:border-box;padding:18px 40px;page-break-after:always;overflow:hidden}h1{font-size:22px;margin:0 0 10px}.c{display:grid;grid-template-columns:390px 390px;gap:30px}.c img{width:390px;display:block;border-radius:10px;box-shadow:0 2px 12px #0004}.c b{display:block;margin-bottom:6px;color:#444}.cut{color:#a00;font-size:12px}</style>`;
for (const name of order) {
  const p = all.find(x => x.lv === "P6" && x.name === name), m = all.find(x => x.lv === "M3" && x.name === name);
  const tp = p && await thumb(p.f), tm = m && await thumb(m.f);
  html += `<div class="pg"><h1>${NAMES[name] || name}</h1><div class="c"><div><b>ป.6</b>${tp ? `<img src="${tp.src}">${tp.cut ? '<div class="cut">(หน้ายาว แสดงเฉพาะส่วนบน)</div>' : ""}` : ""}</div><div><b>ม.3</b>${tm ? `<img src="${tm.src}">${tm.cut ? '<div class="cut">(หน้ายาว แสดงเฉพาะส่วนบน)</div>' : ""}` : ""}</div></div></div>`;
}
for (let i = 0; i < teacher.length; i += 2) {
  const a = teacher[i], b = teacher[i + 1], ta = await thumb(a.f), tb = b && await thumb(b.f);
  html += `<div class="pg"><h1>หน้าของครู</h1><div class="c"><div><b>${NAMES[a.name] || a.name}</b><img src="${ta.src}"></div>${b ? `<div><b>${NAMES[b.name] || b.name}</b><img src="${tb.src}"></div>` : ""}</div></div>`;
}
const htmlPath = path.join(DIR, ".final.html"); fs.writeFileSync(htmlPath, html);
const br = await puppeteer.launch({ executablePath: EDGE, headless: true, args: BLOCK_REAL_API }), p = await br.newPage();
await p.goto(pathToFileURL(htmlPath).href, { waitUntil: "networkidle0" });
const out = path.join(ROOT, "design", "FINAL.pdf");
await p.pdf({ path: out, width: "900px", height: (CAP + 120) + "px", printBackground: true, preferCSSPageSize: true });
await br.close();
for (const f of fs.readdirSync(DIR)) if (f.startsWith(".tmp-") || f === ".final.html") fs.unlinkSync(path.join(DIR, f));
console.log("สร้าง", out, (fs.statSync(out).size / 1e6).toFixed(1) + " MB · " + (order.length + Math.ceil(teacher.length / 2)) + " หน้า");
