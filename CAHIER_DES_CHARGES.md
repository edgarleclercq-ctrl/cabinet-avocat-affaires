# Cahier des charges — Application metier pour cabinet d'avocats

> **Specialites** : Droit des societes, Litige commercial, Droit fiscal
> **Cible** : Cabinets de 5 a 10 personnes
> **Type** : Demonstrateur fonctionnel — outil de prospection
> **Stack** : Next.js 15 + TypeScript + Tailwind CSS + shadcn/ui + Convex
> **Date** : 13 avril 2026

---

## Table des matieres

1. [Contexte et vision](#1-contexte-et-vision)
2. [Utilisateurs et roles](#2-utilisateurs-et-roles)
3. [Module 1 — Dashboard](#3-module-1--dashboard)
4. [Module 2 — CRM Cabinet](#4-module-2--crm-cabinet)
5. [Module 3 — Gestion de dossiers](#5-module-3--gestion-de-dossiers)
6. [Module 4 — Facturation](#6-module-4--facturation)
7. [Module 5 — Conflits d'interets](#7-module-5--conflits-dinterets)
8. [Module 6 — IA Juridique](#8-module-6--ia-juridique)
9. [Stack technique](#9-stack-technique)
10. [Securite et conformite](#10-securite-et-conformite)
11. [Hors perimetre](#11-hors-perimetre)
12. [Annexes](#12-annexes)

---

## 1. Contexte et vision

### 1.1 Problematique

Les cabinets d'avocats de petite taille (5-10 personnes) specialises en droit des societes, litige commercial et droit fiscal font face a des problematiques operationnelles majeures :

- **Outils fragmentes** : utilisation simultanee de 4 a 6 outils deconnectes (Word, Excel, Outlook, logiciel de facturation, GED, agenda) sans aucune interoperabilite
- **Gestion des delais critique** : en litige, un delai procedural oublie entraine le rejet pur et simple de la demande. En fiscal, un delai de declaration manque genere des penalites automatiques
- **Versioning chaotique** : les documents juridiques (statuts, conclusions, pactes d'associes) passent par des dizaines de versions sans tracabilite fiable de qui a relu, modifie ou valide
- **Charge administrative ecrasante** : 67% des avocats consacrent plus de 15 heures par semaine a des taches administratives au lieu de produire du droit
- **Aucune vision consolidee** : pas de tableau de bord unifie pour suivre l'activite du cabinet, les dossiers en cours, les echeances ou la facturation

### 1.2 Vision produit

Construire une **application metier tout-en-un** concue specifiquement pour les cabinets d'avocats specialises en droit des affaires. L'outil centralise la gestion des clients, des dossiers, de la facturation et integre de l'intelligence artificielle pour l'analyse documentaire et la redaction assistee.

**Proposition de valeur** : Un seul outil qui remplace 5 logiciels deconnectes, concu par et pour des avocats d'affaires, avec des workflows adaptes a chaque specialite (corporate, litige, fiscal).

### 1.3 Objectifs mesurables

| Objectif | Indicateur | Cible |
|---|---|---|
| Reduire le temps administratif | Heures/semaine sur taches admin | -40% |
| Zero delai oublie | Echeances manquees par trimestre | 0 |
| Tracabilite complete | Documents avec historique de validation | 100% |
| Adoption equipe | Utilisateurs actifs quotidiens | >80% de l'equipe |

---

## 2. Utilisateurs et roles

### 2.1 Modele d'acces

L'application fonctionne sur un **modele d'invitation uniquement**. Aucune inscription publique n'est possible. Seul un administrateur (associe) peut inviter de nouveaux utilisateurs et leur attribuer un role.

### 2.2 Roles et permissions

| Permission | Associe | Collaborateur | Secretaire | Stagiaire |
|---|:---:|:---:|:---:|:---:|
| **Dashboard** | Complet (tout le cabinet) | Ses dossiers uniquement | Vue admin (facturation) | Ses dossiers |
| **CRM — Voir clients** | Tous | Ses clients | Tous | Ses clients |
| **CRM — Creer/modifier client** | Oui | Oui | Oui | Non |
| **CRM — Supprimer client** | Oui | Non | Non | Non |
| **CRM — Propositions commerciales** | Creer + valider | Creer (brouillon) | Creer (brouillon) | Non |
| **Dossiers — Voir** | Tous | Assignes | Tous | Assignes |
| **Dossiers — Creer** | Oui | Oui | Non | Non |
| **Dossiers — Modifier** | Oui | Assignes | Metadonnees | Non |
| **Dossiers — Valider documents** | Oui | Oui | Non | Non |
| **Dossiers — Supprimer** | Oui | Non | Non | Non |
| **Facturation — Voir** | Tout | Ses dossiers | Tout | Non |
| **Facturation — Creer facture** | Oui | Non | Oui | Non |
| **Facturation — Valider/envoyer** | Oui | Non | Non | Non |
| **Conflits d'interets** | Oui | Consultation | Non | Non |
| **IA — Analyse documents** | Oui | Oui | Non | Non |
| **IA — Redaction assistee** | Oui | Oui | Non | Lecture seule |
| **Administration** | Tout | Non | Non | Non |
| **Inviter des utilisateurs** | Oui | Non | Non | Non |
| **Gerer les roles** | Oui | Non | Non | Non |

### 2.3 Profils detailles

**Associe (administrateur)**
- Accede a l'integralite du cabinet
- Valide les propositions commerciales et les factures
- Gere les utilisateurs, les roles et les parametres
- Supervise tous les dossiers, peut reassigner

**Collaborateur**
- Gere ses dossiers de A a Z
- Cree des brouillons de propositions commerciales
- Utilise les outils IA (analyse + redaction)
- Ne voit que les dossiers auxquels il est assigne

**Secretaire juridique**
- Gere l'administratif : classement, facturation, relances
- Accede a tous les dossiers en lecture + metadonnees
- Cree des factures (validation par l'associe)
- Gere le CRM (creation/modification clients)

**Stagiaire**
- Accede uniquement aux dossiers assignes en lecture
- Peut consulter les documents generes par l'IA (pas creer)
- Aucun acces a la facturation ni a l'administration

---

## 3. Module 1 — Dashboard

### 3.1 Vue d'ensemble

Le dashboard est le point d'entree de l'application. Il offre une vue consolidee de l'activite du cabinet, adaptee au role de l'utilisateur connecte.

### 3.2 Dashboard Associe (vue complete)

**Bloc 1 — KPI globaux** (4 cartes en haut)
- Dossiers actifs (total + repartition par specialite)
- Echeances a venir (7 prochains jours, badge rouge si urgence)
- Facturation du mois (emis / encaisse / impaye)
- Taux de recouvrement (% factures payees dans les delais)

**Bloc 2 — Alertes et echeances**
- Liste chronologique des echeances a venir (procedures, fiscal, AG)
- Code couleur : rouge (< 48h), orange (< 7 jours), vert (> 7 jours)
- Clic sur une echeance → ouvre le dossier concerne
- Filtrage par specialite (corporate / litige / fiscal)

**Bloc 3 — Dossiers recents**
- 10 derniers dossiers modifies
- Statut, responsable, prochaine echeance
- Acces rapide au dossier

**Bloc 4 — Activite du cabinet**
- Timeline des dernieres actions (document ajoute, facture emise, dossier cree, validation effectuee)
- Filtrable par collaborateur

**Bloc 5 — Facturation**
- Graphique barres : CA mensuel sur 12 mois (emis vs encaisse)
- Tableau des factures en retard de paiement
- Top 5 clients par CA

### 3.3 Dashboard Collaborateur

- Memes blocs mais filtres sur ses dossiers uniquement
- Pas de vue CA global, uniquement ses dossiers factures

### 3.4 Dashboard Secretaire

- Focus sur facturation (factures a emettre, relances a faire)
- Echeances administratives
- Courriers et documents en attente de validation

### 3.5 Dashboard Stagiaire

- Liste de ses dossiers assignes avec prochaines echeances
- Documents a consulter

---

## 4. Module 2 — CRM Cabinet

### 4.1 Fiche client

Chaque client dispose d'une fiche centralisee contenant :

**Informations generales**
- Denomination sociale / Nom prenom (personne physique)
- Forme juridique (SAS, SARL, SA, SCI, etc.)
- SIREN / SIRET
- Adresse du siege social
- Capital social
- Dirigeant(s) et representant(s) legal(aux)
- Secteur d'activite
- Date de creation de la societe

**Contacts**
- Interlocuteur principal (nom, poste, telephone, email)
- Contacts secondaires (DAF, DRH, DG, etc.)
- Historique des changements d'interlocuteur

**Informations juridiques**
- Specialites concernees (corporate, litige, fiscal — multi-select)
- Avocat referent au sein du cabinet
- Observations / notes internes
- Tags personnalises (ex: "client sensible", "groupe", "VIP")

### 4.2 Historique client

La fiche client centralise **tout l'historique de la relation** :

- **Dossiers** : liste de tous les dossiers ouverts/clos pour ce client avec lien direct
- **Propositions commerciales** : toutes les propositions envoyees (statut : brouillon / envoyee / acceptee / refusee)
- **Factures** : historique complet de facturation
- **Echanges** : log des rendez-vous, appels, emails marquants (saisie manuelle)
- **Documents** : documents transversaux non lies a un dossier specifique (ex: mandat, convention d'honoraires)

### 4.3 Propositions commerciales

**Creation**
- Selection du client
- Selection de la specialite (corporate / litige / fiscal)
- Description de la mission
- Mode de facturation : forfait (montant fixe) ou temps passe (taux horaire par intervenant)
- Detail des honoraires par phase si forfait
- Conditions de paiement (acompte, echeancier)
- Conditions generales (modele par defaut personnalisable)

**Workflow**
1. **Brouillon** — creation par collaborateur ou secretaire
2. **En attente de validation** — soumis a l'associe
3. **Validee** — approuvee par l'associe
4. **Envoyee** — envoyee au client (generation PDF automatique)
5. **Acceptee** / **Refusee** — retour du client (saisie manuelle)
6. Si acceptee → creation automatique du dossier lie

**Suivi**
- Taux d'acceptation visible dans le CRM
- Historique complet des propositions par client
- Relance possible sur propositions envoyees sans reponse

### 4.4 Recherche et filtres

- Recherche full-text sur denomination, SIREN, interlocuteur
- Filtres : specialite, avocat referent, statut (actif/inactif), tags
- Tri par date de dernier dossier, CA cumule, nom

---

## 5. Module 3 — Gestion de dossiers

### 5.1 Architecture commune

Chaque dossier, quelle que soit la specialite, possede un socle commun :

**Metadonnees**
- Reference unique (auto-generee, format : `SPE-AAAA-XXXX`, ex: `LIT-2026-0042`)
- Client (lien vers fiche CRM)
- Specialite (corporate / litige / fiscal)
- Intitule du dossier
- Description / contexte
- Avocat responsable
- Collaborateurs assignes
- Statut (voir workflows par specialite)
- Date d'ouverture / date de cloture
- Montant des honoraires prevus (lien proposition commerciale)
- Partie(s) adverse(s) le cas echeant

**GED (Gestion Electronique de Documents)**
- Arborescence de dossiers par categorie (pieces, correspondances, actes, conclusions, notes internes)
- Upload de fichiers (PDF, Word, Excel, images)
- **Versioning** : chaque document uploade est versionne automatiquement (v1, v2, v3...)
- **Tracabilite** : chaque version enregistre : auteur, date, commentaire de modification
- **Circuit de validation** : un document peut etre marque comme "a relire", "relu par [nom]", "valide par [nom]"
- Verrouillage : un document en cours de modification est verrouille pour eviter les conflits
- Recherche dans les noms de fichiers et les metadonnees

**Notes et activite**
- Fil d'activite chronologique (toutes les actions sur le dossier)
- Notes internes (visibles par l'equipe assignee uniquement)
- Mentions (@collaborateur) dans les notes

**Echeances**
- Liste des echeances liees au dossier
- Chaque echeance : date, description, responsable, statut (a venir / en retard / traitee)
- Alertes automatiques : notification a J-7, J-3, J-1, J0

### 5.2 Workflow — Droit des societes (Corporate)

**Statuts du dossier**
1. `ouvert` — Dossier cree, collecte d'informations
2. `en_cours_redaction` — Redaction des actes en cours
3. `en_relecture` — Actes soumis a relecture/validation interne
4. `en_attente_signature` — Documents envoyes pour signature
5. `en_attente_formalites` — Signature obtenue, formalites en cours (greffe, publication)
6. `clos` — Dossier termine

**Types d'operations**
- Constitution de societe (SAS, SARL, SCI, SA...)
- Modification statutaire (transfert de siege, changement d'objet social, augmentation de capital)
- Cession de parts / actions
- Pacte d'associes
- Assemblee generale (AGO, AGE)
- Dissolution / liquidation
- Operation de M&A (due diligence, protocole de cession, garantie d'actif et passif)

**Echeances specifiques**
- Date de l'AG prevue
- Delai de convocation (selon forme juridique et statuts)
- Date limite de depot au greffe
- Publication au journal d'annonces legales
- Renouvellement de mandats (dirigeants, commissaire aux comptes)

**Checklist par type d'operation** (exemple : constitution SAS)
- [ ] Redaction des statuts
- [ ] Redaction du pacte d'associes (si applicable)
- [ ] Attestation de depot des fonds
- [ ] Certificat de domiciliation
- [ ] Publication JAL
- [ ] Depot au greffe
- [ ] Obtention Kbis

### 5.3 Workflow — Litige commercial

**Statuts du dossier**
1. `ouvert` — Analyse du litige, collecte des pieces
2. `phase_amiable` — Tentative de resolution amiable (mise en demeure, negociation)
3. `pre_contentieux` — Preparation de la procedure (assignation, pieces)
4. `contentieux_en_cours` — Procedure devant le tribunal
5. `en_attente_decision` — Audience tenue, delibere en cours
6. `decision_rendue` — Jugement obtenu
7. `execution` — Execution de la decision (huissier, saisies)
8. `appel` — Procedure d'appel le cas echeant
9. `clos` — Dossier termine

**Types de procedures**
- Injonction de payer
- Refere commercial (mesures urgentes/provisoires)
- Procedure au fond devant le tribunal de commerce
- Procedure devant le tribunal judiciaire
- Mediation / arbitrage
- Appel

**Echeances specifiques**
- Date limite de signification de l'assignation
- Calendrier de mise en etat (dates de depot des conclusions)
- Date d'audience de plaidoirie
- Delai d'appel (1 mois a compter de la signification du jugement)
- Delai de prescription (5 ans en matiere commerciale)
- Dates de mediation / arbitrage

**Gestion des conclusions**
- Upload des jeux de conclusions (demandeur et defendeur)
- Suivi des echanges : conclusions n°1, conclusions n°2, conclusions recapitulatives
- Versioning automatique avec date de depot
- Pieces numerotees (piece n°1, piece n°2...) avec bordereau de communication

**Suivi des parties**
- Partie(s) adverse(s) : denomination, avocat adverse, coordonnees
- Juridiction : tribunal competent, chambre, numero de RG
- Magistrat(s) en charge (si connu)

### 5.4 Workflow — Droit fiscal

**Statuts du dossier**
1. `ouvert` — Prise en charge, analyse de la situation fiscale
2. `en_cours_analyse` — Etude approfondie, recherche de solutions
3. `en_cours_redaction` — Redaction des actes / memoires / reclamations
4. `depose` — Documents deposes aupres de l'administration fiscale
5. `en_attente_reponse` — Attente de la reponse de l'administration
6. `contentieux_fiscal` — Recours contentieux (tribunal administratif)
7. `clos` — Dossier termine

**Types de missions**
- Conseil en optimisation fiscale (IS, IR, TVA, plus-values)
- Assistance controle fiscal (verification de comptabilite, ESFP)
- Reclamation contentieuse (aupres de l'administration)
- Recours devant le tribunal administratif / cour administrative d'appel
- Rescrit fiscal
- Regularisation spontanee
- Structuration fiscale (holdings, integration fiscale)

**Echeances specifiques**
- Dates de declaration (IS, TVA, CFE, CVAE)
- Delai de reclamation (31 decembre de la 2eme annee suivant la mise en recouvrement)
- Delais de reponse a une proposition de rectification (30 jours, prorogeables a 60)
- Delai de saisine du tribunal administratif
- Echeances de paiement (acomptes IS, TVA)

**Calendrier fiscal automatise**
- Calendrier annuel pre-rempli des echeances fiscales majeures par client
- Rappels automatiques avant chaque echeance
- Suivi des declarations effectuees / en retard

### 5.5 Recherche et filtres dossiers

- Recherche full-text (reference, intitule, client, partie adverse)
- Filtres : specialite, statut, avocat responsable, date d'ouverture, client
- Tri : date de modification, echeance la plus proche, reference
- Vue tableau + vue Kanban par statut

---

## 6. Module 4 — Facturation

### 6.1 Perimetre

La facturation couvre le suivi du cycle de vie des factures. Elle ne remplace pas un logiciel comptable mais permet de gerer le processus de facturation de bout en bout au sein du cabinet.

### 6.2 Types de facturation

**Forfait**
- Montant fixe defini dans la proposition commerciale
- Facturation en une ou plusieurs echeances (phasage)
- Suivi de l'avancement par phase

**Temps passe**
- Taux horaire par intervenant (associe, collaborateur, stagiaire)
- Saisie des temps passes par dossier (description, duree, date, intervenant)
- Calcul automatique du montant a facturer
- Note : il ne s'agit pas d'un chronometre temps reel mais d'une saisie declarative apres coup

### 6.3 Cycle de vie d'une facture

1. **Brouillon** — Facture creee (manuellement ou depuis une proposition)
2. **En attente de validation** — Soumise a l'associe
3. **Validee** — Approuvee, prete a etre envoyee
4. **Envoyee** — PDF genere, marquee comme envoyee
5. **Payee partiellement** — Paiement partiel recu
6. **Payee** — Reglement complet recu
7. **En retard** — Delai de paiement depasse (passage automatique)
8. **Annulee** — Facture annulee (avoir)

### 6.4 Contenu de la facture

- En-tete : coordonnees du cabinet, logo
- Client : denomination, adresse, SIREN
- Reference du dossier
- Description detaillee des prestations
- Montant HT / TVA / TTC
- Conditions de paiement
- Mentions legales obligatoires
- Numero de facture (sequence automatique)

### 6.5 Provisions et acomptes

- Demande d'acompte a la signature de la proposition commerciale
- Suivi des provisions versees par le client
- Deduction automatique des acomptes sur la facture finale
- Historique des mouvements par dossier

### 6.6 Relances

- Relance automatique a J+7, J+15, J+30 apres echeance
- Modeles de relance personnalisables (3 niveaux : courtoise, ferme, mise en demeure)
- Historique des relances envoyees
- Indicateur de retard sur le dashboard

### 6.7 Reporting facturation

- CA mensuel / trimestriel / annuel
- Repartition par specialite, par client, par collaborateur
- Taux de recouvrement
- Factures en retard (montant + anciennete)
- Top clients par CA

---

## 7. Module 5 — Conflits d'interets

### 7.1 Contexte reglementaire

L'article 7 du Reglement Interieur National (RIN) de la profession d'avocat impose a tout avocat de verifier l'absence de conflit d'interets avant d'accepter un nouveau dossier. Un avocat ne peut pas representer un client si il represente ou a represente la partie adverse dans un dossier connexe.

### 7.2 Fonctionnement

**Verification automatique a l'ouverture d'un dossier**

Lors de la creation d'un nouveau dossier, le systeme effectue automatiquement une recherche croisee :

1. L'utilisateur saisit le nom du client et le nom de la/des partie(s) adverse(s)
2. Le systeme recherche dans la base :
   - La partie adverse est-elle un client actuel ou passe du cabinet ?
   - Le client actuel est-il partie adverse dans un autre dossier du cabinet ?
   - Y a-t-il des liens entre les entites (meme groupe, filiales, dirigeants communs) ?
3. **Resultat** :
   - **Aucun conflit detecte** → le dossier peut etre ouvert
   - **Conflit potentiel detecte** → alerte avec detail du dossier concerne, blocage de la creation en attente de decision de l'associe
   - **Conflit confirme** → ouverture impossible

**Registre des verifications**
- Chaque verification est loguee (date, utilisateur, resultat)
- Historique consultable par les associes
- Preuve de conformite en cas de controle deontologique

### 7.3 Base de donnees des parties

- Chaque dossier enregistre : client + partie(s) adverse(s)
- Les parties sont normalisees (denomination officielle, SIREN si disponible)
- Recherche floue pour detecter les variantes orthographiques (ex: "SAS Martin" vs "Martin SAS")

---

## 8. Module 6 — IA Juridique

### 8.1 Perimetre

Deux fonctionnalites IA ciblees, concues pour etre reellement utiles au quotidien sans pretendre remplacer le travail de l'avocat.

### 8.2 Analyse de documents

**Description**
L'utilisateur uploade un document (contrat, acte, statuts, conclusions adverses) et l'IA en produit une analyse structuree.

**Fonctionnalites**
- **Extraction de clauses cles** : identification et extraction des clauses importantes (objet, duree, resiliation, non-concurrence, garantie, limitation de responsabilite, clause compromissoire, etc.)
- **Resume structure** : synthese du document en points cles (parties, objet, engagements principaux, conditions particulieres)
- **Tableau des obligations** : liste des obligations de chaque partie avec dates et conditions
- **Points d'attention** : signalement des clauses inhabituelles, desequilibrees ou potentiellement problematiques

**Workflow**
1. L'utilisateur uploade un document dans un dossier
2. Il clique sur "Analyser avec l'IA"
3. L'IA produit une analyse structuree (affichee dans un panneau lateral)
4. L'utilisateur peut sauvegarder l'analyse comme note du dossier
5. L'analyse n'a aucune valeur juridique — c'est un outil d'aide a la lecture

**Types de documents supportes**
- Contrats commerciaux
- Statuts de societe
- Pactes d'associes
- Conclusions adverses
- Baux commerciaux
- Protocoles d'accord / transactions
- Actes de cession

### 8.3 Redaction assistee

**Description**
L'IA assiste la redaction de documents juridiques courants en generant des brouillons a partir d'instructions et du contexte du dossier.

**Types de documents generables**
- Mise en demeure
- Courrier de relance
- Assignation (trame)
- Conclusions (structure)
- Note de synthese interne
- Courrier a l'administration fiscale
- Convocation d'assemblee generale
- Proces-verbal d'AG (trame)

**Workflow**
1. L'utilisateur selectionne le type de document a generer
2. L'IA accede au contexte du dossier (fiche client, type de dossier, parties, historique)
3. L'utilisateur peut ajouter des instructions specifiques en texte libre
4. L'IA genere un brouillon structure
5. Le brouillon est sauvegarde comme document v1 dans la GED du dossier
6. L'utilisateur edite, amende, puis soumet a validation selon le circuit normal

**Garde-fous**
- Chaque document genere est marque "Genere par IA — A verifier et valider"
- Un associe doit valider avant tout envoi externe
- L'IA ne remplace pas le raisonnement juridique de l'avocat
- Aucune donnee client n'est envoyee a des services tiers sans chiffrement
- Les modeles de generation sont configures par le cabinet (tonalite, formules d'usage, structure)

---

## 9. Stack technique

### 9.1 Architecture

| Couche | Technologie |
|---|---|
| **Frontend** | Next.js 15 (App Router) + TypeScript strict |
| **UI** | Tailwind CSS + shadcn/ui |
| **Backend** | Convex (base de donnees, logique serveur, real-time) |
| **Authentification** | Convex Auth (invitation uniquement, pas d'inscription publique) |
| **Stockage fichiers** | Convex File Storage (documents GED) |
| **IA** | API Claude (Anthropic) pour analyse et redaction |
| **PDF** | Generation cote serveur (react-pdf ou equivalent) |
| **Deploiement** | VPS (Docker + GitHub Actions CI/CD) |

### 9.2 Choix techniques

**Convex** plutot que Supabase :
- Temps reel natif (les mises a jour sont push, pas pull)
- Schema type-safe avec validation TypeScript de bout en bout
- Logique serveur colocalisee avec la base de donnees (pas d'API REST a maintenir)
- Ideal pour une application collaborative (plusieurs utilisateurs sur le meme dossier)

**Pourquoi pas de Supabase** :
- Decision architecturale du projet
- Convex couvre tous les besoins (auth, DB, storage, serverless functions)

### 9.3 Schema de donnees (haut niveau)

```
users
  - id, name, email, role, invitedBy, createdAt

clients
  - id, type (personne_morale | personne_physique)
  - denomination, formeJuridique, siren, siret
  - siegeSocial, capitalSocial, dirigeants
  - secteurActivite, dateCreation
  - avocatReferentId, tags, notes
  - createdAt, updatedAt

contacts
  - id, clientId, nom, prenom, poste, telephone, email, isPrincipal

dossiers
  - id, reference, clientId, specialite (corporate | litige | fiscal)
  - intitule, description, statut
  - avocatResponsableId, collaborateursIds[]
  - montantHonoraires, propositionId
  - partiesAdverses[]
  - dateOuverture, dateCloture
  - createdAt, updatedAt

dossiersCorporate (extension)
  - dossierId, typeOperation, checklist[]
  - dateAG, dateDepotGreffe, datePublicationJAL

dossiersLitige (extension)
  - dossierId, typeProcedure, juridiction
  - chambre, numeroRG, magistrat
  - avocatAdverse, coordonneesAdverse
  - conclusionsEchangees[]

dossiersFiscal (extension)
  - dossierId, typeMission, regime
  - calendrierFiscal[]
  - montantEnJeu

documents
  - id, dossierId, nom, categorie
  - version, auteurId, commentaire
  - url (Convex storage), taille, type
  - statutValidation (a_relire | relu | valide)
  - validePar, valideAt
  - createdAt

echeances
  - id, dossierId, description, date
  - responsableId, statut (a_venir | en_retard | traitee)
  - type (procedurale | fiscale | administrative | ag)
  - rappels[] (j-7, j-3, j-1)

notes
  - id, dossierId, auteurId, contenu
  - mentions[], createdAt

propositions
  - id, clientId, specialite, description
  - modeFacturation (forfait | temps_passe)
  - montantForfait | tauxHoraires[]
  - phases[], conditionsPaiement
  - statut (brouillon | en_attente | validee | envoyee | acceptee | refusee)
  - createdBy, valideeBy, createdAt

factures
  - id, dossierId, clientId, propositionId
  - numero, description, montantHT, tva, montantTTC
  - statut (brouillon | en_attente | validee | envoyee | payee_partiellement | payee | en_retard | annulee)
  - dateEmission, dateEcheance, datePaiement
  - acomptesDeduits, relances[]
  - createdBy, valideeBy

tempsPasses (pour facturation temps passe)
  - id, dossierId, intervenantId
  - date, dureeMinutes, description, tauxHoraire

conflitsVerifications
  - id, dossierId, clientId
  - partiesVerifiees[], resultat (aucun | potentiel | confirme)
  - details, dateVerification, verifiePar

activites (log)
  - id, dossierId, clientId, utilisateurId
  - type, description, metadata
  - createdAt

analyseIA
  - id, documentId, dossierId
  - type (analyse | redaction)
  - resultat, prompt, modele
  - createdBy, createdAt
```

---

## 10. Securite et conformite

### 10.1 Secret professionnel

- Toutes les donnees sont hebergees en France (VPS francais)
- Chiffrement en transit (HTTPS/TLS) et au repos
- Aucun acces aux donnees par des tiers non autorises
- Les fonctionnalites IA utilisent l'API Claude avec chiffrement end-to-end
- Aucune donnee client n'est utilisee pour entrainer des modeles

### 10.2 RGPD

- Registre des traitements de donnees
- Droit d'acces, de rectification et de suppression des donnees clients
- Duree de conservation parametrable (archivage legal : 5 ans minimum pour les dossiers)
- Consentement explicite pour le traitement IA des documents
- Logs d'acces aux donnees personnelles

### 10.3 LCB-FT (Lutte contre le blanchiment)

- Pour les operations financieres et immobilieres : obligation de vigilance
- Fiche client enrichie avec les informations d'identification
- Signalement via le batonnier (pas directement a Tracfin) — le systeme peut generer le formulaire de declaration de soupcon a destination du batonnier
- Documentation des controles de connaissance client (KYC)

### 10.4 Acces et audit

- Authentification securisee (email + mot de passe, possibilite 2FA)
- Sessions avec expiration automatique
- Log complet de toutes les actions utilisateur (qui, quoi, quand)
- Historique non supprimable des modifications de documents
- Sauvegarde automatique quotidienne

---

## 11. Hors perimetre

Les elements suivants sont **explicitement exclus** de cette version :

| Element | Raison |
|---|---|
| Recherche jurisprudentielle | Doctrine.fr et GenIA-L couvrent ce besoin |
| Justice predictive / scoring | Complexite + fiabilite insuffisante |
| Comptabilite complete | Logiciel comptable dedie (export eventuel en v2) |
| Messagerie / email integre | Integration trop lourde, les avocats utilisent Outlook |
| Portail client | Valeur ajoutee incertaine pour un cabinet 5-10 |
| Agenda partage / sync Outlook | Hors perimetre v1 |
| E-facturation (Factur-X) | Norme encore en cours, a integrer en v2 |
| Export comptable | Hors perimetre v1 |
| Time tracking chronometre | Saisie declarative uniquement |
| Application mobile | Web responsive uniquement en v1 |

---

## 12. Annexes

### 12.1 Glossaire

| Terme | Definition |
|---|---|
| **RIN** | Reglement Interieur National de la profession d'avocat |
| **AG / AGO / AGE** | Assemblee Generale / Ordinaire / Extraordinaire |
| **JAL** | Journal d'Annonces Legales |
| **Kbis** | Extrait du registre du commerce, carte d'identite de l'entreprise |
| **RG** | Repertoire General (numero attribue par le tribunal a un dossier) |
| **Mise en etat** | Phase de preparation du proces (echange de conclusions) |
| **Conclusions** | Ecritures deposees par les avocats devant le tribunal |
| **LCB-FT** | Lutte Contre le Blanchiment et le Financement du Terrorisme |
| **Tracfin** | Cellule de renseignement financier francaise |
| **KYC** | Know Your Customer — verification d'identite du client |
| **GED** | Gestion Electronique de Documents |
| **Rescrit fiscal** | Demande d'interpretation a l'administration fiscale |
| **IS / IR / TVA / CFE / CVAE** | Impot sur les Societes / Impot sur le Revenu / Taxe sur la Valeur Ajoutee / Cotisation Fonciere des Entreprises / Cotisation sur la Valeur Ajoutee des Entreprises |

### 12.2 Concurrence directe

| Outil | Prix | Forces | Faiblesses |
|---|---|---|---|
| **SECIB Neo** | Sur devis | Leader, 5000+ cabinets | Interface vieillissante, pas d'IA |
| **Jarvis Legal** | 38-149€/user/mois | IA integree (TONI), complet | Generaliste, pas specifique droit des affaires |
| **Diapaz** | Sur devis | Workflows automatises | Lourd, courbe d'apprentissage |
| **Kleos** | Sur devis | E-facturation prete | Generaliste |
| **LegalProd** | 49€/mois | Economique, tout-en-un | Basique, peu de profondeur metier |

**Notre differenciation** : workflows specifiques par specialite (corporate / litige / fiscal) + IA integree pour l'analyse de documents et la redaction + interface moderne et intuitive concue pour les petits cabinets.

### 12.3 Estimation volumetrique (cabinet 5-10)

| Donnee | Volume estime |
|---|---|
| Clients actifs | 50 a 200 |
| Dossiers actifs simultanement | 30 a 80 |
| Nouveaux dossiers par mois | 5 a 15 |
| Documents par dossier | 10 a 50 |
| Factures par mois | 10 a 30 |
| Utilisateurs | 5 a 10 |
