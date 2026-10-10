/* ============================================================
   data/interconnexion-1.js — Parcours VPN & interconnexion
   Sections 23 à 25 — Guide Interactif FortiGate CFP-CMD / MASTER NMA
   ============================================================ */
(function () {
  "use strict";

  FG.addSections([

    /* ------------------------------------------------ 23 */
    {
      id: "ssl-vpn",
      track: "interconnexion",
      level: "intermediaire",
      title: "SSL-VPN : accès distant sécurisé",
      icon: "fa-solid fa-right-to-bracket",
      step: "23",
      requires: ["authentification"],
      description: "Offrez aux administrateurs un accès distant chiffré sans client dédié : portail SSL-VPN, pool d'adresses, MFA et politique VPN → LAN_IT.",
      cliCommands: [
        "# Portail et réglages SSL-VPN\nconfig vpn ssl web portal\n    edit \"portal-admin\"\n        set tunnel-mode enable\n        set split-tunneling enable\n        set split-tunneling-address-list \"RESEAUX-CFPCMD\"\n    next\nend\nconfig vpn ssl settings\n    set servercert " + "\"Fortinet_Factory\"" + "\n    set tunnel-ip-pools \"SSLVPN_TUNNEL_ADDR1\"\n    set source-interface \"wan1\"\n    set source-address all\n    set port 10443\n    set tunnel-ip-pools " + "\"SSLVPN_TUNNEL_ADDR1\"" + "\nend",
        "# Utilisateur + groupe VPN (avec MFA)\nconfig user local\n    edit \"adm_vpn\"\n        set type password\n        set passwd <MOT_DE_PASSE_VPN>\n        set two-factor fortitoken\n    next\nend\nconfig user group\n    edit \"SSLVPN_GROUP\"\n        set member \"adm_vpn\"\n    next\nend",
        "# Politique VPN → LAN_IT\nconfig firewall policy\n    edit 10\n        set name \"VPN_to_LAN_IT\"\n        set srcintf \"ssl.root\"\n        set dstintf \"LAN_IT\"\n        set srcaddr all\n        set dstaddr all\n        set action accept\n        set schedule \"always\"\n        set service ALL\n        set utm-status enable\n        set av-profile \"UTM-CFPCMD\"\n        set ips-sensor \"UTM-CFPCMD\"\n    next\nend"
      ],
      guiSteps: [
        "<span class='wb-path'>VPN → SSL-VPN Portals</span> → Create New → tunnel mode, split tunneling sur les réseaux internes.",
        "<span class='wb-path'>VPN → SSL-VPN Settings</span> → interface wan1, port 10443, pool 10.10.10.0/24.",
        "<span class='wb-path'>User & Authentication</span> → créer l'utilisateur adm_vpn + FortiToken, groupe SSLVPN_GROUP.",
        "<span class='wb-path'>Policy & Objects → Firewall Policy</span> → ssl.root → LAN_IT avec profils UTM."
      ],
      diagram: "sslvpn",
      terminology: ["SSL-VPN", "Portail", "Split tunneling", "Tunnel mode", "Pool d'adresses VPN"],
      concepts: [
        { term: "SSL-VPN", def: "VPN transporté sur TLS (HTTPS) : traverse les pare-feu d'hôtels et de cafés, s'installe en client léger via navigateur." },
        { term: "Split tunneling", def: "Seuls les flux vers les réseaux internes passent dans le tunnel ; le reste sort par la connexion locale de l'utilisateur." },
        { term: "Pool VPN", def: "Plage d'adresses attribuées aux clients VPN (10.10.10.0/24), traitée comme une interface source dans les politiques." }
      ],
      alerts: [
        { type: "danger", icon: "fa-triangle-exclamation", text: "Le portail SSL-VPN exposé sur wan1 est la cible n°1 des attaques par force brute : MFA obligatoire et lockout actif (section 12)." },
        { type: "warning", icon: "fa-triangle-exclamation", text: "Sans split tunneling, tout le trafic du client passe par le centre : à la fois gourmand et risqué pour les flux personnels." }
      ],
      table: {
        headers: ["Paramètre", "Valeur CFP-CMD", "Justification"],
        rows: [
          ["Port externe", "10443", "Évite les scanners du 443 standard"],
          ["Pool d'adresses", "10.10.10.0/24", "Plan d'adressage CDC §8.1"],
          ["Portail", "portal-admin (tunnel)", "Accès réseau complet pour l'admin"],
          ["Split tunneling", "Réseaux internes uniquement", "Performance + confidentialité"],
          ["Authentification", "Local/LDAP + FortiToken", "Exigence MFA CDC §4.1"],
          ["Politique sortie", "VPN → LAN_IT avec UTM", "Administration uniquement"]
        ]
      },
      subsections: [
        { title: "Un tunnel, plusieurs usages", content: "Le SSL-VPN sert d'abord aux administrateurs pour intervenir à distance (maintenance de nuit, incidents). Le portail tunnel-mode crée une carte réseau virtuelle : le poste distant reçoit une adresse du pool 10.10.10.0/24 et se comporte comme s'il était dans le LAN_IT, sous réserve des politiques. Le web-mode, plus limité (bookmark RDP/HTTP), couvre les accès ponctuels depuis des postes non administrés." },
        { title: "Sécuriser le portail", content: "Trois couches : l'authentification (LDAP + FortiToken, lockout), la réduction d'exposition (port 10443, restriction par trusted hosts si possible) et la limitation de portée (politique VPN → LAN_IT uniquement, UTM actif). Surveillez les logs d'échec d'authentification : une source qui insiste est signalée par les alertes de la piste Exploitation." },
        { title: "Le client à l'usage", content: "FortiClient (gratuit en mode VPN) ou le client intégré des systèmes récents établit le tunnel en TLS vers https://IP-publique:10443. Après authentification + code FortiToken, le client reçoit son adresse du pool et les routes du split tunneling. Testez depuis un réseau étranger (partage mobile) : c'est le scénario réaliste du Lab 2." }
      ]
    },

    /* ------------------------------------------------ 24 */
    {
      id: "ipsec-site-a-site",
      track: "interconnexion",
      level: "intermediaire",
      title: "IPsec site-à-site (IKEv2)",
      icon: "fa-solid fa-link",
      step: "24",
      requires: ["interfaces-zones", "politiques-filtrage"],
      description: "Reliez le CFP-CMD à un site distant par un tunnel IPsec permanent : IKEv2, AES-256, SHA-256, PFS, route statique et politique dédiée.",
      cliCommands: [
        "# Phase 1 : établir le canal IKEv2\nconfig vpn ipsec phase1-interface\n    edit \"to_siteB\"\n        set interface \"wan1\"\n        set ike-version 2\n        set peertype any\n        set proposal aes256-sha256\n        set remote-gw 198.51.100.20\n        set psksecret <SECRET_IPSEC>\n        set dpd on-idle\n        set add-route enable\n    next\nend",
        "# Phase 2 : les réseaux chiffrés\nconfig vpn ipsec phase2-interface\n    edit \"to_siteB_p2\"\n        set phase1name \"to_siteB\"\n        set proposal aes256-sha256\n        set pfs enable\n        set dhgrp 14\n        set src-subnet 192.168.10.0 255.255.255.0\n        set dst-subnet 192.168.40.0 255.255.255.0\n    next\nend",
        "# Route vers le site distant + politique\nconfig router static\n    edit 2\n        set dst 192.168.40.0 255.255.255.0\n        set device \"to_siteB\"\n    next\nend\nconfig firewall policy\n    edit 20\n        set name \"LAN_IT_to_SiteB\"\n        set srcintf \"LAN_IT\"\n        set dstintf \"to_siteB\"\n        set srcaddr all\n        set dstaddr all\n        set action accept\n        set schedule \"always\"\n        set service ALL\n    next\nend",
        "# Diagnostic du tunnel\ndiagnose vpn ike gateway list\ndiagnose vpn tunnel list | grep -A3 to_siteB"
      ],
      guiSteps: [
        "<span class='wb-path'>VPN → IPsec Tunnels</span> → Create New → Custom → phase 1 IKEv2 sur wan1, PSK fort.",
        "<span class='wb-path'>VPN → IPsec Tunnels → Convert To Custom Tunnel → Phase 2 Selectors</span> → AES256-SHA256, PFS, sous-réseaux.",
        "<span class='wb-path'>Network → Static Routes</span> → 192.168.40.0/24 via l'interface to_siteB.",
        "<span class='wb-path'>Policy & Objects → Firewall Policy</span> → LAN_IT → to_siteB (et retour).",
        "<span class='wb-path'>Dashboard → IPsec</span> → widget de suivi d'état du tunnel."
      ],
      diagram: "ipsec",
      terminology: ["IPsec", "IKEv2", "Phase 1", "Phase 2", "PSK", "PFS", "DPD"],
      concepts: [
        { term: "IPsec", def: "Suite de protocoles chiffrant le trafic IP entre deux sites : authentification des extrémités, confidentialité et intégrité des données." },
        { term: "Phase 1", def: "Négociation IKEv2 du canal sécurisé entre les passerelles (algorithme, PSK ou certificats, DPD)." },
        { term: "Phase 2", def: "Négociation des SA de données : quels sous-réseaux sont chiffrés, avec PFS pour de nouvelles clés." },
        { term: "PFS", def: "Perfect Forward Secrecy : chaque session dérive ses clés d'un nouvel échange Diffie-Hellman, une clé compromise ne déchiffre pas le passé." }
      ],
      alerts: [
        { type: "warning", icon: "fa-triangle-exclamation", text: "Les deux extrémités doivent matcher exactement : versions IKE, propositions, groupes DH, sous-réseaux. Le moindre écart bloque la négociation." },
        { type: "info", icon: "fa-circle-info", text: "Une politique est nécessaire dans les deux sens (LAN_IT → to_siteB et to_siteB → LAN_IT) : sans elle, le trafic est rejeté malgré le tunnel monté." }
      ],
      table: {
        headers: ["Paramètre", "Valeur CFP-CMD", "Site B"],
        rows: [
          ["Interface", "wan1", "wan1 du site B"],
          ["IKE version", "IKEv2", "IKEv2"],
          ["Proposition", "AES256-SHA256", "AES256-SHA256"],
          ["Authentification", "PSK (≥ 20 caractères)", "même PSK"],
          ["Réseau local", "192.168.10.0/24", "192.168.40.0/24"],
          ["PFS / DH", "activé, DH 14", "activé, DH 14"],
          ["DPD", "on-idle", "on-idle"]
        ]
      },
      subsections: [
        { title: "Architecture du tunnel", content: "Le tunnel relie le FortiGate CFP-CMD à la passerelle du site distant (exemple RFC 5737 198.51.100.20). La phase 1 IKEv2 établit un canal authentifié (PSK robuste, AES-256/SHA-256) ; la phase 2 précise les trafics protégés : 192.168.10.0/24 ↔ 192.168.40.0/24. L'interface to_siteB devient une interface logique : route statique et politiques s'écrivent comme vers n'importe quelle zone." },
        { title: "Robustesse : DPD et reprise", content: "Dead Peer Detection (on-idle) sonde le pair et remonte la panne en quelques secondes, déclenchant la renégociation automatique. Combiné à add-route enable, le tunnel se rétablit seul après une coupure wan1. Ces réglages sont la base du failover étudié avec SD-WAN (section 26) : sans détection fiable, aucun basculement automatique n'est possible." },
        { title: "Dépanner un tunnel", content: "Méthode en trois temps : diagnose vpn ike gateway list (phase 1 montée ?), diagnose vpn tunnel list (phase 2, compteurs SA), puis debug IKE si nécessaire (diagnose vpn ike log-filter dst-addr4 …). 90 % des pannes viennent d'un désaccord de paramètres ou d'un NAT intermédiaire : vérifiez les propositions côté site B en premier." }
      ]
    },

    /* ------------------------------------------------ 25 */
    {
      id: "ipsec-avance",
      track: "interconnexion",
      level: "avance",
      title: "IPsec avancé (certificats, ADVPN)",
      icon: "fa-solid fa-certificate",
      step: "25",
      requires: ["ipsec-site-a-site"],
      description: "Passez le VPN site-à-site au niveau supérieur : authentification par certificats, sélecteurs multiples et réseau maillé ADVPN pour les architectures à plusieurs sites.",
      cliCommands: [
        "# Phase 1 authentifiée par certificat\nconfig vpn ipsec phase1-interface\n    edit \"to_siteB\"\n        set authmethod signature\n        set certificate " + "\"FGT-CFPCMD-2026\"" + "\n        set peerid \"CN=fgt-siteB.cfp-cmd.local\"\n    next\nend",
        "# Phase 2 : sélecteurs multiples (LAN + téléphonie)\nconfig vpn ipsec phase2-interface\n    edit \"to_siteB_p2_admin\"\n        set phase1name \"to_siteB\"\n        set proposal aes256-gcm\n        set pfs enable\n        set dhgrp 14\n        set src-subnet 192.168.10.0 255.255.255.0\n        set dst-subnet 192.168.40.0 255.255.255.0\n    next\n    edit \"to_siteB_p2_voip\"\n        set phase1name \"to_siteB\"\n        set proposal aes256-gcm\n        set src-subnet 192.168.30.0 255.255.255.0\n        set dst-subnet 192.168.40.0 255.255.255.0\n    next\nend",
        "# (Concept) ADVPN : raccourcis dynamiques entre sites spoke\nconfig vpn ipsec phase1-interface\n    edit \"hub-spoke\"\n        set advpn enable\n        set advpn-select disable\n    next\nend"
      ],
      guiSteps: [
        "<span class='wb-path'>System → Certificates</span> → importer la CA et générer le certificat local signé.",
        "<span class='wb-path'>VPN → IPsec Tunnels</span> → phase 1 en authmethod signature + peerid attendu.",
        "<span class='wb-path'>VPN → IPsec Tunnels</span> → ajouter des sélecteurs phase 2 par trafic.",
        "<span class='wb-path'>Network → Static Routes / SD-WAN</span> → adapter le routage à la topologie maillée."
      ],
      diagram: "ipsec-avance",
      terminology: ["Certificat IKE", "Peer ID", "AES-GCM", "ADVPN", "Hub & spoke"],
      concepts: [
        { term: "Authentification par certificat", def: "La phase 1 IKE signe les échanges avec des certificats délivrés par une CA : révocabilité et identité forte, sans secret partagé." },
        { term: "ADVPN", def: "Auto Discovery VPN : les spokes d'un réseau hub & spoke établissent dynamiquement des tunnels directs entre eux (raccourcis)." },
        { term: "Sélecteur", def: "Couple de sous-réseaux (src/dst) défini en phase 2 : détermine précisément quels flux passent dans le tunnel." }
      ],
      alerts: [
        { type: "warning", icon: "fa-triangle-exclamation", text: "Avec les certificats, l'horloge doit être juste (section 19) et la CA digne de confiance : un certificat expiré coupe tous les tunnels." },
        { type: "info", icon: "fa-circle-info", text: "ADVPN exige FortiOS récent des deux côtés et un hub qui relaie l'auto-découverte : planifiez la version avant la migration." }
      ],
      table: {
        headers: ["Critère", "PSK", "Certificats"],
        rows: [
          ["Déploiement", "Simple (un secret partagé)", "PKI à mettre en place"],
          ["Identité par site", "Aucune (tous pareils)", "Certificat nommé par site"],
          ["Révocation", "Changer le PSK partout", "Révoquer le certificat du site"],
          ["Scalabilité", "Dégradée avec N sites", "Excellente (CA + profils)"],
          ["Recommandation CFP-CMD", "Labo / 2 sites", "Cible en production multi-sites"]
        ]
      },
      subsections: [
        { title: "Des PSK aux certificats", content: "Le PSK fonctionne pour deux sites mais ne scale pas : changer un secret implique de reconfigurer tous les sites, et chaque site connaît le secret de tous. Les certificats inversent la logique : chaque passerelle a son identité signée par la CA du centre, la révocation est individuelle, l'ajout d'un site ne touche pas les autres. C'est la cible recommandée dès que la topologie dépasse deux sites." },
        { title: "Sélecteurs fins par trafic", content: "Un sélecteur phase 2 par catégorie de flux (administration, téléphonie, sauvegarde) permet des réglages différenciés : chiffrement AES-GCM performant, PFS, suivi séparé dans les compteurs. Côté politiques, chaque sélecteur a sa route et sa règle : la matrice de flux reste lisible même quand la topologie grandit." },
        { title: "ADVPN : la maille dynamique", content: "Dans un modèle hub & spoke classique, le trafic spoke A → spoke B transite par le hub (double saut, latence). ADVPN permet aux spokes de négocier entre eux des tunnels directs à la demande, guidés par le hub. Pour un réseau d'établissements (CFP et annexes), c'est la voie moderne : moins de latence, moins de charge hub, failover naturel des chemins." }
      ]
    }
  ]);
})();
