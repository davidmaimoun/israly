// Valide que tous les fichiers de /messages ont EXACTEMENT les mêmes clés.
import fs from "node:fs";
import path from "node:path";
import { locales, defaultLocale } from "../src/i18n/config";

function flatten(obj: Record<string, unknown>, prefix = ""): string[] {
  const keys: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      keys.push(...flatten(v as Record<string, unknown>, full));
    } else {
      keys.push(full);
    }
  }
  return keys.sort();
}

const dir = path.join(process.cwd(), "messages");
const ref = JSON.parse(fs.readFileSync(path.join(dir, `${defaultLocale}.json`), "utf8"));
const refKeys = flatten(ref);

let failed = false;
for (const locale of locales) {
  const data = JSON.parse(fs.readFileSync(path.join(dir, `${locale}.json`), "utf8"));
  const keys = flatten(data);
  const missing = refKeys.filter((k) => !keys.includes(k));
  const extra = keys.filter((k) => !refKeys.includes(k));
  if (missing.length || extra.length) {
    failed = true;
    console.error(`✗ ${locale}.json`);
    if (missing.length) console.error("  manquantes:", missing);
    if (extra.length) console.error("  en trop:", extra);
  } else {
    console.log(`✓ ${locale}.json (${keys.length} clés)`);
  }
}

if (failed) process.exit(1);
console.log("\nToutes les langues ont une structure de clés identique.");
