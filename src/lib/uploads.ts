import path from "node:path";

// SERVEUR uniquement (node:path). Les constantes vivent dans ./upload-limits
// pour rester importables côté client.
export * from "./upload-limits";

// Dossier de stockage des médias uploadés (hors .next pour survivre aux builds).
export const UPLOAD_DIR = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.join(process.cwd(), "uploads");
