// Datei: app/api/bank/connect/route.js
export async function GET() {
  const url = `https://auth.truelayer-sandbox.com/?response_type=code
&client_id=${process.env.TRUELAYER_CLIENT_ID}
&scope=info accounts balance transactions
&redirect_uri=${process.env.TRUELAYER_REDIRECT_URI}
&providers=uk-ob-all uk-oauth-all es-ob-all`;

  return Response.json({ url });
}
