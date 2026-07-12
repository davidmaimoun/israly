// Recherche « intelligente » côté serveur : multi-mots + tolérante aux fautes.
// MongoDB self-hosted n'ayant pas de fuzzy natif, on score les guides en mémoire.
import he from "../../messages/he.json";
import en from "../../messages/en.json";
import fr from "../../messages/fr.json";
import ru from "../../messages/ru.json";
import es from "../../messages/es.json";
import am from "../../messages/am.json";

// ————————————————————————————————————————————————————————————
// Réglages (ajuste ici si trop strict / trop permissif)
const REQUIRE_ALL = true; // exiger que TOUS les mots de la requête matchent (recherche "ET")
// Tolérance de fautes selon la longueur du mot : court = 0 faute, moyen = 1, long = 2.
const fuzzyThreshold = (len: number) => (len <= 5 ? 1 : len <= 8 ? 2 : 3);
// Alias / abréviations -> ajoutés au « sac de mots » du guide concerné.
const CITY_ALIASES: Record<string, string[]> = {
  jerusalem: ["jlm", "yerushalayim", "quds"],
  tel_aviv: ["tlv", "telaviv"],
  dead_sea: ["deadsea"],
  golan: ["golan"],
  sea_of_galilee: ["kinneret"],
};
// ————————————————————————————————————————————————————————————

type Dict = { langs?: Record<string, string>; cities?: Record<string, string> };
const ALL = [he, en, fr, ru, es, am] as unknown as Dict[];

const LANG_LABELS: Record<string, string[]> = {};
const CITY_LABELS: Record<string, string[]> = {};
for (const d of ALL) {
  for (const [code, label] of Object.entries(d.langs ?? {})) (LANG_LABELS[code] ??= []).push(label);
  for (const [key, label] of Object.entries(d.cities ?? {})) (CITY_LABELS[key] ??= []).push(label);
}

// minuscule + sans accents + garde lettres latines/hébreu/chiffres.
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\u0590-\u05ff ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function words(s: string): string[] {
  return normalize(s).split(" ").filter(Boolean);
}

// Distance d'édition (Levenshtein) bornée.
function lev(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (Math.abs(m - n) > 3) return 99;
  const prev = [...Array(n + 1).keys()];
  const cur = new Array(n + 1);
  for (let i = 1; i <= m; i++) {
    cur[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= n; j++) prev[j] = cur[j];
  }
  return prev[n];
}

// Score d'un token vs le sac de mots : 2 = exact/sous-chaîne, 1 = faute tolérée, 0 = rien.
function tokenScore(token: string, hay: string[]): number {
  if (token.length < 2) return 0;
  const thr = fuzzyThreshold(token.length);
  let best = 0;
  for (const w of hay) {
    if (w.length < 2) continue;
    if (w === token || w.includes(token) || token.includes(w)) return 2;
    if (thr > 0 && lev(token, w) <= thr) best = 1;
  }
  return best;
}

type Searchable = { firstName: string; lastName: string; languages: string[]; cities: string[] };

// Le « sac de mots » d'un guide : nom + langues (tous libellés) + régions (libellés + alias + valeur brute).
function haystack(g: Searchable): string[] {
  return [
    ...words(g.firstName),
    ...words(g.lastName),
    ...g.languages.flatMap((c) => (LANG_LABELS[c] ?? []).flatMap(words)),
    ...g.cities.flatMap((k) => [k, ...(CITY_LABELS[k] ?? []), ...(CITY_ALIASES[k] ?? [])].flatMap(words)),
  ];
}

// Filtre + trie les guides selon la requête libre (nom / langue / région, multi-mots, fautes tolérées).
export function searchGuides<T extends Searchable>(guides: T[], q: string): T[] {
  const tokens = words(q).filter((t) => t.length >= 2);
  if (!tokens.length) return guides;

  const scored = guides.map((g) => {
    const hay = haystack(g);
    let matched = 0;
    let quality = 0;
    for (const tk of tokens) {
      const s = tokenScore(tk, hay);
      if (s > 0) { matched++; quality += s; }
    }
    return { g, matched, quality };
  });

  // Priorité : guides qui matchent TOUS les mots. Repli (si aucun) : ceux qui matchent au moins un.
  const full = scored.filter((x) => x.matched === tokens.length);
  const pool = REQUIRE_ALL && full.length ? full : scored.filter((x) => x.matched > 0);

  return pool
    .sort((a, b) => b.matched - a.matched || b.quality - a.quality)
    .map((x) => x.g);
}