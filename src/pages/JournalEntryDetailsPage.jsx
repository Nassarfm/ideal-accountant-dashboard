import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import apiClient from '../api/client'

/**
 * JournalEntryDetailsPage displays a single journal entry with its lines and allows approving/posting.
 */
export default function JournalEntryDetailsPage() {
  const { entryId } = useParams()
  const [entry, setEntry] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchEntry()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryId])

  const fetchEntry = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await apiClient.get(`/accounting/journal-entries/${entryId}`)
      setEntry(response.data)
    } catch (err) {
      console.error(err)
      setError(
        err?.response?.data?.detail
          ? JSON.stringify(err.response.data.detail)
          : 'Failed to load journal entry.'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    setActionLoading(true)
    setError('')
    setMessage('')
    try {
      const response = await apiClient.post(`/accounting/journal-entries/${entryId}/approve`)
      setMessage('Journal entry approved successfully.')
      setEntry(response.data)
    } catch (err) {
      console.error(err)
      setError(
        err?.response?.data?.detail
          ? JSON.stringify(err.response.data.detail)
          : 'Failed to approve journal entry.'
      )
    } finally {
      setActionLoading(false)
    }
  }

  const handlePost = async () => {
    setActionLoading(true)
    setError('')
    setMessage('')
    try {
      const response = await apiClient.post(`/accounting/journal-entries/${entryId}/post`)
      setMessage('Journal entry posted successfully.')
      setEntry(response.data)
    } catch (err) {
      console.error(err)
      setError(
        err?.response?.data?.detail
          ? JSON.stringify(err.response.data.detail)
          : 'Failed to post journal entry.'
      )
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return <p>Loading journal entry...</p>
  }
  if (error) {
    return <p style={{ color: 'red', whiteSpace: 'pre-wrap' }}>{error}</p>
  }
  if (!entry) {
    return <p>Journal entry not found.</p>
  }

  // Compute totals if not provided
  const totalDebit =
    entry.total_debit !== undefined && entry.total_debit !== null
      ? Number(entry.total_debit)
      : entry.lines.reduce((sum, line) => sum + Number(line.debit_amount || 0), 0)
  const totalCredit =
    entry.total_credit !== undefined && entry.total_credit !== null
      ? Number(entry.total_credit)
      : entry.lines.reduce((sum, line) => sum + Number(line.credit_amount || 0), 0)

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <Link to="/journal-entries" style={{ color: '#2563eb' }}>
          ← Back to entries
        </Link>
      </div>

      <h1 style={{ marginTop: 0 }}>Journal Entry #{entry.id}</h1>
      {message && <p style={{ color: 'green' }}>{message}</p>}
      <p>
        <strong>Status:</strong> {entry.status}
      </p>
      <p>
        <strong>Entry Date:</strong> {entry.entry_date}
      </p>
      {entry.reference && (
        <p>
          <strong>Reference:</strong> {entry.reference}
        </p>
      )}
      {entry.description && (
        <p>
          <strong>Description:</strong> {entry.description}
        </p>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead>
          <tr>
            <th style={{ borderBottom: '1px solid #e5e7eb', padding: '12px', textAlign: 'left', background: '#f8fafc' }}>
              Legal Entity
            </th>
            <th style={{ borderBottom: '1px solid #e5e7eb', padding: '12px', textAlign: 'left', background: '#f8fafc' }}>
              Branch
            </th>
            <th style={{ borderBottom: '1px solid #e5e7eb', padding: '12px', textAlign: 'left', background: '#f8fafc' }}>
              Account Code
            </th>
            <th style={{ borderBottom: '1px solid #e5e7eb', padding: '12px', textAlign: 'left', background: '#f8fafc' }}>
              Description
            </th>
            <th style={{ borderBottom: '1px solid #e5e7eb', padding: '12px', textAlign: 'right', background: '#f8fafc' }}>
              Debit
            </th>
            <th style={{ borderBottom: '1px solid #e5e7eb', padding: '12px', textAlign: 'right', background: '#f8fafc' }}>
              Credit
            </th>
          </tr>
        </thead>
        <tbody>
          {entry.lines.map((line, idx) => (
            <tr key={idx}>
              <td style={{ borderBottom: '1px solid #f1f5f9', padding: '12px' }}>{line.legal_entity_id}</td>
              <td style={{ borderBottom: '1px solid #f1f5f9', padding: '12px' }}>{line.branch_id}</td>
              <td style={{ borderBottom: '1px solid #f1f5f9', padding: '12px' }}>{line.account_code}</td>
              <td style={{ borderBottom: '1px solid #f1f5f9', padding: '12px' }}>{line.description || ''}</td>
              <td style={{ borderBottom: '1px solid #f1f5f9', padding: '12px', textAlign: 'right' }}>
                {Number(line.debit_amount || 0).toFixed(2)}
              </td>
              <td style={{ borderBottom: '1px solid #f1f5f9', padding: '12px', textAlign: 'right' }}>
                {Number(line.credit_amount || 0).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: '12px', fontWeight: 'bold' }}>
        <span style={{ marginRight: '20px' }}>Total Debit: {totalDebit.toFixed(2)}</span>
        <span>Total Credit: {totalCredit.toFixed(2)}</span>
      </div>

      {error && <p style={{ color: 'red', whiteSpace: 'pre-wrap' }}>{error}</p>}

      <div style={{ marginTop: '20px' }}>
        {entry.status === 'draft' && (
          <button
            onClick={handleApprove}
            disabled={actionLoading}
            style={{
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 14px',
              marginRight: '10px',
              cursor: 'pointer',
            }}
          >
            {actionLoading ? 'Processing...' : 'Approve'}
          </button>
        )}
        {entry.status === 'approved' && (
          <button
            onClick={handlePost}
            disabled={actionLoading}
            style={{
              background: '#0f172a',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 14px',
              marginRight: '10px',
              cursor: 'pointer',
            }}
          >
            {actionLoading ? 'Processing...' : 'Post'}
          </button>
        )}
        {entry.status === 'posted' && <span>Posted (no further actions)</span>}
      </div>
    </div>
  )
}