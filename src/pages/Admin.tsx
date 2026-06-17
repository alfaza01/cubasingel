import React, { useState } from 'react';
import { ShieldCheck, Users, Database, Activity, RefreshCcw } from 'lucide-react';
import { useLicense } from '../context/LicenseContext';
import { useStore } from '../context/StoreContext';
import { Navigate } from 'react-router';

export function Admin() {
  const { 
    isAdmin, 
    waNumber, 
    updateWaNumber, 
    generateLicenseCode, 
    usedLicenses, 
    unusedLicenses,
    allWithdrawals,
    approveWithdrawal,
    rejectWithdrawal 
  } = useLicense();
  const { transactions, products, contacts, kasbons } = useStore();
  
  const [adminWaInput, setAdminWaInput] = useState(waNumber);
  const [adminGenCode, setAdminGenCode] = useState('');
  const [targetEmail, setTargetEmail] = useState('');
  
  // Rejection reasons state keyed by withdrawalId
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});
  const [wdActionFeedback, setWdActionFeedback] = useState<Record<string, string>>({});
  
  // Custom states for neat UI feedback
  const [licenseFeedback, setLicenseFeedback] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [waFeedback, setWaFeedback] = useState<{type: 'success' | 'error', message: string} | null>(null);
  
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const handleGenerateLicenseCode = async () => {
    setLicenseFeedback(null);
    if (!targetEmail || !targetEmail.includes('@')) {
      setLicenseFeedback({ type: 'error', message: 'Harap masukkan email tujuan yang valid.' });
      return;
    }
    
    try {
      const gCode = await generateLicenseCode(targetEmail);
      setAdminGenCode(gCode);
      setTargetEmail(''); // clear email logic after success
      setLicenseFeedback({ type: 'success', message: 'Kode berhasil di-generate!' });
    } catch(err: any) {
      console.error(err);
      setLicenseFeedback({ 
        type: 'error', 
        message: err.message?.includes('Missing or insufficient permissions') 
          ? 'Akses Ditolak: Pastikan email sudah terdaftar di Firestore Rules' 
          : 'Gagal generate kode lisensi. Cek koneksi / database.'
      });
    }
  };
  
  const handleSaveAdminWa = async () => {
    setWaFeedback(null);
    try {
      await updateWaNumber(adminWaInput);
      setWaFeedback({ type: 'success', message: 'Nomor WA Lisensi berhasil diperbarui.' });
    } catch (err: any) {
       console.error(err);
       setWaFeedback({ type: 'error', message: 'Gagal menyimpan WA. Pastikan punya izin.' });
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 md:p-6 pb-24 space-y-6">
      
      <div className="bg-slate-900 rounded-[2rem] shadow-xl border border-slate-700/50 overflow-hidden relative">
        <div className="p-6 md:p-8 relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-yellow-500/20 text-yellow-500 rounded-2xl flex items-center justify-center border border-yellow-500/30">
              <ShieldCheck size={32} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white uppercase tracking-tight">Admin<br/>Dashboard</h1>
              <p className="text-yellow-400 text-xs font-bold uppercase tracking-widest mt-1">Sistem Pusat</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700">
               <p className="text-[9px] text-slate-400 font-bold uppercase mb-1 flex items-center gap-1.5"><Users size={12}/> Lisensi Terpakai</p>
               <p className="text-2xl font-black text-white">{Object.keys(usedLicenses).length}</p>
            </div>
            <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700">
               <p className="text-[9px] text-slate-400 font-bold uppercase mb-1 flex items-center gap-1.5"><Database size={12}/> Tersedia</p>
               <p className="text-2xl font-black text-white">{Object.keys(unusedLicenses).length}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Pengaturan Lisensi */}
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800">
         <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider mb-5 flex items-center gap-2">
           <ShieldCheck size={16} className="text-yellow-500"/> Manajemen Lisensi
         </h2>
         
         <div className="space-y-4">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50">
               <h3 className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-3">Nomor WA Beli Lisensi</h3>
               <div className="flex gap-2 mb-3">
                  <input 
                     type="text" 
                     value={adminWaInput} 
                     onChange={(e) => setAdminWaInput(e.target.value)}
                     className="w-full text-xs font-bold p-3.5 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-xl outline-none focus:border-yellow-500 dark:focus:border-yellow-500 text-slate-800 dark:text-white transition-all shadow-sm" 
                  />
                  <button onClick={handleSaveAdminWa} className="bg-yellow-500 hover:bg-yellow-600 text-white font-black px-5 rounded-xl text-[10px] uppercase tracking-wider active:scale-95 transition-all shadow-md shadow-yellow-500/20 flex-shrink-0">
                    SIMPAN
                  </button>
               </div>
               {waFeedback && (
                 <div className={`p-3 rounded-xl border text-[10px] font-bold ${waFeedback.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-400' : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400'}`}>
                   {waFeedback.message}
                 </div>
               )}
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50">
               <h3 className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-3">Generator Kode Lisensi Baru</h3>
               
               <div className="mb-4">
                 <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Email Pengguna (Target)</label>
                 <input 
                   type="email" 
                   value={targetEmail}
                   onChange={e => setTargetEmail(e.target.value)}
                   className="w-full bg-white dark:bg-slate-800 text-sm p-3.5 rounded-xl border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all dark:text-white"
                   placeholder="misal: budi@gmail.com"
                 />
               </div>

               {licenseFeedback && licenseFeedback.type === 'error' && (
                 <div className="mb-3 p-3 rounded-xl border border-red-200 text-[10px] font-bold bg-red-50 text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400">
                   {licenseFeedback.message}
                 </div>
               )}

               <button onClick={handleGenerateLicenseCode} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                  <RefreshCcw size={16}/> GENERATE KODE
               </button>
               {adminGenCode && (
                  <div className="mt-3 text-center bg-indigo-50 dark:bg-indigo-900/40 p-4 rounded-xl border border-indigo-100 dark:border-indigo-500/30 animate-in fade-in slide-in-from-top-2">
                     <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold mb-1 uppercase tracking-wider">Berhasil Generate:</p>
                     <p className="font-mono text-xl font-black text-indigo-700 dark:text-indigo-300 tracking-widest select-all">{adminGenCode}</p>
                  </div>
               )}
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50 mt-4">
               <h3 className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-3">Daftar Lisensi Belum Digunakan</h3>
               {unusedLicenses.length === 0 ? (
                 <p className="text-xs text-slate-400 italic">Tidak ada lisensi tersedia.</p>
               ) : (
                 <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                   {unusedLicenses.map((lic: any) => (
                     <div key={lic.id} className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                       <div>
                         <p className="font-mono font-bold text-sm text-indigo-600 dark:text-indigo-400">{lic.code}</p>
                         {lic.assignedEmail && (
                           <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Target: <b>{lic.assignedEmail}</b></p>
                         )}
                       </div>
                       <span className="bg-emerald-100 text-emerald-700 text-[9px] font-black px-2 py-1 rounded">TERSEDIA</span>
                     </div>
                   ))}
                 </div>
               )}
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50 mt-4">
               <h3 className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-3">Daftar Lisensi Terpakai</h3>
               {usedLicenses.length === 0 ? (
                 <p className="text-xs text-slate-400 italic">Belum ada lisensi yang digunakan.</p>
               ) : (
                 <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                   {usedLicenses.map((lic: any) => (
                     <div key={lic.id} className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                       <p className="font-mono font-bold text-xs text-slate-500 dark:text-slate-400">{lic.code}</p>
                       <p className="text-[10px] text-slate-600 dark:text-slate-300 mt-1">Digunakan oleh: <b>{lic.usedByEmail}</b></p>
                     </div>
                   ))}
                 </div>
               )}
            </div>
         </div>
      </div>
      
      {/* Persetujuan Penarikan Komisi Referral */}
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800">
         <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider mb-5 flex items-center gap-2">
           <Users size={16} className="text-purple-500"/> Persetujuan Tarik Komisi
         </h2>
         
         <div className="space-y-4">
           {!allWithdrawals || allWithdrawals.length === 0 ? (
             <p className="text-xs text-slate-400 italic text-center py-4">Belum ada history atau permintaan pencairan komisi referral.</p>
           ) : (
             <div className="space-y-3.5">
               {allWithdrawals.map((wd) => {
                 const isPending = wd.status === 'pending';
                 const feedback = wdActionFeedback[wd.id];
                 
                 return (
                   <div key={wd.id} className="bg-slate-50 dark:bg-slate-850/45 p-4.5 rounded-2xl border border-slate-150 dark:border-slate-750/30 space-y-3.5">
                     <div className="flex justify-between items-start">
                       <div>
                         <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase">AKUN SALES / PEMOHON</p>
                         <p className="text-xs font-black text-slate-800 dark:text-white mt-0.5">{wd.userByEmail || wd.userEmail}</p>
                       </div>
                       <span className="text-[10px] font-black font-mono text-purple-600 dark:text-purple-300 bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-900/60 px-2.5 py-1 rounded-xl">
                         Rp {wd.amount.toLocaleString('id-ID')}
                       </span>
                     </div>

                     <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-850 space-y-1 text-slate-800 dark:text-slate-100">
                       <span className="block text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase font-mono">TUJUAN OUTLET TRANSFER:</span>
                       <p className="text-[10.5px] font-mono font-bold leading-tight">{wd.details}</p>
                       <span className="inline-block bg-slate-100 dark:bg-slate-800 text-[8.5px] font-bold px-1.5 py-0.5 rounded uppercase mt-1">METODE: {wd.method}</span>
                     </div>

                     <div className="flex items-center justify-between text-[9px] text-slate-400 dark:text-slate-500 font-bold">
                       <span>Tanggal: {wd.createdAt ? new Date(wd.createdAt).toLocaleString('id-ID') : 'Baru'}</span>
                       <span className="font-sans px-2.5 py-0.5 rounded-full uppercase scale-90 border font-black" style={{
                         backgroundColor: wd.status === 'approved' ? '#d1fae5' : wd.status === 'rejected' ? '#fee2e2' : '#ffedd5',
                         color: wd.status === 'approved' ? '#065f46' : wd.status === 'rejected' ? '#991b1b' : '#9a3412',
                         borderColor: wd.status === 'approved' ? '#a7f3d0' : wd.status === 'rejected' ? '#fca5a5' : '#fed7aa',
                       }}>
                         {wd.status === 'approved' ? 'SELESAI (SUDAH DIKIRIM)' : wd.status === 'rejected' ? 'DITOLAK' : 'MENUNGGU TRANSFER'}
                       </span>
                     </div>

                     {/* JIKA STATUSNYA PENDING, ADMIN BISA MENYETUJUI ATAU MENOLAK */}
                     {isPending && (
                       <div className="pt-2 border-t border-dashed border-slate-200 dark:border-slate-800 space-y-2.5">
                         {/* Input Alasan Rejection */}
                         <div>
                           <label className="text-[8.5px] font-bold text-slate-400 dark:text-slate-500 block uppercase mb-1">Catatan Admin (Wajib diisi jika ingin menolak):</label>
                           <input
                             type="text"
                             value={rejectionReasons[wd.id] || ''}
                             onChange={(e) => setRejectionReasons({ ...rejectionReasons, [wd.id]: e.target.value })}
                             placeholder="Contoh: Nomor gopay tidak ditemukan / salah"
                             className="w-full text-xs p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-1 focus:ring-purple-400 text-slate-850 dark:text-slate-100"
                           />
                         </div>

                         <div className="flex gap-2">
                           <button
                             type="button"
                             onClick={async () => {
                               setWdActionFeedback({ ...wdActionFeedback, [wd.id]: 'Sedang memproses persetujuan...' });
                               let res = { message: 'Pencairan disetujui!' }; try { await approveWithdrawal(wd.id, 'TRF-OK-' + Date.now().toString().slice(-6)); } catch(e: any) { res = { message: 'Gagal menyetujui: ' + e.message }; }
                               setWdActionFeedback({ ...wdActionFeedback, [wd.id]: res.message });
                             }}
                             className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[9px] uppercase rounded-xl shadow-md active:scale-95 transition-all cursor-pointer text-center"
                           >
                             SETUJUI & TRANSFER LUNAS
                           </button>
                           <button
                             type="button"
                             onClick={async () => {
                               const reason = rejectionReasons[wd.id]?.trim() || 'Data penarikan kurang sesuai, hubungi admin.';
                               setWdActionFeedback({ ...wdActionFeedback, [wd.id]: 'Sedang memproses penolakan...' });
                               let res = { message: 'Dana pencairan berhasil ditolak dan dikembalikan ke mitra.' }; try { await rejectWithdrawal(wd.id, reason); } catch(e: any) { res = { message: 'Gagal menolak: ' + e.message }; }
                               setWdActionFeedback({ ...wdActionFeedback, [wd.id]: res.message });
                             }}
                             className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-[9px] uppercase rounded-xl shadow-md active:scale-95 transition-all cursor-pointer text-center"
                           >
                             TOLAK PERMINTAAN
                           </button>
                         </div>
                       </div>
                     )}

                     {feedback && (
                       <p className="text-[9.5px] font-extrabold text-indigo-600 dark:text-indigo-400 mt-1.5 text-center bg-indigo-50 dark:bg-indigo-950/40 p-2 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
                         {feedback}
                       </p>
                     )}
                   </div>
                 );
               })}
             </div>
           )}
         </div>
      </div>
      
      {/* Metrik Penggunaan Global (Store) */}
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800">
         <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider mb-5 flex items-center gap-2">
           <Activity size={16} className="text-blue-500"/> METRIK PENGGUNAAN TOKO
         </h2>
         <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50">
              <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Total Transaksi</p>
              <p className="text-2xl font-black text-slate-700 dark:text-white">{transactions.length}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50">
              <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Total Inventori</p>
              <p className="text-2xl font-black text-slate-700 dark:text-white">{products.length}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50">
              <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Total Kontak</p>
              <p className="text-2xl font-black text-slate-700 dark:text-white">{contacts.length}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50">
              <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Total Kasbon</p>
              <p className="text-2xl font-black text-slate-700 dark:text-white">{kasbons.length}</p>
            </div>
         </div>
      </div>
      
    </div>
  );
}
