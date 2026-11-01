import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { api } from '../api.js';
import Hero from '../components/Hero.jsx';
import TicketCard from '../components/TicketCard.jsx';

const TABS = [
  { key: 'all', label: 'Tous' },
  { key: 'en_cours', label: 'En cours' },
  { key: 'resolu', label: 'Résolus' },
];

export default function Tickets() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const [tab, setTab] = useState('all');
  const [tickets, setTickets] = useState([]);

  const load = useCallback(async () => {
    setTickets(await api.tickets({ status: tab, q }));
  }, [tab, q]);

  useEffect(() => { load(); }, [load]);

  const resolve = async (id) => { await api.resolve(id); load(); };
  const reopen = async (id) => { await api.reopen(id); load(); };

  return (
    <>
      <Hero image="tickets.jpg" badge="Suivi des interventions" title="Liste des tickets"
        text="Filtrez, recherchez et clôturez les incidents en un clic." />

      <div className="toolbar">
        <div className="tabs">
          {TABS.map((t) => (
            <button key={t.key} className={tab === t.key ? 'on' : ''} onClick={() => setTab(t.key)}>{t.label}</button>
          ))}
        </div>
        <div className="search wide">
          <Search size={18} />
          <input
            value={q}
            onChange={(e) => setParams(e.target.value ? { q: e.target.value } : {})}
            placeholder="Référence, délégation, mot-clé…"
          />
        </div>
      </div>

      <p className="count">{tickets.length} ticket{tickets.length > 1 ? 's' : ''}</p>
      <div className="list">
        {tickets.map((t) => <TicketCard key={t.id} ticket={t} onResolve={resolve} onReopen={reopen} />)}
        {!tickets.length && <div className="empty">Aucun ticket ne correspond à votre recherche.</div>}
      </div>
    </>
  );
}
