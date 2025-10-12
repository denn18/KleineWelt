import { Route, Routes } from 'react-router-dom';
import MainLayout from './layouts/MainLayout.jsx';
import HomePage from './pages/HomePage.jsx';
import RoleSelectionPage from './pages/RoleSelectionPage.jsx';
import CaregiverSignupPage from './pages/CaregiverSignupPage.jsx';
import ParentSignupPage from './pages/ParentSignupPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import MessagesOverviewPage from './pages/MessagesOverviewPage.jsx';
import MessengerPage from './pages/MessengerPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="anmelden" element={<RoleSelectionPage />} />
        <Route path="anmelden/tagespflegeperson" element={<CaregiverSignupPage />} />
        <Route path="anmelden/eltern" element={<ParentSignupPage />} />
        <Route path="familienzentrum" element={<DashboardPage />} />
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
