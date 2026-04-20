import { NextRequest, NextResponse } from "next/server";

/**
 * Callback OAuth2 Pennylane.
 *
 * Flow attendu :
 * 1. L'utilisateur clique "Connecter Pennylane" depuis /dashboard
 * 2. Il est redirigé vers https://app.pennylane.com/oauth/authorize
 *    avec client_id, redirect_uri, scope, state
 * 3. Pennylane le renvoie ici avec ?code=... &state=...
 * 4. On échange le code contre un access_token + refresh_token
 * 5. On stocke les tokens dans Convex (table `integrationsTokens`)
 * 6. On redirige vers /dashboard
 *
 * État actuel : scaffolding. Le stockage Convex des tokens doit être
 * câblé quand les credentials Pennylane (PENNYLANE_CLIENT_ID /
 * PENNYLANE_CLIENT_SECRET) seront fournis par le cabinet.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const origin = req.nextUrl.origin;

  if (error) {
    return NextResponse.redirect(
      `${origin}/dashboard?pennylane_error=${encodeURIComponent(error)}`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${origin}/dashboard?pennylane_error=missing_code`
    );
  }

  const clientId = process.env.PENNYLANE_CLIENT_ID;
  const clientSecret = process.env.PENNYLANE_CLIENT_SECRET;
  const redirectUri = process.env.PENNYLANE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    // Configuration manquante — on ne peut pas échanger le code.
    return NextResponse.redirect(
      `${origin}/dashboard?pennylane_error=not_configured`
    );
  }

  try {
    const tokenRes = await fetch("https://app.pennylane.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "authorization_code",
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
      cache: "no-store",
    });

    if (!tokenRes.ok) {
      const details = await tokenRes.text();
      console.error("[pennylane] token exchange failed", tokenRes.status, details);
      return NextResponse.redirect(
        `${origin}/dashboard?pennylane_error=token_exchange`
      );
    }

    // TODO : persister les tokens via une action Convex dédiée une fois
    //        le schéma `integrationsTokens` branché. Ne JAMAIS loguer les
    //        tokens eux-mêmes.
    // const { access_token, refresh_token, expires_in } = await tokenRes.json();

    return NextResponse.redirect(
      `${origin}/dashboard?pennylane=connected${state ? `&state=${state}` : ""}`
    );
  } catch (e) {
    console.error("[pennylane] callback error", (e as Error).message);
    return NextResponse.redirect(
      `${origin}/dashboard?pennylane_error=network`
    );
  }
}
