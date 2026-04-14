import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function mapRecurring(row) {
  if (!row) return null;

  return {
    id: row.id,
    customer_id: row.customer_id || null,
    template_invoice_id: row.template_invoice_id || null,
    interval: row.interval || 'monthly',
    execution_day: Number(row.execution_day || 1),
    period_logic: row.period_logic || 'current_month',
    active: row.active !== false,
    created_at: row.created_at || null
  };
}

export async function GET(req, { params }) {
  try {
    const id = params.id;

    const { data, error } = await supabase
      .from('recurring_invoices')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return Response.json(
        { success: false, message: 'Wiederkehrende Rechnung nicht gefunden.' },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      data: mapRecurring(data)
    });
  } catch (error) {
    return Response.json(
      { success: false, message: error.message || 'Datensatz konnte nicht geladen werden.' },
      { status: 500 }
    );
  }
}

export async function PATCH(req, { params }) {
  try {
    const id = params.id;
    const body = await req.json();

    const updatePayload = {};

    if (body.interval !== undefined) updatePayload.interval = String(body.interval || 'monthly');
    if (body.execution_day !== undefined) updatePayload.execution_day = Number(body.execution_day || 1);
    if (body.period_logic !== undefined) updatePayload.period_logic = String(body.period_logic || 'current_month');
    if (body.active !== undefined) updatePayload.active = Boolean(body.active);

    const { data, error } = await supabase
      .from('recurring_invoices')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) {
      return Response.json(
        { success: false, message: error?.message || 'Wiederkehrende Rechnung konnte nicht aktualisiert werden.' },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      data: mapRecurring(data)
    });
  } catch (error) {
    return Response.json(
      { success: false, message: error.message || 'Wiederkehrende Rechnung konnte nicht aktualisiert werden.' },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const id = params.id;

    const { error } = await supabase
      .from('recurring_invoices')
      .delete()
      .eq('id', id);

    if (error) {
      return Response.json(
        { success: false, message: error.message || 'Wiederkehrende Rechnung konnte nicht gelöscht werden.' },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      message: 'Wiederkehrende Rechnung gelöscht.'
    });
  } catch (error) {
    return Response.json(
      { success: false, message: error.message || 'Wiederkehrende Rechnung konnte nicht gelöscht werden.' },
      { status: 500 }
    );
  }
}

