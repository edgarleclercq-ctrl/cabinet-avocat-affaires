/**
 * API Légifrance (PISTE).
 *
 * PISTE est la plateforme d'accès aux API de l'administration française
 * (DILA). Le client Légifrance nécessite un OAuth2 client_credentials
 * flow obtenu sur https://piste.gouv.fr.
 *
 * Base :  https://api.piste.gouv.fr/dila/legifrance/lf-engine-app
 * Token : https://oauth.piste.gouv.fr/api/oauth/token
 *
 * Les credentials (client_id / client_secret) RESTENT CÔTÉ SERVEUR
 * (action Convex ou route API Next.js). Ils ne doivent JAMAIS être
 * exposés au navigateur.
 */

export interface LegifranceArticle {
  cid: string;
  numero: string;
  code: string; // "CCIV", "CCOM", "CTRAV", …
  titre: string;
  contenu: string;
  dateDebut?: string;
  etat?: string; // "VIGUEUR", "ABROGE", …
  url: string;
}

export interface LegifranceDecision {
  cid: string;
  numero?: string;
  juridiction: string; // "Cour de cassation", "Conseil d'État", …
  formation?: string;
  datePrononce?: string;
  sommaire?: string;
  solution?: string;
  url: string;
}

export interface SearchArticleQuery {
  /** Termes de recherche (ex : "clause pénale", "déséquilibre significatif"). */
  query: string;
  /** Limiter à un code (ex : "CCIV" pour code civil). */
  code?: string;
  /** Max résultats (défaut 5). */
  limit?: number;
}

export interface SearchJuriQuery {
  query: string;
  /** Juridiction : "CASS" | "CETAT" | "CONST" | undefined (toutes). */
  juridiction?: "CASS" | "CETAT" | "CONST";
  limit?: number;
}

export interface LegifranceClient {
  searchArticle(q: SearchArticleQuery): Promise<LegifranceArticle[]>;
  getArticle(cid: string): Promise<LegifranceArticle | null>;
  searchJurisprudence(q: SearchJuriQuery): Promise<LegifranceDecision[]>;
  /** true si la vraie API PISTE répond, false si c'est le mock. */
  readonly isRealBackend: boolean;
}
