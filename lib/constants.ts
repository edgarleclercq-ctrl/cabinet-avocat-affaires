export const ROLES = {
  associe: "Associé",
  collaborateur: "Collaborateur",
  secretaire: "Secrétaire",
  stagiaire: "Stagiaire",
} as const;

export const SPECIALITES = {
  corporate: "Droit des sociétés",
  litige: "Litige commercial",
  fiscal: "Droit fiscal",
} as const;

export const STATUTS_CORPORATE = [
  { value: "ouvert", label: "Ouvert" },
  { value: "en_cours_redaction", label: "En cours de rédaction" },
  { value: "en_relecture", label: "En relecture" },
  { value: "en_attente_signature", label: "En attente de signature" },
  { value: "en_attente_formalites", label: "En attente de formalités" },
  { value: "clos", label: "Clos" },
];

export const STATUTS_LITIGE = [
  { value: "ouvert", label: "Ouvert" },
  { value: "phase_amiable", label: "Phase amiable" },
  { value: "pre_contentieux", label: "Pré-contentieux" },
  { value: "contentieux_en_cours", label: "Contentieux en cours" },
  { value: "en_attente_decision", label: "En attente de décision" },
  { value: "decision_rendue", label: "Décision rendue" },
  { value: "execution", label: "Exécution" },
  { value: "appel", label: "Appel" },
  { value: "clos", label: "Clos" },
];

export const STATUTS_FISCAL = [
  { value: "ouvert", label: "Ouvert" },
  { value: "en_cours_analyse", label: "En cours d'analyse" },
  { value: "en_cours_redaction", label: "En cours de rédaction" },
  { value: "depose", label: "Déposé" },
  { value: "en_attente_reponse", label: "En attente de réponse" },
  { value: "contentieux_fiscal", label: "Contentieux fiscal" },
  { value: "clos", label: "Clos" },
];

export const STATUTS_FACTURE = [
  { value: "brouillon", label: "Brouillon" },
  { value: "en_attente", label: "En attente" },
  { value: "validee", label: "Validée" },
  { value: "envoyee", label: "Envoyée" },
  { value: "payee_partiellement", label: "Payée partiellement" },
  { value: "payee", label: "Payée" },
  { value: "en_retard", label: "En retard" },
  { value: "annulee", label: "Annulée" },
];

export const STATUTS_PROPOSITION = [
  { value: "brouillon", label: "Brouillon" },
  { value: "en_attente", label: "En attente de validation" },
  { value: "validee", label: "Validée" },
  { value: "envoyee", label: "Envoyée" },
  { value: "acceptee", label: "Acceptée" },
  { value: "refusee", label: "Refusée" },
];

export const FORMES_JURIDIQUES = [
  "SAS", "SARL", "SA", "SCI", "SASU", "EURL", "SNC", "GIE", "Association",
];

export const TYPES_OPERATIONS_CORPORATE = [
  "Constitution de société",
  "Modification statutaire",
  "Cession de parts/actions",
  "Pacte d'associés",
  "Assemblée générale (AGO/AGE)",
  "Dissolution/liquidation",
  "Opération M&A",
];

export const TYPES_PROCEDURES_LITIGE = [
  "Injonction de payer",
  "Référé commercial",
  "Procédure au fond (TC)",
  "Procédure au fond (TJ)",
  "Médiation/arbitrage",
  "Appel",
];

export const TYPES_MISSIONS_FISCAL = [
  "Conseil optimisation fiscale",
  "Assistance contrôle fiscal",
  "Réclamation contentieuse",
  "Recours tribunal administratif",
  "Rescrit fiscal",
  "Régularisation spontanée",
  "Structuration fiscale",
];

export const CATEGORIES_DOCUMENTS = [
  "pieces",
  "correspondances",
  "actes",
  "conclusions",
  "notes_internes",
];

export const TYPES_DOCUMENTS_IA = [
  "Mise en demeure",
  "Courrier de relance",
  "Assignation (trame)",
  "Conclusions (structure)",
  "Note de synthèse interne",
  "Courrier administration fiscale",
  "Convocation AG",
  "Procès-verbal AG (trame)",
];
