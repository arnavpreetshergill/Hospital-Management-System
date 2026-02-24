const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('token');
}

function getAuthHeaders() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function getMe() {
  const res = await fetch(`${API_BASE}/users/me`, { headers: getAuthHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch user');
  return data;
}

export async function getDoctors() {
  const res = await fetch(`${API_BASE}/users/doctors`, { headers: getAuthHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch doctors');
  return data;
}

export async function getDoctor(id) {
  const res = await fetch(`${API_BASE}/users/doctors/${id}`, { headers: getAuthHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch doctor');
  return data;
}

export async function deleteDoctor(id) {
  const res = await fetch(`${API_BASE}/users/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to delete doctor');
  return data;
}

export async function getLogs(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/logs${qs ? `?${qs}` : ''}`, { headers: getAuthHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || 'Failed to fetch logs');
  return data;
}

export async function regenerateAiSummary(patientId) {
  const res = await fetch(`${API_BASE}/patients/${patientId}/ai-summary`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to generate AI summary');
  return data;
}

export async function login(HospitalID, password) {
  const res = await fetch(`${API_BASE}/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ HospitalID, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  return data;
}

export async function signup({ HospitalID, password, name, email, phoneNumber, role }) {
  const res = await fetch(`${API_BASE}/users/signup`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ HospitalID, password, name, email, phoneNumber, role }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Signup failed');
  return data;
}

export async function getPatients() {
  const res = await fetch(`${API_BASE}/patients`, {
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || 'Failed to fetch patients');
  return data;
}

export async function getPatient(id) {
  const res = await fetch(`${API_BASE}/patients/${id}`, {
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || 'Failed to fetch patient');
  return data;
}

export async function updatePatient(id, updates) {
  const res = await fetch(`${API_BASE}/patients/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(updates),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || 'Failed to update patient');
  return data;
}

export async function deletePatient(id) {
  const res = await fetch(`${API_BASE}/patients/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || 'Failed to delete patient');
  return data;
}
