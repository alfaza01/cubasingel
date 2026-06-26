import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useStore } from '../context/StoreContext';
import { 
  Wallet, Vault, ArrowLeft, ChartPie, FileDown,
  ArrowDown, ArrowUp, Layers, Landmark,
  Search, Filter, Check, X, Tag, ChevronDown, ChevronUp, SlidersHorizontal, ListFilter, HelpCircle, ArrowRightLeft, CalendarDays, Coins
} from 'lucide-react';
import { Transaction } from '../types';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas-pro';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
export function FullReport() {
  const navigate = useNavigate();
  const { transactions, wallets, storeName, storeAddress, cashierName } = useStore();
  const [now, setNow] = useState(new Date());
  const [isExporting, setIsExporting] = useState(false);

  // Report Period Selection
  const [reportPeriod, setReportPeriod] = useState<'HARI_INI' | 'KEMARIN' | 'MINGGU_INI' | 'BULAN_INI' | 'SEMUA' | 'KUSTOM'>('HARI_INI');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Tab View Selection: summary, cash flow, category table, or ledger lists
  const [activeTab, setActiveTab] = useState<'RINGKASAN' | 'ARUS_KAS' | 'KATEGORI' | 'JURNAL'>('RINGKASAN');

  // Search & Filters state for the Ledger listing
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'SEMUA' | 'MASUK' | 'KELUAR' | 'MUTASI'>('SEMUA');
  const [searchCategory, setSearchCategory] = useState<string>('SEMUA');
  const [searchWallet, setSearchWallet] = useState<string>('SEMUA');
  const [expandedTx, setExpandedTx] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const dayName = now.toLocaleDateString('id-ID', { weekday: 'long' });
  const fullDate = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const clockStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/:/g, '.');

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR', 
      minimumFractionDigits: 0 
    }).format(val);
  };

  // --- LIVE WALLET BALANCES (Current State) ---
  const currentTotalSaldoKas = wallets.find(w => w.id === 'Bank08')?.balance || 0;
  const currentSaldoBank = wallets.filter(w => w.id !== 'Bank08').reduce((acc, w) => acc + w.balance, 0);

  // --- COMPUTE ACTIVE DATE OBJECTS FOR PERIOD ---
  const periodDateRange = useMemo(() => {
    const start = new Date();
    const end = new Date();

    if (reportPeriod === 'HARI_INI') {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    if (reportPeriod === 'KEMARIN') {
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    if (reportPeriod === 'MINGGU_INI') {
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    if (reportPeriod === 'BULAN_INI') {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    if (reportPeriod === 'KUSTOM') {
      const s = customStartDate ? new Date(customStartDate) : new Date();
      s.setHours(0, 0, 0, 0);
      const e = customEndDate ? new Date(customEndDate) : new Date();
      e.setHours(23, 59, 59, 999);
      return { start: s, end: e };
    }

    // SEMUA / ALL-TIME
    return { start: null, end: null };
  }, [reportPeriod, customStartDate, customEndDate]);

  // --- PERIOD TRANSACTIONS FILTERED IN REALTIME ---
  const periodTransactions = useMemo(() => {
    const { start, end } = periodDateRange;
    return transactions.filter(t => {
      if (!start || !end) return true;
      const tDate = new Date(t.date);
      return tDate >= start && tDate <= end;
    });
  }, [transactions, periodDateRange]);

  // --- GLOBAL SEQUENTIAL CODE MAP FOR TXS ---
  const globalSequenceMap = useMemo(() => {
    // Sort transactions chronologically (oldest first)
    const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const seqMap: Record<string, number> = {};
    sorted.forEach((tx, idx) => {
      seqMap[tx.id] = idx + 1;
    });
    return seqMap;
  }, [transactions]);

  // --- HELPER FOR WORKFLOW FINANCIAL CLASSIFICATION ---
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

    return type === 'INCOME' ? 'MASUK' : 'KELUAR';
  };

  // --- 1. MODAL KASIR & DIGITAL RECONCILIATION ---
  const modalLaciKasir = useMemo(() => {
    return periodTransactions
      .filter(t => t.type === 'MODAL_PAGI' && (t.targetWallet === 'Bank08' || !t.targetWallet))
      .reduce((sum, t) => sum + t.total, 0);
  }, [periodTransactions]);

  const modalAsetDigital = useMemo(() => {
    return periodTransactions
      .filter(t => t.type === 'MODAL_PAGI' && t.targetWallet && t.targetWallet !== 'Bank08')
      .reduce((sum, t) => sum + t.total, 0);
  }, [periodTransactions]);

  const totalModalAwal = modalLaciKasir + modalAsetDigital;

  // --- 2. TOTAL ASET DIGITAL (ALL INCOME LOADED IN DIGITAL ACCOUNTS TODAY) ---
  const totalAsetDigitalMasukHariIni = useMemo(() => {
    return periodTransactions
      .filter(t => {
        const isDigitalTarget = t.targetWallet && t.targetWallet !== 'Bank08';
        const isDigitalInflow = t.type === 'INCOME' || t.type === 'TAMBAH_SALDO' || t.type === 'MODAL_PAGI';
        const isPindahSaldoToDigital = t.type === 'PINDAH_SALDO' && isDigitalTarget;

        return isDigitalTarget && (isDigitalInflow || isPindahSaldoToDigital);
      })
      .reduce((sum, t) => sum + t.total, 0);
  }, [periodTransactions]);

  // Total margin laba (admin fee) for current active period transactions
  const totalLabaPeriode = useMemo(() => {
    return periodTransactions.reduce((sum, t) => sum + (t.adminFee || 0), 0);
  }, [periodTransactions]);

  // --- 3. DYNAMIC REKAP PER KATEGORI ---
  const categoryTotals = useMemo(() => {
    const map: Record<string, { qty: number; nominal: number; laba: number }> = {};
    
    periodTransactions.forEach(t => {
      let catName = '';
      const isDigital = t.category === 'UANG DIGITAL' || t.category === 'TARIK TUNAI' || t.category === 'DIGITAL';
      
      if (isDigital) {
        const digId = (t.sourceWallet && t.sourceWallet !== 'Bank08') 
          ? t.sourceWallet 
          : ((t.targetWallet && t.targetWallet !== 'Bank08') ? t.targetWallet : null);
        
        if (digId) {
          const wallet = wallets.find(w => w.id === digId);
          if (wallet) {
            catName = wallet.name.toUpperCase().trim();
          }
        }
        
        if (!catName) {
          const desc = (t.description || '').toUpperCase();
          if (desc.includes('BRI')) catName = 'BANK BRI';
          else if (desc.includes('BCA')) catName = 'BANK BCA';
          else if (desc.includes('MANDIRI')) catName = 'BANK MANDIRI';
          else if (desc.includes('DANA')) catName = 'DANA';
          else if (desc.includes('GOPAY')) catName = 'GOPAY';
          else if (desc.includes('SHOPEE')) catName = 'SHOPEEPAY';
          else if (desc.includes('SEABANK')) catName = 'SEABANK';
          else {
            catName = t.category ? t.category.toUpperCase().trim() : 'TRANSFER DIGITAL';
          }
        }
      } else if (t.category === 'AKSESORIS' || (!t.category && t.items && t.items.length > 0)) {
        catName = 'AKSESORIS';
      } else if (t.category) {
        catName = t.category.toUpperCase().trim();
      } else {
        catName = 'LAINNYA';
      }
      
      if (!map[catName]) {
        map[catName] = { qty: 0, nominal: 0, laba: 0 };
      }
      
      let count = 1;
      if (t.items && t.items.length > 0) {
        count = t.items.reduce((s, item) => s + item.quantity, 0);
      }
      
      map[catName].qty += count;
      map[catName].nominal += t.total;
      map[catName].laba += t.adminFee || 0;
    });

    return Object.entries(map)
      .map(([category, info]) => ({
        category,
        qty: info.qty,
        nominal: info.nominal,
        laba: info.laba
      }))
      .filter(item => item.qty > 0 || item.nominal > 0 || item.laba > 0);
  }, [periodTransactions, wallets]);

  // --- 4. DETAILED INWARD FLUIDS (KAS MASUK - FISIK LACI KASIR) ---
  const cashIn_Modal = modalLaciKasir;

  const cashIn_Digital = useMemo(() => {
    return periodTransactions
      .filter(t => t.category === 'UANG DIGITAL' && t.targetWallet === 'Bank08')
      .reduce((sum, t) => sum + t.total, 0);
  }, [periodTransactions]);

  const cashIn_Aksesoris = useMemo(() => {
    return periodTransactions
      .filter(t => (t.category === 'AKSESORIS' || (!t.category && t.items && t.items.length > 0)) && (t.targetWallet === 'Bank08' || !t.targetWallet))
      .reduce((sum, t) => sum + t.total, 0);
  }, [periodTransactions]);

  const cashIn_Lainnya = useMemo(() => {
    const adminTunai = periodTransactions.reduce((sum, t) => {
      const isCashRecipient = t.targetWallet === 'Bank08' || !t.targetWallet;
      if (isCashRecipient && t.adminFee && !t.adminNonTunai) {
        return sum + t.adminFee;
      }
      return sum;
    }, 0);

    const kasbonTunai = periodTransactions
      .filter(t => t.category === 'KASBON' && t.type === 'INCOME' && t.targetWallet === 'Bank08')
      .reduce((sum, t) => sum + t.total, 0);

    const otherTunai = periodTransactions
      .filter(t => t.type === 'INCOME' && !t.items?.length && t.category !== 'KASBON' && t.category !== 'AKSESORIS' && t.category !== 'UANG DIGITAL' && (t.targetWallet === 'Bank08' || !t.targetWallet))
      .reduce((sum, t) => sum + t.total, 0);

    return adminTunai + kasbonTunai + otherTunai;
  }, [periodTransactions]);

  const totalKasMasukLaci = cashIn_Modal + cashIn_Digital + cashIn_Aksesoris + cashIn_Lainnya;

  // --- 5. DETAILED OUTWARD FLUIDS (KAS KELUAR - FISIK LACI KASIR) ---
  const cashOut_TarikTunai = useMemo(() => {
    return periodTransactions
      .filter(t => t.category === 'TARIK TUNAI' && t.sourceWallet === 'Bank08')
      .reduce((sum, t) => sum + t.total, 0);
  }, [periodTransactions]);

  const cashOut_Operasional = useMemo(() => {
    return periodTransactions
      .filter(t => (t.type === 'EXPENSE' || t.type === 'MUTASI') && t.sourceWallet === 'Bank08' && t.category !== 'KASBON' && t.category !== 'TARIK TUNAI' && t.category !== 'UANG DIGITAL')
      .reduce((sum, t) => sum + t.total, 0);
  }, [periodTransactions]);

  const cashOut_KasbonBaru = useMemo(() => {
    return periodTransactions
      .filter(t => t.category === 'KASBON' && t.type === 'MUTASI' && t.sourceWallet === 'Bank08')
      .reduce((sum, t) => sum + t.total, 0);
  }, [periodTransactions]);

  const totalKasKeluarLaci = cashOut_TarikTunai + cashOut_Operasional + cashOut_KasbonBaru;

  // --- 6. KAS LAINNYA (NON-TUNAI / SALDO DIGITAL & TRANSFER PRIVAT) ---
  const digital_Penjualan = useMemo(() => {
    return periodTransactions
      .filter(t => (t.category === 'AKSESORIS' || (!t.category && t.items && t.items.length > 0)) && t.targetWallet && t.targetWallet !== 'Bank08')
      .reduce((sum, t) => sum + t.total, 0);
  }, [periodTransactions]);

  const digital_TarikTerima = useMemo(() => {
    return periodTransactions
      .filter(t => t.category === 'TARIK TUNAI' && t.targetWallet && t.targetWallet !== 'Bank08')
      .reduce((sum, t) => sum + t.total, 0);
  }, [periodTransactions]);

  const digital_SetorKirim = useMemo(() => {
    return periodTransactions
      .filter(t => t.category === 'UANG DIGITAL' && t.sourceWallet && t.sourceWallet !== 'Bank08')
      .reduce((sum, t) => sum + t.total, 0);
  }, [periodTransactions]);

  const digital_AdminLainnya = useMemo(() => {
    const adminDigital = periodTransactions.reduce((sum, t) => {
      const isDigitalRecipient = t.targetWallet && t.targetWallet !== 'Bank08';
      if (isDigitalRecipient && t.adminFee && t.adminNonTunai) {
        return sum + t.adminFee;
      }
      return sum;
    }, 0);

    const kasbonDigital = periodTransactions
      .filter(t => t.category === 'KASBON' && t.type === 'INCOME' && t.targetWallet && t.targetWallet !== 'Bank08')
      .reduce((sum, t) => sum + t.total, 0);

    const modalAwalDigital = periodTransactions
      .filter(t => t.type === 'MODAL_PAGI' && t.targetWallet && t.targetWallet !== 'Bank08')
      .reduce((sum, t) => sum + t.total, 0);

    return adminDigital + kasbonDigital + modalAwalDigital;
  }, [periodTransactions]);

  const totalKasNonTunai = digital_Penjualan + digital_TarikTerima + digital_AdminLainnya - digital_SetorKirim;

  // --- DETAILED SEARCH / LEDGER TRANSACTIONS LIST ---
  const searchedTransactions = useMemo(() => {
    return periodTransactions.filter(tx => {
      // 1. Filter Type
      const classification = getRowClassification(tx);
      if (searchType !== 'SEMUA') {
        if (searchType === 'MASUK' && classification !== 'MASUK') return false;
        if (searchType === 'KELUAR' && classification !== 'KELUAR') return false;
        if (searchType === 'MUTASI' && classification !== 'MUTASI') return false;
      }

      // 2. Filter Category Selection
      if (searchCategory !== 'SEMUA') {
        const cat = (tx.category || '').toUpperCase().trim();
        if (cat !== searchCategory) return false;
      }

      // 3. Filter Wallet selection
      if (searchWallet !== 'SEMUA') {
        const isMatched = tx.sourceWallet === searchWallet || tx.targetWallet === searchWallet;
        if (!isMatched) return false;
      }

      // 4. Word Text Search
      if (searchQuery.trim()) {
        const lowerQuery = searchQuery.toLowerCase();
        const codeText = `TRX-${globalSequenceMap[tx.id] || tx.id}`;
        
        const matchesDesc = (tx.description || '').toLowerCase().includes(lowerQuery);
        const matchesCategory = (tx.category || '').toLowerCase().includes(lowerQuery);
        const matchesCode = codeText.toLowerCase().includes(lowerQuery) || tx.id.toLowerCase().includes(lowerQuery);
        const matchesAmount = String(tx.total).includes(lowerQuery) || String(tx.adminFee || '').includes(lowerQuery);
        
        const sourceName = wallets.find(w => w.id === tx.sourceWallet)?.name || '';
        const targetName = wallets.find(w => w.id === tx.targetWallet)?.name || '';
        const matchesWalletNames = sourceName.toLowerCase().includes(lowerQuery) || targetName.toLowerCase().includes(lowerQuery);

        if (!matchesDesc && !matchesCategory && !matchesCode && !matchesAmount && !matchesWalletNames) {
          return false;
        }
      }

      return true;
    });
  }, [periodTransactions, searchType, searchCategory, searchWallet, searchQuery, globalSequenceMap, wallets]);

  // Derived filter categories for dynamic selectors
  const allUniqueCategories = useMemo(() => {
    const cats = new Set<string>();
    transactions.forEach(t => {
      if (t.category) {
        cats.add(t.category.toUpperCase().trim());
      }
    });
    return Array.from(cats).sort();
  }, [transactions]);

  // Stats computed from searched items
  const searchedStats = useMemo(() => {
    let volume = 0;
    let laba = 0;
    searchedTransactions.forEach(t => {
      volume += t.total;
      laba += t.adminFee || 0;
    });
    return {
      count: searchedTransactions.length,
      volume,
      laba
    };
  }, [searchedTransactions]);

  const handlePrint = async () => {
    try {
      setIsExporting(true);
      
      // Beri waktu agar React merender semua tab dan menghapus constraint overflow
      await new Promise(resolve => setTimeout(resolve, 500));

      const element = document.getElementById('report-page-container');
      if (!element) {
        setIsExporting(false);
        return;
      }
      
      const canvas = await html2canvas(element, {
        scale: 3, // Ditingkatkan dari 2 ke 3 untuk ketajaman ekstra (HD)
        useCORS: true,
        logging: false,
        backgroundColor: '#f8fafc', // slate-50
        windowHeight: element.scrollHeight,
        windowWidth: element.scrollWidth
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      let heightLeft = pdfHeight;
      let position = 0;
      const pageHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }
      
      const fileName = `Laporan_Arus_Kas_${new Date().toISOString().split('T')[0]}.pdf`;
      const isAndroid = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);
      
      if (isAndroid) {
        const base64Data = pdf.output('datauristring').split(',')[1];
        const savedFile = await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Cache
        });
        
        await Share.share({
          title: 'Laporan Arus Kas PDF',
          text: 'Laporan Arus Kas Toko',
          url: savedFile.uri,
          dialogTitle: 'Simpan / Bagikan Laporan PDF',
        });
      } else {
        pdf.save(fileName);
      }
      
    } catch (err: any) {
      console.error(err);
      alert('Gagal mengekspor PDF: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportTransactionsToExcel = () => {
    try {
      if (searchedTransactions.length === 0) {
        alert('Tidak ada data transaksi untuk diekspor!');
        return;
      }

      const sheetName = 'Jurnal_Ledger_Transaksi';
      const fileName = `Laporan_Transaksi_${new Date().toISOString().split('T')[0]}.xls`;

      const escapeHtml = (unsafe: string) => {
        return (unsafe || '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');
      };

      const cleanStoreName = escapeHtml(storeName || 'KASIR CUBA');
      const cleanStoreAddress = escapeHtml(storeAddress || '-');
      const cleanCashierName = escapeHtml(cashierName || 'Kasir');
      
      const activeW = wallets.find(w => w.id === searchWallet);
      const walletNameStr = activeW ? activeW.name.toUpperCase() : 'SEMUA';
      const cleanFilter = escapeHtml(`Arah=${searchType}, Kategori=${searchCategory}, Dompet=${walletNameStr}`);
      
      let periodText = 'Semua Periode';
      if (reportPeriod !== 'SEMUA') {
        const startStr = periodDateRange.start ? periodDateRange.start.toLocaleDateString('id-ID') : '-';
        const endStr = periodDateRange.end ? periodDateRange.end.toLocaleDateString('id-ID') : '-';
        periodText = `${startStr} s.d. ${endStr}`;
      }
      const dateRangeStr = escapeHtml(periodText);
      const printDateStr = escapeHtml(new Date().toLocaleString('id-ID'));

      const endRow = 11 + searchedTransactions.length;

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
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
  .title-main { font-size: 16px; font-weight: bold; color: #1e3a8a; text-align: center; }
  .title-sub { font-size: 12px; font-weight: bold; color: #1e293b; text-align: center; }
  .title-addr { font-size: 10px; font-style: italic; color: #475569; text-align: center; }
  .summary-label { background-color: #f1f5f9; color: #334155; font-weight: bold; font-size: 10.5px; border: 1px solid #cbd5e1; padding: 6px; }
  .summary-value { background-color: #ffffff; color: #1e293b; font-size: 10.5px; border: 1px solid #cbd5e1; padding: 6px; }
  .summary-title { background-color: #0f172a; color: #ffffff; font-weight: bold; font-size: 10.5px; text-align: center; border: 1px solid #cbd5e1; padding: 6px; }
  table { border-collapse: collapse; margin-top: 15px; width: 100%; }
  th { background-color: #1e3a8a; color: #ffffff; font-weight: bold; text-align: center; font-size: 11px; border: 1px solid #94a3b8; padding: 10px 8px; }
  td { border: 1px solid #cbd5e1; padding: 8px 10px; font-size: 10.5px; white-space: nowrap !important; }
  .text-center { text-align: center; }
  .text-right { text-align: right; }
  .text-left { text-align: left; }
  .font-mono { font-family: Consolas, 'Courier New', monospace; }
  .font-bold { font-weight: bold; }
  .row-even { background-color: #f8fafc; }
  .row-odd { background-color: #ffffff; }
  .footer-label { background-color: #e2e8f0; color: #1e293b; font-weight: bold; text-align: right; border: 1px solid #94a3b8; font-size: 11px; padding: 10px 8px; }
  .footer-value { background-color: #e2e8f0; color: #1e293b; font-weight: bold; border: 1px solid #94a3b8; font-family: Consolas, monospace; font-size: 11px; padding: 10px 8px; }
</style>
</head>
<body>
  <table>
    <colgroup>
      <col width="45" />
      <col width="90" />
      <col width="110" />
      <col width="65" />
      <col width="120" />
      <col width="220" />
      <col width="300" />
      <col width="150" />
      <col width="110" />
      <col width="110" />
      <col width="90" />
      <col width="130" />
      <col width="130" />
      <col width="130" />
      <col width="100" />
      <col width="140" />
    </colgroup>
    <thead>
      <tr>
        <td colspan="16" class="title-main">\${cleanStoreName}</td>
      </tr>
      <tr>
        <td colspan="16" class="title-sub">MUTASI & RIWAYAT TRANSAKSI ALIRAN DANA</td>
      </tr>
      <tr>
        <td colspan="16" class="title-addr">Alamat: \${cleanStoreAddress}</td>
      </tr>
      <tr style="height: 15px;">
        <td colspan="16" style="border: none;"></td>
      </tr>
      <tr>
        <td style="border: none;"></td>
        <td class="summary-label">Nama Toko / Unit</td>
        <td class="summary-value" colspan="2">\${cleanStoreName}</td>
        <td style="border: none;" colspan="2"></td>
        <td class="summary-label" colspan="2">Total Transaksi</td>
        <td class="summary-value text-center font-bold" colspan="2">\${searchedTransactions.length} Trx</td>
        <td style="border: none;" colspan="6"></td>
      </tr>
      <tr>
        <td style="border: none;"></td>
        <td class="summary-label">Kasir Pelaksana</td>
        <td class="summary-value" colspan="2">\${cleanCashierName}</td>
        <td style="border: none;" colspan="2"></td>
        <td class="summary-label" colspan="2">Total Uang Masuk</td>
        <td class="text-right font-mono summary-value font-bold" colspan="2" style="mso-number-format:'\\\\Rp* \\\\#\\\\,\\\\#\\\\#0';">=SUM(L12:L\${endRow})</td>
        <td style="border: none;" colspan="6"></td>
      </tr>
      <tr>
        <td style="border: none;"></td>
        <td class="summary-label">Tanggal Cetak</td>
        <td class="summary-value" colspan="2">\${printDateStr}</td>
        <td style="border: none;" colspan="2"></td>
        <td class="summary-label" colspan="2">Total Uang Keluar</td>
        <td class="text-right font-mono summary-value font-bold" colspan="2" style="mso-number-format:'\\\\Rp* \\\\#\\\\,\\\\#\\\\#0';">=SUM(M12:M\${endRow})</td>
        <td style="border: none;" colspan="6"></td>
      </tr>
      <tr>
        <td style="border: none;"></td>
        <td class="summary-label">Filter Aliran / Tipe</td>
        <td class="summary-value" colspan="2">\${cleanFilter}</td>
        <td style="border: none;" colspan="2"></td>
        <td class="summary-label" colspan="2">Total Keuntungan Jasa</td>
        <td class="text-right font-mono summary-value font-bold" colspan="2" style="mso-number-format:'\\\\Rp* \\\\#\\\\,\\\\#\\\\#0';">=SUM(N12:N\${endRow})</td>
        <td style="border: none;" colspan="6"></td>
      </tr>
      <tr>
        <td style="border: none;"></td>
        <td class="summary-label">Periode Tanggal</td>
        <td class="summary-value" colspan="2">\${dateRangeStr}</td>
        <td style="border: none;" colspan="2"></td>
        <td class="summary-title" colspan="2" style="background-color: #0f172a; color: #ffffff;">Aliran Bersih (Nett)</td>
        <td class="text-right font-mono summary-value font-bold" colspan="2" style="mso-number-format:'\\\\Rp* \\\\#\\\\,\\\\#\\\\#0'; background-color: #f1f5f9; color: #1e3a8a;">=J6-J7+J8</td>
        <td style="border: none;" colspan="6"></td>
      </tr>
      <tr style="height: 20px;">
        <td colspan="16" style="border: none;"></td>
      </tr>
      <tr>
        <th>No</th>
        <th>ID Transaksi</th>
        <th>Tanggal</th>
        <th>Jam</th>
        <th>Kategori</th>
        <th>Deskripsi / Keterangan</th>
        <th>Daftar Barang / Item</th>
        <th>Metode Pembayaran</th>
        <th>Dompet Asal</th>
        <th>Dompet Tujuan</th>
        <th>Tipe Aliran</th>
        <th>Uang Masuk (Rp)</th>
        <th>Uang Keluar (Rp)</th>
        <th>Jasa / Admin (Rp)</th>
        <th>Admin Non-Tunai?</th>
        <th>Total Bersih (Nett) (Rp)</th>
      </tr>
    </thead>
    <tbody>
`;

      searchedTransactions.forEach((tx, idx) => {
        const rowNum = 12 + idx;
        const cleanCode = `TRX-\\${globalSequenceMap[tx.id] || tx.id}`;
        const classification = getRowClassification(tx);
        const txDateObj = new Date(tx.date);
        
        const timeStr = txDateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(/:/g, '.');
        const dateStr = txDateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

        const srcW = wallets.find(w => w.id === tx.sourceWallet);
        const tgtW = wallets.find(w => w.id === tx.targetWallet);
        
        let flowsText = '';
        if (srcW && tgtW) {
          flowsText = `\\${srcW.name.toUpperCase()} -> \\${tgtW.name.toUpperCase()}`;
        } else if (tgtW) {
          flowsText = tgtW.name.toUpperCase();
        } else if (srcW) {
          flowsText = srcW.name.toUpperCase();
        } else {
          flowsText = 'KAS TUNAI';
        }

        const sourceNameText = srcW ? srcW.name.toUpperCase() : (tgtW ? '-' : 'KAS TUNAI');
        const targetNameText = tgtW ? tgtW.name.toUpperCase() : (srcW ? '-' : 'KAS TUNAI');

        const itemsText = tx.items && tx.items.length > 0 
          ? tx.items.map(item => `\\${item.name} (\\${item.quantity}x Rp \\${item.price.toLocaleString('id-ID')})`).join('; ')
          : '-';

        const uangMasukVal = classification === 'MASUK' ? tx.total : 0;
        const uangKeluarVal = classification === 'KELUAR' ? tx.total : 0;
        const adminFeeVal = tx.adminFee || 0;
        const adminNonTunaiText = tx.adminNonTunai ? 'YA' : 'TIDAK';

        const rowClass = idx % 2 === 0 ? 'row-even' : 'row-odd';

        tableHtml += `
      <tr class="\\${rowClass}">
        <td class="text-center font-mono">\\${idx + 1}</td>
        <td class="text-center font-mono">\\${escapeHtml(cleanCode)}</td>
        <td class="text-center">\\${escapeHtml(dateStr)}</td>
        <td class="text-center font-mono">\\${escapeHtml(timeStr)}</td>
        <td>\\${escapeHtml((tx.category || 'UMUM').toUpperCase())}</td>
        <td>\\${escapeHtml(tx.description || 'Penjualan POS')}</td>
        <td>\\${escapeHtml(itemsText)}</td>
        <td>\\${escapeHtml(flowsText)}</td>
        <td>\\${escapeHtml(sourceNameText)}</td>
        <td>\\${escapeHtml(targetNameText)}</td>
        <td class="text-center font-bold">\\${escapeHtml(classification)}</td>
        <td class="text-right font-mono" x:num style="mso-number-format:'\\\\\\\\Rp* \\\\\\\\#\\\\\\\\,\\\\\\\\#\\\\\\\\#0';">\\${uangMasukVal}</td>
        <td class="text-right font-mono" x:num style="mso-number-format:'\\\\\\\\Rp* \\\\\\\\#\\\\\\\\,\\\\\\\\#\\\\\\\\#0';">\\${uangKeluarVal}</td>
        <td class="text-right font-mono" x:num style="mso-number-format:'\\\\\\\\Rp* \\\\\\\\#\\\\\\\\,\\\\\\\\#\\\\\\\\#0';">\\${adminFeeVal}</td>
        <td class="text-center">\\${adminNonTunaiText}</td>
        <td class="text-right font-mono font-bold" style="mso-number-format:'\\\\\\\\Rp* \\\\\\\\#\\\\\\\\,\\\\\\\\#\\\\\\\\#0';">=L\\${rowNum}-M\\${rowNum}+N\\${rowNum}</td>
      </tr>
`;
      });

      tableHtml += `
    </tbody>
    <tfoot>
      <tr>
        <td colspan="11" class="footer-label">TOTAL KESELURUHAN (FORMULA)</td>
        <td class="text-right footer-value" style="mso-number-format:'\\\\Rp* \\\\#\\\\,\\\\#\\\\#0';">=SUM(L12:L\\${endRow})</td>
        <td class="text-right footer-value" style="mso-number-format:'\\\\Rp* \\\\#\\\\,\\\\#\\\\#0';">=SUM(M12:M\\${endRow})</td>
        <td class="text-right footer-value" style="mso-number-format:'\\\\Rp* \\\\#\\\\,\\\\#\\\\#0';">=SUM(N12:N\\${endRow})</td>
        <td class="text-center footer-value">-</td>
        <td class="text-right footer-value" style="mso-number-format:'\\\\Rp* \\\\#\\\\,\\\\#\\\\#0';">=SUM(P12:P\\${endRow})</td>
      </tr>
    </tfoot>
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

  const getCategoryBadgeClass = (name: string) => {
    const n = name.toUpperCase();
    if (n.includes('BRI') || n.includes('BCA') || n.includes('MANDIRI') || n.includes('SEABANK') || n.includes('DIGITAL') || n.includes('BANK')) {
      return 'bg-blue-50 text-blue-700 border border-blue-200';
    }
    if (n.includes('DANA') || n.includes('GOPAY') || n.includes('SHOPEE') || n.includes('OVO') || n.includes('LINKAJA')) {
      return 'bg-sky-50 text-sky-700 border border-sky-200';
    }
    if (n.includes('TARIK')) return 'bg-rose-50 text-rose-700 border border-rose-200';
    if (n.includes('AKSESORIS')) return 'bg-amber-50 text-amber-700 border border-amber-200';
    if (n.includes('KASBON')) return 'bg-orange-50 text-orange-700 border border-orange-200';
    return 'bg-purple-50 text-purple-700 border border-purple-200';
  };

  return (
    <div id="report-page-container" className={`bg-slate-55 font-sans shadow-inner ${isExporting ? 'h-auto overflow-visible pb-10' : 'min-h-screen pb-24 overflow-y-auto'}`}>
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-full-width {
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
          body {
            background-color: white !important;
            color: black !important;
          }
        }
      `}</style>

      {/* HEADER BANNER */}
      <div className="relative bg-[#1e3a8a] text-white pt-8 pb-10 px-4 rounded-b-[2rem] shadow-lg z-20 print-full-width">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/')} 
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer no-print"
            >
              <ArrowLeft size={18} strokeWidth={2.5} />
            </button>
            <div>
              <h1 className="font-black text-sm sm:text-base tracking-wide uppercase leading-tight">LAPORAN ARUS KAS</h1>
              <p className="text-[9px] text-blue-200 uppercase font-black tracking-wider leading-none mt-1.5 font-sans">
                {reportPeriod === 'SEMUA' ? (
                  'Rincian Komprehensif Seluruh Aliran Dana'
                ) : (
                  `Rekap Komprehensif Periode: ${periodDateRange.start?.toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})} - ${periodDateRange.end?.toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})}`
                )}
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-blue-200 text-[8px] font-black uppercase tracking-widest leading-none mb-1">{dayName}</p>
            <p className="text-white text-[10px] font-black tracking-tight leading-none mb-1">{fullDate}</p>
            <p className="text-amber-300 text-xs font-black tabular-nums tracking-widest leading-none mt-1">{clockStr}</p>
          </div>
        </div>

        {/* Dynamic subtitle banner containing active period details */}
        <div className="bg-blue-950/40 border border-blue-900/50 p-2.5 rounded-xl text-[9px] font-bold text-blue-200 flex items-center gap-2 mt-3 leading-none uppercase tracking-wide">
          <CalendarDays size={12} className="text-amber-400 shrink-0" />
          <span>FOKUS INTEGRASI HARI:</span>
          <span className="text-white font-black whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]">
            {reportPeriod === 'HARI_INI' && 'Buku Kas Hari Ini'}
            {reportPeriod === 'KEMARIN' && 'Buku Kas Kemarin'}
            {reportPeriod === 'MINGGU_INI' && 'Buku Kas 1 Minggu Terakhir'}
            {reportPeriod === 'BULAN_INI' && 'Buku Kas Bulan Berjalan'}
            {reportPeriod === 'SEMUA' && 'Semua Sejarah Pencatatan'}
            {reportPeriod === 'KUSTOM' && 'Rentang Tanggal Kustom'}
          </span>
          <span className="ml-auto text-amber-300 font-extrabold">{periodTransactions.length} TRX</span>
        </div>

        {/* PRINT CONTROLLER */}
        <div className={`flex justify-end mt-4 ${isExporting ? 'hidden' : 'no-print'}`}>
          <button 
            onClick={handlePrint}
            disabled={isExporting}
            className={`text-white text-[10px] font-black px-4.5 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer uppercase tracking-wider ${
              isExporting ? 'bg-orange-400 opacity-80 cursor-wait' : 'bg-orange-500 hover:bg-orange-600 active:scale-95 shadow-orange-500/20'
            }`}
          >
            <FileDown size={14} /> {isExporting ? 'MENYIAPKAN PDF...' : 'Cetak Laporan PDF (*Lengkap)'}
          </button>
        </div>
      </div>

      {/* BODY REPORT CONTAINER */}
      <div className="px-4 -mt-5 relative z-30 space-y-4 print-full-width">
        
        {/* REPORT PERIOD QUICK SWITCHER CARD */}
        <div className="bg-white dark:bg-slate-800 border border-slate-150 p-4 rounded-3xl shadow-sm space-y-3.5 no-print">
          <h4 className="text-[9.5px] font-black tracking-wider text-slate-800 dark:text-slate-100 uppercase flex items-center gap-1.5">
            <ListFilter size={13} className="text-blue-600 font-black" /> Saring Rentang Waktu Laporan:
          </h4>
          
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
            {[
              { id: 'HARI_INI', label: 'Hari Ini' },
              { id: 'KEMARIN', label: 'Kemarin' },
              { id: 'MINGGU_INI', label: '7 Hari' },
              { id: 'BULAN_INI', label: 'Bulan Ini' },
              { id: 'SEMUA', label: 'Semua' },
              { id: 'KUSTOM', label: 'Kustom 📅' }
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setReportPeriod(p.id as any)}
                className={`py-2 px-1 text-center rounded-xl text-[9px] font-black uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                  reportPeriod === p.id
                    ? 'bg-[#1e3a8a] text-white shadow-xs font-extrabold'
                    : 'bg-slate-100 dark:bg-slate-800 border border-slate-200/50 text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:text-slate-100 hover:bg-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {reportPeriod === 'KUSTOM' && (
            <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 rounded-2xl animate-in fade-in duration-200">
              <div>
                <label className="text-[8px] font-black text-slate-400 block mb-1 uppercase tracking-wider">TANGGAL MULAI</label>
                <input 
                  type="date"
                  value={customStartDate}
                  onChange={e => setCustomStartDate(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 py-1.5 px-2.5 rounded-xl font-bold font-mono text-[10.5px] outline-none focus:border-blue-400 transition-colors"
                />
              </div>
              <div>
                <label className="text-[8px] font-black text-slate-400 block mb-1 uppercase tracking-wider">TANGGAL AKHIR</label>
                <input 
                  type="date"
                  value={customEndDate}
                  onChange={e => setCustomEndDate(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 py-1.5 px-2.5 rounded-xl font-bold font-mono text-[10.5px] outline-none focus:border-blue-400 transition-colors"
                />
              </div>
            </div>
          )}
        </div>

        {/* ======================================= */}
        {/* NEW SEGMENTED TAB SELECTOR (SCREENS ONLY) */}
        {/* ======================================= */}
        <div className="bg-white dark:bg-slate-800 border border-slate-150 p-1 rounded-2xl shadow-sm flex items-center justify-between gap-1 no-print">
          <button
            type="button"
            onClick={() => setActiveTab('RINGKASAN')}
            className={`flex-1 py-3 px-1 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all duration-150 cursor-pointer ${
              activeTab === 'RINGKASAN'
                ? 'bg-[#1e3a8a] text-white font-black shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:bg-slate-900 font-bold'
            }`}
          >
            <Coins size={15} className={activeTab === 'RINGKASAN' ? 'text-amber-300' : 'text-slate-400'} />
            <span className="text-[8px] uppercase tracking-wider font-extrabold truncate w-full text-center">Ringkasan</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ARUS_KAS')}
            className={`flex-1 py-3 px-1 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all duration-150 cursor-pointer ${
              activeTab === 'ARUS_KAS'
                ? 'bg-[#1e3a8a] text-white font-black shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:bg-slate-900 font-bold'
            }`}
          >
            <ArrowRightLeft size={15} className={activeTab === 'ARUS_KAS' ? 'text-amber-300' : 'text-slate-400'} />
            <span className="text-[8px] uppercase tracking-wider font-extrabold truncate w-full text-center font-sans">Detail Aliran</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('KATEGORI')}
            className={`flex-1 py-3 px-1 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all duration-150 cursor-pointer ${
              activeTab === 'KATEGORI'
                ? 'bg-[#1e3a8a] text-white font-black shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:bg-slate-900 font-bold'
            }`}
          >
            <ChartPie size={15} className={activeTab === 'KATEGORI' ? 'text-amber-300' : 'text-slate-400'} />
            <span className="text-[8px] uppercase tracking-wider font-extrabold truncate w-full text-center">Kategori</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('JURNAL')}
            className={`flex-1 py-3 px-1 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all duration-150 cursor-pointer ${
              activeTab === 'JURNAL'
                ? 'bg-[#1e3a8a] text-white font-black shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:bg-slate-900 font-bold'
            }`}
          >
            <SlidersHorizontal size={15} className={activeTab === 'JURNAL' ? 'text-amber-300' : 'text-slate-400'} />
            <span className="text-[8px] uppercase tracking-wider font-extrabold truncate w-full text-center">Jurnal Ledger</span>
          </button>
        </div>

        {/* ============================================== */}
        {/* ON-SCREEN MODE CONTAINER (HIDDEN DURING PRINT) */}
        {/* ============================================== */}
        <div className={`space-y-4 ${isExporting ? '' : 'print:hidden'}`}>
          
          {/* TAB 1: RINGKASAN */}
          {(activeTab === 'RINGKASAN' || isExporting) && (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              {/* SISA SALDO RUNTIME GRIDS */}
              <div className="grid grid-cols-2 gap-3.5">
                <div className="bg-white dark:bg-slate-800 border border-slate-150 p-4 rounded-2xl shadow-xs flex flex-col justify-between">
                  <div>
                    <p className="text-[9px] text-slate-450 font-black uppercase tracking-widest flex items-center gap-1">
                      <Wallet size={12} className="text-blue-500 shrink-0" /> Sisa Buku Digital
                    </p>
                    <p className="text-sm font-black text-slate-800 dark:text-slate-100 mt-1.5 font-mono">{formatRupiah(currentSaldoBank)}</p>
                  </div>
                  <span className="text-[8px] font-bold text-blue-500 uppercase tracking-tighter mt-1 block">Brankas Emoney & Rekening</span>
                </div>

                <div className="bg-white dark:bg-slate-800 border border-slate-150 p-4 rounded-2xl shadow-xs flex flex-col justify-between">
                  <div>
                    <p className="text-[9px] text-slate-450 font-black uppercase tracking-widest flex items-center gap-1">
                      <Landmark size={12} className="text-emerald-500 shrink-0" /> Sisa Laci Kasir
                    </p>
                    <p className="text-sm font-black text-slate-800 dark:text-slate-100 mt-1.5 font-mono">{formatRupiah(currentTotalSaldoKas)}</p>
                  </div>
                  <span className="text-[8px] font-bold text-emerald-600 uppercase tracking-tighter mt-1 block">Fisik Tunai Di Brankas</span>
                </div>
              </div>

              {/* MODAL & ASSETS CARDS */}
              <div className="grid grid-cols-2 gap-3.5">
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-3.5 sm:p-4.5 rounded-2xl shadow-md text-white flex flex-col justify-between min-h-[105px]">
                  <div>
                    <p className="text-[8px] sm:text-[9.5px] text-slate-300 font-extrabold uppercase tracking-widest flex items-center gap-1 sm:gap-2 mb-1">
                      <Vault size={12} className="text-orange-400 shrink-0" /> Modal Awal
                    </p>
                    <p className="text-[7.5px] sm:text-[8px] text-slate-400 font-bold mb-1 sm:mb-2 uppercase truncate">Buku Operasional</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-lg font-black tracking-tight truncate font-mono">{formatRupiah(totalModalAwal)}</p>
                    <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1 sm:mt-2 text-[7.5px] sm:text-[8px] font-semibold text-slate-400 border-t border-slate-800/80 pt-1.5 leading-none">
                      <span>Kas: <strong className="text-emerald-400">{formatRupiah(modalLaciKasir)}</strong></span>
                      <span className="text-slate-700 dark:text-slate-200 hidden sm:inline">|</span>
                      <span>Dig: <strong className="text-blue-400">{formatRupiah(modalAsetDigital)}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-900 to-blue-950 border border-blue-800 p-3.5 sm:p-4.5 rounded-2xl shadow-md text-white flex flex-col justify-between min-h-[105px]">
                  <div>
                    <p className="text-[8px] sm:text-[9.5px] text-blue-200 font-extrabold uppercase tracking-widest flex items-center gap-1 sm:gap-2 mb-1">
                      <Landmark size={12} className="text-blue-300 shrink-0" /> Digital Masuk
                    </p>
                    <p className="text-[7.5px] sm:text-[8px] text-blue-350 font-black uppercase leading-none mb-1 sm:mb-2 truncate">Transfer Rekening</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-lg font-black tracking-tight text-emerald-350 truncate font-mono">{formatRupiah(totalAsetDigitalMasukHariIni)}</p>
                    <span className="text-[7px] sm:text-[8px] text-blue-300 bg-blue-950/50 border border-blue-900/40 px-1 sm:px-2 py-0.5 rounded inline-block mt-1 sm:mt-2 font-bold uppercase leading-none truncate max-w-full">
                      Aliran Bank Masuk
                    </span>
                  </div>
                </div>
              </div>

              {/* OVERVIEW STATS BULLET GROUP */}
              <div className="bg-white dark:bg-slate-800 border border-slate-150 rounded-2xl p-4 shadow-sm space-y-3">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-2.5 flex items-center justify-between">
                  <h4 className="text-[10px] font-black text-slate-800 dark:text-slate-100 tracking-wider uppercase flex items-center gap-1.5 font-sans">
                    <ChartPie size={14} className="text-blue-500 shrink-0" /> Ringkasan Mutasi Dana Buku Kas
                  </h4>
                  <span className="text-[8px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded font-black uppercase font-mono">Overview</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-150">
                    <p className="text-[8px] text-slate-400 font-extrabold uppercase">Penerimaan Laci Kasir</p>
                    <p className="text-sm font-black text-emerald-600 mt-1 font-mono">{formatRupiah(totalKasMasukLaci)}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-150">
                    <p className="text-[8px] text-slate-400 font-extrabold uppercase">Belanja/Keluar Laci Kasir</p>
                    <p className="text-sm font-black text-rose-600 mt-1 font-mono">-{formatRupiah(totalKasKeluarLaci)}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-150">
                    <p className="text-[8px] text-slate-400 font-extrabold uppercase">Mutasi Rekening Digital (Net)</p>
                    <p className={`text-sm font-black mt-1 font-mono ${totalKasNonTunai >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {totalKasNonTunai >= 0 ? '+' : ''}{formatRupiah(totalKasNonTunai)}
                    </p>
                  </div>
                  <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                    <p className="text-[8px] text-blue-500 font-extrabold uppercase">Akumulasi Laba Periode</p>
                    <p className="text-sm font-black text-blue-700 mt-1 font-mono">{formatRupiah(totalLabaPeriode)}</p>
                  </div>
                </div>

                {/* Info indicator */}
                <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-2.5 mt-2 border border-slate-150 flex items-center justify-between text-[9px] font-bold text-slate-550">
                  <span className="uppercase tracking-wider flex items-center gap-1.5 text-slate-400">
                    <HelpCircle size={12} className="text-slate-400" /> TOTAL TRANSAKSI TERHUBUNG:
                  </span>
                  <span className="font-extrabold text-[#1e3a8a]">{periodTransactions.length} SKU Jurnal</span>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: DETAILED CASHFLOW FLUIDS */}
          {(activeTab === 'ARUS_KAS' || isExporting) && (
            <div className="bg-white dark:bg-slate-800 border border-slate-150 rounded-2xl p-4.5 shadow-sm space-y-5 animate-in fade-in duration-200">
              
              {/* KAS MASUK */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[10px] font-black text-emerald-600 tracking-widest uppercase flex items-center gap-1.5">
                    <ArrowDown size={12} strokeWidth={2.5} className="text-emerald-600" /> KAS MASUK (Fisik Laci Kasir)
                  </h4>
                  <span className="text-[8px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-black uppercase">TUNAI</span>
                </div>
                
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10.5px] bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-150/60 transition-all">
                    <span className="text-slate-600 dark:text-slate-300 font-bold">Modal Awal Laci Tunai</span>
                    <span className="font-extrabold text-slate-800 dark:text-slate-100 font-mono">{formatRupiah(cashIn_Modal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10.5px] bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-150/60 transition-all">
                    <span className="text-slate-600 dark:text-slate-300 font-bold">Penjualan Digital (Terima Tunai)</span>
                    <span className="font-extrabold text-slate-800 dark:text-slate-100 font-mono">{formatRupiah(cashIn_Digital)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10.5px] bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-150/60 transition-all">
                    <span className="text-slate-600 dark:text-slate-300 font-bold">Penjualan Aksesoris & POS (Tunai)</span>
                    <span className="font-extrabold text-slate-800 dark:text-slate-100 font-mono">{formatRupiah(cashIn_Aksesoris)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10.5px] bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-150/60 transition-all">
                    <span className="text-slate-600 dark:text-slate-300 font-bold">Penerimaan Jasa Admin & Lain-lain (Tunai)</span>
                    <span className="font-extrabold text-slate-800 dark:text-slate-100 font-mono">{formatRupiah(cashIn_Lainnya)}</span>
                  </div>

                  <div className="flex justify-between items-center text-[11px] bg-emerald-55 text-emerald-800 p-3 rounded-xl border border-emerald-250 font-black tracking-wide uppercase">
                    <span>Total Kas Masuk Laci (Tunai)</span>
                    <span className="text-xs sm:text-sm tracking-tight text-emerald-700 font-mono">{formatRupiah(totalKasMasukLaci)}</span>
                  </div>
                </div>
              </div>
              
              {/* KAS KELUAR */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[10px] font-black text-rose-600 tracking-widest uppercase flex items-center gap-1.5">
                    <ArrowUp size={12} strokeWidth={2.5} className="text-rose-650" /> KAS KELUAR (Dari Laci)
                  </h4>
                  <span className="text-[8px] bg-rose-50 text-rose-700 px-2 py-0.5 rounded font-black uppercase">PENGELUARAN</span>
                </div>
                
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10.5px] bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-150/60 transition-all">
                    <span className="text-slate-600 dark:text-slate-300 font-bold">Uang Pembayaran Tarik Tunai Pelanggan</span>
                    <span className="font-extrabold text-slate-800 dark:text-slate-100 font-mono">-{formatRupiah(cashOut_TarikTunai)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10.5px] bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-150/60 transition-all">
                    <span className="text-slate-600 dark:text-slate-300 font-bold">Sampah, Listrik, Operasional & Toko</span>
                    <span className="font-extrabold text-slate-800 dark:text-slate-100 font-mono">-{formatRupiah(cashOut_Operasional)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10.5px] bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-150/60 transition-all">
                    <span className="text-slate-600 dark:text-slate-300 font-bold">Pinjaman Anggota Kasbon Baru (Tunai)</span>
                    <span className="font-extrabold text-slate-800 dark:text-slate-100 font-mono">-{formatRupiah(cashOut_KasbonBaru)}</span>
                  </div>

                  <div className="flex justify-between items-center text-[11px] bg-rose-55 text-rose-800 p-3 rounded-xl border border-rose-250 font-black tracking-wide uppercase">
                    <span>Total Kas Keluar Laci (Operasional)</span>
                    <span className="text-xs sm:text-sm tracking-tight text-rose-700 font-mono">-{formatRupiah(totalKasKeluarLaci)}</span>
                  </div>
                </div>
              </div>
              
              {/* MUTASI DIGITAL BANK */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[10px] font-black text-purple-600 tracking-widest uppercase flex items-center gap-1.5">
                    <Layers size={12} className="text-purple-600" /> MUTASI KAS DIGITAL (Rekening Transfer)
                  </h4>
                  <span className="text-[8px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-black uppercase">TRANS-MUTASI</span>
                </div>
                
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10.5px] bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-150/60 transition-all font-sans">
                    <span className="text-slate-600 dark:text-slate-300 font-bold">Aksesoris & POS QRIS non-tunai</span>
                    <span className="font-extrabold text-emerald-600 font-mono">+{formatRupiah(digital_Penjualan)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10.5px] bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-150/60 transition-all font-sans">
                    <span className="text-slate-600 dark:text-slate-300 font-bold">Mutasi Terima Masuk Rekening (Tarik)</span>
                    <span className="font-extrabold text-emerald-600 font-mono">+{formatRupiah(digital_TarikTerima)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10.5px] bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-150/60 transition-all font-sans">
                    <span className="text-slate-600 dark:text-slate-300 font-bold">Pelunasan/Setor Kiriman Saldo Keluar</span>
                    <span className="font-extrabold text-rose-600 font-mono">-{formatRupiah(digital_SetorKirim)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10.5px] bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-150/60 transition-all font-sans">
                    <span className="text-slate-600 dark:text-slate-300 font-bold">Peneriman Admin Jasa non-tunai & Lainnya</span>
                    <span className="font-extrabold text-slate-800 dark:text-slate-100 font-mono">+{formatRupiah(digital_AdminLainnya)}</span>
                  </div>

                  <div className="flex justify-between items-center text-[11px] bg-purple-55 text-purple-800 p-3 rounded-xl border border-purple-250 font-black tracking-wide uppercase">
                    <span>Total Aliran Digital Net</span>
                    <span className={`text-xs sm:text-sm tracking-tight font-black font-mono ${totalKasNonTunai >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {totalKasNonTunai >= 0 ? '+' : ''}{formatRupiah(totalKasNonTunai)}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: CATEGORY STATS TABLE */}
          {(activeTab === 'KATEGORI' || isExporting) && (
            <div className="bg-white dark:bg-slate-800 border border-slate-150 rounded-2xl p-4.5 shadow-sm animate-in fade-in duration-200">
              <div className="flex items-center justify-between mb-3.5 px-1 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-black text-[11px] text-slate-800 dark:text-slate-100 tracking-wider uppercase flex items-center gap-1.5 font-sans">
                  <ChartPie size={14} className="text-[#10b981] shrink-0" /> REKAP OMSET DANA HARI INI PER KATEGORI
                </h3>
                <span className="text-[8px] bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 px-2.5 py-0.5 rounded font-bold uppercase tracking-wide">Instansi Aktif</span>
              </div>

              {categoryTotals.length === 0 ? (
                <div className="py-12 text-center text-slate-450 text-[10px] font-black uppercase tracking-wider bg-slate-50/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                  Belum ada transaksi kategori berjalan pada rentang periode ini.
                </div>
              ) : (
                <div className="overflow-x-auto select-none">
                  <table className="w-full text-left border-collapse text-[10.5px]">
                    <thead>
                      <tr className="border-b border-slate-150 text-[8.5px] font-black text-slate-400 uppercase tracking-widest pb-1">
                        <th className="pb-2">Nama Kategori Kategori</th>
                        <th className="pb-2 text-center w-14">Qty Transaksi</th>
                        <th className="pb-2 text-right">Volume Berjalan</th>
                        <th className="pb-2 text-right text-emerald-600">Laba Jasa Bersih</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans">
                      {categoryTotals.map(c => (
                        <tr key={c.category} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 font-semibold text-slate-800 dark:text-slate-100">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wide ${getCategoryBadgeClass(c.category)}`}>
                              {c.category}
                            </span>
                          </td>
                          <td className="py-3 font-semibold text-slate-550 text-center font-mono">{c.qty} pcs</td>
                          <td className="py-3 font-bold text-slate-700 dark:text-slate-200 text-right font-mono">{formatRupiah(c.nominal)}</td>
                          <td className="py-3 font-black text-emerald-600 text-right font-mono">{formatRupiah(c.laba)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: DETAILED FILTERABLE JOURNAL */}
          {(activeTab === 'JURNAL' || isExporting) && (
            <div className="bg-white dark:bg-slate-800 border border-slate-150 rounded-[2rem] p-4 sm:p-5 shadow-sm space-y-4 animate-in fade-in duration-200">
                           {/* Reset form and search controls header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="font-black text-[11px] sm:text-xs text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                    <SlidersHorizontal size={14} className="text-[#10b981] shrink-0" />
                    Pencarian Jurnal Ledger
                  </h3>
                  <p className="text-[8px] text-slate-400 font-black uppercase">
                    Penyaringan instan transaksi terdaftar
                  </p>
                </div>
                
                <div className="flex items-center gap-1.5 no-print">
                  <button
                    onClick={handleExportTransactionsToExcel}
                    className="text-[8.5px] font-black text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border border-emerald-200 hover:border-emerald-300 px-2.5 py-1.5 rounded-lg uppercase tracking-wide transition-all flex items-center gap-1 cursor-pointer"
                    title="Ekspor pencarian ke MS Excel"
                  >
                    <FileDown size={11} className="stroke-[2.5]" />
                    <span>Ekspor Excel</span>
                  </button>

                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSearchType('SEMUA');
                      setSearchCategory('SEMUA');
                      setSearchWallet('SEMUA');
                    }}
                    className="text-[8.5px] font-black text-rose-500 hover:text-rose-700 border border-rose-200 hover:border-rose-300 px-2.5 py-1.5 rounded-lg uppercase tracking-wide transition-all cursor-pointer"
                  >
                    Reset Saringan
                  </button>
                </div>
              </div>

              {/* Advanced interactive search input fields */}
              <div className="space-y-3.5 no-print">
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Search size={13} strokeWidth={2.5} />
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Masukkan deskripsi kata kunci, TRX ID, nominal, bank..."
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-9 pr-8 text-[11px] font-bold text-[#1e3a8a] outline-none focus:border-blue-400 transition-colors"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-300 font-black text-[10px]"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[7.5px] font-black text-slate-400 block mb-0.5 uppercase tracking-wide">Arah Arus Dana</label>
                    <select
                      value={searchType}
                      onChange={e => setSearchType(e.target.value as any)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-225 py-2 px-2.5 rounded-xl text-[10px] font-black uppercase text-[#1e3a8a] cursor-pointer outline-none focus:border-blue-300 transition-colors"
                    >
                      <option value="SEMUA">🌐 Semua Aliran (In/Out/Mutasi)</option>
                      <option value="MASUK">🟢 Uang Masuk / Tambah</option>
                      <option value="KELUAR">🔴 Uang Keluar / Tarik</option>
                      <option value="MUTASI">🔵 Transfer & Mutasi</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[7.5px] font-black text-slate-400 block mb-0.5 uppercase tracking-wide">Saring Instansi</label>
                    <select
                      value={searchCategory}
                      onChange={e => setSearchCategory(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-225 py-2 px-2.5 rounded-xl text-[10px] font-black uppercase text-[#1e3a8a] cursor-pointer outline-none focus:border-blue-300 transition-colors"
                    >
                      <option value="SEMUA">🏷️ Semua Kategori</option>
                      {allUniqueCategories.map(cat => (
                        <option key={cat} value={cat}>📌 {cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[7.5px] font-black text-slate-400 block mb-0.5 uppercase tracking-wide">Mutasi Rekening</label>
                    <select
                      value={searchWallet}
                      onChange={e => setSearchWallet(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-225 py-2 px-2.5 rounded-xl text-[10px] font-black uppercase text-[#1e3a8a] cursor-pointer outline-none focus:border-blue-300 transition-colors"
                    >
                      <option value="SEMUA">🏦 Semua Rekening/Dompet</option>
                      {wallets.map(w => (
                        <option key={w.id} value={w.id}>
                          {w.id === 'Bank08' ? '💵 ' : '💳 '} {w.name.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* KPI stat summary box */}
              <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-2xl border border-slate-150 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest">TRANSAKSI COCOK</p>
                  <p className="text-sm font-black text-[#1e3a8a] mt-0.5 font-mono">
                    {searchedStats.count} <span className="text-[8.5px] font-sans text-slate-500 dark:text-slate-400 font-extrabold uppercase">Skor Log</span>
                  </p>
                </div>
                <div className="flex gap-4">
                  <div>
                    <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest">VOLUME OMSET</p>
                    <p className="text-xs font-black text-slate-700 dark:text-slate-200 font-mono mt-0.5">{formatRupiah(searchedStats.volume)}</p>
                  </div>
                  <div>
                    <p className="text-[7.5px] font-black text-emerald-500 uppercase tracking-widest">LABA UNTUNG</p>
                    <p className="text-xs font-black text-emerald-600 font-mono mt-0.5">{formatRupiah(searchedStats.laba)}</p>
                  </div>
                </div>
              </div>

              {/* Ledger Lists wrapper */}
              <div className={`space-y-2.5 pr-1 ${isExporting ? 'h-auto overflow-visible' : 'max-h-[480px] overflow-y-auto'}`}>
                {searchedTransactions.length === 0 ? (
                  <div className="py-12 bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-center px-4">
                    <HelpCircle className="text-slate-300 mx-auto mb-2" size={20} />
                    <h5 className="text-[9.5px] font-black text-slate-700 dark:text-slate-200 uppercase">Tidak Ada Hasil</h5>
                    <p className="text-[8px] text-slate-400 max-w-xs mx-auto uppercase mt-1 leading-snug">
                      Ubah kata sandi pencarian atau reset filter di atas
                    </p>
                  </div>
                ) : (
                  searchedTransactions.map((tx, idx) => {
                    const isExpanded = !!expandedTx[tx.id];
                    const cleanCode = `TRX-${globalSequenceMap[tx.id] || tx.id}`;
                    const classif = getRowClassification(tx);
                    const isInc = classif === 'MASUK';
                    
                    let themeColorClass = 'bg-slate-400';
                    let indicatorCircle = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200';
                    if (classif === 'MASUK') {
                      themeColorClass = 'bg-emerald-500';
                      indicatorCircle = 'bg-emerald-50 text-emerald-700 border border-emerald-150';
                    } else if (classif === 'KELUAR') {
                      themeColorClass = 'bg-rose-500';
                      indicatorCircle = 'bg-rose-50 text-rose-700 border border-rose-150';
                    } else if (classif === 'MUTASI') {
                      themeColorClass = 'bg-blue-500';
                      indicatorCircle = 'bg-blue-50 text-blue-700 border border-blue-150';
                    }

                    const srcW = wallets.find(w => w.id === tx.sourceWallet);
                    const tgtW = wallets.find(w => w.id === tx.targetWallet);
                    const txDateObj = new Date(tx.date);
                    const timeOnly = txDateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(/:/g, '.');
                    const fullTxDateStr = txDateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

                    return (
                      <div
                        key={tx.id}
                        className={`bg-slate-50 dark:bg-slate-900 hover:bg-slate-100/90 rounded-2xl border transition-all duration-150 relative overflow-hidden ${
                          isExpanded ? 'border-blue-200 ring-1 ring-blue-50' : 'border-slate-150'
                        }`}
                      >
                        <div className={`absolute top-0 bottom-0 left-0 w-1 ${themeColorClass}`}></div>

                        <div
                          onClick={() => {
                            setExpandedTx(prev => ({
                              ...prev,
                              [tx.id]: !prev[tx.id]
                            }));
                          }}
                          className="p-3 pl-4 flex items-center justify-between gap-2.5 cursor-pointer select-none"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className={`w-7.5 h-7.5 rounded-full flex items-center justify-center font-mono text-[9.5px] font-black shrink-0 ${indicatorCircle}`}>
                              #{globalSequenceMap[tx.id] || (idx + 1)}
                            </div>

                            <div className="min-w-0 flex-1 font-sans pr-2">
                              {tx.category && (
                                <div className="flex items-center gap-1 mb-1 w-full truncate">
                                  <p className="text-[12px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight truncate">
                                    {tx.category.toUpperCase().trim() === 'UANG DIGITAL' ? (
                                      `Uang digital : ${(() => {
                                        let wName = '';
                                        if (srcW && srcW.id !== 'Bank08') {
                                          wName = srcW.name;
                                        } else if (tgtW && tgtW.id !== 'Bank08') {
                                          wName = tgtW.name;
                                        } else {
                                          wName = srcW?.name || tgtW?.name || 'dana';
                                        }
                                        return wName;
                                      })()}`
                                    ) : (
                                      tx.category.toUpperCase()
                                    )}
                                  </p>
                                </div>
                              )}
                              <p className={`text-[9px] font-bold text-slate-500 dark:text-slate-400 leading-relaxed ${isExpanded ? '' : 'line-clamp-1'}`}>
                                {tx.description || 'Penjualan POS'}
                              </p>
                              <div className="flex flex-wrap items-center gap-1 mt-1 leading-none">
                                <span className="text-[7.5px] font-black font-mono text-slate-400">
                                  {cleanCode} | {fullTxDateStr} {timeOnly}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0 flex items-center gap-2">
                            <div>
                              <p className={`text-[10px] font-black tracking-tight font-mono ${
                                isInc ? 'text-emerald-600' : 'text-slate-800 dark:text-slate-100'
                              }`}>
                                {isInc ? '+' : '-'} Rp {tx.total.toLocaleString('id-ID')}
                              </p>
                              {tx.adminFee && tx.adminFee > 0 ? (
                                <p className="text-[8px] font-black text-rose-500 leading-none mt-0.5 font-mono">
                                  Adm: Rp {tx.adminFee.toLocaleString('id-ID')}
                                </p>
                              ) : null}
                            </div>
                            
                            <div className="text-slate-400 no-print shrink-0">
                              {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </div>
                          </div>
                        </div>

                        {/* Dropdown inner detail expansion */}
                        {isExpanded && (
                          <div className="p-3.5 bg-white dark:bg-slate-800 border-t border-slate-150 text-[10px] text-slate-600 dark:text-slate-300 space-y-3 font-sans leading-tight">
                            <div className="grid grid-cols-2 gap-3 pb-1 border-b border-dashed border-slate-100 dark:border-slate-800">
                              <div>
                                <p className="text-[7px] font-black text-slate-450 uppercase mb-0.5">Klasifikasi Aliran</p>
                                <span className="font-extrabold text-[#1e3a8a] uppercase text-[8px]">
                                  {classif === 'MASUK' && '🟢 Uang Masuk / Tambah'}
                                  {classif === 'KELUAR' && '🔴 Uang Keluar / Tarik'}
                                  {classif === 'MUTASI' && '🔄 Mutasi / Penjualan POS'}
                                </span>
                              </div>
                              <div>
                                <p className="text-[7px] font-black text-slate-450 uppercase mb-0.5">Potongan Admin Fee</p>
                                <span className="font-extrabold text-slate-800 dark:text-slate-100 font-mono">
                                  {tx.adminFee && tx.adminFee > 0 
                                    ? `Rp ${tx.adminFee.toLocaleString('id-ID')} (${tx.adminNonTunai ? 'Rekening' : 'Tunai Laci'})`
                                    : 'Tanpa Potongan Admin'}
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pb-1 border-b border-dashed border-slate-100 dark:border-slate-800">
                              <div>
                                <p className="text-[7px] font-black text-slate-450 uppercase mb-0.5">Saku/Wallet Debit</p>
                                <span className="font-bold text-slate-700 dark:text-slate-200 uppercase">{srcW ? srcW.name.toUpperCase() : 'Laci Kasir'}</span>
                              </div>
                              <div>
                                <p className="text-[7px] font-black text-slate-450 uppercase mb-0.5">Saku/Wallet Kredit</p>
                                <span className="font-bold text-slate-700 dark:text-slate-200 uppercase">{tgtW ? tgtW.name.toUpperCase() : 'Laci Kasir'}</span>
                              </div>
                            </div>

                            {tx.items && tx.items.length > 0 && (
                              <div className="pb-1 border-b border-dashed border-slate-100 dark:border-slate-800 space-y-1">
                                <p className="text-[7px] font-black text-slate-450 uppercase">Rincian Pembelanjaan POS:</p>
                                {tx.items.map((it, pIdx) => (
                                  <div key={pIdx} className="flex justify-between items-center text-[9px] bg-slate-50 dark:bg-slate-900 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <span className="font-bold text-slate-700 dark:text-slate-200">{it.name} <strong className="text-blue-600">x{it.quantity}</strong></span>
                                    <span className="font-extrabold font-mono text-slate-500 dark:text-slate-400">{formatRupiah(it.price * it.quantity)}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="flex justify-between items-center text-[8px] text-slate-400 font-extrabold uppercase leading-none">
                              <span>Timestamp: {new Date(tx.date).toLocaleDateString('id-ID')} {timeOnly}</span>
                              <button
                                type="button"
                                onClick={() => navigate('/history')}
                                className="text-blue-800 underline uppercase hover:text-blue-900"
                              >
                                Mutasi Detail Utama ➔
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

            </div>
          )}

        </div>

        {/* ======================================================== */}
        {/* PRINT ONLY LAYOUT: COMPLETE formal A4 REPORT DOCUMENT   */}
        {/* ======================================================== */}
        <div className={`bg-white dark:bg-slate-800 text-black text-[10px] space-y-5 print-full-width p-4 select-none animate-in fade-in ${isExporting ? 'hidden' : 'hidden print:block'}`}>
          
          {/* Header Print Document */}
          <div className="text-center border-b-2 border-black pb-3 space-y-1">
            <h2 className="font-sans font-bold text-lg uppercase tracking-wider leading-none">LAPORAN MUTASI ARUS KAS KEUANGAN</h2>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#1e3a8a] leading-none">
              {reportPeriod === 'SEMUA' ? (
                'RANGKUMAN KOMPREHENSIF HISTORI ARUS KAS GLOBAL'
              ) : (
                `PERIODE LAPORAN: ${periodDateRange.start?.toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})} s.d ${periodDateRange.end?.toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}`
              )}
            </p>
            <div className="flex justify-between text-[8px] font-semibold pt-1.5 text-slate-500 dark:text-slate-400 leading-none">
              <span>Waktu Unduh/Cetak. {fullDate} pukul {clockStr} WIB</span>
              <span>Dihasilkan Otomatis Oleh Sistem Kasir Digital</span>
            </div>
          </div>

          {/* PRINT STATUS 1: LIVE BALANCE */}
          <div className="space-y-1.5">
            <h3 className="font-black text-[9px] uppercase border-l-2 border-black pl-1.5 tracking-wider">I. RINGKASAN SALDO BUKU KAS AKTIF (HARI INI)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-black p-2 rounded">
                <p className="text-[7.5px] uppercase text-slate-500 dark:text-slate-400 font-bold leading-none mb-1">Total Sisa Buku Digital (Di Saku/Bank/HP):</p>
                <p className="text-xs font-bold text-black font-mono leading-none">{formatRupiah(currentSaldoBank)}</p>
              </div>
              <div className="border border-black p-2 rounded">
                <p className="text-[7.5px] uppercase text-slate-500 dark:text-slate-400 font-bold leading-none mb-1">Total Sisa Laci Kasir (Fisik Tunai Brankas):</p>
                <p className="text-xs font-bold text-black font-mono leading-none">{formatRupiah(currentTotalSaldoKas)}</p>
              </div>
            </div>
          </div>

          {/* PRINT STATUS 2: MODALS RECONCILIATIONS */}
          <div className="space-y-1.5">
            <h3 className="font-black text-[9px] uppercase border-l-2 border-black pl-1.5 tracking-wider">II. ANALISIS REKONSILIASI MODAL AWAL & LABA JASA</h3>
            <table className="w-full border-collapse border border-black text-left text-[9px]">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 border-b border-black">
                  <th className="border-r border-black p-1.5 uppercase font-black">Uraian Transaksi Buku Kas</th>
                  <th className="border-r border-black p-1.5 text-right uppercase font-black w-28">Kas Fisik Tunai</th>
                  <th className="border-r border-black p-1.5 text-right uppercase font-black w-28">Kas Saku Digital</th>
                  <th className="p-1.5 text-right uppercase font-black w-32">Total Gabungan</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-black">
                  <td className="border-r border-black p-1.5 font-bold">Modal Awal Setor Pagi Periode Terpilih</td>
                  <td className="border-r border-black p-1.5 text-right font-mono">{formatRupiah(modalLaciKasir)}</td>
                  <td className="border-r border-black p-1.5 text-right font-mono">{formatRupiah(modalAsetDigital)}</td>
                  <td className="p-1.5 text-right font-bold font-mono text-black">{formatRupiah(totalModalAwal)}</td>
                </tr>
                <tr className="border-b border-black">
                  <td className="border-r border-black p-1.5 font-bold">Total Dana Digital Transfer Masuk</td>
                  <td className="border-r border-black p-1.5 text-right font-mono text-slate-400">-</td>
                  <td className="border-r border-black p-1.5 text-right font-mono">{formatRupiah(totalAsetDigitalMasukHariIni)}</td>
                  <td className="p-1.5 text-right font-bold font-mono text-emerald-800">{formatRupiah(totalAsetDigitalMasukHariIni)}</td>
                </tr>
                <tr>
                  <td className="border-r border-black p-1.5 font-bold">Akumulasi Margin Keuntungan (Laba Jasa)</td>
                  <td className="border-r border-black p-1.5 text-right font-mono text-slate-400">-</td>
                  <td className="border-r border-black p-1.5 text-right font-mono text-slate-400">-</td>
                  <td className="p-1.5 text-right font-bold font-mono text-blue-800">{formatRupiah(totalLabaPeriode)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* PRINT STATUS 3: REKAP KATEGORI */}
          <div className="space-y-1.5">
            <h3 className="font-black text-[9px] uppercase border-l-2 border-black pl-1.5 tracking-wider">III. ANALISIS TURN-OVER & LABA PER KATEGORI</h3>
            {categoryTotals.length === 0 ? (
              <p className="text-slate-400 italic text-[9px] border p-2 text-center rounded">Belum ada rincian mutasi kategori berjalan dalam rentang waktu terfilter.</p>
            ) : (
              <table className="w-full border-collapse border border-black text-left text-[9px]">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 border-b border-black font-black">
                    <th className="border-r border-black p-1.5 uppercase">Kategori / Instansi Tergabung</th>
                    <th className="border-r border-black p-1.5 text-center w-20 uppercase">Porsi Qty</th>
                    <th className="border-r border-black p-1.5 text-right uppercase w-36">Volume Aliran Dana</th>
                    <th className="p-1.5 text-right uppercase w-28 text-emerald-850 font-black">Margin Keuntungan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-400">
                  {categoryTotals.map(c => (
                    <tr key={c.category} className="border-b border-black">
                      <td className="border-r border-black p-1.5 font-bold uppercase text-[9px]">{c.category}</td>
                      <td className="border-r border-black p-1.5 text-center font-mono">{c.qty} pcs</td>
                      <td className="border-r border-black p-1.5 text-right font-mono">{formatRupiah(c.nominal)}</td>
                      <td className="p-1.5 text-right font-bold font-mono text-emerald-700">{formatRupiah(c.laba)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* PRINT STATUS 4: CORE FLOW STREAMS */}
          <div className="space-y-1.5">
            <h3 className="font-black text-[9px] uppercase border-l-2 border-black pl-1.5 tracking-wider">IV. ALIRAN DETAIL ARUS KAS FISIK LACI KASIR</h3>
            <div className="grid grid-cols-2 gap-4">
              {/* Cash In Table print */}
              <div className="border border-black p-2 rounded text-[8.5px]">
                <h4 className="font-bold text-[9px] text-emerald-850 border-b border-dashed border-slate-300 dark:border-slate-600 pb-1 uppercase mb-1.5">Kas Masuk (Laci Kasir)</h4>
                <div className="space-y-1 leading-none font-mono">
                  <div className="flex justify-between">
                    <span>Modal Pagi Tunai:</span>
                    <span>{formatRupiah(cashIn_Modal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Digital Terbayar Tunai:</span>
                    <span>{formatRupiah(cashIn_Digital)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>POS Belanja Tunai:</span>
                    <span>{formatRupiah(cashIn_Aksesoris)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Admin Tunai & Lainnya:</span>
                    <span>{formatRupiah(cashIn_Lainnya)}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t border-black pt-1 mt-1 text-[9px] text-emerald-800">
                    <span>TOTAL KAS MASUK LACI:</span>
                    <span>{formatRupiah(totalKasMasukLaci)}</span>
                  </div>
                </div>
              </div>

              {/* Cash Out Table print */}
              <div className="border border-black p-2 rounded text-[8.5px]">
                <h4 className="font-bold text-[9px] text-rose-850 border-b border-dashed border-slate-300 dark:border-slate-600 pb-1 uppercase mb-1.5">Kas Keluar (Laci Kasir)</h4>
                <div className="space-y-1 leading-none font-mono">
                  <div className="flex justify-between">
                    <span>Penyerahan Tarik Tunai:</span>
                    <span>-{formatRupiah(cashOut_TarikTunai)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Operasional & Belanja Toko:</span>
                    <span>-{formatRupiah(cashOut_Operasional)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pinjaman Kasbon Baru:</span>
                    <span>-{formatRupiah(cashOut_KasbonBaru)}</span>
                  </div>
                  <div className="w-full h-3"></div>
                  <div className="flex justify-between font-bold border-t border-black pt-1 mt-1 text-[9px] text-rose-800">
                    <span>TOTAL KAS KELUAR LACI:</span>
                    <span>-{formatRupiah(totalKasKeluarLaci)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* PRINT STATUS 5: HIGH-DENSITY AUDIT TRAIL TABLE */}
          <div className="space-y-1.5 pt-1">
            <h3 className="font-black text-[9px] uppercase border-l-2 border-black pl-1.5 tracking-wider">V. JURNAL BUKU LEDGER DETAIL (AUDIT LOG)</h3>
            <table className="w-full border-collapse border border-black text-[8.5px] text-left">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 border-b border-black font-black">
                  <th className="border-r border-black p-1 text-center w-8">No</th>
                  <th className="border-r border-black p-1 w-14">Kode ID</th>
                  <th className="border-r border-black p-1 w-20">Tanggal Log</th>
                  <th className="border-r border-black p-1">Deskripsi Transaksi</th>
                  <th className="border-r border-black p-1 w-14">Kategori</th>
                  <th className="border-r border-black p-1 w-16 text-right">Debit (+In)</th>
                  <th className="border-r border-black p-1 w-16 text-right">Kredit (-Out)</th>
                  <th className="p-1 w-14 text-right text-emerald-850 font-bold">Laba Jasa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black font-mono">
                {periodTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-4 text-center italic text-slate-400">Tidak ada data rincian kas terekam pada periode terpilih ini.</td>
                  </tr>
                ) : (
                  periodTransactions.map((tx, idx) => {
                    const codeLabel = `TRX-${globalSequenceMap[tx.id] || tx.id}`;
                    const classif = getRowClassification(tx);
                    const isInc = classif === 'MASUK';

                    const txDateObj = new Date(tx.date);
                    const dtStr = txDateObj.toLocaleDateString('id-ID', {day: 'numeric', month: 'short'}) + ' ' + txDateObj.toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'}).replace(/:/g, '.');

                    return (
                      <tr key={tx.id} className="border-b border-black font-mono leading-tight">
                        <td className="border-r border-black p-1 text-center">#{idx + 1}</td>
                        <td className="border-r border-black p-1 text-[7.5px] font-bold whitespace-nowrap">{codeLabel}</td>
                        <td className="border-r border-black p-1 text-[7.5px] whitespace-nowrap">{dtStr}</td>
                        <td className="border-r border-black p-1 font-sans text-[8px] leading-tight truncate max-w-[170px]">{tx.description || 'Transaksi Penjualan POS'}</td>
                        <td className="border-r border-black p-1 uppercase text-[7.5px] whitespace-nowrap">{tx.category || 'MUTASI'}</td>
                        <td className="border-r border-black p-1 text-right text-emerald-700 font-bold">{isInc ? formatRupiah(tx.total) : '-'}</td>
                        <td className="border-r border-black p-1 text-right text-rose-700 font-bold">{!isInc ? formatRupiah(tx.total) : '-'}</td>
                        <td className="p-1 text-right text-emerald-950 font-bold">{tx.adminFee && tx.adminFee > 0 ? formatRupiah(tx.adminFee) : '-'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Authorizing Signatures */}
          <div className="pt-8 flex justify-end">
            <div className="w-48 text-center border-t border-dashed border-black pt-1 block mt-4 leading-normal">
              <p className="text-[8px] uppercase font-black">Petugas Laci Kasir Toko</p>
              <div className="h-12"></div>
              <p className="text-[9px] font-bold underline capitalize">{now.toLocaleDateString('id-ID', {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'})}</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
