// Spécialités de guidage. Libellé via i18n: specialties.<key>.
export const SPECIALTIES = [
  "history",
  "desert",
  "food",
  "religion",
  "hiking",
  "photography",
  "archaeology",
  "wine",
] as const;

export type Specialty = (typeof SPECIALTIES)[number];
