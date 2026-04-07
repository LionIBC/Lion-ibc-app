'use client';

import { useMemo, useState } from 'react';
import FormHeader from '@/components/FormHeader';

const initialState = {
  firmenname: '',
  rechtsform: 'GmbH',
  rechtsformSonstige: '',
  gruendungsdatum: '',
  branche: '',
  taetigkeit: '',
  website: '',
  strasse: '',
  plz: '',
  ort: '',
  land: 'Deutschland',

  ansprechpartnerVorname: '',
  ansprechpartnerNachname: '',
  ansprechpartnerPosition: '',
  email: '',
  telefon: '',

  unternehmensnummer: '',
  betriebsnummer: '',
  bgPin: '',

  steuernummer: '',
  ustid: '',
  handelsregisterVorhanden: 'Nein',
  handelsregisternummer: '',
  registergericht: '',
  mitarbeiterzahl: '',

  inhaber1: '',
  inhaber2: '',
  gesellschafter1: '',
  gesellschafter2: '',
  geschaeftsfuehrer1: '',
  geschaeftsfuehrer2: '',

  fibuGewuenscht: 'Ja',
  fibuAb: '',
  lohnGewuenscht: 'Nein',
  lohnAb: '',
  lohnMitarbeiterzahl: '',
  jahresabschlussGewuenscht: 'Ja',
  steuererklaerungenGewuenscht: 'Ja',
  sonstigeBeratungGewuenscht: 'Nein',
  sonstigeBeratungText: '',
  dringlichkeit: 'innerhalb 1 Monat',

  ustPflichtig: 'Ja',
  ustTurnus: 'monatlich',
  ustFinanzamtStatus: 'Unklar',
  lohnDurchUns: 'Nein',
  lohnsteuerTurnus: '',
  lohnFinanzamtStatus: 'Unklar',

  notizen: '',
  datenschutzBestaetigt: false
};

const rechtsformen = [
  'Einzelunternehmen',
  'Freiberufler',
  'GbR',
  'OHG',
  'KG',
  'GmbH',
  'UG (haftungsbeschränkt)',
  'AG',
  'Sonstige'
];

function InputField({ id, label, value, onChange, type = 'text', required = false, placeholder = '' }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}{required ? ' *' : ''}</label>
      <input id={id} type={type} value={value} placeholder={placeholder} onChange={onChange} required={required} />
    </div>
  );
}

function SelectField({ id, label, value, onChange, options, required = false }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}{required ? ' *' : ''}</label>
      <select id={id} value={value} onChange={onChange} required={required}>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </div>
  );
}

export default function NeukundePage() {
  const [form, setForm] = useState(initialState);
  const [status, setStatus] = useState(null);
  const [sending, setSending] = useState(false);

  const showInhaber = useMemo(
    () => ['Einzelunternehmen', 'Freiberufler'].includes(form.rechtsform),
    [form.rechtsform]
  );
  const showGesellschafter = useMemo(
    () => ['GbR', 'OHG', 'KG', 'GmbH', 'UG (haftungsbeschränkt)', 'AG', 'Sonstige'].includes(form.rechtsform),
    [form.rechtsform]
  );
  const showGeschaeftsfuehrer = useMemo(
    () => ['GmbH', 'UG (haftungsbeschränkt)', 'AG', 'Sonstige'].includes(form.rechtsform),
    [form.rechtsform]
  );

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSending(true);
    setStatus(null);

    try {
      const res = await fetch('/api/new-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      const data = await res.json();
      if (res.ok) {
        setStatus({ type: 'success', message: data.message });
        setForm(initialState);
      } else {
        setStatus({ type: 'error', message: data.message || 'Fehler beim Senden.' });
      }
    } catch {
      setStatus({ type: 'error', message: 'Die Anfrage konnte nicht gesendet werden.' });
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="container">
      <div className="formCard">
        <FormHeader
          title="Neukundenaufnahme Unternehmen"
          description="Bitte alle wesentlichen Firmendaten, Verantwortlichen und gewünschten Leistungen eintragen. Pflichtfelder sind markiert."
        />

        <div className="noticeBox">
          Bitte tragen Sie die wichtigsten Unternehmensdaten vollständig ein. Nach dem Absenden erhalten Sie eine Bestätigung und Lion IBC wird automatisch per E-Mail informiert.
        </div>

        {status && status.type === 'error' && <div className='error' style={{ margin: '18px 0' }}>{status.message}</div>}
        {status && status.type === 'success' && (
          <div className='successPanel'>
            <h4>✅ Vielen Dank!</h4>
            <p>Ihre Daten wurden erfolgreich übermittelt.</p>
            <p>Wir melden uns kurzfristig bei Ihnen.</p>
            <p>📎 Bitte senden Sie ggf. fehlende Unterlagen separat per E-Mail.</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <section className="sectionCard">
            <h3>1. Firmendaten</h3>
            <div className="formGrid">
              <InputField id="firmenname" label="Firmenname" value={form.firmenname} onChange={(e) => update('firmenname', e.target.value)} required />
              <SelectField id="rechtsform" label="Rechtsform" value={form.rechtsform} onChange={(e) => update('rechtsform', e.target.value)} options={rechtsformen} required />
              {form.rechtsform === 'Sonstige' && (
                <InputField id="rechtsformSonstige" label="Sonstige Rechtsform" value={form.rechtsformSonstige} onChange={(e) => update('rechtsformSonstige', e.target.value)} required />
              )}
              <InputField id="gruendungsdatum" label="Gründungsdatum" type="date" value={form.gruendungsdatum} onChange={(e) => update('gruendungsdatum', e.target.value)} />
              <InputField id="branche" label="Branche" value={form.branche} onChange={(e) => update('branche', e.target.value)} required />
              <InputField id="taetigkeit" label="Geschäftszweck / Tätigkeit" value={form.taetigkeit} onChange={(e) => update('taetigkeit', e.target.value)} />
              <InputField id="website" label="Website" value={form.website} onChange={(e) => update('website', e.target.value)} />
              <InputField id="mitarbeiterzahl" label="Anzahl Mitarbeiter aktuell" value={form.mitarbeiterzahl} onChange={(e) => update('mitarbeiterzahl', e.target.value)} />
              <InputField id="strasse" label="Straße / Hausnummer" value={form.strasse} onChange={(e) => update('strasse', e.target.value)} required />
              <InputField id="plz" label="PLZ" value={form.plz} onChange={(e) => update('plz', e.target.value)} required />
              <InputField id="ort" label="Ort" value={form.ort} onChange={(e) => update('ort', e.target.value)} required />
              <InputField id="land" label="Land" value={form.land} onChange={(e) => update('land', e.target.value)} required />
            </div>
          </section>

          <section className="sectionCard">
            <h3>2. Ansprechpartner</h3>
            <div className="formGrid">
              <InputField id="ansprechpartnerVorname" label="Vorname" value={form.ansprechpartnerVorname} onChange={(e) => update('ansprechpartnerVorname', e.target.value)} required />
              <InputField id="ansprechpartnerNachname" label="Nachname" value={form.ansprechpartnerNachname} onChange={(e) => update('ansprechpartnerNachname', e.target.value)} required />
              <InputField id="ansprechpartnerPosition" label="Position" value={form.ansprechpartnerPosition} onChange={(e) => update('ansprechpartnerPosition', e.target.value)} required />
              <InputField id="email" label="E-Mail" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required />
              <InputField id="telefon" label="Telefon" value={form.telefon} onChange={(e) => update('telefon', e.target.value)} required />
            </div>
          </section>

          <section className="sectionCard">
            <h3>3. Unternehmensnummern</h3>
            <div className="formGrid">
              <InputField id="unternehmensnummer" label="Unternehmensnummer" value={form.unternehmensnummer} onChange={(e) => update('unternehmensnummer', e.target.value)} />
              <InputField id="betriebsnummer" label="Betriebsnummer" value={form.betriebsnummer} onChange={(e) => update('betriebsnummer', e.target.value)} required />
              <InputField id="bgPin" label="BG-PIN" value={form.bgPin} onChange={(e) => update('bgPin', e.target.value)} />
            </div>
          </section>

          <section className="sectionCard">
            <h3>4. Steuer & Register</h3>
            <div className="formGrid">
              <InputField id="steuernummer" label="Steuernummer" value={form.steuernummer} onChange={(e) => update('steuernummer', e.target.value)} />
              <InputField id="ustid" label="USt-IdNr." value={form.ustid} onChange={(e) => update('ustid', e.target.value)} />
              <SelectField id="handelsregisterVorhanden" label="Handelsregister vorhanden" value={form.handelsregisterVorhanden} onChange={(e) => update('handelsregisterVorhanden', e.target.value)} options={['Nein', 'Ja']} />
              {form.handelsregisterVorhanden === 'Ja' && (
                <>
                  <InputField id="handelsregisternummer" label="Handelsregisternummer" value={form.handelsregisternummer} onChange={(e) => update('handelsregisternummer', e.target.value)} />
                  <InputField id="registergericht" label="Registergericht" value={form.registergericht} onChange={(e) => update('registergericht', e.target.value)} />
                </>
              )}
            </div>
          </section>

          <section className="sectionCard">
            <h3>5. Unternehmensstruktur</h3>
            <p className="subtle">Je nach Rechtsform werden die passenden Felder eingeblendet.</p>
            <div className="formGrid">
              {showInhaber && (
                <>
                  <InputField id="inhaber1" label="Inhaber 1" value={form.inhaber1} onChange={(e) => update('inhaber1', e.target.value)} required={showInhaber} />
                  <InputField id="inhaber2" label="Inhaber 2" value={form.inhaber2} onChange={(e) => update('inhaber2', e.target.value)} />
                </>
              )}

              {showGesellschafter && (
                <>
                  <InputField id="gesellschafter1" label="Gesellschafter 1" value={form.gesellschafter1} onChange={(e) => update('gesellschafter1', e.target.value)} required={showGesellschafter} />
                  <InputField id="gesellschafter2" label="Gesellschafter 2" value={form.gesellschafter2} onChange={(e) => update('gesellschafter2', e.target.value)} />
                </>
              )}

              {showGeschaeftsfuehrer && (
                <>
                  <InputField id="geschaeftsfuehrer1" label="Geschäftsführer 1" value={form.geschaeftsfuehrer1} onChange={(e) => update('geschaeftsfuehrer1', e.target.value)} required={showGeschaeftsfuehrer} />
                  <InputField id="geschaeftsfuehrer2" label="Geschäftsführer 2" value={form.geschaeftsfuehrer2} onChange={(e) => update('geschaeftsfuehrer2', e.target.value)} />
                </>
              )}
            </div>
          </section>

          <section className="sectionCard">
            <h3>6. Gewünschte Leistungen</h3>
            <div className="formGrid">
              <SelectField id="fibuGewuenscht" label="Finanzbuchhaltung gewünscht" value={form.fibuGewuenscht} onChange={(e) => update('fibuGewuenscht', e.target.value)} options={['Ja', 'Nein']} />
              {form.fibuGewuenscht === 'Ja' && (
                <InputField id="fibuAb" label="Finanzbuchhaltung ab" type="date" value={form.fibuAb} onChange={(e) => update('fibuAb', e.target.value)} />
              )}
              <SelectField id="lohnGewuenscht" label="Lohnabrechnungen gewünscht" value={form.lohnGewuenscht} onChange={(e) => update('lohnGewuenscht', e.target.value)} options={['Ja', 'Nein']} />
              {form.lohnGewuenscht === 'Ja' && (
                <>
                  <InputField id="lohnAb" label="Lohnabrechnungen ab" type="date" value={form.lohnAb} onChange={(e) => update('lohnAb', e.target.value)} />
                  <InputField id="lohnMitarbeiterzahl" label="Anzahl Mitarbeiter für Lohn" value={form.lohnMitarbeiterzahl} onChange={(e) => update('lohnMitarbeiterzahl', e.target.value)} />
                </>
              )}
              <SelectField id="jahresabschlussGewuenscht" label="Jahresabschluss gewünscht" value={form.jahresabschlussGewuenscht} onChange={(e) => update('jahresabschlussGewuenscht', e.target.value)} options={['Ja', 'Nein']} />
              <SelectField id="steuererklaerungenGewuenscht" label="Steuererklärungen gewünscht" value={form.steuererklaerungenGewuenscht} onChange={(e) => update('steuererklaerungenGewuenscht', e.target.value)} options={['Ja', 'Nein']} />
              <SelectField id="sonstigeBeratungGewuenscht" label="Sonstige Beratung gewünscht" value={form.sonstigeBeratungGewuenscht} onChange={(e) => update('sonstigeBeratungGewuenscht', e.target.value)} options={['Ja', 'Nein']} />
              {form.sonstigeBeratungGewuenscht === 'Ja' && (
                <div className="field spanTwo">
                  <label htmlFor="sonstigeBeratungText">Welche sonstige Beratung wird gewünscht?</label>
                  <textarea id="sonstigeBeratungText" value={form.sonstigeBeratungText} onChange={(e) => update('sonstigeBeratungText', e.target.value)} />
                </div>
              )}
              <SelectField id="dringlichkeit" label="Dringlichkeit" value={form.dringlichkeit} onChange={(e) => update('dringlichkeit', e.target.value)} options={['sofort', 'innerhalb 1 Monat', 'geplant']} />
            </div>
          </section>

          <section className="sectionCard">
            <h3>7. Steuerliche Meldungen</h3>
            <div className="formGrid">
              <SelectField id="ustPflichtig" label="Umsatzsteuerpflichtig" value={form.ustPflichtig} onChange={(e) => update('ustPflichtig', e.target.value)} options={['Ja', 'Nein']} />
              {form.ustPflichtig === 'Ja' && (
                <>
                  <SelectField id="ustTurnus" label="Umsatzsteuervoranmeldung Turnus" value={form.ustTurnus} onChange={(e) => update('ustTurnus', e.target.value)} options={['monatlich', 'quartalsweise', 'jährlich']} />
                  <SelectField id="ustFinanzamtStatus" label="USt-Turnus beim Finanzamt hinterlegt" value={form.ustFinanzamtStatus} onChange={(e) => update('ustFinanzamtStatus', e.target.value)} options={['Ja', 'Nein', 'Unklar']} />
                </>
              )}

              <SelectField id="lohnDurchUns" label="Führen wir die Lohnabrechnung aus?" value={form.lohnDurchUns} onChange={(e) => update('lohnDurchUns', e.target.value)} options={['Ja', 'Nein']} />
              {form.lohnDurchUns === 'Ja' && (
                <>
                  <SelectField id="lohnsteuerTurnus" label="Lohnsteuer-Anmeldeturnus" value={form.lohnsteuerTurnus} onChange={(e) => update('lohnsteuerTurnus', e.target.value)} options={['monatlich', 'quartalsweise', 'jährlich']} required />
                  <SelectField id="lohnFinanzamtStatus" label="Lohnsteuer-Turnus beim Finanzamt hinterlegt" value={form.lohnFinanzamtStatus} onChange={(e) => update('lohnFinanzamtStatus', e.target.value)} options={['Ja', 'Nein', 'Unklar']} />
                </>
              )}
            </div>
          </section>

          <section className="sectionCard">
            <h3>8. Zusätzliche Hinweise</h3>
            <div className="field">
              <label htmlFor="notizen">Notizen</label>
              <textarea id="notizen" value={form.notizen} onChange={(e) => update('notizen', e.target.value)} placeholder="Besondere Hinweise, Rückfragen oder gewünschte Rückrufzeiten" />
            </div>
            <label className="checkboxRow">
              <input
                type="checkbox"
                checked={form.datenschutzBestaetigt}
                onChange={(e) => update('datenschutzBestaetigt', e.target.checked)}
                required
              />
              <span>Ich stimme der Verarbeitung meiner Daten zu. *</span>
            </label>
          </section>

          <div className="actions">
            <button type="submit" disabled={sending}>{sending ? 'Wird gesendet ...' : 'Daten übermitteln'}</button>
          </div>
        </form>
      </div>
    </main>
  );
}
