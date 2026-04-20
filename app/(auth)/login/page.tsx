"use client";

import { useState, FormEvent } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
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
      const params: Record<string, string> = { email, password, flow: mode };
      if (mode === "signUp" && name.trim()) {
        params.name = name.trim();
      }
      await signIn("password", params);
      router.push("/dashboard");
    } catch {
      if (mode === "signIn") {
        setError("Identifiants incorrects. Veuillez réessayer.");
      } else {
        setError(
          "Erreur lors de l'inscription. Ce compte existe peut-être déjà."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-sidebar px-4 py-12">
      {/* Decorative accent */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, oklch(0.67 0.075 65 / 0.06), transparent 60%)",
        }}
      />

      <div className="relative w-full max-w-sm">
        {/* Branding */}
        <div className="mb-10 flex flex-col items-center gap-4 text-center">
          <span className="flex size-12 items-center justify-center rounded-lg bg-sidebar-primary/10 ring-1 ring-sidebar-primary/25">
            <Scale className="size-5 text-sidebar-primary" />
          </span>
          <div className="flex flex-col gap-1">
            <h1 className="font-heading text-3xl uppercase tracking-[0.22em] text-sidebar-foreground">
              LexiCab
            </h1>
            <div className="mx-auto h-px w-14 bg-sidebar-primary/40" />
            <p className="text-[0.7rem] uppercase tracking-[0.2em] text-sidebar-foreground/55">
              Cabinet d&apos;avocats d&apos;affaires
            </p>
          </div>
        </div>

        {/* Login card */}
        <div className="rounded-lg bg-surface p-6 shadow-elevated ring-1 ring-border-subtle">
          <div className="mb-5 flex flex-col gap-1">
            <h2 className="font-heading text-xl text-text-strong">
              {mode === "signIn" ? "Connexion" : "Inscription"}
            </h2>
            <p className="text-sm text-text-muted">
              {mode === "signIn"
                ? "Accédez à votre espace de travail."
                : "Créez votre compte associé."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === "signUp" && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">Nom complet</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Maître Dupont"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Adresse email</Label>
              <Input
                id="email"
                type="email"
                placeholder="avocat@lexicab.fr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="Votre mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={
                  mode === "signIn" ? "current-password" : "new-password"
                }
              />
            </div>
            {error && (
              <p className="rounded-md bg-status-danger/60 px-3 py-2 text-sm text-status-danger-fg ring-1 ring-inset ring-status-danger-fg/10">
                {error}
              </p>
            )}
            <Button type="submit" disabled={loading} className="mt-1 w-full">
              {loading
                ? mode === "signIn"
                  ? "Connexion…"
                  : "Inscription…"
                : mode === "signIn"
                  ? "Se connecter"
                  : "Créer le compte"}
            </Button>
            <button
              type="button"
              className="mt-1 text-center text-xs text-text-muted transition-colors hover:text-gold"
              onClick={() => {
                setMode(mode === "signIn" ? "signUp" : "signIn");
                setError("");
              }}
            >
              {mode === "signIn"
                ? "Première connexion ? Créer un compte"
                : "Déjà un compte ? Se connecter"}
            </button>
          </form>
        </div>

        <div className="mx-auto mt-10 h-px w-20 bg-sidebar-primary/20" />
      </div>
    </div>
  );
}
