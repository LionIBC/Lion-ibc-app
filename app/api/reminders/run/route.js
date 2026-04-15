import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function daysOverdue(dueDate) {
  if (!dueDate) return 0;
  const due = new Date(dueDate);
  const today = new Date();
  due.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diffMs = today.getTime() - due.getTime();
  return Math.floor(diffMs / 86400000);
}

function getReminderLevel(days) {
  if (days >= 21) return 3;
  if (days >= 14) return 2;
  if (days >= 7) return 1;
  return 0;
}

function getFeeAmount(level) {
  if (level === 3) return 15;
  if (level === 2) return 10;
  if (level === 1) return 5;
  return 0;
}

async function getExistingHighestReminder(invoiceId) {
  const { data, error } = await supabase
    .from('invoice_reminders')
    .select('level')
    .eq('invoice_id', invoiceId)
    .order('level', { ascending: false })
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  if (!data || data.length === 0) return 0;
  return Number(data[0].level || 0);
}

async function createReminder(invoice, level, overdueDays) {
  const feeAmount = getFeeAmount(level);
  const reminderDate = new Date().toISOString().slice(0, 10);

  const { data: reminderRow, error: reminderError } = await supabase
    .from('invoice_reminders')
    .insert({
      invoice_id: invoice.id,
      level,
      reminder_date: reminderDate,
      fee_amount: feeAmount,
      interest_amount: 0,
      status: 'created',
      channel: 'email',
      note: `Automatisch erzeugte Mahnung, ${overdueDays} Tage überfällig`
    })
    .select('*')
    .single();

  if (reminderError || !reminderRow) {
    throw new Error(reminderError?.message || 'Mahnung konnte nicht erstellt werden.');
  }

  const { error: invoiceError } = await supabase
    .from('invoice_documents')
    .update({
      status: 'overdue',
      updated_at: new Date().toISOString()
    })
    .eq('id', invoice.id);

  if (invoiceError) {
    throw new Error(invoiceError.message);
  }

  const { error: eventError } = await supabase
    .from('invoice_events')
    .insert({
      invoice_id: invoice.id,
      event_type: 'reminder_created',
      event_label: `Mahnung Stufe ${level} erstellt`,
      actor: 'system',
      actor_type: 'system',
      payload: {
        reminder_level: level,
        overdue_days: overdueDays,
        fee_amount: feeAmount
      }
    });

  if (eventError) {
    throw new Error(eventError.message);
  }

  return reminderRow;
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const force = Boolean(body.force);

    const { data: invoices, error } = await supabase
      .from('invoice_documents')
      .select('*')
      .in('status', ['final', 'issued', 'approved', 'part_paid', 'overdue']);

    if (error) {
      throw new Error(error.message);
    }

    const created = [];
    const skipped = [];

    for (const invoice of invoices || []) {
      if (invoice.cancelled) {
        skipped.push({ invoice_id: invoice.id, reason: 'storniert' });
        continue;
      }

      const overdue = daysOverdue(invoice.due_date);
      const targetLevel = force ? Math.max(getReminderLevel(overdue), 1) : getReminderLevel(overdue);

      if (targetLevel === 0) {
        skipped.push({ invoice_id: invoice.id, reason: 'nicht überfällig' });
        continue;
      }

      const existingLevel = await getExistingHighestReminder(invoice.id);

      if (!force && existingLevel >= targetLevel) {
        skipped.push({ invoice_id: invoice.id, reason: 'Mahnstufe bereits vorhanden' });
        continue;
      }

      const nextLevel = force ? targetLevel : Math.max(existingLevel + 1, targetLevel);

      const reminder = await createReminder(invoice, nextLevel, overdue);
      created.push({
        invoice_id: invoice.id,
        reminder_id: reminder.id,
        level: nextLevel
      });
    }

    return Response.json({
      success: true,
      created_count: created.length,
      skipped_count: skipped.length,
      created,
      skipped
    });
  } catch (error) {
    return Response.json(
      { success: false, message: error.message || 'Mahnlauf fehlgeschlagen.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('invoice_reminders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      throw new Error(error.message);
    }

    return Response.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    return Response.json(
      { success: false, message: error.message || 'Mahnungen konnten nicht geladen werden.' },
      { status: 500 }
    );
  }
}
