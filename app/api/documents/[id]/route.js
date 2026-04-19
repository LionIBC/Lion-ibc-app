import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const CATEGORY_LABELS = {
  eingangsrechnung: 'Eingangsrechnungen',
  ausgangsrechnung: 'Ausgangsrechnungen',
  schreiben_allgemein: 'Schreiben allgemein',
  vertraege: 'Verträge',
  kontoauszuege: 'Kontoauszüge',
  stammdaten: 'Stammdaten',
  sonstiges: 'Sonstiges'
};

function mapDocument(row) {
  if (!row) return null;

  return {
    id: row.id,
    file_name: row.file_name || '',
    file_path: row.file_path || '',
    file_url: row.file_url || '',
    file_size: Number(row.file_size || 0),
    category: row.category || 'sonstiges',
    category_label: CATEGORY_LABELS[row.category] || 'Sonstiges',
    source: row.source || '',
    customer_id: row.customer_id || '',
    created_by: row.created_by || '',
    created_at: row.created_at || null,
    belegdatum: row.belegdatum || null,
    ocr_text: row.ocr_text || '',
    ocr_amount: row.ocr_amount ?? null,
    ocr_date: row.ocr_date || null,
    ocr_due_date: row.ocr_due_date || null,
    ocr_iban: row.ocr_iban || '',
    ocr_invoice_number: row.ocr_invoice_number || '',
    ocr_processed: Boolean(row.ocr_processed),
    ocr_mode: row.ocr_mode || '',
    matched_invoice_id: row.matched_invoice_id || null,
    matched_bank_transaction_id: row.matched_bank_transaction_id || null
  };
}

async function addSignedUrls(row) {
  let open_url = null;
  let download_url = null;

  if (row?.file_path) {
    const { data: openData } = await supabase.storage
      .from('documents')
      .createSignedUrl(row.file_path, 60 * 60);

    const { data: downloadData } = await supabase.storage
      .from('documents')
      .createSignedUrl(row.file_path, 60 * 60, {
        download: row.file_name || true
      });

    open_url = openData?.signedUrl || null;
    download_url = downloadData?.signedUrl || null;
  }

  return {
    ...mapDocument(row),
    open_url,
    download_url
  };
}

export async function GET(req, context) {
  try {
    const id = context?.params?.id;

    if (!id) {
      return NextResponse.json({ success: false, message: 'Dokument-ID fehlt.' }, { status: 400 });
    }

    const { data: document, error: documentError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .single();

    if (documentError || !document) {
      return NextResponse.json({ success: false, message: 'Dokument wurde nicht gefunden.' }, { status: 404 });
    }

    const { data: auditLogs, error: auditError } = await supabase
      .from('document_audit_logs')
      .select('*')
      .eq('document_id', id)
      .order('created_at', { ascending: false });

    if (auditError) throw new Error(auditError.message);

    const item = await addSignedUrls(document);

    return NextResponse.json({
      success: true,
      data: {
        document: item,
        audit_logs: auditLogs || []
      }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || 'Dokument konnte nicht geladen werden.' },
      { status: 500 }
    );
  }
}
