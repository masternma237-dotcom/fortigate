/* ============================================================
   data/services-1.js — Parcours Services réseau (sections 17 à 19)
   Guide Interactif FortiGate — CFP-CMD / MASTER NMA
   ============================================================ */
(function () {
  "use strict";

  FG.addSections([

    /* ------------------------------------------------ 17 */
    {
      id: "nat-avance",
      track: "services",
      level: "intermediaire",
      title: "NAT avancé (VIP, IP pool, central NAT)",
      icon: "fa-solid fa-shuffle",
      step: "17",
      requires: ["nat-vip"],
      description: "Allez au-delà du masquerade : IP pools pour les sources, VIP multiples pour la DMZ et NAT centralisé pour simplifier la maintenance des politiques.",
      cliCommands: [
        "# IP pool : donner une IP publique dédiée au serveur de sauvegarde\nconfig firewall ippool\n    edit \"POOL-ADMIN\"\n        set type overload\n        set startip 203.0.113.11\n        set endip 203.0.113.11\n    next\nend\nconfig firewall policy\n    edit 0\n        set name \"LAN_IT_to_BACKUP_NATDEDIE\"\n        set srcintf \"LAN_IT\"\n        set dstintf \"WAN\"\n        set srcaddr all\n        set dstaddr \"RESEAU-SITE-B\"\n        set action accept\n        set schedule \"always\"\n        set service ALL\n        set nat enable\n        set ippool enable\n        set poolname \"POOL-ADMIN\"\n    next\nend",
        "# VIP 1:1 (one-to-one) : la DMZ publie une IP publique entière\nconfig firewall vip\n    edit \"VIP_WEB_1TO1\"\n        set extip 203.0.113.12\n        set mappedip 192.168.30.10\n        set type static-nat\n        set extintf \"wan1\"\n    next\nend",
        "# Central NAT : séparer la traduction des politiques\nconfig system settings\n    set central-nat enable\nend\nconfig firewall central-snat-map\n    edit 1\n        set srcintf \"LAN_IT\"\n        set dstintf \"WAN\"\n        set orig-addr all\n        set dst-addr all\n    next\nend"
      ],
      guiSteps: [
        "<span class='wb-path'>Policy & Objects → IP Pools</span> → Create New → type overload, plage publique.",
        "<span class='wb-path'>Policy & Objects → Virtual IPs</span> → VIP de type Static NAT (1:1) pour la DMZ.",
        "<span class='wb-path'>System → Feature Visibility → Central NAT</span> → activer puis utiliser SNAT/DNAT maps.",
        "<span class='wb-path'>Policy & Objects → Firewall Policy</span> → lier le pool à la politique concernée (NAT Pool)."
      ],
      diagram: "nat-avance",
      terminology: ["IP pool", "Overload", "Static NAT", "Central NAT", "SNAT", "DNAT"],
      concepts: [
        { term: "IP pool", def: "Plage d'adresses publiques utilisables comme adresse source NAT, permettant de différencier les flux sortants." },
        { term: "Static NAT (1:1)", def: "Correspondance bijective entre une IP publique et une IP privée : tous les ports sont redirigés vers la machine mappée." },
        { term: "Central NAT", def: "Mode FortiOS où la traduction est définie dans des tables dédiées (SNAT/DNAT) séparées des politiques de filtrage." }
      ],
      alerts: [
        { type: "warning", icon: "fa-triangle-exclamation", text: "Le central NAT change la logique de toutes les politiques existantes : ne l'activez pas à chaud sur une production déjà configurée." },
        { type: "info", icon: "fa-circle-info", text: "L'IP pool exige que le FAI route ces adresses vers votre wan1 : vérifiez ce point avant de configurer." }
      ],
      table: {
        headers: ["Besoin", "Mécanisme", "Exemple CFP-CMD"],
        rows: [
          ["Sortir à plusieurs derrière 1 IP", "Masquerade (PAT)", "LAN_IT et HOTSPOT vers wan1"],
          ["IP source dédiée par flux", "IP pool overload", "Sauvegardes vers le site B"],
          ["Serveur avec IP publique entière", "VIP static-nat", "Serveur web DMZ"],
          ["Ports précis d'un serveur", "VIP portforward", "HTTP/HTTPS uniquement"],
          ["Séparer filtrage et traduction", "Central NAT", "Évolutions massives simplifiées"]
        ]
      },
      subsections: [
        { title: "Quand le masquerade ne suffit plus", content: "Le masquerade sort tout le monde derrière l'IP de wan1 : impossible de distinguer le serveur de sauvegarde d'un poste étudiant côté site distant. L'IP pool résout ce cas : le flux LAN_IT vers le site B sort avec l'IP 203.0.113.11, autorisée explicitement par le firewall distant. C'est aussi une technique de réputation (une IP propre pour les flux sensibles)." },
        { title: "Publier plus : VIP 1:1 et multi-ports", content: "La VIP portforward de la section Socle expose des ports précis ; la VIP static-nat expose l'intégralité d'une adresse publique vers un serveur. Elle simplifie les protocoles à ports dynamiques (FTP actif, visio) mais élargit la surface : l'IPS et une politique stricte deviennent obligatoires. Une VIP par service reste la bonne pratique par défaut." },
        { title: "Central NAT : pour quel projet ?", content: "En central NAT, les politiques décrivent uniquement l'autorisation, et les tables SNAT/DNAT décrivent la traduction. Pour une infrastructure qui évolue beaucoup (nouvelles IP publiques, réorganisation DMZ), ce découpage évite de réécrire chaque politique. Pour le socle CFP-CMD, le NAT classique par politique reste plus simple : activez central NAT seulement si le besoin est démontré." }
      ]
    },

    /* ------------------------------------------------ 18 */
    {
      id: "dns-filter",
      track: "services",
      level: "intermediaire",
      title: "DNS Filter approfondi",
      icon: "fa-solid fa-filter",
      step: "18",
      requires: ["dns-local"],
      description: "Bloquez les domaines malveillants et interdits à la source : profil DNS Filter, redirection DNS forcée et journalisation des requêtes bloquées.",
      cliCommands: [
        "# Profil DNS Filter : catégories malveillantes + redirection\nconfig webfilter urlfilter\n    edit 100\n        set name \"liste-blanche-pedagogique\"\n        config entries\n            edit 1\n                set url \"fr.wikipedia.org\"\n                set type simple\n                set action exempt\n            next\n        end\n    next\nend\nconfig webfilter profile\n    edit \"DNSFILTER-CFPCMD\"\n        config ftgd-wf\n            config filters\n                edit 1\n                    set category 26 61 62 86 90\n                    set action block\n                next\n            end\n        end\n        config web\n            set urlfilter-table 100\n        end\n    next\nend",
        "# Forcer le DNS : NAT du port 53 sortant vers le résolveur interne\nconfig firewall nat\nconfig firewall policy\n    edit 0\n        set name " + "\"REDIRECT_DNS\"" + "\n        set srcintf \"HOTSPOT\"\n        set dstintf \"LAN_IT\"\n        set srcaddr all\n        set dstaddr \"DNS-INTERNE\"\n        set action accept\n        set schedule \"always\"\n        set service DNS\n        set nat enable\n    next\nend",
        "# Vérifier les blocages\nexecute dnsfilter lookup malware-exemple.com"
      ],
      guiSteps: [
        "<span class='wb-path'>Security Profiles → DNS Filter</span> → Create New → catégories botnet/phishing en block.",
        "<span class='wb-path'>Security Profiles → DNS Filter → Redirect portal</span> → informer l'utilisateur du blocage.",
        "<span class='wb-path'>Policy & Objects → Firewall Policy</span> → appliquer le profil aux politiques DNS (HOTSPOT → WAN).",
        "<span class='wb-path'>Log & Report → DNS Query</span> → auditer les requêtes bloquées."
      ],
      diagram: "dns-filter",
      terminology: ["DNS Filter", "Botnet C&C", "Phishing", "Redirection DNS", "Liste blanche"],
      concepts: [
        { term: "Botnet C&C", def: "Serveurs de commande et contrôle auxquels les machines infectées se rapportent : bloquer leur résolution coupe la communication du bot." },
        { term: "DNS Filter", def: "Profil UTM qui inspecte chaque requête DNS et refuse les domaines classés malveillants ou hors politique." },
        { term: "Redirection DNS", def: "Technique qui force tout client à utiliser le résolveur choisi, même s'il a configuré 8.8.8.8 manuellement." }
      ],
      alerts: [
        { type: "warning", icon: "fa-triangle-exclamation", text: "Le DNS Filter s'applique aux requêtes DNS claires (UDP/TCP 53) : combinez-le avec le blocage DoH/DoT (section 13) pour rester efficace." },
        { type: "info", icon: "fa-circle-info", text: "Commencez en mode monitor pour mesurer l'impact réel avant de passer en block : évitez de casser des ressources pédagogiques légitimes." }
      ],
      table: {
        headers: ["Catégorie FortiGuard", "Action CFP-CMD", "Justification"],
        rows: [
          ["Botnet / C&C (26)", "Block", "Sécurité active"],
          ["Phishing (61, 62)", "Block", "Protection des apprenants"],
          ["Malicious websites (86, 90)", "Block", "Sécurité active"],
          ["Proxy / VPN anonymiseurs", "Block (Hotspot)", "Maîtrise des sorties réseau"],
          ["Sites pédagogiques", "Exempt / Allow", "Mission du centre"]
        ]
      },
      subsections: [
        { title: "Pourquoi filtrer au niveau DNS", content: "Bloquer à la résolution est le point le plus précoce et le moins coûteux : aucun paquet n'a transité vers le serveur malveillant, aucune session n'a été ouverte. Le DNS Filter protège tous les protocoles qui dépendent du DNS, pas seulement le web. C'est la barrière la plus rentable contre les botnets et le phishing, complémentaire de l'antivirus et du web filtering." },
        { title: "Garantir que tout passe par le filtre", content: "Un client configuré sur 8.8.8.8 contourne le filtre local. Deux réponses : la redirection DNS (NAT du port 53 vers le résolveur interne, quel que soit le DNS demandé) et le blocage des DoH/DoT publics. Ensemble, elles garantissent que toute résolution passe par le profil. Sur le Hotspot, cette combinaison est systématique." },
        { title: "Exploiter les logs DNS", content: "Chaque blocage est journalisé (domaine, catégorie, utilisateur, zone). Ces logs révèlent des machines compromises (requêtes botnet répétées) ou des tentatives de contournement. La section Exploitation centralise ces événements vers le Syslog et déclenche des alertes : une machine du LAN_IT qui interroge un C&C est un incident, pas une statistique." }
      ]
    },

    /* ------------------------------------------------ 19 */
    {
      id: "ntp-serveur",
      track: "services",
      level: "debutant",
      title: "Heure exacte : NTP serveur",
      icon: "fa-solid fa-clock",
      step: "19",
      requires: ["prise-en-main"],
      description: "Alignez l'horloge du FortiGate et de tout le réseau : sans heure commune, ni journaux exploitables, ni certificats valides.",
      cliCommands: [
        "# Le FortiGate synchronisé sur des serveurs fiables\nconfig system ntp\n    set ntpsync enable\n    set server " + "\"pool.ntp.org\"" + "\n    set server2 \"time.google.com\"\n    set syncinterval 60\nend",
        "# Le FortiGate devient serveur NTP pour le LAN\nconfig system ntp\n    set allow unauthenticated\n    set interface internal\n    set server-mode enable\nend",
        "# Vérifier la synchronisation\ndiagnose sys ntp status"
      ],
      guiSteps: [
        "<span class='wb-path'>System → Settings → Time Settings</span> → fuseau horaire, serveurs NTP, intervalle.",
        "<span class='wb-path'>Network → Interfaces → internal</span> → cocher NTP dans les services administratifs si server-mode actif.",
        "<span class='wb-path'>Dashboard → Status</span> → vérifier l'heure affichée et la source de synchronisation."
      ],
      diagram: "ntp",
      terminology: ["NTP", "Stratum", "Dérive d'horloge", "Horodatage"],
      concepts: [
        { term: "NTP", def: "Network Time Protocol : synchronise les horloges des équipements sur une source de temps hiérarchisée (stratum)." },
        { term: "Stratum", def: "Distance hiérarchique par rapport à la source de temps : stratum 1 = directement synchronisé sur une horloge atomique/GPS." },
        { term: "Dérive d'horloge", def: "Écart progressif entre deux horloges non synchronisées, fatal à la corrélation des journaux." }
      ],
      alerts: [
        { type: "warning", icon: "fa-triangle-exclamation", text: "Sans heure commune, reconstituer une chronologie d'incident est impossible : les logs de plusieurs équipements ne se recoupent plus." },
        { type: "info", icon: "fa-circle-info", text: "Les certificats TLS et les FortiToken exigent une heure exacte : une horloge fausse provoque des erreurs d'authentification incompréhensibles." }
      ],
      table: {
        headers: ["Élément", "Source de temps", "Remarque"],
        rows: [
          ["FortiGate", "pool.ntp.org + time.google.com", "Deux sources minimum"],
          ["Postes LAN_IT", "192.168.10.1 (FortiGate)", "DHCP option 42 possible"],
          ["Switch / AP", "192.168.10.1", "Même source que les logs"],
          ["Serveur Syslog", "NTP local ou tierce source", "Corrélation des journaux"]
        ]
      },
      subsections: [
        { title: "L'heure, socle de l'audit", content: "Chaque ligne de log, chaque alerte IPS, chaque tentative d'authentification porte un horodatage. Si le FortiGate, le switch et le serveur Syslog ne partagent pas la même référence, l'analyse d'incident devient un casse-tête. Le CDC impose donc un serveur NTP configuré dès la phase de configuration initiale, avant même les politiques de filtrage." },
        { title: "Chaîne de synchronisation", content: "Le FortiGate se synchronise sur deux serveurs publics indépendants (pool.ntp.org et time.google.com) puis sert de serveur NTP pour le réseau interne via server-mode. Les clients reçoivent l'adresse du serveur par DHCP (option 42) ou configuration manuelle. Le stratum du FortiGate (généralement 3-4) reste largement suffisant pour une corrélation de journaux." },
        { title: "Vérifier et maintenir", content: "diagnose sys ntp status affiche les serveurs, la dérive mesurée et le dernier ajustement. Une dérive persistante suggère un problème réseau vers les serveurs NTP : vérifiez que la politique LAN_IT → WAN autorise bien l'UDP 123. Ce contrôle entre dans la checklist de validation du socle (section 10)." }
      ]
    }
  ]);
})();
