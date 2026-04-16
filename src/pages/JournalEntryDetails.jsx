import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getJournalEntry,
  approveJournalEntry,
  postJournalEntry,
} from "../api.js";

export default function JournalEntryDetails() {
  const { id } = useParams();
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function fetchEntry() {
      try {
        const data = await getJournalEntry(id);
        setEntry(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchEntry();
  }, [id]);

  const handleApprove = async () => {
    setActionError(null);
    setActionLoading(true);
    try {
      const data = await approveJournalEntry(id);
      setEntry(data);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePost = async () => {
    setActionError(null);
    setActionLoading(true);
    try {
      const data = await postJournalEntry(id);
      setEntry(data);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p style={{ color: "red" }}>Error: {error}</p>;
  if (!entry) return <p>Entry not found</p>;

  return (
    <div>
      <h2>Journal Entry #{entry.id}</h2>
      <p>
        <strong>Date:</strong> {entry.entry_date || entry.date}
      </p>
      <p>
        <strong>Description:</strong> {entry.description || ""}
      </p>
      <p>
        <strong>Status:</strong> {entry.status}
      </p>
      <p>
        <strong>Total Debit:</strong> {(() => {
          // Prefer backend provided totals; otherwise compute from lines
          const totalDebit =
            entry.total_debit !== undefined && entry.total_debit !== null
              ? Number(entry.total_debit)
              : entry.lines.reduce(
                  (sum, line) =>
                    sum +
                    parseFloat(
                      line.debit !== undefined
                        ? line.debit
                        : line.debit_amount || 0
                    ),
                  0
                );
          return totalDebit.toFixed(2);
        })()} &nbsp; &nbsp;
        <strong>Total Credit:</strong> {(() => {
          const totalCredit =
            entry.total_credit !== undefined && entry.total_credit !== null
              ? Number(entry.total_credit)
              : entry.lines.reduce(
                  (sum, line) =>
                    sum +
                    parseFloat(
                      line.credit !== undefined
                        ? line.credit
                        : line.credit_amount || 0
                    ),
                  0
                );
          return totalCredit.toFixed(2);
        })()}
      </p>
      <table border="1" cellPadding="6" cellSpacing="0" style={{ width: "100%", marginBottom: "10px" }}>
        <thead>
          <tr>
            <th>Account</th>
            <th>Description</th>
            <th>Debit</th>
            <th>Credit</th>
          </tr>
        </thead>
        <tbody>
          {entry.lines.map((line) => (
            <tr key={line.id}>
              <td>
                {line.account.code} - {line.account.name}
              </td>
                <td>{line.description || ""}</td>
                <td>
                  {(() => {
                    const value =
                      line.debit !== undefined && line.debit !== null
                        ? line.debit
                        : line.debit_amount || 0;
                    return Number(value).toFixed(2);
                  })()}
                </td>
                <td>
                  {(() => {
                    const value =
                      line.credit !== undefined && line.credit !== null
                        ? line.credit
                        : line.credit_amount || 0;
                    return Number(value).toFixed(2);
                  })()}
                </td>
            </tr>
          ))}
        </tbody>
      </table>
      {actionError && <p style={{ color: "red" }}>{actionError}</p>}
      <div style={{ marginBottom: "10px" }}>
        {entry.status === "draft" && (
          <button onClick={handleApprove} disabled={actionLoading}>
            {actionLoading ? "Processing..." : "Approve"}
          </button>
        )}
        {entry.status === "approved" && (
          <button onClick={handlePost} disabled={actionLoading}>
            {actionLoading ? "Processing..." : "Post"}
          </button>
        )}
        {entry.status === "posted" && <span>Posted (no further actions)</span>}
      </div>
      <div>
        <Link to="/journal-entries">Back to entries</Link>
      </div>
    </div>
  );
}