export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import { isCity } from "@/lib/cities";
import Image from "next/image";
import { setRequestLocale, getTranslations } from "next-intl/server";
import {
  MapPin, Award, Users, Moon, Clock, Accessibility, Utensils, BadgeCheck, Baby,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Gallery, type MediaItem } from "@/components/ui/Gallery";
import { LanguageFlags } from "@/components/ui/LanguageFlags";
import { GuideBooking } from "@/components/guide/GuideBooking";
import { localized, fullName } from "@/lib/utils";
import type { TripUnit } from "@/lib/pricing";
import type { Locale } from "@/i18n/config";

// Icône adaptée à une note (fallback: badge).
function noteIcon(n: string) {
  const s = n.toLowerCase();
  if (/shabbat|shabbos|chabbat/.test(s)) return Moon;
  if (/24\/7|24-7|24 ?7|always|available|dispo/.test(s)) return Clock;
  if (/family|kid|child|famille|enfant/.test(s)) return Baby;
  if (/wheelchair|accessib|handicap|fauteuil/.test(s)) return Accessibility;
  if (/kosher|casher|halal|food|meal|repas/.test(s)) return Utensils;
  if (/group|groupe/.test(s)) return Users;
  return BadgeCheck;
}

export default async function GuideProfilePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("guide");
  const tc = await getTranslations("cities");
  const ts = await getTranslations("specialties");
  const tg = await getTranslations("guides");

  const guide = await prisma.guide.findFirst({ where: { slug, published: true } });
  if (!guide) notFound();

  const name = fullName(guide);
  const bio = localized(guide.bio, locale as Locale);
  const trips = guide.trips.map((tr) => ({
    label: tr.label,
    price: tr.price,
    unit: tr.unit as TripUnit,
    duration: tr.duration ?? null,
    details: tr.details ?? null,
    itinerary: tr.itinerary ?? null,
  }));

  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-10 md:px-6 md:py-14">
        {/* Carte guide : grande photo + infos + à propos, sans bandeau */}
        <div className="rounded-[var(--radius-card)] border border-stone/60 bg-surface p-6 shadow-[var(--shadow-soft)] md:p-8">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            <div className="relative h-44 w-44 shrink-0 overflow-hidden rounded-3xl shadow-lg ring-1 ring-stone/50 md:h-52 md:w-52">
              <Image src={guide.photo || "/img/guide-placeholder.jpg"} alt={name} fill sizes="208px" className="object-cover" />
            </div>
            <div className="flex-1 text-center sm:text-start">
              <h1 className="display text-3xl md:text-4xl">{name}</h1>
              <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm text-ink-soft sm:justify-start">
                {guide.cities.length > 0 && (
                  <span className="flex items-center gap-1.5"><MapPin size={15} className="text-primary" /> {guide.cities.map((c) => (isCity(c) ? tc(c) : c)).join(" · ")}</span>
                )}
                <span className="flex items-center gap-1.5"><Award size={15} className="text-primary" /> {tg("experience", { years: guide.yearsExperience })}</span>
                <span className="flex items-center gap-1.5"><Users size={15} className="text-primary" /> {tg("tours", { count: guide.toursCompleted })}</span>
              </div>
              <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start"><LanguageFlags codes={guide.languages} /></div>
              {guide.specialties.length > 0 && (
                <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
                  {guide.specialties.map((sp) => (
                    <span key={sp} className="rounded-full bg-accent/20 px-3 py-1 text-xs font-medium text-secondary">{ts(sp)}</span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {bio && (
            <div className="mt-6 border-t border-stone/50 pt-6">
              <h2 className="display mb-3 text-2xl">{t("about")}</h2>
              <p className="whitespace-pre-line leading-relaxed text-ink-soft">{bio}</p>
              {guide.notes.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {guide.notes.map((n) => {
                    const Icon = noteIcon(n);
                    return (
                      <span key={n} className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1.5 text-sm font-medium text-secondary">
                        <Icon size={15} className="text-primary" /> {n}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tours + tarifs + réservation */}
        <GuideBooking
          guideId={guide.id}
          firstName={guide.firstName}
          languages={guide.languages}
          currency={guide.currency}
          pricePerPersonHour={guide.pricePerPersonHour}
          pricePerGroup={guide.pricePerGroup}
          trips={trips}
        />

        {/* Galerie */}
        {guide.gallery.length > 0 && (
          <section className="mt-12">
            <h2 className="display mb-4 text-2xl">{t("gallery")}</h2>
            <Gallery items={guide.gallery as MediaItem[]} />
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
