'use client';

import { useEffect, useMemo, useState } from 'react';

export default function InternEingangPage() {
  const [documents, setDocuments] = useState([]);
  const [stammdatenRequests, setStammdatenRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusBox, setStatusBox] = useState(null);

  const [kundennummerFilter, setKundennummerFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('Alle');
  const [statusFilter, setStatusFilter] = useState('Alle');

  useEffect(() => {
    loadInboxData();
  }, []);

  async function loadInboxData() {
    try {
      setLoading(true);
      setStatusBox(null);

      const [documentsRes, stammdatenRes] = await Promise.all([
        fetch('/api/documents'),
        fetch('/api/stammdaten')
      ]);

      const documentsJson = await documentsRes.json();
      const stammdatenJson = await stammdatenRes.json();

      if (!documentsRes.ok) {
        throw new Error(documentsJson?.message || 'Dokumente konnten nicht geladen werden.');
      }

      if (!stammdatenRes.ok) {
        throw new Error(stammdatenJson?.message || 'Stammdatenanfragen konnten nicht geladen werden.');
      }

      setDocuments(documentsJson.data || []);
      setStammdatenRequests(stammdatenJson.data || []);
    } catch (error) {
      setStatusBox({
        type: 'error',
        message: error.message || 'Der Eingang konnte nicht geladen werden.'
      });
    } finally {
      setLoading(false);
    }
  }

  const inboxItems = useMemo(() => {
    const documentItems = documents.map((doc) => ({
      id: `document-${doc.id}`,
      type: 'Dokument',
      kundennummer: doc.kundennummer || '',
      title: doc.original_name || 'Dokument',
      subtitle: doc.category || 'Ohne Kategorie',
      status: doc.status || 'neu',
      createdAt: doc.created_at,
      raw: doc
    }));

    const stammdatenItems = stammdatenRequests.map((item) => ({
      id: `stammdaten-${item.id}`,
      type: 'Stammdaten',
      kundennummer: item.kundennummer || '',
      title: item.firma || item.kundennummer || 'Stammdatenanfrage',
      subtitle: `${Object.keys(item.changes || {}).length} Änderung(en)`,
      status: item.status || 'offen',
      createdAt: item.createdAt || item.created_at,
      raw: item
    }));

    return [...documentItems, ...stammdatenItems].sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });
  }, [documents, stammdatenRequests]);

  const filteredItems = useMemo(() => {
    return inboxItems.filter((item) => {
      const kundennummerMatch =
        !kundennummerFilter.trim() ||
        String(item.kundennummer || '')
          .toLowerCase()
          .includes(kundennummerFilter.trim().toLowerCase());

      const typeMatch =
        typeFilter === 'Alle' || item.type === typeFilter;

      const statusMatch =
        statusFilter === 'Alle' || String(item.status || '') === statusFilter;

      return kundennummerMatch && typeMatch && statusMatch;
    });
  }, [inboxItems, kundennummerFilter, typeFilter, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: inboxItems.length,
      documents: inboxItems.filter((item) => item.type === 'Dokument').length,
      stammdaten: inboxItems.filter((item) => item.type === 'Stammdaten').length,
      offen: inboxItems.filter((item) =>
        ['offen', 'neu', 'in Prüfung'].includes(String(item.status || ''))
      ).length
    };
  }, [inboxItems]);

  return (
    <main style={pageWrap}>
      <div style={pageInner}>
        <section style={heroCard}>
          <div style={badge}>Intern</div>
          <h1 style={title}>Eingang</h1>
          <p style={subtitle}>
            Hier sehen Sie alle neuen Eingänge aus dem System. Dazu gehören aktuell
            Dokumente und Stammdatenanfragen. Später werden hier auch weitere Module
            wie Mitarbeiter, Tickets und automatische Vorgänge zusammenlaufen.
          </p>
        </section>

        {statusBox?.type === 'error' && <div style={errorBox}>{statusBox.message}</div>}
        {statusBox?.type === 'success' && <div style={successBox}>{statusBox.message}</div>}

        <section style={statsGrid}>
          <div style={statCard}>
            <div style={statLabel}>Gesamt</div>
            <div style={statValue}>{stats.total}</div>
          </div>

          <div style={statCard}>
            <div style={statLabel}>Dokumente</div>
            <div style={statValue}>{stats.documents}</div>
          </div>

          <div style={statCard}>
            <div style={statLabel}>Stammdaten</div>
            <div style={statValue}>{stats.stammdaten}</div>
          </div>

          <div style={statCard}>
            <div style={statLabel}>Offen / Neu</div>
            <div style={statValue}>{stats.offen}</div>
          </div>
        </section>

        <section style={filterCard}>
          <h2 style={sectionTitle}>Filter</h2>

          <div style={filterGrid}>
            <div style={singleFieldWrap}>
              <label style={labelStyle}>Kundennummer</label>
              <input
                type="text"
                value={kundennummerFilter}
                onChange={(e) => setKundennummerFilter(e.target.value)}
                placeholder="z. B. K-10023"
                style={inputStyle}
              />
            </div>

            <div style={singleFieldWrap}>
              <label style={labelStyle}>Typ</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                style={inputStyle}
              >
                <option value="Alle">Alle</option>
                <option value="Dokument">Dokument</option>
                <option value="Stammdaten">Stammdaten</option>
              </select>
            </div>

            <div style={singleFieldWrap}>
              <label style={labelStyle}>Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={inputStyle}
              >
                <option value="Alle">Alle</option>
                <option value="neu">neu</option>
                <option value="offen">offen</option>
                <option value="in Prüfung">in Prüfung</option>
                <option value="bearbeitet">bearbeitet</option>
                <option value="freigegeben">freigegeben</option>
                <option value="abgelehnt">abgelehnt</option>
              </select>
            </div>
          </div>
        </section>

        <section style={sectionCard}>
          <div style={headerRow}>
            <h2 style={sectionTitleNoMargin}>Neue Eingänge</h2>

            <button type="button" onClick={loadInboxData} style={secondaryButton}>
              Aktualisieren
            </button>
          </div>

          {loading ? (
            <div style={infoBox}>Eingang wird geladen…</div>
          ) : filteredItems.length === 0 ? (
            <div style={infoBox}>Keine Einträge für die aktuelle Auswahl vorhanden.</div>
          ) : (
            <div style={requestList}>
              {filteredItems.map((item) => (
                <div key={item.id} style={entryCard}>
                  <div style={entryHeader}>
                    <div style={entryLeft}>
                      <div style={entryTitleRow}>
                        <span style={entryTypeBadge(item.type)}>{item.type}</span>
                        <span style={entryTitle}>{item.title}</span>
                      </div>

                      <div style={entryMeta}>
                        Kundennummer: {item.kundennummer || '—'}
                      </div>

                      <div style={entryMeta}>
                        {item.subtitle}
                      </div>

                      <div style={entryMeta}>
                        Eingang: {formatDateTime(item.createdAt)}
                      </div>
                    </div>

                    <div style={statusBadge(item.status)}>
                      {item.status || '—'}
                    </div>
                  </div>

                  {item.type === 'Dokument' ? (
                    <div style={actionRow}>
                      {item.raw?.signed_url ? (
                        <a
                          href={item.raw.signed_url}
                          target="_blank"
                          rel="noreferrer"
                          style={openButton}
                        >
                          Öffnen
                        </a>
                      ) : null}

                      {item.raw?.download_url ? (
                        <a
                          href={item.raw.download_url}
                          target="_blank"
                          rel="noreferrer"
                          style={downloadButton}
                        >
                          Download
                        </a>
                      ) : null}

                      <a href="/intern/dokumente" style={secondaryLinkButton}>
                        Zu Dokumenten
                      </a>
                    </div>
                  ) : (
                    <div style={actionRow}>
                      <a href="/intern/stammdaten" style={openButton}>
                        Zur Freigabe
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function entryTypeBadge(type) {
  if (type === 'Dokument') {
    return {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '6px 10px',
      borderRadius: '999px',
      background: '#eef4ff',
      color: '#3538cd',
      fontSize: '12px',
      fontWeight: '700'
    };
  }

  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '6px 10px',
    borderRadius: '999px',
    background: '#fff7ed',
    color: '#c4320a',
    fontSize: '12px',
    fontWeight: '700'
  };
}

function statusBadge(status) {
  if (status === 'bearbeitet' || status === 'freigegeben') {
    return {
      padding: '8px 14px',
      borderRadius: '999px',
      background: '#ecfdf3',
      color: '#067647',
      fontSize: '13px',
      fontWeight: '700'
    };
  }

  if (status === 'in Prüfung' || status === 'offen') {
    return {
      padding: '8px 14px',
      borderRadius: '999px',
      background: '#fffaeb',
      color: '#b54708',
      fontSize: '13px',
      fontWeight: '700'
    };
  }

  if (status === 'abgelehnt') {
    return {
      padding: '8px 14px',
      borderRadius: '999px',
      background: '#fef3f2',
      color: '#b42318',
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

const statsGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: '16px',
  marginBottom: '18px'
};

const statCard = {
  background: '#ffffff',
  border: '1px solid #eee7da',
  borderRadius: '18px',
  padding: '20px',
  boxShadow: '0 10px 24px rgba(16, 24, 40, 0.04)'
};

const statLabel = {
  fontSize: '14px',
  color: '#667085',
  marginBottom: '8px'
};

const statValue = {
  fontSize: '28px',
  fontWeight: '700',
  color: '#101828'
};

const sectionCard = {
  background: '#ffffff',
  border: '1px solid #eee7da',
  borderRadius: '22px',
  padding: '26px 28px',
  boxShadow: '0 10px 24px rgba(16, 24, 40, 0.04)'
};

const headerRow = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '16px',
  flexWrap: 'wrap',
  marginBottom: '18px'
};

const sectionTitle = {
  fontSize: '24px',
  fontWeight: '700',
  color: '#101828',
  margin: '0 0 18px'
};

const sectionTitleNoMargin = {
  fontSize: '24px',
  fontWeight: '700',
  color: '#101828',
  margin: 0
};

const filterGrid = {
  display: 'grid',
  gridTemplateColumns: '1.2fr 1fr 1fr',
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

const requestList = {
  display: 'grid',
  gap: '14px'
};

const entryCard = {
  border: '1px solid #eceff3',
  borderRadius: '18px',
  padding: '18px 20px',
  background: '#fcfcfd'
};

const entryHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '16px',
  flexWrap: 'wrap'
};

const entryLeft = {
  display: 'grid',
  gap: '6px'
};

const entryTitleRow = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  flexWrap: 'wrap'
};

const entryTitle = {
  fontSize: '18px',
  fontWeight: '700',
  color: '#101828'
};

const entryMeta = {
  fontSize: '14px',
  color: '#667085',
  lineHeight: 1.6
};

const actionRow = {
  marginTop: '16px',
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

const secondaryLinkButton = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '12px 14px',
  borderRadius: '12px',
  background: '#f9fafb',
  color: '#344054',
  border: '1px solid #d0d5dd',
  fontWeight: '700',
  fontSize: '14px',
  textDecoration: 'none'
};

const secondaryButton = {
  padding: '11px 14px',
  background: '#ffffff',
  color: '#101828',
  borderRadius: '12px',
  border: '1px solid #d0d5dd',
  fontWeight: '600',
  fontSize: '14px',
  cursor: 'pointer'
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

