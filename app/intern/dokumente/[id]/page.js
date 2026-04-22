'use client';

import { useEffect, useState } from 'react';

function formatDate(value) {
  if (!value) return '-';
  try { return new Date(value).toLocaleDateString('de-DE'); } catch { return value; }
}

function formatDateTime(value) {
  if (!value) return '-';
  try { return new Date(value).toLocaleString('de-DE'); } catch { return value; }
}

function money(value) {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return '-';
  return `${n.toFixed(2)} €`;
}

function fileSize(bytes) {
  const size = Number(bytes || 0);
  if (!size) return '0 KB';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DokumentDetailPage({ params }) {
  const [documentData, setDocumentData] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState('');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      setLoading(true);
      setErrorText('');
      const res = await fetch(`/api/documents/${params.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Dokument konnte nicht geladen werden.');
      setDocumentData(data?.data?.document || null);
      setAuditLogs(Array.isArray(data?.data?.audit_logs) ? data.data.audit_logs : []);
    } catch (error) {
      setErrorText(error.message || 'Dokument konnte nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <main style={wrap}><div style={container}><section style={card}>Dokument wird geladen…</section></div></main>;
  if (errorText || !documentData) return <main style={wrap}><div style={container}><section style={errorBox}>{errorText || 'Dokument nicht gefunden.'}</section></div></main>;

  const txCount = Array.isArray(documentData.parsed_transactions) ? documentData.parsed_transactions.length : 0;

  return (
    <main style={wrap}>
      <div style={container}>
        <section style={heroCard}>
          <div style={badge}>Dokumentenakte</div>
          <h1 style={mainTitle}>{documentData.file_name || 'Dokument'}</h1>
          <p style={heroText}>Detaillierte Dokumenteninformationen, OCR-Daten, CSV-Ausgabe und vollständiges Audit-Log.</p>
        </section>

        <section style={card}>
          <div style={sectionTitle}>Dokumentinformationen</div>
          <div style={factsGrid}>
            <div style={factCard}><div style={factLabel}>Kategorie</div><div style={factValue}>{documentData.category_label || '-'}</div></div>
            <div style={factCard}><div style={factLabel}>Dokumenttyp</div><div style={factValue}>{documentData.ocr_document_type || '-'}</div></div>
            <div style={factCard}><div style={factLabel}>Sicherheit</div><div style={factValue}>{documentData.ocr_confidence || '-'}</div></div>
            <div style={factCard}><div style={factLabel}>Dateigröße</div><div style={factValue}>{fileSize(documentData.file_size)}</div></div>
            <div style={factCard}><div style={factLabel}>Mandant</div><div style={factValue}>{documentData.customer_id || '-'}</div></div>
            <div style={factCard}><div style={factLabel}>Hochgeladen von</div><div style={factValue}>{documentData.created_by || '-'}</div></div>
            <div style={factCard}><div style={factLabel}>Upload-Datum</div><div style={factValue}>{formatDateTime(documentData.created_at)}</div></div>
            <div style={factCard}><div style={factLabel}>Belegdatum</div><div style={factValue}>{formatDate(documentData.belegdatum)}</div></div>
            <div style={factCard}><div style={factLabel}>OCR Status</div><div style={factValue}>{documentData.ocr_processed ? 'Verarbeitet' : 'Offen'}</div></div>
            <div style={factCard}><div style={factLabel}>OCR Modus</div><div style={factValue}>{documentData.ocr_mode || '-'}</div></div>
            <div style={factCard}><div style={factLabel}>Absender</div><div style={factValue}>{documentData.ocr_sender_name || '-'}</div></div>
            <div style={factCard}><div style={factLabel}>Empfänger</div><div style={factValue}>{documentData.ocr_recipient_name || '-'}</div></div>
          </div>
          <div style={actionRow}>
            {documentData.open_url ? <a href={documentData.open_url} target="_blank" rel="noreferrer" style={openLink}>Öffnen</a> : null}
            {documentData.download_url ? <a href={documentData.download_url} target="_blank" rel="noreferrer" style={downloadLink}>Download</a> : null}
            {documentData.csv_download_url ? <a href={documentData.csv_download_url} target="_blank" rel="noreferrer" style={csvLink}>CSV herunterladen</a> : null}
            <a href="/intern/dokumente" style={secondaryLink}>Zurück zur Übersicht</a>
          </div>
        </section>

        <section style={card}>
          <div style={sectionTitle}>Rechnungsdaten</div>
          <div style={factsGrid}>
            <div style={factCard}><div style={factLabel}>Rechnungsnummer</div><div style={factValue}>{documentData.ocr_invoice_number || '-'}</div></div>
            <div style={factCard}><div style={factLabel}>Beleg-/Rechnungsdatum</div><div style={factValue}>{formatDate(documentData.ocr_date)}</div></div>
            <div style={factCard}><div style={factLabel}>Zahlungsfrist / Fälligkeit</div><div style={factValue}>{formatDate(documentData.ocr_due_date)}</div></div>
            <div style={factCard}><div style={factLabel}>Netto</div><div style={factValue}>{documentData.ocr_net_amount !== null ? money(documentData.ocr_net_amount) : '-'}</div></div>
            <div style={factCard}><div style={factLabel}>MwSt Betrag</div><div style={factValue}>{documentData.ocr_vat_amount !== null ? money(documentData.ocr_vat_amount) : '-'}</div></div>
            <div style={factCard}><div style={factLabel}>MwSt Satz</div><div style={factValue}>{documentData.ocr_vat_rate !== null ? `${documentData.ocr_vat_rate}%` : '-'}</div></div>
            <div style={factCard}><div style={factLabel}>Brutto</div><div style={factValue}>{documentData.ocr_gross_amount !== null ? money(documentData.ocr_gross_amount) : '-'}</div></div>
            <div style={factCard}><div style={factLabel}>IBAN</div><div style={factValue}>{documentData.ocr_iban || '-'}</div></div>
            <div style={factCard}><div style={factLabel}>Zugeordnete Rechnung</div><div style={factValue}>{documentData.matched_invoice_id || '-'}</div></div>
            <div style={factCard}><div style={factLabel}>Zugeordnete Banktransaktion</div><div style={factValue}>{documentData.matched_bank_transaction_id || '-'}</div></div>
          </div>
        </section>

        <section style={card}>
          <div style={sectionTitle}>Kontoauszug / CSV</div>
          <div style={factsGrid}>
            <div style={factCard}><div style={factLabel}>Erkannte Buchungen</div><div style={factValue}>{txCount}</div></div>
            <div style={factCard}><div style={factLabel}>CSV Datei</div><div style={factValue}>{documentData.csv_file_path || '-'}</div></div>
          </div>
          {txCount > 0 ? (
            <div style={txTableWrap}>
              <table style={table}>
                <thead><tr><th style={th}>Datum</th><th style={th}>Buchungstext</th><th style={th}>Betrag</th><th style={th}>Saldo</th></tr></thead>
                <tbody>
                  {documentData.parsed_transactions.map((tx, index) => (
                    <tr key={`${tx.date}-${tx.amount}-${index}`}>
                      <td style={td}>{tx.date || '-'}</td>
                      <td style={td}>{tx.booking_text || '-'}</td>
                      <td style={td}>{tx.amount !== null && tx.amount !== undefined ? money(tx.amount) : '-'}</td>
                      <td style={td}>{tx.balance !== null && tx.balance !== undefined ? money(tx.balance) : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <div style={infoBox}>Noch keine Buchungen erkannt.</div>}
        </section>

        <section style={card}><div style={sectionTitle}>OCR Text</div><div style={textBox}>{documentData.ocr_text || 'Noch kein OCR-Text vorhanden.'}</div></section>

        <section style={card}>
          <div style={sectionTitle}>Audit-Log</div>
          {auditLogs.length === 0 ? <div style={infoBox}>Noch keine Audit-Einträge vorhanden.</div> : (
            <div style={logList}>
              {auditLogs.map((log) => (
                <div key={log.id} style={logCard}>
                  <div style={logHeader}><div style={logAction}>{log.action || '-'}</div><div style={logTime}>{formatDateTime(log.created_at)}</div></div>
                  <div style={logMeta}>Akteur: {log.actor || '-'} · Typ: {log.actor_type || '-'}</div>
                  <div style={logNote}>{log.note || '-'}</div>
                  {log.payload ? <pre style={payloadBox}>{JSON.stringify(log.payload, null, 2)}</pre> : null}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

const wrap = { padding: 30, background: '#f7f5ef', minHeight: '100vh' };
const container = { maxWidth: 1200, margin: '0 auto', display: 'grid', gap: 20 };
const heroCard = { background: '#fff', padding: 28, borderRadius: 20, border: '1px solid #e7e1d6' };
const badge = { display: 'inline-flex', padding: '8px 12px', borderRadius: 999, border: '1px solid #ddd6c8', color: '#6b5b45', background: '#faf8f3', fontSize: 13, fontWeight: 700, marginBottom: 12 };
const mainTitle = { margin: 0, fontSize: 30, color: '#101828' };
const heroText = { marginTop: 12, color: '#475467', lineHeight: 1.6 };
const card = { background: '#fff', padding: 24, borderRadius: 18, border: '1px solid #e7e1d6' };
const sectionTitle = { fontSize: 22, fontWeight: 800, color: '#101828', marginBottom: 16 };
const factsGrid = { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14 };
const factCard = { background: '#fcfcfd', border: '1px solid #eceff3', borderRadius: 14, padding: 14 };
const factLabel = { fontSize: 12, color: '#667085', marginBottom: 6 };
const factValue = { fontSize: 14, color: '#101828', fontWeight: 700, wordBreak: 'break-word' };
const actionRow = { display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' };
const openLink = { display: 'inline-flex', padding: '10px 12px', borderRadius: 10, background: '#8c6b43', color: '#fff', textDecoration: 'none', fontWeight: 700 };
const downloadLink = { display: 'inline-flex', padding: '10px 12px', borderRadius: 10, border: '1px solid #d0d5dd', background: '#fff', color: '#101828', textDecoration: 'none', fontWeight: 700 };
const csvLink = { display: 'inline-flex', padding: '10px 12px', borderRadius: 10, background: '#ecfdf3', border: '1px solid #abefc6', color: '#067647', textDecoration: 'none', fontWeight: 700 };
const secondaryLink = { display: 'inline-flex', padding: '10px 12px', borderRadius: 10, border: '1px solid #d0d5dd', background: '#fff', color: '#101828', textDecoration: 'none', fontWeight: 700 };
const textBox = { whiteSpace: 'pre-wrap', background: '#fcfcfd', border: '1px solid #eceff3', borderRadius: 14, padding: 16, lineHeight: 1.6, color: '#344054' };
const txTableWrap = { overflowX: 'auto', marginTop: 14 };
const table = { width: '100%', borderCollapse: 'collapse' };
const th = { textAlign: 'left', padding: 12, borderBottom: '1px solid #d0d5dd', color: '#344054', fontSize: 13 };
const td = { padding: 12, borderBottom: '1px solid #eceff3', color: '#101828', fontSize: 13 };
const logList = { display: 'grid', gap: 12 };
const logCard = { background: '#fcfcfd', border: '1px solid #eceff3', borderRadius: 14, padding: 16 };
const logHeader = { display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' };
const logAction = { fontWeight: 800, color: '#101828' };
const logTime = { color: '#667085', fontSize: 13 };
const logMeta = { marginTop: 8, fontSize: 13, color: '#475467' };
const logNote = { marginTop: 8, color: '#101828' };
const payloadBox = { marginTop: 12, padding: 12, background: '#101828', color: '#fff', borderRadius: 12, overflowX: 'auto', fontSize: 12 };
const infoBox = { padding: '14px 16px', borderRadius: 14, background: '#fffaeb', border: '1px solid #fedf89', color: '#b54708' };
const errorBox = { padding: '16px 18px', borderRadius: 14, background: '#fef3f2', border: '1px solid #fecdca', color: '#b42318' };
