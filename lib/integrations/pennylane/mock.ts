import {
  DEMO_PENNYLANE_COMPTE_PRO,
  DEMO_PENNYLANE_MOUVEMENTS,
} from "@/lib/demo-data";
import type { PennylaneClient, PennylaneSnapshot } from "./types";

/**
 * Implémentation mock de l'intégration Pennylane — utilisée en DEMO_MODE
 * et tant que les credentials Pennylane ne sont pas configurés.
 *
 * Les données renvoyées sont figées (fixtures DEMO).
 */
export function createPennylaneMockClient(
  degradationMotif?: string
): PennylaneClient {
  return {
    async getSnapshot(): Promise<PennylaneSnapshot> {
      return {
        comptePro: DEMO_PENNYLANE_COMPTE_PRO,
        mouvements: DEMO_PENNYLANE_MOUVEMENTS,
        configure: false,
        degradationMotif: degradationMotif ?? "Mode démo — données fictives",
      };
    },
  };
}
