import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, SquarePen, ListChecks, History, Radio, Search, Plus, Bell,
} from 'lucide-react';

const NAV = [
  { to: '/', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
  { to: '/signaler', label: 'Signaler une panne', icon: SquarePen },
  { to: '/tickets', label: 'Tickets', icon: ListChecks },
  { to: '/historique', label: 'Historique', icon: History },
];

const TITLES = {
  '/': 'Tableau de bord',
  '/signaler': 'Signaler une panne',
  '/tickets': 'Tickets',
  '/historique': 'Historique',
};

export default function Layout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [q, setQ] = useState('');

  const onSearch = (e) => {
    e.preventDefault();
    navigate(q.trim() ? `/tickets?q=${encodeURIComponent(q.trim())}` : '/tickets');
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo"><Radio size={22} /></div>
          <div>
            <div className="brand-name">NetMaintain</div>
            <div className="brand-sub">Tunisie Telecom · Kairouan</div>
          </div>
        </div>

        <div className="menu-label">MENU</div>
        <nav className="nav">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
              <Icon size={20} />
              <span>{label}</span>
              <i className="dot" />
            </NavLink>
          ))}
        </nav>

        <div className="side-card">
          <strong>Direction Régionale</strong>
          <p>Supervision centralisée des incidents réseau du gouvernorat de Kairouan.</p>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <h1>{TITLES[pathname] || 'NetMaintain'}</h1>
          <div className="top-actions">
            <form className="search" onSubmit={onSearch}>
              <Search size={18} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un ticket…" />
            </form>
            <button className="btn btn-primary" onClick={() => navigate('/signaler')}>
              <Plus size={18} /> Nouveau ticket
            </button>
            <button className="icon-btn" aria-label="Notifications">
              <Bell size={18} />
              <span className="notif" />
            </button>
            <div className="avatar">TK</div>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
