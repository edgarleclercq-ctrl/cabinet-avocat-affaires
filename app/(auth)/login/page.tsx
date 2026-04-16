"use client";

import { useState, FormEvent } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Scale } from "lucide-react";

export default function LoginPage() {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Le `name` est lu par le callback `profile` dans convex/auth.ts
      // pour alimenter la table `users` (champ requis du schéma).
      const params: Record<string, string> = { email, password, flow: mode };
      if (mode === "signUp" && name.trim()) {
        params.name = name.trim();
      }
      await signIn("password", params);

      router.push("/dashboard");
    } catch (err: any) {
      if (mode === "signIn") {
        setError("Identifiants incorrects. Veuillez réessayer.");
      } else {
        setError("Erreur lors de l'inscription. Ce compte existe peut-être déjà.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#001025] px-4">
      <div className="w-full max-w-sm">
        {/* Branding */}
        <div className="mb-10 flex flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-3">
            <Scale className="size-8 text-[#BF9874]" />
            <h1 className="font-heading text-3xl font-normal uppercase tracking-[0.25em] text-[#BF9874]">
              LexiCab
            </h1>
          </div>
          <div className="mx-auto mt-2 h-px w-16 bg-[#BF9874]/40" />
          <p className="mt-1 text-sm tracking-wider text-white/50">
            Cabinet d&apos;avocats d&apos;affaires
          </p>
        </div>

        {/* Login Card */}
        <Card className="rounded-none border-[#E5E2DC] bg-white shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="font-heading text-lg font-normal uppercase tracking-wider text-[#001025]">
              {mode === "signIn" ? "Connexion" : "Inscription"}
            </CardTitle>
            <CardDescription className="text-[#6B7280]">
              {mode === "signIn"
                ? "Accédez à votre espace de travail"
                : "Créez votre compte associé"}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="flex flex-col gap-4">
              {mode === "signUp" && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="name" className="text-xs uppercase tracking-wider text-[#6B7280]">
                    Nom complet
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Maître Dupont"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="rounded-none border-[#E5E2DC] focus-visible:ring-[#BF9874]"
                  />
                </div>
              )}
              <div className="flex flex-col gap-2">
                <Label htmlFor="email" className="text-xs uppercase tracking-wider text-[#6B7280]">
                  Adresse email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="avocat@lexicab.fr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="rounded-none border-[#E5E2DC] focus-visible:ring-[#BF9874]"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="password" className="text-xs uppercase tracking-wider text-[#6B7280]">
                  Mot de passe
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Votre mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete={mode === "signIn" ? "current-password" : "new-password"}
                  className="rounded-none border-[#E5E2DC] focus-visible:ring-[#BF9874]"
                />
              </div>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button
                className="w-full rounded-none border border-[#BF9874] bg-[#BF9874] text-sm font-medium uppercase tracking-wider text-[#001025] hover:bg-[#BF9874]/90"
                disabled={loading}
              >
                {loading
                  ? (mode === "signIn" ? "Connexion..." : "Inscription...")
                  : (mode === "signIn" ? "Se connecter" : "Créer le compte")}
              </Button>
              <button
                type="button"
                className="text-xs text-[#6B7280] hover:text-[#BF9874] transition-colors"
                onClick={() => {
                  setMode(mode === "signIn" ? "signUp" : "signIn");
                  setError("");
                }}
              >
                {mode === "signIn"
                  ? "Première connexion ? Créer un compte"
                  : "Déjà un compte ? Se connecter"}
              </button>
            </CardFooter>
          </form>
        </Card>

        {/* Footer accent */}
        <div className="mx-auto mt-8 h-px w-24 bg-[#BF9874]/20" />
      </div>
    </div>
  );
}
