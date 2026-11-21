// src/lib/ads.ts
// Obtiene las publicaciones de la biblioteca pública de NASA ADS del grupo.
//
// Se ejecuta en el BUILD (sitio estático): el token nunca llega al navegador.
// Para refrescar las publicaciones basta con volver a compilar (`npm run build`),
// por ejemplo con una tarea programada diaria en el servidor.
//
// Requiere la variable de entorno ADS_API_KEY (ver .env.example).
import site from "../data/site.json";
import manualData from "../data/publications.json";

const ADS_API = "https://api.adsabs.harvard.edu/v1";
const FIELDS = [
  "bibcode",
  "title",
  "author",
  "pub",
  "year",
  "pubdate",
  "abstract",
  "doi",
  "identifier",
  "keyword",
  "citation_count",
  "property",
  "doctype",
].join(",");
const PAGE_SIZE = 100;

export interface Publication {
  bibcode: string;
  title: string;
  authors: string[];
  journal: string;
  year: number | null;
  date: string; // "April 2025"
  abstract: string;
  doi?: string;
  arxiv?: string; // "2504.06234"
  keywords: string[];
  citations: number;
  refereed: boolean;
  adsUrl: string;
}

export type AdsStatus = "ok" | "no-token" | "error";

export interface AdsResult {
  status: AdsStatus;
  /** "ads" = consultado en vivo; "manual" = src/data/publications.json */
  source: "ads" | "manual" | "none";
  publications: Publication[];
  fetchedAt: string;
  error?: string;
}

/** Lista manual (src/data/publications.json), usada si no hay token o ADS falla. */
function manualPublications(): { publications: Publication[]; updatedAt: string } {
  const pubs = (manualData.publications as Omit<Publication, "adsUrl" | "abstract">[]).map((p) => ({
    ...p,
    abstract: "",
    adsUrl: `https://ui.adsabs.harvard.edu/abs/${encodeURIComponent(p.bibcode)}/abstract`,
  }));
  pubs.sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
  return { publications: pubs, updatedAt: new Date(manualData.updatedAt).toISOString() };
}

function fallback(status: AdsStatus, error?: string): AdsResult {
  const { publications, updatedAt } = manualPublications();
  if (publications.length === 0) {
    return { status, source: "none", publications: [], fetchedAt: new Date().toISOString(), error };
  }
  console.info(`[ads] Usando la lista manual (${publications.length} publicaciones).`);
  return { status: "ok", source: "manual", publications, fetchedAt: updatedAt, error };
}

export const libraryUrl = `https://ui.adsabs.harvard.edu/public-libraries/${site.ads.libraryId}`;

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** "2025-04-00" → "April 2025"; "2025-00-00" → "2025" */
export function formatPubdate(pubdate?: string): string {
  if (!pubdate) return "";
  const [y, m] = pubdate.split("-");
  const month = parseInt(m ?? "0", 10);
  return month >= 1 && month <= 12 ? `${MONTHS[month - 1]} ${y}` : y;
}

const LATEX_SYMBOLS: Record<string, string> = {
  sim: "~", approx: "≈", times: "×", pm: "±", mu: "μ", sigma: "σ", alpha: "α", beta: "β",
  gamma: "γ", delta: "δ", lambda: "λ", nu: "ν", tau: "τ", odot: "☉", lesssim: "≲", gtrsim: "≳",
  le: "≤", leq: "≤", ge: "≥", geq: "≥", deg: "°", circ: "°", prime: "′",
};

/** Quita etiquetas HTML y simplifica LaTeX básico de los títulos/resúmenes de ADS. */
export function cleanText(text?: string): string {
  if (!text) return "";
  return text
    .replace(/<[^>]+>/g, "")
    .replace(/\$([^$]*)\$/g, (_, inner: string) =>
      inner
        .replace(/\\(mathrm|rm|text|mathit|it)\{([^}]*)\}/g, "$2")
        .replace(/\\([a-zA-Z]+)/g, (m, cmd: string) => LATEX_SYMBOLS[cmd] ?? "")
        .replace(/[{}^_]/g, "")
        .trim()
    )
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

const first = <T,>(v: T | T[] | undefined): T | undefined => (Array.isArray(v) ? v[0] : v);

/** Convierte los documentos de Solr que devuelve ADS al formato del sitio. */
export function parseDocs(docs: any[]): Publication[] {
  return docs.map((doc) => {
    const arxivId = (doc.identifier ?? [])
      .map((id: string) => id.match(/^arXiv:(.+)$/i)?.[1])
      .find(Boolean);
    return {
      bibcode: doc.bibcode,
      title: cleanText(first(doc.title)) || doc.bibcode,
      authors: doc.author ?? [],
      journal: cleanText(doc.pub ?? ""),
      year: doc.year ? Number(doc.year) : null,
      date: formatPubdate(doc.pubdate),
      abstract: cleanText(first(doc.abstract)),
      doi: first(doc.doi),
      arxiv: arxivId,
      keywords: doc.keyword ?? [],
      citations: doc.citation_count ?? 0,
      refereed: (doc.property ?? []).includes("REFEREED"),
      adsUrl: `https://ui.adsabs.harvard.edu/abs/${encodeURIComponent(doc.bibcode)}/abstract`,
    };
  });
}

async function fetchPage(token: string, start: number) {
  const params = new URLSearchParams({
    start: String(start),
    rows: String(PAGE_SIZE),
    fl: FIELDS,
    sort: "date desc",
  });
  const res = await fetch(`${ADS_API}/biblib/libraries/${site.ads.libraryId}?${params}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`ADS respondió ${res.status} ${res.statusText}`);
  return res.json();
}

async function load(): Promise<AdsResult> {
  const fetchedAt = new Date().toISOString();
  const token = import.meta.env.ADS_API_KEY ?? process.env.ADS_API_KEY;
  if (!token) {
    console.warn("[ads] ADS_API_KEY no está definido.");
    return fallback("no-token");
  }
  try {
    const docs: any[] = [];
    let total = Infinity;
    for (let start = 0; start < total; start += PAGE_SIZE) {
      const data = await fetchPage(token, start);
      const page = data?.solr?.response?.docs ?? [];
      total = data?.metadata?.num_documents ?? data?.solr?.response?.numFound ?? page.length;
      docs.push(...page);
      if (page.length === 0) break;
    }
    const publications = parseDocs(docs);
    console.info(`[ads] ${publications.length} publicaciones obtenidas de ADS.`);
    return { status: "ok", source: "ads", publications, fetchedAt };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error("[ads] Error al consultar ADS:", error);
    return fallback("error", error);
  }
}

let cached: Promise<AdsResult> | undefined;

/** Publicaciones de la biblioteca ADS del grupo (se consulta una vez por build). */
export function getPublications(): Promise<AdsResult> {
  cached ??= load();
  return cached;
}
