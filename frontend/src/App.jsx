import { Route, Routes } from 'react-router-dom';
import MainLayout from './layouts/MainLayout.jsx';
import HomePage from './pages/HomePage';
import RoleSelectionPage from './pages/RoleSelectionPage';
import CaregiverSignupPage from './pages/CaregiverSignupPage';
import ParentSignupPage from './pages/ParentSignupPage';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import MessagesOverviewPage from './pages/MessagesOverviewPage';
import MessengerPage from './pages/MessengerPage';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import CaregiverDetailPage from './pages/CaregiverDetailPage';
import ContactPage from './pages/ContactPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import ImprintPage from './pages/ImprintPage';

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="anmelden" element={<RoleSelectionPage />} />
        <Route path="anmelden/tagespflegeperson" element={<CaregiverSignupPage />} />
        <Route path="anmelden/eltern" element={<ParentSignupPage />} />
        <Route path="familienzentrum" element={<DashboardPage />} />
        <Route path="kindertagespflege/:id" element={<CaregiverDetailPage />} />
        <Route path="kontakt" element={<ContactPage />} />
        <Route path="datenschutz" element={<PrivacyPolicyPage />} />
        <Route path="impressum" element={<ImprintPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route
          path="profil"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="nachrichten"
          element={
            <ProtectedRoute>
              <MessagesOverviewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="nachrichten/:targetId"
          element={
            <ProtectedRoute>
              <MessengerPage />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}

export default App;
