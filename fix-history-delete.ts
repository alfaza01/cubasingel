import fs from 'fs';

let content = fs.readFileSync('src/pages/History.tsx', 'utf8');

content = content.replace(
  "const [editError, setEditError] = useState('');",
  "const [editError, setEditError] = useState('');\n  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);"
);

const oldButton = `{/* DELETE ACTION BUTTON */}
                              <button
                                onClick={() => {
                                  if (window.confirm('Hapus transaksi & kembalikan balance saldo dompet secara permanen?')) {
                                    deleteTransaction(tx.id);
                                  }
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer border border-rose-150"
                              >
                                <Trash2 size={10} strokeWidth={3} /> HAPUS
                              </button>`;

const newButton = `{/* DELETE ACTION BUTTON */}
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

content = content.replace(oldButton, newButton);

fs.writeFileSync('src/pages/History.tsx', content);
console.log('Fixed History delete button');
