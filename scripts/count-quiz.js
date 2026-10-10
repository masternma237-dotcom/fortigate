/* Compte précis des questions par section (lignes à exactement 6 espaces + [") */
"use strict";
const fs = require("fs");
const path = require("path");
const DATA = path.join(__dirname, "..", "download", "fortigate-guide", "data");
let grandTotal = 0, under5 = 0;
for (const f of ["quiz-core.js", "quiz-security.js", "quiz-exploitation.js", "quiz-vpn.js"]) {
  const src = fs.readFileSync(path.join(DATA, f), "utf8");
  const blocks = src.split(/^ {4}"([\w-]+)": \[$/m);
  console.log(`=== ${f} ===`);
  let fileTotal = 0;
  for (let i = 1; i < blocks.length; i += 2) {
    const slug = blocks[i];
    const body = blocks[i + 1] || "";
    // Une question = ligne commençant par 6 espaces puis ["
    const n = (body.match(/^ {6}\["/gm) || []).length;
    fileTotal += n;
    const flag = n < 5 ? "  <-- À COMPLÉTER" : "";
    if (n < 5) under5++;
    console.log(`  ${slug}: ${n} questions${flag}`);
  }
  grandTotal += fileTotal;
  console.log(`  TOTAL ${f}: ${fileTotal}`);
}
console.log(`\nGRAND TOTAL: ${grandTotal} questions | sections < 5 : ${under5}`);
