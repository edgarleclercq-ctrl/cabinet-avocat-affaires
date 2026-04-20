"use client";

import {
  FileSignature,
  PiggyBank,
  Gauge,
  Clock3,
  FileText,
  Landmark,
  ArrowDownToLine,
  ArrowUpFromLine,
  CircleAlert,
} from "lucide-react";
import { ProgressGauge } from "@/components/shared/progress-gauge";
import { ConformiteBanner } from "@/components/shared/conformite-banner";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { EtatFinancierDossier } from "@/lib/legalpay/etat-dossier";
import {
  DEMO_MOUVEMENTS_CARPA,
  type DemoMouvementCarpa,
} from "@/lib/demo-data";
import { cn } from "@/lib/utils";

function formatEuros(n: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDuree(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h${String(m).padStart(2, "0")}`;
}

interface EtatFinancierProps {
  etat: EtatFinancierDossier;
}

function BlocPanel({
  icon: Icon,
  title,
  action,
  children,
}: {
  icon: React.ElementType;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col rounded-lg border border-border-subtle bg-surface">
      <header className="flex items-center justify-between gap-2 border-b border-border-subtle px-5 py-3">
        <div className="flex items-center gap-2">
          <Icon className="size-4 text-text-muted" />
          <h3 className="font-heading text-sm text-text-strong">{title}</h3>
        </div>
        {action}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function EtatFinancier({ etat }: EtatFinancierProps) {
  const { convention, sousCompteCarpa } = etat;

  const mouvementsDossier = sousCompteCarpa
    ? DEMO_MOUVEMENTS_CARPA.filter(
        (m) => m.sousCompteCarpaId === sousCompteCarpa._id
      ).sort((a, b) => b._creationTime - a._creationTime)
    : [];

  const plafond =
    convention?.type === "tempsPasse" || convention?.type === "mixte"
      ? convention.plafond
      : undefined;

  return (
    <div className="flex flex-col gap-6">
      {/* ── Convention d'honoraires ──────────────────────────────── */}
      <BlocPanel
        icon={FileSignature}
        title="Convention d'honoraires"
        action={
          convention ? (
            <StatusBadge kind="proposition-statut" value={convention.statut} />
          ) : (
            <StatusBadge kind="proposition-statut" value="brouillon" />
          )
        }
      >
        {!convention ? (
          <EmptyState
            icon={FileSignature}
            title="Aucune convention"
            description="Une convention d'honoraires écrite est obligatoire avant toute diligence facturable (art. 6.2 RIN)."
          />
        ) : (
          <dl className="grid gap-3 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-xs uppercase tracking-[0.1em] text-text-muted">
                Type
              </dt>
              <dd className="mt-0.5 text-text-default">
                {convention.type === "forfait" && "Forfait"}
                {convention.type === "tempsPasse" && "Temps passé"}
                {convention.type === "mixte" && "Mixte (forfait + temps passé)"}
              </dd>
            </div>
            {convention.montantForfait !== undefined && (
              <div>
                <dt className="text-xs uppercase tracking-[0.1em] text-text-muted">
                  Forfait
                </dt>
                <dd className="mt-0.5 tabular-nums text-text-default">
                  {formatEuros(convention.montantForfait)}
                </dd>
              </div>
            )}
            {convention.tauxHoraire !== undefined && (
              <div>
                <dt className="text-xs uppercase tracking-[0.1em] text-text-muted">
                  Taux horaire
                </dt>
                <dd className="mt-0.5 tabular-nums text-text-default">
                  {formatEuros(convention.tauxHoraire)} / h
                </dd>
              </div>
            )}
            {plafond !== undefined && (
              <div>
                <dt className="text-xs uppercase tracking-[0.1em] text-text-muted">
                  Plafond
                </dt>
                <dd className="mt-0.5 tabular-nums text-text-default">
                  {formatEuros(plafond)}
                </dd>
              </div>
            )}
            {convention.signedAt && (
              <div>
                <dt className="text-xs uppercase tracking-[0.1em] text-text-muted">
                  Signée le
                </dt>
                <dd className="mt-0.5 tabular-nums text-text-default">
                  {new Date(convention.signedAt).toLocaleDateString("fr-FR")}
                </dd>
              </div>
            )}
          </dl>
        )}
      </BlocPanel>

      {/* ── Ratio provisions / temps passé ───────────────────────── */}
      <BlocPanel icon={Gauge} title="État des provisions">
        <div className="flex flex-col gap-5">
          <ProgressGauge
            value={etat.ratio ?? 0}
            thresholds={[60, 85]}
          />

          <dl className="grid gap-3 text-sm sm:grid-cols-5">
            <div>
              <dt className="text-xs uppercase tracking-[0.1em] text-text-muted">
                Provision versée
              </dt>
              <dd className="mt-0.5 font-heading text-lg tabular-nums text-text-strong">
                {formatEuros(etat.provisionVersee)}
              </dd>
              {etat.provisionAttendue > 0 && (
                <dd className="text-xs text-status-warning-fg">
                  + {formatEuros(etat.provisionAttendue)} attendue
                </dd>
              )}
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.1em] text-text-muted">
                Temps valorisé
              </dt>
              <dd className="mt-0.5 font-heading text-lg tabular-nums text-text-strong">
                {formatEuros(etat.tempsPasseValorise)}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.1em] text-text-muted">
                Consommée
              </dt>
              <dd className="mt-0.5 font-heading text-lg tabular-nums text-text-strong">
                {formatEuros(etat.provisionConsommee)}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.1em] text-text-muted">
                Restante
              </dt>
              <dd
                className={cn(
                  "mt-0.5 font-heading text-lg tabular-nums",
                  etat.provisionRestante === 0
                    ? "text-status-warning-fg"
                    : "text-status-success-fg"
                )}
              >
                {formatEuros(etat.provisionRestante)}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.1em] text-text-muted">
                Dépassement
              </dt>
              <dd
                className={cn(
                  "mt-0.5 font-heading text-lg tabular-nums",
                  etat.depassement > 0
                    ? "text-status-danger-fg"
                    : "text-text-muted"
                )}
              >
                {etat.depassement > 0 ? formatEuros(etat.depassement) : "—"}
              </dd>
            </div>
          </dl>

          {etat.alerteDepassement && (
            <ConformiteBanner
              tone="alerte"
              reference="art. 6.2 RIN"
            >
              <strong>Accord écrit du client requis</strong> avant nouvelle
              diligence facturable. Appel de provision ou note d&apos;honoraires
              complémentaire à émettre.
            </ConformiteBanner>
          )}
        </div>
      </BlocPanel>

      {/* ── Sous-compte CARPA ────────────────────────────────────── */}
      <BlocPanel
        icon={Landmark}
        title="Sous-compte CARPA"
        action={
          sousCompteCarpa && (
            <span className="font-mono text-xs text-text-muted">
              {sousCompteCarpa.numero}
            </span>
          )
        }
      >
        {!sousCompteCarpa ? (
          <EmptyState
            icon={Landmark}
            title="Aucun sous-compte CARPA"
            description="Créez un sous-compte avant le premier versement de provision."
          />
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-baseline gap-4">
              <span className="font-heading text-3xl tabular-nums text-status-gold-fg">
                {formatEuros(sousCompteCarpa.solde)}
              </span>
              <ConformiteBanner
                tone="deontologique"
                reference="art. P.75.1 RIBP"
                className="flex-1"
              >
                Fonds détenus pour le compte du client — non disponibles pour
                le cabinet.
              </ConformiteBanner>
            </div>

            {mouvementsDossier.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="border-b-border-subtle hover:bg-transparent">
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Libellé</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mouvementsDossier.slice(0, 5).map((m) => (
                    <MouvementRow key={m._id} m={m} />
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-text-subtle">Aucun mouvement.</p>
            )}
          </div>
        )}
      </BlocPanel>

      {/* ── Diligences ──────────────────────────────────────────── */}
      <BlocPanel icon={Clock3} title="Diligences">
        {etat.diligences.length === 0 ? (
          <EmptyState
            icon={Clock3}
            title="Aucune diligence saisie"
            description="Les prestations saisies ici alimentent le temps passé valorisé."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-b-border-subtle hover:bg-transparent">
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Durée</TableHead>
                <TableHead className="text-right">Taux</TableHead>
                <TableHead className="text-right">Valorisé</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {etat.diligences.slice(0, 10).map((d) => (
                <TableRow key={d._id}>
                  <TableCell className="tabular-nums text-text-subtle">
                    {d.date}
                  </TableCell>
                  <TableCell className="text-text-default">
                    {d.description}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-text-muted">
                    {formatDuree(d.dureeMinutes)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-text-muted">
                    {formatEuros(d.tauxHoraire)}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums text-text-strong">
                    {formatEuros(d.montantValorise)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </BlocPanel>

      {/* ── Notes d'honoraires ───────────────────────────────────── */}
      <BlocPanel icon={FileText} title="Notes d'honoraires">
        {etat.notes.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Aucune note émise"
            description="Les notes d'honoraires justifient les prélèvements CARPA (triple verrou)."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-b-border-subtle hover:bg-transparent">
                <TableHead>Numéro</TableHead>
                <TableHead>Émission</TableHead>
                <TableHead>Échéance</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Montant TTC</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {etat.notes.map((n) => (
                <TableRow key={n._id}>
                  <TableCell className="font-mono text-xs font-medium text-text-strong">
                    {n.numero}
                  </TableCell>
                  <TableCell className="tabular-nums text-text-subtle">
                    {n.dateEmission}
                  </TableCell>
                  <TableCell className="tabular-nums text-text-subtle">
                    {n.dateEcheance}
                  </TableCell>
                  <TableCell>
                    <StatusBadge kind="facture-statut" value={n.statut} />
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums text-text-strong">
                    {formatEuros(n.montantTTC)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </BlocPanel>
    </div>
  );
}

function MouvementRow({ m }: { m: DemoMouvementCarpa }) {
  const isDebit = m.type !== "versement_provision";
  const Icon = isDebit ? ArrowUpFromLine : ArrowDownToLine;
  const typeLabel =
    m.type === "versement_provision"
      ? "Provision"
      : m.type === "prelevement_honoraires"
        ? "Prélèvement"
        : "Remboursement";
  return (
    <TableRow>
      <TableCell className="tabular-nums text-text-subtle">
        {m.dateOperation}
      </TableCell>
      <TableCell>
        <span
          className={cn(
            "inline-flex items-center gap-1 text-xs font-medium",
            isDebit ? "text-status-warning-fg" : "text-status-success-fg"
          )}
        >
          <Icon className="size-3" />
          {typeLabel}
        </span>
      </TableCell>
      <TableCell className="text-text-default">
        {m.libelle}
        {m.type === "prelevement_honoraires" && (
          <span className="ml-2 inline-flex items-center gap-1 text-[0.68rem] uppercase tracking-wider text-status-success-fg">
            <CircleAlert className="size-2.5" />
            triple verrou validé
          </span>
        )}
      </TableCell>
      <TableCell
        className={cn(
          "text-right font-medium tabular-nums",
          isDebit ? "text-status-warning-fg" : "text-status-success-fg"
        )}
      >
        {isDebit ? "−" : "+"}
        {formatEuros(m.montant)}
      </TableCell>
    </TableRow>
  );
}
