import { Route, Routes } from 'react-router-dom';
import MainLayout from './layouts/MainLayout.jsx';
import HomePage from './pages/HomePage.jsx';
import RoleSelectionPage from './pages/RoleSelectionPage.jsx';
import CaregiverSignupPage from './pages/CaregiverSignupPage.jsx';
import ParentSignupPage from './pages/ParentSignupPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="anmelden" element={<RoleSelectionPage />} />
        <Route path="anmelden/tagespflegeperson" element={<CaregiverSignupPage />} />
        <Route path="anmelden/eltern" element={<ParentSignupPage />} />
        <Route path="familienzentrum" element={<DashboardPage />} />
      </Route>
    </Routes>
  );
}

export default App;
