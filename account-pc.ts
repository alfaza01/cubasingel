import fs from 'fs';

let content = fs.readFileSync('src/pages/Account.tsx', 'utf8');

// Ensure useStore brings uiLayout / setUiLayout
content = content.replace(
  'factoryReset,\n    restoreFromBackup\n  } = useStore();',
  'factoryReset,\n    restoreFromBackup,\n    uiLayout,\n    uiTheme,\n    setUiLayout,\n    setUiTheme\n  } = useStore();'
);

// Add the Layout toggle section in Account profile section or above it
const layoutSection = `
        {/* TATA LETAK & TEMA */}
        <section className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden transition-all duration-300">
          <div 
            onClick={() => toggleSection('layout')}
            className="flex items-center justify-between p-5 cursor-pointer bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400 flex items-center justify-center shadow-inner shrink-0">
                <Sliders size={22} strokeWidth={2.5} />
              </div>
              <div className="min-w-0 pr-4">
                <h2 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm mb-1 uppercase tracking-wider">TATA LETAK & TEMA</h2>
                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 line-clamp-1">Ubah mode HP, Tablet, PC & Gelap Terang</p>
              </div>
            </div>
            <div className="text-slate-400 shrink-0 bg-white dark:bg-slate-800 rounded-full p-2 shadow-sm border border-slate-100 dark:border-slate-700">
              {openSections.layout ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </div>

          {openSections.layout && (
            <div className="p-5 border-t border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-1 duration-200">
                <div className="mb-6">
                  <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">TEMA TAMPILAN</h3>
                  <div className="grid grid-cols-2 gap-2">
                     <button 
                       onClick={() => setUiTheme('light')} 
                       className={\`py-3 flex items-center justify-center gap-2 rounded-xl border transition-all \${uiTheme === 'light' ? 'bg-[#1e3a8a] border-transparent text-white shadow-md' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}\`}
                     >
                        <span className="text-[10px] font-black uppercase tracking-wider">Terang</span>
                     </button>
                     <button 
                       onClick={() => setUiTheme('dark')} 
                       className={\`py-3 flex items-center justify-center gap-2 rounded-xl border transition-all \${uiTheme === 'dark' ? 'bg-[#1e3a8a] border-transparent text-white shadow-md' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}\`}
                     >
                        <span className="text-[10px] font-black uppercase tracking-wider">Gelap</span>
                     </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">MODE TATA LETAK</h3>
                  <div className="grid grid-cols-3 gap-2">
                     <button 
                       onClick={() => setUiLayout('hp')} 
                       className={\`py-4 flex flex-col items-center justify-center gap-2 rounded-xl border transition-all \${uiLayout === 'hp' ? 'bg-blue-50/50 border-blue-200 text-[#1e3a8a] shadow-sm ring-1 ring-blue-100' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}\`}
                     >
                        <span className="text-[9px] font-black uppercase tracking-wider">HP</span>
                     </button>
                     <button 
                       onClick={() => setUiLayout('tablet')} 
                       className={\`py-4 flex flex-col items-center justify-center gap-2 rounded-xl border transition-all \${uiLayout === 'tablet' ? 'bg-blue-50/50 border-blue-200 text-[#1e3a8a] shadow-sm ring-1 ring-blue-100' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}\`}
                     >
                        <span className="text-[9px] font-black uppercase tracking-wider">Tablet</span>
                     </button>
                     <button 
                       onClick={() => setUiLayout('pc')} 
                       className={\`py-4 flex flex-col items-center justify-center gap-2 rounded-xl border transition-all \${uiLayout === 'pc' ? 'bg-blue-50/50 border-blue-200 text-[#1e3a8a] shadow-sm ring-1 ring-blue-100' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}\`}
                     >
                        <span className="text-[9px] font-black uppercase tracking-wider">PC</span>
                     </button>
                  </div>
                </div>
            </div>
          )}
        </section>
`;

content = content.replace(
  '{/* PROFIL CAFE / TOKO */}',
  layoutSection + '\n        {/* PROFIL CAFE / TOKO */}'
);

// CSS Grid adjustments for Account page inner layout
content = content.replace(
  '<div className="bg-slate-50 dark:bg-slate-900 min-h-screen pb-24 relative">',
  '<div className="bg-slate-50 dark:bg-slate-900 min-h-screen pb-24 relative [.pc-mode_&]:bg-transparent [.pc-mode_&]:pb-10">'
);
content = content.replace(
  '<div className="px-4 -mt-10 relative z-10 space-y-4">',
  '<div className="px-4 -mt-10 relative z-10 space-y-4 [.pc-mode_&]:mt-6 [.pc-mode_&]:px-0 [.pc-mode_&]:grid [.pc-mode_&]:grid-cols-2 [.pc-mode_&]:gap-6 [.pc-mode_&]:space-y-0">'
);


fs.writeFileSync('src/pages/Account.tsx', content);
console.log('Account.tsx edited to include layout toggle');
