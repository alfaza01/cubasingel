import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronRight, FileText, Contact, Ticket, Calculator, 
  MoreHorizontal, Tag, CreditCard, HandCoins, Package, 
  MinusCircle, PlusCircle, Bot, MoreVertical, Box, Info,
  ClipboardList, TrendingUp, CalendarDays, Printer, CheckCircle2, Save, X, Sparkles, Search,
  Sun, Moon, Monitor, Smartphone, Tablet, Store, Users,
  Download, Laptop, Share, RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { AppInstaller } from '../components/AppInstaller';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

const formatRupiah = (val: number | string) => {
  const num = Number(val);
  if (isNaN(num)) return 'Rp 0';
  return 'Rp ' + num.toLocaleString('id-ID');
};

const formatK = (num: number) => {
  if (num % 1000 === 0) {
    return `${num / 1000}K`;
  } else {
    return `${(num / 1000).toFixed(3).replace(/\.?0+$/, '')}K`;
  }
};

export function Dashboard() {
  const navigate = useNavigate();
  const { wallets, addTransaction, storeName, storeLogo, subStoreName, cashierName, announcementText, presets, promoText, wisdomText, transactions, uiTheme, uiLayout, setUiTheme, setUiLayout, autoTextPresets } = useStore();
  const [now, setNow] = useState(new Date());
  const [showLainnya, setShowLainnya] = useState(false);
  const [showLabaDetail, setShowLabaDetail] = useState(false);

  const [showSidePanel, setShowSidePanel] = useState(false);
  const { showToast } = useToast();

  // Form State
  const [category, setCategory] = useState<'UANG DIGITAL' | 'TARIK TUNAI' | 'AKSESORIS'>('UANG DIGITAL');
  const [sourceWalletId, setSourceWalletId] = useState('');
  const [targetWalletId, setTargetWalletId] = useState('');
  const [keterangan, setKeterangan] = useState('TRANSFER');
  const [nominal, setNominal] = useState('');
  const [admin, setAdmin] = useState('');
  const [adminNonTunai, setAdminNonTunai] = useState(false);
  const [inputMode, setInputMode] = useState<'NOMINAL_ADMIN' | 'MODAL_JUAL'>('NOMINAL_ADMIN');
  const [showModeInfo, setShowModeInfo] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showAutoTextModal, setShowAutoTextModal] = useState(false);
  const [autoTextSearchQuery, setAutoTextSearchQuery] = useState('');

  const filteredAutoTexts = useMemo(() => {
    if (!autoTextPresets) return [];
    if (!autoTextSearchQuery.trim()) return autoTextPresets;
    const query = autoTextSearchQuery.toLowerCase().trim();
    return autoTextPresets.filter(item => 
      item.keterangan.toLowerCase().includes(query)
    );
  }, [autoTextPresets, autoTextSearchQuery]);

  const inlineMatchingAutoTexts = useMemo(() => {
    if (!autoTextPresets || !keterangan.trim()) return [];
    const query = keterangan.toLowerCase().trim();
    return autoTextPresets.filter(item => 
      item.keterangan.toLowerCase().includes(query) && 
      item.keterangan.toLowerCase() !== query
    );
  }, [autoTextPresets, keterangan]);

  const handleSelectAutoTextPreset = (preset: any) => {
    setInputMode('MODAL_JUAL');
    setKeterangan(preset.keterangan);
    setNominal(preset.hargaModal.toString());
    setAdmin(preset.hargaJual.toString());
    setShowAutoTextModal(false);
    setAutoTextSearchQuery('');
  };

  // Refs for moving focus with Enter
  const selectSourceRef = React.useRef<HTMLSelectElement>(null);
  const selectTargetRef = React.useRef<HTMLSelectElement>(null);
  const nominalInputRef = React.useRef<HTMLInputElement>(null);
  const adminInputRef = React.useRef<HTMLInputElement>(null);
  const keteranganInputRef = React.useRef<HTMLTextAreaElement>(null);
  const submitButtonRef = React.useRef<HTMLButtonElement>(null);

  // Dual state for display formatted inputs (with dot thousands separators)
  const [displayNominal, setDisplayNominal] = useState('');
  const [displayAdmin, setDisplayAdmin] = useState('');

  // Keep display inputs synchronized when nominal/admin raw states update (especially from manual input or Auto isi)
  useEffect(() => {
    if (!nominal) {
      setDisplayNominal('');
    } else {
      setDisplayNominal(Number(nominal).toLocaleString('id-ID'));
    }
  }, [nominal]);

  useEffect(() => {
    if (!admin) {
      setDisplayAdmin('');
    } else {
      setDisplayAdmin(Number(admin).toLocaleString('id-ID'));
    }
  }, [admin]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  

  

  // Filter out hidden wallets
  const visibleWallets = wallets.filter(w => !w.isHidden);

  // Dynamically set smart default wallets & descriptions when category changes
  useEffect(() => {
    const digitalWallets = wallets.filter(w => w.id !== 'Bank08' && !w.isHidden);
    const firstDigitalId = digitalWallets.length > 0 ? digitalWallets[0].id : '';

    if (category === 'UANG DIGITAL') {
      setSourceWalletId(firstDigitalId); 
      setTargetWalletId('Bank08'); // default target represents incoming cash in hand
      setKeterangan('TRANSFER');
    } else if (category === 'TARIK TUNAI') {
      setSourceWalletId('Bank08'); // money leaves Laci Kasir
      setTargetWalletId(firstDigitalId); // money deposit into our digital account
      setKeterangan('TARIK TUNAI');
    } else {
      setSourceWalletId(''); // no source wallet needed for accessories (comes from shop inv)
      setTargetWalletId('Bank08');
      setKeterangan('PENJUALAN AKSESORIS');
    }
  }, [category, wallets]);



  const handleAutoDescription = () => {
    const srcName = wallets.find(w => w.id === sourceWalletId)?.name || 'STOK TOKO';
    const tgtName = wallets.find(w => w.id === targetWalletId)?.name || 'LACI KASIR';
    const parsedNominal = nominal ? Number(nominal) : 0;
    const parsedAdmin = inputMode === 'MODAL_JUAL' ? Math.max(0, (Number(admin) || 0) - parsedNominal) : (Number(admin) || 0);

    if (category === 'UANG DIGITAL') {
      setKeterangan(`TRANSFER ${formatRupiah(parsedNominal)} VIA ${srcName.toUpperCase()} (ADMIN RR: ${formatRupiah(parsedAdmin)})`);
    } else if (category === 'TARIK TUNAI') {
      setKeterangan(`TARIK TUNAI ${formatRupiah(parsedNominal)} VIA ${tgtName.toUpperCase()} (ADMIN HP: ${formatRupiah(parsedAdmin)})`);
    } else {
      setKeterangan(`AKSESORIS: ${formatRupiah(parsedNominal)}`);
    }
  };

  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedNominal = parseInt(nominal, 10);
    if (!parsedNominal || parsedNominal <= 0) {
      alert('Nominal transaksi harus lebih besar dari 0!');
      return;
    }

    let parsedAdmin = 0;
    if (inputMode === 'MODAL_JUAL') {
      const parsedJual = parseInt(admin, 10) || 0;
      if (parsedNominal > parsedJual) {
        alert('Transaksi ditolak: Harga modal tidak boleh lebih besar dari harga jual!');
        return;
      }
      parsedAdmin = Math.max(0, parsedJual - parsedNominal);
    } else {
      parsedAdmin = parseInt(admin, 10) || 0;
      if (parsedAdmin >= parsedNominal) {
        alert('Transaksi ditolak: Nominal transaksi harus lebih besar dari biaya admin!');
        return;
      }
    }

    addTransaction(
      [], // Empty shop items array
      parsedNominal,
      category === 'AKSESORIS' ? 'INCOME' : 'MUTASI',
      keterangan || `${category}`,
      {
        category,
        sourceWallet: category === 'AKSESORIS' ? undefined : sourceWalletId,
        targetWallet: targetWalletId,
        adminFee: parsedAdmin,
        adminNonTunai: adminNonTunai,
        isCustomService: true
      }
    );

    // Show luxurious floating/inline success indicator
    setSuccessMessage(`Berhasil menyimpan transaksi: "${keterangan || category}" senilai ${formatRupiah(parsedNominal)}`);
    
    // Reset core input states
    setNominal('');
    setAdmin('');
    setAdminNonTunai(false);

    // Automatically dismiss the success message
    const msgTimer = setTimeout(() => {
      setSuccessMessage('');
    }, 4500);

    return () => clearTimeout(msgTimer);
  };

  // Dynamic asset calculation
  const digitalAssetsSum = wallets
    .filter(w => w.id !== 'Bank08' && !w.isHidden)
    .reduce((sum, w) => sum + w.balance, 0);

  const laciKasirSum = wallets.find(w => w.id === 'Bank08')?.balance || 0;

  // Calculate Laba Stats
  const labaStats = useMemo(() => {
    const isSameDay = (d1: Date, d2: Date) => d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();
    const isSameMonth = (d1: Date, d2: Date) => d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0,0,0,0);

    let hariIni = 0;
    let seminggu = 0;
    let bulanIni = 0;

    const labaPerHariMap: Record<string, number> = {};

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      labaPerHariMap[dateStr] = 0;
    }

    transactions.forEach(t => {
      const d = new Date(t.date);
      const laba = t.adminFee || 0;
      
      if (isSameDay(d, now)) hariIni += laba;
      if (isSameMonth(d, now)) bulanIni += laba;
      if (d >= sevenDaysAgo) {
        seminggu += laba;
        const dateStr = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        if (labaPerHariMap[dateStr] !== undefined) {
          labaPerHariMap[dateStr] += laba;
        }
      }
    });

    const chartData = Object.entries(labaPerHariMap).map(([name, laba]) => ({ name, laba }));

    return { hariIni, seminggu, bulanIni, chartData };
  }, [transactions, now]);

  const dayName = now.toLocaleDateString('id-ID', { weekday: 'long' });
  const dateStr = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/:/g, '.');

  return (
    <div className="bg-slate-50 dark:bg-slate-900 min-h-full pb-20 transition-colors duration-300 [.pc-mode_&]:pb-6 [.pc-mode_&]:bg-transparent">
      {/* HEADER SECTION */}
      <div className="bg-[#1e3a8a] text-white pt-10 pb-[4.5rem] px-4 rounded-b-[2.5rem] relative [.pc-mode_&]:rounded-2xl [.pc-mode_&]:pb-8 [.pc-mode_&]:pt-6">
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-3">
              {/* Logo */}
              <div className="relative w-14 h-14 p-1 flex items-center justify-center bg-white rounded-xl shadow-md shrink-0 overflow-hidden">
                 <img src={storeLogo || "/icons/icon-192x192.png"} alt="Logo" className="w-full h-full object-contain" onError={(e) => {
                   e.currentTarget.src = '/icons/icon-192x192.png';
                 }} />
              </div>
             
             {/* Title Group */}
             <div>
               <h1 className="font-bold text-lg leading-none tracking-wide text-white uppercase">{storeName}</h1>
               <p className="text-[10px] text-blue-200 mt-1 font-semibold uppercase tracking-wider">{subStoreName}</p>
               <div className="flex items-center mt-2">
                 <span className="text-[11px] font-bold text-blue-100 uppercase tracking-wide">{dayName}, {dateStr}</span>
               </div>
             </div>
          </div>

          {/* Time & Menu */}
          <div className="text-right flex flex-col items-end">
             <button onClick={() => setShowSidePanel(true)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors mb-1 cursor-pointer [.pc-mode_&]:hidden">
                <MoreVertical size={16} className="text-white" />
             </button>
             <p className="text-xl font-black text-white mt-1">{timeStr}</p>
          </div>
        </div>
      </div>

      {/* OVERLAP BALANCE CARD */}
      <div className="px-4 -mt-12 relative z-10 [.pc-mode_&]:mt-[-2rem] [.pc-mode_&]:px-0">
        <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100 dark:border-slate-800 [.pc-mode_&]:rounded-2xl">
           <div className="flex justify-between items-start mb-4">
              <div>
                 <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1 tracking-wide">ASET DIGITAL</p>
                 <p className="text-xl font-black text-[#1e3a8a] tracking-tight">{formatRupiah(digitalAssetsSum)}</p>
              </div>
              <div className="text-right">
                 <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1 tracking-wide">SALDO LACI KASIR</p>
                 <p className="text-xl font-black text-emerald-500 tracking-tight">{formatRupiah(laciKasirSum)}</p>
              </div>
           </div>
           <div className="flex gap-2">
              <button onClick={() => setShowLabaDetail(true)} className="flex-1 bg-emerald-50 border border-emerald-100/50 hover:bg-emerald-100 py-3 px-4 rounded-3xl flex items-center justify-between transition-colors shadow-sm cursor-pointer select-none">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                       <TrendingUp size={16} strokeWidth={2.5} />
                    </div>
                    <div className="text-left font-sans">
                       <p className="text-[9px] font-bold text-emerald-600/80 uppercase tracking-widest leading-none mb-1">LABA HARI INI</p>
                       <p className="text-sm font-black text-emerald-700 leading-none">{formatRupiah(labaStats.hariIni)}</p>
                    </div>
                 </div>
                 <ChevronRight size={18} strokeWidth={3} className="text-emerald-400" />
              </button>
              
              <button onClick={() => navigate('/assets')} className="w-14 h-14 shrink-0 bg-[#1d4ed8] text-white flex items-center justify-center rounded-2xl active:bg-[#1e3a8a] transition-colors shadow-md shadow-blue-500/30 cursor-pointer select-none">
                 <ChevronRight size={22} strokeWidth={3} />
              </button>
           </div>
        </div>
      </div>

      {/* RUNNING TEXT ADVERTISEMENT MARQUEE */}
      <div className="px-5 mt-4 space-y-2 [.pc-mode_&]:px-0">
        <div className="w-full h-9 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 shadow-inner flex items-center overflow-hidden px-4 relative [.pc-mode_&]:rounded-xl">
          <div className="w-full overflow-hidden select-none flex items-center">
            <div className="w-max whitespace-nowrap flex-nowrap inline-flex items-center gap-4 animate-marquee text-[10px] font-bold text-slate-650 font-mono py-1">
              {/* Teks Biasa Bergantian */}
              {(wisdomText || '').split('\n').map(w => w.trim()).filter(w => w.length > 0).slice(0, 15).map((word, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && (
                    <span className="text-slate-300 dark:text-slate-600 shrink-0 select-none">✦</span>
                  )}
                  <div className="flex items-center shrink-0">
                    <span className="whitespace-nowrap">{word}</span>
                  </div>
                </React.Fragment>
              ))}

              {/* Fallback to simple announcement text if both are empty */}
              {!(wisdomText || '').trim() && (
                <span className="whitespace-nowrap shrink-0">{announcementText}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ICON MENUS */}
      <div className="flex justify-between px-6 mt-6 pb-2">
        <IconItem icon={FileText} onClick={() => navigate('/kasbon')} label="KASBON" color="bg-blue-600" />
        <IconItem icon={Contact} onClick={() => navigate('/contacts')} label="KONTAK" color="bg-blue-500" />
        <IconItem icon={Ticket} onClick={() => navigate('/vouchers')} label="VOUCHER" color="bg-orange-500" />
        <IconItem icon={Calculator} onClick={() => navigate('/pos')} label="POS KASIR" color="bg-blue-700" />
        <IconItem icon={MoreHorizontal} onClick={() => setShowLainnya(!showLainnya)} label="LAINNYA" color="bg-blue-900" />
      </div>

      {showLainnya && (
        <div className="flex justify-start gap-4 px-6 mt-2 mb-4 animate-in fade-in slide-in-from-top-4 duration-200 ease-out flex-wrap text-center">
          <IconItem icon={ClipboardList} onClick={() => navigate('/notes')} label="CATATAN" color="bg-blue-400" />
          <IconItem icon={TrendingUp} onClick={() => navigate('/reports/overview')} label="GRAFIK" color="bg-orange-500" />
          <IconItem icon={CalendarDays} onClick={() => navigate('/calendar')} label="KALENDER" color="bg-blue-300" />
          <IconItem icon={Printer} onClick={() => navigate('/nota')} label="NOTA" color="bg-slate-500" />
          <IconItem icon={Users} onClick={() => navigate('/kemitraan')} label="KEMITRAAN" color="bg-purple-600" />
        </div>
      )}

      {/* FLOATING SUCCESS MESSAGE */}
      {successMessage && (
        <div className="mx-4 mt-4 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-start gap-2.5 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={16} />
          <div className="flex-1">
            <p className="text-xs font-black uppercase tracking-wider mb-0.5">Sukses Simpan!</p>
            <p className="text-[11px] font-semibold text-emerald-700/90 leading-relaxed">{successMessage}</p>
          </div>
          <button onClick={() => setSuccessMessage('')} className="text-emerald-500 hover:text-emerald-800 p-0.5">
            <X size={14} />
          </button>
        </div>
      )}

      {/* MAIN TRANSACTION FORM */}
      <div className="mx-4 mt-4 bg-white dark:bg-slate-800 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100 dark:border-slate-800 p-5 mb-8 transform-gpu">
         {/* CATEGORY TITLE */}
         <div className="flex items-center gap-2 mb-4">
            <Tag size={13} strokeWidth={2.5} className="text-slate-400" /> 
            <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase">KATEGORI LAYANAN / TRANSAKSI</span>
         </div>
         
         {/* CATEGORY GRID */}
         <div className="grid grid-cols-3 gap-2 mb-6">
           <CategoryCard 
             active={category === 'UANG DIGITAL'} 
             onClick={() => setCategory('UANG DIGITAL')}
             icon={CreditCard} 
             label="UANG DIGITAL" 
             sub="Transfer, Topup, Pembayaran" 
           />
           <CategoryCard 
             active={category === 'TARIK TUNAI'} 
             onClick={() => setCategory('TARIK TUNAI')}
             icon={HandCoins} 
             label="TARIK TUNAI" 
             sub="Tarik Tunai Uang Nasabah"
           />
           <CategoryCard 
             active={category === 'AKSESORIS'} 
             onClick={() => setCategory('AKSESORIS')}
             icon={Package} 
             label="AKSESORIS" 
             sub="Penjualan Barang Fisik"
           />
         </div>

         <form onSubmit={handleSaveTransaction} className="flex flex-col gap-1">
           {/* BANK SELECTORS */}
           <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100/80 rounded-[1.25rem] px-3 py-2.5 flex flex-row gap-3">
              <div className="flex-1">
                 <p className="text-[9px] font-black text-slate-400 mb-1 flex items-center gap-1 tracking-wider uppercase">
                   <span className="bg-red-50 text-red-500 p-0.5 rounded-full"><MinusCircle size={10} strokeWidth={3}/></span> 
                   SUMBER KELUAR
                 </p>
                 {category === 'AKSESORIS' ? (
                   <div className="w-full bg-slate-100/70 border border-slate-200/50 py-2 rounded-xl text-xs font-bold text-slate-400 px-3 flex items-center justify-center h-10 select-none">
                     STOK TOKO (GUDANG)
                   </div>
                 ) : (
                   <select 
                     ref={selectSourceRef}
                     className="w-full bg-white dark:bg-slate-800 border border-slate-200/80 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm outline-none px-3 focus:ring-4 focus:ring-blue-100 focus:border-blue-400 cursor-pointer h-10 transform-gpu"
                     value={sourceWalletId}
                     onChange={(e) => setSourceWalletId(e.target.value)}
                     onKeyDown={(e) => {
                       if (e.key === 'Enter') {
                         e.preventDefault();
                         selectTargetRef.current?.focus();
                       }
                     }}
                   >
                     {visibleWallets.map(w => (
                       <option key={w.id} value={w.id}>{w.name.toUpperCase()}</option>
                     ))}
                   </select>
                 )}
              </div>
              <div className="flex-1">
                 <p className="text-[9px] font-black text-slate-400 mb-1 flex items-center gap-1 tracking-wider uppercase">
                   <span className="bg-[#f0fdf4] text-emerald-500 p-0.5 rounded-full"><PlusCircle size={10} strokeWidth={3}/></span>
                   TUJUAN MASUK
                 </p>
                 <select 
                   ref={selectTargetRef}
                   className="w-full bg-white dark:bg-slate-800 border border-slate-200/80 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm outline-none px-3 focus:ring-4 focus:ring-blue-100 focus:border-blue-400 cursor-pointer h-10 transform-gpu"
                   value={targetWalletId}
                   onChange={(e) => setTargetWalletId(e.target.value)}
                   onKeyDown={(e) => {
                     if (e.key === 'Enter') {
                       e.preventDefault();
                       keteranganInputRef.current?.focus();
                     }
                   }}
                 >
                   {visibleWallets.map(w => (
                     <option key={w.id} value={w.id}>{w.name.toUpperCase()}</option>
                   ))}
                 </select>
              </div>
           </div>

           {/* KETERANGAN */}
           <div className="relative">
              <div className="flex justify-between items-center mb-1">
                 <label className="text-[9px] font-black text-slate-400 tracking-wider uppercase">KETERANGAN / JURNAL</label>
                  <button 
                    type="button"
                    onClick={() => setShowAutoTextModal(true)}
                    className="flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 font-black text-[9px] uppercase px-2.5 py-1 rounded-lg border border-emerald-100 dark:border-emerald-900/50 transition-all select-none active:scale-95 cursor-pointer"
                  >
                    <Sparkles size={10} className="stroke-[3]" /> Auto Teks
                  </button>
              </div>
              <textarea 
                ref={keteranganInputRef}
                className="w-full border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:border-slate-600 rounded-2xl p-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 shadow-sm outline-none min-h-[50px] resize-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400" 
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    nominalInputRef.current?.focus();
                  }
                }}
                placeholder="Tulis keterangan transaksi di sini..."
               />

                {/* CUSTOM AUTO-TEKS INLINE SUGGESTIONS */}
                {inlineMatchingAutoTexts.length > 0 && (
                  <div className="mt-2.5 p-2.5 bg-emerald-50/75 dark:bg-slate-900/40 border border-emerald-100/40 dark:border-slate-800 rounded-2xl space-y-2 animate-fade-in max-h-48 overflow-y-auto select-none z-10 relative">
                    <div className="flex items-center gap-1.5 px-0.5 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span className="text-[8.5px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">Saran Auto-Teks ({inlineMatchingAutoTexts.length}):</span>
                    </div>
                    <div className="grid grid-cols-1 divide-y divide-emerald-100/40 dark:divide-slate-850 bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-emerald-100/40 dark:border-slate-800">
                      {inlineMatchingAutoTexts.map((item) => {
                        const laba = item.hargaJual - item.hargaModal;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleSelectAutoTextPreset(item)}
                            className="w-full text-left p-2.5 hover:bg-emerald-50/40 dark:hover:bg-slate-800/80 flex justify-between items-center transition-all cursor-pointer select-none active:scale-[0.98]"
                          >
                            <div className="pr-2 text-left">
                              <p className="text-[10.5px] font-bold text-slate-800 dark:text-slate-100">{item.keterangan}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-[8px] font-black bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded font-mono">
                                MODAL:{formatK(item.hargaModal)} | JUAL:{formatK(item.hargaJual)}
                              </span>
                              <p className="text-[7.5px] font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 uppercase tracking-wide font-mono">
                                LABA:+{formatRupiah(laba)}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

               {/* QUICK PRESET AND TEXT BUTTONS */}
               {false && (
                 <div className="mt-2.5 space-y-2 select-none">
                   
                   {/* Quick Presets */}
                   <div className="flex flex-wrap gap-1.5 items-center">
                     {/* Preset Trx: */}
                     {presets.map((p) => {
                     const modalPrice = p.nominal || 0;
                      const jualPrice = p.hargaJual || (p.nominal + (p.adminFee || 0));
                      const isSelected = nominal === modalPrice.toString() && admin === (jualPrice - modalPrice).toString() && keterangan === p.label;
                     return (
                       <button
                         key={p.id}
                         type="button"
                         onClick={() => {
                              setInputMode('NOMINAL_ADMIN');
                           setNominal(p.nominal.toString());
                           setAdmin(p.adminFee.toString());
                            setKeterangan(p.label);
                            setNominal(modalPrice.toString());
                            setAdmin((jualPrice - modalPrice).toString());
                            const catMappedSelected = (p.category === 'TARIK TUNAI') ? 'TARIK TUNAI' : 'UANG DIGITAL';
                            setCategory(catMappedSelected);
                            return; // Early return globally for any preset click
                           
                           // Instantly run auto content description generator
                           const srcName = wallets.find(w => w.id === sourceWalletId)?.name || 'STOK TOKO';
                           const tgtName = wallets.find(w => w.id === targetWalletId)?.name || 'LACI KASIR';
                           if (category === 'UANG DIGITAL') {
                             setKeterangan(p.label);
                              setNominal(modalPrice.toString());
                              setAdmin((jualPrice - modalPrice).toString());
                              const catMappedSelected = (p.category === 'TARIK TUNAI') ? 'TARIK TUNAI' : 'UANG DIGITAL';
                              setCategory(catMappedSelected);
                              return; // Bypass original script
                           } else if (category === 'TARIK TUNAI') {
                             setKeterangan(`TARIK TUNAI ${formatRupiah(p.nominal)} VIA ${tgtName.toUpperCase()} (ADMIN HP: ${formatRupiah(p.adminFee)})`);
                           } else {
                             setKeterangan(`AKSESORIS: ${formatRupiah(p.nominal)}`);
                           }
                         }}
                         className={`px-2.5 py-1 text-[9.5px] font-bold rounded-xl border transition-all cursor-pointer select-none active:scale-95 flex items-center gap-1
                           ${isSelected
                             ? 'bg-blue-600 text-white border-blue-600'
                             : 'bg-white dark:bg-slate-800 text-blue-600 border-blue-200 hover:bg-blue-50'
                           }
                         `}
                       >
                         <span>{p.label}</span>
                         <span className={`text-[8px] font-mono opacity-80 ${isSelected ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'}`}>
                           ({formatK(jualPrice)})
                         </span>
                       </button>
                     );
                   })}
                 </div>
               </div>
               )}
             </div>
             
             {/* HIDDEN INPUT FOR RESIDUAL BYPASS */}
             <div className="hidden">
               <textarea className="hidden"
              />
           </div>

           {/* INPUT MODE TOGGLE */}
           <div className="flex items-center gap-2">
             <div className="flex flex-1 rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
                <button 
                  type="button"
                  onClick={() => setInputMode('NOMINAL_ADMIN')}
                  className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${inputMode === 'NOMINAL_ADMIN' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  NOMINAL & ADMIN
                </button>
                <button 
                  type="button"
                  onClick={() => setInputMode('MODAL_JUAL')}
                  className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${inputMode === 'MODAL_JUAL' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  MODAL & JUAL
                </button>
             </div>
             <button 
               type="button" 
               onClick={() => setShowModeInfo(true)}
               className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-blue-500 rounded-xl transition-all active:scale-95 flex-shrink-0"
               aria-label="Informasi Input Mode"
             >
               <Info size={16} strokeWidth={2.5} />
             </button>
           </div>

           {/* NOMINAL & ADMIN */}
           <div className="flex gap-4">
              <div className="flex-1">
                 <label className="text-[9px] font-black text-slate-400 mb-1 block tracking-wider uppercase">
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
                        const rawVal = e.target.value.replace(/\D/g, '');
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
                 <div className="flex justify-between items-center mb-1 h-[14px]">
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
                        const rawVal = e.target.value.replace(/\D/g, '');
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
           </div>

           {/* SUBMIT BUTTON */}
           <button 
             type="submit" 
             ref={submitButtonRef}
             className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-black text-xs py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-md shadow-orange-500/15 uppercase tracking-widest cursor-pointer mt-2 hover:shadow-lg hover:shadow-orange-500/20"
           >
             <Save size={13} className="text-white" strokeWidth={3} /> Simpan Transaksi
           </button>
            
         </form>
      </div>

      {/* LABA DETAIL MODAL */}
      {showLabaDetail && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center bg-black/40 backdrop-blur-sm animate-fade-in print:hidden">
          <div className="bg-white dark:bg-slate-800 w-full sm:w-[400px] sm:rounded-3xl rounded-t-3xl min-h-[50vh] max-h-[90vh] flex flex-col shadow-2xl animate-slide-up sm:animate-fade-in-up pb-[env(safe-area-inset-bottom)] overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-emerald-50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shadow-md">
                   <TrendingUp size={20} className="text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <h2 className="font-extrabold text-sm text-emerald-950 uppercase tracking-widest">Detail Laba Usaha</h2>
                  <p className="text-[10px] font-bold text-emerald-700/80 uppercase">Rangkuman Keuntungan Berjalan</p>
                </div>
              </div>
              <button 
                onClick={() => setShowLabaDetail(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-emerald-200/50 hover:bg-emerald-200 text-emerald-800 transition-colors cursor-pointer"
                title="Tutup"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto w-full p-5 space-y-4">
              <div className="bg-white dark:bg-slate-800 border-2 border-emerald-50 p-4 rounded-2xl flex items-center justify-between shadow-sm">
                 <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none">Hari Ini</p>
                 <p className="text-xl font-black text-emerald-600 leading-none">{formatRupiah(labaStats.hariIni)}</p>
              </div>
              <div className="bg-white dark:bg-slate-800 border-2 border-blue-50 p-4 rounded-2xl flex items-center justify-between shadow-sm">
                 <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none">7 Hari Terakhir</p>
                 <p className="text-xl font-black text-blue-600 leading-none">{formatRupiah(labaStats.seminggu)}</p>
              </div>
              <div className="bg-white dark:bg-slate-800 border-2 border-purple-50 p-4 rounded-2xl flex items-center justify-between shadow-sm">
                 <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none">Bulan Ini</p>
                 <p className="text-xl font-black text-purple-600 leading-none">{formatRupiah(labaStats.bulanIni)}</p>
              </div>

              <div className="pt-4 mt-2 w-full h-[220px]">
                 <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Grafik Laba (7 Hari)</h3>
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={labaStats.chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                       <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} dy={10} />
                       <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} tickFormatter={(val) => formatK(val)} dx={-10} />
                       <RechartsTooltip 
                         cursor={{fill: '#f1f5f9'}}
                         contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold', padding: '12px' }}
                         formatter={(value: number) => [formatRupiah(value), "Laba"]}
                         labelStyle={{ color: '#64748b', marginBottom: '4px', fontWeight: 'bold', fontSize: '10px', textTransform: 'uppercase' }}
                       />
                       <Bar dataKey="laba" fill="#10b981" radius={[4, 4, 0, 0]} barSize={24} />
                    </BarChart>
                 </ResponsiveContainer>
              </div>
              <div className="h-4"></div>
            </div>
          </div>
        </div>
      )}

      {/* SIDE PANEL SETTINGS */}
      {showSidePanel && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm animate-fade-in print:hidden" 
            onClick={() => setShowSidePanel(false)}
          />
          {/* Panel */}
          <div className="fixed top-0 right-0 z-[210] h-full w-[85%] max-w-[320px] bg-white dark:bg-slate-900 shadow-2xl animate-slide-in-right flex flex-col print:hidden">
             <div className="bg-[#1e3a8a] text-white p-6 rounded-bl-3xl shadow-md relative">
                <button onClick={() => setShowSidePanel(false)} className="absolute top-4 right-4 text-white/70 hover:text-white p-2">
                   <X size={20} strokeWidth={2.5} />
                </button>
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center p-2 mb-4 shadow-sm">
                   <img src={storeLogo || "/icons/icon-192x192.png"} alt="Logo" className="w-full h-full object-contain" onError={(e) => {
                     e.currentTarget.src = '/icons/icon-192x192.png';
                   }} />
                </div>
                <h2 className="text-xl font-black uppercase tracking-wide leading-tight">{storeName}</h2>
                <div className="mt-4 pt-4 border-t border-white/20">
                   <p className="text-[11px] font-bold tracking-widest uppercase text-blue-100">{dateStr}</p>
                   <p className="text-2xl font-black font-mono tracking-tight text-amber-400 mt-1">{timeStr}</p>
                </div>
             </div>

             <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
                {/* Update Aplikasi */}
                <div>
                  <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">TINDAKAN SISTEM</h3>
                  <AppInstaller />
                </div>

                {/* Theme Setting */}
                <div>
                  <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">TEMA TAMPILAN</h3>
                  <div className="flex bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-1 transition-colors duration-300">
                     <button 
                       onClick={() => setUiTheme('light')} 
                       className={`flex-1 py-3 flex items-center justify-center gap-2 rounded-lg text-xs font-bold transition-all ${uiTheme === 'light' ? 'bg-[#1e3a8a] text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700'}`}
                     >
                        <Sun size={14} /> Terang
                     </button>
                     <button 
                       onClick={() => setUiTheme('dark')} 
                       className={`flex-1 py-3 flex items-center justify-center gap-2 rounded-lg text-xs font-bold transition-all ${uiTheme === 'dark' ? 'bg-[#1e3a8a] text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700'}`}
                     >
                        <Moon size={14} /> Gelap
                     </button>
                  </div>
                </div>

                {/* Layout Setting */}
                <div>
                  <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">MODE TATA LETAK</h3>
                  <div className="grid grid-cols-3 gap-2">
                     <button 
                       onClick={() => setUiLayout('hp')} 
                       className={`py-4 flex flex-col items-center justify-center gap-2 rounded-xl border transition-all ${uiLayout === 'hp' ? 'bg-blue-50 dark:bg-blue-900/40 border-blue-200 dark:border-blue-800 text-[#1e3a8a] dark:text-blue-400 shadow-sm ring-1 ring-blue-100 dark:ring-blue-900' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-700'}`}
                     >
                        <Smartphone size={18} strokeWidth={uiLayout === 'hp' ? 2.5 : 2} />
                        <span className="text-[9px] font-black uppercase tracking-wider">HP</span>
                     </button>
                     <button 
                       onClick={() => setUiLayout('tablet')} 
                       className={`py-4 flex flex-col items-center justify-center gap-2 rounded-xl border transition-all ${uiLayout === 'tablet' ? 'bg-blue-50 dark:bg-blue-900/40 border-blue-200 dark:border-blue-800 text-[#1e3a8a] dark:text-blue-400 shadow-sm ring-1 ring-blue-100 dark:ring-blue-900' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-700'}`}
                     >
                        <Tablet size={18} strokeWidth={uiLayout === 'tablet' ? 2.5 : 2} />
                        <span className="text-[9px] font-black uppercase tracking-wider">Tablet</span>
                     </button>
                     <button 
                       onClick={() => setUiLayout('pc')} 
                       className={`py-4 flex flex-col items-center justify-center gap-2 rounded-xl border transition-all ${uiLayout === 'pc' ? 'bg-blue-50 dark:bg-blue-900/40 border-blue-200 dark:border-blue-800 text-[#1e3a8a] dark:text-blue-400 shadow-sm ring-1 ring-blue-100 dark:ring-blue-900' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-700'}`}
                     >
                        <Monitor size={18} strokeWidth={uiLayout === 'pc' ? 2.5 : 2} />
                        <span className="text-[9px] font-black uppercase tracking-wider">PC</span>
                     </button>
                  </div>
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 dark:text-slate-400 mt-4 font-semibold leading-relaxed text-center">
                     Pilih mode susunan UI untuk pratinjau yang paling sesuai dengan preferensi kenyamanan Anda.
                  </p>
                </div>

                
             </div>
             
             <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-800 dark:border-slate-700 transition-colors duration-300">
                <button onClick={() => setShowSidePanel(false)} className="w-full bg-slate-100 dark:bg-slate-800 dark:bg-slate-700 text-slate-700 dark:text-slate-200 dark:text-slate-300 font-bold text-xs py-4 rounded-xl uppercase tracking-widest active:bg-slate-200 dark:active:bg-slate-600 transition-colors">
                   Tutup Panel
                </button>
             </div>
          </div>
        </>
      )}

      {/* Modal Mode Info */}
      {showModeInfo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <div className="bg-blue-600 dark:bg-blue-800 p-5 text-center text-white relative">
              <button onClick={() => setShowModeInfo(false)} className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors bg-black/20 rounded-full p-1 active:scale-95">
                <X size={16} />
              </button>
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 backdrop-blur-md">
                 <Info size={24} className="text-white" strokeWidth={2.5}/>
              </div>
              <h3 className="font-black text-sm tracking-wider uppercase">Info Pilihan Mode</h3>
            </div>
            
            <div className="p-5 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2 text-blue-600 dark:text-blue-400">
                  <div className="bg-blue-100 dark:bg-blue-900/50 p-1.5 rounded-lg"><Info size={14} strokeWidth={3}/></div>
                  <h4 className="font-black text-[11px] uppercase tracking-wider">NOMINAL & ADMIN</h4>
                </div>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 font-bold leading-relaxed pl-8">
                  Pilihan ini ideal untuk pencatatan transaksi <span className="font-black text-slate-800 dark:text-white">Transfer Uang</span> dan <span className="font-black text-slate-800 dark:text-white">Top Up E-Wallet</span>. 
                  Masukkan <span className="text-blue-600 dark:text-blue-400">nominal uang</span> yang masuk ke Dompet Digital dan <span className="text-blue-600 dark:text-blue-400">biaya admin</span> secara terpisah.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-2 text-emerald-600 dark:text-emerald-400">
                  <div className="bg-emerald-100 dark:bg-emerald-900/50 p-1.5 rounded-lg"><Package size={14} strokeWidth={3}/></div>
                  <h4 className="font-black text-[11px] uppercase tracking-wider">MODAL & JUAL</h4>
                </div>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 font-bold leading-relaxed pl-8">
                  Sangat cocok untuk transaksi <span className="font-black text-slate-800 dark:text-white">PPOB (Pulsa, Paket Data, Token)</span> atau Penjualan Barang. 
                  Catat <span className="text-emerald-600 dark:text-emerald-400">harga beli (modal)</span> dan <span className="text-emerald-600 dark:text-emerald-400">harga jual</span>; laba otomatis terakumulasi.
                </p>
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-slate-800 flex justify-center">
              <button onClick={() => setShowModeInfo(false)} className="w-full py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-black text-[11px] uppercase tracking-wider transition-colors active:scale-95">
                LANJUTKAN
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL AUTO-TEKS SEARCH POPUP */}
      {showAutoTextModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[80vh]">
            <div className="bg-emerald-600 dark:bg-emerald-800 p-5 text-white relative shrink-0">
              <button 
                onClick={() => {
                  setShowAutoTextModal(false);
                  setAutoTextSearchQuery('');
                }} 
                className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors bg-black/20 rounded-full p-1 active:scale-95 cursor-pointer"
              >
                <X size={15} />
              </button>
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-3 backdrop-blur-md">
                 <Sparkles size={18} className="text-white" strokeWidth={2.5}/>
              </div>
              <h3 className="font-black text-xs tracking-widest uppercase">CARI AUTO-TEKS</h3>
              <p className="text-[10px] text-emerald-100/90 font-medium mt-1">Pilih preset untuk menginput Keterangan, Modal, & Harga Jual otomatis.</p>
            </div>
            
            {/* Input pencarian */}
            <div className="p-3 border-b border-slate-150 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex items-center gap-2.5 shrink-0">
              <Search size={15} className="text-emerald-500 shrink-0" strokeWidth={2.5} />
              <input 
                type="text"
                autoFocus
                value={autoTextSearchQuery}
                onChange={(e) => setAutoTextSearchQuery(e.target.value)}
                placeholder="Cari preset auto-teks..."
                className="w-full text-xs font-bold bg-transparent outline-none border-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
              />
              {autoTextSearchQuery && (
                <button 
                  onClick={() => setAutoTextSearchQuery('')} 
                  className="text-[10px] font-black text-rose-500 hover:text-rose-600 uppercase"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Hasil list */}
            <div className="p-2 divide-y divide-slate-100 dark:divide-slate-800 overflow-y-auto flex-1 max-h-[40vh] bg-white dark:bg-slate-800 font-sans">
              {filteredAutoTexts.length === 0 ? (
                <div className="p-6 text-center text-slate-400 dark:text-slate-500 text-xs">
                  <p className="font-bold">Tidak ada preset auto-teks.</p>
                  <button 
                    onClick={() => {
                      setShowAutoTextModal(false);
                      navigate('/account');
                    }}
                    className="mt-3 px-3 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 rounded-xl font-black text-[9px] uppercase tracking-wider transition-all"
                  >
                    Atur Auto-Teks klik disini
                  </button>
                </div>
              ) : (
                filteredAutoTexts.map((item) => {
                  const laba = item.hargaJual - item.hargaModal;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectAutoTextPreset(item)}
                      className="w-full text-left p-2.5 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-2xl flex justify-between items-center transition-all cursor-pointer select-none active:scale-[0.98] mt-0.5"
                    >
                      <div className="pr-2 text-left">
                        <p className="text-[10px] font-extrabold text-slate-800 dark:text-slate-100 leading-tight">{item.keterangan}</p>
                        <p className="text-[8px] font-black text-emerald-600 dark:text-emerald-400 mt-1 uppercase tracking-wider font-mono">
                          LABA: +{formatRupiah(laba)}
                        </p>
                      </div>
                      <div className="text-right shrink-0 flex flex-col gap-0.5 font-mono">
                        <span className="text-[8px] font-black bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded leading-none text-center">
                          M: {formatRupiah(item.hargaModal)}
                        </span>
                        <span className="text-[8px] font-black bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded leading-none text-center mt-0.5">
                          J: {formatRupiah(item.hargaJual)}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between shrink-0 text-[8.5px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
              <span>Total: {filteredAutoTexts.length} preset</span>
              <button 
                onClick={() => {
                  setShowAutoTextModal(false);
                  navigate('/account');
                }}
                className="hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors uppercase cursor-pointer"
              >
                + KELOLA PRESET
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deleted old update modal */}
    </div>
  );
}

function IconItem({ icon: Icon, label, color, onClick }: any) {
  return (
    <div className="flex flex-col items-center gap-2 cursor-pointer active:scale-95 transition-transform" onClick={onClick}>
      <div className={`w-[3.25rem] h-[3.25rem] rounded-full ${color} text-white flex items-center justify-center shadow-md`}>
        <Icon size={20} strokeWidth={2.5} />
      </div>
      <span className="text-[10px] font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide">{label}</span>
    </div>
  );
}

function CategoryCard({ active, icon: Icon, label, sub, onClick }: any) {
  return (
    <div 
      onClick={onClick}
      className={`flex flex-col items-center justify-center text-center p-3 rounded-2xl border transition-all cursor-pointer active:scale-95 min-h-[96px]
        ${active 
          ? 'bg-[#1e3a8a] border-[#1e3a8a] text-white shadow-lg' 
          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:bg-slate-900'
        }
      `}
    >
      <Icon size={20} strokeWidth={active ? 2.5 : 2} className={active ? 'text-yellow-400 mb-1.5' : 'text-slate-400 mb-1.5'} />
      <span className={`text-[10px] leading-tight tracking-wide ${active ? 'font-black' : 'font-bold text-slate-600 dark:text-slate-300'}`}>{label}</span>
      {sub && <span className={`text-[7px] mt-1 leading-[1.2] ${active ? 'text-blue-200 font-bold' : 'hidden md:block'}`}>{sub}</span>}
    </div>
  );
}
