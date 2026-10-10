/* ============================================================
   data/diagrams-services.js — Diagrammes : services réseau
   Guide Interactif FortiGate CFP-CMD / MASTER NMA
   ============================================================ */
(function () {
  "use strict";

  FG.addDiagrams({

    "nat-avance": function () {
      return svgWrap(760, 210,
        svgBox(30, 40, 160, 55, "#27ae60", "#1a6a3e", "LAN_IT\\nflux standard") +
        svgArrow(190, 67, 340, 67, { label: "masquerade wan1" }) +
        svgBox(30, 115, 160, 55, "#2980b9", "#1c5985", "Sauvegardes\\nflux sensible") +
        svgArrow(190, 142, 340, 142, { label: "IP pool 203.0.113.11" }) +
        svgBox(340, 85, 140, 70, "#e74c3c", "#922b21", "FortiGate\\nNAT avancé") +
        svgArrow(480, 90, 600, 90, { label: "Internet" }) +
        svgBox(600, 62, 110, 55, "#F39C12", "#b8750d", "WAN") +
        svgArrow(480, 125, 600, 145, { label: "site B : IP dédiée", color: "#8b5cf6" }) +
        svgBox(600, 120, 110, 55, "#8b5cf6", "#5b2ea6", "Site B\\nautorise .11")
      );
    },

    "dns-filter": function () {
      return svgWrap(760, 200,
        svgBox(30, 70, 150, 55, "#34495e", "#22303f", "Client\\nDNS query") +
        svgArrow(180, 97, 310, 97, { label: "domaine ?" }) +
        svgBox(310, 55, 180, 85, "#e74c3c", "#922b21", "DNS Filter\\ncatégories FortiGuard") +
        svgArrowRed(490, 80, 610, 80, { label: "botnet / phishing : NXDOMAIN" }) +
        svgBox(610, 52, 110, 55, "#7f8c8d", "#5f6c6d", "Bloqué + log") +
        svgArrow(490, 115, 610, 135, { label: "légitime : résolu", color: "#27ae60" }) +
        svgBox(610, 110, 110, 55, "#27ae60", "#1a6a3e", "Réponse OK")
      );
    },

    ntp: function () {
      return svgWrap(760, 190,
        svgBox(30, 60, 170, 60, "#F39C12", "#b8750d", "pool.ntp.org\\n+ time.google.com") +
        svgArrow(200, 90, 320, 90, { label: "UDP 123" }) +
        svgBox(320, 55, 170, 70, "#e74c3c", "#922b21", "FortiGate\\nNTP client + serveur") +
        svgArrow(490, 75, 600, 75, { label: "stratum local" }) +
        svgBox(600, 48, 110, 55, "#27ae60", "#1a6a3e", "LAN_IT\\n192.168.10.1") +
        svgArrow(490, 105, 600, 125, { label: "option DHCP 42", color: "#2980b9" }) +
        svgBox(600, 100, 110, 55, "#2980b9", "#1c5985", "Tous segments\\nhorloge commune")
      );
    },

    "dhcp-avance": function () {
      return svgWrap(760, 200,
        svgBox(30, 65, 150, 55, "#34495e", "#22303f", "VLAN 30\\ntéléphonie") +
        svgArrow(180, 92, 320, 92, { label: "DHCPDISCOVER" }) +
        svgBox(320, 60, 170, 65, "#e74c3c", "#922b21", "FortiGate\\nRelais DHCP") +
        svgArrow(490, 92, 600, 92, { label: "unicast → serveur" }) +
        svgBox(600, 65, 120, 55, "#27ae60", "#1a6a3e", "Serveur DHCP\\n192.168.10.20") +
        svgArrow(600, 120, 490, 145, { label: "bail + options 42/66/121", color: "#2980b9" }) +
        svgBox(320, 128, 170, 55, "#2980b9", "#1c5985", "Client : IP + NTP\\n+ TFTP + routes", { fontSize: 11 })
      );
    },

    qos: function () {
      return svgWrap(760, 220,
        svgBox(30, 30, 180, 45, "#27ae60", "#1a6a3e", "Administration : high", { fontSize: 12 }) +
        svgBox(30, 90, 180, 45, "#2980b9", "#1c5985", "VPN / visio : garanti 1-10 Mb/s", { fontSize: 12 }) +
        svgBox(30, 150, 180, 45, "#9b59b6", "#6c3483", "Hotspot : max 40 Mb/s", { fontSize: 12 }) +
        svgArrow(210, 52, 340, 100) +
        svgArrow(210, 112, 340, 112) +
        svgArrow(210, 172, 340, 125) +
        svgBox(340, 75, 150, 75, "#e74c3c", "#922b21", "Shapers\\npartagés") +
        svgArrow(490, 112, 560, 112, { label: "wan1" }) +
        svgBox(560, 85, 120, 55, "#F39C12", "#b8750d", "Internet\\n100 Mb/s")
      );
    },

    "qos-avance": function () {
      return svgWrap(760, 200,
        svgBox(30, 40, 180, 50, "#34495e", "#22303f", "Apprenant A\\nper-IP 4 Mb/s") +
        svgBox(30, 110, 180, 50, "#34495e", "#22303f", "Apprenant B\\nper-IP 4 Mb/s") +
        svgArrow(210, 65, 350, 90) +
        svgArrow(210, 135, 350, 115) +
        svgBox(350, 70, 170, 70, "#e74c3c", "#922b21", "Per-IP shaper\\n+ App Control") +
        svgArrow(520, 90, 600, 75, { label: "visio : classe prioritaire", color: "#27ae60" }) +
        svgBox(600, 48, 110, 50, "#27ae60", "#1a6a3e", "Class ID\\nhaute") +
        svgArrow(520, 120, 600, 140, { label: "P2P : bridé", color: "#e67e22" }) +
        svgBox(600, 118, 110, 50, "#e67e22", "#a35e15", "Class ID\\nbasse")
      );
    }
  });
})();
