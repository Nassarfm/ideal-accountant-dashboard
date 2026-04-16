// API helper functions for interacting with the FastAPI backend.

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function handleResponse(resp) {
  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    throw new Error(data.detail || `Request failed with status ${resp.status}`);
  }
  return resp.json();
}

export async function searchAccounts(query) {
  const url = new URL(`${BASE_URL}/accounts/search`);
  url.searchParams.set("q", query);
  url.searchParams.set("limit", 10);
  const resp = await fetch(url);
  return handleResponse(resp);
}

export async function getJournalEntries() {
  // Use hyphenated path to align with FastAPI router definitions
  const resp = await fetch(`${BASE_URL}/journal-entries`);
  return handleResponse(resp);
}

export async function createJournalEntry(entry) {
  const resp = await fetch(`${BASE_URL}/journal-entries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  });
  return handleResponse(resp);
}

export async function getJournalEntry(id) {
  const resp = await fetch(`${BASE_URL}/journal-entries/${id}`);
  return handleResponse(resp);
}

export async function approveJournalEntry(id) {
  const resp = await fetch(`${BASE_URL}/journal-entries/${id}/approve`, {
    method: "POST",
  });
  return handleResponse(resp);
}

export async function postJournalEntry(id) {
  const resp = await fetch(`${BASE_URL}/journal-entries/${id}/post`, {
    method: "POST",
  });
  return handleResponse(resp);
}