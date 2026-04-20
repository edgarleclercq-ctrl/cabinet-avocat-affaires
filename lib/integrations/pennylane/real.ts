import type {
  PennylaneClient,
  PennylaneMouvement,
  PennylaneSnapshot,
  PennylaneSoldeComptePro,
} from "./types";

/**
 * Implémentation réelle Pennylane (OAuth2 + API v2).
 *
 * Endpoints officiels (cf. https://pennylane.readme.io/reference) :
 * - Token :            POST https://app.pennylane.com/oauth/token
 * - Bank accounts :    GET  https://app.pennylane.com/api/external/v2/bank_accounts
 * - Transactions :     GET  https://app.pennylane.com/api/external/v2/transactions?per_page=20
 *
 * Le refresh token est stocké côté Convex (table `integrationsTokens`).
 * Cette classe reçoit le access token déjà valide en entrée — le refresh
 * est orchestré par l'action Convex `pennylane.getValidAccessToken`.
 */

const API_BASE = "https://app.pennylane.com/api/external/v2";

export interface PennylaneRealClientConfig {
  accessToken: string;
  /** Callback invoqué si un endpoint retourne 401 pour forcer un refresh amont. */
  onUnauthorized?: () => Promise<string>;
}

interface PennylaneBankAccount {
  id: string | number;
  iban?: string;
  currency?: string;
  current_balance?: number;
  balance?: number;
  is_carpa?: boolean;
  updated_at?: string;
}

interface PennylaneTransaction {
  id: string | number;
  date: string;
  label: string;
  amount: number;
  direction?: "credit" | "debit";
}

async function fetchWithAuth<T>(
  url: string,
  config: PennylaneRealClientConfig
): Promise<T> {
  let token = config.accessToken;
  let res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    // Pennylane API is server-side only — Next.js runtime will be `nodejs`.
    cache: "no-store",
  });

  if (res.status === 401 && config.onUnauthorized) {
    token = await config.onUnauthorized();
    res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });
  }

  if (!res.ok) {
    throw new Error(
      `Pennylane API ${res.status}: ${res.statusText} (${url})`
    );
  }

  return (await res.json()) as T;
}

export function createPennylaneRealClient(
  config: PennylaneRealClientConfig
): PennylaneClient {
  return {
    async getSnapshot(): Promise<PennylaneSnapshot> {
      // 1. Récupère les comptes bancaires et isole le compte professionnel
      //    (NON CARPA — les fonds CARPA sont gérés hors Pennylane).
      const accounts = await fetchWithAuth<{ data?: PennylaneBankAccount[] }>(
        `${API_BASE}/bank_accounts?per_page=50`,
        config
      );
      const list = accounts?.data ?? [];
      const comptePro = list.find((a) => a.is_carpa !== true) ?? list[0];

      if (!comptePro) {
        throw new Error(
          "Aucun compte professionnel non-CARPA trouvé dans Pennylane."
        );
      }

      // 2. Récupère les 20 dernières transactions du compte pro
      const txs = await fetchWithAuth<{ data?: PennylaneTransaction[] }>(
        `${API_BASE}/transactions?per_page=20&bank_account_id=${comptePro.id}`,
        config
      );

      const mouvements: PennylaneMouvement[] = (txs?.data ?? []).map((t) => ({
        _id: String(t.id),
        date: t.date.slice(0, 10),
        libelle: t.label,
        montant: t.amount,
        type: t.amount >= 0 ? "credit" : "debit",
      }));

      const soldeComptePro: PennylaneSoldeComptePro = {
        solde: comptePro.current_balance ?? comptePro.balance ?? 0,
        iban: comptePro.iban ?? "",
        devise: comptePro.currency ?? "EUR",
        derniereSync: comptePro.updated_at
          ? Date.parse(comptePro.updated_at)
          : Date.now(),
      };

      return {
        comptePro: soldeComptePro,
        mouvements,
        configure: true,
      };
    },
  };
}
