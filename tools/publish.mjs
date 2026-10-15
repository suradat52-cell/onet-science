// ขึ้นเว็บ GitHub Pages ทุกครั้ง: คัดลอกไฟล์ที่เว็บต้องใช้จากโฟลเดอร์งานไปโฟลเดอร์ deploy → predeploy-check → commit → push → รอ Pages build
//   node tools/publish.mjs ["ข้อความ commit"] [--dir=โฟลเดอร์ deploy] [--dry]
//   ค่าเริ่มต้นโฟลเดอร์ deploy = C:\Users\<ชื่อ>\onet-science-deploy (ต้องเป็น repo ที่ผูก origin ไว้แล้ว)
//   --dry = คัดลอกและตรวจเท่านั้น ไม่ commit/push
// ไฟล์ที่ขึ้น = ไฟล์ที่ git ของโฟลเดอร์งานเห็น (ติดตาม + ใหม่ที่ยังไม่ commit) ตาม .gitignore ตัด .pdf ออกอีกชั้น
// ประวัติ commit ของโฟลเดอร์งานไม่ถูกแตะ · ถ้า predeploy-check ไม่ผ่านจะไม่ commit/push
import { spawnSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { ROOT } from "./lib.mjs";
import { buildContent } from "./build-content.mjs";

const args = process.argv.slice(2);
const flag = n => args.find(a => a.startsWith("--" + n + "="))?.slice(n.length + 3);
const dry = args.includes("--dry");
const msgArg = args.find(a => !a.startsWith("--"));
const dst = path.resolve(flag("dir") || path.join(os.homedir(), "onet-science-deploy"));
const REPO = "suradat52-cell/onet-science";
const SITE = "https://suradat52-cell.github.io/onet-science/";

const extra = ["C:\\Program Files\\Git\\cmd", "C:\\Program Files\\GitHub CLI"].filter(p => fs.existsSync(p));
const env = { ...process.env, PATH: [process.env.PATH, ...extra].join(path.delimiter) };
const run = (cmd, a, cwd, { quiet = false } = {}) => {
  const r = spawnSync(cmd, a, { cwd, env, encoding: "utf8", maxBuffer: 1 << 28 });
  if (r.error) die(`รัน ${cmd} ไม่ได้: ${r.error.message}`);
  if (!quiet && r.status) process.stderr.write(r.stderr || "");
  return r;
};
const git = (a, cwd = dst) => run("git", a, cwd);
const die = m => { console.error("✗ " + m); process.exit(1); };
const sleep = ms => new Promise(r => setTimeout(r, ms));

if (!fs.existsSync(path.join(dst, ".git"))) die("ไม่พบ repo ที่ " + dst + " (สร้างตาม DEPLOY.md ก่อน)");
if (!git(["remote", "get-url", "origin"]).stdout.includes(REPO)) die("origin ของโฟลเดอร์ deploy ไม่ใช่ " + REPO);
if (git(["rev-parse", "--abbrev-ref", "HEAD"]).stdout.trim() !== "main") die("โฟลเดอร์ deploy ต้องอยู่กิ่ง main");

// 0) สร้างไฟล์เนื้อหา JSON (content/) จาก data/ ทุกครั้ง — หน้าเว็บโหลดเนื้อหาจากที่นี่ ไม่ใช่จากชีต
const bc = buildContent();
console.log(`สร้าง content/ แล้ว: ${bc.nFiles} ไฟล์ · ${(bc.bytes / 1e6).toFixed(2)} MB · rev ${bc.rev}`);

// 1) รายการไฟล์ที่ขึ้น
const ls = run("git", ["ls-files", "-z", "--cached", "--others", "--exclude-standard"], ROOT);
if (ls.status) die("อ่านรายการไฟล์จากโฟลเดอร์งานไม่ได้");
const files = new Set(ls.stdout.split("\0").filter(f => f && !/\.pdf$/i.test(f) && fs.existsSync(path.join(ROOT, f))));
const walkC = (rel) => { for (const e of fs.readdirSync(path.join(ROOT, rel), { withFileTypes: true })) { const r2 = rel + "/" + e.name; e.isDirectory() ? walkC(r2) : files.add(r2); } };
walkC("content"); // content/ ไม่อยู่ใน git ของโฟลเดอร์งาน (สร้างใหม่ได้) แต่ต้องขึ้นเว็บ

// 2) คัดลอกเฉพาะไฟล์ที่เปลี่ยน + ลบไฟล์ที่ไม่อยู่ในรายการแล้ว
let copied = 0, removed = 0;
for (const f of files) {
  const s = path.join(ROOT, f), d = path.join(dst, f);
  const sb = fs.readFileSync(s);
  if (fs.existsSync(d) && fs.readFileSync(d).equals(sb)) continue;
  fs.mkdirSync(path.dirname(d), { recursive: true });
  fs.writeFileSync(d, sb); copied++;
}
const walk = (d, base = "") => { for (const e of fs.readdirSync(d, { withFileTypes: true })) {
  if (e.name === ".git") continue;
  const rel = base ? base + "/" + e.name : e.name;
  if (e.isDirectory()) walk(path.join(d, e.name), rel);
  else if (!files.has(rel)) { fs.unlinkSync(path.join(d, e.name)); removed++; }
} };
walk(dst);
console.log(`คัดลอก ${copied} ไฟล์ · ลบ ${removed} ไฟล์ที่ไม่ใช้แล้ว · ไฟล์ทั้งหมดที่ขึ้น ${files.size}`);

// 3) ตรวจก่อนขึ้น (ตรวจทุก commit และไฟล์ปัจจุบัน) — ไม่ผ่านไม่ commit
const chk = run("node", [path.join(ROOT, "tools", "predeploy-check.mjs"), dst], ROOT, { quiet: true });
process.stdout.write(chk.stdout); process.stderr.write(chk.stderr);
if (chk.status) die("predeploy-check ไม่ผ่าน — ยังไม่ commit/push");

// 4) commit
git(["add", "-A"]);
if (!git(["status", "--porcelain"]).stdout.trim()) { console.log("ไม่มีอะไรเปลี่ยนจาก commit ล่าสุดบน GitHub — ไม่ต้องขึ้นใหม่"); process.exit(0); }
const subject = run("git", ["log", "-1", "--format=%s"], ROOT).stdout.trim();
const msg = msgArg || `อัปเดตเว็บ ${new Date().toISOString().slice(0, 16).replace("T", " ")} · ล่าสุดในโฟลเดอร์งาน: ${subject}`;
if (dry) { console.log("--dry: หยุดก่อน commit/push\n" + git(["status", "--short"]).stdout.split("\n").slice(0, 15).join("\n")); process.exit(0); }
const c = git(["commit", "-q", "-m", msg]); if (c.status) die("commit ไม่สำเร็จ");
const sha = git(["rev-parse", "HEAD"]).stdout.trim();
console.log("commit " + sha.slice(0, 7) + " — " + msg.split("\n")[0]);

// 5) push
const p = git(["push", "origin", "main"]); if (p.status) die("push ไม่สำเร็จ");
console.log("push แล้ว");

// 6) รอ Pages build ของ commit นี้
const t0 = Date.now(); let st = "";
while (Date.now() - t0 < 6 * 60e3) {
  const r = run("gh", ["api", `repos/${REPO}/pages/builds/latest`], dst, { quiet: true });
  let b = {}; try { b = JSON.parse(r.stdout); } catch {}
  const s = b.status, cm = b.commit;
  if (cm === sha && s !== st) { st = s; console.log("Pages: " + s); }
  if (cm === sha && s === "built") break;
  if (cm === sha && s === "errored") die("Pages build ล้มเหลว — ดู https://github.com/" + REPO + "/actions");
  await sleep(8000);
}
if (st !== "built") die("รอ Pages build เกิน 6 นาที — ตรวจ https://github.com/" + REPO + "/actions");
const res = await fetch(SITE + "?v=" + sha.slice(0, 7));
console.log(`✓ เสร็จ: ${SITE} (HTTP ${res.status}) — ถ้าเบราว์เซอร์ยังเห็นของเก่า กด Ctrl+F5`);
process.exitCode = res.ok ? 0 : 1; // ไม่ใช้ process.exit() ตรงนี้: Node บน Windows ฟ้อง Assertion failed หลัง fetch
