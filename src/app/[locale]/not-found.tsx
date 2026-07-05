import { getTranslations } from "next-intl/server";
import { ButtonLink } from "@/components/ui/Button";

export default async function NotFound() {
  const t = await getTranslations("common");
  return (
    <main className="grid min-h-screen place-items-center px-5 text-center">
      <div>
        <p className="display text-6xl text-primary">404</p>
        <div className="mt-6">
          <ButtonLink href="/">{t("back")}</ButtonLink>
        </div>
      </div>
    </main>
  );
}
