import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Routing i18n uniquement. La protection d'accès admin se fait côté serveur
// (voir src/lib/auth-guard.ts), conformément à l'exigence "gardes d'auth serveur".
export default createMiddleware(routing);

export const config = {
  // Tout sauf api, _next, fichiers statiques.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
