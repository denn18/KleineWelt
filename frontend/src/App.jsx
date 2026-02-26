import { Route, Routes } from 'react-router-dom';
import MainLayout from './layouts/MainLayout.jsx';
import HomePage from './pages/HomePage/index.jsx';
import RoleSelectionPage from './pages/RoleSelectionPage/index.jsx';
import CaregiverSignupPage from './pages/CaregiverSignupPage/index.jsx';
import ParentSignupPage from './pages/ParentSignupPage/index.jsx';
import DashboardPage from './pages/DashboardPage/index.jsx';
import LoginPage from './pages/LoginPage/index.jsx';
import ProfilePage from './pages/ProfilePage/index.jsx';
import MessagesOverviewPage from './pages/MessagesOverviewPage/index.jsx';
import MessengerPage from './pages/MessengerPage/index.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import CaregiverDetailPage from './pages/CaregiverDetailPage/index.jsx';
import ContactPage from './pages/ContactPage/index.jsx';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage/index.jsx';
import ImprintPage from './pages/ImprintPage/index.jsx';
import Kindertagespflegegruppe from './pages/Kindertagespflegegruppe.jsx';
import BetreuungsgruppeErstellenPage from './pages/BetreuungsgruppeErstellen/index.jsx';
import BetreuungsgruppeChatPage from './pages/BetreuungsgruppeChat/index.jsx';

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
          path="betreuungsgruppe"
          element={
            <ProtectedRoute>
              <Kindertagespflegegruppe />
            </ProtectedRoute>
          }
        />
        <Route
          path="betreuungsgruppe/erstellen"
          element={
            <ProtectedRoute>
              <BetreuungsgruppeErstellenPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="betreuungsgruppe/chat"
          element={
            <ProtectedRoute>
              <BetreuungsgruppeChatPage />
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
