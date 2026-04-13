/* eslint-disable */
/**
 * Generated API — placeholder until `npx convex dev` runs.
 */
import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

import type * as activites from "../activites";
import type * as auth from "../auth";
import type * as clients from "../clients";
import type * as conflits from "../conflits";
import type * as contacts from "../contacts";
import type * as documents from "../documents";
import type * as dossiers from "../dossiers";
import type * as echeances from "../echeances";
import type * as factures from "../factures";
import type * as ia from "../ia";
import type * as notes from "../notes";
import type * as permissions from "../permissions";
import type * as propositions from "../propositions";
import type * as tempsPasses from "../tempsPasses";
import type * as users from "../users";

declare const fullApi: ApiFromModules<{
  activites: typeof activites;
  auth: typeof auth;
  clients: typeof clients;
  conflits: typeof conflits;
  contacts: typeof contacts;
  documents: typeof documents;
  dossiers: typeof dossiers;
  echeances: typeof echeances;
  factures: typeof factures;
  ia: typeof ia;
  notes: typeof notes;
  permissions: typeof permissions;
  propositions: typeof propositions;
  tempsPasses: typeof tempsPasses;
  users: typeof users;
}>;

export declare const api: FilterApi<typeof fullApi, FunctionReference<any, "public">>;
export declare const internal: FilterApi<typeof fullApi, FunctionReference<any, "internal">>;
