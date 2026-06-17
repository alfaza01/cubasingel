export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  imageUrl?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Transaction {
  id: string;
  date: string;
  items?: CartItem[];
  total: number;
  type: 'INCOME' | 'EXPENSE' | 'MUTASI' | 'MODAL_PAGI' | 'TAMBAH_SALDO' | 'PINDAH_SALDO';
  description?: string;
  category?: string;
  sourceWallet?: string;
  targetWallet?: string;
  adminFee?: number;
  adminNonTunai?: boolean;
}

export interface WalletNode {
  id: string;
  name: string;
  balance: number;
  realBalance?: number;
  icon?: string;
  isHidden?: boolean;
}

export interface ContactNode {
  id: string;
  name: string;
  phone: string;
  bankName?: string;
  accountNumber?: string;
  type: 'PELANGGAN' | 'AGEN' | 'SUPPLIER';
  notes?: string;
}

export interface KasbonPayment {
  id: string;
  amount: number;
  date: string;
  walletId: string;
}

export interface KasbonNode {
  id: string;
  contactId?: string;
  contactName: string;
  amount: number;
  remainingAmount: number;
  description: string;
  date: string;
  status: 'BELUM_LUNAS' | 'LUNAS';
  walletId?: string;
  payments: KasbonPayment[];
}

export interface StoreState {
  products: Product[];
  transactions: Transaction[];
  wallets: WalletNode[];
  balance: number;
  contacts: ContactNode[];
  kasbons: KasbonNode[];
  notes: NoteNode[];
}

export interface NoteNode {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  tag: 'PENTING' | 'UMUM' | 'BELANJA' | 'OPERASIONAL' | 'PELANGGAN';
  isCompleted?: boolean;
}

export interface TransactionPreset {
  id: string;
  category: string;
  label: string;
  nominal: number;
  hargaJual: number;
  adminFee?: number;
}

export interface AutoTextPreset {
  id: string;
  keterangan: string;
  hargaModal: number;
  hargaJual: number;
}

