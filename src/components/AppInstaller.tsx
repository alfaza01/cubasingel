import React, { useState, useEffect } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useStore } from '../context/StoreContext';

export function AppInstaller() {
  const { storeName } = useStore();
  const { showToast } = useToast();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Determine initially if PWA is installed
    const checkIfInstalled = () => {
      return window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone || (window as any).isPWAInstalled;
    };

    if (!checkIfInstalled()) {
      setIsInstallable(true);
    }
    
    // Check if prompt was caught earlier
    const existingPrompt = (window as any).deferredPrompt;
    if (existingPrompt) {
      setDeferredPrompt(existingPrompt);
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      (window as any).deferredPrompt = e;
      setIsInstallable(true);
    };

    const handlePromptCaptured = (e: any) => {
      setDeferredPrompt(e.detail);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
      (window as any).deferredPrompt = null;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('pwa-prompt-captured', handlePromptCaptured);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('pwa-install-completed', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('pwa-prompt-captured', handlePromptCaptured);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('pwa-install-completed', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    const promptEvent = deferredPrompt || (window as any).deferredPrompt;
    
    if (!promptEvent) {
      showToast('Tombol instalasi belum siap. Buka aplikasi ini di browser tab baru (bukan di dalam frame Studio) atau Anda mungkin menggunakan iPhone/Incognito.', 'warning');
      return;
    }
    
    try {
      promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstallable(false);
        setDeferredPrompt(null);
        (window as any).deferredPrompt = null;
        showToast('Instalasi berhasil, periksa layar beranda Anda.', 'success');
      } else {
        showToast('Instalasi dibatalkan.', 'info');
      }
    } catch (e) {
      console.error(e);
      showToast('Terjadi gangguan sistem saat instalasi.', 'error');
    }
  };

  const handleUpdateApp = async () => {
    setIsRefreshing(true);
    showToast('Membersihkan cache dan memperbarui aplikasi...', 'info');
    
    // Clear cache using service worker and Cache API
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (let reg of regs) {
          if (reg.waiting) {
            reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
          await reg.unregister();
        }
      }
    } catch (err) {
      console.error('Clearing cache failed', err);
    }

    setTimeout(() => {
      // Reload with cache busting query param
      const url = new URL(window.location.href);
      url.searchParams.set('clear', Date.now().toString());
      window.location.replace(url.toString());
    }, 1000);
  };

  return (
    <div className="space-y-3">
      {isInstallable && (
        <button
          onClick={handleInstallClick}
          className="w-full group/install flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 text-left active:scale-[0.98] select-none cursor-pointer bg-gradient-to-r from-blue-50/70 to-indigo-50/40 hover:from-blue-50 hover:to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/10 dark:hover:from-blue-950/30 dark:hover:to-indigo-950/20 text-slate-750 dark:text-slate-200 border-blue-100/80 dark:border-blue-900/40 shadow-sm hover:shadow-md"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-550 bg-blue-500/10 dark:bg-blue-500/20 text-blue-650 dark:text-blue-400 group-hover/install:scale-105 group-hover/install:bg-blue-500/20">
              <Download size={16} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0">
              <span className="block font-black text-slate-900 dark:text-white text-[11px] uppercase tracking-wider">
                Install Aplikasi
              </span>
              <span className="block text-[8.5px] text-slate-500 dark:text-slate-400 mt-1 font-semibold leading-none truncate">
                Pasang PWA {storeName || 'Kasir Cuba'}
              </span>
            </div>
          </div>
        </button>
      )}

      <button
        onClick={handleUpdateApp}
        disabled={isRefreshing}
        className={`w-full group/upd flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 text-left active:scale-[0.98] select-none cursor-pointer ${
          isRefreshing
            ? 'bg-slate-50 dark:bg-slate-800/50 text-slate-400 border-slate-200 dark:border-slate-700/80 shadow-inner'
            : 'bg-gradient-to-r from-emerald-50/70 to-teal-50/40 hover:from-emerald-50 hover:to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/10 dark:hover:from-emerald-950/30 dark:hover:to-teal-950/20 text-slate-750 dark:text-slate-200 border-emerald-100/80 dark:border-emerald-900/40 shadow-sm hover:shadow-md'
        }`}
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-550 ${
            isRefreshing 
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-400' 
              : 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-650 dark:text-emerald-400 group-hover/upd:rotate-180 group-hover/upd:scale-105'
          }`}>
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : 'text-emerald-600 dark:text-emerald-400'} />
          </div>
          <div className="min-w-0">
            <span className="block font-black text-slate-900 dark:text-white text-[11px] uppercase tracking-wider">
              {isRefreshing ? 'Menyinkronkan...' : 'Perbaharui Aplikasi'}
            </span>
            <span className="block text-[8.5px] text-slate-500 dark:text-slate-400 mt-1 font-semibold leading-none truncate">
              {isRefreshing ? 'Membersihkan cache...' : 'Muat versi terbaru & bersihkan cache'}
            </span>
          </div>
        </div>
        {!isRefreshing && (
          <span className="relative flex h-2 w-2 shrink-0 ml-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        )}
      </button>
    </div>
  );
}
