// Met à jour le message de confirmation dans les 6 langues, d'un coup.
// Usage (à la racine du projet) :  node scripts/update-plan-success.mjs

import { readFileSync, writeFileSync } from "node:fs";

const KEY = "success";  // la clé exacte
const NS = "booking";   // ← le bon namespace (pas "plan")

const VALUES = {
  fr: "Demande envoyée ! L'équipe Israly vous répondra rapidement (sauf le samedi).",
  en: "Request sent! The Israly team will get back to you shortly (except on Saturdays).",
  he: "הבקשה נשלחה! צוות Israly יחזור אליכם בהקדם (למעט בשבת).",
  ru: "Запрос отправлен! Команда Israly свяжется с вами в ближайшее время (кроме субботы).",
  es: "¡Solicitud enviada! El equipo de Israly te responderá en breve (excepto los sábados).",
  am: "ጥያቄው ተልኳል! የIsraly ቡድን በቅርቡ ይመልስልዎታል (ከቅዳሜ በስተቀር)።",
};

let ok = 0;
for (const [loc, value] of Object.entries(VALUES)) {
  const path = `messages/${loc}.json`;
  let json;
  try {
    json = JSON.parse(readFileSync(path, "utf8"));
  } catch (e) {
    console.error(`❌ ${loc}: lecture impossible (${e.message})`);
    continue;
  }
  if (!json[NS] || typeof json[NS][KEY] !== "string") {
    console.error(`❌ ${loc}: "${NS}.${KEY}" introuvable`);
    continue;
  }
  json[NS][KEY] = value;
  writeFileSync(path, JSON.stringify(json, null, 2) + "\n", "utf8");
  console.log(`✅ ${loc}: "${NS}.${KEY}" mis à jour`);
  ok++;
}

console.log(`\n${ok}/6 fichiers traités.`);