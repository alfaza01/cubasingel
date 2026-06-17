import React from 'react';
import { NavLink } from 'react-router';
import { Home, Clock, Wallet, BarChart2, User, Menu, FileText, Gift, NotebookTabs, Archive, Calculator, FileSpreadsheet, Moon, Sun, Smartphone, Monitor, RefreshCw } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export function SidebarNav() {
  const { storeName, storeLogo, subStoreName, uiTheme, setUiTheme, uiLayout, setUiLayout } = useStore();
  
  const mainNavItems = [
    { path: '/', label: 'Beranda', icon: Home },
    { path: '/history', label: 'Riwayat', icon: Clock },
    { path: '/assets', label: 'Aset Digital', icon: Wallet },
    { path: '/reports', label: 'Laporan', icon: BarChart2 },
  ];

  const toolsNavItems = [
    { path: '/inventory', label: 'Inventaris', icon: Archive },
    { path: '/contacts', label: 'Kontak', icon: NotebookTabs },
    { path: '/kasbon', label: 'Kasbon', icon: FileSpreadsheet },
    { path: '/vouchers', label: 'Voucher', icon: Gift },
    { path: '/notes', label: 'Catatan', icon: FileText },
    { path: '/pos', label: 'Kasir (POS)', icon: Calculator },
  ];

  const settingItems = [
    { path: '/account', label: 'Akun & Pengaturan', icon: User },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-screen sticky top-0 transition-colors duration-300">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
         <div className="w-10 h-10 flex items-center justify-center">
           <img src={storeLogo || '/icons/icon-192x192.png'} alt={storeName || "Kasir"} className="w-full h-full object-contain rounded-lg" onError={(e) => {
             e.currentTarget.src = '/icons/icon-192x192.png';
           }} />
         </div>
         <div className="flex flex-col">
            <span className="font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider text-sm truncate">{storeName}</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate">{subStoreName}</span>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        <div>
          <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-3 mb-2">Menu Utama</h4>
          <div className="space-y-1">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                      isActive ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100 font-medium'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                      <span className="text-sm">{item.label}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>

        <div>
          <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-3 mb-2">Operasional</h4>
          <div className="space-y-1">
            {toolsNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                      isActive ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100 font-medium'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                      <span className="text-sm">{item.label}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>

      <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">

        <div className="flex gap-2 px-1">
          <button 
            onClick={() => setUiTheme(uiTheme === 'dark' ? 'light' : 'dark')}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          >
            {uiTheme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            <span className="text-xs font-bold">{uiTheme === 'dark' ? 'Terang' : 'Gelap'}</span>
          </button>
          
          <button 
             onClick={() => setUiLayout('hp')}
             className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
           >
             <Smartphone size={16} />
             <span className="text-xs font-bold">Mode HP</span>
           </button>
        </div>

        {settingItems.map((item) => {
           const Icon = item.icon;
           return (
             <NavLink
               key={item.path}
               to={item.path}
               className={({ isActive }) =>
                 `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                   isActive ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100 font-medium'
                 }`
               }
             >
               {({ isActive }) => (
                 <>
                   <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                   <span className="text-sm">{item.label}</span>
                 </>
               )}
             </NavLink>
           );
         })}
      </div>
    </aside>
  );
}
