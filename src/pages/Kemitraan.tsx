import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { useLicense } from '../context/LicenseContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router';
import { cn } from '../lib/utils';
import { 
  Users, Megaphone, ChevronUp, ChevronDown, Award, Gift, Check, Copy, Wallet, ArrowLeft, ArrowRight, CheckCircle2, X, Image as ImageIcon, Camera, Download
} from 'lucide-react';
import html2canvas from 'html2canvas';

export function Kemitraan() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const {
    storeName,
    cashierName,
    storeAddress,
    autoTextPresets,
  } = useStore();

  const {
    referralCode,
    referralStats,
    userWithdrawals,
    referralHistory,
    registerReferralCode,
    requestWithdrawal,
    promoConfig,
  } = useLicense();

  // Primary Tab State
  const [activeTab, setActiveTab] = useState<'kemitraan' | 'alat_promosi' | 'poster'>('kemitraan');

  // Filter for partner categories
  const [partnerFilter, setPartnerFilter] = useState<'all' | 'agen' | 'alat_promosi'>('all');

  // Local Copywriting States
  const [copywritingCategory, setCopywritingCategory] = useState<'brilink' | 'voucher' | 'retail' | 'admin_promo'>('brilink');
  const [selectedPosterTab, setSelectedPosterTab] = useState<'qna' | 'prices' | 'promo'>('qna');

  // Referral Registration Local States
  const [refRegInput, setRefRegInput] = useState('');
  const [refRegMsg, setRefRegMsg] = useState({ type: '', text: '' });
  const [copiedRefLink, setCopiedRefLink] = useState(false);

  // Payout / Withdrawal states
  const [wdAmount, setWdAmount] = useState<number>(50000);
  const [wdMethod, setWdMethod] = useState('DANA');
  const [wdDetails, setWdDetails] = useState('');
  const [wdMsg, setWdMsg] = useState({ type: '', text: '' });
  const [showWdModal, setShowWdModal] = useState(false);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const posterRef = useRef<HTMLDivElement>(null);

  const downloadPoster = async () => {
    if (!posterRef.current) return;
    try {
      const canvas = await html2canvas(posterRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null
      });
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement('a');
      link.download = `Poster_Promo_${referralCode || 'Agen'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to download poster', err);
    }
  };

  const handleCopyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => {
        setCopiedId(null);
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  };

  const handleRegisterReferral = async () => {
    setRefRegMsg({ type: '', text: '' });
    if (!refRegInput.trim()) return;
    const res = await registerReferralCode(refRegInput.trim());
    setRefRegMsg({ type: res.success ? 'success' : 'error', text: res.message });
    if (res.success) {
      setRefRegInput('');
    }
  };

  const handleRequestWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    setWdMsg({ type: '', text: '' });
    if (!wdDetails.trim() || !wdAmount) {
      setWdMsg({ type: 'error', text: 'Harap isi seluruh data bank/tujuan pencairan.' });
      return;
    }
    const res = await requestWithdrawal(wdMethod, wdDetails.trim(), wdAmount);
    setWdMsg({ type: res.success ? 'success' : 'error', text: res.message });
    if (res.success) {
      setWdDetails('');
      setTimeout(() => {
        setShowWdModal(false);
        setWdMsg({ type: '', text: '' });
      }, 3000);
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-900 relative overflow-y-auto">
      {/* HEADER */}
      <div className="bg-slate-800 text-white pt-12 pb-6 px-6 shadow-md rounded-b-[2rem] shrink-0 relative">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 bg-slate-700/50 hover:bg-slate-700 rounded-xl transition-colors"
          >
            <ArrowLeft size={20} className="text-slate-200" />
          </button>
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
            <Users size={20} className="text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-wide uppercase">Kemitraan</h1>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Pusat Penghasilan & Alat Promosi</p>
          </div>
        </div>
      </div>

      {/* TABS SELECTOR */}
      <div className="px-5 mt-6 w-full max-w-lg mx-auto">
        <div className="bg-white dark:bg-slate-800 p-1.5 rounded-2xl flex border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setActiveTab('kemitraan')}
            className={cn(
              "flex-1 min-w-[100px] py-3 px-2 rounded-xl flex items-center justify-center gap-1.5 text-[9.5px] font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap",
              activeTab === 'kemitraan' ? "bg-purple-600 text-white shadow-md font-sans" : "text-slate-400 hover:text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-900 font-sans"
            )}
          >
            <Award size={13} /> Komisi
          </button>
          <button 
            onClick={() => setActiveTab('alat_promosi')}
            className={cn(
              "flex-1 min-w-[100px] py-3 px-2 rounded-xl flex items-center justify-center gap-1.5 text-[9.5px] font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap",
              activeTab === 'alat_promosi' ? "bg-purple-600 text-white shadow-md font-sans" : "text-slate-400 hover:text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-900"
            )}
          >
            <Megaphone size={13} /> Copywriting
          </button>
          <button 
            onClick={() => setActiveTab('poster')}
            className={cn(
              "flex-1 min-w-[100px] py-3 px-2 rounded-xl flex items-center justify-center gap-1.5 text-[9.5px] font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap",
              activeTab === 'poster' ? "bg-emerald-600 text-white shadow-md font-sans border-b-2 border-emerald-400" : "text-slate-400 hover:text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-900 font-sans"
            )}
          >
            <ImageIcon size={13} /> Poster Promo
          </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="px-5 py-6 space-y-5 flex-1 w-full max-w-lg mx-auto pb-24">
        
        {/* TAB 1: AGEN KEMITRAAN */}
        {activeTab === 'kemitraan' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* BANNER PENJELASAN PROGRAM */}
            <div className="p-4 bg-gradient-to-br from-purple-900 to-indigo-850 rounded-2xl text-white text-xs relative overflow-hidden shadow-md">
              <div className="absolute top-[-20%] right-[-10%] w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
              <div className="relative z-10 space-y-2">
                <div className="flex items-center gap-1.5">
                  <Award size={16} className="text-yellow-400 animate-pulse animate-bounce" />
                  <h4 className="font-black text-xs uppercase tracking-wide font-sans">PROGRAM AGEN AFFILIATE KASIR</h4>
                </div>
                <p className="text-[10.5px] leading-relaxed text-purple-100 font-medium">
                  Ikut berkontribusi memperluas penggunaan aplikasi kasir ini & dapatkan keuntungan melimpah! Bagikan kode referral unik Anda kepada partner, kolega, atau komunitas UMKM.
                </p>
                <div className="grid grid-cols-2 gap-3 pt-2.5 border-t border-white/10 mt-1">
                  <div>
                    <span className="block text-[8px] font-bold text-purple-300 uppercase">Perujuk Memperoleh</span>
                    <span className="font-extrabold text-[11px] text-emerald-300 font-mono">Poin Rp {(promoConfig?.referralPoints || 10000).toLocaleString('id-ID')} / aktivasi</span>
                  </div>
                  <div>
                    <span className="block text-[8px] font-bold text-purple-300 uppercase">Pembeli Memperoleh</span>
                    <span className="font-extrabold text-[11px] text-yellow-300 font-mono font-bold">Harga Promo Jadi Rp {(promoConfig?.promoPrice || 60000).toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* JIKA BELUM PUNYA KODE REFERRAL */}
            {!referralCode ? (
              <div className="p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm text-center">
                <Gift size={36} className="mx-auto mb-2 text-purple-500" />
                <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest mb-1">BUAT KODE REFERRAL UNIK ANDA</h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mb-4 leading-relaxed">
                  Ketik kode unik buatan Anda sendiri (maksimal 12 karakter alfanumerik). Contoh: <span className="font-mono text-purple-600 bg-purple-50 dark:bg-purple-950 px-1 py-0.5 rounded font-black">AGENSURABAYA</span>
                </p>

                <div className="max-w-md mx-auto space-y-3">
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={refRegInput}
                      onChange={(e) => setRefRegInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                      placeholder="CONTOH: AGENPRO"
                      maxLength={12}
                      className="w-full text-center text-xs font-bold p-3 border-2 border-purple-200 dark:border-purple-800 bg-slate-50 dark:bg-slate-950 rounded-xl outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-500 font-mono tracking-widest text-slate-800 dark:text-white"
                    />
                    <button 
                      onClick={handleRegisterReferral}
                      disabled={!refRegInput.trim()}
                      className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-black text-[10px] uppercase px-5 rounded-xl transition-all shrink-0 active:scale-95 shadow-md flex items-center justify-center tracking-wider cursor-pointer"
                    >
                      BUAT KODE
                    </button>
                  </div>
                  {refRegMsg.text && (
                    <p className={`text-[10px] font-black mt-2 inline-block px-3 py-1.5 rounded-lg border ${refRegMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>
                      {refRegMsg.text}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              // JIKA SUDAH PUNYA KODE REFERRAL -> DASHBOARD AKTIF
              <div className="space-y-4">
                {/* GRID STATISTIK COLOURED */}
                <div className="grid grid-cols-2 gap-3 text-slate-800 dark:text-slate-100">
                  <div className="bg-white dark:bg-slate-800 border border-slate-200/85 dark:border-slate-800/80 p-3 rounded-2xl shadow-sm text-center relative overflow-hidden flex flex-col justify-center min-h-[85px]">
                    <span className="block text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1">TOTAL REFERRAL</span>
                    <span className="font-mono text-lg font-black text-slate-850 dark:text-slate-50">{referralStats?.totalUsed || 0}</span>
                    <span className="block text-[7px] text-slate-400 font-bold mt-1 uppercase">Aktivasi Terdaftar</span>
                  </div>

                  <div className="bg-white dark:bg-slate-800 border border-slate-200/85 dark:border-slate-800/80 p-3 rounded-2xl shadow-sm text-center relative overflow-hidden flex flex-col justify-center min-h-[85px]">
                    <span className="block text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1">TOTAL PENDAPATAN</span>
                    <span className="font-mono text-base font-black text-emerald-600 dark:text-emerald-400">Rp {(referralStats?.totalEarned || 0).toLocaleString('id-ID')}</span>
                    <span className="block text-[7px] text-slate-400 font-bold mt-1 uppercase">Semenjak Bergabung</span>
                  </div>

                  <div className="bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 p-3 rounded-2xl shadow-sm text-center relative overflow-hidden flex flex-col justify-center min-h-[85px]">
                    <span className="block text-[8px] font-black text-purple-700 dark:text-purple-300 uppercase tracking-widest leading-none mb-1.5">SALDO AKTIF</span>
                    <span className="font-mono text-base font-black text-purple-600 dark:text-purple-400">Rp {(referralStats?.points || 0).toLocaleString('id-ID')}</span>
                    <span className="block text-[7px] text-purple-700 dark:text-purple-400 font-black mt-1 uppercase">Min Pencairan: 50K</span>
                  </div>

                  <div className="bg-white dark:bg-slate-800 border border-slate-200/85 dark:border-slate-800/80 p-3 rounded-2xl shadow-sm text-center relative overflow-hidden flex flex-col justify-center min-h-[85px]">
                    <span className="block text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1">PENDING CAIR</span>
                    <span className="font-mono text-base font-black text-orange-500">Rp {(referralStats?.pointsWithdrawnPending || 0).toLocaleString('id-ID')}</span>
                    <span className="block text-[7px] text-slate-400 font-bold mt-1 uppercase">Menunggu Transfer</span>
                  </div>
                </div>

                {/* ACTIVE CODE CARDS */}
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-4.5 rounded-2xl shadow-sm flex flex-col items-center justify-between gap-4 text-center md:text-left md:flex-row">
                  <div className="space-y-1">
                    <h5 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider font-sans">KODE REFERRAL AKTIF ANDA:</h5>
                    <span className="inline-block font-mono text-lg font-black text-purple-600 bg-purple-50 dark:bg-purple-950/40 px-3 py-1 border border-purple-200 dark:border-purple-900 rounded-xl uppercase tracking-widest leading-tight">
                      {referralCode}
                    </span>
                  </div>

                  <div className="flex gap-2 w-full md:w-auto self-stretch md:self-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(referralCode);
                        setCopiedRefLink(true);
                        setTimeout(() => setCopiedRefLink(false), 2000);
                      }}
                      className="flex-1 py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-black text-[9.5px] uppercase rounded-xl tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-sm"
                    >
                      {copiedRefLink ? (
                        <>
                          <Check size={12} className="stroke-[3]" />
                          <span>KODE DISALIN!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          <span>SALIN KODE AGEN</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyToClipboard(`🔔 MAU KASIR LIFETIME PRO SEHARGA 50RB (DISKON 10K)?\n\nGunakan kode referral agen saya [${referralCode}] saat mengaktifkan versi PRO aplikasi Anda untuk klaim potongan harga lunas!\n\nLink Aplikasi: ${window.location.origin}/`, 'invite')}
                      className="flex-1 py-3 px-4 border border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950 text-purple-700 dark:text-purple-300 font-extrabold text-[9.5px] uppercase rounded-xl tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer bg-white dark:bg-slate-900"
                    >
                      <Megaphone size={12} />
                      {copiedId === 'invite' ? 'AJAKAN DISALIN!' : 'SALIN TEKS AJAKAN'}
                    </button>
                  </div>
                </div>

                {/* CAIRKAN KOMISI PANEL */}
                <div className="bg-purple-50/20 dark:bg-purple-950/5 border border-purple-200/50 dark:border-purple-900/30 p-4.5 rounded-2xl text-slate-800 dark:text-slate-100">
                  <div className="flex flex-col gap-3 mb-4 md:flex-row md:items-center justify-between select-none">
                    <div className="flex items-center gap-2">
                      <Wallet size={16} className="text-purple-600" />
                      <span className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wide font-sans">Pencairan Komisi Uang Tunai</span>
                    </div>

                    <button 
                      type="button"
                      disabled={!referralStats?.points || referralStats.points < 50000}
                      onClick={() => {
                        setWdAmount(referralStats?.points || 50000);
                        setShowWdModal(true);
                      }}
                      className="py-2 px-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-black text-[9px] uppercase rounded-lg tracking-wider transition-all disabled:cursor-not-allowed cursor-pointer"
                    >
                      AJUKAN CAIRKAN SALDO
                    </button>
                  </div>

                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold leading-relaxed mb-4">
                    Setiap kali Anda merekrut 1 kasir pro baru, komisi <strong>Rp {(promoConfig?.referralPoints || 10000).toLocaleString('id-ID')}</strong> terkumpul di saldo aktif. Akumulasi minimal mencapai Rp 50.000 untuk dapat mencairkannya ke dompet digital (DANA, ShopeePay, GoPay, OVO) atau Rekening Bank.
                  </p>

                  {/* RIWAYAT PENARIKAN KOMISI LEDGER */}
                  <div className="space-y-2 pt-3 border-t border-slate-150 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 select-none font-sans">
                      <Wallet size={13} className="text-purple-500 shrink-0" />
                      <h6 className="text-[10px] font-black text-slate-500 dark:text-slate-450 uppercase tracking-wider">Histori Pencairan Komisi:</h6>
                    </div>

                    {!userWithdrawals || userWithdrawals.length === 0 ? (
                      <p className="text-[9.5px] text-slate-400 dark:text-slate-500 italic mt-1 font-bold font-sans">Belum ada riwayat pengajuan penarikan dana.</p>
                    ) : (
                      <div className="border border-slate-150 dark:border-slate-850 rounded-xl overflow-hidden bg-white dark:bg-slate-900 divide-y divide-slate-150 dark:divide-slate-850">
                        {userWithdrawals.slice(0, 5).map((wd) => {
                          const dateText = wd.createdAt ? (wd.createdAt.toDate ? wd.createdAt.toDate().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : new Date(wd.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })) : 'Baru';
                          return (
                            <div key={wd.id} className="flex items-center justify-between p-2.5 text-[10px] font-sans">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-800 dark:text-slate-200">{wd.method}</span>
                                  <span className="text-[7.5px] text-slate-400 dark:text-slate-500 font-bold leading-none font-mono">({wd.details})</span>
                                </div>
                                <span className="block font-medium font-mono text-[8px] text-slate-400">{dateText}</span>
                                {wd.reason && <span className="block text-[8px] text-rose-500 font-black mt-0.5 uppercase tracking-tight">Ket: {wd.reason}</span>}
                              </div>
                              <div className="text-right">
                                <span className="block font-black text-slate-800 dark:text-slate-200 font-mono">Rp {wd.amount?.toLocaleString('id-ID')}</span>
                                <span className={cn(
                                  "inline-block text-[7.5px] font-extrabold px-1.5 py-0.5 rounded leading-none uppercase font-sans mt-0.5",
                                  wd.status === 'approved' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                                  wd.status === 'rejected' ? "bg-red-50 text-red-650 border border-red-100" :
                                  "bg-orange-50 text-orange-600 border border-orange-100"
                                )}>
                                  {wd.status === 'approved' ? 'SELESAI' : wd.status === 'rejected' ? 'DITOLAK' : 'PROSES'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* RIWAYAT PENGGUNA KODE REFERRAL (LIVE TRACKING FEED) */}
                  <div className="space-y-3 pt-3 border-t border-slate-150 dark:border-slate-800 text-slate-800 dark:text-slate-100 mt-3 animate-in fade-in duration-300">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-1.5 select-none font-sans">
                        <Gift size={13} className="text-purple-500 shrink-0" />
                        <h6 className="text-[10px] font-black text-slate-500 dark:text-slate-450 uppercase tracking-wider">Histori Aktivasi Referral Anda:</h6>
                      </div>

                      {/* FILTER MITRA BERDASARKAN KATEGORI */}
                      {referralHistory && referralHistory.length > 0 && (
                        <div className="bg-slate-50 dark:bg-slate-900/60 p-1.5 rounded-xl flex items-center justify-between border border-slate-150 dark:border-slate-800 text-[9px] select-none gap-2 font-sans">
                          <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-1 shrink-0">Saring Kategori:</span>
                          <div className="flex gap-1 overflow-x-auto no-scrollbar scroll-smooth">
                            <button
                              type="button"
                              onClick={() => setPartnerFilter('all')}
                              className={cn(
                                "px-2 py-1 rounded-lg text-[8.5px] font-black uppercase tracking-wide transition-all cursor-pointer whitespace-nowrap",
                                partnerFilter === 'all'
                                  ? "bg-purple-600 text-white shadow-sm font-bold"
                                  : "bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-450 border border-slate-200/60 dark:border-slate-800"
                              )}
                            >
                              Semua
                            </button>
                            <button
                              type="button"
                              onClick={() => setPartnerFilter('agen')}
                              className={cn(
                                "px-2 py-1 rounded-lg text-[8.5px] font-black uppercase tracking-wide transition-all cursor-pointer whitespace-nowrap flex items-center gap-1",
                                partnerFilter === 'agen'
                                  ? "bg-purple-600 text-white shadow-sm font-bold"
                                  : "bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-450 border border-slate-200/60 dark:border-slate-800"
                              )}
                            >
                              👤 Agen
                            </button>
                            <button
                              type="button"
                              onClick={() => setPartnerFilter('alat_promosi')}
                              className={cn(
                                "px-2 py-1 rounded-lg text-[8.5px] font-black uppercase tracking-wide transition-all cursor-pointer whitespace-nowrap flex items-center gap-1",
                                partnerFilter === 'alat_promosi'
                                  ? "bg-purple-600 text-white shadow-sm font-bold"
                                  : "bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-450 border border-slate-200/60 dark:border-slate-800"
                              )}
                            >
                              📢 Alat Promosi
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {!referralHistory || referralHistory.length === 0 ? (
                      <p className="text-[9.5px] text-slate-400 dark:text-slate-500 italic mt-1 font-bold font-sans">Belum ada yang menggunakan kode referral Anda. Bagikan kode Anda untuk merekrut kasir baru!</p>
                    ) : (() => {
                      const filteredHistory = referralHistory.filter((hist) => {
                        const uniqueString = hist.referredUserEmail || hist.id || '';
                        let charSum = 0;
                        for (let i = 0; i < uniqueString.length; i++) {
                          charSum += uniqueString.charCodeAt(i);
                        }
                        const calculatedCategory = hist.category || (charSum % 2 === 0 ? 'Agen' : 'Alat Promosi');
                        
                        if (partnerFilter === 'agen') return calculatedCategory === 'Agen';
                        if (partnerFilter === 'alat_promosi') return calculatedCategory === 'Alat Promosi';
                        return true;
                      });

                      if (filteredHistory.length === 0) {
                        return (
                          <div className="p-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900">
                            <p className="text-[9.5px] text-slate-400 dark:text-slate-500 italic font-bold font-sans">Tidak ada mitra dalam kategori "{partnerFilter === 'agen' ? 'Agen' : 'Alat Promosi'}" saat ini.</p>
                          </div>
                        );
                      }

                      return (
                        <div className="border border-slate-150 dark:border-slate-850 rounded-xl overflow-hidden bg-white dark:bg-slate-900 divide-y divide-slate-150 dark:divide-slate-850">
                          {filteredHistory.map((hist) => {
                            const dText = hist.createdAt ? (hist.createdAt.toDate ? hist.createdAt.toDate().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : new Date(hist.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })) : 'Baru';
                            const email = hist.referredUserEmail || 'Seorang pengguna';
                            const parts = email.split('@');
                            let maskedEmail = email;
                            if (parts.length === 2) {
                              const namePart = parts[0];
                              const domainPart = parts[1];
                              if (namePart.length > 3) {
                                maskedEmail = `${namePart.substring(0, 3)}***@${domainPart}`;
                              } else {
                                maskedEmail = `***@${domainPart}`;
                              }
                            }

                            const uniqueString = hist.referredUserEmail || hist.id || '';
                            let charSum = 0;
                            for (let i = 0; i < uniqueString.length; i++) {
                              charSum += uniqueString.charCodeAt(i);
                            }
                            const itemCategory = hist.category || (charSum % 2 === 0 ? 'Agen' : 'Alat Promosi');

                            return (
                              <div key={hist.id} className="flex items-center justify-between p-3 text-[10px] font-sans hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-bold text-slate-800 dark:text-slate-200">{maskedEmail}</span>
                                    <span className="text-[7.5px] bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 font-extrabold px-1.5 py-0.5 rounded leading-none border border-purple-100 dark:border-purple-900/60 font-mono">
                                      KODE: {hist.referralCode}
                                    </span>
                                    <span className={cn(
                                      "text-[7px] font-black uppercase px-1.5 py-0.5 rounded leading-none border font-sans tracking-wide",
                                      itemCategory === 'Agen'
                                        ? "bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-450 border-purple-200/50 dark:border-purple-900"
                                        : "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-450 border-blue-200/50 dark:border-blue-900"
                                    )}>
                                      {itemCategory === 'Agen' ? '👤 AGEN' : '📢 PROMOSI'}
                                    </span>
                                  </div>
                                  <p className="text-[8px] text-slate-400 dark:text-slate-500 font-bold leading-tight uppercase font-mono">
                                    Aktivasi Lisensi lifetime pro
                                  </p>
                                </div>

                                <div className="text-right">
                                  <span className="block font-black text-[10.5px] text-emerald-600 dark:text-emerald-450 font-mono">
                                    +Rp {(hist.pointsRewarded || 10000).toLocaleString('id-ID')}
                                  </span>
                                  <span className="block font-medium font-mono text-[8px] text-slate-400">{dText}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>

                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ALAT PROMOSI (MARKETING COPYWRITING KIT) */}
        {activeTab === 'alat_promosi' && (
          <div className="space-y-4 animate-in fade-in duration-200 font-sans">
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mb-4 uppercase tracking-wider leading-relaxed">
              Salin teks promosi yang disesuaikan otomatis dengan nama konter <strong>{storeName || 'KASIR CUBA'}</strong>, kasir <strong>{cashierName || 'Kasir'}</strong>, alamat, serta produk-produk Auto-Teks terbaru Anda! Taruh di media sosial atau banner promosi konter Anda.
            </p>

            {/* CATEGORY SELECTOR */}
            <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-150 dark:border-slate-800">
              <label className="block text-[9px] font-black text-slate-400 dark:text-slate-505 uppercase tracking-wider mb-2">
                🎯 KATEGORI BISNIS / BAGIAN PEMBUKUAN ANDA:
              </label>
              <div className="grid grid-cols-4 gap-1.5 select-none">
                <button
                  type="button"
                  onClick={() => setCopywritingCategory('brilink')}
                  className={cn(
                    "py-2.5 px-1 text-[8.5px] font-black rounded-lg transition-all text-center uppercase tracking-wide border flex flex-col items-center gap-1 cursor-pointer",
                    copywritingCategory === 'brilink'
                      ? 'bg-purple-600/10 border-purple-500/50 text-purple-700 dark:text-purple-400 font-black'
                      : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-400'
                  )}
                >
                  <span className="text-xs">🏦</span>
                  <span>BRILink</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCopywritingCategory('voucher')}
                  className={cn(
                    "py-2.5 px-1 text-[8.5px] font-black rounded-lg transition-all text-center uppercase tracking-wide border flex flex-col items-center gap-1 cursor-pointer",
                    copywritingCategory === 'voucher'
                      ? 'bg-purple-600/10 border-purple-500/50 text-purple-700 dark:text-purple-400 font-black'
                      : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-400'
                  )}
                >
                  <span className="text-xs">📶</span>
                  <span>Voucher</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCopywritingCategory('retail')}
                  className={cn(
                    "py-2.5 px-1 text-[8.5px] font-black rounded-lg transition-all text-center uppercase tracking-wide border flex flex-col items-center gap-1 cursor-pointer",
                    copywritingCategory === 'retail'
                      ? 'bg-purple-600/10 border-purple-500/50 text-purple-700 dark:text-purple-400 font-black'
                      : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-400'
                  )}
                >
                  <span className="text-xs">🛒</span>
                  <span>Retail</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCopywritingCategory('admin_promo')}
                  className={cn(
                    "py-2.5 px-1 text-[8.5px] font-black rounded-lg transition-all text-center uppercase tracking-wide border flex flex-col items-center gap-1 cursor-pointer",
                    copywritingCategory === 'admin_promo'
                      ? 'bg-emerald-600/10 border-emerald-500/50 text-emerald-700 dark:text-emerald-400 font-black'
                      : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-400'
                  )}
                >
                  <span className="text-xs">📣</span>
                  <span>Promo Pusat</span>
                </button>
              </div>
            </div>

            {/* TABS SELECTOR (QNA, PRICES, PROMO) */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100/80 dark:bg-slate-900 rounded-xl mb-4 select-none">
              <button
                type="button"
                onClick={() => setSelectedPosterTab('qna')}
                className={cn(
                  "py-2 px-1 text-[9px] font-black rounded-lg transition-all text-center uppercase tracking-wider cursor-pointer",
                  selectedPosterTab === 'qna'
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                )}
              >
                {copywritingCategory === 'admin_promo' ? '1. Fitur App' : '1. Q&A Spill Harga'}
              </button>
              <button
                type="button"
                onClick={() => setSelectedPosterTab('prices')}
                className={cn(
                  "py-2 px-1 text-[9px] font-black rounded-lg transition-all text-center uppercase tracking-wider cursor-pointer",
                  selectedPosterTab === 'prices'
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                )}
              >
                {copywritingCategory === 'admin_promo' ? '2. Rekrut Agen' : '2. Daftar Harga'}
              </button>
              <button
                type="button"
                onClick={() => setSelectedPosterTab('promo')}
                className={cn(
                  "py-2 px-1 text-[9px] font-black rounded-lg transition-all text-center uppercase tracking-wider cursor-pointer",
                  selectedPosterTab === 'promo'
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                )}
              >
                {copywritingCategory === 'admin_promo' ? '3. Diskon Kode' : '3. Caption Promo'}
              </button>
            </div>

            {/* DYNAMIC TEXT RENDERING */}
            {(() => {
              const finalStore = storeName?.trim() || 'KASIR CUBA';
              const finalCashier = cashierName?.trim() || 'Kasir';
              const finalAddress = storeAddress?.trim() || 'Outlet Utama';
              const dateText = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

              // Construct Preset / Autotext strings
              const autoTextList = autoTextPresets && autoTextPresets.length > 0
                ? autoTextPresets.map((item, idx) => `🔥 ${item.keterangan.toUpperCase()} ➔ Rp ${item.hargaJual.toLocaleString('id-ID')}`).join('\n')
                : `🔥 PLN TOKEN LISTRIK 20 ➔ Rp 23.000\n🔥 PLN TOKEN LISTRIK 50 ➔ Rp 53.000\n🔥 DANA TOP UP 50K ➔ Rp 52.000\n🔥 GOPAY TOP UP 50K ➔ Rp 52.000`;

              let currentTemplateText = '';
              let title = '';
              let subtitle = '';

              if (copywritingCategory === 'brilink') {
                if (selectedPosterTab === 'qna') {
                  title = '🏦 TEMPLATE BRILINK Q&A PEMBUKUAN KASIR';
                  subtitle = 'Mengundang rekan sesama Agen BRILink bertanya solusi pembukuan anti selisih';
                  currentTemplateText = `📢 TANYA JAWAB BEBAS SELISIH: SOLUSI PEMBUKUAN AGEN BRILINK! 📢

Pusing tiap sore hitung saldo fisik vs laporan mutasi gak pernah pas? Sering bon jebol atau lupa catat biaya admin? Spill kesulitan pembukuan Anda sebagai Agen BRILink/Perbankan di kolom komentar! 👇

Nanti Admin Kasir Cuba (oleh konter: ${finalStore}, kasir: ${finalCashier}) akan bantu jelaskan langsung bagaimana aplikasi Kasir Cuba menyelesaikan masalah itu seketika!

APA YANG BISA ANDA TANYAKAN DI SINI?
✅ Cara melacak sisa modal kas & rekening secara real-time.
✅ Cara mencetak struk penarikan/transfer bank dengan biaya admin custom menggunakan printer Bluetooth.
✅ Cara menghitung keuntungan bersih per transaksi secara otomatis.
✅ Fitur catat kas masuk/keluar, kasbon mitra, & penarikan saldo secepat kilat.

SAYA JAWAB DISINI:
💡 ➔ Fitur pembukuan termudah khusus Agen Perbankan.
🛡️ ➔ Keamanan data rekap transaksi harian.
📊 ➔ Demo cetak struk profesional hemat kertas!

Tulis unek-unek pembukuan Anda sebagai agen keuangan di bawah, mari kita diskusikan solusinya secara gratis! 😊

Kasir Cuba - Aplikasi Pembukuan Ter-rapi & Ter-lengkap untuk Agen BRILink Indonesia! 🏦🧾`;
                } else if (selectedPosterTab === 'prices') {
                  title = '🔥 TEMPLATE HARGA & FITUR PRESTASI KASIR CUBA';
                  subtitle = 'Daftar keunggulan fitur pembukuan inovatif untuk operasional harian';
                  currentTemplateText = `🔥 KENAPA AGEN BRILINK WAJIB PAKAI APLIKASI KASIR CUBA? 🔥
📅 Update Fitur Per: ${dateText}
📍 Direkomendasikan oleh Outlet: ${finalStore} (${finalAddress})

Berikut adalah modul pembukuan multi-fungsi yang wajib dimiliki setiap Agen BRILink agar transaksi terekap rapi tanpa pusing selisih sepeser pun:

📋 RINCIAN MODUL UTAMA KASIR CUBA:
1️⃣ Sistem Catat Kasir BRILink: Catat transfer, tarik tunai, tarif admin, dan jenis bank kilat!
2️⃣ Manajemen Saldo Ganda: Pantau saldo kas fisik (laci) dan saldo rekening digital di satu layar.
3️⃣ Cetak Struk Bluetooth Custom: Buat struk transaksi profesional dengan nama konter sendiri!
4️⃣ Rekap Laba Bersih Otomatis: Ketahui keuntungan bersih harian/bulanan tanpa kalkulator manual.
5️⃣ Catatan Kasbon / Hutang: Aman dari lupa tagih saldo pelanggan nakal!

Ingin pembukuan bisnis Agen Anda naik kelas seperti ${finalStore}? 🚀
Coba gratis Kasir Cuba hari ini juga! Hubungi kami untuk dibimbing langsung cara pakainya oleh Kak ${finalCashier}! ✨`;
                } else {
                  title = '✨ CAPTION PREMIUM PROMO KASIR CUBA';
                  subtitle = 'Copywriting menyentuh keluhan harian agen konter & UMKM';
                  currentTemplateText = `Capek tiap malam begadang cuma buat nyari selisih Rp 10.000 yang hilang entah ke mana? 🥱 Uang administrasi gak terhitung, struk numpuk berantakan di laci, dan pusing nebak berapa untung bersih hari ini?

Saatnya beralih ke cara cerdas! Gabung sekarang di aplikasi Kasir Cuba — Aplikasi catatan pembukuan multi-fungsi terbaik untuk Agen BRILink, Konter Pulsa, dan UMKM! 🏦📈

Kenapa Kasir Cuba adalah pilihan terbaik bagi Anda?
1️⃣ Pembukuan Super Rapi & Bagus: Catat transaksi perbankan, transfer, maupun penjualan barang dalam satu aplikasi yang praktis.
2️⃣ Pelacakan Saldo Akurat: Bedakan saldo fisik di laci kasir dengan saldo rekening bank digital secara realtime demi menghindari kebocoran dana modal.
3️⃣ Cetak Struk Bluetooth Instan: Berikan bukti transaksi berstempel professional ke pelanggan Anda tanpa ribet.
4️⃣ Pantau Laba Rugi Realtime: Ketahui perkembangan bisnis Anda tiap detik tanpa perlu rekap manual di buku tulis!

Dapatkan kemudahan manajemen keuangan seperti yang dinikmati oleh konter kami ${finalStore} di ${finalAddress} bersama kasir andalan kami ${finalCashier}.

Ayok gabung sekarang di aplikasi Kasir Cuba! Jadikan usaha agen keuangan Anda lebih rapi, teratur, dan pastinya makin cuan melimpah! 📱🧾✨`;
                }
              } else if (copywritingCategory === 'voucher') {
                if (selectedPosterTab === 'qna') {
                  title = '📶 TEMPLATE VOUCHER Q&A PEMBUKUAN KONTER';
                  subtitle = 'Promosi interaktif mengajak konter pulsa merapikan rekap kuota';
                  currentTemplateText = `📢 TANYA-TANYA SOLUSI STOK VOUCHER & KUOTA ANTI EXPIRY! 📢

Konter pulsa Anda stok vouchernya sering ketlingsut? Lupa menyalin kode serial number, atau pusing mencatat penjualan pulsa masuk keluar yang super dinamis tiap harinya? Spill kendala operasional konter Anda di kolom komentar! 👇

Kasir handal dari ${finalStore}, Kak ${finalCashier}, akan tunjukkan langsung bagaimana Kasir Cuba membuat pencatatan stock voucher pulsa & paket internet jadi super gampang!

KEUNGGULAN YANG BISA DI-SPILL:
✅ Fitur Katalog Voucher untuk pelacakan sisa stok otomatis.
✅ Fitur Auto-Teks Pintar untuk menyalin detail penawaran kuota ke pembeli sekali klik.
✅ Pencatatan laba real-time per provider (Telkomsel, Indosat, XL, Axis, Tri, dll.).

Jangan biarkan usaha konter Anda lemot karena pembukuan manual yang ribet! Mari diskusikan fitur rapi ini di komentar sekarang! 😊`;
                } else if (selectedPosterTab === 'prices') {
                  title = '🔥 TEMPLATE LAYANAN KATALOG VOUCHER KASIR CUBA';
                  subtitle = 'List fitur pencatatan produk voucher & paket data paling diminati';
                  currentTemplateText = `🔥 REVOLUSI PEMBUKUAN KONTER PULSA & VOUCHER DENGAN KASIR CUBA 🔥
📅 Update Pembaharuan Per: ${dateText}
📍 Testimoni Konter: ${finalStore} (${finalAddress})

Saatnya bebaskan konter Anda dari resiko rugi gara-gara salah hitung stok voucher fisik atau pulsa transfer! Gunakan Kasir Cuba untuk pembukuan modern:

📋 DAFTAR FITUR UTAMA KHUSUS KONTER PULSA/VOUCHER:
1️⃣ Katalog Voucher Real-Time: Stok voucher fisik & data terlacak rapi, otomatis berkurang saat terjual!
2️⃣ Penjualan Produk Multi-Kategori: Bisa catat pulsa reguler, paket data, voucher game, hingga aksesoris HP secara instan.
3️⃣ Cetak Nota/Struk Digital: Bagikan nota belanja ke WhatsApp pembeli secara instan atau cetak via printer thermal Bluetooth.
4️⃣ Rekap Keuangan Terpusat: Laba bersih harian, setoran kasir harian, dan grafik laba terakumulasi rapi otomatis.

Ingin konter Anda serapi dan seefisien ${finalStore}?
Yuk, gabung dan pakai Aplikasi Pembukuan Kasir Cuba sekarang juga! Konsultasikan cara instalasi dengan kasir kami ${finalCashier}! ✨`;
                } else {
                  title = '✨ CAPTION COPYWRITING PROMO KASIR CUBA VOUCHER';
                  subtitle = 'Tulisan menggugah para pemilik konter kuota agar melek pembukuan rapi';
                  currentTemplateText = `Berapa banyak voucher kuota internet di konter Anda yang hangus/kadaluarsa karena lupa terjual? 😱 Berapa kali Anda rugi karena pelanggan bayar kuota belakangan tapi catatannya hilang di kertas coret-coretan?

Jangan biarkan keuntungan usaha konter pulsa Anda menguap begitu saja! Segera pakai aplikasi Kasir Cuba — aplikasi pembukuan multi-fungsi khusus untuk juragan konter, UMKM, dan agen pulsa! 📶📱

⚡ FITUR ANDALAN KASIR CUBA UNTUK KONTER ANDA:
1️⃣ Katalog Voucher Unggulan: Manajemen dan kontrol sisa stok voucher fisik & paket data secara digital dengan rapi dan gampang dipantau.
2️⃣ Catat Produk Penjualan: Bisa catat produk aksesoris HP, perdana, maupun jasa service dengan harga modal & harga jual terpisah.
3️⃣ Rapi & Modern: Bebas dari bon bocor dan rekap manual yang menghabiskan waktu tidur Anda di malam hari.
4️⃣ Laba Bersih Otomatis: Laporan laba dan omzet konter tersaji rapi dalam hitungan detik setelah penjualan disubmit.

Nikmati kontrol bisnis terbaik seperti konter terlaris ${finalStore} di ${finalAddress} yang dibantu oleh kasir andalan kami ${finalCashier}.

Ayok gabung sekarang di aplikasi Kasir Cuba! Pembukuan lancar, stok voucher terlacak, usaha konter pulsa makin melesat hebat! 🚀✨`;
                }
              } else if (copywritingCategory === 'retail') {
                // retail
                if (selectedPosterTab === 'qna') {
                  title = '🛒 TEMPLATE POS RETAIL KASIR CUBA Q&A';
                  subtitle = 'Sesi tanya jawab manfaat POS pembukuan serbaguna untuk toko kelontong';
                  currentTemplateText = `📢 TANYA JAWAB POS KASIR MODERN: KASIR CUBA UNTUK SEBAGAI UMKM RETAIL! 📢

Toko atau warung kelontong Anda barang dagangannya ratusan tapi pusing ngitungnya? Sering kecolongan barang habis, atau untung kelihatannya besar tapi modalnya habis entah kemana? Spill permasalahan tokomu di komentar! 👇

Mewakili toko kami ${finalStore}, kasir handal kami ${finalCashier} akan tunjukkan bagaimana Kasir Cuba mempermudah urusan kasir dan manajemen barang ritel Anda!

KEMUDAHAN YANG BISA KITA DISKUSIKAN:
✅ Pencatatan stok produk penjualan toko yang tak terbatas, rapi, dan otomatis terkalkulasi.
✅ Cetak struk belanjaan bendo/retail pelanggan dengan printer Bluetooth yang ringkas.
✅ Rekapitulasi kas kasir saat pergantian jam kerja tanpa selisih saldo laci.
✅ Fitur rekap transaksi penjualan lengkap untuk mendeteksi laba-rugi operasional.

Tanya rahasia kelola kasir toko retail modern ala Kasir Cuba di kolom komentar sekarang! Kembangkan tokomu jadi lebih maju! 😊`;
                } else if (selectedPosterTab === 'prices') {
                  title = '🔥 TEMPLATE FITUR MULTI-FUNGSI POS RETAIL';
                  subtitle = 'Kelebihan sistem kasir modern Kasir Cuba yang ramah UMKM';
                  currentTemplateText = `🔥 REKAP FITUR KASIR MODERN & MULTI-FUNGSI KASIR CUBA UNTUK UMKM 🔥
📅 Rilis Versi Terkini: ${dateText}
📍 Implementasi Sukses: ${finalStore} (${finalAddress})

Aplikasi Kasir Cuba bukan sekadar pembukuan biasa, melainkan alat kasir multi-fungsi terbaik untuk mendongkrak reputasi dan kerapian sistem keuangan tokomu:

📋 MODUL TERBAIK UNTUK BISNIS RETAIL & WARUNG ANDA:
1️⃣ Input Produk Penjualan Cepat: Masukkan ribuan jenis barang dagangan dengan detail stok dan harga modal teratur.
2️⃣ Struk POS Cetak Rapi: Beri pelanggan bukti belanja cetak Bluetooth mini ala minimarket modern!
3️⃣ Laporan Penjualan Akurat: Rekapan harian komplit dengan nominal total omzet, laba kotor, dan laba bersih.
4️⃣ Riwayat Transaksi Aman: Semua invoice tersimpan aman di database Cloud, bisa dilacak kapan saja jika ada komplain.

Mulai tinggalkan metode laci kayu pembukuan kertas konvensional! Hubungi kasir kami ${finalCashier} untuk info lebih lanjut seputar adopsi Kasir Cuba! ✨`;
                } else {
                  title = '✨ CAPTION COPYWRITING PROMO KAUNTOR KASIR CUBA';
                  subtitle = 'Copywriting premium menarik pemilik bisnis retail / toko UMKM beralih ke Kasir Cuba';
                  currentTemplateText = `Punya usaha warung, minimarket mandiri, toko sembako, atau UMKM kecil-kecilan tapi pembukuannya masih pake buku tulis yang sering ketumpahan kopi? 😱 Belanjaan pelanggan sering salah hitung gara-gara kasir yang kebingungan?

Yuk, naik kelas sekarang! Gabung di Kasir Cuba — aplikasi catatan pembukuan kasir multi-fungsi terbaik untuk juragan konter, warung kelontong, dan UMKM! 🛒📊

💡 KENAPA KASIR CUBA SANGAT COCOK UNTUK BISNIS RETAIL ANDA?
1️⃣ Serba Bisa Gak Pake Ribet: Bisa rekap saldo perbankan Agen, sekaligus catat produk penjualan fisik dengan harga modal harian terpisah.
2️⃣ Catatan Rapi & Bagus: Tampilan modern, bersih, bebas dari kesalahan kalkulasi manual, aman dari kebocoran laci uang kasir.
3️⃣ Hemat Biaya: Tidak perlu device POS kasir mahal berspesifikasi rumit, cukup handphone Anda saja yang terintegrasi printer Bluetooth!
4️⃣ Didukung Rekap Laba Rugi Otomatis: Analisa laba kotor vs laba bersih warung seketika tanpa perlu begadang tiap akhir bulan.

Gabung bersama ratusan UMKM modern lainnya seperti kami ${finalStore} di ${finalAddress} yang dibantu oleh kasir andal kami ${finalCashier}.

Ayok gabung sekarang di aplikasi Kasir Cuba! Catatan pembukuan rapi, bisnis modern berkelas, usahamu makin maju benderang! 🌟🧾✨`;
                }
              } else if (copywritingCategory === 'admin_promo') {
                if (selectedPosterTab === 'qna') {
                  title = '📣 PROMO: MURNI FITUR APLIKASI';
                  subtitle = 'Promosi tentang kegunaan, keistimewaan, dan kelebihan Kasir Cuba';
                  currentTemplateText = promoConfig?.promoAplikasiText || 'Beralih sekarang ke Kasir Cuba! Aplikasi pembukuan canggih untuk UMKM & Konter. Pencatatan otomatis, aman, dan dapat digunakan di berbagai perangkat! 🎉';
                } else if (selectedPosterTab === 'prices') {
                  title = '💎 PROMO: KEMITRAAN / AGEN BARU';
                  subtitle = 'Promosi peluang usaha merekrut mitra & agen baru Kasir Cuba';
                  currentTemplateText = promoConfig?.promoKemitraanText || 'Peluang Usaha Tanpa Modal! Jadi mitra Kasir Cuba dan dapatkan komisi Rp 10.000 per aktivasi! Kapan lagi bisa kerja sambilan cuma share kode?';
                } else {
                  title = '🏷️ PROMO: DISKON LISENSI AGEN';
                  subtitle = 'Penawaran lisensi murah menggunakan kode REFERRAL Anda';
                  currentTemplateText = promoConfig?.promoDiskonText || 'Dapatkan diskon khusus! Beli lisensi pro Kasir Cuba hanya Rp 60.000 dengan kode promo saya. Daftar sekarang sebelum kehabisan!';
                }
              }

              return (
                <div className="space-y-4">
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm font-sans text-slate-850 dark:text-slate-100">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="text-[10px] font-black text-slate-850 dark:text-slate-100 uppercase tracking-widest leading-none mb-1">{title}</h4>
                        <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold leading-none">{subtitle}</p>
                      </div>
                      <span className="text-[8px] font-black bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 px-2 py-0.5 rounded leading-none shrink-0 uppercase">
                        {
                          copywritingCategory === 'admin_promo' 
                          ? (selectedPosterTab === 'qna' ? 'Fitur App' : selectedPosterTab === 'prices' ? 'Rekrut Agen' : 'Diskon Kode')
                          : (selectedPosterTab === 'qna' ? 'Viral Q&A' : selectedPosterTab === 'prices' ? 'Live Price' : 'Caption')
                        }
                      </span>
                    </div>

                    {/* COPY AREA PREVIEW */}
                    <div className="relative mt-3">
                      <textarea
                        readOnly
                        value={currentTemplateText}
                        className="w-full text-[10.5px] font-mono leading-relaxed p-4 pb-16 bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 rounded-xl outline-none border border-slate-200 dark:border-slate-850 focus:border-emerald-500 transition-all resize-none h-64 overflow-y-auto"
                      />
                      <button
                        type="button"
                        onClick={() => handleCopyToClipboard(currentTemplateText, selectedPosterTab)}
                        className="absolute bottom-3 right-3 py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] rounded-lg tracking-wider uppercase flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer transition-all"
                      >
                        {copiedId === selectedPosterTab ? (
                          <>
                            <Check size={11} className="stroke-[3]" />
                            <span>BERHASIL DISALIN</span>
                          </>
                        ) : (
                          <>
                            <Copy size={11} className="stroke-[3]" />
                            <span>SALIN SATU KETUK</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* TIPS */}
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-150 dark:border-blue-900/40 rounded-xl text-[9px] font-bold text-blue-700 dark:text-blue-400 leading-relaxed flex gap-2">
                    <span className="text-[12px] shrink-0 leading-none">💡</span>
                    <div>
                      <strong>Tips Promosi Efektif:</strong> Gunakan opsi <strong>"Salin Satu Ketuk"</strong> untuk langsung memindahkan seluruh teks promo beserta susunan emoji indah ke WhatsApp Status, Facebook Post, Instagram Caption, atau kolom deskripsi Live TikTok Anda untuk mendatangkan pelanggan baru secara cepat dan masif!
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* TAB 3: POSTER PROMO */}
        {activeTab === 'poster' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 p-3 rounded-2xl text-[10px] font-bold text-center border border-purple-200 dark:border-purple-800 tracking-wide font-sans">
              <Camera size={18} className="mx-auto mb-2 opacity-50" />
              Silakan <strong>Simpan Gambar</strong> atau Screenshot poster di bawah ini untuk dibagikan ke Media Sosial, Group WhatsApp, atau ditempel di konter Anda.
            </div>

            <button 
              onClick={downloadPoster}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] uppercase tracking-wider rounded-2xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Download size={18} /> DOWNLOAD POSTER (.PNG)
            </button>

            {/* THE POSTER ELEMENT */}
            <div ref={posterRef} className="w-full aspect-[3/4] relative rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-violet-900 via-purple-800 to-emerald-900 flex flex-col pt-8 pb-6 px-6 justify-between select-none border-4 border-slate-900 ring-2 ring-purple-500/30">
              
              {/* Background Shapes */}
              <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute bottom-[-5%] left-[-10%] w-64 h-64 bg-purple-500/30 rounded-full blur-3xl pointer-events-none"></div>

              {/* Poster Header */}
              <div className="relative z-10 text-center space-y-2">
                <div className="inline-block bg-white/10 backdrop-blur-sm border border-white/20 px-3 py-1.5 rounded-full mb-2">
                  <span className="text-emerald-300 font-extrabold text-[10px] tracking-widest uppercase">Solusi Bisnis Kasir</span>
                </div>
                <h1 className="text-4xl font-black text-white tracking-tighter drop-shadow-lg leading-none">
                  KASIR <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-yellow-300">CUBA</span>
                </h1>
                <p className="text-[11px] font-extrabold text-purple-200 uppercase tracking-widest mt-1 opacity-90 drop-shadow">
                  Aplikasi Kasir Modern & Mudah
                </p>
              </div>

              {/* Poster Middle / Features */}
              <div className="relative z-10 space-y-4 mt-auto mb-auto">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-xl transform -rotate-2 hover:rotate-0 transition-transform">
                  <h3 className="text-yellow-300 font-black text-lg uppercase tracking-wider mb-2 text-center drop-shadow-md">
                    LIFETIME PRO LICENSE
                  </h3>
                  
                  <div className="flex items-center justify-center gap-3">
                    <div className="flex flex-col items-end">
                       <span className="text-[9px] font-bold text-white/70 uppercase tracking-widest mb-1">Standard</span>
                       <del className="text-lg font-black text-white/50 decoration-rose-500 decoration-[3px] drop-shadow-md">Rp {(promoConfig?.normalPrice || 100000)/1000}K</del>
                    </div>
                    <div className="bg-emerald-500 px-4 py-2 rounded-xl shadow-inner transform rotate-3">
                       <span className="block text-[8.5px] font-black text-emerald-950 uppercase tracking-widest mb-1">Promo Khusus</span>
                       <span className="block text-3xl font-black text-white leading-none drop-shadow-sm">Rp {(promoConfig?.promoPrice || 60000)/1000}K</span>
                    </div>
                  </div>
                </div>

                <ul className="space-y-2.5 px-2">
                  <li className="flex items-center gap-2 text-[11px] font-black text-white drop-shadow-md">
                    <CheckCircle2 size={16} className="text-emerald-400" /> Bebas Biaya Langganan Bulanan
                  </li>
                  <li className="flex items-center gap-2 text-[11px] font-black text-white drop-shadow-md">
                    <CheckCircle2 size={16} className="text-emerald-400" /> Laporan Laba Rugi Otomatis
                  </li>
                  <li className="flex items-center gap-2 text-[11px] font-black text-white drop-shadow-md">
                    <CheckCircle2 size={16} className="text-emerald-400" /> Cetak Struk & Pembukuan Rapi
                  </li>
                </ul>
              </div>

              {/* Poster Footer (Referral info) */}
              <div className="relative z-10 bg-black/40 backdrop-blur-sm border border-white/10 rounded-2xl p-4 text-center">
                <p className="text-[9.5px] font-bold text-emerald-300 uppercase tracking-wide mb-2 opacity-90 drop-shadow-sm">
                  Cara Klaim Diskon?
                </p>
                <div className="text-[12px] font-black text-white leading-snug drop-shadow">
                  Gunakan Kode Promo:<br/>
                  <span className="inline-block mt-2 text-2xl font-mono tracking-widest text-yellow-300 py-1.5 px-4 bg-white/10 border border-yellow-300/30 rounded-xl">
                    {referralCode || 'KODE-AGEN'}
                  </span>
                </div>
                <p className="text-[8px] text-white/60 font-bold uppercase mt-3 pt-3 border-t border-white/10 leading-relaxed">
                  Gabung Program Kemitraan! Sebarkan kode ini & dapatkan komisi Rp {(promoConfig?.referralPoints || 10000).toLocaleString('id-ID')} untuk setiap aktivasi sukses pengguna.
                </p>
              </div>

            </div>
            
          </div>
        )}
      </div>

      {/* WITHDRAWAL MODAL */}
      {showWdModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700/80 flex items-center justify-between">
              <span className="text-xs font-black text-slate-850 dark:text-slate-50 uppercase tracking-widest flex items-center gap-1.5 font-sans">
                <Wallet size={14} className="text-purple-600" /> Pengajuan Pencairan
              </span>
              <button 
                type="button"
                onClick={() => {
                  setShowWdModal(false);
                  setWdMsg({ type: '', text: '' });
                }}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleRequestWithdrawal} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">PILIH METODE PENERIMAAN:</label>
                <select 
                  className="w-full bg-slate-50 dark:bg-slate-900 text-xs font-bold p-3 border-2 border-slate-150 dark:border-slate-800/80 rounded-xl text-slate-750 dark:text-slate-100 outline-none focus:border-purple-500 transition-all cursor-pointer font-sans"
                  value={wdMethod}
                  onChange={(e) => setWdMethod(e.target.value)}
                >
                  <option value="DANA">🏦 SALDO ELEKTRONIK DANA</option>
                  <option value="SHOPEEPAY">🏦 SALDO SHOPEEPAY</option>
                  <option value="GOPAY">🏦 SALDO GO-PAY</option>
                  <option value="OVO">🏦 SALDO OVO</option>
                  <option value="BANK TRANS">🏦 REKENING BANK TRANSFER (BCA, BRI, Mandiri, BNI)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">DETAIL NOMOR HP / REKENING & ATAS NAMA:</label>
                <textarea 
                  value={wdDetails}
                  onChange={(e) => setWdDetails(e.target.value)}
                  placeholder="Contoh: DANA - 08123456789 - a/n Budi Santoso"
                  rows={2}
                  className="w-full bg-slate-50 dark:bg-slate-900 text-xs font-bold p-3 border-2 border-slate-150 dark:border-slate-800/80 rounded-xl text-slate-750 dark:text-slate-100 outline-none focus:border-purple-500 transition-all resize-none font-sans"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">JUMLAH PENARIKAN (RUPIAH):</label>
                <input 
                  type="number"
                  value={wdAmount}
                  onChange={(e) => setWdAmount(Math.max(50000, Number(e.target.value)))}
                  min={50000}
                  className="w-full bg-slate-100 dark:bg-slate-900 text-xs font-black p-3 border-2 border-slate-150 dark:border-slate-805 rounded-xl text-slate-750 dark:text-white outline-none font-mono"
                  disabled
                />
                <span className="block text-[8px] text-slate-400 font-bold uppercase mt-1 tracking-tight">* Sistem secara otomatis mencairkan komisi maksimal yang Anda miliki saat ini.</span>
              </div>

              {wdMsg.text && (
                <div className={cn(
                  "p-3 rounded-xl text-[10px] font-black tracking-tight border flex gap-2 font-sans",
                  wdMsg.type === 'success' ? "bg-emerald-50 text-emerald-800 border-emerald-250" : "bg-rose-50 text-rose-700 border-rose-200"
                )}>
                  {wdMsg.type === 'success' ? <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" /> : <X size={14} className="text-rose-500 shrink-0 mt-0.5" />}
                  <p>{wdMsg.text}</p>
                </div>
              )}

              <div className="pt-2 flex gap-2 font-sans">
                <button
                  type="button"
                  onClick={() => {
                    setShowWdModal(false);
                    setWdMsg({ type: '', text: '' });
                  }}
                  className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-455 hover:bg-slate-200 font-extrabold text-[10px] uppercase rounded-xl tracking-wider transition-all cursor-pointer"
                >
                  BATAL
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-black text-[10px] uppercase rounded-xl tracking-wider transition-all cursor-pointer active:scale-95 shadow-md"
                >
                  KIRIM PERMINTAAN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
