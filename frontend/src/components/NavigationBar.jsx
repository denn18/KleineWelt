import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Bars3Icon } from '@heroicons/react/24/outline';
import { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

function NavigationBar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const links = useMemo(() => {
    const items = [
      { to: '/', label: 'Startseite' },
      { to: '/familienzentrum', label: 'Kindertagespflege finden' },
    ];

    if (user) {
      items.push({ to: '/nachrichten', label: 'Nachrichten' });
      items.push({ to: '/profil', label: 'Profil' });
    } else {
      items.push({ to: '/anmelden', label: 'Registrieren' });
      items.push({ to: '/login', label: 'Login' });
    }

    return items;
  }, [user]);

  function handleLogout() {
    const confirmed = window.confirm('Möchtest du dich wirklich ausloggen?');
    if (!confirmed) {
      return;
    }
    logout();
    setMobileOpen(false);
    navigate('/');
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-brand-100 bg-white/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
        <Link to="/" className="text-2xl font-semibold text-brand-700">
          Wimmel Welt
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-700 md:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 transition hover:bg-brand-100 hover:text-brand-800 ${
                  isActive ? 'bg-brand-600 text-white shadow-sm' : ''
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
          {user ? (
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-600 transition hover:border-brand-400 hover:text-brand-700"
            >
              Logout
            </button>
          ) : null}
        </nav>
        <button
          type="button"
          className="inline-flex items-center rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 md:hidden"
          onClick={() => setMobileOpen((value) => !value)}
        >
          <Bars3Icon className="h-5 w-5" />
        </button>
      </div>
      {mobileOpen ? (
        <div className="border-t border-brand-100 bg-white px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-2">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-sm font-medium transition hover:bg-brand-100 hover:text-brand-800 ${
                    isActive ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-700'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            {user ? (
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-600 transition hover:border-brand-400 hover:text-brand-700"
              >
                Logout
              </button>
            ) : null}
          </nav>
        </div>
      ) : null}
    </header>
  );
}

export default NavigationBar;
