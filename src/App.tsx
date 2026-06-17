import { BrowserRouter, Routes, Route } from 'react-router';
import { StoreProvider } from './context/StoreContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LicenseProvider } from './context/LicenseContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Pos } from './pages/Pos';
import { Inventory } from './pages/Inventory';
import { Transaction } from './pages/Transaction';
import { History } from './pages/History';
import { Assets } from './pages/Assets';
import { Reports } from './pages/Reports';
import { Account } from './pages/Account';
import { Menu } from './pages/Menu';
import { Contacts } from './pages/Contacts';
import { Kasbon } from './pages/Kasbon';
import { Notes } from './pages/Notes';
import { CalendarView } from './pages/Calendar';
import { Nota } from './pages/Nota';
import { Kemitraan } from './pages/Kemitraan';
import VouchersWrapper from './pages/Vouchers';
import { Login } from './pages/Login';
import React, { useEffect } from 'react';
import { initStorageSync, stopStorageSync } from './lib/storageSync';
import { SplashScreen } from './components/SplashScreen';

import { FullReport } from './pages/FullReport';
import { Admin } from './pages/Admin';
import { ToastProvider } from './context/ToastContext';

function AppContent() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (user) {
      initStorageSync(user.id);
    }
    return () => {
      stopStorageSync();
    };
  }, [user]);

  if (loading) {
    return <SplashScreen />;
  }

  if (!user) {
    return <Login />;
  }

  return (
    <StoreProvider key={user.id}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="pos" element={<Pos />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="transaction" element={<Transaction />} />
            <Route path="contacts" element={<Contacts />} />
            <Route path="kasbon" element={<Kasbon />} />
            <Route path="notes" element={<Notes />} />
            <Route path="calendar" element={<CalendarView />} />
            <Route path="nota" element={<Nota />} />
            <Route path="kemitraan" element={<Kemitraan />} />
            <Route path="vouchers" element={<VouchersWrapper />} />
            <Route path="menu" element={<Menu />} />
            <Route path="history" element={<History />} />
            <Route path="assets" element={<Assets />} />
            <Route path="reports" element={<FullReport />} />
            <Route path="reports/overview" element={<Reports />} />
            <Route path="account" element={<Account />} />
            <Route path="admin" element={<Admin />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </StoreProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LicenseProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </LicenseProvider>
    </AuthProvider>
  );
}
