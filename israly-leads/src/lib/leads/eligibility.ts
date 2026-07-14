// lib/leads/eligibility.ts
// Cœur de la cascade : Éligibles -> Classement.
// Pur, testable, ZÉRO dépendance DB. Le petit groupe "tombe" de ces filtres.

export type GuideForRanking = {
  id: string;
  name: string;
  photo?: string | null;
  phone?: string | null;
  langs: string[];
  cities: string[];
  published: boolean;
  certified?: boolean;
  rating?: number | null;
  // --- stats calculées côté serveur ---
  wonLast30d: number; // nb de leads REMPORTÉS (offres ACCEPTED) sur 30j
  lastTwoExpired: boolean; // a laissé expirer ses 2 dernières offres sans répondre
  // dispo calendrier pour la date du lead (undefined = pas de date / non vérifié)
  availableOnDate?: boolean;
};

export type LeadCriteria = {
  langs: string[];
  cities: string[];
  hasDate: boolean;
};

// --- Étape 1 : filtres durs. 30 guides -> une poignée. ---
export function isEligible(g: GuideForRanking, lead: LeadCriteria): boolean {
  if (!g.published) return false;
  if (lead.langs.length && !g.langs.some((l) => lead.langs.includes(l))) return false;
  if (lead.cities.length && !g.cities.some((c) => lead.cities.includes(c))) return false;
  if (lead.hasDate && g.availableOnDate === false) return false; // seulement si vérifiable
  return true;
}

// Qualité du match (départage) : langues + régions en commun.
export function matchScore(g: GuideForRanking, lead: LeadCriteria): number {
  const l = lead.langs.length ? g.langs.filter((x) => lead.langs.includes(x)).length : 0;
  const c = lead.cities.length ? g.cities.filter((x) => lead.cities.includes(x)).length : 0;
  return l + c;
}

// --- Étape 2 : classement = équité (moins de leads d'abord), GATED par la réactivité.
// Ce classement EST la cascade : guides[0] = premier à qui on propose. ---
export function rankEligible(guides: GuideForRanking[], lead: LeadCriteria): GuideForRanking[] {
  return guides
    .filter((g) => isEligible(g, lead))
    .sort((a, b) => {
      // 1) Réactivité : ceux qui ignorent (2 dernières offres expirées) -> fin de file
      if (a.lastTwoExpired !== b.lastTwoExpired) return a.lastTwoExpired ? 1 : -1;
      // 2) Équité : moins de leads REMPORTÉS d'abord (pas offerts — sinon les
      //    guides qui refusent tout paraîtraient "affamés")
      if (a.wonLast30d !== b.wonLast30d) return a.wonLast30d - b.wonLast30d;
      // 3) Départage : meilleur match, puis note, puis certifié
      const m = matchScore(b, lead) - matchScore(a, lead);
      if (m !== 0) return m;
      const ra = a.rating ?? 0;
      const rb = b.rating ?? 0;
      if (rb !== ra) return rb - ra;
      return (b.certified ? 1 : 0) - (a.certified ? 1 : 0);
    });
}
