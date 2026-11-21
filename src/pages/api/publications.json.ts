// src/pages/api/publications.json.ts
// Exporta las publicaciones de ADS como JSON (/api/publications.json) en cada build.
// Útil para reutilizar los datos desde otras páginas o herramientas.
import type { APIRoute } from "astro";
import { getPublications } from "../../lib/ads";

export const GET: APIRoute = async () => {
  const { status, source, publications, fetchedAt } = await getPublications();
  return new Response(JSON.stringify({ status, source, fetchedAt, publications }), {
    headers: { "Content-Type": "application/json" },
  });
};
