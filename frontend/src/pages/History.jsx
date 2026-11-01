import { useEffect, useState, useCallback } from 'react';
import { CircleCheck, Timer, RotateCcw } from 'lucide-react';
import { api } from '../api.js';
import Hero from '../components/Hero.jsx';
import { SERVICE_META, formatDate } from '../utils.js';

export default function History() {
  const [items, setItems] = useState([]);
  const load = useCallback(async () => setItems(await api.history()), []);
  useEffect(() => { load(); }, [load]);

  const reopen = async (id) => { await api.reopen(id); load(); };

  return (
    <>
      <Hero image="historique.jpg" badge="Archives" title="Historique des résolutions"
        text="Retrouvez toutes les pannes clôturées et le délai de rétablissement du service." />

      <div className="timeline">
        {items.map((t) => {
          const { icon: Icon, bg, color } = SERVICE_META[t.service];
          return (
            <div className="tl-row" key={t.id}>
              <CircleCheck className="tl-dot" size={26} />
              <article className="ticket">
                <div className="ticket-icon" style={{ background: bg, color }}><Icon size={22} /></div>
                <div className="ticket-body">
                  <div className="ticket-head"><code>{t.id}</code></div>
                  <p className="ticket-desc">{t.description}</p>
                  <div className="ticket-meta plain">
                    {t.service} · {t.delegation} · Résolu le {formatDate(t.resolvedAt)}
                  </div>
                </div>
                <div className="ticket-actions">
                  <span className="pill pill-time"><Timer size={15} /> {t.durationHours}h</span>
                  <button className="btn btn-outline" onClick={() => reopen(t.id)}><RotateCcw size={16} /> Rouvrir</button>
                </div>
              </article>
            </div>
          );
        })}
        {!items.length && <div className="empty">Aucune panne résolue pour le moment.</div>}
      </div>
    </>
  );
}
