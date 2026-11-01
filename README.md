# NetMaintain – Tunisie Telecom · Kairouan

Application de suivi des pannes réseau (Fibre, ADSL, Mobile, Ligne fixe).
- `backend/` : API Node.js + Express + **MySQL** (base et table créées automatiquement, 5 tickets d'exemple au premier lancement)
- `frontend/` : React + Vite

## Prérequis MySQL
1. Installer MySQL Server (ou XAMPP/WAMP) et le démarrer.
2. Dans `backend/`, copier `.env.example` en `.env` et renseigner `DB_USER` / `DB_PASSWORD`.

## Lancer en développement (2 terminaux)

```bash
# Terminal 1
cd backend
npm install
npm start          # http://localhost:4000

# Terminal 2
cd frontend
npm install
npm run dev        # http://localhost:5173  (proxy /api -> :4000)
```

## Production (un seul serveur)

```bash
cd frontend && npm install && npm run build
cd ../backend && npm install && npm start   # sert aussi le frontend sur :4000
```

## API

| Méthode | Route | Description |
|---|---|---|
| GET | `/api/meta` | services, délégations, priorités |
| GET | `/api/stats` | chiffres du tableau de bord |
| GET | `/api/tickets?status=en_cours\|resolu&q=&limit=` | liste / recherche |
| POST | `/api/tickets` | créer (409 « Le ticket TT-… existe déjà. » si doublon) |
| PATCH | `/api/tickets/:id/resolve` | marquer résolu |
| PATCH | `/api/tickets/:id/reopen` | rouvrir |
| GET | `/api/history` | tickets résolus + durée de rétablissement |

## Images
Voir `frontend/public/images/LISEZMOI.txt`.
