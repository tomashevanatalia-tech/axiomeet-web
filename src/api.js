/**
 * AxioMeet API Client
 * Central HTTP client with JWT auth, error handling, and base URL config.
 */

// In dev the Vite proxy forwards /api and /oauth to VITE_API_URL.
// In production builds use the full base URL from env.
const API_BASE = import.meta.env.DEV
  ? ''
  : (import.meta.env.VITE_API_URL || 'https://app.axiomeet.io');

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
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = { method, headers, credentials: 'include' };
  if (body !== null && body !== undefined && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (response.status === 401 && token && !path.includes('/auth/login')) {
    clearToken();
    window.location.href = '/login';
    throw new ApiError('Session expired', 401);
  }

  if (response.status === 204) return null;

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
  patch: (path, body) => request('PATCH', path, body),
  delete: (path) => request('DELETE', path),

  // Auth
  login: (email, password) => request('POST', '/api/v1/auth/login', { email, password }),
  register: (data) => request('POST', '/api/v1/auth/register', data),
  forgotPassword: (email) => request('POST', '/api/v1/auth/forgot-password', { email }),
  resetPassword: (token, newPassword) =>
    request('POST', '/api/v1/auth/reset-password', { token, new_password: newPassword }),
  changePassword: (currentPassword, newPassword) =>
    request('POST', '/api/v1/auth/change-password', { current_password: currentPassword, new_password: newPassword }),
  me: () => request('GET', '/api/v1/auth/me'),

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
  createDemoMeeting: (template = 'standard') =>
    request('POST', '/api/v1/onboarding/demo-meeting', { template }),

  // Dashboard
  getDashboard: () => request('GET', '/api/v1/dashboard'),
  getUsage: () => request('GET', '/api/v1/dashboard/usage'),
  getConnections: () => request('GET', '/api/v1/dashboard/connections'),
  getMeetings: ({ page = 1, perPage = 20, stateGroup = '', search = '' } = {}) => {
    const params = new URLSearchParams({ page: String(page), per_page: String(perPage) });
    if (stateGroup) params.set('state_group', stateGroup);
    if (search.trim()) params.set('search', search.trim());
    return request('GET', `/api/v1/client/meetings?${params.toString()}`);
  },
  getMeetingDetail: (uuid) => request('GET', `/api/v1/client/meetings/${encodeURIComponent(uuid)}`),
  getMeetingTranscript: (uuid) => request('GET', `/api/v1/client/meetings/${encodeURIComponent(uuid)}/transcript`),
  updateMeetingTranscript: (uuid, payload) => request('PATCH', `/api/v1/client/meetings/${encodeURIComponent(uuid)}/transcript`, payload),
  updateMeetingProtocol: (uuid, protocolMd) => request('PATCH', `/api/v1/client/meetings/${encodeURIComponent(uuid)}/protocol`, { protocol_md: protocolMd }),
  updateMeetingTemplate: (uuid, templateCode) => request('PATCH', `/api/v1/client/meetings/${encodeURIComponent(uuid)}/template`, { template_code: templateCode }),
  regenerateMeetingProtocol: (uuid, templateCode) => request('POST', `/api/v1/client/meetings/${encodeURIComponent(uuid)}/regenerate-protocol`, { template_code: templateCode }),
  getProtocolVersions: (uuid) => request('GET', `/api/v1/client/meetings/${encodeURIComponent(uuid)}/protocol/versions`),
  restoreProtocolVersion: (uuid, versionId) => request('POST', `/api/v1/client/meetings/${encodeURIComponent(uuid)}/protocol/versions/${versionId}/restore`),
  getProtocolTemplates: () => request('GET', '/api/v1/admin/templates?lang=ru'),
  updateMeetingTask: (uuid, taskId, payload) => request('PATCH', `/api/v1/client/meetings/${encodeURIComponent(uuid)}/tasks/${taskId}`, payload),
  listShareLinks: (uuid) => request('GET', `/api/v1/client/meetings/${encodeURIComponent(uuid)}/share-links`),
  createShareLink: (uuid, expiresInDays = 30) => request('POST', `/api/v1/client/meetings/${encodeURIComponent(uuid)}/share-links`, { expires_in_days: expiresInDays }),
  revokeShareLink: (uuid, linkId) => request('DELETE', `/api/v1/client/meetings/${encodeURIComponent(uuid)}/share-links/${linkId}`),
  distributeMeeting: (uuid, payload) => request('POST', `/api/v1/client/meetings/${encodeURIComponent(uuid)}/distribute`, payload),

  // OAuth
  getZoomAuthUrl: (orgId) => `${API_BASE}/oauth/zoom/authorize?org_id=${orgId}`,
  getZoomConnectUrl: () => request('POST', '/api/v1/admin/zoom/authorize-url', {}),
  getYandexAuthUrl: (orgId) => `${API_BASE}/oauth/yandex/authorize?org_id=${orgId}`,
  getZoomStatus: (orgId) => request('GET', `/oauth/zoom/status?org_id=${orgId}`),
  getYandexStatus: (orgId) => request('GET', `/oauth/yandex/status?org_id=${orgId}`),
  disconnectZoom: (orgId) => request('POST', '/oauth/zoom/disconnect', { org_id: orgId }),
  disconnectYandex: (orgId) => request('POST', '/oauth/yandex/disconnect', { org_id: orgId }),

  // Organization admin
  getAdminSettings: () => request('GET', '/api/v1/admin/settings'),
  updateAdminSettings: (payload) => request('PUT', '/api/v1/admin/settings', payload),
  getAdminConnections: () => request('GET', '/api/v1/admin/connections'),
  testZoomAccount: (accountId) => request('POST', `/api/v1/admin/zoom-accounts/${accountId}/test`, {}),
  disconnectZoomAccount: (accountId) => request('DELETE', `/api/v1/admin/zoom-accounts/${accountId}`),
  testGoogleDrive: () => request('POST', '/api/v1/admin/connections/google-drive/test', {}),
  updateGoogleDriveFolder: (folderId) => request('PATCH', '/api/v1/admin/connections/google-drive', { folder_id: folderId }),

  // Platform admin (JWT + explicit platform-admin permission)
  getPlatformStatus: () => request('GET', '/api/v1/admin/platform-status'),
  getAdminOrganizations: () => request('GET', '/api/admin/organizations'),
};

export { api, ApiError, getToken, setToken, clearToken, getUser, setUser };
export default api;
