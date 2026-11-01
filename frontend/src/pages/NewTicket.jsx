import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CircleAlert, ShieldCheck, Send } from 'lucide-react';
import { api } from '../api.js';
import { nextTicketId } from '../utils.js';

export default function NewTicket() {
  const navigate = useNavigate();
  const [meta, setMeta] = useState({ services: [], delegations: [], priorities: [] });
  const [form, setForm] = useState({
    id: '', service: '', delegation: 'Kairouan Ville', priority: 'Moyenne', description: '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const [m, tickets] = await Promise.all([api.meta(), api.tickets()]);
      setMeta(m);
      setForm((f) => ({ ...f, id: nextTicketId(tickets) }));
    })();
  }, []);

  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setError(''); };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.createTicket(form);
      navigate('/tickets');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="form-layout">
      <form className="card form-card" onSubmit={submit}>
        <h2>Nouveau signalement</h2>
        <p className="muted">Renseignez les informations de l'incident pour créer un ticket d'intervention.</p>

        {error && <div className="alert"><CircleAlert size={18} /> {error}</div>}

        <div className="grid2">
          <label className="field">
            <span>Numéro de ticket</span>
            <input className="mono" value={form.id} onChange={(e) => set('id', e.target.value)} placeholder="TT-2026-106" />
          </label>
          <label className="field">
            <span>Service impacté</span>
            <select value={form.service} onChange={(e) => set('service', e.target.value)}>
              <option value="">Choisir un service</option>
              {meta.services.map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Délégation</span>
            <select value={form.delegation} onChange={(e) => set('delegation', e.target.value)}>
              {meta.delegations.map((d) => <option key={d}>{d}</option>)}
            </select>
          </label>
          <div className="field">
            <span>Priorité</span>
            <div className="seg">
              {meta.priorities.map((p) => (
                <button type="button" key={p} className={form.priority === p ? 'on' : ''} onClick={() => set('priority', p)}>{p}</button>
              ))}
            </div>
          </div>
        </div>

        <label className="field">
          <span>Description de la panne</span>
          <textarea rows={6} value={form.description} onChange={(e) => set('description', e.target.value)} />
        </label>

        <button className="btn btn-primary btn-lg" disabled={busy}>
          <Send size={18} /> Enregistrer le ticket
        </button>
      </form>

      <div className="side-col">
        <div className="photo" style={{ '--hero-img': 'url(/images/technicien.jpg)' }} />
        <div className="card tips">
          <h4><ShieldCheck size={18} /> Bonnes pratiques</h4>
          <p>Utilisez le format de référence TT-AAAA-NNN.</p>
          <p>Indiquez la zone géographique précise.</p>
          <p>Précisez le nombre d'abonnés impactés si connu.</p>
        </div>
      </div>
    </div>
  );
}
