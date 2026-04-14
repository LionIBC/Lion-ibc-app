import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const body = await req.json();

    const {
      customer_id,
      order_id,
      series_id,
      invoice_type,
      issue_date,
      service_date,
      due_date,
      period_start,
      period_end,
      period_type,
      payment_method,
      payment_terms,
      notes,
      internal_notes,
      created_by,
      created_by_type,
      lines
    } = body;

    if (!customer_id) {
      return Response.json({ success: false, message: 'customer_id fehlt' }, { status: 400 });
    }

    const { data: invoice, error } = await supabase
      .from('invoice_documents')
      .insert({
        customer_id,
        order_id,
        series_id,
        invoice_type,
        issue_date,
        service_date,
        due_date,
        period_start,
        period_end,
        period_type,
        payment_method,
        payment_terms,
        notes,
        internal_notes,
        created_by,
        created_by_type
      })
      .select('*')
      .single();

    if (error) throw new Error(error.message);

    if (lines && lines.length) {
      const linePayload = lines.map((line) => ({
        invoice_id: invoice.id,
        service_catalog_id: line.service_catalog_id,
        description: line.description,
        quantity: line.quantity,
        unit_price: line.unit_price,
        discount_percent: line.discount_percent,
        tax_rate: line.tax_rate
      }));

      const { error: lineError } = await supabase
        .from('invoice_lines')
        .insert(linePayload);

      if (lineError) throw new Error(lineError.message);
    }

    return Response.json({ success: true, data: invoice });

  } catch (err) {
    return Response.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}

