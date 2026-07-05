"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { updateGuideProfile } from "@/features/guides/actions";
import { LANGUAGES } from "@/lib/languages";
import { CITIES } from "@/lib/cities";
import { SPECIALTIES } from "@/lib/specialties";
import { locales, type Locale } from "@/i18n/config";
import { MAX_PHOTOS, MAX_VIDEOS } from "@/lib/upload-limits";
import { CURRENCIES, TRIP_UNITS, type Trip } from "@/lib/pricing";
import { MediaUploader } from "./MediaUploader";
import { Button } from "@/components/ui/Button";
import { Loader2, Check, Plus, Trash2, User, BookOpen, Wallet, Tag, Images } from "lucide-react";
import { cn } from "@/lib/utils";

export type Media = { type: "photo" | "video"; url: string; poster: string; caption: string };

export type GuideFormData = {
  id: string;
  firstName: string;
  lastName: string;
  photo: string;
  city: string;
  languages: string[];
  specialties: string[];
  yearsExperience: number;
  phone: string;
  notes: string[];
  bio: Partial<Record<Locale, string>>;
  gallery: Media[];
  currency: string;
  pricePerPersonHour: number | null;
  pricePerGroup: number | null;
  trips: Trip[];
};

const NOTE_SUGGESTIONS = ["Not on Shabbat", "Available 24/7", "Family friendly", "Wheelchair accessible", "Kosher options", "Groups welcome"];

type SectionId = "perso" | "about" | "pricing" | "notes" | "gallery";

export function GuideProfileForm({ guide, isAdmin = false, email }: { guide: GuideFormData; isAdmin?: boolean; email?: string }) {
  const uiLocale = useLocale();
  const t = useTranslations("admin.profile");
  const tl = useTranslations("langs");
  const tc = useTranslations("cities");
  const ts = useTranslations("specialties");
  const tpr = useTranslations("admin.pricing");
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [section, setSection] = useState<SectionId>("perso");

  const [firstName, setFirstName] = useState(guide.firstName);
  const [lastName, setLastName] = useState(guide.lastName);
  const [photo, setPhoto] = useState(guide.photo);
  const [city, setCity] = useState(guide.city);
  const [years, setYears] = useState(guide.yearsExperience);
  const [langs, setLangs] = useState<string[]>(guide.languages);
  const [specs, setSpecs] = useState<string[]>(guide.specialties);
  const [bio, setBio] = useState<Partial<Record<Locale, string>>>(guide.bio);
  const [gallery, setGallery] = useState<Media[]>(guide.gallery);
  const [currency, setCurrency] = useState(guide.currency || "ILS");
  const [pphInput, setPph] = useState(guide.pricePerPersonHour != null ? String(guide.pricePerPersonHour) : "");
  const [pgInput, setPg] = useState(guide.pricePerGroup != null ? String(guide.pricePerGroup) : "");
  const [trips, setTrips] = useState<Trip[]>(guide.trips);
  const [phone, setPhone] = useState(guide.phone);
  const [notes, setNotes] = useState<string[]>(guide.notes);
  const [noteInput, setNoteInput] = useState("");
  const [bioTab, setBioTab] = useState<Locale>(uiLocale as Locale);

  const photos = gallery.filter((m) => m.type === "photo");
  const videos = gallery.filter((m) => m.type === "video");
  const setPhotos = (next: Media[]) => setGallery([...next, ...videos]);
  const setVideos = (next: Media[]) => setGallery([...photos, ...next]);

  const toggle = (arr: string[], set: (v: string[]) => void, v: string) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const addNote = () => {
    const v = noteInput.trim();
    if (v && !notes.includes(v) && notes.length < 12) { setNotes([...notes, v]); setNoteInput(""); }
  };

  function save() {
    setError(null);
    setSaved(false);
    const bioClean = Object.fromEntries(
      Object.entries(bio).filter(([, v]) => typeof v === "string" && v.trim() !== ""),
    ) as Partial<Record<Locale, string>>;
    start(async () => {
      const res = await updateGuideProfile(uiLocale, guide.id, {
        firstName, lastName, photo, city,
        languages: langs, specialties: specs, yearsExperience: years,
        phone, bio: bioClean, notes,
        gallery: gallery.map((m) => ({ type: m.type, url: m.url, poster: m.poster || "", caption: m.caption || "" })),
        currency, pricePerPersonHour: pphInput, pricePerGroup: pgInput,
        trips: trips.map((tr) => ({ label: tr.label, price: tr.price, unit: tr.unit, duration: tr.duration ?? "", details: tr.details ?? "" })),
      });
      if (res.ok) setSaved(true);
      else setError(res.error ?? "Erreur");
    });
  }

  const SECTIONS: { id: SectionId; label: string; icon: typeof User }[] = [
    { id: "perso", label: t("secPerso"), icon: User },
    { id: "about", label: t("secAbout"), icon: BookOpen },
    { id: "pricing", label: t("secPricing"), icon: Wallet },
    { id: "notes", label: t("secNotes"), icon: Tag },
    { id: "gallery", label: t("secGallery"), icon: Images },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-[210px_1fr]">
      {/* Sidebar */}
      <aside className="flex gap-2 overflow-x-auto md:flex-col md:overflow-visible">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSection(s.id)}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors md:w-full",
              section === s.id ? "bg-primary text-cream" : "bg-surface text-ink-soft hover:bg-sand",
            )}
          >
            <s.icon size={16} /> {s.label}
          </button>
        ))}
      </aside>

      {/* Contenu */}
      <div className="grid gap-6">
        {section === "perso" && (
          <div className="grid gap-4 md:grid-cols-2">
            <L label={t("firstName")}><In value={firstName} onChange={setFirstName} /></L>
            <L label={t("lastName")}><In value={lastName} onChange={setLastName} /></L>
            <L label={t("region")}>
              <select value={city} onChange={(e) => setCity(e.target.value)} className="h-11 w-full rounded-xl border border-stone bg-cream/50 px-3">
                {CITIES.map((c) => <option key={c} value={c}>{tc(c)}</option>)}
              </select>
            </L>
            <L label={t("years")}><In type="number" value={years} onChange={(v) => setYears(Number(v))} /></L>
            <L label={t("photo")} className="md:col-span-2"><In value={photo} onChange={setPhoto} placeholder="https://… ou /uploads/…" /></L>
            {isAdmin && (
              <>
                <L label={t("phone")}><In value={phone} onChange={setPhone} placeholder="+972…" /></L>
                <L label={t("email")}>
                  <input value={email ?? ""} readOnly className="h-11 w-full rounded-xl border border-stone bg-sand px-3 text-ink-soft" />
                </L>
                <p className="text-xs text-ink-soft md:col-span-2">{t("contactNote")}</p>
              </>
            )}
          </div>
        )}

        {section === "about" && (
          <div className="grid gap-6">
            <L label={t("languages")}>
              <Chips items={LANGUAGES.map((l) => ({ value: l.code, label: `${l.flag} ${tl(l.code)}` }))} selected={langs} onToggle={(v) => toggle(langs, setLangs, v)} />
            </L>
            <L label={t("specialties")}>
              <Chips items={SPECIALTIES.map((s) => ({ value: s, label: ts(s) }))} selected={specs} onToggle={(v) => toggle(specs, setSpecs, v)} />
            </L>
            <div>
              <label className="eyebrow mb-1 block">{t("description")}</label>
              <p className="mb-2 text-xs text-ink-soft">{t("descriptionHint")}</p>
              <div className="mb-2 flex flex-wrap gap-1.5">
                {locales.map((l) => {
                  const filled = !!(bio[l] && bio[l]!.trim());
                  return (
                    <button key={l} type="button" onClick={() => setBioTab(l)}
                      className={cn("rounded-full px-3 py-1 text-xs", bioTab === l ? "bg-primary text-cream" : "bg-sand text-ink-soft", filled && bioTab !== l && "ring-1 ring-success/50")}>
                      {tl(l)}{filled ? " ✓" : ""}
                    </button>
                  );
                })}
              </div>
              <textarea value={bio[bioTab] ?? ""} dir={bioTab === "he" ? "rtl" : "ltr"} onChange={(e) => setBio({ ...bio, [bioTab]: e.target.value })} rows={6} className="w-full rounded-xl border border-stone bg-cream/50 px-3 py-2 text-sm" />
            </div>
          </div>
        )}

        {section === "pricing" && (
          <div className="grid gap-4 rounded-[var(--radius-card)] border border-stone/70 bg-cream/40 p-4">
            <div>
              <h3 className="display text-lg">{tpr("title")}</h3>
              <p className="text-xs text-ink-soft">{tpr("hint")}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <L label={tpr("currency")}>
                <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="h-11 w-full rounded-xl border border-stone bg-cream/50 px-3">
                  {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </L>
              <L label={tpr("perPersonHour")}><In type="number" value={pphInput} onChange={setPph} placeholder="—" /></L>
              <L label={tpr("perGroup")}><In type="number" value={pgInput} onChange={setPg} placeholder="—" /></L>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="eyebrow">{tpr("tripsTitle")}</label>
                <button type="button" onClick={() => setTrips([...trips, { label: "", price: 0, unit: "perGroup", duration: null, details: null }])} className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs text-white">
                  <Plus size={14} /> {tpr("addTrip")}
                </button>
              </div>
              <p className="mb-2 text-xs text-ink-soft">{tpr("tripsHint")}</p>
              <div className="grid gap-2">
                {trips.map((tr, i) => {
                  const set = (patch: Partial<Trip>) => setTrips(trips.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
                  return (
                    <div key={i} className="grid grid-cols-2 gap-2 rounded-xl border border-stone bg-surface p-2 md:grid-cols-[1fr_90px_140px_80px_auto]">
                      <input value={tr.label} onChange={(e) => set({ label: e.target.value })} placeholder={tpr("tripLabel")} className="h-10 rounded-lg border border-stone bg-cream/50 px-2 text-sm" />
                      <input type="number" value={tr.price} onChange={(e) => set({ price: Number(e.target.value) })} placeholder={tpr("tripPrice")} className="h-10 rounded-lg border border-stone bg-cream/50 px-2 text-sm" />
                      <select value={tr.unit} onChange={(e) => set({ unit: e.target.value as Trip["unit"] })} className="h-10 rounded-lg border border-stone bg-cream/50 px-2 text-sm">
                        {TRIP_UNITS.map((u) => <option key={u} value={u}>{tpr(`unit.${u}`)}</option>)}
                      </select>
                      <input type="number" value={tr.duration ?? ""} onChange={(e) => set({ duration: e.target.value === "" ? null : Number(e.target.value) })} placeholder={tpr("tripDuration")} className="h-10 rounded-lg border border-stone bg-cream/50 px-2 text-sm" />
                      <button type="button" onClick={() => setTrips(trips.filter((_, idx) => idx !== i))} className="grid h-10 w-10 place-items-center rounded-lg text-danger hover:bg-sand" aria-label={tpr("remove")}>
                        <Trash2 size={16} />
                      </button>
                      <textarea value={tr.details ?? ""} onChange={(e) => set({ details: e.target.value })} placeholder={tpr("tripDetails")} rows={2} className="col-span-2 w-full rounded-lg border border-stone bg-cream/50 px-2 py-1.5 text-sm md:col-span-5" />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {section === "notes" && (
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">{t("notes")}</label>
            <p className="mb-2 text-xs text-ink-soft">{t("notesHint")}</p>
            <div className="mb-2 flex flex-wrap gap-2">
              {notes.map((n) => (
                <span key={n} className="inline-flex items-center gap-1 rounded-full bg-accent/20 px-3 py-1 text-sm text-secondary">
                  {n}
                  <button type="button" onClick={() => setNotes(notes.filter((x) => x !== n))} className="text-secondary/70 hover:text-danger">×</button>
                </span>
              ))}
            </div>
            <div className="mb-2 flex flex-wrap gap-2">
              {NOTE_SUGGESTIONS.filter((sug) => !notes.includes(sug)).map((sug) => (
                <button key={sug} type="button" onClick={() => notes.length < 12 && setNotes([...notes, sug])} className="rounded-full border border-dashed border-stone px-3 py-1 text-sm text-ink-soft hover:bg-sand">
                  + {sug}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={noteInput} onChange={(e) => setNoteInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addNote(); } }} placeholder={t("addNote")} className="h-10 flex-1 rounded-xl border border-stone bg-cream/50 px-3 text-sm" />
              <button type="button" onClick={addNote} className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-cream"><Plus size={16} /></button>
            </div>
          </div>
        )}

        {section === "gallery" && (
          <div className="grid gap-6">
            <MediaUploader guideId={guide.id} kind="photo" max={MAX_PHOTOS} items={photos} onChange={setPhotos} />
            <MediaUploader guideId={guide.id} kind="video" max={MAX_VIDEOS} items={videos} onChange={setVideos} />
          </div>
        )}

        {/* Barre de sauvegarde (commune à toutes les sections) */}
        <div className="sticky bottom-0 flex items-center gap-3 border-t border-stone bg-cream/95 py-3 backdrop-blur">
          <Button onClick={save} size="lg" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
            {t("save")}
          </Button>
          {saved && <span className="text-sm text-success">{t("saved")}</span>}
          {error && <span className="text-sm text-danger">{error}</span>}
        </div>
      </div>
    </div>
  );
}

function L({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={className}><label className="eyebrow mb-1 block">{label}</label>{children}</div>;
}
function In({ value, onChange, type = "text", placeholder, className }: { value: string | number; onChange: (v: string) => void; type?: string; placeholder?: string; className?: string }) {
  return <input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={cn("h-11 w-full rounded-xl border border-stone bg-cream/50 px-3", className)} />;
}
function Chips({ items, selected, onToggle }: { items: { value: string; label: string }[]; selected: string[]; onToggle: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((it) => {
        const on = selected.includes(it.value);
        return (
          <button key={it.value} type="button" onClick={() => onToggle(it.value)} className={cn("rounded-full border px-3 py-1.5 text-sm", on ? "border-primary bg-primary text-cream" : "border-stone hover:bg-sand")}>
            {it.label}
          </button>
        );
      })}
    </div>
  );
}
