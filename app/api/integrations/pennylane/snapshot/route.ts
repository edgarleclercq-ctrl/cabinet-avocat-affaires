import { NextResponse } from "next/server";
import { createPennylaneMockClient } from "@/lib/integrations/pennylane/mock";
import { createPennylaneRealClient } from "@/lib/integrations/pennylane/real";
import type { PennylaneSnapshot } from "@/lib/integrations/pennylane/types";

/**
 * Fournit au client un snapshot Pennylane (compte professionnel).
 * Les credentials Pennylane ne sortent JAMAIS du serveur.
 *
 * Tant que le stockage Convex des tokens n'est pas branché, cette route
 * retombe sur le mock — c'est cohérent avec le message d'erreur affiché
 * à l'utilisateur ("Intégration Pennylane non configurée").
 */
export async function GET(): Promise<NextResponse<PennylaneSnapshot>> {
  const clientId = process.env.PENNYLANE_CLIENT_ID;
  const clientSecret = process.env.PENNYLANE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    const snap = await createPennylaneMockClient(
      "Intégration Pennylane non configurée (credentials manquants)"
    ).getSnapshot();
    return NextResponse.json(snap);
  }

  // TODO: récupérer l'access_token depuis Convex (table integrationsTokens)
  //       et le passer au client réel. Pour l'instant on retombe sur le mock
  //       pour éviter toute erreur en l'absence de token persisté.
  const accessToken = process.env.PENNYLANE_DEV_ACCESS_TOKEN;
  if (!accessToken) {
    const snap = await createPennylaneMockClient(
      "Aucun token Pennylane disponible — lancer la connexion OAuth."
    ).getSnapshot();
    return NextResponse.json(snap);
  }

  try {
    const snap = await createPennylaneRealClient({
      accessToken,
    }).getSnapshot();
    return NextResponse.json(snap);
  } catch (e) {
    console.error("[pennylane] snapshot error", (e as Error).message);
    const fallback = await createPennylaneMockClient(
      `Erreur Pennylane : ${(e as Error).message}`
    ).getSnapshot();
    return NextResponse.json(fallback);
  }
}
