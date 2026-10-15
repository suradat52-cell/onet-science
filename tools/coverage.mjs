// ตารางตรวจความครอบคลุมรายข้อของสรุปเนื้อหา : node tools/coverage.mjs P6-2.1 [M3-2.3 ...]
// อ่าน data/summaries/coverage-<ชื่อ>.tsv แล้วตรวจอัตโนมัติว่า (1) ทุกข้อของมาตรฐานนั้นในคลังอยู่ในตาราง (2) หัวข้อที่อ้างมีอยู่จริงในไฟล์สรุป
// และอยู่ใต้ตัวชี้วัดเดียวกัน แล้วเขียน data/summaries/COVERAGE-<ชื่อ>.md + tools/.cache/summary/COVERAGE-<ชื่อ>.pdf
import fs from "fs";
import path from "path";
import puppeteer from "puppeteer-core";
import { at, TOOLS, BLOCK_REAL_API } from "./lib.mjs";

const names = process.argv.slice(2);
const EDGE = ["C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "C:/Program Files/Microsoft/Edge/Application/msedge.exe", "C:/Program Files/Google/Chrome/Application/chrome.exe"].find(f => fs.existsSync(f));
const esc = s => String(s).replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
let bad = 0;
for (const name of names) {
  const [lv, std1] = name.split("-"), std = "ว " + std1;
  const rows = fs.readFileSync(at("data", "summaries", `coverage-${name}.tsv`), "utf8").trim().split("\n").slice(1).map(l => l.split("\t"));
  const txt = fs.readFileSync(at("data", "summaries", `${name}.txt`), "utf8");
  const secs = txt.split(/^@@\s/m).slice(1).map(b => { const [head, ...body] = b.split("\n"); return { ind: head.split("|")[2].trim(), body: body.join("\n") }; });
  const have = new Set(rows.map(r => `${r[0]}|${r[1]}`));
  const qs = [];
  for (const f of fs.readdirSync(at("data")).filter(f => new RegExp(`^questions-${lv}-\\d{4}\\.tsv$`).test(f))) for (const l of fs.readFileSync(at("data", f), "utf8").trim().split("\n")) { const c = l.split("\t"); if (c[3] === std && c[4]) qs.push(c); }
  const miss = qs.filter(c => !have.has(`${c[1]}|${c[2]}`));
  if (miss.length) { bad++; console.log(`✗ ${name}: ข้อที่ไม่อยู่ในตาราง: ${miss.map(c => c[1] + "/" + c[2]).join(", ")}`); }
  const extra = rows.filter(r => !qs.some(c => c[1] === r[0] && c[2] === r[1]));
  if (extra.length) { bad++; console.log(`✗ ${name}: แถวที่ไม่มีข้อสอบจริง: ${extra.map(r => r[0] + "/" + r[1]).join(", ")}`); }
  for (const r of rows) {
    const sec = secs.find(s => s.ind === r[2]);
    if (!sec) { bad++; console.log(`✗ ${name}: ${r[0]}/${r[1]} ไม่มีหัวข้อตัวชี้วัด ${r[2]}`); continue; }
    if (!sec.body.includes(r[4])) { bad++; console.log(`✗ ${name}: ${r[0]}/${r[1]} หัวข้อ "${r[4]}" ไม่อยู่ใต้ ${r[2]}`); }
    const q = qs.find(c => c[1] === r[0] && c[2] === r[1]); if (q && q[4] !== r[2]) { bad++; console.log(`✗ ${name}: ${r[0]}/${r[1]} ตัวชี้วัดในตาราง ${r[2]} ไม่ตรงข้อสอบ ${q[4]}`); }
  }
  const ok = rows.filter(r => r[5] === "ครอบคลุม").length, notOk = rows.filter(r => r[5] !== "ครอบคลุม");
  const md = [`# ตารางตรวจความครอบคลุม ${lv === "P6" ? "ป.6" : "ม.3"} ${std}`, "", `ข้อสอบจริงในคลัง ${rows.length} ข้อ · ครอบคลุม ${ok} ข้อ · ยังไม่ครอบคลุม ${notOk.length} ข้อ`, "", "| ปี | ข้อ | ตัวชี้วัด | ความรู้/ทักษะที่ข้อสอบต้องใช้ | หัวข้อในสรุป | ผล |", "|---|---|---|---|---|---|", ...rows.map(r => `| ${r.join(" | ")} |`), ""];
  if (notOk.length) md.push("## ข้อที่ยังไม่ครอบคลุม", "", ...notOk.map(r => `- ${r[0]} ข้อ ${r[1]} (${r[2]}): ${r[3]} — ${r[5]}`), "");
  fs.writeFileSync(at("data", "summaries", `COVERAGE-${name}.md`), md.join("\n"), "utf8");
  const html = `<!doctype html><meta charset="utf-8"><style>body{font:13px Sarabun,Tahoma,sans-serif;margin:0}h1{font-size:17px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #999;padding:4px 6px;vertical-align:top}th{background:#eee}tr{break-inside:avoid}.ok{color:#15803d;font-weight:700}.no{color:#b91c1c;font-weight:700}</style><h1>ตารางตรวจความครอบคลุม ${lv === "P6" ? "ป.6" : "ม.3"} ${esc(std)}</h1><p>ข้อสอบจริงในคลัง ${rows.length} ข้อ · ครอบคลุม ${ok} ข้อ · ยังไม่ครอบคลุม ${notOk.length} ข้อ</p><table><tr>${["ปี", "ข้อ", "ตัวชี้วัด", "ความรู้/ทักษะที่ข้อสอบต้องใช้", "หัวข้อในสรุป", "ผล"].map(h => `<th>${h}</th>`).join("")}</tr>${rows.map(r => `<tr>${r.map((c, i) => `<td${i === 5 ? ` class="${c === "ครอบคลุม" ? "ok" : "no"}"` : ""}>${esc(c)}</td>`).join("")}</tr>`).join("")}</table>`;
  const b = await puppeteer.launch({ executablePath: EDGE, headless: true, args: BLOCK_REAL_API }), p = await b.newPage();
  await p.setContent(html); fs.mkdirSync(path.join(TOOLS, ".cache", "summary"), { recursive: true });
  const out = path.join(TOOLS, ".cache", "summary", `COVERAGE-${name}.pdf`);
  await p.pdf({ path: out, format: "A4", landscape: true, margin: { top: "10mm", bottom: "10mm", left: "10mm", right: "10mm" }, printBackground: true }); await b.close();
  console.log(`✓ ${name}: ${rows.length} ข้อ ครอบคลุม ${ok} · ไม่ครอบคลุม ${notOk.length} → data/summaries/COVERAGE-${name}.md, ${out}`);
}
process.exit(bad ? 1 : 0);
