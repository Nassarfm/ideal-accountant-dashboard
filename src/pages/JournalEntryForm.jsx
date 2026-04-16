import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createJournalEntry, searchAccounts } from "../api.js";

/**
 * Form for creating a new journal entry. Provides a polished UI with
 * typeahead account search and improved table styling. Each line allows
 * selecting an account via a search input that shows suggestions in a
 * dropdown. Only one of debit or credit can be entered per line and the
 * totals must balance before saving.
 */
export default function JournalEntryForm() {
  const navigate = useNavigate();
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [lines, setLines] = useState([
    {
      id: Date.now(),
      legal_entity_id: 1,
      branch_id: 1,
      accountId: null,
      accountQuery: "",
      accountDisplay: "",
      description: "",
      debit: "",
      credit: "",
      suggestions: [],
    },
  ]);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Styling definitions for table and inputs
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
  const numberInputStyle = {
    width: "100%",
    padding: "8px",
    borderRadius: "6px",
    border: "1px solid #e2e8f0",
    textAlign: "right",
  };

  // Debounce account search queries
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

  // Calculate totals
  const totalDebit = lines.reduce((sum, line) => sum + parseFloat(line.debit || 0), 0);
  const totalCredit = lines.reduce((sum, line) => sum + parseFloat(line.credit || 0), 0);

  // Update line values and enforce single debit/credit
  const handleLineChange = (index, field, value) => {
    setLines((prev) => {
      const copy = [...prev];
      copy[index][field] = value;
      if (field === "accountQuery") {
        copy[index].accountId = null;
        copy[index].accountDisplay = "";
      }
      if (field === "debit" && value) {
        copy[index].credit = "";
      }
      if (field === "credit" && value) {
        copy[index].debit = "";
      }
      return copy;
    });
  };

  // Add and remove lines
  const addLine = () => {
    setLines((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        legal_entity_id: 1,
        branch_id: 1,
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

  // Handle selecting an account from suggestions
  const handleSelectAccount = (index, account) => {
    setLines((prev) => {
      const copy = [...prev];
      copy[index].accountId = account.id;
      copy[index].accountQuery = `${account.code} - ${account.name_ar || account.name} - ${account.name}`;
      copy[index].accountDisplay = `${account.code} - ${account.name_ar || account.name} - ${account.name}`;
      copy[index].suggestions = [];
      return copy;
    });
  };

  // Submit handler with validations
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    // Validate each line
    for (const line of lines) {
      if (!line.accountId) {
        setError("Please select an account for all lines");
        return;
      }
      const debitVal = parseFloat(line.debit || 0);
      const creditVal = parseFloat(line.credit || 0);
      if ((debitVal === 0 && creditVal === 0) || (debitVal && creditVal)) {
        setError("Each line must have either a debit or credit amount (not both)");
        return;
      }
    }
    if (totalDebit !== totalCredit) {
      setError("Journal entry must be balanced before saving");
      return;
    }
    const payload = {
      description: description || null,
      entry_date: date,
      date,
      voucher_type_id: 1,
      fiscal_year_id: 1,
      lines: lines.map((line) => ({
        legal_entity_id: line.legal_entity_id,
        branch_id: line.branch_id,
        account_id: line.accountId,
        subledger_type: "NONE",
        subledger_reference: null,
        cost_center_id: null,
        department_id: null,
        project_id: null,
        geographic_region_id: null,
        business_line_id: null,
        reserve_dimension_9_id: null,
        reserve_dimension_10_id: null,
        line_description: line.description || null,
        debit_amount: parseFloat(line.debit || 0),
        credit_amount: parseFloat(line.credit || 0),
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

  // Determine if any line lacks an account
  const hasEmptyAccount = lines.some((line) => !line.accountId);

  return (
    <div>
      <h2>Create Journal Entry</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "10px" }}>
          <label>
            Date:{" "}
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </label>
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label>
            Description:<br />
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #e2e8f0" }}
            />
          </label>
        </div>
        <table border={0} cellPadding="0" cellSpacing="0" style={{ ...tableStyle, marginBottom: "10px" }}>
          <thead>
            <tr>
              <th style={headerCellStyle}>Account</th>
              <th style={headerCellStyle}>Description</th>
              <th style={headerCellStyle}>Debit</th>
              <th style={headerCellStyle}>Credit</th>
              <th style={headerCellStyle}></th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, index) => (
              <tr key={line.id}>
                <td style={{ ...cellStyle, position: "relative" }}>
                  <input
                    type="text"
                    value={line.accountDisplay || line.accountQuery}
                    onChange={(e) => handleLineChange(index, "accountQuery", e.target.value)}
                    placeholder="\uD83D\uDD0D \u0627\u0628\u062D\u062B \u0628\u0627\u0644\u062D\u0633\u0627\u0628..."
                    required
                    style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #e2e8f0" }}
                  />
                  {line.suggestions.length > 0 && !line.accountId && (
                    <ul
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        background: "#fff",
                        border: "1px solid #e2e8f0",
                        maxHeight: "180px",
                        overflowY: "auto",
                        listStyle: "none",
                        margin: 0,
                        padding: 0,
                        zIndex: 10,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                      }}
                    >
                      {line.suggestions.map((acc) => (
                        <li
                          key={acc.id}
                          onClick={() => handleSelectAccount(index, acc)}
                          style={{ padding: "6px 10px", cursor: "pointer", borderBottom: "1px solid #f1f5f9" }}
                        >
                          {acc.code} - {acc.name_ar || acc.name} - {acc.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
                <td style={cellStyle}>
                  <input
                    type="text"
                    value={line.description}
                    onChange={(e) => handleLineChange(index, "description", e.target.value)}
                    style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #e2e8f0" }}
                  />
                </td>
                <td style={cellStyle}>
                  <input
                    type="number"
                    value={line.debit}
                    onChange={(e) => handleLineChange(index, "debit", e.target.value)}
                    step="0.01"
                    min="0"
                    style={numberInputStyle}
                  />
                </td>
                <td style={cellStyle}>
                  <input
                    type="number"
                    value={line.credit}
                    onChange={(e) => handleLineChange(index, "credit", e.target.value)}
                    step="0.01"
                    min="0"
                    style={numberInputStyle}
                  />
                </td>
                <td style={cellStyle}>
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
          <strong>Total Debit:</strong> {totalDebit.toFixed(2)} &nbsp;&nbsp;
          <strong>Total Credit:</strong> {totalCredit.toFixed(2)}
        </div>
        <div>
          <button
            type="submit"
            disabled={saving || hasEmptyAccount || totalDebit !== totalCredit}
          >
            {saving ? "Saving..." : "Create Entry"}
          </button>
        </div>
      </form>
    </div>
  );
}