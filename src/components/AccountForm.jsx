import { useMemo, useState } from 'react'
import apiClient from '../api/client'

const initialForm = {
  parent_id: '',
  code: '',
  name_ar: '',
  name_en: '',
  level: 4,
  account_type: 'ASSET',
  financial_statement_type: 'BS',
  normal_balance: 'DR',
  is_postable: true,
  requires_subledger: false,
  subledger_type: 'NONE',
  allow_manual_entry: true,
  allow_reconciliation: false,
  is_active: true,
  dimension_rules: [],
}

export default function AccountForm({ onCreated, accounts = [] }) {
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(false)
  const [generateLoading, setGenerateLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const parentOptions = useMemo(() => {
    const currentLevel = Number(form.level)
    if (currentLevel === 1) return []

    const requiredParentLevel = currentLevel - 1

    return accounts.filter(
      (acc) => Number(acc.level) === requiredParentLevel && acc.is_postable === false
    )
  }, [accounts, form.level])

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

      if (name === 'parent_id') {
        next.code = ''
      }

      return next
    })
  }

  const handleGenerateCode = async () => {
    setMessage('')
    setError('')

    if (!form.parent_id) {
      setError('Please select parent account first.')
      return
    }

    try {
      setGenerateLoading(true)
      const response = await apiClient.get(`/accounting/accounts/generate-code?parent_id=${form.parent_id}`)
      setForm((prev) => ({
        ...prev,
        code: response.data.code,
      }))
    } catch (err) {
      console.error(err)
      setError(
        err?.response?.data?.detail
          ? JSON.stringify(err.response.data.detail)
          : 'Failed to generate account code.'
      )
    } finally {
      setGenerateLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')

    try {
      const payload = {
        ...form,
        parent_id: form.parent_id === '' ? null : Number(form.parent_id),
        level: Number(form.level),
      }

      const response = await apiClient.post('/accounting/accounts', payload)

      setMessage(`Account created successfully: ${response.data.code}`)
      setForm(initialForm)

      if (onCreated) onCreated(response.data)
    } catch (err) {
      console.error(err)
      setError(
        err?.response?.data?.detail
          ? JSON.stringify(err.response.data.detail)
          : 'Failed to create account.'
      )
    } finally {
      setLoading(false)
    }
  }

  const levelHint = () => {
    switch (Number(form.level)) {
      case 1:
        return 'Level 1 account does not require a parent.'
      case 2:
        return 'Level 2 account must be under a Level 1 parent.'
      case 3:
        return 'Level 3 account must be under a Level 2 parent.'
      case 4:
        return 'Level 4 posting account must be under a Level 3 parent.'
      default:
        return ''
    }
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.headerRow}>
        <div>
          <h2 style={styles.title}>New Account</h2>
          <p style={styles.subtitle}>Create a chart of accounts item with the correct parent and posting rules.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.grid}>
          <div style={styles.field}>
            <label style={styles.label}>Level</label>
            <select name="level" value={form.level} onChange={handleChange} style={styles.input}>
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
            </select>
            <small style={styles.hint}>{levelHint()}</small>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Parent Account</label>
            <select
              name="parent_id"
              value={form.parent_id}
              onChange={handleChange}
              style={styles.input}
              disabled={Number(form.level) === 1}
            >
              <option value="">
                {Number(form.level) === 1 ? 'No parent required for Level 1' : 'Select parent account'}
              </option>

              {parentOptions.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.code} - {acc.name_ar} (L{acc.level})
                </option>
              ))}
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Code</label>
            <div style={styles.codeRow}>
              <input
                name="code"
                value={form.code}
                onChange={handleChange}
                style={styles.input}
                required
                placeholder="e.g. 530310"
              />
              <button
                type="button"
                style={styles.generateButton}
                onClick={handleGenerateCode}
                disabled={generateLoading}
              >
                {generateLoading ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Name (AR)</label>
            <input
              name="name_ar"
              value={form.name_ar}
              onChange={handleChange}
              style={styles.input}
              required
              placeholder="اسم الحساب بالعربية"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Name (EN)</label>
            <input
              name="name_en"
              value={form.name_en}
              onChange={handleChange}
              style={styles.input}
              required
              placeholder="Account name in English"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Account Type</label>
            <select name="account_type" value={form.account_type} onChange={handleChange} style={styles.input}>
              <option value="ASSET">ASSET</option>
              <option value="LIABILITY">LIABILITY</option>
              <option value="EQUITY">EQUITY</option>
              <option value="REVENUE">REVENUE</option>
              <option value="EXPENSE">EXPENSE</option>
            </select>
          </div>

          <div style={styles.field}>
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

          <div style={styles.field}>
            <label style={styles.label}>Normal Balance</label>
            <select name="normal_balance" value={form.normal_balance} onChange={handleChange} style={styles.input}>
              <option value="DR">DR</option>
              <option value="CR">CR</option>
            </select>
          </div>

          <div style={styles.field}>
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

        <div style={styles.checkSection}>
          <label style={styles.checkItem}><input type="checkbox" name="is_postable" checked={form.is_postable} onChange={handleChange} /> <span>Is Postable</span></label>
          <label style={styles.checkItem}><input type="checkbox" name="requires_subledger" checked={form.requires_subledger} onChange={handleChange} /> <span>Requires Subledger</span></label>
          <label style={styles.checkItem}><input type="checkbox" name="allow_manual_entry" checked={form.allow_manual_entry} onChange={handleChange} /> <span>Allow Manual Entry</span></label>
          <label style={styles.checkItem}><input type="checkbox" name="allow_reconciliation" checked={form.allow_reconciliation} onChange={handleChange} /> <span>Allow Reconciliation</span></label>
          <label style={styles.checkItem}><input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} /> <span>Is Active</span></label>
        </div>

        <div style={styles.actionRow}>
          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Saving...' : 'Create Account'}
          </button>
        </div>

        {message && <p style={styles.success}>{message}</p>}
        {error && <p style={styles.error}>{error}</p>}
      </form>
    </div>
  )
}

const styles = {
  wrapper: {
    background: '#fff',
    padding: '24px',
    borderRadius: '14px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.05)',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '18px',
  },
  title: {
    margin: 0,
    fontSize: '24px',
  },
  subtitle: {
    margin: '6px 0 0 0',
    color: '#64748b',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '16px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
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
  codeRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 140px',
    gap: '10px',
  },
  generateButton: {
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: 'bold',
    padding: '12px',
  },
  hint: {
    marginTop: '6px',
    color: '#64748b',
  },
  checkSection: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '12px',
    paddingTop: '4px',
  },
  checkItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#334155',
  },
  actionRow: {
    display: 'flex',
    justifyContent: 'flex-start',
  },
  button: {
    background: '#0f172a',
    color: '#fff',
    border: 'none',
    padding: '12px 20px',
    borderRadius: '10px',
    cursor: 'pointer',
    minWidth: '220px',
    fontWeight: 'bold',
  },
  success: {
    color: 'green',
    margin: 0,
  },
  error: {
    color: 'red',
    whiteSpace: 'pre-wrap',
    margin: 0,
  },
}