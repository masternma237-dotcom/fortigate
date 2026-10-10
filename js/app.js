/* ============================================================
   Guide Interactif FortiGate — CFP-CMD / MASTER NMA
   js/app.js — Moteur SPA : splash, navigation, recherche,
   progression, thème, glossaire, quiz, outils, export PDF, PWA.
   CSP stricte : aucun script inline, tout via addEventListener.
   ============================================================ */
(function () {
  "use strict";

  var SPLASH_DURATION = 8000; /* exigence projet : ≈ 8 secondes */

  /* ==================== Stockage protégé ==================== */
  var store = {
    get: function (key, fallback) {
      try {
        var raw = window.localStorage ? window.localStorage.getItem("fg-" + key) : null;
        return raw === null ? fallback : JSON.parse(raw);
      } catch (e) { return fallback; }
    },
    set: function (key, value) {
      try {
        if (window.localStorage) window.localStorage.setItem("fg-" + key, JSON.stringify(value));
      } catch (e) { /* privé / quota : silencieux */ }
    }
  };

  /* ==================== Utilitaires ==================== */
  function escHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function escapeRegExp(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function el(tag, className, text) {
    var n = document.createElement(tag);
    if (className) n.className = className;
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
  }

  function levelLabel(level) {
    return { debutant: "Débutant", intermediaire: "Intermédiaire", avance: "Avancé", tous: "Transversal" }[level] || level;
  }

  function levelColor(level) {
    return { debutant: "#4ade80", intermediaire: "#fbbf24", avance: "#f87171", tous: "#60a5fa" }[level] || "#9aa7bf";
  }

  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }

  function copyText(text, okMsg) {
    function done(ok) {
      App.toast(ok ? (okMsg || "Copié dans le presse-papiers.") : "Copie impossible — sélectionnez le texte manuellement.", ok ? "success" : "error");
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(fallbackCopy(text)); });
    } else {
      done(fallbackCopy(text));
    }
  }

  /* ==================== Toasts ==================== */
  function toast(message, type) {
    var container = document.getElementById("toast-container");
    if (!container) return;
    var icons = { success: "fa-circle-check", error: "fa-circle-xmark", warn: "fa-triangle-exclamation", info: "fa-circle-info" };
    var t = el("div", "toast toast-" + (type || "info"));
    t.setAttribute("role", "status");
    var i = el("i", "fa-solid " + (icons[type] || icons.info));
    i.setAttribute("aria-hidden", "true");
    t.appendChild(i);
    t.appendChild(el("span", null, message));
    container.appendChild(t);
    setTimeout(function () {
      t.classList.add("toast-out");
      setTimeout(function () { t.remove(); }, 350);
    }, 4200);
  }

  /* ==================== Thème ==================== */
  function initTheme() {
    var saved = store.get("theme", "dark");
    applyTheme(saved);
    var btn = document.getElementById("btn-theme");
    btn.addEventListener("click", function () {
      var current = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(current);
      store.set("theme", current);
    });
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    var btn = document.getElementById("btn-theme");
    if (btn) {
      var icon = btn.querySelector("i");
      if (icon) icon.className = theme === "dark" ? "fa-solid fa-sun" : "fa-solid fa-moon";
      btn.setAttribute("aria-label", theme === "dark" ? "Passer au thème clair" : "Passer au thème sombre");
    }
  }

  /* ==================== Progression ==================== */
  var visited = {};
  (function () {
    var arr = store.get("visited", []);
    for (var i = 0; i < arr.length; i++) visited[arr[i]] = true;
  })();

  function markVisited(id) {
    if (!visited[id]) {
      visited[id] = true;
      store.set("visited", Object.keys(visited));
      updateProgressBar();
      refreshSidebarMarks();
    }
  }

  function updateProgressBar() {
    var total = FG.sections.length || 1;
    var count = Object.keys(visited).length;
    var pct = Math.round((count / total) * 100);
    var bar = document.getElementById("progress-bar");
    var label = document.getElementById("progress-label");
    if (bar) {
      bar.style.width = pct + "%";
      bar.setAttribute("aria-valuenow", String(pct));
    }
    if (label) label.textContent = pct + " %";
  }

  /* ==================== Splash screen (≈ 8 s) ==================== */
  var BOOT_LINES = [
    { t: 400, html: '<span class="dim">Fortinet BootLoader v7.4 —</span> FortiGate-VM <span class="ok">[ OK ]</span>' },
    { t: 1100, html: 'Montage des interfaces : <span class="ok">wan1</span> <span class="ok">internal</span> <span class="ok">dmz</span> <span class="ok">[ OK ]</span>' },
    { t: 1900, html: 'Zones de sécurité : <span class="ok">LAN_IT</span> <span class="ok">HOTSPOT</span> <span class="ok">DMZ</span> <span class="ok">WAN</span> <span class="ok">[ OK ]</span>' },
    { t: 2700, html: 'Chargement des profils UTM : AV · IPS · WebFilter · AppCtrl <span class="ok">[ OK ]</span>' },
    { t: 3500, html: 'Services VPN : <span class="ok">SSL-VPN</span> <span class="ok">IPsec IKEv2</span> <span class="ok">[ OK ]</span>' },
    { t: 4300, html: 'Journalisation : Syslog 192.168.10.20:514 (local7) <span class="ok">[ OK ]</span>' },
    { t: 5100, html: 'Parcours pédagogiques : 6 tracks · 40 sections · 4 outils <span class="ok">[ OK ]</span>' },
    { t: 5900, html: 'Licence FortiGuard et glossaire : <span class="ok">actifs</span> <span class="ok">[ OK ]</span>' },
    { t: 6700, html: '<span class="ok">Prêt.</span> Ouverture du guide interactif…' }
  ];

  var SPLASH_STEPS = [
    { p: 8, msg: "Démarrage du noyau FortiOS…" },
    { p: 22, msg: "Montage des interfaces et zones…" },
    { p: 45, msg: "Chargement des profils UTM…" },
    { p: 62, msg: "Ouverture des services VPN…" },
    { p: 78, msg: "Connexion au Syslog distant…" },
    { p: 92, msg: "Indexation des parcours pédagogiques…" },
    { p: 100, msg: "Prêt. Bienvenue !" }
  ];

  var splashDone = false;

  function runSplash() {
    var splash = document.getElementById("splash");
    var consoleBox = document.getElementById("splash-console");
    var fill = document.getElementById("splash-fill");
    var pct = document.getElementById("splash-pct");
    var msg = document.getElementById("splash-msg");
    var skipBtn = document.getElementById("splash-skip");

    /* Lignes de démarrage simulées */
    BOOT_LINES.forEach(function (line) {
      setTimeout(function () {
        if (splashDone) return;
        var span = el("span", "line");
        span.innerHTML = line.html;
        consoleBox.appendChild(span);
        while (consoleBox.children.length > 7) consoleBox.removeChild(consoleBox.firstChild);
      }, line.t);
    });

    /* Barre de progression sur 8 s */
    var start = Date.now();
    var stepIdx = 0;
    var timer = setInterval(function () {
      if (splashDone) { clearInterval(timer); return; }
      var elapsed = Date.now() - start;
      var ratio = Math.min(1, elapsed / SPLASH_DURATION);
      var value = Math.floor(ratio * 100);
      fill.style.width = value + "%";
      pct.textContent = value + " %";
      while (stepIdx < SPLASH_STEPS.length && value >= SPLASH_STEPS[stepIdx].p) {
        msg.textContent = SPLASH_STEPS[stepIdx].msg;
        stepIdx++;
      }
      if (ratio >= 1) {
        clearInterval(timer);
        finishSplash();
      }
    }, 80);

    /* Passer : bouton, Entrée, Échap, ou clic sur l'écran */
    skipBtn.addEventListener("click", finishSplash);
    document.addEventListener("keydown", function splashKey(e) {
      if (splashDone) { document.removeEventListener("keydown", splashKey); return; }
      if (e.key === "Enter" || e.key === "Escape" || e.key === " ") {
        e.preventDefault();
        finishSplash();
      }
    });
    splash.addEventListener("click", function (e) {
      if (e.target === splash || e.target.classList.contains("splash-inner")) finishSplash();
    });
  }

  function finishSplash() {
    if (splashDone) return;
    splashDone = true;
    var splash = document.getElementById("splash");
    var app = document.getElementById("app");
    splash.classList.add("splash-hidden");
    app.classList.remove("app-booting");
    setTimeout(function () {
      if (splash.parentNode) splash.parentNode.removeChild(splash);
    }, 700);
    route();
    document.getElementById("main-content").focus({ preventScroll: true });
    registerServiceWorker();
  }

  /* ==================== Service worker (hors-ligne) ==================== */
  function registerServiceWorker() {
    if ("serviceWorker" in navigator && (location.protocol === "https:" || location.protocol === "http:")) {
      navigator.serviceWorker.register("sw.js").catch(function () { /* file:// ou indisponible : ignoré */ });
    }
  }

  /* ==================== Sidebar ==================== */
  var openTracks = {};
  (function () {
    var arr = store.get("open-tracks", null);
    if (arr === null) {
      openTracks["socle"] = true; /* parcours déplié par défaut */
    } else {
      for (var i = 0; i < arr.length; i++) openTracks[arr[i]] = true;
    }
  })();

  function persistOpenTracks() {
    store.set("open-tracks", Object.keys(openTracks));
  }

  function buildSidebar() {
    var host = document.getElementById("side-tracks");
    host.textContent = "";

    Object.keys(FG.tracks).forEach(function (trackId) {
      var track = FG.tracks[trackId];
      var sections = FG.sections.filter(function (s) { return s.track === trackId; });
      if (sections.length === 0) return;

      var group = el("div", "track-group" + (openTracks[trackId] ? " open" : ""));
      group.dataset.track = trackId;

      var header = el("button", "track-header");
      header.type = "button";
      header.setAttribute("aria-expanded", openTracks[trackId] ? "true" : "false");
      header.style.setProperty("--dot", track.color);

      var dot = el("span", "track-dot");
      dot.style.background = track.color;
      header.appendChild(dot);

      var icon = el("i", track.icon);
      icon.setAttribute("aria-hidden", "true");
      header.appendChild(icon);
      header.appendChild(el("span", null, track.name));
      header.appendChild(el("span", "track-count", String(sections.length)));
      var chev = el("i", "fa-solid fa-chevron-down track-chevron");
      chev.setAttribute("aria-hidden", "true");
      header.appendChild(chev);

      var list = el("div", "track-sections");

      sections.forEach(function (s) {
        var link = el("button", "side-link");
        link.type = "button";
        link.dataset.goto = s.id;
        link.dataset.level = s.level;

        var step = el("span", "step-no", s.step);
        link.appendChild(step);
        link.appendChild(document.createTextNode(s.title));

        var lvl = el("span", "lvl-dot");
        lvl.style.background = levelColor(s.level);
        lvl.title = levelLabel(s.level);
        link.appendChild(lvl);

        var mark = el("span", "visited-mark");
        mark.innerHTML = "&#10003;";
        mark.style.display = visited[s.id] ? "" : "none";
        mark.setAttribute("aria-label", "Section visitée");
        link.appendChild(mark);

        link.addEventListener("click", function () {
          navigateTo(s.id);
          closeMobileSidebar();
        });
        list.appendChild(link);
      });

      header.addEventListener("click", function () {
        openTracks[trackId] = !openTracks[trackId];
        group.classList.toggle("open", !!openTracks[trackId]);
        header.setAttribute("aria-expanded", openTracks[trackId] ? "true" : "false");
        persistOpenTracks();
      });

      group.appendChild(header);
      group.appendChild(list);
      host.appendChild(group);
    });

    applyLevelFilter();
    refreshSidebarMarks();
  }

  function refreshSidebarMarks() {
    document.querySelectorAll(".side-link[data-goto]").forEach(function (link) {
      var mark = link.querySelector(".visited-mark");
      if (mark) mark.style.display = visited[link.dataset.goto] ? "" : "none";
    });
  }

  var currentLevel = "all";
  (function () { currentLevel = store.get("level", "all"); })();

  function applyLevelFilter() {
    var select = document.getElementById("level-filter");
    if (select && select.value !== currentLevel) select.value = currentLevel;
    var groups = document.querySelectorAll(".track-group");
    groups.forEach(function (group) {
      var visible = 0;
      group.querySelectorAll(".side-link[data-goto]").forEach(function (link) {
        var lvl = link.dataset.level;
        var show = currentLevel === "all" || lvl === currentLevel || lvl === "tous";
        link.classList.toggle("hidden-by-filter", !show);
        if (show) visible++;
      });
      group.classList.toggle("hidden-by-filter", visible === 0);
    });
  }

  /* ==================== Navigation / routeur ==================== */
  var App = {
    toast: toast,
    copyText: copyText,
    navigateTo: navigateTo
  };
  window.App = App;

  function navigateTo(id) {
    if (id === "home") {
      location.hash = "#/";
      return;
    }
    var section = FG.getSection(id);
    if (!section) {
      toast("Section introuvable : " + id, "error");
      return;
    }
    if (location.hash === "#/" + id) {
      route();
    } else {
      location.hash = "#/" + id;
    }
  }

  function route() {
    var hash = location.hash || "#/";
    var id = hash.replace(/^#\//, "");
    clearSearchResults();
    if (id && FG.getSection(id)) {
      renderSection(id);
    } else {
      if (id) location.hash = "#/";
      renderHome();
    }
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function closeMobileSidebar() {
    if (window.innerWidth <= 900) {
      document.getElementById("sidebar").classList.remove("mobile-open");
      document.getElementById("btn-sidebar").setAttribute("aria-expanded", "false");
    }
  }

  /* ==================== Vue accueil ==================== */
  function renderHome() {
    document.getElementById("section-view").hidden = true;
    var home = document.getElementById("home-view");
    home.hidden = false;
    home.textContent = "";

    var last = store.get("last-section", null);

    var hero = el("div", "home-hero");
    var h1 = el("h1");
    h1.appendChild(document.createTextNode("Déployez et administrez un "));
    var span = el("span", null, "pare-feu FortiGate");
    h1.appendChild(span);
    hero.appendChild(h1);
    hero.appendChild(el("p", null,
      "Guide interactif du projet « Infrastructure de sécurité périmétrique pour le CFP-CMD » : " +
      "zones de sécurité, politiques de filtrage, NAT/VIP, VPN SSL et IPsec, UTM (AV, IPS, Web Filtering), " +
      "journalisation, supervision et automatisation. Chaque section combine explications, commandes CLI FortiOS, " +
      "étapes GUI, diagrammes et quiz d'ancrage."));
    var actions = el("div", "hero-actions");

    var resume = el("button", "btn btn-primary");
    resume.type = "button";
    resume.appendChild(el("i", "fa-solid fa-play"));
    resume.appendChild(document.createTextNode(last ? "Reprendre : " + FG.getSection(last).title : "Commencer le parcours"));
    resume.addEventListener("click", function () {
      navigateTo(last || FG.sections[0].id);
    });
    actions.appendChild(resume);

    var btnGen = el("button", "btn");
    btnGen.type = "button";
    btnGen.appendChild(el("i", "fa-solid fa-terminal"));
    btnGen.appendChild(document.createTextNode(" Générateur CLI"));
    btnGen.addEventListener("click", function () { navigateTo("generateur-cli"); });
    actions.appendChild(btnGen);

    var btnQuiz = el("button", "btn");
    btnQuiz.type = "button";
    btnQuiz.appendChild(el("i", "fa-solid fa-graduation-cap"));
    btnQuiz.appendChild(document.createTextNode(" Quiz final"));
    btnQuiz.addEventListener("click", function () { navigateTo("quiz-final"); });
    actions.appendChild(btnQuiz);

    hero.appendChild(actions);
    home.appendChild(hero);

    var stats = el("div", "stats-grid");
    [
      [String(Object.keys(FG.tracks).length), "Parcours"],
      [String(FG.sections.length), "Sections"],
      [String(FG.countQuizQuestions()), "Questions"],
      [String(Object.keys(FG.glossary).length), "Termes"],
      [String(Object.keys(FG.diagrams).length), "Diagrammes"]
    ].forEach(function (pair) {
      var card = el("div", "stat-card");
      card.appendChild(el("b", null, pair[0]));
      card.appendChild(el("span", null, pair[1]));
      stats.appendChild(card);
    });
    home.appendChild(stats);

    var grid = el("div", "tracks-grid");
    Object.keys(FG.tracks).forEach(function (trackId) {
      var track = FG.tracks[trackId];
      var sections = FG.sections.filter(function (s) { return s.track === trackId; });
      var card = el("button", "track-card");
      card.type = "button";
      card.style.setProperty("--dot", track.color);
      var h3 = el("h3");
      var icon = el("i", track.icon);
      icon.setAttribute("aria-hidden", "true");
      h3.appendChild(icon);
      h3.appendChild(document.createTextNode(track.name));
      card.appendChild(h3);
      card.appendChild(el("p", null, track.description));
      card.appendChild(el("span", "track-meta", sections.length + " sections · " +
        sections[0].step + " → " + sections[sections.length - 1].step));
      card.addEventListener("click", function () {
        navigateTo(sections[0].id);
      });
      grid.appendChild(card);
    });
    home.appendChild(grid);

    var help = el("div", "home-help");
    help.appendChild(el("h2", null, "Comment utiliser ce guide ?"));
    var ol = el("ol");
    [
      "Suivez le parcours Socle dans l'ordre : chaque section prépare la suivante (prérequis indiqués).",
      "Recopiez les commandes CLI dans votre labo FortiGate-VM et reproduisez les étapes GUI.",
      "Validez chaque section par son quiz (seuil 70 %), puis exécutez les Labs 0 à 3.",
      "Terminez par le quiz final : 70 % minimum pour valider le module MASTER NMA.",
      "Le guide fonctionne hors ligne : installez-le comme application (PWA) depuis votre navigateur."
    ].forEach(function (txt) { ol.appendChild(el("li", null, txt)); });
    help.appendChild(ol);
    home.appendChild(help);
  }

  /* ==================== Rendu d'une section ==================== */
  function makeCliBlock(code, index) {
    var block = el("div", "cli-block");
    var head = el("div", "cli-head");
    head.appendChild(el("span", null, "CLI FortiOS — bloc " + index));
    var btn = el("button", "cli-copy");
    btn.type = "button";
    btn.appendChild(el("i", "fa-solid fa-copy"));
    btn.appendChild(document.createTextNode(" Copier"));
    btn.addEventListener("click", function () { copyText(code, "Bloc CLI copié."); });
    head.appendChild(btn);
    block.appendChild(head);
    var pre = el("pre");
    var codeEl = el("code");
    /* Coloration légère des commentaires */
    codeEl.innerHTML = code.split("\n").map(function (line) {
      var trimmed = line.trimStart();
      if (trimmed.charAt(0) === "#") return '<span class="cmt">' + escHtml(line) + "</span>";
      return escHtml(line);
    }).join("\n");
    pre.appendChild(codeEl);
    block.appendChild(pre);
    return block;
  }

  function renderSection(id) {
    var s = FG.getSection(id);
    var view = document.getElementById("section-view");
    var home = document.getElementById("home-view");
    home.hidden = true;
    view.hidden = false;
    view.textContent = "";

    store.set("last-section", id);
    markVisited(id);

    /* En-tête */
    var header = el("div", "section-header");
    var badges = el("div", "section-badges");
    var track = FG.tracks[s.track];
    var tb = el("span", "badge badge-track");
    tb.style.setProperty("--dot", track.color);
    tb.style.background = track.color;
    tb.textContent = track.name;
    badges.appendChild(tb);
    var lb = el("span", "badge badge-level-" + s.level, levelLabel(s.level));
    badges.appendChild(lb);
    var req = el("span", "badge", "Prérequis : " + (s.requires.length ? s.requires.map(function (r) {
      var rs = FG.getSection(r);
      return rs ? rs.step : r;
    }).join(", ") : "aucun"));
    badges.appendChild(req);
    header.appendChild(badges);

    var h1 = el("h1");
    h1.appendChild(el("span", "step-prefix", s.step));
    h1.appendChild(document.createTextNode(s.title));
    header.appendChild(h1);
    header.appendChild(el("p", "section-desc", s.description));
    view.appendChild(header);

    /* Alertes */
    (s.alerts || []).forEach(function (a) {
      var box = el("div", "alert alert-" + (a.type || "info"));
      box.setAttribute("role", a.type === "danger" || a.type === "warning" ? "alert" : "note");
      var icon = el("i", a.icon || "fa-circle-info");
      icon.setAttribute("aria-hidden", "true");
      box.appendChild(icon);
      box.appendChild(el("span", null, a.text));
      view.appendChild(box);
    });

    /* Diagramme */
    if (s.diagram && typeof FG.diagrams[s.diagram] === "function") {
      var diag = el("div", "diagram-placeholder");
      diag.innerHTML = FG.diagrams[s.diagram]();
      diag.appendChild(el("p", null, "Schéma — " + s.title));
      view.appendChild(diag);
    }

    /* Sous-sections */
    if (s.subsections && s.subsections.length) {
      var subs = el("div", "subsections");
      s.subsections.forEach(function (sub) {
        subs.appendChild(el("h3", null, sub.title));
        subs.appendChild(el("p", null, sub.content));
      });
      view.appendChild(subs);
    }

    /* Commandes CLI */
    (s.cliCommands || []).forEach(function (code, i) {
      view.appendChild(makeCliBlock(code, i + 1));
    });

    /* Étapes GUI */
    if (s.guiSteps && s.guiSteps.length) {
      var wrap = el("div");
      wrap.appendChild(el("h3", null, "Via l'interface graphique (GUI)"));
      var ol = el("ol", "gui-steps");
      s.guiSteps.forEach(function (step, i) {
        var li = el("li");
        var num = el("span", "gui-num", String(i + 1));
        li.appendChild(num);
        var span = el("span");
        span.innerHTML = step; /* contenu contrôlé : fichiers data du guide */
        li.appendChild(span);
        ol.appendChild(li);
      });
      wrap.appendChild(ol);
      view.appendChild(wrap);
    }

    /* Tableau récapitulatif */
    if (s.table && s.table.headers) {
      var tw = el("div", "table-wrap");
      var table = el("table", "data-table");
      var thead = el("thead");
      var trh = el("tr");
      s.table.headers.forEach(function (h) { trh.appendChild(el("th", null, h)); });
      thead.appendChild(trh);
      table.appendChild(thead);
      var tbody = el("tbody");
      s.table.rows.forEach(function (row) {
        var tr = el("tr");
        row.forEach(function (cell) { tr.appendChild(el("td", null, cell)); });
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      tw.appendChild(table);
      view.appendChild(tw);
    }

    /* Concepts */
    if (s.concepts && s.concepts.length) {
      var conceptsWrap = el("div");
      conceptsWrap.appendChild(el("h3", null, "Concepts clés"));
      var cg = el("div", "concepts-grid");
      s.concepts.forEach(function (c) {
        var card = el("div", "concept-card");
        card.appendChild(el("h4", null, c.term));
        card.appendChild(el("p", null, c.def));
        cg.appendChild(card);
      });
      conceptsWrap.appendChild(cg);
      view.appendChild(conceptsWrap);
    }

    /* Outil interactif */
    if (s.tool && FG.tools[s.tool] && typeof FG.tools[s.tool].render === "function") {
      var toolWrap = el("div", "tool-frame");
      toolWrap.appendChild(el("h3", null, "Outil interactif : " + FG.tools[s.tool].title));
      FG.tools[s.tool].render(toolWrap);
      view.appendChild(toolWrap);
    }

    /* Checklist (labs) */
    if (s.checklist && s.checklist.length) {
      var clWrap = el("div");
      clWrap.appendChild(el("h3", null, "Checklist du lab (mémorisée)"));
      var ul = el("ul", "checklist");
      var done = store.get("checklist-" + id, {});
      s.checklist.forEach(function (item, i) {
        var li = el("li");
        var label = el("label");
        var cb = document.createElement("input");
        cb.type = "checkbox";
        cb.checked = !!done[i];
        cb.setAttribute("aria-label", item);
        cb.addEventListener("change", function () {
          var state = store.get("checklist-" + id, {});
          state[i] = cb.checked;
          store.set("checklist-" + id, state);
          if (cb.checked) {
            var total = s.checklist.length;
            var count = s.checklist.filter(function (_, j) { return state[j]; }).length;
            if (count === total) toast("Lab terminé : checklist complète !", "success");
          }
        });
        label.appendChild(cb);
        label.appendChild(el("span", null, item));
        li.appendChild(label);
        ul.appendChild(li);
      });
      clWrap.appendChild(ul);
      view.appendChild(clWrap);
    }

    /* Quiz de section */
    if (FG.quiz[id] && FG.quiz[id].length) {
      var qBox = el("div", "quiz-box");
      var qHead = el("div", "quiz-head");
      var qTitle = el("h3");
      var qIcon = el("i", "fa-solid fa-circle-question");
      qIcon.setAttribute("aria-hidden", "true");
      qTitle.appendChild(qIcon);
      qTitle.appendChild(document.createTextNode("Quiz de section — " + s.title));
      qHead.appendChild(qTitle);
      qBox.appendChild(qHead);
      var qBody = el("div");
      qBox.appendChild(qBody);
      QuizEngine.render(qBody, {
        id: id,
        title: s.title,
        questions: FG.quiz[id],
        threshold: QuizEngine.THRESHOLD
      });
      view.appendChild(qBox);
    }

    /* Terminologie / glossaire contextuel */
    if (s.terminology && s.terminology.length) {
      var termWrap = el("div");
      termWrap.appendChild(el("h3", null, "Terminologie de la section"));
      var chips = el("div", "term-chips");
      s.terminology.forEach(function (t) {
        chips.appendChild(el("span", "term-chip", t));
      });
      termWrap.appendChild(chips);
      view.appendChild(termWrap);
    }

    /* Navigation précédent / suivant */
    var idx = FG.indexOfSection(id);
    var nav = el("div", "section-nav");
    if (idx > 0) {
      var prev = FG.sections[idx - 1];
      var prevBtn = el("button", "btn prev");
      prevBtn.type = "button";
      prevBtn.appendChild(el("span", null, "← Section précédente"));
      prevBtn.appendChild(document.createTextNode(prev.step + " — " + prev.title));
      prevBtn.addEventListener("click", function () { navigateTo(prev.id); });
      nav.appendChild(prevBtn);
    } else {
      nav.appendChild(el("span"));
    }
    if (idx < FG.sections.length - 1) {
      var next = FG.sections[idx + 1];
      var nextBtn = el("button", "btn next");
      nextBtn.type = "button";
      nextBtn.appendChild(el("span", null, "Section suivante →"));
      nextBtn.appendChild(document.createTextNode(next.step + " — " + next.title));
      nextBtn.addEventListener("click", function () { navigateTo(next.id); });
      nav.appendChild(nextBtn);
    }
    view.appendChild(nav);

    /* Panneau glossaire contextuel */
    renderGlossarySection(s);
  }

  /* ==================== Panneau glossaire ==================== */
  var glossaryMode = "section";

  function renderGlossarySection(s) {
    var content = document.getElementById("glossary-content");
    content.textContent = "";
    if (!s) return;
    var terms = (s.terminology || []).filter(function (t) { return FG.glossary[t]; });
    if (terms.length === 0) {
      content.appendChild(el("p", "gl-sub", "Aucun terme spécifique pour cette section — ouvrez l'onglet « Tout »."));
      return;
    }
    terms.forEach(function (t) {
      var item = el("div", "gl-item");
      var dl = el("dl");
      dl.appendChild(el("dt", null, t));
      dl.appendChild(el("dd", null, FG.glossary[t]));
      item.appendChild(dl);
      content.appendChild(item);
    });
  }

  function renderGlossaryAll() {
    var content = document.getElementById("glossary-content");
    content.textContent = "";
    var keys = Object.keys(FG.glossary).sort(function (a, b) {
      return a.localeCompare(b, "fr", { sensitivity: "base" });
    });
    var currentLetter = "";
    keys.forEach(function (t) {
      var letter = t.charAt(0).toUpperCase();
      if (letter !== currentLetter) {
        currentLetter = letter;
        content.appendChild(el("p", null, letter)).style.cssText =
          "font-weight:800;color:var(--accent-bright);margin:10px 0 4px;border-bottom:1px solid var(--border);";
      }
      var item = el("div", "gl-item");
      var dl = el("dl");
      dl.appendChild(el("dt", null, t));
      dl.appendChild(el("dd", null, FG.glossary[t]));
      item.appendChild(dl);
      content.appendChild(item);
    });
  }

  function toggleGlossary(force) {
    var panel = document.getElementById("glossary-panel");
    var layout = document.getElementById("layout");
    var btn = document.getElementById("btn-glossary");
    var show = typeof force === "boolean" ? force : panel.hidden;
    panel.hidden = !show;
    btn.setAttribute("aria-pressed", show ? "true" : "false");
    layout.classList.toggle("with-glossary", show);
    store.set("glossary-open", show);
    if (show) {
      var s = FG.getSection((location.hash || "#/").replace(/^#\//, ""));
      if (glossaryMode === "all") renderGlossaryAll();
      else renderGlossarySection(s);
    }
  }

  /* ==================== Recherche ==================== */
  function buildSearchIndex() {
    var index = [];
    FG.sections.forEach(function (s) {
      var haystack = [
        s.title, s.description,
        (s.concepts || []).map(function (c) { return c.term + " " + c.def; }).join(" "),
        (s.terminology || []).join(" "),
        (s.cliCommands || []).join(" "),
        (s.subsections || []).map(function (x) { return x.title + " " + x.content; }).join(" ")
      ].join(" ").toLowerCase();
      index.push({ id: s.id, title: s.title, step: s.step, track: s.track, haystack: haystack });
    });
    return index;
  }

  var searchIndex = null;

  function highlightSnippet(text, query) {
    var safe = escHtml(text);
    var q = escapeRegExp(query).replace(/\s+/g, "|");
    if (!q) return safe;
    try {
      return safe.replace(new RegExp("(" + q + ")", "gi"), "<mark>$1</mark>");
    } catch (e) {
      return safe;
    }
  }

  function doSearch(query) {
    var box = document.getElementById("search-results");
    if (!searchIndex) searchIndex = buildSearchIndex();
    var q = query.trim().toLowerCase();
    if (q.length < 2) {
      clearSearchResults();
      return;
    }
    var terms = q.split(/\s+/);
    var hits = searchIndex.filter(function (item) {
      return terms.every(function (t) { return item.haystack.indexOf(t) !== -1; });
    }).slice(0, 10);

    var glossHits = Object.keys(FG.glossary).filter(function (term) {
      return terms.every(function (t) {
        return term.toLowerCase().indexOf(t) !== -1 || FG.glossary[term].toLowerCase().indexOf(t) !== -1;
      });
    }).slice(0, 6);

    box.textContent = "";
    if (hits.length === 0 && glossHits.length === 0) {
      box.appendChild(el("div", "search-empty", "Aucun résultat pour « " + query + " »."));
    }
    hits.forEach(function (item) {
      var btn = el("button", "search-result");
      btn.type = "button";
      var title = el("div", "sr-title");
      title.appendChild(el("span", "step-no", item.step));
      title.appendChild(document.createTextNode(" "));
      title.insertAdjacentHTML("beforeend", highlightSnippet(item.title, query));
      btn.appendChild(title);
      var track = FG.tracks[item.track];
      btn.appendChild(el("div", "sr-snippet", track ? track.name : ""));
      btn.addEventListener("click", function () {
        navigateTo(item.id);
        clearSearchResults();
        document.getElementById("search-input").value = "";
      });
      box.appendChild(btn);
    });
    glossHits.forEach(function (term) {
      var btn = el("button", "search-result");
      btn.type = "button";
      var title = el("div", "sr-title");
      var icon = el("i", "fa-solid fa-book");
      icon.setAttribute("aria-hidden", "true");
      title.appendChild(icon);
      title.insertAdjacentHTML("beforeend", " " + highlightSnippet(term, query));
      btn.appendChild(title);
      btn.appendChild(el("div", "sr-snippet", FG.glossary[term].slice(0, 120) + "…"));
      btn.addEventListener("click", function () {
        toggleGlossary(true);
        document.getElementById("gl-tab-all").click();
        clearSearchResults();
      });
      box.appendChild(btn);
    });
    box.hidden = false;
  }

  function clearSearchResults() {
    var box = document.getElementById("search-results");
    if (box) {
      box.hidden = true;
      box.textContent = "";
    }
  }

  /* ==================== Export PDF ==================== */
  function exportPdf() {
    var hash = (location.hash || "#/").replace(/^#\//, "");
    var s = hash ? FG.getSection(hash) : null;

    var title = s ? s.step + " — " + s.title : "Guide Interactif FortiGate — CFP-CMD";
    var bodyHtml = "";
    if (s) {
      bodyHtml = "<h1>" + escHtml(s.step + " — " + s.title) + "</h1><p><em>" + escHtml(s.description) + "</em></p>";
      (s.subsections || []).forEach(function (sub) {
        bodyHtml += "<h2>" + escHtml(sub.title) + "</h2><p>" + escHtml(sub.content) + "</p>";
      });
      (s.cliCommands || []).forEach(function (code) {
        bodyHtml += "<pre class='cli'>" + escHtml(code) + "</pre>";
      });
      if (s.table && s.table.headers) {
        bodyHtml += "<table><thead><tr>" + s.table.headers.map(function (h) { return "<th>" + escHtml(h) + "</th>"; }).join("") +
          "</tr></thead><tbody>" + s.table.rows.map(function (row) {
            return "<tr>" + row.map(function (c) { return "<td>" + escHtml(c) + "</td>"; }).join("") + "</tr>";
          }).join("") + "</tbody></table>";
      }
      (s.concepts || []).forEach(function (c) {
        bodyHtml += "<p><strong>" + escHtml(c.term) + "</strong> — " + escHtml(c.def) + "</p>";
      });
    } else {
      bodyHtml = "<h1>Guide Interactif FortiGate — CFP-CMD</h1><p>Projet : Infrastructure de sécurité périmétrique — MASTER NMA.</p>";
      bodyHtml += "<table><thead><tr><th>Étape</th><th>Section</th><th>Niveau</th></tr></thead><tbody>" +
        FG.sections.map(function (sec) {
          return "<tr><td>" + escHtml(sec.step) + "</td><td>" + escHtml(sec.title) + "</td><td>" + escHtml(levelLabel(sec.level)) + "</td></tr>";
        }).join("") + "</tbody></table>";
    }

    var html = "<!DOCTYPE html><html lang='fr'><head><meta charset='utf-8'><title>" + escHtml(title) + "</title>" +
      "<style>body{font-family:Georgia,serif;margin:36px;color:#111;line-height:1.55}" +
      "h1{font-size:1.5em;border-bottom:2px solid #da291c;padding-bottom:8px}h2{font-size:1.15em;color:#8a1a10;margin-top:22px}" +
      "pre.cli{background:#f6f6f6;border:1px solid #ccc;padding:10px;overflow-x:auto;font-size:12px}" +
      "table{border-collapse:collapse;width:100%;font-size:12px}th,td{border:1px solid #999;padding:5px 8px;text-align:left}th{background:#eee}" +
      "footer{margin-top:30px;font-size:11px;color:#666;border-top:1px solid #ccc;padding-top:8px}" +
      "@media print{pre.cli{white-space:pre-wrap}}</style></head><body>" + bodyHtml +
      "<footer>Généré par le Guide Interactif FortiGate — CFP-CMD / MASTER NMA · " + new Date().toLocaleDateString("fr-FR") + "</footer></body></html>";

    var win = null;
    try { win = window.open("", "_blank"); } catch (e) { win = null; }

    if (win) {
      win.document.open();
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(function () { try { win.print(); } catch (e) { /* l'utilisateur imprimera manuellement */ } }, 350);
      toast("Fenêtre d'export ouverte — utilisez « Enregistrer au format PDF ».", "info");
    } else {
      /* Popup bloquée : impression via iframe cachée */
      var iframe = document.createElement("iframe");
      iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
      document.body.appendChild(iframe);
      var doc = iframe.contentWindow.document;
      doc.open();
      doc.write(html);
      doc.close();
      setTimeout(function () {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        setTimeout(function () { iframe.remove(); }, 4000);
      }, 300);
      toast("Popup bloquée : impression via la fenêtre courante.", "warn");
    }
  }

  /* ==================== Initialisation ==================== */
  function init() {
    initTheme();

    /* Sidebar + filtre */
    buildSidebar();
    var select = document.getElementById("level-filter");
    select.value = currentLevel;
    select.addEventListener("change", function () {
      currentLevel = select.value;
      store.set("level", currentLevel);
      applyLevelFilter();
    });

    /* Bouton sidebar (mobile) */
    var btnSidebar = document.getElementById("btn-sidebar");
    btnSidebar.addEventListener("click", function () {
      var side = document.getElementById("sidebar");
      var open = side.classList.contains("mobile-open");
      side.classList.toggle("mobile-open", !open);
      btnSidebar.setAttribute("aria-expanded", String(!open));
    });

    /* Liens rapides du pied de sidebar */
    document.querySelectorAll(".side-link[data-goto]").forEach(function (link) {
      if (link.dataset.goto) {
        link.addEventListener("click", function () {
          navigateTo(link.dataset.goto);
          closeMobileSidebar();
        });
      }
    });

    /* Recherche */
    var searchInput = document.getElementById("search-input");
    var debounce = null;
    searchInput.addEventListener("input", function () {
      clearTimeout(debounce);
      debounce = setTimeout(function () { doSearch(searchInput.value); }, 140);
    });
    searchInput.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        searchInput.value = "";
        clearSearchResults();
        searchInput.blur();
      }
    });
    document.addEventListener("click", function (e) {
      if (!e.target.closest(".search-wrap")) clearSearchResults();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "/" && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) {
        e.preventDefault();
        searchInput.focus();
      }
    });

    /* Glossaire */
    document.getElementById("btn-glossary").addEventListener("click", function () { toggleGlossary(); });
    var tabSection = document.getElementById("gl-tab-section");
    var tabAll = document.getElementById("gl-tab-all");
    tabSection.addEventListener("click", function () {
      glossaryMode = "section";
      tabSection.classList.add("active");
      tabAll.classList.remove("active");
      tabSection.setAttribute("aria-selected", "true");
      tabAll.setAttribute("aria-selected", "false");
      var s = FG.getSection((location.hash || "#/").replace(/^#\//, ""));
      renderGlossarySection(s);
    });
    tabAll.addEventListener("click", function () {
      glossaryMode = "all";
      tabAll.classList.add("active");
      tabSection.classList.remove("active");
      tabAll.setAttribute("aria-selected", "true");
      tabSection.setAttribute("aria-selected", "false");
      renderGlossaryAll();
    });

    /* Export PDF */
    document.getElementById("btn-export-pdf").addEventListener("click", exportPdf);

    /* Routeur */
    window.addEventListener("hashchange", route);

    /* Progression initiale */
    updateProgressBar();

    /* Glossaire ouvert ? */
    if (store.get("glossary-open", false)) toggleGlossary(true);

    /* Splash 8 s puis démarrage */
    runSplash();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
