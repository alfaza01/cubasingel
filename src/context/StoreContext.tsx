import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Product, Transaction, CartItem, WalletNode, ContactNode, KasbonNode, NoteNode, TransactionPreset, AutoTextPreset } from '../types';
import { format } from 'date-fns';
import { pushToSupabase, getCurrentUserId, syncFactoryReset } from '../lib/storageSync';

interface StoreContextType {
  products: Product[];
  transactions: Transaction[];
  wallets: WalletNode[];
  balance: number;
  contacts: ContactNode[];
  kasbons: KasbonNode[];
  notes: NoteNode[];
  storeName: string;
  storeLogo: string;
  subStoreName: string;
  cashierName: string;
  storeAddress: string;
  announcementText: string;
  presets: TransactionPreset[];
  autoTextPresets: AutoTextPreset[];
  promoText: string;
  wisdomText: string;
  rotatingWordsText: string;
  addProduct: (product: Product) => void;
  updateProductStock: (id: string, quantity: number) => void;
  addTransaction: (items: CartItem[], total: number, type: 'INCOME' | 'EXPENSE' | 'MUTASI' | 'MODAL_PAGI' | 'TAMBAH_SALDO' | 'PINDAH_SALDO', description?: string, options?: { category?: string, sourceWallet?: string, targetWallet?: string, adminFee?: number, adminNonTunai?: boolean, isCustomService?: boolean }) => void;
  editTransaction: (id: string, updatedFields: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  updateWalletBalance: (walletId: string, amount: number) => void;
  updateWalletRealBalance: (walletId: string, amount: number) => void;
  updateWalletsList: (wallets: WalletNode[]) => void;
  addContact: (contact: Omit<ContactNode, 'id'>) => void;
  updateContact: (id: string, contact: Partial<ContactNode>) => void;
  deleteContact: (id: string) => void;
  addKasbon: (kasbon: Omit<KasbonNode, 'id' | 'remainingAmount' | 'status' | 'payments'>) => void;
  payKasbon: (kasbonId: string, amount: number, walletId: string) => void;
  deleteKasbon: (kasbonId: string) => void;
  addNote: (note: Omit<NoteNode, 'id' | 'createdAt'>) => void;
  updateNote: (id: string, note: Partial<NoteNode>) => void;
  deleteNote: (id: string) => void;
  updateStoreName: (name: string) => void;
  updateStoreLogo: (url: string) => void;
  updateSubStoreName: (name: string) => void;
  updateCashierName: (cashier: string) => void;
  updateStoreAddress: (address: string) => void;
  updateAnnouncementText: (text: string) => void;
  updatePresets: (presets: TransactionPreset[]) => void;
  updateAutoTextPresets: (presets: AutoTextPreset[]) => void;
  updatePromoText: (text: string) => void;
  updateWisdomText: (text: string) => void;
  updateRotatingWordsText: (text: string) => void;
  restoreFromBackup: (backupData: string) => void;
  factoryReset: () => Promise<void>;
  resetSaldo: () => Promise<void>;
  uiTheme: string;
  uiLayout: string;
  autoResetLaciKasir: boolean;
  autoResetAsetDigital: boolean;
  setUiTheme: (theme: string) => void;
  setUiLayout: (layout: string) => void;
  setAutoResetLaciKasir: (val: boolean) => void;
  setAutoResetAsetDigital: (val: boolean) => void;
}

const mockProducts: Product[] = [];

const mockTransactions: Transaction[] = [];

const mockWallets: WalletNode[] = [
  { id: 'Bank08', name: 'Laci Kasir', balance: 0, realBalance: 0 },
  { id: 'Bank01', name: 'Bank BRI', balance: 0, realBalance: 0 },
  { id: 'Bank02', name: 'Bank BCA', balance: 0, realBalance: 0 },
  { id: 'Bank03', name: 'Bank Mandiri', balance: 0, realBalance: 0 },
  { id: 'Bank04', name: 'Seabank', balance: 0, realBalance: 0 },
  { id: 'Bank05', name: 'DANA', balance: 0, realBalance: 0 },
  { id: 'Bank06', name: 'GOPAY', balance: 0, realBalance: 0 },
  { id: 'Bank07', name: 'Shopeepay', balance: 0, realBalance: 0 },
  { id: 'Bank09', name: 'Buku Agen', balance: 0, realBalance: 0 },
  { id: 'Bank10', name: 'Order Kuota', balance: 0, realBalance: 0 },
  { id: 'Bank11', name: 'Dompet Penampung', balance: 0, realBalance: 0 }
];

const mockContacts: ContactNode[] = [];

const mockKasbons: KasbonNode[] = [];

const mockNotes: NoteNode[] = [
  {
    id: 'n-1',
    title: 'Setor Uang Kasir Sore Hari',
    content: 'Selalu setor uang tunai di laci kasir jika sudah melebihi Rp 2.000.000 ke rekening utama BRI/BCA untuk keamanan laci kasir.',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    tag: 'PENTING',
    isCompleted: false
  },
  {
    id: 'n-2',
    title: 'Sisa Kertas Thermal Bluetooh',
    content: 'Perlu beli 1 pack kertas struk thermal bluetooth ukuran 58mm untuk printer kasir di toko grosir jaya terdekat sebelum kehabisan.',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    tag: 'BELANJA',
    isCompleted: false
  },
  {
    id: 'n-3',
    title: 'Edukasi Pembayaran QRIS',
    content: 'Ingatkan pelanggan bahwa kita menerima pembayaran digital QRIS tanpa biaya tambahan/admin agar transaksi lebih tercatat rapi.',
    createdAt: new Date(Date.now()).toISOString(),
    tag: 'PELANGGAN',
    isCompleted: true
  },
  {
    id: 'n-4',
    title: 'Pembersihan Alat & Tablet POS',
    content: 'Selalu lap tablet POS kasir dan rapikan kabel charger scanner barcode setiap sebelum tutup toko.',
    createdAt: new Date(Date.now()).toISOString(),
    tag: 'OPERASIONAL',
    isCompleted: false
  }
];

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('store_products');
      if (saved) return JSON.parse(saved);
    } catch (e) { console.error(e); }
    return mockProducts;
  });
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem('store_transactions');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return mockTransactions;
  });
  const [wallets, setWallets] = useState<WalletNode[]>(() => {
    try {
      const saved = localStorage.getItem('store_wallets');
      if (saved) {
        const parsed: WalletNode[] = JSON.parse(saved);
        // Deduplicate wallets by name
        const uniqueWalletsMap = new Map<string, WalletNode>();
        let hasDuplicates = false;

        parsed.forEach(w => {
          const existing = uniqueWalletsMap.get(w.name);
          if (existing) {
            hasDuplicates = true;
            // Keep the one with higher balance
            if (w.balance > existing.balance || w.realBalance > existing.realBalance) {
              uniqueWalletsMap.set(w.name, w);
            }
          } else {
            uniqueWalletsMap.set(w.name, w);
          }
        });

        if (hasDuplicates) {
          const deduplicated = Array.from(uniqueWalletsMap.values());
          localStorage.setItem('store_wallets', JSON.stringify(deduplicated));
          return deduplicated;
        }

        return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return mockWallets;
  });
  const [contacts, setContacts] = useState<ContactNode[]>(() => {
    try {
      const saved = localStorage.getItem('store_contacts');
      if (saved) return JSON.parse(saved);
    } catch (e) { console.error(e); }
    return mockContacts;
  });
  const [kasbons, setKasbons] = useState<KasbonNode[]>(() => {
    try {
      const saved = localStorage.getItem('store_kasbons');
      if (saved) return JSON.parse(saved);
    } catch (e) { console.error(e); }
    return mockKasbons;
  });
  const [notes, setNotes] = useState<NoteNode[]>(() => {
    const saved = localStorage.getItem('store_notes');
    return saved ? JSON.parse(saved) : mockNotes;
  });

  useEffect(() => {
    const handleStorageChange = (e: any) => {
      if (e.detail?.key) {
        const key = e.detail.key;
        const rawValue = e.detail.newValue;
        try {
          if (rawValue) {
            const parsed = JSON.parse(rawValue);
            if (key === 'store_products') setProducts(parsed);
            if (key === 'store_transactions') setTransactions(parsed);
            if (key === 'store_wallets') setWallets(parsed);
            if (key === 'store_contacts') setContacts(parsed);
            if (key === 'store_kasbons') setKasbons(parsed);
            if (key === 'store_notes') setNotes(parsed);
            if (key === 'store_presets') setPresetsState(parsed);
            if (key === 'store_autotexts') setAutoTextPresetsState(parsed);
          }
        } catch(err) {}

        if (key === 'store_name') setStoreNameState(rawValue || 'KASIR CUBA');
        if (key === 'store_logo') setStoreLogoState(rawValue || '');
        if (key === 'store_subname') setSubStoreNameState(rawValue || 'Aplikasi Kasir Toko');
        if (key === 'store_cashier') setCashierNameState(rawValue || 'Kasir Satu');
        if (key === 'store_address') setStoreAddressState(rawValue || 'Jl. Contoh Alamat No. 123, Kota');
        if (key === 'store_announcement') setAnnouncementTextState(rawValue || '');
        if (key === 'store_promo_text') setPromoTextState(rawValue || '');
        if (key === 'store_wisdom_text') setWisdomTextState(rawValue || '');
        if (key === 'store_rotating_words_text') setRotatingWordsTextState(rawValue || '');
        if (key === 'ui_theme') setUiThemeState(rawValue || 'light');
        if (key === 'ui_layout') setUiLayoutState(rawValue || 'hp');
        if (key === 'auto_reset_laci_kasir') setAutoResetLaciKasirState(rawValue === 'true');
        if (key === 'auto_reset_aset_digital') setAutoResetAsetDigitalState(rawValue === 'true');
      }
    };
    window.addEventListener('firebase-storage-sync', handleStorageChange);
    return () => window.removeEventListener('firebase-storage-sync', handleStorageChange);
  }, []);

  // Settings & Configurations

  const [storeName, setStoreNameState] = useState<string>(() => {
    return localStorage.getItem('store_name') || 'KASIR CUBA';
  });
  const [storeLogo, setStoreLogoState] = useState<string>(() => {
    return localStorage.getItem('store_logo') || '';
  });
  const [subStoreName, setSubStoreNameState] = useState<string>(() => {
    return localStorage.getItem('store_subname') || 'Aplikasi Kasir Toko';
  });
  const [cashierName, setCashierNameState] = useState<string>(() => {
    return localStorage.getItem('store_cashier') || 'Kasir Satu';
  });
  const [storeAddress, setStoreAddressState] = useState<string>(() => {
    return localStorage.getItem('store_address') || 'Jl. Contoh Alamat No. 123, Kota';
  });
  const [announcementText, setAnnouncementTextState] = useState<string>(() => {
    return localStorage.getItem('store_announcement') || '✨ PROMO UTAMA HARI INI: TARIK TUNAI BEBAS BIAYA ADMIN UNTUK TRANSAKSI DI ATAS RP 1.000.000! TRANSFER ANTAR BANK CEPAT & AMAN ✨';
  });
  const [promoText, setPromoTextState] = useState<string>(() => {
    const saved = localStorage.getItem('store_promo_text');
    return saved !== null ? saved : '✨ PROMO UTAMA HARI INI: TARIK TUNAI BEBAS BIAYA ADMIN UNTUK TRANSAKSI DI ATAS RP 1.000.000! ✨';
  });
  const [wisdomText, setWisdomTextState] = useState<string>(() => {
    const saved = localStorage.getItem('store_wisdom_text');
    return saved !== null ? saved : 'Hari ini adalah hari yang luar biasa untuk melayani pelanggan dengan senyum terbaik kita! 😊';
  });
  const [rotatingWordsText, setRotatingWordsTextState] = useState<string>(() => {
    const saved = localStorage.getItem('store_rotating_words_text');
    if (saved !== null) return saved;
    return [
      'Semangat Melayani Sepenuh Hati! 💪',
      'Utamakan Seni Senyum Sapa Salam 😊',
      'Tekun & Teliti Mutasi Dana Transaksi 🔍',
      'Pastikan Selisih Buku Selalu Nol! 💵',
      'Kejujuran Membawa Berkah Kelimpahan 🌟',
      'Tarik Tunai Cepat & Transfer Aman ⚡',
      'Cek Lagi Saldo Sebelum Pelanggan Pergi 🛒',
      'Layanan Cepat, Pelanggan Puas! 👑',
      'Awali Hari Dengan Berdoa & Optimisme 🤲',
      'Sabar Menghadapi Macam-macam Antrean ⏳'
    ].join('\n');
  });
  const [presets, setPresetsState] = useState<TransactionPreset[]>(() => {
    try {
      const saved = localStorage.getItem('store_presets');
      if (saved) {
        // Parse and check if they are the old format, migrating if necessary
        const parsed: any[] = JSON.parse(saved);
        if (parsed.length > 0 && !('category' in parsed[0])) {
          // Migrate old format presets to new format
          return parsed.map((p, idx) => ({
            id: p.id || `p_${idx}`,
            category: 'ORDER KUOTA', // default fallback category
            label: p.label || 'Preset',
            nominal: p.nominal || 0,
            hargaJual: (p.nominal || 0) + (p.adminFee || 0),
            adminFee: p.adminFee || 0
          }));
        }
        return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return [
      { id: 'preset_pln20', category: 'ORDER KUOTA', label: 'PLN Token Listrik isi 20', nominal: 21850, hargaJual: 23000, adminFee: 1150 },
      { id: 'preset_pln25', category: 'ORDER KUOTA', label: 'PLN Token Listrik isi 25', nominal: 26964, hargaJual: 28000, adminFee: 1036 },
      { id: 'preset_pln50', category: 'ORDER KUOTA', label: 'PLN Token Listrik isi 50', nominal: 51850, hargaJual: 53000, adminFee: 1150 },
      { id: 'preset_pln100', category: 'ORDER KUOTA', label: 'PLN Token Listrik isi 100', nominal: 101850, hargaJual: 104000, adminFee: 2150 },
      { id: 'preset_maxim10', category: 'ORDER KUOTA', label: 'Maxim isi 10', nominal: 12387, hargaJual: 14000, adminFee: 1613 },
      { id: 'preset_maxim20', category: 'ORDER KUOTA', label: 'Maxim isi 20', nominal: 22387, hargaJual: 24000, adminFee: 1613 },
      { id: 'preset_tf100k', category: 'TRANSFER BANK', label: 'Transfer BRI 100k', nominal: 100000, hargaJual: 104000, adminFee: 4000 },
      { id: 'preset_tf500k', category: 'TRANSFER BANK', label: 'Transfer BCA 500k', nominal: 500000, hargaJual: 505000, adminFee: 5000 },
      { id: 'preset_dana50', category: 'DANA', label: 'DANA Top Up 50k', nominal: 50000, hargaJual: 52000, adminFee: 2000 },
      { id: 'preset_tt500k', category: 'TARIK TUNAI', label: 'Tarik Tunai BRI 500k', nominal: 500000, hargaJual: 51000, adminFee: 10000 }
    ];
  });

  const [autoTextPresets, setAutoTextPresetsState] = useState<AutoTextPreset[]>(() => {
    try {
      const saved = localStorage.getItem('store_autotexts');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      { id: 'auto_pln20', keterangan: 'Token listrik PLN 20', hargaModal: 21850, hargaJual: 23000 },
      { id: 'auto_pln50', keterangan: 'Token listrik PLN 50', hargaModal: 51850, hargaJual: 53000 },
      { id: 'auto_pln100', keterangan: 'Token listrik PLN 100', hargaModal: 101850, hargaJual: 104000 },
      { id: 'auto_dana50', keterangan: 'DANA Top Up 50k', hargaModal: 50000, hargaJual: 52000 },
      { id: 'auto_gopay50', keterangan: 'GOPAY Top Up 50k', hargaModal: 50000, hargaJual: 52000 }
    ];
  });

  const [uiTheme, setUiThemeState] = useState<string>(() => {
    return localStorage.getItem('ui_theme') || 'light';
  });

  const [uiLayout, setUiLayoutState] = useState<string>(() => {
    return localStorage.getItem('ui_layout') || 'hp';
  });

  const [autoResetLaciKasir, setAutoResetLaciKasirState] = useState<boolean>(() => {
    return localStorage.getItem('auto_reset_laci_kasir') === 'true';
  });

  const [autoResetAsetDigital, setAutoResetAsetDigitalState] = useState<boolean>(() => {
    return localStorage.getItem('auto_reset_aset_digital') === 'true';
  });

  React.useEffect(() => {
    localStorage.setItem('auto_reset_laci_kasir', autoResetLaciKasir.toString());
  }, [autoResetLaciKasir]);

  React.useEffect(() => {
    localStorage.setItem('auto_reset_aset_digital', autoResetAsetDigital.toString());
  }, [autoResetAsetDigital]);

  // ── AUTO RESET HARIAN ──────────────────────────────────────────────────────
  // Membaca setting dari localStorage secara langsung agar tidak bergantung
  // pada React state (menghindari stale closure di dalam setInterval).
  // Cek dijalankan:
  //   1. Satu kali saat mount (menangani kasus hari sudah berganti saat app baru dibuka)
  //   2. Setiap 60 detik selama app berjalan
  React.useEffect(() => {
    const performDailyReset = () => {
      // Baca langsung dari localStorage supaya nilai selalu fresh
      const shouldResetLaci   = localStorage.getItem('auto_reset_laci_kasir')   === 'true';
      const shouldResetDigital = localStorage.getItem('auto_reset_aset_digital') === 'true';

      // Jika kedua toggle mati, tidak perlu melakukan apa-apa
      if (!shouldResetLaci && !shouldResetDigital) return;

      // Platform-independent manual date format YYYY-MM-DD
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const today = `${year}-${month}-${day}`;

      const lastResetDate = localStorage.getItem('store_last_reset_date');

      // Jika belum pernah di-set, catat hari ini sebagai acuan pertama
      if (!lastResetDate) {
        localStorage.setItem('store_last_reset_date', today);
        return;
      }

      // Jika tanggal sudah berbeda → lakukan reset sesuai setting
      if (lastResetDate !== today) {
        setWallets(prevWallets => {
          const updatedWallets = prevWallets.map(w => {
            const isLaciKasir   = w.id === 'Bank08' || w.name === 'Laci Kasir';
            // Semua wallet SELAIN Laci Kasir dianggap Aset Digital
            const isAsetDigital = !isLaciKasir;

            if (isLaciKasir && shouldResetLaci) {
              return { ...w, balance: 0, realBalance: 0 };
            }
            if (isAsetDigital && shouldResetDigital) {
              return { ...w, balance: 0, realBalance: 0 };
            }
            return w;
          });
          localStorage.setItem('store_wallets', JSON.stringify(updatedWallets));
          return updatedWallets;
        });

        // Catat tanggal reset terakhir
        localStorage.setItem('store_last_reset_date', today);
      }
    };

    // Jalankan sekali saat mount (tangani missed reset jika app baru dibuka)
    performDailyReset();

    // Periksa setiap menit apakah hari sudah berganti
    const intervalId = setInterval(performDailyReset, 60000);

    // Untuk platform Native (Capacitor), jalankan reset harian ketika aplikasi kembali aktif/resume dari background
    let appStateListener: any = null;
    const initNativeListener = async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        const { App: CapacitorApp } = await import('@capacitor/app');
        if (Capacitor.isNativePlatform()) {
          appStateListener = await CapacitorApp.addListener('appStateChange', (state) => {
            if (state.isActive) {
              console.log('📱 App resumed, checking daily reset...');
              performDailyReset();
            }
          });
        }
      } catch (e) {
        console.warn('Capacitor App listener not available:', e);
      }
    };
    initNativeListener();

    return () => {
      clearInterval(intervalId);
      if (appStateListener) {
        appStateListener.then((listener: any) => listener.remove()).catch(() => {});
      }
    };
  // Hanya dijalankan ulang jika salah satu toggle berubah
  }, [autoResetLaciKasir, autoResetAsetDigital]);

  React.useEffect(() => {
    localStorage.setItem('ui_theme', uiTheme);
    if (uiTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [uiTheme]);

  React.useEffect(() => {
    localStorage.setItem('ui_layout', uiLayout);
  }, [uiLayout]);

  const setUiTheme = (theme: string) => {
    setUiThemeState(theme);
  };

  const setUiLayout = (layout: string) => {
    setUiLayoutState(layout);
  };

  const setAutoResetLaciKasir = (val: boolean) => {
    setAutoResetLaciKasirState(val);
  };

  const setAutoResetAsetDigital = (val: boolean) => {
    setAutoResetAsetDigitalState(val);
  };

  const updateStoreName = (name: string) => {
    setStoreNameState(name);
    localStorage.setItem('store_name', name);
  };

  const updateStoreLogo = (url: string) => {
    setStoreLogoState(url);
    localStorage.setItem('store_logo', url);
  };

  const updateSubStoreName = (name: string) => {
    setSubStoreNameState(name);
    localStorage.setItem('store_subname', name);
  };

  const updateCashierName = (cashier: string) => {
    setCashierNameState(cashier);
    localStorage.setItem('store_cashier', cashier);
  };

  const updateStoreAddress = (address: string) => {
    setStoreAddressState(address);
    localStorage.setItem('store_address', address);
  };

  const updateAnnouncementText = (text: string) => {
    setAnnouncementTextState(text);
    localStorage.setItem('store_announcement', text);
  };

  const updatePromoText = (text: string) => {
    setPromoTextState(text);
    localStorage.setItem('store_promo_text', text);
  };

  const updateWisdomText = (text: string) => {
    setWisdomTextState(text);
    localStorage.setItem('store_wisdom_text', text);
  };

  const updateRotatingWordsText = (text: string) => {
    setRotatingWordsTextState(text);
    localStorage.setItem('store_rotating_words_text', text);
  };

  const updatePresets = (updatedPresets: TransactionPreset[]) => {
    setPresetsState(updatedPresets);
    localStorage.setItem('store_presets', JSON.stringify(updatedPresets));
  };

  const updateAutoTextPresets = (updatedAutoTexts: AutoTextPreset[]) => {
    setAutoTextPresetsState(updatedAutoTexts);
    localStorage.setItem('store_autotexts', JSON.stringify(updatedAutoTexts));
  };

  const saveNotes = (updated: NoteNode[]) => {
    setNotes(updated);
    localStorage.setItem('store_notes', JSON.stringify(updated));
  };

  const saveTransactions = (updated: Transaction[]) => {
    setTransactions(updated);
    localStorage.setItem('store_transactions', JSON.stringify(updated));
  };

  const saveWallets = (updated: WalletNode[]) => {
    setWallets(updated);
    localStorage.setItem('store_wallets', JSON.stringify(updated));
  };

  const addNote = (newNote: Omit<NoteNode, 'id' | 'createdAt'>) => {
    const note: NoteNode = {
      ...newNote,
      id: `n-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    saveNotes([note, ...notes]);
  };

  const updateNote = (id: string, updatedFields: Partial<NoteNode>) => {
    saveNotes(notes.map(n => n.id === id ? { ...n, ...updatedFields } : n));
  };

  const deleteNote = (id: string) => {
    saveNotes(notes.filter(n => n.id !== id));
  };

  // Calculate global book balance from wallets
  const balance = wallets.reduce((acc, w) => acc + w.balance, 0);

  const addProduct = (product: Product) => {
    const newProducts = [...products, product];
    setProducts(newProducts);
    localStorage.setItem('store_products', JSON.stringify(newProducts));
  };

  const updateProductStock = (id: string, quantity: number) => {
    const newProducts = products.map(p => {
      if (p.id === id) {
        return { ...p, stock: p.stock - quantity };
      }
      return p;
    });
    setProducts(newProducts);
    localStorage.setItem('store_products', JSON.stringify(newProducts));
  };

  const updateWalletBalance = (walletId: string, amount: number) => {
    setWallets(prev => {
      const updated = prev.map(w => w.id === walletId ? { ...w, balance: w.balance + amount } : w);
      localStorage.setItem('store_wallets', JSON.stringify(updated));
      return updated;
    });
  };
  
  const updateWalletRealBalance = (walletId: string, amount: number) => {
    setWallets(prev => {
      const updated = prev.map(w => w.id === walletId ? { ...w, realBalance: amount } : w);
      localStorage.setItem('store_wallets', JSON.stringify(updated));
      return updated;
    });
  };

  const updateWalletsList = (newWallets: WalletNode[]) => {
    setWallets(newWallets);
    localStorage.setItem('store_wallets', JSON.stringify(newWallets));
  };

  const addContact = (contact: Omit<ContactNode, 'id'>) => {
    const newContact: ContactNode = {
      ...contact,
      id: `c-${Math.floor(Math.random() * 10000)}`
    };
    const newContacts = [...contacts, newContact];
    setContacts(newContacts);
    localStorage.setItem('store_contacts', JSON.stringify(newContacts));
  };

  const updateContact = (id: string, updatedFields: Partial<ContactNode>) => {
    const newContacts = contacts.map(c => c.id === id ? { ...c, ...updatedFields } : c);
    setContacts(newContacts);
    localStorage.setItem('store_contacts', JSON.stringify(newContacts));
  };

  const deleteContact = (id: string) => {
    const newContacts = contacts.filter(c => c.id !== id);
    setContacts(newContacts);
    localStorage.setItem('store_contacts', JSON.stringify(newContacts));
  };

  const addKasbon = (kasbon: Omit<KasbonNode, 'id' | 'remainingAmount' | 'status' | 'payments'>) => {
    const newId = `k-${Math.floor(Math.random() * 10000)}`;
    const newRaw: KasbonNode = {
      ...kasbon,
      id: newId,
      remainingAmount: kasbon.amount,
      status: 'BELUM_LUNAS',
      payments: []
    };
    const newKasbons = [newRaw, ...kasbons];
    setKasbons(newKasbons);
    localStorage.setItem('store_kasbons', JSON.stringify(newKasbons));

    if (kasbon.walletId) {
      updateWalletBalance(kasbon.walletId, -kasbon.amount);
    }

    addTransaction(
      [],
      kasbon.amount,
      'MUTASI',
      `[KASBON BARU] ${kasbon.contactName} - ${kasbon.description}`,
      {
        category: 'KASBON',
        sourceWallet: kasbon.walletId,
        isCustomService: false
      }
    );
  };

  const payKasbon = (kasbonId: string, payAmount: number, walletId: string) => {
    const newKasbons = kasbons.map(k => {
      if (k.id === kasbonId) {
        const newRemaining = Math.max(0, k.remainingAmount - payAmount);
        const newPayments = [
          ...k.payments,
          {
            id: `p-${Math.floor(Math.random() * 10000)}`,
            amount: payAmount,
            date: new Date().toISOString(),
            walletId
          }
        ];
        const newStatus: 'LUNAS' | 'BELUM_LUNAS' = newRemaining === 0 ? 'LUNAS' : 'BELUM_LUNAS';
        return {
          ...k,
          remainingAmount: newRemaining,
          status: newStatus,
          payments: newPayments
        };
      }
      return k;
    });
    
    setKasbons(newKasbons);
    localStorage.setItem('store_kasbons', JSON.stringify(newKasbons));

    updateWalletBalance(walletId, payAmount);

    const targetKasbon = kasbons.find(k => k.id === kasbonId);
    const clientName = targetKasbon?.contactName || 'Pelanggan';

    addTransaction(
      [],
      payAmount,
      'INCOME',
      `[BAYAR KASBON] ${clientName} - Pelunasan Hutang`,
      {
        category: 'KASBON',
        targetWallet: walletId,
        isCustomService: false
      }
    );
  };

  const deleteKasbon = (kasbonId: string) => {
    const newKasbons = kasbons.filter(k => k.id !== kasbonId);
    setKasbons(newKasbons);
    localStorage.setItem('store_kasbons', JSON.stringify(newKasbons));
  };

  const addTransaction = (
    items: CartItem[], 
    total: number, 
    type: 'INCOME' | 'EXPENSE' | 'MUTASI' | 'MODAL_PAGI' | 'TAMBAH_SALDO' | 'PINDAH_SALDO', 
    description?: string, 
    options?: { 
      category?: string, 
      sourceWallet?: string, 
      targetWallet?: string, 
      adminFee?: number,
      adminNonTunai?: boolean,
      isCustomService?: boolean
    }
  ) => {
    const newTx: Transaction = {
      id: `TRX-${Math.floor(Math.random() * 10000)}`,
      date: new Date().toISOString(),
      items,
      total,
      type,
      description,
      category: options?.category,
      sourceWallet: options?.sourceWallet,
      targetWallet: options?.targetWallet,
      adminFee: options?.adminFee,
      adminNonTunai: options?.adminNonTunai
    };

    saveTransactions([newTx, ...transactions]);

    // Handle traditional inventory stock deductions
    if (items && items.length > 0) {
      items.forEach(item => {
        updateProductStock(item.id, item.quantity);
      });
    }

    if (options?.isCustomService) {
      // 1. Subtract nominal from source wallet (if it exists)
      if (options.sourceWallet) {
        updateWalletBalance(options.sourceWallet, -total);
      }
      
      // 2. Add nominal to target wallet (if it exists)
      if (options.targetWallet) {
        updateWalletBalance(options.targetWallet, total);
      }

      // 3. Coordinate business admin fee profit
      if (options.adminFee && options.adminFee > 0) {
        if (options.adminNonTunai) {
          // Non-cash admin fees go directly into the target digital wallet
          if (options.targetWallet) {
            updateWalletBalance(options.targetWallet, options.adminFee);
          } else {
            updateWalletBalance('Bank08', options.adminFee);
          }
        } else {
          // Cash admin fees go into physical cash drawer
          updateWalletBalance('Bank08', options.adminFee);
        }
      }
    } else {
      // Legacy checkout/expense flows
      if (type === 'INCOME') {
        const target = options?.targetWallet || 'Bank08'; 
        updateWalletBalance(target, total);
        if (options?.adminFee) {
          updateWalletBalance(target, options.adminFee);
        }
      } else if (type === 'EXPENSE') {
        const source = options?.sourceWallet || 'Bank08';
        updateWalletBalance(source, -total);
      } else {
        if (options?.sourceWallet) updateWalletBalance(options.sourceWallet, -total);
        if (options?.targetWallet) updateWalletBalance(options.targetWallet, total);
      }
    }
  };

  const adjustWalletForTx = (tx: Transaction, multiplier: number) => {
    const total = tx.total * multiplier;
    const adminFee = (tx.adminFee || 0) * multiplier;
    
    // Check if it's digital/transfer transaction
    const hasDigitalWallets = !!(tx.sourceWallet || tx.targetWallet);
    const isCustom = hasDigitalWallets || tx.category === 'UANG DIGITAL' || tx.category === 'TARIK TUNAI';
    
    if (isCustom) {
      if (tx.sourceWallet) {
        updateWalletBalance(tx.sourceWallet, -total);
      }
      if (tx.targetWallet) {
        updateWalletBalance(tx.targetWallet, total);
      }
      if (tx.adminFee && tx.adminFee > 0) {
        if (tx.adminNonTunai) {
          if (tx.targetWallet) {
            updateWalletBalance(tx.targetWallet, adminFee);
          } else {
            updateWalletBalance('Bank08', adminFee);
          }
        } else {
          updateWalletBalance('Bank08', adminFee);
        }
      }
    } else {
      if (tx.type === 'INCOME') {
        const target = tx.targetWallet || 'Bank08';
        updateWalletBalance(target, total);
        if (tx.adminFee) {
          updateWalletBalance(target, adminFee);
        }
      } else if (tx.type === 'EXPENSE') {
        const source = tx.sourceWallet || 'Bank08';
        updateWalletBalance(source, -total);
      } else {
        if (tx.sourceWallet) updateWalletBalance(tx.sourceWallet, -total);
        if (tx.targetWallet) updateWalletBalance(tx.targetWallet, total);
      }
    }
  };

  const editTransaction = (id: string, updatedFields: Partial<Transaction>) => {
    const oldTx = transactions.find(t => t.id === id);
    if (!oldTx) return;

    // 1. Revert previous wallet changes
    adjustWalletForTx(oldTx, -1);

    // 2. Compute the new transaction object
    const newTx: Transaction = {
      ...oldTx,
      ...updatedFields,
      total: updatedFields.total !== undefined ? updatedFields.total : oldTx.total,
      adminFee: updatedFields.adminFee !== undefined ? updatedFields.adminFee : oldTx.adminFee,
      type: updatedFields.type !== undefined ? updatedFields.type : oldTx.type,
      sourceWallet: updatedFields.sourceWallet !== undefined ? updatedFields.sourceWallet : oldTx.sourceWallet,
      targetWallet: updatedFields.targetWallet !== undefined ? updatedFields.targetWallet : oldTx.targetWallet,
      adminNonTunai: updatedFields.adminNonTunai !== undefined ? updatedFields.adminNonTunai : oldTx.adminNonTunai,
    };

    // 3. Apply the new wallet changes
    adjustWalletForTx(newTx, 1);

    // 4. Update the transactions array
    const updatedTransactions = transactions.map(t => t.id === id ? newTx : t);
    saveTransactions(updatedTransactions);
  };

  const deleteTransaction = (id: string) => {
    const oldTx = transactions.find(t => t.id === id);
    if (!oldTx) return;

    // 1. Revert wallet changes
    adjustWalletForTx(oldTx, -1);

    // 2. Remove transaction
    const updatedTransactions = transactions.filter(t => t.id !== id);
    saveTransactions(updatedTransactions);
  };

  const factoryReset = async () => {
    const uid = getCurrentUserId();
    if (uid) {
      await syncFactoryReset();
    }

    // 1. Remove all transactions, kasbons, notes
    localStorage.removeItem('store_transactions');
    localStorage.removeItem('store_kasbons');
    localStorage.removeItem('store_notes');
    
    // 2. Map wallets and reset balances
    const currentWallets = wallets || [];
    const clearedWallets = currentWallets.map(w => ({ ...w, balance: 0, realBalance: 0 }));
    localStorage.setItem('store_wallets', JSON.stringify(clearedWallets));
    
    // 3. Update React State
    setTransactions([]);
    setKasbons([]);
    setNotes([]);
    setWallets(clearedWallets);

    if (uid) {
      await pushToSupabase();
    }
  };

  const resetSaldo = async () => {
    const currentWallets = wallets || [];
    const clearedWallets = currentWallets.map(w => ({ ...w, balance: 0, realBalance: 0 }));
    localStorage.setItem('store_wallets', JSON.stringify(clearedWallets));
    
    setWallets(clearedWallets);

    const uid = getCurrentUserId();
    if (uid) {
      await pushToSupabase();
    }
  };

  const restoreFromBackup = (backupData: string) => {
    try {
      const parsed = JSON.parse(backupData);
      
      const mergeOrReplace = (key: string, data: any) => {
        if(data !== undefined) localStorage.setItem(key, JSON.stringify(data));
      };

      mergeOrReplace('store_transactions', parsed.transactions);
      mergeOrReplace('store_wallets', parsed.wallets);
      mergeOrReplace('store_products', parsed.products);
      mergeOrReplace('store_contacts', parsed.contacts);
      mergeOrReplace('store_kasbons', parsed.kasbons);
      mergeOrReplace('store_notes', parsed.notes);
      mergeOrReplace('store_presets', parsed.presets);
      
      if(parsed.storeName) localStorage.setItem('store_name', parsed.storeName);
      if(parsed.cashierName) localStorage.setItem('store_cashier', parsed.cashierName);
      if(parsed.storeAddress) localStorage.setItem('store_address', parsed.storeAddress);
      if(parsed.announcementText) localStorage.setItem('store_announcement', parsed.announcementText);
      if(parsed.promoText) localStorage.setItem('store_promo_text', parsed.promoText);
      if(parsed.wisdomText) localStorage.setItem('store_wisdom_text', parsed.wisdomText);
      
      window.location.reload();
    } catch(e) {
      alert("Format File Backup Tidak Valid!");
    }
  };

  return (
    <StoreContext.Provider value={{ 
      products, 
      transactions, 
      balance, 
      wallets, 
      contacts, 
      kasbons, 
      notes,
      storeName,
      storeLogo,
      subStoreName,
      cashierName,
      storeAddress,
      announcementText,
      presets,
      promoText,
      wisdomText,
      rotatingWordsText,
      addProduct, 
      updateProductStock, 
      addTransaction, 
      editTransaction,
      deleteTransaction,
      updateWalletBalance, 
      updateWalletRealBalance, 
      updateWalletsList,
      addContact,
      updateContact,
      deleteContact,
      addKasbon,
      payKasbon,
      deleteKasbon,
      addNote,
      updateNote,
      deleteNote,
      updateStoreName,
      updateStoreLogo,
      updateSubStoreName,
      updateCashierName,
      updateStoreAddress,
      updateAnnouncementText,
      updatePresets,
      updateAutoTextPresets,
      autoTextPresets,
      updatePromoText,
      updateWisdomText,
      updateRotatingWordsText,
      restoreFromBackup,
      factoryReset,
      resetSaldo,
      uiTheme,
      uiLayout,
      autoResetLaciKasir,
      autoResetAsetDigital,
      setUiTheme,
      setUiLayout,
      setAutoResetLaciKasir,
      setAutoResetAsetDigital
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
