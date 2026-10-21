// ตรวจคุณภาพสรุป: บรรทัดกล่องที่สั้นผิดปกติ/ขาดท่อน/ลงท้ายด้วย ·
import fs from "fs";
const out = [];
for (const f of fs.readdirSync("data/summaries").filter(x => x.endsWith(".txt"))) {
  const L = fs.readFileSync("data/summaries/" + f, "utf8").split("\n");
  L.forEach((l, i) => {
    const m = /^(\?\?|!!|tr:|kc:|ex:|th:|an:|•) (.*)$/.exec(l.trim()); if (!m) return;
    const t = m[2].replace(/\*\*/g, "").trim(), why = [];
    if (/[·,]$/.test(t)) why.push("ลงท้าย ·");
    if (/^[·,]/.test(t)) why.push("ขึ้นต้น ·");
    if (t.length < 14) why.push("สั้น " + t.length);
    if (why.length) out.push(`${f}:${i + 1} [${why.join(",")}] ${l.trim()}`);
  });
}
console.log(out.length); console.log(out.join("\n"));
