import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { ArrowDownRight, ArrowUpRight, Save } from 'lucide-react';

export function Transaction() {
  const { addTransaction } = useStore();
  const [type, setType] = useState<'INCOME'|'EXPENSE'>('EXPENSE');
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return;
    
    addTransaction([], Number(amount), type, desc || 'Transaksi Manual');
    setAmount('');
    setDesc('');
    alert('Transaksi berhasil dicatat!');
  };

  return (
    <div className="p-4 h-full relative">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Catat Keuangan</h1>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="flex p-1.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 gap-1.5">
          <button 
            type="button"
            onClick={() => setType('EXPENSE')}
            className={`flex-1 flex justify-center items-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all
              ${type === 'EXPENSE' ? 'bg-white dark:bg-slate-800 text-rose-600 shadow-sm border border-slate-200 dark:border-slate-700' : 'text-slate-500 dark:text-slate-400'}`}
          >
            <ArrowUpRight size={16} /> Keluar
          </button>
          <button 
            type="button"
            onClick={() => setType('INCOME')}
            className={`flex-1 flex justify-center items-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all
              ${type === 'INCOME' ? 'bg-white dark:bg-slate-800 text-emerald-600 shadow-sm border border-slate-200 dark:border-slate-700' : 'text-slate-500 dark:text-slate-400'}`}
          >
            <ArrowDownRight size={16} /> Masuk
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Jumlah Nominal (Rp)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 font-bold">Rp</span>
              <input 
                type="number" 
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0"
                required
                className="w-full text-xl font-bold text-slate-900 dark:text-slate-50 pl-10 pr-3 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 dark:bg-slate-900"
              />
            </div>
          </div>

          <div>
             <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Keterangan / Catatan</label>
             <textarea 
               value={desc}
               onChange={e => setDesc(e.target.value)}
               placeholder="Cth: Beli gula, bayar sewa..."
               className="w-full text-sm text-slate-900 dark:text-slate-50 p-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 dark:bg-slate-900 min-h-[80px] resize-none"
             />
          </div>

          <button 
            type="submit"
            className={`w-full flex items-center justify-center gap-2 text-white font-bold py-3.5 rounded-xl shadow-md transition-colors mt-2
              ${type === 'EXPENSE' ? 'bg-rose-600 active:bg-rose-700' : 'bg-emerald-600 active:bg-emerald-700'}
            `}
          >
            <Save size={18} />
            Simpan Catatan
          </button>
        </form>
      </div>
    </div>
  );
}
