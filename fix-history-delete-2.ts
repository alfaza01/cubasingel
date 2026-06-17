import fs from 'fs';

let content = fs.readFileSync('src/pages/History.tsx', 'utf8');

const oldButton = `{/* DELETE ACTION BUTTON */}
                              {deleteConfirmId === tx.id ? (
                                <button
                                  onClick={() => {
                                    deleteTransaction(tx.id);
                                    setDeleteConfirmId(null);
                                  }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider text-white bg-rose-600 hover:bg-rose-700 transition-colors cursor-pointer border border-rose-600 shadow-sm animate-in fade-in"
                                >
                                  <Trash2 size={10} strokeWidth={3} /> YAKIN?
                                </button>
                              ) : (
                                <button
                                  onClick={() => setDeleteConfirmId(tx.id)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer border border-rose-150"
                                >
                                  <Trash2 size={10} strokeWidth={3} /> HAPUS
                                </button>
                              )}`;

const newButton = `{/* DELETE ACTION BUTTON */}
                              {deleteConfirmId === tx.id ? (
                                <div className="flex gap-2 animate-in fade-in">
                                  <span className="text-[9px] font-bold text-slate-500 py-1.5">Hapus Data?</span>
                                  <button
                                    onClick={() => {
                                      deleteTransaction(tx.id);
                                      setDeleteConfirmId(null);
                                    }}
                                    className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-sm"
                                  >
                                    YA
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirmId(null)}
                                    className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors shadow-sm"
                                  >
                                    BATAL
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setDeleteConfirmId(tx.id)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer border border-rose-150"
                                >
                                  <Trash2 size={10} strokeWidth={3} /> HAPUS
                                </button>
                              )}`;

content = content.replace(oldButton, newButton);

fs.writeFileSync('src/pages/History.tsx', content);
console.log('Fixed Delete Button');
