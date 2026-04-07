export default function FormHeader({ title, description }) {
  return (
    <div className="headerRow" style={{ marginBottom: 18 }}>
      <div>
        <div className="brandPill">LION IBC</div>
        <h1 style={{ margin: '0 0 8px', fontSize: '34px', lineHeight: 1.1 }}>{title}</h1>
        <p className="subtle" style={{ maxWidth: 760, margin: 0 }}>{description}</p>
      </div>
    </div>
  );
}
