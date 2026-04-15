import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export async function POST(req) {
  try {
    const body = await req.json();

    const { transaction_id, invoice_id } = body;

    if (!transaction_id || !invoice_id) {
      throw new Error('transaction_id oder invoice_id fehlt.');
    }

    const { data: transaction, error: txError } = await supabase
      .from('bank_transactions')
      .select('*')
      .eq('id', transaction_id)
      .single();

    if (txError || !transaction) {
      throw new Error('Transaktion nicht gefunden.');
    }

    const { data: invoice, error: invError } = await supabase
      .from('invoice_documents')
      .select('*')
      .eq('id', invoice_id)
      .single();

    if (invError || !invoice) {
      throw new Error('Rechnung nicht gefunden.');
    }

    const { data: existingPayment } = await supabase
      .from('invoice_payments')
      .select('id')
      .eq('bank_transaction_id', transaction.id)
      .limit(1)
      .maybeSingle();

    if (!existingPayment) {
      const { error: paymentError } = await supabase.from('invoice_payments').insert({
        invoice_id: invoice.id,
        payment_date: transaction.booking_date,
        amount: Math.abs(toNumber(transaction.amount)),
        currency: transaction.currency || 'EUR',
        payment_source: 'manual_match',
        reference: transaction.remittance_information || transaction.bank_reference,
        bank_transaction_id: transaction.id,
        is_manual: true
      });

      if (paymentError) {
        throw new Error(paymentError.message || 'Zahlung konnte nicht gespeichert werden.');
      }
    }

    const { data: payments, error: paymentsError } = await supabase
      .from('invoice_payments')
      .select('*')
      .eq('invoice_id', invoice.id);

    if (paymentsError) {
      throw new Error(paymentsError.message || 'Zahlungen konnten nicht geladen werden.');
    }

    const paid = (payments || []).reduce(
      (sum, p) => sum + Math.abs(toNumber(p.amount)),
      0
    );

    const total = Math.abs(toNumber(invoice.total));

    let newStatus = 'part_paid';
    if (paid >= total) newStatus = 'paid';

    const { error: invoiceUpdateError } = await supabase
      .from('invoice_documents')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', invoice.id);

    if (invoiceUpdateError) {
      throw new Error(invoiceUpdateError.message || 'Rechnung konnte nicht aktualisiert werden.');
    }

    const { error: txUpdateError } = await supabase
      .from('bank_transactions')
      .update({
        matched_invoice_id: invoice.id,
        match_status: 'manual_matched',
        suggested_invoice_id: invoice.id,
        suggested_invoice_number: invoice.invoice_number || null,
        suggested_customer_name: invoice.kundenname || null
      })
      .eq('id', transaction.id);

    if (txUpdateError) {
      throw new Error(txUpdateError.message || 'Banktransaktion konnte nicht aktualisiert werden.');
    }

    await supabase
      .from('invoice_events')
      .insert({
        invoice_id: invoice.id,
        event_type: 'manual_payment_match',
        event_label: 'Zahlung manuell zugewiesen',
        actor: 'intern',
        actor_type: 'user',
        payload: {
          bank_transaction_id: transaction.id,
          amount: Math.abs(toNumber(transaction.amount)),
          new_status: newStatus
        }
      });

    return Response.json({
      success: true,
      message: 'Rechnung erfolgreich zugewiesen'
    });
  } catch (error) {
    return Response.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

