import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

interface LicenseContextType {
  isPro: boolean;
  isTrialActive: boolean;
  trialDaysLeft: number;
  trialExpired: boolean;
  trialStartedAt: Date | null;
  waNumber: string;
  loadingLicense: boolean;
  activateLicense: (code: string, referralCodeUsed?: string) => Promise<{ success: boolean; message: string }>;
  isAdmin: boolean;
  generateLicenseCode: (email: string) => Promise<string>;
  updateWaNumber: (num: string) => Promise<void>;
  usedLicenses: any[];
  unusedLicenses: any[];
  
  // Custom Referral System Capabilities
  referralCode: string | null;
  referralStats: any | null;
  registerReferralCode: (code: string) => Promise<{ success: boolean; message: string }>;
  requestWithdrawal: (paymentMethod: string, details: string, amount: number) => Promise<{ success: boolean; message: string }>;
  userWithdrawals: any[];
  allWithdrawals: any[];
  approveWithdrawal: (id: string, receiptNo: string) => Promise<void>;
  rejectWithdrawal: (id: string, reason: string) => Promise<void>;
  checkReferralCodeValid: (code: string) => Promise<{ valid: boolean; ownerEmail?: string }>;
  referralHistory: any[];

  // Custom Promo Config
  promoConfig: PromoConfig;
  updatePromoConfig: (config: Partial<PromoConfig>) => Promise<void>;
}

export interface PromoConfig {
  text: string;
  normalPrice: number;
  promoPrice: number;
  referralPoints: number;
  promoAplikasiText?: string;
  promoKemitraanText?: string;
  promoDiskonText?: string;
}

const LicenseContext = createContext<LicenseContextType | undefined>(undefined);

export function LicenseProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [isPro, setIsPro] = useState<boolean>(() => {
    return localStorage.getItem('kasir_is_pro') === 'true';
  });
  const [loadingLicense, setLoadingLicense] = useState(false);
  const [waNumber, setWaNumber] = useState('087824889706');

  const [usedLicenses, setUsedLicenses] = useState<any[]>([]);
  const [unusedLicenses, setUnusedLicenses] = useState<any[]>([]);

  const isAdmin = user?.email === 'alfaza00001@gmail.com' || user?.email === 'elmudzie@gmail.com';

  // Load actual license from Supabase on mount/auth
  useEffect(() => {
    if (!user) {
      if (localStorage.getItem('kasir_is_pro') !== 'true') {
         setIsPro(false);
      }
      return;
    }
    const checkLicense = async () => {
      setLoadingLicense(true);
      try {
        const { data, error } = await supabase
          .from('licenses')
          .select('*')
          .eq('used_by', user.id)
          .single();
        if (isAdmin || (!error && data)) {
          setIsPro(true);
          localStorage.setItem('kasir_is_pro', 'true');
        } else {
          setIsPro(false);
          localStorage.setItem('kasir_is_pro', 'false');
        }
        if (isAdmin) {
          const { data: allLicenses } = await supabase.from('licenses').select('*');
          if (allLicenses) {
            setUsedLicenses(allLicenses.filter(l => l.used));
            setUnusedLicenses(allLicenses.filter(l => !l.used));
          }
        }
      } catch (err) {
        console.error('Check license error', err);
      } finally {
        setLoadingLicense(false);
      }
    };
    checkLicense();
  }, [user]);

  const activateLicense = async (code: string, referralCodeUsed?: string) => {
    if (!user) return { success: false, message: 'Anda harus login terlebih dahulu.' };
    
    // Check if code is valid and unused
    const { data: license, error: fetchErr } = await supabase
      .from('licenses')
      .select('*')
      .eq('code', code)
      .single();

    if (fetchErr || !license) return { success: false, message: 'Kode lisensi tidak ditemukan.' };
    if (license.used) return { success: false, message: 'Kode lisensi sudah digunakan.' };

    // Update license as used
    const { error: updateErr } = await supabase
      .from('licenses')
      .update({
        used: true,
        used_by: user.id,
        used_by_email: user.email,
        used_at: new Date().toISOString(),
        referral_code_used: referralCodeUsed || null
      })
      .eq('code', code);

    if (updateErr) return { success: false, message: 'Gagal aktivasi lisensi.' };

    setIsPro(true);
    localStorage.setItem('kasir_is_pro', 'true');
    return { success: true, message: 'Lisensi PRO berhasil diaktifkan!' };
  };

  const generateLicenseCode = async (email: string) => {
    const code = 'CUBA-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    await supabase.from('licenses').insert([{
      code,
      assigned_email: email,
      used: false
    }]);
    
    // Optimistic UI update for admin
    if (isAdmin) {
      setUnusedLicenses(prev => [...prev, { code, assigned_email: email, used: false, id: Date.now() }]);
    }
    
    return code;
  };

  const updateWaNumber = async (num: string) => { setWaNumber(num); };
  
  const registerReferralCode = async () => ({ success: false, message: 'Not implemented.' });
  const requestWithdrawal = async () => ({ success: false, message: 'Not implemented.' });
  const approveWithdrawal = async () => {};
  const rejectWithdrawal = async () => {};
  const checkReferralCodeValid = async () => ({ valid: false });

  const [promoConfig, setPromoConfig] = useState<PromoConfig>({
    text: 'Silakan hubungi tenaga Sales/Promotor yang mengenalkan aplikasi ini kepada Anda untuk mendapatkan Kode Referral & Aktifasi.',
    normalPrice: 100000,
    promoPrice: 60000,
    referralPoints: 10000,
    promoAplikasiText: 'Beralih sekarang ke Kasir Cuba! Aplikasi pembukuan canggih untuk UMKM & Konter. Pencatatan otomatis, aman, dan dapat digunakan di berbagai perangkat! 🎉',
    promoKemitraanText: 'Peluang Usaha Tanpa Modal! Jadi mitra Kasir Cuba dan dapatkan komisi Rp 10.000 per aktivasi! Kapan lagi bisa kerja sambilan cuma share kode?',
    promoDiskonText: 'Dapatkan diskon khusus! Beli lisensi pro Kasir Cuba hanya Rp 60.000 dengan kode promo saya. Daftar sekarang sebelum kehabisan!'
  });

  const updatePromoConfig = async (config: Partial<PromoConfig>) => {
    setPromoConfig(prev => ({ ...prev, ...config }));
  };

  return (
    <LicenseContext.Provider value={{
      isPro,
      isTrialActive: false,
      trialDaysLeft: 0,
      trialExpired: false,
      trialStartedAt: null,
      waNumber,
      loadingLicense,
      activateLicense,
      isAdmin,
      generateLicenseCode,
      updateWaNumber,
      usedLicenses,
      unusedLicenses,
      referralCode: null,
      referralStats: null,
      registerReferralCode,
      requestWithdrawal,
      userWithdrawals: [],
      allWithdrawals: [],
      approveWithdrawal,
      rejectWithdrawal,
      checkReferralCodeValid,
      referralHistory: [],
      promoConfig,
      updatePromoConfig
    }}>
      {children}
    </LicenseContext.Provider>
  );
}

export function useLicense() {
  const context = useContext(LicenseContext);
  if (context === undefined) {
    throw new Error('useLicense must be used within a LicenseProvider');
  }
  return context;
}

