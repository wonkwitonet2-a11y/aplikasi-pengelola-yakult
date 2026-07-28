import React from "react";
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
  if (!dashboardData) {
    return (
      <div className="p-12 text-center text-slate-500 font-bold bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center gap-3 my-4">
        <div className="w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin" />
        <span>Memuat Data Dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Overview Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Total Penjualan Card */}
        <div className="bg-white rounded-2xl p-4 border border-red-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-red-600" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Total Penjualan Tim</span>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-2xl font-black text-slate-900">{Math.trunc(dashboardData?.totalPenjualan || 0).toLocaleString("id-ID")}</span>
            <span className="text-xs font-bold text-slate-500">btl</span>
          </div>
          <div className="mt-1 flex items-center gap-1">
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Bulan Berjalan</span>
          </div>
        </div>

        {/* Rata-Rata Tim Card - Moved Here to Replace Target Bulanan */}
        <div className="bg-white rounded-2xl p-4 border border-amber-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Rata-Rata Tim</span>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-2xl font-black text-slate-900">{Math.trunc(dashboardData?.rataHarian || 0).toLocaleString("id-ID")}</span>
            <span className="text-xs font-bold text-slate-500">btl/hr</span>
          </div>
          <div className="mt-1 text-[10px] text-slate-500 font-bold">
            Berdasarkan divisor {dashboardData?.hariAktif || 0} hari aktif
          </div>
        </div>
      </div>

      {/* Capaian vs Perbandingan Grid */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
        <h2 className="text-xs font-black text-red-950 uppercase tracking-wider flex items-center gap-2 mb-3 border-l-4 border-red-600 pl-2">
          Capaian vs Perbandingan
        </h2>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
            <span className="text-[9px] font-bold text-slate-400 uppercase block">vs Target</span>
            <span className="text-lg font-black text-blue-600 mt-1 block">{Math.trunc(dashboardData?.vsTarget || 0)}%</span>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
            <span className="text-[9px] font-bold text-slate-400 uppercase block">vs Bulan Lalu</span>
            <span className="text-lg font-black text-purple-600 mt-1 block">{Math.trunc(dashboardData?.vsBulanLalu || 0)}%</span>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
            <span className="text-[9px] font-bold text-slate-400 uppercase block">vs Tahun Lalu</span>
            <span className="text-lg font-black text-teal-600 mt-1 block">{Math.trunc(dashboardData?.vsTahunLalu || 0)}%</span>
          </div>
        </div>
      </div>

      {/* Ringkasan Operasional - Without Deleted YL Aktif Metric */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
        <h2 className="text-xs font-black text-red-950 uppercase tracking-wider flex items-center gap-2 mb-3 border-l-4 border-red-600 pl-2">
          Ringkasan Operasional
        </h2>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-slate-50 rounded-xl p-2.5 text-center">
            <span className="text-[8px] font-black text-slate-400 uppercase block">Sales/YL/Hari</span>
            <span className="text-sm font-black text-slate-800 mt-1 block">{Math.trunc(dashboardData?.salesPerYl || 0)} btl</span>
          </div>
          <div className="bg-slate-50 rounded-xl p-2.5 text-center">
            <span className="text-[8px] font-black text-slate-400 uppercase block">JWP</span>
            <span className="text-sm font-black text-slate-800 mt-1 block">{dashboardData?.jwp || 0} jam</span>
          </div>
          <div className="bg-slate-50 rounded-xl p-2.5 text-center">
            <span className="text-[8px] font-black text-slate-400 uppercase block">BB Tim</span>
            <span className="text-sm font-black text-rose-600 mt-1 block">
              {Math.trunc(((dashboardData?.bbTimRaw || 0) / ((dashboardData?.totalPenjualan || 0) + (dashboardData?.bbTimRaw || 0) || 1)) * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* CHARTS CONTAINER GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Chart 1: Ranking YL */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Ranking Penjualan Antar YL</h3>
          <RankingYLChart data={Object.values(dashboardData?.perYL || {}).map(y => ({ nama: cleanYlName(y.nama), akumulasi: y.akumulasi }))} />
        </div>

        {/* Chart 2: Komposisi Produk */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Komposisi Produk Terjual</h3>
          <KomposisiProdukChart
            yo={currentMonthTotal(dashboardData?.perYL || {}, "yo")}
            om={currentMonthTotal(dashboardData?.perYL || {}, "om")}
            os={currentMonthTotal(dashboardData?.perYL || {}, "os")}
            yt={currentMonthTotal(dashboardData?.perYL || {}, "yt")}
          />
        </div>

        {/* Chart 3: Target vs Actual */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Target vs Actual per YL</h3>
          <TargetVsActualChart data={Object.values(dashboardData?.perYL || {}).map(y => ({ nama: cleanYlName(y.nama), target: y.targetYL, actual: Math.trunc(y.rata2) }))} />
        </div>

        {/* Chart 4: Potensi Sektor Tim */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Potensi Sektor Tim</h3>
          <SektorTimChart data={calculateSektorTotals(dashboardData)} />
        </div>

        {/* Chart 5: Tren Harian */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm md:col-span-2">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Tren Penjualan</h3>
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
                target: Math.round(baseTarget * gap),
                bulanLalu: Math.round(baseBulanLalu * gap),
                tahunLalu: Math.round(baseTahunLalu * gap)
              };
            })}
          />
        </div>
      </div>

      {/* Performa Produk Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider">Performa Rata-Rata Produk</h3>
          <span className="text-[10px] font-bold text-red-400 bg-red-950/50 px-2 py-0.5 rounded border border-red-900/50">Jember 1</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase text-[9px]">
                <th className="p-3">Produk</th>
                <th className="p-3 text-right">Rata-Rata Penjualan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="p-3 font-bold text-red-600">YO Original</td>
                <td className="p-3 text-right font-extrabold text-slate-900">{Math.trunc(dashboardData?.rataItem?.YO || 0)} btl</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-amber-500">OM Mango</td>
                <td className="p-3 text-right font-extrabold text-slate-900">{Math.trunc(dashboardData?.rataItem?.OM || 0)} btl</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-pink-500">OS Stroberi</td>
                <td className="p-3 text-right font-extrabold text-slate-900">{Math.trunc(dashboardData?.rataItem?.OS || 0)} btl</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-blue-600">YT Light</td>
                <td className="p-3 text-right font-extrabold text-slate-900">{Math.trunc(dashboardData?.rataItem?.YT || 0)} btl</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export const ManagerDashboardTab = React.memo(ManagerDashboardTabInner);
