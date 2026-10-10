/* ============================================================
   data/securite-2.js — Parcours Sécurité avancée (sections 14 à 16)
   Guide Interactif FortiGate — CFP-CMD / MASTER NMA
   ============================================================ */
(function () {
  "use strict";

  FG.addSections([

    /* ------------------------------------------------ 14 */
    {
      id: "anti-scan-dos",
      track: "securite",
      level: "avance",
      title: "Anti-scan et protection DoS",
      icon: "fa-solid fa-bolt",
      step: "14",
      requires: ["politiques-filtrage"],
      description: "Déployez une politique DoS en amont des politiques normales et durcissez la réponse aux scans de ports et aux déni de service.",
      cliCommands: [
        "# Capteur DoS : seuils TCP SYN par seconde\nconfig ips dos-rule\n    edit \"dos-cfpcmd\"\n        config anomaly\n            edit \"tcp_syn_flood\"\n                set status enable\n                set threshold 2000\n                set log enable\n                set action block\n            next\n            edit \"tcp_portscan\"\n                set status enable\n                set threshold 1000\n                set log enable\n            next\n            edit \"udp_flood\"\n                set status enable\n                set threshold 4000\n            next\n        end\n    next\nend",
        "# Politique DoS attachée à l'interface WAN (avant tout filtrage normal)\nconfig firewall dos-policy\n    edit 1\n        set interface \"wan1\"\n        set srcaddr all\n        set dstaddr all\n        set ips-sensor \"dos-cfpcmd\"\n        set status enable\n    next\nend",
        "# Observer les compteurs d'anomalies\ndiagnose firewall proute list"
      ],
      guiSteps: [
        "<span class='wb-path'>Security Profiles → DoS Policy</span> → Create New → interface wan1.",
        "Ajuster les seuils d'anomalies (tcp_syn_flood, portscan, udp_flood) avec actions block + log.",
        "<span class='wb-path'>Log & Report → Log Settings</span> → vérifier que les événements DoS sont journalisés.",
        "<span class='wb-path'>FortiView → Threats</span> → analyser les sources d'anomalies détectées."
      ],
      diagram: "dos",
      terminology: ["DoS", "DDoS", "SYN flood", "Port scan", "DoS policy", "Anomalie"],
      concepts: [
        { term: "DoS policy", def: "Politique évaluée avant les politiques normales, qui compte les paquets par source et bloque au-delà des seuils d'anomalies." },
        { term: "SYN flood", def: "Attaque saturant la table de connexions TCP avec des SYN sans complétion : les seuils FortiOS la limitent par source." },
        { term: "Port scan", def: "Sondage systématique des ports ouverts d'une cible, préalable classique d'une intrusion." }
      ],
      alerts: [
        { type: "warning", icon: "fa-triangle-exclamation", text: "Des seuils trop bas bloquent des clients légitimes derrière un NAT commun (lycées, cafés) : observez le trafic réel avant de fixer les valeurs." },
        { type: "info", icon: "fa-circle-info", text: "La politique DoS est sans objet derrière un opérateur qui absorbe déjà les attaques volumétriques : elle protège des attaques lentes et des scans." }
      ],
      table: {
        headers: ["Anomalie", "Seuil de départ", "Action", "Commentaire"],
        rows: [
          ["tcp_syn_flood", "2000 pps/source", "Block", "Ajuster selon le trafic du Hotspot"],
          ["tcp_portscan", "1000 pps/source", "Block + log", "Détecte les scans nmap rapides"],
          ["udp_flood", "4000 pps/source", "Block", "Protège les services UDP"],
          ["icmp_flood", "2000 pps/source", "Monitor", "Souvent bruit de fond"]
        ]
      },
      subsections: [
        { title: "Où se place la politique DoS", content: "Contrairement aux politiques de filtrage, la DoS policy s'applique dès l'entrée du paquet sur l'interface, avant toute résolution de session. Elle constitue une première ligne défensive contre les dénis de service par volume et les scans, en comptant par source les paquets anormaux. Sa position en amont la rend très efficace mais très sensible au réglage : mesurez avant de bloquer." },
        { title: "Choisir ses seuils", content: "Observation d'abord : laissez les anomalies en mode monitor une semaine avec les logs activés. Le Hotspot génère naturellement des rafales (fin de cours, mise à jour collective) : les seuils doivent absorber ces pics. Passez ensuite en block les anomalies jamais observées en volume légitime, en gardant les logs pour auditer chaque blocage." },
        { title: "Réponse aux scans", content: "Un scan de ports depuis Internet est inévitable ; la question est de ne rien lui laisser voir. Sans VIP publiée, le deny implicite ne répond pas : le scanner n'obtient aucune information. Avec le port scan détecté par la DoS policy, la source est bloquée avant d'aller plus loin. Les tentatives sur les services publiés sont, elles, couvertes par l'IPS." }
      ]
    },

    /* ------------------------------------------------ 15 */
    {
      id: "durcissement",
      track: "securite",
      level: "avance",
      title: "Durcissement complet (hardening)",
      icon: "fa-solid fa-user-shield",
      step: "15",
      requires: ["anti-brute-force", "anti-scan-dos"],
      description: "Appliquez le guide de durcissement Fortinet : services inutiles désactivés, bannières, réglages de session, redondance et validation finale.",
      cliCommands: [
        "# Désactiver les services d'administration non chiffrés partout\nconfig system global\n    set admin-sport 443\n    set admin-ssh-port 22\n    set admin-s redirect disable\nend",
        "# Bannière légale avant login (dissuasion + cadre juridique)\nconfig system global\n    set pre-login-banner enable\nend\nconfig system banner\n    set pre-login-banner \"Accès réservé au personnel autorisé du CFP-CMD. Toute tentative d'accès non autorisée est journalisée et poursuivie.\"\nend",
        "# Réduire les temporisations de session\nconfig system session-ttl\n    set default 3600\nend",
        "# Désactiver les interfaces administrables inutilement\nconfig system interface\n    edit dmz\n        set allowaccess ping\n    next\n    edit vlan20\n        set allowaccess ping\n    next\nend"
      ],
      guiSteps: [
        "<span class='wb-path'>System → Admin Settings</span> → bannière, port d'administration, lockout.",
        "<span class='wb-path'>System → Feature Visibility</span> → masquer les fonctionnalités non utilisées (réduction de surface).",
        "<span class='wb-path'>Security Fabric → Settings</span> → activer les connexions Fabric utiles uniquement.",
        "Reprendre la checklist <span class='wb-path'>FortiGate Hardening Guide</span> point par point."
      ],
      diagram: "hardening",
      terminology: ["Hardening", "Bannière", "Surface d'attaque", "Session TTL", "FortiGuard hardening guide"],
      concepts: [
        { term: "Hardening", def: "Processus systématique de réduction de la surface d'attaque et de renforcement des réglages par défaut d'un équipement." },
        { term: "Surface d'attaque", def: "Ensemble des points par lesquels un attaquant peut tenter d'entrer : services ouverts, ports exposés, comptes actifs." },
        { term: "Bannière pré-login", def: "Message affiché avant l'authentification rappelant le cadre légal de l'accès à l'équipement." }
      ],
      alerts: [
        { type: "danger", icon: "fa-triangle-exclamation", text: "Un durcissement se teste en environnement de labo d'abord : un réglage trop agressif peut couper l'administration à distance." },
        { type: "warning", icon: "fa-triangle-exclamation", text: "Reprenez le durcissement après chaque montée de version : les nouveaux défauts peuvent rouvrir des services." }
      ],
      table: {
        headers: ["Domaine", "Réglage durci", "Référence CDC"],
        rows: [
          ["Accès admin", "HTTPS+SSH uniquement, trusted hosts, MFA", "§4.1 Sécurité"],
          ["Comptes", "Lockout 3/1800 s, pas de comptes partagés", "§4.1"],
          ["Interfaces", "allowaccess minimal par zone", "§3.2"],
          ["Sessions", "TTL par défaut 3600 s, TCP half-open limités", "§4.2"],
          ["Mises à jour", "Firmware stable + signatures FortiGuard", "§4.4"],
          ["Sauvegardes", "Quotidiennes chiffrées hors équipement", "§2.2.9"]
        ]
      },
      subsections: [
        { title: "Méthode : du guide officiel au contexte local", content: "Le guide de durcissement Fortinet liste des dizaines de réglages ; tous n'ont pas le même poids au CFP-CMD. Traduisez chaque recommandation en action concrète adaptée : trusted hosts sur le VLAN IT, bannière légale, désactivation de Telnet/HTTP, profils UTM actifs sur toutes les politiques accept. Le tableau ci-dessus sert de checklist traçable au CDC." },
        { title: "Réduire pour mieux protéger", content: "Chaque service actif est une porte potentielle : Feature Visibility masque ce qui n'est pas utilisé et évite les activations accidentelles. Les allowaccess par interface sont réduits au strict nécessaire (ping en diagnostic, https+ssh sur le LAN_IT). Le portail captif et les services publiés restent les seules portes ouvertes sur wan1, chacune protégée par un profil." },
        { title: "Maintenir le durcissement", content: "Un hardening n'est jamais terminé : les montées de version, les nouveaux services publiés et l'évolution des menaces le remettent en cause. Planifiez une revue trimestrielle : comparaison show full-configuration vs checklist, test de la procédure de restauration (section 11), revue des comptes et des trusted hosts. La supervision (piste Exploitation) alerte sur les dérives." }
      ]
    },

    /* ------------------------------------------------ 16 */
    {
      id: "sauvegarde-automatique",
      track: "securite",
      level: "intermediaire",
      title: "Sauvegarde automatique (auto-script, SFTP)",
      icon: "fa-solid fa-floppy-disk",
      step: "16",
      requires: ["sauvegarde-restauration"],
      description: "Automatisez la sauvegarde quotidienne de la configuration vers un serveur SFTP avec nommage daté, conformément au CDC (§2.2.9).",
      cliCommands: [
        "# Script automatique quotidien vers SFTP\nconfig system auto-script\n    edit \"backup-auto\"\n        set interval 86400\n        set repeat 0\n        set start auto\n        set script \"execute backup config sftp /backups/fgt-cfpcmd-config.conf 192.168.10.20 mkbackup <MOT_DE_PASSE_SFTP>\"\n    next\nend",
        "# Lancer manuellement pour tester\nexecute auto-script run backup-auto",
        "# Vérifier l'exécution du script\ndiagnose sys autoupdate versions | more\nexecute auto-script list"
      ],
      guiSteps: [
        "<span class='wb-path'>System → Advanced → Automation</span> (ou CLI pour auto-script) → créer la tâche de sauvegarde.",
        "<span class='wb-path'>Security Fabric → Automation → Actions</span> → alternative moderne : trigger scheduled + action CLI.",
        "Vérifier côté serveur SFTP que le fichier arrive et se nomme correctement (rotation côté serveur)."
      ],
      diagram: "backup-auto",
      terminology: ["auto-script", "SFTP", "Rotation", "Automation stitches"],
      concepts: [
        { term: "auto-script", def: "Mécanisme FortiOS exécutant une séquence de commandes CLI à intervalle régulier ou sur déclencheur." },
        { term: "SFTP", def: "Transfert de fichiers over SSH : authentifié et chiffré, recommandé par le CDC pour les sauvegardes." },
        { term: "Rotation", def: "Conservation d'un historique borné de sauvegardes côté serveur (ex. 30 jours) pour couvrir une fenêtre de détection suffisante." }
      ],
      alerts: [
        { type: "warning", icon: "fa-triangle-exclamation", text: "Le mot de passe SFTP apparaît dans la configuration : restreignez la lecture (trusted hosts) et privilégiez une clé dédiée à usage limité." },
        { type: "info", icon: "fa-circle-info", text: "Ajoutez une alerte e-mail (section 29) si la sauvegarde échoue : une sauvegarde silencieusement cassée est pire que pas de sauvegarde." }
      ],
      table: {
        headers: ["Paramètre", "Valeur CFP-CMD", "Justification"],
        rows: [
          ["Fréquence", "Quotidienne (86400 s)", "Exigence CDC §2.2.9"],
          ["Destination", "SFTP 192.168.10.20:/backups", "Chiffré, hors équipement"],
          ["Rétention", "30 rotations côté serveur", "Un mois d'historique"],
          ["Test de restauration", "Mensuel", "Fiabilité de la chaîne"],
          ["Alerte d'échec", "Automation stitch e-mail", "Découverte immédiate"]
        ]
      },
      subsections: [
        { title: "Du manuel à l'automatique", content: "La sauvegarde manuelle (section 11) dépend de la mémoire de l'administrateur ; l'auto-script l'industrialise. Un compte SFTP dédié (mkbackup) ne peut qu'écrire dans /backups : même si le FortiGate est compromis, il ne pourra pas effacer l'historique des sauvegardes. Le nommage daté et la rotation côté serveur complètent le dispositif." },
        { title: "Sécuriser la chaîne de sauvegarde", content: "La configuration contient des secrets (mots de passe, PSK) : le fichier de sauvegarde est aussi sensible que l'équipement. Chiffrez l'archive au repos (serveur SFTP sur volume chiffré), restreignez les droits du compte mkbackup, et journalisez chaque transfert. En cas d'incident, la sauvegarde doit être restaurable sans restaurer les problèmes de sécurité d'hier." },
        { title: "Prouver que ça marche", content: "Un test mensuel : lancer execute auto-script run, vérifier l'arrivée du fichier, puis restaurer la configuration sur le FortiGate-VM du labo (Lab 0). Ce test valide toute la chaîne : script, réseau, compte SFTP, intégrité du fichier. La piste Exploitation ajoute un stitch d'alerte si le script ne s'exécute pas, bouclant la boucle de fiabilité." }
      ]
    }
  ]);
})();
