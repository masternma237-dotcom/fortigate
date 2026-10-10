/* ============================================================
   data/core.js — Parcours Socle (sections 00 à 10)
   Guide Interactif FortiGate — CFP-CMD / MASTER NMA
   ============================================================ */
(function () {
  "use strict";

  /* Registre des parcours (tracks) du guide */
  FG.addTracks({
    "socle": {
      name: "Socle FortiGate",
      icon: "fa-solid fa-layer-group",
      color: "var(--track-socle)",
      description: "De la prise en main à la validation : interfaces, zones, politiques, NAT, services et tests."
    },
    "securite": {
      name: "Sécurité avancée",
      icon: "fa-solid fa-user-shield",
      color: "var(--track-securite)",
      description: "Durcissement, anti-brute force, DoS, sauvegardes : blinder le FortiGate."
    },
    "services": {
      name: "Services réseau",
      icon: "fa-solid fa-gears",
      color: "var(--track-services)",
      description: "NAT avancé, DNS Filter, NTP, DHCP avancé et QoS pour maîtriser les flux."
    },
    "interconnexion": {
      name: "VPN & interconnexion",
      icon: "fa-solid fa-link",
      color: "var(--track-interconnexion)",
      description: "SSL-VPN, IPsec, SD-WAN, failover multi-WAN, OSPF et BGP."
    },
    "exploitation": {
      name: "Exploitation & automatisation",
      icon: "fa-solid fa-terminal",
      color: "var(--track-exploitation)",
      description: "Logs, alertes, SNMP, API REST et générateur de configuration."
    },
    "labs": {
      name: "Labs & évaluation",
      icon: "fa-solid fa-flask",
      color: "var(--track-labs)",
      description: "Mettre en pratique : labo Proxmox, scénarios complets et quiz final."
    }
  });

  FG.addSections([

    /* ------------------------------------------------ 00 */
    {
      id: "introduction",
      track: "socle",
      level: "debutant",
      title: "Introduction à FortiGate",
      icon: "fa-solid fa-rocket",
      step: "00",
      requires: [],
      description: "Découvrez le pare-feu FortiGate, son système d'exploitation FortiOS et son rôle dans la sécurité périmétrique du CFP-CMD. Cette section pose les bases nécessaires avant toute manipulation.",
      cliCommands: [
        "# Vérifier la version de FortiOS et le modèle de l'équipement\nget system status",
        "# Afficher la configuration courante (extrait)\nshow system global"
      ],
      guiSteps: [
        "<span class='wb-path'>Dashboard → Status</span> → visualiser le modèle, la version FortiOS, la licence et l'état des interfaces.",
        "<span class='wb-path'>Dashboard → Network</span> → observer les compteurs de trafic en temps réel."
      ],
      diagram: "intro",
      terminology: ["FortiGate", "FortiOS", "UTM", "NGFW", "VDOM", "GUI", "CLI", "FortiGuard", "Firmware"],
      concepts: [
        { term: "FortiGate", def: "Pare-feu de nouvelle génération (NGFW) de Fortinet combinant filtrage, VPN, IPS, antivirus et contrôle applicatif dans un même boîtier." },
        { term: "FortiOS", def: "Système d'exploitation unifié des équipements Fortinet, administrable via interface web (GUI) et ligne de commande (CLI)." },
        { term: "UTM", def: "Unified Threat Management : suite de protections intégrées (antivirus, IPS, filtrage web, anti-spam, contrôle applicatif)." },
        { term: "VDOM", def: "Virtual Domain : découpage logique d'un FortiGate en plusieurs pare-feu virtuels indépendants." }
      ],
      alerts: [
        { type: "info", icon: "fa-circle-info", text: "Le FortiGate remplace ici le routeur MikroTik du CFP-CMD : les concepts de zones et de politiques remplacent les bridges et les chaînes de filtrage." },
        { type: "warning", icon: "fa-triangle-exclamation", text: "Ne confondez pas le compte admin du FortiGate (gestion de l'équipement) et les comptes utilisateurs (authentification du trafic)." }
      ],
      table: {
        headers: ["Élément", "Spécification CFP-CMD"],
        rows: [
          ["Modèle visé", "FortiGate 60F / 100F / 200F selon débit"],
          ["Mode de fonctionnement", "NAT/route (coupure Internet)"],
          ["Interfaces clés", "wan1, internal, dmz, VLAN 20"],
          ["Accès d'administration", "HTTPS (GUI) et SSH (CLI)"],
          ["Licence", "FortiGuard UTM (IPS, AV, Web Filtering)"]
        ]
      },
      subsections: [
        { title: "Pourquoi remplacer le MikroTik ?", content: "Le MikroTik assure aujourd'hui le routage et un filtrage basique, mais il n'offre ni IPS, ni antivirus, ni contrôle applicatif intégré. Le FortiGate apporte une inspection de niveau applicatif, des profils UTM maintenus par FortiGuard et une supervision avancée (FortiView, logs centralisés, rapports). Cette migration renforce la sécurité périmétrique du centre de formation tout en simplifiant l'administration." },
        { title: "Les deux interfaces d'administration", content: "La GUI web est accessible en HTTPS sur l'adresse de l'interface interne (par défaut 192.168.1.99). La CLI s'utilise en console, en SSH ou depuis la GUI. Les étudiants doivent maîtriser les deux : la GUI pour l'apprentissage visuel, la CLI pour l'automatisation et le dépannage. Chaque section de ce guide présente les deux approches." },
        { title: "Prérequis matériels", content: "Prévoyez un FortiGate 60F minimum pour le labo (5 ports Gigabit), un onduleur, des câbles console (RJ45/DB9) et un poste d'administration avec navigateur à jour. Pour les travaux pratiques sans matériel, FortiGate-VM peut être déployé sur Proxmox VE (voir Lab 0). Une licence FortiGuard d'évaluation active les mises à jour IPS et antivirus." }
      ]
    },

    /* ------------------------------------------------ 01 */
    {
      id: "prise-en-main",
      track: "socle",
      level: "debutant",
      title: "Prise en main et sécurisation",
      icon: "fa-solid fa-shield-halved",
      step: "01",
      requires: ["introduction"],
      description: "Sécurisez l'accès d'administration : mot de passe fort, MFA, restriction par trusted hosts, désactivation des services inutiles et mise à jour du firmware.",
      cliCommands: [
        "# 1. Identité et fuseau horaire\nconfig system global\n    set hostname FGT-CFP-CMD\n    set timezone 01\n    set admintimeout 15\nend",
        "# 2. Mot de passe administrateur (12 caractères minimum)\nconfig system admin\n    edit admin\n        set password <MOT_DE_PASSE_FORT>\n        set trusthost1 192.168.10.0 255.255.255.0\n        set two-factor fortitoken\n    next\nend",
        "# 3. Restreindre les services d'accès aux interfaces\nconfig system interface\n    edit internal\n        set allowaccess ping https ssh\n    next\nend",
        "# 4. Vérifier les mises à jour firmware\ndiagnose system version\nexecute update-now"
      ],
      guiSteps: [
        "<span class='wb-path'>System → Administrators</span> → éditer admin → définir un mot de passe fort + Trusted Hosts.",
        "<span class='wb-path'>System → Administrators → admin → Two-factor Authentication</span> → associer un FortiToken.",
        "<span class='wb-path'>System → Firmware</span> → vérifier et appliquer la version stable recommandée.",
        "<span class='wb-path'>System → Settings</span> → hostname, fuseau horaire, NTP."
      ],
      diagram: "prise-en-main",
      terminology: ["admin", "MFA", "FortiToken", "Trusted host", "admintimeout", "Firmware", "NTP"],
      concepts: [
        { term: "Trusted host", def: "Liste blanche d'adresses IP autorisées à ouvrir une session d'administration. Toute autre source est rejetée avant même l'authentification." },
        { term: "MFA", def: "Authentification à deux facteurs : au mot de passe s'ajoute un code temporaire généré par un FortiToken (matériel ou mobile)." },
        { term: "admintimeout", def: "Durée d'inactivité (en minutes) avant déconnexion automatique d'une session d'administration. 15 minutes recommandées." }
      ],
      alerts: [
        { type: "danger", icon: "fa-triangle-exclamation", text: "Ne désactivez jamais le compte admin unique sans avoir créé un compte de secours : vous risquez de perdre l'accès à l'équipement." },
        { type: "warning", icon: "fa-triangle-exclamation", text: "Le HTTPS non chiffré (HTTP) et Telnet doivent rester désactivés sur toutes les interfaces." }
      ],
      table: {
        headers: ["Service d'accès", "Recommandation"],
        rows: [
          ["ping", "Autorisé sur LAN_IT uniquement (diagnostic)"],
          ["https", "Autorisé LAN_IT (administration GUI)"],
          ["ssh", "Autorisé LAN_IT (administration CLI)"],
          ["http / telnet", "Toujours désactivé (non chiffré)"],
          ["fgfm", "Autorisé si gestion centralisée FortiManager"]
        ]
      },
      subsections: [
        { title: "Première connexion", content: "Le FortiGate neuf expose 192.168.1.99 sur son interface internal, avec le compte admin sans mot de passe. Connectez un poste en 192.168.1.x, ouvrez https://192.168.1.99 et définissez immédiatement un mot de passe de 12 caractères minimum combinant majuscules, minuscules, chiffres et symboles. Cette première étape conditionne toute la sécurité du projet." },
        { title: "Restriction de l'accès d'administration", content: "Les trusted hosts limitent les sources IP pouvant se connecter : seul le VLAN d'administration (192.168.10.0/24) doit être autorisé. Complétez en désactivant les services inutiles par interface : Telnet et HTTP n'ont rien à faire sur un équipement de sécurité moderne. En cas de verrouillage, l'accès console physique reste la porte de secours." },
        { title: "Mise à jour du firmware", content: "Consultez la matrice de compatibilité Fortinet et appliquez la version stable recommandée (branche M, ex. 7.4.x). Sauvegardez la configuration avant toute montée de version, planifiez la mise à jour hors production et vérifiez ensuite l'état des licences FortiGuard, indispensables aux profils UTM." }
      ]
    },

    /* ------------------------------------------------ 02 */
    {
      id: "interfaces-zones",
      track: "socle",
      level: "debutant",
      title: "Interfaces et zones de sécurité",
      icon: "fa-solid fa-network-wired",
      step: "02",
      requires: ["prise-en-main"],
      description: "Configurez les interfaces physiques et virtuelles (VLAN) du FortiGate, puis regroupez-les en zones de sécurité : WAN, LAN_IT, HOTSPOT et DMZ.",
      cliCommands: [
        "# Interface LAN IT\nconfig system interface\n    edit internal\n        set ip 192.168.10.1 255.255.255.0\n        set allowaccess ping https ssh\n        set alias \"LAN_IT\"\n    next\nend",
        "# Interface Hotspot (VLAN 20 sur le port internal)\nconfig system interface\n    edit vlan20\n        set vdom root\n        set interface internal\n        set vlanid 20\n        set ip 192.168.20.1 255.255.255.0\n        set allowaccess ping\n        set alias \"HOTSPOT\"\n    next\nend",
        "# Interface DMZ\nconfig system interface\n    edit dmz\n        set ip 192.168.30.1 255.255.255.0\n        set allowaccess ping\n        set alias \"DMZ\"\n    next\nend",
        "# Zones de sécurité\nconfig system zone\n    edit \"LAN_IT\"\n        set interface internal\n    next\n    edit \"HOTSPOT\"\n        set interface vlan20\n    next\n    edit \"DMZ\"\n        set interface dmz\n    next\n    edit \"WAN\"\n        set interface wan1\n    next\nend"
      ],
      guiSteps: [
        "<span class='wb-path'>Network → Interfaces</span> → éditer internal → rôle LAN, IP 192.168.10.1/24, alias LAN_IT.",
        "<span class='wb-path'>Network → Interfaces → Create New → Interface</span> → nom vlan20, VLAN ID 20, interface physique internal, IP 192.168.20.1/24.",
        "<span class='wb-path'>Network → Interfaces → Create New → Zone</span> → créer LAN_IT, HOTSPOT, DMZ, WAN et y attacher les interfaces."
      ],
      diagram: "zones",
      terminology: ["Interface", "Zone", "VLAN", "Alias", "allowaccess", "DMZ", "WAN", "LAN"],
      concepts: [
        { term: "Zone", def: "Regroupement logique d'interfaces partageant les mêmes politiques de filtrage. Une politique s'écrit alors entre zones plutôt qu'entre interfaces." },
        { term: "VLAN", def: "Réseau local virtuel (norme IEEE 802.1Q) : tag les trames pour séparer logiquement plusieurs réseaux sur un même lien physique." },
        { term: "DMZ", def: "Zone démilitarisée hébergeant les serveurs exposés à Internet : une compromission y est contenue, sans accès au LAN interne." },
        { term: "allowaccess", def: "Liste des services d'administration (ping, https, ssh…) acceptés sur une interface donnée." }
      ],
      alerts: [
        { type: "warning", icon: "fa-triangle-exclamation", text: "Une interface ne peut appartenir qu'à une seule zone. Planifiez le découpage avant de créer les politiques." },
        { type: "info", icon: "fa-circle-info", text: "Le VLAN 20 (Hotspot) est transporté sur le port internal : le switch en aval doit propager le tag 802.1Q." }
      ],
      table: {
        headers: ["Zone", "Interface", "Réseau", "Rôle"],
        rows: [
          ["WAN", "wan1", "DHCP ou statique FAI", "Liaison Internet"],
          ["LAN_IT", "internal", "192.168.10.0/24", "Administration et postes techniques"],
          ["HOTSPOT", "vlan20", "192.168.20.0/24", "Wi-Fi public des apprenants"],
          ["DMZ", "dmz", "192.168.30.0/24", "Serveurs exposés (web)"]
        ]
      },
      subsections: [
        { title: "Rôles d'interfaces", content: "FortiOS attribue un rôle à chaque interface : LAN, WAN ou DMZ. Ce rôle conditionne les assistants de configuration et les valeurs par défaut (DHCP côté LAN, DNS récursif, etc.). Définissez le rôle dès la création : il reste visible dans la GUI et clarifie l'architecture pour les futurs administrateurs." },
        { title: "Sous-interfaces VLAN", content: "L'interface vlan20 est une sous-interface 802.1Q attachée au port internal : chaque trame taguée VLAN 20 reçue par le FortiGate est traitée dans le réseau 192.168.20.0/24. Le switch d'accès doit être configuré pour taguer les ports Hotspot sur ce VLAN. On obtient ainsi deux zones logiques sur un seul câble." },
        { title: "Pourquoi des zones ?", content: "Les zones réduisent le nombre de politiques et rendent les règles lisibles : une politique LAN_IT → WAN reste valable même si l'interface physique change. Elles imposent aussi une réflexion par domaine de confiance, base de toute architecture sécurisée. Dans ce projet, quatre zones suffisent : WAN, LAN_IT, HOTSPOT et DMZ." }
      ]
    },

    /* ------------------------------------------------ 03 */
    {
      id: "politiques-filtrage",
      track: "socle",
      level: "debutant",
      title: "Politiques de filtrage",
      icon: "fa-solid fa-list-check",
      step: "03",
      requires: ["interfaces-zones"],
      description: "Écrivez les règles cœur du projet : autoriser les flux légitimes vers Internet, isoler le Hotspot et la DMZ du LAN_IT, et journaliser les refus.",
      cliCommands: [
        "# LAN_IT → WAN (autorisé, NAT, UTM)\nconfig firewall policy\n    edit 1\n        set name \"LAN_IT_to_WAN\"\n        set srcintf \"LAN_IT\"\n        set dstintf \"WAN\"\n        set srcaddr all\n        set dstaddr all\n        set action accept\n        set schedule \"always\"\n        set service ALL\n        set nat enable\n        set utm-status enable\n        set av-profile \"default\"\n        set ips-sensor \"default\"\n        set ssl-ssh-profile \"certificate-inspection\"\n    next\nend",
        "# HOTSPOT → WAN (Web uniquement, UTM renforcé)\nconfig firewall policy\n    edit 2\n        set name \"HOTSPOT_to_WAN\"\n        set srcintf \"HOTSPOT\"\n        set dstintf \"WAN\"\n        set srcaddr all\n        set dstaddr all\n        set action accept\n        set schedule \"always\"\n        set service HTTP HTTPS DNS\n        set nat enable\n        set utm-status enable\n        set av-profile \"default\"\n        set ips-sensor \"default\"\n        set webfilter-profile \"default\"\n        set application-list \"default\"\n    next\nend",
        "# HOTSPOT → LAN_IT : INTERDIT\nconfig firewall policy\n    edit 3\n        set name \"HOTSPOT_to_LAN_IT_DENY\"\n        set srcintf \"HOTSPOT\"\n        set dstintf \"LAN_IT\"\n        set srcaddr all\n        set dstaddr all\n        set action deny\n        set schedule \"always\"\n        set service ALL\n        set logtraffic all\n    next\nend",
        "# DMZ → LAN_IT : INTERDIT\nconfig firewall policy\n    edit 4\n        set name \"DMZ_to_LAN_IT_DENY\"\n        set srcintf \"DMZ\"\n        set dstintf \"LAN_IT\"\n        set srcaddr all\n        set dstaddr all\n        set action deny\n        set schedule \"always\"\n        set service ALL\n        set logtraffic all\n    next\nend"
      ],
      guiSteps: [
        "<span class='wb-path'>Policy & Objects → Firewall Policy</span> → Create New → nom, zones source/destination, service, NAT.",
        "Activer <span class='wb-path'>Security Profiles</span> dans la politique et choisir les profils AV / IPS / Web Filter.",
        "Réordonner les politiques : les règles DENY explicites avant les ACCEPT larges.",
        "<span class='wb-path'>Policy & Objects → Firewall Policy → Logging Options</span> → journaliser All Sessions sur les règles sensibles."
      ],
      diagram: "politiques",
      terminology: ["Politique de sécurité", "Deny implicite", "Ordre des règles", "Schedule", "Service", "Logtraffic"],
      concepts: [
        { term: "Politique de sécurité", def: "Règle de filtrage évaluée de haut en bas : zones source/destination, adresses, services, action (accept/deny) et profils UTM associés." },
        { term: "Deny implicite", def: "Règle finale invisible qui rejette tout trafic n'ayant matched aucune politique : ce qui n'est pas explicitement autorisé est interdit." },
        { term: "Logtraffic", def: "Paramètre de journalisation d'une politique (all, utm, disable) : indispensable pour auditer les refus et les flux autorisés." }
      ],
      alerts: [
        { type: "warning", icon: "fa-triangle-exclamation", text: "L'ordre des politiques est déterminant : la première règle correspondante s'applique. Placez les DENY ciblés avant les ACCEPT larges." },
        { type: "danger", icon: "fa-triangle-exclamation", text: "Sans politique explicite, tout flux inter-zones est rejeté par le deny implicite : testez chaque nouveau flux après création." }
      ],
      table: {
        headers: ["#", "Nom", "Source → Destination", "Service", "Action", "UTM"],
        rows: [
          ["1", "LAN_IT_to_WAN", "LAN_IT → WAN", "ALL", "Accept", "AV + IPS"],
          ["2", "HOTSPOT_to_WAN", "HOTSPOT → WAN", "HTTP, HTTPS, DNS", "Accept", "AV + IPS + WF + AppCtrl"],
          ["3", "HOTSPOT_to_LAN_IT_DENY", "HOTSPOT → LAN_IT", "ALL", "Deny", "—"],
          ["4", "DMZ_to_LAN_IT_DENY", "DMZ → LAN_IT", "ALL", "Deny", "—"],
          ["5", "WAN_to_DMZ_HTTP", "WAN → DMZ (VIP)", "HTTP, HTTPS", "Accept", "AV + IPS"],
          ["10", "VPN_to_LAN_IT", "SSL-VPN → LAN_IT", "ALL", "Accept", "AV + IPS"]
        ]
      },
      subsections: [
        { title: "Le modèle d'évaluation FortiOS", content: "À l'arrivée d'un paquet, FortiOS identifie la session, recherche une politique correspondante de haut en bas (zones, adresses, services, horaire) et applique la première règle trouvée. Si aucune ne correspond, le deny implicite rejette le trafic. Ce modèle « deny by default » est le fondement de la matrice de flux du CDC." },
        { title: "Associer les profils UTM", content: "Une politique accept peut embarquer des profils de sécurité : antivirus, IPS, web filtering, application control. Pour le Hotspot, le CDC exige un UTM renforcé (web filter + app control) car ce sont des équipements non maîtrisés. Le profil SSL certificate-inspection déchiffre les métadonnées TLS sans casser la confidentialité, bon compromis pour débuter." },
        { title: "Journaliser pour comprendre", content: "Activez logtraffic all sur les politiques sensibles (refus inter-zones, accès DMZ). Les logs alimentent FortiView, le serveur Syslog distant et les rapports quotidiens. Un refus non journalisé est un refus qu'on ne pourra ni prouver ni déboguer." }
      ]
    },

    /* ------------------------------------------------ 04 */
    {
      id: "nat-vip",
      track: "socle",
      level: "debutant",
      title: "NAT et VIP (publication de services)",
      icon: "fa-solid fa-right-left",
      step: "04",
      requires: ["politiques-filtrage"],
      description: "Maîtrisez la traduction d'adresses sortante (masquerade vers Internet) et la publication du serveur web de la DMZ via une adresse IP virtuelle (VIP).",
      cliCommands: [
        "# NAT sortant : déjà activé par \"set nat enable\" dans les politiques vers WAN\n# VIP : publication HTTP du serveur DMZ\nconfig firewall vip\n    edit \"VIP_WEB\"\n        set extip 203.0.113.10\n        set extintf \"wan1\"\n        set portforward enable\n        set mappedip 192.168.30.10\n        set extport 80\n        set mappedport 80\n    next\nend",
        "# Politique associée : WAN → DMZ via la VIP\nconfig firewall policy\n    edit 5\n        set name \"WAN_to_DMZ_HTTP\"\n        set srcintf \"WAN\"\n        set dstintf \"DMZ\"\n        set srcaddr all\n        set dstaddr \"VIP_WEB\"\n        set action accept\n        set schedule \"always\"\n        set service HTTP\n    next\nend"
      ],
      guiSteps: [
        "<span class='wb-path'>Policy & Objects → Virtual IPs</span> → Create New → nom VIP_WEB, interface wan1, IP externe, port forwarding 80 → 192.168.30.10:80.",
        "<span class='wb-path'>Policy & Objects → Firewall Policy</span> → créer la politique WAN → DMZ avec dstaddr = VIP_WEB.",
        "<span class='wb-path'>Policy & Objects → Firewall Policy</span> → vérifier que NAT est coché sur les politiques sortantes."
      ],
      diagram: "nat-vip",
      terminology: ["NAT", "Masquerade", "VIP", "Port forwarding", "PAT", "IP pool"],
      concepts: [
        { term: "NAT", def: "Network Address Translation : réécrit les adresses IP/ports pour permettre à des réseaux privés d'accéder à Internet via une ou quelques adresses publiques." },
        { term: "VIP", def: "Virtual IP : adresse publique (ou port) mappée vers un serveur interne, point d'entrée contrôlé des services publiés." },
        { term: "Port forwarding", def: "Redirection d'un port externe vers un port interne d'un serveur : seul le service publié est exposé, pas la machine entière." }
      ],
      alerts: [
        { type: "warning", icon: "fa-triangle-exclamation", text: "La VIP seule ne publie rien : il faut une politique firewall WAN → DMZ autorisant le service vers la VIP." },
        { type: "danger", icon: "fa-triangle-exclamation", text: "N'exposez que les services nécessaires. Chaque port ouvert est une surface d'attaque surveillée par l'IPS." }
      ],
      table: {
        headers: ["Flux", "Traduction", "Remarque"],
        rows: [
          ["LAN_IT → Internet", "NAT masquerade sur wan1", "set nat enable dans la politique"],
          ["HOTSPOT → Internet", "NAT masquerade sur wan1", "Idem, UTM renforcé"],
          ["Internet → VIP_WEB:80", "203.0.113.10:80 → 192.168.30.10:80", "Port forwarding uniquement"],
          ["Internet → VIP_WEB:443", "à créer si besoin", "Répéter la VIP pour le port 443"]
        ]
      },
      subsections: [
        { title: "NAT sortant (masquerade)", content: "Toutes les politiques LAN_IT → WAN et HOTSPOT → WAN activent set nat enable : FortiOS traduit alors l'adresse source privée en l'adresse de wan1 (PAT). Côté FAI, une seule adresse publique représente l'ensemble du centre. Le suivi de session (session table) garantit le retour des réponses vers le bon poste." },
        { title: "Publier un serveur de la DMZ", content: "La VIP_WEB mappe l'IP publique externe (ici l'exemple RFC 5737 203.0.113.10) vers le serveur réel 192.168.30.10. Avec portforward enable, seuls les ports déclarés (80, puis 443 si besoin) sont redirigés. La politique WAN → DMZ restreint la destination à la VIP : impossible d'atteindre d'autres machines de la DMZ." },
        { title: "Vérifier les traductions", content: "diagnose firewall sniffer packet confirme les paquets reçus sur wan1, diagnose sys session list montre les sessions NATées avec leurs traductions source/destination. Côté GUI, FortiView → Sessions affiche en temps réel les flux et les politiques appliquées : un réflexe à prendre dès le premier lab." }
      ]
    },

    /* ------------------------------------------------ 05 */
    {
      id: "adressage-routage",
      track: "socle",
      level: "intermediaire",
      title: "Adressage IP et routage statique",
      icon: "fa-solid fa-route",
      step: "05",
      requires: ["interfaces-zones"],
      description: "Structurez le plan d'adressage du CFP-CMD et maîtrisez la table de routage : route par défaut vers le FAI, routes statiques vers les réseaux distants via VPN.",
      cliCommands: [
        "# Route par défaut vers la passerelle FAI\nconfig router static\n    edit 1\n        set dst 0.0.0.0 0.0.0.0\n        set gateway 203.0.113.1\n        set device \"wan1\"\n    next\nend",
        "# Route statique vers le site distant via le tunnel IPsec\nconfig router static\n    edit 2\n        set dst 192.168.40.0 255.255.255.0\n        set device \"to_siteB\"\n    next\nend",
        "# Vérifier la table de routage\ndiagnose ip route list\nget router info routing-table all"
      ],
      guiSteps: [
        "<span class='wb-path'>Network → Static Routes</span> → Create New → destination 0.0.0.0/0, passerelle FAI, interface wan1.",
        "<span class='wb-path'>Network → Static Routes</span> → route vers 192.168.40.0/24 via l'interface du tunnel to_siteB.",
        "<span class='wb-path'>Dashboard → Network → Routing Table</span> → vérifier les routes actives."
      ],
      diagram: "routage",
      terminology: ["IPv4", "CIDR", "Passerelle", "Route statique", "Route par défaut", "Distance administrative"],
      concepts: [
        { term: "Route par défaut", def: "Route 0.0.0.0/0 utilisée quand aucune route plus spécifique ne correspond : elle pointe vers la passerelle du FAI sur wan1." },
        { term: "Distance administrative", def: "Indice de préférence entre sources de routes (connecté, statique, OSPF, BGP) : plus il est faible, plus la source est prioritaire." },
        { term: "CIDR", def: "Classless Inter-Domain Routing : notation adresse/préfixe (ex. 192.168.10.0/24) décrivant précisément un bloc d'adresses." }
      ],
      alerts: [
        { type: "warning", icon: "fa-triangle-exclamation", text: "Deux routes vers la même destination avec des distances différentes créent un failover, pas un load balancing." },
        { type: "info", icon: "fa-circle-info", text: "En mode DHCP sur wan1, la route par défaut est apprise automatiquement : ne la dupliquez pas en statique." }
      ],
      table: {
        headers: ["Destination", "Passerelle / Interface", "Rôle"],
        rows: [
          ["0.0.0.0/0", "FAI via wan1", "Tous les flux Internet"],
          ["192.168.10.0/24", "Connecté (internal)", "LAN_IT"],
          ["192.168.20.0/24", "Connecté (vlan20)", "HOTSPOT"],
          ["192.168.30.0/24", "Connecté (dmz)", "DMZ"],
          ["192.168.40.0/24", "to_siteB (IPsec)", "Site distant"]
        ]
      },
      subsections: [
        { title: "Plan d'adressage du CFP-CMD", content: "Le CDC impose un adressage lisible : 192.168.10.0/24 pour l'IT, 192.168.20.0/24 pour le Hotspot, 192.168.30.0/24 pour la DMZ, 10.10.10.0/24 pour le pool SSL-VPN et 192.168.40.0/24 pour le site distant. Cette cohérence facilite l'écriture des politiques, la lecture des logs et la formation des nouveaux administrateurs." },
        { title: "Routage et zones de confiance", content: "Chaque interface connectée installe automatiquement sa route « connected ». Seules deux routes statiques sont nécessaires : la route par défaut vers le FAI et la route vers le site distant via le tunnel IPsec (l'interface tunnel joue le rôle de passerelle). Toute destination inconnue finit par la route par défaut, donc part vers Internet puis est filtrée par les politiques." },
        { title: "Outils de diagnostic", content: "get router info routing-table all affiche la RIB avec distances administratives ; diagnose ip route list détaille les routes du kernel. Pour tracer un flux, diagnose sniffer packet any 'host 192.168.40.10' et le debug flow montrent quelle route et quelle politique sont retenues. Ces réflexes sont évalués dans les labs." }
      ]
    }
    ,

    /* ------------------------------------------------ 06 */
    {
      id: "dhcp",
      track: "socle",
      level: "intermediaire",
      title: "Serveur DHCP",
      icon: "fa-solid fa-server",
      step: "06",
      requires: ["adressage-routage"],
      description: "Transformez le FortiGate en serveur DHCP pour le LAN_IT et le Hotspot : plages, baux, réservations et options avancées.",
      cliCommands: [
        "# DHCP pour le LAN_IT\nconfig system dhcp server\n    edit 1\n        set dns-service default\n        set default-gateway 192.168.10.1\n        set netmask 255.255.255.0\n        set interface \"internal\"\n        config ip-range\n            edit 1\n                set start 192.168.10.10\n                set end 192.168.10.200\n            next\n        end\n    next\nend",
        "# Réservation fixe pour l'imprimante du LAN_IT\nconfig system dhcp server\n    edit 1\n        config reserved-address\n            edit 1\n                set mac 00:11:22:33:44:55\n                set ip 192.168.10.50\n            next\n        end\n    next\nend",
        "# Vérifier les baux actifs\ndiagnose dhcp lease list"
      ],
      guiSteps: [
        "<span class='wb-path'>Network → DHCP Server</span> → Create New → interface internal, plage 192.168.10.10-200, passerelle, DNS.",
        "<span class='wb-path'>Network → DHCP Server → Advanced</span> → durée du bail, options supplémentaires.",
        "<span class='wb-path'>Network → DHCP Server → Réserved addresses</span> → associer MAC → IP pour les équipements fixes."
      ],
      diagram: "dhcp",
      terminology: ["DHCP", "Bail", "Réservation", "IP-range", "Option DHCP"],
      concepts: [
        { term: "DHCP", def: "Protocole d'attribution automatique de configuration IP (adresse, masque, passerelle, DNS) à l'arrivée d'un client sur le réseau." },
        { term: "Bail", def: "Durée de validité d'une adresse louée à un client : renouvelée à mi-vie, libérée à l'expiration." },
        { term: "Réservation", def: "Association statique adresse MAC → IP garantissant qu'un équipement reçoit toujours la même adresse." }
      ],
      alerts: [
        { type: "warning", icon: "fa-triangle-exclamation", text: "N'excluez jamais la passerelle (.1) de la plage réservable : gardez .2-.9 pour les équipements fixes." },
        { type: "info", icon: "fa-circle-info", text: "Un seul serveur DHCP par segment : coupez le DHCP du MikroTik avant d'activer celui du FortiGate." }
      ],
      table: {
        headers: ["Paramètre", "LAN_IT", "HOTSPOT"],
        rows: [
          ["Plage", "192.168.10.10 - 192.168.10.200", "192.168.20.10 - 192.168.20.250"],
          ["Passerelle", "192.168.10.1", "192.168.20.1"],
          ["DNS", "8.8.8.8 (ou DNS local)", "8.8.8.8"],
          ["Durée du bail", "8 heures", "1 heure (rotation rapide)"],
          ["Réservations", "Imprimante, caméras, serveurs", "Aucune"]
        ]
      },
      subsections: [
        { title: "Positionnement du service", content: "Le FortiGate héberge nativement un serveur DHCP par interface. Pour le LAN_IT, des baux longs (8 h) et des réservations stabilisent les équipements d'administration. Pour le Hotspot, des baux courts (1 h) recyclent rapidement les adresses d'un parc d'apprenants à forte rotation. Les plages démarrent à .10 pour laisser la plage basse aux équipements fixes." },
        { title: "Réservations et équipements sensibles", content: "Imprimantes, caméras et serveurs doivent conserver la même adresse sans dépendre d'un OS client : la réservation par MAC l'assure tout en restant gérée centralement. Documentez chaque réservation dans la table du CDC pour éviter les doublons lors des évolutions du réseau." },
        { title: "Contrôle et dépannage", content: "diagnose dhcp lease list affiche les baux délivrés avec MAC, IP et expiration. En cas de conflit, vérifiez qu'aucun autre serveur DHCP n'est actif sur le segment (un hotspot pirate ou un routeur oublié). Les options DHCP avancées (relais, options 42/66/121) sont traitées dans la section Services réseau." }
      ]
    },

    /* ------------------------------------------------ 07 */
    {
      id: "dns-local",
      track: "socle",
      level: "intermediaire",
      title: "DNS local et résolution",
      icon: "fa-solid fa-globe",
      step: "07",
      requires: ["adressage-routage"],
      description: "Utilisez le FortiGate comme résolveur DNS, définissez des enregistrements locaux et préparez le filtrage DNS des domaines malveillants.",
      cliCommands: [
        "# Le FortiGate comme serveur DNS pour le LAN\nconfig system dns-server\n    edit \"internal\"\n    next\nend",
        "# Enregistrement local (résolution interne)\nconfig system dns-database\n    edit \"cfp-cmd.local\"\n        set domain \"cfp-cmd.local\"\n        set view shadow\n        config dns-entry\n            edit 1\n                set hostname srv-web\n                set ip 192.168.30.10\n            next\n        end\n    next\nend",
        "# Résolveurs amont\nconfig system dns\n    set primary 8.8.8.8\n    set secondary 1.1.1.1\nend"
      ],
      guiSteps: [
        "<span class='wb-path'>Network → DNS Servers</span> → Create New → service DNS sur l'interface internal.",
        "<span class='wb-path'>Network → DNS Servers → DNS Database</span> → créer la zone cfp-cmd.local et ses entrées.",
        "<span class='wb-path'>Network → DNS</span> → définir les résolveurs amont (8.8.8.8, 1.1.1.1)."
      ],
      diagram: "dns",
      terminology: ["DNS", "Résolveur", "Forwarder", "DNS Filter", "FQDN"],
      concepts: [
        { term: "DNS", def: "Système de résolution de noms de domaine en adresses IP, socle silencieux de toutes les communications modernes." },
        { term: "DNS Filter", def: "Profil UTM bloquant les domaines malveillants ou interdits avant même l'établissement de la connexion HTTP." },
        { term: "FQDN", def: "Fully Qualified Domain Name : nom de domaine complet (ex. srv-web.cfp-cmd.local) utilisable dans les objets de politique." }
      ],
      alerts: [
        { type: "warning", icon: "fa-triangle-exclamation", text: "Si le FortiGate fait résolveur, pensez à autoriser le service DNS sur l'interface concernée et dans les politiques HOTSPOT → WAN." },
        { type: "info", icon: "fa-circle-info", text: "Le DNS Filter complète le web filtering : il bloque à la résolution, avant tout échange applicatif." }
      ],
      table: {
        headers: ["Nom", "Type", "Valeur", "Usage"],
        rows: [
          ["srv-web.cfp-cmd.local", "A", "192.168.30.10", "Serveur web DMZ"],
          ["switch1.cfp-cmd.local", "A", "192.168.10.2", "Switch d'accès"],
          ["Resolvers amont", "—", "8.8.8.8 / 1.1.1.1", "Résolution Internet"]
        ]
      },
      subsections: [
        { title: "Résolution interne vs externe", content: "Les clients pointent vers 192.168.10.1 (LAN_IT) ou 192.168.20.1 (Hotspot). Le FortiGate répond localement pour la zone cfp-cmd.local et transmet le reste aux résolveurs amont. Cette séparation évite d'exposer la nomenclature interne sur Internet tout en gardant une configuration simple à maintenir." },
        { title: "Enregistrements locaux utiles", content: "Déclarez au minimum le serveur web de la DMZ et les équipements d'infrastructure. Les objets FQDN FortiOS peuvent aussi référencer des noms externes dans les politiques : l'adresse est résolue périodiquement, utile pour autoriser un dépôt de mise à jour sans IP fixe." },
        { title: "Préparer le DNS Filter", content: "Le profil DNS Filter (approfondi dans la piste Sécurité) s'attache aux politiques et bloque les catégories malveillantes (phishing, botnet C&C). En s'appuyant sur le résolveur local, le blocage est cohérent pour tous les clients du segment, même ceux qui contournent le proxy du navigateur." }
      ]
    },

    /* ------------------------------------------------ 08 */
    {
      id: "authentification",
      track: "socle",
      level: "intermediaire",
      title: "Authentification (LDAP, portail captif)",
      icon: "fa-solid fa-fingerprint",
      step: "08",
      requires: ["prise-en-main"],
      description: "Centralisez l'authentification : utilisateurs locaux, annuaire LDAP/Active Directory, portail captif du Hotspot et MFA pour les administrateurs.",
      cliCommands: [
        "# Utilisateur local\nconfig user local\n    edit \"formateur1\"\n        set type password\n        set passwd <MOT_DE_PASSE_FORT>\n    next\nend",
        "# Serveur LDAP (Active Directory)\nconfig user ldap\n    edit \"AD-CFPCMD\"\n        set server 192.168.10.20\n        set cnid samAccountName\n        set dn \"dc=cfp-cmd,dc=local\"\n        set port 389\n        set username \"cn=fortigate,dc=cfp-cmd,dc=local\"\n        set password <MOT_DE_PASSE_FORT>\n    next\nend\n# Test : diagnose test authserver AD-CFPCMD pap formateur1 <motdepasse>",
        "# Portail captif sur l'interface Hotspot\nconfig system interface\n    edit vlan20\n        set security-mode captive-portal\n    next\nend"
      ],
      guiSteps: [
        "<span class='wb-path'>User & Authentication → User Definition</span> → créer un utilisateur local ou LDAP.",
        "<span class='wb-path'>User & Authentication → LDAP Servers</span> → ajouter AD-CFPCMD puis tester la connexion.",
        "<span class='wb-path'>User & Authentication → User Groups</span> → grouper les utilisateurs (ex. FORMATEURS).",
        "<span class='wb-path'>Network → Interfaces → vlan20</span> → Security Mode = Captive Portal."
      ],
      diagram: "auth",
      terminology: ["LDAP", "Active Directory", "Portail captif", "Utilisateur local", "Groupe d'utilisateurs", "RADIUS", "MFA"],
      concepts: [
        { term: "LDAP", def: "Protocole d'interrogation d'annuaire : FortiOS délègue l'authentification à l'Active Directory du centre plutôt que de dupliquer les comptes." },
        { term: "Portail captif", def: "Page web imposée avant tout autre trafic : l'utilisateur s'identifie (ou accepte une charte) puis obtient l'accès." },
        { term: "Groupe d'utilisateurs", def: "Collection d'utilisateurs (locaux ou LDAP) utilisable comme source dans une politique de filtrage." }
      ],
      alerts: [
        { type: "warning", icon: "fa-triangle-exclamation", text: "Créez un compte de service dédié (lecture seule) pour les requêtes LDAP, jamais le compte administrateur du domaine." },
        { type: "danger", icon: "fa-triangle-exclamation", text: "Les politiques authentifiées doivent précéder les politiques « srcaddr all » sans quoi l'authentification ne serait jamais déclenchée." }
      ],
      table: {
        headers: ["Méthode", "Usage au CFP-CMD", "Facteur supplémentaire"],
        rows: [
          ["Local + MFA", "Comptes d'administration", "FortiToken obligatoire"],
          ["LDAP / AD", "Formateurs et personnel", "Selon politique du centre"],
          ["Portail captif", "Apprenants du Hotspot", "Charte d'utilisation"],
          ["RADIUS", "Équipements réseau (mgmt)", "—"]
        ]
      },
      subsections: [
        { title: "Hiérarchie des identités", content: "Trois familles de comptes coexistent : les administrateurs (locaux, MFA obligatoire, trusted hosts), le personnel (LDAP/AD, groupes synchronisés) et les apprenants (portail captif du Hotspot). Cette hiérarchie aligne les droits sur les zones : un apprenant authentifié reste confiné dans HOTSPOT → WAN." },
        { title: "Intégration Active Directory", content: "Le compte de service fortigate@cfp-cmd.local interroge l'annuaire en lecture. FortiOS importe ensuite les groupes AD comme objets utilisables dans les politiques : par exemple autoriser le groupe FORMATEURS à atteindre la DMZ pour administrer le serveur web. diagnose test authserver valide les identifiants sans attendre un test réel." },
        { title: "Portail captif du Hotspot", content: "En security-mode captive-portal sur vlan20, tout nouvel appareil est redirigé vers la page d'authentification avant d'obtenir l'accès. On peut exiger un compte LDAP, un simple accept de charte, ou combiner les deux. Les sessions authentifiées apparaissent dans FortiView : l'usage du Hotspot devient traçable par utilisateur et non plus par adresse MAC." }
      ]
    },

    /* ------------------------------------------------ 09 */
    {
      id: "utm-base",
      track: "socle",
      level: "intermediaire",
      title: "UTM de base (AV, IPS, Web Filtering)",
      icon: "fa-solid fa-shield-virus",
      step: "09",
      requires: ["politiques-filtrage"],
      description: "Activez les profils de sécurité FortiGuard : antivirus, IPS, filtrage web et contrôle applicatif, appliqués directement dans les politiques de filtrage.",
      cliCommands: [
        "# Profil antivirus avec inspection du flux\nconfig antivirus profile\n    edit \"UTM-CFPCMD\"\n        set comment \"AV CFP-CMD - inspection flux\"\n        config http\n            set options scan\n        end\n    next\nend",
        "# Capteur IPS (sévérité haute en bloc, moyenne en log)\nconfig ips sensor\n    edit \"UTM-CFPCMD\"\n        config entries\n            edit 1\n                set severity high critical\n                set status enable\n                set action block\n                set log enable\n            next\n        end\n    next\nend",
        "# Profil de filtrage web (catégories interdites)\nconfig webfilter profile\n    edit \"UTM-CFPCMD\"\n        set comment \"Filtrage web CFP-CMD\"\n        config ftgd-wf\n            unset options\n            config filters\n                edit 1\n                    set category 2 3 4\n                    set action block\n                next\n            end\n        end\n    next\nend",
        "# Application de ces profils dans une politique\nconfig firewall policy\n    edit 2\n        set utm-status enable\n        set av-profile \"UTM-CFPCMD\"\n        set ips-sensor \"UTM-CFPCMD\"\n        set webfilter-profile \"UTM-CFPCMD\"\n    next\nend"
      ],
      guiSteps: [
        "<span class='wb-path'>Security Profiles → AntiVirus</span> → Create New → inspecter HTTP/SMTP, actions block.",
        "<span class='wb-path'>Security Profiles → Intrusion Prevention</span> → Create New → sévérité high/critical en block.",
        "<span class='wb-path'>Security Profiles → Web Filter</span> → bloquer les catégories interdites (porno, jeux, malware).",
        "<span class='wb-path'>Policy & Objects → Firewall Policy</span> → cocher Security Profiles et sélectionner les profils créés."
      ],
      diagram: "utm",
      terminology: ["Antivirus", "IPS", "Web Filtering", "Application Control", "DNS Filter", "Profil UTM", "Inspection SSL"],
      concepts: [
        { term: "IPS", def: "Intrusion Prevention System : détecte et bloque les exploitations de vulnérabilités connues grâce aux signatures FortiGuard mises à jour en continu." },
        { term: "Web Filtering", def: "Contrôle des sites visités par catégories FortiGuard (malware, porno, jeux…) avec actions block/allow/monitor et quota." },
        { term: "Application Control", def: "Identification des applications (P2P, streaming, jeux) indépendamment des ports utilisés, pour les autoriser ou les bloquer." }
      ],
      alerts: [
        { type: "warning", icon: "fa-triangle-exclamation", text: "L'inspection profonde HTTPS exige un profil ssl-ssh-profile « deep-inspection » et le déploiement du certificat CA FortiGate sur les postes." },
        { type: "info", icon: "fa-circle-info", text: "Sans licence FortiGuard active, les profils restent configurables mais ne reçoivent plus de mises à jour de signatures : ils perdent leur efficacité." }
      ],
      table: {
        headers: ["Profil", "Flux visés", "Action par défaut", "Politique"],
        rows: [
          ["Antivirus", "HTTP, HTTPS, SMTP, FTP", "Block + log", "Toutes politiques accept"],
          ["IPS", "Tous (signatures)", "Block high/critical", "Toutes politiques accept"],
          ["Web Filter", "HTTP/HTTPS Hotspot", "Block catégories interdites", "HOTSPOT_to_WAN"],
          ["App Control", "P2P, jeux, streaming", "Block", "HOTSPOT_to_WAN"],
          ["DNS Filter", "Résolution DNS", "Block domaines malveillants", "HOTSPOT, LAN_IT"]
        ]
      },
      subsections: [
        { title: "Architecture des profils", content: "Un profil UTM se crée une fois puis se réutilise dans plusieurs politiques : UTM-CFPCMD (standard) pour le LAN_IT, une variante renforcée pour le Hotspot avec web filter et application control. Cette factorisation garantit une cohérence des réglages et simplifie les audits : on sait toujours quel profil protège quel flux." },
        { title: "Antivirus et IPS en pratique", content: "L'antivirus inspecte les fichiers transitant par les flux autorisés (test EICAR recommandé en formation). L'IPS analyse les motifs d'attaque : commencez en mode monitor quelques jours, évaluez les faux positifs, puis passez les sévérités high et critical en block. Cette progression évite de couper des services légitimes." },
        { title: "Filtrage web du Hotspot", content: "Pour un centre de formation, les catégories jeux, streaming illégal et contenus adultes sont bloquées ; les sites pédagogiques restent accessibles. Le profil ssl-ssh-profile certificate-inspection vérifie les certificats sans déchiffrer le contenu, bon équilibre entre protection et respect de la vie privée avant d'envisager l'inspection profonde." }
      ]
    },

    /* ------------------------------------------------ 10 */
    {
      id: "validation-tests",
      track: "socle",
      level: "tous",
      title: "Validation et tests du socle",
      icon: "fa-solid fa-clipboard-check",
      step: "10",
      requires: ["nat-vip", "dhcp", "dns-local", "authentification", "utm-base"],
      description: "Vérifiez systématiquement la configuration du socle : connectivité, isolation inter-zones, NAT, DNS, DHCP et UTM, avec les outils de diagnostic FortiOS.",
      cliCommands: [
        "# Sniffer le trafic sur wan1 (filtrage BPF)\ndiagnose sniffer packet wan1 'port 443' 4 10 l",
        "# Suivre la décision du moteur pour un flux\ndiagnose debug flow filter addr 192.168.20.50\ndiagnose debug flow trace start 10\ndiagnose debug enable",
        "# Lister les sessions actives et le NAT appliqué\ndiagnose sys session list | grep 192.168.20",
        "# Tester la résolution DNS depuis le FortiGate\nexecute ping google.com"
      ],
      guiSteps: [
        "<span class='wb-path'>Dashboard → FortiView Sessions</span> → vérifier les sessions actives et la politique appliquée.",
        "<span class='wb-path'>Log & Report → Forward Traffic</span> → filtrer par zone source HOTSPOT, vérifier les logs accept/deny.",
        "<span class='wb-path'>Dashboard → Status</span> → contrôler CPU, mémoire et sessions concurrentes après tests."
      ],
      diagram: "validation",
      terminology: ["Diagnostic", "sniffer packet", "Debug flow", "Table de sessions", "EICAR"],
      concepts: [
        { term: "Debug flow", def: "Trace temps réel des décisions du moteur FortiOS : route choisie, politique matchée, NAT appliqué, profils UTM." },
        { term: "Sniffer packet", def: "Capture BPF sur une interface (équivalent tcpdump) pour confirmer ce qui arrive et repart réellement." },
        { term: "EICAR", def: "Fichier de test standard (non malveillant) permettant de vérifier que l'antivirus bloque bien un téléchargement infecté." }
      ],
      alerts: [
        { type: "warning", icon: "fa-triangle-exclamation", text: "Désactivez diagnose debug enable après usage : le debug consomme CPU et peut impacter un équipement en production." },
        { type: "success", icon: "fa-circle-check", text: "Un socle validé est un socle documenté : consignez chaque test, son résultat attendu et son résultat observé." }
      ],
      table: {
        headers: ["Test", "Commande / méthode", "Résultat attendu"],
        rows: [
          ["LAN_IT → Internet", "ping 8.8.8.8 depuis un poste", "Réponse OK, session NATée"],
          ["HOTSPOT → Internet", "curl http://exemple.com", "HTTP OK, UTM appliqué"],
          ["Isolation HOTSPOT → LAN_IT", "ping 192.168.10.1 depuis Hotspot", "Refus, log Deny présent"],
          ["Isolation DMZ → LAN_IT", "ping 192.168.10.20 depuis DMZ", "Refus, log Deny présent"],
          ["Publication DMZ", "http://203.0.113.10 depuis l'extérieur", "Page du serveur web"],
          ["Antivirus", "télécharger le fichier EICAR", "Blocage + entrée de log AV"],
          ["Web filtering", "site de catégorie bloquée", "Page de blocage FortiGuard"]
        ]
      },
      subsections: [
        { title: "Méthodologie de test", content: "Testez dans l'ordre : connectivité de base (ping, DHCP, DNS), flux autorisés vers Internet, puis isolation inter-zones, et enfin les profils UTM (EICAR, catégories bloquées). Chaque test a un résultat attendu issu de la matrice de flux du CDC ; tout écart doit être expliqué avant de passer à la suite. Cette discipline évite l'accumulation de configurations « magiques »." },
        { title: "Les trois outils de référence", content: "diagnose sniffer packet confirme la présence des paquets sur le câble ; diagnose debug flow explique la décision du firewall (route, politique, NAT) ; FortiView Sessions montre les sessions vivantes avec la politique appliquée. Maîtriser ce trio est la compétence n°1 de l'administrateur FortiGate et sera réévaluée dans les labs." },
        { title: "Journaliser la validation", content: "Exportez le journal de tests (tableau ci-dessus complété) et conservez-le avec la sauvegarde de configuration. Ce document sert de référence à la mise en production, alimente le rapport de recette et facilite les audits ultérieurs. La section Exploitation automatisera la collecte de preuves via syslog et rapports." }
      ]
    }
  ]);
})();
