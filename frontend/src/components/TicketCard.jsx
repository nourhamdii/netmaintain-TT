import { MapPin, Clock, CheckCircle2, RotateCcw } from 'lucide-react';
import { SERVICE_META, formatDate } from '../utils.js';

export default function TicketCard({ ticket, onResolve, onReopen }) {
  const meta = SERVICE_META[ticket.service];
  const Icon = meta.icon;
  const open = ticket.status === 'en_cours';

  return (
    <article className="ticket">
      <div className="ticket-icon" style={{ background: meta.bg, color: meta.color }}>
        <Icon size={22} />
      </div>
      <div className="ticket-body">
        <div className="ticket-head">
          <code>{ticket.id}</code>
          <span className={'prio prio-' + ticket.priority.toLowerCase()}>{ticket.priority.toUpperCase()}</span>
        </div>
        <p className="ticket-desc">{ticket.description}</p>
        <div className="ticket-meta">
          <span>{ticket.service}</span>
          <span><MapPin size={15} /> {ticket.delegation}</span>
          <span><Clock size={15} /> {formatDate(ticket.createdAt)}</span>
        </div>
      </div>
      <div className="ticket-actions">
        {open ? (
          <>
            <span className="pill pill-warn"><i /> En cours</span>
            {onResolve && (
              <button className="btn btn-green" onClick={() => onResolve(ticket.id)}>
                <CheckCircle2 size={17} /> Marquer Résolu
              </button>
            )}
          </>
        ) : (
          <>
            <span className="pill pill-ok"><i /> Résolu</span>
            {onReopen && (
              <button className="btn btn-outline" onClick={() => onReopen(ticket.id)}>
                <RotateCcw size={16} /> Rouvrir
              </button>
            )}
          </>
        )}
      </div>
    </article>
  );
}
