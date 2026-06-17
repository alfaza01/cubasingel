import React from 'react';
import { NavLink } from 'react-router';
import { History, Wallet, FileText, Settings, ChevronRight, ShieldCheck } from 'lucide-react';
import { useLicense } from '../context/LicenseContext';

export function Menu() {
  const { isAdmin } = useLicense();

  const menuItems = [
    { path: '/history', label: 'Riwayat Transaksi', icon: History, color: 'text-blue-600', bg: 'bg-blue-50' },
    { path: '/assets', label: 'Aset & Saldo', icon: Wallet, color: 'text-blue-500', bg: 'bg-blue-50/70' },
    { path: '/reports', label: 'Laporan Keuangan', icon: FileText, color: 'text-orange-500', bg: 'bg-orange-50' },
    { path: '/account', label: 'Pengaturan Akun', icon: Settings, color: 'text-slate-600 dark:text-slate-300', bg: 'bg-slate-50 dark:bg-slate-900' },
  ];

  return (
    <div className="p-4 pb-24">
      <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50 mb-6">Menu Lainnya</h1>
      <div className="space-y-3">
        {menuItems.map(item => {
          const Icon = item.icon;
          return (
            <NavLink key={item.path} to={item.path} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm active:bg-slate-50 dark:bg-slate-900 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${item.bg} ${item.color}`}>
                  <Icon size={20} />
                </div>
                <span className="font-semibold text-slate-800 dark:text-slate-100">{item.label}</span>
              </div>
              <ChevronRight size={18} className="text-slate-400" />
            </NavLink>
          );
        })}
        {isAdmin && (
           <NavLink to="/admin" className="flex items-center justify-between p-4 bg-slate-900 rounded-xl border border-slate-700 shadow-sm active:bg-slate-800 transition-colors">
             <div className="flex items-center gap-4">
               <div className={`p-3 rounded-lg bg-yellow-500/20 text-yellow-500`}>
                 <ShieldCheck size={20} />
               </div>
               <span className="font-semibold text-white">Pusat Admin</span>
             </div>
             <ChevronRight size={18} className="text-slate-500" />
           </NavLink>
        )}
      </div>
    </div>
  );
}
