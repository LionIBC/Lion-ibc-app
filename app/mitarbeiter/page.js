'use client';

import { useState } from 'react';
import FormHeader from '@/components/FormHeader';

const initialState = {
  firma: '', vorname: '', nachname: '', geburtsdatum: '', email: '', telefon: '',
  strasse: '', plz: '', ort: '', staatsangehoerigkeit: '', familienstand: '',
  steuerId: '', svNummer: '', krankenkasse: '', eintrittsdatum: '', beschaeftigungsart: '',
  wochenstunden: '', gehalt: '', iban: '', notizen: ''
};

export default function MitarbeiterPage() {
  const [form, setForm] = useState(initialState);
  const [status, setStatus] = useState(null);
  const [sending, setSending] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSending(true);
    setStatus(null);

    const res = await fetch('/api/new-employee', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });

    const data = await res.json();
    setSending(false);

    if (res.ok) {
      setStatus({ type: 'success', message: data.message });
      setForm(initialState);
    } else {
      setStatus({ type: 'error', message: data.message || 'Fehler beim Senden.' });
    }
  }

  return (
    <main className="container">
      <div className="formCard">
        <FormHeader
          title="Neuen Mitarbeiter melden"
          description="Dieses Formular dient zur strukturierten Erfassung neuer Mitarbeiterdaten für bestehende Mandanten."
        />

        {status && <div className={status.type === 'success' ? 'success' : 'error'} style={{ margin: '18px 0' }}>{status.message}</div>}

        <form onSubmit={handleSubmit}>
          <div className="formGrid">
            {[
              ['firma', 'Firma / Mandant *'], ['vorname', 'Vorname *'], ['nachname', 'Nachname *'],
              ['geburtsdatum', 'Geburtsdatum *'], ['email', 'E-Mail'], ['telefon', 'Telefon'],
              ['strasse', 'Straße / Hausnummer *'], ['plz', 'PLZ *'], ['ort', 'Ort *'],
              ['staatsangehoerigkeit', 'Staatsangehörigkeit'], ['familienstand', 'Familienstand'], ['steuerId', 'Steuer-ID'],
              ['svNummer', 'Sozialversicherungsnummer'], ['krankenkasse', 'Krankenkasse'], ['eintrittsdatum', 'Eintrittsdatum *'],
              ['beschaeftigungsart', 'Beschäftigungsart *'], ['wochenstunden', 'Wochenstunden'], ['gehalt', 'Monatsgehalt / Stundenlohn'],
              ['iban', 'IBAN']
            ].map(([key, label]) => (
              <div className="field" key={key}>
                <label htmlFor={key}>{label}</label>
                <input
                  id={key}
                  type={key.includes('email') ? 'email' : key.includes('datum') ? 'date' : 'text'}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              </div>
            ))}
          </div>

          <div className="field">
            <label htmlFor="notizen">Zusätzliche Hinweise</label>
            <textarea id="notizen" value={form.notizen} onChange={(e) => setForm({ ...form, notizen: e.target.value })} />
          </div>

          <p className="hint">Sensible Mitarbeiterdaten sollten später zusätzlich in einer verschlüsselten Datenbank gespeichert werden.</p>
          <div className="actions">
            <button type="submit" disabled={sending}>{sending ? 'Wird gesendet ...' : 'Mitarbeiter absenden'}</button>
          </div>
        </form>
      </div>
    </main>
  );
}
