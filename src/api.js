// API helper functions for interacting with the FastAPI backend.

// For stability across environments, we hard‑code the base URL instead of relying on
// environment variables. This ensures that API calls always target the correct
// backend instance. If you need to change the backend endpoint, update the
// string below. The `/accounting` prefix is appended in each function.
const BASE_URL = "https://web-production-54c61.up.railway.app/api/v1";

async function handleResponse(resp) {
  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    throw new Error(data.detail || `Request failed with status ${resp.status}`);
  }
  return resp.json();
}

export async function searchAccounts(query) {
  const url = new URL(`${BASE_URL}/accounting/accounts/search`);
  url.searchParams.set("q", query);
  url.searchParams.set("limit", 10);
  const resp = await fetch(url);
  return handleResponse(resp);
}

export async function getJournalEntries() {
  const resp = await fetch(`${BASE_URL}/accounting/journal-entries`);
  return handleResponse(resp);
}

export async function createJournalEntry(entry) {
  const resp = await fetch(`${BASE_URL}/accounting/journal-entries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  });
  return handleResponse(resp);
}

export async function getJournalEntry(id) {
  const resp = await fetch(`${BASE_URL}/accounting/journal-entries/${id}`);
  return handleResponse(resp);
}

export async function approveJournalEntry(id) {
  const resp = await fetch(`${BASE_URL}/accounting/journal-entries/${id}/approve`, {
    method: "POST",
  });
  return handleResponse(resp);
}

export async function postJournalEntry(id) {
  const resp = await fetch(`${BASE_URL}/accounting/journal-entries/${id}/post`, {
    method: "POST",
  });
  return handleResponse(resp);
}