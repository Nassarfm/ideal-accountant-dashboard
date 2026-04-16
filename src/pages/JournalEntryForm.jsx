import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createJournalEntry,
  searchAccounts,
} from "../api.js";

export default function JournalEntryForm() {
  const navigate = useNavigate();
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [lines, setLines] = useState([
    { id: Date.now(), accountId: null, accountQuery: "", accountDisplay: "", description: "", debit: "", credit: "", suggestions: [] },
  ]);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Debounce search to avoid excessive requests
  useEffect(() => {
    const timers = [];
    lines.forEach((line, idx) => {
      if (line.accountQuery && line.accountId == null) {
        const timer = setTimeout(async () => {
          try {
            const results = await searchAccounts(line.accountQuery);
            setLines((prev) => {
              const copy = [...prev];
              copy[idx].suggestions = results;
              return copy;
            });
          } catch (err) {
            console.error(err);
          }
        }, 300);
        timers.push(timer);
      }
    });
    return () => timers.forEach((t) => clearTimeout(t));
  }, [lines]);

  const totalDebit = lines.reduce((sum, line) => sum + parseFloat(line.debit || 0), 0);
  const totalCredit = lines.reduce((sum, line) => sum + parseFloat(line.credit || 0), 0);

  const handleLineChange = (index, field, value) => {
    setLines((prev) => {
      const copy = [...prev];
      copy[index][field] = value;
      // Reset selection if user changes query
      if (field === "accountQuery") {
        copy[index].accountId = null;
        copy[index].accountDisplay = "";
      }
      // Ensure only debit or credit value
      if (field === "debit" && value) {
        copy[index].credit = "";
      }
      if (field === "credit" && value) {
        copy[index].debit = "";
      }
      return copy;
    });
  };

  const addLine = () => {
    setLines((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        accountId: null,
        accountQuery: "",
        accountDisplay: "",
        description: "",
        debit: "",
        credit: "",
        suggestions: [],
      },
    ]);
  };

  const removeLine = (index) => {
    setLines((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSelectAccount = (index, account) => {
    setLines((prev) => {
      const copy = [...prev];
      copy[index].accountId = account.id;
      copy[index].accountQuery = `${account.code} - ${account.name}`;
      copy[index].accountDisplay = `${account.code} - ${account.name}`;
      copy[index].suggestions = [];
      return copy;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    // Validate lines: every line must have account and amount
    for (const line of lines) {
      if (!line.accountId) {
        setError("Please select an account for each line.");
        return;
      }
      const debitVal = parseFloat(line.debit || 0);
      const creditVal = parseFloat(line.credit || 0);
      if ((debitVal === 0 && creditVal === 0) || (debitVal && creditVal)) {
        setError("Each line must have either a debit or credit amount (not both).");
        return;
      }
    }
    if (totalDebit !== totalCredit) {
      setError("Total debit must equal total credit.");
      return;
    }
    // Prepare payload for API. Some backends expect `date`, others expect `entry_date`.
    const payload = {
      description: description || null,
      date,
      entry_date: date,
      lines: lines.map((line) => ({
        account_id: line.accountId,
        description: line.description || null,
        debit: parseFloat(line.debit || 0),
        credit: parseFloat(line.credit || 0),
      })),
    };
    setSaving(true);
    try {
      const entry = await createJournalEntry(payload);
      navigate(`/journal-entries/${entry.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2>Create Journal Entry</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "10px" }}>
          <label>
            Date: <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </label>
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label>
            Description:<br />
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: "100%" }}
            />
          </label>
        </div>
        <table border="1" cellPadding="6" cellSpacing="0" style={{ width: "100%", marginBottom: "10px" }}>
          <thead>
            <tr>
              <th>Account</th>
              <th>Description</th>
              <th>Debit</th>
              <th>Credit</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, index) => (
              <tr key={line.id}>
                <td style={{ position: "relative" }}>
                  <input
                    type="text"
                    value={line.accountDisplay || line.accountQuery}
                    onChange={(e) => handleLineChange(index, "accountQuery", e.target.value)}
                    placeholder="Search account"
                    required
                  />
                  {/* Suggestions dropdown */}
                  {line.suggestions.length > 0 && !line.accountId && (
                    <ul
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        background: "white",
                        border: "1px solid #ccc",
                        maxHeight: "150px",
                        overflowY: "auto",
                        listStyle: "none",
                        margin: 0,
                        padding: 0,
                        zIndex: 10,
                      }}
                    >
                      {line.suggestions.map((acc) => (
                        <li
                          key={acc.id}
                          onClick={() => handleSelectAccount(index, acc)}
                          style={{ padding: "4px", cursor: "pointer" }}
                        >
                          {acc.code} - {acc.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
                <td>
                  <input
                    type="text"
                    value={line.description}
                    onChange={(e) => handleLineChange(index, "description", e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={line.debit}
                    onChange={(e) => handleLineChange(index, "debit", e.target.value)}
                    step="0.01"
                    min="0"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={line.credit}
                    onChange={(e) => handleLineChange(index, "credit", e.target.value)}
                    step="0.01"
                    min="0"
                  />
                </td>
                <td>
                  {lines.length > 1 && (
                    <button type="button" onClick={() => removeLine(index)}>
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginBottom: "10px" }}>
          <button type="button" onClick={addLine}>
            Add Line
          </button>
        </div>
        <div style={{ marginBottom: "10px" }}>
          <strong>Total Debit:</strong> {totalDebit.toFixed(2)} &nbsp; &nbsp;
          <strong>Total Credit:</strong> {totalCredit.toFixed(2)}
        </div>
        <div>
          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Create Entry"}
          </button>
        </div>
      </form>
    </div>
  );
}