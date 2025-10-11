import { Link, NavLink } from 'react-router-dom';
import { Bars3Icon } from '@heroicons/react/24/outline';
import { useState } from 'react';

const links = [
  { to: '/', label: 'Startseite' },
  { to: '/anmelden', label: 'Anmelden' },
  { to: '/familienzentrum', label: 'Familienzentrum' }
];

function NavigationBar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-brand-100 bg-white/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
        <Link to="/" className="text-2xl font-semibold text-brand-700">
          Kleine Welt
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
          </nav>
        </div>
      ) : null}
    </header>
  );
}

export default NavigationBar;
