/* ============================================================
   sw.js — généré automatiquement par tools/build-sw.js
   NE PAS ÉDITER À LA MAIN : relancer "node tools/build-sw.js".
   Version de cache : 415b5ff05aef
   ============================================================ */
"use strict";

var CACHE = "fg-guide-415b5ff05aef";
var ASSETS = [
  "index.html",
  "site.webmanifest",
  "css/styles.css",
  "js/app.js",
  "js/diagrams.js",
  "js/quiz.js",
  "js/registry.js",
  "js/tools/cli-generator.js",
  "data/core.js",
  "data/diagrams-core.js",
  "data/diagrams-exploitation.js",
  "data/diagrams-security.js",
  "data/diagrams-services.js",
  "data/diagrams-vpn.js",
  "data/exploitation-1.js",
  "data/exploitation-2.js",
  "data/glossary-core.js",
  "data/glossary-exploitation.js",
  "data/glossary-security.js",
  "data/glossary-vpn.js",
  "data/interconnexion-1.js",
  "data/interconnexion-2.js",
  "data/labs.js",
  "data/quiz-core.js",
  "data/quiz-exploitation.js",
  "data/quiz-security.js",
  "data/quiz-vpn.js",
  "data/securite-1.js",
  "data/securite-2.js",
  "data/services-1.js",
  "data/services-2.js",
  "assets/apple-touch-icon.png",
  "assets/favicon-96x96.png",
  "assets/favicon.ico",
  "assets/favicon.svg",
  "assets/web-app-manifest-192x192.png",
  "assets/web-app-manifest-512x512.png"
];

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
