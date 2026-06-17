import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Wifi, WifiOff, Cloud, CloudOff, CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export interface Toast {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration?: number; // duration in milliseconds
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (message: string, type: 'info' | 'success' | 'warning' | 'error', duration?: number) => void;
  dismissToast: (id: string) => void;
  isOnline: boolean;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  syncMessage: string | null;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  
  // Real-time synchronization tracking state
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const showToast = (message: string, type: 'info' | 'success' | 'warning' | 'error', duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    
    if (duration !== null && duration !== Infinity) {
      setTimeout(() => {
        dismissToast(id);
      }, duration);
    }
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Listen to network status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('Koneksi terhubung kembali. Sinkronisasi data cloud dilanjutkan.', 'success', 4000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      showToast('Koneksi terputus. Anda sekarang berada dalam mode offline.', 'warning', 10000);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Listen to custom firebase synchronization events
  useEffect(() => {
    const handleSyncEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ status: 'syncing' | 'success' | 'error'; message: string }>;
      const { status, message } = customEvent.detail;
      
      setSyncStatus(status);
      setSyncMessage(message || null);

      // We only spawn transient toasts for successes or errors as they require direct attention.
      // Syncing messages are displayed in a beautifully-designed persistent cloud synchronization widget to avoid cluttering.
      if (status === 'error') {
        showToast(message || 'Terjadi kesalahan sinkronisasi cloud.', 'error', 6000);
      } else if (status === 'success' && message && !message.includes('aktif')) {
        // Show success toasts for specific outcomes (like "1 item data baru berhasil diunggah!") style
        showToast(message, 'success', 3000);
      }
    };

    window.addEventListener('firebase-sync-status', handleSyncEvent);
    return () => {
      window.removeEventListener('firebase-sync-status', handleSyncEvent);
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast, isOnline, syncStatus, syncMessage }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Internal Toast Container Component to render alerts
function ToastContainer() {
  const { toasts, dismissToast, isOnline, syncStatus, syncMessage } = useToast();

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-rose-500" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-sky-500" />;
    }
  };

  const getBgClass = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-white dark:bg-slate-900 border-emerald-100 dark:border-emerald-950/50 shadow-emerald-500/5';
      case 'warning':
        return 'bg-white dark:bg-slate-900 border-amber-100 dark:border-amber-950/50 shadow-amber-500/5';
      case 'error':
        return 'bg-white dark:bg-slate-900 border-rose-100 dark:border-rose-950/50 shadow-rose-500/5';
      case 'info':
      default:
        return 'bg-white dark:bg-slate-900 border-sky-100 dark:border-sky-950/50 shadow-sky-500/5';
    }
  };

  return (
    <div 
      id="custom-toast-portal"
      className="fixed bottom-safe left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:top-6 md:right-6 md:bottom-auto pointer-events-none z-[9999] flex flex-col gap-3 w-full max-w-[340px] px-4 md:px-0"
    >
      {/* 1. Network Status Check indicator widget (Only when offline or recovering) */}
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="flex items-center gap-3 p-3.5 rounded-2xl border bg-rose-50/90 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30 backdrop-blur-md shadow-xl text-xs font-medium text-rose-700 dark:text-rose-300 pointer-events-auto"
        >
          <div className="bg-rose-500/10 p-2 rounded-xl">
            <WifiOff className="w-4 h-4 text-rose-600 dark:text-rose-400 animate-pulse" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-rose-800 dark:text-rose-200">Mode Offline</h4>
            <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5">Semua perubahan disimpan lokal dan disebarkan saat online.</p>
          </div>
        </motion.div>
      )}

      {/* 2. Persistent Cloud Sync Status Indicator (Beautiful, minimal indicator shown when working) */}
      <AnimatePresence>
        {syncStatus === 'syncing' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-lg pointer-events-auto text-[11px] font-medium"
          >
            <div className="relative flex items-center justify-center">
              <Cloud className="w-4 h-4 text-indigo-500" />
              <span className="absolute inline-flex h-2 w-2 rounded-full bg-indigo-400 animate-ping opacity-75"></span>
            </div>
            <div className="flex-1 text-slate-600 dark:text-slate-300">
              <p className="font-semibold text-slate-700 dark:text-slate-200">Menyinkronkan cloud...</p>
              {syncMessage && <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 truncate max-w-[220px]">{syncMessage}</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Transient Dismissable Notification List */}
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
            className={`flex items-start gap-3 p-4 rounded-2xl border shadow-xl backdrop-blur-md pointer-events-auto ${getBgClass(toast.type)}`}
          >
            <div className="mt-0.5 flex-shrink-0">
              {getIcon(toast.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-700 dark:text-slate-200 leading-relaxed break-words">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="flex-shrink-0 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full transition-colors focus:outline-none"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
