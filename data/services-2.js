/* ============================================================
   data/services-2.js — Parcours Services réseau (sections 20 à 22)
   Guide Interactif FortiGate — CFP-CMD / MASTER NMA
   ============================================================ */
(function () {
  "use strict";

  FG.addSections([

    /* ------------------------------------------------ 20 */
    {
      id: "dhcp-avance",
      track: "services",
      level: "avance",
      title: "DHCP avancé (relais, options 42/66/121)",
      icon: "fa-solid fa-sitemap",
      step: "20",
      requires: ["dhcp"],
      description: "Étendez le DHCP au-delà du FortiGate : relais vers un serveur central, options spécialisées pour la téléphonie, les AP et le routage par classes.",
      cliCommands: [
        "# Relais DHCP : le FortiGate transmet vers le serveur central\nconfig system interface\n    edit vlan30\n        set ip 192.168.30.1 255.255.255.0\n        set alias " + "\"TELEPHONIE\"" + "\n    next\nend\nconfig system dhcp-server ... (aucun ici)\nconfig system interface\n    edit vlan30\n        set dhcp-relay-service enable\n        set dhcp-relay-ip1 192.168.10.20\n    next\nend",
        "# Options spécialisées : NTP (42) et TFTP (66) pour les téléphones IP\nconfig system dhcp server\n    edit 1\n        set options 42,66\n        config options\n            edit 1\n                set option 42\n                set value " + "192.168.10.1" + "\n            next\n            edit 2\n                set option 66\n                set value \"192.168.10.20\"\n            next\n        end\n    next\nend",
        "# Option 121 : routes classless poussées aux clients\nconfig system dhcp server\n    edit 1\n        config options\n            edit 3\n                set option 121\n                set type hex\n                set value 1810C0A828\n            next\n        end\n    next\nend"
      ],
      guiSteps: [
        "<span class='wb-path'>Network → Interfaces</span> → sur l'interface cible, activer DHCP Relay et renseigner le serveur.",
        "<span class='wb-path'>Network → DHCP Server → Advanced</span> → ajouter les options 42 (NTP), 66 (TFTP), 121 (routes).",
        "<span class='wb-path'>Network → DHCP Server → Leases</span> → vérifier les baux et les options reçues côté client."
      ],
      diagram: "dhcp-avance",
      terminology: ["Relais DHCP", "Option DHCP", "Option 42", "Option 66", "Option 121"],
      concepts: [
        { term: "Relais DHCP", def: "Le FortiGate transmet les requêtes DHCP d'un segment sans serveur vers un serveur central, en les identifiant par giaddr." },
        { term: "Option 42", def: "Option DHCP indiquant l'adresse du (des) serveur(s) NTP aux clients." },
        { term: "Option 121", def: "Routes classless poussées au client : il apprend des routes vers des réseaux distants sans configuration manuelle." }
      ],
      alerts: [
        { type: "warning", icon: "fa-triangle-exclamation", text: "Relais et serveur local sont exclusifs sur une même interface : choisissez l'un ou l'autre par segment." },
        { type: "info", icon: "fa-circle-info", text: "Testez chaque option avec un client réel (téléphone IP, AP) : les implémentations varient selon les fabricants." }
      ],
      table: {
        headers: ["Option", "Usage", "Valeur CFP-CMD"],
        rows: [
          ["3 / Routeur", "Passerelle par défaut", "Automatique (default-gateway)"],
          ["6 / DNS", "Résolveurs", "192.168.10.1 puis 8.8.8.8"],
          ["42 / NTP", "Synchronisation horaire", "192.168.10.1"],
          ["66 / TFTP", "Autoprovisioning téléphones", "192.168.10.20"],
          ["121 / Classless routes", "Routes supplémentaires", "Réseau téléphonie via 192.168.30.0"]
        ]
      },
      subsections: [
        { title: "Le relais DHCP", content: "Quand un serveur DHCP central (Windows Server, par exemple) gère plusieurs segments, le FortiGate joue le rôle de relais : il capte les requêtes broadcast du segment, les transmet en unicast au serveur et lui renvoie la réponse. Le serveur reconnaît le segment grâce au champ giaddr et loue une adresse de l'étendue correspondante. Ce modèle centralise la gestion des baux tout en gardant le FortiGate en coupure." },
        { title: "Options qui automatisent", content: "Les options DHCP suppriment la configuration manuelle des périphériques : option 42 pour l'heure (téléphones, caméras), option 66 pour le serveur de provisioning des téléphones IP, option 121 pour pousser des routes vers les réseaux spécialisés. Le FortiGate devient ainsi un vrai service d'infrastructure, pas seulement un firewall." },
        { title: "Cas concret CFP-CMD", content: "Le VLAN téléphonie (ex. VLAN 30) n'a pas de serveur local : le relais transmet vers 192.168.10.20. Les téléphones reçoivent en même bail : IP du VLAN 30, NTP via l'option 42, serveur TFTP via l'option 66. Résultat : un téléphone déballé s'enregistre tout seul. Cette mécanique est réutilisée dans le Lab 1." }
      ]
    },

    /* ------------------------------------------------ 21 */
    {
      id: "qos-base",
      track: "services",
      level: "intermediaire",
      title: "QoS : trafic shaping de base",
      icon: "fa-solid fa-gauge-high",
      step: "21",
      requires: ["politiques-filtrage"],
      description: "Priorisez les flux essentiels et contenir les gourmands : shapers partagés, garant de bande passante et application aux politiques de filtrage.",
      cliCommands: [
        "# Shaper partagé : plafonner le Hotspot à 40 Mb/s\nconfig firewall shaper traffic-shaper\n    edit \"SHAPER-HOTSPOT\"\n        set guaranteed-bandwidth 2048\n        set maximum-bandwidth 40960\n        set priority medium\n        set per-policy enable\n    next\nend",
        "# Shaper inversé (trafic descendant)\nconfig firewall shaper traffic-shaper\n    edit \"SHAPER-HOTSPOT-DOWN\"\n        set guaranteed-bandwidth 4096\n        set maximum-bandwidth 81920\n        set priority medium\n        set per-policy enable\n    next\nend",
        "# Application dans la politique HOTSPOT → WAN\nconfig firewall policy\n    edit 2\n        set traffic-shaper \"SHAPER-HOTSPOT\"\n        set traffic-shaper-reverse \"SHAPER-HOTSPOT-DOWN\"\n    next\nend",
        "# Observer le trafic shaping\ndiagnose firewall shaper traffic-shaper stats\nexecute firewall shaper traffic-shaper list"
      ],
      guiSteps: [
        "<span class='wb-path'>Policy & Objects → Traffic Shapers</span> → Create New → bandwidth garantie/max, priorité.",
        "<span class='wb-path'>Policy & Objects → Traffic Shaping Policy</span> → associer shaper et classes de trafic.",
        "<span class='wb-path'>Policy & Objects → Firewall Policy</span> → Traffic Shaping → sélectionner les shapers montée/descente.",
        "<span class='wb-path'>FortiView → Bandwidth Control</span> → observer l'effet des shapers en charge."
      ],
      diagram: "qos",
      terminology: ["QoS", "Traffic shaping", "Shaper", "Bande passante garantie", "Priorité"],
      concepts: [
        { term: "Traffic shaping", def: "Limitation / priorisation du débit par flux selon des shapers appliqués dans les politiques." },
        { term: "Guaranteed bandwidth", def: "Débit minimum réservé à un flux : la QoS garantit ce plancher si la liaison est saturée." },
        { term: "Maximum bandwidth", def: "Plafond de débit d'un flux : empêche un usage de monopoliser la liaison." }
      ],
      alerts: [
        { type: "warning", icon: "fa-triangle-exclamation", text: "Le shaping s'applique au trafic sortant du FortiGate : un shaper « montée » agit sur wan1, la « descente » doit être prise en charge au mieux (ou par l'opérateur)." },
        { type: "info", icon: "fa-circle-info", text: "Mettez d'abord en place des compteurs (FortiView) : on ne priorise bien que ce qu'on a mesuré." }
      ],
      table: {
        headers: ["Flux", "Shaper", "Garanti", "Maximum", "Priorité"],
        rows: [
          ["Administration (LAN_IT)", "aucun", "—", "—", "high"],
          ["VPN SSL (télétravail)", "SHAPER-VPN", "1 Mb/s", "10 Mb/s", "high"],
          ["Hotspot apprenants", "SHAPER-HOTSPOT", "2 Mb/s", "40 Mb/s", "medium"],
          ["Sauvegardes vers site B", "SHAPER-BACKUP", "—", "8 Mb/s", "low"]
        ]
      },
      subsections: [
        { title: "Pourquoi façonner le trafic", content: "La liaison Internet du CFP-CMD est une ressource partagée : sans règles, un téléchargement collectif au Hotspot peut couler la visioconférence d'une formation à distance. La QoS garantit un plancher aux flux métier et plafonne les usages publics. C'est un compromis équitable, visible et ajustable, bien plus efficace qu'un blocage arbitraire." },
        { title: "Shapers partagés et priorités", content: "Un shaper partagé cumule le trafic de toutes les politiques qui l'utilisent : SHAPER-HOTSPOT plafonne l'ensemble du Hotspot à 40 Mb/s tout en garantissant 2 Mb/s. La priorité départage les flux quand la liaison sature : les paquets high passent d'abord. per-policy enable évite que le shaper soit compté par session plutôt que par politique." },
        { title: "Mesurer avant, vérifier après", content: "FortiView Bandwidth et diagnose firewall shaper traffic-shaper stats montrent l'usage réel par shaper. Testez en conditions réelles : générez une charge au Hotspot et vérifiez que la formation à distance conserve son débit. Ajustez les valeurs par itérations courtes, documentez chaque changement dans le journal d'exploitation." }
      ]
    },

    /* ------------------------------------------------ 22 */
    {
      id: "qos-avance",
      track: "services",
      level: "avance",
      title: "QoS avancé (per-IP shaper, priorités)",
      icon: "fa-solid fa-sliders",
      step: "22",
      requires: ["qos-base"],
      description: "Affinez la maîtrise des flux : shapers par adresse IP pour équité entre apprenants, classes de trafic et priorisation par application.",
      cliCommands: [
        "# Per-IP shaper : 4 Mb/s par apprenant maximum\nconfig firewall shaper per-ip-shaper\n    edit \"PERSIP-HOTSPOT\"\n        set max-concurrent-session 200\n        set bandwidth-per-unit 4194304\n        set maximum-bandwidth 4096\n        set maximum-concurrent-connection 100\n    next\nend",
        "# Classes de trafic et priorisation applicative\nconfig firewall class-id\n    edit 131072\n        set class-name \"visio\"\n    next\nend\nconfig application list\n    edit \"APPCTRL-QOS\"\n        config entries\n            edit 1\n                set application 15893\n                set action pass\n                set class 131072\n            next\n        end\n    next\nend",
        "# Politique de shaping dédiée (traffic shaping policy)\nconfig firewall shaping-policy\n    edit 1\n        set name " + "\"PRIORISE-VISIO\"" + "\n        set srcintf \"LAN_IT\"\n        set dstintf \"WAN\"\n        set srcaddr all\n        set dstaddr all\n        set service ALL\n        set class-id 131072\n    next\nend"
      ],
      guiSteps: [
        "<span class='wb-path'>Policy & Objects → Per-IP Shapers</span> → Create New → débit max par adresse.",
        "<span class='wb-path'>Policy & Objects → Traffic Shaping Policy</span> → règle prioritaire pour la visio (classe).",
        "<span class='wb-path'>Security Profiles → Application Control</span> → classer les applications critiques.",
        "<span class='wb-path'>FortiView → Applications</span> → identifier les applications qui consomment la bande passante."
      ],
      diagram: "qos-avance",
      terminology: ["Per-IP shaper", "Class ID", "Shaping policy", "Équité"],
      concepts: [
        { term: "Per-IP shaper", def: "Shaper appliqué individuellement à chaque adresse IP source : une adresse ne peut pas consommer la part des autres." },
        { term: "Class ID", def: "Étiquette de classe attribuée à un flux (par application, service ou politique) pilotant sa priorité d'émission." },
        { term: "Shaping policy", def: "Règle qui applique shapers et classes selon critères avancés (application, utilisateur, groupe), indépendamment des politiques de filtrage." }
      ],
      alerts: [
        { type: "warning", icon: "fa-triangle-exclamation", text: "Le per-IP shaper ne distingue pas les utilisateurs derrière un NAT : sur le Hotspot captif, une IP = un utilisateur, c'est le bon contexte." },
        { type: "info", icon: "fa-circle-info", text: "Le contrôle applicatif en mode pass (classer sans bloquer) est le mode le plus adapté à la QoS : on observe puis on priorise." }
      ],
      table: {
        headers: ["Besoin", "Mécanisme", "Réglage type"],
        rows: [
          ["Équité entre apprenants", "Per-IP shaper", "4 Mb/s max par IP"],
          ["Visio toujours fluide", "Class ID + shaping policy", "classe visio prioritaire"],
          ["Limiter le P2P", "Application Control", "catégorie P2P → shaper bas"],
          ["Réserver au VPN admin", "Shaper dédié garanti", "1-10 Mb/s high"]
        ]
      },
      subsections: [
        { title: "Équité : un shaper par apprenant", content: "Le shaper partagé de la section 21 plafonne le Hotspot globalement : un seul apprenant peut encore monopoliser les 40 Mb/s. Le per-IP shaper applique la limite à chaque adresse : 4 Mb/s max par appareil, 100 connexions concurrentes. Le Hotspot captif étant un appareil = une IP authentifiée, l'équité devient réelle et mesurable." },
        { title: "Prioriser par application", content: "Application Control identifie les flux au-delà des ports : la visioconférence (classée dans une Class ID) peut être priorisée où qu'elle passe, tandis que P2P et streaming sont dirigés vers un shaper bas ou bloqués. La shaping policy lie ces critères aux classes sans toucher aux politiques de filtrage : la QoS devient un réglage d'exploitation, pas de sécurité." },
        { title: "Piloter la QoS par la mesure", content: "FortiView Applications classe les applications par consommation ; les stats de shapers montrent l'effet des réglages. Boucle d'amélioration : mesurer, prioriser les flux métier, plafonner les gourmands, re-mesurer. Documentez la politique QoS finale dans le dossier d'exploitation : elle fait partie des engagements de service du centre." }
      ]
    }
  ]);
})();
