import React, { useState, useEffect, useRef } from "react";
import {
  ShieldCheck,
  Users,
  Database,
  Activity,
  RefreshCcw,
  Megaphone,
  Send,
  Image as ImageIcon,
  Download,
  CheckCircle2,
  Zap,
  Smartphone,
  Lock,
  Wallet,
  FileText,
  Gift,
} from "lucide-react";
import { useLicense } from "../context/LicenseContext";
import { useStore } from "../context/StoreContext";
import { Navigate } from "react-router";
import { cn } from "../lib/utils";
import html2canvas from "html2canvas";

export function Admin() {
  const {
    isAdmin,
    waNumber,
    promoConfig,
    updatePromoConfig,
    updateWaNumber,
    generateLicenseCode,
    usedLicenses,
    unusedLicenses,
    allWithdrawals,
    approveWithdrawal,
    rejectWithdrawal,
  } = useLicense();
  const { transactions, products, contacts, kasbons } = useStore();

  const [adminWaInput, setAdminWaInput] = useState(waNumber);
  const [adminGenCode, setAdminGenCode] = useState("");
  const [targetEmail, setTargetEmail] = useState("");
  const [activeTab, setActiveTab] = useState<
    "lisensi" | "promosi_mitra" | "promosi_admin"
  >("lisensi");
  const [adminPosterTab, setAdminPosterTab] = useState<
    "aplikasi" | "diskon" | "kemitraan"
  >("diskon");

  // Promo config states
  const [promoText, setPromoText] = useState(promoConfig.text);
  const [promoNormalPrice, setPromoNormalPrice] = useState(
    promoConfig.normalPrice.toString(),
  );
  const [promoPromoPrice, setPromoPromoPrice] = useState(
    promoConfig.promoPrice.toString(),
  );
  const [promoRefPoints, setPromoRefPoints] = useState(
    promoConfig.referralPoints.toString(),
  );

  const [promoAplikasiText, setPromoAplikasiText] = useState(
    promoConfig.promoAplikasiText || "",
  );
  const [promoKemitraanText, setPromoKemitraanText] = useState(
    promoConfig.promoKemitraanText || "",
  );
  const [promoDiskonText, setPromoDiskonText] = useState(
    promoConfig.promoDiskonText || "",
  );

  const [promoFeedback, setPromoFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Sync state when promoConfig changes from DB
  useEffect(() => {
    setPromoText(promoConfig.text);
    setPromoNormalPrice(promoConfig.normalPrice.toString());
    setPromoPromoPrice(promoConfig.promoPrice.toString());
    setPromoRefPoints(promoConfig.referralPoints.toString());
    if (promoConfig.promoAplikasiText)
      setPromoAplikasiText(promoConfig.promoAplikasiText);
    if (promoConfig.promoKemitraanText)
      setPromoKemitraanText(promoConfig.promoKemitraanText);
    if (promoConfig.promoDiskonText)
      setPromoDiskonText(promoConfig.promoDiskonText);
  }, [promoConfig]);

  // Rejection reasons state keyed by withdrawalId
  const [rejectionReasons, setRejectionReasons] = useState<
    Record<string, string>
  >({});
  const [wdActionFeedback, setWdActionFeedback] = useState<
    Record<string, string>
  >({});

  // Custom states for neat UI feedback
  const [licenseFeedback, setLicenseFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [waFeedback, setWaFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const adminPosterRef = useRef<HTMLDivElement>(null);

  const downloadAdminPoster = async () => {
    if (!adminPosterRef.current) return;
    try {
      const canvas = await html2canvas(adminPosterRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null
      });
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `Poster_Promo_Admin_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to download admin poster", err);
    }
  };

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const handleGenerateLicenseCode = async () => {
    setLicenseFeedback(null);
    if (!targetEmail || !targetEmail.includes("@")) {
      setLicenseFeedback({
        type: "error",
        message: "Harap masukkan email tujuan yang valid.",
      });
      return;
    }

    try {
      const gCode = await generateLicenseCode(targetEmail);
      setAdminGenCode(gCode);
      setTargetEmail(""); // clear email logic after success
      setLicenseFeedback({
        type: "success",
        message: "Kode berhasil di-generate!",
      });
    } catch (err: any) {
      console.error(err);
      setLicenseFeedback({
        type: "error",
        message: err.message?.includes("Missing or insufficient permissions")
          ? "Akses Ditolak: Pastikan email sudah terdaftar di Firestore Rules"
          : "Gagal generate kode lisensi. Cek koneksi / database.",
      });
    }
  };

  const handleSaveAdminWa = async () => {
    setWaFeedback(null);
    try {
      await updateWaNumber(adminWaInput);
      setWaFeedback({
        type: "success",
        message: "Nomor WA Lisensi berhasil diperbarui.",
      });
    } catch (err: any) {
      console.error(err);
      setWaFeedback({
        type: "error",
        message: "Gagal menyimpan WA. Pastikan punya izin.",
      });
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 md:p-6 pb-24 space-y-6">
      <div className="bg-slate-900 rounded-[2rem] shadow-xl border border-slate-700/50 overflow-hidden relative">
        <div className="p-6 md:p-8 relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-yellow-500/20 text-yellow-500 rounded-2xl flex items-center justify-center border border-yellow-500/30">
              <ShieldCheck size={32} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white uppercase tracking-tight">
                Admin
                <br />
                Dashboard
              </h1>
              <p className="text-yellow-400 text-xs font-bold uppercase tracking-widest mt-1">
                Sistem Pusat
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700">
              <p className="text-[9px] text-slate-400 font-bold uppercase mb-1 flex items-center gap-1.5">
                <Users size={12} /> Lisensi Terpakai
              </p>
              <p className="text-2xl font-black text-white">
                {Object.keys(usedLicenses).length}
              </p>
            </div>
            <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700">
              <p className="text-[9px] text-slate-400 font-bold uppercase mb-1 flex items-center gap-1.5">
                <Database size={12} /> Tersedia
              </p>
              <p className="text-2xl font-black text-white">
                {Object.keys(unusedLicenses).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-800 p-1.5 rounded-2xl flex border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab("lisensi")}
          className={cn(
            "flex-1 min-w-[80px] py-3 px-2 rounded-xl flex flex-col items-center justify-center gap-1.5 text-[8.5px] font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap",
            activeTab === "lisensi"
              ? "bg-yellow-500 text-white shadow-md font-sans border-b-2 border-yellow-400"
              : "text-slate-400 hover:text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-900 font-sans",
          )}
        >
          <ShieldCheck size={16} /> <span className="mt-0.5">Lisensi</span>
        </button>
        <button
          onClick={() => setActiveTab("promosi_mitra")}
          className={cn(
            "flex-1 min-w-[80px] py-3 px-2 rounded-xl flex flex-col items-center justify-center gap-1.5 text-[8.5px] font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap",
            activeTab === "promosi_mitra"
              ? "bg-emerald-600 text-white shadow-md font-sans border-b-2 border-emerald-400"
              : "text-slate-400 hover:text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-900 font-sans",
          )}
        >
          <Users size={16} /> <span className="mt-0.5">Promo Mitra</span>
        </button>
        <button
          onClick={() => setActiveTab("promosi_admin")}
          className={cn(
            "flex-1 min-w-[80px] py-3 px-2 rounded-xl flex flex-col items-center justify-center gap-1.5 text-[8.5px] font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap",
            activeTab === "promosi_admin"
              ? "bg-purple-600 text-white shadow-md font-sans border-b-2 border-purple-400"
              : "text-slate-400 hover:text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-900 font-sans",
          )}
        >
          <Megaphone size={16} /> <span className="mt-0.5">Promo Admin</span>
        </button>
      </div>

      {/* Pengaturan Lisensi */}
      {activeTab === "lisensi" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider mb-5 flex items-center gap-2">
              <ShieldCheck size={16} className="text-yellow-500" /> Manajemen
              Lisensi
            </h2>

            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                <h3 className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-3">
                  Nomor WA Beli Lisensi
                </h3>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={adminWaInput}
                    onChange={(e) => setAdminWaInput(e.target.value)}
                    className="w-full text-xs font-bold p-3.5 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-xl outline-none focus:border-yellow-500 dark:focus:border-yellow-500 text-slate-800 dark:text-white transition-all shadow-sm"
                  />
                  <button
                    onClick={handleSaveAdminWa}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white font-black px-5 rounded-xl text-[10px] uppercase tracking-wider active:scale-95 transition-all shadow-md shadow-yellow-500/20 flex-shrink-0"
                  >
                    SIMPAN
                  </button>
                </div>
                {waFeedback && (
                  <div
                    className={`p-3 rounded-xl border text-[10px] font-bold ${waFeedback.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-400" : "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400"}`}
                  >
                    {waFeedback.message}
                  </div>
                )}
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                <h3 className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-3">
                  Generator Kode Lisensi Baru
                </h3>

                <div className="mb-4">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">
                    Email Pengguna (Target)
                  </label>
                  <input
                    type="email"
                    value={targetEmail}
                    onChange={(e) => setTargetEmail(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 text-sm p-3.5 rounded-xl border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all dark:text-white"
                    placeholder="misal: budi@gmail.com"
                  />
                </div>

                {licenseFeedback && licenseFeedback.type === "error" && (
                  <div className="mb-3 p-3 rounded-xl border border-red-200 text-[10px] font-bold bg-red-50 text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400">
                    {licenseFeedback.message}
                  </div>
                )}

                <button
                  onClick={handleGenerateLicenseCode}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCcw size={16} /> GENERATE KODE
                </button>
                {adminGenCode && (
                  <div className="mt-3 text-center bg-indigo-50 dark:bg-indigo-900/40 p-4 rounded-xl border border-indigo-100 dark:border-indigo-500/30 animate-in fade-in slide-in-from-top-2">
                    <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold mb-1 uppercase tracking-wider">
                      Berhasil Generate:
                    </p>
                    <p className="font-mono text-xl font-black text-indigo-700 dark:text-indigo-300 tracking-widest select-all">
                      {adminGenCode}
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50 mt-4">
                <h3 className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-3">
                  Daftar Lisensi Belum Digunakan
                </h3>
                {unusedLicenses.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">
                    Tidak ada lisensi tersedia.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {unusedLicenses.map((lic: any) => (
                      <div
                        key={lic.id}
                        className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center"
                      >
                        <div>
                          <p className="font-mono font-bold text-sm text-indigo-600 dark:text-indigo-400">
                            {lic.code}
                          </p>
                          {lic.assignedEmail && (
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                              Target: <b>{lic.assignedEmail}</b>
                            </p>
                          )}
                        </div>
                        <span className="bg-emerald-100 text-emerald-700 text-[9px] font-black px-2 py-1 rounded">
                          TERSEDIA
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50 mt-4">
                <h3 className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-3">
                  Daftar Lisensi Terpakai
                </h3>
                {usedLicenses.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">
                    Belum ada lisensi yang digunakan.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {usedLicenses.map((lic: any) => (
                      <div
                        key={lic.id}
                        className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700"
                      >
                        <p className="font-mono font-bold text-xs text-slate-500 dark:text-slate-400">
                          {lic.code}
                        </p>
                        <p className="text-[10px] text-slate-600 dark:text-slate-300 mt-1">
                          Digunakan oleh: <b>{lic.usedByEmail}</b>
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Persetujuan Penarikan Komisi Referral */}
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider mb-5 flex items-center gap-2">
              <Users size={16} className="text-purple-500" /> Persetujuan Tarik
              Komisi
            </h2>

            <div className="space-y-4">
              {!allWithdrawals || allWithdrawals.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-4">
                  Belum ada history atau permintaan pencairan komisi referral.
                </p>
              ) : (
                <div className="space-y-3.5">
                  {allWithdrawals.map((wd) => {
                    const isPending = wd.status === "pending";
                    const feedback = wdActionFeedback[wd.id];

                    return (
                      <div
                        key={wd.id}
                        className="bg-slate-50 dark:bg-slate-850/45 p-4.5 rounded-2xl border border-slate-150 dark:border-slate-750/30 space-y-3.5"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase">
                              AKUN SALES / PEMOHON
                            </p>
                            <p className="text-xs font-black text-slate-800 dark:text-white mt-0.5">
                              {wd.userByEmail || wd.userEmail}
                            </p>
                          </div>
                          <span className="text-[10px] font-black font-mono text-purple-600 dark:text-purple-300 bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-900/60 px-2.5 py-1 rounded-xl">
                            Rp {wd.amount.toLocaleString("id-ID")}
                          </span>
                        </div>

                        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-850 space-y-1 text-slate-800 dark:text-slate-100">
                          <span className="block text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase font-mono">
                            TUJUAN OUTLET TRANSFER:
                          </span>
                          <p className="text-[10.5px] font-mono font-bold leading-tight">
                            {wd.details}
                          </p>
                          <span className="inline-block bg-slate-100 dark:bg-slate-800 text-[8.5px] font-bold px-1.5 py-0.5 rounded uppercase mt-1">
                            METODE: {wd.method}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[9px] text-slate-400 dark:text-slate-500 font-bold">
                          <span>
                            Tanggal:{" "}
                            {wd.createdAt
                              ? new Date(wd.createdAt).toLocaleString("id-ID")
                              : "Baru"}
                          </span>
                          <span
                            className="font-sans px-2.5 py-0.5 rounded-full uppercase scale-90 border font-black"
                            style={{
                              backgroundColor:
                                wd.status === "approved"
                                  ? "#d1fae5"
                                  : wd.status === "rejected"
                                    ? "#fee2e2"
                                    : "#ffedd5",
                              color:
                                wd.status === "approved"
                                  ? "#065f46"
                                  : wd.status === "rejected"
                                    ? "#991b1b"
                                    : "#9a3412",
                              borderColor:
                                wd.status === "approved"
                                  ? "#a7f3d0"
                                  : wd.status === "rejected"
                                    ? "#fca5a5"
                                    : "#fed7aa",
                            }}
                          >
                            {wd.status === "approved"
                              ? "SELESAI (SUDAH DIKIRIM)"
                              : wd.status === "rejected"
                                ? "DITOLAK"
                                : "MENUNGGU TRANSFER"}
                          </span>
                        </div>

                        {/* JIKA STATUSNYA PENDING, ADMIN BISA MENYETUJUI ATAU MENOLAK */}
                        {isPending && (
                          <div className="pt-2 border-t border-dashed border-slate-200 dark:border-slate-800 space-y-2.5">
                            {/* Input Alasan Rejection */}
                            <div>
                              <label className="text-[8.5px] font-bold text-slate-400 dark:text-slate-500 block uppercase mb-1">
                                Catatan Admin (Wajib diisi jika ingin menolak):
                              </label>
                              <input
                                type="text"
                                value={rejectionReasons[wd.id] || ""}
                                onChange={(e) =>
                                  setRejectionReasons({
                                    ...rejectionReasons,
                                    [wd.id]: e.target.value,
                                  })
                                }
                                placeholder="Contoh: Nomor gopay tidak ditemukan / salah"
                                className="w-full text-xs p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-1 focus:ring-purple-400 text-slate-850 dark:text-slate-100"
                              />
                            </div>

                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={async () => {
                                  setWdActionFeedback({
                                    ...wdActionFeedback,
                                    [wd.id]: "Sedang memproses persetujuan...",
                                  });
                                  let res = { message: "Pencairan disetujui!" };
                                  try {
                                    await approveWithdrawal(
                                      wd.id,
                                      "TRF-OK-" +
                                        Date.now().toString().slice(-6),
                                    );
                                  } catch (e: any) {
                                    res = {
                                      message: "Gagal menyetujui: " + e.message,
                                    };
                                  }
                                  setWdActionFeedback({
                                    ...wdActionFeedback,
                                    [wd.id]: res.message,
                                  });
                                }}
                                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[9px] uppercase rounded-xl shadow-md active:scale-95 transition-all cursor-pointer text-center"
                              >
                                SETUJUI & TRANSFER LUNAS
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  const reason =
                                    rejectionReasons[wd.id]?.trim() ||
                                    "Data penarikan kurang sesuai, hubungi admin.";
                                  setWdActionFeedback({
                                    ...wdActionFeedback,
                                    [wd.id]: "Sedang memproses penolakan...",
                                  });
                                  let res = {
                                    message:
                                      "Dana pencairan berhasil ditolak dan dikembalikan ke mitra.",
                                  };
                                  try {
                                    await rejectWithdrawal(wd.id, reason);
                                  } catch (e: any) {
                                    res = {
                                      message: "Gagal menolak: " + e.message,
                                    };
                                  }
                                  setWdActionFeedback({
                                    ...wdActionFeedback,
                                    [wd.id]: res.message,
                                  });
                                }}
                                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-[9px] uppercase rounded-xl shadow-md active:scale-95 transition-all cursor-pointer text-center"
                              >
                                TOLAK PERMINTAAN
                              </button>
                            </div>
                          </div>
                        )}

                        {feedback && (
                          <p className="text-[9.5px] font-extrabold text-indigo-600 dark:text-indigo-400 mt-1.5 text-center bg-indigo-50 dark:bg-indigo-950/40 p-2 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
                            {feedback}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Metrik Penggunaan Global (Store) */}
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider mb-5 flex items-center gap-2">
              <Activity size={16} className="text-blue-500" /> METRIK PENGGUNAAN
              TOKO
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">
                  Total Transaksi
                </p>
                <p className="text-2xl font-black text-slate-700 dark:text-white">
                  {transactions.length}
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">
                  Total Inventori
                </p>
                <p className="text-2xl font-black text-slate-700 dark:text-white">
                  {products.length}
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">
                  Total Kontak
                </p>
                <p className="text-2xl font-black text-slate-700 dark:text-white">
                  {contacts.length}
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">
                  Total Kasbon
                </p>
                <p className="text-2xl font-black text-slate-700 dark:text-white">
                  {kasbons.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB PROMOSI MITRA */}
      {activeTab === "promosi_mitra" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider mb-5 flex items-center gap-2">
              <Users size={16} className="text-emerald-500" /> Pusat Promosi
              Mitra
            </h2>

            <div className="space-y-5">
              {/* Informasi tentang fitur ini */}
              <div className="bg-emerald-50 dark:bg-emerald-900/30 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-800/50">
                <p className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold leading-relaxed mb-2">
                  Gunakan pengaturan di bawah ini untuk mengatur aturan diskon
                  dalam program Promosi Mitra secara global. Setiap mitra/agen
                  akan mengikuti aturan harga dan komisi yang ditentukan di
                  sini.
                </p>
              </div>

              {/* Teks Instruksi Promosi */}
              <div>
                <label className="text-[10.5px] font-black text-slate-600 dark:text-slate-400 uppercase mb-2 block">
                  Teks Instruksi Promosi (Account Page)
                </label>
                <textarea
                  rows={4}
                  value={promoText}
                  onChange={(e) => setPromoText(e.target.value)}
                  className="w-full text-xs p-3.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-xl outline-none focus:border-emerald-500 dark:focus:border-emerald-500 text-slate-800 dark:text-slate-200 shadow-sm leading-relaxed"
                  placeholder="Contoh: Hubungi tenaga penjual kami..."
                />
              </div>

              {/* Harga Lisensi Normal */}
              <div>
                <label className="text-[10.5px] font-black text-slate-600 dark:text-slate-400 uppercase mb-2 block">
                  Harga Lisensi Pro (Normal)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                    Rp
                  </span>
                  <input
                    type="number"
                    value={promoNormalPrice}
                    onChange={(e) => setPromoNormalPrice(e.target.value)}
                    className="w-full text-xs font-black p-3.5 pl-10 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-xl outline-none focus:border-emerald-500 text-slate-800 dark:text-slate-200 shadow-sm"
                  />
                </div>
              </div>

              {/* Harga Diskon Referral */}
              <div>
                <label className="text-[10.5px] font-black text-slate-600 dark:text-slate-400 uppercase mb-2 block">
                  Harga Lisensi Pro (Promo Referral)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                    Rp
                  </span>
                  <input
                    type="number"
                    value={promoPromoPrice}
                    onChange={(e) => setPromoPromoPrice(e.target.value)}
                    className="w-full text-xs font-black p-3.5 pl-10 border border-slate-300 dark:border-slate-600 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-xl outline-none focus:border-emerald-500 text-emerald-800 dark:text-emerald-300 shadow-sm"
                  />
                </div>
              </div>

              {/* Poin Referral per Aktivasi */}
              <div>
                <label className="text-[10.5px] font-black text-slate-600 dark:text-slate-400 uppercase mb-2 flex items-center gap-2">
                  Poin Bonus (Komisi ke Agen per Aktivasi)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                    Rp
                  </span>
                  <input
                    type="number"
                    value={promoRefPoints}
                    onChange={(e) => setPromoRefPoints(e.target.value)}
                    className="w-full text-xs font-black p-3.5 pl-10 border border-slate-300 dark:border-slate-600 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-xl outline-none focus:border-indigo-500 text-indigo-800 dark:text-indigo-300 shadow-sm"
                  />
                </div>
              </div>

              {/* Feedback Promo Config */}
              {promoFeedback && (
                <div
                  className={`p-3 rounded-xl border text-[10px] font-bold ${promoFeedback.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-700"}`}
                >
                  {promoFeedback.message}
                </div>
              )}

              {/* Save Action */}
              <button
                onClick={async () => {
                  setPromoFeedback(null);
                  try {
                    await updatePromoConfig({
                      text: promoText,
                      normalPrice: parseInt(promoNormalPrice) || 100000,
                      promoPrice: parseInt(promoPromoPrice) || 60000,
                      referralPoints: parseInt(promoRefPoints) || 10000,
                    });
                    setPromoFeedback({
                      type: "success",
                      message: "Pengaturan promosi mitra berhasil disimpan.",
                    });
                  } catch (e: any) {
                    setPromoFeedback({
                      type: "error",
                      message: "Gagal mengatur promosi mitra: " + e.message,
                    });
                  }
                }}
                className="w-full mt-4 flex items-center justify-center gap-2 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-black uppercase shadow-lg shadow-emerald-600/30 active:scale-95 transition-all"
              >
                <Send size={16} /> Update Pengaturan Ke Semua Pengguna
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB PROMOSI ADMIN */}
      {activeTab === "promosi_admin" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider mb-5 flex items-center gap-2">
              <Megaphone size={16} className="text-purple-500" /> Pusat Promosi
              Admin
            </h2>

            <div className="space-y-5">
              <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-2xl border border-purple-100 dark:border-purple-800/50">
                <p className="text-[10px] text-purple-800 dark:text-purple-300 font-bold leading-relaxed mb-2">
                  Kelola promosi Anda sendiri. Teks ini akan Anda gunakan, dan
                  Anda juga bisa mengunduh poster promo langung dari halaman
                  ini.
                </p>
              </div>

              <div className="space-y-4">
                {/* Promo Aplikasi (Murni) */}
                <div>
                  <label className="text-[10.5px] font-black text-slate-600 dark:text-slate-400 uppercase mb-2 block">
                    Teks Promo: Murni Fitur Aplikasi
                  </label>
                  <textarea
                    rows={3}
                    value={promoAplikasiText}
                    onChange={(e) => setPromoAplikasiText(e.target.value)}
                    className="w-full text-xs p-3.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-xl outline-none focus:border-purple-500 text-slate-800 dark:text-slate-200 shadow-sm leading-relaxed"
                  />
                </div>

                {/* Promo Kode Diskon */}
                <div>
                  <label className="text-[10.5px] font-black text-slate-600 dark:text-slate-400 uppercase mb-2 block">
                    Teks Promo: Diskon Kode Agen
                  </label>
                  <textarea
                    rows={3}
                    value={promoDiskonText}
                    onChange={(e) => setPromoDiskonText(e.target.value)}
                    className="w-full text-xs p-3.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-xl outline-none focus:border-purple-500 text-slate-800 dark:text-slate-200 shadow-sm leading-relaxed"
                  />
                </div>

                {/* Promo Kemitraan */}
                <div>
                  <label className="text-[10.5px] font-black text-slate-600 dark:text-slate-400 uppercase mb-2 block">
                    Teks Promo: Rekrut Mitra/Agen Baru
                  </label>
                  <textarea
                    rows={3}
                    value={promoKemitraanText}
                    onChange={(e) => setPromoKemitraanText(e.target.value)}
                    className="w-full text-xs p-3.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-xl outline-none focus:border-purple-500 text-slate-800 dark:text-slate-200 shadow-sm leading-relaxed"
                  />
                </div>
              </div>

              {/* Feedback Promo Config Admin */}
              {promoFeedback && (
                <div
                  className={`p-3 rounded-xl border text-[10px] font-bold ${promoFeedback.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-700"}`}
                >
                  {promoFeedback.message}
                </div>
              )}

              {/* Save Action Admin */}
              <button
                onClick={async () => {
                  setPromoFeedback(null);
                  try {
                    await updatePromoConfig({
                      promoAplikasiText: promoAplikasiText,
                      promoKemitraanText: promoKemitraanText,
                      promoDiskonText: promoDiskonText,
                    });
                    setPromoFeedback({
                      type: "success",
                      message: "Teks promosi admin berhasil disimpan.",
                    });
                  } catch (e: any) {
                    setPromoFeedback({
                      type: "error",
                      message: "Gagal mengatur promosi: " + e.message,
                    });
                  }
                }}
                className="w-full mt-4 flex items-center justify-center gap-2 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-[11px] font-black uppercase shadow-lg shadow-purple-600/30 active:scale-95 transition-all"
              >
                <Send size={16} /> Update Teks Admin
              </button>

              {/* Poster Generator */}
              <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700/50">
                <h3 className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4 border-l-4 border-purple-500 pl-3">
                  Preview Poster Admin
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mb-4">
                  Pilih desain poster Anda. Tampilan ini adalah poster yang akan
                  Anda bagikan melalui media promosi (WhatsApp, FB, IG).
                </p>

                {/* Poster Tabs */}
                <div className="flex gap-2 mb-6 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button
                    onClick={() => setAdminPosterTab("aplikasi")}
                    className={`flex-1 py-3 text-[9px] sm:text-[10px] font-black uppercase rounded-lg transition-all ${adminPosterTab === "aplikasi" ? "bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                  >
                    Fitur App
                  </button>
                  <button
                    onClick={() => setAdminPosterTab("diskon")}
                    className={`flex-1 py-3 text-[9px] sm:text-[10px] font-black uppercase rounded-lg transition-all ${adminPosterTab === "diskon" ? "bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                  >
                    Harga / Diskon
                  </button>
                  <button
                    onClick={() => setAdminPosterTab("kemitraan")}
                    className={`flex-1 py-3 text-[9px] sm:text-[10px] font-black uppercase rounded-lg transition-all ${adminPosterTab === "kemitraan" ? "bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                  >
                    Rekrut Mitra
                  </button>
                </div>

                {/* The Premium Gold & Navy Poster Preview */}
                <div
                  ref={adminPosterRef}
                  className="w-full max-w-[340px] mx-auto overflow-hidden relative aspect-[9/15.5] flex flex-col items-center p-0 mb-6 border-[3px] border-[#122a59] rounded-sm"
                  style={{
                    background:
                      "linear-gradient(170deg, #07152f 0%, #173266 40%, #030814 100%)",
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px #d4af37",
                  }}
                >
                  {/* Background acccents */}
                  <div className="absolute top-0 right-0 w-full h-[60%] flex items-center justify-center pointer-events-none opacity-20">
                    <div className="w-[180%] max-w-[600px] aspect-square rounded-full border-[1.5px] border-[#fce49c] absolute border-dashed"></div>
                    <div className="w-[140%] max-w-[500px] aspect-square rounded-full border-[3px] border-[#d4af37] absolute"></div>
                    <div className="w-[100%] max-w-[400px] aspect-square rounded-full border-[1px] border-[#fce49c] absolute"></div>
                  </div>

                  <div className="flex-1 w-full flex flex-col z-10 pt-6 px-4">
                    {/* Logo Area */}
                    <div className="flex flex-col items-center mb-5">
                      <div className="bg-gradient-to-b from-[#ffffff] to-[#e2e8f0] p-1.5 rounded-full shadow-[0_0_15px_rgba(212,175,55,0.5)] mb-2 relative">
                        <div className="absolute -inset-1 rounded-full border border-[#d4af37] opacity-60"></div>
                        <div className="bg-gradient-to-br from-[#07152f] to-[#122a59] rounded-[14px] p-2">
                          <Database size={24} className="text-[#fce49c]" strokeWidth={2.5}/>
                        </div>
                      </div>
                      <h2 className="font-black text-[28px] tracking-[0.05em] text-transparent bg-clip-text bg-gradient-to-b from-[#ffffff] via-[#fce49c] to-[#d4af37] leading-none mb-1 drop-shadow-md">
                        CUBA SINGEL
                      </h2>
                      <div className="text-center">
                        <div className="bg-gradient-to-r from-transparent via-[#d4af37] to-transparent h-[1px] w-32 mx-auto mb-1 opacity-50"></div>
                        <p className="text-[#fce49c] text-[7.5px] font-black tracking-[0.3em] uppercase opacity-90 drop-shadow-sm">Sistem Kasir Tunggal</p>
                      </div>
                    </div>

                    {/* Dynamic Content Body */}
                    <div className="w-full flex-1 flex flex-col justify-center mb-1">
                      {adminPosterTab === 'aplikasi' && (
                        <>
                          <div className="text-center mb-4">
                            <span className="bg-[#122a59] border border-[#d4af37] text-[#fce49c] text-[8.5px] font-black px-4 py-1.5 rounded-full tracking-widest uppercase shadow-lg shadow-[#d4af37]/20">
                              Fitur Lengkap & Pintar
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 mt-1">
                            {/* Card 1 */}
                            <div className="bg-gradient-to-br from-[#0a1b3a] to-[#040d1f] border border-[#d4af37]/50 rounded-xl p-3 relative shadow-xl shadow-black/50 flex flex-col items-center text-center">
                              <div className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-gradient-to-br from-[#fce49c] to-[#d4af37] rounded-full flex items-center justify-center text-[#07152f] text-[10px] font-black border border-[#07152f] shadow-sm">1</div>
                              <Smartphone size={16} className="text-[#fce49c] mb-2"/>
                              <p className="text-white text-[9px] font-bold leading-tight">Unlimited HP<br/><span className="text-[#d4af37] text-[7px] font-bold uppercase tracking-wider mt-0.5 inline-block">Semua Karyawan</span></p>
                            </div>
                            {/* Card 2 */}
                            <div className="bg-gradient-to-br from-[#0a1b3a] to-[#040d1f] border border-[#d4af37]/50 rounded-xl p-3 relative shadow-xl shadow-black/50 flex flex-col items-center text-center">
                              <div className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-gradient-to-br from-[#fce49c] to-[#d4af37] rounded-full flex items-center justify-center text-[#07152f] text-[10px] font-black border border-[#07152f] shadow-sm">2</div>
                              <Lock size={16} className="text-[#fce49c] mb-2"/>
                              <p className="text-white text-[9px] font-bold leading-tight">Sekali Beli<br/><span className="text-[#d4af37] text-[7px] font-bold uppercase tracking-wider mt-0.5 inline-block">Aktif Selamanya</span></p>
                            </div>
                            {/* Card 3 */}
                            <div className="bg-gradient-to-br from-[#0a1b3a] to-[#040d1f] border border-[#d4af37]/50 rounded-xl p-3 relative shadow-xl shadow-black/50 flex flex-col items-center text-center">
                              <div className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-gradient-to-br from-[#fce49c] to-[#d4af37] rounded-full flex items-center justify-center text-[#07152f] text-[10px] font-black border border-[#07152f] shadow-sm">3</div>
                              <Database size={16} className="text-[#fce49c] mb-2"/>
                              <p className="text-white text-[9px] font-bold leading-tight">Database Online<br/><span className="text-[#d4af37] text-[7px] font-bold uppercase tracking-wider mt-0.5 inline-block">Real-time Sync</span></p>
                            </div>
                            {/* Card 4 */}
                            <div className="bg-gradient-to-br from-[#0a1b3a] to-[#040d1f] border border-[#d4af37]/50 rounded-xl p-3 relative shadow-xl shadow-black/50 flex flex-col items-center text-center">
                              <div className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-gradient-to-br from-[#fce49c] to-[#d4af37] rounded-full flex items-center justify-center text-[#07152f] text-[10px] font-black border border-[#07152f] shadow-sm">4</div>
                              <FileText size={16} className="text-[#fce49c] mb-2"/>
                              <p className="text-white text-[9px] font-bold leading-tight">Laporan Auto<br/><span className="text-[#d4af37] text-[7px] font-bold uppercase tracking-wider mt-0.5 inline-block">Laba/Rugi Cepat</span></p>
                            </div>
                          </div>
                        </>
                      )}

                      {adminPosterTab === 'diskon' && (
                        <div className="flex flex-col items-center w-full">
                          <div className="bg-gradient-to-b from-[#1a3366] to-[#0c1833] border border-[#d4af37] p-5 rounded-2xl w-full text-center relative shadow-[0_10px_30px_rgba(0,0,0,0.5)] overflow-hidden">
                            <h3 className="text-[#fce49c] font-black text-[10px] tracking-[0.2em] uppercase mb-4 relative z-10">Lisensi<br/><span className="text-[22px] tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white to-[#fce49c]">LIFETIME PRO</span></h3>
                            
                            <div className="flex flex-col items-center gap-3 relative z-10 w-full mb-3">
                              <div className="w-full flex items-center justify-between border-b border-[#d4af37]/20 pb-3">
                                <span className="text-[10px] text-[#fce49c]/80 uppercase tracking-widest font-black">Harga Normal</span>
                                <span className="text-xl font-black text-rose-400 line-through decoration-rose-500/60 drop-shadow-sm">Rp {Number(promoNormalPrice || 0)/1000}K</span>
                              </div>
                              <div className="w-full pt-2">
                                <div className="bg-gradient-to-r from-[#d4af37] via-[#fce49c] to-[#d4af37] p-[2px] rounded-xl shadow-[0_0_25px_rgba(212,175,55,0.3)] transform transition hover:scale-[1.02]">
                                  <div className="bg-gradient-to-b from-[#051429] to-[#0a2046] p-4 rounded-[10px] flex flex-col items-center relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>
                                    <span className="text-[#fce49c] text-[9px] font-black tracking-widest uppercase mb-1 drop-shadow-md">Promo Spesial</span>
                                    <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-[#fce49c] to-[#d4af37] leading-none drop-shadow-lg">
                                      Rp {Number(promoPromoPrice || 0)/1000}K
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-5 break-words text-center text-[10px] text-[#fce49c]/90 font-bold bg-[#07152f]/80 p-3 border border-[#d4af37]/30 rounded-xl w-full shadow-inner">
                            "{promoDiskonText.substring(0, 90)}{promoDiskonText.length > 90 ? '...' : ''}"
                          </div>
                        </div>
                      )}

                      {adminPosterTab === 'kemitraan' && (
                        <div className="flex flex-col items-center h-full justify-center">
                          <div className="bg-gradient-to-br from-[#0a1b3a] to-[#040d1f] border border-[#d4af37] p-5 pt-7 rounded-[2rem] w-full text-center relative shadow-[0_15px_40px_rgba(0,0,0,0.6)]">
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 p-3 bg-gradient-to-b from-[#07152f] to-[#122a59] rounded-full border border-[#d4af37] shadow-[0_0_20px_rgba(212,175,55,0.4)]">
                              <Gift size={24} className="text-[#fce49c]" />
                            </div>
                            <h3 className="text-white font-black text-[18px] tracking-wide uppercase mb-1 drop-shadow-md">Peluang Usaha <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#fce49c] to-[#d4af37]">Emas</span></h3>
                            <p className="text-[9px] text-[#fce49c]/80 font-black tracking-[0.2em] uppercase mb-4">Tanpa Modal & Bebas Risiko</p>
                            
                            <div className="bg-gradient-to-b from-[#122a59]/60 to-[#0a1b3a] border border-[#d4af37]/40 rounded-xl p-4 mb-4 shadow-inner relative overflow-hidden">
                              <div className="absolute top-0 right-0 w-16 h-16 bg-[#d4af37]/10 rounded-full -mr-8 -mt-8"></div>
                              <p className="text-[10px] text-[#fce49c] font-black uppercase tracking-wider mb-2 relative z-10">Komisi Aktivasi Agen:</p>
                              <p className="text-[40px] leading-tight font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-[#fce49c] to-[#d4af37] drop-shadow-lg relative z-10">
                                Rp {Number(promoRefPoints || 0)/1000}K
                              </p>
                            </div>

                            <ul className="text-left space-y-3 text-[10px] text-white/90 font-bold ml-2">
                              <li className="flex items-center gap-3">
                                <div className="bg-[#d4af37]/20 p-1.5 rounded-full"><CheckCircle2 size={12} className="text-[#d4af37]" strokeWidth={3}/></div>
                                Bukan MLM
                              </li>
                              <li className="flex items-center gap-3">
                                <div className="bg-[#d4af37]/20 p-1.5 rounded-full"><CheckCircle2 size={12} className="text-[#d4af37]" strokeWidth={3}/></div>
                                Cairkan kapan saja
                              </li>
                              <li className="flex items-center gap-3">
                                <div className="bg-[#d4af37]/20 p-1.5 rounded-full"><CheckCircle2 size={12} className="text-[#d4af37]" strokeWidth={3}/></div>
                                Tools & materi lengkap
                              </li>
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer Area */}
                    <div className="mt-auto w-full pt-6 pb-2">
                      <div className="bg-gradient-to-r from-[#d4af37] via-[#fce49c] to-[#d4af37] p-[1.5px] rounded-xl shadow-lg shadow-[#d4af37]/20">
                        <div className="bg-gradient-to-b from-[#051429] to-[#0a2046] p-3 rounded-[10.5px] flex flex-col items-center justify-center relative overflow-hidden">
                           <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 opacity-50"></div>
                           <div className="text-[8.5px] text-[#fce49c] font-black tracking-widest uppercase mb-1 drop-shadow-md">
                             {adminPosterTab === 'kemitraan' ? 'Gabung Sekarang! Hubungi:' : 'Konsultasi & Aktivasi:'}
                           </div>
                           <div className="text-[#ffffff] text-[16px] font-black tracking-[0.1em] drop-shadow-md border-b-[1.5px] border-[#d4af37]/50 px-6 pb-0.5 inline-block">
                             {waNumber || '08XXX'}
                           </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={downloadAdminPoster}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[11px] font-black uppercase tracking-wider shadow-lg shadow-indigo-600/30 active:scale-95 transition-all flex items-center justify-center gap-2 max-w-[340px] mx-auto"
                >
                  <Download size={18} /> Unduh Poster{" "}
                  {adminPosterTab === "aplikasi"
                    ? "Aplikasi"
                    : adminPosterTab === "diskon"
                      ? "Harga"
                      : "Mitra"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
