// Simple auth utility for SPA
export function saveAuth(token, role, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('role', role);
  if (user) localStorage.setItem('user', JSON.stringify(user));
}

// Alias used by Login.jsx
export function setAuth(token, role, user) {
  return saveAuth(token, role, user);
}

export function getToken() {
  return localStorage.getItem('token');
}

export function getRole() {
  return localStorage.getItem('role');
}

export function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('user');
}
