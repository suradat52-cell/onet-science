// ตรวจไฟล์สรุปเนื้อหา data/summaries/<ระดับ>-<มาตรฐาน>.txt : node tools/summaries.mjs [ไฟล์ ...]
// ตรวจ: หัวข้อ @@ ถูกรูปแบบ · ระดับตรงชื่อไฟล์ · ตัวชี้วัดครบทุกตัวใน Blueprint 2569 ของมาตรฐานนั้น · เรียงตามจำนวนข้อที่ออก
//       markup ใช้ได้ · ภาพ [[fig:..]] มีอยู่จริงใน figs/<ระดับ>.js · เศษส่วน {เศษ/ส่วน} ปิดครบ · ไม่คัดลอกโจทย์ (ข้อความเหมือนกันยาวติดกันเกิน 28 ตัวอักษร)
import fs from "fs";
import path from "path";
import { at } from "./lib.mjs";

const DIR = at("data", "summaries");
const files = process.argv.length > 2 ? process.argv.slice(2) : fs.readdirSync(DIR).filter(f => /^(P6|M3)-.*\.txt$/.test(f)).map(f => path.join(DIR, f));
const read = f => fs.readFileSync(at("data", f), "utf8").trim().split("\n").map(l => l.split("\t"));
const bp = read("blueprint.tsv").slice(1).map(r => ({ lv: r[0], std: r[3], ind: r[4] }));
const qs = [];
for (const f of fs.readdirSync(at("data")).filter(f => /^questions-(P6|M3)-\d{4}\.tsv$/.test(f))) for (const r of read(f)) qs.push({ lv: r[0], y: r[1], no: r[2], std: r[3], ind: r[4], text: [r[5], r[7], r[9]].join(" ") });

// เนื้อหาที่เปรียบเทียบเพื่อหาการคัดลอก: ตัดช่องว่างและเครื่องหมาย markup ออก
const norm = s => s.replace(/\*\*|__|\{|\}|[\s|•\-–·,.()"'“”:;!?]/g, "");
function copied(summary, q) { // คืนข้อความยาวที่สุดที่เหมือนกัน (ถ้ายาวเกินเกณฑ์)
  const a = norm(summary), b = norm(q), K = 28; let best = "";
  const seen = new Set(); for (let i = 0; i + K <= b.length; i++) seen.add(b.slice(i, i + K));
  for (let i = 0; i + K <= a.length; i++) if (seen.has(a.slice(i, i + K))) { let j = K; while (i + j < a.length && b.includes(a.slice(i, i + j + 1))) j++; const s = a.slice(i, i + j); if (s.length > best.length) best = s; }
  return best;
}

let errs = 0, warns = 0;
const bad = (f, m) => { errs++; console.log(`✗ ${path.basename(f)}: ${m}`); };
const warn = (f, m) => { warns++; console.log(`! ${path.basename(f)}: ${m}`); };

for (const f of files) {
  const name = path.basename(f), lvFile = name.slice(0, 2);
  const text = fs.readFileSync(f, "utf8"), lines = text.split(/\r?\n/);
  const secs = []; let cur = null;
  lines.forEach((l, i) => {
    if (/^@@\s/.test(l)) { const c = l.slice(2).split("|").map(x => x.trim()); cur = { lv: c[0], std: c[1], ind: c[2], title: c.slice(3).join(" | "), body: [], at: i + 1 }; secs.push(cur); if (c.length < 4 || !c[3]) bad(f, `บรรทัด ${i + 1}: หัวข้อไม่ครบ 4 ช่อง`); }
    else if (cur) cur.body.push({ l, n: i + 1 });
  });
  if (!secs.length) { bad(f, "ไม่มีหัวข้อ @@"); continue; }
  const stds = [...new Set(secs.map(s => s.std))];
  if (stds.length !== 1) bad(f, `ไฟล์เดียวต้องมีมาตรฐานเดียว พบ ${stds.join(", ")}`);
  const std = stds[0], figs = {};
  const figSrc = fs.existsSync(at("figs", `${lvFile}.js`)) ? fs.readFileSync(at("figs", `${lvFile}.js`), "utf8") : "";
  for (const m of figSrc.matchAll(/F\['([\w-]+)'\]\s*=/g)) figs[m[1]] = 1;
  if (!name.startsWith(`${lvFile}-`) || secs.some(s => s.lv !== lvFile)) bad(f, "ระดับในหัวข้อต้องตรงกับชื่อไฟล์ (ป.6 กับ ม.3 แยกกัน)");
  // แยกระดับเด็ดขาด: ห้ามอ้างตัวชี้วัด/คำเฉพาะของอีกระดับ
  const other = lvFile === "P6" ? /ม\.[1-3]\/\d|ม\.[1-6]\b|มัธยม/ : /ป\.[1-6]\/\d|ประถม|ชั้น ป\./;
  if (other.test(text.replace(/^\/\/.*$/gm, ""))) warn(f, "พบคำที่อ้างถึงอีกระดับ: " + (text.match(other) || [])[0]);

  // ตัวชี้วัดใน Blueprint ของมาตรฐานนี้
  const bpInd = bp.filter(b => b.lv === lvFile && b.std === std && b.ind).map(b => b.ind);
  const have = secs.map(s => s.ind).filter(Boolean);
  const missing = bpInd.filter(i => !have.includes(i));
  if (missing.length) bad(f, `ขาดตัวชี้วัดใน Blueprint: ${missing.join(", ")}`);
  const extra = have.filter(i => !bpInd.includes(i));
  if (extra.length) warn(f, `ตัวชี้วัดนอกผัง 2569: ${extra.join(", ")}`);
  // เรียงจากออกบ่อยสุด (นับเฉพาะข้อในหลักสูตร) — ตัวที่เท่ากันเรียงตามลำดับใน Blueprint
  const cnt = i => qs.filter(q => q.lv === lvFile && q.std === std && q.ind === i).length;
  const counts = have.map(cnt);
  for (let k = 1; k < counts.length; k++) if (counts[k] > counts[k - 1]) bad(f, `ลำดับไม่เรียงตามจำนวนข้อ: ${have[k - 1]} (${counts[k - 1]}) ก่อน ${have[k]} (${counts[k]})`);

  // สรุปย่อ 1 หน้า: บล็อกแรกของไฟล์ ไม่ผูกตัวชี้วัด ต้องมีตาราง/กล่อง !! และ ?? (ความยาวไม่เกิน 1 หน้า A4 ตรวจโดย summary-shots.mjs)
  const sh = secs.filter(s => !s.ind);
  if (sh.length !== 1 || secs[0].ind) bad(f, "ต้องมีสรุปย่อ 1 หน้า 1 บล็อก (ตัวชี้วัดว่าง) เป็นบล็อกแรกของไฟล์");
  else { const b = sh[0].body.map(x => x.l.trim()); if (!/^สรุปย่อ 1 หน้า/.test(sh[0].title)) bad(f, "ชื่อบล็อกสรุปย่อต้องขึ้นต้นด้วย 'สรุปย่อ 1 หน้า'"); if (!b.some(l => l.startsWith("|"))) bad(f, "สรุปย่อ 1 หน้าไม่มีตาราง"); if (!b.some(l => l.startsWith("!! "))) bad(f, "สรุปย่อ 1 หน้าไม่มีกล่อง !!"); if (!b.some(l => l.startsWith("?? "))) bad(f, "สรุปย่อ 1 หน้าไม่มีประเด็นที่ออกบ่อย (??)"); if (b.some(l => l.startsWith("ex: "))) warn(f, "สรุปย่อ 1 หน้าไม่ควรมีตัวอย่าง ex:"); }

  // markup ทีละบรรทัด
  const prefixes = /^(## |• |- |!! |\?\? |ex: |= |\||\[\[fig:[\w-]+(\|.*)?\]\]$)/;
  let nEx = 0, nTip = 0, nFig = 0;
  for (const s of secs) {
    const body = s.body.filter(x => !/^\/\//.test(x.l));
    let ex = 0, tip = 0, fg = 0;
    for (const { l, n } of body) {
      const t = l.trim(); if (!t) continue;
      if (!prefixes.test(t)) bad(f, `บรรทัด ${n}: ขึ้นต้นไม่ใช่ markup ที่ระบบรู้จัก → "${t.slice(0, 30)}"`);
      if ((t.match(/\{/g) || []).length !== (t.match(/\}/g) || []).length) bad(f, `บรรทัด ${n}: เครื่องหมาย { } ไม่ครบคู่`);
      for (const m of t.matchAll(/\{([^{}]*)\}/g)) if (!/^[^/]+\/[^/]+$/.test(m[1])) bad(f, `บรรทัด ${n}: เศษส่วน {${m[1]}} ต้องเป็น {เศษ/ส่วน} และห้ามมี / ซ้อน`);
      if ((t.match(/\*\*/g) || []).length % 2) bad(f, `บรรทัด ${n}: ** ไม่ครบคู่`);
      const fm = t.match(/^\[\[fig:([\w-]+)/); if (fm) { fg++; if (!figs[fm[1]]) bad(f, `บรรทัด ${n}: ไม่มีภาพ ${fm[1]} ใน figs/${lvFile}.js`); }
      if (/^\[\[img:/.test(t)) bad(f, `บรรทัด ${n}: ห้ามใช้ภาพจากลิงก์ภายนอก/ภาพแคปข้อสอบ`);
      if (t.startsWith("ex: ")) ex++; if (t.startsWith("?? ")) tip++;
      if (/\t/.test(l)) bad(f, `บรรทัด ${n}: มี tab`);
    }
    nEx += ex; nTip += tip; nFig += fg;
    if (!body.some(x => x.l.trim())) bad(f, `หัวข้อ ${s.ind || "(ภาพรวม)"} ไม่มีเนื้อหา`);
    if (s.ind && cnt(s.ind) > 0 && !body.some(x => x.l.trim().startsWith("?? ")) ) warn(f, `${s.ind}: ออกสอบ ${cnt(s.ind)} ข้อ แต่ไม่มีกล่อง ??`);
  }
  // ไม่คัดลอกโจทย์
  const all = secs.flatMap(s => s.body.map(x => x.l)).join("\n");
  for (const q of qs.filter(q => q.lv === lvFile && q.std === std)) { const c = copied(all, q.text); if (c) warn(f, `ซ้ำโจทย์ ${q.y} ข้อ ${q.no} (${c.length} ตัวอักษร): "${c.slice(0, 40)}…"`); }
  console.log(`${errs ? "✗" : "✓"} ${name}: ${secs.length} หัวข้อ · ex ${nEx} · ?? ${nTip} · ภาพ ${nFig} · ${all.length} ตัวอักษร`);
}
console.log(errs ? `พบข้อผิดพลาด ${errs} รายการ` : "ผ่านทั้งหมด", warns ? `· คำเตือน ${warns}` : "");
process.exit(errs ? 1 : 0);
