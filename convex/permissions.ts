import { QueryCtx, MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";

export type Role = "associe" | "collaborateur" | "secretaire" | "stagiaire";

export async function getCurrentUser(ctx: QueryCtx) {
  // Convex Auth stocke l'_id utilisateur dans la session ; c'est la source
  // de vérité la plus fiable (plus sûr que de requêter par email).
  const userId = await getAuthUserId(ctx);
  if (!userId) return null;
  return await ctx.db.get(userId);
}

export async function requireUser(ctx: QueryCtx) {
  const user = await getCurrentUser(ctx);
  if (!user) throw new Error("Non authentifié");
  return user;
}

export async function requireRole(ctx: QueryCtx, roles: Role[]) {
  const user = await requireUser(ctx);
  if (!roles.includes(user.role)) {
    throw new Error(`Accès refusé. Rôle requis : ${roles.join(", ")}`);
  }
  return user;
}

export async function canAccessDossier(
  ctx: QueryCtx,
  dossierId: Id<"dossiers">
) {
  const user = await requireUser(ctx);
  const dossier = await ctx.db.get(dossierId);
  if (!dossier) throw new Error("Dossier introuvable");

  if (user.role === "associe" || user.role === "secretaire") return { user, dossier };

  const isAssigned =
    dossier.avocatResponsableId === user._id ||
    dossier.collaborateursIds.includes(user._id);

  if (!isAssigned) {
    throw new Error("Vous n'avez pas accès à ce dossier");
  }

  return { user, dossier };
}

export async function canModifyDossier(
  ctx: MutationCtx,
  dossierId: Id<"dossiers">
) {
  const user = await requireUser(ctx);
  const dossier = await ctx.db.get(dossierId);
  if (!dossier) throw new Error("Dossier introuvable");

  if (user.role === "associe") return { user, dossier };

  if (user.role === "collaborateur") {
    const isAssigned =
      dossier.avocatResponsableId === user._id ||
      dossier.collaborateursIds.includes(user._id);
    if (!isAssigned) throw new Error("Accès refusé");
    return { user, dossier };
  }

  if (user.role === "secretaire") {
    return { user, dossier }; // metadata only
  }

  throw new Error("Accès refusé");
}

export function canViewAllClients(role: Role): boolean {
  return role === "associe" || role === "secretaire";
}

export function canCreateClient(role: Role): boolean {
  return role !== "stagiaire";
}

export function canDeleteClient(role: Role): boolean {
  return role === "associe";
}

export function canCreateDossier(role: Role): boolean {
  return role === "associe" || role === "collaborateur";
}

export function canDeleteDossier(role: Role): boolean {
  return role === "associe";
}

export function canCreateFacture(role: Role): boolean {
  return role === "associe" || role === "secretaire";
}

export function canValidateFacture(role: Role): boolean {
  return role === "associe";
}

export function canUseIA(role: Role): boolean {
  return role === "associe" || role === "collaborateur";
}

export function canAccessConflits(role: Role): boolean {
  return role === "associe" || role === "collaborateur";
}

export function canInviteUsers(role: Role): boolean {
  return role === "associe";
}
