import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error,
          error_description: errorDescription || "TrueLayer hat einen Fehler zurückgegeben."
        },
        { status: 400 }
      );
    }

    if (!code) {
      return NextResponse.json(
        { success: false, message: "Kein Code von TrueLayer erhalten." },
        { status: 400 }
      );
    }

    const env = process.env.TRUELAYER_ENV || "sandbox";
    const tokenUrl =
      env === "live"
        ? "https://auth.truelayer.com/connect/token"
        : "https://auth.truelayer-sandbox.com/connect/token";

    const tokenRes = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: process.env.TRUELAYER_CLIENT_ID,
        client_secret: process.env.TRUELAYER_CLIENT_SECRET,
        redirect_uri: process.env.TRUELAYER_REDIRECT_URI,
        code
      }).toString()
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok) {
      return NextResponse.json(
        {
          success: false,
          message: "Token-Austausch fehlgeschlagen.",
          details: tokenData
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      tokenData
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Callback fehlgeschlagen." },
      { status: 500 }
    );
  }
}
