import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import apiClient from '../api/client'
import AccountSearchSelect from '../components/AccountSearchSelect'

const emptyLine = {
  legal_entity_id: 1,
  branch_id: 1,
  account_id: '',
  account_code: '',
  description: '',
  debit_amount: 0,
  credit_amount: 0,
}

const initialForm = {
  description: '',
  entry_date: new Date().toISOString().slice(0, 10),
  reference: '',
  voucher_type_id: 1,
  fiscal_year_id: 1,
  je_type: 'GJE',
  lines: [{ ...emptyLine }],
}

export default function JournalEntriesPage() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [form, setForm] = useState(initialForm)

  useEffect(() => {
    loadPageData()
  }, [])

  const loadPageData = async () => {
    try {
      setLoading(true)
      setError('')

      const entriesRes = await apiClient.get('/accounting/journal-entries')
      setEntries(Array.isArray(entriesRes.data) ? entriesRes.data : [])
    } catch (err) {
      console.error(err)
      setError(
        err?.response?.data?.detail
          ? JSON.stringify(err.response.data.detail)
          : 'Failed to load journal entries page.'
      )
    } finally {
      setLoading(false)
    }
  }

  // Determine if the journal entry is balanced and has any empty account lines

  const totalDebit = useMemo(() => {
    return form.lines.reduce((sum, line) => sum + Number(line.debit_amount || 0), 0)
  }, [form.lines])

  const totalCredit = useMemo(() => {
    return form.lines.reduce((sum, line) => sum + Number(line.credit_amount || 0), 0)
  }, [form.lines])

  const isBalanced = totalDebit === totalCredit && totalDebit > 0
  const hasEmptyAccount = form.lines.some((line) => !line.account_id)

  const handleHeaderChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleLineChange = (index, field, value) => {
    setForm((prev) => {
      const nextLines = [...prev.lines]
      const nextLine = { ...nextLines[index] }

      if (field === 'debit_amount') {
        // When a debit is entered, ensure credit is zeroed out
        nextLine.debit_amount = value === '' ? '' : Number(value)
        if (value !== '' && Number(value) > 0) {
          nextLine.credit_amount = 0
        }
      } else if (field === 'credit_amount') {
        // When a credit is entered, ensure debit is zeroed out
        nextLine.credit_amount = value === '' ? '' : Number(value)
        if (value !== '' && Number(value) > 0) {
          nextLine.debit_amount = 0
        }
      } else {
        nextLine[field] = value
      }

      nextLines[index] = nextLine

      return {
        ...prev,
        lines: nextLines,
      }
    })
  }

  const handleAccountSelect = (index, account) => {
    setForm((prev) => {
      const nextLines = [...prev.lines]
      nextLines[index] = {
        ...nextLines[index],
        account_id: account && account.id ? account.id : '',
        account_code: account && account.code ? account.code : '',
      }

      return {
        ...prev,
        lines: nextLines,
      }
    })
  }

  const addLine = () => {
    setForm((prev) => ({
      ...prev,
      lines: [...prev.lines, { ...emptyLine }],
    }))
  }

  const removeLine = (index) => {
    setForm((prev) => ({
      ...prev,
      lines: prev.lines.filter((_, i) => i !== index),
    }))
  }

  const resetForm = () => {
    setForm({
      ...initialForm,
      entry_date: new Date().toISOString().slice(0, 10),
      lines: [{ ...emptyLine }],
    })
  }

  const handleCreateEntry = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    // Validate lines before saving
    if (hasEmptyAccount) {
      setError('Please select an account for all lines')
      return
    }
    if (!isBalanced) {
      setError('Journal entry must be balanced before saving')
      return
    }
    setSaving(true)

    try {
      const payload = {
        ...form,
        voucher_type_id: Number(form.voucher_type_id),
        fiscal_year_id: Number(form.fiscal_year_id),
        lines: form.lines.map((line) => ({
          legal_entity_id: Number(line.legal_entity_id),
          branch_id: Number(line.branch_id),
          account_id: line.account_id ? Number(line.account_id) : null,
          account_code: line.account_code,
          description: line.description,
          debit_amount: Number(line.debit_amount || 0),
          credit_amount: Number(line.credit_amount || 0),
        })),
      }

      const response = await apiClient.post('/accounting/journal-entries', payload)
      setMessage(`Journal entry created successfully: ID ${response.data.id}`)
      resetForm()
      await loadPageData()
    } catch (err) {
      console.error(err)
      setError(
        err?.response?.data?.detail
          ? JSON.stringify(err.response.data.detail)
          : 'Failed to create journal entry.'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div style={styles.topBar}>
        <div>
          <h1 style={styles.title}>Journal Entries</h1>
          <p style={styles.subtitle}>Create and review daily journal entries.</p>
        </div>
      </div>

      {message && <p style={styles.success}>{message}</p>}
      {error && <p style={styles.error}>{error}</p>}

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Create New Entry</h2>

        <form onSubmit={handleCreateEntry} style={styles.form}>
          <div style={styles.headerGrid}>
            <div>
              <label style={styles.label}>Description</label>
              <input
                name="description"
                value={form.description}
                onChange={handleHeaderChange}
                style={styles.input}
                required
              />
            </div>

            <div>
              <label style={styles.label}>Entry Date</label>
              <input
                type="date"
                name="entry_date"
                value={form.entry_date}
                onChange={handleHeaderChange}
                style={styles.input}
                required
              />
            </div>

            <div>
              <label style={styles.label}>Reference</label>
              <input
                name="reference"
                value={form.reference}
                onChange={handleHeaderChange}
                style={styles.input}
              />
            </div>

            <div>
              <label style={styles.label}>Voucher Type ID</label>
              <input
                type="number"
                name="voucher_type_id"
                value={form.voucher_type_id}
                onChange={handleHeaderChange}
                style={styles.input}
                required
              />
            </div>

            <div>
              <label style={styles.label}>Fiscal Year ID</label>
              <input
                type="number"
                name="fiscal_year_id"
                value={form.fiscal_year_id}
                onChange={handleHeaderChange}
                style={styles.input}
                required
              />
            </div>

            <div>
              <label style={styles.label}>JE Type</label>
              <select
                name="je_type"
                value={form.je_type}
                onChange={handleHeaderChange}
                style={styles.input}
              >
                <option value="GJE">GJE</option>
              </select>
            </div>
          </div>

          <div style={styles.linesHeader}>
            <h3 style={styles.subTitle}>Entry Lines</h3>
            <button type="button" style={styles.secondaryButton} onClick={addLine}>
              Add Line
            </button>
          </div>

          <div style={styles.linesWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Legal Entity</th>
                  <th style={styles.th}>Branch</th>
                  <th style={styles.th}>Account</th>
                  <th style={styles.th}>Description</th>
                  <th style={styles.th}>Debit</th>
                  <th style={styles.th}>Credit</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {form.lines.map((line, index) => (
                  <tr key={index}>
                    <td style={styles.td}>
                      <input
                        type="number"
                        value={line.legal_entity_id}
                        onChange={(e) => handleLineChange(index, 'legal_entity_id', e.target.value)}
                        style={styles.cellInput}
                      />
                    </td>

                    <td style={styles.td}>
                      <input
                        type="number"
                        value={line.branch_id}
                        onChange={(e) => handleLineChange(index, 'branch_id', e.target.value)}
                        style={styles.cellInput}
                      />
                    </td>

                    <td style={styles.td}>
                    <AccountSearchSelect
                        value={line.account_id}
                        selectedAccountCode={line.account_code}
                        onSelect={(account) => handleAccountSelect(index, account)}
                        placeholder="Search by code or name..."
                      />
                    </td>

                    <td style={styles.td}>
                      <input
                        value={line.description}
                        onChange={(e) => handleLineChange(index, 'description', e.target.value)}
                        style={styles.cellInput}
                      />
                    </td>

                    <td style={styles.td}>
                      <input
                        type="number"
                        step="0.01"
                        value={line.debit_amount}
                        onChange={(e) => handleLineChange(index, 'debit_amount', e.target.value)}
                        style={styles.cellInput}
                      />
                    </td>

                    <td style={styles.td}>
                      <input
                        type="number"
                        step="0.01"
                        value={line.credit_amount}
                        onChange={(e) => handleLineChange(index, 'credit_amount', e.target.value)}
                        style={styles.cellInput}
                      />
                    </td>

                    <td style={styles.td}>
                      <button
                        type="button"
                        style={styles.removeButton}
                        onClick={() => removeLine(index)}
                        disabled={form.lines.length === 1}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={styles.summaryRow}>
            <div style={styles.summaryBox}>Total Debit: {totalDebit.toFixed(2)}</div>
            <div style={styles.summaryBox}>Total Credit: {totalCredit.toFixed(2)}</div>
            <div style={{ ...styles.summaryBox, color: isBalanced ? 'green' : 'red' }}>
              {isBalanced ? 'Balanced' : 'Not Balanced'}
            </div>
          </div>

          <div style={styles.actionRow}>
            <button
              type="submit"
              style={styles.primaryButton}
              disabled={saving || !isBalanced || hasEmptyAccount}
            >
              {saving ? 'Saving...' : 'Create Journal Entry'}
            </button>
          </div>
        </form>
      </div>

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Existing Entries</h2>

        {loading ? (
          <p>Loading entries...</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Entry Date</th>
                <th style={styles.th}>Reference</th>
                <th style={styles.th}>Description</th>
                <th style={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {entries.length > 0 ? (
                entries.map((entry) => (
                  <tr key={entry.id}>
                    <td style={styles.td}>
                      <Link to={`/journal-entries/${entry.id}`} style={{ color: '#2563eb' }}>
                        {entry.id}
                      </Link>
                    </td>
                    <td style={styles.td}>{entry.entry_date}</td>
                    <td style={styles.td}>{entry.reference}</td>
                    <td style={styles.td}>{entry.description}</td>
                    <td style={styles.td}>{entry.status}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td style={styles.td} colSpan="5">
                    No journal entries found.
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
  card: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '14px',
    padding: '20px',
    marginBottom: '20px',
    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.05)',
  },
  sectionTitle: {
    marginTop: 0,
    marginBottom: '16px',
    fontSize: '22px',
  },
  subTitle: {
    margin: 0,
    fontSize: '18px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  headerGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '16px',
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
  linesHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  linesWrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    borderBottom: '1px solid #e5e7eb',
    padding: '12px',
    textAlign: 'left',
    background: '#f8fafc',
  },
  td: {
    borderBottom: '1px solid #f1f5f9',
    padding: '12px',
    verticalAlign: 'top',
  },
  cellInput: {
    width: '100%',
    padding: '10px',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    background: '#fff',
  },
  summaryRow: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  summaryBox: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '12px 16px',
    fontWeight: 'bold',
  },
  actionRow: {
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
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    padding: '10px 14px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  removeButton: {
    background: '#dc2626',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 12px',
    cursor: 'pointer',
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