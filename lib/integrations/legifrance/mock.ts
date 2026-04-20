import type {
  LegifranceArticle,
  LegifranceClient,
  LegifranceDecision,
  SearchArticleQuery,
  SearchJuriQuery,
} from "./types";

/**
 * Corpus mock — extraits authentiques des articles les plus souvent
 * mobilisés dans les contrats commerciaux. Utilisé tant que les
 * credentials PISTE ne sont pas configurés.
 *
 * Les textes sont fidèles au droit positif au 1er janvier 2025.
 * Les CID sont les identifiants Légifrance réels — le lien vers
 * legifrance.gouv.fr fonctionne.
 */
export const MOCK_ARTICLES: LegifranceArticle[] = [
  {
    cid: "LEGIARTI000032040861",
    numero: "1104",
    code: "CCIV",
    titre: "Code civil — article 1104",
    contenu:
      "Les contrats doivent être négociés, formés et exécutés de bonne foi. Cette disposition est d'ordre public.",
    etat: "VIGUEUR",
    url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000032040861",
  },
  {
    cid: "LEGIARTI000032040909",
    numero: "1170",
    code: "CCIV",
    titre: "Code civil — article 1170 (clause privant de sa substance l'obligation essentielle)",
    contenu:
      "Toute clause qui prive de sa substance l'obligation essentielle du débiteur est réputée non écrite.",
    etat: "VIGUEUR",
    url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000032040909",
  },
  {
    cid: "LEGIARTI000032040911",
    numero: "1171",
    code: "CCIV",
    titre: "Code civil — article 1171 (clause abusive dans les contrats d'adhésion)",
    contenu:
      "Dans un contrat d'adhésion, toute clause non négociable, déterminée à l'avance par l'une des parties, qui crée un déséquilibre significatif entre les droits et obligations des parties au contrat est réputée non écrite. L'appréciation du déséquilibre significatif ne porte ni sur l'objet principal du contrat ni sur l'adéquation du prix à la prestation.",
    etat: "VIGUEUR",
    url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000032040911",
  },
  {
    cid: "LEGIARTI000032041028",
    numero: "1231-5",
    code: "CCIV",
    titre: "Code civil — article 1231-5 (clause pénale)",
    contenu:
      "Lorsque le contrat stipule que celui qui manquera de l'exécuter paiera une certaine somme à titre de dommages et intérêts, il ne peut être alloué à l'autre partie une somme plus forte ni moindre. Néanmoins, le juge peut, même d'office, modérer ou augmenter la pénalité ainsi convenue si elle est manifestement excessive ou dérisoire.",
    etat: "VIGUEUR",
    url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000032041028",
  },
  {
    cid: "LEGIARTI000032040829",
    numero: "1128",
    code: "CCIV",
    titre: "Code civil — article 1128 (conditions essentielles de validité)",
    contenu:
      "Sont nécessaires à la validité d'un contrat : 1° Le consentement des parties ; 2° Leur capacité de contracter ; 3° Un contenu licite et certain.",
    etat: "VIGUEUR",
    url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000032040829",
  },
  {
    cid: "LEGIARTI000038414096",
    numero: "L.442-1",
    code: "CCOM",
    titre: "Code de commerce — article L.442-1 (pratiques restrictives de concurrence)",
    contenu:
      "Engage la responsabilité de son auteur et l'oblige à réparer le préjudice causé le fait, dans le cadre de la négociation commerciale, de la conclusion ou de l'exécution d'un contrat, par toute personne exerçant des activités de production, de distribution ou de services : 1° D'obtenir ou de tenter d'obtenir de l'autre partie un avantage ne correspondant à aucune contrepartie ou manifestement disproportionné ; 2° De soumettre ou de tenter de soumettre l'autre partie à des obligations créant un déséquilibre significatif dans les droits et obligations des parties ; 3° D'imposer des pénalités disproportionnées ou abusives.",
    etat: "VIGUEUR",
    url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000038414096",
  },
  {
    cid: "LEGIARTI000006221244",
    numero: "L.110-3",
    code: "CCOM",
    titre: "Code de commerce — article L.110-3 (preuve en matière commerciale)",
    contenu:
      "À l'égard des commerçants, les actes de commerce peuvent se prouver par tous moyens à moins qu'il n'en soit autrement disposé par la loi.",
    etat: "VIGUEUR",
    url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006221244",
  },
  {
    cid: "LEGIARTI000042046018",
    numero: "L.441-10",
    code: "CCOM",
    titre: "Code de commerce — article L.441-10 (délais de paiement)",
    contenu:
      "Le délai convenu entre les parties pour régler les sommes dues ne peut dépasser soixante jours à compter de la date d'émission de la facture. Par dérogation, un délai maximal de quarante-cinq jours fin de mois à compter de la date d'émission de la facture peut être convenu entre les parties, sous réserve que ce délai soit expressément stipulé par contrat et qu'il ne constitue pas un abus manifeste à l'égard du créancier.",
    etat: "VIGUEUR",
    url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000042046018",
  },
  {
    cid: "LEGIARTI000006900785",
    numero: "L.1221-1",
    code: "CTRAV",
    titre: "Code du travail — article L.1221-1 (formation du contrat de travail)",
    contenu:
      "Le contrat de travail est soumis aux règles du droit commun. Il peut être établi selon les formes que les parties contractantes décident d'adopter.",
    etat: "VIGUEUR",
    url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006900785",
  },
  {
    cid: "LEGIARTI000006902826",
    numero: "L.1221-25",
    code: "CTRAV",
    titre: "Code du travail — article L.1221-25 (période d'essai — durée maximale)",
    contenu:
      "La période d'essai et la possibilité de la renouveler ne se présument pas. Elles sont expressément stipulées dans la lettre d'engagement ou le contrat de travail.",
    etat: "VIGUEUR",
    url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006902826",
  },
  {
    cid: "LEGIARTI000006902831",
    numero: "L.1221-26",
    code: "CTRAV",
    titre: "Code du travail — article L.1221-26 (durée maximale période d'essai)",
    contenu:
      "La durée de la période d'essai, renouvellement compris, ne peut dépasser : 1° Pour les ouvriers et les employés, quatre mois ; 2° Pour les agents de maîtrise et les techniciens, six mois ; 3° Pour les cadres, huit mois.",
    etat: "VIGUEUR",
    url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006902831",
  },
  {
    cid: "LEGIARTI000032040968",
    numero: "1193",
    code: "CCIV",
    titre: "Code civil — article 1193 (modification et révocation du contrat)",
    contenu:
      "Les contrats ne peuvent être modifiés ou révoqués que du consentement mutuel des parties, ou pour les causes que la loi autorise.",
    etat: "VIGUEUR",
    url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000032040968",
  },
  {
    cid: "LEGIARTI000032040972",
    numero: "1195",
    code: "CCIV",
    titre: "Code civil — article 1195 (imprévision)",
    contenu:
      "Si un changement de circonstances imprévisible lors de la conclusion du contrat rend l'exécution excessivement onéreuse pour une partie qui n'avait pas accepté d'en assumer le risque, celle-ci peut demander une renégociation du contrat à son cocontractant. Elle continue à exécuter ses obligations durant la renégociation. En cas de refus ou d'échec de la renégociation, les parties peuvent convenir de la résolution du contrat ou demander d'un commun accord au juge de procéder à son adaptation. À défaut d'accord dans un délai raisonnable, le juge peut, à la demande d'une partie, réviser le contrat ou y mettre fin.",
    etat: "VIGUEUR",
    url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000032040972",
  },
  {
    cid: "LEGIARTI000032041078",
    numero: "1240",
    code: "CCIV",
    titre: "Code civil — article 1240 (responsabilité civile délictuelle)",
    contenu:
      "Tout fait quelconque de l'homme, qui cause à autrui un dommage, oblige celui par la faute duquel il est arrivé à le réparer.",
    etat: "VIGUEUR",
    url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000032041078",
  },
  {
    cid: "LEGIARTI000032040858",
    numero: "1103",
    code: "CCIV",
    titre: "Code civil — article 1103 (force obligatoire du contrat)",
    contenu:
      "Les contrats légalement formés tiennent lieu de loi à ceux qui les ont faits.",
    etat: "VIGUEUR",
    url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000032040858",
  },
];

export const MOCK_DECISIONS: LegifranceDecision[] = [
  {
    cid: "JURITEXT000007038097",
    juridiction: "Cour de cassation",
    formation: "Chambre commerciale",
    datePrononce: "1996-10-22",
    sommaire:
      "Arrêt Chronopost — clause limitative de responsabilité réputée non écrite lorsqu'elle contredit la portée de l'obligation essentielle souscrite par le débiteur.",
    solution: "Cassation",
    url: "https://www.courdecassation.fr/decision/61372a04cd58014677431000",
  },
  {
    cid: "JURITEXT000023067946",
    juridiction: "Cour de cassation",
    formation: "Chambre commerciale",
    datePrononce: "2010-06-29",
    sommaire:
      "Arrêt Faurecia II — une clause limitative de réparation n'est pas écartée du seul fait qu'elle contredit l'obligation essentielle, sauf si elle en vide la substance ; réaffirmation du critère dit \"du vide de substance\".",
    solution: "Cassation partielle",
    url: "https://www.courdecassation.fr/decision/613734eecd580146774407d0",
  },
  {
    cid: "JURITEXT000034975067",
    juridiction: "Cour de cassation",
    formation: "Chambre commerciale",
    datePrononce: "2017-06-07",
    sommaire:
      "Déséquilibre significatif (art. L.442-6, I, 2° devenu L.442-1) — la clause imposant au fournisseur des pénalités automatiques sans contrepartie ni possibilité de démontrer l'absence de manquement caractérise un déséquilibre significatif.",
    solution: "Rejet",
    url: "https://www.courdecassation.fr/decision/5fca9e16fa6b7d0fc45f6a0b",
  },
  {
    cid: "JURITEXT000043912842",
    juridiction: "Cour de cassation",
    formation: "Première chambre civile",
    datePrononce: "2021-06-30",
    sommaire:
      "Clause abusive (art. 1171 C. civ.) — dans un contrat d'adhésion, le juge apprécie le déséquilibre significatif en tenant compte de l'ensemble des clauses, sans se limiter à un examen isolé.",
    solution: "Cassation",
    url: "https://www.courdecassation.fr/decision/60dc0f0cda41f80e60f0c19d",
  },
  {
    cid: "JURITEXT000007069050",
    juridiction: "Conseil constitutionnel",
    datePrononce: "2018-10-05",
    sommaire:
      "QPC — la règle selon laquelle les clauses abusives sont réputées non écrites dans les contrats d'adhésion (art. 1171 C. civ.) est conforme à la Constitution.",
    solution: "Conformité",
    url: "https://www.conseil-constitutionnel.fr/decision/2018/2018743QPC.htm",
  },
];

function matchesQuery(haystack: string, needle: string): boolean {
  const n = needle
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const h = haystack
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  // Split query in words, require >= 50% of them to match
  const terms = n.split(/\s+/).filter((t) => t.length > 2);
  if (terms.length === 0) return h.includes(n);
  const hits = terms.filter((t) => h.includes(t)).length;
  return hits / terms.length >= 0.5;
}

export function createLegifranceMockClient(): LegifranceClient {
  return {
    isRealBackend: false,
    async searchArticle(q: SearchArticleQuery): Promise<LegifranceArticle[]> {
      const limit = q.limit ?? 5;
      const scope = q.code
        ? MOCK_ARTICLES.filter((a) => a.code === q.code)
        : MOCK_ARTICLES;
      return scope
        .filter((a) => matchesQuery(`${a.titre} ${a.contenu}`, q.query))
        .slice(0, limit);
    },
    async getArticle(cid: string): Promise<LegifranceArticle | null> {
      return MOCK_ARTICLES.find((a) => a.cid === cid) ?? null;
    },
    async searchJurisprudence(q: SearchJuriQuery): Promise<LegifranceDecision[]> {
      const limit = q.limit ?? 3;
      const scope = q.juridiction
        ? MOCK_DECISIONS.filter((d) => {
            if (q.juridiction === "CASS") return d.juridiction.includes("cassation");
            if (q.juridiction === "CETAT") return d.juridiction.includes("État");
            if (q.juridiction === "CONST") return d.juridiction.includes("constitutionnel");
            return true;
          })
        : MOCK_DECISIONS;
      return scope
        .filter((d) => matchesQuery(`${d.sommaire ?? ""} ${d.solution ?? ""}`, q.query))
        .slice(0, limit);
    },
  };
}
