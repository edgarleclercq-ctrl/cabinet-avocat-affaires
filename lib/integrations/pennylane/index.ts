import { DEMO_MODE } from "@/lib/demo-data";
import { createPennylaneMockClient } from "./mock";
import type { PennylaneClient, PennylaneSnapshot } from "./types";

/**
 * Sélectionne l'implémentation Pennylane à utiliser côté client.
 *
 * Les appels au client réel passent OBLIGATOIREMENT par une route API
 * Next.js (`/api/integrations/pennylane/snapshot`) — les credentials
 * Pennylane ne doivent JAMAIS être exposés au navigateur.
 */
export function getPennylaneClient(): PennylaneClient {
  if (DEMO_MODE) {
    return createPennylaneMockClient("Mode démo — données fictives");
  }

  // En production, on délègue la récupération à la route API serveur.
  return {
    async getSnapshot(): Promise<PennylaneSnapshot> {
      const res = await fetch("/api/integrations/pennylane/snapshot", {
        method: "GET",
        credentials: "same-origin",
      });
      if (!res.ok) {
        // Dégradation gracieuse : on retombe sur le mock.
        return createPennylaneMockClient(
          `Intégration Pennylane indisponible (${res.status})`
        ).getSnapshot();
      }
      return (await res.json()) as PennylaneSnapshot;
    },
  };
}

export type { PennylaneClient, PennylaneSnapshot } from "./types";
