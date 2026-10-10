#!/usr/bin/env node
/* ============================================================
   tools/validate.js — Validation des données du guide
   Usage : node tools/validate.js
   Vérifie : IDs, tracks, niveaux, prérequis (existants + antérieurs),
   diagrammes, terminologie ↔ glossaire, quiz ≥ 5 questions/section,
   placeholders interdits, complétude des sections.
   ============================================================ */
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const errors = [];
const warnings = [];

/* ---------- Chargement du contexte navigateur simulé ---------- */
const registry = require(path.join(ROOT, "js", "registry.js"));
const diagramHelpers = require(path.join(ROOT, "js", "diagrams.js"));

const sandbox = {
  FG: registry,
  module: undefined,
  console: console,
  svgBox: diagramHelpers.svgBox,
  svgArrow: diagramHelpers.svgArrow,
  svgArrowRed: diagramHelpers.svgArrowRed,
  svgLine: diagramHelpers.svgLine,
  svgWrap: diagramHelpers.svgWrap,
  self: undefined,
  window: undefined
};
vm.createContext(sandbox);

const DATA_FILES = [
  "data/core.js",
  "data/securite-1.js", "data/securite-2.js",
  "data/services-1.js", "data/services-2.js",
  "data/interconnexion-1.js", "data/interconnexion-2.js",
  "data/exploitation-1.js", "data/exploitation-2.js",
  "data/labs.js",
  "data/glossary-core.js", "data/glossary-security.js",
  "data/glossary-vpn.js", "data/glossary-exploitation.js",
  "data/diagrams-core.js", "data/diagrams-security.js",
  "data/diagrams-services.js", "data/diagrams-vpn.js",
  "data/diagrams-exploitation.js",
  "data/quiz-core.js", "data/quiz-security.js",
  "data/quiz-vpn.js", "data/quiz-exploitation.js"
];

for (const file of DATA_FILES) {
  const code = fs.readFileSync(path.join(ROOT, file), "utf8");
  try {
    vm.runInContext(code, sandbox, { filename: file });
  } catch (e) {
    errors.push("Erreur d'exécution dans " + file + " : " + e.message);
  }
}

const FG = registry;

/* ---------- Chargement de l'outil interactif (rendu navigateur simulé) ---------- */
const cliGenerator = require(path.join(ROOT, "js", "tools", "cli-generator.js"));
FG.addTool("cli-generator", {
  title: "Générateur de configuration FortiGate",
  icon: "fa-solid fa-terminal",
  render: function () { /* rendu navigateur uniquement */ }
});

/* ---------- 1. Comptes de base ---------- */
const sectionCount = FG.sections.length;
const termCount = Object.keys(FG.glossary).length;
const diagramCount = Object.keys(FG.diagrams).length;
const questionCount = FG.countQuizQuestions();

if (sectionCount < 40) warnings.push("Seulement " + sectionCount + " sections (attendu ~40).");
if (termCount < 150) warnings.push("Seulement " + termCount + " termes de glossaire (attendu ~150).");
if (diagramCount < 30) warnings.push("Seulement " + diagramCount + " diagrammes (attendu ~30).");
if (questionCount < 200) warnings.push("Seulement " + questionCount + " questions de quiz (attendu ~200, 5 par section).");

/* ---------- 2. Tracks ---------- */
Object.keys(FG.tracks).forEach((tid) => {
  const t = FG.tracks[tid];
  ["name", "icon", "color", "description"].forEach((field) => {
    if (!t[field]) errors.push("Track '" + tid + "' : champ manquant '" + field + "'.");
  });
});

/* ---------- 3. Sections ---------- */
const PLACEHOLDER_RE = /\{\{|\}\}|TODO|FIXME|XXX|\[?\[PLACEHOLDER\]\]?/i;
const seenSteps = new Map();

FG.sections.forEach((s, idx) => {
  const where = "Section '" + (s.id || "??") + "'";

  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(s.id || "")) {
    errors.push(where + " : identifiant non kebab-case.");
  }
  if (seenSteps.has(s.step)) {
    errors.push(where + " : étape " + s.step + " déjà utilisée par '" + seenSteps.get(s.step) + "'.");
  }
  seenSteps.set(s.step, s.id);

  ["title", "description", "icon", "step", "track", "level"].forEach((field) => {
    if (!s[field]) errors.push(where + " : champ requis manquant '" + field + "'.");
  });

  if (!FG.tracks[s.track]) {
    errors.push(where + " : track inconnue '" + s.track + "'.");
  }
  if (!FG.levels.includes(s.level)) {
    errors.push(where + " : niveau inconnu '" + s.level + "'.");
  }

  /* Prérequis : existants ET antérieurs dans l'ordre d'affichage */
  (s.requires || []).forEach((reqId) => {
    const reqIdx = FG.indexOfSection(reqId);
    if (reqIdx === -1) {
      errors.push(where + " : prérequis inexistant '" + reqId + "'.");
    } else if (reqIdx >= idx) {
      errors.push(where + " : prérequis '" + reqId + "' n'est pas antérieur (ordre des étapes).");
    }
  });

  /* Diagrammes référencés */
  if (s.diagram && !FG.diagrams[s.diagram]) {
    errors.push(where + " : diagramme manquant '" + s.diagram + "'.");
  }

  /* Terminologie ↔ glossaire */
  (s.terminology || []).forEach((term) => {
    if (!FG.glossary[term]) {
      errors.push(where + " : terme '" + term + "' absent du glossaire.");
    }
  });

  /* Outil référencé */
  if (s.tool && !FG.tools[s.tool]) {
    errors.push(where + " : outil non enregistré '" + s.tool + "'.");
  }

  /* Placeholders interdits dans les textes rendus */
  const texts = [s.title, s.description]
    .concat((s.subsections || []).map((x) => x.title + " " + x.content))
    .concat((s.concepts || []).map((c) => c.term + " " + c.def))
    .concat((s.alerts || []).map((a) => a.text));
  texts.forEach((t) => {
    if (typeof t === "string" && PLACEHOLDER_RE.test(t)) {
      errors.push(where + " : placeholder détecté dans un texte : " + t.slice(0, 60));
    }
  });

  /* Tableau cohérent */
  if (s.table) {
    if (!Array.isArray(s.table.headers) || !Array.isArray(s.table.rows)) {
      errors.push(where + " : table mal formée.");
    } else {
      s.table.rows.forEach((row, i) => {
        if (row.length !== s.table.headers.length) {
          warnings.push(where + " : ligne " + i + " du tableau a " + row.length +
            " cellules pour " + s.table.headers.length + " en-têtes.");
        }
      });
    }
  }

  /* Checklist cohérente */
  if (s.checklist && (!Array.isArray(s.checklist) || s.checklist.length < 3)) {
    warnings.push(where + " : checklist absente ou trop courte pour un lab.");
  }
});

/* ---------- 4. Quiz ---------- */
Object.keys(FG.quiz).forEach((sid) => {
  const qs = FG.quiz[sid];
  if (!FG.getSection(sid)) {
    errors.push("Quiz : section inconnue '" + sid + "'.");
  }
  if (qs.length < 5) {
    errors.push("Quiz '" + sid + "' : moins de 5 questions (" + qs.length + ").");
  }
  qs.forEach((q, i) => {
    if (typeof q[0] !== "string" || !q[0].trim()) {
      errors.push("Quiz '" + sid + "' Q" + (i + 1) + " : énoncé vide.");
    }
    if (!Array.isArray(q[1]) || q[1].length < 2) {
      errors.push("Quiz '" + sid + "' Q" + (i + 1) + " : options insuffisantes.");
    }
    if (typeof q[2] !== "number" || q[2] < 0 || q[2] >= q[1].length) {
      errors.push("Quiz '" + sid + "' Q" + (i + 1) + " : index de réponse invalide.");
    }
    if (typeof q[3] !== "string" || q[3].trim().length < 10) {
      warnings.push("Quiz '" + sid + "' Q" + (i + 1) + " : explication absente ou trop courte.");
    }
    const opts = q[1].map(String);
    if (new Set(opts).size !== opts.length) {
      errors.push("Quiz '" + sid + "' Q" + (i + 1) + " : options dupliquées.");
    }
  });
});

/* Sections sans quiz (sauf transversales tolérées en avertissement) */
FG.sections.forEach((s) => {
  if (!FG.quiz[s.id]) {
    warnings.push("Section '" + s.id + "' : pas de quiz associé.");
  }
});

/* ---------- 5. Glossaire : définitions --- ---------- */
Object.keys(FG.glossary).forEach((term) => {
  const def = FG.glossary[term];
  if (typeof def !== "string" || def.trim().length < 15) {
    warnings.push("Glossaire : définition trop courte pour '" + term + "'.");
  }
});

/* ---------- Rapport ---------- */
console.log("==============================================================");
console.log(" VALIDATION DU GUIDE FORTIGATE (CFP-CMD / MASTER NMA)");
console.log("==============================================================");
console.log("Tracks          : " + Object.keys(FG.tracks).length);
console.log("Sections        : " + sectionCount);
console.log("Termes glossaire: " + termCount);
console.log("Diagrammes      : " + diagramCount);
console.log("Questions quiz  : " + questionCount + " réparties sur " + Object.keys(FG.quiz).length + " sections");
console.log("Outils          : " + Object.keys(FG.tools).join(", "));
console.log("--------------------------------------------------------------");

if (warnings.length) {
  console.log("AVERTISSEMENTS (" + warnings.length + ") :");
  warnings.forEach((w) => console.log("  ⚠ " + w));
}
if (errors.length) {
  console.log("ERREURS (" + errors.length + ") :");
  errors.forEach((e) => console.log("  ✗ " + e));
  process.exit(1);
} else {
  console.log("✓ Validation réussie : aucune erreur bloquante.");
}
