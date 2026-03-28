/**
 * AxioMeet API Client
 * Central HTTP client with JWT auth, error handling, and base URL config.
 */

// In dev the Vite proxy forwards /api and /oauth to VITE_API_URL.
// In production builds use the full base URL from env.
const API_BASE = import.meta.env.DEV
  ? ''
  : (import.meta.env.VITE_API_URL || 'https://axiomeet.io');

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

function getToken() {
  return localStorage.getItem('axiomeet_token');
}

function setToken(token) {
  localStorage.setItem('axiomeet_token', token);
}

function clearToken() {
  localStorage.removeItem('axiomeet_token');
  localStorage.removeItem('axiomeet_user');
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem('axiomeet_user'));
  } catch {
    return null;
  }
}

function setUser(user) {
  localStorage.setItem('axiomeet_user', JSON.stringify(user));
}

async function request(method, path, body = null) {
  const url = `${API_BASE}${path}`;
  const headers = { 'Content-Type': 'application/json' };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = { method, headers };
  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (response.status === 401) {
    clearToken();
    window.location.href = '/login';
    throw new ApiError('Session expired', 401);
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      data?.error || data?.message || `HTTP ${response.status}`,
      response.status,
      data
    );
  }

  return data;
}

const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  put: (path, body) => request('PUT', path, body),
  delete: (path) => request('DELETE', path),

  // Auth
  login: (email, password) => request('POST', '/api/v1/auth/login', { email, password }),
  register: (data) => request('POST', '/api/v1/auth/register', data),

  // Onboarding
  getOnboardingProgress: () => request('GET', '/api/v1/onboarding/progress'),
  getOnboardingSummary: () => request('GET', '/api/v1/onboarding/summary'),
  startOnboarding: () => request('POST', '/api/v1/onboarding/start'),
  verifyEmail: () => request('POST', '/api/v1/onboarding/verify-email'),
  confirmEmail: (code) => request('POST', '/api/v1/onboarding/confirm-email', { code }),
  completeStep: (stepName, metadata) =>
    request('POST', '/api/v1/onboarding/complete-step', { step_name: stepName, metadata }),
  skipStep: (stepName) =>
    request('POST', '/api/v1/onboarding/skip-step', { step_name: stepName }),
  testConnection: (type) =>
    request('POST', '/api/v1/onboarding/test-connection', { connection_type: type }),

  // Dashboard
  getDashboard: () => request('GET', '/api/v1/dashboard'),
  getUsage: () => request('GET', '/api/v1/dashboard/usage'),
  getConnections: () => request('GET', '/api/v1/dashboard/connections'),
  getMeetings: (limit = 20) => request('GET', `/api/v1/dashboard/meetings?limit=${limit}`),

  // OAuth
  getZoomAuthUrl: (orgId) => `${API_BASE}/oauth/zoom/authorize?org_id=${orgId}`,
  getYandexAuthUrl: (orgId) => `${API_BASE}/oauth/yandex/authorize?org_id=${orgId}`,
  getZoomStatus: (orgId) => request('GET', `/oauth/zoom/status?org_id=${orgId}`),
  getYandexStatus: (orgId) => request('GET', `/oauth/yandex/status?org_id=${orgId}`),
  disconnectZoom: (orgId) => request('POST', '/oauth/zoom/disconnect', { org_id: orgId }),
  disconnectYandex: (orgId) => request('POST', '/oauth/yandex/disconnect', { org_id: orgId }),

  // Admin — Platform
  getPlatformStatus: () => request('GET', '/api/admin/platform-status'),
  getAdminOrganizations: () => request('GET', '/api/admin/organizations'),
};

export { api, ApiError, getToken, setToken, clearToken, getUser, setUser };
export default api;
