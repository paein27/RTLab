// src/lib/team.ts
// Tipos y utilidades para los miembros del grupo (src/data/team.json).
import teamData from "../data/team.json";

export type GroupKey = "lead" | "staff" | "students" | "interns" | "team";

export interface Member {
  name: string;
  slug: string;
  group: GroupKey;
  position: string;
  education?: string;
  area?: string;
  img: string;
  bio: string;
  skills?: string[];
  hobbies?: string;
  profiles: { orcid?: string; linkedin?: string };
  /** Formas en que el nombre aparece en ADS, p. ej. "Cruces, M." */
  adsNames: string[];
  /** true si faltan datos por completar */
  pending?: boolean;
}

export const team = teamData as Member[];

/** Orden y títulos de las secciones de la página de miembros. */
export const groups: { key: GroupKey; title: string; description?: string }[] = [
  { key: "lead", title: "Group Leader" },
  { key: "staff", title: "Engineers & Research Staff" },
  { key: "students", title: "Graduate Students" },
  { key: "interns", title: "Undergraduate Interns" },
  { key: "team", title: "Research Team" },
];

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

// ---------------------------------------------------------------------------
// Coincidencia de autores ADS ("Apellido, N. M.") con miembros del equipo.
// Compara apellido completo + inicial del primer nombre, sin tildes ni guiones.
// ---------------------------------------------------------------------------

const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[-‐]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

function authorKey(author: string): string | null {
  const [last, first = ""] = author.split(",");
  if (!last) return null;
  const initial = normalize(first).replace(/[^a-z]/g, "").charAt(0);
  return `${normalize(last)}|${initial}`;
}

const memberIndex = new Map<string, Member>();
for (const m of team) {
  for (const alias of m.adsNames ?? []) {
    const key = authorKey(alias);
    if (key) memberIndex.set(key, m);
  }
}

/** Devuelve el miembro que corresponde a un autor de ADS, si existe. */
export function matchMember(author: string): Member | undefined {
  const key = authorKey(author);
  return key ? memberIndex.get(key) : undefined;
}
