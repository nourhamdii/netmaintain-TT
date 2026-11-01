require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { init, db, toTicket } = require('./db');

const PORT = process.env.PORT || 4000;

const SERVICES = ['Fibre Optique', 'ADSL', 'Mobile', 'Ligne Fixe'];
const DELEGATIONS = [
  'Kairouan Ville', 'Kairouan Nord', 'Kairouan Sud', 'Sbikha', 'Oueslatia',
  'Bou Hajla', 'Haffouz', 'Chebika', 'Nasrallah', 'Hajeb El Ayoun', 'Echrarda', 'Alaâ',
];
const PRIORITIES = ['Basse', 'Moyenne', 'Haute'];
const ID_REGEX = /^TT-\d{4}-\d{3,}$/;

const hoursBetween = (a, b) => Math.max(1, Math.round((new Date(b) - new Date(a)) / 36e5));

const app = express();
app.use(cors());
app.use(express.json());

// Capture les erreurs des routes async
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const findTicket = async (id) => {
  const [rows] = await db().query('SELECT * FROM tickets WHERE id = ?', [id]);
  return rows[0] ? toTicket(rows[0]) : null;
};

// ---------- Méta ----------
app.get('/api/meta', (_req, res) => {
  res.json({ services: SERVICES, delegations: DELEGATIONS, priorities: PRIORITIES });
});

// ---------- Liste des tickets ----------
app.get('/api/tickets', wrap(async (req, res) => {
  const { status, q, limit } = req.query;
  const where = [];
  const params = [];

  if (status === 'en_cours' || status === 'resolu') {
    where.push('status = ?');
    params.push(status);
  }
  if (q && String(q).trim()) {
    where.push(`CONCAT_WS(' ', id, delegation, service, description, priority) LIKE ?`);
    params.push(`%${String(q).trim()}%`);
  }

  let sql = 'SELECT * FROM tickets';
  if (where.length) sql += ' WHERE ' + where.join(' AND ');
  sql += ' ORDER BY created_at DESC';
  if (limit && Number(limit) > 0) {
    sql += ' LIMIT ?';
    params.push(Math.min(Number(limit), 500));
  }

  const [rows] = await db().query(sql, params);
  res.json(rows.map(toTicket));
}));

// ---------- Créer un ticket ----------
app.post('/api/tickets', wrap(async (req, res) => {
  const { id, service, delegation, priority, description } = req.body || {};
  const ticketId = String(id || '').trim().toUpperCase();

  if (!ticketId) return res.status(400).json({ error: 'Le numéro de ticket est obligatoire.' });
  if (!ID_REGEX.test(ticketId))
    return res.status(400).json({ error: 'Format invalide. Utilisez TT-AAAA-NNN.' });
  if (!SERVICES.includes(service))
    return res.status(400).json({ error: 'Veuillez choisir un service impacté.' });
  if (!DELEGATIONS.includes(delegation))
    return res.status(400).json({ error: 'Veuillez choisir une délégation.' });
  if (!PRIORITIES.includes(priority))
    return res.status(400).json({ error: 'Priorité invalide.' });
  if (!description || String(description).trim().length < 5)
    return res.status(400).json({ error: 'Décrivez la panne (5 caractères minimum).' });

  try {
    await db().query(
      `INSERT INTO tickets (id, service, delegation, priority, description, status, created_at)
       VALUES (?, ?, ?, ?, ?, 'en_cours', ?)`,
      [ticketId, service, delegation, priority, String(description).trim(), new Date()]
    );
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ error: `Le ticket ${ticketId} existe déjà.` });
    throw err;
  }
  res.status(201).json(await findTicket(ticketId));
}));

// ---------- Résoudre / Rouvrir ----------
app.patch('/api/tickets/:id/resolve', wrap(async (req, res) => {
  const [r] = await db().query(
    `UPDATE tickets SET status = 'resolu', resolved_at = ? WHERE id = ?`,
    [new Date(), req.params.id]
  );
  if (!r.affectedRows) return res.status(404).json({ error: 'Ticket introuvable.' });
  res.json(await findTicket(req.params.id));
}));

app.patch('/api/tickets/:id/reopen', wrap(async (req, res) => {
  const [r] = await db().query(
    `UPDATE tickets SET status = 'en_cours', resolved_at = NULL WHERE id = ?`,
    [req.params.id]
  );
  if (!r.affectedRows) return res.status(404).json({ error: 'Ticket introuvable.' });
  res.json(await findTicket(req.params.id));
}));

// ---------- Statistiques ----------
app.get('/api/stats', wrap(async (_req, res) => {
  const [[t]] = await db().query(`
    SELECT
      COUNT(*)                                              AS total,
      COALESCE(SUM(status = 'en_cours'), 0)                 AS enCours,
      COALESCE(SUM(status = 'resolu'), 0)                   AS resolus,
      COALESCE(SUM(priority = 'Haute'), 0)                  AS prioriteHaute,
      COALESCE(SUM(priority = 'Haute' AND status = 'en_cours'), 0) AS prioriteHauteOuverts
    FROM tickets
  `);
  const [rows] = await db().query('SELECT service, COUNT(*) AS count FROM tickets GROUP BY service');

  const total = Number(t.total);
  const resolus = Number(t.resolus);
  res.json({
    total,
    enCours: Number(t.enCours),
    resolus,
    prioriteHaute: Number(t.prioriteHaute),
    prioriteHauteOuverts: Number(t.prioriteHauteOuverts),
    tauxResolution: total ? Math.round((resolus / total) * 100) : 0,
    parService: SERVICES.map((s) => ({
      service: s,
      count: Number(rows.find((r) => r.service === s)?.count || 0),
    })),
  });
}));

// ---------- Historique ----------
app.get('/api/history', wrap(async (_req, res) => {
  const [rows] = await db().query(
    `SELECT * FROM tickets WHERE status = 'resolu' ORDER BY resolved_at DESC`
  );
  res.json(
    rows.map(toTicket).map((t) => ({ ...t, durationHours: hoursBetween(t.createdAt, t.resolvedAt) }))
  );
}));

app.get('/api/health', wrap(async (_req, res) => {
  await db().query('SELECT 1');
  res.json({ ok: true, database: 'mysql' });
}));

// ---------- Frontend compilé (production) ----------
const dist = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^\/(?!api).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

// ---------- Gestion d'erreurs ----------
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Erreur serveur.' });
});

init()
  .then(() => app.listen(PORT, () => console.log(`NetMaintain API prête sur http://localhost:${PORT} (MySQL)`)))
  .catch((err) => {
    console.error('\n✖ Connexion MySQL impossible :', err.code || err.message);
    console.error('  Vérifiez que MySQL est démarré et que backend/.env (DB_USER / DB_PASSWORD) est correct.\n');
    process.exit(1);
  });
