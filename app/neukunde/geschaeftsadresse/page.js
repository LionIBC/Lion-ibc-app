'use client';

import { useEffect, useRef, useState } from 'react';

export default function GeschaeftsadressePage() {
  const initialState = {
    vorname: '',
    nachname: '',
    email: '',
    telefon: '',

    firmenname: '',
    rechtsform: '',
    sitz: '',

    leistung: '',

    dsgvoAkzeptiert: false,
    vollmachtAkzeptiert: false
  };

  const [form, setForm] = useState(initialState);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState(null);

  const [unterlagen, setUnterlagen] = useState([]);

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

    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#101828';
  }

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  function getPosition(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  function startDrawing(e) {
    const ctx = canvasRef.current.getContext('2d');
    const pos = getPosition(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    isDrawingRef.current = true;
  }

  function draw(e) {
    if (!isDrawingRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    const pos = getPosition(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    hasSignatureRef.current = true;
  }

  function stopDrawing() {
    isDrawingRef.current = false;
  }

  function clearSignature() {
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    hasSignatureRef.current = false;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSending(true);
    setStatus(null);

    if (!form.dsgvoAkzeptiert) {
      setStatus({ type: 'error', message: 'Bitte DSGVO bestätigen.' });
      setSending(false);
      return;
    }

    if (!form.vollmachtAkzeptiert) {
      setStatus({ type: 'error', message: 'Bitte Vollmacht bestätigen.' });
      setSending(false);
      return;
    }

    if (!hasSignatureRef.current) {
      setStatus({ type: 'error', message: 'Bitte unterschreiben.' });
      setSending(false);
      return;
    }

    try {
      const formData = new FormData();

      Object.entries(form).forEach(([k, v]) => {
        formData.append(k, typeof v === 'boolean' ? String(v) : v);
      });

      formData.append('unterschrift', canvasRef.current.toDataURL());

      Array.from(unterlagen).forEach(file => {
        formData.append('unterlagen', file);
      });

      const res = await fetch('/api/geschaeftsadresse', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        setStatus({ type: 'success', message: 'Erfolgreich übermittelt.' });
        setForm(initialState);
        setUnterlagen([]);
        clearSignature();
      } else {
        setStatus({ type: 'error', message: 'Fehler beim Senden.' });
      }
    } catch {
      setStatus({ type: 'error', message: 'Fehler beim Senden.' });
    }

    setSending(false);
  }

  return (
    <main style={{ padding: '32px' }}>
      <section style={card}>

        <h1 style={title}>Virtuelles Office / Geschäftsadresse</h1>

        {status && (
          <div style={status.type === 'error' ? errorBox : successBox}>
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          <h3>Kontakt</h3>
          <div style={grid}>
            <Input label="Vorname" value={form.vorname} onChange={(e)=>update('vorname',e.target.value)} />
            <Input label="Nachname" value={form.nachname} onChange={(e)=>update('nachname',e.target.value)} />
            <Input label="E-Mail" value={form.email} onChange={(e)=>update('email',e.target.value)} />
            <Input label="Telefon" value={form.telefon} onChange={(e)=>update('telefon',e.target.value)} />
          </div>

          <h3>Unternehmen</h3>
          <div style={grid}>
            <Input label="Firmenname" value={form.firmenname} onChange={(e)=>update('firmenname',e.target.value)} />
            <Input label="Rechtsform" value={form.rechtsform} onChange={(e)=>update('rechtsform',e.target.value)} />
            <Input label="Unternehmenssitz" value={form.sitz} onChange={(e)=>update('sitz',e.target.value)} />
          </div>

          <h3>Leistung</h3>
          <select value={form.leistung} onChange={(e)=>update('leistung',e.target.value)} style={input}>
            <option value="">Bitte wählen</option>
            <option value="geschaeftsadresse">Geschäftsadresse</option>
            <option value="virtuelles_office">Virtuelles Office</option>
          </select>

          <h3>Unterlagen</h3>
          <input type="file" multiple onChange={(e)=>setUnterlagen(e.target.files)} style={fileInput}/>

          <h3>Postempfangsvollmacht</h3>
          <p style={hint}>
            Hiermit bevollmächtige ich Lion IBC, meine geschäftliche Post entgegenzunehmen und zu bearbeiten.
          </p>

          <div ref={wrapperRef} style={signatureBox}>
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              style={{ width: '100%', height: '180px' }}
            />
          </div>

          <button type="button" onClick={clearSignature} style={secondary}>
            Unterschrift löschen
          </button>

          <h3>Bestätigung</h3>

          <label>
            <input type="checkbox" checked={form.dsgvoAkzeptiert} onChange={(e)=>update('dsgvoAkzeptiert',e.target.checked)} />
            DSGVO akzeptieren
          </label>

          <label>
            <input type="checkbox" checked={form.vollmachtAkzeptiert} onChange={(e)=>update('vollmachtAkzeptiert',e.target.checked)} />
            Vollmacht bestätigen
          </label>

          <button style={button}>
            {sending ? 'Senden...' : 'Absenden'}
          </button>

        </form>
      </section>
    </main>
  );
}

function Input({label,value,onChange}) {
  return (
    <div>
      <label>{label}</label>
      <input value={value} onChange={onChange} style={input}/>
    </div>
  )
}

const grid = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }
const input = { padding:'10px', border:'1px solid #ccc' }
const fileInput = { marginTop:'10px' }
const card = { background:'#fff', padding:'40px', borderRadius:'20px' }
const title = { fontSize:'30px', marginBottom:'20px' }
const button = { marginTop:'20px', padding:'14px', background:'#8c6b43', color:'#fff', border:'none' }
const secondary = { marginTop:'10px' }
const signatureBox = { border:'1px solid #ccc', marginTop:'10px' }
const hint = { color:'#666' }
const errorBox = { color:'red' }
const successBox = { color:'green' }
