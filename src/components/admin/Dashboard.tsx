"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Compass, User, CalendarDays, Inbox, Users, ListChecks, FileText, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoutButton } from "./LogoutButton";
import { GuideProfileForm, type GuideFormData } from "./GuideProfileForm";
import { CalendarManager } from "./CalendarManager";
import { BookingsManager, type BookingRow } from "./BookingsManager";
import { InvoicesManager, type InvoiceRow, type BookingOption } from "./InvoicesManager";
import { CreateGuideForm } from "./CreateGuideForm";
import { AdminGuidesList, type AdminGuideRow } from "./AdminGuidesList";
import { AdminBookingsList, type AdminBookingRow } from "./AdminBookingsList";
import { AdminInvoicesList, type AdminInvoiceRow } from "./AdminInvoicesList";

type GuideData = {
  guide: GuideFormData;
  availability: Record<string, "AVAILABLE" | "BOOKED" | "UNAVAILABLE">;
  bookings: BookingRow[];
  invoices: InvoiceRow[];
  invoiceBookings: BookingOption[];
};
type AdminData = {
  guides: AdminGuideRow[];
  bookings: AdminBookingRow[];
  invoices: AdminInvoiceRow[];
};

export function Dashboard({
  role,
  guideData,
  adminData,
}: {
  role: string;
  guideData: GuideData | null;
  adminData: AdminData | null;
}) {
  const t = useTranslations("admin.nav");
  const tc = useTranslations("admin.calendar");
  const tb = useTranslations("admin.bookings");
  const tp = useTranslations("admin.profile");
  const tag = useTranslations("admin.adminGuides");
  const ti = useTranslations("admin.invoices");
  const isAdmin = role === "admin";

  const tabs = isAdmin
    ? [
        { id: "guides", label: t("guides"), icon: Users },
        { id: "allBookings", label: t("allBookings"), icon: ListChecks },
        { id: "allInvoices", label: t("allInvoices"), icon: Receipt },
      ]
    : [
        { id: "profile", label: t("profile"), icon: User },
        { id: "calendar", label: t("calendar"), icon: CalendarDays },
        { id: "bookings", label: t("bookings"), icon: Inbox },
        { id: "invoices", label: t("invoices"), icon: FileText },
      ];

  const [tab, setTab] = useState(tabs[0].id);

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 md:px-8">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-ink">
          <Compass className="text-primary" />
          <span className="display text-lg">Dashboard</span>
        </Link>
        <LogoutButton />
      </div>

      <nav className="mb-6 flex flex-wrap gap-2">
        {tabs.map((tb2) => (
          <button
            key={tb2.id}
            onClick={() => setTab(tb2.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium",
              tab === tb2.id ? "bg-primary text-cream" : "bg-surface text-ink-soft hover:bg-sand",
            )}
          >
            <tb2.icon size={16} /> {tb2.label}
          </button>
        ))}
      </nav>

      <div className="rounded-[var(--radius-card)] border border-stone/60 bg-cream/40 p-5 md:p-6">
        {!isAdmin && guideData && tab === "profile" && (
          <>
            <h2 className="display mb-4 text-2xl">{tp("title")}</h2>
            <GuideProfileForm guide={guideData.guide} />
          </>
        )}
        {!isAdmin && guideData && tab === "calendar" && (
          <>
            <h2 className="display mb-4 text-2xl">{tc("title")}</h2>
            <CalendarManager guideId={guideData.guide.id} initial={guideData.availability} />
          </>
        )}
        {!isAdmin && guideData && tab === "bookings" && (
          <>
            <h2 className="display mb-4 text-2xl">{tb("title")}</h2>
            <BookingsManager bookings={guideData.bookings} />
          </>
        )}
        {!isAdmin && guideData && tab === "invoices" && (
          <>
            <h2 className="display mb-4 text-2xl">{ti("title")}</h2>
            <InvoicesManager
              guideId={guideData.guide.id}
              invoices={guideData.invoices}
              bookings={guideData.invoiceBookings}
              trips={guideData.guide.trips}
              defaultCurrency={guideData.guide.currency}
            />
          </>
        )}
        {isAdmin && adminData && tab === "guides" && (
          <>
            <CreateGuideForm />
            <h2 className="display mb-4 text-2xl">{tag("title")}</h2>
            <AdminGuidesList guides={adminData.guides} />
          </>
        )}
        {isAdmin && adminData && tab === "allBookings" && (
          <>
            <h2 className="display mb-4 text-2xl">{t("allBookings")}</h2>
            <AdminBookingsList bookings={adminData.bookings} />
          </>
        )}
        {isAdmin && adminData && tab === "allInvoices" && (
          <>
            <h2 className="display mb-4 text-2xl">{ti("title")}</h2>
            <AdminInvoicesList invoices={adminData.invoices} />
          </>
        )}
      </div>
    </div>
  );
}
