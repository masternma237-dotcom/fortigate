#!/usr/bin/env node
/* ============================================================
   tools/test-generator.js — Tests du générateur CLI FortiOS
   Usage : node tools/test-generator.js
   Couvre les cas hostiles : injections, IP invalides, chevauchements,
   secrets trop courts, placeholders, échappement, cohérence du script.
   ============================================================ */
"use strict";

const path = require("path");
const FGCG = require(path.join(__dirname, "..", "js", "tools", "cli-generator.js"));

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log("  ✓ " + name);
  } catch (e) {
    failed++;
    console.log("  ✗ " + name + "\n      " + e.message);
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || "assertion échouée");
}

function assertNot(cond, msg) {
  assert(!cond, msg || "devrait être faux");
}

const BASE_FORM = {
  hostname: "FGT-CFP-CMD",
  timezone: "01",
  adminUser: "admin",
  adminPassword: "MotDePasse#2026",
  mfa: true,
  wanMode: "dhcp",
  lanNet: "192.168.10.0/24",
  hotspotNet: "192.168.20.0/24",
  dmzNet: "192.168.30.0/24",
  hotspotVlanId: "20",
  ssid: "CFP-CMD-Hotspot",
  wifiKey: "Cle_WiFi_Fort2026",
  vpnUser: "adm_vpn",
  vpnPassword: "MdpVpn#2026xx",
  ipsecRemote: "198.51.100.20",
  ipsecPsk: "SecretIpsec#2026",
  syslogServer: "192.168.10.20",
  sftpServer: "192.168.10.20",
  sftpPassword: "SftpBackup#2026",
  snmpAuth: "SnmpAuth#2026",
  snmpPriv: "SnmpPriv#2026",
  modules: {
    policies: true, nat: true, dhcp: true, dns: true, utm: true,
    sslvpn: true, ipsec: true, syslog: true, snmp: true, backup: true
  }
};

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

console.log("==============================================================");
console.log(" TESTS DU GÉNÉRATEUR CLI FORTIOS");
console.log("==============================================================");

/* ---------- Validation IPv4 ---------- */
test("validIPv4 accepte 192.168.10.1", () => {
  assert(FGCG.validIPv4("192.168.10.1"));
});
test("validIPv4 refuse 256.1.1.1", () => {
  assertNot(FGCG.validIPv4("256.1.1.1"));
});
test("validIPv4 refuse les zéros non significatifs (01.2.3.4)", () => {
  assertNot(FGCG.validIPv4("01.2.3.4"));
});
test("validIPv4 refuse 5 octets", () => {
  assertNot(FGCG.validIPv4("1.2.3.4.5"));
});
test("validIPv4 refuse les lettres", () => {
  assertNot(FGCG.validIPv4("a.b.c.d"));
});

/* ---------- Réseaux CIDR ---------- */
test("validNetwork accepte 192.168.10.0/24", () => {
  assert(FGCG.validNetwork("192.168.10.0/24"));
});
test("validNetwork refuse une adresse hôte (192.168.10.1/24)", () => {
  assertNot(FGCG.validNetwork("192.168.10.1/24"));
});
test("validNetwork refuse le préfixe /33", () => {
  assertNot(FGCG.validNetwork("192.168.10.0/33"));
});
test("prefixToMask(24) = 255.255.255.0", () => {
  assert(FGCG.prefixToMask(24) === "255.255.255.0");
});
test("prefixToMask(8) = 255.0.0.0", () => {
  assert(FGCG.prefixToMask(8) === "255.0.0.0");
});

/* ---------- Chevauchements ---------- */
test("findOverlaps détecte 192.168.10.0/24 vs 192.168.10.64/26", () => {
  const errs = FGCG.findOverlaps([
    { name: "A", cidr: "192.168.10.0/24" },
    { name: "B", cidr: "192.168.10.64/26" }
  ]);
  assert(errs.length === 1, "devrait trouver 1 chevauchement, trouvé " + errs.length);
});
test("findOverlaps accepte trois réseaux disjoints", () => {
  const errs = FGCG.findOverlaps([
    { name: "LAN", cidr: "192.168.10.0/24" },
    { name: "HS", cidr: "192.168.20.0/24" },
    { name: "DMZ", cidr: "192.168.30.0/24" }
  ]);
  assert(errs.length === 0);
});
test("findOverlaps détecte deux /24 identiques", () => {
  const errs = FGCG.findOverlaps([
    { name: "A", cidr: "10.0.0.0/24" },
    { name: "B", cidr: "10.0.0.0/24" }
  ]);
  assert(errs.length === 1);
});

/* ---------- Listes blanches / injections ---------- */
test("validHostname accepte FGT-CFP-CMD", () => {
  assert(FGCG.validHostname("FGT-CFP-CMD"));
});
test("validHostname refuse l'injection (admin;reboot)", () => {
  assertNot(FGCG.validHostname("admin;reboot"));
});
test("validHostname refuse le tiret initial (-evil)", () => {
  assertNot(FGCG.validHostname("-evil"));
});
test("isSafeText refuse le guillemet", () => {
  assertNot(FGCG.isSafeText('abc"def'));
});
test("isSafeText refuse le dollar", () => {
  assertNot(FGCG.isSafeText("abc$def"));
});
test("isSafeText refuse le point-virgule", () => {
  assertNot(FGCG.isSafeText("abc;def"));
});
test("isSafeText refuse les retours à la ligne", () => {
  assertNot(FGCG.isSafeText("abc\ndef"));
});
test("isSafeText refuse le backquote", () => {
  assertNot(FGCG.isSafeText("abc`def"));
});
test("validSsid refuse un SSID avec guillemets", () => {
  assertNot(FGCG.validSsid('wifi"evil'));
});
test("validUser accepte adm_vpn", () => {
  assert(FGCG.validUser("adm_vpn"));
});

/* ---------- Secrets ---------- */
test("checkPassword refuse 11 caractères", () => {
  const errs = [];
  assertNot(FGCG.checkPassword("court123456", "X", errs));
  assert(errs.length === 1);
});
test("checkPassword accepte 12 caractères", () => {
  const errs = [];
  assert(FGCG.checkPassword("MotDePasse#2026", "X", errs));
  assert(errs.length === 0);
});
test("escapeSecret échappe backslash, guillemet et dollar", () => {
  assert(FGCG.escapeSecret('a\\b"c$d') === 'a\\\\b\\"c\\$d');
});
test("secretValue vide → placeholder NON quoté", () => {
  assert(FGCG.secretValue("") === "<MOT_DE_PASSE_FORT>");
  assert(FGCG.secretValue(null, "<SECRET_IPSEC>") === "<SECRET_IPSEC>");
});
test("secretValue fourni → chaîne quotée échappée", () => {
  const v = FGCG.secretValue("MonSecret2026$");
  assert(v === '"MonSecret2026\\$"', "obtenu : " + v);
});

/* ---------- buildConfig : cas nominal ---------- */
let good = null;
test("buildConfig accepte le formulaire de référence", () => {
  good = FGCG.buildConfig(clone(BASE_FORM));
  assert(good.ok, "erreurs : " + JSON.stringify(good.errors));
  assert(good.script.length > 2000, "script trop court");
});
test("Le script contient le hostname", () => {
  assert(good.script.indexOf("set hostname FGT-CFP-CMD") !== -1);
});
test("Le script contient les 4 zones", () => {
  ["LAN_IT", "HOTSPOT", "DMZ", "WAN"].forEach((z) => {
    assert(good.script.indexOf('edit "' + z + '"') !== -1, "zone manquante " + z);
  });
});
test("Le script contient le VIP et le NAT", () => {
  assert(good.script.indexOf("config firewall vip") !== -1);
  assert(good.script.indexOf("set nat enable") !== -1);
});
test("Le script contient SSL-VPN + IPsec + syslog + SNMP + backup", () => {
  ["config vpn ssl settings", "config vpn ipsec phase1-interface",
   "config log syslogd setting", "config system snmp user", "config system auto-script"].forEach((marker) => {
    assert(good.script.indexOf(marker) !== -1, "bloc manquant : " + marker);
  });
});
test("Les secrets sont quotés et échappés", () => {
  assert(good.script.indexOf('set password "MotDePasse#2026"') !== -1);
});
test("Aucun caractère d'injection ne franchit la validation", () => {
  assertNot(good.script.indexOf("admin;reboot") !== -1);
});

/* ---------- buildConfig : cas hostiles ---------- */
test("buildConfig refuse deux réseaux qui se chevauchent", () => {
  const f = clone(BASE_FORM);
  f.hotspotNet = "192.168.10.0/24";
  const r = FGCG.buildConfig(f);
  assertNot(r.ok);
  assert(r.errors.some((e) => e.indexOf("Chevauchement") !== -1));
});
test("buildConfig refuse un mot de passe admin trop court", () => {
  const f = clone(BASE_FORM);
  f.adminPassword = "court";
  const r = FGCG.buildConfig(f);
  assertNot(r.ok);
  assert(r.errors.some((e) => e.indexOf("12 caractères") !== -1));
});
test("buildConfig refuse une hostname injectée", () => {
  const f = clone(BASE_FORM);
  f.hostname = 'FGT"; config system admin';
  const r = FGCG.buildConfig(f);
  assertNot(r.ok);
});
test("buildConfig refuse un WAN statique sans passerelle valide", () => {
  const f = clone(BASE_FORM);
  f.wanMode = "static";
  f.wanIp = "203.0.113.10";
  f.wanPrefix = "24";
  f.wanGateway = "pas-une-ip";
  const r = FGCG.buildConfig(f);
  assertNot(r.ok);
  assert(r.errors.some((e) => e.indexOf("Passerelle") !== -1));
});
test("buildConfig refuse un serveur syslog invalide quand le module est actif", () => {
  const f = clone(BASE_FORM);
  f.syslogServer = "pas-une-ip";
  const r = FGCG.buildConfig(f);
  assertNot(r.ok);
});
test("buildConfig refuse un fuseau horaire inconnu", () => {
  const f = clone(BASE_FORM);
  f.timezone = "99; reboot";
  const r = FGCG.buildConfig(f);
  assertNot(r.ok);
});
test("buildConfig refuse un SSID hostile", () => {
  const f = clone(BASE_FORM);
  f.ssid = 'hot"spot;$x';
  const r = FGCG.buildConfig(f);
  assertNot(r.ok);
});

/* ---------- buildConfig : placeholders ---------- */
test("Champs secrets vides → placeholders visibles non quotés", () => {
  const f = clone(BASE_FORM);
  f.adminPassword = "";
  f.ipsecPsk = "";
  f.ssid = "";
  const r = FGCG.buildConfig(f);
  assert(r.ok, JSON.stringify(r.errors));
  assert(r.script.indexOf("set password <MOT_DE_PASSE_FORT>") !== -1);
  assert(r.script.indexOf("set psksecret <SECRET_IPSEC>") !== -1);
});
test("Modules désactivés → blocs absents du script", () => {
  const f = clone(BASE_FORM);
  f.modules.sslvpn = false;
  f.modules.ipsec = false;
  f.modules.backup = false;
  const r = FGCG.buildConfig(f);
  assert(r.ok);
  assert(r.script.indexOf("config vpn ssl settings") === -1);
  assert(r.script.indexOf("config vpn ipsec") === -1);
  assert(r.script.indexOf("config system auto-script") === -1);
});

/* ---------- Rapport ---------- */
console.log("--------------------------------------------------------------");
console.log("Résultat : " + passed + " réussis, " + failed + " échoués");
if (failed > 0) process.exit(1);
console.log("✓ Tous les tests du générateur passent.");
