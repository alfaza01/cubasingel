import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  RefreshCw, CloudDownload, X
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

export function UpdatePrompt() {
  const { storeName } = useStore();
  // Update state
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  useEffect(() => {
    // Check for Service Worker Updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (!reg) return;
        setRegistration(reg);

        const handleUpdateFound = () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setUpdateAvailable(true);
              setShowUpdateModal(true); // Open update popup on home view instantly
            }
          });
        };

        if (reg.waiting) {
          setUpdateAvailable(true);
          setShowUpdateModal(true);
        }

        reg.addEventListener('updatefound', handleUpdateFound);

        // Periodic background update check every 15 minutes
        const updateInterval = setInterval(() => {
          reg.update().catch(err => console.debug('Background SW update failed', err));
        }, 15 * 60 * 1000);

        return () => {
          reg.removeEventListener('updatefound', handleUpdateFound);
          clearInterval(updateInterval);
        };
      });
    }

    // SW reload handler when skipWaiting completes
    let refreshing = false;
    const handleControllerChange = () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    };
    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  // --- ACTIONS ---
  const handleUpdateApp = async () => {
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      if (registration && registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      } else if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (let reg of regs) {
          if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          await reg.unregister();
        }
      }
    } catch(err) {
      console.error(err);
    }
    
    // Force a hard reload
    setTimeout(() => {
      const url = new URL(window.location.href);
      url.searchParams.set('clear', Date.now().toString());
      window.location.replace(url.toString());
    }, 500);
  };

  const dismissUpdatePrompt = () => {
    setShowUpdateModal(false);
  };

  return (
    <>
      {/* 1. NEW UPDATE NOTIFICATION POPUP (CENTER MODAL) */}
      <AnimatePresence>
        {updateAvailable && showUpdateModal && (
          <div id="pwa-update-modal-overlay" className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm pointer-events-auto" style={{ pointerEvents: 'auto' }}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-indigo-150 dark:border-slate-800 rounded-3xl p-6 shadow-2xl max-w-sm w-full text-center overflow-hidden relative pointer-events-auto"
              style={{ pointerEvents: 'auto' }}
            >
              <div className="absolute top-3 right-3">
                <button 
                  onClick={dismissUpdatePrompt}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  aria-label="Tutup"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Header Icon */}
              <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white mb-4 shadow-lg shadow-indigo-500/20 animate-pulse">
                <CloudDownload className="w-8 h-8" />
              </div>

              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">
                Pembaruan Sistem Tersedia!
              </h3>
              
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                Versi baru <strong>{storeName || 'Kasir Cuba'}</strong> telah siap untuk meningkatkan performa toko, mempercepat transaksi, dan menambah fitur keamanan.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleUpdateApp}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] text-white py-3 rounded-xl text-xs font-black uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Perbaharui Sekarang
                </button>
                <button
                  onClick={dismissUpdatePrompt}
                  className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-2.5 rounded-xl text-xs font-bold transition"
                >
                  Nanti Saja
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. FLOATING GLOWING PORTAL UPDATE ICON (If dismissed but update is still pending) */}
      <AnimatePresence>
        {updateAvailable && !showUpdateModal && (
          <motion.div
            initial={{ scale: 0, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 20 }}
            className="fixed bottom-24 sm:bottom-6 right-4 sm:right-6 z-[999]"
          >
            <button
              onClick={() => setShowUpdateModal(true)}
              className="relative group bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-650 text-white rounded-full p-3.5 shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
              title="Perbaharui Aplikasi"
            >
              <span className="absolute inset-0 rounded-full bg-indigo-500/60 animate-ping opacity-75"></span>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border border-white animate-pulse"></span>
              
              <RefreshCw className="w-5 h-5 text-white animate-spin" style={{ animationDuration: '6s' }} />
              
              <span className="absolute right-full mr-3 bg-slate-900 border border-slate-700/50 text-white text-[10px] font-bold px-2 rounded-lg py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                Update Tersedia!
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
