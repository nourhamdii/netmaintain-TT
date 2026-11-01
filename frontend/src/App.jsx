import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import NewTicket from './pages/NewTicket.jsx';
import Tickets from './pages/Tickets.jsx';
import History from './pages/History.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/signaler" element={<NewTicket />} />
        <Route path="/tickets" element={<Tickets />} />
        <Route path="/historique" element={<History />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
