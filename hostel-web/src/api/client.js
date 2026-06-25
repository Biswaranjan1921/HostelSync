const API = '/api';

function getErrorMessage(err) {
  const b = err.body;
  if (b && typeof b === 'object' && b.message) return b.message;
  if (b && typeof b === 'string' && b.length < 300) return b;
  if (err.status === 404) return 'Not found.';
  if (err.status === 401) return 'Session expired. Please log in again.';
  if (err.status === 403) return 'You are not authorized to perform this action.';
  if (err.status >= 500) return 'Server error. Please try again.';
  if (err.status === 0 || err.message === 'Failed to fetch') return 'Cannot reach server. Is the backend running?';
  return err.message || 'Request failed';
}

async function request(path, options = {}) {
  const url = path.startsWith('http') ? path : `${API}${path}`;
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('auth-expired'));
    }
    const err = new Error(res.statusText || 'Request failed');
    err.status = res.status;
    try {
      err.body = await res.json();
    } catch {
      try {
        err.body = await res.text();
      } catch {
        err.body = '';
      }
    }
    err.message = getErrorMessage(err);
    throw err;
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  auth: {
    login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    logout: () => request('/auth/logout', { method: 'POST' }).finally(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }),
    me: () => request('/auth/me'),
    listUsers: () => request('/auth/users'),
    createUser: (body) => request('/auth/users', { method: 'POST', body: JSON.stringify(body) }),
    deleteUser: (id) => request(`/auth/users/${id}`, { method: 'DELETE' }),
  },
  dashboard: {
    stats: () => request('/dashboard/stats'),
    studentStats: () => request('/dashboard/student-stats'),
    aiAnalytics: () => request('/dashboard/ai-analytics'),
  },
  students: {
    list: () => request('/students'),
    get: (id) => request(`/students/${id}`),
    getQr: (id) => request(`/students/${id}/qr`),
    create: (body) => request('/students', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => request(`/students/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id) => request(`/students/${id}`, { method: 'DELETE' }),
    passToSuper: (id, body) => request(`/students/${id}/pass-to-super`, { method: 'PUT', body: JSON.stringify(body) }),
    finalizeAllocation: (id, body) => request(`/students/${id}/finalize-allocation`, { method: 'PUT', body: JSON.stringify(body) }),
    submitProfile: (id, body) => request(`/students/${id}/submit-profile`, { method: 'PUT', body: JSON.stringify(body) }),
    verifyProfile: (id) => request(`/students/${id}/verify-profile`, { method: 'PUT' }),
    reject: (id) => request(`/students/${id}/reject`, { method: 'PUT' }),
  },
  rooms: {
    list: () => request('/rooms'),
    get: (id) => request(`/rooms/${id}`),
    create: (body) => request('/rooms', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => request(`/rooms/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id) => request(`/rooms/${id}`, { method: 'DELETE' }),
    overrideCapacity: (id, capacity) => request(`/rooms/${id}/override-capacity`, { method: 'PUT', body: JSON.stringify({ capacity }) }),
    auditLogs: () => request('/rooms/audit-logs'),
  },
  mealVerification: {
    verify: (body) => request('/meal-verification/verify', { method: 'POST', body: JSON.stringify(body) }),
    recent: (limit = 20) => request(`/meal-verification/recent?limit=${limit}`),
    byStudent: (studentId, limit = 30) => request(`/meal-verification/student/${studentId}?limit=${limit}`),
  },
  leaves: {
    list: () => request('/leaves'),
    create: (body) => request('/leaves', { method: 'POST', body: JSON.stringify(body) }),
    updateStatus: (id, status) => request(`/leaves/${id}/status?status=${status}`, { method: 'PUT' }),
  },
  complaints: {
    list: () => request('/complaints'),
    create: (body) => request('/complaints', { method: 'POST', body: JSON.stringify(body) }),
    updateStatus: (id, status) => request(`/complaints/${id}/status?status=${status}`, { method: 'PUT' }),
  },
  notices: {
    list: () => request('/notices'),
    create: (body) => request('/notices', { method: 'POST', body: JSON.stringify(body) }),
    delete: (id) => request(`/notices/${id}`, { method: 'DELETE' }),
  },
  hostels: {
    list: () => request('/hostels'),
    create: (body) => request('/hostels', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => request(`/hostels/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id) => request(`/hostels/${id}`, { method: 'DELETE' }),
  },
  payments: {
    list: () => request('/payments'),
    create: (body) => request('/payments', { method: 'POST', body: JSON.stringify(body) }),
    pay: (id) => request(`/payments/${id}/pay`, { method: 'POST' }),
    verify: (id) => request(`/payments/${id}/verify`, { method: 'PUT' }),
  },
  mess: {
    getMenu: () => request('/mess/menu'),
    updateMenu: (body) => request('/mess/menu', { method: 'PUT', body: JSON.stringify(body) }),
    listFeedback: () => request('/mess/feedback'),
    submitFeedback: (body) => request('/mess/feedback', { method: 'POST', body: JSON.stringify(body) }),
  },
  visitors: {
    list: () => request('/visitors'),
    create: (body) => request('/visitors', { method: 'POST', body: JSON.stringify(body) }),
    updateStatus: (id, status) => request(`/visitors/${id}/status?status=${status}`, { method: 'PUT' }),
  },
  staff: {
    list: () => request('/staff'),
    create: (body) => request('/staff', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => request(`/staff/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id) => request(`/staff/${id}`, { method: 'DELETE' }),
  },
  attendance: {
    record: (body) => request('/attendance/record', { method: 'POST', body: JSON.stringify(body) }),
    recent: () => request('/attendance/recent'),
  },
  support: {
    list: () => request('/support-tickets'),
    create: (body) => request('/support-tickets', { method: 'POST', body: JSON.stringify(body) }),
    reply: (id, reply) => request(`/support-tickets/${id}/reply`, { method: 'PUT', body: JSON.stringify({ reply }) }),
  },
  parentAlerts: {
    list: () => request('/parent-alerts'),
    send: (body) => request('/parent-alerts', { method: 'POST', body: JSON.stringify(body) }),
  },
  settings: {
    list: () => request('/settings'),
    get: (key) => request(`/settings/${key}`),
    update: (key, value) => request(`/settings/${key}`, { method: 'PUT', body: JSON.stringify({ value }) }),
  },
};
