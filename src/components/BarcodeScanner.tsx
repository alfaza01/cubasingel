import React, { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface BarcodeScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let html5QrCode: Html5Qrcode;
    if (scannerRef.current) {
      html5QrCode = new Html5Qrcode('reader', { 
        verbose: false,
        formatsToSupport: [
          0, // QR_CODE
          1, // AZTEC
          2, // CODABAR
          3, // CODE_39
          4, // CODE_93
          5, // CODE_128
          6, // DATA_MATRIX
          7, // MAXICODE
          8, // ITF
          9, // EAN_13
          10, // EAN_8
          11, // PDF_417
          12, // RSS_14
          13, // RSS_EXPANDED
          14, // UPC_A
          15, // UPC_E
          16, // UPC_EAN_EXTENSION
        ]
      });
      const startScanner = async () => {
        try {
          await html5QrCode.start(
            { facingMode: 'environment' },
            {
              fps: 10,
              qrbox: { width: 250, height: 100 },
            },
            (decodedText) => {
              if (decodedText) {
                // stop scanner after first successful scan to avoid duplicate scans
                html5QrCode.stop().then(() => {
                  onScan(decodedText);
                  onClose();
                }).catch((err) => {
                  console.error('Failed to stop scanner.', err);
                });
              }
            },
            () => {} // ignore errors while scanning
          );
        } catch (err) {
          console.error('Error starting scanner', err);
          alert('Tidak dapat mengakses kamera. Pastikan izin kamera diberikan.');
          onClose();
        }
      };
      
      startScanner();
    }

    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(console.error);
      }
    };
  }, [onScan, onClose]);

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
        Arahkan kamera ke barcode/QR produk
      </div>
    </div>
  );
}
