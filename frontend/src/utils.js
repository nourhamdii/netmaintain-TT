import { Cable, Wifi, Radio, Phone } from 'lucide-react';

export const SERVICE_META = {
  'Fibre Optique': { icon: Cable, bg: '#e3effd', color: '#0b4db3' },
  ADSL: { icon: Wifi, bg: '#d9f6fb', color: '#0891b2' },
  Mobile: { icon: Radio, bg: '#ece6fd', color: '#7c3aed' },
  'Ligne Fixe': { icon: Phone, bg: '#fdeedd', color: '#c2570c' },
};

const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

// "10 oct., 12:26 PM"
export function formatDate(iso) {
  const d = new Date(iso);
  let h = d.getHours();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  const hh = String(h).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]}, ${hh}:${mm} ${ampm}`;
}

export const nextTicketId = (tickets) => {
  const year = new Date().getFullYear();
  const nums = tickets
    .map((t) => /^TT-(\d{4})-(\d+)$/.exec(t.id))
    .filter((m) => m && Number(m[1]) === year)
    .map((m) => Number(m[2]));
  const next = nums.length ? Math.max(...nums) + 1 : 101;
  return `TT-${year}-${String(next).padStart(3, '0')}`;
};
