export async function GET(req) {
  return new Response(JSON.stringify({ message: "Invoices API ready" }));
}
