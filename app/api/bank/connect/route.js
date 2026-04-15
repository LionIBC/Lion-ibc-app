import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.TRUELAYER_CLIENT_ID;
  const redirectUri = process.env.TRUELAYER_REDIRECT_URI;

  const baseUrl = "https://auth.truelayer-sandbox.com/connect/authorize";

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "info accounts balance transactions",
    providers: "uk-ob-all", // WICHTIG
    state: crypto.randomUUID(),
  });

  const url = `${baseUrl}?${params.toString()}`;

  return NextResponse.redirect(url);
}

