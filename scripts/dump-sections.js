/* Dump les sections cibles pour la rédaction des nouvelles questions de quiz */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const DATA = path.join(__dirname, "..", "download", "fortigate-guide", "data");

const FG = {
  tracks: {}, sections: [], glossary: {}, diagrams: {}, quiz: {}, tools: {},
  addTracks(m) { Object.assign(this.tracks, m); return this; },
  addSections(list) { list.forEach(s => this.sections.push(s)); return this; },
  addGlossary(m) { Object.assign(this.glossary, m); return this; },
  addDiagrams(m) { Object.assign(this.diagrams, m); return this; },
  addQuiz(m) { Object.assign(this.quiz, m); return this; },
  addTool(id, t) { this.tools[id] = t; return this; }
};

const ctx = { FG, module: { exports: {} }, console, require };
vm.createContext(ctx);
["core.js", "securite-1.js", "securite-2.js", "services-1.js", "services-2.js",
 "interconnexion-1.js", "interconnexion-2.js", "exploitation-1.js", "exploitation-2.js",
 "labs.js"].forEach(f => {
  const p = path.join(DATA, f);
  if (fs.existsSync(p)) vm.runInContext(fs.readFileSync(p, "utf8"), ctx, { filename: f });
});

const targets = process.argv.slice(2);
for (const id of targets) {
  const s = FG.sections.find(x => x.id === id);
  if (!s) { console.log(`### ${id} : INTROUVABLE ###`); continue; }
  console.log(`\n########## ${s.id} — ${s.title} (step ${s.step}, ${s.track}) ##########`);
  console.log("DESC:", s.description);
  if (s.cliCommands) console.log("CLI:\n  " + s.cliCommands.join("\n  ").slice(0, 1600));
  if (s.concepts) console.log("CONCEPTS: " + s.concepts.map(c => `${c.term} = ${c.def}`).join(" | "));
  if (s.table) console.log("TABLE: " + s.table.rows.map(r => r.join(" / ")).join(" ; ").slice(0, 900));
  if (s.subsections) s.subsections.forEach(u => console.log(`SUB « ${u.title} »: ${u.content.slice(0, 500)}`));
  if (s.alerts) console.log("ALERTS: " + s.alerts.map(a => a.text).join(" | ").slice(0, 600));
  if (s.checklist) console.log("CHECKLIST: " + s.checklist.join(" | ").slice(0, 500));
  if (s.guiSteps) console.log("GUI: " + s.guiSteps.join(" | ").slice(0, 500));
}
