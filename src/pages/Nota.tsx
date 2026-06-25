import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Printer, Plus, Trash2, ArrowLeft, X, Smartphone, Bluetooth, Package, Wrench } from 'lucide-react';
import { useNavigate } from 'react-router';
import { formatInputRupiah, cn } from '../lib/utils';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { EscPosEncoder, printViaWebBluetooth } from '../lib/escpos';

interface NotaItem {
  id: string;
  name: string;
  price: string;
  qty: number;
}

export function Nota() {
  const { storeName, storeAddress, cashierName } = useStore();
  const navigate = useNavigate();

  const [notaMode, setNotaMode] = useState<'jasa' | 'produk'>('jasa');

  const [title, setTitle] = useState('NOTA PEMBAYARAN');
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<NotaItem[]>([
    { id: '1', name: 'Biaya Jasa', price: '0', qty: 1 }
  ]);

  const [printSize, setPrintSize] = useState<'58' | '80'>('58');
  const [showPreview, setShowPreview] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // helper
  const handleAddItem = () => {
    setItems([...items, { id: Date.now().toString(), name: '', price: '0', qty: 1 }]);
  };

  const handleRemoveItem = (idToRemove: string) => {
    setItems(items.filter(item => item.id !== idToRemove));
  };

  const handleChangeItem = (id: string, field: keyof NotaItem, value: any) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleModeChange = (mode: 'jasa' | 'produk') => {
    setNotaMode(mode);
    setItems([
      { id: Date.now().toString(), name: mode === 'jasa' ? 'Biaya Jasa' : 'Nama Produk', price: '0', qty: 1 }
    ]);
  };

  const openPreview = (size: '58' | '80') => {
    setPrintSize(size);
    setShowPreview(true);
  };



  const totalPrice = items.reduce((acc, curr) => {
    const raw = curr.price.replace(/\D/g, '');
    return acc + ((Number(raw) || 0) * (curr.qty || 1));
  }, 0);

  const currentDate = format(new Date(), 'dd MMM yyyy, HH:mm', { locale: id });

  const generateEscPosData = () => {
    const encoder = new EscPosEncoder();
    const lineWidth = printSize === '58' ? 32 : 48;
    
    encoder.initialize();
    encoder.alignCenter();
    encoder.bold(true).textLine(storeName || 'KASIR CUBA').bold(false);
    encoder.textLine(storeAddress || 'Alamat Toko');
    encoder.line('-', lineWidth);
    encoder.bold(true).textLine(title || 'NOTA').bold(false);
    
    encoder.alignLeft();
    encoder.textLine(`Tanggal  : ${currentDate}`);
    encoder.textLine(`Kasir    : ${cashierName}`);
    if (customerName) encoder.textLine(`Pelanggan: ${customerName}`);
    
    encoder.line('-', lineWidth);
    
    items.forEach(item => {
       const name = item.name || 'Item';
       const itemTotal = (Number(item.price.replace(/\D/g, '')) || 0) * (item.qty || 1);
       const priceStr = `Rp ${itemTotal.toLocaleString('id-ID')}`;
       
       if (notaMode === 'produk' && typeof item.qty === 'number' && item.qty > 1) {
          encoder.textLine(name);
          const rawPrice = Number(item.price.replace(/\D/g, '')) || 0;
          const detailStr = `${item.qty} x ${rawPrice.toLocaleString('id-ID')}`;
          const spaces = lineWidth - detailStr.length - priceStr.length;
          encoder.textLine(detailStr + ' '.repeat(spaces > 0 ? spaces : 1) + priceStr);
       } else {
          // simple layout: name on left, price on right on same line if fits, else next line
          if (name.length + priceStr.length + 1 <= lineWidth) {
             const spaces = lineWidth - name.length - priceStr.length;
             encoder.textLine(name + ' '.repeat(spaces) + priceStr);
          } else {
             encoder.textLine(name);
             const spaces = lineWidth - priceStr.length;
             encoder.textLine(' '.repeat(spaces) + priceStr);
          }
       }
    });
    
    encoder.line('-', lineWidth);
    
    const totalStr = `TOTAL`;
    const totPriceStr = `Rp ${totalPrice.toLocaleString('id-ID')}`;
    const totSpaces = lineWidth - totalStr.length - totPriceStr.length;
    encoder.bold(true)
           .textLine(totalStr + ' '.repeat(totSpaces > 0 ? totSpaces : 1) + totPriceStr)
           .bold(false);
    
    if (notes) {
       encoder.newline();
       encoder.alignCenter();
       encoder.textLine(notes);
    }
    
    encoder.newline();
    encoder.alignCenter();
    encoder.textLine('*** Terima Kasih ***');
    encoder.printAndFeed(4);
    
    return encoder.encode();
  };

  const handleSystemPrint = async () => {
    // If it's Android, we try to use RawBT intent
    const isAndroid = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);
    if (isAndroid) {
      try {
        const { printViaRawBT } = await import('../lib/escpos');
        await printViaRawBT(generateEscPosData());
        setShowPreview(false);
        return;
      } catch (err) {
        console.error('RawBT error', err);
        // Fallback to window.print
      }
    }
    
    setShowPreview(false);
    setTimeout(() => {
      window.print();
    }, 250);
  };

  const handleWebBluetoothPrint = async () => {
    try {
      setIsPrinting(true);
      const data = generateEscPosData();
      await printViaWebBluetooth(data);
      alert('Struk berhasil dicetak via Web Bluetooth!');
      setShowPreview(false);
    } catch (err: any) {
      alert(`Gagal koneksi Bluetooth: ${err.message}\n\nPastikan printer dinyalakan & mendukung BLE (Bluetooth Low Energy). Jika gagal, gunakan opsi "Cetak Bawaan Sistem".`);
    } finally {
      setIsPrinting(false);
    }
  };

  const ReceiptContent = () => (
    <div 
      className="text-black bg-white dark:bg-slate-800 mx-auto print:mx-0 font-mono" 
      style={{
        width: printSize === '58' ? '58mm' : '80mm',
        margin: '0 auto',
        padding: printSize === '58' ? '0 2mm' : '0 4mm',
        filter: showPreview ? 'drop-shadow(0 4px 6px -1px rgb(0 0 0 / 0.1))' : 'none',
      }}
    >
      <div className={`text-center font-bold uppercase mb-1 ${printSize === '58' ? 'text-[12px]' : 'text-[16px]'}`}>{storeName || 'KASIR CUBA'}</div>
      <div className={`text-center mb-2 ${printSize === '58' ? 'text-[9px]' : 'text-[12px]'}`}>{storeAddress || 'Alamat Toko'}</div>
      <div className="border-b border-dashed border-black mb-2"></div>
      <div className={`text-center font-bold uppercase mb-2 ${printSize === '58' ? 'text-[11px]' : 'text-[14px]'}`}>{title || 'NOTA'}</div>
      
      <div className={`mb-2 ${printSize === '58' ? 'text-[9px]' : 'text-[11px]'}`}>
        <div>Tanggal  : {currentDate}</div>
        <div>Kasir    : {cashierName}</div>
        {customerName && <div>Pelanggan: {customerName}</div>}
      </div>
      
      <div className="border-b border-dashed border-black mb-2"></div>
      
      <div className="mb-2 space-y-1">
        {items.map((item, i) => {
          const rawPrice = Number(item.price.replace(/\D/g, '')) || 0;
          const lineTotal = rawPrice * (item.qty || 1);
          return (
            <div key={i} className={`flex flex-col mb-1 ${printSize === '58' ? 'text-[10px]' : 'text-[12px]'}`}>
              {notaMode === 'produk' && (item.qty || 1) > 1 ? (
                <>
                  <span>{item.name || 'Item'}</span>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{item.qty} x {rawPrice.toLocaleString('id-ID')}</span>
                    <span className="text-right tabular-nums font-bold">Rp {lineTotal.toLocaleString('id-ID')}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between">
                  <span>{item.name || 'Item'}</span>
                  <span className="text-right tabular-nums font-bold">Rp {lineTotal.toLocaleString('id-ID')}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="border-b border-dashed border-black mb-2"></div>
      
      <div className={`flex justify-between font-bold mb-4 ${printSize === '58' ? 'text-[11px]' : 'text-[14px]'}`}>
        <span>TOTAL</span>
        <span className="tabular-nums">Rp {totalPrice.toLocaleString('id-ID')}</span>
      </div>
      
      {notes && (
        <div className={`text-center mb-3 whitespace-pre-line ${printSize === '58' ? 'text-[9px]' : 'text-[11px]'}`}>{notes}</div>
      )}
      
      <div className={`text-center mt-4 mb-8 ${printSize === '58' ? 'text-[9px]' : 'text-[11px]'}`}>*** Terima Kasih ***</div>
    </div>
  );

  return (
    <div className="w-full flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-900 relative overflow-y-auto">
      {/* HEADER - HIDDEN ON PRINT */}
      <div className="bg-slate-800 text-white pt-12 pb-6 px-6 shadow-md rounded-b-[2rem] print:hidden shrink-0 relative">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 bg-slate-700/50 hover:bg-slate-700 rounded-xl transition-colors"
          >
            <ArrowLeft size={20} className="text-slate-200" />
          </button>
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center border border-orange-500/30">
            <Printer size={20} className="text-orange-400" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-wide">NOTA MANUAL</h1>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Cetak Struk Bebas</p>
          </div>
        </div>
      </div>

      {/* FORM SETUP - HIDDEN ON PRINT */}
      <div className="px-5 py-6 print:hidden space-y-5 flex-1 w-full max-w-lg mx-auto">
        
        {/* Mode Selector */}
        <div className="bg-white dark:bg-slate-800 p-1.5 rounded-2xl flex border border-slate-200 dark:border-slate-700 shadow-sm">
          <button 
            onClick={() => handleModeChange('jasa')}
            className={cn(
              "flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-wider transition-all",
              notaMode === 'jasa' ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-900"
            )}
          >
            <Wrench size={14} /> Biaya Jasa
          </button>
          <button 
            onClick={() => handleModeChange('produk')}
            className={cn(
              "flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-wider transition-all",
              notaMode === 'produk' ? "bg-orange-500 text-white shadow-md" : "text-slate-400 hover:text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-900"
            )}
          >
            <Package size={14} /> Produk (Barang)
          </button>
        </div>

        {/* Info Nota */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
           <div>
             <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 ml-1">Keterangan Judul Nota</label>
             <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 text-sm font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all placeholder:text-slate-300" placeholder="Contoh: NOTA PENJUALAN" />
           </div>
           <div>
             <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 ml-1">Pelanggan (Opsional)</label>
             <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 text-sm font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all placeholder:text-slate-300" placeholder="Contoh: Bpk Budi" />
           </div>
        </div>

        {/* Item List */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
           <div className="flex justify-between items-center mb-5">
             <div className="flex items-center gap-2">
               <div className="w-6 h-6 rounded-lg bg-orange-100 flex items-center justify-center">
                 <Printer size={12} className="text-orange-600" />
               </div>
               <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Daftar Item / Layanan</label>
             </div>
             <button onClick={handleAddItem} className="p-1.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-600 font-black text-[10px] uppercase tracking-wider rounded-xl flex items-center gap-1.5 active:scale-95 transition-all"><Plus size={14}/> Tambah</button>
           </div>
           
           <div className="space-y-3">
             {items.map((item, idx) => (
               <div key={item.id} className="flex flex-col gap-2 bg-slate-50 dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                 <div className="flex gap-2">
                   <input type="text" value={item.name} onChange={(e) => handleChangeItem(item.id, 'name', e.target.value)} placeholder={notaMode === 'jasa' ? "Biaya perbaikan, Layanan, dll" : "Nama Barang"} className="flex-1 min-w-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-300" />
                   {items.length > 1 && (
                     <button onClick={() => handleRemoveItem(item.id)} className="p-3 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl shrink-0 active:scale-95 transition-all"><Trash2 size={18} /></button>
                   )}
                 </div>
                 
                 <div className="flex gap-2">
                   <div className="flex-1 flex items-center shadow-sm">
                     <span className="text-xs font-black text-slate-400 bg-slate-100 dark:bg-slate-800 px-3.5 py-3 rounded-l-xl border border-r-0 border-slate-200 dark:border-slate-700">Rp</span>
                     <input type="text" value={item.price} onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9]/g, '');
                        handleChangeItem(item.id, 'price', formatInputRupiah(raw));
                     }} placeholder="0" className="w-full min-w-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-r-xl px-3.5 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-300" />
                   </div>
                   
                   {notaMode === 'produk' && (
                     <div className="w-24 shrink-0 flex items-center shadow-sm">
                       <span className="text-[10px] font-black text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-3 rounded-l-xl border border-r-0 border-slate-200 dark:border-slate-700 uppercase">Qty</span>
                       <input 
                         type="number" 
                         min="1" 
                         value={item.qty || 1} 
                         onChange={(e) => handleChangeItem(item.id, 'qty', parseInt(e.target.value) || 1)} 
                         className="w-full min-w-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-r-xl px-2.5 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all" 
                       />
                     </div>
                   )}
                 </div>
               </div>
             ))}
           </div>
        </div>

        {/* Notes */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
           <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 ml-1">Catatan Struk (Opsional)</label>
           <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 text-sm font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all placeholder:text-slate-300 resize-none" placeholder="Terima kasih telah berbelanja" />
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button onClick={() => openPreview('58')} className="w-full bg-slate-800 text-white font-black text-xs uppercase tracking-wider py-4 rounded-2xl hover:bg-slate-700 flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-slate-200">
            <Printer size={16} /> Print 58mm
          </button>
          <button onClick={() => openPreview('80')} className="w-full bg-orange-500 text-white font-black text-xs uppercase tracking-wider py-4 rounded-2xl hover:bg-orange-600 flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-orange-200">
            <Printer size={16} /> Print 80mm
          </button>
        </div>
      </div>

      {/* PREVIEW MODAL */}
      {showPreview && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 print:hidden">
          <div className="bg-white dark:bg-slate-800 rounded-[2rem] w-full max-w-sm overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="p-4 bg-slate-800 text-white flex justify-between items-center shrink-0">
              <h3 className="font-black tracking-wide text-sm uppercase">Pratinjau Struk ({printSize}mm)</h3>
              <button onClick={() => setShowPreview(false)} className="p-1.5 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 bg-slate-100 dark:bg-slate-800 flex-1 overflow-y-auto flex pl-6 justify-center">
              <ReceiptContent />
            </div>

            <div className="p-5 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-800 space-y-3 shrink-0">
               <button 
                 onClick={handleSystemPrint} 
                 className="w-full bg-slate-800 text-white font-black text-xs uppercase tracking-wider py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all"
               >
                 <Smartphone size={16} /> Cetak Via Sistem (RawBT)
               </button>
               <button 
                 onClick={handleWebBluetoothPrint} 
                 disabled={isPrinting}
                 className="w-full bg-blue-50 text-blue-700 font-black text-xs uppercase tracking-wider py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all"
               >
                 <Bluetooth size={16} /> {isPrinting ? 'Menghubungkan...' : 'Koneksi Web Bluetooth'}
               </button>
               <p className="text-[9px] font-bold text-slate-400 text-center leading-relaxed px-2">
                 Rekomendasi: Jika Web Bluetooth tidak mendukung printer Anda, gunakan opsi <b>Cetak Via Sistem</b> dan sambungkan dengan aplikasi seperti RawBT.
               </p>
            </div>
          </div>
        </div>
      )}

      {/* PRINT VIEW - ONLY VISIBLE ON PRINT */}
      <div className="hidden print:block w-full">
         <ReceiptContent />
      </div>
    </div>
  );
}
