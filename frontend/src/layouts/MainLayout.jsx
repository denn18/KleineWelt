import { Outlet } from 'react-router-dom';
import NavigationBar from '../components/NavigationBar.jsx';
import Footer from '../components/Footer.jsx';

function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-page">
      <NavigationBar />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-16 bg-page px-4 pb-16 pt-24">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default MainLayout;
