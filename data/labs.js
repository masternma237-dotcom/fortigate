/* ============================================================
   data/labs.js — Parcours Labs & évaluation (sections 36 à 40)
   Guide Interactif FortiGate CFP-CMD / MASTER NMA
   ============================================================ */
(function () {
  "use strict";

  FG.addSections([

    /* ------------------------------------------------ 36 */
    {
      id: "lab0-preparer-labo",
      track: "labs",
      level: "debutant",
      title: "Lab 0 — Préparer le labo (FortiGate-VM sur Proxmox VE)",
      icon: "fa-solid fa-flask",
      step: "36",
      requires: ["introduction"],
      description: "Montez l'environnement de travaux pratiques : FortiGate-VM sur Proxmox VE, réseau d'essai et première console. Tous les labs du guide s'appuient sur cette base.",
      cliCommands: [
        "# Après import de l'image FortiGate-VM (qcow2) et premier boot\n# Console Proxmox : définir le mot de passe admin\nconfig system admin\n    edit admin\n        set password <MOT_DE_PASSE_FORT>\n    next\nend",
        "# Désactiver le DHCP par défaut sur internal (on va redéfinir tout le réseau)\nconfig system dhcp server\n    delete 1\nend",
        "# Attribuer les interfaces du labo\nconfig system global\n    set hostname FGT-LAB-01\n    set timezone 01\nend\nconfig system interface\n    edit wan1\n        set mode dhcp\n        set allowaccess ping\n        set alias \"WAN-LAB\"\n    next\n    edit internal\n        set ip 192.168.10.1 255.255.255.0\n        set allowaccess ping https ssh\n        set alias \"LAN_IT\"\n    next\nend"
      ],
      guiSteps: [
        "Proxmox VE → Create VM → type Linux 6.x, BIOS par défaut, disque qcow2 FortiGate-VM importé.",
        "Réseau : net0 → vmbr0 (WAN-LAB), net1 → vmbr10 (LAN_IT), net2 → vmbr20 (HOTSPOT).",
        "Console → premier démarrage, login admin / (vide) → définir le mot de passe.",
        "Ouvrir https://192.168.10.1 depuis un VM client branché sur vmbr10."
      ],
      diagram: "lab0",
      terminology: ["FortiGate-VM", "Proxmox VE", "vmbr", "Console", "Licence d'évaluation"],
      concepts: [
        { term: "FortiGate-VM", def: "Image virtuelle du FortiGate (KVM/VMware/Hyper-V) : fonctionnalités identiques au matériel, parfaite pour les labs." },
        { term: "Proxmox VE", def: "Hyperviseur libre très répandu en formation : VM, bridges réseau (vmbr) et consoles web en quelques clics." },
        { term: "Bridge (vmbr)", def: "Commutateur virtuel Proxmox : chaque vmbr joue le rôle d'un segment physique distinct (WAN, LAN, Hotspot)." }
      ],
      alerts: [
        { type: "warning", icon: "fa-triangle-exclamation", text: "Sans licence, FortiGate-VM fonctionne avec des limitations (débit, absence de mises à jour FortiGuard) : suffisant pour le routage et les politiques, insuffisant pour tester l'IPS en conditions réelles." },
        { type: "danger", icon: "fa-triangle-exclamation", text: "Ne branchez jamais directement vmbr0 du labo sur la production : isolez le labo (VLAN dédié ou NIC désactivée)." }
      ],
      table: {
        headers: ["Étape", "Action Proxmox", "Résultat attendu"],
        rows: [
          ["1", "Télécharger l'image FortiGate-VM (KVM)", "fichier .qcow2 disponible"],
          ["2", "Créer la VM et importer le disque", "VM démarre sur la console"],
          ["3", "Créer vmbr0 / vmbr10 / vmbr20", "Trois segments réseau isolés"],
          ["4", "Attacher les vNIC et démarrer", "Interfaces wan1/internal actives"],
          ["5", "Mot de passe admin + IP interne", "GUI accessible en 192.168.10.1"],
          ["6", "VM clients (Windows/Debian) sur les bridges", "Postes LAN et Hotspot pour tester"]
        ]
      },
      checklist: [
        "Image FortiGate-VM téléchargée et importée dans Proxmox",
        "VM créée avec 2 vCPU / 2-4 Go RAM / 2 disques",
        "Trois bridges créés : vmbr0 (WAN), vmbr10 (LAN_IT), vmbr20 (HOTSPOT)",
        "Interfaces vNIC rattachées et actives dans FortiOS",
        "Mot de passe admin défini (12 caractères minimum)",
        "GUI accessible depuis un VM client en https://192.168.10.1",
        "VM cliente Windows ou Debian branchée sur vmbr10",
        "VM cliente branchée sur vmbr20 (futur Hotspot)",
        "Sauvegarde (snapshot) de la VM après configuration de base"
      ],
      subsections: [
        { title: "Architecture du labo", content: "Trois bridges Proxmox simulent les trois mondes du CDC : vmbr0 joue l'Internet du labo (ou reste isolé), vmbr10 héberge les postes IT, vmbr20 servira au Hotspot. Le FortiGate-VM y attache wan1, internal et plus tard vlan20. Deux VM clientes (un Windows, un Debian) jouent les utilisateurs. Cette maquette minuscule reproduit fidèlement la topologie cible." },
        { title: "Premiers réglages", content: "Après le boot, la console demande le login admin : définissez immédiatement un mot de passe fort. Supprimez le DHCP par défaut (il gêne les tests), fixez l'adressage du labo conformément au plan CDC. Un snapshot Proxmox à ce stade donne un point de retour rapide : les labs suivants casseront des choses volontairement." },
        { title: "Réussir le premier accès GUI", content: "Depuis la VM cliente de vmbr10, ouvrez https://192.168.10.1 (certificat auto-signé : acceptez l'exception de façon consciente). Si la page n'ouvre pas : vérifiez l'IP du client, le bridge, puis ping 192.168.10.1. Ces réflexes de diagnostic du socle (section 10) démarrent ici. Vous êtes prêt pour le Lab 1." }
      ]
    },

    /* ------------------------------------------------ 37 */
    {
      id: "lab1-centre-formation",
      track: "labs",
      level: "intermediaire",
      title: "Lab 1 — Réseau d'un centre de formation",
      icon: "fa-solid fa-school",
      step: "37",
      requires: ["validation-tests"],
      description: "Reproduisez le socle CFP-CMD complet sur le labo : zones LAN_IT / HOTSPOT / DMZ, politiques d'isolation, DHCP, DNS et UTM de base.",
      cliCommands: [
        "# Le cœur du lab : la matrice de flux du CDC (§8.2)\nconfig firewall policy\n    edit 1\n        set name \"LAN_IT_to_WAN\"\n        set srcintf \"LAN_IT\"\n        set dstintf \"WAN\"\n        set srcaddr all\n        set dstaddr all\n        set action accept\n        set schedule \"always\"\n        set service ALL\n        set nat enable\n    next\n    edit 2\n        set name \"HOTSPOT_to_WAN\"\n        set srcintf \"HOTSPOT\"\n        set dstintf \"WAN\"\n        set srcaddr all\n        set dstaddr all\n        set action accept\n        set schedule \"always\"\n        set service HTTP HTTPS DNS\n        set nat enable\n    next\n    edit 3\n        set name \"HOTSPOT_to_LAN_IT_DENY\"\n        set srcintf \"HOTSPOT\"\n        set dstintf \"LAN_IT\"\n        set srcaddr all\n        set dstaddr all\n        set action deny\n        set schedule \"always\"\n        set service ALL\n        set logtraffic all\n    next\nend",
        "# Serveur DHCP Hotspot + portail captif\nconfig system dhcp server\n    edit 2\n        set default-gateway 192.168.20.1\n        set netmask 255.255.255.0\n        set interface \"vlan20\"\n        config ip-range\n            edit 1\n                set start 192.168.20.10\n                set end 192.168.20.250\n            next\n        end\n    next\nend\nconfig system interface\n    edit vlan20\n        set security-mode captive-portal\n    next\nend"
      ],
      guiSteps: [
        "<span class='wb-path'>Network → Interfaces</span> → internal (LAN_IT), vlan20 (HOTSPOT), dmz (DMZ), zones.",
        "<span class='wb-path'>Policy & Objects → Firewall Policy</span> → les 5 politiques du socle (matrice CDC §8.2).",
        "<span class='wb-path'>Network → DHCP Server</span> → étendues LAN_IT et HOTSPOT.",
        "<span class='wb-path'>Security Profiles</span> → appliquer AV + IPS + Web Filter sur HOTSPOT_to_WAN."
      ],
      diagram: "lab1",
      terminology: ["Matrice de flux", "Portail captif", "Isolation", "Validation"],
      concepts: [
        { term: "Matrice de flux", def: "Tableau source/destination/service/action du CDC qui définit exactement ce que le réseau autorise : référence de chaque test." },
        { term: "Isolation inter-zones", def: "Propriété fondamentale : le Hotspot ne voit jamais le LAN_IT, la DMZ jamais l'IT. Un refus documenté vaut une politique." }
      ],
      alerts: [
        { type: "warning", icon: "fa-triangle-exclamation", text: "Testez l'isolation avec des pings réels depuis chaque VM cliente, pas seulement en lisant les politiques." },
        { type: "info", icon: "fa-circle-info", text: "Consignez chaque test (attendu/observé) : le journal de validation fait partie des livrables du projet." }
      ],
      table: {
        headers: ["Test", "Depuis", "Vers", "Attendu"],
        rows: [
          ["Navigation Internet", "LAN_IT + HOTSPOT", "Internet", "OK des deux côtés"],
          ["Isolation Hotspot", "VM vlan20", "192.168.10.1 et .10", "Refus + log deny"],
          ["Isolation DMZ", "VM dmz", "192.168.10.x", "Refus + log deny"],
          ["DHCP", "VM clients", "FortiGate", "Baux .10.x et .20.x"],
          ["Portail captif", "VM vlan20", "Navigation", "Page d'authentification d'abord"],
          ["Web filtering", "VM vlan20", "catégorie bloquée", "Page de blocage FortiGuard"]
        ]
      },
      checklist: [
        "Zones LAN_IT, HOTSPOT, DMZ, WAN créées et peuplées",
        "Politique LAN_IT_to_WAN : accept + NAT",
        "Politique HOTSPOT_to_WAN : HTTP/HTTPS/DNS + NAT + UTM",
        "Politique HOTSPOT_to_LAN_IT_DENY : deny + logtraffic all",
        "Politique DMZ_to_LAN_IT_DENY : deny + logtraffic all",
        "DHCP actif sur LAN_IT et HOTSPOT (plages .10-.250)",
        "Portail captif actif sur vlan20",
        "Test d'isolation Hotspot → LAN_IT : refus constaté",
        "Test d'isolation DMZ → LAN_IT : refus constaté",
        "Test web filtering : catégorie bloquée bloquée, wikipédia accessible"
      ],
      subsections: [
        { title: "Le lab comme répétition générale", content: "Ce lab reproduit la mise en production réelle : mêmes zones, mêmes politiques, même plan d'adressage. Chaque manipulation du guide (sections 02 à 10) se rejoue ici jusqu'à l'aisance. L'échec au lab coûte un snapshot ; en production, il coûte le service. C'est le sens du CDC : valider avant d'installer." },
        { title: "Scénario de séance type", content: "1) Restaurer le snapshot Lab 0. 2) Configurer interfaces et zones (section 02). 3) Écrire les 5 politiques (section 03) avec la matrice sous les yeux. 4) Activer DHCP et portail captif (sections 06 et 08). 5) Appliquer les profils UTM (section 09). 6) Dérouler la checklist de validation et consigner les résultats. 7) Diff des politiques avec le binôme : les écarts se discutent." },
        { title: "Critères de réussite", content: "Le lab est validé quand les 10 cases de la checklist sont cochées et que le journal de tests mentionne pour chaque flux : résultat attendu, résultat observé, éventuel écart expliqué. Le formateur peut alors signer la compétence « déploiement du socle FortiGate » du référentiel MASTER NMA." }
      ]
    },

    /* ------------------------------------------------ 38 */
    {
      id: "lab2-deux-sites-vpn",
      track: "labs",
      level: "avance",
      title: "Lab 2 — Deux sites, VPN et failover",
      icon: "fa-solid fa-city",
      step: "38",
      requires: ["ipsec-site-a-site", "failover-wan"],
      description: "Reliez deux FortiGate-VM par IPsec IKEv2, simulez le site distant (192.168.40.0/24) et testez la résilience : coupure du tunnel, bascule WAN, BGP de démonstration.",
      cliCommands: [
        "# Sur FGT-LAB-01 (siège) : phase 1 vers le site B\nconfig vpn ipsec phase1-interface\n    edit \"to_siteB\"\n        set interface \"wan1\"\n        set ike-version 2\n        set peertype any\n        set proposal aes256-sha256\n        set remote-gw 10.50.0.2\n        set psksecret <SECRET_IPSEC_LAB>\n        set dpd on-idle\n    next\nend\nconfig vpn ipsec phase2-interface\n    edit \"to_siteB_p2\"\n        set phase1name \"to_siteB\"\n        set proposal aes256-sha256\n        set pfs enable\n        set dhgrp 14\n        set src-subnet 192.168.10.0 255.255.255.0\n        set dst-subnet 192.168.40.0 255.255.255.0\n    next\nend",
        "# Sur FGT-LAB-02 (site B) : symétrique\nconfig vpn ipsec phase1-interface\n    edit \"to_hq\"\n        set interface \"wan1\"\n        set ike-version 2\n        set peertype any\n        set proposal aes256-sha256\n        set remote-gw 10.50.0.1\n        set psksecret <SECRET_IPSEC_LAB>\n        set dpd on-idle\n    next\nend\nconfig vpn ipsec phase2-interface\n    edit \"to_hq_p2\"\n        set phase1name \"to_hq\"\n        set proposal aes256-sha256\n        set pfs enable\n        set dhgrp 14\n        set src-subnet 192.168.40.0 255.255.255.0\n        set dst-subnet 192.168.10.0 255.255.255.0\n    next\nend",
        "# Diagnostic pendant l'exercice\ndiagnose vpn ike gateway list\ndiagnose vpn tunnel list | grep -E 'to_|bytes'"
      ],
      guiSteps: [
        "Proxmox → créer une deuxième VM FortiGate-VM (FGT-LAB-02) avec son bridge WAN dédié.",
        "<span class='wb-path'>VPN → IPsec Tunnels</span> → phases 1 et 2 symétriques sur les deux équipements.",
        "<span class='wb-path'>Network → Static Routes</span> → 192.168.40.0/24 via to_siteB (et inverse).",
        "<span class='wb-path'>Policy & Objects</span> → politiques LAN_IT ↔ to_siteB et tests de ping croisés.",
        "<span class='wb-path'>Dashboard → IPsec</span> → arrêter volontairement le tunnel et observer la reprise DPD."
      ],
      diagram: "lab2",
      terminology: ["Tunnel symétrique", "DPD", "Coupure volontaire", "Bascule", "eBGP de labo"],
      concepts: [
        { term: "Topologie symétrique", def: "Chaque extrémité configure exactement l'inverse de l'autre : proposals, sous-réseaux, PSK. Le moindre écart bloque la négociation." },
        { term: "Résilience", def: "Capacité du tunnel à se rétablir seul après coupure (DPD) et du réseau à basculer sur le lien de secours (SD-WAN)." }
      ],
      alerts: [
        { type: "warning", icon: "fa-triangle-exclamation", text: "Les deux tunnels labo partagent des plans d'adressage proches : verrouillez les bridges Proxmox pour éviter les fuites de broadcast." },
        { type: "info", icon: "fa-circle-info", text: "Un ping qui ne passe pas alors que la phase 1 est montée = politique ou route manquante dans 90 % des cas." }
      ],
      table: {
        headers: ["Étape", "Test", "Attendu"],
        rows: [
          ["1", "diagnose vpn ike gateway list", "Phase 1 IKEv2 montée des deux côtés"],
          ["2", "ping 192.168.40.10 depuis LAN_IT", "Réponse via le tunnel"],
          ["3", "ping 192.168.10.50 depuis site B", "Réponse (politique inverse)"],
          ["4", "Débrancher le lien WAN du site B", "DPD détecte, logs de déconnexion"],
          ["5", "Rebrancher", "Tunnel remonté automatiquement"],
          ["6", "(Bonus) session eBGP entre les FGT", "Routes BGP apprises, AS-path visible"]
        ]
      },
      checklist: [
        "FGT-LAB-02 opérationnelle avec son bridge WAN dédié",
        "Phase 1 IKEv2 montée (diagnose vpn ike gateway list)",
        "Phase 2 avec PFS et sous-réseaux symétriques",
        "Routes statiques croisées 192.168.10.0/24 ↔ 192.168.40.0/24",
        "Politiques firewall dans les deux sens avec UTM",
        "Ping croisé validé dans les deux directions",
        "Coupure volontaire : DPD détecte la panne, log généré",
        "Rétablissement automatique du tunnel constaté",
        "(Bonus) failover WAN simulé avec second lien",
        "(Bonus) session eBGP de labo montée et routes échangées"
      ],
      subsections: [
        { title: "Monter le tunnel pas à pas", content: "Configurez FGT-LAB-01 d'abord, en vérifiant chaque phase avant de passer à la suivante : phase 1 montée ? (gateway list) puis phase 2 avec compteurs SA. Ne configurez le site B qu'après avoir lu les proposals de la phase 1 côté hub. Cette progression évite le pire cauchemar du débutant : deux configurations fausses qui se cherchent." },
        { title: "Tester la résilience", content: "Le tunnel monte ? Il faut maintenant prouver sa robustesse. Débranchez le lien WAN du site B pendant un ping continu : les pertes marquent la fenêtre DPD, puis le rétablissement se fait seul. Refaites l'exercice en coupant wan1 d'un côté avec un second lien SD-WAN disponible : la bascule et le retour se chronomètrent et se consignent. Ces mesures alimentent le rapport CDC §7.4 (tests de reprise)." },
        { title: "Aller plus loin", content: "Bonus 1 : remplacer la route statique par une session eBGP de labo (ASN privés) et observer les annonces. Bonus 2 : ajouter une phase 2 téléphonie et vérifier le cloisonnement des sélecteurs. Bonus 3 : documenter toute la topologie dans un schéma mis à jour — l'architecture sans documentation est une dette technique." }
      ]
    },

    /* ------------------------------------------------ 39 */
    {
      id: "lab3-exploitation",
      track: "labs",
      level: "intermediaire",
      title: "Lab 3 — Exploitation et supervision",
      icon: "fa-solid fa-chart-line",
      step: "39",
      requires: ["supervision-snmp-zabbix", "alertes-automation", "journalisation-syslog"],
      description: "Équipez le labo des outils d'exploitation : Syslog centralisé, alertes e-mail automatiques, supervision Zabbix et premier audit d'exploitation.",
      cliCommands: [
        "# Syslog + email + SNMP d'un coup (récapitulatif exploitation)\nconfig log syslogd setting\n    set status enable\n    set server \"192.168.10.20\"\n    set port 514\n    set facility local7\nend\nconfig system email-server\n    set server \"192.168.10.20\"\n    set port 25\nend\nconfig system snmp sysinfo\n    set status enable\n    set description \"FortiGate LAB\"\n    set location \"Proxmox Labo\"\nend",
        "# Automation stitch de lab : alerte sur deny répété\nconfig system automation-trigger\n    edit \"deny-storm\"\n        set event-type security-rating\n        set logid 0\n    next\nend\nconfig system automation-action\n    edit \"email-lab\"\n        set action-type email\n        set destination \"it@cfp-cmd.local\"\n        set subject \"[FGT-LAB] Alertes\"\n    next\nend"
      ],
      guiSteps: [
        "<span class='wb-path'>Log & Report → Log Settings</span> → Syslog vers 192.168.10.20.",
        "<span class='wb-path'>Security Fabric → Automation</span> → stitch e-mail sur événement critique.",
        "Serveur de labo → rsyslog/Graylog + Zabbix + hôte SNMPv3 configuré.",
        "<span class='wb-path'>Dashboard</span> → créer un widget « Logs » et observer les événements en direct."
      ],
      diagram: "lab3",
      terminology: ["Collecteur", "rsyslog", "Graylog", "Dashboard", "Audit d'exploitation"],
      concepts: [
        { term: "Chaîne d'exploitation", def: "Ensemble logs → alertes → supervision → procédures : ce qui transforme un pare-feu bien configuré en service exploitable au quotidien." },
        { term: "Audit", def: "Revue périodique : configuration conforme, alertes traitées, sauvegardes restaurées, tendances notées." }
      ],
      alerts: [
        { type: "info", icon: "fa-circle-info", text: "Le lab permet de « casser » sans conséquence : faites exprès de déclencher chaque alerte pour voir la chaîne réagir." },
        { type: "warning", icon: "fa-triangle-exclamation", text: "Un serveur de collecte qui n'est pas lui-même supervisé est un angle mort : ajoutez-le à Zabbix." }
      ],
      table: {
        headers: ["Composant", "Serveur de labo", "Test de bon fonctionnement"],
        rows: [
          ["Collecteur Syslog", "rsyslog ou Graylog (VM Debian)", "Messages local7 reçus du FortiGate"],
          ["Alertes e-mail", "Postfix local ou SMTP externe", "Stitch déclenché → mail reçu"],
          ["Supervision", "Zabbix 6.x LTS", "Hôte FGT en SNMPv3, métriques remontent"],
          ["Sauvegarde", "SFTP local", "execute auto-script run → fichier présent"]
        ]
      },
      checklist: [
        "Syslog actif et messages visibles sur le collecteur",
        "Deny implicite journalisé (test isolation constaté au collecteur)",
        "Serveur SMTP fonctionnel (execute sendmail reçu)",
        "Automation stitch déclenché volontairement → e-mail reçu",
        "Hôte Zabbix FGT en SNMPv3 authPriv opérationnel",
        "Dashboard Zabbix : CPU, sessions, interfaces, tunnels",
        "Trap testé (coupure tunnel → alerte Zabbix)",
        "Sauvegarde auto-script SFTP exécutée et vérifiée",
        "Journal d'exploitation du lab tenu (anomalies et actions)"
      ],
      subsections: [
        { title: "Assembler la chaîne complète", content: "Ce lab enchaîne les briques des sections 28 à 31 sur l'environnement Lab 0/1 : le collecteur Syslog voit le trafic et les refus, les stitches envoient les e-mails, Zabbix dessine les courbes, la sauvegarde SFTP tourne. Chaque brique est testée individuellement puis dans son ensemble : on déclenche volontairement des événements (échecs d'authentification, coupure de tunnel) et on suit leur propagation jusqu'aux alertes." },
        { title: "Simuler un incident", content: "Scénario : un « attaquant » (VM cliente) force le portail SSL-VPN. Chaîne attendue : logs d'échecs sur le FortiGate → lockout (section 12) → stitch d'alerte e-mail → courbe Zabbix des tentatives → analyse au collecteur. Déroulez la procédure d'incident écrite au préalable : qui constate, qui diagnostique, qui clôt. Ce jeu de rôle est le cœur de la compétence exploitation." },
        { title: "Auditer et conclure", content: "Terminez par un audit d'exploitation en 30 minutes : configuration conforme à la checklist de durcissement ? alertes reçues et traitées ? sauvegarde restaurée sur une VM propre ? tendances notées (sessions, blocages) ? Le rapport final (livrable CDC) s'appuie sur ces éléments : c'est la preuve que l'infrastructure est non seulement construite mais tenable." }
      ]
    },

    /* ------------------------------------------------ 40 */
    {
      id: "quiz-final",
      track: "labs",
      level: "tous",
      title: "Quiz final — Évaluation du parcours",
      icon: "fa-solid fa-graduation-cap",
      step: "40",
      requires: ["lab1-centre-formation", "lab2-deux-sites-vpn", "lab3-exploitation"],
      description: "L'évaluation finale agrège des questions de tous les parcours : socle, sécurité, services, interconnexion et exploitation. Seuil de réussite : 70 %.",
      cliCommands: [
        "# Rappel express : les commandes à connaître par cœur\nconfig system global\n    set hostname FGT-CFP-CMD\n    set timezone 01\nend",
        "# Politique : le squelette à ne plus jamais chercher\nconfig firewall policy\n    edit 0\n        set srcintf \"LAN_IT\"\n        set dstintf \"WAN\"\n        set srcaddr all\n        set dstaddr all\n        set action accept\n        set schedule \"always\"\n        set service ALL\n        set nat enable\n    next\nend",
        "# Diagnostic : le trio gagnant\ndiagnose sniffer packet wan1 'port 443' 4 10 l\ndiagnose debug flow trace start 10\ndiagnose sys session list"
      ],
      guiSteps: [
        "Relire les quiz de section : chaque mauvaise réponse est une section à revoir.",
        "Lancer le quiz final ci-dessous (questions mélangées de tous les parcours).",
        "Atteindre 70 % minimum, puis reproduire les labs en autonomie."
      ],
      diagram: "quiz-final",
      terminology: ["Évaluation", "Seuil de réussite", "Référentiel"],
      concepts: [
        { term: "Seuil de réussite", def: "70 % de bonnes réponses minimum, aligné sur les critères d'évaluation du module MASTER NMA." }
      ],
      alerts: [
        { type: "info", icon: "fa-circle-info", text: "Les questions sont tirées de tous les parcours et mélangées : échouez sur un thème ? Retournez à la section correspondante, puis retentez." }
      ],
      table: {
        headers: ["Parcours", "Sections", "Compétence évaluée"],
        rows: [
          ["Socle", "00-10", "Déployer interfaces, zones, politiques, NAT, services"],
          ["Sécurité", "11-16", "Durcir, sauvegarder, résister aux attaques"],
          ["Services", "17-22", "Maîtriser NAT avancé, DNS Filter, QoS"],
          ["Interconnexion", "23-27, 33-34", "SSL-VPN, IPsec, SD-WAN, OSPF/BGP"],
          ["Exploitation", "28-32", "Logs, alertes, supervision, API, génération"]
        ]
      },
      subsections: [
        { title: "Comment se préparer", content: "Reprenez chaque quiz de section en visant 100 % : les mauvaises réponses pointent précisément les notions à revoir. Refaites le Lab 1 en autonomie chronométrée (45 minutes pour le socle complet) : la vitesse de gestuelle est un excellent indicateur de maîtrise. Enfin, relisez la matrice de flux et le plan d'adressage du CDC : deux tableaux qui structurent tout l'examen." },
        { title: "Le quiz final", content: "L'outil ci-dessous tire des questions de tous les parcours, mélange questions et options, applique le seuil de 70 % et mémorise votre meilleur score. Le corrigé explique chaque réponse : l'évaluation est aussi un moment d'apprentissage. Vous pouvez le repasser autant de fois que nécessaire — l'objectif est la maîtrise durable, pas le score ponctuel." },
        { title: "Après le quiz", content: "La certification du parcours, c'est la mise en production : transposer le socle validé au labo sur le FortiGate physique du centre, avec le formateur en témoin et le CDC comme contrat. Le journal de validation du lab devient la base du PV de recette. Bienvenue dans le monde des administrateurs FortiGate." }
      ]
    }
  ]);
})();
