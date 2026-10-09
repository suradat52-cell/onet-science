// node bpparse.mjs file.pdf out.json
// Extract standard / indicator / description columns by x-position.
import * as mupdf from "mupdf";
import fs from "fs";
const [, , file, out] = process.argv;
const doc = mupdf.Document.openDocument(fs.readFileSync(file), "application/pdf");
const fix = s => s.replace(/\s+า/g, "ำ").replace(/\((ต่อ|ตอ)\)/g, " ").replace(/จํานวนเวลา.*$/, "").replace(/\s+/g, " ").trim();
// join wrapped lines: keep a space only if the previous line ended with whitespace
const join = (a, b) => /\s$/.test(a) || a === "" ? a + b : (/[฀-๿]$/.test(a) && /^[฀-๿]/.test(b) ? a + b : a + " " + b);
const rows = []; let curStd = null, curInd = null, curStdRow = null;
for (let p = 0; p < doc.countPages(); p++) {
  const j = JSON.parse(doc.loadPage(p).toStructuredText("preserve-whitespace").asJSON());
  const lines = [];
  for (const b of j.blocks) for (const l of b.lines || []) lines.push({ x: l.bbox.x, y: l.bbox.y, w: l.bbox.w, t: l.text });
  const hInd = lines.find(l => /^ตัวชี้วัด\s*$/.test(l.t.trim()) && l.y < 200);
  const hDesc = lines.find(l => /รายละเอียดตัวชี้วัด/.test(l.t) && l.y < 200);
  const hSum = lines.find(l => /^สรุป\s*$/.test(l.t.trim()) && l.y < 200);
  const hStd = lines.find(l => /^มาตรฐาน\s*$/.test(l.t.trim()) && l.y < 200);
  if (!hInd || !hDesc || !hSum) continue;
  const top = Math.max(hInd.y, hDesc.y) + 25;
  const indX0 = hInd.x - 15, descX0 = hInd.x + hInd.w + 3, descX1 = hSum.x - 5;
  const stdX0 = hStd.x - 70, stdX1 = hStd.x + 50;
  const body = lines.filter(l => l.y > top && !/รูปแบบปรนัย|จำนวน \(ข้อ\)/.test(l.t)).sort((a, b) => a.y - b.y || a.x - b.x);
  curStdRow = null; // standard text only continues on the page it starts
  for (const l of body) {
    if (l.x > stdX0 && l.x < stdX1) {
      const m = l.t.match(/^\s*ว\s*(\d\.\d)\s*(.*)$/);
      if (m) { curStd = "ว " + m[1]; curStdRow = { type: "std", standard: curStd, text: m[2], page: p + 1 }; rows.push(curStdRow); curInd = null; }
      else if (curStdRow) curStdRow.text = join(curStdRow.text, l.t);
      continue;
    }
    const m = l.t.match(/^\s*([ปม])\.(\d)\/(\d+)\s*(.*)$/);
    if (m && l.x >= indX0 && l.x < descX0 + 5) {
      curInd = { type: "ind", standard: curStd, indicator: `${m[1]}.${m[2]}/${m[3]}`, text: m[4], page: p + 1 };
      rows.push(curInd);
    } else if (l.x >= descX0 - 2 && l.x < descX1 && curInd) curInd.text = join(curInd.text, l.t);
  }
}
for (const r of rows) r.text = fix(r.text || "");
fs.writeFileSync(out, JSON.stringify(rows, null, 1));
console.log(rows.filter(r => r.type === "std").map(r => r.standard + ":" + rows.filter(x => x.type === "ind" && x.standard === r.standard).length).join("  "));
