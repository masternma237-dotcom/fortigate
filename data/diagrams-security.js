/* ============================================================
   data/diagrams-security.js — Diagrammes : sécurité avancée
   Guide Interactif FortiGate CFP-CMD / MASTER NMA
   ============================================================ */
(function () {
  "use strict";

  FG.addDiagrams({

    backup: function () {
      return svgWrap(760, 190,
        svgBox(30, 60, 150, 60, "#e74c3c", "#922b21", "FortiGate\\nshow > .conf") +
        svgArrow(180, 90, 300, 90, { label: "TFTP / GUI" }) +
        svgBox(300, 60, 160, 60, "#34495e", "#22303f", "Serveur\\n192.168.10.20") +
        svgArrow(460, 90, 570, 90, { label: "copie chiffrée" }) +
        svgBox(570, 60, 150, 60, "#27ae60", "#1a6a3e", "Stockage hors\\néquipement") +
        svgArrow(375, 120, 375, 160, { label: "restore testé au labo", color: "#2980b9" }) +
        svgBox(260, 155, 230, 30, "#2980b9", "#1c5985", "Procédure de restauration validée", { fontSize: 12 })
      );
    },

    bruteforce: function () {
      return svgWrap(760, 210,
        svgBox(30, 70, 170, 60, "#c0392b", "#822820", "Attaquant\\nforce brute") +
        svgArrowRed(200, 100, 320, 100, { label: "login/password" }) +
        svgBox(320, 65, 170, 75, "#e74c3c", "#922b21", "FortiGate\\nLockout 3 / 1800 s") +
        svgArrowRed(490, 85, 600, 85, { label: "IP hors trusted hosts" }) +
        svgBox(600, 58, 120, 50, "#7f8c8d", "#5f6c6d", "Bloqué") +
        svgArrow(490, 120, 600, 135, { label: "GeoIP refusé", color: "#e67e22" }) +
        svgBox(600, 112, 120, 50, "#7f8c8d", "#5f6c6d", "Pays bloqués")
      );
    },

    "doh-dot": function () {
      return svgWrap(760, 210,
        svgBox(30, 70, 150, 60, "#34495e", "#22303f", "Client\\nnavigateur") +
        svgArrow(180, 85, 310, 85, { label: "DNS clair : filtré" }) +
        svgBox(310, 55, 160, 70, "#e74c3c", "#922b21", "DNS Filter\\n+ redirection 53") +
        svgArrowRed(180, 120, 620, 120, { label: "DoH 443 vers dns.google : BLOQUÉ" }) +
        svgBox(620, 95, 100, 50, "#7f8c8d", "#5f6c6d", "DoH public") +
        svgArrow(470, 90, 620, 65, { label: "résolution interne OK", color: "#27ae60" }) +
        svgBox(620, 38, 100, 50, "#27ae60", "#1a6a3e", "DNS local")
      );
    },

    dos: function () {
      return svgWrap(760, 200,
        svgBox(30, 75, 140, 55, "#c0392b", "#822820", "Scan / DoS\\nInternet") +
        svgArrowRed(170, 102, 290, 102, { label: "paquets" }) +
        svgBox(290, 68, 190, 70, "#e74c3c", "#922b21", "DoS policy wan1\\nseuils par source") +
        svgArrowRed(480, 90, 590, 90, { label: "seuil dépassé : drop" }) +
        svgBox(590, 62, 120, 50, "#7f8c8d", "#5f6c6d", "Bloqué + log") +
        svgArrow(480, 118, 590, 135, { label: "trafic normal : continue", color: "#27ae60" }) +
        svgBox(590, 112, 120, 50, "#27ae60", "#1a6a3e", "Sessions OK")
      );
    },

    hardening: function () {
      return svgWrap(760, 220,
        svgBox(40, 30, 200, 45, "#c0392b", "#822820", "Avant : services par défaut", { fontSize: 12 }) +
        svgBox(40, 90, 200, 45, "#27ae60", "#1a6a3e", "Après : allowaccess minimal", { fontSize: 12 }) +
        svgBox(300, 30, 200, 45, "#2980b9", "#1c5985", "MFA + trusted hosts + lockout", { fontSize: 12 }) +
        svgBox(300, 90, 200, 45, "#9b59b6", "#6c3483", "Bannière légale pré-login", { fontSize: 12 }) +
        svgBox(560, 30, 160, 45, "#e67e22", "#a35e15", "Firmware stable", { fontSize: 12 }) +
        svgBox(560, 90, 160, 45, "#16a085", "#0e6655", "Sauvegardes testées", { fontSize: 12 }) +
        svgArrow(240, 52, 300, 52) +
        svgArrow(500, 52, 560, 52) +
        svgBox(40, 155, 680, 40, "#34495e", "#22303f", "Checklist de durcissement : revue trimestrielle + diff de configuration", { fontSize: 13 })
      );
    },

    "backup-auto": function () {
      return svgWrap(760, 190,
        svgBox(30, 60, 160, 60, "#e74c3c", "#922b21", "auto-script\\ntoutes les 24 h") +
        svgArrow(190, 90, 310, 90, { label: "SFTP (SSH, chiffré)" }) +
        svgBox(310, 60, 180, 60, "#34495e", "#22303f", "Serveur SFTP\\n/backups/") +
        svgArrow(490, 90, 590, 90, { label: "rotation 30 jours" }) +
        svgBox(590, 60, 130, 60, "#27ae60", "#1a6a3e", "Historique\\nrestaurable") +
        svgArrow(375, 120, 375, 150, { label: "échec ? → stitch e-mail", color: "#e67e22" }) +
        svgBox(260, 148, 230, 32, "#e67e22", "#a35e15", "Alerte exploitation immédiate", { fontSize: 12 })
      );
    }
  });
})();
