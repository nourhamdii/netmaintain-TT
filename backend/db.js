require('dotenv').config();
const mysql = require('mysql2/promise');
const seed = require('./seed');

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
};
const DB_NAME = process.env.DB_NAME || 'netmaintain';

if (!/^\w+$/.test(DB_NAME)) throw new Error('DB_NAME invalide');

let pool;

// Crée la base + la table si besoin, puis insère les données de démo
async function init() {
  const conn = await mysql.createConnection(config);
  await conn.query(
    `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await conn.end();

  pool = mysql.createPool({
    ...config,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    timezone: 'Z', // les DATETIME sont lus/écrits en UTC
  });

  await pool.query(`
    CREATE TABLE IF NOT EXISTS tickets (
      id          VARCHAR(20)  NOT NULL PRIMARY KEY,
      service     ENUM('Fibre Optique','ADSL','Mobile','Ligne Fixe') NOT NULL,
      delegation  VARCHAR(60)  NOT NULL,
      priority    ENUM('Basse','Moyenne','Haute') NOT NULL DEFAULT 'Moyenne',
      description TEXT         NOT NULL,
      status      ENUM('en_cours','resolu') NOT NULL DEFAULT 'en_cours',
      created_at  DATETIME     NOT NULL,
      resolved_at DATETIME     NULL,
      INDEX idx_status (status),
      INDEX idx_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  const [[{ n }]] = await pool.query('SELECT COUNT(*) AS n FROM tickets');
  if (n === 0 && process.env.SEED_DEMO !== 'false') {
    for (const t of seed) {
      await pool.query(
        `INSERT INTO tickets (id, service, delegation, priority, description, status, created_at, resolved_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          t.id, t.service, t.delegation, t.priority, t.description, t.status,
          new Date(t.createdAt), t.resolvedAt ? new Date(t.resolvedAt) : null,
        ]
      );
    }
    console.log(`Base initialisée avec ${seed.length} tickets de démonstration.`);
  }
  return pool;
}

// Ligne SQL -> objet attendu par le frontend
function toTicket(r) {
  return {
    id: r.id,
    service: r.service,
    delegation: r.delegation,
    priority: r.priority,
    description: r.description,
    status: r.status,
    createdAt: new Date(r.created_at).toISOString(),
    resolvedAt: r.resolved_at ? new Date(r.resolved_at).toISOString() : null,
  };
}

const db = () => pool;

module.exports = { init, db, toTicket };
