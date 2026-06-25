import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { 
  ArrowLeft, Search, Filter, ArrowUpRight, ArrowDownLeft, 
  Receipt, MoreVertical, ChevronDown, ChevronUp, Edit2, 
  Trash2, Wallet, DollarSign, Calendar, Eye, EyeOff, Check, X,
  AlertCircle, RefreshCw, Layers, Tag, Printer, Smartphone, Bluetooth, FileDown
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Transaction } from '../types';
import { EscPosEncoder, printViaWebBluetooth } from '../lib/escpos';
import { cn } from '../lib/utils';

export function History() {
  const navigate = useNavigate();
  const { 
    transactions, 
    wallets, 
    editTransaction, 
    deleteTransaction,
    storeName,
    storeAddress,
    cashierName
  } = useStore();

  // 1. Map of original tx.id to its continuous sequential global number (TRX-01, TRX-02, ..., TRX-N) based on chronological order
  const txSequentialMap = useMemo(() => {
    // Sort transactions chronologically (oldest first)
    const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const map: Record<string, string> = {};
    sorted.forEach((tx, index) => {
      map[tx.id] = `TRX-${String(index + 1).padStart(2, '0')}`;
    });
    return map;
  }, [transactions]);

  // 2. Map of original tx.id to its global chronological index (1, 2, 3...) from oldest to latest
  const globalSequenceMap = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const seqMap: Record<string, number> = {};
    sorted.forEach((tx, idx) => {
      seqMap[tx.id] = idx + 1;
    });
    return seqMap;
  }, [transactions]);

  // 3. Helper to determine precise financial flow classification as requested
  const getRowClassification = (tx: Transaction) => {
    const type = tx.type;
    const category = (tx.category || '').toUpperCase().trim();

    // Uang Masuk: Tambah Saldo, Modal Pagi, Pindah Saldo
    const isUangMasuk = type === 'TAMBAH_SALDO' || type === 'MODAL_PAGI' || type === 'PINDAH_SALDO';
    // Uang Keluar: Tarik Tunai, Expense
    const isUangKeluar = category === 'TARIK TUNAI' || type === 'EXPENSE';
    // Uang Mutasi: Penjualan Digital dan Aksesoris, Mutasi
    const isMutasi = category === 'UANG DIGITAL' || category === 'AKSESORIS' || type === 'MUTASI';

    if (isUangMasuk) return 'MASUK';
    if (isUangKeluar) return 'KELUAR';
    if (isMutasi) return 'MUTASI';

    // Fallback based on money movement direction
    return type === 'INCOME' ? 'MASUK' : 'KELUAR';
  };

  // Search & Filter state
  const [filter, setFilter] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [checkedCategories, setCheckedCategories] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilterCard, setShowFilterCard] = useState(false);
  const [showBreakdownModal, setShowBreakdownModal] = useState(false);
  const [modalActiveTab, setModalActiveTab] = useState<'SEMUA' | 'MASUK' | 'KELUAR' | 'MUTASI'>('SEMUA');

  // Printable Receipt Modal and configurations
  const [printTx, setPrintTx] = useState<Transaction | null>(null);
  const [printSize, setPrintSize] = useState<'58' | '80'>('58');
  const [printCustomerName, setPrintCustomerName] = useState('');
  const [printNotes, setPrintNotes] = useState('');
  const [isPrintingBluetooth, setIsPrintingBluetooth] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  // Reset pagination when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchQuery, checkedCategories, startDate, endDate]);

  const handleExportTransactionsToExcel = () => {
    try {
      if (filteredTransactions.length === 0) {
        alert('Tidak ada data transaksi untuk diekspor!');
        return;
      }

      const sheetName = 'Mutasi_Riwayat_Transaksi';
      const fileName = `Riwayat_Transaksi_${new Date().toISOString().split('T')[0]}.xls`;

      let tableHtml = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8" />
<!--[if gte mso 9]>
<xml>
 <x:ExcelWorkbook>
  <x:ExcelWorksheets>
   <x:ExcelWorksheet>
    <x:Name>\${sheetName}</x:Name>
    <x:WorksheetOptions>
     <x:DisplayGridlines/>
    </x:WorksheetOptions>
   </x:ExcelWorksheet>
  </x:ExcelWorksheets>
 </x:ExcelWorkbook>
</xml>
<![endif]-->
<style>
  table { border-collapse: collapse; margin-top: 10px; }
  th, td { border: 1px solid #cbd5e1; padding: 8px 10px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 11px; white-space: nowrap !important; }
  th { background-color: #1e3a8a; color: #ffffff; font-weight: bold; text-align: center; font-size: 11.5px; }
  .text-center { text-align: center; }
  .text-right { text-align: right; }
  .font-mono { font-family: Consolas, monospace; }
  .header-info { font-family: 'Segoe UI', sans-serif; font-size: 14px; font-weight: bold; margin-bottom: 5px; color: #1e293b; }
  .sub-info { font-family: 'Segoe UI', sans-serif; font-size: 11px; margin-bottom: 15px; color: #64748b; }
</style>
</head>
<body>
  <div class="header-info">MUTASI & RIWAYAT TRANSAKSI ALIRAN DANA</div>
  <div class="sub-info">Dicetak pada: \${new Date().toLocaleString('id-ID')} | Filter: \${filter} | Total Transaksi: \${filteredTransactions.length}</div>
  
  <table>
    <colgroup>
      <col width="50" />
      <col width="90" />
      <col width="110" />
      <col width="65" />
      <col width="120" />
      <col width="280" />
      <col width="115" />
      <col width="90" />
      <col width="110" />
      <col width="95" />
    </colgroup>
    <thead>
      <tr>
        <th>No</th>
        <th>ID Transaksi</th>
        <th>Tanggal</th>
        <th>Jam</th>
        <th>Kategori</th>
        <th>Deskripsi / Keterangan</th>
        <th>Metode Pembayaran / Aliran</th>
        <th>Tipe Aliran</th>
        <th>Nominal Total</th>
        <th>Keuntungan Admin / Jasa</th>
      </tr>
    </thead>
    <tbody>
`;

      filteredTransactions.forEach((tx, idx) => {
        const cleanCode = `TRX-\${globalSequenceMap[tx.id] || tx.id}`;
        const classification = getRowClassification(tx);
        const txDateObj = new Date(tx.date);
        const timeStr = txDateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(/:/g, '.');
        const dateStr = txDateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

        const srcW = wallets.find(w => w.id === tx.sourceWallet);
        const tgtW = wallets.find(w => w.id === tx.targetWallet);
        let flowsText = '';
        if (srcW && tgtW) {
          flowsText = `\${srcW.name.toUpperCase()} -> \${tgtW.name.toUpperCase()}`;
        } else if (tgtW) {
          flowsText = tgtW.name.toUpperCase();
        } else if (srcW) {
          flowsText = srcW.name.toUpperCase();
        } else {
          flowsText = 'KAS TUNAI';
        }

        const totalValue = `\${classification === 'MASUK' ? '+' : '-'} Rp \${tx.total.toLocaleString('id-ID')}`;
        const adminFeeVal = tx.adminFee && tx.adminFee > 0 ? `Rp \${tx.adminFee.toLocaleString('id-ID')}` : 'Rp 0';

        tableHtml += `
      <tr>
        <td class="text-center font-mono">\${globalSequenceMap[tx.id] || (idx + 1)}</td>
        <td class="text-center font-mono">\${cleanCode}</td>
        <td class="text-center">\${dateStr}</td>
        <td class="text-center font-mono">\${timeStr}</td>
        <td>\${(tx.category || 'UMUM').toUpperCase()}</td>
        <td>\${tx.description || 'Penjualan POS'}</td>
        <td>\${flowsText}</td>
        <td class="text-center">\${classification}</td>
        <td class="text-right font-mono">\${totalValue}</td>
        <td class="text-right font-mono">\${adminFeeVal}</td>
      </tr>
`;
      });

      tableHtml += `
    </tbody>
  </table>
</body>
</html>
`;

      const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error(err);
      alert('Gagal mengekspor Excel: ' + err.message);
    }
  };

  // Derive unique categories from transactions
  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    transactions.forEach(t => {
      if (t.category) {
        cats.add(t.category.toUpperCase().trim());
      }
    });
    if (cats.size === 0) {
      cats.add('UMUM');
      cats.add('PENJUALAN');
      cats.add('UANG DIGITAL');
      cats.add('TARIK TUNAI');
    }
    return Array.from(cats).sort();
  }, [transactions]);
  
  // Accordion state to toggle details ('TRX-XYZ': true/false)
  const [expandedTx, setExpandedTx] = useState<Record<string, boolean>>({});

  // Editing state ('TRX-XYZ' representing the transaction ID currently edited)
  const [editingId, setEditingId] = useState<string | null>(null);

  // Edit fields state
  const [editTitle, setEditTitle] = useState('');
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editType, setEditType] = useState<Transaction['type']>('INCOME');
  const [editCategory, setEditCategory] = useState('');
  const [editAdminFee, setEditAdminFee] = useState<number>(0);
  const [editAdminNonTunai, setEditAdminNonTunai] = useState<boolean>(false);
  const [editSourceWallet, setEditSourceWallet] = useState('');
  const [editTargetWallet, setEditTargetWallet] = useState('');
  const [editError, setEditError] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Find original transaction before edit (to render old parameters in design backup indicator)
  const originalTx = useMemo(() => {
    return transactions.find(t => t.id === editingId);
  }, [editingId, transactions]);

  // Handle edit launch
  const startEdit = (tx: Transaction) => {
    setEditingId(tx.id);
    setEditTitle(tx.description || 'Penjualan POS');
    setEditAmount(tx.total);
    setEditType(tx.type);
    setEditCategory(tx.category || 'UMUM');
    setEditAdminFee(tx.adminFee || 0);
    setEditAdminNonTunai(tx.adminNonTunai || false);
    setEditSourceWallet(tx.sourceWallet || '');
    setEditTargetWallet(tx.targetWallet || '');
    setEditError('');
  };

  // Submit edited transaction
  const handleSaveEdit = (id: string) => {
    if (!editTitle.trim()) {
      setEditError('Deskripsi tidak boleh kosong');
      return;
    }
    if (editAmount < 0) {
      setEditError('Nominal nominal tidak boleh kurang dari 0');
      return;
    }

    editTransaction(id, {
      description: editTitle.trim(),
      total: editAmount,
      type: editType,
      category: editCategory,
      adminFee: editAdminFee,
      adminNonTunai: editAdminNonTunai,
      sourceWallet: editSourceWallet || undefined,
      targetWallet: editTargetWallet || undefined
    });

    setEditingId(null);
    setEditError('');
  };

  // Toggle detail expansion
  const toggleExpand = (id: string) => {
    setExpandedTx(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Filter & Search Logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      // 1. Filter Type Tabs using the updated flow classification rules
      const classification = getRowClassification(tx);
      let matchFilter = true;
      if (filter === 'Uang Masuk') {
        matchFilter = classification === 'MASUK';
      } else if (filter === 'Uang Keluar') {
        matchFilter = classification === 'KELUAR';
      } else if (filter === 'Mutasi') {
        matchFilter = classification === 'MUTASI';
      }
      if (!matchFilter) return false;

      // 2. Filter Checklist Categories (Multiselect)
      if (checkedCategories.length > 0) {
        const txCat = (tx.category || 'UMUM').toUpperCase().trim();
        if (!checkedCategories.includes(txCat)) {
          return false;
        }
      }

      // 3. Filter Date-to-Date range queries
      if (startDate) {
        const txDate = new Date(tx.date);
        txDate.setHours(0, 0, 0, 0);
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (txDate < start) return false;
      }
      if (endDate) {
        const txDate = new Date(tx.date);
        txDate.setHours(23, 59, 59, 999);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (txDate > end) return false;
      }

      // 4. Search Query Text Check (now also includes match with the sequential ID!)
      const seqId = txSequentialMap[tx.id] || tx.id;
      const matchSearch = 
        (tx.description || 'Penjualan POS').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tx.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        seqId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tx.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(tx.total).includes(searchQuery);

      return matchSearch;
    });
  }, [transactions, filter, checkedCategories, startDate, endDate, searchQuery, txSequentialMap]);

  // Dynamic count badges for each horizontal tab
  const tabCounts = useMemo(() => {
    let semua = 0;
    let masuk = 0;
    let keluar = 0;
    let mutasi = 0;

    transactions.forEach(tx => {
      // Apply search query match
      const seqId = txSequentialMap[tx.id] || tx.id;
      const matchSearch = 
        (tx.description || 'Penjualan POS').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tx.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        seqId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tx.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(tx.total).includes(searchQuery);

      if (!matchSearch) return;

      // Apply category checklist math
      if (checkedCategories.length > 0) {
        const txCat = (tx.category || 'UMUM').toUpperCase().trim();
        if (!checkedCategories.includes(txCat)) return;
      }

      // Apply date matches
      if (startDate) {
        const txDate = new Date(tx.date);
        txDate.setHours(0, 0, 0, 0);
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (txDate < start) return;
      }
      if (endDate) {
        const txDate = new Date(tx.date);
        txDate.setHours(23, 59, 59, 999);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (txDate > end) return;
      }

      semua++;

      const classification = getRowClassification(tx);
      if (classification === 'MASUK') masuk++;
      else if (classification === 'KELUAR') keluar++;
      else if (classification === 'MUTASI') mutasi++;
    });

    return { semua, masuk, keluar, mutasi };
  }, [transactions, searchQuery, checkedCategories, startDate, endDate, txSequentialMap]);

  // Calculate dynamic stats matching the filtered outcome list
  const stats = useMemo(() => {
    let income = 0;
    let expense = 0;
    let mutasi = 0;
    
    filteredTransactions.forEach(t => {
      const classification = getRowClassification(t);
      if (classification === 'MASUK') {
        income += t.total + (t.adminFee || 0);
      } else if (classification === 'KELUAR') {
        expense += t.total;
      } else if (classification === 'MUTASI') {
        mutasi += t.total + (t.adminFee || 0);
      }
    });

    return {
      count: filteredTransactions.length,
      income,
      expense,
      mutasi
    };
  }, [filteredTransactions]);

  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(start, start + itemsPerPage);
  }, [filteredTransactions, currentPage]);

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  const getTxTypeBadgeStyle = (type: Transaction['type']) => {
    switch(type) {
      case 'INCOME':
        return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'UANG MASUK 🟢' };
      case 'EXPENSE':
        return { bg: 'bg-rose-50 text-rose-700 border-rose-200', label: 'UANG KELUAR 🔴' };
      case 'MUTASI':
        return { bg: 'bg-amber-50 text-amber-700 border-amber-200', label: 'MUTASI SALDO 🔄' };
      case 'MODAL_PAGI':
        return { bg: 'bg-blue-50 text-blue-700 border-blue-200', label: 'MODAL AWAL 🌅' };
      case 'TAMBAH_SALDO':
        return { bg: 'bg-blue-50 text-blue-700 border-blue-200', label: 'TAMBAH SALDO 💳' };
      case 'PINDAH_SALDO':
        return { bg: 'bg-cyan-50 text-cyan-700 border-cyan-200', label: 'PINDAH SALDO 📲' };
    }
  };

  const formatTxDateAndHour = (dateStr: string) => {
    try {
      const dt = new Date(dateStr);
      return {
        dateDay: format(dt, 'dd LLLL yyyy', { locale: idLocale }),
        timeFormatted: format(dt, 'HH.mm')
      };
    } catch {
      return { dateDay: 'Hari Ini', timeFormatted: '00.00' };
    }
  };

  const getCompactDateString = (dateStr: string, txId: string) => {
    try {
      const dt = new Date(dateStr);
      const dayName = format(dt, 'EEEE', { locale: idLocale });
      const dateFormatted = format(dt, 'd MMMM yyyy', { locale: idLocale });
      const monthLower = dateFormatted.toLowerCase();
      const timeFormatted = format(dt, 'HH.mm');
      return `${txId} 📆 Transaksi ${dayName} ${monthLower} jam ${timeFormatted}`;
    } catch {
      return `${txId} 📆 Transaksi`;
    }
  };

  const generateEscPosData = () => {
    if (!printTx) return new Uint8Array(0);
    const encoder = new EscPosEncoder();
    const lineWidth = printSize === '58' ? 32 : 48;
    
    encoder.initialize();
    encoder.alignCenter();
    encoder.bold(true).textLine(storeName || 'KASIR CUBA').bold(false);
    if (storeAddress) encoder.textLine(storeAddress);
    
    encoder.line('-', lineWidth);
    encoder.bold(true).textLine('STRUK TRANSAKSI').bold(false);
    encoder.newline();
    
    encoder.alignLeft();
    const txCode = txSequentialMap[printTx.id] || printTx.id;
    const txDateObj = new Date(printTx.date);
    const formattedDate = format(txDateObj, 'dd MMM yyyy, HH.mm', { locale: idLocale });
    
    encoder.textLine(`No Trx   : ${txCode}`);
    encoder.textLine(`Tanggal  : ${formattedDate}`);
    encoder.textLine(`Kasir    : ${cashierName || 'Kasir'}`);
    if (printCustomerName) encoder.textLine(`Pelanggan: ${printCustomerName}`);
    
    encoder.line('-', lineWidth);
    
    if (printTx.items && printTx.items.length > 0) {
      printTx.items.forEach(item => {
        const name = item.name || 'Item';
        const lineTotal = item.price * (item.quantity || 1);
        const priceStr = `Rp ${lineTotal.toLocaleString('id-ID')}`;
        
        if (item.quantity > 1) {
          encoder.textLine(name);
          const detailStr = `${item.quantity} x ${item.price.toLocaleString('id-ID')}`;
          const spaces = lineWidth - detailStr.length - priceStr.length;
          encoder.textLine(detailStr + ' '.repeat(spaces > 0 ? spaces : 1) + priceStr);
        } else {
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
    } else {
      const desc = printTx.description || 'Transaksi';
      const priceStr = `Rp ${printTx.total.toLocaleString('id-ID')}`;
      if (desc.length + priceStr.length + 1 <= lineWidth) {
        const spaces = lineWidth - desc.length - priceStr.length;
        encoder.textLine(desc + ' '.repeat(spaces) + priceStr);
      } else {
        encoder.textLine(desc);
        const spaces = lineWidth - priceStr.length;
        encoder.textLine(' '.repeat(spaces) + priceStr);
      }
    }
    
    encoder.line('-', lineWidth);
    
    if (printTx.adminFee && printTx.adminFee > 0) {
      const subTotalStr = `Subtotal: Rp ${printTx.total.toLocaleString('id-ID')}`;
      encoder.alignRight().textLine(subTotalStr);
      const feeStr = `Biaya Admin: Rp ${printTx.adminFee.toLocaleString('id-ID')}`;
      encoder.textLine(feeStr);
      encoder.line('-', lineWidth);
    }
    
    const totalAmount = printTx.total + (printTx.adminFee || 0);
    const totalLabel = 'TOTAL';
    const totalVal = `Rp ${totalAmount.toLocaleString('id-ID')}`;
    const totSpaces = lineWidth - totalLabel.length - totalVal.length;
    encoder.alignLeft().bold(true)
           .textLine(totalLabel + ' '.repeat(totSpaces > 0 ? totSpaces : 1) + totalVal)
           .bold(false);
    
    if (printTx.sourceWallet || printTx.targetWallet) {
      encoder.newline().alignCenter();
      const walletSourceObj = wallets.find(w => w.id === printTx.sourceWallet);
      const walletTargetObj = wallets.find(w => w.id === printTx.targetWallet);
      if (walletSourceObj && walletTargetObj) {
        encoder.textLine(`Dari: ${walletSourceObj.name} -> Ke: ${walletTargetObj.name}`);
      } else if (walletTargetObj) {
        encoder.textLine(`Metode Pembayaran: ${walletTargetObj.name}`);
      } else if (walletSourceObj) {
        encoder.textLine(`Sumber Dana: ${walletSourceObj.name}`);
      }
    }
    
    if (printNotes) {
      encoder.newline();
      encoder.alignCenter();
      encoder.textLine(printNotes);
    }
    
    encoder.newline();
    encoder.alignCenter();
    encoder.textLine('*** Terima Kasih ***');
    encoder.printAndFeed(4);
    
    return encoder.encode();
  };

  const handleSystemPrint = async () => {
    const isAndroid = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);
    if (isAndroid && printTx) {
      try {
        const { printViaRawBT } = await import('../lib/escpos');
        await printViaRawBT(generateEscPosData());
        setPrintTx(null);
        return;
      } catch (err) {
        console.error('RawBT error', err);
      }
    }
    setTimeout(() => {
      window.print();
    }, 200);
  };

  const handleBluetoothPrint = async () => {
    if (!printTx) return;
    try {
      setIsPrintingBluetooth(true);
      const data = generateEscPosData();
      await printViaWebBluetooth(data);
      alert('Struk berhasil dicetak via Web Bluetooth!');
      setPrintTx(null);
    } catch (err: any) {
      alert(`Gagal cetak Bluetooth: ${err.message || err}\n\nPastikan printer aktif dan Bluetooth diaktifkan.`);
    } finally {
      setIsPrintingBluetooth(false);
    }
  };


  return (
    <>
      <div className="bg-slate-50 dark:bg-slate-900 min-h-screen pb-24 overflow-y-auto print:hidden">
      {/* HEADER WITH RICH GRADIENT & BACK BUTTON */}
      <div className="bg-[#1e3a8a] text-white pt-6 pb-20 px-5 rounded-b-[2.5rem] relative shadow-md">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <button 
              type="button"
              onClick={() => navigate('/')} 
              className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer"
            >
              <ArrowLeft size={16} strokeWidth={2.5} />
            </button>
            <div>
              <h1 className="text-sm font-black tracking-widest uppercase">MUTASI & RIWAYAT</h1>
              <p className="text-[9px] text-blue-200 uppercase font-bold tracking-wide mt-1">Pembukuan Aliran Dana Utama</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportTransactionsToExcel}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl flex items-center justify-center gap-1 text-[9px] font-black uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer"
              title="Ekspor pencarian ke MS Excel"
            >
              <FileDown size={11} className="stroke-[3]" />
              <span>Excel</span>
            </button>

            <button 
              onClick={() => {
                if (window.confirm('Muat ulang seluruh transaksi default?')) {
                  localStorage.removeItem('store_transactions');
                  localStorage.removeItem('store_wallets');
                  window.location.reload();
                }
              }}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer text-white"
              title="Reset Database Transaksi"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
        
        {/* TOTAL FLOW STATS COMPACT PANEL */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {/* Card 1: Total Transaksi */}
          <div 
            onClick={() => setShowBreakdownModal(true)}
            className="bg-white/8 border border-white/11 p-3 rounded-2xl backdrop-blur-md cursor-pointer hover:bg-white/15 active:scale-[0.98] select-none transition-all duration-150 relative group overflow-hidden"
            title="Klik untuk melihat rincian transaksi"
          >
            {/* Visual subtle shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            
            <p className="text-[8px] font-black text-blue-200 mb-1 tracking-wider uppercase flex items-center justify-between gap-1">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse shrink-0"></span> Total Transaksi
              </span>
              <span className="text-[7.5px] font-sans border border-blue-400/30 text-blue-300 font-black px-1.2 py-0.5 rounded-sm bg-blue-500/10 opacity-70 group-hover:opacity-100 transition-opacity">
                DETAIL ➔
              </span>
            </p>
            <p className="text-[12.5px] font-black text-white font-mono mt-0.5 whitespace-nowrap">
              {stats.count} <span className="text-[9.5px] font-sans text-blue-200 font-extrabold">Trx</span>
            </p>
          </div>
          
          {/* Card 2: Uang Masuk */}
          <div className="bg-white/8 border border-white/12 p-3 rounded-2xl backdrop-blur-md">
            <p className="text-[8px] font-black text-emerald-300 mb-1 tracking-wider uppercase flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span> Uang Masuk
            </p>
            <p className="text-[12.5px] font-black text-emerald-400 font-mono mt-0.5 truncate" title={`+Rp ${stats.income.toLocaleString('id-ID')}`}>
              +Rp {stats.income.toLocaleString('id-ID')}
            </p>
          </div>

          {/* Card 3: Uang Keluar */}
          <div className="bg-white/8 border border-white/12 p-3 rounded-2xl backdrop-blur-md">
            <p className="text-[8px] font-black text-rose-350 mb-1 tracking-wider uppercase flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span> Uang Keluar
            </p>
            <p className="text-[12.5px] font-black text-rose-300 font-mono mt-0.5 truncate" title={`-Rp ${stats.expense.toLocaleString('id-ID')}`}>
              -Rp {stats.expense.toLocaleString('id-ID')}
            </p>
          </div>

          {/* Card 4: Total Mutasi */}
          <div className="bg-white/8 border border-white/12 p-3 rounded-2xl backdrop-blur-md">
            <p className="text-[8px] font-black text-orange-300 mb-1 tracking-wider uppercase flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-450 shrink-0"></span> Total Mutasi
            </p>
            <p className="text-[12.5px] font-black text-orange-250 font-mono mt-0.5 truncate" title={`Rp ${stats.mutasi.toLocaleString('id-ID')}`}>
              Rp {stats.mutasi.toLocaleString('id-ID')}
            </p>
          </div>
        </div>
      </div>

      {/* HORIZONTAL CATEGORY FILTER TABS */}
      <div className="px-5 -mt-6 relative z-10 select-none">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-1.5 shadow-[0_8px_30px_rgb(0,0,0,0.05)] border border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto scrollbar-hidden">
          {[
            { id: 'Semua', label: 'Semua', count: tabCounts.semua },
            { id: 'Uang Masuk', label: 'Masuk', count: tabCounts.masuk },
            { id: 'Uang Keluar', label: 'Keluar', count: tabCounts.keluar },
            { id: 'Mutasi', label: 'Mutasi', count: tabCounts.mutasi }
          ].map((item) => (
            <button 
              key={item.id}
              onClick={() => setFilter(item.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 text-center whitespace-nowrap px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                filter === item.id 
                  ? 'bg-blue-600 text-white shadow-sm font-extrabold' 
                  : 'bg-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-900'
              }`}
            >
              <span>{item.label}</span>
              <span className={`text-[8.5px] font-mono font-black px-1.5 py-0.5 rounded-full ${
                filter === item.id 
                  ? 'bg-white/25 text-white' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/50'
              }`}>
                {item.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* SEARCH FILTER BOX WITH ADVANCED TOGGLE */}
      <div className="px-5 mt-5">
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            <Search size={14} strokeWidth={2.5} />
          </span>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari ID trx, bank, nominal, atau keterangan..." 
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 py-3 pl-10 pr-12 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 shadow-xs outline-none focus:border-blue-400 transition-colors"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-10 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-300 font-bold text-xs"
            >
              ✕
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowFilterCard(!showFilterCard)}
            className={`absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors ${
              showFilterCard || checkedCategories.length > 0 || startDate || endDate
                ? 'text-blue-600 font-bold'
                : 'text-slate-450 hover:text-slate-600 dark:text-slate-300'
            }`}
            title="Filter Lanjutan"
          >
            <Filter size={15} strokeWidth={2.5} />
          </button>
        </div>

        {/* Collapsible Advanced Filtering Panel Card */}
        {showFilterCard && (
          <div className="mt-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-3">
              <div className="flex items-center gap-1.5 text-blue-600">
                <Filter size={11} strokeWidth={3} />
                <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
                  Saring Berdasarkan Kategori & Tanggal
                </h4>
              </div>
              <button 
                onClick={() => {
                  setCheckedCategories([]);
                  setStartDate('');
                  setEndDate('');
                }}
                className="text-[9px] font-black text-rose-600 hover:text-rose-800 bg-rose-50 px-2 py-1 rounded-lg uppercase tracking-wider transition-colors"
              >
                Reset Filter
              </button>
            </div>

            {/* Checklist Category Picker */}
            <div className="mb-4">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                <Tag size={10} /> PILIH KATEGORI (CEKLIS BEBERAPA):
              </p>
              <div className="grid grid-cols-2 gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                {allCategories.map(cat => {
                  const isChecked = checkedCategories.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        if (isChecked) {
                          setCheckedCategories(prev => prev.filter(c => c !== cat));
                        } else {
                          setCheckedCategories(prev => [...prev, cat]);
                        }
                      }}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-[10px] font-bold text-left transition-all ${
                        isChecked 
                          ? 'bg-blue-50 border-blue-250 text-blue-700 font-extrabold shadow-3xs' 
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-200/80 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:bg-slate-800'
                      }`}
                    >
                      <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors shrink-0 ${
                        isChecked ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                      }`}>
                        {isChecked && <Check size={10} strokeWidth={4} />}
                      </div>
                      <span className="truncate uppercase">{cat}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date-to-Date Filters */}
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                <Calendar size={10} /> SARING JENIS TANGGAL KASBON / MUTASI:
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[8px] font-black text-slate-400 block mb-1 uppercase tracking-wider">
                    DARI TANGGAL
                  </label>
                  <input 
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200/80 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="text-[8px] font-black text-slate-400 block mb-1 uppercase tracking-wider">
                    SAMPAI TANGGAL
                  </label>
                  <input 
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200/80 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-blue-400"
                  />
                </div>
              </div>
            </div>

            {/* Active filters summary */}
            {(checkedCategories.length > 0 || startDate || endDate) && (
              <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-1 items-center">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider mr-1">AKTIF BENCH:</span>
                {checkedCategories.map(cat => (
                  <span key={cat} className="inline-flex items-center gap-0.5 bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase">
                    {cat}
                    <button type="button" onClick={() => setCheckedCategories(p => p.filter(c => c !== cat))} className="text-blue-500 hover:text-blue-800 font-extrabold ml-1 font-mono">✕</button>
                  </span>
                ))}
                {startDate && (
                  <span className="inline-flex items-center gap-0.5 bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded text-[8px] font-bold">
                    Mulai: {startDate}
                    <button type="button" onClick={() => setStartDate('')} className="text-blue-500 hover:text-blue-800 font-extrabold ml-1 font-mono">✕</button>
                  </span>
                )}
                {endDate && (
                  <span className="inline-flex items-center gap-0.5 bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded text-[8px] font-bold">
                    Akhir: {endDate}
                    <button type="button" onClick={() => setEndDate('')} className="text-blue-500 hover:text-blue-800 font-extrabold ml-1 font-mono">✕</button>
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MAIN TRANSACTION STREAM LIST */}
      <div className="px-5 mt-5">
        <div className="flex items-center justify-between mb-3 px-1">
          <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">
            DAFTAR TRANSAKSI ALIRAN DANA ({filteredTransactions.length})
          </p>
          <span className="text-[9px] bg-slate-200 text-slate-700 dark:text-slate-200 px-2 py-0.5 rounded-md font-bold uppercase tracking-wide">REALTIME</span>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="py-16 bg-white dark:bg-slate-800 border border-dashed border-slate-200 dark:border-slate-700 rounded-3xl text-center px-6 shadow-xs">
            <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <Receipt size={20} />
            </div>
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-xs uppercase tracking-wider mb-1">DATA KOSONG</h3>
            <p className="text-[10px] text-slate-400 font-semibold leading-relaxed max-w-xs mx-auto">
              Tidak ditemukan data riwayat mutasi dana yang sesuai dengan kata kunci pencarian Anda.
            </p>
          </div>
        ) : (
          <div className="space-y-2 [.pc-mode_&]:grid [.pc-mode_&]:grid-cols-1 [.pc-mode_&]:lg:grid-cols-2 [.pc-mode_&]:xl:grid-cols-3 [.pc-mode_&]:gap-4 [.pc-mode_&]:space-y-0">
            {paginatedTransactions.map((tx) => {
              const isExpanded = !!expandedTx[tx.id];
              const isEditing = editingId === tx.id;
              const { dateDay, timeFormatted } = formatTxDateAndHour(tx.date);
              const badge = getTxTypeBadgeStyle(tx.type);
              
              // Determine direction logic for colors using classification
              const classification = getRowClassification(tx);
              const isMoneyIn = classification === 'MASUK';
              const walletSourceObj = wallets.find(w => w.id === tx.sourceWallet);
              const walletTargetObj = wallets.find(w => w.id === tx.targetWallet);
              const txCode = txSequentialMap[tx.id] || tx.id;

              // Color classes
              let accentBarClass = 'bg-slate-400';
              let circleColorClass = 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-150';
              if (classification === 'MASUK') {
                accentBarClass = 'bg-emerald-500';
                circleColorClass = 'bg-emerald-50/80 text-emerald-700 border border-emerald-150/70 shadow-3xs';
              } else if (classification === 'KELUAR') {
                accentBarClass = 'bg-rose-500';
                circleColorClass = 'bg-rose-50/80 text-rose-700 border border-rose-150/70 shadow-3xs';
              } else if (classification === 'MUTASI') {
                accentBarClass = 'bg-blue-500';
                circleColorClass = 'bg-blue-50/80 text-blue-700 border border-blue-150/70 shadow-3xs';
              }

              return (
                <div 
                  key={tx.id} 
                  className={`bg-white dark:bg-slate-800 rounded-2xl border transition-all duration-200 shadow-xs relative overflow-hidden ${
                    isExpanded ? 'border-blue-200 shadow-md ring-1 ring-blue-50' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {/* Left Side colored identifier accent bar */}
                  <div className={`absolute top-0 left-0 bottom-0 w-1.2 ${accentBarClass}`}></div>

                  {/* HEADER COMPACT BLOCK (Always Visible) */}
                  <div 
                    onClick={() => toggleExpand(tx.id)}
                    className="p-2.5 pl-4 flex items-center justify-between gap-2.5 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {/* Flow icon indicator circle containing global order sequence */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-mono text-[10.5px] font-black ${circleColorClass}`}>
                        #{globalSequenceMap[tx.id] || 1}
                      </div>

                      {/* Title & basic directions */}
                      <div className="min-w-0 flex-1 pr-2">
                        {tx.category && (
                          <div className="flex items-center gap-1 mt-0.5 mb-1 w-full truncate">
                            <p className="text-[13px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight truncate">
                              {tx.category.toUpperCase().trim() === 'UANG DIGITAL' ? (
                                `Uang digital : ${(() => {
                                  let wName = '';
                                  if (walletSourceObj && walletSourceObj.id !== 'Bank08') {
                                    wName = walletSourceObj.name;
                                  } else if (walletTargetObj && walletTargetObj.id !== 'Bank08') {
                                    wName = walletTargetObj.name;
                                  } else {
                                    wName = walletSourceObj?.name || walletTargetObj?.name || 'dana';
                                  }
                                  return wName;
                                })()}`
                              ) : (
                                tx.category.toUpperCase()
                              )}
                            </p>
                          </div>
                        )}
                        <p className={`text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-relaxed ${isExpanded ? '' : 'line-clamp-1'}`}>
                          {tx.description || 'Penjualan POS'}
                        </p>
                      </div>
                    </div>

                    {/* Nominal block & Arrow toggle */}
                    <div className="text-right shrink-0 flex items-center gap-2.5">
                      <div>
                        <p className={`text-xs font-black tracking-tight ${
                          isMoneyIn ? 'text-emerald-600' : 'text-slate-800 dark:text-slate-100'
                        }`}>
                          {isMoneyIn ? '+' : '-'} Rp {tx.total.toLocaleString('id-ID')}
                        </p>
                        {tx.adminFee && tx.adminFee > 0 ? (
                          <p className="text-[9px] font-black text-rose-500 leading-none my-0.5">
                            Laba/Adm : {tx.adminFee.toLocaleString('id-ID')}
                          </p>
                        ) : null}
                        <p className="text-[8px] font-black uppercase text-slate-400 tracking-wider font-mono">
                          {walletTargetObj ? walletTargetObj.name : walletSourceObj ? walletSourceObj.name : 'Laci Kasir'}
                        </p>
                      </div>
                      
                      <div className="text-slate-400">
                        {isExpanded ? <ChevronUp size={12} strokeWidth={2.5} /> : <ChevronDown size={12} strokeWidth={2.5} />}
                      </div>
                    </div>
                  </div>

                  {/* COLLAPSIBLE DETAILS AREA ("Klik Tampilkan / Sembunyikan") */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 p-3 pl-4 sm:pl-5 text-xs text-slate-600 dark:text-slate-300 space-y-2.5">
                      
                      {/* RENDER INLINE NORMAL DETAILS VIEW */}
                      {!isEditing ? (
                        <>
                          <div className="grid grid-cols-2 gap-2 pb-2 border-b border-slate-100/70 dark:border-slate-800/70">
                            <div>
                              <p className="text-[7.5px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1">TIPE ARUS KAS</p>
                              <span className={`inline-block text-[8px] font-black border px-1.5 py-0.5 rounded ${badge.bg}`}>
                                {badge.label}
                              </span>
                            </div>
                            <div>
                              <p className="text-[7.5px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1">TANGGAL TRANSAKSI</p>
                              <p className="font-extrabold text-slate-800 dark:text-slate-200 text-[9px] flex items-center gap-1">
                                <Calendar size={9} className="text-slate-400" /> {dateDay}
                              </p>
                            </div>
                          </div>

                          {(tx.sourceWallet || tx.targetWallet) && (
                            <div className="grid grid-cols-2 gap-2 pb-2 border-b border-slate-100/70 dark:border-slate-800/70">
                              {tx.sourceWallet && (
                                <div>
                                  <p className="text-[7.5px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1">DOMPET PENGIRIM (SOURCE)</p>
                                  <p className="font-bold text-slate-700 dark:text-slate-250 text-[9.5px] flex items-center gap-1">
                                    <Wallet size={10} className="text-slate-400" />
                                    {walletSourceObj?.name || 'Laci Tunai'}
                                  </p>
                                </div>
                              )}
                              {tx.targetWallet && (
                                <div>
                                  <p className="text-[7.5px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1">DOMPET PENERIMA (TARGET)</p>
                                  <p className="font-bold text-slate-700 dark:text-slate-250 text-[9.5px] flex items-center gap-1.5">
                                    <Wallet size={10} className="text-emerald-500" />
                                    {walletTargetObj?.name || 'Laci Tunai'}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Specific POS items checklist details rendering */}
                          {tx.items && tx.items.length > 0 && (
                            <div className="pb-2 border-b border-slate-100/70 dark:border-slate-800/70">
                              <p className="text-[7.5px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1.5">RINCIAN PRODUK PENJUALAN</p>
                              <div className="space-y-1">
                                {tx.items.map((it, pIdx) => (
                                  <div key={pIdx} className="flex justify-between items-center bg-white dark:bg-slate-800/60 px-2 py-1 rounded-md border border-slate-100/60 dark:border-slate-800/60">
                                    <span className="font-extrabold text-[9px] text-slate-700 dark:text-slate-200">
                                      {it.name} <span className="font-bold text-[8px] text-[#2563eb] bg-blue-50 dark:bg-blue-950/40 px-1 py-0.5 rounded ml-1">{it.quantity}X</span>
                                    </span>
                                    <span className="font-bold text-[9px] text-slate-500 dark:text-slate-450">Rp {(it.price * it.quantity).toLocaleString('id-ID')}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Comprehensive Admin Fees indicators */}
                          <div className="grid grid-cols-2 gap-2 pb-2">
                            <div>
                              <p className="text-[7.5px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1">LABA / ADMIN FEE</p>
                              <p className="font-black text-slate-800 dark:text-slate-150 text-[10px]">
                                {tx.adminFee && tx.adminFee > 0 ? (
                                  `Rp ${tx.adminFee.toLocaleString('id-ID')}`
                                ) : (
                                  'Tanpa Admin Fee 🗃️'
                                )}
                              </p>
                            </div>
                            
                            {tx.adminFee && tx.adminFee > 0 && (
                              <div>
                                <p className="text-[7.5px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1">METODE FEE</p>
                                <span className={`inline-block text-[7.5px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                  tx.adminNonTunai ? 'bg-blue-50 text-blue-700 border border-blue-150' : 'bg-amber-50 text-amber-700 border border-amber-150'
                                }`}>
                                  {tx.adminNonTunai ? '💳 Non-Tunai' : '💵 Tunai Laci'}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Detail Controls Footer Line */}
                          <div className="pt-2 border-t border-slate-100/80 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-1.5">
                            <span className="text-[8px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-1 sm:mb-0">
                              Diperbarui: {timeFormatted} WITA
                            </span>
                            
                            <div className="flex flex-wrap gap-1.5">
                              {/* CETAK RECEIPT BUTTON */}
                              <button
                                onClick={() => {
                                  setPrintTx(tx);
                                  setPrintCustomerName('');
                                  setPrintNotes('');
                                  setPrintSize('58');
                                }}
                                className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 dark:bg-amber-950/25 hover:bg-amber-100 dark:hover:bg-amber-950/40 transition-colors cursor-pointer border border-amber-100 dark:border-amber-900/40 shadow-3xs"
                              >
                                <Printer size={9} strokeWidth={2.5} /> CETAK NOTA
                              </button>

                              {/* EDIT ACTION BUTTON */}
                              <button
                                onClick={() => startEdit(tx)}
                                className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 dark:bg-blue-950/25 hover:bg-blue-100 dark:hover:bg-blue-950/40 transition-colors cursor-pointer border border-blue-100 dark:border-blue-900/40"
                              >
                                <Edit2 size={9} strokeWidth={2.5} /> EDIT TRX
                              </button>

                              {/* DELETE ACTION BUTTON */}
                              {deleteConfirmId === tx.id ? (
                                <div className="flex gap-1 items-center animate-in fade-in">
                                  <span className="text-[8px] font-bold text-slate-500 mr-1">Hapus?</span>
                                  <button
                                    onClick={() => {
                                      deleteTransaction(tx.id);
                                      setDeleteConfirmId(null);
                                    }}
                                    className="px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-sm"
                                  >
                                    YA
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirmId(null)}
                                    className="px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-705 transition-colors shadow-sm"
                                  >
                                    TIDAK
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setDeleteConfirmId(tx.id)}
                                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider text-rose-600 bg-rose-50 dark:bg-rose-950/25 hover:bg-rose-100 dark:hover:bg-rose-950/40 transition-colors cursor-pointer border border-rose-100 dark:border-rose-900/40"
                                >
                                  <Trash2 size={9} strokeWidth={2.5} /> HAPUS
                                </button>
                              )}
                            </div>
                          </div>
                        </>
                      ) : (
                        
                        /* RENDER INLINE TRANSACTION EDIT FORM MODE */
                        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-blue-200 shadow-inner flex flex-col gap-4 animate-in fade-in duration-200">
                          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                            <h4 className="font-extrabold text-[10px] text-blue-800 uppercase tracking-widest">
                              📋 PANEL EDIT TRANSAKSI
                            </h4>
                            <span className="text-[8.5px] bg-amber-100 text-amber-800 font-black px-2 py-0.5 rounded">
                              TRX AKAN DIKALIBRASI ULANG
                            </span>
                          </div>

                          {/* ORIGINAL BACKUP VALUES DATA BANNER ("Fungsi nominal sebelum di edit") */}
                          {originalTx && (
                            <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 flex flex-col gap-1">
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider leading-none">
                                🔒 DATA ASLI SEBELUM DI-EDIT:
                              </p>
                              <div className="grid grid-cols-2 gap-1 text-[9px] text-slate-600 dark:text-slate-300 font-bold mt-1">
                                <span>• Deskripsi: {originalTx.description || 'Penjualan POS'}</span>
                                <span>• Nominal: Rp {originalTx.total.toLocaleString('id-ID')}</span>
                                <span>• Arus Kas: {originalTx.type}</span>
                                <span>• Admin Fee: Rp {(originalTx.adminFee || 0).toLocaleString('id-ID')}</span>
                              </div>
                            </div>
                          )}

                          {editError && (
                            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-2 rounded-xl text-[9px] font-extrabold flex items-center gap-1.5">
                              <AlertCircle size={10} className="shrink-0" />
                              <span>{editError}</span>
                            </div>
                          )}

                          {/* Editable Fields Input fields */}
                          <div className="space-y-3 [.pc-mode_&]:grid [.pc-mode_&]:md:grid-cols-2 [.pc-mode_&]:lg:grid-cols-3 [.pc-mode_&]:gap-4 [.pc-mode_&]:space-y-0">
                            {/* Title/Description input */}
                            <div>
                              <label className="text-[8px] font-black text-slate-400 block mb-1 uppercase tracking-wider">
                                DESKRIPSI TRANSAKSI
                              </label>
                              <input 
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                                placeholder="Ubah nama keterangan deskripsi..."
                              />
                            </div>

                            {/* Nominal / Total input */}
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[8px] font-black text-slate-400 block mb-1 uppercase tracking-wider">
                                  NOMINAL UTAMA (Rp)
                                </label>
                                <input 
                                  type="number"
                                  value={editAmount}
                                  onChange={(e) => setEditAmount(Number(e.target.value))}
                                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-xl text-xs font-extrabold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                                />
                              </div>
                              <div>
                                <label className="text-[8px] font-black text-slate-400 block mb-1 uppercase tracking-wider">
                                  TIPE ARUS KAS
                                </label>
                                <select
                                  value={editType}
                                  onChange={(e) => setEditType(e.target.value as Transaction['type'])}
                                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-1 py-1.5 rounded-xl text-[10px] font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                                >
                                  <option value="INCOME">INCOME (UANG MASUK)</option>
                                  <option value="EXPENSE">EXPENSE (UANG KELUAR)</option>
                                  <option value="MUTASI">MUTASI SALDO</option>
                                  <option value="TAMBAH_SALDO">TAMBAH SALDO</option>
                                  <option value="PINDAH_SALDO">PINDAH SALDO</option>
                                  <option value="MODAL_PAGI">MODAL PAGI</option>
                                </select>
                              </div>
                            </div>

                            {/* Admin Fee options inputs */}
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[8px] font-black text-slate-400 block mb-1 uppercase tracking-wider">
                                  ADMIN FEE (Rp)
                                </label>
                                <input 
                                  type="number"
                                  value={editAdminFee}
                                  onChange={(e) => setEditAdminFee(Number(e.target.value))}
                                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-xl text-xs font-extrabold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                                />
                              </div>
                              <div>
                                <label className="text-[8px] font-black text-slate-400 block mb-1 uppercase tracking-wider">
                                  PENYIMPANAN FEE
                                </label>
                                <button
                                  type="button"
                                  onClick={() => setEditAdminNonTunai(!editAdminNonTunai)}
                                  className={`w-full py-1.5 rounded-xl text-[9px] font-black border transition-colors ${
                                    editAdminNonTunai 
                                      ? 'bg-blue-50 border-blue-200 text-blue-700' 
                                      : 'bg-amber-50 border-amber-200 text-amber-700'
                                  }`}
                                >
                                  {editAdminNonTunai ? '💳 DIGITAL NON-TUNAI' : '💵 TUNAI LACI'}
                                </button>
                              </div>
                            </div>

                            {/* Source and Target Wallets selectors */}
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[8px] font-black text-slate-400 block mb-1 uppercase tracking-wider">
                                  DOMPET KAS PENGIRIM
                                </label>
                                <select
                                  value={editSourceWallet}
                                  onChange={(e) => setEditSourceWallet(e.target.value)}
                                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-1 py-1.5 rounded-xl text-[9px] font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                                >
                                  <option value="">-- Kosong / Tunai --</option>
                                  {wallets.map(w => (
                                    <option key={w.id} value={w.id}>{w.name}</option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="text-[8px] font-black text-slate-400 block mb-1 uppercase tracking-wider">
                                  DOMPET KAS PENERIMA
                                </label>
                                <select
                                  value={editTargetWallet}
                                  onChange={(e) => setEditTargetWallet(e.target.value)}
                                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-1 py-1.5 rounded-xl text-[9px] font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                                >
                                  <option value="">-- Kosong / Tunai --</option>
                                  {wallets.map(w => (
                                    <option key={w.id} value={w.id}>{w.name}</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {/* Category Text field tag */}
                            <div>
                              <label className="text-[8px] font-black text-slate-400 block mb-1 uppercase tracking-wider flex items-center gap-1">
                                <Tag size={8} /> KATEGORI OPERASIONAL
                              </label>
                              <input 
                                type="text"
                                value={editCategory}
                                onChange={(e) => setEditCategory(e.target.value.toUpperCase())}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-[10px] font-black text-[#5b21b6] uppercase focus:outline-none"
                                placeholder="E.g. BELANJA, SALDO, LAINNYA"
                              />
                            </div>
                          </div>

                          {/* Editable action trigger buttons */}
                          <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 select-none">
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="flex-1 py-2 text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <X size={10} strokeWidth={3} /> BATAL
                            </button>
                            
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(tx.id)}
                              className="flex-1 py-2 text-[9px] font-black uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Check size={10} strokeWidth={3} /> SIMPAN PERUBAHAN
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Date boundary bottom marker inside collapsed mode */}
                  {!isExpanded && (
                    <div className="bg-slate-50/70 px-4 py-1.5 flex items-center text-[8.5px] font-extrabold text-slate-500 dark:text-slate-400 border-t border-slate-100/60 select-none font-mono">
                      <span>{getCompactDateString(tx.date, txSequentialMap[tx.id] || tx.id)}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* PAGINATION CONTROLS */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between px-1 select-none">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-3xs rounded-xl text-[10px] uppercase tracking-wider font-extrabold text-slate-600 dark:text-slate-300 disabled:opacity-50 active:scale-95 transition-all"
            >
              Seb<span className="hidden sm:inline">elumnya</span>
            </button>
            <div className="flex gap-1 overflow-x-auto mx-2 no-scrollbar">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-8 h-8 rounded-xl text-xs font-extrabold flex items-center justify-center shrink-0 transition-all ${
                    currentPage === i + 1 
                      ? 'bg-blue-600 text-white shadow-md border-blue-600' 
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-3xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-900'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-3xs rounded-xl text-[10px] uppercase tracking-wider font-extrabold text-slate-600 dark:text-slate-300 disabled:opacity-50 active:scale-95 transition-all"
            >
              Lan<span className="hidden sm:inline">jut</span>
            </button>
          </div>
        )}
      </div>

      {/* SHOW BREAKDOWN MODAL OVERLAY */}
      {showBreakdownModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Animated backdrop */}
          <div 
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity duration-300"
            onClick={() => setShowBreakdownModal(false)}
          ></div>

          {/* Modal Container */}
          <div className="bg-slate-50 dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200/60 overflow-hidden flex flex-col max-h-[85vh] relative z-10 animate-in fade-in zoom-in-95 duration-200">
            {/* Header with blue-slate gradient */}
            <div className="bg-gradient-to-r from-slate-900 to-blue-950 p-5 pl-6 text-white flex items-center justify-between shadow-md relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent)] pointer-events-none"></div>
              <div>
                <h3 className="text-sm font-black tracking-tight uppercase flex items-center gap-2">
                  <Receipt size={16} className="text-blue-300" /> Detail Rincian Hitung Transaksi
                </h3>
                <p className="text-[10px] text-blue-100 font-medium mt-1 leading-snug">
                  Klasifikasi otomatis transaksi berdasarkan rumus & kategori data saat ini (Kriteria terpilih)
                </p>
              </div>
              <button 
                onClick={() => setShowBreakdownModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all text-white border border-white/10 active:scale-90"
              >
                <X size={14} strokeWidth={2.5} />
              </button>
            </div>

            {/* Formula Indicators Grid (Educational Box) */}
            <div className="p-4 bg-white dark:bg-slate-800 border-b border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-2.5 shadow-3xs select-none">
              <div className="bg-emerald-50/50 border border-emerald-100/80 p-2 py-2.5 rounded-2xl">
                <span className="text-[7.5px] font-black text-emerald-700 tracking-wider uppercase block mb-1">💸 UANG MASUK</span>
                <p className="text-[8.5px] text-emerald-600 font-extrabold leading-tight">Tambah Saldo, Modal Pagi, & Pindah Saldo</p>
              </div>
              <div className="bg-rose-50/50 border border-rose-100/80 p-2 py-2.5 rounded-2xl">
                <span className="text-[7.5px] font-black text-rose-700 tracking-wider uppercase block mb-1">📤 UANG KELUAR</span>
                <p className="text-[8.5px] text-rose-600 font-extrabold leading-tight">Tarik Tunai & Pengeluaran Toko</p>
              </div>
              <div className="bg-blue-50/50 border border-blue-100/80 p-2 py-2.5 rounded-2xl">
                <span className="text-[7.5px] font-black text-blue-700 tracking-wider uppercase block mb-1">🔄 UANG MUTASI</span>
                <p className="text-[8.5px] text-blue-600 font-extrabold leading-tight">Penjualan Produk Digital & Aksesoris</p>
              </div>
            </div>

            {/* Tab switchers inside modal */}
            <div className="px-5 pt-3.5 bg-slate-50 dark:bg-slate-900 flex items-center justify-between border-b border-slate-150">
              <div className="flex gap-1.5 overflow-x-auto scrollbar-hidden pb-2.5">
                {[
                  { id: 'SEMUA', name: 'Semua', count: filteredTransactions.length },
                  { id: 'MASUK', name: 'Masuk', count: filteredTransactions.filter(t => getRowClassification(t) === 'MASUK').length },
                  { id: 'KELUAR', name: 'Keluar', count: filteredTransactions.filter(t => getRowClassification(t) === 'KELUAR').length },
                  { id: 'MUTASI', name: 'Mutasi', count: filteredTransactions.filter(t => getRowClassification(t) === 'MUTASI').length }
                ].map((tb) => {
                  const isActive = modalActiveTab === tb.id;
                  return (
                    <button
                      key={tb.id}
                      onClick={() => setModalActiveTab(tb.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 border ${
                        isActive 
                          ? 'bg-blue-600 border-blue-600 text-white shadow-xs' 
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:bg-slate-800'
                      }`}
                    >
                      <span>{tb.name}</span>
                      <span className={`text-[8px] font-mono font-bold px-1 rounded ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}>
                        {tb.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Total calculations under active mode tab */}
              <div className="text-right pb-2.5 font-mono select-none">
                <span className="text-[8px] font-black text-slate-400 block uppercase tracking-wider">TOTAL NOMINAL TAB</span>
                <span className="text-xs font-black text-slate-800 dark:text-slate-100">
                  Rp {
                    filteredTransactions
                      .filter(t => modalActiveTab === 'SEMUA' || getRowClassification(t) === modalActiveTab)
                      .reduce((sum, t) => sum + t.total + (t.adminFee || 0), 0)
                      .toLocaleString('id-ID')
                  }
                </span>
              </div>
            </div>

            {/* List block */}
            <div className="flex-1 overflow-y-auto scrollbar-hidden p-5 space-y-2.5 bg-slate-50 dark:bg-slate-900 max-h-[45vh]">
              {(() => {
                const modalFiltered = filteredTransactions.filter(t => 
                  modalActiveTab === 'SEMUA' || getRowClassification(t) === modalActiveTab
                );

                if (modalFiltered.length === 0) {
                  return (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 text-center border border-dashed border-slate-200 dark:border-slate-700 select-none">
                      <AlertCircle size={24} className="mx-auto text-slate-350 mb-2" />
                      <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Tidak ada transaksi untuk kategori ini</p>
                      <p className="text-[8.5px] text-slate-400 mt-1">Coba sesuaikan cari filter pencarian atau tanggal di halaman luar</p>
                    </div>
                  );
                }

                return modalFiltered.map((tx) => {
                  const classif = getRowClassification(tx);
                  const txCode = txSequentialMap[tx.id] || tx.id;
                  const globalIdx = globalSequenceMap[tx.id] || 1;
                  
                  let badgeColor = 'bg-slate-150 text-slate-700 dark:text-slate-200';
                  let symbol = '';
                  let prefixStyle = 'text-slate-700 dark:text-slate-200';

                  if (classif === 'MASUK') {
                    badgeColor = 'bg-emerald-50 text-emerald-700 border border-emerald-100';
                    symbol = '+';
                    prefixStyle = 'text-emerald-600 font-extrabold';
                  } else if (classif === 'KELUAR') {
                    badgeColor = 'bg-rose-50 text-rose-700 border border-rose-100';
                    symbol = '-';
                    prefixStyle = 'text-rose-650 font-extrabold';
                  } else if (classif === 'MUTASI') {
                    badgeColor = 'bg-blue-50 text-blue-700 border border-blue-100';
                    symbol = '↕';
                    prefixStyle = 'text-blue-650 font-extrabold';
                  }

                  const txDateObj = new Date(tx.date);
                  const formattedText = format(txDateObj, 'EEEE, d MMMM yyyy HH.mm', { locale: idLocale });

                  return (
                    <div 
                      key={tx.id} 
                      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-2xl flex items-center justify-between gap-3 hover:border-blue-400/50 transition-colors shadow-3xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Transaction sequence order */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-[10px] font-bold shrink-0 ${
                          classif === 'MASUK' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100/50' :
                          classif === 'KELUAR' ? 'bg-rose-50 text-rose-700 border border-rose-100/50' :
                          'bg-blue-50 text-blue-700 border border-blue-100/50'
                        }`}>
                          #{globalIdx}
                        </div>

                        {/* Title descriptions */}
                        <div className="min-w-0">
                          <p className="text-[10.5px] font-black text-slate-800 dark:text-slate-100 truncate">
                            {tx.description || 'Transaksi Tanpa Keterangan'}
                          </p>
                          <p className="text-[8.5px] font-semibold text-slate-400 mt-0.5 uppercase tracking-wide">
                            {txCode} • {formattedText}
                          </p>
                          {tx.category && (
                            <span className="inline-block text-[7.5px] font-black uppercase text-blue-600 px-1.5 py-0.2 rounded bg-blue-50 mt-1 border border-blue-100">
                              {tx.category}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right amount side & print button */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <span className={`text-[11px] font-bold font-mono ${prefixStyle}`}>
                            {symbol}Rp {(tx.total + (tx.adminFee || 0)).toLocaleString('id-ID')}
                          </span>
                          <span className="block text-[7.5px] text-slate-400 font-medium">
                            {tx.adminFee ? `Biaya Admin Rp ${(tx.adminFee).toLocaleString('id-ID')}` : 'Tanpa Admin'}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setShowBreakdownModal(false);
                            setPrintTx(tx);
                            setPrintCustomerName('');
                            setPrintNotes('');
                            setPrintSize('58');
                          }}
                          className="p-2 rounded-xl text-amber-600 bg-amber-50 hover:bg-amber-100 dark:bg-slate-700/80 dark:hover:bg-slate-700 dark:text-amber-400 transition-colors border border-amber-100 dark:border-amber-900/60 cursor-pointer"
                          title="Cetak Struk"
                        >
                          <Printer size={13} strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Footer containing help text */}
            <div className="p-4 bg-slate-100 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 text-center select-none flex items-center justify-center">
              <button 
                onClick={() => setShowBreakdownModal(false)}
                className="px-6 py-2.5 text-[10px] bg-slate-800 hover:bg-slate-900 text-white font-black rounded-xl uppercase tracking-wider transition-all cursor-pointer shadow-xs active:scale-95"
              >
                Tutup Rincian
              </button>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* PRINT DIALOG MODAL LAYOUT */}
      {printTx && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-[999] animate-in fade-in duration-200 print:hidden overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-150 dark:border-slate-800 w-full max-w-md shadow-2xl overflow-hidden my-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Printer size={20} />
                </div>
                <div>
                  <h3 className="font-black text-sm uppercase tracking-wide leading-none font-sans">Cetak Struk Transaksi</h3>
                  <p className="text-[10px] text-amber-100 font-bold uppercase tracking-wider mt-1 font-sans">Konfigurasi & Layout Thermal</p>
                </div>
              </div>
              <button 
                onClick={() => setPrintTx(null)}
                className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors cursor-pointer"
              >
                <X size={15} strokeWidth={2.5} />
              </button>
            </div>

            {/* Config & Preview Body */}
            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto scrollbar-hidden">
              {/* Paper Selector */}
              <div>
                <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 ml-1 font-sans">Ukuran Kertas Thermal</label>
                <div className="bg-slate-50 dark:bg-slate-950/40 p-1 rounded-xl flex border border-slate-150 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setPrintSize('58')}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer font-sans",
                      printSize === '58'
                        ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-3xs border border-slate-100 dark:border-slate-800 font-bold"
                        : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
                    )}
                  >
                    📟 58mm (Kecil)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrintSize('80')}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer font-sans",
                      printSize === '80'
                        ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-3xs border border-slate-100 dark:border-slate-800 font-bold"
                        : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
                    )}
                  >
                    📟 80mm (Lebar)
                  </button>
                </div>
              </div>

              {/* Customer input fields */}
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 ml-1 font-sans">Nama Pelanggan (Opsional)</label>
                  <input
                    type="text"
                    value={printCustomerName}
                    onChange={(e) => setPrintCustomerName(e.target.value)}
                    placeholder="Contoh: Budi, Toko Sebelah"
                    className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500 transition-colors font-sans"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 ml-1 font-sans">Catatan Tambahan / Memo (Opsional)</label>
                  <input
                    type="text"
                    value={printNotes}
                    onChange={(e) => setPrintNotes(e.target.value)}
                    placeholder="Contoh: Terima kasih atas kerja samanya"
                    className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500 transition-colors font-sans"
                  />
                  {/* Notes Preset Tags */}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {['Lunas', 'Terima Kasih!', 'Catatan Kasir', 'Keep Struk Ini'].map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setPrintNotes(tag)}
                        className="text-[8px] font-black bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-100/50 dark:border-amber-900/60 px-1.5 py-0.5 rounded uppercase tracking-wider font-sans cursor-pointer hover:bg-amber-100"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* REALISTIC GRAPHIC RECEIPT LIVE PREVIEW */}
              <div>
                <p className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 ml-1 font-sans">Pratinjau Struk (Thermal View)</p>
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner flex flex-col items-center">
                  <div 
                    className="bg-white text-black p-4 font-mono shadow-md border border-slate-200/50 rounded-lg max-w-full text-left"
                    style={{
                      width: printSize === '58' ? '220px' : '300px',
                      fontSize: '10px'
                    }}
                  >
                    <div className="text-center font-bold text-[11px] mb-0.5">{storeName || 'KASIR CUBA'}</div>
                    <div className="text-center text-[8px] mb-1 text-gray-500 leading-tight">{storeAddress || 'Alamat Toko'}</div>
                    <div className="border-b border-dashed border-gray-400 my-1.5"></div>
                    <div className="text-center font-bold text-[9px] uppercase mb-1.5">STRUK TRANSAKSI</div>
                    
                    <div className="space-y-0.5 text-[8.5px] text-gray-600 leading-relaxed font-mono">
                      <div>No Trx   : {txSequentialMap[printTx.id] || printTx.id}</div>
                      <div>Tanggal  : {format(new Date(printTx.date), 'dd MMM yyyy, HH:mm', { locale: idLocale })}</div>
                      <div>Kasir    : {cashierName || 'Kasir'}</div>
                      {printCustomerName && <div>Pelanggan: {printCustomerName}</div>}
                    </div>
                    
                    <div className="border-b border-dashed border-gray-400 my-1.5"></div>
                    
                    {/* Items */}
                    <div className="space-y-1 my-1.5">
                      {printTx.items && printTx.items.length > 0 ? (
                        printTx.items.map((item, i) => (
                          <div key={i} className="text-[9px] leading-tight flex flex-col">
                            {item.quantity > 1 ? (
                              <>
                                <span className="font-bold text-gray-800">{item.name || 'Item'}</span>
                                <div className="flex justify-between pl-1 text-gray-500 leading-none">
                                  <span>{item.quantity} x {item.price.toLocaleString('id-ID')}</span>
                                  <span className="font-bold text-gray-800">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</span>
                                </div>
                              </>
                            ) : (
                              <div className="flex justify-between">
                                <span className="font-bold text-gray-800">{item.name || 'Item'}</span>
                                <span className="font-bold text-gray-800">Rp {item.price.toLocaleString('id-ID')}</span>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="flex justify-between text-[9px]">
                          <span className="font-bold text-gray-800">{printTx.description || 'Transaksi'}</span>
                          <span className="font-bold text-gray-800">Rp {printTx.total.toLocaleString('id-ID')}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="border-b border-dashed border-gray-400 my-1.5"></div>
                    
                    {/* Admin fee detailing */}
                    {printTx.adminFee && printTx.adminFee > 0 ? (
                      <div className="space-y-0.5 text-[8.5px] text-gray-500">
                        <div className="flex justify-between">
                          <span>Subtotal</span>
                          <span>Rp {printTx.total.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Biaya Admin</span>
                          <span>Rp {printTx.adminFee.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="border-b border-dashed border-gray-300 my-1"></div>
                      </div>
                    ) : null}
                    
                    <div className="flex justify-between font-bold text-[10.5px] text-gray-950">
                      <span>TOTAL</span>
                      <span>Rp {(printTx.total + (printTx.adminFee || 0)).toLocaleString('id-ID')}</span>
                    </div>

                    {(printTx.sourceWallet || printTx.targetWallet) && (
                      <div className="text-[7.5px] italic text-gray-500 text-center mt-2 font-sans leading-none">
                        {(() => {
                          const walletSourceObj = wallets.find(w => w.id === printTx.sourceWallet);
                          const walletTargetObj = wallets.find(w => w.id === printTx.targetWallet);
                          if (walletSourceObj && walletTargetObj) {
                            return `Transfer: ${walletSourceObj.name} ➔ ${walletTargetObj.name}`;
                          } else if (walletTargetObj) {
                            return `Metode: ${walletTargetObj.name}`;
                          } else if (walletSourceObj) {
                            return `Metode: ${walletSourceObj.name}`;
                          }
                          return '';
                        })()}
                      </div>
                    )}
                    
                    {printNotes && (
                      <div className="text-center mt-2.5 text-[8px] text-gray-500 whitespace-pre-line leading-snug border-t border-dotted border-gray-300 pt-1.5">{printNotes}</div>
                    )}
                    
                    <div className="text-center mt-4 text-[8px] text-gray-600 font-bold">*** Terima Kasih ***</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Print Buttons Controls */}
            <div className="bg-slate-50 dark:bg-slate-900 border-t border-slate-150 dark:border-slate-800 p-5 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleSystemPrint}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white py-3 px-4 rounded-2xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer font-sans"
              >
                <Smartphone size={14} /> Cetak Bawaan Sistem (Browser / PDF)
              </button>
              
              <button
                type="button"
                disabled={isPrintingBluetooth}
                onClick={handleBluetoothPrint}
                className={cn(
                  "w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-2xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer font-sans",
                  isPrintingBluetooth && "opacity-50 cursor-not-allowed"
                )}
              >
                <Bluetooth size={14} className={isPrintingBluetooth ? "animate-pulse" : ""} />
                {isPrintingBluetooth ? "Mencetak via Bluetooth..." : "Cetak Thermal Bluetooth"}
              </button>

              <button
                type="button"
                onClick={() => setPrintTx(null)}
                className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-655 dark:text-slate-300 py-2.5 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer font-sans"
              >
                Batalkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FIXED POSITION SYSTEM PRINT ONLY CONTAINER OVERLAY */}
      <div className="hidden print:block fixed inset-0 z-[99999] bg-white text-black p-4 font-mono select-text print:bg-white print:text-black">
        {printTx && (
          <div 
            id="receipt-print-area"
            className="mx-auto bg-white text-black font-mono" 
            style={{
              width: printSize === '58' ? '58mm' : '80mm',
              padding: '0 2mm'
            }}
          >
            <div className="text-center font-bold uppercase mb-0.5 text-[14px] leading-tight text-black">{storeName || 'KASIR CUBA'}</div>
            <div className="text-center mb-2 text-[10px] leading-normal text-gray-700">{storeAddress || 'Alamat Toko'}</div>
            <div className="border-b border-dashed border-black mb-2"></div>
            <div className="text-center font-bold uppercase mb-2 text-[12px] text-black">STRUK TRANSAKSI</div>
            
            <div className="mb-2 text-[10px] space-y-0.5 leading-snug text-black">
              <div>No Trx   : {txSequentialMap[printTx.id] || printTx.id}</div>
              <div>Tanggal  : {format(new Date(printTx.date), 'dd MMM yyyy, HH:mm', { locale: idLocale })}</div>
              <div>Kasir    : {cashierName || 'Kasir'}</div>
              {printCustomerName && <div>Pelanggan: {printCustomerName}</div>}
            </div>
            
            <div className="border-b border-dashed border-black mb-2"></div>
            
            <div className="mb-2 space-y-1 text-[11px] leading-snug text-black">
              {printTx.items && printTx.items.length > 0 ? (
                printTx.items.map((item, i) => (
                  <div key={i} className="flex flex-col mb-1 text-black">
                    {item.quantity > 1 ? (
                      <>
                        <span className="font-bold">{item.name || 'Item'}</span>
                        <div className="flex justify-between pl-3 text-black">
                          <span>{item.quantity} x {item.price.toLocaleString('id-ID')}</span>
                          <span className="font-bold">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between text-black">
                        <span className="font-bold">{item.name || 'Item'}</span>
                        <span className="font-bold">Rp {item.price.toLocaleString('id-ID')}</span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="flex justify-between text-black">
                  <span className="font-bold">{printTx.description || 'Transaksi'}</span>
                  <span className="font-bold">Rp {printTx.total.toLocaleString('id-ID')}</span>
                </div>
              )}
            </div>
            
            <div className="border-b border-dashed border-black mb-2"></div>
            
            {printTx.adminFee && printTx.adminFee > 0 ? (
              <div className="mb-2 text-[10px] space-y-0.5 leading-snug text-black">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>Rp {printTx.total.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Biaya Admin</span>
                  <span>Rp {printTx.adminFee.toLocaleString('id-ID')}</span>
                </div>
                <div className="border-b border-dashed border-gray-400 my-1"></div>
              </div>
            ) : null}
            
            <div className="flex justify-between font-bold mb-4 text-[13px] leading-normal text-black">
              <span>TOTAL</span>
              <span>Rp {(printTx.total + (printTx.adminFee || 0)).toLocaleString('id-ID')}</span>
            </div>

            {(printTx.sourceWallet || printTx.targetWallet) && (
              <div className="text-[8px] text-center mb-3 text-black">
                {(() => {
                  const walletSourceObj = wallets.find(w => w.id === printTx.sourceWallet);
                  const walletTargetObj = wallets.find(w => w.id === printTx.targetWallet);
                  if (walletSourceObj && walletTargetObj) {
                    return `Transfer: ${walletSourceObj.name} -> ${walletTargetObj.name}`;
                  } else if (walletTargetObj) {
                    return `Metode: ${walletTargetObj.name}`;
                  } else if (walletSourceObj) {
                    return `Metode: ${walletSourceObj.name}`;
                  }
                  return '';
                })()}
              </div>
            )}
            
            {printNotes && (
              <div className="text-center mb-3 text-[10px] whitespace-pre-line leading-relaxed text-black">{printNotes}</div>
            )}
            
            <div className="text-center mt-4 mb-4 text-[10px] text-black">*** Terima Kasih ***</div>
          </div>
        )}
      </div>
    </>
  );
}
