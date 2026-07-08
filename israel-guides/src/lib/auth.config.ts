import type { NextAuthConfig } from "next-auth";

// Config "edge-safe" (sans Prisma/bcrypt) — réutilisable partout.
export const authConfig: NextAuthConfig = {
  pages: { signIn: "/admin/login" },
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
        token.guideId = (user as { guideId?: string | null }).guideId ?? null;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as string;
        session.user.guideId = (token.guideId as string | null) ?? null;
      }
      return session;
    },
  },
  providers: [], // ajoutés dans auth.ts (Node runtime)
};
