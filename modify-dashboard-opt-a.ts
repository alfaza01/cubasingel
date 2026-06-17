import fs from 'fs';

let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

// 1. Add inputMode state
content = content.replace(
  "const [adminNonTunai, setAdminNonTunai] = useState(false);",
  "const [adminNonTunai, setAdminNonTunai] = useState(false);\n  const [inputMode, setInputMode] = useState<'NOMINAL_ADMIN' | 'MODAL_JUAL'>('NOMINAL_ADMIN');"
);

// 2. Modify handleSaveTransaction to calculate the correct admin fee
content = content.replace(
  "const parsedAdmin = parseInt(admin, 10) || 0;",
  `let parsedAdmin = 0;\n    if (inputMode === 'MODAL_JUAL') {\n      const parsedJual = parseInt(admin, 10) || 0;\n      parsedAdmin = Math.max(0, parsedJual - parsedNominal);\n    } else {\n      parsedAdmin = parseInt(admin, 10) || 0;\n    }`
);

// 3. Add toggle buttons in Form and update the labels
// We will replace the whole NOMINAL & ADMIN div
const originalDiv = `{/* NOMINAL & ADMIN */}
           <div className="flex gap-4">
              <div className="flex-1">
                 <label className="text-[9px] font-black text-slate-400 mb-1.5 block tracking-wider uppercase">NOMINAL TRANSAKSI</label>
                 <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-455 font-extrabold text-xs">Rp</span>
                    <input 
                      type="text" 
                      ref={nominalInputRef}
                      placeholder="0" 
                      value={displayNominal}
                      onChange={(e) => {
                        const rawVal = e.target.value.replace(/\\D/g, '');
                        setNominal(rawVal);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          adminInputRef.current?.focus();
                        }
                      }}
                      className="w-full border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:border-slate-600 shadow-sm rounded-xl p-2.5 pl-9 text-right text-xs font-black text-slate-800 dark:text-slate-100 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all h-10"
                    />
                 </div>
              </div>
              <div className="flex-1">
                 <div className="flex justify-between items-center mb-1.5 h-[14px]">
                    <label className="text-[9px] font-black text-slate-400 tracking-wider uppercase">BIAYA ADMIN</label>
                    <label className="text-[9px] font-black text-blue-600 flex items-center gap-1 cursor-pointer select-none transition-all active:scale-95 leading-none">
                       <input 
                         type="checkbox" 
                         checked={adminNonTunai}
                         onChange={(e) => setAdminNonTunai(e.target.checked)}
                         className="rounded text-blue-600 w-3 h-3 cursor-pointer border-slate-300 dark:border-slate-600 focus:ring-blue-500" 
                       /> NON TUNAI
                    </label>
                 </div>
                 <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-455 font-extrabold text-xs">Rp</span>
                    <input 
                      type="text" 
                      ref={adminInputRef}
                      placeholder="0" 
                      value={displayAdmin}
                      onChange={(e) => {
                        const rawVal = e.target.value.replace(/\\D/g, '');
                        setAdmin(rawVal);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          submitButtonRef.current?.focus();
                        }
                      }}
                      className="w-full border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:border-slate-600 shadow-sm rounded-xl p-2.5 pl-9 text-right text-xs font-black text-slate-800 dark:text-slate-100 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all h-10"
                    />
                 </div>
              </div>
           </div>`;

const newDiv = `{/* INPUT MODE TOGGLE */}
           <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 mb-2">
              <button 
                type="button"
                onClick={() => setInputMode('NOMINAL_ADMIN')}
                className={\`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all \${inputMode === 'NOMINAL_ADMIN' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}\`}
              >
                NOMINAL & ADMIN
              </button>
              <button 
                type="button"
                onClick={() => setInputMode('MODAL_JUAL')}
                className={\`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all \${inputMode === 'MODAL_JUAL' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}\`}
              >
                MODAL & JUAL
              </button>
           </div>

           {/* NOMINAL & ADMIN */}
           <div className="flex gap-4">
              <div className="flex-1">
                 <label className="text-[9px] font-black text-slate-400 mb-1.5 block tracking-wider uppercase">
                   {inputMode === 'NOMINAL_ADMIN' ? 'NOMINAL TRANSAKSI' : 'HARGA MODAL'}
                 </label>
                 <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-455 font-extrabold text-xs">Rp</span>
                    <input 
                      type="text" 
                      ref={nominalInputRef}
                      placeholder="0" 
                      value={displayNominal}
                      onChange={(e) => {
                        const rawVal = e.target.value.replace(/\\D/g, '');
                        setNominal(rawVal);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          adminInputRef.current?.focus();
                        }
                      }}
                      className="w-full border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:border-slate-600 shadow-sm rounded-xl p-2.5 pl-9 text-right text-xs font-black text-slate-800 dark:text-slate-100 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all h-10"
                    />
                 </div>
              </div>
              <div className="flex-1">
                 <div className="flex justify-between items-center mb-1.5 h-[14px]">
                    <label className="text-[9px] font-black text-slate-400 tracking-wider uppercase">
                      {inputMode === 'NOMINAL_ADMIN' ? 'BIAYA ADMIN' : 'HARGA JUAL'}
                    </label>
                    <label className="text-[9px] font-black text-blue-600 flex items-center gap-1 cursor-pointer select-none transition-all active:scale-95 leading-none">
                       <input 
                         type="checkbox" 
                         checked={adminNonTunai}
                         onChange={(e) => setAdminNonTunai(e.target.checked)}
                         className="rounded text-blue-600 w-3 h-3 cursor-pointer border-slate-300 dark:border-slate-600 focus:ring-blue-500" 
                       /> NON TUNAI
                    </label>
                 </div>
                 <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-455 font-extrabold text-xs">Rp</span>
                    <input 
                      type="text" 
                      ref={adminInputRef}
                      placeholder="0" 
                      value={displayAdmin}
                      onChange={(e) => {
                        const rawVal = e.target.value.replace(/\\D/g, '');
                        setAdmin(rawVal);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          submitButtonRef.current?.focus();
                        }
                      }}
                      className="w-full border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:border-slate-600 shadow-sm rounded-xl p-2.5 pl-9 text-right text-xs font-black text-slate-800 dark:text-slate-100 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all h-10"
                    />
                 </div>
              </div>
           </div>`;

content = content.replace(originalDiv, newDiv);

fs.writeFileSync('src/pages/Dashboard.tsx', content);
console.log('Modified Dashboard.tsx successfully');
