import { auth } from "@/lib/auth";
import { redirect } from "@/i18n/navigation";

export type SessionUser = {
  id: string;
  email?: string | null;
  role: string;
  guideId: string | null;
};

// Exige une session ; sinon redirige vers le login (locale-aware).
export async function requireUser(locale: string): Promise<SessionUser> {
  const session = await auth();
  if (!session?.user) redirect({ href: "/admin/login", locale });
  return session!.user as SessionUser;
}

// Exige le rôle admin.
export async function requireAdmin(locale: string): Promise<SessionUser> {
  const user = await requireUser(locale);
  if (user.role !== "admin") redirect({ href: "/admin", locale });
  return user;
}

// Vérifie qu'un guide n'agit QUE sur ses propres données.
export function assertOwnsGuide(user: SessionUser, guideId: string): void {
  if (user.role === "admin") return;
  if (user.guideId !== guideId) {
    throw new Error("Forbidden: ce guide ne vous appartient pas.");
  }
}
