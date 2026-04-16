import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getJournalEntries } from "../api.js";

/**
 * List all journal entries in a polished table. This page fetches entries
 * from the backend and displays them with improved spacing and styling.
 * Each entry links to its detail page.
 */
export default function JournalEntriesPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch journal entries on mount
  useEffect(() => {
    async function fetchEntries() {
      try {
        const data = await getJournalEntries();
        setEntries(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchEntries();
  }, []);

  // Define table styles consistent with the form page
  const tableStyle = {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: "0 6px",
  };
  const headerCellStyle = {
    background: "#f1f5f9",
    fontWeight: "bold",
    fontSize: "13px",
  };
  const cellStyle = {
    background: "#fff",
    padding: "10px",
    borderBottom: "1px solid #e2e8f0",
  };

  return (
    <div>
      <h2>Journal Entries</h2>
      <div style={{ marginBottom: "10px" }}>
        <Link to="/journal-entries/new">Create New Entry</Link>
      </div>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>Error: {error}</p>}
      {!loading && !error && (
        <table
          border={0}
          cellPadding="0"
          cellSpacing="0"
          style={{ ...tableStyle, marginBottom: "10px" }}
        >
          <thead>
            <tr>
              <th style={headerCellStyle}>ID</th>
              <th style={headerCellStyle}>Date</th>
              <th style={headerCellStyle}>Description</th>
              <th style={headerCellStyle}>Debit</th>
              <th style={headerCellStyle}>Credit</th>
              <th style={headerCellStyle}>Status</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              // Compute totals if not provided
              const totalDebit = (() => {
                if (entry.total_debit !== undefined && entry.total_debit !== null) {
                  return Number(entry.total_debit);
                }
                return entry.lines?.reduce((sum, line) => {
                  const amount =
                    line.debit !== undefined && line.debit !== null
                      ? line.debit
                      : line.debit_amount || 0;
                  return sum + parseFloat(amount);
                }, 0);
              })();
              const totalCredit = (() => {
                if (entry.total_credit !== undefined && entry.total_credit !== null) {
                  return Number(entry.total_credit);
                }
                return entry.lines?.reduce((sum, line) => {
                  const amount =
                    line.credit !== undefined && line.credit !== null
                      ? line.credit
                      : line.credit_amount || 0;
                  return sum + parseFloat(amount);
                }, 0);
              })();
              return (
                <tr key={entry.id}>
                  <td style={cellStyle}>
                    <Link to={`/journal-entries/${entry.id}`}>{entry.id}</Link>
                  </td>
                  <td style={cellStyle}>{entry.entry_date || entry.date}</td>
                  <td style={cellStyle}>{entry.description || ""}</td>
                  <td style={cellStyle}>{totalDebit !== undefined ? totalDebit.toFixed(2) : ""}</td>
                  <td style={cellStyle}>{totalCredit !== undefined ? totalCredit.toFixed(2) : ""}</td>
                  <td style={cellStyle}>{entry.status}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}