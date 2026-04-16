import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient from '../api/client'
import AccountForm from '../components/AccountForm'

export default function AccountCreatePage() {
  const navigate = useNavigate()
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/accounting/accounts')
      setAccounts(Array.isArray(response.data) ? response.data : [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreated = (createdAccount) => {
    navigate(`/accounts/${createdAccount.id}`)
  }

  if (loading) {
    return <p>Loading...</p>
  }

  return <AccountForm accounts={accounts} onCreated={handleCreated} />
}