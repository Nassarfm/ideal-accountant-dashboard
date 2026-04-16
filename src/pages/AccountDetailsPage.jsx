import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import apiClient from '../api/client'

export default function AccountDetailsPage() {
  const { accountId } = useParams()
  const navigate = useNavigate()

  const [account, setAccount] = useState(null)
  const [accounts, setAccounts] = useState([])
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetchData()
  }, [accountId])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError('')

      const [accountRes, accountsRes] = await Promise.all([
        apiClient.get(`/accounting/accounts/${accountId}`),
        apiClient.get('/accounting/accounts'),
      ])

      const accountData = accountRes.data
      const accountsData = Array.isArray(accountsRes.data) ? accountsRes.data : []

      setAccount(accountData)
      setAccounts(accountsData)
      setForm({
        id: accountData.id,
        parent_id: accountData.parent_id ?? '',
        code: accountData.code ?? '',
        name_ar: accountData.name_ar ?? '',
        name_en: accountData.name_en ?? '',
        level: accountData.level ?? 4,
        account_type: accountData.account_type ?? 'ASSET',
        financial_statement_type: accountData.financial_statement_type ?? 'BS',
        normal_balance: accountData.normal_balance ?? 'DR',
        is_postable: accountData.is_postable ?? false,
        requires_subledger: accountData.requires_subledger ?? false,
        subledger_type: accountData.subledger_type ?? 'NONE',
        allow_manual_entry: accountData.allow_manual_entry ?? true,
        allow_reconciliation: accountData.allow_reconciliation ?? false,
        is_active: accountData.is_active ?? true,
        dimension_rules: accountData.dimension_rules ?? [],
      })
    } catch (err) {
      console.error(err)
      setError(
        err?.response?.data?.detail
          ? JSON.stringify(err.response.data.detail)
          : 'Failed to load account details.'
      )
    } finally {
      setLoading(false)
    }
  }

  const parentOptions = useMemo(() => {
    if (!form) return []
    const currentLevel = Number(form.level)
    if (currentLevel === 1) return []

    const requiredParentLevel = currentLevel - 1
    return accounts.filter(
      (acc) =>
        Number(acc.level) === requiredParentLevel &&
        acc.is_postable === false &&
        acc.id !== form.id
    )
  }, [accounts, form])

  if (loading || !form) {
    return <p>Loading account details...</p>
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => {
      const next = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }

      if (name === 'level') {
        if (Number(value) === 1) {
          next.parent_id = ''
          next.is_postable = false
        }
        if (Number(value) === 4) {
          next.is_postable = true
        }
      }

      if (name === 'requires_subledger' && checked === false) {
        next.subledger_type = 'NONE'
      }

      return next
    })
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError('')
      setMessage('')

      const payload = {
        ...form,
        parent_id: form.parent_id === '' ? null : Number(form.parent_id),
        level: Number(form.level),
      }

      const response = await apiClient.put(`/accounting/accounts/${form.id}`, payload)
      setMessage(`Account updated successfully: ${response.data.code}`)
      await fetchData()
    } catch (err) {
      console.error(err)
      setError(
        err?.response?.data?.detail
          ? JSON.stringify(err.response.data.detail)
          : 'Failed to update account.'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div style={styles.topBar}>
        <div>
          <div style={styles.breadcrumb}>
            <Link to="/accounts" style={styles.link}>Chart of Accounts</Link>
            <span style={styles.separator}>/</span>
            <span>{form.code}</span>
          </div>
          <h1 style={styles.title}>{form.name_ar}</h1>
          <div style={styles.code}>{form.code}</div>
        </div>

        <div style={styles.actions}>
          <button style={styles.secondaryButton} onClick={() => navigate('/accounts')}>
            Back
          </button>
          <button style={styles.primaryButton} onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {message && <p style={styles.success}>{message}</p>}
      {error && <p style={styles.error}>{error}</p>}

      <div style={styles.card}>
        <div style={styles.sectionTitle}>General Information</div>

        <div style={styles.grid}>
          <div>
            <label style={styles.label}>Code</label>
            <input name="code" value={form.code} onChange={handleChange} style={styles.input} />
          </div>

          <div>
            <label style={styles.label}>Parent Account</label>
            <select name="parent_id" value={form.parent_id} onChange={handleChange} style={styles.input}>
              <option value="">
                {Number(form.level) === 1 ? 'No parent for Level 1' : 'Select parent account'}
              </option>
              {parentOptions.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.code} - {acc.name_ar}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={styles.label}>Name (AR)</label>
            <input name="name_ar" value={form.name_ar} onChange={handleChange} style={styles.input} />
          </div>

          <div>
            <label style={styles.label}>Name (EN)</label>
            <input name="name_en" value={form.name_en} onChange={handleChange} style={styles.input} />
          </div>

          <div>
            <label style={styles.label}>Level</label>
            <select name="level" value={form.level} onChange={handleChange} style={styles.input}>
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
            </select>
          </div>

          <div>
            <label style={styles.label}>Account Type</label>
            <select name="account_type" value={form.account_type} onChange={handleChange} style={styles.input}>
              <option value="ASSET">ASSET</option>
              <option value="LIABILITY">LIABILITY</option>
              <option value="EQUITY">EQUITY</option>
              <option value="REVENUE">REVENUE</option>
              <option value="EXPENSE">EXPENSE</option>
            </select>
          </div>

          <div>
            <label style={styles.label}>Financial Statement Type</label>
            <select
              name="financial_statement_type"
              value={form.financial_statement_type}
              onChange={handleChange}
              style={styles.input}
            >
              <option value="BS">BS</option>
              <option value="PL">PL</option>
            </select>
          </div>

          <div>
            <label style={styles.label}>Normal Balance</label>
            <select name="normal_balance" value={form.normal_balance} onChange={handleChange} style={styles.input}>
              <option value="DR">DR</option>
              <option value="CR">CR</option>
            </select>
          </div>

          <div>
            <label style={styles.label}>Subledger Type</label>
            <select
              name="subledger_type"
              value={form.subledger_type}
              onChange={handleChange}
              style={styles.input}
              disabled={!form.requires_subledger}
            >
              <option value="NONE">NONE</option>
              <option value="CUSTOMER">CUSTOMER</option>
              <option value="VENDOR">VENDOR</option>
              <option value="BANK">BANK</option>
              <option value="EMPLOYEE">EMPLOYEE</option>
              <option value="FIXED_ASSET">FIXED_ASSET</option>
              <option value="CASH_CUSTODIAN">CASH_CUSTODIAN</option>
              <option value="PETTY_CASH_HOLDER">PETTY_CASH_HOLDER</option>
            </select>
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.sectionTitle}>Controls</div>

        <div style={styles.checkGrid}>
          <label style={styles.checkItem}>
            <input type="checkbox" name="is_postable" checked={form.is_postable} onChange={handleChange} />
            <span>Is Postable</span>
          </label>

          <label style={styles.checkItem}>
            <input type="checkbox" name="requires_subledger" checked={form.requires_subledger} onChange={handleChange} />
            <span>Requires Subledger</span>
          </label>

          <label style={styles.checkItem}>
            <input type="checkbox" name="allow_manual_entry" checked={form.allow_manual_entry} onChange={handleChange} />
            <span>Allow Manual Entry</span>
          </label>

          <label style={styles.checkItem}>
            <input type="checkbox" name="allow_reconciliation" checked={form.allow_reconciliation} onChange={handleChange} />
            <span>Allow Reconciliation</span>
          </label>

          <label style={styles.checkItem}>
            <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} />
            <span>Is Active</span>
          </label>
        </div>
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
  breadcrumb: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#64748b',
    marginBottom: '8px',
  },
  link: {
    color: '#2563eb',
    textDecoration: 'none',
  },
  separator: {
    color: '#94a3b8',
  },
  title: {
    margin: 0,
    fontSize: '40px',
    lineHeight: 1.1,
  },
  code: {
    marginTop: '10px',
    fontSize: '20px',
    color: '#475569',
  },
  actions: {
    display: 'flex',
    gap: '10px',
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
  secondaryButton: {
    background: '#fff',
    color: '#0f172a',
    border: '1px solid #cbd5e1',
    borderRadius: '10px',
    padding: '12px 18px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  card: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '14px',
    padding: '20px',
    marginBottom: '20px',
    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.05)',
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: '18px',
    marginBottom: '16px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '16px',
  },
  checkGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '12px',
  },
  label: {
    display: 'block',
    marginBottom: '6px',
    fontWeight: 'bold',
    color: '#334155',
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #cbd5e1',
    borderRadius: '10px',
    background: '#fff',
    fontSize: '14px',
  },
  checkItem: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  success: {
    color: 'green',
    marginBottom: '16px',
  },
  error: {
    color: 'red',
    marginBottom: '16px',
    whiteSpace: 'pre-wrap',
  },
}