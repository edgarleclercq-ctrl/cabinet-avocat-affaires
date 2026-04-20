import type {
  LegifranceArticle,
  LegifranceClient,
  LegifranceDecision,
  SearchArticleQuery,
  SearchJuriQuery,
} from "./types";

/**
 * Client Légifrance (PISTE) — OAuth2 `client_credentials`.
 *
 * SERVER-SIDE UNIQUEMENT. Les credentials ne doivent jamais sortir
 * du serveur (action Convex ou route API Next.js).
 *
 * Docs : https://developer.aife.economie.gouv.fr/ (ex DILA)
 */

const TOKEN_URL = "https://oauth.piste.gouv.fr/api/oauth/token";
const BASE_URL = "https://api.piste.gouv.fr/dila/legifrance/lf-engine-app";

interface CachedToken {
  accessToken: string;
  expiresAt: number;
}

let tokenCache: CachedToken | null = null;

async function getAccessToken(
  clientId: string,
  clientSecret: string
): Promise<string> {
  const now = Date.now();
  if (tokenCache && tokenCache.expiresAt > now + 30_000) {
    return tokenCache.accessToken;
  }

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
    scope: "openid",
  });

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    cache: "no-store",
  });

  if (!res.ok) {
    const details = await res.text();
    throw new Error(
      `Légifrance OAuth failed (${res.status}): ${details.slice(0, 200)}`
    );
  }

  const json = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };

  tokenCache = {
    accessToken: json.access_token,
    expiresAt: now + json.expires_in * 1000,
  };

  return json.access_token;
}

interface LegifrancePisteConfig {
  clientId: string;
  clientSecret: string;
}

async function fetchJson<T>(
  path: string,
  body: unknown,
  config: LegifrancePisteConfig
): Promise<T> {
  const token = await getAccessToken(config.clientId, config.clientSecret);
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    const details = await res.text();
    throw new Error(
      `Légifrance API ${res.status} (${path}): ${details.slice(0, 200)}`
    );
  }

  return (await res.json()) as T;
}

interface PisteSearchArticleResponse {
  results?: Array<{
    titles?: Array<{ cid?: string; id?: string; title?: string }>;
    sections?: Array<{
      extracts?: Array<{
        num?: string;
        content?: string;
        id?: string;
        cid?: string;
      }>;
    }>;
  }>;
}

function mapCodeToFond(code?: string): string {
  // Fonds PISTE courants
  const MAP: Record<string, string> = {
    CCIV: "CODE_CIVIL",
    CCOM: "CODE_COMMERCE",
    CTRAV: "CODE_TRAVAIL",
    CCONSO: "CODE_CONSO",
    CPROPINT: "CPI",
  };
  return code ? (MAP[code] ?? "CODE_CIVIL") : "CODE_CIVIL";
}

function legifranceArticleUrl(cid: string): string {
  return `https://www.legifrance.gouv.fr/codes/article_lc/${cid}`;
}

export function createLegifranceRealClient(
  config: LegifrancePisteConfig
): LegifranceClient {
  return {
    isRealBackend: true,

    async searchArticle(q: SearchArticleQuery): Promise<LegifranceArticle[]> {
      const body = {
        recherche: {
          champs: [
            {
              typeChamp: "ALL",
              criteres: [
                {
                  typeRecherche: "EXACTE",
                  valeur: q.query,
                  operateur: "ET",
                },
              ],
              operateur: "ET",
            },
          ],
          filtres: q.code
            ? [
                {
                  facette: "CODE_TEXTE",
                  valeur: mapCodeToFond(q.code),
                },
              ]
            : [],
          pageNumber: 1,
          pageSize: q.limit ?? 5,
          operateur: "ET",
          sort: "PERTINENCE",
          typePagination: "ARTICLE",
        },
        fond: "CODE_DATE",
      };

      const json = await fetchJson<PisteSearchArticleResponse>(
        "/search",
        body,
        config
      );

      const out: LegifranceArticle[] = [];
      for (const res of json.results ?? []) {
        const title = res.titles?.[0]?.title ?? "";
        const titleCid =
          res.titles?.[0]?.cid ?? res.titles?.[0]?.id ?? "";
        for (const section of res.sections ?? []) {
          for (const art of section.extracts ?? []) {
            const cid = art.cid ?? art.id ?? titleCid;
            if (!cid) continue;
            out.push({
              cid,
              numero: art.num ?? "",
              code: q.code ?? "",
              titre: `${title}${art.num ? ` — article ${art.num}` : ""}`,
              contenu: stripHtml(art.content ?? ""),
              etat: "VIGUEUR",
              url: legifranceArticleUrl(cid),
            });
            if (out.length >= (q.limit ?? 5)) return out;
          }
        }
      }
      return out;
    },

    async getArticle(cid: string): Promise<LegifranceArticle | null> {
      try {
        const json = await fetchJson<{
          article?: {
            id?: string;
            num?: string;
            texte?: string;
            etat?: string;
            codeTitre?: string;
          };
        }>("/consult/getArticle", { id: cid }, config);

        const a = json.article;
        if (!a) return null;
        return {
          cid: a.id ?? cid,
          numero: a.num ?? "",
          code: "",
          titre: a.codeTitre
            ? `${a.codeTitre} — article ${a.num}`
            : `Article ${a.num}`,
          contenu: stripHtml(a.texte ?? ""),
          etat: a.etat ?? "VIGUEUR",
          url: legifranceArticleUrl(a.id ?? cid),
        };
      } catch {
        return null;
      }
    },

    async searchJurisprudence(q: SearchJuriQuery): Promise<LegifranceDecision[]> {
      const body = {
        recherche: {
          champs: [
            {
              typeChamp: "ALL",
              criteres: [
                {
                  typeRecherche: "EXACTE",
                  valeur: q.query,
                  operateur: "ET",
                },
              ],
              operateur: "ET",
            },
          ],
          filtres: q.juridiction
            ? [{ facette: "JURIDICTION", valeur: q.juridiction }]
            : [],
          pageNumber: 1,
          pageSize: q.limit ?? 3,
          operateur: "ET",
          sort: "PERTINENCE",
          typePagination: "DEFAUT",
        },
        fond: "JURI",
      };

      interface PisteJuriResponse {
        results?: Array<{
          titles?: Array<{ cid?: string; id?: string; title?: string }>;
          sections?: Array<{
            extracts?: Array<{
              id?: string;
              cid?: string;
              content?: string;
              juridiction?: string;
              datePrononce?: string;
              formation?: string;
              solution?: string;
            }>;
          }>;
        }>;
      }

      const json = await fetchJson<PisteJuriResponse>("/search", body, config);

      const out: LegifranceDecision[] = [];
      for (const res of json.results ?? []) {
        const titleCid =
          res.titles?.[0]?.cid ?? res.titles?.[0]?.id ?? "";
        for (const section of res.sections ?? []) {
          for (const d of section.extracts ?? []) {
            const cid = d.cid ?? d.id ?? titleCid;
            if (!cid) continue;
            out.push({
              cid,
              juridiction: d.juridiction ?? "",
              formation: d.formation,
              datePrononce: d.datePrononce,
              solution: d.solution,
              sommaire: stripHtml(d.content ?? "").slice(0, 500),
              url: `https://www.legifrance.gouv.fr/juri/id/${cid}`,
            });
            if (out.length >= (q.limit ?? 3)) return out;
          }
        }
      }
      return out;
    },
  };
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}
