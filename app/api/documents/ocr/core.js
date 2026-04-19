import { createClient } from '@supabase/supabase-js';
import Tesseract from 'tesseract.js';
import pdfParse from 'pdf-parse';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function logDocumentAuditEvent({
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

function toNumber(value, fallback = 0) {
  const cleaned = String(value || '')
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
    .trim();

  const n = Number(cleaned);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeText(value) {
  return String(value || '').toLowerCase().trim();
}

function parseEuropeanDate(value) {
  if (!value) return null;

  const normalized = String(value).trim();
  const match = normalized.match(/^(\d{2})[.\-/](\d{2})[.\-/](\d{4})$/);

  if (!match) return null;

  return `${match[3]}-${match[2]}-${match[1]}`;
}

function extractInvoiceNumber(text) {
  const patterns = [
    /(?:rechnungsnummer|rechnung\s*nr\.?|invoice\s*(?:no\.?|number)|factura\s*(?:nr\.?|n[Ãºu]mero))\s*[:#-]?\s*([A-Z0-9\-\/]+)/i,
    /\b([A-Z]{1,6}-\d{3,12})\b/,
    /\b(RG[-\/]?\d{3,}|RE[-\/]?\d{3,}|INV[-\/]?\d{3,})\b/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim();
  }

  return null;
}

function extractAmount(text) {
  const patterns = [
    /(?:gesamtbetrag|gesamt|summe|total|importe\s*total|zu\s*zahlen)\s*[:\-]?\s*([0-9\.\,]+)\s?(?:â¬|eur)?/i,
    /([0-9\.\,]+)\s?(?:â¬|eur)/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const value = toNumber(match[1], null);
      if (value !== null) return value;
    }
  }

  return null;
}

function extractDate(text) {
  const patterns = [
    /(?:rechnungsdatum|datum|invoice\s*date|fecha)\s*[:\-]?\s*(\d{2}[.\-/]\d{2}[.\-/]\d{4})/i,
    /\b(\d{2}[.\-/]\d{2}[.\-/]\d{4})\b/
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const iso = parseEuropeanDate(match[1]);
      if (iso) return iso;
    }
  }

  return null;
}

function extractDueDate(text) {
  const patterns = [
    /(?:fÃ¤llig\s*am|zahlbar\s*bis|due\s*date|fecha\s*de\s*vencimiento)\s*[:\-]?\s*(\d{2}[.\-/]\d{2}[.\-/]\d{4})/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const iso = parseEuropeanDate(match[1]);
      if (iso) return iso;
    }
  }

  return null;
}

function extractIban(text) {
  const compact = String(text || '').replace(/\s+/g, '');
  const match = compact.match(/\b([A-Z]{2}\d{2}[A-Z0-9]{10,30})\b/i);
  return match?.[1]?.toUpperCase() || null;
}

async function getDocument(documentId) {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', documentId)
    .single();

  if (error || !data) {
    throw new Error('Dokument wurde nicht gefunden.');
  }

  return data;
}

async function downloadDocument(filePath) {
  const { data, error } = await supabase.storage
    .from('documents')
    .download(filePath);

  if (error || !data) {
    throw new Error(error?.message || 'Dokument konnte nicht geladen werden.');
  }

  return data;
}

async function extractTextFromFile(file, fileName) {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const lowerName = String(fileName || '').toLowerCase();
  const mimeType = file.type || '';

  if (mimeType === 'application/pdf' || lowerName.endsWith('.pdf')) {
    try {
      const parsed = await pdfParse(buffer);
      const text = String(parsed?.text || '').trim();

      if (text) {
        return { text, mode: 'pdf_text' };
      }
    } catch (error) {
      // handled below
    }

    throw new Error(
      'Dieses Paket verarbeitet PDF mit eingebettetem Text. FÃ¼r gescannte PDF-OCR bitte zusÃ¤tzlich das Renderer-Paket einbauen.'
    );
  }

  const { data: ocrResult } = await Tesseract.recognize(buffer, 'deu+eng+spa');
  return { text: String(ocrResult?.text || '').trim(), mode: 'image_ocr' };
}

async function findInvoiceMatch(ocrData) {
  const { invoiceNumber, amount } = ocrData;

  if (invoiceNumber) {
    const { data } = await supabase
      .from('invoice_documents')
      .select('*')
      .ilike('invoice_number', `%${invoiceNumber}%`)
      .limit(1);

    if (data?.[0]) {
      return { invoice: data[0], matchType: 'invoice_number' };
    }
  }

  if (amount !== null) {
    const { data } = await supabase
      .from('invoice_documents')
      .select('*')
      .in('status', ['draft', 'approved', 'issued', 'final', 'part_paid', 'overdue']);

    const match = (data || []).find((row) => {
      const total = Math.abs(toNumber(row.total, 0));
      return total === Math.abs(toNumber(amount, 0));
    });

    if (match) {
      return { invoice: match, matchType: 'amount' };
    }
  }

  return { invoice: null, matchType: null };
}

async function findBankTransactionMatch(ocrData, invoice) {
  const { amount, iban, invoiceNumber } = ocrData;

  const { data } = await supabase
    .from('bank_transactions')
    .select('*')
    .order('booking_date', { ascending: false })
    .limit(200);

  const transactions = data || [];

  const byInvoiceNumber = transactions.find((row) => {
    const ref = normalizeText(`${row.remittance_information || ''} ${row.bank_reference || ''}`);
    const amountMatches = amount !== null && Math.abs(toNumber(row.amount, 0)) === Math.abs(toNumber(amount, 0));
    return invoiceNumber && amountMatches && ref.includes(normalizeText(invoiceNumber));
  });

  if (byInvoiceNumber) return byInvoiceNumber;

  const bySuggestedInvoice = transactions.find((row) => {
    const amountMatches = amount !== null && Math.abs(toNumber(row.amount, 0)) === Math.abs(toNumber(amount, 0));
    return invoice?.id && row.suggested_invoice_id === invoice.id && amountMatches;
  });

  if (bySuggestedInvoice) return bySuggestedInvoice;

  return transactions.find((row) => {
    const ibanMatch = iban && normalizeText(row.iban || row.account_iban || '').includes(normalizeText(iban));
    const amountMatch = amount !== null && Math.abs(toNumber(row.amount, 0)) === Math.abs(toNumber(amount, 0));
    return ibanMatch || amountMatch;
  }) || null;
}

async function applyPaymentIfNeeded(invoice, bankTransaction, ocrData, documentId) {
  if (!invoice || !bankTransaction) return { autoBooked: false, reason: 'invoice_or_bank_missing' };
  if (bankTransaction.matched_invoice_id) return { autoBooked: false, reason: 'bank_already_matched' };

  const { data: existingPayment } = await supabase
    .from('invoice_payments')
    .select('id')
    .eq('bank_transaction_id', bankTransaction.id)
    .limit(1)
    .maybeSingle();

  if (!existingPayment) {
    const { error: paymentError } = await supabase
      .from('invoice_payments')
      .insert({
        invoice_id: invoice.id,
        payment_date: bankTransaction.booking_date || ocrData.date || null,
        amount: Math.abs(toNumber(bankTransaction.amount || ocrData.amount || 0)),
        currency: bankTransaction.currency || 'EUR',
        payment_source: 'ocr_auto_booking',
        reference: bankTransaction.bank_reference || bankTransaction.remittance_information || ocrData.invoiceNumber || '',
        bank_transaction_id: bankTransaction.id,
        is_manual: false
      });

    if (paymentError) {
      throw new Error(paymentError.message || 'OCR-Zahlung konnte nicht gespeichert werden.');
    }
  }

  const { data: payments, error: paymentsError } = await supabase
    .from('invoice_payments')
    .select('*')
    .eq('invoice_id', invoice.id);

  if (paymentsError) {
    throw new Error(paymentsError.message || 'Zahlungen konnten nicht geladen werden.');
  }

  const paid = (payments || []).reduce((sum, row) => sum + Math.abs(toNumber(row.amount, 0)), 0);
  const total = Math.abs(toNumber(invoice.total, 0));
  const newStatus = paid >= total ? 'paid' : 'part_paid';

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

  const { error: bankUpdateError } = await supabase
    .from('bank_transactions')
    .update({
      matched_invoice_id: invoice.id,
      match_status: 'ocr_auto_matched',
      suggested_invoice_id: invoice.id,
      suggested_invoice_number: invoice.invoice_number || null,
      suggested_customer_name: invoice.kundenname || null
    })
    .eq('id', bankTransaction.id);

  if (bankUpdateError) {
    throw new Error(bankUpdateError.message || 'Banktransaktion konnte nicht aktualisiert werden.');
  }

  await supabase.from('invoice_events').insert({
    invoice_id: invoice.id,
    event_type: 'ocr_auto_booking',
    event_label: 'Zahlung automatisch per OCR zugeordnet',
    actor: 'system',
    actor_type: 'system',
    payload: {
      bank_transaction_id: bankTransaction.id,
      document_id: documentId,
      amount: Math.abs(toNumber(bankTransaction.amount || ocrData.amount || 0)),
      new_status: newStatus
    }
  });

  await logDocumentAuditEvent({
    documentId,
    action: 'ocr_auto_booking',
    actor: 'system',
    actorType: 'system',
    note: 'Zahlung automatisch zugeordnet.',
    payload: {
      invoice_id: invoice.id,
      bank_transaction_id: bankTransaction.id,
      invoice_status: newStatus
    }
  });

  return { autoBooked: true, reason: 'success', invoiceStatus: newStatus };
}

export async function runDocumentOCRById(documentId) {
  const document = await getDocument(documentId);

  if (!document.file_path) {
    throw new Error('Dokument hat keinen Dateipfad.');
  }

  await logDocumentAuditEvent({
    documentId,
    action: 'ocr_started',
    actor: 'system',
    actorType: 'system',
    note: 'OCR wurde gestartet.'
  });

  const file = await downloadDocument(document.file_path);
  const extracted = await extractTextFromFile(file, document.file_name);
  const text = extracted.text;

  const ocrData = {
    invoiceNumber: extractInvoiceNumber(text),
    amount: extractAmount(text),
    date: extractDate(text),
    dueDate: extractDueDate(text),
    iban: extractIban(text)
  };

  const invoiceMatch = await findInvoiceMatch(ocrData);
  const bankMatch = await findBankTransactionMatch(ocrData, invoiceMatch.invoice);

  let autoBooked = false;
  let invoiceStatus = null;

  if (invoiceMatch.invoice && bankMatch) {
    const booking = await applyPaymentIfNeeded(invoiceMatch.invoice, bankMatch, ocrData, documentId);
    autoBooked = booking.autoBooked;
    invoiceStatus = booking.invoiceStatus || null;
  }

  const updatePayload = {
    ocr_text: text,
    ocr_processed: true,
    ocr_amount: ocrData.amount,
    ocr_date: ocrData.date,
    ocr_due_date: ocrData.dueDate,
    ocr_iban: ocrData.iban,
    ocr_invoice_number: ocrData.invoiceNumber,
    matched_invoice_id: invoiceMatch.invoice?.id || null,
    matched_bank_transaction_id: bankMatch?.id || null,
    ocr_mode: extracted.mode,
    updated_at: new Date().toISOString()
  };

  const { error: updateError } = await supabase
    .from('documents')
    .update(updatePayload)
    .eq('id', documentId);

  if (updateError) {
    throw new Error(updateError.message || 'OCR-Daten konnten nicht gespeichert werden.');
  }

  await logDocumentAuditEvent({
    documentId,
    action: 'ocr_completed',
    actor: 'system',
    actorType: 'system',
    note: autoBooked ? 'OCR abgeschlossen und automatisch zugeordnet.' : 'OCR abgeschlossen.',
    payload: {
      ocr_mode: extracted.mode,
      ocr_invoice_number: ocrData.invoiceNumber,
      ocr_amount: ocrData.amount,
      matched_invoice_id: invoiceMatch.invoice?.id || null,
      matched_bank_transaction_id: bankMatch?.id || null,
      auto_booked: autoBooked
    }
  });

  return {
    success: true,
    message: autoBooked ? 'OCR abgeschlossen und Zahlung automatisch zugeordnet.' : 'OCR abgeschlossen.',
    data: {
      ocr_mode: extracted.mode,
      text,
      ocr: ocrData,
      matched_invoice_id: invoiceMatch.invoice?.id || null,
      matched_bank_transaction_id: bankMatch?.id || null,
      auto_booked: autoBooked,
      invoice_status: invoiceStatus
    }
  };
}