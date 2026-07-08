"use client";

import { useMemo, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { sendRecruitmentEmail } from "@/features/recruit/actions";
import { recruitmentEmail, recruitmentText } from "@/lib/email-templates";
import { Megaphone, Eye, Send, Check, Copy, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const LANGS: { code: "fr" | "en" | "he"; label: string }[] = [
  { code: "fr", label: "Français" },
  { code: "en", label: "English" },
  { code: "he", label: "עברית" },
];

export function RecruitPanel() {
  const locale = useLocale();
  const t = useTranslations("admin.recruit");
  const te = useTranslations("admin.email");
  const [pending, start] = useTransition();
  const [to, setTo] = useState("");
  const [firstName, setFirstName] = useState("");
  const [customText, setCustomText] = useState("");
  const [linkedin, setLinkedin] = useState("https://www.linkedin.com/in/david-maimoun-951877146/");
  const [portfolio, setPortfolio] = useState("https://sudosudev.com");
  const [lang, setLang] = useState<"fr" | "en" | "he">("fr");
  const [preview, setPreview] = useState(true);
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const SITE = "https://israly.com";
  const payload = { firstName, lang, customText, linkedin, portfolio, siteUrl: SITE };
  const html = useMemo(() => recruitmentEmail(payload).html, [firstName, lang, customText, linkedin, portfolio]); // eslint-disable-line react-hooks/exhaustive-deps
  const text = useMemo(() => recruitmentText(payload), [firstName, lang, customText, linkedin, portfolio]); // eslint-disable-line react-hooks/exhaustive-deps

  const send = () =>
    start(async () => {
      setErr(null);
      setSent(false);
      const res = await sendRecruitmentEmail(locale, { to, firstName, lang, customText, linkedin, portfolio });
      if (res.ok) setSent(true);
      else setErr(res.error ?? "Error");
    });
  const copy = async () => { try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* ignore */ } };

  return (
    <div className="grid gap-5">
      <h2 className="display flex items-center gap-2 text-2xl"><Megaphone className="text-primary" size={22} /> {t("title")}</h2>

      <div className="grid gap-3 rounded-[var(--radius-card)] border border-stone/70 bg-surface p-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-ink-soft">{t("to")}</span>
          <input value={to} onChange={(e) => setTo(e.target.value)} type="email" placeholder="guide@example.com" className="h-11 rounded-xl border border-stone bg-cream/50 px-3" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-ink-soft">{t("firstName")}</span>
          <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Yossi" className="h-11 rounded-xl border border-stone bg-cream/50 px-3" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-ink-soft">{t("linkedin")}</span>
          <input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} className="h-11 rounded-xl border border-stone bg-cream/50 px-3" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-ink-soft">{t("portfolio")}</span>
          <input value={portfolio} onChange={(e) => setPortfolio(e.target.value)} className="h-11 rounded-xl border border-stone bg-cream/50 px-3" />
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className="font-medium text-ink-soft">{t("customText")}</span>
          <textarea value={customText} onChange={(e) => setCustomText(e.target.value)} rows={3} placeholder="J'ai vu votre travail sur… / on m'a parlé de vous…" className="rounded-xl border border-stone bg-cream/50 px-3 py-2" />
        </label>
        <div className="sm:col-span-2">
          <span className="mb-1 block text-sm font-medium text-ink-soft">{t("language")}</span>
          <div className="flex gap-2">
            {LANGS.map((l) => (
              <button key={l.code} type="button" onClick={() => setLang(l.code)} className={cn("rounded-full px-4 py-1.5 text-sm font-medium", lang === l.code ? "bg-primary text-cream" : "bg-cream/60 text-ink-soft ring-1 ring-stone hover:bg-sand")}>
                {l.label}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-ink-soft sm:col-span-2">{t("hint")}</p>

        <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
          <button onClick={() => setPreview((v) => !v)} className="inline-flex items-center gap-1.5 rounded-full bg-ink/10 px-4 py-1.5 text-sm font-semibold text-ink hover:bg-ink/15">
            <Eye size={15} /> {preview ? te("hidePreview") : te("preview")}
          </button>
          <button onClick={send} disabled={pending || sent || !to} className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-cream hover:brightness-110 disabled:opacity-50">
            {sent ? <><Check size={15} /> {te("sent")}</> : <><Send size={15} /> {pending ? te("sending") : te("send")}</>}
          </button>
          <button onClick={copy} className="inline-flex items-center gap-1.5 rounded-full bg-ink/10 px-4 py-1.5 text-sm font-semibold text-ink hover:bg-ink/15">
            {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? te("copied") : te("copy")}
          </button>
        </div>
        {err && <p className="rounded-lg bg-danger/10 px-3 py-2 text-xs font-medium text-danger sm:col-span-2">{err}</p>}
      </div>

      {preview && <iframe title="recruit-preview" srcDoc={html} className="h-[34rem] w-full rounded-[var(--radius-card)] border border-stone bg-white" />}
    </div>
  );
}
