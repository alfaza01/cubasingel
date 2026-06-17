import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Capacitor } from '@capacitor/core';
import { BarcodeScanner as CapacitorBarcodeScanner } from '@capacitor-mlkit/barcode-scanning';

interface BarcodeScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const [isNativeScannerActive, setIsNativeScannerActive] = useState(false);

  useEffect(() => {
    let html5QrCode: Html5Qrcode;
    let scanListener: any;

    const startNativeScanner = async () => {
      try {
        // Minta izin kamera
        const status = await CapacitorBarcodeScanner.requestPermissions();
        if (status.camera !== 'granted' && status.camera !== 'prompt-with-rationale') {
          alert('Izin kamera ditolak atau tidak tersedia!');
          onClose();
          return;
        }

        // Tembuskan background html agar kamera di balik webview terlihat
        document.body.style.background = 'transparent';
        document.documentElement.style.background = 'transparent';
        const rootElement = document.getElementById('root');
        if (rootElement) rootElement.style.background = 'transparent';
        
        setIsNativeScannerActive(true);

        scanListener = await CapacitorBarcodeScanner.addListener(
          'barcodeScanned',
          async (result) => {
            if (scanListener) {
              await scanListener.remove();
            }
            await CapacitorBarcodeScanner.stopScan();
            
            // Kembalikan background seperti semula
            document.body.style.background = '';
            document.documentElement.style.background = '';
            if (rootElement) rootElement.style.background = '';
            
            if (result.barcode && result.barcode.rawValue) {
              onScan(result.barcode.rawValue);
            }
            onClose();
          }
        );

        await CapacitorBarcodeScanner.startScan();
      } catch (err) {
        console.error('Error starting native scanner', err);
        document.body.style.background = '';
        document.documentElement.style.background = '';
        const rootElement = document.getElementById('root');
        if (rootElement) rootElement.style.background = '';
        alert('Gagal memulai scanner native.');
        onClose();
      }
    };

    const startWebScanner = async () => {
      if (scannerRef.current) {
        html5QrCode = new Html5Qrcode('reader', { 
          verbose: false,
          formatsToSupport: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
        });
        try {
          await html5QrCode.start(
            { facingMode: 'environment' },
            { fps: 10, qrbox: { width: 250, height: 100 } },
            (decodedText) => {
              if (decodedText) {
                html5QrCode.stop().then(() => {
                  onScan(decodedText);
                  onClose();
                }).catch(err => console.error(err));
              }
            },
            () => {}
          );
        } catch (err) {
          console.error('Error starting web scanner', err);
          alert('Tidak dapat mengakses kamera browser. Cek izin.');
          onClose();
        }
      }
    };

    if (Capacitor.isNativePlatform()) {
      startNativeScanner();
    } else {
      startWebScanner();
    }

    return () => {
      if (Capacitor.isNativePlatform()) {
        if (scanListener && typeof scanListener.remove === 'function') {
          scanListener.remove();
        }
        CapacitorBarcodeScanner.stopScan().catch(() => {});
        document.body.style.background = '';
        document.documentElement.style.background = '';
        const rootElement = document.getElementById('root');
        if (rootElement) rootElement.style.background = '';
      } else {
        if (html5QrCode && html5QrCode.isScanning) {
          html5QrCode.stop().catch(console.error);
        }
      }
    };
  }, [onScan, onClose]);

  // Jika scanner Native sedang aktif, overlay ini akan ditampilkan di atas view kamera
  if (Capacitor.isNativePlatform() && isNativeScannerActive) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col pt-10" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
        <div className="flex justify-between items-center p-4 bg-black/70 text-white shrink-0 absolute top-0 left-0 right-0 z-10">
          <h3 className="font-bold">Scan Barcode / QR (Native)</h3>
          <button onClick={() => {
            CapacitorBarcodeScanner.stopScan().catch(() => {});
            document.body.style.background = '';
            document.documentElement.style.background = '';
            const rootElement = document.getElementById('root');
            if (rootElement) rootElement.style.background = '';
            onClose();
          }} className="bg-white/20 p-2 rounded-full w-8 h-8 flex items-center justify-center active:scale-95 transition-all">
            <i className="fa-solid fa-times text-white" />
          </button>
        </div>
        
        {/* Kotak Transparan untuk Target Scan */}
        <div className="flex-1 flex items-center justify-center pointer-events-none">
          <div className="w-[280px] h-[150px] border-4 border-emerald-500 rounded-2xl relative shadow-[0_0_0_4000px_rgba(0,0,0,0.6)]">
             <div className="absolute top-1/2 left-0 right-0 border-t-2 border-red-500/80 animate-pulse"></div>
          </div>
        </div>

        <div className="p-4 bg-black/70 text-center text-white/80 text-xs font-bold shrink-0 absolute bottom-0 left-0 right-0 z-10 tracking-widest uppercase">
          Arahkan kamera ke barcode produk
        </div>
      </div>
    );
  }

  // Fallback untuk Web Browser Scanner
  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col pt-10">
      <div className="flex justify-between items-center p-4 bg-black/50 text-white shrink-0 absolute top-0 left-0 right-0 z-10">
        <h3 className="font-bold">Scan Barcode / QR</h3>
        <button onClick={onClose} className="bg-white/20 p-2 rounded-full w-8 h-8 flex items-center justify-center">
          <i className="fa-solid fa-times text-white" />
        </button>
      </div>
      <div className="flex-1 flex flex-col justify-center bg-black">
        <div id="reader" ref={scannerRef} className="w-full max-w-sm mx-auto" />
      </div>
      <div className="p-4 bg-black/50 text-center text-white/50 text-xs shrink-0 absolute bottom-0 left-0 right-0 z-10">
        Arahkan kamera ke barcode produk
      </div>
    </div>
  );
}
