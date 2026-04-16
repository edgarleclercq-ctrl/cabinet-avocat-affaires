import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";

// Password provider avec profile callback :
// Convex Auth insère les utilisateurs dans la table `users`. Notre schéma
// exige `name`, `role` et `isActive`, donc on fournit ces valeurs par défaut
// à partir des paramètres envoyés depuis le formulaire d'inscription.
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      profile(params) {
        const email = (params.email as string) ?? "";
        const name =
          ((params.name as string) || "").trim() ||
          email.split("@")[0] ||
          "Utilisateur";
        return {
          email,
          name,
          // Le premier utilisateur créé devient associé.
          // Les utilisateurs suivants doivent être invités (rôle attribué
          // via la mutation `users.invite` qui utilise `ctx.db.patch`).
          role: "associe" as const,
          isActive: true,
        };
      },
    }),
  ],
});
