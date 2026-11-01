async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Erreur serveur');
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  meta: () => request('/api/meta'),
  stats: () => request('/api/stats'),
  tickets: ({ status, q, limit } = {}) => {
    const p = new URLSearchParams();
    if (status && status !== 'all') p.set('status', status);
    if (q) p.set('q', q);
    if (limit) p.set('limit', limit);
    return request(`/api/tickets?${p.toString()}`);
  },
  createTicket: (body) =>
    request('/api/tickets', { method: 'POST', body: JSON.stringify(body) }),
  resolve: (id) => request(`/api/tickets/${id}/resolve`, { method: 'PATCH' }),
  reopen: (id) => request(`/api/tickets/${id}/reopen`, { method: 'PATCH' }),
  history: () => request('/api/history'),
};
