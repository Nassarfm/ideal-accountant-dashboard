// API helper functions for interacting with the FastAPI backend.

// Pull the base URL from the Vite environment. During development this should
// point to something like "http://localhost:8000/api/v1", while in
// production it will be provided via an environment variable. The prefix
// "/accounting" is appended for all accounting‑related endpoints, but it is not
// baked into the base URL so that the deployment base path in Vite remains
// dynamic.
const BASE_URL = import.meta.env.VITE_API_URL || "";

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