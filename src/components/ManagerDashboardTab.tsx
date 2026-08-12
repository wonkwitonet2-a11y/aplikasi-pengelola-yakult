import React, { useState, useRef, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Maximize2,
  TrendingUp,
  Clock,
  Award,
  BarChart2,
  Users,
  Target,
  PieChart,
  Activity,
  Table,
} from "lucide-react";
import {
  RankingYLChart,
  KomposisiProdukChart,
  TargetVsActualChart,
  SektorTimChart,
  TrenHarianChart,
} from "./Charts";
import type { DashboardData } from "../types";

interface ManagerDashboardTabProps {
  dashboardData: DashboardData | null;
  targetTKU: any;
  cleanYlName: (nama: string) => string;
  currentMonthTotal: (perYL: Record<string, any>, key: "yo" | "om" | "os" | "yt") => number;
  calculateSektorTotals: (dashboard: DashboardData | null) => any;
}

function ManagerDashboardTabInner({
  dashboardData,
  targetTKU,
  cleanYlName,
  currentMonthTotal,
  calculateSektorTotals,
}: ManagerDashboardTabProps) {
  const [fullscreenCardIndex, setFullscreenCardIndex] = useState<number | null>(null);
  const lastTapRef = useRef<{ time: number; index: number }>({ time: 0, index: -1 });

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  // Handle double-tap on mobile touchscreens
  const handleCardTouchEnd = (index: number) => {
    const now = Date.now();
    if (lastTapRef.current.index === index && now - lastTapRef.current.time < 350) {
      setFullscreenCardIndex(index);
      lastTapRef.current = { time: 0, index: -1 };
    } else {
      lastTapRef.current = { time: now, index };
    }
  };

  const cardsCount = 7;

  const handleNextCard = () => {
    setFullscreenCardIndex(prev => (prev === null ? null : (prev + 1) % cardsCount));
  };

  const handlePrevCard = () => {
    setFullscreenCardIndex(prev => (prev === null ? null : (prev - 1 + cardsCount) % cardsCount));
  };

  // Keyboard navigation for Fullscreen Modal
  useEffect(() => {
    if (fullscreenCardIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreenCardIndex(null);
      if (e.key === "ArrowRight") handleNextCard();
      if (e.key === "ArrowLeft") handlePrevCard();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [fullscreenCardIndex]);

  // Touch swipe handling for Fullscreen Modal
  const handleModalTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleModalTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) {
        handleNextCard();
      } else {
        handlePrevCard();
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  if (!dashboardData) {
    return (
      <div className="p-12 text-center text-slate-500 font-bold bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center gap-3 my-4">
        <div className="w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin" />
        <span>Memuat Data Dashboard...</span>
      </div>
    );
  }

  // Define details for each of the 7 dashboard cards
  const cardTitles = [
    "Ringkasan Utama Tim",
    "Komposisi & Performa Produk",
    "Potensi Sektor Tim",
    "Tren Penjualan Harian",
    "Ranking Penjualan Antar YL",
    "Target vs Actual per YL",
    "Kinerja Akumulatif & Rata-Rata YL",
  ];

  // Card Content Renderers
  const renderCardContent = (index: number, isFullscreen: boolean = false) => {
    switch (index) {
      case 0: // 1. Gabungan: Total Penjualan, Rata2 Tim, Capaian vs Perbandingan, Ringkasan Operasional
        return (
          <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm relative text-slate-900 ${isFullscreen ? "w-full p-2 sm:p-4 border-0 shadow-none flex flex-col justify-start gap-3 sm:gap-5 my-0" : "p-3 sm:p-6 space-y-3 sm:space-y-4 overflow-hidden"}`}>
            {!isFullscreen && (
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 sm:pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-5 bg-red-600 rounded-sm" />
                  <h2 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider">
                    Ringkasan Utama Tim
                  </h2>
                </div>
                <span className="text-[8px] font-bold text-slate-400 group-hover:text-red-600 bg-slate-100 group-hover:bg-red-50 px-1.5 py-0.5 rounded transition-all hidden sm:inline-flex items-center gap-1">
                  <Maximize2 className="w-2.5 h-2.5" /> 2x Layar Penuh
                </span>
              </div>
            )}

            {/* Total Penjualan & Rata-Rata Tim */}
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
              <div className={`bg-red-50/50 rounded-xl border border-red-100 relative overflow-hidden ${isFullscreen ? "p-1 sm:p-2" : "p-2 sm:p-3"}`}>
                <span className="text-[9px] sm:text-xs font-black text-red-900 uppercase tracking-wider block">Total Penjualan Tim</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className={`${isFullscreen ? "text-lg sm:text-2xl" : "text-xl sm:text-2xl"} font-black text-red-600`}>
                    {Math.trunc(dashboardData?.totalPenjualan || 0).toLocaleString("id-ID")}
                  </span>
                  <span className="text-[10px] sm:text-xs font-bold text-slate-500">btl</span>
                </div>
                <span className="inline-block mt-0.5 text-[8px] sm:text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  Bulan Berjalan
                </span>
              </div>

              <div className={`bg-amber-50/50 rounded-xl border border-amber-100 relative overflow-hidden ${isFullscreen ? "p-1 sm:p-2" : "p-2 sm:p-3"}`}>
                <span className="text-[9px] sm:text-xs font-black text-amber-900 uppercase tracking-wider block">Rata-Rata Tim</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className={`${isFullscreen ? "text-lg sm:text-2xl" : "text-xl sm:text-2xl"} font-black text-amber-600`}>
                    {Math.trunc(dashboardData?.rataHarian || 0).toLocaleString("id-ID")}
                  </span>
                  <span className="text-[10px] sm:text-xs font-bold text-slate-500">btl/hr</span>
                </div>
                <span className="block mt-0.5 text-[8px] sm:text-[9px] text-slate-500 font-bold truncate">
                  Divisor {dashboardData?.hariAktif || 0} hari aktif
                </span>
              </div>
            </div>

            {/* Capaian vs Perbandingan */}
            <div>
              <span className="text-[9px] sm:text-xs font-extrabold text-slate-400 uppercase tracking-wider block mb-0.5">
                Capaian vs Perbandingan
              </span>
              <div className="grid grid-cols-3 gap-1 sm:gap-2">
                <div className={`bg-slate-50 rounded-xl text-center border border-slate-100 ${isFullscreen ? "p-1 sm:p-1.5" : "p-1.5 sm:p-3"}`}>
                  <span className="text-[8px] sm:text-[9.5px] font-bold text-slate-400 uppercase block">vs Target</span>
                  <span className={`${isFullscreen ? "text-xs sm:text-base" : "text-base sm:text-xl"} font-black text-blue-600 mt-0.5 block`}>
                    {Math.trunc(dashboardData?.vsTarget || 0)}%
                  </span>
                </div>
                <div className={`bg-slate-50 rounded-xl text-center border border-slate-100 ${isFullscreen ? "p-1 sm:p-1.5" : "p-1.5 sm:p-3"}`}>
                  <span className="text-[8px] sm:text-[9.5px] font-bold text-slate-400 uppercase block">vs Bulan Lalu</span>
                  <span className={`${isFullscreen ? "text-xs sm:text-base" : "text-base sm:text-xl"} font-black text-purple-600 mt-0.5 block`}>
                    {Math.trunc(dashboardData?.vsBulanLalu || 0)}%
                  </span>
                </div>
                <div className={`bg-slate-50 rounded-xl text-center border border-slate-100 ${isFullscreen ? "p-1 sm:p-1.5" : "p-1.5 sm:p-3"}`}>
                  <span className="text-[8px] sm:text-[9.5px] font-bold text-slate-400 uppercase block">vs Tahun Lalu</span>
                  <span className={`${isFullscreen ? "text-xs sm:text-base" : "text-base sm:text-xl"} font-black text-teal-600 mt-0.5 block`}>
                    {Math.trunc(dashboardData?.vsTahunLalu || 0)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Ringkasan Operasional */}
            <div>
              <span className="text-[9px] sm:text-xs font-extrabold text-slate-400 uppercase tracking-wider block mb-0.5">
                Ringkasan Operasional
              </span>
              <div className="grid grid-cols-3 gap-1 sm:gap-2">
                <div className={`bg-slate-50 rounded-xl text-center border border-slate-100 ${isFullscreen ? "p-1 sm:p-1.5" : "p-1.5 sm:p-3"}`}>
                  <span className="text-[8px] sm:text-[9.5px] font-black text-slate-400 uppercase block truncate">Sales/YL/Hari</span>
                  <span className={`${isFullscreen ? "text-xs sm:text-sm" : "text-sm sm:text-base"} font-black text-slate-800 mt-0.5 block`}>
                    {Math.trunc(dashboardData?.salesPerYl || 0)} btl
                  </span>
                </div>
                <div className={`bg-slate-50 rounded-xl text-center border border-slate-100 ${isFullscreen ? "p-1 sm:p-1.5" : "p-1.5 sm:p-3"}`}>
                  <span className="text-[8px] sm:text-[9.5px] font-black text-slate-400 uppercase block">JWP</span>
                  <span className={`${isFullscreen ? "text-xs sm:text-sm" : "text-sm sm:text-base"} font-black text-slate-800 mt-0.5 block`}>
                    {dashboardData?.jwp || 0} jam
                  </span>
                </div>
                <div className={`bg-slate-50 rounded-xl text-center border border-slate-100 ${isFullscreen ? "p-1 sm:p-1.5" : "p-1.5 sm:p-3"}`}>
                  <span className="text-[8px] sm:text-[9.5px] font-black text-slate-400 uppercase block">BB Tim</span>
                  <span className={`${isFullscreen ? "text-xs sm:text-sm" : "text-sm sm:text-base"} font-black text-rose-600 mt-0.5 block`}>
                    {Math.trunc(((dashboardData?.bbTimRaw || 0) / ((dashboardData?.totalPenjualan || 0) + (dashboardData?.bbTimRaw || 0) || 1)) * 100)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Data Absensi */}
            <div>
              <span className="text-[9px] sm:text-xs font-extrabold text-slate-400 uppercase tracking-wider block mb-0.5 mt-2">
                Data Absensi (0 Sales)
              </span>
              <div className="grid grid-cols-2 gap-1 sm:gap-2">
                <div className={`bg-rose-50 rounded-xl text-center border border-rose-100 ${isFullscreen ? "p-1 sm:p-1.5" : "p-1.5 sm:p-3"}`}>
                  <span className="text-[8px] sm:text-[9.5px] font-black text-rose-400 uppercase block">Total YL Absen</span>
                  <span className={`${isFullscreen ? "text-xs sm:text-sm" : "text-sm sm:text-base"} font-black text-rose-800 mt-0.5 block`}>
                    {dashboardData?.ylAbsen || 0} YL
                  </span>
                </div>
                <div className={`bg-rose-50 rounded-xl text-center border border-rose-100 ${isFullscreen ? "p-1 sm:p-1.5" : "p-1.5 sm:p-3"}`}>
                  <span className="text-[8px] sm:text-[9.5px] font-black text-rose-400 uppercase block">Frekuensi</span>
                  <span className={`${isFullscreen ? "text-xs sm:text-sm" : "text-sm sm:text-base"} font-black text-rose-800 mt-0.5 block`}>
                    {dashboardData?.frekuensiAbsen || 0} Kali
                  </span>
                </div>
              </div>
            </div>
          </div>
        );

      case 1: // 2. Gabungan: Komposisi Terjual & Performa Rata-Rata Produk
        return (
          <div className={`bg-white rounded-2xl p-3 sm:p-6 border border-slate-100 shadow-sm text-slate-900 ${isFullscreen ? "w-full min-h-full p-2 sm:p-3 border-0 shadow-none overflow-y-auto flex flex-col justify-center my-auto" : ""}`}>
            {!isFullscreen && (
              <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2 sm:pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-5 bg-indigo-600 rounded-sm" />
                  <h3 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider">
                    Komposisi & Performa Rata-Rata Produk
                  </h3>
                </div>
                <span className="text-[8px] font-bold text-slate-400 group-hover:text-indigo-600 bg-slate-100 group-hover:bg-indigo-50 px-1.5 py-0.5 rounded transition-all hidden sm:inline-flex items-center gap-1">
                  <Maximize2 className="w-2.5 h-2.5" /> 2x Layar Penuh
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              {/* Komposisi Produk Chart */}
              <div>
                <h4 className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-wider mb-1 text-center sm:text-left">
                  Komposisi Produk Terjual
                </h4>
                <KomposisiProdukChart
                  yo={currentMonthTotal(dashboardData?.perYL || {}, "yo")}
                  om={currentMonthTotal(dashboardData?.perYL || {}, "om")}
                  os={currentMonthTotal(dashboardData?.perYL || {}, "os")}
                  yt={currentMonthTotal(dashboardData?.perYL || {}, "yt")}
                  height={isFullscreen ? 170 : 220}
                />
              </div>

              {/* Performa Rata-Rata Produk Table */}
              <div className="border border-slate-100 rounded-xl overflow-hidden shadow-xs">
                <div className="p-2 sm:p-2.5 bg-slate-900 text-white flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider">Performa Rata-Rata Produk</h4>
                  <span className="text-[9px] font-bold text-red-400 bg-red-950/60 px-2 py-0.5 rounded border border-red-900/50">Jember 1</span>
                </div>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase text-[9px]">
                      <th className="p-1.5 sm:p-2">Produk</th>
                      <th className="p-1.5 sm:p-2 text-right">Rata-Rata Penjualan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-bold">
                    <tr>
                      <td className="p-1.5 sm:p-2 text-red-600 font-extrabold">YO Original</td>
                      <td className="p-1.5 sm:p-2 text-right text-slate-900 font-black">{Math.trunc(dashboardData?.rataItem?.YO || 0)} btl</td>
                    </tr>
                    <tr>
                      <td className="p-1.5 sm:p-2 text-amber-500 font-extrabold">OM Mango</td>
                      <td className="p-1.5 sm:p-2 text-right text-slate-900 font-black">{Math.trunc(dashboardData?.rataItem?.OM || 0)} btl</td>
                    </tr>
                    <tr>
                      <td className="p-1.5 sm:p-2 text-pink-500 font-extrabold">OS Stroberi</td>
                      <td className="p-1.5 sm:p-2 text-right text-slate-900 font-black">{Math.trunc(dashboardData?.rataItem?.OS || 0)} btl</td>
                    </tr>
                    <tr>
                      <td className="p-1.5 sm:p-2 text-blue-600 font-extrabold">YT Light</td>
                      <td className="p-1.5 sm:p-2 text-right text-slate-900 font-black">{Math.trunc(dashboardData?.rataItem?.YT || 0)} btl</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 2: // 3. Potensi Sektor Tim
        return (
          <div className={`bg-white rounded-2xl p-3 sm:p-6 border border-slate-100 shadow-sm text-slate-900 ${isFullscreen ? "w-full min-h-full p-2 sm:p-3 border-0 shadow-none flex flex-col justify-center my-auto" : ""}`}>
            {!isFullscreen && (
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <h3 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider">
                  Potensi Sektor Tim
                </h3>
                <span className="text-[8px] font-bold text-slate-400 group-hover:text-red-600 bg-slate-100 group-hover:bg-red-50 px-1.5 py-0.5 rounded transition-all hidden sm:inline-flex items-center gap-1">
                  <Maximize2 className="w-2.5 h-2.5" /> 2x Layar Penuh
                </span>
              </div>
            )}
            <div className={isFullscreen ? "w-full h-[220px] sm:h-[280px]" : "w-full h-[220px] sm:h-[260px]"}>
              <SektorTimChart data={calculateSektorTotals(dashboardData)} />
            </div>
          </div>
        );

      case 3: // 4. Tren Penjualan Harian
        return (
          <div className={`bg-white rounded-2xl p-3 sm:p-6 border border-slate-100 shadow-sm text-slate-900 ${isFullscreen ? "w-full min-h-full p-2 sm:p-3 border-0 shadow-none flex flex-col justify-center my-auto" : ""}`}>
            {!isFullscreen && (
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <h3 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider">
                  Tren Penjualan Harian
                </h3>
                <span className="text-[8px] font-bold text-slate-400 group-hover:text-red-600 bg-slate-100 group-hover:bg-red-50 px-1.5 py-0.5 rounded transition-all hidden sm:inline-flex items-center gap-1">
                  <Maximize2 className="w-2.5 h-2.5" /> 2x Layar Penuh
                </span>
              </div>
            )}
            <div className={isFullscreen ? "w-full h-[220px] sm:h-[280px]" : "w-full h-[220px] sm:h-[260px]"}>
              <TrenHarianChart
                data={(dashboardData?.grafikHarian?.tanggal || []).map((t, idx, arr) => {
                  const currentDay = parseInt(t, 10) || 0;
                  const prevDay = idx > 0 ? (parseInt(arr[idx - 1], 10) || 0) : 0;
                  const gap = idx > 0 ? Math.max(1, currentDay - prevDay) : Math.max(1, currentDay);

                  const baseTarget = dashboardData?.targetTim?.target || targetTKU?.target || 0;
                  const baseBulanLalu = dashboardData?.targetTim?.bulanLalu || targetTKU?.bln_lalu || 0;
                  const baseTahunLalu = dashboardData?.targetTim?.tahunLalu || targetTKU?.thn_lalu || 0;

                  return {
                    tanggal: t,
                    penjualan: dashboardData?.grafikHarian?.penjualan?.[idx] || 0,
                    balikBotol: dashboardData?.grafikHarian?.balikBotol?.[idx] || 0,
                    target: Math.round(baseTarget) * gap,
                    bulanLalu: Math.round(baseBulanLalu) * gap,
                    tahunLalu: Math.round(baseTahunLalu) * gap
                  };
                })}
              />
            </div>
          </div>
        );

      case 4: // 5. Ranking Penjualan Antar YL
        return (
          <div className={`bg-white rounded-2xl p-3 sm:p-6 border border-slate-100 shadow-sm text-slate-900 ${isFullscreen ? "w-full min-h-full p-2 sm:p-3 border-0 shadow-none flex flex-col justify-center my-auto" : ""}`}>
            {!isFullscreen && (
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <h3 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider">
                  Ranking Penjualan Antar YL
                </h3>
                <span className="text-[8px] font-bold text-slate-400 group-hover:text-red-600 bg-slate-100 group-hover:bg-red-50 px-1.5 py-0.5 rounded transition-all hidden sm:inline-flex items-center gap-1">
                  <Maximize2 className="w-2.5 h-2.5" /> 2x Layar Penuh
                </span>
              </div>
            )}
            <div className={isFullscreen ? "w-full min-h-[280px] sm:min-h-[320px]" : "w-full min-h-[280px] sm:min-h-[320px]"}>
              <RankingYLChart
                data={Object.values(dashboardData?.perYL || {}).map(y => ({ nama: cleanYlName(y.nama), akumulasi: y.akumulasi }))}
                isCompact={isFullscreen}
              />
            </div>
          </div>
        );

      case 5: // 6. Target vs Actual per YL
        return (
          <div className={`bg-white rounded-2xl p-3 sm:p-6 border border-slate-100 shadow-sm text-slate-900 ${isFullscreen ? "w-full min-h-full p-2 sm:p-3 border-0 shadow-none flex flex-col justify-center my-auto" : ""}`}>
            {!isFullscreen && (
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <h3 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider">
                  Target vs Actual per YL
                </h3>
                <span className="text-[8px] font-bold text-slate-400 group-hover:text-red-600 bg-slate-100 group-hover:bg-red-50 px-1.5 py-0.5 rounded transition-all hidden sm:inline-flex items-center gap-1">
                  <Maximize2 className="w-2.5 h-2.5" /> 2x Layar Penuh
                </span>
              </div>
            )}
            <div className={isFullscreen ? "w-full h-[220px] sm:h-[280px]" : "w-full h-[220px] sm:h-[260px]"}>
              <TargetVsActualChart data={Object.values(dashboardData?.perYL || {}).map(y => ({ nama: cleanYlName(y.nama), target: y.targetYL, actual: Math.trunc(y.rata2) }))} />
            </div>
          </div>
        );

      case 6: // 7. Kinerja Akumulatif & Rata-Rata YL
        return (
          <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden text-slate-900 ${isFullscreen ? "w-full min-h-full border-0 shadow-none flex flex-col justify-between my-auto" : ""}`}>
            {!isFullscreen && (
              <div className="p-2 sm:p-3 bg-red-950 text-white flex items-center justify-between shrink-0">
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider">Kinerja Akumulatif & Rata-Rata YL</h3>
                <div className="flex items-center gap-2">
                  <span className="text-[8px] font-bold text-slate-400 group-hover:text-red-400 bg-red-900/40 px-1.5 py-0.5 rounded transition-all hidden sm:inline-flex items-center gap-1">
                    <Maximize2 className="w-2.5 h-2.5" /> 2x Layar Penuh
                  </span>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-900/50">Jember 1</span>
                </div>
              </div>
            )}
            <div className={`overflow-x-auto overflow-y-auto ${isFullscreen ? "flex-1 min-h-0" : ""}`}>
              <table className="w-full text-left text-[10px] sm:text-xs border-collapse min-w-[460px] sm:min-w-full">
                <thead className="sticky top-0 bg-slate-50 z-10 shadow-xs">
                  <tr className="border-b border-slate-200 text-slate-500 font-extrabold uppercase text-[8.5px] sm:text-[10px]">
                    <th className={`bg-slate-50 whitespace-nowrap ${isFullscreen ? "p-1 sm:p-1.5 text-[8px] sm:text-[9px]" : "p-1.5 sm:p-3"}`}>Nama YL</th>
                    <th className={`text-right bg-slate-50 whitespace-nowrap ${isFullscreen ? "p-1 sm:p-1.5 text-[8px] sm:text-[9px]" : "p-1.5 sm:p-3"}`}>Akm</th>
                    <th className={`text-right bg-slate-50 whitespace-nowrap ${isFullscreen ? "p-1 sm:p-1.5 text-[8px] sm:text-[9px]" : "p-1.5 sm:p-3"}`}>Rata2/hr</th>
                    <th className={`text-right bg-slate-50 whitespace-nowrap ${isFullscreen ? "p-1 sm:p-1.5 text-[8px] sm:text-[9px]" : "p-1.5 sm:p-3"}`}>vs Tgt</th>
                    <th className={`text-right bg-slate-50 whitespace-nowrap ${isFullscreen ? "p-1 sm:p-1.5 text-[8px] sm:text-[9px]" : "p-1.5 sm:p-3"}`}>vs Bln</th>
                    <th className={`text-right bg-slate-50 whitespace-nowrap ${isFullscreen ? "p-1 sm:p-1.5 text-[8px] sm:text-[9px]" : "p-1.5 sm:p-3"}`}>vs Thn</th>
                    <th className={`text-right bg-slate-50 whitespace-nowrap ${isFullscreen ? "p-1 sm:p-1.5 text-[8px] sm:text-[9px]" : "p-1.5 sm:p-3"}`}>BB %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold">
                  {Object.values(dashboardData?.perYL || {}).map((y: any) => {
                    const vsTgt = y.targetYL > 0 ? Math.trunc((y.rata2 / y.targetYL) * 100) : 0;
                    const vsBln = y.bulanLaluYL > 0 ? Math.trunc((y.rata2 / y.bulanLaluYL) * 100) : 0;
                    const vsThn = y.tahunLaluYL > 0 ? Math.trunc((y.rata2 / y.tahunLaluYL) * 100) : 0;
                    const bbPct = (y.akumulasi + y.bbYL) > 0 ? Math.trunc((y.bbYL / (y.akumulasi + y.bbYL)) * 100) : 0;
                    return (
                      <tr key={y.nama} className="hover:bg-slate-50 text-slate-800">
                        <td className={`truncate font-extrabold max-w-[100px] sm:max-w-[140px] ${isFullscreen ? "px-1 py-0.5 sm:px-1.5 sm:py-1 text-[9.5px] sm:text-xs" : "p-1.5 sm:p-3"}`}>{y.nama}</td>
                        <td className={`text-right text-emerald-600 font-extrabold whitespace-nowrap ${isFullscreen ? "px-1 py-0.5 sm:px-1.5 sm:py-1 text-[9.5px] sm:text-xs" : "p-1.5 sm:p-3"}`}>{y.akumulasi}</td>
                        <td className={`text-right text-slate-900 font-black whitespace-nowrap ${isFullscreen ? "px-1 py-0.5 sm:px-1.5 sm:py-1 text-[9.5px] sm:text-xs" : "p-1.5 sm:p-3"}`}>{Math.trunc(y.rata2)}</td>
                        <td className={`text-right text-blue-600 whitespace-nowrap ${isFullscreen ? "px-1 py-0.5 sm:px-1.5 sm:py-1 text-[9.5px] sm:text-xs" : "p-1.5 sm:p-3"}`}>{vsTgt}%</td>
                        <td className={`text-right text-purple-600 whitespace-nowrap ${isFullscreen ? "px-1 py-0.5 sm:px-1.5 sm:py-1 text-[9.5px] sm:text-xs" : "p-1.5 sm:p-3"}`}>{vsBln}%</td>
                        <td className={`text-right text-teal-600 whitespace-nowrap ${isFullscreen ? "px-1 py-0.5 sm:px-1.5 sm:py-1 text-[9.5px] sm:text-xs" : "p-1.5 sm:p-3"}`}>{vsThn}%</td>
                        <td className={`text-right text-rose-600 whitespace-nowrap ${isFullscreen ? "px-1 py-0.5 sm:px-1.5 sm:py-1 text-[9.5px] sm:text-xs" : "p-1.5 sm:p-3"}`}>{bbPct}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* FULLSCREEN MODAL SLIDER */}
      {fullscreenCardIndex !== null && (
        <div
          className="fixed inset-0 z-[9999] bg-slate-950 p-1 sm:p-2 flex items-center justify-center select-none animate-in fade-in duration-200 overflow-hidden"
          onTouchStart={handleModalTouchStart}
          onTouchEnd={handleModalTouchEnd}
        >
          <div className="w-full h-full max-w-7xl mx-auto bg-white rounded-xl sm:rounded-2xl shadow-2xl p-1.5 sm:p-2.5 flex flex-col justify-between relative overflow-hidden text-slate-900 border border-slate-200">
            {/* Header INSIDE Card */}
            <div className="flex items-center justify-between pb-1 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="bg-red-600 text-white text-[10px] sm:text-xs font-black px-1.5 py-0.5 rounded shadow shrink-0">
                  {fullscreenCardIndex + 1} / {cardsCount}
                </span>
                <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                  {cardTitles[fullscreenCardIndex]}
                </h3>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="hidden lg:inline text-[10px] text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  💡 Usap Layar (Swipe) ke Kiri / Kanan
                </span>
                <button
                  onClick={() => setFullscreenCardIndex(null)}
                  className="bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 hover:text-slate-900 px-2 py-0.5 rounded font-bold text-xs flex items-center gap-1 transition-all cursor-pointer border border-slate-300"
                  title="Tutup Layar Penuh"
                >
                  <X className="w-3.5 h-3.5 text-slate-600" />
                  <span className="hidden sm:inline">Tutup</span>
                </button>
              </div>
            </div>

            {/* Content Area INSIDE Card */}
            <div className="flex-1 min-h-0 overflow-y-auto relative py-0.5 px-0.5 sm:px-2 flex flex-col">
              {/* Active Card Content */}
              <div className="w-full flex-1 flex flex-col justify-start my-1">
                {renderCardContent(fullscreenCardIndex, true)}
              </div>
            </div>

            {/* Footer Navigation INSIDE Card */}
            <div className="flex items-center justify-center pt-1 border-t border-slate-100 shrink-0">
              {/* Slide dots indicator */}
              <div className="flex items-center gap-1.5 overflow-x-auto max-w-[200px] sm:max-w-none px-2 py-0.5">
                {Array.from({ length: cardsCount }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setFullscreenCardIndex(i)}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      i === fullscreenCardIndex ? "w-5 bg-red-600" : "w-1.5 bg-slate-300 hover:bg-slate-400"
                    }`}
                    title={cardTitles[i]}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DASHBOARD NORMAL VIEW */}
      {/* 1. Ringkasan Utama Tim (Card 0) */}
      <div
        onDoubleClick={() => setFullscreenCardIndex(0)}
        onTouchEnd={() => handleCardTouchEnd(0)}
        className="cursor-pointer transition-all hover:ring-2 hover:ring-red-500/40 rounded-2xl group select-none"
        title="Ketuk 2x untuk Layar Penuh"
      >
        {renderCardContent(0)}
      </div>

      {/* 2. Komposisi & Performa Produk (Card 1) */}
      <div
        onDoubleClick={() => setFullscreenCardIndex(1)}
        onTouchEnd={() => handleCardTouchEnd(1)}
        className="cursor-pointer transition-all hover:ring-2 hover:ring-indigo-500/40 rounded-2xl group select-none"
        title="Ketuk 2x untuk Layar Penuh"
      >
        {renderCardContent(1)}
      </div>

      {/* 3. Potensi Sektor Tim (Card 2) */}
      <div
        onDoubleClick={() => setFullscreenCardIndex(2)}
        onTouchEnd={() => handleCardTouchEnd(2)}
        className="cursor-pointer transition-all hover:ring-2 hover:ring-indigo-500/40 rounded-2xl group select-none"
        title="Ketuk 2x untuk Layar Penuh"
      >
        {renderCardContent(2)}
      </div>

      {/* 4. Tren Penjualan Harian (Card 3) */}
      <div
        onDoubleClick={() => setFullscreenCardIndex(3)}
        onTouchEnd={() => handleCardTouchEnd(3)}
        className="cursor-pointer transition-all hover:ring-2 hover:ring-indigo-500/40 rounded-2xl group select-none"
        title="Ketuk 2x untuk Layar Penuh"
      >
        {renderCardContent(3)}
      </div>

      {/* 5. Ranking Penjualan Antar YL (Card 4) */}
      <div
        onDoubleClick={() => setFullscreenCardIndex(4)}
        onTouchEnd={() => handleCardTouchEnd(4)}
        className="cursor-pointer transition-all hover:ring-2 hover:ring-indigo-500/40 rounded-2xl group select-none"
        title="Ketuk 2x untuk Layar Penuh"
      >
        {renderCardContent(4)}
      </div>

      {/* 6. Target vs Actual per YL (Card 5) */}
      <div
        onDoubleClick={() => setFullscreenCardIndex(5)}
        onTouchEnd={() => handleCardTouchEnd(5)}
        className="cursor-pointer transition-all hover:ring-2 hover:ring-indigo-500/40 rounded-2xl group select-none"
        title="Ketuk 2x untuk Layar Penuh"
      >
        {renderCardContent(5)}
      </div>

      {/* 7. Kinerja Akumulatif & Rata-Rata YL (Card 6) */}
      <div
        onDoubleClick={() => setFullscreenCardIndex(6)}
        onTouchEnd={() => handleCardTouchEnd(6)}
        className="cursor-pointer transition-all hover:ring-2 hover:ring-red-500/40 rounded-2xl group select-none"
        title="Ketuk 2x untuk Layar Penuh"
      >
        {renderCardContent(6)}
      </div>
    </div>
  );
}

export const ManagerDashboardTab = React.memo(ManagerDashboardTabInner);
