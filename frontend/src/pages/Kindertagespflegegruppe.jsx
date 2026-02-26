import { Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { isGroupMember, readCareGroup } from '../utils/careGroupStorage.js';

function Kindertagespflegegruppe() {
  const { user } = useAuth();
  const group = readCareGroup();

  if (!user) {
    return null;
  }

  if (user.role === 'caregiver') {
    const caregiverHasGroup = group?.caregiverId === user.id;
    return <Navigate to={caregiverHasGroup ? '/betreuungsgruppe/chat' : '/betreuungsgruppe/erstellen'} replace />;
  }

  if (isGroupMember(group, user.id)) {
    return <Navigate to="/betreuungsgruppe/chat" replace />;
  }

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-4 rounded-3xl bg-white/90 p-6 shadow-lg sm:p-8">
      <h1 className="text-2xl font-semibold text-brand-700">Betreuungsgruppe</h1>
      <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
        Du wurdest aktuell noch keiner Betreuungsgruppe zugeordnet.
      </p>
    </section>
  );
}

export default Kindertagespflegegruppe;
