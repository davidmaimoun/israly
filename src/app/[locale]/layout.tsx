import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Fraunces, Inter, Caveat, Rubik } from "next/font/google";
import { routing } from "@/i18n/routing";
import { dir } from "@/i18n/config";
import "../globals.css";

// Display moderne + corps lisible + accent caractériel + hébreu compatible.
const display = Fraunces({ subsets: ["latin"], variable: "--font-display-google", weight: ["600", "700"] });
const body = Inter({ subsets: ["latin"], variable: "--font-body-google" });
const accent = Caveat({ subsets: ["latin"], variable: "--font-accent-google", weight: ["600", "700"] });
const hebrew = Rubik({ subsets: ["hebrew", "latin"], weight: ["300", "400", "500", "600", "700", "800", "900"], variable: "--font-hebrew-google", display: "swap" });

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return { title: t("siteName"), description: t("tagline") };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html
      lang={locale}
      dir={dir(locale)}
      className={`${display.variable} ${body.variable} ${accent.variable} ${hebrew.variable}`}
    >
      <body>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
