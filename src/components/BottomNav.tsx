import React from 'react';
import { NavLink } from 'react-router';
import { Home, Clock, Wallet, BarChart2, User } from 'lucide-react';

export function BottomNav() {
  const navItems = [
    { path: '/', label: 'Transaksi', icon: Home },
    { path: '/history', label: 'Riwayat', icon: Clock },
    { path: '/assets', label: 'Aset Digital', icon: Wallet },
    { path: '/reports', label: 'Laporan', icon: BarChart2 },
    { path: '/account', label: 'Akun', icon: User },
  ];

  return (
    <nav className="absolute bottom-0 w-full bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-800 flex justify-between px-2 pb-safe z-50">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full py-3 gap-1 relative ${
                isActive ? 'text-[#2563eb]' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-slate-50'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-[#2563eb]' : ''} />
                <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}
