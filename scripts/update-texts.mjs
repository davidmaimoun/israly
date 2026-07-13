// Met à jour des textes dans les 6 langues, où qu'ils soient dans le JSON.
// Il trouve la bonne clé en cherchant un extrait de l'ancien texte (pas besoin de connaître le namespace).
// Usage (racine du projet) :  node scripts/update-texts.mjs

import { readFileSync, writeFileSync } from "node:fs";

const LOCS = ["fr", "en", "he", "ru", "es", "am"];

// Chaque cible : un "hint" (extrait de l'ANCIEN texte, par langue si besoin) + les nouvelles valeurs.
const TARGETS = [
  {
    name: "fallbackNotice",
    hints: ["couvre encore cette région", "covers this region", "לאזור הזה", "этому региону", "esta región", "region yet"],
    values: {
      fr: "Aucun guide ne correspond encore à votre recherche — voici tous nos guides pour vous aider à choisir.",
      en: "No guide matches your search yet — here are all our guides to help you choose.",
      he: "עדיין אין מדריך שמתאים לחיפוש שלך — הנה כל המדריכים שלנו שיעזרו לך לבחור.",
      ru: "Пока нет гида по вашему запросу — вот все наши гиды, чтобы помочь вам выбрать.",
      es: "Ningún guía coincide aún con tu búsqueda — aquí están todos nuestros guías para ayudarte a elegir.",
      am: "No guide matches your search yet — here are all our guides to help you choose.",
    },
  },
  {
    name: "howItWorks subtitle",
    hints: ["angue et région", "anguage and region", "שפה ואזור", "языку и региону", "idioma y región", "language and region"],
    values: {
      fr: "Trouvez un guide par nom, langue ou région en quelques secondes.",
      en: "Find a guide by name, language or region in seconds.",
      he: "מצאו מדריך לפי שם, שפה או אזור תוך שניות.",
      ru: "Найдите гида по имени, языку или региону за секунды.",
      es: "Encuentra un guía por nombre, idioma o región en segundos.",
      am: "Find a guide by name, language or region in seconds.",
    },
  },
];

// Cherche récursivement le chemin d'une valeur string contenant un des hints ; renvoie [obj, key] ou null.
function findSlot(node, hints) {
  if (!node || typeof node !== "object") return null;
  for (const [k, v] of Object.entries(node)) {
    if (typeof v === "string" && hints.some((h) => v.includes(h))) return [node, k];
    if (v && typeof v === "object") {
      const found = findSlot(v, hints);
      if (found) return found;
    }
  }
  return null;
}

for (const loc of LOCS) {
  const path = `messages/${loc}.json`;
  let json;
  try { json = JSON.parse(readFileSync(path, "utf8")); }
  catch (e) { console.error(`❌ ${loc}: ${e.message}`); continue; }

  for (const target of TARGETS) {
    const slot = findSlot(json, target.hints);
    if (!slot) { console.error(`⚠️  ${loc}: "${target.name}" introuvable (clé non trouvée)`); continue; }
    const [obj, key] = slot;
    obj[key] = target.values[loc];
    console.log(`✅ ${loc}: "${target.name}" → ${key}`);
  }
  writeFileSync(path, JSON.stringify(json, null, 2) + "\n", "utf8");
}
console.log("\nTerminé.");
