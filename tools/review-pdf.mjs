// สร้าง PDF ให้ครูตรวจเฉลยละเอียดก่อนใช้จริง แยกตามระดับและปี
//   node tools/review-pdf.mjs P6 2568
//   node tools/review-pdf.mjs M3 2568 --extra M3-2564/28,M3-2561/38,M3-2563/28
// ผลลัพธ์: review/REVIEW-<ระดับ>-<ปี>.pdf (ใช้ตัวแปลงข้อความ rich() เดียวกับหน้าเว็บ จึงหน้าตาตรงกัน)
// หน้าแรก = รายการที่ต้องตรวจก่อน เรียงความเสี่ยงสูง→ต่ำ · แต่ละข้อ = โจทย์ ตัวเลือก ภาพต้นฉบับ เฉลย สทศ. มาตรฐาน/ตัวชี้วัด ป้าย
//   คำอธิบายสั้นเดิม เฉลยละเอียด ช่องติ๊ก "ถูกต้อง / ต้องแก้" และที่จดบันทึก · ข้อที่อยู่ใน REVIEW.md ไฮไลต์สี
import fs from "fs";
import path from "path";
import puppeteer from "puppeteer-core";
import { at, imgsOf, IMG_NAME, BLOCK_REAL_API } from "./lib.mjs";
import { parseSolutions } from "./solutions.mjs";

const [, , LVA, YA, ...rest] = process.argv;
if (!/^(P6|M3)$/.test(LVA || "") || !/^\d{4}$/.test(YA || "")) { console.log("ใช้: node tools/review-pdf.mjs P6|M3 ปี [--extra M3-2564/28,...]"); process.exit(1); }
const extraIds = rest[0] === "--extra" && rest[1] ? rest[1].split(",").map(s => s.trim()).filter(Boolean) : [];
const EDGE = ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "C:/Program Files/Microsoft/Edge/Application/msedge.exe"].find(p => fs.existsSync(p));

/* ---- ใช้ esc / inl / rich จาก index.html โดยตรง ---- */
const html0 = fs.readFileSync(at("index.html"), "utf8");
const cut = (start, endRe) => { const i = html0.indexOf(start); if (i < 0) throw new Error("ไม่พบ " + start); const m = html0.slice(i).match(endRe); return html0.slice(i, i + m.index + m[0].length); };
const src = [cut("const esc = ", /\n/), cut("function inl(s) {", /\n}\n/), cut("function rich(t) {", /\n}\n/)].join("\n");
const { esc, rich } = new Function("const figOf = () => null;\n" + src + "\nreturn { esc, inl, rich };")();
const CSS = html0.match(/<style>([\s\S]*?)<\/style>/)[1];
const fmt = s => esc(s).replace(/__(.+?)__/g, "<u>$1</u>");
const imgUrl = n => "file:///" + at("images", n).replace(/\\/g, "/").split("/").map((s, i) => i === 0 ? s : encodeURIComponent(s)).join("/");

/* ---- ข้อมูล ---- */
const readTsv = f => fs.readFileSync(at("data", f), "utf8").trim().split("\n").map(l => l.replace(/\r$/, "").split("\t"));
const qMap = {};
for (const f of fs.readdirSync(at("data")).filter(f => /^questions-(P6|M3)-\d{4}\.tsv$/.test(f)))
  for (const r of readTsv(f)) qMap[`${r[0]}-${r[1]}/${r[2]}`] = { lv: r[0], y: r[1], no: +r[2], std: r[3], ind: r[4], stem: r[5], img: r[6], ch: (r[7] || "").split("||").filter(Boolean), ans: r[8], exp: r[9] || "", type: r[10] || (r[7] ? "mc" : "fill"), imgs: imgsOf(r) };
const bp = readTsv("blueprint.tsv").slice(1);
const planInd = new Set(bp.filter(r => r[0] === LVA && r[4]).map(r => r[3] + "|" + r[4]));
const review = fs.readFileSync(at("data", "REVIEW.md"), "utf8");
const revSec = review.split(/^# /m).find(s => s.startsWith("เฉลยละเอียด")) || "";
const flagText = {};
for (const m of revSec.matchAll(/^- \*\*(P6|M3)-(\d{4}) ข้อ (\d+)\*\*(.*)$/gm)) flagText[`${m[1]}-${m[2]}/${m[3]}`] = m[4].replace(/\*\*|~~/g, "").trim();
const sols = {};
for (const f of fs.readdirSync(at("data", "solutions")).filter(f => /^(P6|M3)-\d{4}\.txt$/.test(f)))
  for (const s of parseSolutions(fs.readFileSync(at("data", "solutions", f), "utf8"))) sols[`${s.lv}-${s.y}/${s.no}`] = s;

const mainIds = Object.keys(qMap).filter(k => k.startsWith(`${LVA}-${YA}/`)).sort((a, b) => +a.split("/")[1] - +b.split("/")[1]);
const ids = [...mainIds, ...extraIds.map(e => (e.startsWith(LVA + "-") ? e : LVA + "-" + e))];
const missing = ids.filter(i => !sols[i] || !qMap[i]);
if (missing.length) { console.log("ไม่มีเฉลยละเอียด/โจทย์: " + missing.join(", ")); process.exit(1); }

/* ---- ความเสี่ยง ---- */
const TYPE = { mc: "ปรนัย", complex: "เชิงซ้อน", order: "เรียงลำดับ", fill: "เติมคำ" };
function risk(id) {
  const q = qMap[id], s = sols[id], body = s.body.join("\n"), why = []; let sc = 0;
  const add = (n, t) => { sc += n; why.push(t); };
  if (flagText[id] !== undefined || /^ob: /m.test(body)) add(100, "มีข้อสังเกต (ใน REVIEW.md)");
  if (q.imgs.length) add(30, q.ch.length === 0 || q.imgs.some(x => q.ch.includes(x)) ? "ตัวเลือก/ตารางเป็นภาพ" : "อ่านค่าจากภาพ/กราฟ/ตาราง");
  if (/^= /m.test(body)) add(20, "มีการคำนวณ");
  if (q.type !== "mc") add(10, "ข้อ" + TYPE[q.type]);
  if (!q.ind) add(10, "นอกหลักสูตร");
  else if (!planInd.has(q.std + "|" + q.ind)) add(10, "นอกผัง");
  return { id, sc, why, lab: sc >= 100 ? "ตรวจก่อน" : sc >= 50 ? "สูง" : sc >= 30 ? "กลาง" : "ต่ำ" };
}
const R = ids.map(risk).sort((a, b) => b.sc - a.sc || ids.indexOf(a.id) - ids.indexOf(b.id));

/* ---- สร้าง HTML ---- */
const cellH = c => IMG_NAME.test(String(c).trim()) ? `<img class="subimg" src="${imgUrl(c.trim())}">` : fmt(c);
const ansText = q => {
  const k = q.ans.split(",");
  if (q.type === "complex") return k.map((v, i) => `<div>${i + 1}) ${cellH(q.ch[i] || "")} → <b>${esc(v.split("|").join(" หรือ "))}</b></div>`).join("");
  if (q.type === "order") return k.map(v => `<span class="chip">${esc(v)}${q.ch[+v - 1] ? " " + cellH(q.ch[+v - 1]) : ""}</span>`).join(" → ");
  return k.map(v => `<b>${esc(v)}</b>${q.ch[+v - 1] ? ". " + cellH(q.ch[+v - 1]) : ""}`).join(" หรือ ");
};
const qBlock = (id, n, isExtra) => {
  const q = qMap[id], s = sols[id], r = R.find(x => x.id === id), flag = flagText[id];
  const tags = [q.type !== "mc" ? TYPE[q.type] : "", !q.ind ? "นอกหลักสูตร" : planInd.has(q.std + "|" + q.ind) ? "" : "นอกผัง"].filter(Boolean);
  const opts = q.type === "mc" ? `<ol class="opts">${q.ch.map((c, i) => `<li>${cellH(c)}</li>`).join("")}</ol>` :
    q.ch.length ? `<ol class="opts">${q.ch.map(c => `<li>${cellH(c)}</li>`).join("")}</ol>` : "";
  const shots = q.imgs.filter(x => !q.ch.includes(x) || true).map(x => `<img class="shot" src="${imgUrl(x)}">`).join("");
  return `<section class="q${flag !== undefined ? " flag" : ""}">
<div class="qh"><span class="no">${LVA}-${q.y} ข้อ ${q.no}</span>${isExtra ? '<span class="tg ex">ภาคผนวก (นอกปี ' + YA + ')</span>' : ""}<span class="tg">${esc(q.std)} ${esc(q.ind || "ไม่ระบุตัวชี้วัด")}</span>${tags.map(t => `<span class="tg off">${esc(t)}</span>`).join("")}<span class="tg r${r.lab === "ตรวจก่อน" ? "0" : r.lab === "สูง" ? "1" : r.lab === "กลาง" ? "2" : "3"}">เสี่ยง ${r.lab} (${r.sc})</span></div>
${flag !== undefined ? `<div class="flagbox"><b>อยู่ใน REVIEW.md "เฉลยละเอียด":</b> ${esc(flag)}</div>` : ""}
<div class="stem">${fmt(q.stem)}</div>${opts}
${shots ? `<div class="shots"><b>ภาพต้นฉบับที่แคปไว้ (images/):</b><br>${shots}</div>` : '<p class="mute">ข้อนี้ไม่มีภาพประกอบ (โจทย์/ตัวเลือกเป็นข้อความที่ถอดจากต้นฉบับ)</p>'}
<div class="keyrow"><b>เฉลย สทศ.:</b> ${ansText(q)}</div>
${q.exp ? `<div class="oldexp"><b>คำอธิบายสั้นเดิมในคลัง:</b> ${fmt(q.exp)}</div>` : ""}
<div class="sol open"><h3 class="solh">เฉลยละเอียด · ${esc(s.title)}</h3><div class="rich">${rich(s.body.join("\n"))}</div></div>
<div class="chk"><div class="boxes"><span class="cb"></span> ถูกต้อง &nbsp;&nbsp;&nbsp; <span class="cb"></span> ต้องแก้</div><div class="note"><span>บันทึก:</span><i></i><i></i><i></i></div></div>
</section>`;
};
const first = `<section class="cover">
<h1>ตรวจเฉลยละเอียด ${LVA === "P6" ? "ป.6" : "ม.3"} ปีการศึกษา ${YA}</h1>
<p class="mute">ต้นแบบก่อนใช้จริง · ${mainIds.length} ข้อของปี ${YA}${extraIds.length ? " + ภาคผนวก " + extraIds.length + " ข้อนอกปี" : ""} · เฉลย สทศ. ไม่ถูกแก้ไขทุกข้อ</p>
<h2>รายการที่ต้องตรวจก่อน (เรียงความเสี่ยงสูง → ต่ำ)</h2>
<p class="mute">คะแนนความเสี่ยง: มีข้อสังเกตใน REVIEW.md +100 · มีภาพ/ตัวเลือกเป็นภาพ +30 · คำนวณ +20 · ข้อเชิงซ้อน/เรียงลำดับ +10 · นอกผัง/นอกหลักสูตร +10</p>
<table class="rk"><tr><th>#</th><th>ข้อ</th><th>เสี่ยง</th><th>เหตุผล</th><th>ติ๊ก</th></tr>
${R.map((r, i) => `<tr class="${r.lab === "ตรวจก่อน" ? "hot" : ""}"><td>${i + 1}</td><td><b>${esc(r.id.replace(/^(P6|M3)-/, "").replace("/", " ข้อ "))}</b>${extraIds.some(e => r.id.endsWith(e.replace(/^(P6|M3)-/, ""))) ? " (ภาคผนวก)" : ""}</td><td>${r.lab} (${r.sc})</td><td>${esc(r.why.join(" · ") || "–")}${flagText[r.id] ? "<br><small>" + esc(flagText[r.id].slice(0, 140)) + "…</small>" : ""}</td><td><span class="cb"></span></td></tr>`).join("")}</table>
</section>`;
const body = first + ids.map((id, i) => qBlock(id, i + 1, i >= mainIds.length)).join("");
const PR = `
@page{size:A4;margin:12mm 12mm 14mm}
body{background:#fff;color:#111;font-size:12.5px;line-height:1.55}
.cover h1{font-size:22px;margin:0 0 4px}
.cover h2{font-size:16px;margin:14px 0 4px}
table.rk{border-collapse:collapse;width:100%;font-size:11.5px}
table.rk td,table.rk th{border:1px solid #bbb;padding:3px 6px;text-align:left;vertical-align:top}
table.rk tr.hot td{background:#ffedd5}
.cb{display:inline-block;width:13px;height:13px;border:1.5px solid #222;border-radius:2px;vertical-align:-2px}
section.q{break-before:page;padding:0}
section.q.flag{border-left:6px solid #f97316;padding-left:8px;background:#fffaf3}
.qh{display:flex;flex-wrap:wrap;gap:5px;align-items:center;margin-bottom:6px}
.no{font-size:16px;font-weight:700;margin-right:6px}
.tg{border:1px solid #888;border-radius:10px;padding:0 8px;font-size:11px}.tg.off{background:#fef3c7;border-color:#d97706}.tg.ex{background:#e0e7ff;border-color:#6366f1}
.tg.r0{background:#f97316;color:#fff;border-color:#c2410c}.tg.r1{background:#fecaca;border-color:#dc2626}.tg.r2{background:#fef3c7}.tg.r3{background:#dcfce7;border-color:#16a34a}
.flagbox{background:#ffedd5;border:2px solid #f97316;border-radius:6px;padding:5px 8px;margin:4px 0;font-size:12px}
.stem{font-size:13.5px;margin:6px 0}
ol.opts{margin:4px 0 6px 22px;padding:0}ol.opts li{margin:2px 0}
.shots img.shot{max-width:100%;max-height:230px;border:1px solid #bbb;margin:3px 0;display:block}
img.subimg{max-height:120px;vertical-align:middle}
.keyrow{background:#e0f2fe;border:1px solid #7dd3fc;border-radius:6px;padding:4px 8px;margin:6px 0}
.oldexp{font-size:11.5px;color:#444;margin:4px 0;border-left:3px solid #aaa;padding-left:8px}
.sol{display:block!important;border-left:4px solid #0f766e;margin:8px 0;padding:2px 10px 6px;background:#fbfbf8}
.sol h3.solh{margin:4px 0}
.rich h3{font-size:13px;margin:8px 0 2px}.rich ul{margin:2px 0 2px 18px;padding:0}.rich li{margin:1px 0}.rich p{margin:2px 0}
.chk{break-inside:avoid;border-top:2px dashed #888;margin-top:10px;padding-top:6px}
.chk .boxes{font-size:15px;margin-bottom:6px}
.chk .note span{font-weight:700}.chk .note i{display:block;border-bottom:1px solid #999;height:20px}
.mute{color:#666}
`;
const full = `<!doctype html><html lang="th"><head><meta charset="utf-8"><title>REVIEW-${LVA}-${YA}</title><style>${CSS}\n${PR}</style></head><body><div class="wrap">${body}</div></body></html>`;
fs.mkdirSync(at("tools", ".cache"), { recursive: true });
fs.mkdirSync(at("review"), { recursive: true });
const htmlFile = at("tools", ".cache", `review-${LVA}-${YA}.html`), out = at("review", `REVIEW-${LVA}-${YA}.pdf`);
fs.writeFileSync(htmlFile, full);
const b = await puppeteer.launch({ executablePath: EDGE, headless: true, args: BLOCK_REAL_API }), p = await b.newPage();
await p.goto("file:///" + htmlFile.replace(/\\/g, "/"), { waitUntil: "networkidle0" });
await p.pdf({ path: out, format: "A4", printBackground: true, displayHeaderFooter: true, margin: { top: "12mm", bottom: "14mm", left: "12mm", right: "12mm" },
  headerTemplate: "<span></span>", footerTemplate: `<div style="font-size:9px;width:100%;text-align:center;color:#666">ตรวจเฉลยละเอียด ${LVA}-${YA} · หน้า <span class="pageNumber"></span>/<span class="totalPages"></span></div>` });
await b.close();
console.log("สร้างแล้ว", path.relative(at(), out), "·", ids.length, "ข้อ · ตรวจก่อน", R.filter(r => r.lab === "ตรวจก่อน").map(r => r.id).join(", "));
