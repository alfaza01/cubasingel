import fs from 'fs';

let content = fs.readFileSync('src/pages/Pos.tsx', 'utf8');

// 1. Add imports
if (!content.includes('import { EscPosEncoder, printViaWebBluetooth }')) {
  content = content.replace(
    "import { useState, useEffect, useMemo } from 'react';",
    "import { useState, useEffect, useMemo } from 'react';\nimport { EscPosEncoder, printViaWebBluetooth } from '../lib/escpos';"
  );
}

// 2. Add isPrinting state and handleBluetoothPrint
if (!content.includes('const [isPrinting, setIsPrinting]')) {
  const stateInsert = `  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const handleBluetoothPrint = async () => {
    if (!lastTx) return;
    try {
      setIsPrinting(true);
      const encoder = new EscPosEncoder();
      const lineWidth = 32;
      
      encoder.initialize();
      encoder.alignCenter();
      encoder.bold(true).textLine(storeName || 'KASIR CUBA').bold(false);
      encoder.textLine(storeAddress || 'Toko Anda');
      encoder.line('-', lineWidth);
      
      encoder.alignLeft();
      encoder.textLine(\`Waktu: \${new Date().toLocaleString('id-ID', { hour:'2-digit', minute:'2-digit', day:'2-digit', month:'short' })}\`);
      encoder.textLine(\`Kasir: \${kasirName}\`);
      encoder.textLine(\`TrxID: \${lastTx.id ? lastTx.id.slice(0, 8) : 'NEW'}\`);
      
      encoder.line('-', lineWidth);
      
      lastTx.items.forEach((it: any) => {
         encoder.textLine(it.name);
         const qtyPrice = \`\${it.qty}x \${fmt(it.price)}\`;
         const totalItem = fmt(it.qty * it.price);
         // simple padding
         const padLen = Math.max(1, lineWidth - qtyPrice.length - totalItem.length);
         const spaces = ' '.repeat(padLen);
         encoder.textLine(\`\${qtyPrice}\${spaces}\${totalItem}\`);
      });
      
      encoder.line('-', lineWidth);
      
      const gtLabel = 'TOTAL';
      const gtVal = fmt(lastTx.grandTotal);
      encoder.bold(true).textLine(\`\${gtLabel}\${' '.repeat(Math.max(1, lineWidth - gtLabel.length - gtVal.length))}\${gtVal}\`).bold(false);
      
      const paidLabel = 'TUNAI';
      const paidVal = fmt(lastTx.paid);
      encoder.textLine(\`\${paidLabel}\${' '.repeat(Math.max(1, lineWidth - paidLabel.length - paidVal.length))}\${paidVal}\`);
      
      const changeLabel = 'KEMBALI';
      const changeVal = fmt(lastTx.change);
      encoder.textLine(\`\${changeLabel}\${' '.repeat(Math.max(1, lineWidth - changeLabel.length - changeVal.length))}\${changeVal}\`);
      
      encoder.newline();
      encoder.alignCenter();
      encoder.textLine('Terima Kasih');
      encoder.newline().newline().newline();
      
      await printViaWebBluetooth(encoder.encode());
      alert('Struk berhasil dicetak via Web Bluetooth!');
    } catch (err: any) {
      console.error(err);
      alert(\`Gagal koneksi Bluetooth: \${err.message}\\n\\nPastikan printer dinyalakan & mendukung BLE (Bluetooth Low Energy).\`);
    } finally {
      setIsPrinting(false);
    }
  };`;
  content = content.replace("const [isFullscreen, setIsFullscreen] = useState(false);", stateInsert);
}

// 3. Replace the CETAK button in the bottom checkout drawer success state
// It is around line 837 in the old line count
const drawerPrint = `<button onClick={() => setShowPrintPreview(true)} className="flex-1 bg-blue-600 text-white font-black py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-200">
                    <i className="fa-solid fa-print" /> Cetak Struk
                  </button>`;
const newDrawerPrint = `<button onClick={() => setShowPrintPreview(true)} className="flex-1 bg-blue-600 text-white font-black py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-200">
                    <i className="fa-solid fa-receipt" /> Struk
                  </button>
                  <button onClick={handleBluetoothPrint} disabled={isPrinting} className="flex-1 bg-indigo-600 text-white font-black py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-200">
                    <i className="fa-brands fa-bluetooth" /> {isPrinting ? 'Cetak...' : 'Bluetooth'}
                  </button>`;
content = content.replace(drawerPrint, newDrawerPrint);

// 4. Replace the CETAK button in the print preview
const previewPrint = `<button onClick={() => window.print()} className="px-6 py-2.5 bg-blue-600 text-white rounded-full font-black shadow-xl flex items-center gap-2 active:scale-95">
            <i className="fa-solid fa-print"></i> CETAK
          </button>`;
const newPreviewPrint = `<div className="flex gap-2">
            <button onClick={() => window.print()} className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-full font-black shadow-xl flex items-center gap-2 active:scale-95">
              <i className="fa-solid fa-print"></i> SISTEM
            </button>
            <button onClick={handleBluetoothPrint} disabled={isPrinting} className="px-6 py-2.5 bg-blue-600 text-white rounded-full font-black shadow-xl flex items-center gap-2 active:scale-95">
              <i className="fa-brands fa-bluetooth"></i> {isPrinting ? 'Sedang Cetak...' : 'BLUETOOTH'}
            </button>
          </div>`;
content = content.replace(previewPrint, newPreviewPrint);

fs.writeFileSync('src/pages/Pos.tsx', content);
console.log('Bluetooth print added to POS');
