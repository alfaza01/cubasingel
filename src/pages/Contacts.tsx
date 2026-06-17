import React, { useState } from 'react';
import { 
  ArrowLeft, Search, UserPlus, Phone, CreditCard, 
  Pencil, Trash, X, Save, Copy, Check, Briefcase, UserCheck
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { useStore } from '../context/StoreContext';
import { ContactNode } from '../types';

export function Contacts() {
  const navigate = useNavigate();
  const { contacts, addContact, updateContact, deleteContact, storeName } = useStore();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'SEMUA' | 'PELANGGAN' | 'AGEN' | 'SUPPLIER'>('SEMUA');

  // Modal / Drawer state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeId, setActiveId] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [bankName, setBankName] = useState('');
  const [customBankName, setCustomBankName] = useState('');
  const [isCustomBank, setIsCustomBank] = useState(false);
  const [accountNumber, setAccountNumber] = useState('');
  const [type, setType] = useState<'PELANGGAN' | 'AGEN' | 'SUPPLIER'>('PELANGGAN');
  const [notes, setNotes] = useState('');

  // Action states
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Copy helper
  const handleCopy = (txt: string, id: string) => {
    navigator.clipboard.writeText(txt);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleOpenAddModal = () => {
    setIsEditMode(false);
    setName('');
    setPhone('');
    setBankName('BANK BRI');
    setCustomBankName('');
    setIsCustomBank(false);
    setAccountNumber('');
    setType('PELANGGAN');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (c: ContactNode) => {
    setIsEditMode(true);
    setActiveId(c.id);
    setName(c.name);
    setPhone(c.phone);
    
    const standardBanks = ['BANK BRI', 'BANK BCA', 'BANK MANDIRI', 'BANK BNI', 'SEABANK', 'DANA', 'GOPAY', 'SHOPEEPAY'];
    const currentBank = (c.bankName || '').toUpperCase().trim();
    if (currentBank && !standardBanks.includes(currentBank)) {
      setIsCustomBank(true);
      setBankName('MANUAL');
      setCustomBankName(c.bankName || '');
    } else {
      setIsCustomBank(false);
      setBankName(currentBank || 'BANK BRI');
      setCustomBankName('');
    }
    
    setAccountNumber(c.accountNumber || '');
    setType(c.type);
    setNotes(c.notes || '');
    setIsModalOpen(true);
  };

  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Nama kontak tidak boleh kosong!');
      return;
    }

    const finalBankName = (isCustomBank ? customBankName : bankName).toUpperCase().trim();
    if (isCustomBank && !customBankName.trim()) {
      alert('Nama kategori atau bank manual harus diisi!');
      return;
    }

    if (isEditMode) {
      updateContact(activeId, {
        name,
        phone,
        bankName: finalBankName,
        accountNumber,
        type,
        notes
      });
      showTemporarySuccess('Berhasil memperbarui kontak!');
    } else {
      addContact({
        name,
        phone,
        bankName: finalBankName,
        accountNumber,
        type,
        notes
      });
      showTemporarySuccess('Kontak baru berhasil disimpan!');
    }

    setIsModalOpen(false);
  };

  const showTemporarySuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus kontak ini?')) {
      deleteContact(id);
      showTemporarySuccess('Kontak berhasil dihapus!');
    }
  };

  // Filter logic
  const filteredContacts = contacts.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      (c.accountNumber && c.accountNumber.includes(searchQuery)) ||
      (c.bankName && c.bankName.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (filterType === 'SEMUA') return matchesSearch;
    return matchesSearch && c.type === filterType;
  });

  // Calculate stats
  const totalCount = contacts.length;
  const pelangganCount = contacts.filter(c => c.type === 'PELANGGAN').length;
  const agenCount = contacts.filter(c => c.type === 'AGEN').length;
  const supplierCount = contacts.filter(c => c.type === 'SUPPLIER').length;

  return (
    <div className="bg-slate-50 dark:bg-slate-900 min-h-screen pb-24">
      {/* HEADER SECTION */}
      <div className="bg-[#1e3a8a] text-white pt-8 pb-10 px-4 rounded-b-[2rem] relative shadow-md">
        <div className="flex items-center gap-3 mb-6">
          <button 
            onClick={() => navigate('/')} 
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <ArrowLeft size={18} strokeWidth={2.5} />
          </button>
          <div>
            <h1 className="font-black text-lg tracking-wide uppercase">KONTAK MITRA & PELANGGAN</h1>
            <p className="text-[10px] text-blue-200 uppercase font-bold tracking-wider leading-none">DATABASE REKENING & INFORMASI {storeName}</p>
          </div>
        </div>

        {/* STATS CHIPS */}
        <div className="grid grid-cols-4 gap-1.5 mt-2">
          <StatChip label="Semua" count={totalCount} active={filterType === 'SEMUA'} onClick={() => setFilterType('SEMUA')} />
          <StatChip label="Pelanggan" count={pelangganCount} active={filterType === 'PELANGGAN'} onClick={() => setFilterType('PELANGGAN')} />
          <StatChip label="Agen" count={agenCount} active={filterType === 'AGEN'} onClick={() => setFilterType('AGEN')} />
          <StatChip label="Supplier" count={supplierCount} active={filterType === 'SUPPLIER'} onClick={() => setFilterType('SUPPLIER')} />
        </div>
      </div>

      {/* SEARCH AND ADD ACTION ROWS */}
      <div className="px-4 mt-5 flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari nama, No WA, bank atau nomor rekening..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-slate-800 border border-slate-200/80 pl-10 pr-4 py-2.5 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all shadow-sm"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold hover:text-slate-600 dark:text-slate-300">
              <X size={14} />
            </button>
          )}
        </div>
        <button 
          onClick={handleOpenAddModal}
          className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-extrabold px-4 py-2.5 rounded-2xl flex items-center gap-1.5 transition-all shadow-md active:scale-95"
        >
          <UserPlus size={16} strokeWidth={2.5} /> TAMBAH
        </button>
      </div>

      {/* FLOAT NOTIFICATION ALERT */}
      {successMsg && (
        <div className="mx-4 mt-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl px-4 py-3 flex items-center justify-between shadow-sm animate-in fade-in duration-300">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <p className="text-xs font-bold">{successMsg}</p>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-500 hover:text-emerald-700">
            <X size={14} />
          </button>
        </div>
      )}

      {/* CONTACT LIST */}
      <div className="px-4 mt-4 space-y-3">
        {filteredContacts.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 text-center shadow-sm">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
              <UserCheck className="text-slate-400" size={24} />
            </div>
            <p className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">Tidak Ada Kontak</p>
            <p className="text-[11px] text-slate-400 mt-1">Coba sesuaikan kata pencarian Anda.</p>
          </div>
        ) : (
          filteredContacts.map(c => {
            const initials = c.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
            const badgeColors = 
              c.type === 'PELANGGAN' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
              c.type === 'AGEN' ? 'bg-amber-50 text-amber-700 border-amber-200' :
              'bg-blue-50 text-blue-700 border-blue-200';

            return (
              <div 
                key={c.id} 
                className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-150/80 shadow-[0_4px_15px_rgba(0,0,0,0.01)] hover:shadow-md transition-all relative flex flex-col justify-between"
              >
                {/* Header info */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center font-black text-xs shadow-inner
                      ${c.type === 'PELANGGAN' ? 'bg-emerald-500/10 text-emerald-600' :
                        c.type === 'AGEN' ? 'bg-amber-500/10 text-amber-600' :
                        'bg-blue-500/10 text-blue-600'
                      }
                    `}>
                      {initials}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 leading-tight">{c.name}</h3>
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${badgeColors}`}>
                          {c.type}
                        </span>
                      </div>
                      <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                        <Phone size={10} /> {c.phone || 'TIDAK ADA NO HP'}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-1.5">
                    <button 
                      onClick={() => handleOpenEditModal(c)}
                      className="w-7 h-7 rounded-lg hover:bg-slate-150 text-slate-500 dark:text-slate-400 hover:text-blue-600 flex items-center justify-center transition-all bg-slate-50 dark:bg-slate-900 border border-slate-250/30"
                    >
                      <Pencil size={12} />
                    </button>
                    <button 
                      onClick={() => handleDelete(c.id)}
                      className="w-7 h-7 rounded-lg hover:bg-red-50 text-slate-500 dark:text-slate-400 hover:text-red-500 flex items-center justify-center transition-all bg-slate-50 dark:bg-slate-900 border border-slate-250/30"
                    >
                      <Trash size={12} />
                    </button>
                  </div>
                </div>

                {/* Account card sub-panel if bank is registered */}
                <div className="mt-3.5 bg-slate-50/80 rounded-xl p-3 border border-slate-100/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard size={13} className="text-slate-400 shrink-0" />
                    <div>
                      <p className="text-[9px] font-black text-slate-400 leading-none uppercase">REKENING TERDAFTAR</p>
                      {c.bankName || c.accountNumber ? (
                        <p className="text-xs font-black text-slate-700 dark:text-slate-200 mt-1">
                          <span className="text-[#1e3a8a]">{c.bankName?.toUpperCase() || ''}</span> 
                          <span className="mx-1 text-slate-350">•</span> 
                          <span>{c.accountNumber || '-'}</span>
                        </p>
                      ) : (
                        <p className="text-[10px] font-bold text-slate-400 mt-1">Belum mendaftarkan nomor rekening</p>
                      )}
                    </div>
                  </div>

                  {(c.bankName || c.accountNumber) && (
                    <button 
                      onClick={() => handleCopy(`${c.bankName} ${c.accountNumber}`, c.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-[9px] font-bold flex items-center gap-1 transition-all
                        ${copiedId === c.id 
                          ? 'bg-emerald-500 text-white' 
                          : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:bg-slate-800 active:scale-95'
                        }
                      `}
                    >
                      {copiedId === c.id ? (
                        <>
                          <Check size={9} strokeWidth={3} /> COPIED
                        </>
                      ) : (
                        <>
                          <Copy size={9} /> COPY REK
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Additional Note */}
                {c.notes && (
                  <div className="mt-2 text-[9.5px] font-semibold text-slate-400 bg-amber-50/20 border border-amber-100/35 rounded-lg p-2 italic leading-relaxed">
                    * {c.notes}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* POPUP MODAL DRAWER (ADD / EDIT FORM) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-xl flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-[#1e3a8a] text-white">
              <div className="flex items-center gap-2">
                <UserCheck size={16} className="text-orange-400" />
                <h2 className="font-extrabold text-sm uppercase tracking-wide">
                  {isEditMode ? 'PERBARUI DATA KONTAK' : 'TAMBAH KONTAK BARU'}
                </h2>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all text-white"
              >
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>

            {/* Form body */}
            <form onSubmit={handleSaveContact} className="p-5 pb-10 overflow-y-auto space-y-4">
              
              {/* TIPE KONTAK */}
              <div>
                <label className="text-[10px] font-black text-slate-400 block mb-2 uppercase tracking-wide">TIPE MITRA / KONTAK</label>
                <div className="grid grid-cols-3 gap-2">
                  <button 
                    type="button"
                    onClick={() => setType('PELANGGAN')}
                    className={`py-2 rounded-xl text-xs font-black uppercase text-center border transition-all active:scale-95
                      ${type === 'PELANGGAN' 
                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/10' 
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-900'
                      }
                    `}
                  >
                    Pelanggan
                  </button>
                  <button 
                    type="button"
                    onClick={() => setType('AGEN')}
                    className={`py-2 rounded-xl text-xs font-black uppercase text-center border transition-all active:scale-95
                      ${type === 'AGEN' 
                        ? 'bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-500/10' 
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-900'
                      }
                    `}
                  >
                    Agen
                  </button>
                  <button 
                    type="button"
                    onClick={() => setType('SUPPLIER')}
                    className={`py-2 rounded-xl text-xs font-black uppercase text-center border transition-all active:scale-95
                      ${type === 'SUPPLIER' 
                        ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/10' 
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-900'
                      }
                    `}
                  >
                    Supplier
                  </button>
                </div>
              </div>

              {/* NAMA KONTAN */}
              <div>
                <label className="text-[10px] font-black text-slate-400 block mb-1.5 uppercase tracking-wide">NAMA LENGKAP *</label>
                <input 
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:border-slate-600 rounded-xl p-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all h-10"
                />
              </div>

              {/* HANDPHONE */}
              <div>
                <label className="text-[10px] font-black text-slate-400 block mb-1.5 uppercase tracking-wide">NO WHATSAPP / HP</label>
                <input 
                  type="tel"
                  placeholder="Contoh: 081234567890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:border-slate-600 rounded-xl p-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all h-10"
                />
              </div>

              {/* BANK & REK */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-[10px] font-black text-slate-400 block mb-1.5 uppercase tracking-wide">NAMA BANK / KATEGORI</label>
                  <select 
                    value={bankName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setBankName(val);
                      if (val === 'MANUAL') {
                        setIsCustomBank(true);
                      } else {
                        setIsCustomBank(false);
                      }
                    }}
                    className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl p-2 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all h-10 cursor-pointer"
                  >
                    <option value="BANK BRI">BANK BRI</option>
                    <option value="BANK BCA">BANK BCA</option>
                    <option value="BANK MANDIRI">BANK MANDIRI</option>
                    <option value="BANK BNI">BANK BNI</option>
                    <option value="SEABANK">SEABANK</option>
                    <option value="DANA">DANA</option>
                    <option value="GOPAY">GOPAY</option>
                    <option value="SHOPEEPAY">SHOPEEPAY</option>
                    <option value="MANUAL">+ TULIS MANUAL / JELAS LAIN (PPOB, TOKEN, dll)</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-black text-slate-400 block mb-1.5 uppercase tracking-wide">NOMOR REK / NO. TOKEN / ID</label>
                  <input 
                    type="text"
                    placeholder="Contoh: No.Rek, No.Token, PLN ID"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:border-slate-600 rounded-xl p-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all h-10"
                  />
                </div>
              </div>

              {/* DYNAMIC MANUAL BANK / CATEGORY NAME INPUT */}
              {isCustomBank && (
                <div className="animate-in slide-in-from-top-2 duration-200 bg-orange-50/50 p-3 rounded-xl border border-orange-100">
                  <label className="text-[10px] font-black text-orange-600 block mb-1 uppercase tracking-wide">Tulis Nama Kategori / Bank Manual</label>
                  <input 
                    type="text"
                    required
                    placeholder="Contoh: NOMOR TOKEN, ID PPOB, NO. WA, BANK DAERAH"
                    value={customBankName}
                    onChange={(e) => setCustomBankName(e.target.value)}
                    className="w-full border border-orange-200 hover:border-orange-300 rounded-xl p-2.5 text-xs font-bold text-slate-705 shadow-sm outline-none focus:ring-4 focus:ring-orange-100 focus:border-orange-400 bg-white dark:bg-slate-800 transition-all h-10 animate-fade-in"
                  />
                  <p className="text-[9.5px] text-orange-700/80 mt-1.5 font-bold leading-none">
                    💡 Bisa diisi nama apa saja bebas sesuai kegunaan data!
                  </p>
                </div>
              )}

              {/* CATATAN */}
              <div>
                <label className="text-[10px] font-black text-slate-400 block mb-1.5 uppercase tracking-wide">CATATAN TAMBAHAN</label>
                <textarea 
                  placeholder="Keterangan singkat kontak (opsional)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:border-slate-600 rounded-xl p-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 shadow-sm outline-none min-h-[50px] resize-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all"
                />
              </div>

              {/* BUTTON SUBMIT */}
              <button 
                type="submit"
                className="w-full bg-[#1e293b] hover:bg-slate-800 text-white font-black text-xs py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-md shadow-slate-900/10 uppercase tracking-widest cursor-pointer mt-2"
              >
                <Save size={14} className="text-yellow-400" strokeWidth={2.5} /> SIMPAN KONTAK
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatChip({ label, count, active, onClick }: { label: string, count: number, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`py-1.5 px-3 rounded-full text-[10px] font-black uppercase text-center flex items-center justify-center gap-1.5 border transition-all cursor-pointer leading-tight
        ${active 
          ? 'bg-orange-500 border-orange-500 text-white shadow-md' 
          : 'bg-white/10 border-white/10 text-blue-100 hover:bg-white/20'
        }
      `}
    >
      <span>{label}</span>
      <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-extrabold leading-none
        ${active ? 'bg-white dark:bg-slate-800 text-orange-600' : 'bg-black/20 text-blue-200'}
      `}>
        {count}
      </span>
    </button>
  );
}
