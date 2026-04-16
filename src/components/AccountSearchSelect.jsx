import { useState, useEffect } from 'react'
import apiClient from '../api/client'

/**
 * AccountSearchSelect component allows searching for postable accounts via remote API.
 *
 * Props:
 *  - value: currently selected account ID (optional)
 *  - selectedAccountCode: code of the selected account (to display in the input)
 *  - onSelect: callback invoked with the selected account object
 *  - placeholder: placeholder text for the search input
 */
export default function AccountSearchSelect({ value, selectedAccountCode, onSelect, placeholder }) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!query) {
      setSuggestions([])
      return
    }
    setLoading(true)
    const handler = setTimeout(async () => {
      try {
        const response = await apiClient.get('/accounting/accounts/search', {
          params: { q: query, limit: 10 },
        })
        // only include postable accounts
        setSuggestions(Array.isArray(response.data) ? response.data.filter((acc) => acc.is_postable) : [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }, 300) // debounce search by 300ms
    return () => clearTimeout(handler)
  }, [query])

  const handleSelect = (account) => {
    setQuery('')
    setSuggestions([])
    if (onSelect) {
      onSelect(account)
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <input
        type="text"
        value={selectedAccountCode || query}
        onChange={(e) => {
          const newValue = e.target.value
          setQuery(newValue)
          // When user edits the search query, reset the selection
          if (onSelect && newValue !== selectedAccountCode) {
            onSelect(null)
          }
        }}
        placeholder={placeholder || 'Search account...'}
        style={{ width: '100%', marginBottom: '5px' }}
      />
      {suggestions.length > 0 && (
        <ul
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: '#fff',
            border: '1px solid #ddd',
            maxHeight: '150px',
            overflowY: 'auto',
            listStyle: 'none',
            margin: 0,
            padding: 0,
            zIndex: 10,
          }}
        >
          {suggestions.map((acc) => (
            <li
              key={acc.id}
              onClick={() => handleSelect(acc)}
              style={{ padding: '6px 8px', cursor: 'pointer' }}
            >
              {acc.code} — {acc.name_ar}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}