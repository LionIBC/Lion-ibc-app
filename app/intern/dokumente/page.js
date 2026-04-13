'use client';

import { useEffect, useRef, useState } from 'react';

const CATEGORY_OPTIONS = [
  { value: 'eingangsrechnung', label: 'Eingangsrechnungen' },
  { value: 'ausgangsrechnung', label: 'Ausgangsrechnungen' },
  { value: 'schreiben_allgemein', label: 'Schreiben allgemein' },
  { value: 'vertraege', label: 'Verträge' },
  { value: 'kontoauszuege', label: 'Kontoauszüge' },
  { value: 'stammdaten', label: 'Stammdaten' },
  { value: 'sonstiges', label: 'Sonstiges' } ];

const CUSTOMER_OPTIONS = [
  { value: 'K-10023', label: 'K-10023' } ];

function formatFileSize(bytes) {
  const size = Number(bytes || 0);
  if (!size) return '0 KB';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`; }

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
    const key = doc.category || 'sonstiges';

    if (!map.has(key)) {
      map.set(key, {
        key,
        label: doc.category_label || key,
        items: []
      });
    }

    map.get(key).items.push(doc);
  }

  return Array.from(map.values()).filter((group) => group.items.length > 0); }

export default function InternDokumentePage() {
  const fileInputRef = useRef(null);

  const [documents, setDocuments] = useState([]);
  const [files, setFiles] = useState([]);
  const [category, setCategory] = useState('');
  const [customerId, setCustomerId] = useState('K-10023');
  const [filterCustomerId, setFilterCustomerId] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [isDragActive, setIsDragActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [statusBox, setStatusBox] = useState(null);

  useEffect(() => {
    loadDocuments();
  }, [filterCustomerId, filterCategory]);

  async function loadDocuments() {
    try {
      setLoading(true);
      setStatusBox(null);

      const params = new URLSearchParams();
      params.set('source', 'intern');

      if (filterCustomerId) {
        params.set('customer_id', filterCustomerId);
      }

      if (filterCategory) {
        params.set('category', filterCategory);
      }

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

  function removeFile(indexToRemove) {
    setFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  }

  function handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(false);

    if (event.dataTransfer?.files?.length) {
      addFiles(event.dataTransfer.files);
    }
  }

  function handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(true);
  }

  function handleDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(false);
  }

  async function uploadFiles() {
    if (!files.length) {
      setStatusBox({
        type: 'error',
        message: 'Bitte zuerst Dateien auswählen.'
      });
      return;
    }

    if (!category) {
      setStatusBox({
        type: 'error',
        message: 'Bitte eine Dokumentart auswählen.'
      });
      return;
    }

    try {
      setUploading(true);
      setStatusBox(null);

      const formData = new FormData();
      formData.append('source', 'intern');
      formData.append('category', category);
      formData.append('customer_id', customerId || '');
      formData.append('created_by', 'intern');

      files.forEach((file) => {
        formData.append('files', file);
      });

      const res = await fetch('/api/documents', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || 'Dateien konnten nicht hochgeladen werden.');
      }

      setFiles([]);
      setCategory('');

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      setStatusBox({
        type: 'success',
        message: 'Datei(en) wurden erfolgreich hochgeladen.'
      });

      await loadDocuments();
    } catch (error) {
      setStatusBox({
        type: 'error',
        message: error.message || 'Dateien konnten nicht hochgeladen werden.'
      });
    } finally {
      setUploading(false);
      setIsDragActive(false);
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

      setStatusBox({
        type: 'success',
        message: 'Dokument wurde gelöscht.'
      });

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
            Dokumente können kategorisiert hochgeladen, nach Mandant gefiltert und intern gelöscht werden.
          </p>
        </section>

        {statusBox?.type === 'error' && <div style={errorBox}>{statusBox.message}</div>}
        {statusBox?.type === 'success' && <div style={successBox}>{statusBox.message}</div>}

        <section style={card}>
          <h2 style={sectionTitle}>Neue Dokumente hochladen</h2>

          <div style={grid3}>
            <div style={field}>
              <label style={label}>Dokumentart</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={input}
                disabled={uploading}
              >
                <option value="">Bitte wählen</option>
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={field}>
              <label style={label}>Mandant</label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                style={input}
                disabled={uploading}
              >
                <option value="">Ohne Zuordnung</option>
                {CUSTOMER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div
            style={{
              ...dropzone,
              ...(isDragActive ? dropzoneActive : {})
            }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragEnter={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div style={dropzoneTitle}>Dateien hier hineinziehen</div>
            <div style={dropzoneText}>
              oder per Klick auswählen. Mehrere Dateien sind möglich.
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={(e) => addFiles(e.target.files)}
              style={{ display: 'none' }}
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

          {files.length === 0 ? (
            <div style={infoBox}>Noch keine Dateien ausgewählt.</div>
          ) : (
            <div style={fileList}>
              {files.map((file, index) => (
                <div key={`${file.name}-${file.size}-${index}`} style={fileCard}>
                  <div style={fileInfo}>
                    <div style={fileName}>{file.name}</div>
                    <div style={fileMeta}>{formatFileSize(file.size)}</div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    style={removeButton}
                    disabled={uploading}
                  >
                    Entfernen
                  </button>
                </div>
              ))}
            </div>
          )}

          <div style={actionRow}>
            <button
              type="button"
              onClick={uploadFiles}
              style={saveButton}
              disabled={uploading}
            >
              {uploading ? 'Lädt hoch…' : 'Dateien hochladen'}
            </button>
          </div>
        </section>

        <section style={card}>
          <h2 style={sectionTitle}>Dokumente</h2>

          <div style={grid3}>
            <div style={field}>
              <label style={label}>Filter Mandant</label>
              <select
                value={filterCustomerId}
                onChange={(e) => setFilterCustomerId(e.target.value)}
                style={input}
              >
                <option value="">Alle</option>
                {CUSTOMER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
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
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
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
                            {doc.customer_id || 'Ohne Mandant'} · {formatFileSize(doc.file_size)} · {formatDate(doc.created_at)}
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

                          <button
                            type="button"
                            onClick={() => deleteDocument(doc.id)}
                            style={removeButton}
                          >
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

const wrap = { padding: 30, background: '#f7f5ef', minHeight: '100vh' }; const container = { maxWidth: 1180, margin: '0 auto', display: 'grid', gap: 20 }; const heroCard = { background: '#fff', padding: 28, borderRadius: 20, border: '1px solid #e7e1d6', boxShadow: '0 10px 24px rgba(16, 24, 40, 0.04)' }; const badge = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '8px 12px', borderRadius: 999, border: '1px solid #ddd6c8', color: '#6b5b45', background: '#faf8f3', fontSize: 13, fontWeight: 700, marginBottom: 12 }; const mainTitle = { margin: 0, fontSize: 30, color: '#101828' }; const heroText = { margin: '12px 0 0 0', fontSize: 16, color: '#475467', lineHeight: 1.6 }; const card = { background: '#fff', padding: 24, borderRadius: 18, border: '1px solid #e7e1d6', boxShadow: '0 10px 24px rgba(16, 24, 40, 0.04)' }; const sectionTitle = { margin: '0 0 16px 0', fontSize: 22, color: '#101828' }; const grid3 = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 }; const field = { display: 'grid', gap: 8 }; const label = { fontSize: 14, fontWeight: 700, color: '#344054' }; const input = { width: '100%', padding: 12, borderRadius: 12, border: '1px solid #d0d5dd', boxSizing: 'border-box', background: '#fff' }; const dropzone = { border: '2px dashed #d0d5dd', borderRadius: 18, padding: '26px 20px', background: '#fcfcfd', display: 'grid', gap: 10, justifyItems: 'center', textAlign: 'center', transition: 'all 0.15s ease' }; const dropzoneActive = { border: '2px dashed #8c6b43', background: '#faf8f3' }; const dropzoneTitle = { fontSize: 18, fontWeight: 700, color: '#101828' }; const dropzoneText = { fontSize: 14, color: '#667085' }; const fileList = { display: 'grid', gap: 10, marginTop: 16 }; const fileCard = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, border: '1px solid #eceff3', background: '#fcfcfd' }; const fileInfo = { minWidth: 0 }; const fileName = { fontSize: 14, fontWeight: 700, color: '#101828', wordBreak: 'break-word' }; const fileMeta = { marginTop: 4, fontSize: 12, color: '#667085' }; const actionRow = { display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }; const saveButton = { padding: '12px 16px', borderRadius: 12, border: 'none', background: '#8c6b43', color: '#fff', fontWeight: 700, cursor: 'pointer' }; const secondaryButton = { padding: '12px 16px', borderRadius: 12, border: '1px solid #d0d5dd', background: '#fff', color: '#101828', fontWeight: 700, cursor: 'pointer' }; const removeButton = { padding: '10px 12px', borderRadius: 10, border: '1px solid #fecdca', background: '#fff', color: '#b42318', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }; const infoBox = { padding: '14px 16px', borderRadius: 14, background: '#fffaeb', border: '1px solid #fedf89', color: '#b54708', marginTop: 16 }; const errorBox = { padding: '14px 16px', borderRadius: 14, background: '#fef3f2', border: '1px solid #fecdca', color: '#b42318' }; const successBox = { padding: '14px 16px', borderRadius: 14, background: '#ecfdf3', border: '1px solid #abefc6', color: '#067647' }; const groupList = { display: 'grid', gap: 16 }; const groupCard = { background: '#fcfcfd', border: '1px solid #eceff3', borderRadius: 16, padding: 16 }; const groupTitle = { fontSize: 18, fontWeight: 800, color: '#101828', marginBottom: 12 }; const documentList = { display: 'grid', gap: 10 }; const documentCard = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, background: '#fff', border: '1px solid #eceff3' }; const documentName = { fontSize: 14, fontWeight: 700, color: '#101828' }; const documentMeta = { marginTop: 4, fontSize: 12, color: '#667085' }; const documentActions = { display: 'flex', gap: 8, flexWrap: 'wrap' }; const openLink = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '10px 12px', borderRadius: 10, background: '#8c6b43', color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 14 }; const downloadLink = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '10px 12px', borderRadius: 10, background: '#fff', color: '#101828', border: '1px solid #d0d5dd', textDecoration: 'none', fontWeight: 700, fontSize: 14 };
