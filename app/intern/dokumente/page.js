'use client';

import { useEffect, useRef, useState, useMemo } from 'react';

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

// 🔥 NEU: Aufbewahrungsfrist (10 Jahre)
function retentionDate(date) {
  if (!date) return '';
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + 10);
  return d.toLocaleDateString('de-DE');
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
  const [search, setSearch] = useState(''); // 🔥 NEU
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [filterCustomerId, setFilterCustomerId] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [files, setFiles] = useState([]);
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [statusBox, setStatusBox] = useState(null);

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [filterCustomerId, filterCategory]);

  async function loadCustomers() {
    const res = await fetch('/api/customers');
    const data = await res.json();
    setCustomers(data.data || []);
  }

  async function loadDocuments() {
    setLoading(true);

    const params = new URLSearchParams();
    params.set('source', 'intern');
    if (filterCustomerId) params.set('customer_id', filterCustomerId);
    if (filterCategory) params.set('category', filterCategory);

    const res = await fetch(`/api/documents?${params.toString()}`);
    const data = await res.json();

    setDocuments(data.data || []);
    setLoading(false);
  }

  // 🔥 NEU: Suche + Sortierung
  const filteredDocs = useMemo(() => {
    return documents
      .filter((doc) =>
        `${doc.file_name} ${doc.category}`
          .toLowerCase()
          .includes(search.toLowerCase())
      )
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [documents, search]);

  const groupedDocuments = groupByCategory(filteredDocs);

  return (
    <main style={wrap}>
      <div style={container}>
        <section style={heroCard}>
          <div style={badge}>Intern</div>
          <h1 style={mainTitle}>Dokumentenverwaltung</h1>
        </section>

        {/* 🔥 NEU: Suche */}
        <section style={card}>
          <input
            placeholder="Dokument suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={input}
          />
        </section>

        <section style={card}>
          {loading ? (
            <div>Loading...</div>
          ) : groupedDocuments.length === 0 ? (
            <div>Keine Dokumente</div>
          ) : (
            groupedDocuments.map((group) => (
              <div key={group.key}>
                <h3>{group.label}</h3>

                {group.items.map((doc) => (
                  <div key={doc.id} style={documentCard}>
                    <div>
                      <div>{doc.file_name}</div>

                      {/* 🔥 NEU */}
                      <div>
                        Größe: {formatFileSize(doc.file_size)}
                      </div>

                      <div>
                        Hochgeladen: {formatDate(doc.created_at)}
                      </div>

                      <div>
                        Aufbewahrung bis: {retentionDate(doc.created_at)}
                      </div>

                      <div>
                        Erstellt von: {doc.created_by || '-'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </section>
      </div>
    </main>
  );
}

const wrap = { padding: 30 };
const container = { maxWidth: 1200, margin: '0 auto' };

const heroCard = { padding: 20, background: '#fff' };
const badge = {};
const mainTitle = {};

const card = { padding: 20, background: '#fff', marginTop: 20 };
const input = { padding: 10, width: '100%' };

const documentCard = {
  padding: 10,
  border: '1px solid #ddd',
  marginBottom: 10
};
