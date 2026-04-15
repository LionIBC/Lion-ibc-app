// Datei: app/api/bank/callback/truelayer/route.js
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return Response.json({ error: "Kein Code" }, { status: 400 });
  }

  try {
    const tokenRes = await fetch("https://auth.truelayer-sandbox.com/connect/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        grant_type: "authorization_code",
        client_id: process.env.TRUELAYER_CLIENT_ID,
        client_secret: process.env.TRUELAYER_CLIENT_SECRET,
        redirect_uri: process.env.TRUELAYER_REDIRECT_URI,
        code
      })
    });

    const data = await tokenRes.json();

    return Response.json({
      success: true,
      data
    });

  } catch (err) {
    return Response.json({ error: "Token Fehler" }, { status: 500 });
  }
}
