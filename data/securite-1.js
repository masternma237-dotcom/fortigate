/* ============================================================
   data/securite-1.js — Parcours Sécurité avancée (sections 11 à 13)
   Guide Interactif FortiGate — CFP-CMD / MASTER NMA
   ============================================================ */
(function () {
  "use strict";

  FG.addSections([

    /* ------------------------------------------------ 11 */
    {
      id: "sauvegarde-restauration",
      track: "securite",
      level: "debutant",
      title: "Sauvegarde et restauration de la configuration",
      icon: "fa-solid fa-box-archive",
      step: "11",
      requires: ["prise-en-main"],
      description: "Maîtrisez les mécanismes de sauvegarde manuelle (GUI, CLI, TFTP) et la procédure de restauration, condition sine qua non avant toute évolution de l'équipement.",
      cliCommands: [
        "# Sauvegarde de la configuration (texte lisible)\nshow full-configuration > sauvegarde-avant-changement.txt",
        "# Sauvegarde vers un serveur TFTP\ndiagnose debug enable\nexecute backup config tftp fgt-cfpcmd-2026-03-01.conf 192.168.10.20",
        "# Restauration depuis TFTP (redémarrage proposé)\nexecute restore config tftp fgt-cfpcmd-2026-03-01.conf 192.168.10.20",
        "# Vérifier l'intégrité après redémarrage\nget system status\nshow system global | grep hostname"
      ],
      guiSteps: [
        "<span class='wb-path'>System → Configuration → Backup</span> → choisir le type (configuration) et enregistrer le fichier .conf.",
        "<span class='wb-path'>System → Configuration → Restore</span> → charger un fichier de sauvegarde.",
        "<span class='wb-path'>System → Configuration Revisions</span> → comparer et restaurer une révision locale."
      ],
      diagram: "backup",
      terminology: ["TFTP", "Configuration revision", "Diff de configuration"],
      concepts: [
        { term: "Fichier .conf", def: "Export texte des commandes de configuration FortiOS : lisible, comparable et restorable." },
        { term: "TFTP", def: "Protocole de transfert simple, sans authentification, à réserver au réseau d'administration uniquement." },
        { term: "Revision", def: "Point de restauration interne conservé par FortiOS, restaurable depuis la GUI même sans serveur externe." }
      ],
      alerts: [
        { type: "danger", icon: "fa-triangle-exclamation", text: "Une restauration écrase TOUTE la configuration courante, y compris les adresses IP d'administration : planifiez l'accès console." },
        { type: "warning", icon: "fa-triangle-exclamation", text: "Une sauvegarde qui n'a jamais été restaurée en test n'est pas une sauvegarde : validez la procédure au moins une fois au labo." }
      ],
      table: {
        headers: ["Étape", "Action", "Commande / chemin GUI"],
        rows: [
          ["1", "Exporter la configuration courante", "execute backup config tftp"],
          ["2", "Stocker hors équipement (SFTP, NAS)", "copie chiffrée recommandée"],
          ["3", "Tester la restauration (labo)", "execute restore config tftp"],
          ["4", "Vérifier l'intégrité", "get system status"],
          ["5", "Documenter la version et la date", "journal des sauvegardes"]
        ]
      },
      subsections: [
        { title: "Avant chaque changement", content: "Toute intervention sur le FortiGate commence par une sauvegarde nommée et datée (fgt-cfpcmd-AAAA-MM-JJ-objet.conf). Le format texte permet un diff précis avec la version précédente : vous voyez exactement ce que la nouvelle configuration modifie. C'est aussi la base du rollback si l'intervention dégrade le service." },
        { title: "Restauration contrôlée", content: "execute restore config pousse la configuration puis propose un redémarrage. Gardez un accès console prêt : si la sauvegarde contient une IP d'administration différente, l'accès GUI/SSH change instantanément. En production, effectuez les restaurations en fenêtre de maintenance avec un second technicien." },
        { title: "Vers l'automatisation", content: "La sauvegarde manuelle protège du geste involontaire, pas de la panne matérielle. La section 16 généralise ce processus avec un auto-script quotidien vers un serveur SFTP, et la piste Exploitation y ajoute journalisation et alertes. L'objectif du CDC : des sauvegardes chiffrées, hors du FortiGate, testées périodiquement." }
      ]
    },

    /* ------------------------------------------------ 12 */
    {
      id: "anti-brute-force",
      track: "securite",
      level: "intermediaire",
      title: "Anti-brute force (lockout, trusted hosts, geo-blocking)",
      icon: "fa-solid fa-user-lock",
      step: "12",
      requires: ["prise-en-main"],
      description: "Neutralisez les attaques par force brute : verrouillage des comptes, restriction des sources d'administration et blocage géographique des pays non attendus.",
      cliCommands: [
        "# Verrouillage après échecs d'authentification admin\nconfig system global\n    set admin-lockout-threshold 3\n    set admin-lockout-duration 1800\nend",
        "# Restriction stricte des sources d'administration\nconfig system admin\n    edit admin\n        set trusthost1 192.168.10.0 255.255.255.0\n    next\nend",
        "# Politique géographique : bloquer les sources exotiques vers le WAN\nconfig firewall address\n    edit \"GEO-BLOQUEES\"\n        set type geography\n        set country \"CN\" \"RU\" \"KP\"\n    next\nend\nconfig firewall policy\n    edit 0\n        set name \"WAN_IN_GEO_DENY\"\n        set srcintf \"WAN\"\n        set dstintf \"WAN\"\n        set srcaddr \"GEO-BLOQUEES\"\n        set dstaddr all\n        set action deny\n        set schedule \"always\"\n        set service ALL\n        set logtraffic all\n    next\nend"
      ],
      guiSteps: [
        "<span class='wb-path'>System → Admin Settings</span> → définir Admin Lockout Threshold et Duration.",
        "<span class='wb-path'>System → Administrators → admin</span> → Trusted Hosts = réseau d'administration uniquement.",
        "<span class='wb-path'>Policy & Objects → Addresses</span> → créer l'objet de type Geography avec les pays à bloquer.",
        "<span class='wb-path'>Security Profiles → FortiGuard</span> → activer le geo-ip-blocking si utilisé dans les profils."
      ],
      diagram: "bruteforce",
      terminology: ["Brute force", "Lockout", "Trusted hosts", "Geo-blocking", "GeoIP"],
      concepts: [
        { term: "Lockout", def: "Verrouillage temporaire du compte après N échecs d'authentification : rend la force brute économiquement inefficace." },
        { term: "Geo-blocking", def: "Refus systématique du trafic provenant de pays avec lesquels l'organisation n'a aucun échange légitime." },
        { term: "GeoIP", def: "Base FortiGuard associant chaque adresse IP à un pays, utilisée par les objets de type geography." }
      ],
      alerts: [
        { type: "warning", icon: "fa-triangle-exclamation", text: "Testez toujours le lockout depuis un second compte admin : ne vous enfermez pas dehors en production." },
        { type: "info", icon: "fa-circle-info", text: "Le VPN SSL exposé sur wan1 reçoit un flot constant de tentatives : surveillez les logs et gardez le lockout actif." }
      ],
      table: {
        headers: ["Vecteur d'attaque", "Contre-mesure", "Paramètre"],
        rows: [
          ["Force brute sur admin GUI/SSH", "Lockout", "threshold 3, duration 1800 s"],
          ["Connexion admin depuis Internet", "Trusted hosts", "192.168.10.0/24 uniquement"],
          ["Scans de pays exotiques", "Geo-blocking", "objets geography + politique deny"],
          ["Force brute SSL-VPN", "Lockout + MFA", "FortiToken sur les comptes VPN"]
        ]
      },
      subsections: [
        { title: "Comprendre la menace", content: "Tout service exposé sur wan1 (HTTPS admin, SSL-VPN) reçoit en continu des tentatives d'identification automatisées. Ces attaques combinent dictionnaires et credential stuffing : un mot de passe faible finit toujours par céder. Les contre-mesures sont cumulatives : limiter qui peut tenter (trusted hosts), ralentir l'attaquant (lockout) et éliminer la source (geo-blocking)." },
        { title: "Réglages recommandés", content: "Un seuil de 3 échecs pour 30 minutes de verrouillage suffit à dissuader sans pénaliser les utilisateurs distraints. Les trusted hosts constituent la mesure la plus efficace : un admin non joignable depuis Internet ne peut simplement pas être attaqué. Documentez ces réglages dans le dossier de durcissement du CDC." },
        { title: "Surveillance et ajustement", content: "Les logs d'échec d'authentification (type event, subtype admin) alimentent la section Exploitation : alertes e-mail sur les lockouts répétés, tableaux de bord Zabbix sur les sources. Un pic soudain de tentatives depuis un pays non bloqué est un signal : enrichissez l'objet GEO-BLOQUEES ou resserrez les trusted hosts." }
      ]
    },

    /* ------------------------------------------------ 13 */
    {
      id: "policies-avancees",
      track: "securite",
      level: "avance",
      title: "Politiques avancées (DoH, DoT, certificats)",
      icon: "fa-solid fa-file-shield",
      step: "13",
      requires: ["politiques-filtrage"],
      description: "Traitez les flux qui échappent au filtrage classique : DNS chiffré (DoH/DoT), objets FQDN dans les politiques et gestion des certificats FortiOS.",
      cliCommands: [
        "# Empêcher le contournement par DNS chiffré : bloquer les résolveurs DoH/DoT publics\nconfig firewall address\n    edit \"DOH-DOT-BLOCKLIST\"\n        set type fqdn\n        set fqdn \"dns.google\"\n    next\n    edit \"DOH-PORTS\"\n        set type fqdn\n    next\nend",
        "# Objet FQDN dans une politique : autoriser un dépôt de mises à jour\nconfig firewall address\n    edit \"MAJ-EDITEUR\"\n        set type fqdn\n        set fqdn \"updates.editeur.com\"\n    next\nend\nconfig firewall policy\n    edit 0\n        set name \"LAN_IT_to_MAJ\"\n        set srcintf \"LAN_IT\"\n        set dstintf \"WAN\"\n        set srcaddr all\n        set dstaddr \"MAJ-EDITEUR\"\n        set action accept\n        set schedule \"always\"\n        set service HTTPS\n        set nat enable\n    next\nend",
        "# Générer un certificat local (portail, GUI)\nconfig vpn certificate local\n    edit \"FGT-CFPCMD-2026\"\n        set source user\n        set cn \"fgt.cfp-cmd.local\"\n        set acme-domain \"fgt.cfp-cmd.local\"\n    next\nend"
      ],
      guiSteps: [
        "<span class='wb-path'>Policy & Objects → Addresses</span> → Create New → type FQDN, saisir le domaine.",
        "<span class='wb-path'>Security Profiles → SSL/SSH Inspection</span> → adapter le profil (deep-inspection, exempt-list).",
        "<span class='wb-path'>System → Certificates</span> → générer ou importer des certificats locaux/CA.",
        "<span class='wb-path'>Security Profiles → DNS Filter</span> → profil bloquant les catégories de résolveurs DoH publics."
      ],
      diagram: "doh-dot",
      terminology: ["DoH", "DoT", "FQDN", "CA", "Certificat", "Inspection SSL"],
      concepts: [
        { term: "DoH", def: "DNS over HTTPS : résolution DNS encapsulée dans HTTPS (port 443), invisible pour un filtrage DNS naïf." },
        { term: "DoT", def: "DNS over TLS : résolution DNS chiffrée sur le port 853, même objectif de confidentialité que DoH." },
        { term: "Objet FQDN", def: "Adresse logique résolue par le FortiGate et réévaluée périodiquement, pratique pour les destinations sans IP fixe." }
      ],
      alerts: [
        { type: "danger", icon: "fa-triangle-exclamation", text: "Un client qui force DoH vers un résolveur externe échappe au DNS Filter : bloquez les résolveurs publics connus et imposez le DNS interne." },
        { type: "warning", icon: "fa-triangle-exclamation", text: "L'inspection profonde déchiffre le HTTPS : informez les utilisateurs et documentez l'exemption des flux sensibles (banque, santé)." }
      ],
      table: {
        headers: ["Flux à maîtriser", "Risque", "Contre-mesure"],
        rows: [
          ["DoH vers dns.google/Cloudflare", "Contournement du DNS Filter", "Objet FQDN + DNS Filter + blocage 443 ciblé"],
          ["DoT port 853", "Idem", "Service custom deny dans les politiques"],
          ["Sites de tunneling VPN", "Sortie non contrôlée", "Application Control (catégorie proxy)"],
          ["Certificats internes expirés", "Erreurs navigateur, portails", "Renouvellement planifié, CA interne"]
        ]
      },
      subsections: [
        { title: "Le DNS chiffré, angle mort du filtrage", content: "Les navigateurs modernes proposent DoH par défaut : la résolution passe en HTTPS vers un résolveur public, échappant à toute politique DNS classique. Au CFP-CMD, le DNS Filter doit donc aussi connaître et bloquer les résolveurs DoH/DoT publics (catégories et objets FQDN), tandis que les politiques garantissent que seul le DNS interne est joignable depuis les zones clients." },
        { title: "Les objets FQDN en politique", content: "Un objet FQDN remplace une adresse IP : FortiOS le résout et maintient les entrées à jour. C'est idéal pour autoriser un service cloud précis sans ouvrir tout l'Internet, ou pour exécuter une liste noire dynamique (résolveurs DoH). La contrepartie : la résolution dépend du DNS configuré sur le FortiGate, à surveiller en cas de panne amont." },
        { title: "Certificats et inspection", content: "Le FortiGate embarque une CA d'inspection qui signe à la volée les certificats lors d'une inspection profonde. Les postes gérés doivent faire confiance à cette CA (déploiement GPO/MDM). Pour les équipements non gérés (Hotspot), restez en certificate-inspection : pas de déchiffrement, donc pas de certificat à déployer, mais un contrôle applicatif réduit." }
      ]
    }
  ]);
})();
