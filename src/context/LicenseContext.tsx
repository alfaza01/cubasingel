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
}

const LicenseContext = createContext<LicenseContextType | undefined>(undefined);

export function LicenseProvider({ children }: { children: ReactNode }) {
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
      isAdmin: true, // Always Admin in offline mode
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
      referralHistory: []
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

