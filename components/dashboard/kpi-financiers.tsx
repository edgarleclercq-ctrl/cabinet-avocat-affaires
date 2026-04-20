"use client";

import { StatCard } from "@/components/shared/stat-card";
import { Receipt, PiggyBank, Timer, AlertTriangle } from "lucide-react";

interface KpiFinanciersProps {
  provisionsDetenues: number;
  honorairesNonEncaisses: number;
  ageMoyenCreancesJours: number;
  nbDossiersEnAlerte: number;
}

function formatEuros(n: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function KpiFinanciers({
  provisionsDetenues,
  honorairesNonEncaisses,
  ageMoyenCreancesJours,
  nbDossiersEnAlerte,
}: KpiFinanciersProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Provisions détenues"
        value={formatEuros(provisionsDetenues)}
        icon={PiggyBank}
        hint="Pour compte des clients (CARPA)"
      />
      <StatCard
        label="Honoraires non encaissés"
        value={formatEuros(honorairesNonEncaisses)}
        icon={Receipt}
        hint="Notes émises en attente"
      />
      <StatCard
        label="Âge moyen des créances"
        value={
          ageMoyenCreancesJours > 0
            ? `${ageMoyenCreancesJours} j`
            : "—"
        }
        icon={Timer}
        trend={
          ageMoyenCreancesJours > 0
            ? {
                value: ageMoyenCreancesJours > 45 ? "Élevé" : "Maîtrisé",
                direction: ageMoyenCreancesJours > 45 ? "down" : "up",
              }
            : undefined
        }
      />
      <StatCard
        label="Dossiers en alerte"
        value={String(nbDossiersEnAlerte)}
        icon={AlertTriangle}
        hint="Dépassement ou > 85% provision"
      />
    </div>
  );
}
