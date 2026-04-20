"use client";

import * as React from "react";
import { getPennylaneClient } from "./index";
import type { PennylaneSnapshot } from "./types";

/**
 * Hook React pour récupérer l'état Pennylane (compte professionnel du cabinet).
 * Déclenche une requête à chaque montage — pas de revalidation automatique
 * pour ce socle (peut être enrichi plus tard avec SWR/React Query).
 */
export function usePennylaneSnapshot() {
  const [data, setData] = React.useState<PennylaneSnapshot | null>(null);
  const [error, setError] = React.useState<Error | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getPennylaneClient()
      .getSnapshot()
      .then((snap) => {
        if (!cancelled) setData(snap);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, error, loading };
}
