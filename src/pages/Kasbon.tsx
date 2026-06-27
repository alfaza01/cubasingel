import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Search, Plus, HelpCircle, Calendar, 
  CreditCard, HandCoins, CheckCircle2, AlertCircle, X, 
  Save, Check, Trash2, Milestone, User, RefreshCw, ChevronDown, ChevronUp
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { useStore } from '../context/StoreContext';
import { KasbonNode } from '../types';

const formatRupiah = (val: number | string) => {
  const num = Number(val);
  if (isNaN(num)) return 'Rp 0';
  return 'Rp ' + num.toLocaleString('id-ID');
};

export function Kasbon() {
  const navigate = useNavigate();
  const { 
    kasbons, 
    contacts, 
    wallets, 
    addKasbon, 
    payKasbon, 
    deleteKasbon 
  } = useStore();

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'SEMUA' | 'BELUM_LUNAS' | 'LUNAS'>('BELUM_LUNAS');

  // Accordion details
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Modal control states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedKasbon, setSelectedKasbon] = useState<KasbonNode | null>(null);

  // Form states - Create Kasbon
  const [contactId, setContactId] = useState('');
  const [manualContactName, setManualContactName] = useState('');
  const [selectedWalletId, setSelectedWalletId] = useState('Bank08'); // default Laci Kasir
  const [kasbonAmount, setKasbonAmount] = useState('');
  const [kasbonDesc, setKasbonDesc] = useState('');

  // Form states - Pay Kasbon
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentWalletId, setPaymentWalletId] = useState('Bank08'); // default cash goes to drawer

  // Display thousands formatting
  const [displayKasbonAmount, setDisplayKasbonAmount] = useState('');
  const [displayPaymentAmount, setDisplayPaymentAmount] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Watchers to format user inputs
  useEffect(() => {
    if (!kasbonAmount) setDisplayKasbonAmount('');
    else setDisplayKasbonAmount(Number(kasbonAmount).toLocaleString('id-ID'));
  }, [kasbonAmount]);

  useEffect(() => {
    if (!paymentAmount) setDisplayPaymentAmount('');
    else setDisplayPaymentAmount(Number(paymentAmount).toLocaleString('id-ID'));
  }, [paymentAmount]);

  // Set default contact if contacts exist
  useEffect(() => {
    if (contacts.length > 0) {
      setContactId(contacts[0].id);
    } else {
      setContactId('MANUAL');
    }
  }, [contacts]);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleOpenAdd = () => {
    setKasbonAmount('');
    setKasbonDesc('');
    setSelectedWalletId('Bank08');
    if (contacts.length > 0) {
      setContactId(contacts[0].id);
    } else {
      setContactId('MANUAL');
    }
    setManualContactName('');
    setIsAddModalOpen(true);
  };

  const handleOpenPay = (k: KasbonNode) => {
    setSelectedKasbon(k);
    setPaymentAmount(k.remainingAmount.toString());
    setPaymentWalletId('Bank08');
    setIsPayModalOpen(true);
  };

  const submitAddKasbon = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseInt(kasbonAmount, 10);
    if (!parsedAmount || parsedAmount <= 0) {
      alert('Nominal kasbon harus di atas 0!');
      return;
    }

    let finalContactName = '';
    let finalContactId = undefined;

    if (contactId === 'MANUAL') {
      if (!manualContactName.trim()) {
        alert('Tulis nama pelanggan manual!');
        return;
      }
      finalContactName = manualContactName.trim();
    } else {
      const selectedContactObj = contacts.find(c => c.id === contactId);
      if (!selectedContactObj) {
        alert('Kontak tidak valid!');
        return;
      }
      finalContactId = selectedContactObj.id;
      finalContactName = selectedContactObj.name;
    }

    addKasbon({
      contactId: finalContactId,
      contactName: finalContactName,
      amount: parsedAmount,
      description: kasbonDesc.trim() || `Pinjam modal tunai`,
      date: new Date().toISOString(),
      walletId: selectedWalletId // will deplete the selected wallet
    });

    setIsAddModalOpen(false);
    showSuccess(`Berhasil menambah kasbon senilai ${formatRupiah(parsedAmount)} untuk ${finalContactName}`);
  };

  const submitPayKasbon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKasbon) return;

    const parsedPay = parseInt(paymentAmount, 10);
    if (!parsedPay || parsedPay <= 0) {
      alert('Nominal angsuran pembayaran harus di atas 0!');
      return;
    }

    if (parsedPay > selectedKasbon.remainingAmount) {
      alert(`Nominal pembayaran lebih besar dari sisa hutang (${formatRupiah(selectedKasbon.remainingAmount)})!`);
      return;
    }

    payKasbon(selectedKasbon.id, parsedPay, paymentWalletId);
    setIsPayModalOpen(false);
    showSuccess(`Penerimaan cicilan kasbon ${formatRupiah(parsedPay)} berhasil dicatat!`);
  };

  const handleDeleteKasbon = (id: string, name: string) => {
    if (window.confirm(`Hapus catatan kasbon atas nama ${name}? Catatan ini tidak mengubah saldo yang sudah diubah.`)) {
      deleteKasbon(id);
      showSuccess(`Catatan kasbon ${name} telah dihapus.`);
    }
  };

  // Stats calculation
  const totalOutstanding = kasbons
    .filter(k => k.status === 'BELUM_LUNAS')
    .reduce((sum, k) => sum + k.remainingAmount, 0);

  const activeDebtorsCount = kasbons.filter(k => k.status === 'BELUM_LUNAS').length;

  const totalSettled = kasbons
    .reduce((sum, k) => {
      const totalPaid = k.payments.reduce((pSum, p) => pSum + p.amount, 0);
      return sum + totalPaid;
    }, 0);

  // Filter lists
  const filteredKasbons = kasbons.filter(k => {
    const matchesSearch = 
      k.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterStatus === 'SEMUA') return matchesSearch;
    return matchesSearch && k.status === filterStatus;
  });

  return (
    <div className="bg-slate-50 dark:bg-slate-900 min-h-screen pb-24">
      {/* HEADER HERO BANNER */}
      <div className="bg-[#1e3a8a] text-white pt-8 pb-12 px-4 rounded-b-[2rem] relative shadow-md">
        <div className="flex items-center gap-3 mb-6">
          <button 
            onClick={() => navigate('/')} 
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <ArrowLeft size={18} strokeWidth={2.5} />
          </button>
          <div>
            <h1 className="font-black text-lg tracking-wide uppercase">BUKU KASBON (UTANG-PIUTANG)</h1>
            <p className="text-[10px] text-blue-200 uppercase font-bold tracking-wider leading-none">PENGELOLAAN PIUTANG PELANGGAN MINI ATM</p>
          </div>
        </div>

        {/* TOP STATUS CARDS */}
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div className="bg-white/10 border border-white/15 rounded-2xl p-3.5 backdrop-blur-md">
            <p className="text-[9px] font-bold text-blue-200 uppercase tracking-wider mb-1">TOTAL BELUM LUNAS</p>
            <p className="text-lg font-black text-white">{formatRupiah(totalOutstanding)}</p>
            <div className="flex items-center gap-1 mt-1 text-[10px] text-orange-350 font-bold uppercase leading-none">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse"></span>
              {activeDebtorsCount} Pelanggan Aktif
            </div>
          </div>
          <div className="bg-white/10 border border-white/15 rounded-2xl p-3.5 backdrop-blur-md">
            <p className="text-[9px] font-bold text-blue-200 uppercase tracking-wider mb-1">TOTAL HISTORIS SETELAN LUNAS</p>
            <p className="text-lg font-black text-emerald-350">{formatRupiah(totalSettled)}</p>
            <p className="text-[10px] text-blue-100 font-bold leading-none mt-1 uppercase">Pemasukan Berjalan</p>
          </div>
        </div>
      </div>

      {/* FILTER & CONTROL BAR */}
      <div className="px-4 -mt-5 relative z-10">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-2.5 shadow-md border border-slate-100 dark:border-slate-800 flex gap-2">
          <button 
            onClick={() => setFilterStatus('BELUM_LUNAS')}
            className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase text-center transition-all cursor-pointer
              ${filterStatus === 'BELUM_LUNAS' 
                ? 'bg-orange-500 text-white shadow-sm' 
                : 'bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-800'
              }
            `}
          >
            Belum Lunas ({kasbons.filter(k => k.status === 'BELUM_LUNAS').length})
          </button>
          <button 
            onClick={() => setFilterStatus('LUNAS')}
            className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase text-center transition-all cursor-pointer
              ${filterStatus === 'LUNAS' 
                ? 'bg-emerald-600 text-white shadow-sm' 
                : 'bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-800'
              }
            `}
          >
            Lunas ({kasbons.filter(k => k.status === 'LUNAS').length})
          </button>
          <button 
            onClick={() => setFilterStatus('SEMUA')}
            className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase text-center transition-all cursor-pointer
              ${filterStatus === 'SEMUA' 
                ? 'bg-slate-800 text-white shadow-sm' 
                : 'bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-800'
              }
            `}
          >
            Semua ({kasbons.length})
          </button>
        </div>
      </div>

      {/* SEARCH AND TRIGGER NEW ROWS */}
      <div className="px-4 mt-5 flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari kasbon berdasarkan debitur / catatan..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-slate-800 border border-slate-200/80 pl-10 pr-4 py-2.5 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all shadow-sm"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-300">
              <X size={14} />
            </button>
          )}
        </div>
        <button 
          onClick={handleOpenAdd}
          className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-extrabold px-4 py-2.5 rounded-2xl flex items-center gap-1 transition-all shadow-md active:scale-95 whitespace-nowrap h-10"
        >
          <Plus size={16} strokeWidth={2.5} /> KASBON BARU
        </button>
      </div>

      {/* FLOAT ALERTER */}
      {successMsg && (
        <div className="mx-4 mt-3 bg-emerald-50 border border-emerald-250 text-emerald-800 rounded-xl px-4 py-3 flex items-center justify-between shadow-sm animate-in fade-in duration-200">
          <p className="text-[11px] font-bold">{successMsg}</p>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-500 hover:text-emerald-700">
            <X size={14} />
          </button>
        </div>
      )}

      {/* KASBON LOG LISTS */}
      <div className="px-4 mt-4 space-y-3.5 [.pc-mode_&]:grid [.pc-mode_&]:grid-cols-1 [.pc-mode_&]:md:grid-cols-2 [.pc-mode_&]:lg:grid-cols-3 [.pc-mode_&]:gap-4 [.pc-mode_&]:space-y-0 [.pc-mode_&]:px-0">
        {filteredKasbons.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-10 border border-slate-100 dark:border-slate-800 text-center shadow-sm">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="text-slate-400" size={24} />
            </div>
            <p className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest leading-none">Sempurna!</p>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">Semua catatan transaksi bersih dengan filter saat ini.</p>
          </div>
        ) : (
          filteredKasbons.map(k => {
            const initials = k.contactName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
            const dateObj = new Date(k.date);
            const dateStr = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
            const timeStr = dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(/:/g, '.');
            const isUnpaid = k.status === 'BELUM_LUNAS';
            const expanded = expandedId === k.id;

            return (
              <div 
                key={k.id}
                className={`bg-white dark:bg-slate-800 rounded-2xl border transition-all overflow-hidden shadow-[0_4px_15px_rgba(0,0,0,0.01)]
                  ${isUnpaid ? 'border-orange-100/85 hover:border-orange-200' : 'border-slate-150-80 hover:border-slate-300 dark:border-slate-600'}
                `}
              >
                {/* Main clickable Header */}
                <div 
                  onClick={() => setExpandedId(expanded ? null : k.id)}
                  className="p-4 flex items-center justify-between cursor-pointer active:bg-slate-50/50"
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar Initials circle */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs
                      ${isUnpaid ? 'bg-orange-500/10 text-orange-600' : 'bg-emerald-500/10 text-emerald-600'}
                    `}>
                      {initials}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-800 dark:text-slate-100 text-sm leading-tight">{k.contactName}</span>
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border
                          ${isUnpaid 
                            ? 'bg-orange-50 text-orange-600 border-orange-200' 
                            : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                          }
                        `}>
                          {isUnpaid ? 'Belum Lunas' : 'Lunas'}
                        </span>
                      </div>
                      <p className="text-[10px] font-semibold text-slate-400 mt-1 flex items-center gap-1">
                        <Calendar size={10} /> {dateStr}, {timeStr}
                      </p>
                    </div>
                  </div>

                  {/* Pricing info in header */}
                  <div className="text-right flex items-center gap-2">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 leading-none">SISA PIUTANG</p>
                      <p className={`text-sm font-black mt-1 ${isUnpaid ? 'text-orange-650' : 'text-slate-400 line-through'}`}>
                        {formatRupiah(k.remainingAmount)}
                      </p>
                    </div>
                    {expanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                  </div>
                </div>

                {/* Sub-panels expanding Accordion style */}
                {expanded && (
                  <div className="bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 p-4 space-y-3.5 text-xs animate-in slide-in-from-top-1 duration-150">
                    
                    {/* Notes Detail */}
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Deskripsi Transaksi / Catatan</p>
                      <p className="font-bold text-slate-700 dark:text-slate-200 leading-relaxed bg-white dark:bg-slate-800 rounded-xl p-2.5 border border-slate-150">
                        {k.description}
                      </p>
                    </div>

                    {/* Meta data: wallet source */}
                    <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 shadow-inner px-3 py-2 rounded-xl border border-slate-100/50">
                      <span>Total Kasbon Awal: <strong className="text-slate-750 font-black">{formatRupiah(k.amount)}</strong></span>
                      {k.walletId && (
                        <span>Biaya Dari: <strong className="text-blue-700 font-bold uppercase">{wallets.find(w => w.id === k.walletId)?.name || k.walletId}</strong></span>
                      )}
                    </div>

                    {/* HISTORY PAYMENTS */}
                    {k.payments.length > 0 && (
                      <div className="bg-white dark:bg-slate-800 border border-slate-150/70 p-3 rounded-xl">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-2">Riwayat Angsuran / Pembayaran</p>
                        <div className="space-y-1.5 max-h-32 overflow-y-auto">
                          {k.payments.map((p, idx) => {
                            const payDate = new Date(p.date);
                            return (
                              <div key={p.id} className="flex justify-between items-center text-[10px] border-b border-dashed border-slate-100 dark:border-slate-800 pb-1 text-slate-600 dark:text-slate-300">
                                <span className="font-bold">✓ Pembayaran #{idx + 1} <span className="text-[9px] text-slate-400 font-normal">({payDate.toLocaleDateString('id-ID')})</span></span>
                                <span className="font-extrabold text-emerald-600">{formatRupiah(p.amount)} <span className="text-slate-400 font-normal">➔ {wallets.find(w => w.id === p.walletId)?.name || 'KAS'}</span></span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Footer Actions buttons */}
                    <div className="flex justify-between items-center pt-2">
                      <button 
                        onClick={() => handleDeleteKasbon(k.id, k.contactName)}
                        className="text-[10px] font-black text-red-500 hover:text-red-700 flex items-center gap-1 border border-red-200/55 hover:bg-red-50 px-3 py-1.5 rounded-xl transition-all"
                      >
                        <Trash2 size={12} /> HAPUS TRANS_LOG
                      </button>

                      {isUnpaid && (
                        <button 
                          onClick={() => handleOpenPay(k)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black px-4.5 py-2 rounded-xl flex items-center gap-1.5 active:scale-95 transition-all shadow-md shadow-emerald-500/10"
                        >
                          <HandCoins size={14} /> BAYAR CICILAN
                        </button>
                      )}
                    </div>

                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* POPUP MODAL DRAWER - KASBON BARU */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[100] p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-xl flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-[#1e3a8a] text-white">
              <div className="flex items-center gap-2">
                <Milestone size={16} className="text-orange-400 animate-spin" style={{ animationDuration: '4s' }} />
                <h2 className="font-extrabold text-sm uppercase tracking-wide">CATAT UTANG / KASBON BARU</h2>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)} 
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 text-white"
              >
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={submitAddKasbon} className="p-5 pb-10 overflow-y-auto space-y-4">
              
              {/* SELECT CONTACT */}
              <div>
                <label className="text-[10px] font-black text-slate-400 block mb-1.5 uppercase tracking-wide">NAMA DEBITUR / PELANGGAN *</label>
                <select 
                  className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl p-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all h-10 cursor-pointer mb-2.5"
                  value={contactId}
                  onChange={(e) => setContactId(e.target.value)}
                >
                  {contacts.map(c => (
                    <option key={c.id} value={c.id}>{c.name.toUpperCase()} [{c.type}]</option>
                  ))}
                  <option value="MANUAL">+ TULIS NAMA MANUAL (TDK DI REGISTRASI)</option>
                </select>

                {contactId === 'MANUAL' && (
                  <input 
                    type="text"
                    required
                    placeholder="Contoh: Pak Anto (Tetangga Depan)"
                    value={manualContactName}
                    onChange={(e) => setManualContactName(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:border-slate-600 rounded-xl p-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all h-10 animate-in slide-in-from-top-1 duration-100"
                  />
                )}
              </div>

              {/* OUTFLOW SOURCE WALLET */}
              <div>
                <label className="text-[10px] font-black text-slate-400 block mb-1.5 uppercase tracking-wide">SUMBER AMBIL DANA (PENGURANGAN SALDO)</label>
                <select 
                  className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl p-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all h-10 cursor-pointer"
                  value={selectedWalletId}
                  onChange={(e) => setSelectedWalletId(e.target.value)}
                >
                  <option value="">TIDAK MENGURANGI SALDO APAPUN (HANYA MENCATAT)</option>
                  {wallets.filter(w => !w.isHidden).map(w => (
                    <option key={w.id} value={w.id}>{w.name.toUpperCase()} (SALDO: {formatRupiah(w.balance)})</option>
                  ))}
                </select>
              </div>

              {/* NOMINAL KASBON */}
              <div>
                <label className="text-[10px] font-black text-slate-400 block mb-1.5 uppercase tracking-wide">NOMINAL KASBON (PINJAMAN) *</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-450 font-black text-xs">Rp</span>
                  <input 
                    type="text" 
                    inputMode="numeric"
                    placeholder="0"
                    required
                    value={displayKasbonAmount}
                    onChange={(e) => setKasbonAmount(e.target.value.replace(/\D/g, ''))}
                    className="w-full border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:border-slate-600 shadow-sm rounded-xl p-2.5 pl-9 text-right text-xs font-black text-slate-800 dark:text-slate-100 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all h-10"
                  />
                </div>
              </div>

              {/* KETERANGAN */}
              <div>
                <label className="text-[10px] font-black text-slate-400 block mb-1.5 uppercase tracking-wide">KETERANGAN / UTANG BARANG & TRANSFER</label>
                <textarea 
                  placeholder="Beri detail seperti: Ambil charger oppo, atau Transfer Mandiri belum bayar"
                  value={kasbonDesc}
                  onChange={(e) => setKasbonDesc(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:border-slate-600 rounded-xl p-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 shadow-sm outline-none min-h-[60px] resize-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all"
                />
              </div>

              {/* SAVE */}
              <button 
                type="submit"
                className="w-full bg-[#1e293b] hover:bg-slate-800 text-white font-black text-xs py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-md shadow-slate-900/10 uppercase tracking-widest cursor-pointer mt-2"
              >
                <Save size={14} className="text-yellow-400" strokeWidth={2.5} /> SIMPAN CATATAN KASBON
              </button>

            </form>
          </div>
        </div>
      )}

      {/* POPUP MODAL DRAWER - BAYAR ANGSURAN KASBON */}
      {isPayModalOpen && selectedKasbon && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[100] p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-xl flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-emerald-700 text-white">
              <div className="flex items-center gap-2">
                <HandCoins size={16} className="text-yellow-400" />
                <h2 className="font-extrabold text-sm uppercase tracking-wide">PELUNASAN / BAYAR KASBON</h2>
              </div>
              <button 
                onClick={() => setIsPayModalOpen(false)} 
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 text-white"
              >
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={submitPayKasbon} className="p-5 pb-10 overflow-y-auto space-y-4">
              
              <div className="bg-emerald-50/50 p-3.5 border border-emerald-100 rounded-xl">
                <p className="text-[10px] font-black text-emerald-800 leading-none uppercase">DEBITUR</p>
                <p className="text-xs font-black text-slate-800 dark:text-slate-100 mt-1">{selectedKasbon.contactName}</p>
                <div className="flex justify-between mt-2.5 text-[10px] bg-white dark:bg-slate-800 border border-emerald-100/50 p-2 rounded-lg">
                  <span className="text-slate-500 dark:text-slate-400">Sisa Pinjaman:</span>
                  <span className="font-black text-orange-650">{formatRupiah(selectedKasbon.remainingAmount)}</span>
                </div>
              </div>

              {/* TARGET RECEPTION WALLET */}
              <div>
                <label className="text-[10px] font-black text-slate-400 block mb-1.5 uppercase tracking-wide">MASUKKAN UANG KE (RESEPSI SALDO)</label>
                <select 
                  className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl p-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all h-10 cursor-pointer"
                  value={paymentWalletId}
                  onChange={(e) => setPaymentWalletId(e.target.value)}
                >
                  {wallets.filter(w => !w.isHidden).map(w => (
                    <option key={w.id} value={w.id}>{w.name.toUpperCase()} (SALDO saat ini: {formatRupiah(w.balance)})</option>
                  ))}
                </select>
              </div>

              {/* NOMINAL BAYAR */}
              <div>
                <label className="text-[10px] font-black text-slate-400 block mb-1.5 uppercase tracking-wide">NOMINAL YANG DIBAYAR / CICIL *</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-450 font-black text-xs">Rp</span>
                  <input 
                    type="text" 
                    inputMode="numeric"
                    placeholder="0"
                    required
                    value={displayPaymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value.replace(/\D/g, ''))}
                    className="w-full border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:border-slate-600 shadow-sm rounded-xl p-2.5 pl-9 text-right text-xs font-black text-slate-800 dark:text-slate-100 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all h-10"
                  />
                </div>
                <div className="flex justify-end gap-1.5 mt-1.5">
                  <button 
                    type="button"
                    onClick={() => setPaymentAmount(selectedKasbon.remainingAmount.toString())}
                    className="text-[9px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 px-2 py-1 rounded font-black text-slate-600 dark:text-slate-300 uppercase transition-all"
                  >
                    Set Lunas Penuh
                  </button>
                </div>
              </div>

              {/* ACTION PAY PANEL */}
              <button 
                type="submit"
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-md shadow-emerald-700/10 uppercase tracking-widest cursor-pointer mt-2"
              >
                <Check size={14} strokeWidth={3} /> RETRIBUSI PEMBAYARAN
              </button>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
