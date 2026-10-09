// ตรวจก่อนขึ้น GitHub: ไม่มี PDF ต้นฉบับ/PDF ตรวจทาน node_modules ข้อมูลนักเรียน รหัสผ่าน/คีย์ ไฟล์ใหญ่เกิน 90 MB ทั้งในไฟล์ปัจจุบันและทุก commit
//   node tools/predeploy-check.mjs [โฟลเดอร์ repo ที่จะ push]     ค่าเริ่มต้น C:\Users\<ชื่อ>\onet-science-deploy
// exit 0 = ผ่าน · exit 1 = พบปัญหา (ห้าม push)
import git from "isomorphic-git";
import fs from "fs";
import os from "os";
import path from "path";

const dir = path.resolve(process.argv[2] || path.join(os.homedir(), "onet-science-deploy"));
if (!fs.existsSync(path.join(dir, ".git"))) { console.error("ไม่พบ repo ที่ " + dir); process.exit(1); }
const problems = [];
const bad = (m) => problems.push(m);
const FORBID = [[/\.pdf$/i, "ไฟล์ PDF"], [/(^|\/)node_modules\//, "node_modules"], [/(^|\/)admin\.json$/, "admin.json (มีรหัสผ่านชุดทดสอบ)"], [/(^|\/)\.env(\.|$)/, "ไฟล์ .env"],
  [/^tools\/\.cache\//, "tools/.cache"], [/^import-bundles\//, "import-bundles"], [/(^|\/)(students?|นักเรียน|roster)[^/]*\.(csv|tsv|xlsx?|json|txt)$/i, "ไฟล์รายชื่อนักเรียน"], [/\.(xlsx?|docx?|zip|7z|rar)$/i, "ไฟล์เอกสาร/บีบอัด"]];
const SECRET = [[/AKIA[0-9A-Z]{16}/, "AWS key"], [/ghp_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|gho_[A-Za-z0-9]{30,}/, "GitHub token"], [/AIza[0-9A-Za-z_-]{35}/, "Google API key"],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, "private key"], [/(password|passwd|pwd|รหัสผ่าน)["']?\s*[:=]\s*["'][^"'\s]{4,}["']/i, "รหัสผ่านที่เขียนไว้ในโค้ด"], [/xox[baprs]-[0-9A-Za-z-]{10,}/, "Slack token"]];
const TEXT = /\.(mjs|js|gs|json|md|html|css|tsv|txt|ps1|yml|yaml|gitignore)$/i;
const SKIP_SCAN = [/^tools\/test\//, /^tools\/package-lock\.json$/, /^DEPLOY\.md$/]; // ชุดทดสอบใช้รหัสผ่านสมมติ · DEPLOY.md มีตัวอย่างคำสั่ง

// 1) ทุก commit: ชื่อไฟล์ต้องห้าม + ไฟล์ใหญ่ (ดูจากขนาด blob)
const commits = await git.log({ fs, dir, ref: "main" });
const seen = new Set(); let maxBlob = 0, maxName = "";
for (const c of commits) {
  await git.walk({ fs, dir, trees: [git.TREE({ ref: c.oid })], map: async (p, [e]) => {
    if (!e || (await e.type()) !== "blob") return;
    const oid = await e.oid(); if (seen.has(p + oid)) return; seen.add(p + oid);
    for (const [re, why] of FORBID) if (re.test(p)) bad(`commit ${c.oid.slice(0, 7)}: ${p} — ${why}`);
    const sz = (await e.content())?.length || 0; if (sz > maxBlob) { maxBlob = sz; maxName = p; }
    if (sz > 90e6) bad(`commit ${c.oid.slice(0, 7)}: ${p} ใหญ่ ${(sz / 1e6).toFixed(0)} MB เกินที่ GitHub รับ`);
  } });
}
// 2) ไฟล์ปัจจุบันทั้งหมดที่ checkout อยู่ (รวมไฟล์ที่ยังไม่ได้ commit): ชื่อต้องห้าม + ข้อความลับ
let n = 0;
const walk = d => { for (const e of fs.readdirSync(d, { withFileTypes: true })) {
  if (e.name === ".git") continue;
  const p = path.join(d, e.name), rel = path.relative(dir, p).replace(/\\/g, "/");
  if (e.isDirectory()) { walk(p); continue; }
  n++;
  for (const [re, why] of FORBID) if (re.test(rel)) bad(`ไฟล์ปัจจุบัน: ${rel} — ${why}`);
  if (fs.statSync(p).size > 90e6) bad(`ไฟล์ปัจจุบัน: ${rel} ใหญ่เกิน 90 MB`);
  if (TEXT.test(rel) && !SKIP_SCAN.some(r => r.test(rel)) && fs.statSync(p).size < 5e6) {
    const t = fs.readFileSync(p, "utf8");
    for (const [re, why] of SECRET) { const m = t.match(re); if (m) bad(`${rel}: พบ ${why} → "${m[0].slice(0, 50)}"`); }
  }
} };
walk(dir);
// 3) .gitignore ต้องกันของพวกนี้ไว้
const gi = fs.existsSync(path.join(dir, ".gitignore")) ? fs.readFileSync(path.join(dir, ".gitignore"), "utf8") : "";
for (const need of ["node_modules/", "source/*.pdf", "review/*.pdf", "import-bundles/", "tools/.cache/"]) if (!gi.includes(need)) bad(`.gitignore ขาด ${need}`);

console.log(`ตรวจ ${commits.length} commit · ไฟล์ปัจจุบัน ${n} ไฟล์ · blob ใหญ่สุด ${(maxBlob / 1e6).toFixed(1)} MB (${maxName})`);
if (problems.length) { console.log("✗ พบปัญหา " + problems.length + " จุด — ห้าม push:\n" + problems.slice(0, 40).map(x => " - " + x).join("\n")); process.exit(1); }
console.log("✓ ผ่าน: ไม่มี PDF, node_modules, ข้อมูลนักเรียน, รหัสผ่าน/คีย์ หรือไฟล์ใหญ่เกินกำหนด");
