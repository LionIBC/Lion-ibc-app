'use client';

import { useEffect, useRef, useState } from 'react';

export default function BeratungPage() {
  const initialState = {
    firmenname: '',
    ansprechpartnerVorname: '',
    ansprechpartnerNachname: '',
    email: '',
    telefon: '',

    strasse: '',
    plz: '',
    ort: '',
    rechtsform: '',
    branche: '',

    fibu: false,
    lohn: false,
    unternehmensberatung: false,

    mitarbeiter: '',
    anzahlMitarbeiter: '',
    betriebsnummer: '',

    steuerberaterBisher: '',
    startGewuenscht: '',
    hinweise: '',

    dsgvoAkzeptiert: false,
    vollmachtAkzeptiert: false
  };

  const [form, setForm] = useState(initialState);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState(null);

  const [gewerbeanmeldung, setGewerbeanmeldung] = useState(null);
  const [handelsregisterauszug, setHandelsregisterauszug] = useState(null);
  const [weitereUnterlagen, setWeitereUnterlagen] = useState([]);

  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const isDrawingRef = useRef(false);
  const hasSignatureRef = useRef(false);

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function resizeCanvas() {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;

    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const width = wrapper.offsetWidth;
    const height = 180;

    const oldData = canvas.toDataURL();

    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#101828';

    if (oldData && hasSignatureRef.current) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
      };
      img.src = oldData;
    }
  }

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  function getPosition(event) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    if (event.touches && event.touches[0]) {
      return {
        x: event.touches[0].clientX - rect.left,
        y: event.touches[0].clientY - rect.top
      };
    }

    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

  function startDrawing(event) {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPosition(event);

    isDrawingRef.current = true;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    event.preventDefault();
  }

  function draw(event) {
    if (!isDrawingRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPosition(event);

    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    hasSignatureRef.current = true;
    event.preventDefault();
  }

  function stopDrawing() {
    isDrawingRef.current = false;
  }

  function clearSignature() {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasSignatureRef.current = false;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSending(true);
    setStatus(null);

    if (!form.fibu && !form.lohn && !form.unternehmensberatung) {
      setStatus({
        type: 'error',
        message: 'Bitte mindestens einen Leistungsbereich auswählen.'
      });
      setSending(false);
      return;
    }

    if (!form.dsgvoAkzeptiert) {
      setStatus({
        type: 'error',
        message: 'Bitte die Datenschutzerklärung akzeptieren.'
      });
      setSending(false);
      return;
    }

    if (!form.vollmachtAkzeptiert) {
      setStatus({
        type: 'error',
        message: 'Bitte die Vollmacht bestätigen.'
      });
      setSending(false);
      return;
    }

    if (!hasSignatureRef.current) {
      setStatus({
        type: 'error',
        message: 'Bitte im Unterschriftenfeld unterschreiben.'
      });
      setSending(false);
      return;
    }

    if (String(form.mitarbeiter).toLowerCase() === 'ja' && !form.betriebsnummer) {
      setStatus({
        type: 'error',
        message: 'Bitte die Betriebsnummer angeben, wenn Mitarbeiter angemeldet werden.'
      });
      setSending(false);
      return;
    }

    try {
      const formData = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        formData.append(key, typeof value === 'boolean' ? String(value) : value);
      });

      const signatureDataUrl = canvasRef.current.toDataURL('image/png');
      formData.append('unterschrift', signatureDataUrl);

      if (gewerbeanmeldung) {
        formData.append('gewerbeanmeldung', gewerbeanmeldung);
      }

      if (handelsregisterauszug) {
        formData.append('handelsregisterauszug', handelsregisterauszug);
      }

      Array.from(weitereUnterlagen).forEach((file) => {
        formData.append('weitereUnterlagen', file);
      });

      const res = await fetch('/api/new-client', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();

      if (res.ok) {
        setStatus({
          type: 'success',
          message: data.message || 'Die Daten wurden erfolgreich übermittelt.'
        });
        setForm(initialState);
        setGewerbeanmeldung(null);
        setHandelsregisterauszug(null);
        setWeitereUnterlagen([]);
        clearSignature();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setStatus({
          type: 'error',
          message: data.message || 'Fehler beim Senden.'
        });
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: 'Fehler beim Senden.'
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom, #f7f5ef 0%, #f3f0e8 100%)',
        padding: '32px 20px 60px'
      }}
    >
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ marginBottom: '20px' }}>
          <img
            src="/logo.png"
            alt="Lion IBC Logo"
            style={{ height: '120px', width: 'auto', display: 'block' }}
          />
        </div>

        <section style={card}>
          <div style={badge}>Neukundenaufnahme</div>

          <h1 style={title}>Digitale Aufnahme für FiBu, Lohn und Unternehmensberatung</h1>

          <p style={subtitle}>
            Übermitteln Sie uns die relevanten Unternehmensdaten. So können wir die
            Zusammenarbeit strukturiert aufbauen und Ihre Unterlagen direkt sauber in die
            Kundenakte übernehmen.
          </p>

          {status && status.type === 'error' && <div style={errorBox}>{status.message}</div>}
          {status && status.type === 'success' && <div style={successBox}>{status.message}</div>}

          <form onSubmit={handleSubmit} style={{ marginTop: '30px' }}>
            <h3 style={sectionTitle}>Unternehmensdaten</h3>
            <div style={grid}>
              <InputField
                label="Firmenname"
                value={form.firmenname}
                onChange={(e) => update('firmenname', e.target.value)}
                required
              />
              <InputField
                label="Rechtsform"
                value={form.rechtsform}
                onChange={(e) => update('rechtsform', e.target.value)}
              />
              <InputField
                label="Straße / Hausnummer"
                value={form.strasse}
                onChange={(e) => update('strasse', e.target.value)}
              />
              <InputField
                label="PLZ"
                value={form.plz}
                onChange={(e) => update('plz', e.target.value)}
              />
              <InputField
                label="Ort"
                value={form.ort}
                onChange={(e) => update('ort', e.target.value)}
              />
              <InputField
                label="Branche / Tätigkeit"
                value={form.branche}
                onChange={(e) => update('branche', e.target.value)}
              />
            </div>

            <h3 style={sectionTitle}>Ansprechpartner</h3>
            <div style={grid}>
              <InputField
                label="Vorname"
                value={form.ansprechpartnerVorname}
                onChange={(e) => update('ansprechpartnerVorname', e.target.value)}
                required
              />
              <InputField
                label="Nachname"
                value={form.ansprechpartnerNachname}
                onChange={(e) => update('ansprechpartnerNachname', e.target.value)}
                required
              />
              <InputField
                label="E-Mail"
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                required
              />
              <InputField
                label="Telefon"
                value={form.telefon}
                onChange={(e) => update('telefon', e.target.value)}
              />
            </div>

            <h3 style={sectionTitle}>Gewünschte Bereiche</h3>
            <div style={checkboxGrid}>
              <CheckboxField
                label="Finanzbuchhaltung"
                checked={form.fibu}
                onChange={(e) => update('fibu', e.target.checked)}
              />
              <CheckboxField
                label="Lohnabrechnung"
                checked={form.lohn}
                onChange={(e) => update('lohn', e.target.checked)}
              />
              <CheckboxField
                label="Unternehmensberatung"
                checked={form.unternehmensberatung}
                onChange={(e) => update('unternehmensberatung', e.target.checked)}
              />
            </div>

            <h3 style={sectionTitle}>Mitarbeiter</h3>
            <div style={grid}>
              <InputField
                label="Werden Mitarbeiter angemeldet?"
                placeholder="ja / nein"
                value={form.mitarbeiter}
                onChange={(e) => update('mitarbeiter', e.target.value)}
              />
              <InputField
                label="Anzahl Mitarbeiter"
                value={form.anzahlMitarbeiter}
                onChange={(e) => update('anzahlMitarbeiter', e.target.value)}
              />
              <InputField
                label="Betriebsnummer"
                value={form.betriebsnummer}
                onChange={(e) => update('betriebsnummer', e.target.value)}
                hint="Pflicht nur, wenn Mitarbeiter angemeldet werden."
              />
              <InputField
                label="Gewünschter Start"
                value={form.startGewuenscht}
                onChange={(e) => update('startGewuenscht', e.target.value)}
              />
            </div>

            <h3 style={sectionTitle}>Bestehende Situation</h3>
            <div style={grid}>
              <InputField
                label="Bisheriger Steuerberater"
                value={form.steuerberaterBisher}
                onChange={(e) => update('steuerberaterBisher', e.target.value)}
              />
            </div>

            <h3 style={sectionTitle}>Hinweise</h3>
            <textarea
              placeholder="Zusätzliche Informationen oder Besonderheiten"
              value={form.hinweise}
              onChange={(e) => update('hinweise', e.target.value)}
              style={textarea}
            />

            <h3 style={sectionTitle}>Unterlagen</h3>
            <div style={uploadGrid}>
              <UploadField
                label="Gewerbeanmeldung"
                onChange={(e) => setGewerbeanmeldung(e.target.files?.[0] || null)}
              />
              <UploadField
                label="Handelsregisterauszug"
                onChange={(e) => setHandelsregisterauszug(e.target.files?.[0] || null)}
              />
            </div>

            <div style={{ marginTop: '14px' }}>
              <UploadField
                label="Weitere Unterlagen"
                multiple
                onChange={(e) => setWeitereUnterlagen(e.target.files || [])}
              />
            </div>

            <h3 style={sectionTitle}>Datenschutz & Vollmacht</h3>

            <div style={checkboxBox}>
              <label style={checkboxLabel}>
                <input
                  type="checkbox"
                  checked={form.dsgvoAkzeptiert}
                  onChange={(e) => update('dsgvoAkzeptiert', e.target.checked)}
                  style={{ marginRight: '8px' }}
                />
                Ich habe die{' '}
                <a href="/datenschutz" target="_blank" rel="noreferrer" style={linkStyle}>
                  Datenschutzerklärung
                </a>{' '}
                gelesen und akzeptiere diese.
              </label>
            </div>

            <div style={{ ...checkboxBox, marginTop: '10px' }}>
              <label style={checkboxLabel}>
                <input
                  type="checkbox"
                  checked={form.vollmachtAkzeptiert}
                  onChange={(e) => update('vollmachtAkzeptiert', e.target.checked)}
                  style={{ marginRight: '8px' }}
                />
                Ich habe die{' '}
                <a href="/vollmacht" target="_blank" rel="noreferrer" style={linkStyle}>
                  Vollmacht
                </a>{' '}
                gelesen und bestätige diese.
              </label>
            </div>

            <div style={{ marginTop: '24px' }}>
              <label style={labelStyle}>Unterschrift *</label>
              <div
                ref={wrapperRef}
                style={{
                  marginTop: '8px',
                  border: '1px solid #d0d5dd',
                  borderRadius: '12px',
                  background: '#fff',
                  overflow: 'hidden'
                }}
              >
                <canvas
                  ref={canvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  style={{
                    display: 'block',
                    width: '100%',
                    height: '180px',
                    touchAction: 'none',
                    cursor: 'crosshair'
                  }}
                />
              </div>

              <div style={{ marginTop: '10px' }}>
                <button type="button" onClick={clearSignature} style={secondarySmallButton}>
                  Unterschrift löschen
                </button>
              </div>
            </div>

            <button type="submit" style={button} disabled={sending}>
              {sending ? 'Wird gesendet...' : 'Anfrage absenden'}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

function InputField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder = '',
  required = false,
  hint = ''
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={labelStyle}>
        {label}
        {required ? ' *' : ''}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        style={input}
      />
      {hint ? <span style={hintStyle}>{hint}</span> : null}
    </div>
  );
}

function CheckboxField({ label, checked, onChange }) {
  return (
    <label style={checkboxCard}>
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span>{label}</span>
    </label>
  );
}

function UploadField({ label, onChange, multiple = false }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={labelStyle}>{label}</label>
      <input type="file" onChange={onChange} multiple={multiple} style={fileInput} />
    </div>
  );
}

const card = {
  background: '#ffffff',
  border: '1px solid #e7e2d8',
  borderRadius: '24px',
  padding: '40px',
  boxShadow: '0 10px 30px rgba(16, 24, 40, 0.06)'
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
  marginBottom: '20px'
};

const title = {
  fontSize: '36px',
  fontWeight: '700',
  marginBottom: '10px',
  color: '#101828'
};

const subtitle = {
  color: '#475467',
  marginBottom: '20px',
  fontSize: '16px',
  lineHeight: 1.6,
  maxWidth: '900px'
};

const sectionTitle = {
  marginTop: '30px',
  marginBottom: '12px',
  fontWeight: '600',
  color: '#101828'
};

const labelStyle = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#344054'
};

const hintStyle = {
  fontSize: '12px',
  color: '#667085'
};

const grid = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '14px'
};

const uploadGrid = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '14px'
};

const checkboxGrid = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1fr',
  gap: '12px'
};

const checkboxCard = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '12px 14px',
  borderRadius: '12px',
  border: '1px solid #e4e7ec',
  background: '#fcfcfd',
  color: '#344054',
  fontSize: '14px'
};

const input = {
  padding: '12px',
  borderRadius: '10px',
  border: '1px solid #d0d5dd',
  fontSize: '14px'
};

const fileInput = {
  padding: '10px',
  borderRadius: '10px',
  border: '1px solid #d0d5dd',
  background: '#fff',
  fontSize: '14px'
};

const textarea = {
  width: '100%',
  minHeight: '110px',
  padding: '12px',
  borderRadius: '10px',
  border: '1px solid #d0d5dd',
  fontSize: '14px',
  resize: 'vertical'
};

const checkboxBox = {
  padding: '12px 14px',
  borderRadius: '12px',
  background: '#fcfcfd',
  border: '1px solid #eaecf0'
};

const checkboxLabel = {
  fontSize: '14px',
  color: '#344054',
  lineHeight: 1.6
};

const linkStyle = {
  color: '#8c6b43',
  textDecoration: 'underline'
};

const button = {
  marginTop: '24px',
  padding: '16px',
  borderRadius: '12px',
  background: '#8c6b43',
  color: '#fff',
  border: 'none',
  fontWeight: '600',
  width: '100%',
  cursor: 'pointer'
};

const secondarySmallButton = {
  padding: '10px 14px',
  borderRadius: '10px',
  background: '#ffffff',
  color: '#101828',
  border: '1px solid #d0d5dd',
  fontWeight: '600',
  cursor: 'pointer'
};

const errorBox = {
  marginTop: '16px',
  marginBottom: '8px',
  padding: '12px 14px',
  borderRadius: '12px',
  background: '#fef3f2',
  border: '1px solid #fecdca',
  color: '#b42318'
};

const successBox = {
  marginTop: '16px',
  marginBottom: '8px',
  padding: '12px 14px',
  borderRadius: '12px',
  background: '#ecfdf3',
  border: '1px solid #abefc6',
  color: '#067647'
};
