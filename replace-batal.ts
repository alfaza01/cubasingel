import fs from 'fs';

let content = fs.readFileSync('src/pages/History.tsx', 'utf8');

const oldButton = `<button
                                    onClick={() => setDeleteConfirmId(null)}
                                    className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors shadow-sm"
                                  >
                                    BATAL
                                  </button>`;

const newButton = `<button
                                    onClick={() => setDeleteConfirmId(null)}
                                    className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors shadow-sm"
                                  >
                                    TIDAK
                                  </button>`;

content = content.replace(oldButton, newButton);

fs.writeFileSync('src/pages/History.tsx', content);
console.log('Fixed BATAL to TIDAK in row 859');
