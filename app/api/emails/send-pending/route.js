import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const JOB_SECRET = process.env.SYSTEM_JOB_SECRET || '';

function isAuthorized(req) {
  if (!JOB_SECRET) return true;
  return req.headers.get('x-job-secret') === JOB_SECRET;
}

async function postInternal(req, path, body = {}) {
  const protocol = req.headers.get('x-forwarded-proto') || 'https';
  const host = req.headers.get('host');

  if (!host) throw new Error('Host Header fehlt.');

  const res = await fetch(`${protocol}://${host}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(JOB_SECRET ? { 'x-job-secret': JOB_SECRET } : {})
    },
    body: JSON.stringify(body),
    cache: 'no-store'
  });

  const data = await res.json();
  return { ok: res.ok, data };
}

export async function POST(req) {
  try {
    if (!isAuthorized(req)) {
      return Response.json(
        { success: false, message: 'Nicht autorisiert.' },
        { status: 401 }
      );
    }

    const sent = [];
    const skipped = [];

    const { data: reminders, error: reminderError } = await supabase
      .from('invoice_reminders')
      .select('*')
      .eq('status', 'created')
      .eq('auto_send', true)
      .order('created_at', { ascending: true });

    if (reminderError) {
      throw new Error(reminderError.message);
    }

    for (const reminder of reminders || []) {
      const result = await postInternal(req, '/api/emails/send-document', {
        document_type: 'reminder',
        document_id: reminder.id
      });

      if (result.ok) {
        sent.push({ type: 'reminder', id: reminder.id });
      } else {
        skipped.push({ type: 'reminder', id: reminder.id, reason: result.data?.message || 'Versand fehlgeschlagen' });
      }
    }

    return Response.json({
      success: true,
      sent_count: sent.length,
      skipped_count: skipped.length,
      sent,
      skipped
    });
  } catch (error) {
    return Response.json(
      { success: false, message: error.message || 'Pending E-Mails konnten nicht versendet werden.' },
      { status: 500 }
    );
  }
}
