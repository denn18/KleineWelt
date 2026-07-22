import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

function VerificationBlock() {
  return (
    <section className="mx-auto max-w-2xl rounded-3xl bg-white/90 p-8 text-center shadow-xl">
      <h1 className="text-2xl font-semibold text-brand-700">Deine Pflegeerlaubnis wird noch geprüft</h1>
      <p className="mt-3 text-slate-600">Nach der Freigabe kannst du Wimmel Welt vollständig nutzen.</p>
    </section>
  );
}

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (location.pathname !== '/profil' && user.role === 'caregiver' && ['pending', 'rejected'].includes(user.verificationStatus)) {
    return <VerificationBlock />;
  }

  return children;
}

export default ProtectedRoute;
