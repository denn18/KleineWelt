import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Bars3Icon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

function NavigationBar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [infoDropdownOpen, setInfoDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const closeDropdownTimeoutRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const isInfoActive =
    location.pathname === '/faq' ||
    location.pathname === '/anmelden' ||
    (user?.role === 'caregiver' && location.pathname === '/kontakte');

  const links = useMemo(() => {
    const items = [
      // Startseite Label erstmal weg
      // { to: '/', label: 'Startseite' },
      { to: '/kindertagespflege', label: 'Kindertagespflege finden' },
    ];

    if (user) {
      items.push({ to: '/nachrichten', label: 'Nachrichten' });
      items.push({ to: '/betreuungsgruppe', label: 'Betreuungsgruppe' });
      items.push({ to: '/profil', label: 'Profil' });
    } else {
      items.push({ to: '/login', label: 'Login' });
    }

    return items;
  }, [user]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setInfoDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (closeDropdownTimeoutRef.current) {
        window.clearTimeout(closeDropdownTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setInfoDropdownOpen(false);
  }, [location.pathname]);

  function handleLogout() {
    const confirmed = window.confirm('Möchtest du dich wirklich ausloggen?');
    if (!confirmed) {
      return;
    }
    logout();
    setMobileOpen(false);
    navigate('/');
  }

  function openInfoDropdown() {
    if (closeDropdownTimeoutRef.current) {
      window.clearTimeout(closeDropdownTimeoutRef.current);
      closeDropdownTimeoutRef.current = null;
    }
    setInfoDropdownOpen(true);
  }

  function closeInfoDropdownWithDelay() {
    if (closeDropdownTimeoutRef.current) {
      window.clearTimeout(closeDropdownTimeoutRef.current);
    }

    closeDropdownTimeoutRef.current = window.setTimeout(() => {
      setInfoDropdownOpen(false);
      closeDropdownTimeoutRef.current = null;
    }, 300);
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-brand-100 bg-white/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
        <Link
          to="/"
          className="rounded-full px-3 py-1 text-2xl font-semibold text-brand-700 transition duration-200 hover:-translate-y-0.5 hover:bg-brand-50 hover:text-brand-800 hover:shadow-sm"
        >
          Wimmel Welt
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-700 md:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 transition duration-200 hover:-translate-y-0.5 hover:bg-brand-100 hover:text-brand-800 hover:shadow-sm ${
                  isActive ? 'bg-brand-600 text-white shadow-sm' : ''
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
          <div
            ref={dropdownRef}
            className="relative"
            onMouseEnter={openInfoDropdown}
            onMouseLeave={closeInfoDropdownWithDelay}
          >
            <button
              type="button"
              onClick={() => setInfoDropdownOpen((value) => !value)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 transition duration-200 hover:-translate-y-0.5 hover:bg-brand-100 hover:text-brand-800 hover:shadow-sm ${
                isInfoActive ? 'bg-brand-600 text-white shadow-sm hover:bg-brand-700 hover:text-white' : ''
              }`}
            >
              Infos
              <ChevronDownIcon
                className={`h-4 w-4 transition-transform duration-200 ${infoDropdownOpen ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            </button>
            {infoDropdownOpen ? (
              <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-brand-100 bg-white p-2 shadow-lg">
                <Link
                  to="/faq"
                  className="block rounded-xl px-3 py-2 text-sm text-slate-700 transition hover:bg-brand-50 hover:text-brand-700"
                >
                  Häufige Fragen
                </Link>
                <Link
                  to="/anmelden"
                  className="block rounded-xl px-3 py-2 text-sm text-slate-700 transition hover:bg-brand-50 hover:text-brand-700"
                >
                  Registrieren
                </Link>
                {user?.role === 'caregiver' ? (
                  <Link
                    to="/kontakte"
                    className="block rounded-xl px-3 py-2 text-sm text-slate-700 transition hover:bg-brand-50 hover:text-brand-700"
                  >
                    Kontakte
                  </Link>
                ) : null}
              </div>
            ) : null}
          </div>
          {user ? (
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-600 transition duration-200 hover:-translate-y-0.5 hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700 hover:shadow-sm"
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
                  `rounded-full px-4 py-2 text-sm font-medium transition duration-200 hover:bg-brand-100 hover:text-brand-800 hover:shadow-sm ${
                    isActive ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-700'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            <NavLink
              to="/faq"
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm font-medium transition duration-200 hover:bg-brand-100 hover:text-brand-800 hover:shadow-sm ${
                  isActive ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-700'
                }`
              }
            >
              Häufige Fragen
            </NavLink>
            <NavLink
              to="/anmelden"
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm font-medium transition duration-200 hover:bg-brand-100 hover:text-brand-800 hover:shadow-sm ${
                  isActive ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-700'
                }`
              }
            >
              Registrieren
            </NavLink>
            {user?.role === 'caregiver' ? (
              <NavLink
                to="/kontakte"
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-sm font-medium transition duration-200 hover:bg-brand-100 hover:text-brand-800 hover:shadow-sm ${
                    isActive ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-700'
                  }`
                }
              >
                Kontakte
              </NavLink>
            ) : null}
            {user ? (
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-600 transition duration-200 hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700 hover:shadow-sm"
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
