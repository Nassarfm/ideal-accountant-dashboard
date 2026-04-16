import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient from '../api/client'

export default function AccountsPage() {
  const navigate = useNavigate()

  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await apiClient.get('/accounting/accounts')
      setAccounts(Array.isArray(response.data) ? response.data : [])
    } catch (err) {
      console.error(err)
      setError(
        err?.response?.data?.detail
          ? JSON.stringify(err.response.data.detail)
          : 'Failed to load accounts.'
      )
    } finally {
      setLoading(false)
    }
  }

  const filteredAccounts = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return accounts

    return accounts.filter((acc) => {
      return (
        String(acc.code || '').toLowerCase().includes(q) ||
        String(acc.name_ar || '').toLowerCase().includes(q) ||
        String(acc.name_en || '').toLowerCase().includes(q) ||
        String(acc.account_type || '').toLowerCase().includes(q)
      )
    })
  }, [accounts, search])

  return (
    <div>
      <div style={styles.topBar}>
        <div>
          <h1 style={styles.title}>Chart of Accounts</h1>
          <p style={styles.subtitle}>Browse, search, and open account details in a separate page.</p>
        </div>

        <button style={styles.primaryButton} onClick={() => navigate('/accounts/new')}>
          New Account
        </button>
      </div>

      <div style={styles.toolbar}>
        <input
          placeholder="Search by code, Arabic name, English name, or type..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      {error && <p style={styles.error}>{error}</p>}

      <div style={styles.card}>
        {loading ? (
          <p>Loading accounts...</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Code</th>
                <th style={styles.th}>Name (AR)</th>
                <th style={styles.th}>Name (EN)</th>
                <th style={styles.th}>Type</th>
                <th style={styles.th}>Level</th>
                <th style={styles.th}>Postable</th>
                <th style={styles.th}>Manual</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.length > 0 ? (
                filteredAccounts.map((acc) => (
                  <tr
                    key={acc.id}
                    style={styles.row}
                    onClick={() => navigate(`/accounts/${acc.id}`)}
                  >
                    <td style={styles.td}>{acc.code}</td>
                    <td style={styles.td}>{acc.name_ar}</td>
                    <td style={styles.td}>{acc.name_en}</td>
                    <td style={styles.td}>{acc.account_type}</td>
                    <td style={styles.td}>{acc.level}</td>
                    <td style={styles.td}>{String(acc.is_postable)}</td>
                    <td style={styles.td}>{String(acc.allow_manual_entry)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td style={styles.td} colSpan="7">
                    No accounts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

const styles = {
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '20px',
    marginBottom: '20px',
  },
  title: {
    margin: 0,
    fontSize: '36px',
  },
  subtitle: {
    margin: '8px 0 0 0',
    color: '#64748b',
  },
  toolbar: {
    marginBottom: '16px',
  },
  searchInput: {
    width: '100%',
    padding: '14px 16px',
    border: '1px solid #cbd5e1',
    borderRadius: '12px',
    background: '#fff',
    fontSize: '14px',
  },
  card: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '14px',
    overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.05)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    borderBottom: '1px solid #e5e7eb',
    padding: '14px',
    textAlign: 'left',
    background: '#f8fafc',
  },
  td: {
    borderBottom: '1px solid #f1f5f9',
    padding: '14px',
  },
  row: {
    cursor: 'pointer',
  },
  primaryButton: {
    background: '#0f172a',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    padding: '12px 18px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  error: {
    color: 'red',
    marginBottom: '16px',
    whiteSpace: 'pre-wrap',
  },
}