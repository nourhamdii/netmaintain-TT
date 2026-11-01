import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Ticket, TriangleAlert, CircleCheck, Flame, ArrowRight } from 'lucide-react';
import { api } from '../api.js';
import Hero from '../components/Hero.jsx';
import TicketCard from '../components/TicketCard.jsx';
import { SERVICE_META } from '../utils.js';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);

  const load = useCallback(async () => {
    const [s, t] = await Promise.all([api.stats(), api.tickets({ status: 'en_cours', limit: 3 })]);
    setStats(s);
    setRecent(t);
  }, []);

  useEffect(() => { load(); }, [load]);

  const resolve = async (id) => { await api.resolve(id); load(); };

  const cards = stats && [
    { label: 'Total tickets', value: stats.total, hint: 'Depuis la mise en service', icon: Ticket, bg: '#e3effd', color: '#0b4db3' },
    { label: 'En cours', value: stats.enCours, hint: 'Interventions actives', icon: TriangleAlert, bg: '#fdeedd', color: '#c2570c' },
    { label: 'Résolus', value: stats.resolus, hint: `${stats.tauxResolution}% de taux de résolution`, icon: CircleCheck, bg: '#dcf5e7', color: '#15803d' },
    { label: 'Priorité haute', value: stats.prioriteHaute, hint: 'Ouverts et critiques', icon: Flame, bg: '#fde4e7', color: '#dc2626' },
  ];

  const max = stats ? Math.max(1, ...stats.parService.map((s) => s.count)) : 1;

  return (
    <>
      <Hero
        image="dashboard.jpg"
        badge="Direction Régionale · Kairouan"
        title={<>Supervisez le réseau<br />en temps réel</>}
        text="Centralisez les signalements de pannes Fibre, ADSL, Mobile et Ligne fixe, et suivez chaque intervention jusqu'à sa résolution."
        tall
      >
        <button className="btn btn-cyan" onClick={() => navigate('/signaler')}><Plus size={18} /> Signaler une panne</button>
        <button className="btn btn-ghost" onClick={() => navigate('/tickets')}>Voir les tickets</button>
      </Hero>

      <div className="stats">
        {cards?.map(({ label, value, hint, icon: Icon, bg, color }) => (
          <div className="stat" key={label}>
            <div className="stat-top">
              <span>{label}</span>
              <div className="stat-icon" style={{ background: bg, color }}><Icon size={20} /></div>
            </div>
            <div className="stat-value">{value}</div>
            <div className="stat-hint">{hint}</div>
          </div>
        ))}
      </div>

      <div className="split">
        <section>
          <div className="section-head">
            <div>
              <h3>Interventions en cours</h3>
              <p>Les incidents les plus récents à traiter</p>
            </div>
            <Link to="/tickets" className="link">Tout voir <ArrowRight size={16} /></Link>
          </div>
          <div className="list">
            {recent.map((t) => <TicketCard key={t.id} ticket={t} onResolve={resolve} />)}
            {stats && !recent.length && <div className="empty">Aucune intervention en cours 🎉</div>}
          </div>
        </section>

        <aside className="card">
          <h3>Pannes par service</h3>
          <p className="muted">Répartition des incidents signalés</p>
          <div className="bars">
            {stats?.parService.map(({ service, count }) => (
              <div className="bar-row" key={service}>
                <div className="bar-label"><span>{service}</span><b>{count}</b></div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${(count / max) * 100}%`, background: SERVICE_META[service].color }} />
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </>
  );
}
