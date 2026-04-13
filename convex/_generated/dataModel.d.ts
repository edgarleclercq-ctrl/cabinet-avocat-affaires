/* eslint-disable */
import type { DataModelFromSchemaDefinition, GenericDocument } from "convex/server";
import type schema from "../schema";

export type DataModel = DataModelFromSchemaDefinition<typeof schema>;

import type { GenericId } from "convex/values";
export type Id<TableName extends keyof DataModel> = GenericId<TableName>;
export type Doc<TableName extends keyof DataModel> = DataModel[TableName]["document"];
