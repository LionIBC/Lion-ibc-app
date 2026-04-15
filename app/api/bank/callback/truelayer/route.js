import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json({ error: "No code provided" }, { status: 400 });
    }

    // 👉 TOKEN EXCHANGE mit TrueLayer
    const tokenRes = await fetch("https://auth.truelayer-sandbox.com/connect/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: process.env.TRUELAYER_CLIENT_ID,
        client_secret: process.env.TRUELAYER_CLIENT_SECRET,
        redirect_uri: process.env.TRUELAYER_REDIRECT_URI,
        code,
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok) {
      console.error("Token error:", tokenData);
      return NextResponse.json(tokenData, { status: 400 });
    }

    console.log("✅ TOKEN:", tokenData);

    // 👉 OPTIONAL: hier speichern in DB

    return NextResponse.redirect("http://localhost:3000/app/bank?success=true");

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Callback failed" }, { status: 500 });
  }
}
