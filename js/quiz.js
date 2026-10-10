/* ============================================================
   Guide Interactif FortiGate — CFP-CMD / MASTER NMA
   quiz.js — Moteur de quiz (QCM, mélange, score, seuil 70 %)
   API : QuizEngine.render(container, config)
   ============================================================ */
(function (root) {
  "use strict";

  var THRESHOLD = 70;
  var LETTERS = ["A", "B", "C", "D", "E", "F"];

  /* ---------- Stockage protégé (localStorage peut échouer en file://) ---------- */
  var storage = {
    get: function (key, fallback) {
      try {
        var raw = root.localStorage ? root.localStorage.getItem(key) : null;
        return raw === null ? fallback : JSON.parse(raw);
      } catch (e) {
        return fallback;
      }
    },
    set: function (key, value) {
      try {
        if (root.localStorage) root.localStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        /* mode privé / quota : on ignore silencieusement */
      }
    }
  };

  /** Mélange de Fisher-Yates (copie, jamais en place). */
  function shuffle(arr) {
    var out = arr.slice();
    for (var i = out.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = out[i];
      out[i] = out[j];
      out[j] = tmp;
    }
    return out;
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  /**
   * Rend un quiz interactif dans un conteneur.
   * config = {
   *   id:        identifiant stable (mémorisation des scores),
   *   title:     titre affiché,
   *   questions: [ [énoncé, options[], indexCorrect, explication], ... ],
   *   threshold: seuil de réussite en % (défaut 70)
   * }
   */
  function render(container, config) {
    if (!container || !config || !Array.isArray(config.questions) || config.questions.length === 0) {
      return;
    }
    var threshold = typeof config.threshold === "number" ? config.threshold : THRESHOLD;
    var scoreKey = "fg-quiz-" + config.id;
    var scoreMeta = storage.get(scoreKey, null);

    container.textContent = "";
    var body = el("div", "quiz-body");

    var intro = el("p", null, config.questions.length +
      " question(s) à choix multiple. Les questions et les options sont mélangées à chaque tentative. " +
      "Seuil de réussite : " + threshold + " %.");
    intro.style.color = "var(--text-muted)";
    intro.style.fontSize = "0.88rem";
    body.appendChild(intro);

    if (scoreMeta) {
      var hist = el("p", "quiz-score-hist", "Meilleur score : " + scoreMeta.best + " % · " +
        scoreMeta.tries + " tentative(s)");
      body.appendChild(hist);
    }

    var startBtn = el("button", "btn btn-primary");
    startBtn.type = "button";
    startBtn.appendChild(document.createTextNode("Démarrer le quiz "));
    var ico = el("i", "fa-solid fa-play");
    ico.setAttribute("aria-hidden", "true");
    startBtn.appendChild(ico);

    startBtn.addEventListener("click", function () {
      startRound(body, config, threshold, scoreKey);
    });

    body.appendChild(startBtn);
    container.appendChild(body);
  }

  function startRound(body, config, threshold, scoreKey) {
    body.textContent = "";

    var prepared = shuffle(config.questions).map(function (q) {
      var mapping = shuffle(q[1].map(function (_, i) { return i; }));
      return {
        text: q[0],
        options: mapping.map(function (origIdx, pos) {
          return { label: q[1][origIdx], original: origIdx, pos: pos };
        }),
        correctPos: mapping.indexOf(q[2]),
        explanation: q[3]
      };
    });

    var answers = new Array(prepared.length).fill(-1);

    prepared.forEach(function (q, qIdx) {
      var qBox = el("div", "quiz-q");
      var title = el("p", "q-title", (qIdx + 1) + ". " + q.text);
      qBox.appendChild(title);

      var opts = el("div", "quiz-opts");
      opts.setAttribute("role", "radiogroup");
      opts.setAttribute("aria-label", "Question " + (qIdx + 1));

      q.options.forEach(function (opt, oIdx) {
        var btn = el("button", "quiz-opt");
        btn.type = "button";
        btn.setAttribute("role", "radio");
        btn.setAttribute("aria-checked", "false");
        btn.dataset.qidx = String(qIdx);
        btn.dataset.oidx = String(oIdx);

        var letter = el("span", "opt-letter", LETTERS[oIdx] || "?");
        btn.appendChild(letter);
        btn.appendChild(document.createTextNode(opt.label));

        btn.addEventListener("click", function () {
          answers[qIdx] = oIdx;
          Array.prototype.forEach.call(opts.querySelectorAll(".quiz-opt"), function (b) {
            b.classList.remove("selected");
            b.setAttribute("aria-checked", "false");
          });
          btn.classList.add("selected");
          btn.setAttribute("aria-checked", "true");
        });

        opts.appendChild(btn);
      });

      qBox.appendChild(opts);
      body.appendChild(qBox);
    });

    var actions = el("div", "quiz-actions");
    var submit = el("button", "btn btn-primary");
    submit.type = "button";
    submit.textContent = "Valider mes réponses";
    var cancel = el("button", "btn");
    cancel.type = "button";
    cancel.textContent = "Annuler";

    actions.appendChild(submit);
    actions.appendChild(cancel);
    body.appendChild(actions);

    cancel.addEventListener("click", function () {
      render(body.parentNode, config);
    });

    submit.addEventListener("click", function () {
      var unanswered = answers.indexOf(-1);
      if (unanswered !== -1) {
        if (root.App && typeof App.toast === "function") {
          App.toast("Répondez d'abord à la question " + (unanswered + 1) + ".", "warn");
        }
        var qBoxes = body.querySelectorAll(".quiz-q");
        if (qBoxes[unanswered]) {
          qBoxes[unanswered].scrollIntoView({ behavior: "smooth", block: "center" });
        }
        return;
      }
      grade(body, config, threshold, scoreKey, prepared, answers);
    });
  }

  function grade(body, config, threshold, scoreKey, prepared, answers) {
    var score = 0;
    body.querySelectorAll(".quiz-q").forEach(function (qBox, qIdx) {
      var q = prepared[qIdx];
      var buttons = qBox.querySelectorAll(".quiz-opt");
      Array.prototype.forEach.call(buttons, function (btn) {
        var oIdx = Number(btn.dataset.oidx);
        btn.disabled = true;
        if (oIdx === q.correctPos) {
          btn.classList.add("correct");
        } else if (oIdx === answers[qIdx]) {
          btn.classList.add("wrong");
        }
      });
      if (answers[qIdx] === q.correctPos) score++;
      else {
        var expl = el("p", "quiz-expl", "✓ Réponse : " + q.options[q.correctPos].label +
          (q.explanation ? " — " + q.explanation : ""));
        qBox.appendChild(expl);
      }
    });

    var pct = Math.round((score / prepared.length) * 100);
    var passed = pct >= threshold;

    var meta = storage.get(scoreKey, { best: 0, tries: 0 });
    meta.tries = (meta.tries || 0) + 1;
    if (pct > (meta.best || 0)) meta.best = pct;
    storage.set(scoreKey, meta);

    if (root.App && typeof App.toast === "function") {
      App.toast(
        passed ? "Quiz réussi : " + pct + " % !" : "Score : " + pct + " % (seuil " + threshold + " %)",
        passed ? "success" : "error"
      );
    }

    /* Supprime les anciens blocs de résultat avant d'ajouter le nouveau */
    var oldResult = body.querySelector(".quiz-result");
    if (oldResult) oldResult.remove();

    var result = el("div", "quiz-result");
    var big = el("div", "score-big " + (passed ? "score-pass" : "score-fail"), pct + " %");
    result.appendChild(big);
    result.appendChild(el("p", null,
      score + "/" + prepared.length + " — " +
      (passed
        ? "Bravo ! Seuil de " + threshold + " % atteint."
        : "Seuil de " + threshold + " % non atteint, revisez la section puis réessayez.")));
    result.appendChild(el("p", "quiz-score-hist",
      "Meilleur score : " + meta.best + " % · " + meta.tries + " tentative(s)"));

    var actions = el("div", "quiz-actions");
    var retry = el("button", "btn btn-primary");
    retry.type = "button";
    retry.textContent = "Réessayer";
    retry.addEventListener("click", function () {
      render(body.parentNode, config);
    });
    actions.appendChild(retry);
    result.appendChild(actions);

    body.appendChild(result);
    result.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  root.QuizEngine = { render: render, shuffle: shuffle, THRESHOLD: THRESHOLD };

  if (typeof module === "object" && module.exports) {
    module.exports = root.QuizEngine;
  }
})(typeof self !== "undefined" ? self : this);
