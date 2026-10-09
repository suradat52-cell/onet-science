// สร้างสำเนา repo สำหรับขึ้น GitHub: ย้ายประวัติ commit เดิมทุกอัน (ข้อความ ผู้เขียน เวลาเดิม) แต่ตัดไฟล์ที่ไม่ควรขึ้นออกจากทุก commit
//   node tools/export-repo.mjs [โฟลเดอร์ปลายทาง]      ค่าเริ่มต้น C:\Users\<ชื่อ>\onet-science-deploy
// ตัดออก: ไฟล์ .pdf ทั้งหมด (PDF ต้นฉบับ สทศ. + PDF ตรวจทาน ~300 MB), node_modules, tools/.cache, import-bundles, admin.json, .env
// เหตุผล: .git ในโฟลเดอร์งานหนัก ~540 MB เพราะ PDF ตรวจทานถูก commit ไว้หลายรอบ ถ้า push ทั้งหมดจะช้า/ล้มเหลวและเปิดข้อสอบเต็มชุดให้คนทั่วไปโหลด
import git from "isomorphic-git";
import fs from "fs";
import os from "os";
import path from "path";
import { ROOT } from "./lib.mjs";

const dst = path.resolve(process.argv[2] || path.join(os.homedir(), "onet-science-deploy"));
if (fs.existsSync(dst) && fs.readdirSync(dst).length) { console.error("โฟลเดอร์ปลายทางไม่ว่าง: " + dst + "\nลบหรือเปลี่ยนชื่อก่อน (สำเนานี้สร้างใหม่ได้เสมอ)"); process.exit(1); }
fs.mkdirSync(dst, { recursive: true });
const EXCL = [/\.pdf$/i, /(^|\/)node_modules\//, /^tools\/\.cache\//, /^import-bundles\//, /(^|\/)admin\.json$/, /(^|\/)\.env(\.|$)/];
const skip = p => EXCL.some(r => r.test(p));

await git.init({ fs, dir: dst, defaultBranch: "main" });
const commits = (await git.log({ fs, dir: ROOT, ref: "main" })).reverse();
const copied = new Set();
let prev = null, nSkipFiles = 0;
for (const c of commits) {
  const files = await git.walk({ fs, dir: ROOT, trees: [git.TREE({ ref: c.oid })], map: async (p, [e]) => (e && (await e.type()) === "blob" ? { p, oid: await e.oid(), mode: await e.mode() } : undefined) });
  const root = { dirs: {}, files: [] };
  for (const f of files.flat()) {
    if (skip(f.p)) { nSkipFiles++; continue; }
    if (!copied.has(f.oid)) { const { blob } = await git.readBlob({ fs, dir: ROOT, oid: f.oid }); await git.writeBlob({ fs, dir: dst, blob }); copied.add(f.oid); }
    const parts = f.p.split("/"); let n = root;
    for (const d of parts.slice(0, -1)) n = n.dirs[d] = n.dirs[d] || { dirs: {}, files: [] };
    n.files.push({ mode: f.mode.toString(8).padStart(6, "0"), path: parts.at(-1), oid: f.oid, type: "blob" });
  }
  const write = async n => {
    const entries = [...n.files];
    for (const [name, sub] of Object.entries(n.dirs)) entries.push({ mode: "040000", path: name, oid: await write(sub), type: "tree" });
    entries.sort((a, b) => ((a.type === "tree" ? a.path + "/" : a.path) < (b.type === "tree" ? b.path + "/" : b.path) ? -1 : 1));
    return git.writeTree({ fs, dir: dst, tree: entries });
  };
  const tree = await write(root);
  prev = await git.writeCommit({ fs, dir: dst, commit: { message: c.commit.message, tree, parent: prev ? [prev] : [], author: c.commit.author, committer: c.commit.committer } });
}
await git.writeRef({ fs, dir: dst, ref: "refs/heads/main", value: prev, force: true });
await git.checkout({ fs, dir: dst, ref: "main", force: true });
let size = 0, n = 0; const walk = d => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { if (e.name === ".git") continue; const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else { n++; size += fs.statSync(p).size; } } };
walk(dst);
console.log(`ย้ายประวัติ ${commits.length} commit ไปที่ ${dst}\nไฟล์ที่ใช้งาน ${n} ไฟล์ ${(size / 1e6).toFixed(0)} MB · ไฟล์ที่ตัดออกจากประวัติ (นับซ้ำทุก commit) ${nSkipFiles}\nขั้นต่อไป: node tools/predeploy-check.mjs "${dst}"`);
