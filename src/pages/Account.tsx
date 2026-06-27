import React, { useState, useEffect } from 'react';
import { 
  Settings, User, Lock, Store, Save, CheckCircle2, 
  Sparkles, Radio, Printer, Sliders, Volume2, HelpCircle,
  ChevronDown, ChevronUp, Trash2, Edit2, Download, Upload, X, AlertTriangle, Key, ShieldCheck, RefreshCcw, MessageCircle,
  Type, ListPlus, Copy, Check, Megaphone, Users, Award, Gift, DollarSign, Wallet, ArrowRight, TrendingUp
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useLicense } from '../context/LicenseContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router';

export function Account() {
  const navigate = useNavigate();
  const { 
    storeName, 
    storeLogo,
    subStoreName,
    cashierName, 
    storeAddress,
    announcementText, 
    presets,
    promoText,
    wisdomText,
    updateStoreName, 
    updateStoreLogo,
    updateSubStoreName,
    updateCashierName, 
    updateStoreAddress,
    updateAnnouncementText, 
    updatePresets,
    updatePromoText,
    updateWisdomText,
    factoryReset,
    resetSaldo,
    restoreFromBackup,
    uiLayout,
    uiTheme,
    setUiLayout,
    setUiTheme,
    autoTextPresets,
    updateAutoTextPresets
  } = useStore();

  // Temporary local states for modifications
  const [localStoreName, setLocalStoreName] = useState(storeName);
  const [localStoreLogo, setLocalStoreLogo] = useState(storeLogo);
  const [localSubStoreName, setLocalSubStoreName] = useState(subStoreName);
  const [localCashierName, setLocalCashierName] = useState(cashierName);
  const [localStoreAddress, setLocalStoreAddress] = useState(storeAddress);
  const [localAnnouncement, setLocalAnnouncement] = useState(announcementText);
  const [localPresets, setLocalPresets] = useState(presets);
  const [localPromoText, setLocalPromoText] = useState(promoText);
  const [localWisdomText, setLocalWisdomText] = useState(wisdomText);

  // States for custom presets form matching the screenshot
  const [presetCategory, setPresetCategory] = useState('TRANSFER BANK');
  const [presetLabel, setPresetLabel] = useState('');
  const [presetNominal, setPresetNominal] = useState('');
  const [presetHargaJual, setPresetHargaJual] = useState('');
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);

  // States for Auto-Text settings
  const [autoTextKeterangan, setAutoTextKeterangan] = useState('');
  const [autoTextModal, setAutoTextModal] = useState('');
  const [autoTextJual, setAutoTextJual] = useState('');
  const [editingAutoId, setEditingAutoId] = useState<string | null>(null);

  const [showResetModal, setShowResetModal] = useState(false);
  const [showResetSaldoModal, setShowResetSaldoModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState("");
  const [successModal, setSuccessModal] = useState<{show: boolean, title: string, message: string}>({show: false, title: "", message: ""});
  
  const [showImportModal, setShowImportModal] = useState(false);
  const [fileToImport, setFileToImport] = useState<File | null>(null);

  // For managing which preset categories are expanded in DAFTAR PRESET OTOMATIS
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'ORDER KUOTA': true,
    'TRANSFER BANK': true,
    'DANA': true,
    'FLIP': true,
    'TARIK TUNAI': true
  });

  const toggleCategoryExpand = (cat: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [cat]: !prev[cat]
    }));
  };

  // Accordion state to show / hide categories. By default all are collapsed (false) so only titles show.
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    profile: false,
    presets: false,
    marquee: false,
    printer: false,
    license: false,
    admin: false,
    data: false,
    autotext: false,
  });

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => {
        setCopiedId(null);
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  };

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // States to handle visual feedback on successful saves
  const [saveStatusProfile, setSaveStatusProfile] = useState(false);
  const [saveStatusAnnouncement, setSaveStatusAnnouncement] = useState(false);
  const [saveStatusPresets, setSaveStatusPresets] = useState<Record<string, boolean>>({});

  // States for Native Bluetooth via Capacitor
  const [btConnected, setBtConnected] = useState(false);
  const [btConnecting, setBtConnecting] = useState(false);
  const [pairedDevices, setPairedDevices] = useState<any[]>([]);
  const [btMacAddress, setBtMacAddress] = useState<string | null>(localStorage.getItem('bluetooth_printer_mac'));
  const [isScanningBt, setIsScanningBt] = useState(false);

  // Periksa koneksi awal jika ada MAC address tersimpan
  useEffect(() => {
    if (btMacAddress && (window as any).bluetoothSerial) {
      (window as any).bluetoothSerial.isConnected(
        () => setBtConnected(true),
        () => setBtConnected(false)
      );
    } else if (btMacAddress && localStorage.getItem('use_web_bluetooth')) {
      setBtConnected(true);
    }
  }, [btMacAddress]);

  // License & Admin States
  const { user, logout } = useAuth();
  const { 
    isPro, 
    isTrialActive,
    trialDaysLeft,
    trialExpired,
    waNumber, 
    activateLicense, 
    isAdmin, 
    generateLicenseCode, 
    updateWaNumber, 
    usedLicenses, 
    unusedLicenses,
    checkReferralCodeValid,
  } = useLicense();
  
  const [licenseCodeInput, setLicenseCodeInput] = useState('');
  const [licenseMsg, setLicenseMsg] = useState({ type: '', text: '' });

  // Discount & Referral Applied Code State (Applied on purchase or token claim)
  const [appliedReferralCode, setAppliedReferralCode] = useState('');
  const [referralCodeInput, setReferralCodeInput] = useState('');
  const [referralValidationMsg, setReferralValidationMsg] = useState({ type: '', text: '' });
  const [isValidatingReferral, setIsValidatingReferral] = useState(false);
  
  const formattedWaNumber = waNumber.startsWith('0') ? '62' + waNumber.slice(1) : waNumber.startsWith('8') ? '62' + waNumber : waNumber;
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Keep local states synchronized with context updates
  useEffect(() => {
    setLocalStoreName(storeName);
  }, [storeName]);

  useEffect(() => {
    setLocalStoreLogo(storeLogo);
  }, [storeLogo]);

  useEffect(() => {
    setLocalCashierName(cashierName);
  }, [cashierName]);

  useEffect(() => {
    setLocalStoreAddress(storeAddress);
  }, [storeAddress]);

  useEffect(() => {
    setLocalAnnouncement(announcementText);
  }, [announcementText]);

  useEffect(() => {
    setLocalPromoText(promoText);
  }, [promoText]);

  useEffect(() => {
    setLocalWisdomText(wisdomText);
  }, [wisdomText]);

  useEffect(() => {
    setLocalPresets(presets);
  }, [presets]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Tentukan ukuran maksimal (misalnya 400px agar ringan)
        const MAX_SIZE = 400;
        if (width > height && width > MAX_SIZE) {
          height *= MAX_SIZE / width;
          width = MAX_SIZE;
        } else if (height > MAX_SIZE) {
          width *= MAX_SIZE / height;
          height = MAX_SIZE;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Kompres menggunakan format webp dengan kualitas 0.7 (sekitar 30-100kb saja)
          const compressedDataUrl = canvas.toDataURL('image/webp', 0.7);
          setLocalStoreLogo(compressedDataUrl);
        }
      };
      if (event.target?.result) {
        img.src = event.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleActivateLicense = async () => {
    setLicenseMsg({ type: '', text: '' });
    if (!licenseCodeInput.trim()) return;
    const res = await activateLicense(licenseCodeInput, appliedReferralCode);
    setLicenseMsg({ type: res.success ? 'success' : 'error', text: res.message });
  };

  const handleValidateReferral = async () => {
    if (!referralCodeInput.trim()) return;
    setIsValidatingReferral(true);
    setReferralValidationMsg({ type: '', text: '' });
    try {
      const res = await checkReferralCodeValid(referralCodeInput.trim());
      if (res.valid) {
        setAppliedReferralCode(referralCodeInput.trim().toUpperCase());
        setReferralValidationMsg({ 
          type: 'success', 
          text: `Kode "${referralCodeInput.trim().toUpperCase()}" Aktif! Komisi Rp 10.000 akan dikirim ke agen perujuk, dan Anda berhak atas harga promo lisensi Rp 50.000 (Potongan Rp 10.000).` 
        });
      } else {
        setAppliedReferralCode('');
        setReferralValidationMsg({ 
          type: 'error', 
          text: res.ownerEmail === 'self' 
            ? 'Anda tidak bisa memasukkan kode referral milik Anda sendiri.'
            : 'Kode referral tidak valid atau tidak terdaftar di sistem.' 
        });
      }
    } catch (err) {
      setReferralValidationMsg({ type: 'error', text: 'Gagal memverifikasi kode referral.' });
    } finally {
      setIsValidatingReferral(false);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateStoreName(localStoreName.trim() || 'KASIR CUBA');
    updateStoreLogo(localStoreLogo);
    updateSubStoreName(localSubStoreName.trim() || 'Aplikasi Kasir Toko');
    updateCashierName(localCashierName.trim() || 'Kasir Satu');
    updateStoreAddress(localStoreAddress.trim() || 'Jl. Contoh Alamat No. 123, Kota');
    setSaveStatusProfile(true);
    setTimeout(() => setSaveStatusProfile(false), 3000);
  };

  const handleSaveAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    updatePromoText(localPromoText.trim());
    updateWisdomText(localWisdomText.trim());
    
    // Also save simple announcement for backwards compatibility fallback
    const combinedText = localPromoText.trim() || localWisdomText.trim() || '✨ KASIR ONLINE ✨';
    updateAnnouncementText(combinedText);
    
    setSaveStatusAnnouncement(true);
    setTimeout(() => setSaveStatusAnnouncement(false), 3000);
  };

  const handleSavePresetSingle = (id: string) => {
    const target = localPresets.find(p => p.id === id);
    if (!target) return;

    // Validate inputs
    if (!target.label.trim()) {
      alert('Label preset tidak boleh kosong!');
      return;
    }

    // Save all presets to the context
    updatePresets(localPresets);

    // Set individual feedback state
    setSaveStatusPresets(prev => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setSaveStatusPresets(prev => ({ ...prev, [id]: false }));
    }, 3000);
  };

  // Preset update helpers
  const updatePresetField = (id: string, field: 'label' | 'nominal' | 'adminFee', value: string | number) => {
    setLocalPresets(prev => prev.map(p => {
      if (p.id === id) {
        if (field === 'label') {
          return { ...p, [field]: value as string };
        } else {
          return { ...p, [field]: Number(value) };
        }
      }
      return p;
    }));
  };

  const handleSavePresetCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!presetLabel.trim()) {
      alert('Keterangan / Nama Produk tidak boleh kosong!');
      return;
    }
    const nom = Number(presetNominal) || 0;
    const jual = Number(presetHargaJual) || 0;
    if (nom < 0 || jual < 0) {
      alert('Harga modal dan harga jual tidak boleh negatif!');
      return;
    }

    let updatedList;
    if (editingPresetId) {
      updatedList = localPresets.map(p => p.id === editingPresetId ? {
        ...p,
        category: presetCategory,
        label: presetLabel.trim(),
        nominal: nom,
        hargaJual: jual,
        adminFee: Math.max(0, jual - nom)
      } : p);
      setEditingPresetId(null);
    } {
      // It's a new preset if editingPresetId was not matched, or not set
      if (!editingPresetId) {
        const newPreset = {
          id: `preset_${Date.now()}`,
          category: presetCategory,
          label: presetLabel.trim(),
          nominal: nom,
          hargaJual: jual,
          adminFee: Math.max(0, jual - nom)
        };
        updatedList = [...localPresets, newPreset];
      } else {
        // Fallback for safety
        updatedList = localPresets.map(p => p.id === editingPresetId ? {
          ...p,
          category: presetCategory,
          label: presetLabel.trim(),
          nominal: nom,
          hargaJual: jual,
          adminFee: Math.max(0, jual - nom)
        } : p);
        setEditingPresetId(null);
      }
    }

    setLocalPresets(updatedList);
    updatePresets(updatedList);

    // Reset form
    setPresetLabel('');
    setPresetNominal('');
    setPresetHargaJual('');
  };

  const handleEditPresetCustom = (p: any) => {
    setEditingPresetId(p.id);
    setPresetCategory(p.category || 'ORDER KUOTA');
    setPresetLabel(p.label);
    setPresetNominal(p.nominal.toString());
    setPresetHargaJual((p.hargaJual || (p.nominal + (p.adminFee || 0))).toString());
    
    // Auto expand accordion if needed
    setOpenSections(prev => ({ ...prev, presets: true }));
  };

  const handleDeletePresetCustom = (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus preset ini?')) {
      const updatedList = localPresets.filter(p => p.id !== id);
      setLocalPresets(updatedList);
      updatePresets(updatedList);
    }
  };

  const handleSaveAutoText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!autoTextKeterangan.trim()) {
      alert('Keterangan tidak boleh kosong!');
      return;
    }
    const modalVal = parseFloat(autoTextModal) || 0;
    const jualVal = parseFloat(autoTextJual) || 0;

    if (modalVal < 0 || jualVal < 0) {
      alert('Harga harus bernilai positif!');
      return;
    }

    if (modalVal > jualVal) {
      alert('Harga modal tidak boleh melebihi harga jual!');
      return;
    }

    let updatedList;
    if (editingAutoId) {
      updatedList = autoTextPresets.map(item =>
        item.id === editingAutoId
          ? { ...item, keterangan: autoTextKeterangan.trim(), hargaModal: modalVal, hargaJual: jualVal }
          : item
      );
      setEditingAutoId(null);
    } else {
      updatedList = [
        ...autoTextPresets,
        {
          id: `auto_${Date.now()}`,
          keterangan: autoTextKeterangan.trim(),
          hargaModal: modalVal,
          hargaJual: jualVal
        }
      ];
    }

    updateAutoTextPresets(updatedList);
    setAutoTextKeterangan('');
    setAutoTextModal('');
    setAutoTextJual('');

    setSuccessModal({
      show: true,
      title: 'Auto-Teks Disimpan',
      message: 'Pengaturan auto-teks harga modal jual berhasil diperbarui.'
    });
  };

  const handleEditAutoText = (item: any) => {
    setEditingAutoId(item.id);
    setAutoTextKeterangan(item.keterangan);
    setAutoTextModal(item.hargaModal.toString());
    setAutoTextJual(item.hargaJual.toString());
    setOpenSections(prev => ({ ...prev, autotext: true }));
  };

  const handleDeleteAutoText = (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus auto-teks ini?')) {
      const updatedList = autoTextPresets.filter(item => item.id !== id);
      updateAutoTextPresets(updatedList);
    }
  };

  const formatK = (num: number) => {
    if (num % 1000 === 0) {
      return `${num / 1000}K`;
    } else {
      return `${(num / 1000).toFixed(3).replace(/\.?0+$/, '')}K`;
    }
  };

  // Native Bluetooth scanning and connection logic
  const requestBluetoothPermissions = (callback: () => void, errorCallback: (err: string) => void) => {
    const permissions = (window as any).cordova?.plugins?.permissions;
    if (!permissions) {
      // Not running in Cordova/Capacitor or plugin missing, just proceed
      callback();
      return;
    }
    const permsToRequest = [
      permissions.BLUETOOTH_CONNECT,
      permissions.BLUETOOTH_SCAN,
      permissions.ACCESS_FINE_LOCATION,
      permissions.ACCESS_COARSE_LOCATION
    ].filter(Boolean); // Filter out undefined if plugin doesn't have the constants

    permissions.requestPermissions(permsToRequest, (status: any) => {
      if (status.hasPermission) {
        callback();
      } else {
        // Many Android 11 devices will report false for BLUETOOTH_CONNECT (since it's A12+)
        // so we still try to proceed even if it says false, or we can just try.
        // Actually, let's just proceed regardless and let it fail gracefully.
        callback();
      }
    }, () => callback()); // On error requesting, still try to proceed
  };

  const scanBluetoothDevices = async () => {
    if ((window as any).bluetoothSerial) {
      setIsScanningBt(true);
      requestBluetoothPermissions(() => {
        (window as any).bluetoothSerial.list(
          (devices: any[]) => {
            setPairedDevices(devices);
            setIsScanningBt(false);
          },
          (error: any) => {
            alert('Gagal mengambil daftar Bluetooth (Pastikan Izin Diberikan & Bluetooth Menyala): ' + error);
            setIsScanningBt(false);
          }
        );
      }, (err) => {
        alert(err);
        setIsScanningBt(false);
      });
    } else if ((navigator as any).bluetooth) {
      try {
        setIsScanningBt(true);
        const device = await (navigator as any).bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: [
            '000018f0-0000-1000-8000-00805f9b34fb',
            'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
            '49535343-fe7d-4ae5-8fa9-9fafd205e455'
          ]
        });
        
        setBtConnected(true);
        setBtMacAddress(device.name || device.id || 'Web Bluetooth Printer');
        localStorage.setItem('bluetooth_printer_mac', device.name || device.id || 'web_bt_printer');
        localStorage.setItem('use_web_bluetooth', 'true');
        alert('Printer ' + (device.name || '') + ' berhasil dipilih!');
      } catch (error: any) {
        alert('Gagal memilih printer: ' + error.message);
      } finally {
        setIsScanningBt(false);
      }
    } else {
      alert('Bluetooth tidak didukung di perangkat atau browser ini.');
    }
  };

  const connectToBluetooth = (macAddress: string) => {
    setBtConnecting(true);
    (window as any).bluetoothSerial.connect(
      macAddress,
      () => {
        setBtConnected(true);
        setBtConnecting(false);
        setBtMacAddress(macAddress);
        localStorage.setItem('bluetooth_printer_mac', macAddress);
        alert('Printer berhasil terhubung!');
      },
      (error: any) => {
        // Fallback to connectInsecure for typical thermal printers
        (window as any).bluetoothSerial.connectInsecure(
          macAddress,
          () => {
            setBtConnected(true);
            setBtConnecting(false);
            setBtMacAddress(macAddress);
            localStorage.setItem('bluetooth_printer_mac', macAddress);
            alert('Printer berhasil terhubung (Mode Insecure)!');
          },
          (err2: any) => {
            setBtConnected(false);
            setBtConnecting(false);
            alert(`Gagal terhubung ke printer:\nNormal: ${error}\nInsecure: ${err2}`);
          }
        );
      }
    );
  };

  const disconnectBluetooth = () => {
    if ((window as any).bluetoothSerial) {
      (window as any).bluetoothSerial.disconnect(() => {
        setBtConnected(false);
        setBtMacAddress(null);
        localStorage.removeItem('bluetooth_printer_mac');
      });
    } else {
      setBtConnected(false);
      setBtMacAddress(null);
      localStorage.removeItem('bluetooth_printer_mac');
      localStorage.removeItem('use_web_bluetooth');
    }
  };

  // Helper formatting to rupiah
  const formatRupiah = (val: number) => {
    return 'Rp ' + val.toLocaleString('id-ID');
  };

  const handleExportBackup = () => {
    const backupData = {
      transactions: JSON.parse(localStorage.getItem('store_transactions') || '[]'),
      wallets: JSON.parse(localStorage.getItem('store_wallets') || '[]'),
      products: JSON.parse(localStorage.getItem('store_products') || '[]'),
      contacts: JSON.parse(localStorage.getItem('store_contacts') || '[]'),
      kasbons: JSON.parse(localStorage.getItem('store_kasbons') || '[]'),
      notes: JSON.parse(localStorage.getItem('store_notes') || '[]'),
      presets: JSON.parse(localStorage.getItem('store_presets') || '[]'),
      storeName: localStorage.getItem('store_name'),
      cashierName: localStorage.getItem('store_cashier'),
      storeAddress: localStorage.getItem('store_address'),
      announcementText: localStorage.getItem('store_announcement'),
      promoText: localStorage.getItem('store_promo_text'),
      wisdomText: localStorage.getItem('store_wisdom_text')
    };
    
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Backup_Kasir_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileToImport(file);
    setShowImportModal(true);
    // Reset file input
    e.target.value = '';
  };

  const confirmImportBackup = () => {
    if (!fileToImport) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        restoreFromBackup(content);
      }
    };
    reader.readAsText(fileToImport);
    setShowImportModal(false);
  };

  const handleFactoryReset = () => {
    setShowResetModal(true);
    setResetConfirmText("");
  };

  const confirmFactoryReset = async () => {
    if (resetConfirmText === 'HAPUS') {
      await factoryReset();
      setShowResetModal(false);
      setSuccessModal({ show: true, title: "RESET PABRIK BERHASIL", message: "Aplikasi telah dikembalikan ke kondisi awal. Semua data transaksi & catatan dihapus." });
    } else {
      alert("Teks tidak cocok. Harap ketik HAPUS huruf besar semua.");
    }
  };

  const handleResetSaldo = () => {
    setShowResetSaldoModal(true);
    setResetConfirmText("");
  };

  const confirmResetSaldo = async () => {
    if (resetConfirmText === 'NOL') {
      await resetSaldo();
      setShowResetSaldoModal(false);
      setSuccessModal({ show: true, title: "RESET SALDO BERHASIL", message: "Semua saldo aset dan laci kasir telah berhasil direset menjadi 0." });
    } else {
      alert("Teks tidak cocok. Harap ketik NOL.");
    }
  };

  return (
    <div className="p-4 bg-slate-50 dark:bg-slate-900 min-h-full pb-24 font-sans">
      {/* TITLE HERO Banner */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-50 uppercase">Pengaturan Pos</h1>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-0.5">Konfigurasi & Kustomisasi Mini ATM</p>
        </div>
        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
          <Settings size={20} className="animate-spin-slow" />
        </div>
      </div>

      {/* 0. LISENSI & PRO MODE */}
      <div id="license-settings" className="bg-gradient-to-br from-purple-800 to-purple-600 rounded-2xl shadow-xl border border-purple-400 mb-6 overflow-hidden text-white relative">
         <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute bottom-[-20%] left-[-10%] w-40 h-40 bg-purple-900/30 rounded-full blur-2xl"></div>
         </div>
         <button 
           type="button"
           onClick={() => toggleSection('license')}
           className="w-full flex flex-col items-center justify-center p-6 text-center focus:outline-none hover:bg-white/5 transition-colors cursor-pointer relative z-10"
         >
           <h2 className="text-2xl font-black text-white flex items-center justify-center gap-2 uppercase tracking-widest drop-shadow-md">
             <Key size={24} className="text-purple-300 drop-shadow-sm" /> VERSI PRO
           </h2>
           <p className="text-[10px] text-purple-200 mt-1.5 font-bold uppercase tracking-wider bg-black/20 px-3 py-1 rounded-full">Ketuk untuk Mengelola Lisensi</p>
         </button>

         {openSections.license && (
           <div className="p-5 border-t border-purple-400/30 bg-purple-900/40 relative z-10 backdrop-blur-sm">
              {isPro && !isTrialActive ? (
                 <div className="bg-white/10 rounded-2xl p-4 text-white text-center border border-white/20">
                    <ShieldCheck size={40} className="mx-auto mb-2 text-emerald-400 drop-shadow-lg" />
                    <h3 className="text-lg font-black tracking-widest uppercase mb-1">STATUS: LIFETIME PRO</h3>
                    <p className="text-[10px] font-bold opacity-90 mb-0.5">Lisensi aktif untuk akun Google:</p>
                    <p className="text-xs font-mono font-black py-1.5 px-3 bg-black/30 rounded-lg inline-block text-emerald-300">{user?.email}</p>
                 </div>
              ) : (
                 <div>
                    <div className="bg-white p-4 rounded-2xl text-center mb-4 text-slate-800">
                       <p className="text-sm font-black uppercase tracking-widest mb-1 text-purple-900">
                           {trialExpired ? 'MASA PERCOBAAN SELESAI' : isTrialActive ? 'UPGRADE KE LIFETIME PRO' : 'APLIKASI BASIC'}
                        </p>
                       <p className="text-[10.5px] text-slate-500 font-bold mb-3 leading-relaxed w-full">Beberapa fitur premium seperti Manajemen Saldo Digital sedang terkunci.</p>
                       {isTrialActive && (
                          <div className="mt-3 inline-block px-3 py-1 bg-amber-400 text-amber-955 text-[10px] font-black rounded-lg uppercase tracking-wider animate-pulse">
                             Sisa Trial: {trialDaysLeft} Hari
                          </div>
                       )}
                       
                       {/* VALIDATOR REFERRAL */}
                       <div className="mb-4 text-left bg-purple-50 p-3.5 rounded-xl border border-purple-100 shadow-inner text-slate-850">
                         <label className="block text-[9.5px] font-extrabold text-purple-800 uppercase tracking-wider mb-1">
                           Punya Kode Referral Agen? (Diskon Rp 10.000!)
                         </label>
                         <div className="flex gap-1.5 mt-1">
                           <input
                             type="text"
                             value={referralCodeInput}
                             onChange={(e) => setReferralCodeInput(e.target.value.toUpperCase())}
                             placeholder="KODE-REFERRAL"
                             disabled={!!appliedReferralCode}
                             className="w-full text-xs font-bold p-2 bg-white text-slate-850 border border-purple-200 rounded-lg outline-none focus:ring-2 focus:ring-purple-400 uppercase tracking-widest text-center"
                           />
                           {appliedReferralCode ? (
                             <button 
                               type="button"
                               onClick={() => {
                                 setAppliedReferralCode('');
                                 setReferralCodeInput('');
                                 setReferralValidationMsg({ type: '', text: '' });
                               }}
                               className="bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-[9px] px-3 rounded-lg active:scale-95 transition-all uppercase leading-none shrink-0"
                             >
                               Batal
                             </button>
                           ) : (
                             <button
                               type="button"
                               onClick={handleValidateReferral}
                               disabled={isValidatingReferral}
                               className="bg-purple-700 hover:bg-purple-800 text-white font-black text-[9px] px-3.5 rounded-lg active:scale-95 transition-all uppercase leading-none shrink-0 disabled:opacity-50"
                             >
                               {isValidatingReferral ? 'Cek...' : 'Gunakan'}
                             </button>
                           )}
                         </div>
                         {referralValidationMsg.text && (
                           <p className="text-[8.5px] font-extrabold mt-1.5 leading-snug" style={{ color: referralValidationMsg.type === 'success' ? '#047857' : '#e11d48' }}>
                             {referralValidationMsg.type === 'success' ? '✓ ' : '✗ '} {referralValidationMsg.text}
                           </p>
                         )}
                       </div>

                       <div className="inline-block px-4 py-2.5 bg-emerald-50 border-2 border-emerald-200 rounded-xl w-full">
                          <p className="text-[9px] font-black text-emerald-800 uppercase mb-0.5">
                            {appliedReferralCode ? 'Beli Lisensi PRO (Diskon Rp 10rb Aktif!):' : 'Beli Lisensi via WA:'}
                          </p>
                          <a 
                            href={appliedReferralCode 
                              ? `https://wa.me/${formattedWaNumber}?text=Halo%20saya%20tertarik%20membeli%20Lisensi%20Kasir%20PRO%20menggunakan%20kode%20referral%20[${appliedReferralCode}]%20dengan%20potongan%20diskon%2010rb.` 
                              : `https://wa.me/${formattedWaNumber}?text=Halo%20saya%20ingin%20membeli%20Lisensi%20Aplikasi%20Kasir%20PRO`
                            } 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-lg font-black font-mono text-emerald-600 drop-shadow-sm hover:text-emerald-500 transition-colors block leading-none py-1"
                          >
                            {waNumber}
                          </a>
                          <span className="block text-[9px] font-black uppercase text-emerald-700 mt-1">
                            {appliedReferralCode ? 'Harga Promo: Rp 50.000 / Lifetime!' : 'Harga Standard: Rp 60.000 / Lifetime'}
                          </span>
                       </div>
                    </div>
                    
                    <div className="space-y-3 mt-4">
                       <label className="block text-[10px] font-black text-purple-100 uppercase tracking-wider mb-1.5 focus:outline-none drop-shadow-sm">
                         {appliedReferralCode ? `Masukkan Kode PRO (Diskon Aktif: ${appliedReferralCode})` : 'Masukkan Kode Lisensi'}
                       </label>
                       <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={licenseCodeInput} 
                            onChange={(e) => setLicenseCodeInput(e.target.value.toUpperCase())}
                            className="w-full text-xs font-bold p-3 border-2 border-purple-400/50 bg-purple-950/50 rounded-xl outline-none focus:ring-4 focus:ring-purple-400 focus:border-white font-mono tracking-widest placeholder-white/30 text-white transition-all shadow-inner" 
                            placeholder="CUBA-XXXX-XXXX"
                          />
                          <button onClick={handleActivateLicense} className="bg-white text-purple-700 hover:bg-emerald-400 hover:text-emerald-950 font-black px-4 rounded-xl text-[10px] uppercase tracking-wider active:scale-95 transition-all w-28 flex items-center justify-center shadow-lg">
                            AKTIFKAN
                          </button>
                       </div>
                       {licenseMsg.text && (
                          <div className={`p-3 rounded-xl text-[10px] font-black text-center mt-3 shadow-inner border ${licenseMsg.type === 'success' ? 'bg-emerald-500/20 text-emerald-100 border-emerald-400/50' : 'bg-rose-500/20 text-rose-100 border-rose-400/50'}`}>
                             {licenseMsg.text}
                          </div>
                       )}
                    </div>
                 </div>
              )}
           </div>
         )}
      </div>

      {/* 4.6. PANEL ADMIN (Khusus Admin) */}
      {isAdmin && (
         <div id="admin-settings" className="bg-slate-900 rounded-2xl shadow-xl border border-slate-700 mb-6 overflow-hidden text-slate-100">
            <button 
              type="button"
              onClick={() => navigate('/admin')}
              className="w-full flex items-center justify-center p-4 text-center focus:outline-none hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <h2 className="text-sm font-black text-yellow-500 flex items-center gap-2.5 uppercase tracking-wider">
                <ShieldCheck size={18} className="text-yellow-400 shrink-0" /> BUKA DASHBOARD ADMIN
              </h2>
            </button>
         </div>
      )}

      {/* 1. PROFIL TOKO CARD */}
      <div id="profil-toko-settings" className="bg-white dark:bg-slate-800 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-slate-200/60 mb-4 overflow-hidden">
         <button 
           type="button"
           onClick={() => toggleSection('profile')}
           className="w-full flex items-center justify-between p-4.5 text-left focus:outline-none hover:bg-slate-50/50 transition-colors cursor-pointer"
         >
           <h2 className="text-xs font-black text-slate-850 flex items-center gap-2.5 uppercase tracking-wide">
             <Store size={15} className="text-blue-500 shrink-0" /> Profil Usaha & Kasir
           </h2>
           <div className="flex items-center gap-2">
             {saveStatusProfile && (
               <span className="text-[9px] font-black bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                 <CheckCircle2 size={10} /> TERSIMPAN!
               </span>
             )}
             {openSections.profile ? <ChevronUp size={15} className="text-slate-400 shrink-0" /> : <ChevronDown size={15} className="text-slate-400 shrink-0" />}
           </div>
         </button>
         
         {openSections.profile && (
           <div className="p-4.5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800">
             <form onSubmit={handleSaveProfile} className="space-y-4">
                
                <div className="flex flex-col items-center mb-4">
                  <div className="relative mb-2">
                    <img 
                      src={localStoreLogo || '/icons/icon-192x192.png'} 
                      alt="Logo Toko" 
                      className="w-20 h-20 rounded-full object-cover border-2 border-blue-100 dark:border-slate-700 shadow-sm bg-white"
                      onError={(e) => {
                        e.currentTarget.src = '/icons/icon-192x192.png';
                      }}
                    />
                    <label className="absolute bottom-0 right-0 bg-blue-500 text-white p-1.5 rounded-full cursor-pointer hover:bg-blue-600 shadow-md transition-colors">
                      <Upload size={12} />
                      <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                    </label>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Ketuk ikon untuk ganti logo</span>
                </div>

                <div>
                   <label className="block text-[9px] font-black text-slate-400 mb-1.5 uppercase tracking-wider">Nama Toko / Mesin</label>
                   <input 
                     type="text" 
                     value={localStoreName} 
                     onChange={(e) => setLocalStoreName(e.target.value)}
                     className="w-full text-xs font-bold p-3 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 focus:bg-white dark:bg-slate-800 transition-all text-slate-800 dark:text-slate-100" 
                     placeholder="Contoh: KASIR CUBA"
                   />
                </div>

                <div>
                   <label className="block text-[9px] font-black text-slate-400 mb-1.5 uppercase tracking-wider">Slogan / Sub Toko</label>
                   <input 
                     type="text" 
                     value={localSubStoreName} 
                     onChange={(e) => setLocalSubStoreName(e.target.value)}
                     className="w-full text-xs font-bold p-3 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 focus:bg-white dark:bg-slate-800 transition-all text-slate-800 dark:text-slate-100" 
                     placeholder="Contoh: Aplikasi Kasir Toko"
                   />
                </div>

                <div>
                   <label className="block text-[9px] font-black text-slate-400 mb-1.5 uppercase tracking-wider">Alamat Toko</label>
                   <textarea 
                     value={localStoreAddress} 
                     onChange={(e) => setLocalStoreAddress(e.target.value)}
                     rows={2}
                     className="w-full text-xs font-bold p-3 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 focus:bg-white dark:bg-slate-800 transition-all text-slate-800 dark:text-slate-100 resize-none" 
                     placeholder="Contoh: Jl. Diponegoro No. 12"
                   />
                </div>
                
                <div>
                   <label className="block text-[9px] font-black text-slate-400 mb-1.5 uppercase tracking-wider">Nama Kasir Utama</label>
                   <input 
                     type="text" 
                     value={localCashierName} 
                     onChange={(e) => setLocalCashierName(e.target.value)}
                     className="w-full text-xs font-bold p-3 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 focus:bg-white dark:bg-slate-800 transition-all text-slate-800 dark:text-slate-100" 
                     placeholder="Contoh: Kasir Satu"
                   />
                </div>

                <button 
                  type="submit" 
                  className={`w-full text-xs font-black py-3 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer
                    ${saveStatusProfile 
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20' 
                      : 'bg-[#1e293b] hover:bg-slate-800 text-white shadow-slate-900/10'
                    }
                  `}
                >
                  <Save size={13} className={saveStatusProfile ? "text-white" : "text-yellow-400"} /> 
                  {saveStatusProfile ? 'BERHASIL DISIMPAN' : 'SIMPAN DETAIL PROFIL'}
                </button>
             </form>
           </div>
         )}
      </div>

      {/* ATUR TEKS OTOMATIS */}
      <div id="autotext-settings" className="bg-white dark:bg-slate-800 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-slate-200/60 mb-4 overflow-hidden">
         <button 
           type="button"
           onClick={() => toggleSection('autotext')}
           className="w-full flex items-center justify-between p-4.5 text-left focus:outline-none hover:bg-slate-50/50 transition-colors cursor-pointer"
         >
           <h2 className="text-xs font-black text-slate-850 dark:text-slate-100 flex items-center gap-2.5 uppercase tracking-wide">
             <Type size={15} className="text-emerald-500 shrink-0" /> Atur Teks Otomatis
           </h2>
           {openSections.autotext ? <ChevronUp size={15} className="text-slate-400 shrink-0" /> : <ChevronDown size={15} className="text-slate-400 shrink-0" />}
         </button>

         {openSections.autotext && (
           <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-[#fbfbfe] dark:bg-slate-900/40 font-sans">
             <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mb-4 leading-relaxed uppercase tracking-wider">
               Membuat kolom teks otomatis untuk harga modal jual dan keterangan nya. Ketika di klik atau di cari di form utama, keterangan transaksi dan harga modal & harga jual akan terisi secara otomatis.
             </p>

             {/* FORM TAMBAH / EDIT AUTO-TEKS */}
             <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-5 shadow-[0_2px_12px_rgb(0,0,0,0.01)] mb-6">
               <div className="flex items-center gap-2 mb-4">
                 <span className="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
                 <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                   {editingAutoId ? 'EDIT AUTO-TEKS ANDA' : 'TAMBAH AUTO-TEKS BARU'}
                 </h3>
                 {editingAutoId && (
                   <button 
                     type="button" 
                     onClick={() => {
                       setEditingAutoId(null);
                       setAutoTextKeterangan('');
                       setAutoTextModal('');
                       setAutoTextJual('');
                     }} 
                     className="ml-auto text-[10px] font-bold text-rose-500 hover:underline uppercase cursor-pointer"
                   >
                     Batal Edit
                   </button>
                 )}
               </div>

               <form onSubmit={handleSaveAutoText} className="space-y-4">
                 <div>
                   <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                     Keterangan / Jurnal (Auto-Teks)
                   </label>
                   <input 
                     type="text"
                     value={autoTextKeterangan}
                     onChange={(e) => setAutoTextKeterangan(e.target.value)}
                     className="w-full text-xs font-bold p-3 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 focus:bg-white dark:focus:bg-slate-800 transition-all text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                     placeholder="Contoh: Token listrik PLN 50"
                     required
                   />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                       Harga Modal (Rp)
                     </label>
                     <input 
                       type="number"
                       value={autoTextModal}
                       onChange={(e) => setAutoTextModal(e.target.value)}
                       className="w-full text-xs font-extrabold p-3 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 focus:bg-white dark:focus:bg-slate-800 transition-all text-slate-800 dark:text-slate-100"
                       placeholder="Contoh: 50185"
                       required
                     />
                     {autoTextModal && (
                       <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 mt-1 block">
                         Preview: {formatRupiah(Number(autoTextModal))}
                       </span>
                     )}
                   </div>

                   <div>
                     <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                       Harga Jual (Rp)
                     </label>
                     <input 
                       type="number"
                       value={autoTextJual}
                       onChange={(e) => setAutoTextJual(e.target.value)}
                       className="w-full text-xs font-extrabold p-3 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 focus:bg-white dark:focus:bg-slate-800 transition-all text-slate-800 dark:text-slate-100"
                       placeholder="Contoh: 53000"
                       required
                     />
                     {autoTextJual && (
                       <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 mt-1 block">
                         Preview: {formatRupiah(Number(autoTextJual))}
                       </span>
                     )}
                   </div>
                 </div>

                 {autoTextModal && autoTextJual && Number(autoTextJual) >= Number(autoTextModal) && (
                   <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900 p-3 rounded-xl flex justify-between items-center text-xs">
                     <span className="text-slate-500 dark:text-slate-400 font-bold">Estimasi Laba per Transaksi:</span>
                     <span className="text-emerald-600 dark:text-emerald-400 font-extrabold font-mono">
                       {formatRupiah(Number(autoTextJual) - Number(autoTextModal))}
                     </span>
                   </div>
                 )}

                 <button 
                   type="submit"
                   className="w-full bg-emerald-500 hover:bg-emerald-600 active:scale-[0.99] text-white font-extrabold text-[10px] py-3.5 rounded-xl uppercase tracking-widest flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10 transition-all cursor-pointer"
                 >
                   <ListPlus size={14} />
                   {editingAutoId ? 'SIMPAN PERUBAHAN AUTO-TEKS' : 'TAMBAH TEMPLATE AUTO-TEKS'}
                 </button>
               </form>
             </div>

             {/* DAFTAR PRESET AUTO-TEKS */}
             <div>
               <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 mb-3.5 uppercase tracking-widest">
                 Daftar Auto-Teks Tersimpan ({autoTextPresets?.length || 0})
               </h4>

               {(!autoTextPresets || autoTextPresets.length === 0) ? (
                 <div className="bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-800 rounded-3xl p-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                   <Type size={28} className="mx-auto mb-2 text-slate-300 dark:text-slate-600 opacity-60" />
                   Belum ada auto-teks diatur. Gunakan form di atas untuk menambahkan template pertama Anda.
                 </div>
               ) : (
                 <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl overflow-hidden divide-y divide-slate-150 dark:divide-slate-800 shadow-[0_2px_8px_rgb(0,0,0,0.01)]">
                   {autoTextPresets.map((item) => {
                     const laba = item.hargaJual - item.hargaModal;
                     return (
                       <div key={item.id} className="p-3.5 md:p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors">
                         <div className="text-left">
                           <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{item.keterangan}</p>
                           <div className="flex flex-wrap gap-2 mt-1.5 font-mono text-[9px] font-black">
                             <span className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-md">
                               MODAL: {formatRupiah(item.hargaModal)}
                             </span>
                             <span className="bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-md">
                               JUAL: {formatRupiah(item.hargaJual)}
                             </span>
                             <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md">
                               LABA: +{formatRupiah(laba)}
                             </span>
                           </div>
                         </div>

                         <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                           <button 
                             type="button" 
                             onClick={() => handleEditAutoText(item)} 
                             className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition-all active:scale-90 cursor-pointer"
                             title="Ubah Preset"
                           >
                             <Edit2 size={13} />
                           </button>
                           <button 
                             type="button" 
                             onClick={() => handleDeleteAutoText(item.id)} 
                             className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all active:scale-90 cursor-pointer"
                             title="Hapus Preset"
                           >
                             <Trash2 size={13} />
                           </button>
                         </div>
                       </div>
                     );
                   })}
                 </div>
               )}
             </div>

           </div>
         )}
      </div>

      {/* Promotional Media & Affiliate tools moved to dedicated Kemitraan page */}

      {/* 2. INSTANT TRANSACTION PRESETS CONTROL */}
      <div id="preset-settings" className="hidden bg-white dark:bg-slate-800 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-slate-200/60 mb-4 overflow-hidden">
         <button 
           type="button"
           onClick={() => toggleSection('presets')}
           className="w-full flex items-center justify-between p-4.5 text-left focus:outline-none hover:bg-slate-50/50 transition-colors cursor-pointer"
         >
           <h2 className="text-xs font-black text-slate-850 flex items-center gap-2.5 uppercase tracking-wide">
             <Sliders size={15} className="text-blue-500 shrink-0" /> Preset Tombol Otomatis
           </h2>
           {openSections.presets ? <ChevronUp size={15} className="text-slate-400 shrink-0" /> : <ChevronDown size={15} className="text-slate-400 shrink-0" />}
         </button>

         {openSections.presets && (
           <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-[#fbfbfe]">
             
             {/* TAMBAH PRESET BARU FORM */}
             <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-5 shadow-[0_2px_12px_rgb(0,0,0,0.01)] mb-6">
               <div className="flex items-center gap-2 mb-4">
                 <span className="w-1.5 h-4 bg-purple-600 rounded-full"></span>
                 <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                   {editingPresetId ? 'EDIT PRESET ANDA' : 'TAMBAH PRESET BARU'}
                 </h3>
                 {editingPresetId && (
                   <button 
                     type="button" 
                     onClick={() => {
                       setEditingPresetId(null);
                       setPresetLabel('');
                       setPresetNominal('');
                       setPresetHargaJual('');
                     }} 
                     className="ml-auto text-[10px] font-bold text-rose-500 hover:underline uppercase cursor-pointer"
                   >
                     Batal Edit
                   </button>
                 )}
               </div>

               <form onSubmit={handleSavePresetCustom} className="space-y-4">
                 {/* KATEGORI TRANSACTION CHIPS */}
                 <div>
                   <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                     KATEGORI TRANSAKSI
                   </label>
                   <div className="flex flex-wrap gap-2">
                     {['TRANSFER BANK', 'DANA', 'FLIP', 'ORDER KUOTA', 'TARIK TUNAI'].map((cat) => {
                       const isSelected = presetCategory === cat;
                       return (
                         <button
                           key={cat}
                           type="button"
                           onClick={() => setPresetCategory(cat)}
                           className={`px-3 py-1.5 text-[9.5px] font-extrabold rounded-full border transition-all cursor-pointer select-none active:scale-95
                             ${isSelected
                               ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                               : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-900'
                             }
                           `}
                         >
                           {cat}
                         </button>
                       );
                     })}
                   </div>
                 </div>

                 {/* KETERANGAN / NAMA PRODUK */}
                 <div>
                   <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                     KETERANGAN / NAMA PRODUK
                   </label>
                   <input
                     type="text"
                     placeholder="Contoh: Token Listrik"
                     value={presetLabel || ''}
                     onChange={(e) => setPresetLabel(e.target.value)}
                     className="w-full text-xs font-bold p-3 border border-slate-200 dark:border-slate-700 bg-slate-50/50 rounded-xl outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-400 focus:bg-white dark:bg-slate-800 transition-all text-slate-800 dark:text-slate-100"
                   />
                   <p className="text-[9px] text-slate-400 font-medium mt-1 leading-normal">
                     Saat Kasir mengetik ini di "Keterangan Opsional", pilihan otomatis akan muncul.
                   </p>
                 </div>

                 {/* HARGA MODAL & HARGA JUAL */}
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                       HARGA MODAL
                     </label>
                     <div className="relative">
                       <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">Rp</span>
                       <input
                         type="number"
                         placeholder="0"
                         value={presetNominal || ''}
                         onChange={(e) => setPresetNominal(e.target.value)}
                         className="w-full text-xs font-extrabold pl-8 pr-3 py-3 border border-slate-200 dark:border-slate-700 bg-slate-50/50 rounded-xl outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-400 focus:bg-white dark:bg-slate-800 transition-all text-slate-800 dark:text-slate-100 text-left"
                       />
                     </div>
                   </div>

                   <div>
                     <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                       HARGA JUAL
                     </label>
                     <div className="relative">
                       <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">Rp</span>
                       <input
                         type="number"
                         placeholder="0"
                         value={presetHargaJual || ''}
                         onChange={(e) => setPresetHargaJual(e.target.value)}
                         className="w-full text-xs font-extrabold pl-8 pr-3 py-3 border border-slate-200 dark:border-slate-700 bg-slate-50/50 rounded-xl outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-400 focus:bg-white dark:bg-slate-800 transition-all text-slate-800 dark:text-slate-100 text-left"
                       />
                     </div>
                   </div>
                 </div>

                 {/* SIMPAN PRESET BUTTON */}
                 <button
                   type="submit"
                   className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer"
                 >
                   <Save size={14} className="text-orange-100" />
                   <span className="uppercase tracking-wider">{editingPresetId ? 'UPDATE PRESET' : 'SIMPAN PRESET'}</span>
                 </button>
               </form>
             </div>

             {/* DAFTAR PRESET OTOMATIS */}
             <div className="space-y-4">
               <div className="flex items-center gap-2 mb-3">
                 <span className="p-1 px-1.5 bg-purple-50 text-purple-600 rounded-lg text-[9px] font-black uppercase">
                   AUTO-LIST
                 </span>
                 <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                   DAFTAR PRESET OTOMATIS
                 </h3>
               </div>

               {/* Groups by Categories */}
               {['TRANSFER BANK', 'DANA', 'FLIP', 'ORDER KUOTA', 'TARIK TUNAI'].map((cat) => {
                 const catPresets = localPresets.filter(p => p.category === cat);
                 const isExpanded = expandedCategories[cat];
                 
                 return (
                   <div key={cat} className="border border-slate-150 bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm">
                     {/* Category Header */}
                     <button
                       type="button"
                       onClick={() => toggleCategoryExpand(cat)}
                       className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-slate-50/50 transition-all cursor-pointer"
                     >
                       <div className="flex items-center gap-2">
                         <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                         <span className="text-[11px] font-black text-slate-850 uppercase tracking-wide">
                           {cat}
                         </span>
                         <span className="text-[9px] font-black bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">
                           {catPresets.length} PRESET
                         </span>
                       </div>
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 dark:text-slate-300 flex items-center gap-1">
                         {isExpanded ? 'SEMBUNYIKAN' : 'TAMPILKAN'} {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                       </span>
                     </button>

                     {/* Pre-sets List under Category */}
                     {isExpanded && (
                       <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 space-y-2 max-h-[300px] overflow-y-auto">
                         {catPresets.length === 0 ? (
                           <p className="text-[10px] text-center text-slate-400 py-3 font-medium italic">
                             Belum ada preset untuk kategori {cat}
                           </p>
                         ) : (
                           catPresets.map((p) => {
                             const modalPrice = p.nominal || 0;
                             const jualPrice = p.hargaJual || (p.nominal + (p.adminFee || 0));
                             return (
                               <div key={p.id} className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl p-3 flex items-center justify-between shadow-[0_1px_3px_rgb(0,0,0,0.01)] hover:border-slate-200 dark:border-slate-700 transition-all">
                                 <div>
                                   <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
                                     {p.label}
                                   </p>
                                   <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 font-mono mt-0.5 mt-0.5">
                                     <span className="text-blue-600">M:{formatK(modalPrice)}</span>
                                     <span className="mx-1.5 opacity-50 font-sans">|</span>
                                     <span className="text-emerald-600">J:{formatK(jualPrice)}</span>
                                   </p>
                                 </div>
                                 <div className="flex items-center gap-2">
                                   <button
                                     type="button"
                                     onClick={() => handleEditPresetCustom(p)}
                                     className="p-1.5 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-all active:scale-90 cursor-pointer"
                                     title="Edit Preset"
                                   >
                                     <Edit2 size={13} />
                                   </button>
                                   <button
                                     type="button"
                                     onClick={() => handleDeletePresetCustom(p.id)}
                                     className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-all active:scale-90 cursor-pointer"
                                     title="Hapus Preset"
                                   >
                                     <Trash2 size={13} strokeWidth={2.5} />
                                   </button>
                                 </div>
                               </div>
                             );
                           })
                         )}
                       </div>
                     )}
                   </div>
                 );
               })}
             </div>
             
             <div className="mt-4 p-3.5 bg-blue-50 border border-blue-100 rounded-2xl text-[9px] font-bold text-blue-700/90 leading-relaxed">
               💡 <strong>Informasi Kerja Otomatis:</strong> Di halaman Transaksi Utama (Dashboard), ketik kata kunci produk dari preset di atas (misal sementera mengetik "PLN" atau "Maxim") pada kolom "Keterangan Jurnal", maka sistem POS akan langsung memunculkan pilihan preset tersebut untuk mengisi Modal, Jual, dan Kategori secara instan!
             </div>
           </div>
         )}
      </div>

      {/* 3. RUNNING TEXT marquee CONFIGURATION */}
      <div id="marquee-settings" className="bg-white dark:bg-slate-800 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-slate-200/60 mb-4 overflow-hidden">
         <button 
           type="button"
           onClick={() => toggleSection('marquee')}
           className="w-full flex items-center justify-between p-4.5 text-left focus:outline-none hover:bg-slate-50/50 transition-colors cursor-pointer"
         >
           <h2 className="text-xs font-black text-slate-850 flex items-center gap-2.5 uppercase tracking-wide">
             <Radio size={15} className="text-orange-500 shrink-0" /> Teks Berjalan Pengumuman (Iklan)
           </h2>
           <div className="flex items-center gap-2">
             {saveStatusAnnouncement && (
               <span className="text-[9px] font-black bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                 <CheckCircle2 size={10} /> TERSIMPAN!
               </span>
             )}
             {openSections.marquee ? <ChevronUp size={15} className="text-slate-400 shrink-0" /> : <ChevronDown size={15} className="text-slate-400 shrink-0" />}
           </div>
         </button>

         {openSections.marquee && (
           <div className="p-4.5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800">
             {/* LIVE PREVIEW SCREEN block */}
             <div className="mb-4.5 space-y-3">
               <div>
                 <p className="text-[8.5px] font-black text-slate-400 mb-1 tracking-wider uppercase">Simulasi Teks Berjalan (Dashboard Marquee)</p>
                 <div className="w-full h-9 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 shadow-inner flex items-center overflow-hidden px-4 relative">
                   <div className="w-full overflow-hidden select-none flex items-center">
                     <div className="w-max whitespace-nowrap flex-nowrap inline-flex items-center gap-4 animate-marquee text-[10px] font-bold text-slate-650 font-mono py-1">
                       {/* Teks Promo / Info */}
                       {localPromoText.trim() && (
                         <div className="flex items-center gap-2 shrink-0">
                           <div className="bg-orange-500 text-white font-extrabold text-[8px] px-1.5 py-0.5 rounded-full leading-none shrink-0 flex items-center gap-1 uppercase tracking-widest shadow-sm whitespace-nowrap">
                             <Sparkles size={8} className="text-yellow-250 animate-pulse" /> INFO
                           </div>
                           <span className="whitespace-nowrap">{localPromoText}</span>
                         </div>
                       )}
                       
                       {/* Teks Biasa Bergantian */}
                       {localWisdomText.split('\n').map(w => w.trim()).filter(w => w.length > 0).slice(0, 15).map((word, idx) => (
                         <React.Fragment key={idx}>
                           {(localPromoText.trim() || idx > 0) && (
                             <span className="text-slate-300 shrink-0 select-none">✦</span>
                           )}
                           <div className="flex items-center shrink-0">
                             <span className="whitespace-nowrap">{word}</span>
                           </div>
                         </React.Fragment>
                       ))}

                       {/* Fallback to text if both are empty */}
                       {!localPromoText.trim() && localWisdomText.trim().length === 0 && (
                         <span className="whitespace-nowrap shrink-0">Murni teks berjalan langsung tanpa logo...</span>
                       )}
                     </div>
                   </div>
                 </div>
               </div>

              </div>
             <form onSubmit={handleSaveAnnouncement} className="space-y-4">
               {/* 2-Column Inputs */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {/* Left Column: Iklan Utama */}
                 <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 rounded-2xl flex flex-col justify-between">
                   <div>
                     <div className="flex items-center gap-1.5 mb-1">
                       <span className="text-[9px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">Kolom 1: Iklan Utama (Promo)</span>
                       <span className="text-[8px] bg-orange-100 text-orange-600 px-1.5 py-0.2 rounded font-mono font-extrabold uppercase">DENGAN INFO</span>
                     </div>
                     <p className="text-[8.5px] text-slate-400 mb-2 leading-relaxed">Menampilkan badge orange <strong className="text-orange-500">"INFO"</strong> di bagian kiri teks berjalan.</p>
                   </div>
                   <textarea 
                     value={localPromoText} 
                     onChange={(e) => setLocalPromoText(e.target.value)}
                     className="w-full text-xs font-bold p-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all text-slate-800 dark:text-slate-100 min-h-[70px] resize-none" 
                     placeholder="Contoh: TARIK TUNAI BEBAS ADMIN DI ATAS RP 1.000.000!"
                   />
                 </div>

                 {/* Right Column: Teks Pendek / Kata Bijak */}
                 <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 rounded-2xl flex flex-col justify-between">
                   <div>
                     <div className="flex items-center gap-1.5 mb-1">
                       <span className="text-[9px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">Kolom 2: Teks Pengumuman Pendek / Kata Mutiara</span>
                       <span className="text-[8px] bg-slate-200 text-slate-650 px-1.5 py-0.2 rounded font-mono font-extrabold uppercase">MURNI TEKS</span>
                     </div>
                     <div className="flex justify-between items-center mb-2">
                       <p className="text-[8.5px] text-slate-400 leading-relaxed max-w-[70%]">Pisahkan kosa kata dengan tombol <kbd className="bg-slate-100 dark:bg-slate-800 px-1 border rounded text-[7px] font-mono font-bold">Enter</kbd>. Muncul bergantian di marquee.</p>
                       <span className={`text-[8.5px] font-mono font-black px-2 py-0.5 rounded-full ${localWisdomText.split('\n').filter(w => w.trim() !== '').length > 15 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-blue-100 text-blue-700'}`}>
                         {localWisdomText.split('\n').filter(w => w.trim() !== '').length} / 15 BARIS
                       </span>
                     </div>
                   </div>
                   <textarea 
                     value={localWisdomText} 
                     onChange={(e) => {
                       const lines = e.target.value.split('\n');
                       if (lines.length <= 15 || e.target.value.length < localWisdomText.length) {
                         setLocalWisdomText(e.target.value);
                       } else {
                         setLocalWisdomText(lines.slice(0, 15).join('\n'));
                       }
                     }}
                     className="w-full text-xs font-bold p-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all text-slate-800 dark:text-slate-100 min-h-[70px] resize-y" 
                     rows={5}
                     placeholder="Contoh:&#10;Melayani sepenuh hati 😊&#10;Silakan cek kembalian Anda 💵"
                   />
                 </div>
               </div>

               <button 
                 type="submit" 
                 className={`w-full text-xs font-black py-3 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer
                   ${saveStatusAnnouncement 
                     ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20' 
                     : 'bg-[#1e293b] hover:bg-slate-800 text-white shadow-slate-900/10'
                   }
                 `}
               >
                 <Save size={13} className={saveStatusAnnouncement ? "text-white" : "text-yellow-400"} /> 
                 {saveStatusAnnouncement ? 'BERHASIL DISIMPAN' : 'SIMPAN PEMBARUAN IKLAN'}
               </button>
             </form>
           </div>
         )}
      </div>

      {/* 4. BLUETOOTH PRINTER SYSTEM SIMULATOR */}
      <div id="printer-settings" className="bg-white dark:bg-slate-800 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-slate-200/60 mb-4 overflow-hidden">
         <button 
           type="button"
           onClick={() => toggleSection('printer')}
           className="w-full flex items-center justify-between p-4.5 text-left focus:outline-none hover:bg-slate-50/50 transition-colors cursor-pointer"
         >
           <h2 className="text-xs font-black text-slate-850 flex items-center gap-2.5 uppercase tracking-wide">
             <Printer size={15} className="text-slate-500 dark:text-slate-400 shrink-0" /> Koneksi Printer Bluetooth POS
           </h2>
           {openSections.printer ? <ChevronUp size={15} className="text-slate-400 shrink-0" /> : <ChevronDown size={15} className="text-slate-400 shrink-0" />}
         </button>

         {openSections.printer && (
           <div className="p-4.5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800">
              <p className="text-[9px] text-slate-400 font-bold mb-3 uppercase">Konfigurasi hardware thermal struk kasir.</p>
              <div className="space-y-3.5">
                <div className="flex flex-col gap-3 p-3 bg-slate-50/80 border border-slate-250/50 rounded-xl">
                   <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2.5">
                         <div className={`w-3 h-3 rounded-full animate-pulse ${btConnected ? 'bg-emerald-500' : btConnecting ? 'bg-amber-400' : 'bg-red-500'}`}></div>
                         <div>
                            <p className="text-[11px] font-extrabold text-slate-800 dark:text-slate-100 uppercase">PRINTER BLUETOOTH NATIVE</p>
                            <p className="text-[8px] text-slate-400 font-bold uppercase mt-0.5">
                              STATUS: {btConnected ? `TERHUBUNG (${btMacAddress})` : btConnecting ? 'MENYAMBUNGKAN...' : 'DISCONNECTED'}
                            </p>
                         </div>
                      </div>
                      <button 
                        type="button"
                        onClick={btConnected ? disconnectBluetooth : scanBluetoothDevices}
                        disabled={btConnecting || isScanningBt}
                        className={`text-[9px] font-black px-3 py-1.5 rounded-lg active:scale-95 transition-all shadow-sm cursor-pointer
                          ${btConnected 
                            ? 'bg-rose-50 border border-rose-200 text-rose-600 font-bold' 
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                          }
                        `}
                      >
                         {btConnected ? 'PUTUSKAN' : isScanningBt ? 'MENCARI...' : 'CARI PRINTER'}
                      </button>
                   </div>
                   
                   {/* Device List Container */}
                   {!btConnected && pairedDevices.length > 0 && (
                     <div className="mt-2 border-t border-slate-200 dark:border-slate-700 pt-2">
                       <p className="text-[9px] font-bold text-slate-500 mb-2">PILIH PRINTER YANG TERSEDIA:</p>
                       <div className="space-y-2 max-h-[150px] overflow-y-auto">
                         {pairedDevices.map((device) => (
                           <button
                             key={device.address}
                             onClick={() => connectToBluetooth(device.address)}
                             disabled={btConnecting}
                             className="w-full flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg hover:border-blue-400 active:bg-blue-50 transition-colors text-left"
                           >
                             <div>
                               <p className="text-[10px] font-bold text-slate-800">{device.name || 'Unknown Device'}</p>
                               <p className="text-[8px] font-mono text-slate-400">{device.address}</p>
                             </div>
                             <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded">HUBUNGKAN</span>
                           </button>
                         ))}
                       </div>
                     </div>
                   )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-[9px] text-slate-500 dark:text-slate-400 font-semibold uppercase">
                   <div className="p-2 border border-slate-150 rounded-xl bg-slate-50/30">
                      <span className="block text-[8px] text-slate-400 font-bold mb-0.5">KERAPATAN HURUF</span>
                      <span className="font-extrabold text-slate-705">32 Karakter / Baris</span>
                   </div>
                   <div className="p-2 border border-slate-150 rounded-xl bg-slate-50/30">
                      <span className="block text-[8px] text-slate-400 font-bold mb-0.5">KECEPATAN CETAK</span>
                      <span className="font-extrabold text-slate-705">90 mm / Detik</span>
                   </div>
                </div>
              </div>
           </div>
         )}
      </div>



      {/* 5. BACKUP & FACTORY RESET */}
      <div id="data-settings" className="bg-white dark:bg-slate-800 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-rose-200/60 mb-4 overflow-hidden">
         <button 
           type="button"
           onClick={() => toggleSection('data')}
           className="w-full flex items-center justify-between p-4.5 text-left focus:outline-none hover:bg-rose-50/30 transition-colors cursor-pointer"
         >
           <h2 className="text-xs font-black text-rose-850 flex items-center gap-2.5 uppercase tracking-wide">
             <Save size={15} className="text-rose-500 shrink-0" /> Pencadangan & Reset Data
           </h2>
           {openSections.data ? <ChevronUp size={15} className="text-rose-400 shrink-0" /> : <ChevronDown size={15} className="text-rose-400 shrink-0" />}
         </button>

         {openSections.data && (
           <div className="p-4.5 border-t border-rose-100 bg-rose-50/10">
              <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold mb-4 uppercase leading-relaxed max-w-[90%]">
                 Mode untuk menyimpan seluruh jurnal transaksi ke file sebagai backup, atau menghapus data ke awal pabrik.
              </p>
              
              <div className="space-y-3">
                 <button 
                    onClick={handleExportBackup}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[10px] py-3.5 rounded-xl uppercase tracking-widest flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] cursor-pointer"
                 >
                    <Download size={14} /> Download File Backup (.json)
                 </button>

                 <div>
                    <label className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] py-3.5 rounded-xl uppercase tracking-widest flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] cursor-pointer">
                      <Upload size={14} /> Upload Backup JSON
                      <input 
                        type="file" 
                        accept=".json" 
                        className="hidden" 
                        onChange={handleImportBackup} 
                      />
                    </label>
                 </div>

                 <div className="pt-3 border-t border-rose-100/50 mt-2 space-y-3">
                    <button 
                       onClick={handleResetSaldo}
                       className="w-full bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-[10px] py-3.5 rounded-xl uppercase tracking-widest flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] cursor-pointer"
                    >
                       <RefreshCcw size={14} /> Reset Saldo ke 0
                    </button>

                    <button 
                       onClick={handleFactoryReset}
                       className="w-full bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[10px] py-3.5 rounded-xl uppercase tracking-widest flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] cursor-pointer"
                    >
                       <Trash2 size={14} /> Factory Reset (Hapus Semua Data)
                    </button>
                    <p className="text-[8px] text-rose-500 font-bold uppercase mt-2 text-center px-4 leading-relaxed">
                       Peringatan: Reset pabrik akan mengembalikan aplikasi ke kondisi awal secara permanen. Pastikan Anda telah mengunduh Backup sebelum melakukan ini.
                    </p>
                 </div>
              </div>
           </div>
         )}
      </div>

      {/* SYSTEM PREFERENCES & ACCOUNT */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden divide-y divide-slate-100">

        <button className="w-full flex items-center justify-between p-4 text-slate-700 dark:text-slate-200 active:bg-slate-50 dark:bg-slate-900 transition-colors">
          <div className="flex items-center gap-3">
            <Lock size={16} className="text-slate-400" /> 
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase">PIN Pengaman Otoritas</span>
          </div>
          <span className="text-[9px] text-[#2563eb] font-bold">AKTIF</span>
        </button>
        <button onClick={() => setShowLogoutModal(true)} className="w-full flex items-center justify-between p-4 text-slate-700 dark:text-slate-200 active:bg-rose-100/50 text-red-600 bg-rose-50/25 transition-colors cursor-pointer">
          <span className="text-xs font-black text-center w-full uppercase tracking-wider text-rose-600">Keluar Akun Google</span>
        </button>
      </div>

      {/* Kritik & Saran Button */}
      <div className="mt-8">
        <button 
          onClick={() => setShowFeedbackModal(true)} 
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-2xl py-4 flex flex-col items-center justify-center shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all cursor-pointer"
        >
           <MessageCircle size={24} className="mb-1.5 opacity-90" />
           <span className="text-[11px] font-black uppercase tracking-widest text-emerald-50">Kritik & Saran via WhatsApp</span>
        </button>
      </div>

      {showFeedbackModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in print:hidden">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-[2rem] p-8 shadow-2xl relative animate-scale-up border-[4px] border-emerald-100/50">
            <button 
              onClick={() => setShowFeedbackModal(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 active:scale-95 transition-all outline-none cursor-pointer"
            >
              <X size={18} strokeWidth={3} />
            </button>
            <div className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 flex items-center justify-center mx-auto mb-5 shadow-inner">
               <MessageCircle size={36} strokeWidth={2.5} />
            </div>
            <h3 className="text-lg font-black text-center text-slate-800 dark:text-white uppercase tracking-widest mb-3">Kirim Masukan</h3>
            <p className="text-center text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
              Anda akan diarahkan ke WhatsApp Admin untuk menyampaikan ide, laporan masalah, atau saran perbaikan aplikasi. Masukan Anda sangat berarti bagi kami!
            </p>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowFeedbackModal(false)}
                className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl text-[11px] uppercase tracking-wider active:scale-95 transition-transform cursor-pointer"
              >
                Batal
              </button>
              <a 
                href={`https://wa.me/${formattedWaNumber}?text=Halo%20Admin%20Kasir,%20saya%20ingin%20memberikan%20kritik/saran:%20`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowFeedbackModal(false)}
                className="flex-1 py-3.5 text-white font-black rounded-2xl text-[11px] uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center justify-center gap-1 bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30 cursor-pointer"
              >
                LANJUT WA
              </a>
            </div>
          </div>
        </div>
      )}

      {showLogoutModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in print:hidden">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-[2rem] p-6 shadow-2xl relative animate-scale-up border-[4px] border-rose-100/50">
            <button 
              onClick={() => setShowLogoutModal(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 active:scale-95 transition-all outline-none cursor-pointer"
            >
              <X size={18} strokeWidth={3} />
            </button>
            <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 mt-2 shadow-inner">
               <AlertTriangle size={32} strokeWidth={2.5} />
            </div>
            <h3 className="text-lg font-black text-center text-rose-700 uppercase tracking-widest mb-2">Keluar Akun</h3>
            <p className="text-center text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              Apakah Anda yakin ingin keluar dari akun Google (<b className="text-rose-600">{user?.email}</b>)? Anda perlu menghubungkan kembali akun Google untuk mengakses sinkronisasi dan fitur PRO.
            </p>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl text-[11px] uppercase tracking-wider active:scale-95 transition-transform cursor-pointer"
              >
                Batal
              </button>
              <button 
                onClick={async () => {
                   await logout();
                   setShowLogoutModal(false);
                }}
                className="flex-1 py-3.5 text-white font-black rounded-2xl text-[11px] uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center justify-center gap-1 bg-rose-600 hover:bg-rose-700 cursor-pointer"
              >
                KELUAR AKUN
              </button>
            </div>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in print:hidden">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-[2rem] p-6 shadow-2xl relative animate-scale-up border-[4px] border-emerald-100/50">
            <button 
              onClick={() => { setShowImportModal(false); setFileToImport(null); }}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 active:scale-95 transition-all outline-none"
            >
              <X size={18} strokeWidth={3} />
            </button>
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 mt-2 shadow-inner">
               <Upload size={32} strokeWidth={2.5} />
            </div>
            <h3 className="text-lg font-black text-center text-emerald-700 uppercase tracking-widest mb-2">Impor Data</h3>
            <p className="text-center text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              Anda akan mengimpor file <b className="text-emerald-600">{fileToImport?.name}</b>. Ini akan menimpa seluruh data profil dan transaksi kas saat ini secara permanen. Lanjutkan?
            </p>

            <div className="flex gap-3">
              <button 
                onClick={() => { setShowImportModal(false); setFileToImport(null); }}
                className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl text-[11px] uppercase tracking-wider active:scale-95 transition-transform"
              >
                Batal
              </button>
              <button 
                onClick={confirmImportBackup}
                className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-[11px] uppercase tracking-wider transition-all shadow-md shadow-emerald-500/30 active:scale-95 flex items-center justify-center gap-1"
              >
                <Upload size={14} /> IMPOR 
              </button>
            </div>
          </div>
        </div>
      )}

      {showResetModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in print:hidden">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-[2rem] p-6 shadow-2xl relative animate-scale-up border-[4px] border-rose-100/50">
            <button 
              onClick={() => setShowResetModal(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 active:scale-95 transition-all outline-none"
            >
              <X size={18} strokeWidth={3} />
            </button>
            <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 mt-2 shadow-inner">
               <AlertTriangle size={32} strokeWidth={2.5} />
            </div>
            <h3 className="text-lg font-black text-center text-rose-700 uppercase tracking-widest mb-2">Reset Pabrik</h3>
            <p className="text-center text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              Tindakan ini akan <b className="text-rose-600 uppercase">menghapus semua data transaksi & kasbon</b>, serta mengembalikan nilai saldo Asset ke 0 secara permanen di perangkat ini. Tindakan ini tidak bisa dibatalkan!
            </p>

            <div className="bg-rose-50/50 p-4 rounded-2xl mb-6 border border-rose-100">
               <label className="text-[10px] font-black text-rose-800 uppercase tracking-wider block mb-2 text-center">
                 Ketik "HAPUS" untuk konfirmasi
               </label>
               <input 
                 type="text" 
                 value={resetConfirmText}
                 onChange={(e) => setResetConfirmText(e.target.value.toUpperCase())}
                 placeholder="HAPUS"
                 className="w-full bg-white dark:bg-slate-800 border border-rose-200 text-rose-700 text-center font-black text-lg py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/50 font-mono tracking-widest transition-all"
               />
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowResetModal(false)}
                className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl text-[11px] uppercase tracking-wider active:scale-95 transition-transform"
              >
                Batal
              </button>
              <button 
                onClick={confirmFactoryReset}
                disabled={resetConfirmText !== 'HAPUS'}
                className={`flex-1 py-3.5 text-white font-black rounded-2xl text-[11px] uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center justify-center gap-1 ${resetConfirmText === 'HAPUS' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/30' : 'bg-slate-300 opacity-70'}`}
              >
                <Trash2 size={14} /> RESET
              </button>
            </div>
          </div>
        </div>
      )}

      {showResetSaldoModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in print:hidden">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-[2rem] p-6 shadow-2xl relative animate-scale-up border-[4px] border-orange-100/50">
            <button 
              onClick={() => setShowResetSaldoModal(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 active:scale-95 transition-all outline-none cursor-pointer"
            >
              <X size={18} strokeWidth={3} />
            </button>
            <div className="w-16 h-16 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mx-auto mb-4 mt-2 shadow-inner">
               <RefreshCcw size={32} strokeWidth={2.5} />
            </div>
            <h3 className="text-lg font-black text-center text-orange-700 uppercase tracking-widest mb-2">Reset Saldo 0</h3>
            <p className="text-center text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              Tindakan ini akan <b className="text-orange-600 uppercase">mengembalikan semua nilai saldo dompet (Bank/Laci)</b> menjadi 0. Data transaksi <b className="text-emerald-600">tidak akan terhapus</b>.
            </p>

            <div className="bg-orange-50/50 p-4 rounded-2xl mb-6 border border-orange-100">
               <label className="text-[10px] font-black text-orange-800 uppercase tracking-wider block mb-2 text-center">
                 Ketik "NOL" untuk konfirmasi
               </label>
               <input 
                 type="text" 
                 value={resetConfirmText}
                 onChange={(e) => setResetConfirmText(e.target.value.toUpperCase())}
                 placeholder="NOL"
                 className="w-full bg-white dark:bg-slate-800 border border-orange-200 text-orange-700 text-center font-black text-lg py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 font-mono tracking-widest transition-all"
               />
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowResetSaldoModal(false)}
                className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl text-[11px] uppercase tracking-wider active:scale-95 transition-transform cursor-pointer"
              >
                Batal
              </button>
              <button 
                onClick={confirmResetSaldo}
                disabled={resetConfirmText !== 'NOL'}
                className={`flex-1 py-3.5 text-white font-black rounded-2xl text-[11px] uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center justify-center gap-1 ${resetConfirmText === 'NOL' ? 'bg-orange-600 hover:bg-orange-700 shadow-orange-500/30' : 'bg-slate-300 opacity-70'} cursor-pointer`}
              >
                <RefreshCcw size={14} /> JADIKAN 0
              </button>
            </div>
          </div>
        </div>
      )}

    {/* Custom Success Modal */}
    {successModal.show && (
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-300">
          <div className="p-8 flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-inner overflow-hidden border-4 border-emerald-500/20">
               <img src="/icons/icon-192x192.png" alt="Logo" className="w-full h-full object-contain p-2" onError={(e) => { e.currentTarget.src = '/icons/icon-192x192.png'; }} />
            </div>
            
            <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-3">
              {successModal.title}
            </h3>
            
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
              {successModal.message}
            </p>

            <button 
              onClick={() => {
                setSuccessModal({show: false, title: "", message: ""});
                window.location.reload(); // Hard reload after they acknowledge
              }}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl text-[13px] uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/30 active:scale-[0.98] cursor-pointer"
            >
              OKE, MENGERTI
            </button>
          </div>
        </div>
      </div>
    )}

    </div>
  );
}
