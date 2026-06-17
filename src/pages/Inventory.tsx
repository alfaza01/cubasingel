import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Plus, Search, MoreVertical } from 'lucide-react';

export function Inventory() {
  const { products } = useStore();
  const [search, setSearch] = useState('');

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-4 bg-slate-50 dark:bg-slate-900 min-h-full [.pc-mode_&]:bg-transparent [.pc-mode_&]:py-6">
       <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Stok Barang</h1>
        </div>
        <button className="bg-slate-900 text-white px-3 py-2 rounded-lg flex items-center gap-1.5 text-xs font-bold active:scale-95 transition-transform">
          <Plus size={16} />
          Tambah
        </button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          placeholder="Cari nama produk..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
        />
      </div>
        
      <div className="space-y-3 pb-6 [.pc-mode_&]:grid [.pc-mode_&]:md:grid-cols-2 [.pc-mode_&]:lg:grid-cols-3 [.pc-mode_&]:gap-4 [.pc-mode_&]:space-y-0">
        {filtered.map(product => (
          <div key={product.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
            <div className="flex-1 pr-3">
              <h3 className="font-semibold text-slate-900 dark:text-slate-50 text-sm">{product.name}</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{product.category}</p>
              <p className="font-bold text-blue-600 text-sm mt-1.5">Rp {product.price.toLocaleString('id-ID')}</p>
            </div>
            <div className="flex flex-col items-end justify-between h-full min-h-[60px]">
              <button className="text-slate-400 p-1 -mr-1 rounded-md active:bg-slate-100 dark:bg-slate-800"><MoreVertical size={16} /></button>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold mt-auto
                ${product.stock > 20 ? 'bg-emerald-100 text-emerald-700' : 
                  product.stock > 0 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                {product.stock} {product.stock === 0 ? 'Kosong' : 'unit'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
