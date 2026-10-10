#!/usr/bin/env node
/* ============================================================
   tools/build-sw.js — Génère sw.js (service worker PWA)
   Usage : node tools/build-sw.js   (à la racine du projet)
   ============================================================ */
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "..");

/* Fichiers à pré-cacher : parcours récursif des dossiers statiques */
const INCLUDE_DIRS = ["css", "js", "data", "assets"];
const EXCLUDE_FILES = new Set(["sw.js"]);

function walk(dir, base) {
  let out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(base, full).split(path.sep).join("/");
    if (entry.isDirectory()) {
      out = out.concat(walk(full, base));
    } else if (!EXCLUDE_FILES.has(entry.name)) {
      out.push(rel);
    }
  }
  return out;
}

function main() {
  const files = [".", "index.html", "site.webmanifest"];
  for (const dir of INCLUDE_DIRS) {
    const abs = path.join(ROOT, dir);
    if (fs.existsSync(abs)) {
      files.push(...walk(abs, ROOT));
    }
  }

  const unique = [...new Set(files)].filter((f) => f !== ".");
  const version = crypto.createHash("sha256")
    .update(unique.join("|") + Date.now())
    .digest("hex")
    .slice(0, 12);

  const sw = `/* ============================================================
   sw.js — généré automatiquement par tools/build-sw.js
   NE PAS ÉDITER À LA MAIN : relancer "node tools/build-sw.js".
   Version de cache : ${version}
   ============================================================ */
"use strict";

var CACHE = "fg-guide-${version}";
var ASSETS = ${JSON.stringify(unique, null, 2)};

/* Installation : pré-cache de tous les fichiers du guide */
self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(ASSETS);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

/* Activation : suppression des anciens caches */
self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) {
        return k !== CACHE;
      }).map(function (k) {
        return caches.delete(k);
      }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

/* Requêtes : cache d'abord, réseau en secours, mise en cache à la volée */
self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then(function (cached) {
      if (cached) return cached;
      return fetch(event.request).then(function (response) {
        if (response && response.status === 200 && response.type === "basic") {
          var copy = response.clone();
          caches.open(CACHE).then(function (cache) {
            cache.put(event.request, copy);
          });
        }
        return response;
      }).catch(function () {
        /* Hors ligne et non caché : page d'accueil par défaut */
        return caches.match("index.html");
      });
    })
  );
});
`;

  const out = path.join(ROOT, "sw.js");
  fs.writeFileSync(out, sw, "utf8");
  console.log("✓ sw.js généré : " + unique.length + " fichiers en cache (version " + version + ")");
}

main();
