'use client';

import { useEffect, useRef, useState } from 'react';

const CATEGORY_OPTIONS = [
  { value: 'eingangsrechnung', label: 'Eingangsrechnungen' },
  { value: 'ausgangsrechnung', label: 'Ausgangsrechnungen' },
  { value: 'vertraege', label: 'Verträge' },
  { value: 'kontoauszuege', label: 'Kontoauszüge' },
  { value: 'stammdaten', label: 'Stammdaten' },
  { value: 'allgemein', label: 'Allgemein' } ];

export default function InternDokumentePage() {
  const fileInputRef = useRef(null);

  const [customers, setCustomers] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [files, setFiles] = useState([]);
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    loadCustomers();
    loadDocuments();
  }, []);

  async function loadCustomers() {
    const res = await fetch('/api/customers');
    const data = await res.json();
    if (res.ok) setCustomers(data.data || []);
  }

  async function loadDocuments() {
    const res = await fetch('/api/documents?source=intern');
    const data = await res.json();
    if (res.ok) setDocuments(data.data || []);
    setLoading(false);
  }

  function addFiles(fileList) {
    const newFiles = Array.from(fileList || []);
    setFiles((prev) => [...prev, ...newFiles]);
  }

  function removeFile(index) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragActive(false);
    addFiles(e.dataTransfer.files);
  }

  function handleDragOver(e) {
    e.preventDefault();
    setDragActive(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    setDragActive(false);
  }

  async function uploadFiles() {
    if (!selectedCustomerId) {
      setStatus({ type: 'error', message: 'Bitte Mandanten auswählen' });
      return;
    }

    if (!category) {
      setStatus({ type: 'error', message: 'Bitte Kategorie wählen' });
      return;
    }

    if (!files.length) {
      setStatus({ type: 'error', message: 'Keine Dateien gewählt' });
      return;
    }

    setUploading(true);
    setStatus(null);

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

    if (res.ok) {
      setFiles([]);
      setCategory('');
      setStatus({ type: 'success', message: 'Upload erfolgreich' });
      loadDocuments();
    } else {
      setStatus({ type: 'error', message: 'Upload fehlgeschlagen' });
    }

    setUploading(false);
  }

  return (
    <main style={{ padding: 30 }}>
      <h1>Dokumentenverwaltung</h1>

      {status && (
        <div style={{
          padding: 10,
          marginBottom: 20,
          borderRadius: 10,
          background: status.type === 'error' ? '#fee' : '#efe'
        }}>
          {status.message}
        </div>
      )}

      {/* Kunde */}
      <div style={{ marginBottom: 20 }}>
        <label>Mandant</label>
        <select
          value={selectedCustomerId}
          onChange={(e) => setSelectedCustomerId(e.target.value)}
          style={{ width: '100%', padding: 10 }}
        >
          <option value="">Bitte wählen</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.firmenname} ({c.kundennummer})
            </option>
          ))}
        </select>
      </div>

      {/* Kategorie */}
      <div style={{ marginBottom: 20 }}>
        <label>Kategorie</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{ width: '100%', padding: 10 }}
        >
          <option value="">Bitte wählen</option>
          {CATEGORY_OPTIONS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {/* Dropzone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        style={{
          border: '2px dashed #999',
          padding: 30,
          textAlign: 'center',
          background: dragActive ? '#faf8f3' : '#fff'
        }}
      >
        Dateien hier reinziehen

        <br /><br />

        <button onClick={() => fileInputRef.current.click()}>
          Dateien auswählen
        </button>

        <input
          type="file"
          multiple
          ref={fileInputRef}
          hidden
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {/* Dateien */}
      {files.length > 0 && (
        <div style={{ marginTop: 20 }}>
          {files.map((file, i) => (
            <div key={i}>
              {file.name}
              <button onClick={() => removeFile(i)}>Entfernen</button>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={uploadFiles}
        style={{ marginTop: 20 }}
      >
        {uploading ? 'Lädt...' : 'Upload starten'}
      </button>

      <hr style={{ margin: '40px 0' }} />

      <h2>Dokumente</h2>

      {loading ? (
        <p>Lade...</p>
      ) : (
        documents.map((doc) => (
          <div key={doc.id} style={{
            padding: 10,
            border: '1px solid #ddd',
            marginBottom: 10,
            borderRadius: 10
          }}>
            <strong>{doc.file_name}</strong>
            <br />
            {doc.category} | {doc.source}
          </div>
        ))
      )}
    </main>
  );
}


const wrap = { padding: 30, background: '#f7f5ef', minHeight: '100vh' }; const container = { maxWidth: 1180, margin: '0 auto', display: 'grid', gap: 20 }; const heroCard = { background: '#fff', padding: 28, borderRadius: 20, border: '1px solid #e7e1d6', boxShadow: '0 10px 24px rgba(16, 24, 40, 0.04)' }; const badge = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '8px 12px', borderRadius: 999, border: '1px solid #ddd6c8', color: '#6b5b45', background: '#faf8f3', fontSize: 13, fontWeight: 700, marginBottom: 12 }; const mainTitle = { margin: 0, fontSize: 30, color: '#101828' }; const heroText = { margin: '12px 0 0 0', fontSize: 16, color: '#475467', lineHeight: 1.6 }; const card = { background: '#fff', padding: 24, borderRadius: 18, border: '1px solid #e7e1d6', boxShadow: '0 10px 24px rgba(16, 24, 40, 0.04)' }; const sectionTitle = { margin: '0 0 16px 0', fontSize: 22, color: '#101828' }; const grid3 = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 }; const field = { display: 'grid', gap: 8 }; const label = { fontSize: 14, fontWeight: 700, color: '#344054' }; const input = { width: '100%', padding: 12, borderRadius: 12, border: '1px solid #d0d5dd', boxSizing: 'border-box', background: '#fff' }; const dropzone = { border: '2px dashed #d0d5dd', borderRadius: 18, padding: '26px 20px', background: '#fcfcfd', display: 'grid', gap: 10, justifyItems: 'center', textAlign: 'center', transition: 'all 0.15s ease' }; const dropzoneActive = { border: '2px dashed #8c6b43', background: '#faf8f3' }; const dropzoneTitle = { fontSize: 18, fontWeight: 700, color: '#101828' }; const dropzoneText = { fontSize: 14, color: '#667085' }; const fileList = { display: 'grid', gap: 10, marginTop: 16 }; const fileCard = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, border: '1px solid #eceff3', background: '#fcfcfd' }; const fileInfo = { minWidth: 0 }; const fileName = { fontSize: 14, fontWeight: 700, color: '#101828', wordBreak: 'break-word' }; const fileMeta = { marginTop: 4, fontSize: 12, color: '#667085' }; const actionRow = { display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }; const saveButton = { padding: '12px 16px', borderRadius: 12, border: 'none', background: '#8c6b43', color: '#fff', fontWeight: 700, cursor: 'pointer' }; const secondaryButton = { padding: '12px 16px', borderRadius: 12, border: '1px solid #d0d5dd', background: '#fff', color: '#101828', fontWeight: 700, cursor: 'pointer' }; const removeButton = { padding: '10px 12px', borderRadius: 10, border: '1px solid #fecdca', background: '#fff', color: '#b42318', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }; const infoBox = { padding: '14px 16px', borderRadius: 14, background: '#fffaeb', border: '1px solid #fedf89', color: '#b54708', marginTop: 16 }; const errorBox = { padding: '14px 16px', borderRadius: 14, background: '#fef3f2', border: '1px solid #fecdca', color: '#b42318' }; const successBox = { padding: '14px 16px', borderRadius: 14, background: '#ecfdf3', border: '1px solid #abefc6', color: '#067647' }; const groupList = { display: 'grid', gap: 16 }; const groupCard = { background: '#fcfcfd', border: '1px solid #eceff3', borderRadius: 16, padding: 16 }; const groupTitle = { fontSize: 18, fontWeight: 800, color: '#101828', marginBottom: 12 }; const documentList = { display: 'grid', gap: 10 }; const documentCard = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, background: '#fff', border: '1px solid #eceff3' }; const documentName = { fontSize: 14, fontWeight: 700, color: '#101828' }; const documentMeta = { marginTop: 4, fontSize: 12, color: '#667085' }; const documentActions = { display: 'flex', gap: 8, flexWrap: 'wrap' }; const openLink = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '10px 12px', borderRadius: 10, background: '#8c6b43', color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 14 }; const downloadLink = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '10px 12px', borderRadius: 10, background: '#fff', color: '#101828', border: '1px solid #d0d5dd', textDecoration: 'none', fontWeight: 700, fontSize: 14 };
