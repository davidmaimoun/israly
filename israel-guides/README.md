# Guides d'Israël — annuaire + réservation

Plateforme de mise en relation avec des guides touristiques en Israël (marketplace
multi-guides). Contenu des guides **dynamique et multilingue en base**, UI traduite
via fichiers i18n.

**Stack** : Next.js 15 (App Router, Server Actions) · TypeScript · Tailwind CSS v4 ·
Prisma + MongoDB · next-intl v4 · Auth.js v5 · react-day-picker v9 · zod · bcryptjs.

---

## 1. Prérequis

- Node.js 20+
- Une instance **MongoDB en REPLICA SET** (cf. §4 — obligatoire pour Prisma).

## 2. Installation

```bash
npm install
cp .env.example .env
# génère un secret :
openssl rand -base64 33   # -> colle dans AUTH_SECRET
```

Renseigne `DATABASE_URL` dans `.env` (base dédiée, ex. `israel_guides`).

## 3. Base de données

```bash
npm run db:push     # pousse le schéma Prisma vers MongoDB
npm run seed        # crée 1 admin + 4 guides de démo + dispos
npm run db:studio   # (optionnel) explorateur Prisma
```

Comptes de démo créés par le seed :

| Rôle  | Email                | Mot de passe |
|-------|----------------------|--------------|
| Admin | `admin@example.com`  | `admin1234`  |
| Guide | `yossi@example.com`  | `guide1234`  |
| Guide | `marie@example.com`  | `guide1234`  |
| Guide | `david@example.com`  | `guide1234`  |
| Guide | `leila@example.com`  | `guide1234`  |

> **Change ces mots de passe** (et celui de l'admin) avant toute mise en ligne.

## 4. ⚠️ Piège Prisma + MongoDB = REPLICA SET obligatoire

Prisma utilise des transactions pour MongoDB et **exige un replica set**, sinon :

```
Transactions are not supported... This MongoDB deployment does not support transactions / replica set
```

### Option A — Mongo local en replica set mono-nœud

```bash
mongod --replSet rs0 --dbpath /var/lib/mongodb --bind_ip 127.0.0.1
# dans un autre terminal, une seule fois :
mongosh --eval 'rs.initiate()'
```

`DATABASE_URL="mongodb://127.0.0.1:27017/israel_guides?replicaSet=rs0"`

### Option B — MongoDB Atlas

Les clusters Atlas sont déjà en replica set. Récupère l'URI `mongodb+srv://…` et
ajoute le nom de la base : `…/israel_guides?retryWrites=true&w=majority`.

### Option C — instance existante

Si ta base tourne déjà sur une instance partagée, vérifie qu'elle est lancée avec
`--replSet` et ajoute `?replicaSet=<nom>` à l'URL. N'utilise qu'une base **dédiée**
(`israel_guides`) pour ne pas mélanger les collections.

## 5. Développement

```bash
npm run dev
# http://localhost:3000  (redirige vers /he par défaut)
```

Espace pro : `/admin` (login), puis dashboard guide ou admin selon le rôle.

## 6. i18n

- Langues : **hébreu (he, défaut, RTL)**, anglais (en), français (fr).
- Tout est centralisé dans `src/i18n/config.ts`. **Ajouter une langue = 1 ligne ici
  + 1 fichier `messages/<code>.json`**.
- `<html dir/lang>` est géré automatiquement (hébreu en RTL).
- Vérifie que les 3 fichiers ont la même structure de clés :

```bash
npm run i18n:check
```

> ⚠️ Les textes hébreux fournis sont des placeholders : **fais-les relire par un
> locuteur natif** avant production.

## 7. Thème (modulaire)

Tout le thème est dans `src/app/[locale]/theme.css`, à deux niveaux :

1. `:root` = **palette brute** (`--raw-orange`, `--raw-amber`…) → les « boutons » à éditer.
2. `@theme` = **rôles sémantiques** (`--color-primary`, `--color-accent`, `--color-ink`…)
   mappés sur la palette via `var()`.

Les composants n'utilisent **que les rôles** (`bg-primary`, `text-accent`…). Changer
un hex dans `:root` retune tout le site. Palette de départ : pierre de Jérusalem,
orange chaud dominant.

## 8. Galerie des guides

Chaque profil affiche une **galerie façon Insta/Pinterest** (masonry + lightbox),
photos **et** vidéos. Le guide ajoute ses médias depuis son dashboard
(`type`, `url`, `poster` pour les vidéos, `caption`). Champ `gallery` (composite
MongoDB) sur le modèle `Guide`.

## 9. Réservations (flux manuel)

Le client choisit une date dispo sur le calendrier du guide → crée une `Booking`
**PENDING**. Le guide confirme / refuse / termine depuis son dashboard, ce qui
**synchronise le calendrier** (CONFIRMED → date BOOKED). Les champs de paiement
existent mais sont inutilisés (automatisables plus tard via webhook).

## 10. Build & déploiement (PM2 + nginx)

`next.config.ts` est en `output: "standalone"`.

```bash
npm run build
node .next/standalone/server.js     # ou via PM2
```

Exemple PM2 :

```bash
pm2 start .next/standalone/server.js --name israel-guides
```

Place nginx en reverse-proxy devant le port 3000 et sers `.next/static` +
`public/` en statique. Pense à `remotePatterns` (déjà configuré pour Unsplash /
Cloudinary / Google) si tu héberges les images ailleurs.

## 11. À faire avant la mise en ligne

- [ ] Remplacer les **images placeholder** (dont le **Kotel** du hero : `public/img/kotel.jpg`)
      par de vraies photos.
- [ ] **Faire relire l'hébreu** par un natif.
- [ ] **Changer les mots de passe** admin + guides de démo.
- [ ] Renseigner `NEXT_PUBLIC_WHATSAPP` et l'email de contact.

---

## Structure

```
src/
├── i18n/            config, routing, navigation, request
├── messages/        (à la racine) he.json / en.json / fr.json
├── lib/             db, auth, auth.config, auth-guard, utils, cities, languages, specialties
├── features/        guides | bookings | availability | auth  (actions + schema zod)
├── components/
│   ├── ui/          Button, ParallaxBg, Reveal, Section, LanguageSwitcher,
│   │                Gallery, GuideCard, SearchBar, GuideFilters, BookingPanel…
│   ├── layout/      Header (scroll-spy), Footer
│   ├── sections/    Hero, HowItWorks, FeaturedGuides, PopularCities, Testimonials, Contact
│   └── admin/       Dashboard, GuideProfileForm, CalendarManager, BookingsManager…
└── app/[locale]/    layout, page (landing), guides, guides/[slug], admin/*
```

---

## Nouveautés (incrément multi-langues + espace guide)

### 7 langues
`he, en, fr, ru, es, am (amharique), ar`. Ajouter une langue = 1 entrée dans
`src/i18n/config.ts` + 1 fichier `messages/<locale>.json`. RTL : `he`, `ar`.
Les traductions `ru/es/am/ar/he` sont à **relire par des locuteurs natifs**
(générées via `/messages`, parité des clés garantie).

### Espace guide (rôle `guide`)
- **Profil** : prénom, nom, région (select des régions touristiques), langues,
  spécialités, années d'expérience, **description multilingue à onglets** (repli
  automatique à l'affichage), photo de profil.
- **Upload médias** : jusqu'à **10 photos** et **3 vidéos** (drag/pick), stockées
  sur le **filesystem** du serveur (voir ci-dessous).
- **Réservations** : inchangé.
- **Factures** : création depuis une réservation confirmée/terminée (numéro auto
  `INV-<année>-NNNN`, montant, devise ILS/USD/EUR, notes), statuts
  Brouillon → Envoyée → Payée, page **imprimable → PDF** via le navigateur.

L'admin voit en lecture seule tous les guides, réservations et factures.

### Stockage des fichiers uploadés
Dossier défini par `UPLOAD_DIR` (défaut : `<projet>/uploads`). Servis par la route
`GET /uploads/[...path]` (support Range pour les vidéos), donc fonctionne en dev
et en `standalone`. **En prod, déléguer `/uploads` à nginx** (plus rapide,
meilleur streaming) :

```nginx
location /uploads/ {
    alias /chemin/vers/le/projet/uploads/;
    access_log off;
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

`UPLOAD_DIR` peut pointer hors du projet (ex. `/var/www/israel-guides/uploads`)
pour persister entre les déploiements.

### Après extraction (schéma modifié)
```bash
npm install
npm run db:push    # applique le nouveau schéma (firstName/lastName, Invoice, bio 7 langues)
npm run seed       # données de démo (4 guides + 1 réservation + 1 facture)
npm run dev
```

### Tarifs (section prix)
Sur le profil guide, une section **Tarifs** :
- **Devise** (ILS / USD / EUR).
- **Tarif global** : prix **par personne / heure** et/ou **forfait par groupe** (les deux optionnels).
- **Tarifs par circuit** : liste de circuits nommés (nom, prix, unité `par personne` / `par groupe` / `par heure` / `par personne·heure`, durée optionnelle). **Chaque circuit remplace le tarif global** pour ce trip — pratique quand le prix change selon la sortie.

Affiché sur la page publique du guide (cartes « À partir de » + liste des forfaits). À la création d'une **facture**, un menu « Depuis un tarif » prérémplit le montant à partir d'un circuit.

### Refonte thème + sections home (style Tibeb)
- **Thème bleu + vert émeraude clair** (édite les hex dans `src/app/[locale]/theme.css`). Images placeholder régénérées en tons frais.
- **Section guides en scroll horizontal** (`GuidesRail`) : photo, nom, ville (ou « Toutes les villes » si `city = "all"`), description courte (localisée), **étoiles** si une note existe, flèches gauche/droite.
- **Galerie agrégée** (`GalleryRail`) : photos de tous les guides publiés, **badge = nom du guide**, scroll horizontal + **« Voir toute la galerie »** → page `/gallery` (grille masonry, chaque photo renvoie au profil du guide).
- **Notes** : champs `rating` (/5) + `ratingCount` sur `Guide`, affichés en étoiles sur les cartes, le rail et le profil.

### Réservation enrichie (calendrier + heure + WhatsApp)
Le `BookingPanel` (page profil) ajoute : **heure souhaitée**, **langue préférée** (optionnelle), et un bouton **« Demander via WhatsApp »** qui ouvre `wa.me` avec un message prérempli (nom, email, tél, nb pers., date, heure, langue, message) — sans écrire en base. Le bouton n'apparaît que si `NEXT_PUBLIC_WHATSAPP` est défini (format international, ex `972501234567`). Le formulaire normal crée toujours une demande **PENDING** visible par l'admin et le guide.

> Flux confirmation/paiement laissé volontairement simple (PENDING → le guide ou l'admin confirme). À décider plus tard : qui confirme, qui encaisse (cf. Tibeb : lien de paiement Grow collé par l'owner). Côté factures israéliennes > 5 000 ₪, prévoir un logiciel certifié (allocation number temps réel) plutôt qu'un PDF maison.

Régions : `city` accepte désormais `"all"` (libellé « Toutes les villes »).

### Thème modulaire (bleu chaud + blanc, esprit Israël)
Tout se règle dans **un seul bloc `:root`** de `src/app/[locale]/theme.css` (les rôles `@theme` ne se touchent pas). Une **palette alternative** (sable/olive méditerranéen) est fournie en commentaire : commente le `:root` actif, décommente l'autre, recharge. Images placeholder régénérées en bleu/blanc.

### Section « Planifier une visite » (demande générale)
Nouvelle section home (`PlanVisit`, ancre `#plan`, lien menu) = un formulaire **sans guide précis** : nom, email, tél, nb personnes, date + heure (optionnelles), **régions d'intérêt** (multi), **langues souhaitées** (multi), et un texte libre. Deux envois : **Envoyer** (crée une demande `PENDING` que l'**admin** voit dans « Toutes les réservations ») ou **WhatsApp** (message prérempli vers `NEXT_PUBLIC_WHATSAPP`).

Schéma : `Booking.guideId` devient **optionnel** (`null` = demande générale), + champs `startTime`, `preferredLang`, `cities[]`, `langs[]`. Les demandes générales n'apparaissent que côté admin (pas dans l'espace d'un guide). Correctif au passage : `startTime`/`preferredLang` étaient absents du schéma, c'est réparé.

> ⚠️ Schéma modifié → relance `npm run db:push && npm run seed` après extraction.

### Ajustements visuels (itération)
- **Arabe retiré** (UI + langues parlées). Langues UI : he, en, fr, ru, es, am.
- **Régions** : ajout de **« Autre »** (`other`) dans le select profil ; les filtres de recherche n'affichent que les vraies régions (plus de doublon « Toutes les villes »).
- **Carousels** : les flèches n'apparaissent **que si un défilement est possible** (et gérées en RTL). Section **galerie en pleine largeur** (fini l'effet de débordement). Cartes guides retravaillées. **Padding réduit** partout.
- **Recherche** (hero + page guides) : sections **alignées**, hover des badges propre.
- **Boutons** « Envoyer » / « WhatsApp » à la **même hauteur**.
- **Hero** : overlay plus clair, léger zoom, et **vidéo de fond optionnelle** via `NEXT_PUBLIC_HERO_VIDEO` (sinon l'image reste). Nouvelle signature (plus de « Jérusalem → Néguev »).

### Recherche multi-critères + images de démo
- **Recherche** (hero + page guides) : par **nom de guide** (champ texte), **langues** (multi) et **régions** (multi-sélection). Un guide « Toutes les villes » (`all`) matche n'importe quelle région choisie.
- **Images placeholder fiables** via **picsum.photos** (photos de profil distinctes par guide, galeries, vignettes régions) — fini les 404 d'URLs Unsplash mortes. Remplace-les par tes vraies photos ou des URLs Unsplash valides quand tu veux (`picsum.photos` est déjà autorisé dans `next.config.ts`, comme `images.unsplash.com`).
- `LanguageFlags` ignore désormais les codes inconnus (plus de crash `MISSING_MESSAGE` sur d'anciennes données « ar »).

> Pas de changement de schéma cette fois : un simple **`npm run seed`** rafraîchit les données (photos Picsum + langues sans arabe).

### Refonte fiche guide + réservation (drawer) + hero
- **Hero** repensé : texte + recherche **à gauche**, photo/vidéo qui **se fond** vers la gauche à droite. Recherche **compacte** (nom + bouton, filtres langues/régions **dépliables**), fond à 95 % d'opacité. Correction du « l » d'Israël (italique) qui était coupé.
- **Sections pleine largeur** : guides ET galerie en scroll horizontal bord à bord. **Galerie style Instagram** (tuiles carrées ; page `/gallery` en grille carrée centrée). Plus de photos de démo.
- **Fiche guide** : présentation soignée, **spécialités en pills sous les langues**, **plus de note**. Section **Circuits & tarifs** : chaque circuit affiche prix + (optionnel) **« Voir le détail »** du programme, et un bouton **« Réserver ce circuit »**.
- **Réservation** : un **bouton « Réserver » bien visible** (avant la galerie) ouvre une **sidebar slide-in** « Demander une réservation avec <prénom> » — **pas de calendrier, un champ date**. Les **langues proposées sont celles du guide uniquement**. Depuis « Réserver ce circuit », le drawer s'ouvre **pré-rempli** avec le circuit choisi. Schéma : `TripPrice.details` ajouté.

> Schéma modifié (détails circuit) → `npm run db:push && npm run seed` après extraction.

### Itération polish
- **Sous-titre hero** corrigé : « guides multilingues » (plus seulement fr/en/he).
- **« l » d'Israël** : marge droite renforcée sur `.accent-word` (plus de découpe).
- **Hero** : fade allégé → la photo de droite est bien visible (remplace `public/img/kotel.jpg` ou mets `NEXT_PUBLIC_HERO_VIDEO`).
- **Régions populaires** : 6 vignettes + bouton **« Voir toutes les régions »** → `/guides`.
- **Galerie (section home)** : gap des photos resserré.
- **Galerie (fiche guide)** : passe en **grille carrée centrée** (style Instagram).
- **Nav bar** : les liens de sections fonctionnent depuis **toutes les pages** (renvoient vers la home + ancre), pas seulement depuis l'accueil.
- **Icône WhatsApp** refaite (glyphe net).

### Itération (placement + cartes)
- **« Planifier une visite »** déplacé **juste après les guides**, avec un **fond bleu léger** et un **halo qui pulse** doucement (`softPulse`).
- **Régions populaires** : 6 vignettes plus **petites** (style « Places worth the journey »), + « Voir toutes les régions ».
- **Cartes guide** : la **région est retirée** (un guide peut couvrir plusieurs régions).
- **Nav** : liens de section robustes vers `/#section` depuis toutes les pages.

> Note dev : le message « Fast Refresh had to perform a full reload » + `hot-update.json 404` est du **bruit HMR normal** (rechargement complet quand un fichier avec hooks/structure change). Si un vrai overlay d'erreur s'affiche dans le navigateur, partage la stack.

### Itération (hero visible + ajustements)
- **Bug hero corrigé** : la section avait `bg-bg` **et** le média en `-z-10` → le fond opaque passait devant l'image (donc « rien »). Média remis au bon niveau. Ta photo s'affiche si elle s'appelle `public/img/kotel.jpg`, sinon pointe-la via `NEXT_PUBLIC_HERO_IMAGE="/img/ton-fichier.jpg"` (ou une vidéo via `NEXT_PUBLIC_HERO_VIDEO`).
- **Régions** : 2 lignes de 3 (cartes plus grandes).
- **Galerie (home)** : photos plus grandes.
- **Planifier une visite** : remis **avant Contact**, fond bleu + pulse léger. Son lien de nav est un **bouton bien visible** (desktop **et** mobile).
- **Boutons WhatsApp** : icône **lucide `MessageCircle`** (fini le SVG maison).

### Itération (mise en page + finitions)
- **Contenu plus large / moins de padding** : conteneurs en `max-w-7xl`, padding réduit (fiche en `max-w-5xl`).
- **Hero** : image **plein cadre**, voilée à gauche (on la devine) → **de plus en plus nette vers la droite** (dégradé).
- **Régions populaires** : cartes image + **nom + petite description** (2 lignes de 3).
- **Featured guides** : « Voir le profil » devient un **bouton bleu clair**.
- **How it works** : étapes numérotées, pastilles + **ligne de liaison**, fond bleu clair.
- **Contraste entre sections** : alternance blanc / bleu très clair / crème / bleu foncé (Contact).
- **Planifier une visite** : fond = **la photo du hero en fondu** (plus de pulse dans la section).
- **Le pulse est sur le bouton « Planifier »** : jolie **pastille rouge** qui pulse (desktop + mobile).

### Itération (hero plein écran, chat, finitions)
- **Hero** : prend toute la **hauteur d'écran**, texte **plus lisible** (voile plus opaque à gauche), **pleine largeur** (nav + hero), et un **chevron animé** invite à scroller.
- **Nav** : barre pleine largeur. Badge « Planifier » **plus discret** (petite pastille à gauche, pulse léger).
- **Régions** : texte **écrit sur la photo** (style « Places worth the journey »), fond de section plus foncé.
- **How it works** : fond plus foncé.
- **Cartes guides** : « Voir le profil » **collé en bas** (alignement constant) + effet de survol (léger soulèvement).
- **Plan a trip** : fond (photo hero) **moins voyant**.
- **Témoignages** : déplacés **après Plan a trip**, en **bulles de chat** qui apparaissent l'une après l'autre (gauche/droite, avatars).
- Animations de survol un peu partout pour rendre le tout plus vivant.

### Auth, création de guide par l'admin, notes (pills)
- **Comptes admin (seed)** : `admin@example.com / admin1234` et **`sudosudev@outlook.com / 123123`**. Connexion sur **`/admin/login`** (accès discret depuis le footer). Le lien « Pro area » a été retiré de la navbar.
- **Admin → onglet Guides** : formulaire **« Créer un guide »** (email + mot de passe initial + prénom/nom/région) → crée le compte + le profil, puis ouvre la page d'édition **`/admin/guides/[id]`** où l'admin remplit tout (photo, langues, spécialités, **descriptions par langue**, tarifs/circuits, **notes**, galerie, + **téléphone/email visibles admin uniquement**).
- **Le guide** se connecte et retrouve les **mêmes champs** (onglet Profil) pour modifier/ajouter (les infos contact restent côté admin).
- **Notes** : tags pratiques avec **suggestions pré-remplies** (Not on Shabbat, Available 24/7…) + champ libre. Ils s'affichent en **jolies pills sur la fiche, juste après « À propos »**.
- Publication : bouton publier/dépublier dans l'onglet Guides (un guide n'apparaît sur le site qu'une fois **publié**).

### Retouches UI
- Navbar & hero **pleine largeur**, hero **plein écran** avec chevron d'invitation.
- Bouton « Planifier » : **plus de pastille**, un **pulse léger** sur le bouton lui-même.
- **How it works** : fond avec **grille légère**. **Régions** : **fond foncé + texte blanc**, texte sur la photo.

> ⚠️ Schéma modifié (`Guide.phone`, `Guide.notes`) → **`npm run db:push && npm run seed`** après extraction.

### Pour tester tout de suite
1. `npm install && npm run db:push && npm run seed && npm run dev`
2. Va sur `/admin/login`, connecte-toi avec `sudosudev@outlook.com / 123123`.
3. Onglet **Guides → Créer un guide**, remplis, tu arrives sur la page d'édition : ajoute descriptions, notes, etc., **Enregistrer**.
4. Reviens à l'onglet Guides, **publie** le guide.
5. Il apparaît sur `/guides` et sa fiche `/guides/<slug>` (avec les notes en pills sous « À propos »).
