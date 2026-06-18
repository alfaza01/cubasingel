import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';

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

  // Pure Local Mock for Native Transition
  const [waNumber, setWaNumber] = useState('087824889706');

  const activateLicense = async () => ({ success: true, message: 'Offline mode active.' });
  const generateLicenseCode = async () => 'OFFLINE-CODE';
  const updateWaNumber = async (num: string) => { setWaNumber(num); };
  
  const registerReferralCode = async () => ({ success: true, message: 'Offline mode active.' });
  const requestWithdrawal = async () => ({ success: true, message: 'Offline mode active.' });
  const approveWithdrawal = async () => {};
  const rejectWithdrawal = async () => {};
  const checkReferralCodeValid = async () => ({ valid: true, ownerEmail: 'offline' });

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

  const isAdmin = user?.email === 'alfaza00001@gmail.com' || user?.email === 'elmudzie@gmail.com';

  return (
    <LicenseContext.Provider value={{
      isPro: true, // Always PRO in offline mode
      isTrialActive: false,
      trialDaysLeft: 0,
      trialExpired: false,
      trialStartedAt: null,
      waNumber,
      loadingLicense: false,
      activateLicense,
      isAdmin, // Only allow admin dashboard for specific emails
      generateLicenseCode,
      updateWaNumber,
      usedLicenses: [],
      unusedLicenses: [],
      referralCode: 'LOCAL-REF',
      referralStats: { points: 0, totalEarned: 0, totalUsed: 0, pointsWithdrawnPending: 0 },
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

