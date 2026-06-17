import { supabase } from './supabase';

let currentUserId: string | null = null;
let originalSetItem: typeof localStorage.setItem | null = null;
let syncTimeout: any = null;
let pendingSync = new Set<string>();

export async function initStorageSync(uid: string) {
  if (currentUserId === uid) return;
  currentUserId = uid;

  console.log('⚡ Initializing Supabase sync for user:', uid);

  // 1. PULL DATA FROM SUPABASE
  await pullFromSupabase(uid);

  // 2. INTERCEPT LOCALSTORAGE FOR PUSH
  if (!originalSetItem) {
    originalSetItem = localStorage.setItem.bind(localStorage);
    localStorage.setItem = function(key: string, value: string) {
      originalSetItem!(key, value);
      
      const syncKeys = [
        'store_transactions', 'store_products', 'store_wallets', 
        'store_contacts', 'store_kasbons', 'store_notes', 
        'store_presets', 'store_autotexts'
      ];
      const settingKeys = [
        'store_name', 'store_logo', 'store_subname', 'store_cashier', 'store_address',
        'store_announcement', 'store_promo_text', 'store_wisdom_text',
        'store_rotating_words_text', 'ui_theme', 'ui_layout', 'auto_reset_laci_kasir'
      ];

      if (syncKeys.includes(key) || settingKeys.includes(key)) {
        pendingSync.add(key);
        schedulePush();
      }
    };
  }
}

function schedulePush() {
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(() => {
    pushToSupabase();
  }, 2000); // 2 seconds debounce
}

async function pushToSupabase() {
  if (!currentUserId || pendingSync.size === 0) return;
  const keysToSync = Array.from(pendingSync);
  pendingSync.clear();

  for (const key of keysToSync) {
    try {
      const rawValue = localStorage.getItem(key);
      if (!rawValue) continue;

      if (key === 'store_transactions') {
        const items = JSON.parse(rawValue);
        const mapped = items.map((tx: any) => ({
          id: tx.id,
          user_id: currentUserId,
          date: tx.date,
          items: tx.items || [],
          total: tx.total,
          type: tx.type,
          description: tx.description,
          category: tx.category,
          source_wallet: tx.sourceWallet,
          target_wallet: tx.targetWallet,
          admin_fee: tx.adminFee,
          admin_non_tunai: tx.adminNonTunai
        }));
        await supabase.from('transactions').upsert(mapped);
      } else if (key === 'store_products') {
        const items = JSON.parse(rawValue);
        const mapped = items.map((p: any) => ({
          id: p.id,
          user_id: currentUserId,
          name: p.name,
          price: p.price,
          stock: p.stock,
          category: p.category,
          image_url: p.imageUrl
        }));
        await supabase.from('products').upsert(mapped);
      } else if (key === 'store_wallets') {
        const items = JSON.parse(rawValue);
        const mapped = items.map((w: any) => ({
          id: w.id,
          user_id: currentUserId,
          name: w.name,
          balance: w.balance,
          real_balance: w.realBalance,
          icon: w.icon,
          is_hidden: w.isHidden
        }));
        await supabase.from('wallets').upsert(mapped);
      } else if (key === 'store_contacts') {
        const items = JSON.parse(rawValue);
        const mapped = items.map((c: any) => ({
          id: c.id,
          user_id: currentUserId,
          name: c.name,
          phone: c.phone,
          bank_name: c.bankName,
          account_number: c.accountNumber,
          type: c.type,
          notes: c.notes
        }));
        await supabase.from('contacts').upsert(mapped);
      } else if (key === 'store_kasbons') {
        const items = JSON.parse(rawValue);
        const mapped = items.map((k: any) => ({
          id: k.id,
          user_id: currentUserId,
          contact_id: k.contactId || null,
          contact_name: k.contactName,
          amount: k.amount,
          remaining_amount: k.remainingAmount,
          description: k.description,
          date: k.date,
          status: k.status,
          wallet_id: k.walletId,
          payments: k.payments || []
        }));
        await supabase.from('kasbons').upsert(mapped);
      } else if (key === 'store_notes') {
        const items = JSON.parse(rawValue);
        const mapped = items.map((n: any) => ({
          id: n.id,
          user_id: currentUserId,
          title: n.title,
          content: n.content,
          tag: n.tag,
          is_completed: n.isCompleted
        }));
        await supabase.from('notes').upsert(mapped);
      } else if (key === 'store_presets') {
        const items = JSON.parse(rawValue);
        const mapped = items.map((p: any) => ({
          id: p.id,
          user_id: currentUserId,
          category: p.category,
          label: p.label,
          nominal: p.nominal,
          harga_jual: p.hargaJual,
          admin_fee: p.adminFee
        }));
        await supabase.from('presets').upsert(mapped);
      } else if (key === 'store_autotexts') {
        const items = JSON.parse(rawValue);
        const mapped = items.map((a: any) => ({
          id: a.id,
          user_id: currentUserId,
          keterangan: a.keterangan,
          harga_modal: a.hargaModal,
          harga_jual: a.hargaJual
        }));
        await supabase.from('autotexts').upsert(mapped);
      } else {
        // Settings push
        const payload: any = { user_id: currentUserId };
        if (key === 'store_name') payload.store_name = rawValue;
        if (key === 'store_logo') payload.store_logo = rawValue;
        if (key === 'store_subname') payload.sub_store_name = rawValue;
        if (key === 'store_cashier') payload.cashier_name = rawValue;
        if (key === 'store_address') payload.store_address = rawValue;
        if (key === 'store_announcement') payload.announcement_text = rawValue;
        if (key === 'store_promo_text') payload.promo_text = rawValue;
        if (key === 'store_wisdom_text') payload.wisdom_text = rawValue;
        if (key === 'store_rotating_words_text') payload.rotating_words_text = rawValue;
        if (key === 'ui_theme') payload.ui_theme = rawValue;
        if (key === 'ui_layout') payload.ui_layout = rawValue;
        if (key === 'auto_reset_laci_kasir') payload.auto_reset_laci_kasir = rawValue === 'true';
        
        await supabase.from('store_settings').upsert(payload);
      }
    } catch (err) {
      console.error(`Error syncing ${key} to Supabase:`, err);
    }
  }
}

async function pullFromSupabase(uid: string) {
  try {
    const notifyChange = (key: string, value: any) => {
      const strVal = typeof value === 'string' ? value : JSON.stringify(value);
      if (originalSetItem) originalSetItem(key, strVal);
      else localStorage.setItem(key, strVal);
      window.dispatchEvent(new CustomEvent('firebase-storage-sync', { detail: { key, newValue: strVal } }));
    };

    // Pull Transactions
    const { data: txs } = await supabase.from('transactions').select('*').eq('user_id', uid);
    if (txs && txs.length > 0) {
      notifyChange('store_transactions', txs.map(tx => ({
        id: tx.id, date: tx.date, items: tx.items, total: tx.total, type: tx.type, 
        description: tx.description, category: tx.category, sourceWallet: tx.source_wallet, 
        targetWallet: tx.target_wallet, adminFee: tx.admin_fee, adminNonTunai: tx.admin_non_tunai
      })));
    }

    // Pull Products
    const { data: prods } = await supabase.from('products').select('*').eq('user_id', uid);
    if (prods && prods.length > 0) {
      notifyChange('store_products', prods.map(p => ({
        id: p.id, name: p.name, price: p.price, stock: p.stock, category: p.category, imageUrl: p.image_url
      })));
    }

    // Pull Wallets
    const { data: wallets } = await supabase.from('wallets').select('*').eq('user_id', uid);
    if (wallets && wallets.length > 0) {
      notifyChange('store_wallets', wallets.map(w => ({
        id: w.id, name: w.name, balance: w.balance, realBalance: w.real_balance, icon: w.icon, isHidden: w.is_hidden
      })));
    }

    // Pull Kasbons
    const { data: kasbons } = await supabase.from('kasbons').select('*').eq('user_id', uid);
    if (kasbons && kasbons.length > 0) {
      notifyChange('store_kasbons', kasbons.map(k => ({
        id: k.id, contactId: k.contact_id, contactName: k.contact_name, amount: k.amount, 
        remainingAmount: k.remaining_amount, description: k.description, date: k.date, 
        status: k.status, walletId: k.wallet_id, payments: k.payments
      })));
    }

    // Pull Contacts
    const { data: contacts } = await supabase.from('contacts').select('*').eq('user_id', uid);
    if (contacts && contacts.length > 0) {
      notifyChange('store_contacts', contacts.map(c => ({
        id: c.id, name: c.name, phone: c.phone, bankName: c.bank_name, accountNumber: c.account_number, 
        type: c.type, notes: c.notes
      })));
    }

    // Pull Notes
    const { data: notes } = await supabase.from('notes').select('*').eq('user_id', uid);
    if (notes && notes.length > 0) {
      notifyChange('store_notes', notes.map(n => ({
        id: n.id, title: n.title, content: n.content, tag: n.tag, isCompleted: n.is_completed
      })));
    }

    // Pull Settings
    const { data: settings } = await supabase.from('store_settings').select('*').eq('user_id', uid).single();
    if (settings) {
      if (settings.store_name) notifyChange('store_name', settings.store_name);
      if (settings.store_logo) notifyChange('store_logo', settings.store_logo);
      if (settings.sub_store_name) notifyChange('store_subname', settings.sub_store_name);
      if (settings.cashier_name) notifyChange('store_cashier', settings.cashier_name);
      if (settings.store_address) notifyChange('store_address', settings.store_address);
      if (settings.announcement_text) notifyChange('store_announcement', settings.announcement_text);
      if (settings.promo_text) notifyChange('store_promo_text', settings.promo_text);
      if (settings.wisdom_text) notifyChange('store_wisdom_text', settings.wisdom_text);
      if (settings.rotating_words_text) notifyChange('store_rotating_words_text', settings.rotating_words_text);
      if (settings.ui_theme) notifyChange('ui_theme', settings.ui_theme);
      if (settings.ui_layout) notifyChange('ui_layout', settings.ui_layout);
      if (settings.auto_reset_laci_kasir !== null) notifyChange('auto_reset_laci_kasir', String(settings.auto_reset_laci_kasir));
    }
  } catch (err) {
    console.error('Error pulling from Supabase:', err);
  }
}

export function stopStorageSync() {
  currentUserId = null;
  if (originalSetItem) {
    localStorage.setItem = originalSetItem;
    originalSetItem = null;
  }
  if (syncTimeout) {
    clearTimeout(syncTimeout);
    syncTimeout = null;
  }
  pendingSync.clear();
}
