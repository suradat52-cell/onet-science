// สร้างไฟล์เนื้อหา JSON (ผังข้อสอบ ข้อสอบ เฉลย สรุป) จาก data/ → content/ ให้หน้าเว็บโหลดจาก GitHub Pages โดยตรง
//   node tools/build-content.mjs [โฟลเดอร์ปลายทาง=content]      (tools/publish.mjs เรียกให้อัตโนมัติทุกครั้ง)
// โครงไฟล์:
//   content/manifest.json            { rev, built, files: { "P6/meta.json": "<hash>", ... } }  ← หน้าเว็บโหลดไฟล์นี้ก่อนเสมอ (ตรวจฉบับใหม่ทุกครั้ง)
//   content/<ระดับ>/meta.json        ผัง มาตรฐาน/ตัวชี้วัด จำนวนข้อ รายการข้อของโหมดฝึก/ข้อสอบจำลอง ตารางว่าข้อสอบออกปีไหน สถิติสำหรับหน้าแอดมิน
//   content/<ระดับ>/q-<ปี>.json      โจทย์ของปีนั้น (ไม่มีเฉลย)
//   content/<ระดับ>/k-<ปี>.json      กุญแจเฉลย + คำอธิบายสั้น  ← ไฟล์เดียวที่มีคำตอบ (โหมดสอบของครูในอนาคต: ไม่ให้เครื่องนักเรียนโหลดไฟล์นี้ ดู README.md)
//   content/<ระดับ>/s-<ปี>.json      เฉลยละเอียดรายข้อ
//   content/<ระดับ>/sum-<มาตรฐาน>.json  สรุปเนื้อหาของมาตรฐาน (เช่น sum-1.1.json)
// กติกาการเลือกข้อ/นับ/ติดป้าย ย้ายมาจาก apps-script/Code.gs เดิม (overview, getQuiz, summary) ให้ผลเหมือนเดิมทุกประการ
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath, pathToFileURL } from "url";
import { createRequire } from "module";

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.dirname(HERE);
const G = createRequire(import.meta.url)(path.join(ROOT, "grade.js"));
const LEVELS = ["P6", "M3"];
let maxM = 0; // เวลาแก้ไขล่าสุดของไฟล์ข้อมูลที่ใช้ → ใส่ใน manifest (ไม่ใช้เวลาปัจจุบัน เพื่อให้สร้างซ้ำแล้วไฟล์เหมือนเดิมทุกไบต์ ไม่ publish โดยไม่จำเป็น)
const rd = (...p) => { const f = path.join(ROOT, ...p); maxM = Math.max(maxM, fs.statSync(f).mtimeMs); return fs.readFileSync(f, "utf8").replace(/\r/g, ""); };
const stdKey = s => String(s).replace(/^ว\s*/, "").trim(); // "ว 1.1" → "1.1"
const byYearItem = (a, b) => (+b.examYear - +a.examYear) || (+a.itemNo - +b.itemNo);

export function buildContent(outDir = path.join(ROOT, "content")) {
  maxM = 0;
  fs.rmSync(outDir, { recursive: true, force: true });
  const files = {};
  const put = (rel, obj) => {
    const txt = JSON.stringify(obj);
    fs.mkdirSync(path.dirname(path.join(outDir, rel)), { recursive: true });
    fs.writeFileSync(path.join(outDir, rel), txt);
    files[rel] = crypto.createHash("sha1").update(txt).digest("hex").slice(0, 10);
  };

  // ---- อ่านข้อมูลดิบ ----
  const bp = rd("data", "blueprint.tsv").split("\n").map(l => l.split("\t").map(c => c.trim()))
    .filter(c => LEVELS.includes(c[0]) && c[3])
    .map(c => ({ level: c[0], year: c[1], strand: c[2], standard: c[3], indicator: c[4] || "", description: c[5] || "", items: c[6] || "", format: c[7] || "", points: c[8] || "" }));
  const qAll = [];
  for (const f of fs.readdirSync(path.join(ROOT, "data")).filter(f => /^questions-.*\.tsv$/.test(f)).sort()) {
    for (const l of rd("data", f).split("\n")) {
      const c = l.split("\t");
      if (!LEVELS.includes(c[0]) || !c[5]) continue;
      const q = { level: c[0], examYear: (c[1] || "").trim(), itemNo: (c[2] || "").trim(), standard: (c[3] || "").trim(), indicator: (c[4] || "").trim(), stem: c[5], imageUrl: (c[6] || "").trim(), choices: (c[7] || "").trim(), answer: (c[8] || "").trim(), explanation: c[9] || "", type: (c[10] || "").trim().toLowerCase() };
      q.type = q.type || (q.choices ? "mc" : "fill");
      q.answer = G.normAns(q.type, q.answer);
      qAll.push(q);
    }
  }
  const sums = [];
  const sd = path.join(ROOT, "data", "summaries");
  if (fs.existsSync(sd)) for (const f of fs.readdirSync(sd).filter(f => /^(P6|M3)-.*\.txt$/.test(f)).sort()) {
    let cur = null;
    for (const line of rd("data", "summaries", f).split("\n")) {
      if (/^@@\s/.test(line)) {
        const c = line.slice(2).split("|").map(x => x.trim());
        if (c.length < 4 || !LEVELS.includes(c[0]) || !c[1] || !c[3]) throw new Error(f + ": หัวข้อไม่ถูกต้อง: " + line);
        cur = { level: c[0], standard: c[1], indicator: c[2], title: c.slice(3).join(" | "), lines: [] }; sums.push(cur);
      } else if (cur) cur.lines.push(line.replace(/\t/g, " "));
    }
  }
  sums.forEach(s => { s.content = s.lines.join("\n").replace(/^\n+|\n+$/g, ""); delete s.lines; });
  const sols = [];
  const sld = path.join(ROOT, "data", "solutions");
  if (fs.existsSync(sld)) for (const f of fs.readdirSync(sld).filter(f => /^(P6|M3)-\d{4}\.txt$/.test(f)).sort()) {
    let cur = null;
    for (const line of rd("data", "solutions", f).split("\n")) {
      if (/^@@\s/.test(line)) {
        const c = line.slice(2).split("|").map(x => x.trim());
        if (c.length < 6 || !LEVELS.includes(c[0]) || !/^\d{4}$/.test(c[1]) || !/^\d+$/.test(c[2])) throw new Error(f + ": หัวข้อไม่ถูกต้อง: " + line);
        cur = { level: c[0], examYear: c[1], itemNo: c[2], title: c.slice(5).join(" | "), lines: [] }; sols.push(cur);
      } else if (cur) cur.lines.push(line.replace(/\t/g, " "));
    }
  }
  sols.forEach(s => { s.content = s.lines.join("\n").replace(/^\n+|\n+$/g, ""); delete s.lines; });

  const stats = { bank: [], sol: [], bp: [], sm: [] };
  for (const lv of LEVELS) {
    const bpl = bp.filter(r => r.level === lv);
    const planYear = bpl.reduce((y, r) => (r.year > y ? r.year : y), "");
    const planSet = {}; let planN = 0;
    bpl.forEach(r => { if (r.year === planYear && r.indicator) { planSet[r.standard + "|" + r.indicator] = 1; planN++; } });
    const off = (std, ind) => (planN && ind && !planSet[std + "|" + ind] ? planYear : "");
    const qs = qAll.filter(q => q.level === lv).sort(byYearItem);
    const inCurr = q => !!q.indicator;
    const years = [...new Set(qs.map(q => q.examYear))].sort().reverse();
    const idOf = q => `${lv}-${q.examYear}-${q.itemNo}`;
    const keyOf = q => `${q.examYear}/${q.itemNo}`;

    // ---- ไฟล์รายปี: โจทย์ / กุญแจเฉลย / เฉลยละเอียด ----
    for (const y of years) {
      const yq = qs.filter(q => q.examYear === y).sort((a, b) => +a.itemNo - +b.itemNo);
      put(`${lv}/q-${y}.json`, yq.map(q => {
        const ch = String(q.choices || "").split("||").map(x => x.trim()).filter(String);
        return { id: idOf(q), examYear: q.examYear, itemNo: q.itemNo, standard: q.standard, indicator: q.indicator, stem: q.stem, imageUrl: q.imageUrl, type: q.type, choices: ch, slots: q.type === "order" ? q.answer.split(",").length : 0, points: G.points(lv, q.type), offPlan: off(q.standard, q.indicator), outCurr: inCurr(q) ? "" : "1" };
      }));
      put(`${lv}/k-${y}.json`, Object.fromEntries(yq.map(q => [q.itemNo, { t: q.type, a: q.answer, s: q.standard, e: q.explanation }])));
      const ys = sols.filter(s => s.level === lv && s.examYear === y);
      put(`${lv}/s-${y}.json`, Object.fromEntries(ys.map(s => [s.itemNo, { t: s.title, c: s.content }])));
    }

    // ---- meta: โครงมาตรฐาน (เหมือน overview เดิม) ----
    const m = {};
    const std = s => (m[s] = m[s] || { standard: s, strand: "", description: "", items: 0, bank: 0, ind: {} });
    const ind = (x, i) => (x.ind[i] = x.ind[i] || { indicator: i, description: "", items: 0, bank: 0 });
    bpl.forEach(r => {
      const x = std(r.standard), n = +r.items || 0;
      if (r.strand) x.strand = r.strand;
      x.items += n;
      if (r.indicator) { const i = ind(x, r.indicator); i.description = r.description; i.items += n; } else if (r.description) x.description = r.description;
    });
    const inc = qs.filter(inCurr).filter(q => q.standard);
    inc.forEach(q => { const x = std(q.standard); x.bank++; const i = ind(x, q.indicator); i.bank++; i.offPlan = off(q.standard, q.indicator); });
    const standards = Object.keys(m).sort().map(k => { const x = m[k]; x.ind = Object.keys(x.ind).sort().map(i => x.ind[i]); return x; });

    // ---- รายการข้อของโหมดฝึก (pool) และข้อสอบจำลอง (mock) — ลำดับเดียวกับ getQuiz เดิม ----
    const pool = {};
    const addPool = (k, q) => (pool[k] = pool[k] || []).push(keyOf(q));
    inc.forEach(q => { addPool(q.standard, q); addPool(q.standard + "|" + q.indicator, q); });
    const need = {}; bpl.forEach(r => { need[r.standard] = (need[r.standard] || 0) + (+r.items || 0); });
    const has = Object.keys(need).some(k => need[k] > 0);
    const cnt = {};
    const mock = qs.filter(inCurr).filter(q => { cnt[q.standard] = (cnt[q.standard] || 0) + 1; return cnt[q.standard] <= (has ? (need[q.standard] || 0) : 5); })
      .sort((a, b) => a.standard.localeCompare(b.standard) || (+b.examYear - +a.examYear)).map(keyOf);
    // ---- ตาราง "ข้อสอบจริงที่เคยออกในหัวข้อนี้" ----
    const asked = {};
    inc.forEach(q => { const s = (asked[q.standard] = asked[q.standard] || {}); const i = (s[q.indicator] = s[q.indicator] || {}); i[q.examYear] = (i[q.examYear] || 0) + 1; });
    const bankYears = {}; qs.filter(q => q.standard).forEach(q => { bankYears[q.examYear] = (bankYears[q.examYear] || 0) + 1; });

    // ---- สรุปเนื้อหารายมาตรฐาน + สถิติหน้าแอดมิน ----
    const sl = sums.filter(s => s.level === lv && s.content);
    for (const s of [...new Set(sl.map(x => x.standard))]) put(`${lv}/sum-${stdKey(s)}.json`, sl.filter(x => x.standard === s).map(x => ({ indicator: x.indicator, title: x.title, content: x.content })));
    const smStd = {}; sl.forEach(r => { const o = (smStd[r.standard] = smStd[r.standard] || { level: lv, standard: r.standard, sections: 0, chars: 0 }); o.sections++; o.chars += r.content.length; });
    Object.keys(smStd).sort().forEach(k => stats.sm.push(smStd[k]));
    years.forEach(y => { stats.bank.push({ level: lv, examYear: y, n: qs.filter(q => q.examYear === y).length }); stats.sol.push({ level: lv, examYear: y, n: sols.filter(s => s.level === lv && s.examYear === y).length }); });
    const bpy = {}; bpl.forEach(r => { const o = (bpy[r.year] = bpy[r.year] || { level: lv, year: r.year, standards: 0, indicators: 0, items: 0 }); if (r.indicator) o.indicators++; else o.standards++; o.items += +r.items || 0; });
    Object.keys(bpy).sort().forEach(y => stats.bp.push(bpy[y]));

    put(`${lv}/meta.json`, { level: lv, year: (bpl[0] || {}).year || "", planYear, years, bankYears, standards, pool, mock, asked, summaries: [...new Set(sl.map(x => x.standard))] });
  }
  // admin stats (รวมสองระดับ) เก็บในไฟล์เดียว โหลดเฉพาะหน้าแอดมิน
  put("stats.json", stats);
  const rev = crypto.createHash("sha1").update(JSON.stringify(files)).digest("hex").slice(0, 10);
  const manifest = { rev, built: new Date(maxM).toISOString(), files };
  fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(manifest));
  return { rev, nFiles: Object.keys(files).length + 1, bytes: Object.keys(files).reduce((n, f) => n + fs.statSync(path.join(outDir, f)).size, 0) };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const r = buildContent(process.argv[2] ? path.resolve(process.argv[2]) : undefined);
  console.log(`สร้าง content/ แล้ว: ${r.nFiles} ไฟล์ · ${(r.bytes / 1e6).toFixed(2)} MB · rev ${r.rev}`);
}
