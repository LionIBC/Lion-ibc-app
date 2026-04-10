'use client';

import { useState } from 'react';

export default function StammdatenPage() {
  const [form, setForm] = useState({
    firmenname: '',
    rechtsform: '',
    gruendungsdatum: '',
    sitz: '',
    hrb: '',
    amtsgericht: '',

    ustId: '',
    wirtschaftsId: '',
    steuerMeldung: '',
    lohnsteuerMeldung: '',
    dauerfrist: false,

    steuernummern: [''],

    gesellschafter: [{ name: '' }],
    geschaeftsfuehrer: [{ name: '' }],
    inhaber: { name: '', steuerId: '' },

    kontakte: [{ name: '', email: '', telefon: '' }]
  });

  const isEinzelunternehmen = form.rechtsform === 'Einzelunternehmen';

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateArray(key, index, field, value) {
    const updated = [...form[key]];
    updated[index][field] = value;
    update(key, updated);
  }

  function addItem(key, template) {
    update(key, [...form[key], template]);
  }

  function removeItem(key, index) {
    const updated = form[key].filter((_, i) => i !== index);
    update(key, updated);
  }

  return (
    <main style={container}>
      <div style={card}>

        <h1 style={title}>Stammdaten</h1>

        {/* UNTERNEHMEN */}
        <section style={section}>
          <h3>Unternehmensdaten</h3>
          <div style={grid}>
            <Input label="Firmenname" value={form.firmenname} onChange={(v) => update('firmenname', v)} />
            <Input label="Rechtsform" value={form.rechtsform} onChange={(v) => update('rechtsform', v)} />
            <Input label="Gründungsdatum" type="date" value={form.gruendungsdatum} onChange={(v) => update('gruendungsdatum', v)} />
            <Input label="Unternehmenssitz" value={form.sitz} onChange={(v) => update('sitz', v)} />
            <Input label="HRB Nummer" value={form.hrb} onChange={(v) => update('hrb', v)} />
            <Input label="Amtsgericht" value={form.amtsgericht} onChange={(v) => update('amtsgericht', v)} />
          </div>
        </section>

        {/* STEUERN */}
        <section style={section}>
          <h3>Steuerliche Daten</h3>

          <Input label="USt-ID" value={form.ustId} onChange={(v) => {
            update('ustId', v);
            update('wirtschaftsId', v + '-00001');
          }} />

          <Input label="Wirtschafts-ID" value={form.wirtschaftsId} disabled />

          <Select label="Umsatzsteuer-Voranmeldung" value={form.steuerMeldung}
            options={['monatlich', 'quartal', 'jährlich']}
            onChange={(v) => update('steuerMeldung', v)} />

          <Select label="Lohnsteuer-Anmeldung" value={form.lohnsteuerMeldung}
            options={['monatlich', 'quartal', 'jährlich']}
            onChange={(v) => update('lohnsteuerMeldung', v)} />

          <Checkbox
            label="Dauerfristverlängerung aktiv"
            checked={form.dauerfrist}
            onChange={(v) => update('dauerfrist', v)}
          />

          <h4>Steuernummern</h4>
          {form.steuernummern.map((sn, i) => (
            <div key={i} style={row}>
              <Input value={sn} onChange={(v) => {
                const updated = [...form.steuernummern];
                updated[i] = v;
                update('steuernummern', updated);
              }} />
              <button onClick={() => removeItem('steuernummern', i)}>X</button>
            </div>
          ))}
          <button onClick={() => addItem('steuernummern', '')}>+ Steuernummer</button>
        </section>

        {/* PERSONEN */}
        {!isEinzelunternehmen ? (
          <>
            <section style={section}>
              <h3>Gesellschafter</h3>
              {form.gesellschafter.map((g, i) => (
                <div key={i} style={row}>
                  <Input value={g.name} onChange={(v) => updateArray('gesellschafter', i, 'name', v)} />
                  <button onClick={() => removeItem('gesellschafter', i)}>X</button>
                </div>
              ))}
              <button onClick={() => addItem('gesellschafter', { name: '' })}>+ hinzufügen</button>
            </section>

            <section style={section}>
              <h3>Geschäftsführer</h3>
              {form.geschaeftsfuehrer.map((g, i) => (
                <div key={i} style={row}>
                  <Input value={g.name} onChange={(v) => updateArray('geschaeftsfuehrer', i, 'name', v)} />
                  <button onClick={() => removeItem('geschaeftsfuehrer', i)}>X</button>
                </div>
              ))}
              <button onClick={() => addItem('geschaeftsfuehrer', { name: '' })}>+ hinzufügen</button>
            </section>
          </>
        ) : (
          <section style={section}>
            <h3>Inhaber</h3>
            <Input label="Name" value={form.inhaber.name} onChange={(v) => update('inhaber', { ...form.inhaber, name: v })} />
            <Input label="Steuer-ID" value={form.inhaber.steuerId} onChange={(v) => update('inhaber', { ...form.inhaber, steuerId: v })} />
          </section>
        )}

        {/* KONTAKTE */}
        <section style={section}>
          <h3>Ansprechpartner / Kontakte</h3>

          {form.kontakte.map((k, i) => (
            <div key={i} style={contactCard}>
              <Input label="Name" value={k.name} onChange={(v) => updateArray('kontakte', i, 'name', v)} />
              <Input label="E-Mail" value={k.email} onChange={(v) => updateArray('kontakte', i, 'email', v)} />
              <Input label="Telefon" value={k.telefon} onChange={(v) => updateArray('kontakte', i, 'telefon', v)} />
              <button onClick={() => removeItem('kontakte', i)}>Kontakt entfernen</button>
            </div>
          ))}

          <button onClick={() => addItem('kontakte', { name: '', email: '', telefon: '' })}>
            + Ansprechpartner hinzufügen
          </button>
        </section>

        <button style={button}>Änderungen speichern</button>

      </div>
    </main>
  );
}

/* UI */
function Input({ label, value, onChange, type = 'text', disabled = false }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {label && <label>{label}</label>}
      <input
        value={value}
        type={type}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        style={input}
      />
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div>
      <label>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={input}>
        <option value="">Bitte wählen</option>
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
    </div>
  );
}

function Checkbox({ label, checked, onChange }) {
  return (
    <label style={{ display: 'flex', gap: 10 }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

const container = { padding: 40, background: '#f5f3ee' }; const card = { background: '#fff', padding: 30, borderRadius: 20, maxWidth: 1000, margin: 'auto' }; const section = { marginBottom: 30 }; const grid = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }; const row = { display: 'flex', gap: 10, marginBottom: 10 }; const contactCard = { border: '1px solid #ddd', padding: 10, marginBottom: 10 }; const input = { padding: 10, borderRadius: 8, border: '1px solid #ccc' }; const button = { padding: 14, background: '#8c6b43', color: '#fff', borderRadius: 10 }; const title = { fontSize: 28, marginBottom: 20 };
