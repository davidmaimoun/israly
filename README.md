# Israly — système de leads (cascade) + picker guide

Dézippe à la racine du projet. L'arborescence sous `src/` suit ton alias `@/`
(si ton code est à la racine et non dans `src/`, déplace le contenu de `src/`
en conséquence).

## Contenu

```
prisma/
  lead-additions.prisma     → à MERGER dans ton schema.prisma
  seed-leads.ts             → seed multi-cas (npx tsx prisma/seed-leads.ts)
src/
  lib/leads/eligibility.ts          → cœur cascade (Éligibles → Classement). Rien à toucher.
  features/leads/actions.ts         → server actions (dispatch, offer/sell/pass, guide leads)
  components/admin/LeadDispatch.tsx → panneau admin (cascade triée + actions)
  components/guide/MyLeads.tsx      → dashboard guide "Mes leads"
  components/plan/GuidePickerModal.tsx → modal de choix de guide
  components/plan/PlanVisit.tsx     → form MAJ (full name, steps, picker guide)
  app/[locale]/admin/leads/page.tsx        → liste des leads (admin)
  app/[locale]/admin/leads/[id]/page.tsx   → dispatch d'un lead (admin)
  app/[locale]/admin/my-leads/page.tsx     → "Mes leads" (guide)
messages/
  fr.json / en.json / he.json  → REMPLACE tes fichiers (nouvelles clés form + picker)
```

## Étapes

1. **Prisma** — colle le contenu de `prisma/lead-additions.prisma` dans ton
   `schema.prisma` (enums + `LeadOffer`), ajoute les champs commentés dans
   `Booking` et `Guide`, puis `npx prisma db push && npx prisma generate`.
   - `Availability` est déjà dans ton schéma : **ne le re-colle pas**.
   - Vérifie ensuite : `grep -n "model LeadOffer" prisma/schema.prisma` doit
     renvoyer une ligne, sinon `prisma.leadOffer` n'existera pas.

2. **Messages** — remplace tes `messages/{fr,he,en}.json` (ou merge les blocs
   `booking` + `plan` si tu as édité entre-temps). Langues parlées (`langs`) intactes.

3. **Composants / actions / pages** — copie sous `@/`. Protège les routes
   `admin/*` selon ton auth.

4. **Form** — la page qui rend `<PlanVisit />` doit lui passer `guides` :
   ```tsx
   const guides = await prisma.guide.findMany({ where: { published: true } });
   <PlanVisit guides={guides.map((g) => ({
     id: g.id, name: /* g.firstName+g.lastName ou g.name */, photo: g.photo, langs: g.languages,
   }))} />
   ```
   Sans `guides`, le picker ne s'affiche pas (le reste du form marche).

5. **Seed** (optionnel) — `npx tsx prisma/seed-leads.ts`. Il affiche l'URL du
   lead vitrine à dispatcher. Ré-exécutable (nettoie les leads `@seed.local`).

## Points ADAPT — il n'en reste que 2

Le reste est déjà mappé sur ton schéma (`Booking`, `Guide.languages/cities/published/rating`,
`prisma` depuis `@/lib/db`, `LeadOffer.bookingId`, `startDate` DateTime).

| Fichier | Quoi |
|---|---|
| `features/bookings/actions.ts` | dans ton `createTourRequest`, passe `guideId` au `prisma.booking.create` (le form l'envoie déjà). |
| `app/.../my-leads/page.tsx` | récupère l'`id` du guide connecté depuis ta session Auth.js (ligne `const guideId = ""`). |

Note : `Booking.startDate` est **requis** dans ton schéma. Une demande générale
sans date doit donc recevoir une date par défaut dans ton `createTourRequest`
(ou rends `startDate` optionnel si tu veux de vrais leads sans date).

## Rappels de conception

- **`wonLast30d` = offres ACCEPTED** (leads remportés), pas offertes : sinon un
  guide qui refuse tout paraîtrait "affamé" et raflerait la priorité.
- **Cascade = ce classement** : `guides[0]` = premier à qui proposer.
  Équité (moins de leads) **gated par la réactivité** (2 dernières offres
  expirées → fin de file).
- **Aperçu sans contact** : le guide ne voit jamais le contact client avant
  paiement (`getGuideLeads` ne renvoie le contact que dans `won`).
- **MVP manuel** : proposer (WhatsApp) → payer (Bit) → "Vendu". Aucune
  automatisation d'expiration/élargissement pour l'instant — on l'ajoute quand
  le volume le justifie.
