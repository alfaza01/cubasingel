import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { useLicense } from '../context/LicenseContext';
import { 
  Wallet, ShieldCheck, Sun, ArrowRightLeft, Send, 
  CircleAlert, CheckCircle2, ChevronDown, ChevronUp, Info, Scale, PenSquare, 
  DollarSign, Landmark, HelpCircle, Box, Edit2, EyeOff, Eye, MoveUp, MoveDown, Save, X, Lock, RefreshCcw
} from 'lucide-react';
import { Transaction, WalletNode } from '../types';

export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

export function Assets() {
  const { transactions, wallets, balance, addTransaction, updateWalletRealBalance, updateWalletsList, storeName, subStoreName, autoResetLaciKasir, setAutoResetLaciKasir } = useStore();
  const { isPro, isTrialActive, trialDaysLeft, waNumber } = useLicense();
  const [now, setNow] = useState(new Date());

  const [isEditingWallets, setIsEditingWallets] = useState(false);
  const [tempWallets, setTempWallets] = useState<WalletNode[]>([]);
  const [showLicenseAlert, setShowLicenseAlert] = useState(false);

  const [showSaldoHP, setShowSaldoHP] = useState(false);
  const [activeTab, setActiveTab] = useState<'daftar' | 'penyesuaian'>('daftar');

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const dayName = now.toLocaleDateString('id-ID', { weekday: 'long' });
  const fullDate = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const clockStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/:/g, '.');

  const [showRiwayatMutasi, setShowRiwayatMutasi] = useState(false);
  const [modalType, setModalType] = useState<'MODAL_PAGI' | 'TAMBAH_SALDO' | 'PINDAH_SALDO' | null>(null);
  const [modNominal, setModNominal] = useState('');
  const [modSumber, setModSumber] = useState('');
  const [modTujuan, setModTujuan] = useState('');
  const [targetKasir, setTargetKasir] = useState('');
  const [adjustWalletId, setAdjustWalletId] = useState<string | null>(null);
  const [adjustType, setAdjustType] = useState<'tambah' | 'kurang'>('tambah');
  const [adjustNominal, setAdjustNominal] = useState('');
  const [adjustKeterangan, setAdjustKeterangan] = useState('');
  
  const [showSaldoRealModal, setShowSaldoRealModal] = useState(false);
  const [inputSaldoReal, setInputSaldoReal] = useState('');
  const [inputSaldoRealKeterangan, setInputSaldoRealKeterangan] = useState('');
  const [realBalancesInputs, setRealBalancesInputs] = useState<Record<string, string>>({});

  const formatRupiah = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

  const handleRealBalanceInputChange = (walletId: string, val: string) => {
    const clean = val.replace(/\D/g, '');
    setRealBalancesInputs(prev => ({
      ...prev,
      [walletId]: clean
    }));

    const numVal = parseInt(clean, 10);
    updateWalletRealBalance(walletId, isNaN(numVal) ? 0 : numVal);
  };

  const handleRowAutoReconcile = (walletId: string, walletName: string, difference: number) => {
    const absDiff = Math.abs(difference);
    if (difference > 0) {
      addTransaction(
        [],
        absDiff,
        'MUTASI',
        `Penyesuaian Saldo (+) ${walletName} agar Klop dengan M-Banking`,
        {
          targetWallet: walletId,
          category: 'PENYESUAIAN'
        }
      );
    } else if (difference < 0) {
      addTransaction(
        [],
        absDiff,
        'MUTASI',
        `Penyesuaian Saldo (-) ${walletName} agar Klop dengan M-Banking`,
        {
          sourceWallet: walletId,
          category: 'PENYESUAIAN'
        }
      );
    }

    const currentWallet = wallets.find(w => w.id === walletId);
    const originBalance = currentWallet ? currentWallet.balance : 0;
    const nextRealBalance = originBalance + difference;

    updateWalletRealBalance(walletId, nextRealBalance);
    setRealBalancesInputs(prev => {
      const updated = { ...prev };
      delete updated[walletId];
      return updated;
    });
  };

  const handleSaveAdjust = () => {
    const cleanNomVal = adjustNominal.replace(/\D/g, '');
    const nom = parseInt(cleanNomVal, 10);
    if (!nom || !adjustWalletId) return;
    
    if (adjustType === 'tambah') {
      addTransaction([], nom, 'MUTASI', adjustKeterangan || 'Penyesuaian Saldo (+)', { targetWallet: adjustWalletId });
    } else {
      addTransaction([], nom, 'MUTASI', adjustKeterangan || 'Penyesuaian Saldo (-)', { sourceWallet: adjustWalletId });
    }
    setAdjustWalletId(null);
    setAdjustNominal('');
  };

  const processModal = () => {
    const cleanModVal = modNominal.replace(/\D/g, '');
    const nom = parseInt(cleanModVal, 10);
    if (!nom) return;

    if (modalType === 'MODAL_PAGI') {
      addTransaction([], nom, 'MODAL_PAGI', 'SET MODAL AWAL', { targetWallet: modTujuan });
    } else if (modalType === 'TAMBAH_SALDO') {
      addTransaction([], nom, 'TAMBAH_SALDO', 'TAMBAH SALDO BANK', { targetWallet: modTujuan });
    } else if (modalType === 'PINDAH_SALDO') {
      addTransaction([], nom, 'PINDAH_SALDO', 'PINDAH SALDO ANTAR DOMPET', { sourceWallet: modSumber, targetWallet: modTujuan });
    }
    setModalType(null);
    setModNominal('');
    setModSumber('');
    setModTujuan('');
  };

  const getIconForWallet = (name: string) => {
    const n = name.toUpperCase();
    if (n.includes('BANK')) return <Landmark size={18} className="text-blue-500" />;
    return <Wallet size={18} className="text-sky-500" />;
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-900 min-h-full pb-24 overflow-y-auto hide-scrollbar">
      {/* HEADER */}
      <div className="bg-gradient-to-br from-blue-700 to-blue-800 rounded-b-[2rem] shadow-md w-full relative pb-10">
        <div className="px-5 pt-10 pb-4 flex items-center justify-between gap-3">
             <div className="flex-1 flex items-center gap-3">
             <div className="relative w-12 h-12 flex items-center justify-center bg-orange-500 rounded-full shadow-md shrink-0">
                <Box size={20} className="text-white z-10" strokeWidth={2.5} />
             </div>
             <div>
               <h1 className="text-[13px] font-black text-white leading-tight uppercase tracking-widest">{storeName}</h1>
               <p className="text-blue-200 text-[8px] font-bold uppercase tracking-tighter opacity-80">{subStoreName}</p>
               <div className="flex items-center gap-1 mt-1">
                 <span className="text-white text-[10px] font-black">Owner</span>
                 <span className="bg-amber-400 text-amber-900 text-[7px] px-1.5 py-0.5 rounded-full font-black">OWNER</span>
               </div>
             </div>
          </div>
          <div className="text-right">
             <p className="text-blue-200 text-[8px] font-bold uppercase tracking-widest leading-none mb-1">{dayName}</p>
             <p className="text-white text-[10px] font-black tracking-tight leading-none mb-1">{fullDate}</p>
             <p className="text-white text-xs font-black tabular-nums tracking-widest">{clockStr}</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-10 relative z-10 w-full mb-6">
        <div className="bg-gradient-to-br from-blue-800 to-blue-600 text-white p-6 rounded-3xl shadow-lg shadow-blue-500/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
          <div className="relative flex justify-between items-end mb-4">
            <div>
              <p className="text-blue-100 text-[10px] font-black uppercase tracking-widest mb-1 opacity-90 flex flex-wrap items-center gap-1.5">
                <Wallet size={12} /> Total Saldo Keseluruhan
                {isTrialActive && (
                  <span className="bg-amber-400 text-amber-955 text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase animate-pulse">
                    TRIAL PRO: {trialDaysLeft} HARI LAGI
                  </span>
                )}
              </p>
              <h2 className="font-black text-3xl tracking-tight">{formatRupiah(balance)}</h2>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <Landmark size={20} />
            </div>
          </div>
          
          <div className="relative grid grid-cols-3 gap-2.5 pt-3 border-t border-white/10">
            <button onClick={() => { if(isPro) { setModalType('MODAL_PAGI'); if (wallets.length > 0) setModTujuan(wallets[0].id); } else { setShowLicenseAlert(true); } }} className={`bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-xl py-2.5 px-2 flex flex-col items-center justify-center gap-1.5 transition-all active:scale-[0.98] ${!isPro ? 'opacity-50 grayscale' : ''}`}>
              {!isPro ? <Lock size={15} className="text-white" /> : <Sun size={15} className="text-amber-300" />}
              <span className="text-[9px] font-black uppercase tracking-wider text-center leading-snug">Modal Pagi</span>
            </button>
            <button onClick={() => { if(isPro) { setModalType('TAMBAH_SALDO'); if (wallets.length > 0) setModTujuan(wallets[0].id); } else { setShowLicenseAlert(true); } }} className={`bg-white/10 hover:bg-white/20 active:bg-white/30 text-emerald-400 rounded-xl py-2.5 px-2 flex flex-col items-center justify-center gap-1.5 transition-all active:scale-[0.98] ${!isPro ? 'opacity-50 grayscale' : ''}`}>
              {!isPro ? <Lock size={15} className="text-white" /> : <DollarSign size={15} className="text-emerald-400" />}
              <span className="text-[9px] font-black uppercase tracking-wider text-center leading-snug text-white">Tambah Saldo</span>
            </button>
            <button onClick={() => { if(isPro) { setModalType('PINDAH_SALDO'); } else { setShowLicenseAlert(true); } }} className={`bg-white/10 hover:bg-white/20 active:bg-white/30 text-blue-300 rounded-xl py-2.5 px-2 flex flex-col items-center justify-center gap-1.5 transition-all active:scale-[0.98] ${!isPro ? 'opacity-50 grayscale' : ''}`}>
              {!isPro ? <Lock size={15} className="text-white" /> : <ArrowRightLeft size={15} className="text-blue-300" />}
              <span className="text-[9px] font-black uppercase tracking-wider text-center leading-snug text-white">Pindah Saldo</span>
            </button>
          </div>
        </div>
      </div>

      <div className="px-4">
        {/* Toggle Halaman Tab */}
        <div className="bg-slate-200/50 p-1.5 rounded-2xl flex gap-1.5 mb-5 shadow-inner">
          <button
            type="button"
            onClick={() => setActiveTab('daftar')}
            className={cn(
              "flex-1 py-3 text-center rounded-xl font-black text-[10px] uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-1.5",
              activeTab === 'daftar'
                ? "bg-white dark:bg-slate-800 text-blue-700 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-100"
            )}
          >
            <Wallet size={12} className="shrink-0" />
            1. Daftar Aset ({wallets.filter(w => !w.isHidden).length})
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('penyesuaian');
              setShowSaldoHP(true);
            }}
            className={cn(
              "flex-1 py-3 text-center rounded-xl font-black text-[10px] uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-1.5",
              activeTab === 'penyesuaian'
                ? "bg-white dark:bg-slate-800 text-blue-700 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-850"
            )}
          >
            <Scale size={12} className="shrink-0 text-blue-500" />
            2. Jurnal Penyesuaian
          </button>
        </div>

        {/* SETTING AUTO RESET LACI KASIR */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 mb-5">
           <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                 <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors", autoResetLaciKasir ? "bg-blue-100 text-blue-600" : "bg-slate-100 dark:bg-slate-700 text-slate-400")}>
                    <RefreshCcw size={18} className={autoResetLaciKasir ? "animate-[spin_4s_linear_infinite]" : ""} />
                 </div>
                 <div>
                    <h3 className="text-[11px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest leading-none mb-1">
                       Tutup Buku Laci Harian
                    </h3>
                    <p className="text-[9px] font-medium text-slate-500 dark:text-slate-400 leading-tight">
                       Mereset saldo Laci Kasir menjadi 0 setiap berganti hari / buka toko besok.
                    </p>
                 </div>
              </div>
              <button 
                 onClick={() => setAutoResetLaciKasir(!autoResetLaciKasir)}
                 className={cn(
                    "relative w-12 h-6 md:w-14 md:h-7 rounded-full p-1 transition-all duration-300 ease-in-out flex items-center shadow-inner shrink-0 cursor-pointer",
                    autoResetLaciKasir ? 'bg-gradient-to-r from-blue-500 to-indigo-500 border border-blue-400' : 'bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600'
                 )}
              >
                 <span className={cn("text-[8px] font-black absolute transition-opacity duration-300 uppercase", autoResetLaciKasir ? 'opacity-100 text-white left-2' : 'opacity-0 right-2')}>ON</span>
                 <div className={cn("bg-white w-4 h-4 md:w-5 md:h-5 rounded-full shadow-md transform transition-transform duration-300 ease-out z-10", autoResetLaciKasir ? 'translate-x-[22px] md:translate-x-[26px]' : 'translate-x-0')}></div>
                 <span className={cn("text-[8px] font-black absolute transition-opacity duration-300 uppercase", autoResetLaciKasir ? 'opacity-0 left-2' : 'opacity-100 text-slate-500 dark:text-slate-400 right-2')}>OFF</span>
              </button>
           </div>
        </div>

        {activeTab === 'daftar' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center justify-between mb-4 px-1 mt-4">
              <h3 className="font-black text-slate-800 dark:text-slate-100 text-[12px] uppercase tracking-wider flex items-center gap-2">
                <Wallet className="text-blue-600" size={14} /> Daftar Dompet Digital
              </h3>
          {isEditingWallets ? (
            <div className="flex items-center gap-2">
                <button onClick={() => setIsEditingWallets(false)} className="text-[10px] font-black px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center gap-1 active:scale-95 transition-all">
                    Batal
                </button>
                <button onClick={() => { updateWalletsList(tempWallets); setIsEditingWallets(false); }} className="text-[10px] font-black px-3 py-1.5 rounded-lg bg-blue-600 text-white flex items-center gap-1 active:scale-95 transition-all shadow-md shadow-blue-500/20">
                    <Save size={12} /> Simpan
                </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
                <button onClick={() => setShowSaldoHP(!showSaldoHP)} className="text-[10px] font-black px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 flex items-center gap-1 transition-all active:scale-95">
                    {showSaldoHP ? <EyeOff size={12} /> : <Eye size={12} />} Saldo HP
                </button>
                <button onClick={() => { setTempWallets([...wallets]); setIsEditingWallets(true); }} className="text-[10px] font-black px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 flex items-center gap-1 transition-all active:scale-95">
                    <Edit2 size={12} /> Edit
                </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3">
          {(isEditingWallets ? tempWallets : wallets.filter(w => !w.isHidden)).map((w, index) => {
            const isBank = w.id !== 'Bank08'; 
            const realVal = w.realBalance ?? w.balance;
            const bookVal = w.balance;
            const diff = realVal - bookVal;
            
            if (isEditingWallets) {
                return (
                    <div key={w.id} className={cn("bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-sm border flex items-center justify-between gap-3 group relative overflow-hidden transition-all", w.isHidden ? "border-slate-200 dark:border-slate-700 opacity-60" : "border-blue-100")}>
                        <div className="flex flex-col gap-1 items-center justify-center border-r border-slate-100 dark:border-slate-800 pr-2">
                            <button onClick={() => {
                                if (index === 0) return;
                                const newWallets = [...tempWallets];
                                const temp = newWallets[index-1];
                                newWallets[index-1] = newWallets[index];
                                newWallets[index] = temp;
                                setTempWallets(newWallets);
                            }} className={cn("p-1 rounded text-slate-400 hover:bg-slate-100 dark:bg-slate-800 hover:text-slate-700 dark:text-slate-200", index === 0 ? "opacity-30 cursor-not-allowed" : "")}>
                                <MoveUp size={14} />
                            </button>
                            <button onClick={() => {
                                if (index === tempWallets.length - 1) return;
                                const newWallets = [...tempWallets];
                                const temp = newWallets[index+1];
                                newWallets[index+1] = newWallets[index];
                                newWallets[index] = temp;
                                setTempWallets(newWallets);
                            }} className={cn("p-1 rounded text-slate-400 hover:bg-slate-100 dark:bg-slate-800 hover:text-slate-700 dark:text-slate-200", index === tempWallets.length - 1 ? "opacity-30 cursor-not-allowed" : "")}>
                                <MoveDown size={14} />
                            </button>
                        </div>
                        <div className="flex-1">
                            <input type="text" value={w.name} onChange={(e) => {
                                const newWallets = [...tempWallets];
                                newWallets[index] = { ...newWallets[index], name: e.target.value };
                                setTempWallets(newWallets);
                            }} className="w-full text-sm font-black text-slate-800 dark:text-slate-100 border-b border-transparent bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:bg-slate-800 px-2 py-2 rounded-lg focus:outline-none focus:border-blue-500 focus:bg-white dark:bg-slate-800 transition-all" />
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => {
                                const newWallets = [...tempWallets];
                                newWallets[index] = { ...newWallets[index], isHidden: !newWallets[index].isHidden };
                                setTempWallets(newWallets);
                            }} className={cn("p-2 rounded-xl flex items-center justify-center w-10 text-[10px] font-bold uppercase transition-all shadow-sm", w.isHidden ? "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200" : "bg-emerald-100 text-emerald-600 hover:bg-emerald-200")}>
                                {w.isHidden ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>
                );
            }
            
            const isLaciKasir = w.id === 'Bank08';
            const isDompetPenampung = w.id === 'Bank11' || w.name === 'Dompet Penampung';

            let cardBgClass = "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-800";
            let iconBgClass = "bg-slate-50 dark:bg-slate-900";

            if (isLaciKasir) {
              cardBgClass = "bg-amber-100 border-amber-300 shadow-md shadow-amber-200/30 ring-1 ring-amber-200/50";
              iconBgClass = "bg-amber-200/80 text-amber-900";
            } else if (isDompetPenampung) {
              cardBgClass = "bg-blue-50 border-blue-250 shadow-md shadow-blue-100/10 ring-1 ring-blue-100/20";
              iconBgClass = "bg-blue-100 text-blue-900";
            }

            return (
              <div key={w.id} className={cn("p-4 rounded-2xl shadow-sm border flex flex-col justify-between gap-3 group relative overflow-hidden transition-all", cardBgClass)}>
                 <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                       <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-inner", iconBgClass)}>
                         {getIconForWallet(w.name)}
                       </div>
                       <div>
                          <h4 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-0.5">{w.name}</h4>
                          {w.name === 'Dompet Penampung' && (
                            <p className="text-[9px] font-bold text-blue-600 normal-case mb-1">
                              Transaksi Non Tunai (QRIS)
                            </p>
                          )}
                          <p className="text-sm font-black text-slate-800 dark:text-slate-100">{formatRupiah(bookVal)}</p>
                       </div>
                    </div>
                    <button onClick={() => { setAdjustWalletId(w.id); }} className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-900 hover:bg-blue-50 text-slate-400 hover:text-blue-600 flex items-center justify-center transition-all shrink-0 border border-slate-100 dark:border-slate-800">
                      <Scale size={14} />
                    </button>
                 </div>
                 
                 {isBank && showSaldoHP && (
                   <div className="pt-2.5 border-t border-slate-100/70 flex items-center justify-between gap-2 text-[10px] animate-in fade-in slide-in-from-top-2 duration-200 ease-out">
                      <div className="flex flex-col text-left">
                        <span className="text-[8px] font-black text-slate-400 uppercase">Saldo HP</span>
                        <button onClick={() => { setShowSaldoRealModal(true); setInputSaldoRealKeterangan(w.name); setAdjustWalletId(w.id); }} className="mt-1 px-2.5 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-95 border border-emerald-200/50">
                           <PenSquare size={10} />
                           {w.realBalance !== undefined ? formatRupiah(w.realBalance) : 'Input Saldo HP'}
                        </button>
                      </div>
                      {w.realBalance !== undefined && (
                        <span className={cn("px-2 py-0.5 rounded-lg font-black uppercase text-[8px] tracking-wide", diff === 0 ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : diff > 0 ? "bg-blue-50 text-blue-700 border border-blue-100" : "bg-rose-50 text-rose-700 border border-rose-100")}>
                          {diff === 0 ? 'Klop' : diff > 0 ? `+${formatRupiah(diff)}` : formatRupiah(diff)}
                        </span>
                      )}
                   </div>
                 )}
              </div>
            );
          })}
        </div>
        </div>
        )}

        {/* JURNAL PENYESUAIAN */}
        {activeTab === 'penyesuaian' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {(() => {
          const todayStr = now.toDateString();
          const todayTransactions = transactions.filter(t => {
            try {
              return new Date(t.date).toDateString() === todayStr;
            } catch {
              return false;
            }
          });

          const totalSaldoMasukHariIni = todayTransactions.reduce((acc, t) => {
            if (t.type === 'MODAL_PAGI' || t.type === 'TAMBAH_SALDO' || t.type === 'PINDAH_SALDO') {
              return acc + t.total;
            }
            return acc;
          }, 0);

          const sisaAsetDigitalBuku = wallets.filter(w => w.id !== 'Bank08' && !w.isHidden).reduce((a, b) => a + b.balance, 0);
          const realTotalVal = wallets.filter(w => w.id !== 'Bank08' && !w.isHidden).reduce((a, b) => a + (b.realBalance ?? b.balance), 0);
          const selisihVal = realTotalVal - sisaAsetDigitalBuku;

          return (
            <div className="mt-8 mb-6">
              <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-5 shadow-2xl relative overflow-hidden font-sans">
                {/* Background ambient radial glow */}
                <div className="absolute top-0 right-0 w-44 h-44 bg-blue-500/10 rounded-full blur-3xl pointer-events-none font-sans"></div>
                <div className="absolute bottom-0 left-0 w-44 h-44 bg-orange-500/5 rounded-full blur-3xl pointer-events-none font-sans"></div>

                <div className="flex justify-between items-center mb-5 relative z-10">
                  <div>
                    <h4 className="text-[12px] font-black text-blue-300 tracking-widest uppercase flex items-center gap-1.5 flex-wrap">
                      <Scale className="text-amber-400" size={15} strokeWidth={2.5} /> Jurnal Penyesuaian
                    </h4>
                    <span className="text-[7.5px] text-slate-400 font-extrabold block mt-0.5 uppercase tracking-wider">
                      Cek Selisih Dompet Digital & Catatan Pembukuan
                    </span>
                  </div>
                  <span className="text-[8px] bg-amber-400/90 text-amber-955 px-2.5 py-0.8 rounded-full font-black uppercase tracking-wider shadow-sm shrink-0">
                    OTOMATIS
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 relative z-10 font-sans">
                  {/* Card 1: Total Saldo Masuk Hari Ini */}
                  <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between hover:border-slate-750 transition-colors">
                    <div>
                      <span className="text-[7.5px] font-black text-orange-400 tracking-wider uppercase flex items-center gap-1 mb-1 bg-orange-500/10 px-1.5 py-0.5 rounded w-fit">
                        <span className="w-1.2 h-1.2 rounded-full bg-orange-400 animate-pulse"></span> Hari Ini
                      </span>
                      <p className="text-[10.5px] font-black text-slate-200 tracking-tight leading-snug uppercase">
                        1. Total Saldo Masuk
                      </p>
                      <p className="text-[8.5px] text-slate-400 font-extrabold mt-1 leading-normal uppercase">
                        Modal Pagi + Pindah Saldo + Suntik
                      </p>
                    </div>
                    <div className="mt-4 pt-3.5 border-t border-slate-800/60 font-mono">
                      <span className="text-[13.5px] font-black text-white/95">
                        {formatRupiah(totalSaldoMasukHariIni)}
                      </span>
                    </div>
                  </div>

                  {/* Card 2: Sisa Aset Digital (Buku) */}
                  <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between hover:border-slate-750 transition-colors">
                    <div>
                      <span className="text-[7.5px] font-black text-blue-400 tracking-wider uppercase flex items-center gap-1 mb-1 bg-blue-500/10 px-1.5 py-0.5 rounded w-fit">
                        <span className="w-1.2 h-1.2 rounded-full bg-blue-400"></span> Sistem
                      </span>
                      <p className="text-[10.5px] font-black text-slate-200 tracking-tight leading-snug uppercase">
                        2. Sisa Aset Digital (Buku)
                      </p>
                      <p className="text-[8.5px] text-slate-400 font-extrabold mt-1 leading-normal uppercase">
                        Total Saldo Aset Digital Tersisa
                      </p>
                    </div>
                    <div className="mt-4 pt-3.5 border-t border-slate-800/60 font-mono">
                      <span className="text-[13.5px] font-black text-white/95">
                        {formatRupiah(sisaAsetDigitalBuku)}
                      </span>
                    </div>
                  </div>

                  {/* Card 3: SELISIH (Reconciliation outcome) */}
                  {(() => {
                    let textStyle = "text-emerald-400 font-black";
                    let glowStyle = "bg-emerald-500/10 text-emerald-400";
                    let label = "KLOP";
                    let expText = "Saldo HP pas dengan catatan buku";
                    let sign = "";

                    if (selisihVal < 0) {
                      textStyle = "text-rose-400 font-black";
                      glowStyle = "bg-rose-500/10 text-rose-400";
                      label = "SELISIH";
                      expText = "Uang di bank kurang dari catatan";
                      sign = "-";
                    } else if (selisihVal > 0) {
                      textStyle = "text-blue-400 font-black";
                      glowStyle = "bg-blue-500/10 text-blue-400";
                      label = "SURPLUS";
                      expText = "Uang di bank lebih dari catatan";
                      sign = "+";
                    }

                    return (
                      <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between hover:border-slate-750 transition-colors">
                        <div>
                          <span className={cn("text-[7.5px] font-black tracking-wider uppercase flex items-center gap-1 mb-1 px-1.5 py-0.5 rounded w-fit", glowStyle)}>
                            <span className={cn("w-1.2 h-1.2 rounded-full", selisihVal === 0 ? "bg-emerald-400" : selisihVal < 0 ? "bg-rose-400 animate-pulse" : "bg-blue-400 animate-pulse")}></span> {label}
                          </span>
                          <p className="text-[10.5px] font-black text-slate-200 tracking-tight leading-snug uppercase">
                            SELISIH KESELURUHAN
                          </p>
                          <p className="text-[8.5px] text-slate-400 font-extrabold mt-1 leading-normal">
                            {expText}
                          </p>
                        </div>
                        <div className="mt-4 pt-3.5 border-t border-slate-800/60 font-mono">
                          <span className={cn("text-[13.5px] font-black", textStyle)}>
                            {selisihVal === 0 ? "Rp 0" : sign + formatRupiah(Math.abs(selisihVal))}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* DIRECT RECONCILIATION INPUTS */}
                <div className="mt-8 pt-6 border-t border-slate-800/80 relative z-10 font-sans">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
                    <div>
                      <h5 className="text-[10px] font-black text-blue-300 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                        Isi Totalan Saldo M-Banking / E-Wallet Anda
                      </h5>
                      <p className="text-[8px] text-slate-400 font-extrabold uppercase tracking-wide mt-1">
                        Ketikkan saldo riil atau nominal mbanking Anda yang ada di HP disini untuk membandingkan kecocokan saldo:
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        wallets.forEach(w => {
                          if (w.id !== 'Bank08') {
                            updateWalletRealBalance(w.id, w.balance);
                          }
                        });
                        setRealBalancesInputs({});
                      }}
                      className="text-[8px] font-black text-slate-400 hover:text-orange-400 border border-slate-800 hover:border-orange-500/30 px-3 py-1.5 rounded-xl transition-all uppercase tracking-widest active:scale-95 shrink-0 bg-slate-950/20"
                    >
                      Reset Input HP
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {wallets.filter(w => w.id !== 'Bank08' && !w.isHidden).map(w => {
                      const real = w.realBalance ?? w.balance;
                      const dbDiff = real - w.balance;

                      const getInputValueStr = (walletId: string, node: WalletNode) => {
                        if (realBalancesInputs[walletId] !== undefined) {
                          const raw = realBalancesInputs[walletId];
                          if (raw === '') return '';
                          return new Intl.NumberFormat('id-ID').format(parseInt(raw, 10));
                        }
                        if (node.realBalance !== undefined) {
                          return new Intl.NumberFormat('id-ID').format(node.realBalance);
                        }
                        return '';
                      };

                      return (
                        <div key={w.id} className="bg-slate-950/50 border border-slate-800/80 p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-700/80 transition-colors">
                          {/* Wallet info */}
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 text-slate-400">
                              {getIconForWallet(w.name)}
                            </div>
                            <div>
                              <span className="text-[10px] font-black text-white uppercase tracking-wide leading-none block">
                                {w.name}
                              </span>
                              <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest block mt-1.5">
                                Catatan Buku: <span className="font-mono text-slate-200">{formatRupiah(w.balance)}</span>
                              </span>
                            </div>
                          </div>

                          {/* Inputs & comparison */}
                          <div className="flex flex-wrap items-center gap-2 justify-between sm:justify-end">
                            {/* Input field */}
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-500 dark:text-slate-400">Rp</span>
                              <input 
                                type="text" 
                                inputMode="numeric" 
                                placeholder="Isi saldo HP..."
                                className="bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl py-1.5 px-3 pl-7 text-right font-mono text-[10px] text-white font-black tracking-wide w-32 placeholder:text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                                value={getInputValueStr(w.id, w)} 
                                onChange={e => handleRealBalanceInputChange(w.id, e.target.value)}
                              />
                            </div>

                            {/* Comparison Outcome badge */}
                            {(() => {
                              let badgeStyle = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
                              let text = "Klop ✓";
                              if (dbDiff < 0) {
                                badgeStyle = "bg-rose-500/10 text-rose-400 border border-rose-500/20";
                                text = `Kurang ${formatRupiah(Math.abs(dbDiff))}`;
                              } else if (dbDiff > 0) {
                                badgeStyle = "bg-blue-500/10 text-blue-400 border border-blue-500/30";
                                text = `Lebih +${formatRupiah(dbDiff)}`;
                              }

                              return (
                                <span className={cn("px-2.5 py-1.5 rounded-xl font-black text-[7.5px] uppercase tracking-wide shrink-0 min-w-24 text-center block", badgeStyle)}>
                                  {text}
                                </span>
                              );
                            })()}

                            {/* Row Reconciliation Auto adjust */}
                            {dbDiff !== 0 && (
                              <button
                                type="button"
                                onClick={() => handleRowAutoReconcile(w.id, w.name, dbDiff)}
                                className="px-2.5 py-1.5 bg-orange-500 hover:bg-orange-600 active:bg-orange-750 text-white font-black text-[7.5px] uppercase tracking-widest rounded-xl transition-all hover:shadow-lg active:scale-95"
                              >
                                Sesuaikan Buku
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
        </div>
        )}
        <div className="hidden">
        <div className="mt-6 mb-4">
          <div className="bg-white dark:bg-slate-800 border-2 border-blue-100/70 rounded-[1.8rem] p-4 shadow-xl shadow-blue-500/5 hover:shadow-blue-500/10">
            <div className="flex justify-between items-center mb-4 px-1">
              <h4 className="text-[13px] font-black text-blue-800 tracking-widest uppercase flex items-center gap-1.5">
                <Scale className="text-blue-500" size={14} /> Jurnal Penyesuaian
              </h4>
              <span className="text-[9px] bg-blue-50 border border-blue-100 text-blue-600 px-2.5 py-1 rounded-xl font-black uppercase tracking-wider">Otomatis</span>
            </div>
            
            <div className="space-y-2.5">
               <div className="flex flex-col gap-2 p-3.5 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl border border-orange-400 shadow-lg shadow-orange-500/25">
                 <div className="flex justify-between items-center">
                    <div>
                      <p className="text-[11px] font-black text-white uppercase tracking-wide">1. Total Saldo Masuk Hari Ini</p>
                      <p className="text-[9px] text-orange-100 font-bold mt-0.5">Modal Pagi + Pindah Saldo + Suntik</p>
                    </div>
                    <span className="font-black text-[13px] text-orange-800 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-orange-200">
                      {formatRupiah(transactions.reduce((acc, t) => acc + (t.type === 'MODAL_PAGI' || t.type === 'TAMBAH_SALDO' ? t.total : 0), 0))}
                    </span>
                 </div>
               </div>

               <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-blue-50/50 rounded-2xl border border-blue-100">
                 <div>
                   <p className="text-[11px] font-black text-blue-700 uppercase tracking-wide">2. Sisa Aset Digital (Buku)</p>
                   <p className="text-[9px] text-blue-400 font-bold mt-0.5">Total Saldo Aset Digital Tersisa</p>
                 </div>
                 <span className="font-black text-[13px] text-blue-900 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-xl border border-blue-100">{formatRupiah(balance)}</span>
               </div>
               
               {(() => {
                 const bookTotal = wallets.filter(w => w.id !== 'Bank08').reduce((a, b) => a + b.balance, 0);
                 const realTotal = wallets.filter(w => w.id !== 'Bank08').reduce((a, b) => a + (b.realBalance ?? b.balance), 0);
                 const selisih = realTotal - bookTotal;

                 return (
                   <div className={cn("mt-4 p-4 rounded-2xl flex justify-between items-center border-2 shadow-md", selisih === 0 ? "bg-emerald-600 border-emerald-400 text-white" : selisih > 0 ? "bg-blue-600 border-blue-400 text-white" : "bg-rose-600 border-rose-400 text-white")}>
                      <div>
                         <p className="text-[11px] font-black uppercase tracking-widest flex items-center gap-1.5">
                            {selisih === 0 ? <><CheckCircle2 size={12}/> KLOP</> : selisih > 0 ? <><CircleAlert size={12}/> SURPLUS</> : <><CircleAlert size={12}/> SELISIH</>}
                         </p>
                         <p className="text-[9px] opacity-90 font-bold mt-1">
                            {selisih === 0 ? 'Sisa saldo di HP pas dengan buku' : selisih > 0 ? 'Saldo di HP lebih dari catatan' : 'Uang di bank kurang dari catatan'}
                         </p>
                      </div>
                      <div className="text-right">
                         <span className="font-black text-[15px] block leading-none">{selisih === 0 ? '✓ MATCH' : formatRupiah(selisih)}</span>
                      </div>
                   </div>
                 );
               })()}
            </div>
          </div>
        </div>

        </div>

        <div className="mt-8 border-t border-slate-100 dark:border-slate-800 pt-6 text-center">
          <button onClick={() => setShowRiwayatMutasi(!showRiwayatMutasi)} className="text-[10px] font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest flex items-center justify-center gap-1.5 w-full py-2 bg-slate-50 dark:bg-slate-900 hover:bg-blue-50 rounded-xl">
            {showRiwayatMutasi ? <><ChevronUp size={12}/> SEMBUNYIKAN 10 MUTASI TERAKHIR</> : <><ChevronDown size={12}/> LIHAT 10 MUTASI TERAKHIR</>}
          </button>
          
          {showRiwayatMutasi && (
            <div className="mt-3 text-left space-y-2 max-h-[300px] overflow-y-auto hide-scrollbar bg-slate-50/50 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800">
               {transactions.slice(0,10).map(t => (
                 <div key={t.id} className="flex justify-between items-center bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex-wrap gap-2">
                    <div>
                      <p className="text-[10px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                         <ArrowRightLeft size={10} className="text-slate-400"/> {t.type}
                      </p>
                      <p className="text-[9px] font-bold text-slate-400 mt-1">{t.description || t.category || '-'}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] font-black text-blue-700">{formatRupiah(t.total)}</span>
                      <p className="text-[8px] font-bold text-slate-400 mt-1">{new Date(t.date).toLocaleDateString('id-ID')}</p>
                    </div>
                 </div>
               ))}
            </div>
          )}
        </div>
        
        <div className="mt-6 bg-blue-50 text-blue-800 p-5 rounded-2xl border border-blue-100">
          <h4 className="text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-1.5"><Info size={14}/> Petunjuk Mutasi / Top-up</h4>
          <p className="text-[11px] leading-relaxed font-semibold opacity-90">Untuk melakukan perpindahan uang atau saldo antar dompet Anda bisa menambahkannya menggunakan tombol Pindah Saldo.</p>
        </div>

      </div>      {adjustWalletId && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-xl">
               <h3 className="font-black text-slate-800 dark:text-slate-100 text-sm uppercase tracking-widest mb-4">Penyesuaian Saldo</h3>
               <div className="flex gap-2 mb-4">
                 <button onClick={() => setAdjustType('tambah')} className={cn("flex-1 py-2 rounded-xl text-xs font-black", adjustType === 'tambah' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400')}>TAMBAH (+)</button>
                 <button onClick={() => setAdjustType('kurang')} className={cn("flex-1 py-2 rounded-xl text-xs font-black", adjustType === 'kurang' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400')}>KURANG (-)</button>
               </div>
               <div className="mb-4">
                 <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 mb-1 block">Nominal</label>
                 <input 
                   type="text" 
                   inputMode="numeric" 
                   placeholder="Contoh: 15.000"
                   className="w-full border p-3 rounded-xl bg-slate-50 dark:bg-slate-900 font-mono text-sm tracking-wide text-slate-800 dark:text-slate-100 font-extrabold" 
                   value={adjustNominal ? new Intl.NumberFormat('id-ID').format(parseInt(adjustNominal, 10)) : ''} 
                   onChange={e => {
                     const clean = e.target.value.replace(/\D/g, '');
                     setAdjustNominal(clean);
                   }} 
                 />
               </div>
               <div className="mb-6">
                 <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 mb-1 block">Keterangan</label>
                 <input type="text" className="w-full border p-3 rounded-xl bg-slate-50 dark:bg-slate-900" value={adjustKeterangan} onChange={e => setAdjustKeterangan(e.target.value)} placeholder="Opsional" />
               </div>
               <div className="flex gap-3">
                  <button onClick={() => setAdjustWalletId(null)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-black text-[11px] uppercase tracking-wider">BATAL</button>
                  <button onClick={handleSaveAdjust} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-black text-[11px] uppercase tracking-wider">SIMPAN</button>
               </div>
            </div>
         </div>
      )}

      {modalType && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-xl animate-in fade-in zoom-in-95 duration-155">
               <h3 className="font-black text-blue-800 text-sm uppercase tracking-widest mb-4 flex items-center gap-1.5">
                  {modalType === 'MODAL_PAGI' ? <Sun size={16} className="text-amber-500" /> : modalType === 'TAMBAH_SALDO' ? <DollarSign size={16} className="text-emerald-500" /> : <ArrowRightLeft size={16} className="text-blue-500" />}
                  {modalType.replace('_', ' ')}
               </h3>
               
               <>
                 {(modalType === 'PINDAH_SALDO') && (
                   <div className="mb-4">
                     <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 mb-1 block">Dari Dompet</label>
                     <select className="w-full border p-3 rounded-xl bg-slate-50 dark:bg-slate-900 font-extrabold text-xs text-slate-700 dark:text-slate-200" value={modSumber} onChange={e => setModSumber(e.target.value)}>
                       <option value="">-- Pilih --</option>
                       {wallets.filter(w => !w.isHidden).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                     </select>
                   </div>
                 )}
                 <div className="mb-4">
                   <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 mb-1 block">Ke Dompet</label>
                   <select className="w-full border p-3 rounded-xl bg-slate-50 dark:bg-slate-900 font-extrabold text-xs text-slate-700 dark:text-slate-200" value={modTujuan} onChange={e => setModTujuan(e.target.value)}>
                     <option value="">-- Pilih --</option>
                     {wallets.filter(w => !w.isHidden).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                   </select>
                 </div>
                 <div className="mb-6">
                   <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 mb-1 block">Nominal</label>
                   <input 
                     type="text" 
                     inputMode="numeric" 
                     placeholder="Contoh: 50.000"
                     className="w-full border p-3 rounded-xl bg-slate-50 dark:bg-slate-900 font-mono text-sm tracking-wide text-slate-800 dark:text-slate-100 font-extrabold" 
                     value={modNominal ? new Intl.NumberFormat('id-ID').format(parseInt(modNominal, 10)) : ''} 
                     onChange={e => {
                       const clean = e.target.value.replace(/\D/g, '');
                       setModNominal(clean);
                     }} 
                   />
                 </div>
               </>

               <div className="flex gap-3">
                  <button onClick={() => { setModalType(null); setModNominal(''); }} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-black text-[11px] uppercase tracking-wider">BATAL</button>
                  <button onClick={processModal} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-black text-[11px] uppercase tracking-wider">SIMPAN</button>
               </div>
            </div>
         </div>
      )}

      {showSaldoRealModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-xl">
               <h3 className="font-black text-emerald-700 text-sm uppercase tracking-widest mb-2">Input Saldo HP</h3>
               <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-4">Dompet: {inputSaldoRealKeterangan}</p>
               <div className="mb-6">
                 <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 mb-1 block">Nominal Real di HP</label>
                 <input 
                   type="text" 
                   inputMode="numeric" 
                   placeholder="Contoh: 1.000.000"
                   className="w-full border p-3 rounded-xl bg-slate-50 dark:bg-slate-900 font-mono text-sm tracking-wide text-slate-800 dark:text-slate-100 font-extrabold" 
                   value={inputSaldoReal ? new Intl.NumberFormat('id-ID').format(parseInt(inputSaldoReal, 10)) : ''} 
                   onChange={e => {
                     const clean = e.target.value.replace(/\D/g, '');
                     setInputSaldoReal(clean);
                   }} 
                 />
               </div>
               <div className="flex gap-3">
                  <button onClick={() => { setShowSaldoRealModal(false); setInputSaldoReal(''); }} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-black text-[11px] uppercase tracking-wider">BATAL</button>
                  <button onClick={() => {
                    const rawAmt = inputSaldoReal.replace(/\D/g, '');
                    const amt = parseInt(rawAmt, 10);
                    if(!isNaN(amt) && amt >= 0 && adjustWalletId) {
                       updateWalletRealBalance(adjustWalletId, amt);
                    }
                    setShowSaldoRealModal(false);
                    setInputSaldoReal('');
                  }} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-black text-[11px] uppercase tracking-wider">SIMPAN</button>
               </div>
            </div>
         </div>
      )}
      {/* LICENSE ALERT MODAL */}
      {showLicenseAlert && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <div className="bg-gradient-to-br from-purple-800 to-purple-600 p-6 text-center text-white relative">
              <button onClick={() => setShowLicenseAlert(false)} className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors bg-black/20 rounded-full p-1">
                <X size={16} />
              </button>
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
                 <Lock size={32} className="text-white" />
              </div>
              <h3 className="font-black text-lg tracking-wider mb-1 uppercase">Akses Terkunci!</h3>
              <p className="text-xs text-purple-200 font-bold leading-relaxed px-2">Anda Menggunakan Aplikasi Basic.</p>
            </div>
            
            <div className="p-6 bg-slate-50 text-center">
              <p className="text-sm font-bold text-slate-600 mb-4">
                Untuk menggunakan layanan <span className="text-slate-800 font-black">Aset Digital / Dompet Digital</span>, Anda perlu mengaktifkan Lisensi PRO.
              </p>
              
              <div className="bg-white border-2 border-emerald-100 p-4 rounded-2xl mb-5 shadow-sm">
                 <p className="text-[10px] font-black text-emerald-600 uppercase mb-1 tracking-wider">Hubungi WhatsApp Kami</p>
                 <a href={`https://wa.me/${waNumber}?text=Halo%20saya%20ingin%20membeli%20Lisensi%20Aplikasi%20Kasir%20PRO`} target="_blank" rel="noopener noreferrer" className="block text-2xl font-black font-mono tracking-widest text-emerald-700 hover:text-emerald-500 transition-colors">
                   {waNumber}
                 </a>
                 <p className="text-[9px] text-slate-400 font-bold mt-2">Beli lisensi sekali, berlaku seumur hidup <br/>(LIFETIME PRO)</p>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setShowLicenseAlert(false)} className="flex-1 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-black text-[11px] uppercase tracking-wider transition-colors">
                  Nanti Saja
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
