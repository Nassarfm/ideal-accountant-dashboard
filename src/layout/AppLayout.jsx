import { NavLink, Outlet } from 'react-router-dom'

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/accounts', label: 'Chart of Accounts' },
  { to: '/journal-entries', label: 'Journal Entries' },
  { to: '/general-ledger', label: 'General Ledger' },
]

export default function AppLayout() {
  return (
    <div style={styles.app}>
      <aside style={styles.sidebar}>
        <div style={styles.logo}>Ideal Accountant</div>

        <nav style={styles.nav}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                ...styles.link,
                ...(isActive ? styles.activeLink : {}),
              })}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main style={styles.main}>
        <div style={styles.topbar}>Ideal Accountant ERP Dashboard</div>
        <div style={styles.content}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}

const styles = {
  app: {
    display: 'flex',
    minHeight: '100vh',
    fontFamily: 'Arial, sans-serif',
    background: '#f5f7fb',
  },
  sidebar: {
    width: '240px',
    background: '#0f172a',
    color: '#fff',
    padding: '24px 16px',
  },
  logo: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '24px',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  link: {
    color: '#cbd5e1',
    textDecoration: 'none',
    padding: '10px 12px',
    borderRadius: '8px',
  },
  activeLink: {
    background: '#1e293b',
    color: '#fff',
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  topbar: {
    background: '#fff',
    borderBottom: '1px solid #e5e7eb',
    padding: '16px 24px',
    fontWeight: 'bold',
  },
  content: {
    padding: '24px',
  },
}