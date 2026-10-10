/* ============================================================
   data/diagrams-vpn.js — Diagrammes : VPN & interconnexion
   Guide Interactif FortiGate CFP-CMD / MASTER NMA
   ============================================================ */
(function () {
  "use strict";

  FG.addDiagrams({

    sslvpn: function () {
      return svgWrap(760, 210,
        svgBox(30, 60, 160, 60, "#34495e", "#22303f", "Admin à distance\\nFortiClient") +
        svgArrow(190, 90, 330, 90, { label: "TLS 10443 + MFA" }) +
        svgBox(330, 55, 170, 75, "#e74c3c", "#922b21", "FortiGate\\nPortail SSL-VPN") +
        svgArrow(500, 80, 610, 80, { label: "pool 10.10.10.x" }) +
        svgBox(610, 52, 110, 55, "#27ae60", "#1a6a3e", "LAN_IT\\nadministration") +
        svgArrowRed(190, 145, 330, 145, { label: "sans MFA : refusé" }) +
        svgBox(30, 118, 160, 50, "#7f8c8d", "#5f6c6d", "Client sans token")
      );
    },

    ipsec: function () {
      return svgWrap(760, 210,
        svgBox(30, 45, 160, 60, "#27ae60", "#1a6a3e", "Siège CFP-CMD\\n192.168.10.0/24") +
        svgBox(30, 125, 160, 55, "#8b5cf6", "#5b2ea6", "Site B\\n192.168.40.0/24") +
        svgLine(190, 75, 280, 90) +
        svgLine(190, 152, 280, 130) +
        svgBox(280, 65, 170, 95, "#e74c3c", "#922b21", "FGT-CFP-CMD\\nPhase 1 IKEv2\\nAES256-SHA256\\nPFS DH14") +
        svgArrow(450, 105, 560, 105, { label: "tunnel chiffré wan1" }) +
        svgBox(560, 65, 160, 85, "#e74c3c", "#922b21", "Passerelle site B\\n198.51.100.20\\nmême proposals") +
        svgLine(720, 90, 740, 90, { color: "#27ae60", width: 2 })
      );
    },

    "ipsec-avance": function () {
      return svgWrap(760, 220,
        svgBox(60, 40, 180, 60, "#27ae60", "#1a6a3e", "Certificats CA\\nidentité par site") +
        svgBox(60, 130, 180, 60, "#2980b9", "#1c5985", "Sélecteurs multiples\\nadmin / téléphonie") +
        svgArrow(240, 70, 360, 95) +
        svgArrow(240, 160, 360, 125) +
        svgBox(360, 75, 170, 80, "#e74c3c", "#922b21", "Hub\\nPhase 1 signature") +
        svgLine(530, 100, 600, 60, { color: "#8b5cf6", width: 2.5 }) +
        svgLine(530, 115, 610, 115, { color: "#8b5cf6", width: 2.5, dash: "5 4" }) +
        svgLine(530, 130, 600, 170, { color: "#8b5cf6", width: 2.5 }) +
        svgBox(600, 38, 120, 44, "#8b5cf6", "#5b2ea6", "Spoke A", { fontSize: 12 }) +
        svgBox(610, 93, 120, 44, "#8b5cf6", "#5b2ea6", "Spoke B", { fontSize: 12 }) +
        svgBox(600, 148, 120, 44, "#8b5cf6", "#5b2ea6", "Spoke C", { fontSize: 12 })
      );
    },

    failover: function () {
      return svgWrap(760, 210,
        svgBox(30, 70, 160, 65, "#e74c3c", "#922b21", "FortiGate\\nSD-WAN zone") +
        svgArrow(190, 85, 330, 85, { label: "wan1 : FAI 1 (principal)" }) +
        svgBox(330, 55, 160, 55, "#27ae60", "#1a6a3e", "Sonde OK\\n8.8.8.8 / 500 ms") +
        svgArrow(190, 120, 330, 130, { label: "wan2 : FAI 2 (secours)", color: "#e67e22" }) +
        svgBox(330, 110, 160, 55, "#e67e22", "#a35e15", "En veille\\n1.1.1.1") +
        svgArrowRed(330, 70, 330, 108, { dash: "5 4" }) +
        svgArrow(490, 82, 590, 82, { label: "3 échecs → bascule" }) +
        svgBox(590, 55, 130, 55, "#c0392b", "#822820", "Panne FAI 1\\ntrafic → wan2") +
        svgBox(330, 175, 360, 30, "#34495e", "#22303f", "Retour : 5 succès consécutifs → réactivation wan1", { fontSize: 12 })
      );
    },

    "sdwan-lb": function () {
      return svgWrap(760, 210,
        svgBox(30, 35, 190, 45, "#27ae60", "#1a6a3e", "Visio : priority + SLA latence", { fontSize: 12 }) +
        svgBox(30, 95, 190, 45, "#2980b9", "#1c5985", "Sauvegardes : manual → wan2", { fontSize: 12 }) +
        svgBox(30, 155, 190, 45, "#9b59b6", "#6c3483", "Trafic général : load-balance", { fontSize: 12 }) +
        svgArrow(220, 57, 360, 80) +
        svgArrow(220, 117, 360, 107) +
        svgArrow(220, 177, 360, 132) +
        svgBox(360, 65, 150, 90, "#e74c3c", "#922b21", "Règles\\nSD-WAN") +
        svgArrow(510, 85, 600, 70, { label: "wan1" }) +
        svgArrow(510, 130, 600, 145, { label: "wan2" }) +
        svgBox(600, 45, 110, 50, "#F39C12", "#b8750d", "FAI 1") +
        svgBox(600, 122, 110, 50, "#e67e22", "#a35e15", "FAI 2")
      );
    },

    ospf: function () {
      return svgWrap(760, 200,
        svgBox(40, 60, 170, 60, "#e74c3c", "#922b21", "FGT-CFP-CMD\\nRouter-ID 10.255.255.1") +
        svgArrow(210, 90, 350, 90, { label: "LSA / adjacency" }) +
        svgBox(350, 60, 170, 60, "#8b5cf6", "#5b2ea6", "Routeur site B\\nRouter-ID 10.255.255.2") +
        svgBox(40, 140, 170, 45, "#27ae60", "#1a6a3e", "Annonce 192.168.10.0/24", { fontSize: 11 }) +
        svgBox(350, 140, 170, 45, "#27ae60", "#1a6a3e", "Annonce 192.168.40.0/24", { fontSize: 11 }) +
        svgLine(125, 120, 125, 140, { color: "#27ae60" }) +
        svgLine(435, 120, 435, 140, { color: "#27ae60" }) +
        svgBox(570, 75, 150, 50, "#2980b9", "#1c5985", "Area 0.0.0.0\\nconvergence auto", { fontSize: 12 })
      );
    },

    bgp: function () {
      return svgWrap(760, 200,
        svgBox(40, 65, 180, 65, "#e74c3c", "#922b21", "AS 65100\\nCFP-CMD\\n203.0.113.0/24") +
        svgArrow(220, 97, 360, 97, { label: "eBGP : annonces filtrées" }) +
        svgBox(360, 65, 180, 65, "#F39C12", "#b8750d", "AS 65010\\nFAI") +
        svgArrow(540, 97, 640, 97, { label: "AS-path 65010 65100" }) +
        svgBox(640, 65, 80, 65, "#34495e", "#22303f", "Internet") +
        svgBox(40, 150, 300, 35, "#27ae60", "#1a6a3e", "Filtre sortie : prefix-list ANNONCES-CFPCMD", { fontSize: 12 }) +
        svgBox(360, 150, 300, 35, "#2980b9", "#1c5985", "Filtre entrée : n'accepter que le convenu", { fontSize: 12 })
      );
    }
  });
})();
