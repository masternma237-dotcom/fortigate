/* ============================================================
   data/interconnexion-2.js — Parcours VPN & interconnexion
   Sections 26, 27, 33, 34 — Guide Interactif FortiGate CFP-CMD / MASTER NMA
   ============================================================ */
(function () {
  "use strict";

  FG.addSections([

    /* ------------------------------------------------ 26 */
    {
      id: "failover-wan",
      track: "interconnexion",
      level: "avance",
      title: "Failover WAN (SD-WAN, health check)",
      icon: "fa-solid fa-arrows-rotate",
      step: "26",
      requires: ["adressage-routage"],
      description: "Assurez la continuité d'Internet : deux liens FAI, sondes de santé SD-WAN et bascule automatique sans intervention humaine (exigence CDC §4.3).",
      cliCommands: [
        "# Les deux interfaces WAN\nconfig system sdwan\n    edit \"sdwan-cfpcmd\"\n        set status enable\n    next\nend",
        "# Zones et membres SD-WAN\nconfig system sdwan\n    config zone\n        edit \"wan-zone\"\n        next\n    end\n    config member\n        edit 1\n            set interface \"wan1\"\n            set zone \"wan-zone\"\n        next\n        edit 2\n            set interface \"wan2\"\n            set zone \"wan-zone\"\n        next\n    end\nend",
        "# Sondes de santé et SLA\nconfig system sdwan\n    config health-check\n        edit \"internet-check\"\n            set server 8.8.8.8 1.1.1.1\n            set interval 500\n            set failure-before 3\n            set recovery 5\n            config sla\n                edit 1\n                    set latency-threshold 250\n                    set packetloss-threshold 5\n                next\n            end\n            set members 1 2\n        next\n    end\nend",
        "# Règle SD-WAN : le trafic sort par le lien sain\nconfig system sdwan\n    config service\n        edit 1\n            set name " + "\"sortie-internet\"" + "\n            set dst all\n            set src all\n            set priority-members 1 2\n        next\n    end\nend",
        "# Politiques utilisant la zone SD-WAN\nconfig firewall policy\n    edit 1\n        set dstintf \"wan-zone\"\n        set nat enable\n    next\nend"
      ],
      guiSteps: [
        "<span class='wb-path'>Network → SD-WAN</span> → activer SD-WAN, créer la zone wan-zone, ajouter wan1 et wan2.",
        "<span class='wb-path'>Network → SD-WAN → Health Check</span> → sonde 8.8.8.8/1.1.1.1, seuils latence/perte.",
        "<span class='wb-path'>Network → SD-WAN → SD-WAN Rules</span> → règle sortie-internet priorité wan1 puis wan2.",
        "<span class='wb-path'>Network → Static Routes</span> → routes par défaut via les interfaces SD-WAN.",
        "<span class='wb-path'>Dashboard → SD-WAN</span> → surveiller l'état des liens et les bascules."
      ],
      diagram: "failover",
      terminology: ["SD-WAN", "Health check", "SLA", "Failover", "WAN member"],
      concepts: [
        { term: "SD-WAN", def: "Gestionnaire multi-WAN de FortiOS : regroupe plusieurs liens sous une zone unique et route selon l'état de santé mesuré." },
        { term: "Health check", def: "Sonde périodique (ping/HTTP) vers des cibles externes : détermine si un lien est utilisable (latence, perte, gigue)." },
        { term: "Failover", def: "Bascule automatique du trafic vers le lien de secours dès que la sonde déclare le lien principal défaillant." }
      ],
      alerts: [
        { type: "warning", icon: "fa-triangle-exclamation", text: "Les sondes doivent tester l'Internet réel, pas la boucle locale : 8.8.8.8 et 1.1.1.1 côté deux FAI différents." },
        { type: "info", icon: "fa-circle-info", text: "La politique SD-WAN de secours : si les deux liens tombent, le trafic est rejeté — prévoyez leLTE/5G en troisième membre si le budget le permet." }
      ],
      table: {
        headers: ["Lien", "Rôle", "Sonde", "Bascule"],
        rows: [
          ["wan1 (fibre FAI 1)", "Principal", "8.8.8.8, 500 ms", "—"],
          ["wan2 (FAI 2 / LTE)", "Secours", "1.1.1.1, 500 ms", "3 échecs → wan2"],
          ["Retour wan1", "Rétablissement", "5 succès consécutifs", "Bascule inverse automatique"]
        ]
      },
      subsections: [
        { title: "Pourquoi le failover est vital au CFP-CMD", content: "Le centre dépend d'Internet : formations à distance, examens en ligne, supervision. Une panne FAI d'une demi-journée est un incident pédagogique majeur. Le CDC exige une redondance des liens (§4.3) : SD-WAN la met en œuvre avec deux abonnements distincts, idéalement chez deux opérateurs pour éviter les pannes communes." },
        { title: "Anatomie d'une bascule", content: "La sonde interroge les cibles toutes les 500 ms : après 3 échecs consécutifs, wan1 est déclaré down et la règle SD-WAN redirige tout vers wan2. Les sessions établies sont (en partie) reprises grâce aux réglages de session-ttl et au NAT régénéré. Au retour, 5 succès consécutifs réactivent wan1. La fenêtre de coupure vise < 5 secondes, imperceptible pour la plupart des usages." },
        { title: "Tester comme en vrai", content: "Débranchez physiquement wan1 pendant une formation en visio : observez la bascule, le ressenti utilisateur et les logs SD-WAN. Répétez avec une panne simulée par ACL chez le FAI (le lien reste « up » mais ne route plus) : seules les sondes détectent ce cas. Ces exercices font partie du Lab 2 et valident l'exigence de disponibilité du CDC." }
      ]
    },

    /* ------------------------------------------------ 27 */
    {
      id: "sd-wan-load-balancing",
      track: "interconnexion",
      level: "avance",
      title: "Load balancing multi-WAN (règles SD-WAN)",
      icon: "fa-solid fa-scale-balanced",
      step: "27",
      requires: ["failover-wan"],
      description: "Exploitez les deux liens simultanément : répartition par règles métier, charge maximale et bascule intelligente selon les SLA mesurés.",
      cliCommands: [
        "# Règle : la visioconférence passe toujours par le lien le plus réactif\nconfig system sdwan\n    config service\n        edit 2\n            set name " + "\"visio-premium\"" + "\n            set dst all\n            set src all\n            set mode priority\n            set quality-latency 120\n            set priority-members 1 2\n        next\n    end\nend",
        "# Règle : les sauvegardes passent par wan2 (libère wan1)\nconfig system sdwan\n    config service\n        edit 3\n            set name \"backup-wan2\"\n            set dst all\n            set srcaddr \"RESEAU-SAUVEGARDE\"\n            set mode manual\n            set member 2\n        next\n    end\nend",
        "# Stratégie par défaut : répartition par volume\nconfig system sdwan\n    config service\n        edit 1\n            set mode load-balance\n        next\n    end\nend",
        "# Vérifier la répartition\ndiagnose sys sdwan service\ndiagnose sys sdwan health-check"
      ],
      guiSteps: [
        "<span class='wb-path'>Network → SD-WAN → SD-WAN Rules</span> → Create New → correspondance applicative ou par source.",
        "Choisir le mode : manual (lien imposé), priority (ordre), load-balance (répartition).",
        "<span class='wb-path'>Network → SD-WAN → Performance SLA</span> → définir les cibles par application.",
        "<span class='wb-path'>Dashboard → SD-WAN</span> → observer le volume par membre et les décisions prises."
      ],
      diagram: "sdwan-lb",
      terminology: ["Load balancing", "Règle SD-WAN", "Mode manual", "Mode priority", "Quality of experience"],
      concepts: [
        { term: "Règle SD-WAN", def: "Décision de sortie applicative : selon la source, la destination ou l'application, le trafic choisit son lien et son mode." },
        { term: "Load balance", def: "Répartition du trafic entre les membres selon leur bande passante disponible, ajustée dynamiquement." },
        { term: "Mode manual", def: "Affectation statique d'un trafic à un membre : utile pour réserver un lien (sauvegardes, mises à jour)." }
      ],
      alerts: [
        { type: "warning", icon: "fa-triangle-exclamation", text: "L'ordre des règles SD-WAN compte comme pour les politiques : la première correspondante décide du lien de sortie." },
        { type: "info", icon: "fa-circle-info", text: "Gardez toujours une règle de secours par défaut (catch-all) sinon le trafic non couvert suit la table de routage classique." }
      ],
      table: {
        headers: ["Trafic", "Règle", "Mode", "Lien"],
        rows: [
          ["Visio / formations distantes", "visio-premium", "priority + SLA latence", "meilleur lien mesuré"],
          ["Sauvegardes nocturnes", "backup-wan2", "manual", "wan2"],
          ["Trafic général", "sortie-internet", "load-balance", "wan1 + wan2"],
          ["HTTPS bancaire interne", "règle collante", "manual", "wan1 (stabilité IP)"]
        ]
      },
      subsections: [
        { title: "Du failover au partage", content: "Le failover garde un lien en attente ; le load balancing exploite les deux en permanence. Pour un centre qui paie deux abonnements, c'est du rendement pur : la bande passante totale disponible monte à la somme des liens. La condition : des règles qui maintiennent la cohérence (une session ne change pas de lien en cours de route)." },
        { title: "Règles métier avant règles techniques", content: "Commencez par la cartographie : quels flux sont critiques (visio, VPN site-à-site), lesquels sont déplacables (sauvegardes, mises à jour), lesquels sont neutres (navigation). Traduisez en règles : les critiques en priority avec SLA de latence, les déplacables en manual sur le lien secondaire, le reste en load-balance. Cette grille est lisible et défendable en gestion de projet." },
        { title: "Surveiller et ajuster", content: "diagnose sys sdwan service montre la règle choisie pour chaque session ; le widget SD-WAN visualise les volumes par lien. Ajustez les SLA (latence, perte) au regard de l'expérience réelle des usages. Documentez la matrice de sortie dans le journal d'exploitation : elle évolue avec les usages pédagogiques du centre." }
      ]
    },

    /* ------------------------------------------------ 33 */
    {
      id: "routage-ospf",
      track: "interconnexion",
      level: "avance",
      title: "Routage dynamique : OSPF",
      icon: "fa-solid fa-diagram-project",
      step: "33",
      requires: ["adressage-routage"],
      description: "Faites apprendre les routes automatiquement entre équipements : OSPF sur les liens internes et vers le site B, convergence et zones.",
      cliCommands: [
        "# Configurer OSPF\nconfig router ospf\n    set router-id 10.255.255.1\n    config area\n        edit 0.0.0.0\n        next\n    end\n    config network\n        edit 1\n            set prefix 192.168.10.0 255.255.255.0\n        next\n        edit 2\n            set prefix 192.168.40.0 255.255.255.0\n        next\n    end\n    config interface\n        edit " + "\"to_siteB\"" + "\n            set cost 100\n        next\n    end\nend",
        "# Annoncer une route statique (redistribution)\nconfig router ospf\n    config redistribute " + "\"static\"" + "\n        set status enable\n        set metric 100\n    next\nend",
        "# Observer le protocole\nget router info ospf neighbor\nget router info routing-table ospf"
      ],
      guiSteps: [
        "<span class='wb-path'>Network → OSPF</span> → router-id, area 0.0.0.0, réseaux annoncés.",
        "<span class='wb-path'>Network → OSPF → Interfaces</span> → coût et type de réseau par interface.",
        "<span class='wb-path'>Network → OSPF → Redistribution</span> → redistribuer statique/connected selon l'architecture.",
        "<span class='wb-path'>Dashboard → Routing</span> → vérifier les routes OSPF apprises (O, O IA)."
      ],
      diagram: "ospf",
      terminology: ["OSPF", "Router ID", "Area", "LSA", "Convergence", "Redistribution"],
      concepts: [
        { term: "OSPF", def: "Protocole de routage à état de liens : les routeurs échangent leur topologie et calculent les meilleurs chemins (Dijkstra)." },
        { term: "Area", def: "Subdivision hiérarchique du domaine OSPF : l'area 0 (backbone) relie les autres zones, limitant la taille des LSA." },
        { term: "Convergence", def: "Temps nécessaire pour recalculer les routes après un changement de topologie (secondes en OSPF bien réglé)." }
      ],
      alerts: [
        { type: "warning", icon: "fa-triangle-exclamation", text: "Ne redistribuez pas la route par défaut sans réflexion : le site B pourrait renvoyer son trafic Internet via le CFP-CMD." },
        { type: "info", icon: "fa-circle-info", text: "OSPF ne traverse pas le tunnel IPsec par magie : l'interface tunnel doit être déclarée en réseau de type point-à-point ou broadcast." }
      ],
      table: {
        headers: ["Élément", "Valeur CFP-CMD", "Rôle"],
        rows: [
          ["Router ID", "10.255.255.1", "Identifiant unique du routeur"],
          ["Area", "0.0.0.0 (backbone)", "Zone principale"],
          ["Réseaux annoncés", "192.168.10.0/24, 192.168.40.0/24", "Lan IT + site B"],
          ["Coût tunnel", "100", "Favorise le chemin direct"],
          ["Redistribution", "statique (métrique 100)", "Publie la route par défaut côté hub"]
        ]
      },
      subsections: [
        { title: "À quoi sert le routage dynamique", content: "Avec deux sites, chaque route statique doit être écrite des deux côtés : c'est tenable, mais trois sites et plusieurs tunnels rendent l'erreur humaine inévitable. OSPF apprend automatiquement les réseaux de chaque équipement et recalcule après une panne : la convergence automatique est l'argument décisif du CDC pour les architectures évolutives." },
        { title: "Implémenter proprement", content: "Un router-id unique et stable, l'area 0 pour une petite topologie, et des interfaces déclarées avec leurs coûts. La redistribution (static, connected) s'utilise avec parcimonie : chaque route redistribée entre dans la base topologique de tous les voisins. Filtrez avec des listes de préfixes pour publier seulement ce qui doit être vu." },
        { title: "Valider la convergence", content: "get router info ospf neighbor liste les adjacences (Full attendu) ; la table de routage affiche les routes OSPF marquées O. Test de référence : coupez le tunnel principal, chronométrez la bascule sur le chemin de secours, vérifiez le retour à la normale. Ces mesures alimentent le rapport de tests du CDC (§7)." }
      ]
    },

    /* ------------------------------------------------ 34 */
    {
      id: "introduction-bgp",
      track: "interconnexion",
      level: "avance",
      title: "Introduction à BGP",
      icon: "fa-solid fa-map-location-dot",
      step: "34",
      requires: ["routage-ospf"],
      description: "Découvrez le protocole des opérateurs : sessions eBGP avec un FAI ou entre établissements, attributs et politiques d'annonce.",
      cliCommands: [
        "# Session eBGP avec le FAI\nconfig router bgp\n    set as 65100\n    set router-id 10.255.255.1\n    config neighbor\n        edit " + "\"203.0.113.1\"" + "\n            set remote-as 65010\n            set capability graceful-restart enable\n        next\n    end\n    config network\n        edit 1\n            set prefix 203.0.113.0 255.255.255.0\n        next\n    end\nend",
        "# Annoncer uniquement ses propres réseaux (filtre sortie)\nconfig router prefix-list\n    edit \"ANNONCES-CFPCMD\"\n        config rule\n            edit 1\n                set prefix 203.0.113.0 255.255.255.0\n                set action permit\n            next\n        end\n    next\nend\nconfig router bgp\n    config neighbor\n        edit \"203.0.113.1\"\n            set filter-list-out \"ANNONCES-CFPCMD\"\n        next\n    end\nend",
        "# Observer BGP\nget router info bgp summary\nget router info routing-table bgp"
      ],
      guiSteps: [
        "<span class='wb-path'>Network → BGP</span> → numéro d'AS, router-id, voisins et AS distants.",
        "<span class='wb-path'>Network → BGP → Networks</span> → réseaux à annoncer.",
        "<span class='wb-path'>Network → BGP → Neighbors</span> → filtres d'entrée/sortie, timers, graceful-restart.",
        "<span class='wb-path'>Dashboard → Routing</span> → routes BGP (B) et métriques AS-path."
      ],
      diagram: "bgp",
      terminology: ["BGP", "AS", "eBGP", "AS-path", "Annonce", "Peering"],
      concepts: [
        { term: "BGP", def: "Border Gateway Protocol : protocole de routage entre systèmes autonomes, pilote d'Internet et des interconnexions d'opérateurs." },
        { term: "AS", def: "Autonomous System : ensemble de réseaux sous une même politique administrative, identifié par un numéro (ASN public ou privé)." },
        { term: "AS-path", def: "Liste des AS traversés par une annonce : attribut central des politiques BGP (préférence, filtrage, anti-boucle)." }
      ],
      alerts: [
        { type: "danger", icon: "fa-triangle-exclamation", text: "Une annonce BGP erronée se propage sur Internet : filtrez toujours vos sorties et ne redistribuez jamais aveuglément vos routes internes." },
        { type: "info", icon: "fa-circle-info", text: "En labo, utilisez des ASN privés (64512-65534) et simulez le FAI avec un second FortiGate ou FRR sur VM." }
      ],
      table: {
        headers: ["Concept", "OSPF", "BGP"],
        rows: [
          ["Type", "État de liens (IGP)", "Vecteur de chemins (EGP)"],
          ["Portée", "Un domaine administratif", "Entre domaines (opérateurs)"],
          ["Critère de choix", "Coût (bande passante)", "Politiques (AS-path, local-pref)"],
          ["Convergence", "Secondes", "Secondes à minutes"],
          ["Usage CFP-CMD", "Lien interne / tunnels", "Interconnexion FAI / multi-établissements"]
        ]
      },
      subsections: [
        { title: "Pourquoi BGP apparaît au CFP-CMD", content: "OSPF excelle dans un domaine mais ne traverse pas les frontières administratives. Dès que le centre veut des relations avec un opérateur (redondance d'accès, adresse propre) ou avec d'autres établissements, BGP devient l'outil : chaque partie annonce ce qu'elle héberge, avec ses propres politiques. Comprendre BGP, c'est comprendre comment le trafic choisit son chemin sur Internet." },
        { title: "Les fondamentaux de la session", content: "Une session eBGP relie deux AS voisins (ici 65100 ↔ 65010). Les réseaux à annoncer sont déclarés explicitement (config network) et filtrés en sortie (prefix-list) : on n'annonce que son propre bloc. En entrée, on accepte les routes du pair avec les attributs par défaut, avant d'affiner (local-preference pour préférer un FAI, AS-path prepend pour détourner le trafic)." },
        { title: "Du labo à la production", content: "Le Lab 2 simule une session eBGP entre deux FortiGate avec des ASN privés : montée de session, annonces filtrées, test de bascule en retirant une annonce. En production, la session avec le FAI demande une coordination (ASN public, plan d'adressage, filtres bilatéraux documentés) : le dossier d'exploitation conserve les filtres convenus comme référence contractuelle." }
      ]
    }
  ]);
})();
