/* ============================================================
   Guide Interactif FortiGate — CFP-CMD / MASTER NMA
   registry.js — Registre global FG (équivalent Fortinet de MK)
   Chargé en premier. Compatible navigateur + Node (outils).
   ============================================================ */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.FG = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var LEVELS = ["debutant", "intermediaire", "avance", "tous"];

  var FG = {
    version: "1.0.0",

    /** Métadonnées des parcours (tracks) */
    tracks: {},

    /** Niveaux reconnus (ordre pédagogique) */
    levels: LEVELS.slice(),

    /** Sections pédagogiques, triées par étape */
    sections: [],

    /** Glossaire : { terme: définition } */
    glossary: {},

    /** Diagrammes SVG : { id: fonction rendant le HTML } */
    diagrams: {},

    /** Quiz : { sectionId: [ [question, options[], indexCorrect, explication], ... ] } */
    quiz: {},

    /** Outils interactifs enregistrés : { id: {title, icon, render} } */
    tools: {},

    /**
     * Enregistre (ou fusionne) les parcours.
     * @param {Object} tracksMap { id: {name, icon, color, description} }
     */
    addTracks: function (tracksMap) {
      var keys = Object.keys(tracksMap || {});
      for (var i = 0; i < keys.length; i++) {
        var id = keys[i];
        if (!/^[a-z0-9-]+$/.test(id)) {
          throw new Error("[FG] Identifiant de track invalide : " + id);
        }
        FG.tracks[id] = tracksMap[id];
      }
      return FG;
    },

    /**
     * Enregistre une liste de sections.
     * @param {Array} list
     */
    addSections: function (list) {
      var arr = list || [];
      for (var i = 0; i < arr.length; i++) {
        var s = arr[i];
        if (!s || typeof s !== "object") {
          throw new Error("[FG] Section invalide (non-objet)");
        }
        if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(s.id)) {
          throw new Error("[FG] Identifiant de section non kebab-case : " + s.id);
        }
        if (FG.getSection(s.id)) {
          throw new Error("[FG] Identifiant de section dupliqué : " + s.id);
        }
        FG.sections.push(s);
      }
      FG.sections.sort(function (a, b) {
        var sa = String(a.step || "").padStart(2, "0");
        var sb = String(b.step || "").padStart(2, "0");
        return sa < sb ? -1 : sa > sb ? 1 : 0;
      });
      return FG;
    },

    /**
     * Retrouve une section par identifiant (jamais par index).
     * @param {string} id
     */
    getSection: function (id) {
      for (var i = 0; i < FG.sections.length; i++) {
        if (FG.sections[i].id === id) return FG.sections[i];
      }
      return null;
    },

    /**
     * Index (d'ordre d'affichage) d'une section, -1 si absente.
     */
    indexOfSection: function (id) {
      for (var i = 0; i < FG.sections.length; i++) {
        if (FG.sections[i].id === id) return i;
      }
      return -1;
    },

    /** Fusionne des entrées de glossaire. */
    addGlossary: function (map) {
      var keys = Object.keys(map || {});
      for (var i = 0; i < keys.length; i++) {
        var term = keys[i];
        if (typeof map[term] !== "string" || !map[term].trim()) {
          throw new Error("[FG] Définition de glossaire invalide pour : " + term);
        }
        FG.glossary[term] = map[term];
      }
      return FG;
    },

    /** Enregistre des diagrammes SVG : { id: function } */
    addDiagrams: function (map) {
      var keys = Object.keys(map || {});
      for (var i = 0; i < keys.length; i++) {
        var id = keys[i];
        if (typeof map[id] !== "function") {
          throw new Error("[FG] Diagramme non-fonction : " + id);
        }
        FG.diagrams[id] = map[id];
      }
      return FG;
    },

    /** Enregistre des ensembles de quiz : { sectionId: questions[] } */
    addQuiz: function (map) {
      var keys = Object.keys(map || {});
      for (var i = 0; i < keys.length; i++) {
        var sid = keys[i];
        var qs = map[sid];
        if (!Array.isArray(qs)) {
          throw new Error("[FG] Quiz non-tableau pour : " + sid);
        }
        for (var j = 0; j < qs.length; j++) {
          var q = qs[j];
          if (!Array.isArray(q) || q.length !== 4) {
            throw new Error("[FG] Question mal formée dans : " + sid);
          }
          if (!Array.isArray(q[1]) || q[1].length < 2) {
            throw new Error("[FG] Options insuffisantes pour : " + sid + " #" + j);
          }
          if (typeof q[2] !== "number" || q[2] < 0 || q[2] >= q[1].length) {
            throw new Error("[FG] Index de réponse invalide pour : " + sid + " #" + j);
          }
        }
        FG.quiz[sid] = qs;
      }
      return FG;
    },

    /** Enregistre un outil interactif. */
    addTool: function (id, tool) {
      if (!id || !tool || typeof tool.render !== "function") {
        throw new Error("[FG] Outil invalide : " + id);
      }
      FG.tools[id] = tool;
      return FG;
    },

    /** Nombre total de questions de quiz du guide. */
    countQuizQuestions: function () {
      var total = 0;
      var keys = Object.keys(FG.quiz);
      for (var i = 0; i < keys.length; i++) {
        total += FG.quiz[keys[i]].length;
      }
      return total;
    }
  };

  return FG;
});
