const BASE_URL = 'https://nearbytraveler.org';
let sessionCookie = null;
const getHeaders = () => { const h = { 'Content-Type': 'application/json', 'Accept': 'application/json' }; if (sessionCookie) h['Cookie'] = sessionCookie; return h; };
const extractCookie = (r) => { const s = r.headers.get('set-cookie'); if (s) sessionCookie = s.split(';')[0]; };
const api = {
  async login(email, password) { const r = await fetch(`${BASE_URL}/api/auth/login`, { method: 'POST', headers: getHeaders(), credentials: 'include', body: JSON.stringify({ email, password }) }); extractCookie(r); const d = await r.json(); if (!r.ok) throw new Error(d.message || 'Login failed'); return d; },
  async getUser() { const r = await fetch(`${BASE_URL}/api/auth/user`, { headers: getHeaders(), credentials: 'include' }); if (!r.ok) return null; return r.json(); },
  async logout() { await fetch(`${BASE_URL}/api/auth/logout`, { method: 'POST', headers: getHeaders(), credentials: 'include' }); sessionCookie = null; },
  async register(userData) { const r = await fetch(`${BASE_URL}/api/register`, { method: 'POST', headers: getHeaders(), credentials: 'include', body: JSON.stringify(userData) }); extractCookie(r); const d = await r.json(); if (!r.ok) throw new Error(d.message || 'Registration failed'); return d; },
  async getEvents(city = 'Los Angeles') { const r = await fetch(`${BASE_URL}/api/events?city=${encodeURIComponent(city)}`, { headers: getHeaders(), credentials: 'include' }); if (!r.ok) return []; return r.json(); },
  async getEvent(id) { const r = await fetch(`${BASE_URL}/api/events/${id}`, { headers: getHeaders(), credentials: 'include' }); if (!r.ok) return null; return r.json(); },
  async joinEvent(eventId) { const r = await fetch(`${BASE_URL}/api/events/${eventId}/join`, { method: 'POST', headers: getHeaders(), credentials: 'include' }); return r.json(); },
  async getUsersByLocation(city, userType = 'all') { const r = await fetch(`${BASE_URL}/api/users-by-location/${encodeURIComponent(city)}/${userType}`, { headers: getHeaders(), credentials: 'include' }); if (!r.ok) return []; return r.json(); },
  async getUserProfile(userId) { const r = await fetch(`${BASE_URL}/api/users/${userId}`, { headers: getHeaders(), credentials: 'include' }); if (!r.ok) return null; return r.json(); },
  async updateProfile(userId, updates) { const r = await fetch(`${BASE_URL}/api/users/${userId}`, { method: 'PUT', headers: getHeaders(), credentials: 'include', body: JSON.stringify(updates) }); return r.json(); },
  async getConnections(userId) { const r = await fetch(`${BASE_URL}/api/connections/${userId}`, { headers: getHeaders(), credentials: 'include' }); if (!r.ok) return []; return r.json(); },
  async sendConnection(targetUserId) { const r = await fetch(`${BASE_URL}/api/connections`, { method: 'POST', headers: getHeaders(), credentials: 'include', body: JSON.stringify({ targetUserId }) }); return r.json(); },
  async getConversations(userId) { const r = await fetch(`${BASE_URL}/api/conversations/${userId}`, { headers: getHeaders(), credentials: 'include' }); if (!r.ok) return []; return r.json(); },
  async getMessages(userId) { const r = await fetch(`${BASE_URL}/api/messages/${userId}`, { headers: getHeaders(), credentials: 'include' }); if (!r.ok) return []; return r.json(); },
  async sendMessage(receiverId, content) { const r = await fetch(`${BASE_URL}/api/messages`, { method: 'POST', headers: getHeaders(), credentials: 'include', body: JSON.stringify({ receiverId, content }) }); return r.json(); },
  async getNotifications(userId) { const r = await fetch(`${BASE_URL}/api/notifications/${userId}`, { headers: getHeaders(), credentials: 'include' }); if (!r.ok) return []; return r.json(); },
};
export default api;
