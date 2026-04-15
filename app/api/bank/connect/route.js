import { NextResponse } from "next/server";

export async function GET() {
  try {
    const clientId = process.env.TRUELAYER_CLIENT_ID;
    const redirectUri = process.env.TRUELAYER_REDIRECT_URI;
    const env = process.env.TRUELAYER_ENV || "sandbox";

    if (!clientId || !redirectUri) {
      return NextResponse.json(
        { success: false, message: "TRUELAYER_CLIENT_ID oder TRUELAYER_REDIRECT_URI fehlt." },
        { status: 500 }
      );
    }

    const baseUrl =
      env === "live"
        ? "https://auth.truelayer.com/"
        : "https://auth.truelayer-sandbox.com/";

    const state = crypto.randomUUID();

    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: "info accounts balance transactions",
      state,
      providers: "es-ob-all"
    });

    const url = `${baseUrl}?${params.toString()}`;

    return NextResponse.json({
      success: true,
      url
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Connect-Link konnte nicht erstellt werden." },
      { status: 500 }
    );
  }
}
