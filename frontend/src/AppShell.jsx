import App from './App.jsx';
import Seo from './seo/Seo.jsx';
import { AuthProvider } from './context/AuthContext.jsx';

export default function AppShell() {
  return (
    <AuthProvider>
      <Seo />
      <App />
    </AuthProvider>
  );
}
