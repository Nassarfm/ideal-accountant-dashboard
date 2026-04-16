import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './layout/AppLayout'
import JournalEntryDetailsPage from './pages/JournalEntryDetailsPage'
import DashboardPage from './pages/DashboardPage'
import AccountsPage from './pages/AccountsPage'
import AccountDetailsPage from './pages/AccountDetailsPage'
import AccountCreatePage from './pages/AccountCreatePage'
import JournalEntriesPage from './pages/JournalEntriesPage'
import GeneralLedgerPage from './pages/GeneralLedgerPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="accounts" element={<AccountsPage />} />
        <Route path="accounts/new" element={<AccountCreatePage />} />
        <Route path="accounts/:accountId" element={<AccountDetailsPage />} />
        <Route path="journal-entries" element={<JournalEntriesPage />} />
        <Route path="journal-entries/:entryId" element={<JournalEntryDetailsPage />} />
        <Route path="general-ledger" element={<GeneralLedgerPage />} />
      </Route>
    </Routes>
  )
}