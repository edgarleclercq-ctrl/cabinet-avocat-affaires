/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as activites from "../activites.js";
import type * as auth from "../auth.js";
import type * as clients from "../clients.js";
import type * as conflits from "../conflits.js";
import type * as contacts from "../contacts.js";
import type * as documents from "../documents.js";
import type * as dossiers from "../dossiers.js";
import type * as echeances from "../echeances.js";
import type * as factures from "../factures.js";
import type * as http from "../http.js";
import type * as ia from "../ia.js";
import type * as notes from "../notes.js";
import type * as permissions from "../permissions.js";
import type * as propositions from "../propositions.js";
import type * as tempsPasses from "../tempsPasses.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

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
  http: typeof http;
  ia: typeof ia;
  notes: typeof notes;
  permissions: typeof permissions;
  propositions: typeof propositions;
  tempsPasses: typeof tempsPasses;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
