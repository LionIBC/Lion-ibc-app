'use client';

import { useEffect, useState } from 'react';

const kundennummer = 'K-10023';

const categories = [
  'Eingangsrechnung',
  'Ausgangsrechnung',
  'Bankauszug',
  'Verträge',
  'Schreiben',
  'Sonstiges'
];

export default function PortalDokumentePage() {
  const [files, setFiles] = useState([]);
  const [category, setCategory] = useState('Eingangsrechnung');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  async function loadDocuments() {
    try {
      setLoading(true);
      const res = await fetch(`/api/documents?kundennummer=${encodeURIComponent(kundennummer)}`);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.message || 'Dokumente konnten nicht geladen werden.');
      }

      setDocuments(json.data || []);
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Dokumente konnten nicht geladen werden.'
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(e) {
    e.preventDefault();
    setStatus(null);

    if (!files.length) {
      setStatus({
        type: 'error',
        message: 'Bitte mindestens eine Datei auswählen.'
      });
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append('kundennummer', kundennummer);
      formData.append('category', category);
      formData.append('description', description);
      formData.append('uploadedBy', 'portal');

      Array.from(files).forEach((file) => {
        formData.append('files', file);
      });

      const res = await fetch('/api/documents', {
        method: 'POST',
        body: formData
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.message || 'Upload fehlgeschlagen.');
      }

      setStatus({
        type: 'success',
        message: 'Dokument(e) erfolgreich hochgeladen.'
      });

      setFiles([]);
      setCategory('Eingangsrechnung');
      setDescription('');
      await loadDocuments();
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Upload fehlgeschlagen.'
      });
    } finally {
      setUploading(false);
    }
  }

  return (
    <main style={pageWrap}>
      <div style={pageInner}>
        <section style={heroCard}>
          <div style={badge}>Kundenportal</div>
          <h1 style={title}>Dokumente</h1>
          <p style={subtitle}>
            Laden Sie hier Dokumente hoch und ordnen Sie diese direkt einer Kategorie zu.
            Die interne Prüfung und spätere Bearbeitung erfolgt anschließend im System.
          </p>

          <div style={topInfoRow}>
            <div style={topInfoBox}>
              <span style={topInfoLabel}>Kundennummer</span>
              <span style={topInfoValue}>{kundennummer}</span>
            </div>
          </div>
        </section>

        {status?.type === 'error' && <div style={errorBox}>{status.message}</div>}
        {status?.type === 'success' && <div style={successBox}>{status.message}</div>}

        <section style={sectionCard}>
          <h2 style={sectionTitle}>Dokument hochladen</h2>

          <form onSubmit={handleUpload} style={stack18}>
            <div style={grid2}>
              <div style={singleFieldWrap}>
                <label style={labelStyle}>Kategorie</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={inputStyle}
                >
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div style={singleFieldWrap}>
                <label style={labelStyle}>Dateien</label>
                <input
                  type="file"
                  multiple
                  onChange={(e) => setFiles(e.target.files)}
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={singleFieldWrap}>
              <label style={labelStyle}>Beschreibung</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optionaler Hinweis zum Dokument"
                style={textareaStyle}
              />
            </div>

            <div style={footerBottom}>
              <div style={footerHint}>
                Dokumente werden mandantenbezogen gespeichert und später intern geprüft,
                kategorisiert und weiterverarbeitet.
              </div>

              <button type="submit" style={submitButton} disabled={uploading}>
                {uploading ? 'Wird hochgeladen…' : 'Dokument hochladen'}
              </button>
            </div>
          </form>
        </section>

        <section style={sectionCard}>
          <h2 style={sectionTitle}>Bereits hochgeladene Dokumente</h2>

          {loading ? (
            <div style={infoBox}>Dokumente werden geladen…</div>
          ) : documents.length === 0 ? (
            <div style={infoBox}>Noch keine Dokumente vorhanden.</div>
          ) : (
            <div style={tableWrap}>
              <div style={tableHeader}>
                <div>Kategorie</div>
                <div>Dateiname</div>
                <div>Status</div>
                <div>Datum</div>
              </div>

              {documents.map((doc) => (
                <div key={doc.id} style={tableRow}>
                  <div>{doc.category}</div>
                  <div>{doc.original_name}</div>
                  <div>{doc.status}</div>
                  <div>{formatDateTime(doc.created_at)}</div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('de-DE');
}

const pageWrap = {
  minHeight: '100vh',
  background: 'linear-gradient(to bottom, #f7f5ef 0%, #f3f0e8 100%)',
  padding: '32px 20px 60px'
};

const pageInner = {
  maxWidth: '1120px',
  margin: '0 auto'
};

const heroCard = {
  background: '#ffffff',
  border: '1px solid #eee7da',
  borderRadius: '24px',
  padding: '34px 36px',
  boxShadow: '0 10px 30px rgba(16, 24, 40, 0.05)',
  marginBottom: '22px'
};

const badge = {
  display: 'inline-block',
  padding: '8px 14px',
  borderRadius: '999px',
  border: '1px solid #d8d2c6',
  background: '#faf8f3',
  color: '#5f5a4f',
  fontSize: '14px',
  fontWeight: '600',
  marginBottom: '18px'
};

const title = {
  fontSize: '38px',
  fontWeight: '700',
  color: '#101828',
  margin: '0 0 10px'
};

const subtitle = {
  fontSize: '16px',
  lineHeight: 1.75,
  color: '#475467',
  maxWidth: '860px',
  margin: 0
};

const topInfoRow = {
  marginTop: '22px',
  display: 'flex',
  flexWrap: 'wrap',
  gap: '12px'
};

const topInfoBox = {
  padding: '12px 16px',
  borderRadius: '14px',
  background: '#faf8f3',
  border: '1px solid #eadfcd',
  display: 'flex',
  gap: '10px',
  alignItems: 'center'
};

const topInfoLabel = {
  fontSize: '13px',
  fontWeight: '700',
  color: '#5d4a2f',
  textTransform: 'uppercase',
  letterSpacing: '0.03em'
};

const topInfoValue = {
  fontSize: '14px',
  color: '#101828',
  fontWeight: '600'
};

const sectionCard = {
  background: '#ffffff',
  border: '1px solid #eee7da',
  borderRadius: '22px',
  padding: '26px 28px',
  boxShadow: '0 10px 24px rgba(16, 24, 40, 0.04)',
  marginBottom: '18px'
};

const sectionTitle = {
  fontSize: '24px',
  fontWeight: '700',
  color: '#101828',
  margin: '0 0 18px'
};

const stack18 = {
  display: 'grid',
  gap: '18px'
};

const grid2 = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '16px'
};

const singleFieldWrap = {
  display: 'grid',
  gap: '8px'
};

const labelStyle = {
  fontSize: '14px',
  fontWeight: '700',
  color: '#344054'
};

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: '12px',
  border: '1px solid #d0d5dd',
  fontSize: '14px',
  background: '#fff',
  color: '#101828',
  boxSizing: 'border-box'
};

const textareaStyle = {
  width: '100%',
  minHeight: '110px',
  padding: '12px 14px',
  borderRadius: '12px',
  border: '1px solid #d0d5dd',
  fontSize: '14px',
  background: '#fff',
  color: '#101828',
  resize: 'vertical',
  boxSizing: 'border-box',
  lineHeight: 1.6
};

const footerBottom = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '20px',
  flexWrap: 'wrap'
};

const footerHint = {
  fontSize: '14px',
  lineHeight: 1.7,
  color: '#667085',
  maxWidth: '700px'
};

const submitButton = {
  padding: '16px 22px',
  borderRadius: '14px',
  border: 'none',
  background: '#8c6b43',
  color: '#fff',
  fontWeight: '700',
  fontSize: '15px',
  cursor: 'pointer',
  boxShadow: '0 8px 18px rgba(140, 107, 67, 0.18)'
};

const tableWrap = {
  display: 'grid',
  gap: '10px'
};

const tableHeader = {
  display: 'grid',
  gridTemplateColumns: '1.2fr 2fr 1fr 1.2fr',
  gap: '14px',
  padding: '12px 14px',
  fontWeight: '700',
  color: '#344054',
  borderBottom: '1px solid #eceff3'
};

const tableRow = {
  display: 'grid',
  gridTemplateColumns: '1.2fr 2fr 1fr 1.2fr',
  gap: '14px',
  padding: '14px',
  border: '1px solid #eceff3',
  borderRadius: '14px',
  background: '#fcfcfd',
  color: '#101828'
};

const infoBox = {
  padding: '14px 16px',
  borderRadius: '14px',
  background: '#fffaeb',
  border: '1px solid #fedf89',
  color: '#b54708'
};

const errorBox = {
  marginBottom: '16px',
  padding: '14px 16px',
  borderRadius: '14px',
  background: '#fef3f2',
  border: '1px solid #fecdca',
  color: '#b42318'
};

const successBox = {
  marginBottom: '16px',
  padding: '14px 16px',
  borderRadius: '14px',
  background: '#ecfdf3',
  border: '1px solid #abefc6',
  color: '#067647'
};

