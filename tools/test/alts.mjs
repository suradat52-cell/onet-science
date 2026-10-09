// ทดสอบตรรกะเฉลยหลายคำตอบ (a|b) ของ Code.gs โดยตรง: node tools/test/alts.mjs
import fs from "fs";
import vm from "vm";
import { at } from "../lib.mjs";

const ctx = vm.createContext({ SpreadsheetApp: {}, Utilities: {}, console });
vm.runInContext(fs.readFileSync(at("apps-script", "Code.gs"), "utf8") + "\nthis.isRight = isRight; this.earnedOf = earnedOf; this.normAns = normAns;", ctx);
const { isRight, earnedOf, normAns } = ctx;
let bad = 0;
const t = (name, got, want) => { const ok = got === want; if (!ok) bad++; console.log((ok ? "PASS " : "FAIL ") + name + (ok ? "" : `  ได้ ${got} คาด ${want}`)); };

// ปรนัยที่ สทศ. ระบายสองช่อง
t("mc 1|2 ตอบ 1", isRight("mc", "1", "1|2"), true);
t("mc 1|2 ตอบ 2", isRight("mc", "2", "1|2"), true);
t("mc 1|2 ตอบ 3", isRight("mc", "3", "1|2"), false);
t("mc 1|2 ไม่ตอบ", isRight("mc", "", "1|2"), false);
t("mc 1 ตอบ 12 ต้องไม่ผ่าน", isRight("mc", "12", "1|2"), false);
t("mc ช่องเดียวเหมือนเดิม", isRight("mc", "3", "3"), true);
t("mc ช่องเดียวตอบผิด", isRight("mc", "4", "3"), false);
// เชิงซ้อน: ข้อย่อยที่ 2 รับได้ทั้ง ใช่ และ ไม่ใช่
const key = normAns("complex", "ใช่,ใช่|ไม่ใช่,ไม่ใช่");
t("normAns คงเครื่องหมาย |", key, "ใช่,ใช่|ไม่ใช่,ไม่ใช่");
t("complex ตอบ ใช่,ใช่,ไม่ใช่", isRight("complex", "ใช่,ใช่,ไม่ใช่", key), true);
t("complex ตอบ ใช่,ไม่ใช่,ไม่ใช่", isRight("complex", "ใช่,ไม่ใช่,ไม่ใช่", key), true);
t("complex ข้อย่อยอื่นผิด", isRight("complex", "ไม่ใช่,ใช่,ไม่ใช่", key), false);
t("complex เต็ม", earnedOf("P6", "2561", "complex", "ใช่,ไม่ใช่,ไม่ใช่", key, 5), 5);
t("complex ผิด 1 ข้อย่อย ได้ครึ่ง", earnedOf("P6", "2561", "complex", "ใช่,ใช่,ใช่", key, 5), 2.5);
t("complex ผิด 2 ข้อย่อย ได้ 0", earnedOf("P6", "2561", "complex", "ไม่ใช่,ใช่,ใช่", key, 5), 0);
// order ยังเทียบทีละตำแหน่ง
t("order เดิม", isRight("order", "5,6,4", "5,6,4"), true);
t("order ผิด", isRight("order", "6,5,4", "5,6,4"), false);
process.exit(bad ? 1 : 0);
