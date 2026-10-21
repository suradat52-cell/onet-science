// สร้าง review/SUMMARY-PROTO.pdf: เทียบ "ก่อน" กับ "หลัง" ของสรุป 2 มาตรฐานต้นแบบ (ภาพมือถือ 360 px ทีละหัวข้อ + หน้า PDF ที่ดาวน์โหลด)
//   ก่อน = โค้ดและข้อมูลที่ commit ล่าสุด (git worktree ใน %LOCALAPPDATA%/Temp/onet-before รันเซิร์ฟเวอร์จำลองพอร์ต 8766) · หลัง = โฟลเดอร์งานปัจจุบัน (พอร์ตจาก tools/.cache/admin.json)
//   node tools/proto-compare.mjs      (ต้องรัน tools/test/server.mjs ทั้งสองที่ก่อน และรัน tools/proto-shots.mjs before/after ให้ได้ไฟล์ PDF ของสองฝั่ง)
import puppeteer from "puppeteer-core";
import * as mupdf from "mupdf";
import fs from "fs";
import path from "path";
import { ROOT, TOOLS, BLOCK_REAL_API } from "./lib.mjs";

const BEFORE_DIR = path.join(process.env.LOCALAPPDATA, "Temp", "onet-before");
const side = { before: JSON.parse(fs.readFileSync(path.join(BEFORE_DIR, "tools", ".cache", "admin.json"), "utf8")), after: JSON.parse(fs.readFileSync(path.join(TOOLS, ".cache", "admin.json"), "utf8")) };
const EDGE = ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"].find(f => fs.existsSync(f));
const OUT = path.join(ROOT, "review", "proto", "compare"); fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
const STDS = [
  { lv: "P6", std: "ว 2.1", name: "ป.6 ว 2.1 สสารและสารรอบตัว (ออกบ่อยที่สุดของ ป.6: 36 ข้อ)", secs: [
    ["ส่วนบนสุดของหน้า", null, "แผนผังความคิดกดไปยังหัวข้อ · สรุปย่อหน้าเดียวเปลี่ยนเป็นตารางเปรียบเทียบ"],
    ["3) ความแข็งแรง", "3) ความแข็งแรง", "กล่องแยกประเภท + ตัวอย่าง โจทย์ → คิดอย่างไร → คำตอบ + กับดัก + ภาพใหม่"],
    ["4) การนำความร้อน", "4) การนำความร้อน", "ตารางเลือกวัสดุตามงาน · ภาพแท่งขี้ผึ้งวาดใหม่เป็นแนวตั้ง"],
    ["วิธีแยกสารและเมื่อไรใช้", "วิธีแยกสารและเมื่อไรใช้", "ตาราง 3 คอลัมน์ → การ์ดต่อวิธี (ไม่ต้องบีบคอลัมน์) + กับดักแยกเป็นข้อ ๆ"],
    ["แยกหลายขั้นตอน", "แยกหลายขั้นตอน", "บรรทัดลูกศรยาว → ผังขั้นตอนแนวตั้ง"],
    ["ชื่อการเปลี่ยนสถานะ", "ชื่อการเปลี่ยนสถานะ", "ภาพการเปลี่ยนสถานะแนวตั้ง · ลูกศรขึ้น/ลง = รับ/คายความร้อน"],
    ["วิธีสังเกตว่าเป็นสถานะใด", "วิธีสังเกตว่าเป็นสถานะใด", "กลุ่ม ข: เพิ่มแถว 'อนุภาค' และกับดัก 'ลดอุณหภูมิของแข็ง' ตามข้อสอบ 2562 ข้อ 11"],
  ] },
  { lv: "M3", std: "ว 2.3", name: "ม.3 ว 2.3 พลังงาน (ออกบ่อยที่สุดของ ม.3: 48 ข้อ)", secs: [
    ["ส่วนบนสุดของหน้า", null, "แผนผังความคิด 25 หัวข้อ แบ่งตามความถี่ที่ข้อสอบออก"],
    ["พลังงานกลคงตัว", "พลังงานกลคงตัว", "ตัวอย่างยาวบรรทัดเดียว → การ์ด 3 ตอน · กับดักแยกเป็นข้อ · ปีที่ข้อสอบออกใส่ให้อัตโนมัติ"],
    ["กฎของการต่อวงจร", "กฎของการต่อวงจร", "กลุ่ม ข: เพิ่มผัง 'ยุบวงจรผสมทีละขั้น' ตามข้อสอบ 2564/2567/2568"],
    ["กระจกเงาเว้า", "กระจกเงาเว้า", "ภาพรังสีคำนวณจากสมการ แนวตั้ง 300 หน่วย ตัวอักษร ≥ 12 px · รังสีสำคัญเป็นผังขั้นตอน"],
    ["การหักเหของแสง", "การหักเหของแสง", "กลุ่ม ข: ไม่เคยมีภาพ/ตาราง → เพิ่มภาพมุมตกกระทบ-มุมหักเห + ตารางทิศการหักเห"],
    ["ความร้อนที่ให้ = ความร้อนที่รับ", "ความร้อนที่ให้ = ความร้อนที่รับ", "สูตรในกล่องกลางหน้า · ผังขั้นตอนโจทย์สมดุลความร้อน"],
    ["กล้องโทรทรรศน์", "กล้องโทรทรรศน์", "สูตรกำลังขยายในกล่อง · แว่นขยายมีภาพใหม่"],
  ] },
];
const b = await puppeteer.launch({ executablePath: EDGE, headless: true, args: BLOCK_REAL_API });
const p = await b.newPage(); p.on("pageerror", e => console.log("JS error:", e.message));
await p.setViewport({ width: 360, height: 800, deviceScaleFactor: 1.5, isMobile: true, hasTouch: true });
const shot = async (ver, S, i, start) => {
  const s = side[ver];
  await p.goto(`http://localhost:${s.port}/`, { waitUntil: "networkidle0" }); await p.evaluate(() => localStorage.clear());
  await p.goto(`http://localhost:${s.port}/`, { waitUntil: "networkidle0" });
  await p.type("#cc", s.rooms[S.lv]); await p.$eval("#cf button", x => x.click());
  await p.waitForSelector('button[data-a="pick"]'); await p.$eval('button[data-a="pick"]', x => x.click()); await p.waitForSelector(".scard");
  await p.evaluate(x => study(x, ""), S.std); await p.waitForSelector(".rich"); await p.waitForNetworkIdle({ idleTime: 400 }); await new Promise(r => setTimeout(r, 500));
  await p.addStyleTag({ content: "#bnav,.top{display:none!important}" });
  return p;
};
const rows = [];
for (const S of STDS) {
  const cmp = [];
  for (const [label, start, note] of S.secs) {
    const e = { label, note, imgs: {} };
    for (const ver of ["before", "after"]) {
      await shot(ver, S, 0, start);
      const r = await p.evaluate(start => {
        const top = el => el.getBoundingClientRect().top + scrollY;
        const paper = document.querySelector(".paper");
        if (!start) return { y: top(paper), h: 1500 };
        const hs = [...document.querySelectorAll(".rich h3")], i = hs.findIndex(h => h.textContent.trim().startsWith(start));
        if (i < 0) return null;
        let j = i + 1; while (j < hs.length && hs[j].textContent.trim().startsWith(start)) j++;
        const y0 = top(hs[i]); let y1;
        // จบที่หัวข้อย่อยถัดไป หรือหัวข้อ @@ ถัดไป (h3.th / h3 ของบล็อกเก่า) แล้วแต่อะไรมาก่อน
        const all = [...document.querySelectorAll("h3")], k = all.indexOf(hs[j - 1]);
        y1 = k + 1 < all.length ? top(all[k + 1]) : top(paper) + paper.offsetHeight;
        return { y: y0 - 6, h: Math.min(2600, y1 - y0 + 6) };
      }, start);
      if (!r) { console.log("ไม่พบหัวข้อ", ver, S.lv, start); continue; }
      const f = path.join(OUT, `${S.lv}-${rows.length}-${cmp.length}-${ver}.png`);
      await p.screenshot({ path: f, clip: { x: 0, y: Math.max(0, r.y), width: 360, height: Math.max(40, r.h) }, captureBeyondViewport: true });
      e.imgs[ver] = path.basename(f); e.imgs[ver + "H"] = Math.round(r.h);
    }
    cmp.push(e);
  }
  rows.push({ ...S, cmp });
}
await b.close();
// หน้า PDF: เลือกหน้าที่มีชื่อ "สรุปย่อ 1 หน้า" และหน้าเนื้อหากลาง ๆ จากไฟล์ PDF ที่ proto-shots สร้างไว้ทั้งสองฝั่ง
const pdfPages = {};
for (const S of STDS) {
  const tag = `${S.lv}-${S.std.replace(/\s/g, "")}`; pdfPages[tag] = {};
  for (const ver of ["before", "after"]) {
    const buf = fs.readFileSync(path.join(ROOT, "review", "proto", ver, tag + ".pdf")), doc = mupdf.Document.openDocument(buf, "application/pdf"), n = doc.countPages();
    const txt = i => doc.loadPage(i).toStructuredText("preserve-whitespace").asText();
    let sheet = 0; for (let i = 0; i < n; i++) if (/สรุปย่อ 1 หน้า/.test(txt(i)) && /สูตร|สมบัติ/.test(txt(i))) { sheet = i; break; }
    const picks = ver === "before" ? [0, Math.min(n - 1, Math.floor(n * 0.45)), Math.floor(n * 0.7)] : [0, sheet, Math.min(n - 1, Math.floor(n * 0.45)), Math.floor(n * 0.7)];
    pdfPages[tag][ver] = { n, imgs: [...new Set(picks)].map(i => { const f = `${tag}-pdf-${ver}-${i + 1}.png`; fs.writeFileSync(path.join(OUT, f), doc.loadPage(i).toPixmap(mupdf.Matrix.scale(1.5, 1.5), mupdf.ColorSpace.DeviceRGB, false, true).asPNG()); return { f, page: i + 1 }; }) };
  }
}
const shots = JSON.parse(fs.readFileSync(path.join(ROOT, "review", "proto", "after", "report.json"), "utf8")), shotsB = JSON.parse(fs.readFileSync(path.join(ROOT, "review", "proto", "before", "report.json"), "utf8"));
const css = `*{box-sizing:border-box}body{margin:0;font:15px/1.5 'Noto Sans Thai',Sarabun,sans-serif;color:#111;background:#fff}
.pg{width:880px;padding:28px 30px;break-after:page}.pg:last-child{break-after:auto}
h1{font-size:26px;margin:0 0 6px}h2{font-size:20px;margin:0 0 4px;border-bottom:3px solid #3730a3;padding-bottom:4px}h3{font-size:16px;margin:18px 0 4px}
.m{color:#555;font-size:13px}.row{break-inside:avoid;margin:0 0 22px}.cap{font-weight:700;margin:0 0 2px}.note{font-size:13px;color:#333;margin:0 0 6px}
.two{display:flex;gap:30px;align-items:flex-start}.two>div{width:360px}.two img{display:block;width:360px;border:1px solid #bbb}.tag{display:inline-block;font-size:12px;font-weight:700;padding:1px 10px;border-radius:99px;margin:0 0 4px}.b{background:#e5e7eb}.a{background:#c7d2fe}
table{border-collapse:collapse;width:100%;font-size:13px}td,th{border:1px solid #999;padding:4px 8px;text-align:left;vertical-align:top}th{background:#eee}
.pdfp{display:flex;gap:10px;flex-wrap:wrap}.pdfp figure{margin:0;width:200px}.pdfp img{width:200px;border:1px solid #999;display:block}.pdfp figcaption{font-size:11px;color:#444}
ul{margin:4px 0 8px 18px;padding:0}li{margin:2px 0}`;
const cover = `<div class="pg"><h1>ต้นแบบสรุปเนื้อหารูปแบบใหม่ — ก่อน / หลัง</h1><div class="m">ยังไม่ publish · ต้นแบบ 2 มาตรฐาน: ป.6 ว 2.1 (ออกบ่อยที่สุดของ ป.6) และ ม.3 ว 2.3 (ออกบ่อยที่สุดของ ม.3) · ภาพมือถือกว้าง 360 px และหน้า PDF ที่ดาวน์โหลด</div>
<h3>ตัวเลขรวม</h3><table><tr><th>มาตรฐาน</th><th></th><th>ก่อน</th><th>หลัง</th></tr>
${STDS.map(S => { const tag = `${S.lv}-${S.std.replace(/\s/g, "")}`, a = shots.find(x => x.tag === tag), bb = shotsB.find(x => x.tag === tag); return `<tr><td rowspan="3">${S.lv === "P6" ? "ป.6" : "ม.3"} ${S.std}</td><td>หน้ามือถือยาว</td><td>${bb.h.toLocaleString()} px</td><td>${a.h.toLocaleString()} px</td></tr><tr><td>PDF</td><td>${bb.pdfPages} หน้า</td><td>${a.pdfPages} หน้า</td></tr><tr><td>ภาพ SVG ที่ต้องเลื่อนซ้าย-ขวา / ตัวอักษรภาพเล็กสุด</td><td>${bb.scrollers.length} ภาพ · 11 px</td><td>0 ภาพ · ${Math.min(...a.svgMin.map(s => s.min)).toFixed(1)} px</td></tr>`; }).join("")}</table>
<h3>เปลี่ยนอะไรบ้าง</h3><ul>
<li><b>กล่องแยกสีตามประเภท</b> (แยกได้แม้พิมพ์ขาวดำ ด้วยลายขอบ): แนวคิดหลัก (แถบหนาซ้าย) · จำให้แม่น (ขอบคู่) · ข้อสอบชอบถาม (ขอบประ + ปีที่ออก) · กับดัก (ขอบทึบหนา) · ตัวอย่างเป็นการ์ด โจทย์ → คิดอย่างไร → คำตอบ</li>
<li><b>แผนผังความคิด</b> ต้นมาตรฐาน (สร้างอัตโนมัติ) จัดตามความถี่ที่ข้อสอบออก กดแล้วเลื่อนไปหัวข้อ</li>
<li><b>ผังขั้นตอน</b> แนวตั้ง (ใช้ fl:) และ <b>ตารางเปรียบเทียบ</b> ที่แตกเป็นการ์ดบนมือถือ — ไม่ต้องเลื่อนซ้าย-ขวา</li>
<li>คำสำคัญเน้นสีและขีดเส้นใต้ตอนพิมพ์ · สูตรอยู่ในกรอบกลางหน้า · ทุกย่อหน้า ≤ 4 บรรทัดบนมือถือ (ตัวตรวจจับ)</li>
<li>ภาพ SVG วาดใหม่ทั้ง 12 + 22 ภาพ (รวมภาพใหม่ 3 ภาพ) กว้าง 300 หน่วย ตัวอักษร ≥ 12 px ไม่ต้องเลื่อน · พิกัดรังสีกระจก/เลนส์/การหักเหคำนวณจากสมการ</li>
<li>เนื้อหา: กลุ่ม ข เพิ่ม 3 จุด (ป.6: 'วิธีสังเกตสถานะ' · ม.3: 'กฎของการต่อวงจร' ยุบวงจรผสม · 'การหักเหของแสง') · กลุ่ม ค ย่อและติดป้าย 'ยังไม่เคยออก' · กลุ่ม ง <b>ยังไม่ตัด</b> (ดู data/SUMMARY-AUDIT.md)</li></ul></div>`;
const secHtml = rows.map(S => `<div class="pg"><h2>${S.name}</h2><div class="m">ซ้าย = ก่อน (ที่ publish อยู่ตอนนี้) · ขวา = หลัง (ต้นแบบ)</div>` + S.cmp.map(e => `<div class="row"><div class="cap">${e.label}</div><div class="note">${e.note}</div><div class="two"><div><span class="tag b">ก่อน</span>${e.imgs.before ? `<img src="${e.imgs.before}">` : "(ไม่มีหัวข้อนี้)"}</div><div><span class="tag a">หลัง</span>${e.imgs.after ? `<img src="${e.imgs.after}">` : ""}</div></div></div>`).join("") + `</div>`).join("");
const pdfHtml = STDS.map(S => { const tag = `${S.lv}-${S.std.replace(/\s/g, "")}`, pp = pdfPages[tag]; return `<div class="pg"><h2>หน้า PDF ที่ดาวน์โหลด — ${S.lv === "P6" ? "ป.6" : "ม.3"} ${S.std}</h2><div class="m">ก่อน ${pp.before.n} หน้า · หลัง ${pp.after.n} หน้า · พื้นขาว ตัวดำ (ภาพนี้ขยายได้ในโปรแกรมอ่าน PDF)</div>` + ["before", "after"].map(v => `<h3>${v === "before" ? "ก่อน" : "หลัง"}</h3><div class="pdfp">${pp[v].imgs.map(x => `<figure><img src="${x.f}"><figcaption>หน้า ${x.page}${v === "after" && x.page === pp.after.imgs[1].page ? " (สรุปย่อ 1 หน้า)" : ""}${x.page === 1 ? (v === "after" ? " (แผนผังความคิด)" : " (สรุปย่อ 1 หน้า)") : ""}</figcaption></figure>`).join("")}</div>`).join("") + `</div>`; }).join("");
const html = `<!doctype html><meta charset="utf-8"><title>SUMMARY-PROTO</title><style>${css}</style>${cover}${secHtml}${pdfHtml}`;
const hf = path.join(OUT, "index.html"); fs.writeFileSync(hf, html);
const b2 = await puppeteer.launch({ executablePath: EDGE, headless: true, args: BLOCK_REAL_API }); const q = await b2.newPage();
await q.goto("file:///" + hf.replace(/\\/g, "/"), { waitUntil: "load" }); await q.evaluate(() => document.fonts.ready);
const dest = path.join(ROOT, "review", "SUMMARY-PROTO.pdf");
await q.pdf({ path: dest, width: "880px", height: "2600px", printBackground: true, margin: { top: "0", bottom: "0", left: "0", right: "0" } });
await b2.close();
console.log("สร้าง", dest, (fs.statSync(dest).size / 1e6).toFixed(1) + " MB");
