"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/lib/auth";
import { loginSchema } from "./schema";

type ActionState = { ok: boolean; error?: string };

export async function loginAction(
  locale: string,
  raw: unknown,
): Promise<ActionState> {
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Email ou mot de passe invalide" };

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: `/${locale}/admin`,
    });
    return { ok: true };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: "Identifiants incorrects" };
    }
    throw err; // redirect interne de next-auth
  }
}

export async function logoutAction(locale: string): Promise<void> {
  await signOut({ redirectTo: `/${locale}/admin/login` });
}
