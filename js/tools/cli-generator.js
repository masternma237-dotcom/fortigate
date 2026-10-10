/* ============================================================
   Guide Interactif FortiGate — CFP-CMD / MASTER NMA
   js/tools/cli-generator.js
   Générateur de configuration CLI FortiOS avec validation stricte.
   Compatible navigateur (rendu du formulaire) + Node (tests).
   ============================================================ */
(function (root) {
  "use strict";

  /* ==================== VALIDATION ==================== */

  var INJECTION_CHARS = [";", '"', "$", "?", "`", "\n", "\r", "\\", "{", "}"];
  var RE_HOSTNAME = /^[A-Za-z0-9][A-Za-z0-9-]{0,31}$/;
  var RE_TOKEN = /^[A-Za-z0-9._-]{1,32}$/;
  var RE_INT = /^\d+$/;

  /**
   * Détecte les tentatives d'injection dans une saisie texte.
   * @returns {boolean} true si la valeur est sûre
   */
  function isSafeText(value) {
    if (typeof value !== "string") return false;
    for (var i = 0; i < INJECTION_CHARS.length; i++) {
      if (value.indexOf(INJECTION_CHARS[i]) !== -1) return false;
    }
    // Caractères de contrôle invisibles
    for (var j = 0; j < value.length; j++) {
      var c = value.charCodeAt(j);
      if (c < 32 && c !== 9) return false;
    }
    return true;
  }

  /** Liste blanche : hostname FortiOS. */
  function validHostname(v) {
    return typeof v === "string" && RE_HOSTNAME.test(v);
  }

  /** Liste blanche : nom d'utilisateur admin. */
  function validUser(v) {
    return typeof v === "string" && RE_TOKEN.test(v);
  }

  /** Liste blanche : SSID (texte imprimable sûr, 1..32). */
  function validSsid(v) {
    return typeof v === "string" && v.length >= 1 && v.length <= 32 && isSafeText(v) && v.trim() === v;
  }

  /** Entier dans [min, max]. */
  function validInt(v, min, max) {
    if (!RE_INT.test(String(v))) return false;
    var n = parseInt(v, 10);
    return n >= min && n <= max;
  }

  /** Adresse IPv4 stricte : 4 octets 0-255. */
  function validIPv4(v) {
    if (typeof v !== "string") return false;
    var parts = v.split(".");
    if (parts.length !== 4) return false;
    for (var i = 0; i < 4; i++) {
      var p = parts[i];
      if (!/^\d{1,3}$/.test(p)) return false;
      if (p.length > 1 && p.charAt(0) === "0") return false;
      var n = parseInt(p, 10);
      if (n > 255) return false;
    }
    return true;
  }

  /** Préfixe CIDR valide (0..32). */
  function validPrefix(p) {
    return validInt(p, 0, 32);
  }

  /** Notation "a.b.c.d/p" : adresse réseau, bits d'hôte à zéro. */
  function validNetwork(cidr) {
    if (typeof cidr !== "string") return false;
    var parts = cidr.split("/");
    if (parts.length !== 2) return false;
    if (!validIPv4(parts[0]) || !validPrefix(parts[1])) return false;
    var mask = prefixToMask(parseInt(parts[1], 10));
    return maskIp(parts[0], mask) === parts[0];
  }

  /** Masque décimal à partir d'un préfixe. */
  function prefixToMask(prefix) {
    var bits = [];
    for (var i = 0; i < 4; i++) {
      var n = Math.max(0, Math.min(8, prefix - i * 8));
      bits.push(n === 0 ? 0 : 256 - Math.pow(2, 8 - n));
    }
    return bits.join(".");
  }

  /** Application d'un masque (retourne la chaîne réseau). */
  function maskIp(ip, mask) {
    var a = ip.split(".").map(Number);
    var m = mask.split(".").map(Number);
    return a.map(function (oct, i) { return oct & m[i]; }).join(".");
  }

  function maskAndEq(ip1, mask, ip2) {
    return maskIp(ip1, mask) === maskIp(ip2, mask);
  }

  /**
   * Vérifie les chevauchements entre plusieurs réseaux CIDR.
   * @param {Array<{name:string, cidr:string}>} nets
   * @returns {Array<string>} messages d'erreur (vide si OK)
   */
  function findOverlaps(nets) {
    var errors = [];
    var parsed = [];
    nets.forEach(function (n) {
      if (!n || !validNetwork(n.cidr)) return;
      var p = n.cidr.split("/");
      parsed.push({ name: n.name, ip: p[0], prefix: parseInt(p[1], 10) });
    });
    for (var i = 0; i < parsed.length; i++) {
      for (var j = i + 1; j < parsed.length; j++) {
        var a = parsed[i], b = parsed[j];
        var p = Math.min(a.prefix, b.prefix);
        var mask = prefixToMask(p);
        if (maskAndEq(a.ip, mask, b.ip)) {
          errors.push("Chevauchement de réseaux : " + a.name + " (" + a.cidr + ") et " +
            b.name + " (" + b.cidr + ") se recouvrent en /" + p + ".");
        }
      }
    }
    return errors;
  }

  /**
   * Échappe un secret pour FortiOS (chaîne quotée) : \\, \" et \$.
   * Les retours à la ligne et points-virgules restent interdits en amont.
   */
  function escapeSecret(v) {
    return String(v)
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/\$/g, "\\$");
  }

  /**
   * Rend une valeur de secret pour le script :
   * - vide  => placeholder NON quoté <MOT_DE_PASSE_FORT>
   * - fourni=> chaîne quotée avec échappement
   */
  function secretValue(v, placeholder) {
    if (!v) return placeholder || "<MOT_DE_PASSE_FORT>";
    return '"' + escapeSecret(v) + '"';
  }

  /** Mot de passe : vide autorisé (placeholder), sinon ≥ 12 caractères et sûr. */
  function checkPassword(v, label, errors) {
    if (!v) return true;
    if (String(v).length < 12) {
      errors.push(label + " : 12 caractères minimum requis.");
      return false;
    }
    if (!isSafeText(v)) {
      errors.push(label + " : contient des caractères interdits ( ; \" $ ? ` \\ { } ou retours à la ligne).");
      return false;
    }
    return true;
  }

  /* ==================== GÉNÉRATION ==================== */

  var TIMEZONES = {
    "00": "GMT — Greenwich",
    "01": "GMT+1 — Douala / Paris",
    "02": "GMT+2 — Le Caire",
    "03": "GMT+3 — Nairobi / Moscou",
    "04": "GMT+4 — Dubaï",
    "08": "GMT+8 — Pékin / Singapour",
    "10": "GMT+10 — Sydney",
    "19": "GMT-5 — New York",
    "20": "GMT-6 — Chicago",
    "25": "GMT-8 — Los Angeles"
  };

  var LAN_PORTS = ["internal", "a", "b", "c", "d", "port1", "port2", "lan"];
  var DMZ_PORTS = ["dmz", "a", "b", "c", "port3", "port4", "port5"];

  /**
   * Construit le script CLI FortiOS complet à partir du formulaire.
   * @param {Object} f
   * @returns {{ok:boolean, errors:string[], script:string}}
   */
  function buildConfig(f) {
    var errors = [];
    f = f || {};
    var modules = f.modules || {};

    /* ---------- Validation ---------- */
    var hostname = (f.hostname || "").trim();
    if (!hostname) hostname = "FGT-CFP-CMD";
    if (!validHostname(hostname)) {
      errors.push("Nom d'hôte invalide : lettres, chiffres et tirets uniquement (max 32).");
    }

    var tz = String(f.timezone || "01");
    if (!Object.prototype.hasOwnProperty.call(TIMEZONES, tz)) {
      errors.push("Fuseau horaire inconnu : " + tz);
    }

    var adminUser = (f.adminUser || "admin").trim();
    if (!validUser(adminUser)) {
      errors.push("Utilisateur admin invalide : [A-Z a-z 0-9 . _ -] sans espace (max 32).");
    }

    checkPassword(f.adminPassword, "Mot de passe admin", errors);

    var wanMode = f.wanMode === "static" ? "static" : "dhcp";
    var wanIp = (f.wanIp || "").trim();
    var wanPrefix = String(f.wanPrefix || "24");
    var wanGw = (f.wanGateway || "").trim();
    if (wanMode === "static") {
      if (!validIPv4(wanIp)) errors.push("IP WAN statique invalide (ex. 203.0.113.10).");
      if (!validPrefix(wanPrefix) || wanPrefix === "0") errors.push("Préfixe WAN invalide (1..32).");
      if (!validIPv4(wanGw)) errors.push("Passerelle FAI invalide (ex. 203.0.113.1).");
    }

    var lanCidr = (f.lanNet || "192.168.10.0/24").trim();
    var hotCidr = (f.hotspotNet || "192.168.20.0/24").trim();
    var dmzCidr = (f.dmzNet || "192.168.30.0/24").trim();
    [["LAN_IT", lanCidr], ["HOTSPOT", hotCidr], ["DMZ", dmzCidr]].forEach(function (pair) {
      if (!validNetwork(pair[1])) {
        errors.push("Réseau " + pair[0] + " invalide : utilisez la notation CIDR d'un réseau (ex. 192.168.10.0/24).");
      }
    });
    errors = errors.concat(findOverlaps([
      { name: "LAN_IT", cidr: lanCidr },
      { name: "HOTSPOT", cidr: hotCidr },
      { name: "DMZ", cidr: dmzCidr }
    ]));

    var lanPort = LAN_PORTS.indexOf(f.lanPort) !== -1 ? f.lanPort : "internal";
    var dmzPort = DMZ_PORTS.indexOf(f.dmzPort) !== -1 ? f.dmzPort : "dmz";

    var ssid = (f.ssid || "").trim();
    if (ssid && !validSsid(ssid)) {
      errors.push("SSID invalide : 1..32 caractères imprimables, sans ; \" $ ? ` \\ { }.");
    }
    checkPassword(f.wifiKey, "Clé WPA2", errors);
    var wifiVlan = String(f.wifiVlan || "20");
    if (ssid && !validInt(wifiVlan, 1, 4094)) {
      errors.push("VLAN Wi-Fi invalide (1..4094).");
    }

    /* Secrets restants (validés mais échappés, pas refusés) */
    checkPassword(f.vpnPassword, "Mot de passe SSL-VPN", errors);
    checkPassword(f.ipsecPsk, "PSK IPsec", errors);
    checkPassword(f.sftpPassword, "Mot de passe SFTP", errors);
    checkPassword(f.snmpAuth, "Mot de passe SNMP auth", errors);
    checkPassword(f.snmpPriv, "Mot de passe SNMP chiffrement", errors);

    var syslogServer = (f.syslogServer || "").trim();
    if (modules.syslog && !validIPv4(syslogServer)) {
      errors.push("Serveur Syslog invalide (ex. 192.168.10.20).");
    }
    var sftpServer = (f.sftpServer || "").trim();
    if (modules.backup && !validIPv4(sftpServer)) {
      errors.push("Serveur SFTP invalide (ex. 192.168.10.20).");
    }
    var vpnUser = (f.vpnUser || "adm_vpn").trim();
    if (modules.sslvpn && !validUser(vpnUser)) {
      errors.push("Utilisateur SSL-VPN invalide.");
    }
    var ipsecRemote = (f.ipsecRemote || "").trim();
    if (modules.ipsec && !validIPv4(ipsecRemote)) {
      errors.push("Passerelle distante IPsec invalide (ex. 198.51.100.20).");
    }

    if (errors.length > 0) {
      return { ok: false, errors: errors, script: "" };
    }

    /* ---------- Calculs utiles ---------- */
    function gwOf(cidr) {
      var p = cidr.split("/");
      var oct = p[0].split(".").map(Number);
      oct[3] = 1;
      return oct.join(".");
    }
    function maskOf(cidr) {
      return prefixToMask(parseInt(cidr.split("/")[1], 10));
    }
    var lanIp = gwOf(lanCidr), lanMask = maskOf(lanCidr);
    var hotIp = gwOf(hotCidr), hotMask = maskOf(hotCidr);
    var dmzIp = gwOf(dmzCidr), dmzMask = maskOf(dmzCidr);

    var L = [];
    var bar = "# ════════════════════════════════════════════════════════════";
    var date = new Date().toISOString().slice(0, 10);
    L.push(bar);
    L.push("# Configuration générée par le Guide Interactif FortiGate (CFP-CMD)");
    L.push("# Cible : FortiOS 7.x — À RELIRE avant import");
    L.push("# Généré le " + date + " — Projet : Infrastructure de sécurité périmétrique");
    L.push(bar);
    L.push("");

    /* 1. Global + admin */
    L.push("config system global");
    L.push("    set hostname " + hostname);
    L.push("    set timezone " + tz);
    L.push("    set admintimeout 15");
    L.push("end");
    L.push("");
    L.push("config system admin");
    L.push('    edit "' + adminUser + '"');
    L.push("        set password " + secretValue(f.adminPassword, "<MOT_DE_PASSE_FORT>"));
    if (f.mfa) {
      L.push("        set two-factor fortitoken");
    }
    L.push("    next");
    L.push("end");
    L.push("");

    /* 2. Interfaces */
    L.push("config system interface");
    L.push("    edit wan1");
    if (wanMode === "dhcp") {
      L.push("        set mode dhcp");
      L.push("        set allowaccess ping https ssh");
      L.push('        set alias "WAN"');
    } else {
      L.push("        set mode static");
      L.push("        set ip " + wanIp + " " + prefixToMask(parseInt(wanPrefix, 10)));
      L.push("        set allowaccess ping https ssh");
      L.push('        set alias "WAN"');
    }
    L.push("    next");
    L.push("    edit " + lanPort);
    L.push("        set ip " + lanIp + " " + lanMask);
    L.push("        set allowaccess ping https ssh");
    L.push('        set alias "LAN_IT"');
    L.push("    next");
    L.push("    edit vlan" + f.hotspotVlanId);
    L.push("        set vdom root");
    L.push("        set interface " + lanPort);
    L.push("        set vlanid " + f.hotspotVlanId);
    L.push("        set ip " + hotIp + " " + hotMask);
    L.push("        set allowaccess ping");
    L.push('        set alias "HOTSPOT"');
    L.push("    next");
    L.push("    edit " + dmzPort);
    L.push("        set ip " + dmzIp + " " + dmzMask);
    L.push("        set allowaccess ping");
    L.push('        set alias "DMZ"');
    L.push("    next");
    L.push("end");
    L.push("");

    /* 3. Zones */
    L.push("config system zone");
    L.push('    edit "LAN_IT"');
    L.push("        set interface " + lanPort);
    L.push("    next");
    L.push('    edit "HOTSPOT"');
    L.push("        set interface vlan" + f.hotspotVlanId);
    L.push("    next");
    L.push('    edit "DMZ"');
    L.push("        set interface " + dmzPort);
    L.push("    next");
    L.push('    edit "WAN"');
    L.push("        set interface wan1");
    L.push("    next");
    L.push("end");
    L.push("");

    /* 4. Routage */
    L.push("config router static");
    if (wanMode === "static") {
      L.push("    edit 1");
      L.push("        set dst 0.0.0.0 0.0.0.0");
      L.push("        set gateway " + wanGw);
      L.push('        set device "wan1"');
      L.push("    next");
    }
    if (modules.ipsec) {
      L.push("    edit " + (wanMode === "static" ? 2 : 1));
      L.push("        set dst 192.168.40.0 255.255.255.0");
      L.push('        set device "to_siteB"');
      L.push("    next");
    }
    L.push("end");
    L.push("");

    /* 5. DHCP */
    if (modules.dhcp) {
      L.push("config system dhcp server");
      L.push("    edit 1");
      L.push("        set dns-service default");
      L.push("        set default-gateway " + lanIp);
      L.push("        set netmask " + lanMask);
      L.push('        set interface "' + lanPort + '"');
      L.push("        config ip-range");
      L.push("            edit 1");
      L.push("                set start " + gwOf(lanCidr).replace(/\.1$/, ".10"));
      L.push("                set end " + gwOf(lanCidr).replace(/\.1$/, ".200"));
      L.push("            next");
      L.push("        end");
      L.push("    next");
      L.push("    edit 2");
      L.push("        set dns-service default");
      L.push("        set default-gateway " + hotIp);
      L.push("        set netmask " + hotMask);
      L.push('        set interface "vlan' + f.hotspotVlanId + '"');
      L.push("        config ip-range");
      L.push("            edit 1");
      L.push("                set start " + gwOf(hotCidr).replace(/\.1$/, ".10"));
      L.push("                set end " + gwOf(hotCidr).replace(/\.1$/, ".200"));
      L.push("            next");
      L.push("        end");
      L.push("    next");
      L.push("end");
      L.push("");
    }

    /* 6. DNS */
    if (modules.dns) {
      L.push("config system dns");
      L.push("        set primary 8.8.8.8");
      L.push("        set secondary 1.1.1.1");
      L.push("        set protocol cleartext");
      L.push("end");
      L.push("");
    }

    /* 7. VIP + politiques */
    if (modules.nat) {
      L.push("config firewall vip");
      L.push('    edit "VIP_WEB"');
      L.push("        set extip <IP_PUBLIQUE_DMX>");
      L.push('        set extintf "wan1"');
      L.push("        set portforward enable");
      L.push("        set mappedip " + gwOf(dmzCidr).replace(/\.1$/, ".10"));
      L.push("        set extport 80");
      L.push("        set mappedport 80");
      L.push("    next");
      L.push("end");
      L.push("");
    }

    if (modules.policies) {
      L.push("config firewall policy");
      L.push("    edit 1");
      L.push('        set name "LAN_IT_to_WAN"');
      L.push('        set srcintf "LAN_IT"');
      L.push('        set dstintf "WAN"');
      L.push("        set srcaddr all");
      L.push("        set dstaddr all");
      L.push("        set action accept");
      L.push('        set schedule "always"');
      L.push("        set service ALL");
      L.push("        set nat enable");
      if (modules.utm) {
        L.push("        set utm-status enable");
        L.push('        set av-profile "default"');
        L.push('        set ips-sensor "default"');
        L.push('        set ssl-ssh-profile "certificate-inspection"');
      }
      L.push("    next");
      L.push("    edit 2");
      L.push('        set name "HOTSPOT_to_WAN"');
      L.push('        set srcintf "HOTSPOT"');
      L.push('        set dstintf "WAN"');
      L.push("        set srcaddr all");
      L.push("        set dstaddr all");
      L.push("        set action accept");
      L.push('        set schedule "always"');
      L.push("        set service HTTP HTTPS DNS");
      L.push("        set nat enable");
      if (modules.utm) {
        L.push("        set utm-status enable");
        L.push('        set av-profile "default"');
        L.push('        set ips-sensor "default"');
        L.push('        set webfilter-profile "default"');
        L.push('        set application-list "default"');
        L.push('        set ssl-ssh-profile "certificate-inspection"');
      }
      L.push("    next");
      L.push("    edit 3");
      L.push('        set name "HOTSPOT_to_LAN_IT_DENY"');
      L.push('        set srcintf "HOTSPOT"');
      L.push('        set dstintf "LAN_IT"');
      L.push("        set srcaddr all");
      L.push("        set dstaddr all");
      L.push("        set action deny");
      L.push('        set schedule "always"');
      L.push("        set service ALL");
      L.push("        set logtraffic all");
      L.push("    next");
      L.push("    edit 4");
      L.push('        set name "DMZ_to_LAN_IT_DENY"');
      L.push('        set srcintf "DMZ"');
      L.push('        set dstintf "LAN_IT"');
      L.push("        set srcaddr all");
      L.push("        set dstaddr all");
      L.push("        set action deny");
      L.push('        set schedule "always"');
      L.push("        set service ALL");
      L.push("        set logtraffic all");
      L.push("    next");
      if (modules.nat) {
        L.push("    edit 5");
        L.push('        set name "WAN_to_DMZ_HTTP"');
        L.push('        set srcintf "WAN"');
        L.push('        set dstintf "DMZ"');
        L.push("        set srcaddr all");
        L.push('        set dstaddr "VIP_WEB"');
        L.push("        set action accept");
        L.push('        set schedule "always"');
        L.push("        set service HTTP HTTPS");
        if (modules.utm) {
          L.push("        set utm-status enable");
          L.push('        set av-profile "default"');
          L.push('        set ips-sensor "default"');
        }
        L.push("    next");
      }
      L.push("end");
      L.push("");
    }

    /* 8. Wi-Fi */
    if (ssid) {
      L.push("config wireless-controller vap");
      L.push('    edit "hotspot-wifi"');
      L.push('        set ssid "' + escapeSecret(ssid) + '"');
      L.push("        set security wpa2-personal");
      L.push("        set passphrase " + secretValue(f.wifiKey, "<CLE_WPA2>"));
      L.push("        set vlanid " + wifiVlan);
      L.push("    next");
      L.push("end");
      L.push("");
    }

    /* 9. SSL-VPN */
    if (modules.sslvpn) {
      L.push("config vpn ssl settings");
      L.push('        set servercert "Fortinet_Factory"');
      L.push('        set tunnel-ip-pools "SSLVPN_TUNNEL_ADDR1"');
      L.push('        set source-interface "wan1"');
      L.push("        set source-address all");
      L.push('        set default-portal "full-access"');
      L.push("end");
      L.push("");
      L.push("config user local");
      L.push('    edit "' + vpnUser + '"');
      L.push("        set type password");
      L.push("        set passwd " + secretValue(f.vpnPassword, "<MOT_DE_PASSE_VPN>"));
      L.push("    next");
      L.push("end");
      L.push("");
      L.push("config user group");
      L.push('    edit "SSLVPN_GROUP"');
      L.push('        set member "' + vpnUser + '"');
      L.push("    next");
      L.push("end");
      L.push("");
      L.push("config firewall policy");
      L.push("    edit 10");
      L.push('        set name "VPN_to_LAN_IT"');
      L.push('        set srcintf "ssl.root"');
      L.push('        set dstintf "LAN_IT"');
      L.push("        set srcaddr all");
      L.push("        set dstaddr all");
      L.push("        set action accept");
      L.push('        set schedule "always"');
      L.push("        set service ALL");
      if (modules.utm) {
        L.push("        set utm-status enable");
        L.push('        set av-profile "default"');
        L.push('        set ips-sensor "default"');
      }
      L.push("    next");
      L.push("end");
      L.push("");
    }

    /* 10. IPsec site-à-site */
    if (modules.ipsec) {
      L.push("config vpn ipsec phase1-interface");
      L.push('    edit "to_siteB"');
      L.push('        set interface "wan1"');
      L.push("        set peertype any");
      L.push("        set proposal aes256-sha256");
      L.push("        set remote-gw " + ipsecRemote);
      L.push("        set psksecret " + secretValue(f.ipsecPsk, "<SECRET_IPSEC>"));
      L.push("    next");
      L.push("end");
      L.push("");
      L.push("config vpn ipsec phase2-interface");
      L.push('    edit "to_siteB_p2"');
      L.push('        set phase1name "to_siteB"');
      L.push("        set proposal aes256-sha256");
      L.push("        set src-subnet " + lanCidr.split("/")[0] + " " + lanMask);
      L.push("        set dst-subnet 192.168.40.0 255.255.255.0");
      L.push("    next");
      L.push("end");
      L.push("");
      L.push("config firewall policy");
      L.push("    edit 20");
      L.push('        set name "LAN_IT_to_SiteB"');
      L.push('        set srcintf "LAN_IT"');
      L.push('        set dstintf "to_siteB"');
      L.push("        set srcaddr all");
      L.push("        set dstaddr all");
      L.push("        set action accept");
      L.push('        set schedule "always"');
      L.push("        set service ALL");
      L.push("    next");
      L.push("end");
      L.push("");
    }

    /* 11. Syslog */
    if (modules.syslog) {
      L.push("config log syslogd setting");
      L.push("        set status enable");
      L.push('        set server "' + syslogServer + '"');
      L.push("        set port 514");
      L.push("        set facility local7");
      L.push("end");
      L.push("");
    }

    /* 12. SNMPv3 */
    if (modules.snmp) {
      L.push("config system snmp sysinfo");
      L.push("        set status enable");
      L.push('        set description "FortiGate ' + hostname + '"');
      L.push('        set location "Salle serveur - Douala"');
      L.push("end");
      L.push("");
      L.push("config system snmp user");
      L.push('    edit "zbx-v3"');
      L.push("        set security-level auth-priv");
      L.push("        set auth-proto sha");
      L.push("        set auth-pwd " + secretValue(f.snmpAuth, "<MDP_AUTH_SNMP>"));
      L.push("        set priv-proto aes");
      L.push("        set priv-pwd " + secretValue(f.snmpPriv, "<MDP_CHIFFREMENT_SNMP>"));
      L.push("    next");
      L.push("end");
      L.push("");
    }

    /* 13. Sauvegarde automatique */
    if (modules.backup) {
      L.push("config system auto-script");
      L.push('    edit "backup-auto"');
      L.push("        set interval 86400");
      L.push("        set repeat 0");
      L.push("        set start auto");
      L.push('        set script "execute backup config sftp /backups/fgt-config.conf ' +
        sftpServer + ' mkbackup ' + secretValue(f.sftpPassword, "<MOT_DE_PASSE_SFTP>") + '"');
      L.push("    next");
      L.push("end");
      L.push("");
    }

    L.push("# Fin de la configuration générée — pensez à : execute backup config tftp");
    return { ok: true, errors: [], script: L.join("\n") };
  }

  /* ==================== RENDU NAVIGATEUR ==================== */

  function el(tag, className, text) {
    var n = document.createElement(tag);
    if (className) n.className = className;
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
  }

  function field(labelText, inputEl, hint) {
    var wrap = el("div", "field");
    var lab = el("label", null, labelText);
    lab.setAttribute("for", inputEl.id);
    wrap.appendChild(lab);
    wrap.appendChild(inputEl);
    if (hint) wrap.appendChild(el("span", "hint", hint));
    wrap.appendChild(el("span", "field-error"));
    return wrap;
  }

  function input(id, type, value, placeholder) {
    var i = el("input");
    i.type = type || "text";
    i.id = id;
    i.value = value || "";
    if (placeholder) i.placeholder = placeholder;
    i.autocomplete = "off";
    return i;
  }

  function select(id, options, selected) {
    var s = el("select");
    s.id = id;
    options.forEach(function (o) {
      var opt = el("option", null, o[1]);
      opt.value = o[0];
      if (String(o[0]) === String(selected)) opt.selected = true;
      s.appendChild(opt);
    });
    return s;
  }

  /** Rend le formulaire interactif dans le conteneur (utilisé par app.js). */
  function renderTool(container) {
    container.textContent = "";

    var note = el("p", null,
      "Remplissez le formulaire : le script FortiOS correspondant est généré avec validation stricte " +
      "(listes blanches, IP/CIDR, chevauchements, secrets ≥ 12 caractères, refus des injections). " +
      "Les champs laissés vides produisent des placeholders <PLACEHOLDER> à remplacer avant import.");
    note.style.color = "var(--text-muted)";
    note.style.fontSize = "0.9rem";
    container.appendChild(note);

    var form = el("div");
    form.setAttribute("role", "form");
    form.setAttribute("aria-label", "Générateur de configuration FortiGate");

    /* --- Identité --- */
    var fs1 = el("fieldset");
    fs1.appendChild(el("legend", null, "Identité de l'équipement"));
    var g1 = el("div", "field-grid");
    g1.appendChild(field("Nom d'hôte", input("cg-hostname", "text", "FGT-CFP-CMD"), "Lettres, chiffres, tirets"));
    g1.appendChild(field("Fuseau horaire", select("cg-tz", Object.keys(TIMEZONES).map(function (k) {
      return [k, k + " — " + TIMEZONES[k]];
    }), "01")));
    g1.appendChild(field("Utilisateur admin", input("cg-admin-user", "text", "admin")));
    g1.appendChild(field("Mot de passe admin", input("cg-admin-pass", "password"), "12 caractères min. — vide = placeholder"));
    var mfa = input("cg-mfa", "checkbox");
    var mfaWrap = el("label", "module-check");
    mfaWrap.appendChild(mfa);
    mfaWrap.appendChild(el("span", null, "Activer la MFA (FortiToken)"));
    g1.appendChild(mfaWrap);
    fs1.appendChild(g1);
    form.appendChild(fs1);

    /* --- WAN --- */
    var fs2 = el("fieldset");
    fs2.appendChild(el("legend", null, "WAN (wan1)"));
    var g2 = el("div", "field-grid");
    g2.appendChild(field("Mode WAN", select("cg-wan-mode", [["dhcp", "DHCP (FAI)"], ["static", "Statique"]], "dhcp")));
    g2.appendChild(field("IP WAN (statique)", input("cg-wan-ip", "text", "", "203.0.113.10")));
    g2.appendChild(field("Préfixe WAN", input("cg-wan-prefix", "number", "24")));
    g2.appendChild(field("Passerelle FAI", input("cg-wan-gw", "text", "", "203.0.113.1")));
    fs2.appendChild(g2);
    form.appendChild(fs2);

    /* --- Réseaux internes --- */
    var fs3 = el("fieldset");
    fs3.appendChild(el("legend", null, "Réseaux internes (CIDR)"));
    var g3 = el("div", "field-grid");
    g3.appendChild(field("LAN_IT", input("cg-lan", "text", "192.168.10.0/24")));
    g3.appendChild(field("HOTSPOT", input("cg-hotspot", "text", "192.168.20.0/24")));
    g3.appendChild(field("DMZ", input("cg-dmz", "text", "192.168.30.0/24")));
    g3.appendChild(field("Port LAN", select("cg-lan-port", LAN_PORTS.map(function (p) { return [p, p]; }), "internal")));
    g3.appendChild(field("Port DMZ", select("cg-dmz-port", DMZ_PORTS.map(function (p) { return [p, p]; }), "dmz")));
    g3.appendChild(field("VLAN Hotspot", input("cg-vlan", "number", "20")));
    fs3.appendChild(g3);
    form.appendChild(fs3);

    /* --- Wi-Fi --- */
    var fs4 = el("fieldset");
    fs4.appendChild(el("legend", null, "Wi-Fi Hotspot (optionnel)"));
    var g4 = el("div", "field-grid");
    g4.appendChild(field("SSID", input("cg-ssid", "text", "", "CFP-CMD-Hotspot")));
    g4.appendChild(field("Clé WPA2", input("cg-wifi-key", "password"), "12 caractères min."));
    fs4.appendChild(g4);
    form.appendChild(fs4);

    /* --- Modules --- */
    var fs5 = el("fieldset");
    fs5.appendChild(el("legend", null, "Modules à inclure"));
    var modGrid = el("div", "module-grid");
    var MODS = [
      ["policies", "Firewall policies", true],
      ["nat", "NAT + VIP DMZ", true],
      ["dhcp", "Serveurs DHCP", true],
      ["dns", "DNS système", true],
      ["utm", "Profils UTM (AV, IPS, WF, AppCtrl)", true],
      ["sslvpn", "VPN SSL", true],
      ["ipsec", "VPN IPsec site-à-site", false],
      ["syslog", "Logs Syslog distant", true],
      ["snmp", "Supervision SNMPv3", true],
      ["backup", "Sauvegarde auto SFTP", false]
    ];
    MODS.forEach(function (m) {
      var cb = input("cg-mod-" + m[0], "checkbox");
      cb.checked = m[2];
      var wrap = el("label", "module-check");
      wrap.appendChild(cb);
      wrap.appendChild(el("span", null, m[1]));
      modGrid.appendChild(wrap);
    });
    fs5.appendChild(modGrid);
    form.appendChild(fs5);

    /* --- Paramètres modules optionnels --- */
    var fs6 = el("fieldset");
    fs6.appendChild(el("legend", null, "Paramètres des services"));
    var g6 = el("div", "field-grid");
    g6.appendChild(field("Utilisateur SSL-VPN", input("cg-vpn-user", "text", "adm_vpn")));
    g6.appendChild(field("Mot de passe SSL-VPN", input("cg-vpn-pass", "password")));
    g6.appendChild(field("Passerelle distante IPsec", input("cg-ipsec-remote", "text", "", "198.51.100.20")));
    g6.appendChild(field("PSK IPsec", input("cg-ipsec-psk", "password"), "12 caractères min."));
    g6.appendChild(field("Serveur Syslog", input("cg-syslog", "text", "192.168.10.20")));
    g6.appendChild(field("Serveur SFTP", input("cg-sftp", "text", "192.168.10.20")));
    g6.appendChild(field("Mot de passe SFTP", input("cg-sftp-pass", "password")));
    g6.appendChild(field("SNMP auth (SHA)", input("cg-snmp-auth", "password")));
    g6.appendChild(field("SNMP chiffrement (AES)", input("cg-snmp-priv", "password")));
    fs6.appendChild(g6);
    form.appendChild(fs6);

    /* --- Actions + sortie --- */
    var actions = el("div", "quiz-actions");
    actions.style.justifyContent = "flex-start";
    var genBtn = el("button", "btn btn-primary");
    genBtn.type = "button";
    genBtn.appendChild(el("i", "fa-solid fa-terminal"));
    genBtn.appendChild(document.createTextNode(" Générer le script CLI"));
    var copyBtn = el("button", "btn");
    copyBtn.type = "button";
    copyBtn.appendChild(el("i", "fa-solid fa-copy"));
    copyBtn.appendChild(document.createTextNode(" Copier"));
    var dlBtn = el("button", "btn");
    dlBtn.type = "button";
    dlBtn.appendChild(el("i", "fa-solid fa-download"));
    dlBtn.appendChild(document.createTextNode(" Télécharger (.conf)"));
    copyBtn.style.display = "none";
    dlBtn.style.display = "none";
    actions.appendChild(genBtn);
    actions.appendChild(copyBtn);
    actions.appendChild(dlBtn);
    form.appendChild(actions);

    var errBox = el("div", "tool-errors");
    errBox.hidden = true;
    form.appendChild(errBox);

    var out = el("div", "cli-block");
    out.hidden = true;
    var head = el("div", "cli-head");
    head.appendChild(el("span", null, "Script FortiOS généré"));
    out.appendChild(head);
    var pre = el("pre");
    var code = el("code");
    pre.appendChild(code);
    out.appendChild(pre);
    form.appendChild(out);

    container.appendChild(form);

    /* ---------- Logique ---------- */
    function readForm() {
      return {
        hostname: document.getElementById("cg-hostname").value,
        timezone: document.getElementById("cg-tz").value,
        adminUser: document.getElementById("cg-admin-user").value,
        adminPassword: document.getElementById("cg-admin-pass").value,
        mfa: document.getElementById("cg-mfa").checked,
        wanMode: document.getElementById("cg-wan-mode").value,
        wanIp: document.getElementById("cg-wan-ip").value,
        wanPrefix: document.getElementById("cg-wan-prefix").value,
        wanGateway: document.getElementById("cg-wan-gw").value,
        lanNet: document.getElementById("cg-lan").value,
        hotspotNet: document.getElementById("cg-hotspot").value,
        dmzNet: document.getElementById("cg-dmz").value,
        lanPort: document.getElementById("cg-lan-port").value,
        dmzPort: document.getElementById("cg-dmz-port").value,
        hotspotVlanId: document.getElementById("cg-vlan").value || "20",
        ssid: document.getElementById("cg-ssid").value,
        wifiKey: document.getElementById("cg-wifi-key").value,
        wifiVlan: document.getElementById("cg-vlan").value || "20",
        vpnUser: document.getElementById("cg-vpn-user").value,
        vpnPassword: document.getElementById("cg-vpn-pass").value,
        ipsecRemote: document.getElementById("cg-ipsec-remote").value,
        ipsecPsk: document.getElementById("cg-ipsec-psk").value,
        syslogServer: document.getElementById("cg-syslog").value,
        sftpServer: document.getElementById("cg-sftp").value,
        sftpPassword: document.getElementById("cg-sftp-pass").value,
        snmpAuth: document.getElementById("cg-snmp-auth").value,
        snmpPriv: document.getElementById("cg-snmp-priv").value,
        modules: {
          policies: document.getElementById("cg-mod-policies").checked,
          nat: document.getElementById("cg-mod-nat").checked,
          dhcp: document.getElementById("cg-mod-dhcp").checked,
          dns: document.getElementById("cg-mod-dns").checked,
          utm: document.getElementById("cg-mod-utm").checked,
          sslvpn: document.getElementById("cg-mod-sslvpn").checked,
          ipsec: document.getElementById("cg-mod-ipsec").checked,
          syslog: document.getElementById("cg-mod-syslog").checked,
          snmp: document.getElementById("cg-mod-snmp").checked,
          backup: document.getElementById("cg-mod-backup").checked
        }
      };
    }

    genBtn.addEventListener("click", function () {
      var res = buildConfig(readForm());
      errBox.hidden = res.ok;
      errBox.textContent = "";
      out.hidden = !res.ok;
      copyBtn.style.display = res.ok ? "" : "none";
      dlBtn.style.display = res.ok ? "" : "none";
      if (!res.ok) {
        errBox.appendChild(el("b", null, "Validation échouée — " + res.errors.length + " erreur(s) :"));
        var ul = el("ul");
        res.errors.forEach(function (msg) {
          ul.appendChild(el("li", null, msg));
        });
        errBox.appendChild(ul);
        if (root.App && typeof App.toast === "function") {
          App.toast("Formulaire invalide : corrigez les erreurs signalées.", "error");
        }
        return;
      }
      code.textContent = res.script;
      if (root.App && typeof App.toast === "function") {
        App.toast("Script FortiOS généré — relisez-le avant import.", "success");
      }
    });

    function fallbackCopy(text) {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      ta.remove();
      return ok;
    }

    copyBtn.addEventListener("click", function () {
      var text = code.textContent;
      var done = function (ok) {
        if (root.App && typeof App.toast === "function") {
          App.toast(ok ? "Script copié dans le presse-papiers." : "Copie impossible — sélectionnez le texte manuellement.", ok ? "success" : "error");
        }
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(fallbackCopy(text)); });
      } else {
        done(fallbackCopy(text));
      }
    });

    dlBtn.addEventListener("click", function () {
      var blob = new Blob([code.textContent], { type: "text/plain;charset=utf-8" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "fgt-config-" + new Date().toISOString().slice(0, 10) + ".conf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
    });
  }

  /* ==================== EXPORT ==================== */
  var API = {
    TIMEZONES: TIMEZONES,
    isSafeText: isSafeText,
    validHostname: validHostname,
    validUser: validUser,
    validSsid: validSsid,
    validInt: validInt,
    validIPv4: validIPv4,
    validPrefix: validPrefix,
    validNetwork: validNetwork,
    prefixToMask: prefixToMask,
    findOverlaps: findOverlaps,
    escapeSecret: escapeSecret,
    secretValue: secretValue,
    checkPassword: checkPassword,
    buildConfig: buildConfig,
    renderTool: renderTool
  };

  root.FGCG = API;

  /* Auto-enregistrement dans le registre du guide (si présent) */
  if (typeof root.FG !== "undefined" && root.FG && typeof root.FG.addTool === "function") {
    root.FG.addTool("cli-generator", {
      title: "Générateur de configuration FortiGate",
      icon: "fa-solid fa-terminal",
      render: function (container) { renderTool(container); }
    });
  }

  if (typeof module === "object" && module.exports) {
    module.exports = API;
  }
})(typeof self !== "undefined" ? self : this);
