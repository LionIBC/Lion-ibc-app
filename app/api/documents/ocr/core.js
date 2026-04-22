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

function extractFirstMatch(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return null;
}

function extractInvoiceNumber(text) {
  return extractFirstMatch(text, [
    /(?:rechnungsnummer|rechnung\s*nr\.?|invoice\s*(?:no\.?|number)|factura\s*(?:nr\.?|n[úu]mero))\s*[:#-]?\s*([A-Z0-9\-\/]+)/i,
    /\b([A-Z]{1,6}-\d{3,12})\b/,
    /\b(RG[-\/]?\d{3,}|RE[-\/]?\d{3,}|INV[-\/]?\d{3,})\b/i
  ]);
}

function extractGrossAmount(text) {
  const value = extractFirstMatch(text, [
    /(?:gesamtbetrag|gesamt|summe|total|importe\s*total|zu\s*zahlen|brutto)\s*[:\-]?\s*([0-9\.\,]+)\s?(?:€|eur)?/i,
    /([0-9\.\,]+)\s?(?:€|eur)/i
  ]);
  return value ? toNumber(value, null) : null;
}

function extractNetAmount(text) {
  const value = extractFirstMatch(text, [
    /(?:netto|net amount|base imponible)\s*[:\-]?\s*([0-9\.\,]+)\s?(?:€|eur)?/i
  ]);
  return value ? toNumber(value, null) : null;
}

function extractVatAmount(text) {
  const value = extractFirstMatch(text, [
    /(?:mwst|ust|umsatzsteuer|iva|vat)\s*[:\-]?\s*([0-9\.\,]+)\s?(?:€|eur)?/i
  ]);
  return value ? toNumber(value, null) : null;
}

function extractVatRate(text) {
  const value = extractFirstMatch(text, [
    /(?:mwst|ust|iva|vat)\s*[:\-]?\s*([0-9]{1,2}(?:[.,][0-9]{1,2})?)\s*%/i,
    /\b([0-9]{1,2}(?:[.,][0-9]{1,2})?)\s*%\s*(?:mwst|ust|iva|vat)\b/i
  ]);
  return value ? toNumber(value, null) : null;
}

function extractDate(text) {
  const value = extractFirstMatch(text, [
    /(?:rechnungsdatum|datum|invoice\s*date|fecha)\s*[:\-]?\s*(\d{2}[.\-/]\d{2}[.\-/]\d{4})/i,
    /\b(\d{2}[.\-/]\d{2}[.\-/]\d{4})\b/
  ]);
  return value ? parseEuropeanDate(value) : null;
}

function extractDueDate(text) {
  const value = extractFirstMatch(text, [
    /(?:fällig\s*am|zahlbar\s*bis|due\s*date|fecha\s*de\s*vencimiento|zahlungsfrist)\s*[:\-]?\s*(\d{2}[.\-/]\d{2}[.\-/]\d{4})/i
  ]);
  return value ? parseEuropeanDate(value) : null;
}

function extractIban(text) {
  const compact = String(text || '').replace(/\s+/g, '');
  const match = compact.match(/\b([A-Z]{2}\d{2}[A-Z0-9]{10,30})\b/i);
  return match?.[1]?.toUpperCase() || null;
}

function extractSenderName(text) {
  return extractFirstMatch(text, [
    /(?:von|absender|sender|remitente)\s*[:\-]?\s*([^\n\r]{3,120})/i
  ]);
}

function extractRecipientName(text) {
  return extractFirstMatch(text, [
    /(?:an|empfänger|recipient|destinatario|mandant|kunde|betreffend)\s*[:\-]?\s*([^\n\r]{3,120})/i
  ]);
}

function extractDocumentType(text, fallbackCategory = '') {
  const raw = String(text || '').toLowerCase();
  if (fallbackCategory === 'kontoauszuege') return 'kontoauszug';
  if (fallbackCategory === 'vertraege') return 'vertrag';
  if (fallbackCategory === 'eingangsrechnung' || fallbackCategory === 'ausgangsrechnung') return 'rechnung';
  if (raw.includes('kontoauszug') || raw.includes('account statement') || raw.includes('saldo')) return 'kontoauszug';
  if (raw.includes('rechnung') || raw.includes('invoice') || raw.includes('factura')) return 'rechnung';
  if (raw.includes('vertrag') || raw.includes('contract')) return 'vertrag';
  if (raw.includes('mahnung')) return 'mahnung';
  return 'allgemeines_dokument';
}

function detectConfidence(ocrData) {
  let score = 0;
  if (ocrData.invoiceNumber) score += 30;
  if (ocrData.grossAmount !== null) score += 25;
  if (ocrData.date) score += 15;
  if (ocrData.iban) score += 20;
  if (ocrData.senderName) score += 5;
  if (ocrData.recipientName) score += 5;
  if (score >= 70) return 'hoch';
  if (score >= 40) return 'mittel';
  return 'niedrig';
}

function parseBankStatementTransactions(text) {
  const lines = String(text || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const transactions = [];

  for (const line of lines) {
    const match = line.match(/^(\d{2}[.\-/]\d{2}[.\-/]\d{4})\s+(.+?)\s+(-?[0-9\.\,]+)\s*(?:€|EUR)?(?:\s+([0-9\.\,]+)\s*(?:€|EUR)?)?$/i);
    if (!match) continue;
    transactions.push({
      date: parseEuropeanDate(match[1]),
      booking_text: match[2]?.trim() || '',
      reference: match[2]?.trim() || '',
      amount: toNumber(match[3], 0),
      currency: 'EUR',
      iban: '',
      name: '',
      balance: match[4] ? toNumber(match[4], null) : null
    });
  }

  return transactions;
}

function generateTransactionsCsv(transactions) {
  const header = ['Datum', 'Buchungstext', 'Verwendungszweck', 'Betrag', 'Währung', 'IBAN', 'Name', 'Saldo'];
  const rows = transactions.map((t) => [
    t.date || '',
    String(t.booking_text || '').replace(/;/g, ','),
    String(t.reference || '').replace(/;/g, ','),
    t.amount ?? '',
    t.currency || 'EUR',
    t.iban || '',
    String(t.name || '').replace(/;/g, ','),
    t.balance ?? ''
  ]);
  return [header, ...rows].map((row) => row.join(';')).join('\n');
}

async function uploadTransactionsCsv(document, transactions) {
  if (!transactions.length) return { csvFilePath: null };
  const csv = generateTransactionsCsv(transactions);
  const filePath = `exports/${document.id}/kontoauszug.csv`;
  const buffer = Buffer.from(csv, 'utf-8');

  const { error } = await supabase.storage.from('documents').upload(filePath, buffer, {
    contentType: 'text/csv',
    upsert: true
  });

  if (error) throw new Error(error.message || 'CSV konnte nicht gespeichert werden.');
  return { csvFilePath: filePath };
}

async function findInvoiceMatch(ocrData) {
  const { invoiceNumber, grossAmount } = ocrData;

  if (invoiceNumber) {
    const { data } = await supabase.from('invoice_documents').select('*').ilike('invoice_number', `%${invoiceNumber}%`).limit(1);
    if (data?.[0]) return { invoice: data[0], matchType: 'invoice_number' };
  }

  if (grossAmount !== null) {
    const { data } = await supabase.from('invoice_documents').select('*').in('status', ['draft', 'approved', 'issued', 'final', 'part_paid', 'overdue']);
    const match = (data || []).find((row) => Math.abs(toNumber(row.total, 0)) === Math.abs(toNumber(grossAmount, 0)));
    if (match) return { invoice: match, matchType: 'amount' };
  }

  return { invoice: null, matchType: null };
}

async function findBankTransactionMatch(ocrData, invoice) {
  const { grossAmount, iban, invoiceNumber } = ocrData;
  const { data } = await supabase.from('bank_transactions').select('*').order('booking_date', { ascending: false }).limit(200);
  const transactions = data || [];

  const byInvoiceNumber = transactions.find((row) => {
    const ref = normalizeText(`${row.remittance_information || ''} ${row.bank_reference || ''}`);
    const amountMatches = grossAmount !== null && Math.abs(toNumber(row.amount, 0)) === Math.abs(toNumber(grossAmount, 0));
    return invoiceNumber && amountMatches && ref.includes(normalizeText(invoiceNumber));
  });
  if (byInvoiceNumber) return byInvoiceNumber;

  const bySuggestedInvoice = transactions.find((row) => {
    const amountMatches = grossAmount !== null && Math.abs(toNumber(row.amount, 0)) === Math.abs(toNumber(grossAmount, 0));
    return invoice?.id && row.suggested_invoice_id === invoice.id && amountMatches;
  });
  if (bySuggestedInvoice) return bySuggestedInvoice;

  return transactions.find((row) => {
    const ibanMatch = iban && normalizeText(row.iban || row.account_iban || '').includes(normalizeText(iban));
    const amountMatch = grossAmount !== null && Math.abs(toNumber(row.amount, 0)) === Math.abs(toNumber(grossAmount, 0));
    return ibanMatch || amountMatch;
  }) || null;
}

async function applyPaymentIfNeeded(invoice, bankTransaction, ocrData, documentId) {
  if (!invoice || !bankTransaction) return { autoBooked: false, reason: 'invoice_or_bank_missing' };
  if (bankTransaction.matched_invoice_id) return { autoBooked: false, reason: 'bank_already_matched' };

  const { data: existingPayment } = await supabase.from('invoice_payments').select('id').eq('bank_transaction_id', bankTransaction.id).limit(1).maybeSingle();

  if (!existingPayment) {
    const { error: paymentError } = await supabase.from('invoice_payments').insert({
      invoice_id: invoice.id,
      payment_date: bankTransaction.booking_date || ocrData.date || null,
      amount: Math.abs(toNumber(bankTransaction.amount || ocrData.grossAmount || 0)),
      currency: bankTransaction.currency || 'EUR',
      payment_source: 'ocr_auto_booking',
      reference: bankTransaction.bank_reference || bankTransaction.remittance_information || ocrData.invoiceNumber || '',
      bank_transaction_id: bankTransaction.id,
      is_manual: false
    });
    if (paymentError) throw new Error(paymentError.message || 'OCR-Zahlung konnte nicht gespeichert werden.');
  }

  const { data: payments, error: paymentsError } = await supabase.from('invoice_payments').select('*').eq('invoice_id', invoice.id);
  if (paymentsError) throw new Error(paymentsError.message || 'Zahlungen konnten nicht geladen werden.');

  const paid = (payments || []).reduce((sum, row) => sum + Math.abs(toNumber(row.amount, 0)), 0);
  const total = Math.abs(toNumber(invoice.total, 0));
  const newStatus = paid >= total ? 'paid' : 'part_paid';

  const { error: invoiceUpdateError } = await supabase.from('invoice_documents').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', invoice.id);
  if (invoiceUpdateError) throw new Error(invoiceUpdateError.message || 'Rechnung konnte nicht aktualisiert werden.');

  const { error: bankUpdateError } = await supabase.from('bank_transactions').update({
    matched_invoice_id: invoice.id,
    match_status: 'ocr_auto_matched',
    suggested_invoice_id: invoice.id,
    suggested_invoice_number: invoice.invoice_number || null,
    suggested_customer_name: invoice.kundenname || null
  }).eq('id', bankTransaction.id);
  if (bankUpdateError) throw new Error(bankUpdateError.message || 'Banktransaktion konnte nicht aktualisiert werden.');

  await supabase.from('invoice_events').insert({
    invoice_id: invoice.id,
    event_type: 'ocr_auto_booking',
    event_label: 'Zahlung automatisch per OCR zugeordnet',
    actor: 'system',
    actor_type: 'system',
    payload: {
      bank_transaction_id: bankTransaction.id,
      document_id: documentId,
      amount: Math.abs(toNumber(bankTransaction.amount || ocrData.grossAmount || 0)),
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
  if (!document.file_path) throw new Error('Dokument hat keinen Dateipfad.');

  await logDocumentAuditEvent({ documentId, action: 'ocr_started', actor: 'system', actorType: 'system', note: 'OCR wurde gestartet.' });

  const file = await downloadDocument(document.file_path);
  const extracted = await extractTextFromFile(file, document.file_name);
  const text = extracted.text;

  let netAmount = extractNetAmount(text);
  let vatAmount = extractVatAmount(text);
  let vatRate = extractVatRate(text);
  let grossAmount = extractGrossAmount(text);

  if (grossAmount !== null && netAmount !== null && vatAmount === null) vatAmount = Number((grossAmount - netAmount).toFixed(2));
  if (grossAmount !== null && netAmount === null && vatAmount !== null) netAmount = Number((grossAmount - vatAmount).toFixed(2));

  const ocrData = {
    documentType: extractDocumentType(text, document.category),
    invoiceNumber: extractInvoiceNumber(text),
    netAmount,
    vatAmount,
    vatRate,
    grossAmount,
    date: extractDate(text),
    dueDate: extractDueDate(text),
    iban: extractIban(text),
    senderName: extractSenderName(text),
    recipientName: extractRecipientName(text)
  };

  const confidence = detectConfidence(ocrData);
  const transactions = ocrData.documentType === 'kontoauszug' || document.category === 'kontoauszuege'
    ? parseBankStatementTransactions(text)
    : [];

  let csvFilePath = null;
  if (transactions.length > 0) {
    const csvUpload = await uploadTransactionsCsv(document, transactions);
    csvFilePath = csvUpload.csvFilePath;
    await logDocumentAuditEvent({
      documentId,
      action: 'csv_generated',
      actor: 'system',
      actorType: 'system',
      note: 'CSV aus Kontoauszug erzeugt.',
      payload: { transaction_count: transactions.length, csv_file_path: csvFilePath }
    });
  }

  const invoiceMatch = await findInvoiceMatch(ocrData);
  const bankMatch = await findBankTransactionMatch(ocrData, invoiceMatch.invoice);

  let autoBooked = false;
  let invoiceStatus = null;
  if (invoiceMatch.invoice && bankMatch && ocrData.documentType === 'rechnung') {
    const booking = await applyPaymentIfNeeded(invoiceMatch.invoice, bankMatch, ocrData, documentId);
    autoBooked = booking.autoBooked;
    invoiceStatus = booking.invoiceStatus || null;
  }

  const updatePayload = {
    ocr_text: text,
    ocr_processed: true,
    ocr_mode: extracted.mode,
    ocr_document_type: ocrData.documentType,
    ocr_confidence: confidence,
    ocr_sender_name: ocrData.senderName,
    ocr_recipient_name: ocrData.recipientName,
    ocr_invoice_number: ocrData.invoiceNumber,
    ocr_net_amount: ocrData.netAmount,
    ocr_vat_amount: ocrData.vatAmount,
    ocr_vat_rate: ocrData.vatRate,
    ocr_gross_amount: ocrData.grossAmount,
    ocr_amount: ocrData.grossAmount,
    ocr_date: ocrData.date,
    ocr_due_date: ocrData.dueDate,
    ocr_iban: ocrData.iban,
    matched_invoice_id: invoiceMatch.invoice?.id || null,
    matched_bank_transaction_id: bankMatch?.id || null,
    parsed_transactions: transactions.length ? transactions : null,
    csv_file_path: csvFilePath,
    updated_at: new Date().toISOString()
  };

  const { error: updateError } = await supabase.from('documents').update(updatePayload).eq('id', documentId);
  if (updateError) throw new Error(updateError.message || 'OCR-Daten konnten nicht gespeichert werden.');

  await logDocumentAuditEvent({
    documentId,
    action: 'ocr_completed',
    actor: 'system',
    actorType: 'system',
    note: autoBooked ? 'OCR abgeschlossen und automatisch zugeordnet.' : 'OCR abgeschlossen.',
    payload: {
      ocr_mode: extracted.mode,
      ocr_document_type: ocrData.documentType,
      confidence,
      ocr_invoice_number: ocrData.invoiceNumber,
      ocr_gross_amount: ocrData.grossAmount,
      matched_invoice_id: invoiceMatch.invoice?.id || null,
      matched_bank_transaction_id: bankMatch?.id || null,
      auto_booked: autoBooked,
      transaction_count: transactions.length
    }
  });

  return {
    success: true,
    message: autoBooked
      ? 'OCR abgeschlossen, CSV erzeugt und Zahlung automatisch zugeordnet.'
      : transactions.length > 0
        ? 'OCR abgeschlossen und CSV erzeugt.'
        : 'OCR abgeschlossen.',
    data: {
      ocr_mode: extracted.mode,
      text,
      ocr: ocrData,
      confidence,
      transactions,
      csv_file_path: csvFilePath,
      matched_invoice_id: invoiceMatch.invoice?.id || null,
      matched_bank_transaction_id: bankMatch?.id || null,
      auto_booked: autoBooked,
      invoice_status: invoiceStatus
    }
  };
}
