import { NextResponse } from 'next/server'; import { createClient } from '@supabase/supabase-js';

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

async function logDocumentAuditEventSafe({
  documentId,
  action,
  actor = 'system',
  actorType = 'system',
  note = '',
  payload = null
}) {
  try {
    await supabase.from('document_audit_logs').insert({
      document_id: documentId,
      action,
      actor,
      actor_type: actorType,
      note,
      payload,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('document audit insert failed', error);
  }
}

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

async function createSignedUrl(filePath, downloadName = null) {
  if (!filePath) return null;

  const options = downloadName ? { download: downloadName } : undefined;

  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(filePath, 60 * 60, options);

  if (error) {
    console.error('createSignedUrl error:', error.message);
    return null;
  }

  return data?.signedUrl || null;
}

async function getCustomerSnapshot(customerId) {
  if (!customerId) {
    return {
      kundennummer: null,
      kundenname: null
    };
  }

  const { data, error } = await supabase
    .from('customers')
    .select('id, kundennummer, firmenname')
    .eq('id', customerId)
    .single();

  if (error || !data) {
    throw new Error('Mandant konnte nicht geladen werden.');
  }

  return {
    kundennummer: data.kundennummer || null,
    kundenname: data.firmenname || null
  };
}

function mapDocument(row) {
  if (!row) return null;

  const parsedTransactions = Array.isArray(row.parsed_transactions)
    ? row.parsed_transactions
    : [];

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
    kundennummer: row.kundennummer || '',
    kundenname: row.kundenname || '',
    created_by: row.created_by || '',
    created_at: row.created_at || null,
    belegdatum: row.belegdatum || null,

    ocr_text: row.ocr_text || '',
    ocr_processed: Boolean(row.ocr_processed),
    ocr_mode: row.ocr_mode || '',
    ocr_document_type: row.ocr_document_type || '',
    ocr_confidence: row.ocr_confidence || '',
    ocr_sender_name: row.ocr_sender_name || '',
    ocr_recipient_name: row.ocr_recipient_name || '',

    ocr_invoice_number: row.ocr_invoice_number || '',
    ocr_net_amount: row.ocr_net_amount ?? null,
    ocr_vat_amount: row.ocr_vat_amount ?? null,
    ocr_vat_rate: row.ocr_vat_rate ?? null,
    ocr_gross_amount: row.ocr_gross_amount ?? null,
    ocr_amount: row.ocr_amount ?? null,
    ocr_date: row.ocr_date || null,
    ocr_due_date: row.ocr_due_date || null,
    ocr_iban: row.ocr_iban || '',

    matched_invoice_id: row.matched_invoice_id || null,
    matched_bank_transaction_id: row.matched_bank_transaction_id || null,

    parsed_transactions: parsedTransactions,
    csv_file_path: row.csv_file_path || ''
  };
}

async function addSignedUrls(rows) {
  const result = [];

  for (const row of rows || []) {
    const open_url = await createSignedUrl(row.file_path);
    const download_url = await createSignedUrl(
      row.file_path,
      row.file_name || 'dokument'
    );

    const csv_download_url = row.csv_file_path
      ? await createSignedUrl(
          row.csv_file_path,
          `${row.file_name || 'kontoauszug'}.csv`
        )
      : null;

    result.push({
      ...mapDocument(row),
      open_url,
      download_url,
      csv_download_url
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

    if (error) {
      throw new Error(error.message || 'Dokumente konnten nicht geladen werden.');
    }

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
          item.kundennummer,
          item.kundenname,
          item.ocr_invoice_number,
          item.ocr_document_type,
          item.ocr_sender_name,
          item.ocr_recipient_name
        ]
          .join(' ')
          .toLowerCase()
          .includes(q)
      );
    }

    return NextResponse.json({
      success: true,
      data: items
    });
  } catch (error) {
    console.error('GET /api/documents failed:', error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Dokumente konnten nicht geladen werden.'
      },
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
      return NextResponse.json(
        { success: false, message: 'Keine Dateien erhalten.' },
        { status: 400 }
      );
    }

    if (!category) {
      return NextResponse.json(
        { success: false, message: 'Bitte eine Dokumentart auswählen.' },
        { status: 400 }
      );
    }

    if (!customerId) {
      return NextResponse.json(
        { success: false, message: 'Bitte zuerst einen Mandanten auswählen.' },
        { status: 400 }
      );
    }

    const customerSnapshot = await getCustomerSnapshot(customerId);

    if (!customerSnapshot.kundennummer) {
      return NextResponse.json(
        { success: false, message: 'Für den ausgewählten Mandanten fehlt die Kundennummer.' },
        { status: 400 }
      );
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

      if (uploadError) {
        throw new Error(uploadError.message || 'Datei konnte nicht hochgeladen werden.');
      }

      const insertPayload = {
        file_name: file.name || 'Datei',
        file_path: filePath,
        file_url: '',
        file_size: Number(file.size || 0),
        category,
        source,
        customer_id: customerId,
        kundennummer: customerSnapshot.kundennummer,
        kundenname: customerSnapshot.kundenname,
        created_by: createdBy || null,
        belegdatum,
        created_at: new Date().toISOString()
      };

      const { data: insertedRow, error: dbError } = await supabase
        .from('documents')
        .insert(insertPayload)
        .select('*')
        .single();

      if (dbError || !insertedRow) {
        await supabase.storage.from('documents').remove([filePath]);
        throw new Error(dbError?.message || 'Dokument konnte nicht gespeichert werden.');
      }

      uploadedRows.push(insertedRow);

      await logDocumentAuditEventSafe({
        documentId: insertedRow.id,
        action: 'document_uploaded',
        actor: createdBy || 'mitarbeiter',
        actorType: 'user',
        note: 'Dokument wurde hochgeladen.',
        payload: {
          category,
          source,
          customer_id: customerId,
          kundennummer: customerSnapshot.kundennummer,
          kundenname: customerSnapshot.kundenname,
          file_name: file.name || 'Datei',
          file_size: Number(file.size || 0)
        }
      });

      try {
        const { runDocumentOCRById } = await import('./ocr/core.js');

        const ocrResult = await runDocumentOCRById(insertedRow.id);
        ocrResults.push({
          document_id: insertedRow.id,
          success: true,
          message: ocrResult.message
        });
      } catch (ocrError) {
        console.error('OCR after upload failed:', ocrError);

        await logDocumentAuditEventSafe({
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

    const ids = uploadedRows.map((row) => row.id).filter(Boolean);

    let freshRows = uploadedRows;

    if (ids.length > 0) {
      const { data: refreshed, error: refreshError } = await supabase
        .from('documents')
        .select('*')
        .in('id', ids);

      if (!refreshError && refreshed) {
        freshRows = refreshed;
      }
    }

    const withUrls = await addSignedUrls(freshRows);

    return NextResponse.json({
      success: true,
      message: 'Upload erfolgreich. OCR wurde automatisch gestartet.',
      data: withUrls,
      ocr_results: ocrResults
    });
  } catch (error) {
    console.error('POST /api/documents failed:', error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Upload fehlgeschlagen.'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Dokument-ID fehlt.' },
        { status: 400 }
      );
    }

    const { data: existingDoc, error: loadError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .single();

    if (loadError || !existingDoc) {
      return NextResponse.json(
        { success: false, message: 'Dokument wurde nicht gefunden.' },
        { status: 404 }
      );
    }

    await logDocumentAuditEventSafe({
      documentId: existingDoc.id,
      action: 'document_delete_requested',
      actor: 'mitarbeiter',
      actorType: 'user',
      note: 'Löschung wurde ausgelöst.'
    });

    const removePaths = [existingDoc.file_path, existingDoc.csv_file_path].filter(Boolean);

    if (removePaths.length > 0) {
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove(removePaths);

      if (storageError) {
        throw new Error(storageError.message || 'Datei konnte nicht gelöscht werden.');
      }
    }

    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw new Error(deleteError.message || 'Dokument konnte nicht gelöscht werden.');
    }

    return NextResponse.json({
      success: true,
      message: 'Dokument wurde gelöscht.'
    });
  } catch (error) {
    console.error('DELETE /api/documents failed:', error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Dokument konnte nicht gelöscht werden.'
      },
      { status: 500 }
    );
  }
}

