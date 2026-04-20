/**
 * Interface abstraite pour l'intégration Pennylane.
 *
 * Deux implémentations :
 * - `mock.ts` : renvoie des données fictives (utilisé en DEMO_MODE ou tant
 *   que les credentials Pennylane ne sont pas configurés)
 * - `real.ts` : appelle l'API Pennylane via OAuth2
 *
 * Pennylane = source de vérité comptable du cabinet (compte professionnel).
 * NE DOIT JAMAIS être confondu avec les soldes CARPA (fonds clients).
 */

export interface PennylaneSoldeComptePro {
  solde: number;
  iban: string;
  devise: string;
  derniereSync: number; // timestamp ms
}

export interface PennylaneMouvement {
  _id: string;
  date: string; // ISO yyyy-mm-dd
  libelle: string;
  montant: number; // positif = crédit, négatif = débit
  type: "credit" | "debit";
}

export interface PennylaneSnapshot {
  comptePro: PennylaneSoldeComptePro;
  mouvements: PennylaneMouvement[];
  configure: boolean;
  /** Raison pour laquelle l'intégration n'est pas configurée, le cas échéant. */
  degradationMotif?: string;
}

export interface PennylaneClient {
  getSnapshot(): Promise<PennylaneSnapshot>;
}
