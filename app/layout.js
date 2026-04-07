import './globals.css';

export const metadata = {
  title: 'Lion IBC – Neukundenaufnahme',
  description: 'Digitale Neukundenaufnahme für Unternehmen mit E-Mail-Benachrichtigung an Lion IBC'
};

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
