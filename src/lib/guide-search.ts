// Recherche « intelligente » côté serveur : multi-mots + tolérante aux fautes.
// MongoDB self-hosted n'ayant pas de fuzzy natif, on score les guides en mémoire.
import he from "../../messages/he.json";
import en from "../../messages/en.json";
import fr from "../../messages/fr.json";
import ru from "../../messages/ru.json";
import es from "../../messages/es.json";
import am from "../../messages/am.json";

type Dict = { langs?: Record<string, string>; cities?: Record<string, string> };
const ALL = [he, en, fr, ru, es, am] as unknown as Dict[];

// code langue -> tous ses libellés (toutes langues) ; idem clés de région.
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
  const prev = new Array(n + 1);
  const cur = new Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
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

// Un token de recherche matche-t-il un des mots du guide (sous-chaîne ou faute légère) ?
function tokenMatches(token: string, hay: string[]): boolean {
  if (token.length < 2) return false;
  const thr = token.length <= 4 ? 1 : token.length <= 7 ? 2 : 3;
  for (const w of hay) {
    if (w.length < 2) continue;
    if (w.includes(token) || token.includes(w)) return true;
    if (lev(token, w) <= thr) return true;
  }
  return false;
}

type Searchable = { firstName: string; lastName: string; languages: string[]; cities: string[] };

// Filtre + trie les guides selon la requête libre (nom / langue / région, multi-mots, fautes tolérées).
export function searchGuides<T extends Searchable>(guides: T[], q: string): T[] {
  const tokens = words(q).filter((t) => t.length >= 2);
  if (!tokens.length) return guides;

  const scored = guides.map((g) => {
    const hay = [
      ...words(g.firstName),
      ...words(g.lastName),
      ...g.languages.flatMap((c) => (LANG_LABELS[c] ?? []).flatMap(words)),
      ...g.cities.flatMap((k) => (CITY_LABELS[k] ?? []).flatMap(words)),
    ];
    let score = 0;
    for (const tk of tokens) if (tokenMatches(tk, hay)) score++;
    return { g, score };
  });

  return scored
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.g);
}