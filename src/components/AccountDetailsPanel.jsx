import { useEffect, useMemo, useState } from 'react'
import apiClient from '../api/client'

export default function AccountDetailsPanel({ account, accounts = [], onUpdated }) {
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!account) {
      setForm(null)
      return
    }

    setForm({
      id: account.id,
      parent_id: account.parent_id ?? '',
      code: account.code ?? '',
      name_ar: account.name_ar ?? '',
      name_en: account.name_en ?? '',
      level: account.level ?? 4,
      account_type: account.account_type ?? 'ASSET',
      financial_statement_type: account.financial_statement_type ?? 'BS',
      normal_balance: account.normal_balance ?? 'DR',
      is_postable: account.is_postable ?? false,
      requires_subledger: account.requires_subledger ?? false,
      subledger_type: account.subledger_type ?? 'NONE',
      allow_manual_entry: account.allow_manual_entry ?? true,
      allow_reconciliation: account.allow_reconciliation ?? false,
      is_active: account.is_active ?? true,
      dimension_rules: account.dimension_rules ?? [],
    })
    setMessage('')
    setError('')
  }, [account])

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

  if (!account || !form) {
    return (
      <div style={styles.empty}>
        <h3 style={styles.panelTitle}>Account Details</h3>
        <p>Select an account from the table to view and edit its details.</p>
      </div>
    )
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
    setLoading(true)
    setMessage('')
    setError('')

    try {
      const payload = {
        ...form,
        parent_id: form.parent_id === '' ? null : Number(form.parent_id),
        level: Number(form.level),
      }

      const response = await apiClient.put(`/accounting/accounts/${form.id}`, payload)
      setMessage(`Account updated successfully: ${response.data.code}`)

      if (onUpdated) {
        onUpdated()
      }
    } catch (err) {
      console.error(err)
      setError(
        err?.response?.data?.detail
          ? JSON.stringify(err.response.data.detail)
          : 'Failed to update account.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <div>
          <h3 style={styles.panelTitle}>Account Details</h3>
          <p style={styles.subtitle}>
            {form.code} - {form.name_ar}
          </p>
        </div>
      </div>

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

      <div style={styles.checks}>
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

      <div style={styles.actionRow}>
        <button onClick={handleSave} style={styles.button} disabled={loading}>
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {message && <p style={styles.success}>{message}</p>}
      {error && <p style={styles.error}>{error}</p>}
    </div>
  )
}

const styles = {
  panel: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '14px',
    padding: '20px',
    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.05)',
    position: 'sticky',
    top: '20px',
  },
  empty: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '14px',
    padding: '20px',
  },
  header: {
    marginBottom: '16px',
  },
  panelTitle: {
    margin: 0,
    fontSize: '22px',
  },
  subtitle: {
    margin: '6px 0 0 0',
    color: '#64748b',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
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
    padding: '10px 12px',
    border: '1px solid #cbd5e1',
    borderRadius: '10px',
    background: '#fff',
  },
  checks: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '10px',
    marginTop: '16px',
  },
  checkItem: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  actionRow: {
    marginTop: '18px',
  },
  button: {
    background: '#0f172a',
    color: '#fff',
    border: 'none',
    padding: '12px 20px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: 'bold',
    width: '100%',
  },
  success: {
    color: 'green',
    marginTop: '12px',
  },
  error: {
    color: 'red',
    whiteSpace: 'pre-wrap',
    marginTop: '12px',
  },
}