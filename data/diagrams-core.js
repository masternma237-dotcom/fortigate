/* ============================================================
   data/diagrams-core.js — Diagrammes du parcours Socle
   Guide Interactif FortiGate CFP-CMD / MASTER NMA
   ============================================================ */
(function () {
  "use strict";

  FG.addDiagrams({

    intro: function () {
      return svgWrap(760, 210,
        svgBox(20, 75, 110, 50, "#F39C12", "#b8750d", "Internet") +
        svgArrow(130, 100, 185, 100, { label: "wan1" }) +
        svgBox(185, 55, 130, 90, "#e74c3c", "#922b21", "FortiGate\\nFGT-CFP-CMD") +
        svgArrow(315, 85, 370, 85) +
        svgBox(370, 30, 130, 50, "#27ae60", "#1a6a3e", "LAN_IT\\n192.168.10.0/24") +
        svgArrow(315, 115, 370, 115) +
        svgBox(370, 90, 130, 50, "#9b59b6", "#6c3483", "HOTSPOT\\n192.168.20.0/24") +
        svgArrow(315, 135, 370, 165) +
        svgBox(370, 150, 130, 50, "#2980b9", "#1c5985", "DMZ\\n192.168.30.0/24") +
        svgLine(370, 55, 660, 55, { dash: "4 4", color: "#95a5a6" })
      );
    },

    "prise-en-main": function () {
      return svgWrap(760, 190,
        svgBox(30, 60, 170, 60, "#2c3e50", "#1a252f", "Poste admin\\n192.168.10.10") +
        svgArrow(200, 90, 260, 90, { label: "HTTPS + SSH" }) +
        svgBox(260, 50, 170, 80, "#e74c3c", "#922b21", "FortiGate\\nMFA + Trusted hosts") +
        svgArrowRed(430, 70, 520, 70, { label: "IP inconnue : refusé" }) +
        svgBox(520, 45, 180, 50, "#7f8c8d", "#5f6c6d", "Internet : pas d'admin") +
        svgArrow(430, 110, 520, 120, { label: "Sources 192.168.10.0/24 : OK", color: "#27ae60" })
      );
    },

    zones: function () {
      return svgWrap(760, 220,
        svgBox(30, 20, 700, 180, "#1b2432", "#2d3c5a", "", { radius: 14 }) +
        svgBox(60, 80, 120, 50, "#F39C12", "#b8750d", "wan1") +
        svgLine(180, 105, 300, 105, { color: "#e74c3c", width: 2.5 }) +
        svgBox(300, 75, 150, 60, "#e74c3c", "#922b21", "FortiGate\\nZones") +
        svgLine(450, 95, 560, 55, { color: "#27ae60", width: 2.5 }) +
        svgBox(560, 30, 140, 46, "#27ae60", "#1a6a3e", "Zone LAN_IT") +
        svgLine(450, 105, 560, 105, { color: "#9b59b6", width: 2.5 }) +
        svgBox(560, 82, 140, 46, "#9b59b6", "#6c3483", "Zone HOTSPOT") +
        svgLine(450, 120, 560, 155, { color: "#2980b9", width: 2.5 }) +
        svgBox(560, 132, 140, 46, "#2980b9", "#1c5985", "Zone DMZ") +
        svgLine(180, 100, 300, 100, { color: "#F39C12" })
      );
    },

    politiques: function () {
      return svgWrap(760, 230,
        svgBox(40, 40, 150, 55, "#9b59b6", "#6c3483", "HOTSPOT\\n192.168.20.x") +
        svgArrowRed(190, 67, 300, 67, { label: "→ LAN_IT : DENY" }) +
        svgBox(300, 40, 150, 55, "#27ae60", "#1a6a3e", "LAN_IT\\n192.168.10.x") +
        svgBox(40, 130, 150, 55, "#2980b9", "#1c5985", "DMZ") +
        svgArrow(190, 157, 300, 130, { label: "VIP web : autorisé", color: "#27ae60" }) +
        svgBox(480, 95, 130, 70, "#e74c3c", "#922b21", "FortiGate\\nPolitiques 1-5") +
        svgArrow(610, 120, 670, 120, { label: "NAT" }) +
        svgBox(670, 95, 60, 70, "#F39C12", "#b8750d", "WAN") +
        svgArrowRed(190, 55, 480, 115, { dash: "5 4" })
      );
    },

    "nat-vip": function () {
      return svgWrap(760, 220,
        svgBox(30, 45, 150, 55, "#27ae60", "#1a6a3e", "LAN_IT\\n192.168.10.50") +
        svgArrow(180, 72, 330, 72, { label: "src 192.168.10.50" }) +
        svgBox(330, 45, 170, 80, "#e74c3c", "#922b21", "FortiGate\\nNAT / PAT") +
        svgArrow(500, 72, 640, 72, { label: "src 203.0.113.2 :port" }) +
        svgBox(640, 45, 90, 55, "#F39C12", "#b8750d", "Internet") +
        svgArrowRed(640, 160, 500, 160, { label: "http://203.0.113.10:80" }) +
        svgBox(330, 135, 170, 60, "#e74c3c", "#922b21", "VIP_WEB\\n:80 → 30.10:80") +
        svgArrow(330, 165, 180, 165) +
        svgBox(30, 137, 150, 55, "#2980b9", "#1c5985", "Serveur web\\n192.168.30.10")
      );
    },

    routage: function () {
      return svgWrap(760, 200,
        svgBox(30, 75, 180, 55, "#27ae60", "#1a6a3e", "LAN_IT\\n192.168.10.0/24") +
        svgLine(210, 102, 300, 102, { color: "#5b6b85" }) +
        svgBox(300, 72, 170, 60, "#e74c3c", "#922b21", "FortiGate\\nTable de routage") +
        svgArrow(470, 90, 580, 90, { label: "0.0.0.0/0 → FAI" }) +
        svgBox(580, 62, 130, 55, "#F39C12", "#b8750d", "FAI\\n203.0.113.1") +
        svgArrow(470, 115, 580, 140, { label: "192.168.40.0/24 → tunnel" }) +
        svgBox(580, 118, 130, 55, "#8b5cf6", "#5b2ea6", "to_siteB\\n(IPsec)")
      );
    },

    dhcp: function () {
      return svgWrap(760, 190,
        svgBox(30, 65, 160, 60, "#34495e", "#22303f", "Client\\n(DHCPDISCOVER)") +
        svgArrow(190, 95, 300, 95, { label: "broadcast" }) +
        svgBox(300, 60, 170, 70, "#e74c3c", "#922b21", "FortiGate\\nServeur DHCP") +
        svgArrow(470, 80, 580, 80, { label: "OFFER / ACK", color: "#27ae60" }) +
        svgBox(580, 52, 140, 55, "#27ae60", "#1a6a3e", "IP 192.168.10.x\\n8h de bail") +
        svgArrow(470, 112, 580, 130, { label: "Options : DNS, NTP", color: "#2980b9" }) +
        svgBox(580, 108, 140, 55, "#2980b9", "#1c5985", "Réservations\\nMAC → IP fixe")
      );
    },

    dns: function () {
      return svgWrap(760, 200,
        svgBox(30, 70, 150, 55, "#34495e", "#22303f", "Client LAN_IT\\nDNS = 192.168.10.1") +
        svgArrow(180, 97, 300, 97, { label: "srv-web.cfp-cmd.local ?" }) +
        svgBox(300, 55, 180, 85, "#e74c3c", "#922b21", "FortiGate\\nDNS local") +
        svgArrow(480, 75, 590, 75, { label: "zone locale : 192.168.30.10", color: "#27ae60" }) +
        svgBox(590, 48, 130, 52, "#27ae60", "#1a6a3e", "Réponse locale") +
        svgArrow(480, 118, 590, 135, { label: "inconnu → forwarder", color: "#2980b9" }) +
        svgBox(590, 112, 130, 52, "#F39C12", "#b8750d", "8.8.8.8 / 1.1.1.1")
      );
    },

    auth: function () {
      return svgWrap(760, 210,
        svgBox(30, 30, 180, 55, "#27ae60", "#1a6a3e", "Admin local\\n+ FortiToken (MFA)") +
        svgArrow(210, 57, 330, 57) +
        svgBox(30, 105, 180, 55, "#2980b9", "#1c5985", "Formateurs\\n(LDAP / AD)") +
        svgArrow(210, 132, 330, 132) +
        svgBox(30, 155, 180, 45, "#9b59b6", "#6c3483", "Apprenants\\n(portail captif)") +
        svgArrow(210, 177, 330, 160) +
        svgBox(330, 70, 170, 90, "#e74c3c", "#922b21", "FortiGate\\nIdentités & groupes") +
        svgArrow(500, 105, 610, 105, { label: "LDAP 389", color: "#8b5cf6" }) +
        svgBox(610, 78, 110, 55, "#34495e", "#22303f", "AD\\n192.168.10.20")
      );
    },

    utm: function () {
      return svgWrap(760, 230,
        svgBox(30, 85, 120, 55, "#34495e", "#22303f", "Flux client") +
        svgArrow(150, 112, 220, 112) +
        svgBox(220, 30, 160, 50, "#e67e22", "#a35e15", "Antivirus\\nfichiers") +
        svgBox(220, 90, 160, 50, "#c0392b", "#822820", "IPS\\nsignatures") +
        svgBox(220, 150, 160, 50, "#2980b9", "#1c5985", "Web Filter\\ncatégories") +
        svgLine(300, 80, 300, 90, { color: "#7f8c8d" }) +
        svgLine(300, 140, 300, 150, { color: "#7f8c8d" }) +
        svgArrow(380, 112, 450, 112) +
        svgBox(450, 85, 140, 55, "#e74c3c", "#922b21", "FortiGate\\nPolitique + UTM") +
        svgArrow(590, 112, 650, 112) +
        svgBox(650, 85, 70, 55, "#F39C12", "#b8750d", "WAN") +
        svgLine(300, 105, 300, 105, { color: "#7f8c8d" })
      );
    },

    validation: function () {
      return svgWrap(760, 200,
        svgBox(30, 40, 190, 55, "#27ae60", "#1a6a3e", "Test 1 : ping / DNS / DHCP") +
        svgBox(30, 105, 190, 55, "#2980b9", "#1c5985", "Test 2 : flux autorisés WAN") +
        svgBox(280, 40, 190, 55, "#9b59b6", "#6c3483", "Test 3 : isolation zones") +
        svgBox(280, 105, 190, 55, "#e67e22", "#a35e15", "Test 4 : UTM (EICAR, WF)") +
        svgArrow(220, 67, 280, 67) +
        svgArrow(220, 132, 280, 132) +
        svgBox(510, 70, 210, 60, "#e74c3c", "#922b21", "Journal de validation\\nattendu / observé / écart") +
        svgArrow(470, 67, 510, 90) +
        svgArrow(470, 132, 510, 105)
      );
    }
  });
})();
