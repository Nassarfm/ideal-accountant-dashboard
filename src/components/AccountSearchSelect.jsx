import { useState, useEffect } from "react";
import { searchAccounts } from "../api.js";

/**
 * A reusable account search and select component. It provides a typeahead
 * input that fetches matching accounts from the backend and displays
 * suggestions in a dropdown. When an account is selected, ``onSelect`` is
 * called with the account object; when the input is cleared, ``onSelect``
 * is called with ``null``.
 *
 * Props:
 *  - selectedAccount: the currently selected account object, or ``null``
 *  - onSelect: callback receiving the selected account or ``null``
 *  - placeholder: optional placeholder text for the input
 */
export default function AccountSearchSelect({ selectedAccount, onSelect, placeholder }) {
  const [query, setQuery] = useState(() => {
    if (selectedAccount) {
      return `${selectedAccount.code} - ${selectedAccount.name}`;
    }
    return "";
  });
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch suggestions when query changes and no account is selected
  useEffect(() => {
    if (!query || (selectedAccount && query === `${selectedAccount.code} - ${selectedAccount.name}`)) {
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

  const handleSelect = (account) => {
    if (onSelect) {
      onSelect(account);
    }
    setQuery(`${account.code} - ${account.name}`);
    setSuggestions([]);
  };

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    if (selectedAccount && value !== `${selectedAccount.code} - ${selectedAccount.name}`) {
      // When user edits the text, clear the current selection
      if (onSelect) onSelect(null);
    }
  };

  const handleClear = () => {
    setQuery("");
    setSuggestions([]);
    if (onSelect) onSelect(null);
  };

  return (
    <div style={{ position: "relative" }}>
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder={placeholder || "Search account"}
        style={{ width: "100%" }}
      />
      {selectedAccount && (
        <button
          type="button"
          onClick={handleClear}
          style={{ position: "absolute", right: 4, top: 4 }}
        >
          ×
        </button>
      )}
      {suggestions.length > 0 && !selectedAccount && (
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
          {suggestions.map((acc) => (
            <li
              key={acc.id}
              onClick={() => handleSelect(acc)}
              style={{ padding: "4px", cursor: "pointer" }}
            >
              {acc.code} - {acc.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}