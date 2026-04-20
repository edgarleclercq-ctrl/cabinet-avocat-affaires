# Architecture LegalPay — intégration LexiCab

## Objet

LexiCab embarque désormais un socle déontologique LegalPay pour la gestion
financière du cabinet. Deux piliers :

- **Pilier 1 — Dashboard "État du cabinet"** : double colonne stricte
  compte professionnel (Pennylane) / CARPA agrégée (Convex), avec KPIs
  financiers et alertes de conformité.
- **Pilier 2 — Ratio provisions / temps passé / restant par dossier** :
  barre de progression multi-seuils dans la liste des dossiers et la
  fiche dossier.

## Cadre réglementaire

Toutes les règles implémentées découlent des textes suivants :

| Article | Objet |
| --- | --- |
| art. P.75.1 RIBP | Maniement de fonds CARPA — comptabilité distincte |
| art. P.75.2 RIBP | Prélèvement d'honoraires sur fonds CARPA — conditions cumulatives |
| art. 6.2 RIN | Convention d'honoraires écrite obligatoire |
| art. 11.2 RIN | Mentions obligatoires d'une note d'honoraires |
| art. 12 décret 12/07/2005 | Comptabilité distincte par dossier |
| art. 66-5 loi 1971 | Secret professionnel |

**Règle d'or affichage trésorerie** : les fonds CARPA ne doivent JAMAIS
apparaître comme trésorerie disponible pour le cabinet. Double colonne
stricte, codes couleur distincts, bandeau permanent "Fonds détenus pour
compte de tiers — non disponibles".

## Schéma de données

6 nouvelles tables Convex (voir `convex/schema.ts`) :

- `conventions` (dossier, type, statut, montants) — art. 6.2 RIN
- `sousComptesCARPA` (un par dossier, solde dénormalisé) — art. 12 décret 2005
- `provisions` (versée/attendue sur un sous-compte)
- `notesHonoraires` (émises sur la base d'une convention signée)
- `mouvementsCARPA` (versements / prélèvements / remboursements)
- `diligences` (prestations facturables, base du temps passé valorisé)
- `integrationsTokens` (OAuth Pennylane, jamais exposé au client)

## Triple verrou CARPA

Un prélèvement d'honoraires sur fonds CARPA (`mouvementsCARPA.type =
"prelevement_honoraires"`) est **impossible sans** :

1. **Convention signée** sur le dossier (`conventions.statut = "signee"`)
2. **Note d'honoraires émise** dont le montant TTC ≥ prélèvement
   (`notesHonoraires.statut in {validee, envoyee, payee_*}`)
3. **Justificatif attaché** (`storageIdJustificatif: Id<"_storage">`
   NON optionnel sur la mutation)

Toute tentative levée `ConvexError` avec message explicite et référence
réglementaire. Implémentation : `convex/mouvementsCarpa.ts#creerPrelevementHonoraires`.

**Ce verrou est applicatif** (Convex n'a pas de CHECK SQL). La sûreté
dépend donc de l'absence d'autre voie d'insertion dans `mouvementsCARPA`
pour ce type — à vérifier en revue à chaque PR.

## Pilier 2 — Calcul de l'état financier d'un dossier

Implémenté dans :
- `convex/etatDossier.ts#compute` — query Convex (prod)
- `lib/legalpay/etat-dossier.ts#computeEtatFinancierDossierDemo` — équivalent
  côté client pour DEMO_MODE

Formules :

```
provisionVersee     = Σ provisions[statut=recue].montant
tempsPasseValorise  = forfait (si conv. signée/envoyée) + Σ diligences.montantValorise
provisionConsommee  = min(provisionVersee, tempsPasseValorise)
provisionRestante   = max(0, provisionVersee − tempsPasseValorise)
depassement         = max(0, tempsPasseValorise − provisionVersee)
ratio               = tempsPasseValorise / provisionVersee (null si versée = 0)

seuil =
  "vert"   si ratio < 60 %
  "orange" si 60 % ≤ ratio < 85 %
  "rouge"  si ratio ≥ 85 %  OU  dépassement > 0
```

**Seuil rouge** → bandeau d'alerte `<ConformiteBanner tone="alerte">` :
"Accord écrit du client requis avant nouvelle diligence facturable
(art. 6.2 RIN)".

## Intégration Pennylane

Pennylane = source de vérité comptable (compte professionnel). Les
fonds CARPA sont gérés **hors Pennylane**.

### Architecture

- `lib/integrations/pennylane/types.ts` — interface `PennylaneClient`
- `lib/integrations/pennylane/mock.ts` — données fictives (DEMO)
- `lib/integrations/pennylane/real.ts` — OAuth2 + API v2
- `lib/integrations/pennylane/index.ts` — sélection automatique
- `app/api/integrations/pennylane/callback/route.ts` — callback OAuth
- `app/api/integrations/pennylane/snapshot/route.ts` — proxy sécurisé
  (les credentials NE SORTENT JAMAIS du serveur)

### Variables d'environnement

À configurer dans `.env` et `.env.local` (dev) + env VPS (prod) :

```
PENNYLANE_CLIENT_ID=
PENNYLANE_CLIENT_SECRET=
PENNYLANE_REDIRECT_URI=http://187.124.217.153/api/integrations/pennylane/callback
```

Tant que ces vars ne sont pas définies, le snapshot route retombe sur
le mock avec un bandeau "Intégration Pennylane non configurée".

### Flow OAuth2

1. L'utilisateur clique "Connecter Pennylane" depuis `/dashboard`
2. Redirection vers `https://app.pennylane.com/oauth/authorize?client_id=…&redirect_uri=…&scope=…&state=…`
3. Pennylane renvoie sur `/api/integrations/pennylane/callback?code=…&state=…`
4. Échange code → access_token + refresh_token
5. Stockage dans `integrationsTokens` (table Convex, jamais côté client)
6. Redirection vers `/dashboard?pennylane=connected`

## Règle d'affichage trésorerie

Composant dédié `components/dashboard/tresorerie-cabinet.tsx` :

- Grid 2 colonnes stricte (`<DoubleColumnSplit>`)
- Colonne A (neutre marine) : Compte pro Pennylane
- Colonne B (gold/status-gold-fg) : CARPA agrégé + `<ConformiteBanner>`
- Les deux soldes ne sont **jamais additionnés** nulle part dans l'app

Pour auditer : `grep "soldeCarpaTotal +"` ou similaire doit renvoyer 0 résultat.

## DEMO_MODE

Le flag `DEMO_MODE` (`lib/demo-data.ts`) est actuellement **true** en prod
VPS — aucune BDD Convex peuplée. Toutes les queries Convex sont court-
circuitées par les fixtures DEMO (`DEMO_CONVENTIONS`, `DEMO_PROVISIONS`,
`DEMO_SOUSCOMPTES_CARPA`, `DEMO_NOTES_HONORAIRES`, `DEMO_MOUVEMENTS_CARPA`,
`DEMO_DILIGENCES`, `DEMO_PENNYLANE_*`).

Bascule prod :
1. Désactiver DEMO_MODE (`DEMO_MODE = false`)
2. Peupler Convex via scripts/seed (à créer)
3. Configurer les credentials Pennylane + lancer la connexion OAuth

## Points d'attention

- Le calcul de `tempsPasseValorise` **n'inclut pas** les `factures`
  existantes de LexiCab (ancien modèle, conservé pour rétrocompat).
  À terme, migrer `factures` → `notesHonoraires`.
- Les conventions de type `tempsPasse` pur n'ont pas de forfait : le
  valorisé = Σ diligences, et le plafond est purement informatif.
- Les `mouvementsCARPA.type = "remboursement_client"` ne sont PAS
  soumis au triple verrou (ils restituent des fonds au client, pas
  au cabinet). À vérifier lors de l'activation prod.
- Secret professionnel (art. 66-5) : aucun libellé de diligence, nom
  de partie adverse, ou contenu de convention ne doit fuiter dans les
  logs serveur ou les exports Pennylane.

## Fichiers clés

| Fichier | Rôle |
| --- | --- |
| `convex/schema.ts` | Schéma + indexes |
| `convex/mouvementsCarpa.ts` | **Triple verrou CARPA** |
| `convex/etatDossier.ts` | Query état financier |
| `lib/legalpay/etat-dossier.ts` | Service DEMO (shape identique Convex) |
| `lib/integrations/pennylane/*` | Client OAuth2 + mock |
| `components/dashboard/tresorerie-cabinet.tsx` | Pilier 1 — UI |
| `components/dossiers/etat-financier.tsx` | Pilier 2 — UI |
| `components/shared/progress-gauge.tsx` | Barre multi-seuils |
| `components/shared/conformite-banner.tsx` | Bandeau déontologique |
| `components/shared/double-column-split.tsx` | Layout CARPA / compte pro |
