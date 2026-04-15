const JOB_SECRET = process.env.SYSTEM_JOB_SECRET || '';

async function postInternal(req, path, body = {}) {
  const protocol = req.headers.get('x-forwarded-proto') || 'https';
  const host = req.headers.get('host');

  if (!host) {
    throw new Error('Host Header fehlt.');
  }

  const url = `${protocol}://${host}${path}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(JOB_SECRET ? { 'x-job-secret': JOB_SECRET } : {})
    },
    body: JSON.stringify(body),
    cache: 'no-store'
  });

  const text = await res.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  return {
    ok: res.ok,
    status: res.status,
    data
  };
}

function isAuthorized(req) {
  if (!JOB_SECRET) return true;
  return req.headers.get('x-job-secret') === JOB_SECRET;
}

export async function POST(req) {
  try {
    if (!isAuthorized(req)) {
      return Response.json(
        { success: false, message: 'Nicht autorisiert.' },
        { status: 401 }
      );
    }

    const recurring = await postInternal(req, '/api/recurring-invoices/run', {});
    const reminders = await postInternal(req, '/api/reminders/run', {});
    const bank = await postInternal(req, '/api/bank/sync', { run_type: 'scheduled' });
    const emails = await postInternal(req, '/api/emails/send-pending', {});

    return Response.json({
      success: true,
      jobs: {
        recurring,
        reminders,
        bank,
        emails
      }
    });
  } catch (error) {
    return Response.json(
      { success: false, message: error.message || 'Job-Runner fehlgeschlagen.' },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  return POST(req);
}
