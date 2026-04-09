'use client';

import { useMemo, useState } from 'react';
import FormHeader from '../../components/FormHeader';

const initialState = {
  firma: '',
  einstellungsart: 'Arbeitnehmer',

  vorname: '',
  nachname: '',
  strasse: '',
  plz: '',
  ort: '',
  geburtsdatum: '',
  staatsangehoerigkeit: '',
  email: '',
  telefon: '',

  steuerId: '',
  steuerklasse: '',
  konfession: '',

  svNummer: '',
  geburtsname: '',
  geburtsort: '',
  geburtsland: '',
  krankenkasse: '',
  versicherungsart: 'gesetzlich',

  eintrittsdatum: '',
  taetigkeitsbereich: '',
  arbeitsort: '',

  verguetungsart: 'Gehalt',
  stundensatz: '',
  gehaltsbetrag: '',
  gehaltExtras: '',
  wochenstunden: '',
  arbeitstage: [],
  urlaubsanspruch: '',

  minijobVerdienst: '',
  weitereMinijobs: 'Nein',
  weitererMinijobArbeitgeber: '',
  weitererMinijobVerdienst: '',
  weitererMinijobBeginn: '',
  rvBefreiung: 'Keine Angabe',

  midijobMonatsverdienst: '',
  immatrikulationVorhanden: 'Nein',
  ausbildungsberuf: '',
  ausbildungsbeginn: '',
  beteiligungProzent: '',
  sperrminoritaet: '',
  rentenart: '',
  rentenbeginn: '',

  mycenterHinweisAkzeptiert: true,
  arbeitsvertragGewuenscht: 'Ja',
  vertragsart: '',
  probezeit: '',
  kuendigungsfrist: '',
  zusatzvereinbarungen: '',
  notizen: ''
};

const arbeitstageOptionen = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
const einstellungsarten = ['Minijob', 'Midijob', 'Werkstudent', 'Azubi', 'Arbeitnehmer', 'geschäftsführender Gesellschafter', 'Rentner'];

function InputField({
  id,
  label,
  value,
  onChange,
  type = 'text',
  required = false,
  placeholder = '',
  hint = '',
  error = ''
}) {
  return (
    <div className="field">
      <label htmlFor={id}>
        {label}
        {required ? ' *' : ''}
      </label>

      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        style={error ? { borderColor: '#dc2626', background: '#fef2f2' } : {}}
      />

      {error ? (
        <span className="hint" style={{ color: '#dc2626' }}>
          {error}
        </span>
      ) : hint ? (
        <span className="hint">{hint}</span>
      ) : null}
    </div>
  );
}


function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  required = false,
  hint = '',
  error = ''
}) {
  return (
    <div className="field">
      <label htmlFor={id}>
        {label}
        {required ? ' *' : ''}
      </label>

      <select
        id={id}
        value={value}
        onChange={onChange}
        required={required}
        style={error ? { borderColor: '#dc2626', background: '#fef2f2' } : {}}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

      {error ? (
        <span className="hint" style={{ color: '#dc2626' }}>
          {error}
        </span>
      ) : hint ? (
        <span className="hint">{hint}</span>
      ) : null}
    </div>
  );
}


function TextAreaField({
  id,
  label,
  value,
  onChange,
  required = false,
  placeholder = '',
  hint = '',
  error = ''
}) {
  return (
    <div className="field spanTwo">
      <label htmlFor={id}>
        {label}
        {required ? ' *' : ''}
      </label>

      <textarea
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={error ? { borderColor: '#dc2626', background: '#fef2f2' } : {}}
      />

      {error ? (
        <span className="hint" style={{ color: '#dc2626' }}>
          {error}
        </span>
      ) : hint ? (
        <span className="hint">{hint}</span>
      ) : null}
    </div>
  );
}


export default function MitarbeiterPage() {
  const [form, setForm] = useState(initialState);
  const [status, setStatus] = useState(null);
  const [sending, setSending] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const isMinijob = form.einstellungsart === 'Minijob';
  const isMidijob = form.einstellungsart === 'Midijob';
  const isWerkstudent = form.einstellungsart === 'Werkstudent';
  const isAzubi = form.einstellungsart === 'Azubi';
  const isGf = form.einstellungsart === 'geschäftsführender Gesellschafter';
  const isRentner = form.einstellungsart === 'Rentner';
  const isGehalt = form.verguetungsart === 'Gehalt';

  const hinweise = useMemo(() => {
    const warnings = [];

    if (!form.email.trim()) {
      warnings.push('Keine E-Mail-Adresse angegeben. Der Mitarbeiter kann nicht im MyCenter registriert werden. Das Mitarbeiterportal für Krankmeldungen, Stundenerfassung, Urlaubsverwaltung und digitale Lohnabrechnungen kann somit nicht genutzt werden.');
    }

    if (!form.steuerId.trim()) {
      warnings.push('Steuer-ID fehlt. Der Mitarbeiter wird bis zur Nachreichung mit Steuerklasse 6 abgerechnet.');
    }

    if (!form.svNummer.trim()) {
      warnings.push('Sozialversicherungsnummer fehlt. Bitte nachreichen bzw. anhand der Geburtsdaten anfordern.');
    }

    if (!form.wochenstunden.trim()) {
      warnings.push('Wochenstunden nicht angegeben. Für Arbeitsvertrag und Meldungen wie BU ist diese Angabe vorteilhaft.');
    }

    if (form.arbeitstage.length === 0) {
      warnings.push('Es wurden keine Arbeitstage ausgewählt. Für Arbeitsvertrag und Arbeitszeitregelung ist diese Angabe vorteilhaft.');
    }

    if (!form.urlaubsanspruch.trim()) {
      warnings.push('Urlaubsanspruch nicht angegeben. Für Arbeitsvertrag und die korrekte Anlage wird diese Angabe empfohlen.');
    }

    if (isMinijob) {
      const minijobValue = Number((form.minijobVerdienst || '').replace(',', '.'));
      if (!Number.isNaN(minijobValue) && minijobValue > 603) {
        warnings.push('Verdienst über 603 € angegeben. Bitte prüfen, ob weiterhin ein Minijob vorliegt.');
      }
      if (form.weitereMinijobs === 'Ja') {
        warnings.push('Weitere Minijobs angegeben. Zusammenrechnung und sozialversicherungsrechtliche Prüfung erforderlich.');
      }
      if (form.rvBefreiung === 'Keine Befreiung') {
        warnings.push('Der Mitarbeiter ist nicht von der Rentenversicherungspflicht befreit und zahlt Rentenversicherungsbeiträge.');
      }
      if (form.rvBefreiung === 'Keine Angabe') {
        warnings.push('Keine Angabe zur Rentenversicherungspflicht gemacht. Bitte klären, ob eine Befreiung gewünscht ist.');
      }
    }

    if (isMidijob) {
      const val = Number((form.midijobMonatsverdienst || '').replace(',', '.'));
      if (!Number.isNaN(val) && val > 0 && val <= 603) {
        warnings.push('Der angegebene Verdienst liegt im Minijob-Bereich. Bitte Einstellungsart prüfen.');
      }
      if (!Number.isNaN(val) && val > 2000) {
        warnings.push('Der angegebene Verdienst liegt oberhalb des Midijob-Bereichs. Bitte Einstellungsart prüfen.');
      }
    }

    return warnings;
  }, [form, isMinijob, isMidijob]);

  function update(key, value) {
  setForm((current) => ({ ...current, [key]: value }));

  setFieldErrors((current) => {
    if (!current[key]) return current;
    const next = { ...current };
    delete next[key];
    return next;
  });
}


  function toggleArbeitstag(tag) {
    setForm((current) => ({
      ...current,
      arbeitstage: current.arbeitstage.includes(tag)
        ? current.arbeitstage.filter((item) => item !== tag)
        : [...current.arbeitstage, tag]
    }));
  }

async function handleSubmit(e) {
  e.preventDefault();
  setSending(true);
  setStatus(null);
  setFieldErrors({});

  const payload = { ...form, warnungen: hinweise };

  const res = await fetch('/api/new-employee', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  setSending(false);

  if (res.ok) {
    setStatus({ type: 'success', message: data.message });
    setFieldErrors({});
    setForm(initialState);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    setStatus({ type: 'error', message: data.message || 'Fehler beim Senden.' });
    setFieldErrors(data.fieldErrors || {});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}


  return (
    <main className="container">
      <div className="formCard">
        <FormHeader
          title="Mitarbeiter anlegen"
          description="Erfassen Sie hier alle relevanten Daten für die Neuanlage eines Mitarbeiters. Auf Basis der Angaben können Anmeldung, Lohnanlage, MyCenter-Zugang und später auch Arbeitsvertragsvorlagen vorbereitet werden."
        />

        <div className="noticeBox">
          Arbeitgeber / Unternehmen ist ein Pflichtfeld. Ohne diese Angabe kann der Mitarbeiter nicht angemeldet werden.
          Fehlende Angaben wie Steuer-ID, E-Mail oder SV-Nummer werden automatisch als Hinweise an personal@bbs-leiste.de mitgesendet.
        </div>

        {status && status.type === 'error' && <div className="error" style={{ margin: '18px 0' }}>{status.message}</div>}
        {status && status.type === 'success' && (
          <div className="successPanel">
            <h4>✅ Mitarbeiterdaten erfolgreich übermittelt</h4>
            <p>{status.message}</p>
            <p>Die Angaben wurden an personal@bbs-leiste.de weitergeleitet.</p>
          </div>
        )}

        {hinweise.length > 0 && (
          <div className="warningPanel" style={{ marginBottom: 20 }}>
            <strong>Aktuelle Hinweise</strong>
            <ul className="clean" style={{ margin: '10px 0 0 0' }}>
              {hinweise.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <section className="sectionCard">
            <h3>1. Arbeitgeber & Einstellungsart</h3>
            <div className="formGrid">
              <InputField id="firma" label="Arbeitgeber / Unternehmen" value={form.firma} onChange={(e) => update('firma', e.target.value)} required hint="Bitte geben Sie den Namen des Unternehmens an, für das der Mitarbeiter angelegt wird." error={fieldErrors.firma?.[0]} />
              <SelectField id="einstellungsart" label="Einstellungsart" value={form.einstellungsart} onChange={(e) => update('einstellungsart', e.target.value)} options={einstellungsarten} required hint="Es werden nur die Felder eingeblendet, die zur gewählten Beschäftigungsart passen." error={fieldErrors.einstellungsart?.[0]} />
            </div>
          </section>

          <section className="sectionCard">
            <h3>2. Persönliche Daten</h3>
            <div className="formGrid">
              <InputField id="vorname" label="Vorname" value={form.vorname} onChange={(e) => update('vorname', e.target.value)} required error={fieldErrors.vorname?.[0]} />
              <InputField id="nachname" label="Nachname" value={form.nachname} onChange={(e) => update('nachname', e.target.value)} required error={fieldErrors.nachname?.[0]} />
              <InputField id="strasse" label="Straße / Hausnummer" value={form.strasse} onChange={(e) => update('strasse', e.target.value)} required error={fieldErrors.strasse?.[0]} />
              <InputField id="plz" label="PLZ" value={form.plz} onChange={(e) => update('plz', e.target.value)} required error={fieldErrors.plz?.[0]} />
              <InputField id="ort" label="Ort" value={form.ort} onChange={(e) => update('ort', e.target.value)} required error={fieldErrors.ort?.[0]} />
              <InputField id="geburtsdatum" label="Geburtsdatum" type="date" value={form.geburtsdatum} onChange={(e) => update('geburtsdatum', e.target.value)} required error={fieldErrors.geburtsdatum?.[0]} />
              <InputField id="staatsangehoerigkeit" label="Staatsangehörigkeit" value={form.staatsangehoerigkeit} onChange={(e) => update('staatsangehoerigkeit', e.target.value)} required error={fieldErrors.staatsangehoerigkeit?.[0]} />
              <InputField id="email" label="E-Mail-Adresse" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} hint="Die E-Mail-Adresse wird für den Zugang zum Mitarbeiterportal MyCenter benötigt." />
              <InputField id="telefon" label="Telefonnummer" value={form.telefon} onChange={(e) => update('telefon', e.target.value)} />
            </div>
          </section>

          <section className="sectionCard">
            <h3>3. Steuer & Sozialversicherung</h3>
            <div className="formGrid">
              <InputField id="steuerId" label="Steuer-ID" value={form.steuerId} onChange={(e) => update('steuerId', e.target.value)} hint="Wenn keine Steuer-ID vorliegt, wird automatisch ein Hinweis auf Steuerklasse 6 mitgesendet." />
              <InputField id="steuerklasse" label="Steuerklasse" value={form.steuerklasse} onChange={(e) => update('steuerklasse', e.target.value)} />
              <InputField id="konfession" label="Konfession" value={form.konfession} onChange={(e) => update('konfession', e.target.value)} />
              <InputField id="svNummer" label="Sozialversicherungsnummer" value={form.svNummer} onChange={(e) => update('svNummer', e.target.value)} hint="Bitte möglichst direkt eintragen. Wenn sie fehlt, wird ein Nachreich-Hinweis mitgesendet." />
              <InputField id="geburtsname" label="Geburtsname" value={form.geburtsname} onChange={(e) => update('geburtsname', e.target.value)} required error={fieldErrors.geburtsname?.[0]} />
              <InputField id="geburtsort" label="Geburtsort" value={form.geburtsort} onChange={(e) => update('geburtsort', e.target.value)} required error={fieldErrors.geburtsort?.[0]} />
              <InputField id="geburtsland" label="Geburtsland" value={form.geburtsland} onChange={(e) => update('geburtsland', e.target.value)} required error={fieldErrors.geburtsland?.[0]} />
              {!isMinijob && <InputField id="krankenkasse" label="Krankenkasse" value={form.krankenkasse} onChange={(e) => update('krankenkasse', e.target.value)} required />}
              {!isMinijob && <SelectField id="versicherungsart" label="Versicherungsart" value={form.versicherungsart} onChange={(e) => update('versicherungsart', e.target.value)} options={['gesetzlich', 'privat']} required />}
            </div>
          </section>

          <section className="sectionCard">
            <h3>4. Beschäftigung & Vergütung</h3>
            <div className="formGrid">
              <InputField id="taetigkeitsbereich" label="Tätigkeitsbereich / Tätigkeit" value={form.taetigkeitsbereich} onChange={(e) => update('taetigkeitsbereich', e.target.value)} required placeholder="z. B. Bürogehilfe, Schweißer, Verkäufer" />
              <InputField id="eintrittsdatum" label="Eintrittsdatum / ab wann anmelden" type="date" value={form.eintrittsdatum} onChange={(e) => update('eintrittsdatum', e.target.value)} required error={fieldErrors.eintrittsdatum?.[0]} />
              <InputField id="arbeitsort" label="Arbeitsort" value={form.arbeitsort} onChange={(e) => update('arbeitsort', e.target.value)} />
              <SelectField id="verguetungsart" label="Vergütungsart" value={form.verguetungsart} onChange={(e) => update('verguetungsart', e.target.value)} options={['Gehalt', 'Stundenlohn']} required />
              {isGehalt ? (
                <InputField id="gehaltsbetrag" label="Gehaltsbetrag" value={form.gehaltsbetrag} onChange={(e) => update('gehaltsbetrag', e.target.value)} required />
              ) : (
                <InputField id="stundensatz" label="Stundensatz" value={form.stundensatz} onChange={(e) => update('stundensatz', e.target.value)} required />
              )}
              {isGehalt && <TextAreaField id="gehaltExtras" label="Extras / Zuschüsse" value={form.gehaltExtras} onChange={(e) => update('gehaltExtras', e.target.value)} hint="Zum Beispiel Bonus, Prämien, Fahrtkostenzuschuss, Sachbezug oder sonstige Vergütungsbestandteile." />}
            </div>
          </section>

          <section className="sectionCard">
            <h3>5. Arbeitszeit & Vertrag</h3>
            <div className="formGrid">
              <InputField id="wochenstunden" label="Wochenstunden" value={form.wochenstunden} onChange={(e) => update('wochenstunden', e.target.value)} hint="Nicht zwingend, aber vorteilhaft für Vertrag und Meldungen wie BU." />
              <InputField id="urlaubsanspruch" label="Urlaubsanspruch pro Jahr" value={form.urlaubsanspruch} onChange={(e) => update('urlaubsanspruch', e.target.value)} hint="Zum Beispiel 24 oder 30 Tage." />
              <div className="field spanTwo">
                <label>Arbeitstage</label>
                <div className="checkboxGrid">
                  {arbeitstageOptionen.map((tag) => (
                    <label key={tag} className="checkboxChip">
                      <input type="checkbox" checked={form.arbeitstage.includes(tag)} onChange={() => toggleArbeitstag(tag)} />
                      <span>{tag}</span>
                    </label>
                  ))}
                </div>
                <span className="hint">Auch Samstag und Sonntag auswählbar.</span>
              </div>
            </div>
          </section>

          {isMinijob && (
            <section className="sectionCard">
              <h3>6. Minijob</h3>
              <div className="formGrid">
                <InputField id="minijobVerdienst" label="Monatlicher Verdienst" value={form.minijobVerdienst} onChange={(e) => update('minijobVerdienst', e.target.value)} required hint="2026 wird bis 603 € als Minijob behandelt." />
                <SelectField id="weitereMinijobs" label="Liegen weitere Minijobs vor?" value={form.weitereMinijobs} onChange={(e) => update('weitereMinijobs', e.target.value)} options={['Nein', 'Ja']} required />
                {form.weitereMinijobs === 'Ja' && <InputField id="weitererMinijobArbeitgeber" label="Weiterer Arbeitgeber" value={form.weitererMinijobArbeitgeber} onChange={(e) => update('weitererMinijobArbeitgeber', e.target.value)} required />}
                {form.weitereMinijobs === 'Ja' && <InputField id="weitererMinijobVerdienst" label="Verdienst weiterer Minijob" value={form.weitererMinijobVerdienst} onChange={(e) => update('weitererMinijobVerdienst', e.target.value)} required />}
                {form.weitereMinijobs === 'Ja' && <InputField id="weitererMinijobBeginn" label="Beginn weiterer Minijob" type="date" value={form.weitererMinijobBeginn} onChange={(e) => update('weitererMinijobBeginn', e.target.value)} />}
                <SelectField id="rvBefreiung" label="Rentenversicherung" value={form.rvBefreiung} onChange={(e) => update('rvBefreiung', e.target.value)} options={['Befreiung beantragt', 'Keine Befreiung', 'Keine Angabe']} hint="Wenn keine Befreiung gewählt wird, zahlt der Mitarbeiter Rentenversicherungsbeiträge." />
              </div>
            </section>
          )}

          {isMidijob && (
            <section className="sectionCard">
              <h3>6. Midijob</h3>
              <div className="formGrid">
                <InputField id="midijobMonatsverdienst" label="Monatsverdienst" value={form.midijobMonatsverdienst} onChange={(e) => update('midijobMonatsverdienst', e.target.value)} required hint="2026: Midijob ab 603,01 € bis 2.000 €." />
              </div>
            </section>
          )}

          {isWerkstudent && (
            <section className="sectionCard">
              <h3>6. Werkstudent</h3>
              <div className="formGrid">
                <SelectField id="immatrikulationVorhanden" label="Immatrikulationsnachweis vorhanden?" value={form.immatrikulationVorhanden} onChange={(e) => update('immatrikulationVorhanden', e.target.value)} options={['Ja', 'Nein']} />
              </div>
            </section>
          )}

          {isAzubi && (
            <section className="sectionCard">
              <h3>6. Ausbildung</h3>
              <div className="formGrid">
                <InputField id="ausbildungsberuf" label="Ausbildungsberuf" value={form.ausbildungsberuf} onChange={(e) => update('ausbildungsberuf', e.target.value)} required />
                <InputField id="ausbildungsbeginn" label="Ausbildungsbeginn" type="date" value={form.ausbildungsbeginn} onChange={(e) => update('ausbildungsbeginn', e.target.value)} />
              </div>
            </section>
          )}

          {isGf && (
            <section className="sectionCard">
              <h3>6. Geschäftsführender Gesellschafter</h3>
              <div className="formGrid">
                <InputField id="beteiligungProzent" label="Beteiligung in %" value={form.beteiligungProzent} onChange={(e) => update('beteiligungProzent', e.target.value)} required />
                <SelectField id="sperrminoritaet" label="Sperrminorität" value={form.sperrminoritaet || 'Nein'} onChange={(e) => update('sperrminoritaet', e.target.value)} options={['Nein', 'Ja']} />
              </div>
            </section>
          )}

          {isRentner && (
            <section className="sectionCard">
              <h3>6. Rentner</h3>
              <div className="formGrid">
                <InputField id="rentenart" label="Rentenart" value={form.rentenart} onChange={(e) => update('rentenart', e.target.value)} />
                <InputField id="rentenbeginn" label="Rentenbeginn" type="date" value={form.rentenbeginn} onChange={(e) => update('rentenbeginn', e.target.value)} />
              </div>
            </section>
          )}

          <section className="sectionCard">
            <h3>7. MyCenter & Arbeitsvertrag</h3>
            <div className="formGrid">
              <div className="field spanTwo">
                <label className="checkboxRow">
                  <input type="checkbox" checked={form.mycenterHinweisAkzeptiert} onChange={(e) => update('mycenterHinweisAkzeptiert', e.target.checked)} />
                  <span>MyCenter ermöglicht Krankmeldungen, Stundenerfassungen, Urlaubserfassung und digitale Lohnabrechnungen. Eine E-Mail-Adresse wird empfohlen, damit der Mitarbeiter das Portal aktiv nutzen kann.</span>
                </label>
              </div>
              <SelectField id="arbeitsvertragGewuenscht" label="Arbeitsvertrag aus Vorlage vorbereiten?" value={form.arbeitsvertragGewuenscht} onChange={(e) => update('arbeitsvertragGewuenscht', e.target.value)} options={['Ja', 'Nein']} />
              <SelectField id="vertragsart" label="Vertragsart" value={form.vertragsart || 'unbefristet'} onChange={(e) => update('vertragsart', e.target.value)} options={['unbefristet', 'befristet', 'Minijob-Vertrag', 'Werkstudentenvertrag', 'Ausbildungsvertrag']} />
              <InputField id="probezeit" label="Probezeit" value={form.probezeit} onChange={(e) => update('probezeit', e.target.value)} />
              <InputField id="kuendigungsfrist" label="Kündigungsfrist" value={form.kuendigungsfrist} onChange={(e) => update('kuendigungsfrist', e.target.value)} />
              <TextAreaField id="zusatzvereinbarungen" label="Zusatzvereinbarungen" value={form.zusatzvereinbarungen} onChange={(e) => update('zusatzvereinbarungen', e.target.value)} />
            </div>
          </section>

          <section className="sectionCard">
            <h3>8. Infos / Hinweise</h3>
            <TextAreaField id="notizen" label="Zusätzliche Informationen" value={form.notizen} onChange={(e) => update('notizen', e.target.value)} hint="Zum Beispiel flexible Arbeitszeiten, besondere Vereinbarungen oder wichtige Hinweise für die Personalabteilung." />
          </section>

          <div className="actions">
            <button type="submit" disabled={sending}>{sending ? 'Wird gesendet…' : 'Mitarbeiterdaten übermitteln'}</button>
          </div>
        </form>
      </div>
    </main>
  );
}
