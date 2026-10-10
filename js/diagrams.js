/* ============================================================
   Guide Interactif FortiGate — CFP-CMD / MASTER NMA
   diagrams.js — Helpers SVG + schémas de base
   Les helpers sont globaux (window.svgBox, ...) pour être
   utilisés par les fichiers data/diagrams-*.js.
   ============================================================ */
(function (root) {
  "use strict";

  function esc(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /**
   * Boîte (rectangle + label centré).
   * @param {number} x @param {number} y @param {number} w @param {number} h
   * @param {string} fill couleur de fond @param {string} stroke bordure
   * @param {string} label texte
   * @param {Object} [opts] { fontSize, textColor, radius, bold }
   */
  function svgBox(x, y, w, h, fill, stroke, label, opts) {
    opts = opts || {};
    var fs = opts.fontSize || 13;
    var tc = opts.textColor || "#ffffff";
    var r = typeof opts.radius === "number" ? opts.radius : 8;
    var weight = opts.bold === false ? "normal" : "700";
    var lines = String(label).split("\\n");
    var cx = x + w / 2;
    var cy = y + h / 2;
    var tspans = "";
    var startY = cy - ((lines.length - 1) * (fs + 3)) / 2 + fs / 3;
    for (var i = 0; i < lines.length; i++) {
      tspans +=
        '<tspan x="' + cx + '" y="' + (startY + i * (fs + 3)) + '">' + esc(lines[i]) + "</tspan>";
    }
    return (
      '<g><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h +
      '" rx="' + r + '" fill="' + fill + '" stroke="' + stroke +
      '" stroke-width="1.5"/>' +
      '<text x="' + cx + '" y="' + startY + '" font-size="' + fs +
      '" fill="' + tc + '" font-weight="' + weight +
      '" text-anchor="middle" dominant-baseline="middle">' + tspans + "</text></g>"
    );
  }

  /** Flèche horizontale/verticale/diagonale avec pointe. */
  function svgArrow(x1, y1, x2, y2, opts) {
    opts = opts || {};
    var color = opts.color || "#8fa3c0";
    var width = opts.width || 2;
    var dash = opts.dash ? ' stroke-dasharray="' + opts.dash + '"' : "";
    var label = opts.label ? labelAt(x1, y1, x2, y2, opts.label, color) : "";
    return (
      '<g><line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 +
      '" stroke="' + color + '" stroke-width="' + width + '"' + dash +
      ' marker-end="url(#fg-arrowhead)"/>' + label + "</g>"
    );
  }

  /** Flèche rouge (flux interdit / attaque). */
  function svgArrowRed(x1, y1, x2, y2, opts) {
    opts = opts || {};
    opts.color = opts.color || "#e74c3c";
    return svgArrow(x1, y1, x2, y2, opts);
  }

  /** Ligne simple sans pointe. */
  function svgLine(x1, y1, x2, y2, opts) {
    opts = opts || {};
    var color = opts.color || "#5b6b85";
    var width = opts.width || 1.5;
    var dash = opts.dash ? ' stroke-dasharray="' + opts.dash + '"' : "";
    return (
      '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 +
      '" stroke="' + color + '" stroke-width="' + width + '"' + dash + "/>"
    );
  }

  function labelAt(x1, y1, x2, y2, text, color) {
    var mx = (x1 + x2) / 2;
    var my = (y1 + y2) / 2;
    return (
      '<text x="' + mx + '" y="' + (my - 6) + '" font-size="11" fill="' + color +
      '" text-anchor="middle" font-weight="600">' + esc(text) + "</text>"
    );
  }

  /**
   * Enveloppe un ensemble d'éléments dans un <svg> complet,
   * en déclarant le marker partagé fg-arrowhead.
   */
  function svgWrap(width, height, inner) {
    return (
      '<svg width="100%" viewBox="0 0 ' + width + " " + height +
      '" xmlns="http://www.w3.org/2000/svg" role="img">' +
      "<defs><marker id=\"fg-arrowhead\" markerWidth=\"8\" markerHeight=\"8\" " +
      'refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="context-stroke"/></marker></defs>' +
      '<rect width="100%" height="100%" fill="transparent"/>' + inner + "</svg>"
    );
  }

  var helpers = {
    esc: esc,
    svgBox: svgBox,
    svgArrow: svgArrow,
    svgArrowRed: svgArrowRed,
    svgLine: svgLine,
    svgWrap: svgWrap
  };

  if (typeof module === "object" && module.exports) {
    module.exports = helpers;
  } else {
    root.svgBox = svgBox;
    root.svgArrow = svgArrow;
    root.svgArrowRed = svgArrowRed;
    root.svgLine = svgLine;
    root.svgWrap = svgWrap;
  }
})(typeof self !== "undefined" ? self : this);
