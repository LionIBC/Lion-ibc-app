'use client';

import { useEffect, useMemo, useState } from 'react';

const categories = [
  'Alle',
  'Eingangsrechnung',
  'Ausgangsrechnung',
  'Bankauszug',
  'Verträge',
  'Schreiben',
  'Sonstiges'
];

const statuses = ['Alle', 'neu', 'in Prüfung', 'bearbeitet'];

export default function InternDokumentePage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusBox, setStatusBox] = useState(null);

  const [searchKundennummer, setSearchKundennummer] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Alle');
  const [statusFilter, setStatusFilter] = useState('Alle');

  useEffect(() => {
    loadDocuments();
  }, []);

  async function loadDocuments() {
    try {
      setLoading(true);
      setStatusBox(null);

      const res = await fetch('/api/documents');
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.message || 'Dokumente konnten nicht geladen werden.');
      }

      setDocuments(json.data || []);
    } catch (error) {
      setStatusBox({
        type: 'error',
        message: error.message || 'Dokumente konnten nicht geladen werden.'
      });
    } finally {
      setLoading(false);
    }
  }

  async function updateDocument(id, category, status) {
    try {
      const res = await fetch('/api/documents', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, category, status })
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.message || 'Dokument konnte nicht aktualisiert werden.');
      }

      setStatusBox({
        type: 'success',
        message: 'Dokument wurde aktualisiert.'
      });

      loadDocuments();
    } catch (error) {
      setStatusBox({
        type: 'error',
        message: error.message || 'Dokument konnte nicht aktualisiert werden.'
      });
    }
  }

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const kundennummerMatch =
        !searchKundennummer.trim() ||
        String(doc.kundennummer || '')
          .toLowerCase()
          .includes(searchKundennummer.trim().toLowerCase());

      const categoryMatch =
        categoryFilter === 'Alle' || doc.category === categoryFilter;

      const statusMatch =
        statusFilter === 'Alle' || doc.status === statusFilter;

      return kundennummerMatch && categoryMatch && statusMatch;
    });
  }, [documents, searchKundennummer, categoryFilter, statusFilter]);

  const groupedByMandant = useMemo(() => {
    const groups = {};

    filteredDocuments.forEach((doc) => {
      const key = doc.kundennummer || 'Ohne Kundennummer';
      if (!groups[key]) groups[key] = [];
      groups[key].push(doc);
    });

    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredDocuments]);

  return (
    <main style={pageWrap}>
      <div style={pageInner}>
        <section style={heroCard}>
          <div style={badge}>Intern</div>
          <h1 style={title}>Dokumente</h1>
          <p style={subtitle}>
            Hier sehen Sie alle hochgeladenen Dokumente mandantenbezogen. Filtern
            Sie nach Kundennummer, Kategorie und Bearbeitungsstatus, um gezielt in
            der Kundenakte zu arbeiten.
          </p>
        </section>

        {statusBox?.type === 'error' && <div style={errorBox}>{statusBox.message}</div>}
        {statusBox?.type === 'success' && <div style={successBox}>{statusBox.message}</div>}

        <section style={filterCard}>
          <h2 style={sectionTitle}>Filter</h2>

          <div style={filterGrid}>
            <div style={singleFieldWrap}>
              <label style={labelStyle}>Kundennummer</label>
              <input
                type="text"
                placeholder="z. B. K-10023"
                value={searchKundennummer}
                onChange={(e) => setSearchKundennummer(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div style={singleFieldWrap}>
              <label style={labelStyle}>Kategorie</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
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
              <label style={labelStyle}>Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={inputStyle}
              >
                {statuses.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {loading ? (
          <div style={infoBox}>Dokumente werden geladen…</div>
        ) : filteredDocuments.length === 0 ? (
          <div style={infoBox}>Keine Dokumente für die aktuelle Auswahl vorhanden.</div>
        ) : (
          <div style={requestList}>
            {groupedByMandant.map(([kundennummer, docs]) => (
              <section key={kundennummer} style={mandantCard}>
                <div style={mandantHeader}>
                  <div>
                    <div style={mandantTitle}>{kundennummer}</div>
                    <div style={mandantMeta}>{docs.length} Dokument(e)</div>
                  </div>
                </div>

                <div style={docsGrid}>
                  {docs.map((doc) => (
                    <div key={doc.id} style={docCard}>
                      <div style={docHeader}>
                        <div>
                          <div style={requestTitle}>{doc.original_name}</div>
                          <div style={requestMeta}>
                            Hochgeladen: {formatDateTime(doc.created_at)}
                          </div>
                        </div>

                        <div style={statusBadge(doc.status)}>
                          {doc.status}
                        </div>
                      </div>

                      <div style={grid2}>
                        <div style={singleFieldWrap}>
                          <label style={labelStyle}>Kategorie</label>
                          <select
                            value={doc.category}
                            onChange={(e) =>
                              updateDocument(doc.id, e.target.value, doc.status)
                            }
                            style={inputStyle}
                          >
                            {categories
                              .filter((item) => item !== 'Alle')
                              .map((item) => (
                                <option key={item} value={item}>
                                  {item}
                                </option>
                              ))}
                          </select>
                        </div>

                        <div style={singleFieldWrap}>
                          <label style={labelStyle}>Status</label>
                          <select
                            value={doc.status}
                            onChange={(e) =>
                              updateDocument(doc.id, doc.category, e.target.value)
                            }
                            style={inputStyle}
                          >
                            {statuses
                              .filter((item) => item !== 'Alle')
                              .map((item) => (
                                <option key={item} value={item}>
                                  {item}
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>

                      {doc.description ? (
                        <div style={reasonCard}>
                          <div style={reasonTitle}>Beschreibung</div>
                          <div style={reasonText}>{doc.description}</div>
                        </div>
                      ) : null}

                      <div style={metaBox}>
                        <div><strong>Gespeicherter Name:</strong> {doc.stored_name}</div>
                        <div><strong>Pfad:</strong> {doc.file_path}</div>
                      </div>

                      <div style={actionRow}>
                        {doc.signed_url ? (
                          <a
                            href={doc.signed_url}
                            target="_blank"
                            rel="noreferrer"
                            style={openButton}
                          >
                            Öffnen
                          </a>
                        ) : null}

                        {doc.download_url ? (
                          <a
                            href={doc.download_url}
                            target="_blank"
                            rel="noreferrer"
                            style={downloadButton}
                          >
                            Download
                          </a>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function statusBadge(status) {
  if (status === 'bearbeitet') {
    return {
      padding: '8px 14px',
      borderRadius: '999px',
      background: '#ecfdf3',
      color: '#067647',
      fontSize: '13px',
      fontWeight: '700'
    };
  }

  if (status === 'in Prüfung') {
    return {
      padding: '8px 14px',
      borderRadius: '999px',
      background: '#fffaeb',
      color: '#b54708',
      fontSize: '13px',
      fontWeight: '700'
    };
  }

  return {
    padding: '8px 14px',
    borderRadius: '999px',
    background: '#f2f4f7',
    color: '#667085',
    fontSize: '13px',
    fontWeight: '700'
  };
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

const filterCard = {
  background: '#ffffff',
  border: '1px solid #eee7da',
  borderRadius: '22px',
  padding: '26px 28px',
  boxShadow: '0 10px 24px rgba(16, 24, 40, 0.04)',
  marginBottom: '18px'
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

const sectionTitle = {
  fontSize: '24px',
  fontWeight: '700',
  color: '#101828',
  margin: '0 0 18px'
};

const filterGrid = {
  display: 'grid',
  gridTemplateColumns: '1.2fr 1fr 1fr',
  gap: '16px'
};

const requestList = {
  display: 'grid',
  gap: '18px'
};

const mandantCard = {
  background: '#ffffff',
  border: '1px solid #eee7da',
  borderRadius: '22px',
  padding: '24px 26px',
  boxShadow: '0 10px 24px rgba(16, 24, 40, 0.04)'
};

const mandantHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '16px',
  marginBottom: '18px'
};

const mandantTitle = {
  fontSize: '22px',
  fontWeight: '700',
  color: '#101828'
};

const mandantMeta = {
  marginTop: '6px',
  fontSize: '14px',
  color: '#667085'
};

const docsGrid = {
  display: 'grid',
  gap: '16px'
};

const docCard = {
  background: '#fcfcfd',
  border: '1px solid #eceff3',
  borderRadius: '18px',
  padding: '20px'
};

const docHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '16px',
  flexWrap: 'wrap',
  marginBottom: '18px'
};

const requestTitle = {
  fontSize: '18px',
  fontWeight: '700',
  color: '#101828'
};

const requestMeta = {
  marginTop: '6px',
  fontSize: '14px',
  color: '#667085'
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

const reasonCard = {
  marginTop: '16px',
  background: '#faf8f3',
  border: '1px solid #eadfcd',
  borderRadius: '16px',
  padding: '16px'
};

const reasonTitle = {
  fontSize: '14px',
  fontWeight: '700',
  color: '#5d4a2f',
  marginBottom: '8px'
};

const reasonText = {
  fontSize: '14px',
  lineHeight: 1.7,
  color: '#344054',
  whiteSpace: 'pre-wrap'
};

const metaBox = {
  marginTop: '16px',
  padding: '14px 16px',
  borderRadius: '14px',
  background: '#ffffff',
  border: '1px solid #eceff3',
  fontSize: '14px',
  lineHeight: 1.8,
  color: '#344054'
};

const actionRow = {
  marginTop: '18px',
  display: 'flex',
  gap: '10px',
  flexWrap: 'wrap'
};

const openButton = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '12px 14px',
  borderRadius: '12px',
  background: '#8c6b43',
  color: '#fff',
  fontWeight: '700',
  fontSize: '14px',
  textDecoration: 'none'
};

const downloadButton = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '12px 14px',
  borderRadius: '12px',
  background: '#ffffff',
  color: '#101828',
  border: '1px solid #d0d5dd',
  fontWeight: '700',
  fontSize: '14px',
  textDecoration: 'none'
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
