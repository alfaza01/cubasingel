import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useStore } from '../context/StoreContext';
import { 
  ArrowLeft, Search, Plus, Trash2, CheckCircle2, Clock, 
  AlertCircle, ChevronRight, Tag, BookOpen, Calendar, Star, FileText
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

export function Notes() {
  const navigate = useNavigate();
  const { notes, addNote, updateNote, deleteNote } = useStore();
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('SEMUA');
  const [showCompleted, setShowCompleted] = useState<boolean | null>(null); // null = semua, true = lunas/selesai, false = pending

  // Form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTag, setNewTag] = useState<'PENTING' | 'UMUM' | 'BELANJA' | 'OPERASIONAL' | 'PELANGGAN'>('UMUM');
  const [errorMsg, setErrorMsg] = useState('');

  // Handle Note submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setErrorMsg('Judul catatan tidak boleh kosong');
      return;
    }
    if (!newContent.trim()) {
      setErrorMsg('Isi catatan tidak boleh kosong');
      return;
    }

    addNote({
      title: newTitle.trim(),
      content: newContent.trim(),
      tag: newTag,
      isCompleted: false
    });

    // Reset Form
    setNewTitle('');
    setNewContent('');
    setNewTag('UMUM');
    setErrorMsg('');
    setShowAddModal(false);
  };

  // Filter notes
  const filteredNotes = useMemo(() => {
    return notes.filter(n => {
      const matchSearch = 
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.content.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchTag = selectedTag === 'SEMUA' || n.tag === selectedTag;
      
      const matchStatus = 
        showCompleted === null || 
        (showCompleted ? n.isCompleted === true : !n.isCompleted);

      return matchSearch && matchTag && matchStatus;
    });
  }, [notes, searchQuery, selectedTag, showCompleted]);

  // Statistics
  const stats = useMemo(() => {
    const total = notes.length;
    const penting = notes.filter(n => n.tag === 'PENTING' && !n.isCompleted).length;
    const pending = notes.filter(n => !n.isCompleted).length;
    const completed = notes.filter(n => n.isCompleted).length;
    return { total, penting, pending, completed };
  }, [notes]);

  // Tag list & styling
  const tags: Array<{ value: string; label: string; activeColor: string; bg: string }> = [
    { value: 'SEMUA', label: 'Semua', activeColor: 'bg-slate-800 text-white border-slate-800', bg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200' },
    { value: 'PENTING', label: 'Penting 🔥', activeColor: 'bg-rose-500 text-white border-rose-500', bg: 'bg-rose-50 text-rose-700 hover:bg-rose-100' },
    { value: 'BELANJA', label: 'Belanja 🛍️', activeColor: 'bg-amber-500 text-white border-amber-500', bg: 'bg-amber-50 text-amber-700 hover:bg-amber-100' },
    { value: 'OPERASIONAL', label: 'Operasional ⚙️', activeColor: 'bg-blue-500 text-white border-blue-500', bg: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
    { value: 'PELANGGAN', label: 'Pelanggan 👥', activeColor: 'bg-emerald-500 text-white border-emerald-500', bg: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
    { value: 'UMUM', label: 'Umum 📝', activeColor: 'bg-blue-600 text-white border-blue-600', bg: 'bg-blue-50 text-blue-700 hover:bg-blue-100' }
  ];

  const getTagStyle = (tag: string) => {
    switch(tag) {
      case 'PENTING':
        return { border: 'border-rose-200', bg: 'bg-rose-50/75', text: 'text-rose-700', badge: 'bg-rose-100/80 text-rose-800' };
      case 'BELANJA':
        return { border: 'border-amber-200', bg: 'bg-amber-50/75', text: 'text-amber-700', badge: 'bg-amber-100/80 text-amber-800' };
      case 'OPERASIONAL':
        return { border: 'border-blue-200', bg: 'bg-blue-50/75', text: 'text-blue-700', badge: 'bg-blue-100/80 text-blue-800' };
      case 'PELANGGAN':
        return { border: 'border-emerald-200', bg: 'bg-emerald-50/75', text: 'text-emerald-700', badge: 'bg-emerald-100/80 text-emerald-800' };
      default:
        return { border: 'border-blue-200', bg: 'bg-blue-50/75', text: 'text-blue-700', badge: 'bg-blue-100/80 text-blue-800' };
    }
  };

  const getFormatTime = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: id });
    } catch {
      return 'Baru saja';
    }
  };

  return (
    <div className="p-4 bg-slate-50 dark:bg-slate-900 min-h-screen pb-24 overflow-y-auto">
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between mt-3 mb-5 px-1 bg-gradient-to-r from-rose-500 to-rose-600 text-white p-4.5 rounded-2xl shadow-md">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => navigate('/')} 
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all cursor-pointer"
          >
            <ArrowLeft size={16} strokeWidth={2.5} />
          </button>
          <div>
            <h1 className="text-sm font-black tracking-wider text-white uppercase leading-none">CATATAN TOKO</h1>
            <p className="text-[9px] text-rose-100 uppercase font-black tracking-wide leading-none mt-1.5">Agenda & memo operasional harian</p>
          </div>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 bg-white dark:bg-slate-800 text-rose-600 px-3.5 py-2 rounded-xl text-[10px] font-black transition-all active:scale-95 shadow-sm border border-rose-100 cursor-pointer"
        >
          <Plus size={12} strokeWidth={3} /> BARU
        </button>
      </div>

      {/* THREE-COLUMN ANALYTICS KPI DISPLAY */}
      <div className="grid grid-cols-3 gap-2.5 mb-5 select-none">
        <div className="bg-white dark:bg-slate-800 border border-slate-150 p-3 rounded-2xl shadow-xs flex flex-col justify-between">
          <span className="text-[7.5px] font-black tracking-widest text-slate-400 uppercase leading-none mb-1">TOTAL AGENDA</span>
          <p className="text-sm font-black text-slate-700 dark:text-slate-200 mt-1">{stats.total} Memo</p>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-slate-150 p-3 rounded-2xl shadow-xs flex flex-col justify-between">
          <span className="text-[7.5px] font-black tracking-widest text-rose-400 uppercase leading-none mb-1">IMPORTANT 🔥</span>
          <p className="text-sm font-black text-rose-600 mt-1">{stats.penting} Urgent</p>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-slate-150 p-3 rounded-2xl shadow-xs flex flex-col justify-between">
          <span className="text-[7.5px] font-black tracking-widest text-emerald-400 uppercase leading-none mb-1">COMPLETED ✅</span>
          <p className="text-sm font-black text-emerald-600 mt-1">{stats.completed} Done</p>
        </div>
      </div>

      {/* COMPACT FLOATING CONTROLLER AREA */}
      <div className="bg-white dark:bg-slate-800 border border-slate-150 rounded-2xl p-3.5 shadow-xs mb-5 flex flex-col gap-3">
        {/* Search input bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-400">
            <Search size={14} />
          </div>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kata kunci di catatan..." 
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-200/50 transition-all shadow-inner"
          />
        </div>

        {/* Status filtering toggle flags */}
        <div className="flex gap-2 border-t border-slate-100 dark:border-slate-800 pt-2.5">
          <button
            onClick={() => setShowCompleted(null)}
            className={`flex-1 py-1.5 px-3 rounded-xl text-[9px] font-extrabold uppercase tracking-wide border transition-all cursor-pointer ${showCompleted === null ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-700' : 'bg-transparent text-slate-400 border-transparent hover:text-slate-600 dark:text-slate-300'}`}
          >
            Semua Status
          </button>
          <button
            onClick={() => setShowCompleted(false)}
            className={`flex-1 py-1.5 px-3 rounded-xl text-[9px] font-extrabold uppercase tracking-wide border transition-all cursor-pointer ${showCompleted === false ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-transparent text-slate-400 border-transparent hover:text-slate-600 dark:text-slate-300'}`}
          >
            🔴 Aktif
          </button>
          <button
            onClick={() => setShowCompleted(true)}
            className={`flex-1 py-1.5 px-3 rounded-xl text-[9px] font-extrabold uppercase tracking-wide border transition-all cursor-pointer ${showCompleted === true ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-transparent text-slate-400 border-transparent hover:text-slate-600 dark:text-slate-300'}`}
          >
            🟢 Selesai
          </button>
        </div>

        {/* Tag Filters list container */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-hidden border-t border-slate-100 dark:border-slate-800 pt-3">
          {tags.map(t => {
            const isSelected = selectedTag === t.value;
            return (
              <button
                key={t.value}
                onClick={() => setSelectedTag(t.value)}
                className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider shrink-0 transition-all border shadow-xs cursor-pointer ${isSelected ? t.activeColor : `${t.bg} border-transparent`}`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* NOTES CARDS LIST (MODERN GRID) */}
      {filteredNotes.length === 0 ? (
        <div className="py-14 bg-white dark:bg-slate-800 border border-dashed border-slate-200 dark:border-slate-700 rounded-3xl text-center px-4 self-center select-none shadow-xs">
          <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-3">
            <BookOpen size={20} />
          </div>
          <h3 className="font-extrabold text-[#111827] text-xs uppercase tracking-wider mb-1">TIDAK ADA CATATAN</h3>
          <p className="text-[10px] text-slate-400 font-medium leading-relaxed max-w-xs mx-auto">
            Tidak ditemukan catatan '{selectedTag !== 'SEMUA' ? selectedTag : ''}' yang cocok dengan pencarian Anda. Tambahkan catatan baru sekarang!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {filteredNotes.map(n => {
            const style = getTagStyle(n.tag);
            return (
              <div 
                key={n.id}
                className={`bg-white dark:bg-slate-800 border rounded-2xl p-4 shadow-xs relative transition-all duration-200 select-none flex flex-col justify-between group overflow-hidden ${n.isCompleted ? 'opacity-70 border-slate-150 bg-slate-50/50 shadow-none' : 'hover:shadow-md hover:border-slate-300 dark:border-slate-600'}`}
              >
                {/* Visual side accent border for tags */}
                <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${n.tag === 'PENTING' ? 'bg-rose-500' : n.tag === 'BELANJA' ? 'bg-amber-500' : n.tag === 'OPERASIONAL' ? 'bg-blue-500' : n.tag === 'PELANGGAN' ? 'bg-emerald-500' : 'bg-blue-600'}`}></div>

                {/* Card Header information line */}
                <div className="flex items-center justify-between gap-2.5 mb-2.5 pl-2.5">
                  <span className={`text-[8px] font-black tracking-widest uppercase px-2 py-0.5 rounded-md ${style.badge}`}>
                    {n.tag}
                  </span>
                  
                  <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[8.5px]">
                    <Clock size={10} />
                    <span>{getFormatTime(n.createdAt)}</span>
                  </div>
                </div>

                {/* Card Content body */}
                <div className="pl-2.5 mb-4.5 flex-1">
                  <h3 className={`font-black text-xs text-slate-800 dark:text-slate-100 tracking-wide leading-snug mb-1.5 ${n.isCompleted ? 'line-through text-slate-400 font-semibold' : ''}`}>
                    {n.title}
                  </h3>
                  <p className={`text-[10.5px] font-semibold text-slate-500 dark:text-slate-400 leading-relaxed whitespace-pre-wrap ${n.isCompleted ? 'line-through text-slate-400/80 font-normal' : ''}`}>
                    {n.content}
                  </p>
                </div>

                {/* Card action controls footer line */}
                <div className="flex items-center justify-between pl-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 select-none">
                  {/* Mark completed status button */}
                  <button
                    type="button"
                    onClick={() => updateNote(n.id, { isCompleted: !n.isCompleted })}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${n.isCompleted ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-rose-50 hover:text-rose-600'}`}
                  >
                    <CheckCircle2 size={12} className={n.isCompleted ? 'fill-emerald-100' : ''} />
                    <span>{n.isCompleted ? 'Selesai' : 'Tandai Selesai'}</span>
                  </button>

                  {/* Delete button action */}
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Hapus catatan ini secara permanen?')) {
                        deleteNote(n.id);
                      }
                    }}
                    className="w-8 h-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-all cursor-pointer"
                    title="Hapus Catatan"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FORM MODAL DIALOG IN POPUP/OVERLAY SHEET */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl p-5 border border-slate-100 dark:border-slate-800 flex flex-col max-h-[85vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-rose-500" />
                <h3 className="font-black text-xs uppercase tracking-widest text-slate-800 dark:text-slate-100">
                  TAMBAH CATATAN BARU
                </h3>
              </div>
              <button 
                onClick={() => { setShowAddModal(false); setErrorMsg(''); }}
                className="w-7 h-7 rounded-full bg-slate-50 dark:bg-slate-900 text-slate-400 hover:bg-slate-100 dark:bg-slate-800 hover:text-slate-800 dark:text-slate-100 flex items-center justify-center font-bold text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Error banner message */}
            {errorMsg && (
              <div className="mb-4 bg-rose-50 border border-rose-200 p-2.5 rounded-xl flex items-center gap-2 text-rose-800 text-[9.5px] font-bold">
                <AlertCircle size={12} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Form Container */}
            <form onSubmit={handleSubmit} className="space-y-4 [.pc-mode_&]:grid [.pc-mode_&]:md:grid-cols-2 [.pc-mode_&]:lg:grid-cols-3 [.pc-mode_&]:gap-4 [.pc-mode_&]:space-y-0">
              <div>
                <label className="text-[9.5px] font-black text-slate-400 block mb-1 uppercase tracking-wider">JUDUL AGENDA</label>
                <input 
                  type="text" 
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Misal: Restos Alat/Voucher..."
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-rose-400"
                />
              </div>

              <div>
                <label className="text-[9.5px] font-black text-slate-400 block mb-1 uppercase tracking-wider">TIPE TAG KATEGORI</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['UMUM', 'PENTING', 'BELANJA', 'OPERASIONAL', 'PELANGGAN'] as const).map(tagType => {
                    const isSelected = newTag === tagType;
                    const style = getTagStyle(tagType);
                    return (
                      <button
                        type="button"
                        key={tagType}
                        onClick={() => setNewTag(tagType)}
                        className={`py-2 rounded-xl text-[9px] font-black border transition-all truncate flex items-center justify-center gap-1 cursor-pointer ${isSelected ? `${style.badge} border-rose-450 ring-1 ring-rose-200 shadow-xs` : 'bg-slate-50 dark:bg-slate-900 border-slate-150 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-800'}`}
                      >
                        <Tag size={10} /> <span>{tagType}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-[9.5px] font-black text-slate-400 block mb-1 uppercase tracking-wider">ISI CATATAN / DETAIL</label>
                <textarea 
                  rows={4}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Tuliskan detail catatan, langkah instruksi, atau nominal pelunasan..."
                  className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-200/40"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-150 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setErrorMsg(''); }}
                  className="flex-1 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:bg-slate-800 rounded-xl transition-all cursor-pointer"
                >
                  BATAL
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 text-[10px] font-black uppercase tracking-wider text-white bg-rose-500 hover:bg-rose-600 rounded-xl transition-all shadow-sm shadow-rose-200 cursor-pointer"
                >
                  SIMPAN MEMO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
