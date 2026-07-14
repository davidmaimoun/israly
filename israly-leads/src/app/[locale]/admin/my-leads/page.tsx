// app/[locale]/admin/my-leads/page.tsx
// Dashboard "Mes leads" côté guide (espace pro).
import { getGuideLeads } from "@/features/leads/actions";
import { MyLeads } from "@/components/guide/MyLeads";
import { getTranslations } from "next-intl/server";
// import { auth } from "@/auth"; // ADAPT: ton helper Auth.js v5

export default async function MyLeadsPage() {
  // ADAPT: récupère l'id du guide connecté depuis ta session Auth.js.
  //   const session = await auth();
  //   const guideId = (session?.user as any)?.guideId ?? session?.user?.id;
  const guideId = ""; // <- REMPLACE par l'id du guide connecté

  const tc = await getTranslations("cities");
  const tl = await getTranslations("langs");

  if (!guideId) {
    return (
      <div className="mx-auto max-w-3xl p-6 text-sm text-ink-soft">
        Connecte le guide via ta session (voir ADAPT dans <code>my-leads/page.tsx</code>).
      </div>
    );
  }

  const { pending, won } = await getGuideLeads(guideId);

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-6">
      <h1 className="mb-4 text-xl font-semibold text-ink">Mes leads</h1>
      <MyLeads
        pending={pending as any}
        won={won as any}
        ownerWhatsapp={process.env.NEXT_PUBLIC_WHATSAPP}
        cityLabel={(c) => tc(c)}
        langLabel={(l) => tl(l)}
      />
    </div>
  );
}
