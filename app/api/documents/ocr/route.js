import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logDocumentAuditEvent, runDocumentOCRById } from './core';

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

function sanitizeFileName(name) {
  return String(name || 'datei')
    .normalize('NFKD')
    .replace(/[^\w.\-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function buildStoragePath(customerId, category, fileName) {
  const safeName = sanitizeFileName(fileName);
  const safeCustomer = sanitizeFileName(customerId || 'allgemein');
  const safeCategory = sanitizeFileName(category || 'sonstiges');
  const uniquePart = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `${safeCustomer}/${safeCategory}/${uniquePart}-${safeName}`;
}

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

async function addSignedUrls(rows) {
  const result = [];

  for (const row of rows || []) {
    let open_url = null;
    let download_url = null;

    if (row.file_path) {
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

    result.push({
      ...mapDocument(row),
      open_url,
      download_url
    });
  }

  return result;
}

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const source = url.searchParams.get('source') || '';
    const customerId = url.searchParams.get('customer_id') || '';
    const category = url.searchParams.get('category') || '';
    const q = (url.searchParams.get('q') || '').trim().toLowerCase();
    const belegdatumFrom = url.searchParams.get('belegdatum_from') || '';
    const belegdatumTo = url.searchParams.get('belegdatum_to') || '';
    const createdFrom = url.searchParams.get('created_from') || '';
    const createdTo = url.searchParams.get('created_to') || '';

    let query = supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (source) query = query.eq('source', source);
    if (customerId) query = query.eq('customer_id', customerId);
    if (category) query = query.eq('category', category);
    if (belegdatumFrom) query = query.gte('belegdatum', belegdatumFrom);
    if (belegdatumTo) query = query.lte('belegdatum', belegdatumTo);
    if (createdFrom) query = query.gte('created_at', `${createdFrom}T00:00:00.000Z`);
    if (createdTo) query = query.lte('created_at', `${createdTo}T23:59:59.999Z`);

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    let items = await addSignedUrls(data || []);

    if (q) {
      items = items.filter((item) =>
        [
          item.file_name,
          item.category,
          item.category_label,
          item.created_by,
          item.source,
          item.customer_id,
          item.ocr_invoice_number
        ].join(' ').toLowerCase().includes(q)
      );
    }

    return NextResponse.json({ success: true, data: items });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || 'Dokumente konnten nicht geladen werden.' },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('files');
    const source = String(formData.get('source') || 'unknown').trim();
    const category = String(formData.get('category') || '').trim();
    const customerId = String(formData.get('customer_id') || '').trim();
    const createdBy = String(formData.get('created_by') || source).trim();
    const belegdatum = String(formData.get('belegdatum') || '').trim() || null;

    if (!files || files.length === 0) {
      return NextResponse.json({ success: false, message: 'Keine Dateien erhalten.' }, { status: 400 });
    }

    if (!category) {
      return NextResponse.json({ success: false, message: 'Bitte eine Dokumentart auswählen.' }, { status: 400 });
    }

    const uploadedRows = [];
    const ocrResults = [];

    for (const file of files) {
      if (!file || typeof file.arrayBuffer !== 'function') continue;

      const buffer = Buffer.from(await file.arrayBuffer());
      const filePath = buildStoragePath(customerId, category, file.name);

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, buffer, {
          contentType: file.type || 'application/octet-stream',
          upsert: false
        });

      if (uploadError) throw new Error(uploadError.message);

      const { data: insertedRow, error: dbError } = await supabase
        .from('documents')
        .insert({
          file_name: file.name || 'Datei',
          file_path: filePath,
          file_url: '',
          file_size: Number(file.size || 0),
          category,
          source,
          customer_id: customerId || null,
          created_by: createdBy || null,
          belegdatum,
          created_at: new Date().toISOString()
        })
        .select('*')
        .single();

      if (dbError) {
        await supabase.storage.from('documents').remove([filePath]);
        throw new Error(dbError.message);
      }

      uploadedRows.push(insertedRow);

      await logDocumentAuditEvent({
        documentId: insertedRow.id,
        action: 'document_uploaded',
        actor: createdBy || 'mitarbeiter',
        actorType: 'user',
        note: 'Dokument wurde hochgeladen.',
        payload: {
          category,
          source,
          customer_id: customerId || null,
          file_name: file.name || 'Datei',
          file_size: Number(file.size || 0)
        }
      });

      try {
        const ocrResult = await runDocumentOCRById(insertedRow.id);
        ocrResults.push({
          document_id: insertedRow.id,
          success: true,
          message: ocrResult.message
        });
      } catch (ocrError) {
        await logDocumentAuditEvent({
          documentId: insertedRow.id,
          action: 'ocr_failed',
          actor: 'system',
          actorType: 'system',
          note: ocrError.message || 'OCR beim Upload fehlgeschlagen.'
        });

        ocrResults.push({
          document_id: insertedRow.id,
          success: false,
          message: ocrError.message || 'OCR beim Upload fehlgeschlagen.'
        });
      }
    }

    const { data: freshRows, error: freshError } = await supabase
      .from('documents')
      .select('*')
      .in('id', uploadedRows.map((row) => row.id));

    if (freshError) throw new Error(freshError.message);

    const withUrls = await addSignedUrls(freshRows || uploadedRows);

    return NextResponse.json({
      success: true,
      message: 'Upload erfolgreich. OCR wurde automatisch gestartet.',
      data: withUrls,
      ocr_results: ocrResults
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || 'Upload fehlgeschlagen.' },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Dokument-ID fehlt.' }, { status: 400 });
    }

    const { data: existingDoc, error: loadError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .single();

    if (loadError || !existingDoc) {
      return NextResponse.json({ success: false, message: 'Dokument wurde nicht gefunden.' }, { status: 404 });
    }

    await logDocumentAuditEvent({
      documentId: existingDoc.id,
      action: 'document_delete_requested',
      actor: 'mitarbeiter',
      actorType: 'user',
      note: 'Löschung wurde ausgelöst.'
    });

    if (existingDoc.file_path) {
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([existingDoc.file_path]);

      if (storageError) throw new Error(storageError.message);
    }

    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);

    if (deleteError) throw new Error(deleteError.message);

    return NextResponse.json({ success: true, message: 'Dokument wurde gelöscht.' });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || 'Dokument konnte nicht gelöscht werden.' },
      { status: 500 }
    );
  }
}
