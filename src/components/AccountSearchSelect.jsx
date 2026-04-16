import { useState, useEffect } from "react";
import { searchAccounts } from "../api.js";

/**
 * A polished account search input that provides an input box with a dropdown of
 * matching accounts. Suggestions display the account code, Arabic name and
 * English name. The component is fully controlled via the `selectedAccount`
 * prop and emits the selected account via `onSelect`. Clearing the input
 * resets the selection.
 *
 * Props:
 * - selectedAccount: currently selected account object or null
 * - onSelect: function(account | null) called when a suggestion is chosen or
 *   cleared
 * - placeholder: optional placeholder text; defaults to Arabic search prompt
 */
export default function AccountSearchSelect({ selectedAccount, onSelect, placeholder }) {
  const [query, setQuery] = useState(() => {
    if (selectedAccount) {
      return `${selectedAccount.code} - ${selectedAccount.name_ar || selectedAccount.name} - ${selectedAccount.name}`;
    }
    return "";
  });
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch suggestions when the query changes and no account is selected
  useEffect(() => {
    if (!query || (selectedAccount && query === `${selectedAccount.code} - ${selectedAccount.name_ar || selectedAccount.name} - ${selectedAccount.name}`)) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchAccounts(query);
        setSuggestions(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, selectedAccount]);

  // When the user selects a suggestion
  const handleSelect = (account) => {
    if (onSelect) onSelect(account);
    setQuery(`${account.code} - ${account.name_ar || account.name} - ${account.name}`);
    setSuggestions([]);
  };

  // Handle input changes; clear the selection if the user edits the text
  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    if (selectedAccount && value !== `${selectedAccount.code} - ${selectedAccount.name_ar || selectedAccount.name} - ${selectedAccount.name}`) {
      if (onSelect) onSelect(null);
    }
  };

  // Clear the current selection completely
  const handleClear = () => {
    setQuery("");
    setSuggestions([]);
    if (onSelect) onSelect(null);
  };

  // Styles for input and dropdown
  const inputStyle = {
    width: "100%",
    padding: "8px",
    borderRadius: "6px",
    border: "1px solid #e2e8f0",
  };
  const dropdownStyle = {
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
  };
  const suggestionStyle = {
    padding: "6px 10px",
    cursor: "pointer",
    borderBottom: "1px solid #f1f5f9",
  };

  return (
    <div style={{ position: "relative" }}>
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder={placeholder || "\uD83D\uDD0D \u0627\u0628\u062D\u062B \u0628\u0627\u0644\u062D\u0633\u0627\u0628..."}
        style={inputStyle}
      />
      {selectedAccount && (
        <button
          type="button"
          onClick={handleClear}
          style={{ position: "absolute", right: 6, top: 6, background: "transparent", border: "none", fontSize: "16px", cursor: "pointer" }}
        >
          ×
        </button>
      )}
      {suggestions.length > 0 && !selectedAccount && (
        <ul style={dropdownStyle}>
          {suggestions.map((acc) => (
            <li
              key={acc.id}
              onClick={() => handleSelect(acc)}
              style={suggestionStyle}
            >
              {acc.code} - {acc.name_ar || acc.name} - {acc.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}