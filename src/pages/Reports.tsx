import React, { useMemo } from 'react';
import { 
  FileText, Download, ArrowLeft, TrendingUp, Sparkles, Award, BarChart3, PieChart as PieIcon, Activity, Flame
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { useStore } from '../context/StoreContext';
import { 
  ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend
} from 'recharts';

export function Reports() {
  const navigate = useNavigate();
  const { transactions, wallets } = useStore();

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR', 
      minimumFractionDigits: 0 
    }).format(val);
  };

  // --- 1. DYNAMIC PAST 7 DAYS GRAPH DATA ---
  const chartData = useMemo(() => {
    const dataMap: Record<string, { fDate: string; laba: number; transaksi: number }> = {};
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' });
      const fDate = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      dataMap[key] = { fDate, laba: 0, transaksi: 0 };
    }

    transactions.forEach(t => {
      const tDate = new Date(t.date);
      const key = tDate.toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' });
      if (dataMap[key]) {
        dataMap[key].laba += t.adminFee || 0;
        dataMap[key].transaksi += 1;
      }
    });

    return Object.values(dataMap);
  }, [transactions]);

  // --- 2. DYNAMIC DONUT BREAKDOWN (LABA PER KATEGORI) ---
  const pieData = useMemo(() => {
    const map: Record<string, number> = {};
    
    transactions.forEach(t => {
      let cat = t.category || 'LAINNYA';
      if (cat === 'UANG DIGITAL' || cat === 'TARIK TUNAI') {
        const digId = (t.sourceWallet && t.sourceWallet !== 'Bank08') ? t.sourceWallet : t.targetWallet;
        const w = wallets.find(wl => wl.id === digId);
        if (w) cat = w.name;
      }
      map[cat] = (map[cat] || 0) + (t.adminFee || 0);
    });

    const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#6366f1'];
    return Object.entries(map)
      .map(([name, value], i) => ({
        name: name.toUpperCase(),
        value,
        color: colors[i % colors.length]
      }))
      .filter(item => item.value > 0);
  }, [transactions, wallets]);

  // --- 3. CORE ANALYTICAL KPIs ---
  const labaHariIni = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    return transactions
      .filter(t => new Date(t.date) >= startOfToday)
      .reduce((sum, t) => sum + (t.adminFee || 0), 0);
  }, [transactions]);

  const totalLaba7Hari = useMemo(() => {
    return chartData.reduce((sum, item) => sum + item.laba, 0);
  }, [chartData]);

  const rataRataLaba = useMemo(() => {
    return Math.round(totalLaba7Hari / 7);
  }, [totalLaba7Hari]);

  const topCategory = useMemo(() => {
    if (pieData.length === 0) return 'N/A';
    return pieData.reduce((prev, current) => (current.value > prev.value) ? current : prev, pieData[0]).name;
  }, [pieData]);

  // Rounded format helper for custom tooltip
  const CustomComposedTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-800 text-white p-3 rounded-2xl shadow-xl text-xs space-y-1 backdrop-blur-md">
          <p className="font-extrabold text-[10px] text-slate-400 uppercase tracking-widest">{payload[0].payload.fDate}</p>
          {payload[0] && (
            <p className="font-black text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
              Laba: {formatRupiah(payload[0].value)}
            </p>
          )}
          {payload[1] && (
            <p className="font-black text-blue-400 flex items-center gap-1 text-[11px]">
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
              Volume: {payload[1].value} Trx
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-4 bg-slate-50 dark:bg-slate-900 min-h-screen pb-24 overflow-y-auto">
      {/* HEADER BAR */}
      <div className="flex items-center justify-between mt-3 mb-5 px-1 bg-[#1e3a8a] text-white p-4.5 rounded-2xl shadow-md">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => navigate('/')} 
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all cursor-pointer"
          >
            <ArrowLeft size={16} strokeWidth={2.5} />
          </button>
          <div>
            <h1 className="text-sm font-black tracking-wider text-white uppercase leading-none">ANALISIS GRAFIK</h1>
            <p className="text-[9px] text-blue-200 uppercase font-black tracking-wide leading-none mt-1.5">Visualisasi omset & laba</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-amber-500/20 text-yellow-300 border border-amber-500/30 px-2 py-1 rounded-xl text-[9px] font-black">
          <Sparkles size={11} className="animate-pulse" /> LIVE ANALYTICS
        </div>
      </div>

      {/* THREE-COLUMN DYNAMIC KPIs GRID */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-white dark:bg-slate-800 border border-slate-150 p-2.5 rounded-2xl shadow-xs flex flex-col justify-between">
          <span className="text-[7.5px] font-black tracking-widest text-slate-400 uppercase leading-none mb-1">UNTUNG HARI INI</span>
          <p className="text-xs font-black text-emerald-600 truncate leading-none mt-1">{formatRupiah(labaHariIni)}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-slate-150 p-2.5 rounded-2xl shadow-xs flex flex-col justify-between">
          <span className="text-[7.5px] font-black tracking-widest text-slate-400 uppercase leading-none mb-1">RATA2 (7 HARI)</span>
          <p className="text-xs font-black text-[#1e3a8a] truncate leading-none mt-1">{formatRupiah(rataRataLaba)}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-slate-150 p-2.5 rounded-2xl shadow-xs flex flex-col justify-between">
          <span className="text-[7.5px] font-black tracking-widest text-slate-400 uppercase leading-none mb-1">TOP KATEGORI</span>
          <p className="text-[9.5px] font-black text-blue-600 truncate leading-none mt-1">{topCategory}</p>
        </div>
      </div>

      {/* DYNAMIC COMBINED GRAPH (TRENDS + VOLUME) */}
      <div className="bg-white dark:bg-slate-800 border border-slate-150 rounded-2xl p-4 shadow-sm mb-4">
        <div className="flex items-center gap-2 mb-3.5 px-0.5">
          <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
            <BarChart3 size={15} />
          </div>
          <div>
            <h3 className="font-black text-[10.5px] text-slate-800 dark:text-slate-100 uppercase tracking-wider leading-none">Tren Laba & Volume Transaksi</h3>
            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wide mt-1">Histogram harian (Laba line & Transaksi bars)</p>
          </div>
        </div>

        <div className="w-full h-48 select-none text-[8px] font-extrabold pr-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: -5, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="fDate" 
                tickLine={false} 
                axisLine={false} 
                stroke="#94a3b8" 
                dy={5}
              />
              <YAxis 
                yAxisId="left"
                tickLine={false} 
                axisLine={false} 
                stroke="#10b981" 
                tickFormatter={(v) => v >= 1000 ? `${v / 1000}k` : v}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                tickLine={false} 
                axisLine={false} 
                stroke="#3b82f6" 
                tickFormatter={(v) => `${v} tx`}
              />
              <Tooltip content={<CustomComposedTooltip />} />
              <Bar yAxisId="right" dataKey="transaksi" fill="#dbeafe" radius={[4, 4, 0, 0]} barSize={12} />
              <Line yAxisId="left" type="monotone" dataKey="laba" stroke="#10b981" strokeWidth={3} dot={{ stroke: '#047857', strokeWidth: 1.5, r: 2.5 }} activeDot={{ r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* MARKET SHARE CONTROLLER DIRECT */}
      <div className="bg-white dark:bg-slate-800 border border-slate-150 rounded-2xl p-4 shadow-sm mb-4">
        <div className="flex items-center gap-2 mb-3 px-0.5">
          <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
            <PieIcon size={15} />
          </div>
          <div>
            <h3 className="font-black text-[10.5px] text-slate-800 dark:text-slate-100 uppercase tracking-wider leading-none">Proporsi Sumber Laba</h3>
            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wide mt-1">Kontribusi admin fee per instansi kas</p>
          </div>
        </div>

        {pieData.length === 0 ? (
          <div className="py-6 text-center text-[10px] uppercase tracking-widest font-bold text-slate-400 bg-slate-50 dark:bg-slate-900 border border-dashed rounded-xl">
            Tidak ada data kontribusi saat ini
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 items-center">
            {/* Pie wheel */}
            <div className="w-full h-32 select-none">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={28}
                    outerRadius={45}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatRupiah(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Custom high-scannable list legend */}
            <div className="space-y-1.5 overflow-y-auto max-h-[140px] pr-1">
              {pieData.map(item => (
                <div key={item.name} className="flex items-start gap-1.5 text-[8.5px]">
                  <span className="w-2 h-2 rounded-full shrink-0 mt-1" style={{ backgroundColor: item.color }}></span>
                  <div className="truncate leading-tight">
                    <p className="font-extrabold text-slate-800 dark:text-slate-100 truncate">{item.name}</p>
                    <p className="font-bold text-slate-400 text-[8px]">{formatRupiah(item.value)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* REPORT LINKS (The origin downloads section modernized) */}
      <div className="bg-white dark:bg-slate-800 border border-slate-150 rounded-2xl p-4 shadow-sm">
        <h4 className="text-[8px] font-black tracking-widest text-slate-400 uppercase mb-3 px-0.5 flex items-center justify-between">
           <span>UNDUH REKAPITULASI DOKUMEN</span> <Award size={12} className="text-amber-500" />
        </h4>
        <div className="space-y-3">
          <ReportCard title="Laporan Harian" desc="Rekap penjualan, diskon, dan untung." />
          <ReportCard title="Laporan Bulanan" desc="Tren penjualan bulan ini vs bulan lalu." />
          <ReportCard title="Stok Masuk & Keluar" desc="Pergerakan inventaris dan log." />
        </div>
      </div>
    </div>
  );
}

function ReportCard({ title, desc }: { title: string, desc: string }) {
  return (
    <div className="p-3 bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-150 shadow-xs flex flex-row items-center justify-between gap-3 transition-all active:scale-[0.99]">
      <div className="flex items-center gap-3">
        <div className="w-8.5 h-8.5 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
          <FileText size={16} />
        </div>
        <div>
          <h3 className="font-black text-xs text-slate-800 dark:text-slate-100 mb-0.5 leading-none">{title}</h3>
          <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-tight">{desc}</p>
        </div>
      </div>
      <button 
        type="button"
        className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors shadow-xs active:scale-90 cursor-pointer"
        title="Download PDF"
      >
        <Download size={14} />
      </button>
    </div>
  );
}
