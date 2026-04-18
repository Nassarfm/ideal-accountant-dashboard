import React from "react";
import { Routes, Route, Link, Navigate } from "react-router-dom";
import JournalEntriesPage from "./pages/JournalEntriesPage.jsx";
import JournalEntryForm from "./pages/JournalEntryForm.jsx";
import JournalEntryDetails from "./pages/JournalEntryDetails.jsx";

/**
 * The main application component defines the top‑level routes. To avoid
 * interpreting the string "new" as a journal entry ID, routes are nested
 * under ``/journal-entries``. The ``new`` route is explicitly defined
 * before the ``:id`` route, ensuring React Router matches it correctly.
 */
export default function App() {
  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Ideal Accountant ERP</h1>
      <nav style={{ marginBottom: "20px" }}>
        <Link to="/journal-entries">Journal Entries</Link>
      </nav>
      <Routes>
        <Route path="/journal-entries/*" element={<JournalEntriesPageWrapper />} />
        <Route path="*" element={<Navigate to="/journal-entries" replace />} />
      </Routes>
    </div>
  );
}

/**
 * Wrapper component to handle nested routes for journal entries. Separating
 * this logic into its own component prevents React Router from matching
 * ``/journal-entries/new`` to the ``:id`` pattern.
 */
function JournalEntriesPageWrapper() {
  return (
    <Routes>
      <Route index element={<JournalEntriesPage />} />
      <Route path="new" element={<JournalEntryForm />} />
      <Route path=":id" element={<JournalEntryDetails />} />
    </Routes>
  );
}