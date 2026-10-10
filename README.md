# Guide Interactif FortiGate — CFP-CMD / MASTER NMA

Guide d'apprentissage **HTML/CSS/JS 100 % statique** pour la configuration d'un pare-feu
FortiGate, équivalent structurel et technique du guide MikroTik existant, adapté à
l'écosystème Fortinet (FortiOS 7.x).

**Projet :** Infrastructure de sécurité périmétrique pour le CFP-CMD
**Public :** étudiants MASTER NMA — Infrastructure & Sécurité Réseaux
**Langue :** français (terminologie technique Fortinet en anglais)

---

## Démarrage rapide

```bash
# 1. Ouvrir directement (mode file://, sans service worker)
index.html

# 2. Ou servir en HTTP (PWA active)
python3 -m http.server 8080
# → http://localhost:8080

# 3. Générer le service worker après toute modification de fichiers
node tools/build-sw.js

# 4. Valider les données pédagogiques
node tools/validate.js

# 5. Tester le générateur CLI (cas hostiles inclus)
node tools/test-generator.js
```

L'application démarre par un **splash screen d'environ 8 secondes** simulant le
démarrage FortiOS (skippable par le bouton, la touche Entrée/Échap ou un clic).

---

## Architecture des fichiers

```
index.html            Point d'entrée (CSP stricte, splash, accessibilité)
sw.js                 Service worker — GÉNÉRÉ par tools/build-sw.js
site.webmanifest      Manifest PWA
assets/               Favicon et icônes PWA
css/styles.css        Thème sombre/clair par variables CSS
js/
  registry.js         Registre global FG (tracks, sections, glossaire, quiz, outils)
  app.js              Moteur SPA (navigation, recherche, progression, glossaire…)
  diagrams.js         Helpers SVG (svgBox, svgArrow, svgArrowRed, svgLine, svgWrap)
  quiz.js             Moteur de quiz (mélange, score, seuil 70 %)
  tools/
    cli-generator.js  Générateur de configuration FortiOS avec validation stricte
data/
  core.js             Parcours Socle (00-10) + enregistrement des 6 tracks
  securite-1/2.js     Sécurité avancée (11-16)
  services-1/2.js     Services réseau (17-22)
  interconnexion-1/2.js  VPN & interconnexion (23-27, 33-34)
  exploitation-1/2.js Exploitation & automatisation (28-32)
  labs.js             Labs & évaluation (36-40)
  glossary-*.js       Glossaire (214 termes)
  diagrams-*.js       40 diagrammes SVG inline
  quiz-*.js           200 questions de quiz (5 par section, minimum requis)
tools/
  build-sw.js         Génération du service worker
  validate.js         Validation des données (IDs, prérequis, glossaire, quiz…)
  test-generator.js   Tests du générateur CLI (44 cas, hostiles inclus)
```

---

## Ajouter une section

1. **Choisir le fichier data** selon le parcours (ex. `data/securite-2.js`).
2. **Écrire la section** :

```javascript
FG.addSections([{
  id: "nouvelle-section",        // kebab-case, unique, jamais réutilisé
  track: "securite",             // track existante (registry : FG.tracks)
  level: "intermediaire",        // debutant | intermediaire | avance | tous
  title: "Titre clair",
  icon: "fa-solid fa-shield-halved",
  step: "17",                    // étape unique dans tout le guide
  requires: ["durcissement"],    // sections existantes ET antérieures
  description: "1 à 2 phrases d'introduction.",
  cliCommands: ["# Commentaire\nconfig system global\n    set hostname FGT\nend"],
  guiSteps: ["<span class='wb-path'>System → Settings</span> → …"],
  diagram: "mon-schema",         // id enregistré via FG.addDiagrams
  terminology: ["Hardening"],    // termes définis dans le glossaire
  concepts: [{ term: "X", def: "Définition…" }],
  alerts: [{ type: "warning", icon: "fa-triangle-exclamation", text: "…" }],
  table: { headers: ["A", "B"], rows: [["1", "2"]] },
  subsections: [{ title: "Sous-titre", content: "3-5 phrases…" }]
}]);
```

3. **Ajouter son quiz** (≥ 5 questions, index de bonne réponse valide) dans le
   fichier `quiz-*.js` du parcours :

```javascript
FG.addQuiz({
  "nouvelle-section": [
    ["Question ?", ["A", "B", "C", "D"], 0, "Explication de la bonne réponse."]
  ]
});
```

4. **Ajouter les termes** de `terminology` dans un fichier `glossary-*.js`.
5. **Ajouter le diagramme** `mon-schema` dans un fichier `diagrams-*.js`
   (helpers globaux : `svgBox(x,y,w,h,fill,stroke,label)`, `svgArrow(...)`,
   `svgArrowRed(...)`, `svgLine(...)`, enveloppé par `svgWrap(w,h,inner)`).
6. **Valider et régénérer le service worker** :

```bash
node tools/validate.js && node tools/build-sw.js
```

`validate.js` refuse toute section dont le prérequis n'existe pas ou n'est pas
antérieur, tout terme absent du glossaire, tout diagramme manquant, toute
section avec moins de 5 questions de quiz.

---

## Le générateur de configuration (section 32)

`js/tools/cli-generator.js` produit un script CLI FortiOS complet depuis un
formulaire. Validations appliquées :

| Règle | Détail |
|---|---|
| Listes blanches | hostname `[A-Za-z0-9-]`, utilisateur, SSID : caractères limités, longueur bornée |
| IP / CIDR | IPv4 stricte (octets 0-255, pas de zéro non significatif), notation réseau uniquement (bits d'hôte à zéro) |
| Chevauchements | LAN_IT / HOTSPOT / DMZ comparés par masque — refus si recouvrement |
| Secrets | 12 caractères minimum si fournis |
| Injections | `; " $ ? \` \\ { }` et retours à la ligne refusés sur les champs texte |
| Secrets échappés | `\\` → `\\\\`, `"` → `\"`, `$` → `\$` dans les chaînes quotées |
| Champ vide | placeholder **non quoté** visible (`<MOT_DE_PASSE_FORT>`) |

Le script généré commence par un bandeau « À RELIRE avant import » et se termine
par un rappel de sauvegarde. Tests : `node tools/test-generator.js` (44 tests).

---

## Sécurité du code

- **CSP stricte** : `script-src 'self' https://cdnjs.cloudflare.com` — aucun
  script inline, aucun `onclick=` ; tous les gestionnaires via `addEventListener`.
- Recherche avec échappement regex (`escapeRegExp`) et rendu échappé (`escHtml`)
  avant surlignage ; seule la donnée du guide (fichiers internes) est injectée.
- `localStorage` protégé (`safeStorage`) : toutes les écritures sont try/catch.
- Aucun secret en dur : le générateur ne stocke rien et n'envoie rien.

## Fonctionnalités du moteur

- Navigation par parcours repliables, filtre de niveau, badges (track/niveau/étape)
- Recherche instantanée (sections + glossaire, surlignage des correspondances)
- Progression (barre + sections visitées mémorisées), reprise de lecture
- Copie CLI par bloc, glossaire contextuel (panneau droit, onglets Section / Tout)
- Quiz par section + quiz final (mélange, scores mémorisés, seuil 70 %)
- Checklists de labs mémorisées, thème sombre/clair, toasts, export PDF (fallback
  si popup bloquée), PWA hors ligne (service worker généré)

## Accessibilité

- Skip-link, focus visible, navigation clavier (`/` recherche, `Échap` ferme,
  `Entrée/Échap` passe le splash)
- Rôles et libellés ARIA (`aria-expanded`, `aria-pressed`, `role="tab"`,
  `aria-live` pour les quiz et toasts)
- Contrastes vérifiés sur les deux thèmes, respect de `prefers-reduced-motion`
