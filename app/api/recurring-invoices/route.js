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
    execution_day: row.execution_day || 1,
    period_logic: row.period_logic || 'current_month',
    active: row.active !== false,
    created_at: row.created_at || null
  };
}

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const customerId = url.searchParams.get('customer_id') || '';
    const activeOnly = url.searchParams.get('active_only') || '';

    let query = supabase
      .from('recurring_invoices')
      .select('*')
      .order('created_at', { ascending: false });

    if (customerId) query = query.eq('customer_id', customerId);
    if (activeOnly === 'true') query = query.eq('active', true);

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return Response.json({
      success: true,
      data: (data || []).map(mapRecurring)
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: error.message || 'Wiederkehrende Rechnungen konnten nicht geladen werden.'
      },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();

    const customerId = String(body.customer_id || '').trim();
    const templateInvoiceId = String(body.template_invoice_id || '').trim();
    const interval = String(body.interval || '').trim();
    const periodLogic = String(body.period_logic || '').trim();
    const executionDay = Number(body.execution_day || 0);

    if (!customerId) {
      return Response.json(
        { success: false, message: 'customer_id fehlt.' },
        { status: 400 }
      );
    }

    if (!templateInvoiceId) {
      return Response.json(
        { success: false, message: 'template_invoice_id fehlt.' },
        { status: 400 }
      );
    }

    if (!interval) {
      return Response.json(
        { success: false, message: 'interval fehlt.' },
        { status: 400 }
      );
    }

    if (!periodLogic) {
      return Response.json(
        { success: false, message: 'period_logic fehlt.' },
        { status: 400 }
      );
    }

    if (!Number.isFinite(executionDay) || executionDay < 1 || executionDay > 31) {
      return Response.json(
        { success: false, message: 'execution_day muss zwischen 1 und 31 liegen.' },
        { status: 400 }
      );
    }

    const payload = {
      customer_id: customerId,
      template_invoice_id: templateInvoiceId,
      interval,
      execution_day: executionDay,
      period_logic: periodLogic,
      active: body.active !== false
    };

    const { data, error } = await supabase
      .from('recurring_invoices')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return Response.json({
      success: true,
      data: mapRecurring(data)
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: error.message || 'Wiederkehrende Rechnung konnte nicht erstellt werden.'
      },
      { status: 500 }
    );
  }
}
