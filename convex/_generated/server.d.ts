/* eslint-disable */
import type {
  GenericQueryCtx,
  GenericMutationCtx,
  GenericActionCtx,
} from "convex/server";
import type { DataModel } from "./dataModel";

export type QueryCtx = GenericQueryCtx<DataModel>;
export type MutationCtx = GenericMutationCtx<DataModel>;
export type ActionCtx = GenericActionCtx<DataModel>;

export { queryGeneric as query } from "convex/server";
export { mutationGeneric as mutation } from "convex/server";
export { actionGeneric as action } from "convex/server";
export { internalQueryGeneric as internalQuery } from "convex/server";
export { internalMutationGeneric as internalMutation } from "convex/server";
export { internalActionGeneric as internalAction } from "convex/server";
export { httpActionGeneric as httpAction } from "convex/server";
