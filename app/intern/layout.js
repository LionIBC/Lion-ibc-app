'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function InternLayout({ children }) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/intern' },
    { name: 'Eingang', href: '/intern/eingang' },
    { name: 'Anfragen', href: '/intern/anfragen' },
    { name: 'Mitarbeitervorgänge', href: '/intern/mitarbeitervorgaenge' },
    { name: 'Tickets', href: '/intern/tickets' },
    { name: 'Dokumente', href: '/intern/dokumente' },
    { name: 'Stammdaten', href: '/intern/stammdaten' },
    { name: 'Rechnungen', href: '/intern/rechnungen' },
    { name: 'Termine', href: '/intern/termine' }
  ];

  return (
    <div style={wrapper}>
      <aside style={sidebar}>
        <h2 style={logo}>Lion IBC Intern</h2>

        <nav style={{ marginTop: '30px' }}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                ...navItem,
                background: pathname === item.href ? '#8c6b43' : 'transparent',
                color: pathname === item.href ? '#fff' : '#344054'
              }}
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </aside>

      <main style={content}>{children}</main>
    </div>
  );
}

const wrapper = {
  display: 'flex',
  minHeight: '100vh',
  background: '#f7f5ef'
};

const sidebar = {
  width: '260px',
  background: '#ffffff',
  borderRight: '1px solid #e4e7ec',
  padding: '30px 20px'
};

const logo = {
  fontSize: '20px',
  fontWeight: '700',
  color: '#101828'
};

const navItem = {
  display: 'block',
  padding: '12px 14px',
  borderRadius: '10px',
  textDecoration: 'none',
  marginBottom: '6px',
  fontSize: '14px',
  fontWeight: '500'
};

const content = {
  flex: 1,
  padding: '30px'
};
