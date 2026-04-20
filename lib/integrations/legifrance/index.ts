import { createLegifranceMockClient } from "./mock";
import { createLegifranceRealClient } from "./real";
import type { LegifranceClient } from "./types";

/**
 * Sélectionne l'implémentation Légifrance à utiliser côté serveur.
 *
 * Utilise le client PISTE réel si `LEGIFRANCE_CLIENT_ID` ET
 * `LEGIFRANCE_CLIENT_SECRET` sont tous deux définis. Sinon tombe
 * sur le mock (corpus d'articles les plus courants).
 */
export function getLegifranceClient(): LegifranceClient {
  const clientId = process.env.LEGIFRANCE_CLIENT_ID;
  const clientSecret = process.env.LEGIFRANCE_CLIENT_SECRET;

  if (clientId && clientSecret) {
    return createLegifranceRealClient({ clientId, clientSecret });
  }
  return createLegifranceMockClient();
}

export type { LegifranceClient } from "./types";
export {
  MOCK_ARTICLES,
  MOCK_DECISIONS,
} from "./mock";
