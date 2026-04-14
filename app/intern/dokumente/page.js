'use client';

import { useEffect, useRef, useState } from 'react';

const CATEGORY_OPTIONS = [
  { value: 'eingangsrechnung', label: 'Eingangsrechnungen' },
  { value: 'ausgangsrechnung', label: 'Ausgangsrechnungen' },
  { value: 'vertraege', label: 'Verträge' },
  { value: 'kontoauszuege', label: 'Kontoauszüge' },
  { value: 'stammdaten', label: 'Stammdaten' },
  { value: 'allgemein', label: 'Allgemein' }
];

function formatFileSize(bytes) {
  const size = Number(bytes || 0);
  if (!size) return '0 KB';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value) {
  if (!value) return '';
  try {
    return new Date(value).toLocaleDateString('de-DE');
  } catch {
    return '';
  }
}

function groupByCategory(documents) {
  const map = new Map();

  for (const option of CATEGORY_OPTIONS) {
    map.set(option.value, {
      key: option.value,
      label: option.label,
      items: []
    });
  }

  for (const doc of documents || []) {
    const key = doc.category || 'allgemein';

    if (!map.has(key)) {
      map.set(key, {
        key,
        label: doc.category_label || key,
        items: []
      });
    }

    map.get(key).items.push(doc);
  }

  return Array.from(map.values()).filter((group) => group.items.length > 0);
}

export default function InternDokumentePage() {
  const fileInputRef = useRef(null);

  const [customers, setCustomers] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [filterCustomerId, setFilterCustomerId] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [files, setFiles] = useState([]);
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [statusBox, setStatusBox] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [filterCustomerId, filterCategory]);

  async function loadCustomers() {
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || data?.error || 'Kunden konnten nicht geladen werden.');
      }

      const rows = Array.isArray(data?.data) ? data.data : [];
      setCustomers(rows);

      if (rows.length > 0 && !selectedCustomerId) {
        setSelectedCustomerId(rows[0].id);
      }
    } catch (error) {
      setStatusBox({
        type: 'error',
        message: error.message || 'Kunden konnten nicht geladen werden.'
      });
    }
  }

  async function loadDocuments() {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      params.set('source', 'intern');
      if (filterCustomerId) params.set('customer_id', filterCustomerId);
      if (filterCategory) params.set('category', filterCategory);

      const res = await fetch(`/api/documents?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || 'Dokumente konnten nicht geladen werden.');
      }

      setDocuments(Array.isArray(data?.data) ? data.data : []);
    } catch (error) {
      setStatusBox({
        type: 'error',
        message: error.message || 'Dokumente konnten nicht geladen werden.'
      });
    } finally {
      setLoading(false);
    }
  }

  function addFiles(fileList) {
    const nextFiles = Array.from(fileList || []);
    if (!nextFiles.length) return;

    setFiles((prev) => {
      const merged = [...prev, ...nextFiles];
      const seen = new Set();

      return merged.filter((file) => {
        const key = `${file.name}-${file.size}-${file.lastModified}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    });
  }

  function removeFile(index) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    addFiles(e.dataTransfer.files);
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }

  async function uploadFiles() {
    if (!selectedCustomerId) {
      setStatusBox({ type: 'error', message: 'Bitte zuerst einen Mandanten auswählen.' });
      return;
    }

    if (!category) {
      setStatusBox({ type: 'error', message: 'Bitte zuerst eine Dokumentart auswählen.' });
      return;
    }

    if (!files.length) {
      setStatusBox({ type: 'error', message: 'Bitte zuerst Dateien auswählen.' });
      return;
    }

    try {
      setUploading(true);
      setStatusBox(null);

      const formData = new FormData();
      formData.append('customer_id', selectedCustomerId);
      formData.append('category', category);
      formData.append('source', 'intern');
      formData.append('created_by', 'mitarbeiter');

      files.forEach((file) => {
        formData.append('files', file);
      });

      const res = await fetch('/api/documents', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || 'Upload fehlgeschlagen.');
      }

      setFiles([]);
      setCategory('');
      setStatusBox({ type: 'success', message: 'Upload erfolgreich.' });

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      await loadDocuments();
    } catch (error) {
      setStatusBox({
        type: 'error',
        message: error.message || 'Upload fehlgeschlagen.'
      });
    } finally {
      setUploading(false);
      setDragActive(false);
    }
  }

  async function deleteDocument(id) {
    const confirmed = window.confirm('Soll dieses Dokument wirklich gelöscht werden?');
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/documents?id=${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || 'Dokument konnte nicht gelöscht werden.');
      }

      setStatusBox({ type: 'success', message: 'Dokument wurde gelöscht.' });
      await loadDocuments();
    } catch (error) {
      setStatusBox({
        type: 'error',
        message: error.message || 'Dokument konnte nicht gelöscht werden.'
      });
    }
  }

  const groupedDocuments = groupByCategory(documents);

  return (
    <main style={wrap}>
      <div style={container}>
        <section style={heroCard}>
          <div style={badge}>Intern</div>
          <h1 style={mainTitle}>Dokumentenverwaltung</h1>
          <p style={heroText}>
            Dokumente können Mandanten zugeordnet, kategorisiert hochgeladen und intern verwaltet werden.
          </p>
        </section>

        {statusBox?.type === 'error' && <div style={errorBox}>{statusBox.message}</div>}
        {statusBox?.type === 'success' && <div style={successBox}>{statusBox.message}</div>}

        <section style={card}>
          <h2 style={sectionTitle}>Neue Dokumente hochladen</h2>

          <div style={grid2}>
            <div style={field}>
              <label style={label}>Mandant</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                style={input}
              >
                <option value="">Bitte wählen</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firmenname} ({c.kundennummer})
                  </option>
                ))}
              </select>
            </div>

            <div style={field}>
              <label style={label}>Dokumentart</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={input}
              >
                <option value="">Bitte wählen</option>
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragEnter={handleDragOver}
            onDragLeave={handleDragLeave}
            style={{
              ...dropzone,
              ...(dragActive ? dropzoneActive : {})
            }}
          >
            <div style={dropzoneTitle}>Dateien hier hineinziehen</div>
            <div style={dropzoneText}>oder per Klick auswählen. Mehrere Dateien sind möglich.</div>

            <input
              type="file"
              multiple
              ref={fileInputRef}
              hidden
              onChange={(e) => addFiles(e.target.files)}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={secondaryButton}
              disabled={uploading}
            >
              Dateien auswählen
            </button>
          </div>

          {files.length > 0 ? (
            <div style={fileList}>
              {files.map((file, i) => (
                <div key={`${file.name}-${file.size}-${i}`} style={fileCard}>
                  <div style={fileInfo}>
                    <div style={fileName}>{file.name}</div>
                    <div style={fileMeta}>{formatFileSize(file.size)}</div>
                  </div>

                  <button type="button" onClick={() => removeFile(i)} style={removeButton}>
                    Entfernen
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={infoBox}>Noch keine Dateien ausgewählt.</div>
          )}

          <div style={actionRow}>
            <button type="button" onClick={uploadFiles} style={saveButton} disabled={uploading}>
              {uploading ? 'Lädt hoch…' : 'Upload starten'}
            </button>
          </div>
        </section>

        <section style={card}>
          <h2 style={sectionTitle}>Dokumente</h2>

          <div style={grid2}>
            <div style={field}>
              <label style={label}>Filter Mandant</label>
              <select
                value={filterCustomerId}
                onChange={(e) => setFilterCustomerId(e.target.value)}
                style={input}
              >
                <option value="">Alle</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firmenname} ({c.kundennummer})
                  </option>
                ))}
              </select>
            </div>

            <div style={field}>
              <label style={label}>Filter Dokumentart</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                style={input}
              >
                <option value="">Alle</option>
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div style={infoBox}>Dokumente werden geladen…</div>
          ) : groupedDocuments.length === 0 ? (
            <div style={infoBox}>Noch keine Dokumente vorhanden.</div>
          ) : (
            <div style={groupList}>
              {groupedDocuments.map((group) => (
                <div key={group.key} style={groupCard}>
                  <div style={groupTitle}>{group.label}</div>

                  <div style={documentList}>
                    {group.items.map((doc) => (
                      <div key={doc.id} style={documentCard}>
                        <div>
                          <div style={documentName}>{doc.file_name}</div>
                          <div style={documentMeta}>
                            {formatFileSize(doc.file_size)} · {formatDate(doc.created_at)}
                          </div>
                        </div>

                        <div style={documentActions}>
                          {doc.open_url ? (
                            <a href={doc.open_url} target="_blank" rel="noreferrer" style={openLink}>
                              Öffnen
                            </a>
                          ) : null}

                          {doc.download_url ? (
                            <a href={doc.download_url} target="_blank" rel="noreferrer" style={downloadLink}>
                              Download
                            </a>
                          ) : null}

                          <button type="button" onClick={() => deleteDocument(doc.id)} style={removeButton}>
                            Löschen
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

const wrap = {
  padding: 30,
  background: '#f7f5ef',
  minHeight: '100vh'
};

const container = {
  maxWidth: 1180,
  margin: '0 auto',
  display: 'grid',
  gap: 20
};

const heroCard = {
  background: '#fff',
  padding: 28,
  borderRadius: 20,
  border: '1px solid #e7e1d6',
  boxShadow: '0 10px 24px rgba(16, 24, 40, 0.04)'
};

const badge = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '8px 12px',
  borderRadius: 999,
  border: '1px solid #ddd6c8',
  color: '#6b5b45',
  background: '#faf8f3',
  fontSize: 13,
  fontWeight: 700,
  marginBottom: 12
};

const mainTitle = {
  margin: 0,
  fontSize: 30,
  color: '#101828'
};

const heroText = {
  margin: '12px 0 0 0',
  fontSize: 16,
  color: '#475467',
  lineHeight: 1.6
};

const card = {
  background: '#fff',
  padding: 24,
  borderRadius: 18,
  border: '1px solid #e7e1d6',
  boxShadow: '0 10px 24px rgba(16, 24, 40, 0.04)'
};

const sectionTitle = {
  margin: '0 0 16px 0',
  fontSize: 22,
  color: '#101828'
};

const grid2 = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 16,
  marginBottom: 16
};

const field = {
  display: 'grid',
  gap: 8
};

const label = {
  fontSize: 14,
  fontWeight: 700,
  color: '#344054'
};

const input = {
  width: '100%',
  padding: 12,
  borderRadius: 12,
  border: '1px solid #d0d5dd',
  boxSizing: 'border-box',
  background: '#fff'
};

const dropzone = {
  border: '2px dashed #d0d5dd',
  borderRadius: 18,
  padding: '26px 20px',
  background: '#fcfcfd',
  display: 'grid',
  gap: 10,
  justifyItems: 'center',
  textAlign: 'center',
  transition: 'all 0.15s ease'
};

const dropzoneActive = {
  border: '2px dashed #8c6b43',
  background: '#faf8f3'
};

const dropzoneTitle = {
  fontSize: 18,
  fontWeight: 700,
  color: '#101828'
};

const dropzoneText = {
  fontSize: 14,
  color: '#667085'
};

const fileList = {
  display: 'grid',
  gap: 10,
  marginTop: 16
};

const fileCard = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  padding: 14,
  borderRadius: 14,
  border: '1px solid #eceff3',
  background: '#fcfcfd'
};

const fileInfo = {
  minWidth: 0
};

const fileName = {
  fontSize: 14,
  fontWeight: 700,
  color: '#101828',
  wordBreak: 'break-word'
};

const fileMeta = {
  marginTop: 4,
  fontSize: 12,
  color: '#667085'
};

const actionRow = {
  display: 'flex',
  gap: 10,
  marginTop: 18,
  flexWrap: 'wrap'
};

const saveButton = {
  padding: '12px 16px',
  borderRadius: 12,
  border: 'none',
  background: '#8c6b43',
  color: '#fff',
  fontWeight: 700,
  cursor: 'pointer'
};

const secondaryButton = {
  padding: '12px 16px',
  borderRadius: 12,
  border: '1px solid #d0d5dd',
  background: '#fff',
  color: '#101828',
  fontWeight: 700,
  cursor: 'pointer'
};

const removeButton = {
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid #fecdca',
  background: '#fff',
  color: '#b42318',
  fontWeight: 700,
  cursor: 'pointer',
  flexShrink: 0
};

const infoBox = {
  padding: '14px 16px',
  borderRadius: 14,
  background: '#fffaeb',
  border: '1px solid #fedf89',
  color: '#b54708',
  marginTop: 16
};

const errorBox = {
  padding: '14px 16px',
  borderRadius: 14,
  background: '#fef3f2',
  border: '1px solid #fecdca',
  color: '#b42318'
};

const successBox = {
  padding: '14px 16px',
  borderRadius: 14,
  background: '#ecfdf3',
  border: '1px solid #abefc6',
  color: '#067647'
};

const groupList = {
  display: 'grid',
  gap: 16
};

const groupCard = {
  background: '#fcfcfd',
  border: '1px solid #eceff3',
  borderRadius: 16,
  padding: 16
};

const groupTitle = {
  fontSize: 18,
  fontWeight: 800,
  color: '#101828',
  marginBottom: 12
};

const documentList = {
  display: 'grid',
  gap: 10
};

const documentCard = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  padding: 14,
  borderRadius: 14,
  background: '#fff',
  border: '1px solid #eceff3'
};

const documentName = {
  fontSize: 14,
  fontWeight: 700,
  color: '#101828'
};

const documentMeta = {
  marginTop: 4,
  fontSize: 12,
  color: '#667085'
};

const documentActions = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap'
};

const openLink = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '10px 12px',
  borderRadius: 10,
  background: '#8c6b43',
  color: '#fff',
  textDecoration: 'none',
  fontWeight: 700,
  fontSize: 14
};

const downloadLink = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '10px 12px',
  borderRadius: 10,
  background: '#fff',
  color: '#101828',
  border: '1px solid #d0d5dd',
  textDecoration: 'none',
  fontWeight: 700,
  fontSize: 14
};

