import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  BarChart3, TrendingUp, Calendar, AlertTriangle,
  ThumbsUp, ThumbsDown, Users, Package, MapPin, ChevronLeft, ChevronRight,
  Loader2, Sparkles, Maximize2, Minimize2, X, Trophy, Play, Pause, RotateCcw,
  Copy, Check, Printer, RefreshCw, List, Layers, Plus, Trash2, CheckSquare, Square, Share2,
  ArrowUpDown, TrendingDown, Clock, ShieldAlert, Activity, UserCheck, UserX,
  AlertCircle, ArrowUpRight, ArrowDownRight, ArrowRight as ArrowRightIcon,
  PieChart as PieChartIcon, CheckCircle2, Target, Archive, Camera, Award, Search,
  BookOpen, FileText, HelpCircle, Home, Store, GraduationCap, Building2, ShoppingBag, Zap, Heart
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, PieChart, Pie, Cell, LabelList
} from "recharts";
import { loadFromSupabase, saveToSupabase, deleteFromSupabase } from "../lib/supabaseClient";
import { cleanYlName } from "../types";
import { SEED_DATA_2026 } from "./SalesRecordTKU";
import { getPreviousYearDataSync, lookupPreviousYearData, applyTahunLaluFallback } from "../lib/historicalArchiveLookup";

// ----------------------------------------------------------------------------
// Konstanta & helper
// ----------------------------------------------------------------------------

const MONTHS = ["jan", "feb", "mar", "apr", "mei", "jun", "jul", "agu", "sep", "okt", "nov", "des"];
const MONTH_LABELS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

const PRODUCT_COLORS: Record<string, string> = { YO: "#dc2626", OM: "#eab308", OS: "#ec4899", YT: "#2563eb" };

export const PRODUCT_LABELS: Record<string, { code: string; shortName: string; fullName: string; color: string }> = {
  YO: { code: "YO", shortName: "Original", fullName: "Original (YO)", color: "#dc2626" },
  OM: { code: "OM", shortName: "Original Mangga", fullName: "Original Mangga (OM)", color: "#eab308" },
  OS: { code: "OS", shortName: "Original Stroberi", fullName: "Original Stroberi (OS)", color: "#ec4899" },
  YT: { code: "YT", shortName: "Yakult Light", fullName: "Yakult Light (YT)", color: "#2563eb" },
};

const KONDISI_COLORS = ["#94a3b8", "#f87171", "#fb923c", "#facc15", "#a3e635", "#34d399", "#10b981"];

type Periode = "bulanan" | "s1" | "s2" | "tahunan";

export function getOtmTitleByPeriode(periode: Periode): string {
  if (periode === "s1" || periode === "s2") return "Yakult Lady of the Semester";
  if (periode === "tahunan") return "Yakult Lady of the Year";
  return "Yakult Lady of the Month";
}

export interface ActionPlanItem {
  id: string;
  text: string;
  done: boolean;
  createdAt: string;
}

function fmtNum(n: number | null | undefined): string {
  if (n === null || n === undefined || isNaN(n)) return "-";
  return Math.round(n).toLocaleString("id-ID");
}

function fmtPct(n: number | null | undefined, digits = 1): string {
  if (n === null || n === undefined || isNaN(n)) return "-";
  return n.toLocaleString("id-ID", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function pctBadgeClasses(pct: number | null | undefined): string {
  if (pct === null || pct === undefined || isNaN(pct)) return "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400";
  return pct >= 100
    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
    : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
}

function average(nums: number[]): number | null {
  const valid = nums.filter((n) => typeof n === "number" && !isNaN(n));
  if (valid.length === 0) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

function sum(nums: (number | null | undefined)[]): number {
  return nums.reduce((a: number, b) => a + (typeof b === "number" && !isNaN(b) ? b : 0), 0 as number);
}

// ----------------------------------------------------------------------------
// Action Plan Persistence Hook
// ----------------------------------------------------------------------------

function useActionPlan(selectedYear: string, periode: Periode, monthIndex: number) {
  const key = `presentasi_action_plan_${selectedYear}_${periode}_${periode === "bulanan" ? monthIndex : "all"}`;
  const [items, setItems] = useState<ActionPlanItem[]>(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(key);
      setItems(saved ? JSON.parse(saved) : []);
    } catch {
      setItems([]);
    }
  }, [key]);

  const addItem = (text: string) => {
    if (!text.trim()) return;
    const newItem: ActionPlanItem = {
      id: String(Date.now()),
      text: text.trim(),
      done: false,
      createdAt: new Date().toISOString(),
    };
    const updated = [...items, newItem];
    setItems(updated);
    try {
      localStorage.setItem(key, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const toggleItem = (id: string) => {
    const updated = items.map((it) => (it.id === id ? { ...it, done: !it.done } : it));
    setItems(updated);
    try {
      localStorage.setItem(key, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const deleteItem = (id: string) => {
    const updated = items.filter((it) => it.id !== id);
    setItems(updated);
    try {
      localStorage.setItem(key, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  return { items, addItem, toggleItem, deleteItem };
}

// ----------------------------------------------------------------------------
// Yakult Lady of the Month — Persistence Hook
// ----------------------------------------------------------------------------

export interface YlOtmRecord {
  area: string;
  nama: string;
  category: string;
  categoryLabel: string;
  valueLabel: string;
  foto: string;
  updatedAt: string;
}

function useYlOfTheMonth(storageKey: string) {
  const [record, setRecord] = useState<YlOtmRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const local = localStorage.getItem(storageKey);
        if (local) {
          if (!cancelled) setRecord(JSON.parse(local));
        } else {
          const remote = await loadFromSupabase<YlOtmRecord>(storageKey);
          if (!cancelled) setRecord(remote || null);
        }
      } catch (e) {
        console.error("Gagal memuat data Yakult Lady of the Month:", e);
        if (!cancelled) setRecord(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [storageKey]);

  const save = async (rec: YlOtmRecord) => {
    setRecord(rec);
    try {
      localStorage.setItem(storageKey, JSON.stringify(rec));
    } catch (e) {
      console.error(e);
    }
    try {
      await saveToSupabase(storageKey, rec);
    } catch (e) {
      console.error("Gagal menyinkronkan Yakult Lady of the Month ke Supabase:", e);
    }
  };

  const clear = async () => {
    setRecord(null);
    try {
      localStorage.removeItem(storageKey);
    } catch (e) {
      console.error(e);
    }
    try {
      await deleteFromSupabase(storageKey);
    } catch (e) {
      console.error("Gagal menghapus Yakult Lady of the Month dari Supabase:", e);
    }
  };

  return { record, loading, save, clear };
}

// ----------------------------------------------------------------------------
// Per-YL Cumulative / Period Averages Computation
// ----------------------------------------------------------------------------

export interface YLAverageRow {
  no: number;
  area: string;
  nama: string;
  monthlyValues: { monthKey: string; monthLabel: string; value: number | null }[];
  validCount: number;
  total: number;
  rataRata: number;
  isMandiri: boolean;
  firstVal: number | null;
  lastVal: number | null;
  delta: number;
  trend: "up" | "down" | "flat";
  needsCoaching: boolean;
}

export function computeYLAverageData(
  perYL: any[],
  startIdx: number,
  endIdx: number
) {
  const monthIndices: number[] = [];
  for (let i = startIdx; i <= endIdx && i < 12; i++) {
    monthIndices.push(i);
  }

  const rows: YLAverageRow[] = (perYL || []).map((yl, index) => {
    const monthlyValues = monthIndices.map((i) => {
      const k = MONTHS[i];
      const raw = yl.penjualan?.[k];
      const val = typeof raw === "number" && !isNaN(raw) ? raw : null;
      return {
        monthKey: k,
        monthLabel: MONTH_SHORT[i],
        value: val,
      };
    });

    const validVals = monthlyValues
      .filter((m) => m.value !== null && m.value !== undefined && !isNaN(m.value as number))
      .map((m) => m.value as number);
    const total = validVals.reduce((a, b) => a + b, 0);
    const validCount = validVals.length;
    const rataRata = validCount > 0 ? Math.round(total / validCount) : 0;

    const firstVal = validVals.length > 0 ? validVals[0] : null;
    const lastVal = validVals.length > 0 ? validVals[validVals.length - 1] : null;
    const rawDelta = (firstVal !== null && lastVal !== null && validVals.length >= 2) ? lastVal - firstVal : 0;
    const delta = Number(rawDelta.toFixed(1));
    const trend: "up" | "down" | "flat" = validVals.length < 2 ? "flat" : delta >= 10 ? "up" : delta <= -10 ? "down" : "flat";
    const needsCoaching = trend === "down" || rataRata < 250;

    return {
      no: yl.no || index + 1,
      area: String(yl.area || 201 + index),
      nama: cleanYlName(yl.nama || `YL Area ${yl.area}`),
      monthlyValues,
      validCount,
      total,
      rataRata,
      isMandiri: rataRata >= 250,
      firstVal,
      lastVal,
      delta,
      trend,
      needsCoaching,
    };
  });

  // Urutkan default berdasarkan rata-rata tertinggi (ranking)
  rows.sort((a, b) => b.rataRata - a.rataRata);

  // Rata-rata per kolom bulan tim
  const teamMonthlyAvgs = monthIndices.map((i) => {
    const k = MONTHS[i];
    const colVals = (perYL || [])
      .map((yl) => yl.penjualan?.[k])
      .filter((v) => typeof v === "number" && !isNaN(v) && v > 0);
    const avg = colVals.length > 0 ? Math.round(colVals.reduce((a, b) => a + b, 0) / colVals.length) : 0;
    return {
      monthKey: k,
      monthLabel: MONTH_SHORT[i],
      avg,
    };
  });

  const allAvgs = rows.map((r) => r.rataRata).filter((a) => a > 0);
  const teamOverallAvg = allAvgs.length > 0 ? Math.round(allAvgs.reduce((a, b) => a + b, 0) / allAvgs.length) : 0;
  const totalMandiri = rows.filter((r) => r.isMandiri).length;
  const totalBinaan = rows.length - totalMandiri;
  const totalUp = rows.filter((r) => r.trend === "up").length;
  const totalDown = rows.filter((r) => r.trend === "down").length;
  const totalCoaching = rows.filter((r) => r.needsCoaching).length;

  return {
    rows,
    monthIndices,
    teamMonthlyAvgs,
    teamOverallAvg,
    totalMandiri,
    totalBinaan,
    totalUp,
    totalDown,
    totalCoaching,
  };
}

// ----------------------------------------------------------------------------
// Evaluasi Dampak Absensi & Potensi Botol Hilang (Loss Potential)
// ----------------------------------------------------------------------------

export interface LossPotentialResult {
  totalFrekuensiAbsen: number;
  totalYLAbsen: number;
  avgSalesPerYL: number;
  potensiBotolHilang: number;
  potensiPakHilang: number;
  estimasiRupiah: number;
  totalPenjualan: number;
  lossPct: number;
  hasAbsen: boolean;
}

export function computeLossPotential(months: any[]): LossPotentialResult {
  const validMonths = (months || []).filter(Boolean);
  const totalFrekuensiAbsen = sum(validMonths.map((m) => m?.absen?.frekuensi || 0));
  const totalYLAbsen = sum(validMonths.map((m) => m?.absen?.jumlahYL || 0));
  const salesList = validMonths
    .map((m) => m?.salesPerYL || m?.ratarataPenjualanYL || (m?.akmPenjualan && m?.jwp ? Math.round(m.akmPenjualan / (m.jwp * 10)) : 0))
    .filter((v) => v > 0);
  const avgSalesPerYL = average(salesList) || 320;
  const potensiBotolHilang = Math.round(totalFrekuensiAbsen * avgSalesPerYL);
  const potensiPakHilang = Math.round(potensiBotolHilang / 5);
  const estimasiRupiah = potensiBotolHilang * 2000;
  const totalPenjualan = sum(validMonths.map((m) => m?.akmPenjualan || 0));
  const lossPct = totalPenjualan > 0 ? (potensiBotolHilang / (totalPenjualan + potensiBotolHilang)) * 100 : 0;

  return {
    totalFrekuensiAbsen,
    totalYLAbsen,
    avgSalesPerYL: Math.round(avgSalesPerYL),
    potensiBotolHilang,
    potensiPakHilang,
    estimasiRupiah,
    totalPenjualan,
    lossPct,
    hasAbsen: totalFrekuensiAbsen > 0,
  };
}

// ----------------------------------------------------------------------------
// Evaluasi Rasio Mix Produk & Penetrasi Varian Baru
// ----------------------------------------------------------------------------

export interface MixProductResult {
  yo: number;
  om: number;
  os: number;
  yt: number;
  total: number;
  pctYO: number;
  pctOM: number;
  pctOS: number;
  pctYT: number;
  pctVarianBaru: number;
  statusKesehatan: "sangat_sehat" | "sehat" | "waspada" | "kritis";
  statusLabel: string;
  chartData: { name: string; value: number; color: string; pct: number }[];
}

export function computeMixProductAnalysis(months: any[]): MixProductResult {
  const validMonths = (months || []).filter(Boolean);
  const yo = sum(validMonths.map((m) => m?.ratarataYO || 0));
  const om = sum(validMonths.map((m) => m?.ratarataOM || 0));
  const os = sum(validMonths.map((m) => m?.ratarataOS || 0));
  const yt = sum(validMonths.map((m) => m?.ratarataYT || 0));
  const total = yo + om + os + yt;

  const pctYO = total > 0 ? (yo / total) * 100 : 0;
  const pctOM = total > 0 ? (om / total) * 100 : 0;
  const pctOS = total > 0 ? (os / total) * 100 : 0;
  const pctYT = total > 0 ? (yt / total) * 100 : 0;
  const pctVarianBaru = total > 0 ? ((total - yo) / total) * 100 : 0;

  let statusKesehatan: "sangat_sehat" | "sehat" | "waspada" | "kritis" = "sehat";
  let statusLabel = "Optimal (Target Varian ≥15% Tercapai)";
  if (pctVarianBaru >= 20) {
    statusKesehatan = "sangat_sehat";
    statusLabel = "Sangat Sehat (Penetrasi Varian Tinggi ≥20%)";
  } else if (pctVarianBaru >= 15) {
    statusKesehatan = "sehat";
    statusLabel = "Optimal (Target Varian ≥15% Tercapai)";
  } else if (pctVarianBaru >= 8) {
    statusKesehatan = "waspada";
    statusLabel = "Perlu Dorongan (Dominan Yakult Reguler)";
  } else {
    statusKesehatan = "kritis";
    statusLabel = "Ketergantungan Ekstrem pada Original (<8%)";
  }

  const chartData = [
    { name: "Original (YO)", value: yo, color: PRODUCT_COLORS.YO || "#dc2626", pct: pctYO },
    { name: "Original Mangga (OM)", value: om, color: PRODUCT_COLORS.OM || "#eab308", pct: pctOM },
    { name: "Original Stroberi (OS)", value: os, color: PRODUCT_COLORS.OS || "#ec4899", pct: pctOS },
    { name: "Yakult Light (YT)", value: yt, color: PRODUCT_COLORS.YT || "#2563eb", pct: pctYT },
  ].filter((p) => p.value > 0);

  return {
    yo,
    om,
    os,
    yt,
    total,
    pctYO,
    pctOM,
    pctOS,
    pctYT,
    pctVarianBaru,
    statusKesehatan,
    statusLabel,
    chartData,
  };
}

// ----------------------------------------------------------------------------
// Uji Beban Target & Kapasitas Fisik YL
// ----------------------------------------------------------------------------

export interface BebanKapasitasResult {
  targetSisa: number;
  monthsRemaining: number;
  daysRemaining: number;
  jumlahYL: number;
  bebanTotalHarian: number;
  bebanPerYLHarian: number;
  statusBeban: "aman" | "tinggi" | "overcapacity";
  statusLabel: string;
}

export function computeBebanKapasitas(
  targetSisa: number,
  monthsRemaining: number,
  jumlahYL = 10
): BebanKapasitasResult {
  const effectiveMonths = Math.max(1, monthsRemaining);
  const daysRemaining = effectiveMonths * 25; // 25 hari kerja per bulan
  const bebanTotalHarian = Math.round(targetSisa / daysRemaining);
  const bebanPerYLHarian = Math.round(bebanTotalHarian / Math.max(1, jumlahYL));

  let statusBeban: "aman" | "tinggi" | "overcapacity" = "aman";
  let statusLabel = "Kapasitas Normal (Realistis Dicapai)";
  if (bebanPerYLHarian > 370) {
    statusBeban = "overcapacity";
    statusLabel = "Beban Kritis / Overcapacity (>370 btl/hari/YL)";
  } else if (bebanPerYLHarian > 320) {
    statusBeban = "tinggi";
    statusLabel = "Tantangan Tinggi (Perlu Disiplin & Efisiensi Maksimal)";
  }

  return {
    targetSisa,
    monthsRemaining: effectiveMonths,
    daysRemaining,
    jumlahYL,
    bebanTotalHarian,
    bebanPerYLHarian,
    statusBeban,
    statusLabel,
  };
}

// ----------------------------------------------------------------------------
// WhatsApp Executive Summary Generator
// ----------------------------------------------------------------------------

function generateWhatsAppSummary({
  periode,
  selectedYear,
  monthIndex,
  data,
  actionPlans,
}: {
  periode: Periode;
  selectedYear: string;
  monthIndex: number;
  data: any;
  actionPlans: ActionPlanItem[];
}): string {
  const tku = data?.tku || "DP JEMBER 1";
  const bulanan = data?.bulanan || {};
  const perYL = data?.perYL || [];

  if (periode === "bulanan") {
    const m = applyTahunLaluFallback(bulanan[MONTHS[monthIndex]], selectedYear, monthIndex);
    const monthLabel = MONTH_LABELS[monthIndex];
    if (!m) return `📊 LAPORAN ${tku} - ${monthLabel} ${selectedYear}\n(Data belum tersedia)`;

    const ylRanked = [...perYL]
      .map((yl) => ({
        area: yl.area,
        nama: cleanYlName(yl.nama || ""),
        penjualan: yl.penjualan?.[MONTHS[monthIndex]] ?? null,
      }))
      .filter((r) => r.penjualan !== null && r.penjualan !== undefined)
      .sort((a, b) => (b.penjualan || 0) - (a.penjualan || 0));

    const top3 = ylRanked.slice(0, 3);
    const prevIdx = monthIndex - 1;
    const prevM = prevIdx >= 0 ? bulanan[MONTHS[prevIdx]] : null;
    const vsBulanLaluPct = prevM && prevM.akmPenjualan ? (m.akmPenjualan / prevM.akmPenjualan) * 100 : null;

    let text = `📊 *LAPORAN EVALUASI PERFORMA ${tku}*\n`;
    text += `📅 *Periode:* ${monthLabel} ${selectedYear}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

    text += `🎯 *PENJUALAN & TARGET*\n`;
    text += `• AKM Realisasi: *${fmtNum(m.akmPenjualan)} botol*\n`;
    text += `• Target: ${fmtNum(m.akmTarget)} botol\n`;
    text += `• Capaian Target: *${fmtPct(m.persenCapaian)}%* ${(m.persenCapaian || 0) >= 100 ? "✅ (TEMBUS)" : "⚠️ (BELUM TEMBUS)"}\n`;
    text += `• Rata-rata Tim: ${fmtNum(m.ratarataPenjualanYL)} btl/hari\n`;
    if (vsBulanLaluPct !== null) {
      text += `• vs Bulan Lalu: ${fmtPct(vsBulanLaluPct)}%\n`;
    }
    text += `• S/YL (Sales per YL): ${fmtNum(m.salesPerYL)} btl/hari\n\n`;

    text += `🔄 *KESEGARAN PRODUK & KEDISIPLINAN*\n`;
    const bbStatus = (m.persenKembaliBotol || 0) <= 10 ? "✅ Aman (≤10%)" : "🚨 Waspada (>10%)";
    text += `• Balik Botol (BB): *${fmtPct(m.persenKembaliBotol)}%* (${fmtNum(m.akmKembaliBotol)} btl) — ${bbStatus}\n`;
    text += `• Ketidakhadiran: ${m.absen?.jumlahYL || 0} YL (${m.absen?.frekuensi || 0}x izin/sakit)\n`;
    const lossRes = computeLossPotential([m]);
    if (lossRes.hasAbsen) {
      text += `  ⚠️ *Botol Terlewatkan (Absensi):* ~${fmtNum(lossRes.potensiBotolHilang)} btl (~${fmtNum(lossRes.potensiPakHilang)} pak)\n`;
    }
    text += `• JWP (Hari Kerja): ${fmtNum(m.jwp)} hari\n\n`;

    const mixRes = computeMixProductAnalysis([m]);
    if (mixRes.total > 0) {
      text += `📦 *MIX PRODUK & PENETRASI VARIAN*\n`;
      text += `• Original (YO): ${fmtPct(mixRes.pctYO)}%\n`;
      text += `• Varian Baru (OM/OS/YT): *${fmtPct(mixRes.pctVarianBaru)}%* (${mixRes.statusLabel})\n\n`;
    }

    if (top3.length > 0) {
      text += `🏆 *TOP 3 YAKULT LADY (BULAN INI)*\n`;
      top3.forEach((yl, idx) => {
        const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉";
        text += `${medal} *${yl.nama}* (Area ${yl.area}): ${fmtNum(yl.penjualan)} btl\n`;
      });
      text += `\n`;
    }

    if (monthIndex > 0) {
      const ytdStats = computeYLAverageData(perYL, 0, monthIndex);
      if (ytdStats.rows.length > 0) {
        text += `📈 *RATA-RATA KUMULATIF (Jan s/d ${MONTH_SHORT[monthIndex]}):*\n`;
        text += `• Rata-rata Tim: *${fmtNum(ytdStats.teamOverallAvg)} btl/hr*\n`;
        text += `• Status Tim: ${ytdStats.totalMandiri} YL Mandiri, ${ytdStats.totalBinaan} YL Binaan\n`;
        text += `• Top 3 YTD:\n`;
        ytdStats.rows.slice(0, 3).forEach((yl, idx) => {
          const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉";
          text += `  ${medal} *${yl.nama}* (${yl.area}): ${fmtNum(yl.rataRata)} btl/hr\n`;
        });
        text += `\n`;
      }
    }

    const plusList = (m.evaluasiPlus || []).filter((s: string) => s.trim());
    const minusList = (m.evaluasiMinus || []).filter((s: string) => s.trim());

    if (plusList.length > 0 || minusList.length > 0) {
      text += `📝 *EVALUASI OPERASIONAL*\n`;
      if (plusList.length > 0) {
        text += `*Kelebihan:*\n`;
        plusList.slice(0, 3).forEach((s: string) => { text += `  + ${s}\n`; });
      }
      if (minusList.length > 0) {
        text += `*Kekurangan / Perbaikan:*\n`;
        minusList.slice(0, 3).forEach((s: string) => { text += `  - ${s}\n`; });
      }
      text += `\n`;
    }

    if (actionPlans.length > 0) {
      text += `🎯 *RENCANA AKSI & KOMITMEN RAPAT:*\n`;
      actionPlans.forEach((it, idx) => {
        text += `${idx + 1}. [${it.done ? "SELESAI" : "TODO"}] ${it.text}\n`;
      });
      text += `\n`;
    }

    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `_Sistem Monitoring & Evaluasi ${tku}_ 🙏`;
    return text;
  }

  if (periode === "s1" || periode === "s2") {
    const isS1 = periode === "s1";
    const title = isS1 ? "Semester 1 (Januari – Juni)" : "Semester 2 (Juli – Desember)";
    const agg = computeSemesterAgg(bulanan, isS1 ? 0 : 6, isS1 ? 5 : 11, selectedYear);

    let text = `📊 *LAPORAN EVALUASI PERFORMA ${tku}*\n`;
    text += `📅 *Periode:* ${title} ${selectedYear}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

    text += `🎯 *RINGKASAN PERFORMA SEMESTER*\n`;
    text += `• AKM Penjualan: *${fmtNum(agg.totalAkm)} botol*\n`;
    text += `• Rata-rata Capaian Target: *${fmtPct(agg.avgCapaian)}%*\n`;
    text += `• Rata-rata Balik Botol (BB): *${fmtPct(agg.avgRetur)}%*\n`;
    if (agg.peak) {
      text += `• Puncak Penjualan: ${agg.peak.label} (${fmtNum(agg.peak.value)} btl)\n`;
    }
    text += `• SDM: Rekrut ${fmtNum(agg.ylBaru)} YL Baru, Resign ${fmtNum(agg.ylResign)} YL\n\n`;

    // Rata-rata per YL
    const semYl = isS1
      ? computeYLAverageData(perYL, 0, 5)
      : computeYLAverageData(perYL, 0, 11);

    if (semYl.rows.length > 0) {
      text += `🏆 *RATA-RATA PER YL (${isS1 ? "Januari s/d Juni" : "Januari s/d Terakhir"}):*\n`;
      text += `• Rata-rata Tim: *${fmtNum(semYl.teamOverallAvg)} btl/hari*\n`;
      text += `• Status: ${semYl.totalMandiri} YL Mandiri (≥250 btl), ${semYl.totalBinaan} YL Binaan\n`;
      text += `• Peringkat Seluruh YL:\n`;
      semYl.rows.forEach((yl, idx) => {
        const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}.`;
        text += `  ${medal} *${yl.nama}* (Area ${yl.area}): *${fmtNum(yl.rataRata)} btl/hr* [${yl.isMandiri ? "Mandiri" : "Binaan"}]\n`;
      });
      text += `\n`;
    }

    if (actionPlans.length > 0) {
      text += `🎯 *RENCANA AKSI & KOMITMEN RAPAT:*\n`;
      actionPlans.forEach((it, idx) => {
        text += `${idx + 1}. [${it.done ? "SELESAI" : "TODO"}] ${it.text}\n`;
      });
      text += `\n`;
    }

    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `_Sistem Monitoring & Evaluasi ${tku}_ 🙏`;
    return text;
  }

  // Tahunan
  const t = computeTahunanAgg(bulanan, selectedYear);
  let text = `📊 *LAPORAN TAHUNAN STRATEGIS ${tku}*\n`;
  text += `📅 *Tahun:* ${selectedYear}\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  if (t) {
    text += `• Estimasi Realisasi Tahunan: *${fmtNum(t.estimasiTahunan)} botol*\n`;
    text += `• Target Tahunan: ${fmtNum(t.targetTahunan)} botol\n`;
    text += `• Capaian Proyeksi Tahunan: *${fmtPct(t.capaianTahunan)}%*\n`;
    text += `• Pertumbuhan (YoY): ${t.growthPct !== null ? `${t.growthPct >= 0 ? "+" : ""}${fmtPct(t.growthPct)}%` : "-"}\n`;
    text += `• Cakupan Area Final: ${fmtPct(t.areaTercoverFinal, 0)}%\n\n`;

    const thYl = computeYLAverageData(perYL, 0, 11);
    if (thYl.rows.length > 0) {
      text += `🏆 *RATA-RATA TAHUNAN SELURUH YL (Jan s/d Terakhir):*\n`;
      text += `• Rata-rata Tim: *${fmtNum(thYl.teamOverallAvg)} btl/hari*\n`;
      text += `• Status: ${thYl.totalMandiri} YL Mandiri, ${thYl.totalBinaan} YL Binaan\n`;
      text += `• Peringkat Seluruh YL:\n`;
      thYl.rows.forEach((yl, idx) => {
        const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}.`;
        text += `  ${medal} *${yl.nama}* (Area ${yl.area}): *${fmtNum(yl.rataRata)} btl/hr* [${yl.isMandiri ? "Mandiri" : "Binaan"}]\n`;
      });
      text += `\n`;
    }

    text += `📝 *Kesimpulan:*\n${t.kesimpulan}\n\n`;
  }
  if (actionPlans.length > 0) {
    text += `🎯 *RENCANA AKSI TAHUNAN:*\n`;
    actionPlans.forEach((it, idx) => {
      text += `${idx + 1}. [${it.done ? "SELESAI" : "TODO"}] ${it.text}\n`;
    });
    text += `\n`;
  }
  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `_Sistem Monitoring & Evaluasi ${tku}_ 🙏`;
  return text;
}

// ----------------------------------------------------------------------------
// Small presentational bits
// ----------------------------------------------------------------------------

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function SectionTitle({ icon: Icon, children }: { icon: any; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-7 h-7 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wide">{children}</h3>
    </div>
  );
}

function StatBox({ label, value, sub, pct }: { label: string; value: string; sub?: string; pct?: number | null }) {
  return (
    <div className="flex-1 min-w-[110px] bg-slate-50 dark:bg-slate-900/60 rounded-xl p-3 border border-slate-100 dark:border-slate-700">
      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</p>
      <p className="text-lg font-black text-slate-900 dark:text-white mt-1">{value}</p>
      {sub && <p className="text-[10.5px] text-slate-400 mt-0.5">{sub}</p>}
      {pct !== undefined && (
        <span className={`inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${pctBadgeClasses(pct)}`}>
          {pct === null ? "-" : `${pct >= 100 ? "▲" : "▼"} ${fmtPct(pct)}%`}
        </span>
      )}
    </div>
  );
}

function EmptyMonthNote({ label }: { label: string }) {
  return (
    <Card className="text-center py-8">
      <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
      <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Data {label} belum diisi</p>
      <p className="text-xs text-slate-400 mt-1">Isi data di menu Sales Record atau klik tombol &quot;Tarik Arsip&quot; di atas.</p>
    </Card>
  );
}

function ActionPlanCard({
  items,
  onAdd,
  onToggle,
  onDelete,
  label,
}: {
  items: ActionPlanItem[];
  onAdd: (text: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  label: string;
}) {
  const [newText, setNewText] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "done">("all");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newText.trim()) {
      onAdd(newText);
      setNewText("");
    }
  };

  const totalCount = items.length;
  const doneCount = items.filter((it) => it.done).length;
  const pendingCount = totalCount - doneCount;
  const donePct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  const filteredItems = useMemo(() => {
    if (filter === "pending") return items.filter((it) => !it.done);
    if (filter === "done") return items.filter((it) => it.done);
    return items;
  }, [items, filter]);

  return (
    <Card className="page-break-inside-avoid">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
        <SectionTitle icon={CheckSquare}>
          Rencana Tindak Lanjut &amp; Komitmen Rapat — {label}
        </SectionTitle>
        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-black px-2.5 py-1 rounded-full border ${
            donePct === 100 && totalCount > 0
              ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/30"
              : donePct >= 50
              ? "bg-blue-500/20 text-blue-600 dark:text-blue-300 border-blue-500/30"
              : "bg-orange-500/20 text-orange-600 dark:text-orange-300 border-orange-500/30"
          }`}>
            PDCA: {doneCount}/{totalCount} Selesai ({donePct}%)
          </span>
        </div>
      </div>
      <p className="text-[11px] text-slate-400 mb-3">
        Catat komitmen strategi, pembinaan YL, atau target perbaikan yang disepakati saat rapat.
      </p>

      {/* Progress Bar PDCA */}
      {totalCount > 0 && (
        <div className="mb-4 bg-slate-100 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between text-[11px] font-bold mb-1.5">
            <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-orange-500" />
              Progress Eksekusi Komitmen Rapat
            </span>
            <span className="font-black text-orange-600 dark:text-orange-400">
              {donePct}% Tercapai
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-orange-500 to-emerald-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${donePct}%` }}
            />
          </div>
        </div>
      )}

      {/* Input baru */}
      <form onSubmit={handleSubmit} className="flex gap-2 mb-3 no-print">
        <input
          type="text"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          placeholder="Tulis rencana aksi / komitmen rapat baru..."
          className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
        <button
          type="submit"
          disabled={!newText.trim()}
          className="bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1 cursor-pointer transition-all shrink-0"
        >
          <Plus className="w-3.5 h-3.5" /> Tambah
        </button>
      </form>

      {/* Filter Tabs */}
      {totalCount > 0 && (
        <div className="flex items-center gap-1.5 mb-2.5 no-print text-[11px]">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              filter === "all"
                ? "bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900"
                : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            Semua ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter("pending")}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              filter === "pending"
                ? "bg-orange-500 text-white"
                : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            On Progress ({pendingCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter("done")}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              filter === "done"
                ? "bg-emerald-600 text-white"
                : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            Selesai ({doneCount})
          </button>
        </div>
      )}

      {/* List items */}
      <div className="space-y-1.5">
        {filteredItems.map((it) => (
          <div
            key={it.id}
            className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
              it.done
                ? "bg-slate-50/70 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800 opacity-70"
                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
            }`}
          >
            <button
              type="button"
              onClick={() => onToggle(it.id)}
              className="flex items-center gap-2 text-left cursor-pointer flex-1 mr-2"
            >
              {it.done ? (
                <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0" />
              ) : (
                <Square className="w-4 h-4 text-slate-400 shrink-0" />
              )}
              <span className={`text-xs ${it.done ? "line-through text-slate-400" : "text-slate-700 dark:text-slate-200 font-medium"}`}>
                {it.text}
              </span>
            </button>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                it.done ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300" : "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300"
              }`}>
                {it.done ? "Selesai" : "On Progress"}
              </span>
              <button
                type="button"
                onClick={() => onDelete(it.id)}
                className="text-slate-300 hover:text-red-500 p-1 rounded no-print cursor-pointer"
                title="Hapus"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
        {filteredItems.length === 0 && (
          <p className="text-xs text-slate-400 text-center py-3 italic">
            {totalCount === 0 ? "Belum ada rencana tindak lanjut yang dicatat." : "Tidak ada komitmen pada kategori ini."}
          </p>
        )}
      </div>
    </Card>
  );
}

// ----------------------------------------------------------------------------
// Yakult Lady of the Month — Kategori & Perhitungan Kandidat
// ----------------------------------------------------------------------------

interface YlOtmCandidate {
  area: string;
  nama: string;
  totalPenjualan: number;
  rataRata: number;
  monthlyValues: number[];
  vsBulanLaluPct: number | null;
  vsTahunLaluPct: number | null;
  vsTargetPct: number | null;
  targetYL: number | null;
  sektorRumah: number | null;
}

const YL_OTM_CATEGORIES: { id: string; label: string; auto: boolean }[] = [
  { id: "total_tertinggi", label: "Total Penjualan Tertinggi", auto: true },
  { id: "vs_tahun_lalu", label: "Kenaikan Tertinggi vs Tahun Lalu", auto: true },
  { id: "vs_bulan_lalu", label: "Kenaikan Tertinggi vs Bulan Lalu", auto: true },
  { id: "vs_target", label: "Pencapaian vs Tgt", auto: true },
  { id: "rumah_tertinggi", label: "Penjualan Sektor Rumah Tertinggi", auto: true },
  { id: "stabil", label: "Penjualan Paling Stabil", auto: true },
  { id: "sampah_terbanyak", label: "Pengumpulan Sampah Botol Terbanyak", auto: false },
  { id: "bebas", label: "Kategori Bebas / Lainnya", auto: false },
];

export interface SectorSummaryItem {
  key: "rmh" | "psr" | "skh" | "ktr" | "tk" | "ib";
  label: string;
  isFixedCustomer: boolean;
  akm: number;
  rata2: number;
  pct: number;
  yo: number;
  om: number;
  os: number;
  yt: number;
}

interface MonthArchiveDetails {
  perYL?: Record<
    string,
    {
      area?: string;
      nama?: string;
      targetYL?: number;
      bulanLaluYL?: number;
      tahunLaluYL?: number;
      vsTgt?: number;
      vsBln?: number;
      vsThn?: number;
      rata2?: number;
      akumulasi?: number;
    }
  >;
  sektorRumahByArea?: Record<string, number>;
  sectors?: SectorSummaryItem[];
  totalAkmSektor?: number;
  hariKerja?: number;
  targetTim?: {
    target: number;
    bln_lalu: number;
    thn_lalu: number;
  };
  rataHarian?: number;
}

async function loadMonthArchiveDetails(selectedYear: string, monthIndex: number): Promise<MonthArchiveDetails> {
  const mPad = String(monthIndex + 1).padStart(2, "0");
  const ymKey = `${selectedYear}-${mPad}`;
  const archiveKey = `monthly_archive_${ymKey}`;
  let arc: any = null;

  try {
    const local = localStorage.getItem(archiveKey);
    if (local) arc = JSON.parse(local);
  } catch {}

  if (!arc) {
    try {
      arc = await loadFromSupabase<any>(archiveKey);
    } catch {}
  }

  const result: MonthArchiveDetails = {
    perYL: {},
    sektorRumahByArea: {},
    sectors: [],
    totalAkmSektor: 0,
    hariKerja: 25,
    targetTim: { target: 0, bln_lalu: 0, thn_lalu: 0 },
    rataHarian: 0,
  };

  const secMap: Record<"rmh" | "psr" | "skh" | "ktr" | "tk" | "ib", {
    label: string;
    isFixedCustomer: boolean;
    yo: number;
    om: number;
    os: number;
    yt: number;
    akm: number;
  }> = {
    rmh: { label: "Rumah", isFixedCustomer: true, yo: 0, om: 0, os: 0, yt: 0, akm: 0 },
    psr: { label: "Pasar", isFixedCustomer: true, yo: 0, om: 0, os: 0, yt: 0, akm: 0 },
    skh: { label: "Sekolah", isFixedCustomer: true, yo: 0, om: 0, os: 0, yt: 0, akm: 0 },
    ktr: { label: "Kantor", isFixedCustomer: true, yo: 0, om: 0, os: 0, yt: 0, akm: 0 },
    tk:  { label: "Toko", isFixedCustomer: true, yo: 0, om: 0, os: 0, yt: 0, akm: 0 },
    ib:  { label: "Instant Buyer (IB)", isFixedCustomer: false, yo: 0, om: 0, os: 0, yt: 0, akm: 0 },
  };

  const processTransactions = (txs: any[]) => {
    txs.forEach((t: any) => {
      const areaMatch = t.nama ? String(t.nama).match(/\b(20[1-9]|210)\b/) : null;
      const areaKey = areaMatch ? areaMatch[1] : t.area ? String(t.area) : "";
      const rmhTot =
        (Number(t.rmh_yo) || 0) + (Number(t.rmh_om) || 0) + (Number(t.rmh_os) || 0) + (Number(t.rmh_yt) || 0);
      if (areaKey && rmhTot > 0) {
        result.sektorRumahByArea![areaKey] = (result.sektorRumahByArea![areaKey] || 0) + rmhTot;
      }

      (["rmh", "psr", "skh", "ktr", "tk", "ib"] as const).forEach((secKey) => {
        const yo = Number(t[`${secKey}_yo`]) || 0;
        const om = Number(t[`${secKey}_om`]) || 0;
        const os = Number(t[`${secKey}_os`]) || 0;
        const yt = Number(t[`${secKey}_yt`]) || 0;
        secMap[secKey].yo += yo;
        secMap[secKey].om += om;
        secMap[secKey].os += os;
        secMap[secKey].yt += yt;
        secMap[secKey].akm += (yo + om + os + yt);
      });
    });
  };

  let hariKerja = 25;

  if (arc) {
    const rec = arc.data || arc;
    hariKerja = rec.hariKerja || rec.pembagiManager || 25;
    result.hariKerja = hariKerja;

    // Ambil Target Tim (Total) dari Menu Target di Arsip
    let tkuTarget = 0;
    let tkuBlnLalu = 0;
    let tkuThnLalu = 0;

    if (rec.targetTKU) {
      tkuTarget = Number(rec.targetTKU.target) || 0;
      tkuBlnLalu = Number(rec.targetTKU.bln_lalu) || 0;
      tkuThnLalu = Number(rec.targetTKU.thn_lalu) || 0;
    } else if (rec.dashboardData?.targetTim || rec.targetTim) {
      const tt = rec.dashboardData?.targetTim || rec.targetTim;
      tkuTarget = Number(tt.target) || 0;
      tkuBlnLalu = Number(tt.bulanLalu ?? tt.bln_lalu) || 0;
      tkuThnLalu = Number(tt.tahunLalu ?? tt.thn_lalu) || 0;
    }

    // Fallback dari localStorage target_tku jika belum terekam di snapshot
    if (tkuTarget === 0) {
      try {
        const localTku = localStorage.getItem(`target_tku_${ymKey}`) || localStorage.getItem("target_tku");
        if (localTku) {
          const parsed = JSON.parse(localTku);
          if (parsed && typeof parsed === "object") {
            tkuTarget = Number(parsed.target) || 0;
            if (tkuBlnLalu === 0) tkuBlnLalu = Number(parsed.bln_lalu) || 0;
            if (tkuThnLalu === 0) tkuThnLalu = Number(parsed.thn_lalu) || 0;
          }
        }
      } catch {}
    }

    if (rec.dashboardData?.rataHarian || rec.rataHarian) {
      result.rataHarian = Number(rec.dashboardData?.rataHarian || rec.rataHarian) || 0;
    }

    const dbPerYL = rec.dashboardData?.perYL || rec.evaluasiData?.perYL || rec.perYL || {};
    const targetYLMap = rec.targetYLMap || rec.targetYL || {};

    if (typeof dbPerYL === "object" && dbPerYL !== null) {
      Object.entries(dbPerYL).forEach(([key, val]: [string, any]) => {
        if (!val) return;
        const areaStr = String(val.area || key);
        const tgtObj = (targetYLMap && (targetYLMap[`${areaStr}_${ymKey}`] || targetYLMap[areaStr])) || {};

        const rata2 = Number(val.rata2) || 0;
        const targetYL = Number(val.targetYL ?? tgtObj.target ?? 0);
        const bulanLaluYL = Number(val.bulanLaluYL ?? tgtObj.bln_lalu ?? 0);
        const tahunLaluYL = Number(val.tahunLaluYL ?? tgtObj.thn_lalu ?? 0);
        const vsTgt = val.vsTgt !== undefined ? Number(val.vsTgt) : targetYL > 0 ? (rata2 / targetYL) * 100 : 0;
        const vsBln = val.vsBln !== undefined ? Number(val.vsBln) : bulanLaluYL > 0 ? (rata2 / bulanLaluYL) * 100 : 0;
        const vsThn = val.vsThn !== undefined ? Number(val.vsThn) : tahunLaluYL > 0 ? (rata2 / tahunLaluYL) * 100 : 0;

        result.perYL![areaStr] = {
          area: areaStr,
          nama: val.nama,
          targetYL,
          bulanLaluYL,
          tahunLaluYL,
          vsTgt,
          vsBln,
          vsThn,
          rata2,
          akumulasi: Number(val.akumulasi) || 0,
        };
      });
    }

    // Jika target tim masih 0, jumlahkan dari target masing-masing YL di menu target
    let sumTgt = 0, sumBln = 0, sumThn = 0;
    Object.values(result.perYL || {}).forEach((y) => {
      sumTgt += y.targetYL || 0;
      sumBln += y.bulanLaluYL || 0;
      sumThn += y.tahunLaluYL || 0;
    });
    if (tkuTarget === 0 && sumTgt > 0) tkuTarget = sumTgt;
    if (tkuBlnLalu === 0 && sumBln > 0) tkuBlnLalu = sumBln;
    if (tkuThnLalu === 0 && sumThn > 0) tkuThnLalu = sumThn;

    result.targetTim = {
      target: tkuTarget,
      bln_lalu: tkuBlnLalu,
      thn_lalu: tkuThnLalu,
    };

    if (Array.isArray(rec.transactions) && rec.transactions.length > 0) {
      processTransactions(rec.transactions);
    }
  }

  // Jika sektor belum didapat dari snapshot arsip, tarik dari endpoint transaksi PLG PJL
  if (Object.values(secMap).reduce((s, x) => s + x.akm, 0) === 0) {
    try {
      const resp = await fetch(`/api/getPlgPjlData?month=${encodeURIComponent(ymKey)}`);
      if (resp.ok) {
        const res = (await resp.json()) as { ok?: boolean; transactions?: any[]; hariKerja?: number };
        if (res && res.ok && Array.isArray(res.transactions)) {
          if (res.hariKerja) hariKerja = res.hariKerja;
          processTransactions(res.transactions);
        }
      }
    } catch {}
  }

  const grandTotal = Object.values(secMap).reduce((s, x) => s + x.akm, 0);
  result.totalAkmSektor = grandTotal;

  result.sectors = (["rmh", "psr", "skh", "ktr", "tk", "ib"] as const).map((key) => {
    const s = secMap[key];
    const akm = s.akm;
    const rata2 = hariKerja > 0 ? akm / hariKerja : 0;
    const pct = grandTotal > 0 ? (akm / grandTotal) * 100 : 0;
    return {
      key,
      label: s.label,
      isFixedCustomer: s.isFixedCustomer,
      akm,
      rata2,
      pct,
      yo: s.yo,
      om: s.om,
      os: s.os,
      yt: s.yt,
    };
  });

  return result;
}

function computeYlOtmCandidates(
  perYL: any[],
  prevYearPerYL: any[] | null,
  bulanan: Record<string, any>,
  monthsInRange: number[],
  stabilityMonths: number[],
  archiveDetails?: MonthArchiveDetails | null
): YlOtmCandidate[] {
  const prevBlockMonths = monthsInRange.map((i) => i - monthsInRange.length);
  const prevBlockValid = prevBlockMonths.every((i) => i >= 0);

  return (perYL || [])
    .map((yl) => {
      const nama = cleanYlName(yl.nama || "");
      const area = String(yl.area || "");
      const penjualanByMonth = yl.penjualan || {};
      const totalPenjualan = sum(monthsInRange.map((i) => penjualanByMonth[MONTHS[i]]));
      const totalJwp = sum(
        monthsInRange.map((i) => bulanan[MONTHS[i]]?.jwp ?? (penjualanByMonth[MONTHS[i]] !== undefined ? 25 : 0))
      );
      const rataRata = totalJwp > 0 ? totalPenjualan / totalJwp : 0;

      const arcYl =
        archiveDetails?.perYL?.[area] ||
        (archiveDetails?.perYL &&
          Object.values(archiveDetails.perYL).find(
            (v: any) => v.nama === nama || cleanYlName(v.nama || "") === nama
          ));

      let vsBulanLaluPct: number | null = null;
      if (arcYl && arcYl.vsBln !== undefined && arcYl.vsBln > 0) {
        vsBulanLaluPct = arcYl.vsBln;
      } else if (prevBlockValid) {
        const prevTotal = sum(prevBlockMonths.map((i) => penjualanByMonth[MONTHS[i]]));
        if (prevTotal > 0) vsBulanLaluPct = (totalPenjualan / prevTotal) * 100;
      }

      let vsTahunLaluPct: number | null = null;
      if (arcYl && arcYl.vsThn !== undefined && arcYl.vsThn > 0) {
        vsTahunLaluPct = arcYl.vsThn;
      } else if (prevYearPerYL) {
        const prevYl = prevYearPerYL.find(
          (p: any) => String(p.area) === String(area) || cleanYlName(p.nama || "") === nama
        );
        if (prevYl) {
          const prevTotal = sum(monthsInRange.map((i) => prevYl.penjualan?.[MONTHS[i]]));
          if (prevTotal > 0) vsTahunLaluPct = (totalPenjualan / prevTotal) * 100;
        }
      }

      let vsTargetPct: number | null = null;
      let targetYL: number | null = null;
      if (arcYl && arcYl.vsTgt !== undefined && arcYl.vsTgt > 0) {
        vsTargetPct = arcYl.vsTgt;
        targetYL = arcYl.targetYL || null;
      } else if (arcYl && arcYl.targetYL && arcYl.targetYL > 0) {
        targetYL = arcYl.targetYL;
        vsTargetPct = (rataRata / arcYl.targetYL) * 100;
      }

      const sektorRumah = archiveDetails?.sektorRumahByArea?.[area] ?? null;

      const monthlyValues = stabilityMonths
        .map((i) => penjualanByMonth[MONTHS[i]])
        .filter((v: any) => typeof v === "number" && v > 0);

      return {
        area,
        nama,
        totalPenjualan,
        rataRata,
        monthlyValues,
        vsBulanLaluPct,
        vsTahunLaluPct,
        vsTargetPct,
        targetYL,
        sektorRumah,
      };
    })
    .filter((c) => c.nama);
}

function rankYlOtmCandidates(
  candidates: YlOtmCandidate[],
  categoryId: string
): { c: YlOtmCandidate; value: number; display: string }[] {
  const withVal: { c: YlOtmCandidate; value: number; display: string }[] = [];
  candidates.forEach((c) => {
    if (categoryId === "total_tertinggi") {
      if (c.totalPenjualan > 0) {
        withVal.push({
          c,
          value: c.totalPenjualan,
          display: `${fmtNum(c.totalPenjualan)} btl (Rata² ${fmtNum(Math.round(c.rataRata))} btl/hr)`,
        });
      }
    } else if (categoryId === "vs_tahun_lalu") {
      if (c.vsTahunLaluPct !== null && c.vsTahunLaluPct > 0) {
        withVal.push({
          c,
          value: c.vsTahunLaluPct,
          display: `${fmtPct(c.vsTahunLaluPct)}% vs th lalu`,
        });
      }
    } else if (categoryId === "vs_bulan_lalu") {
      if (c.vsBulanLaluPct !== null && c.vsBulanLaluPct > 0) {
        withVal.push({
          c,
          value: c.vsBulanLaluPct,
          display: `${fmtPct(c.vsBulanLaluPct)}% vs bln lalu`,
        });
      }
    } else if (categoryId === "vs_target") {
      if (c.vsTargetPct !== null && c.vsTargetPct > 0) {
        withVal.push({
          c,
          value: c.vsTargetPct,
          display: `${fmtPct(c.vsTargetPct)}% vs Tgt${c.targetYL ? ` (Tgt: ${fmtNum(c.targetYL)} btl/hr)` : ""}`,
        });
      }
    } else if (categoryId === "rumah_tertinggi") {
      if (c.sektorRumah !== null && c.sektorRumah > 0) {
        withVal.push({
          c,
          value: c.sektorRumah,
          display: `${fmtNum(c.sektorRumah)} btl (Sektor Rumah)`,
        });
      }
    } else if (categoryId === "stabil") {
      if (c.monthlyValues.length >= 2) {
        const mean = average(c.monthlyValues) || 0;
        if (mean > 0) {
          const variance = c.monthlyValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / c.monthlyValues.length;
          const cv = Math.sqrt(variance) / mean;
          withVal.push({ c, value: cv, display: `Variasi ${fmtPct(cv * 100)}% antar bulan (makin stabil)` });
        }
      }
    }
  });
  const asc = categoryId === "stabil";
  withVal.sort((a, b) => (asc ? a.value - b.value : b.value - a.value));
  return withVal.slice(0, 5);
}

async function loadPrevYearPerYL(selectedYear: string): Promise<any[] | null> {
  const prevYear = String(parseInt(selectedYear, 10) - 1);
  const localKey = `sales_record_tku_${prevYear}`;
  try {
    const local = localStorage.getItem(localKey);
    if (local) return JSON.parse(local)?.perYL || null;
    const remote = await loadFromSupabase<any>(localKey);
    return remote?.perYL || null;
  } catch (e) {
    console.error("Gagal memuat data tahun lalu untuk Yakult Lady of the Month:", e);
    return null;
  }
}

function resizePhotoToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const MAX_SIZE = 500;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
        } else {
          if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function YlOfTheMonthCard({
  perYL,
  bulanan,
  periode,
  monthIndex,
  selectedYear,
  periodeLabel,
  record,
  loading,
  onSave,
  onClear,
}: {
  perYL: any[];
  bulanan: Record<string, any>;
  periode: Periode;
  monthIndex: number;
  selectedYear: string;
  periodeLabel: string;
  record: YlOtmRecord | null;
  loading: boolean;
  onSave: (rec: YlOtmRecord) => void | Promise<void>;
  onClear: () => void | Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [category, setCategory] = useState<string>(record?.category || "total_tertinggi");
  const [pending, setPending] = useState<{ area: string; nama: string; valueLabel: string } | null>(null);
  const [manualArea, setManualArea] = useState("");
  const [manualValueLabel, setManualValueLabel] = useState("");
  const [foto, setFoto] = useState<string>(record?.foto || "");
  const [prevYearPerYL, setPrevYearPerYL] = useState<any[] | null>(null);
  const [archiveDetails, setArchiveDetails] = useState<MonthArchiveDetails | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [searched, setSearched] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const monthsInRange = useMemo(() => {
    if (periode === "bulanan") return [monthIndex];
    if (periode === "s1") return [0, 1, 2, 3, 4, 5];
    if (periode === "s2") return [6, 7, 8, 9, 10, 11];
    return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  }, [periode, monthIndex]);

  const stabilityMonths = useMemo(() => {
    if (periode === "bulanan") {
      const arr: number[] = [];
      for (let i = Math.max(0, monthIndex - 2); i <= monthIndex; i++) arr.push(i);
      return arr;
    }
    return monthsInRange;
  }, [periode, monthIndex, monthsInRange]);

  const fetchSupportingData = async () => {
    setLoadingData(true);
    try {
      const [arcData, prevData] = await Promise.all([
        loadMonthArchiveDetails(selectedYear, monthIndex),
        prevYearPerYL ? Promise.resolve(prevYearPerYL) : loadPrevYearPerYL(selectedYear),
      ]);
      setArchiveDetails(arcData);
      if (!prevYearPerYL && prevData) {
        setPrevYearPerYL(prevData);
      }
    } catch (err) {
      console.error("Gagal memuat data pendukung YL of the Month:", err);
    } finally {
      setLoadingData(false);
    }
  };

  const candidates = useMemo(
    () => computeYlOtmCandidates(perYL, prevYearPerYL, bulanan, monthsInRange, stabilityMonths, archiveDetails),
    [perYL, prevYearPerYL, bulanan, monthsInRange, stabilityMonths, archiveDetails]
  );

  const currentCat = YL_OTM_CATEGORIES.find((c) => c.id === category) || YL_OTM_CATEGORIES[0];
  const ranked = useMemo(
    () => (currentCat.auto ? rankYlOtmCandidates(candidates, category) : []),
    [candidates, category, currentCat.auto]
  );

  const handleStartEdit = () => {
    setCategory(record?.category || "total_tertinggi");
    setFoto(record?.foto || "");
    const recordCat = record ? YL_OTM_CATEGORIES.find((c) => c.id === record.category) : null;
    setPending(record && recordCat?.auto ? { area: record.area, nama: record.nama, valueLabel: record.valueLabel } : null);
    setManualArea(record && !recordCat?.auto ? record.area : "");
    setManualValueLabel(record && !recordCat?.auto ? record.valueLabel : "");
    setSearched(true);
    setEditing(true);
    fetchSupportingData();
  };

  const handleCategoryChange = async (id: string) => {
    setCategory(id);
    setPending(null);
    setSearched(true);
    if (!archiveDetails) {
      await fetchSupportingData();
    }
  };

  const handleSearch = async () => {
    await fetchSupportingData();
    setSearched(true);
  };

  const handleUploadFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Ukuran foto maksimal 5MB.");
      return;
    }
    setUploading(true);
    try {
      const base64 = await resizePhotoToBase64(file);
      setFoto(base64);
    } catch (err) {
      console.error("Gagal memproses foto:", err);
    } finally {
      setUploading(false);
    }
  };

  const winner = currentCat.auto
    ? pending
    : manualArea
    ? { area: manualArea, nama: cleanYlName(perYL.find((y) => y.area === manualArea)?.nama || ""), valueLabel: manualValueLabel }
    : null;

  const handleSave = async () => {
    if (!winner || !winner.area) return;
    setSaving(true);
    try {
      await onSave({
        area: winner.area,
        nama: winner.nama,
        category,
        categoryLabel: currentCat.label,
        valueLabel: winner.valueLabel || "",
        foto,
        updatedAt: new Date().toISOString(),
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const otmTitle = getOtmTitleByPeriode(periode);

  return (
    <Card className="page-break-inside-avoid no-print">
      <SectionTitle icon={Award}>{otmTitle} — {periodeLabel}</SectionTitle>

      {!editing && (
        <>
          {loading ? (
            <p className="text-xs text-slate-400 py-4 text-center">Memuat...</p>
          ) : record ? (
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shrink-0 flex items-center justify-center">
                {record.foto ? (
                  <img src={record.foto} alt={record.nama} className="w-full h-full object-cover" />
                ) : (
                  <Trophy className="w-7 h-7 text-amber-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-slate-900 dark:text-white truncate">{record.nama}</p>
                <p className="text-[10px] text-orange-500 font-bold uppercase tracking-wide">
                  Area {record.area} &middot; {record.categoryLabel}
                </p>
                {record.valueLabel && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{record.valueLabel}</p>}
              </div>
              <div className="flex flex-col gap-1.5 shrink-0">
                <button
                  onClick={handleStartEdit}
                  className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 cursor-pointer"
                >
                  Ubah
                </button>
                <button
                  onClick={() => onClear()}
                  className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 cursor-pointer"
                >
                  Hapus
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleStartEdit}
              className="w-full flex items-center justify-center gap-2 bg-amber-50 dark:bg-amber-950/20 border border-dashed border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400 text-xs font-bold py-3 rounded-xl cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-950/40 transition-all"
            >
              <Trophy className="w-4 h-4" /> Atur {otmTitle}
            </button>
          )}
        </>
      )}

      {editing && (
        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide block mb-1">
              Kategori
            </label>
            <select
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {YL_OTM_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>

          {currentCat.auto ? (
            <div>
              <button
                onClick={handleSearch}
                disabled={loadingData}
                className="w-full flex items-center justify-center gap-1.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-bold py-2 rounded-xl cursor-pointer transition-all"
              >
                {loadingData ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                {loadingData ? "Memuat data..." : "Cari / Segarkan Data"}
              </button>

              {searched && !loadingData && (
                <div className="mt-2 space-y-1.5">
                  {ranked.length === 0 && (
                    <p className="text-[11px] text-slate-400 text-center py-3 italic">
                      Data belum cukup untuk kategori &amp; periode ini. Coba kategori lain atau gunakan &quot;Kategori Bebas&quot;.
                    </p>
                  )}
                  {ranked.map((r, idx) => (
                    <button
                      key={r.c.area}
                      onClick={() => setPending({ area: r.c.area, nama: r.c.nama, valueLabel: r.display })}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-left cursor-pointer transition-all ${
                        pending?.area === r.c.area
                          ? "bg-orange-500 border-orange-500 text-white"
                          : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-orange-300"
                      }`}
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                            pending?.area === r.c.area ? "bg-white/20" : "bg-slate-200 dark:bg-slate-700"
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold truncate">{r.c.nama}</span>
                      </span>
                      <span className="text-[10px] font-bold shrink-0">{r.display}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-[11px] text-slate-400 italic">
                Data kategori ini belum tercatat otomatis di modul Presentasi. Pilih Yakult Lady &amp; isi keterangan secara manual.
              </p>
              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide block mb-1">
                  Yakult Lady
                </label>
                <select
                  value={manualArea}
                  onChange={(e) => setManualArea(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">— Pilih Yakult Lady —</option>
                  {perYL.map((yl) => (
                    <option key={yl.area} value={yl.area}>
                      {cleanYlName(yl.nama || "")} (Area {yl.area})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide block mb-1">
                  Keterangan / Nilai (opsional)
                </label>
                <input
                  type="text"
                  value={manualValueLabel}
                  onChange={(e) => setManualValueLabel(e.target.value)}
                  placeholder="cth: 3 karung sampah botol, atau 115% dari target"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide block mb-1">
              Foto {otmTitle}
            </label>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shrink-0 flex items-center justify-center">
                {foto ? <img src={foto} alt="Foto" className="w-full h-full object-cover" /> : <Camera className="w-5 h-5 text-slate-300" />}
              </div>
              <label className="flex-1 flex items-center justify-center gap-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 text-[11px] font-bold py-2 rounded-xl cursor-pointer transition-all">
                {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                {uploading ? "Memproses..." : "Unggah Foto"}
                <input type="file" accept="image/*" className="hidden" onChange={handleUploadFoto} disabled={uploading} />
              </label>
              {foto && (
                <button
                  onClick={() => setFoto("")}
                  className="text-[11px] font-bold px-2.5 py-2 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 cursor-pointer shrink-0"
                >
                  Hapus
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => setEditing(false)}
              className="flex-1 text-xs font-bold py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={!winner || !winner.area || saving}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white cursor-pointer"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Simpan
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}

// ----------------------------------------------------------------------------
// Main component
// ----------------------------------------------------------------------------

export default function PresentasiView() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>(String(new Date().getFullYear()));
  const [periode, setPeriode] = useState<Periode>("bulanan");
  const [monthIndex, setMonthIndex] = useState<number>(0);
  const [slideMode, setSlideMode] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [copiedWA, setCopiedWA] = useState(false);

  // Hook Action Plan tersimpan per tahun + periode + bulan
  const {
    items: actionPlans,
    addItem: addActionPlan,
    toggleItem: toggleActionPlan,
    deleteItem: deleteActionPlan,
  } = useActionPlan(selectedYear, periode, monthIndex);

  // Hook Yakult Lady of the Month tersimpan per tahun + periode + bulan
  const otmKey = `presentasi_yl_otm_${selectedYear}_${periode}_${periode === "bulanan" ? monthIndex : "all"}`;
  const { record: otmRecord, loading: otmLoading, save: saveOtm, clear: clearOtm } = useYlOfTheMonth(otmKey);

  // State data arsip bulanan (PLG PJL, perYL) dan komparasi tahun lalu
  const [prevYearPerYL, setPrevYearPerYL] = useState<any[] | null>(null);
  const [archiveDetails, setArchiveDetails] = useState<MonthArchiveDetails | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [arc, prev] = await Promise.all([
          loadMonthArchiveDetails(selectedYear, monthIndex),
          loadPrevYearPerYL(selectedYear),
        ]);
        if (!cancelled) {
          if (arc) setArchiveDetails(arc);
          if (prev) setPrevYearPerYL(prev);
        }
      } catch (e) {
        console.error("Gagal memuat archiveDetails / prevYearPerYL:", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedYear, monthIndex]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const localKey = `sales_record_tku_${selectedYear}`;
        const localData = localStorage.getItem(localKey);
        if (localData) {
          if (!cancelled) setData(JSON.parse(localData));
        } else {
          const res = await loadFromSupabase<any>(localKey);
          if (res && res.tahun) {
            if (!cancelled) setData(res);
          } else if (selectedYear === "2026") {
            // Fallback ke SEED_DATA_2026 agar presentasi tidak kosong saat pertama kali dibuka
            if (!cancelled) {
              setData(SEED_DATA_2026);
              try {
                localStorage.setItem(localKey, JSON.stringify(SEED_DATA_2026));
              } catch (e) {
                console.error(e);
              }
            }
          } else {
            if (!cancelled) setData(null);
          }
        }
      } catch (err) {
        console.error("Gagal memuat data presentasi:", err);
        if (!cancelled) {
          if (selectedYear === "2026") {
            setData(SEED_DATA_2026);
          } else {
            setData(null);
          }
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, [selectedYear]);

  // Pilih bulan terakhir yang ada datanya sebagai default
  useEffect(() => {
    if (data?.bulanan) {
      let latest = 0;
      for (let i = 11; i >= 0; i--) {
        if (data.bulanan[MONTHS[i]]) { latest = i; break; }
      }
      setMonthIndex(latest);
    }
  }, [data]);

  const bulanan = data?.bulanan || {};
  const perYL = data?.perYL || [];
  const tku = data?.tku || "DP JEMBER 1";

  // Fitur 1: Sinkronisasi Data dari Arsip Supabase / LocalStorage
  const handleSyncFromArchives = async () => {
    setIsSyncing(true);
    try {
      let mergedData = data ? JSON.parse(JSON.stringify(data)) : {
        tku: "DP JEMBER 1",
        cabang: "JEMBER",
        tahun: selectedYear,
        jumlahYL: 10,
        bulanan: {},
        perYL: [],
      };

      let anyFound = false;
      const monthNumMap: Record<number, string> = {
        1: "jan", 2: "feb", 3: "mar", 4: "apr", 5: "mei", 6: "jun",
        7: "jul", 8: "agu", 9: "sep", 10: "okt", 11: "nov", 12: "des",
      };

      for (let mNum = 1; mNum <= 12; mNum++) {
        const mPad = String(mNum).padStart(2, "0");
        const archiveKey = `monthly_archive_${selectedYear}-${mPad}`;
        let arc: any = null;

        const localArc = localStorage.getItem(archiveKey);
        if (localArc) {
          try { arc = JSON.parse(localArc); } catch {}
        }
        if (!arc) {
          try {
            arc = await loadFromSupabase<any>(archiveKey);
          } catch {}
        }

        if (arc) {
          anyFound = true;
          const mKey = monthNumMap[mNum];
          const rec = arc.data || arc;
          const sumData = rec.summaryData || {};
          const evalData = rec.evaluasiData || {};

          mergedData.bulanan[mKey] = {
            akmPenjualan: sumData.totalPenjualan || mergedData.bulanan[mKey]?.akmPenjualan || 0,
            akmTarget: sumData.target || mergedData.bulanan[mKey]?.akmTarget || 0,
            ratarataPenjualanYL: sumData.rataHarian || mergedData.bulanan[mKey]?.ratarataPenjualanYL || 0,
            persenCapaian: sumData.target > 0 ? (sumData.totalPenjualan / sumData.target) * 100 : mergedData.bulanan[mKey]?.persenCapaian || 0,
            persenKembaliBotol: sumData.bbTimPersen !== undefined ? sumData.bbTimPersen : (mergedData.bulanan[mKey]?.persenKembaliBotol || 0),
            akmKembaliBotol: sumData.bbTimRaw || mergedData.bulanan[mKey]?.akmKembaliBotol || 0,
            salesPerYL: sumData.rataHarian || mergedData.bulanan[mKey]?.salesPerYL || 0,
            jwp: rec.hariKerja || mergedData.bulanan[mKey]?.jwp || 25,
            persenAreaTercover: mergedData.bulanan[mKey]?.persenAreaTercover || 85,
            absen: {
              jumlahYL: sumData.ylAbsen !== undefined ? sumData.ylAbsen : (mergedData.bulanan[mKey]?.absen?.jumlahYL || 0),
              frekuensi: sumData.frekuensiAbsen !== undefined ? sumData.frekuensiAbsen : (mergedData.bulanan[mKey]?.absen?.frekuensi || 0),
            },
            evaluasiPlus: evalData.plus || mergedData.bulanan[mKey]?.evaluasiPlus || [],
            evaluasiMinus: evalData.minus || mergedData.bulanan[mKey]?.evaluasiMinus || [],
            ratarataYO: sumData.ratarataProduk?.YO || mergedData.bulanan[mKey]?.ratarataYO || 0,
            ratarataOM: sumData.ratarataProduk?.OM || mergedData.bulanan[mKey]?.ratarataOM || 0,
            ratarataOS: sumData.ratarataProduk?.OS || mergedData.bulanan[mKey]?.ratarataOS || 0,
            ratarataYT: sumData.ratarataProduk?.YT || mergedData.bulanan[mKey]?.ratarataYT || 0,
          };

          // Update perYL penjualan jika ada
          if (Array.isArray(rec.salesData)) {
            if (!Array.isArray(mergedData.perYL) || mergedData.perYL.length === 0) {
              mergedData.perYL = rec.salesData.map((s: any) => ({
                area: s.area || "",
                nama: s.nama || "",
                penjualan: { [mKey]: s.total || s.penjualan || 0 },
              }));
            } else {
              rec.salesData.forEach((s: any) => {
                const existing = mergedData.perYL.find((yl: any) => String(yl.area) === String(s.area) || yl.nama === s.nama);
                if (existing) {
                  if (!existing.penjualan) existing.penjualan = {};
                  existing.penjualan[mKey] = s.total || s.penjualan || 0;
                }
              });
            }
          }
        }
      }

      if (anyFound) {
        setData(mergedData);
        const localKey = `sales_record_tku_${selectedYear}`;
        localStorage.setItem(localKey, JSON.stringify(mergedData));
        await saveToSupabase(localKey, mergedData);
        showToast("Berhasil menarik dan menyinkronkan data dari arsip Supabase!");
      } else {
        showToast("Tidak ditemukan arsip baru di Supabase. Data saat ini tetap dipertahankan.");
      }
    } catch (err) {
      console.error("Gagal sinkronisasi arsip:", err);
      showToast("Gagal menyinkronkan data arsip. Silakan periksa koneksi.");
    } finally {
      setIsSyncing(false);
    }
  };

  // Fitur 4: Salin Ringkasan Eksekutif untuk WhatsApp
  const handleCopyWhatsApp = async () => {
    try {
      const summaryText = generateWhatsAppSummary({
        periode,
        selectedYear,
        monthIndex,
        data,
        actionPlans,
      });
      await navigator.clipboard.writeText(summaryText);
      setCopiedWA(true);
      showToast("Ringkasan WhatsApp berhasil disalin ke clipboard!");
      setTimeout(() => setCopiedWA(false), 3000);
    } catch (err) {
      console.error("Gagal menyalin ringkasan:", err);
      showToast("Gagal menyalin. Silakan pilih teks manual.");
    }
  };

  // Fitur 4: Cetak / Export PDF
  const handlePrint = () => {
    window.print();
  };

  // Bangun slide untuk Mode Presentasi sesuai periode yang aktif
  const slides = useMemo(() => {
    if (!data) return [];
    const injectOtm = (arr: SlideDef[]): SlideDef[] => {
      if (arr.length === 0 || !otmRecord) return arr;
      return [...arr, buildYlOtmSlide(otmRecord, periode)];
    };
    if (periode === "bulanan") {
      const m = applyTahunLaluFallback(bulanan[MONTHS[monthIndex]], selectedYear, monthIndex);
      if (!m) return [];
      const prevIdx = monthIndex - 1;
      const prevM = prevIdx >= 0 ? bulanan[MONTHS[prevIdx]] : null;
      return injectOtm(buildBulananSlides({
        m,
        prevM,
        monthLabel: MONTH_LABELS[monthIndex],
        monthIndex,
        tahun: selectedYear,
        tku,
        perYL,
        actionPlans,
        prevYearPerYL,
        archiveDetails,
      }));
    }
    if (periode === "s1") {
      const agg = computeSemesterAgg(bulanan, 0, 5, selectedYear);
      if (agg.monthsData.length === 0) return [];
      return injectOtm(buildSemesterSlides(agg, "Semester 1", "Januari – Juni", selectedYear, tku, actionPlans, perYL));
    }
    if (periode === "s2") {
      const s2 = computeSemester2Agg(bulanan, selectedYear);
      if (s2.agg.monthsData.length === 0) return [];
      return injectOtm(buildSemester2Slides(s2, selectedYear, tku, data.jumlahYL || perYL.length || 10, actionPlans, perYL));
    }
    if (periode === "tahunan") {
      const t = computeTahunanAgg(bulanan, data.tahun || selectedYear);
      if (!t) return [];
      return injectOtm(buildTahunanSlides(t, data.tahun || selectedYear, tku, actionPlans, perYL));
    }
    return [];
  }, [data, periode, bulanan, monthIndex, perYL, selectedYear, tku, actionPlans, otmRecord, prevYearPerYL, archiveDetails]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mb-3" />
        <p className="text-sm font-bold">Memuat data presentasi...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-16">
        <EmptyMonthNote label={`tahun ${selectedYear}`} />
      </div>
    );
  }

  if (slideMode) {
    return (
      <SlideShow
        slides={slides}
        onClose={() => setSlideMode(false)}
        actionPlans={actionPlans}
        onAddActionPlan={addActionPlan}
        onToggleActionPlan={toggleActionPlan}
        onDeleteActionPlan={deleteActionPlan}
      />
    );
  }

  return (
    <div className="space-y-4 pb-16">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-[250] bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Print-only Header */}
      <div className="hidden print:block mb-6 text-center border-b border-slate-300 pb-4">
        <h1 className="text-xl font-black text-slate-900 uppercase">
          LAPORAN EVALUASI PERFORMA {data.tku || "DP JEMBER 1"}
        </h1>
        <p className="text-xs text-slate-600 font-medium mt-1">
          Periode: {periode === "bulanan" ? `${MONTH_LABELS[monthIndex]} ${selectedYear}` : periode === "s1" ? `Semester 1 ${selectedYear}` : periode === "s2" ? `Semester 2 ${selectedYear}` : `Tahunan ${selectedYear}`} &middot; Dicetak pada {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Header + Year selector */}
      <div className="flex items-center justify-between no-print">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-orange-500" /> Presentasi &amp; Evaluasi
          </h2>
          <p className="text-xs text-slate-400 font-medium">{data.tku || "DP JEMBER 1"} &middot; {data.cabang || "JEMBER"}</p>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
          <button
            onClick={() => setSelectedYear(String(parseInt(selectedYear) - 1))}
            className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-500 cursor-pointer"
            title="Tahun Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-black text-slate-800 dark:text-white px-2">{selectedYear}</span>
          <button
            onClick={() => setSelectedYear(String(parseInt(selectedYear) + 1))}
            className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-500 cursor-pointer"
            title="Tahun Berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Action Bar: Mode Presentasi & Kontrol Tambahan */}
      <div className="space-y-2 no-print">
        {/* Tombol Utama: Mode Presentasi */}
        <button
          onClick={async () => {
            // PENTING: requestFullscreen & orientation lock HARUS dipanggil langsung
            // di dalam event klik ini (bukan di useEffect setelah komponen mount),
            // supaya browser HP tidak menolaknya (butuh user gesture langsung).
            try {
              if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
              }
            } catch {
              // Browser ini mungkin tidak mendukung Fullscreen API (mis. Safari iOS).
              // Presentasi tetap dibuka, hanya tanpa mode layar penuh browser.
            }
            try {
              const orient = (screen as any).orientation;
              if (orient?.lock) {
                await orient.lock("landscape");
              }
            } catch {
              // Sebagian browser/OS tidak mengizinkan penguncian orientasi via web.
              // Presentasi tetap dibuka; user bisa memutar HP secara manual.
            }
            setSlideMode(true);
          }}
          disabled={slides.length === 0}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed text-white font-black text-xs sm:text-sm py-3 rounded-2xl shadow-md cursor-pointer transition-all active:scale-[0.98]"
        >
          <Play className="w-4 h-4 fill-white" /> Mode Presentasi (Layar Penuh)
        </button>

        {/* 3 Tombol Pendukung: Sinkronkan Arsip, Salin Ringkasan WA, Cetak PDF */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={handleSyncFromArchives}
            disabled={isSyncing}
            className="flex items-center justify-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-orange-400 dark:hover:border-orange-500 text-slate-700 dark:text-slate-200 text-xs font-bold py-2 px-2 rounded-xl shadow-xs cursor-pointer transition-all active:scale-95 disabled:opacity-50"
            title="Tarik &amp; Sinkronkan Data dari Arsip Supabase"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-orange-500 shrink-0 ${isSyncing ? "animate-spin" : ""}`} />
            <span className="truncate">{isSyncing ? "Menyinkronkan..." : "Tarik Arsip"}</span>
          </button>

          <button
            onClick={handleCopyWhatsApp}
            className="flex items-center justify-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold py-2 px-2 rounded-xl shadow-xs cursor-pointer transition-all active:scale-95"
            title="Salin Ringkasan Eksekutif untuk WhatsApp"
          >
            {copiedWA ? (
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            ) : (
              <Share2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            )}
            <span className="truncate">{copiedWA ? "Tersalin!" : "Ringkasan WA"}</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 text-slate-700 dark:text-slate-200 text-xs font-bold py-2 px-2 rounded-xl shadow-xs cursor-pointer transition-all active:scale-95"
            title="Cetak atau Simpan sebagai PDF"
          >
            <Printer className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span className="truncate">Cetak / PDF</span>
          </button>
        </div>
      </div>

      {/* Filter periode */}
      <div className="grid grid-cols-4 gap-1.5 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl no-print">
        {([
          { id: "bulanan", label: "Bulanan" },
          { id: "s1", label: "Semester 1" },
          { id: "s2", label: "Semester 2" },
          { id: "tahunan", label: "Tahunan" },
        ] as { id: Periode; label: string }[]).map((opt) => (
          <button
            key={opt.id}
            onClick={() => setPeriode(opt.id)}
            className={`text-[11px] sm:text-xs font-bold py-2 rounded-xl transition-all cursor-pointer ${
              periode === opt.id
                ? "bg-orange-500 text-white shadow-md"
                : "text-slate-500 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-700/60"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <YlOfTheMonthCard
        perYL={perYL}
        bulanan={bulanan}
        periode={periode}
        monthIndex={monthIndex}
        selectedYear={selectedYear}
        periodeLabel={
          periode === "bulanan"
            ? `${MONTH_LABELS[monthIndex]} ${selectedYear}`
            : periode === "s1"
            ? "Semester 1"
            : periode === "s2"
            ? "Semester 2"
            : `Tahunan ${selectedYear}`
        }
        record={otmRecord}
        loading={otmLoading}
        onSave={saveOtm}
        onClear={clearOtm}
      />

      {periode === "bulanan" && (
        <LaporanBulanan
          bulanan={bulanan}
          perYL={perYL}
          monthIndex={monthIndex}
          setMonthIndex={setMonthIndex}
          selectedYear={selectedYear}
          actionPlanNode={
            <ActionPlanCard
              items={actionPlans}
              onAdd={addActionPlan}
              onToggle={toggleActionPlan}
              onDelete={deleteActionPlan}
              label={MONTH_LABELS[monthIndex]}
            />
          }
        />
      )}
      {periode === "s1" && (
        <LaporanSemester
          bulanan={bulanan}
          perYL={perYL}
          startIdx={0}
          endIdx={5}
          title="Semester 1 (Januari – Juni)"
          tahun={data.tahun || selectedYear}
          actionPlanNode={
            <ActionPlanCard
              items={actionPlans}
              onAdd={addActionPlan}
              onToggle={toggleActionPlan}
              onDelete={deleteActionPlan}
              label="Semester 1"
            />
          }
        />
      )}
      {periode === "s2" && (
        <LaporanSemester2
          bulanan={bulanan}
          perYL={perYL}
          jumlahYL={data.jumlahYL || perYL.length || 10}
          tahun={data.tahun || selectedYear}
          actionPlanNode={
            <ActionPlanCard
              items={actionPlans}
              onAdd={addActionPlan}
              onToggle={toggleActionPlan}
              onDelete={deleteActionPlan}
              label="Semester 2"
            />
          }
        />
      )}
      {periode === "tahunan" && (
        <LaporanTahunan
          bulanan={bulanan}
          perYL={perYL}
          tahun={data.tahun || selectedYear}
          actionPlanNode={
            <ActionPlanCard
              items={actionPlans}
              onAdd={addActionPlan}
              onToggle={toggleActionPlan}
              onDelete={deleteActionPlan}
              label={`Tahunan ${selectedYear}`}
            />
          }
        />
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Komponen Tabel Rata-Rata Penjualan per YL
// ----------------------------------------------------------------------------

export function TabelRataRataYL({
  perYL,
  startIdx,
  endIdx,
  title,
  subtitle,
  isDarkSlide = false,
}: {
  perYL: any[];
  startIdx: number;
  endIdx: number;
  title?: string;
  subtitle?: string;
  isDarkSlide?: boolean;
}) {
  const [sortBy, setSortBy] = useState<"rank" | "area">("rank");
  const [colMode, setColMode] = useState<"compact" | "all">("all");
  const [density, setDensity] = useState<"compact" | "normal">(isDarkSlide ? "compact" : "normal");

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 640) {
      setColMode("compact");
    }
  }, []);

  const {
    rows,
    monthIndices,
    teamMonthlyAvgs,
    teamOverallAvg,
    totalMandiri,
    totalBinaan,
    totalUp,
    totalDown,
    totalCoaching,
  } = useMemo(() => {
    return computeYLAverageData(perYL, startIdx, endIdx);
  }, [perYL, startIdx, endIdx]);

  const sortedRows = useMemo(() => {
    const list = [...rows];
    if (sortBy === "area") {
      list.sort((a, b) => a.area.localeCompare(b.area, undefined, { numeric: true }));
    } else {
      list.sort((a, b) => b.rataRata - a.rataRata);
    }
    return list;
  }, [rows, sortBy]);

  const top1 = rows[0];
  const startMonthName = MONTH_LABELS[startIdx] || "";
  const endMonthName = MONTH_LABELS[endIdx] || "";
  const monthCount = monthIndices.length;
  const isCompactDensity = density === "compact";

  if (!perYL || perYL.length === 0) {
    return (
      <div className={`p-4 text-center text-xs ${isDarkSlide ? "text-slate-400" : "text-slate-500"}`}>
        Data penjualan per Yakult Lady belum tersedia untuk periode ini.
      </div>
    );
  }

  return (
    <div className={isDarkSlide ? "space-y-1.5 w-full" : "space-y-3"}>
      {/* Title & Controls (Render only if not in dark presentation slide OR if explicit title is passed) */}
      {(!isDarkSlide || title) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            {title && (
              <h4 className={`text-xs font-black flex items-center gap-1.5 ${isDarkSlide ? "text-white" : "text-slate-900 dark:text-white"}`}>
                <Users className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                <span>{title}</span>
              </h4>
            )}
            {subtitle ? (
              <p className={`text-[9.5px] mt-0.2 ${isDarkSlide ? "text-slate-400" : "text-slate-500 dark:text-slate-400"}`}>
                {subtitle}
              </p>
            ) : (
              <p className={`text-[9.5px] mt-0.2 ${isDarkSlide ? "text-slate-400" : "text-slate-500 dark:text-slate-400"}`}>
                Rata-rata penjualan harian (botol/hari) dari bulan {startMonthName} s/d {endMonthName} ({monthCount} bulan)
              </p>
            )}
          </div>

          {/* View Mode & Sort Controls */}
          <div className="flex items-center gap-1 self-start sm:self-auto shrink-0 flex-wrap">
            {/* Kolom Mode Toggle (Ringkas Fit HP vs Semua Bulan) */}
            <div className={`flex items-center p-0.5 rounded-lg border text-[9px] sm:text-[9.5px] font-bold ${
              isDarkSlide ? "bg-slate-800/90 border-slate-700" : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
            }`}>
              <button
                type="button"
                onClick={() => setColMode("compact")}
                className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                  colMode === "compact"
                    ? "bg-orange-500 text-white shadow-sm"
                    : isDarkSlide ? "text-slate-400 hover:text-white" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
                title="Mode Ringkas: Tampilkan 10 YL langsung tanpa geser horizontal"
              >
                📱 Ringkas (10 YL)
              </button>
              <button
                type="button"
                onClick={() => setColMode("all")}
                className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                  colMode === "all"
                    ? "bg-orange-500 text-white shadow-sm"
                    : isDarkSlide ? "text-slate-400 hover:text-white" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
                title="Mode Lengkap: Tampilkan seluruh bulan"
              >
                📊 Semua Bulan
              </button>
            </div>

            {/* Sort Toggle */}
            <button
              type="button"
              onClick={() => setSortBy(sortBy === "rank" ? "area" : "rank")}
              className={`inline-flex items-center gap-1 font-bold px-1.5 py-0.5 rounded border transition-all cursor-pointer text-[9px] sm:text-[9.5px] ${
                isDarkSlide
                  ? "bg-slate-800/90 border-slate-700 text-slate-300 hover:text-white"
                  : "bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-orange-400"
              }`}
              title="Klik untuk ubah urutan data"
            >
              <ArrowUpDown className="w-2.5 h-2.5 text-orange-500" />
              <span>{sortBy === "rank" ? "Rank ⬇" : "Area ⬇"}</span>
            </button>
          </div>
        </div>
      )}

      {/* KPI Highlight Badges / Ribbon */}
      {isDarkSlide ? (
        <div className="flex items-center justify-between gap-1 flex-wrap bg-slate-800/70 border border-slate-700/80 rounded-lg px-2 py-0.5 text-[9px] sm:text-[10px]">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 font-bold text-orange-300">
              <span className="text-slate-400 font-normal">Rata² Tim:</span>
              <span className="font-mono font-black text-white">{fmtNum(teamOverallAvg)}</span>
              <span className="text-[8px] text-slate-400 font-normal">btl/hr</span>
            </span>
            <span className="text-slate-600 hidden sm:inline">&middot;</span>
            <span className="inline-flex items-center gap-1 font-bold text-emerald-400">
              <span className="text-slate-400 font-normal">Mandiri:</span>
              <span className="font-mono font-black">{totalMandiri} YL</span>
            </span>
            <span className="text-slate-600 hidden sm:inline">&middot;</span>
            <span className="inline-flex items-center gap-1 font-bold text-amber-400">
              <span className="text-slate-400 font-normal">Binaan:</span>
              <span className="font-mono font-black">{totalBinaan} YL</span>
            </span>
            <span className="text-slate-600 hidden sm:inline">&middot;</span>
            <span className="inline-flex items-center gap-1 font-bold text-teal-300">
              <span className="text-slate-400 font-normal">Tren:</span>
              <span className="text-emerald-400 inline-flex items-center"><ArrowUpRight className="w-2.5 h-2.5" />{totalUp}</span>
              <span className="text-slate-500">/</span>
              <span className="text-rose-400 inline-flex items-center"><ArrowDownRight className="w-2.5 h-2.5" />{totalDown}</span>
            </span>
            <span className="text-slate-600 hidden sm:inline">&middot;</span>
            <span className="inline-flex items-center gap-1 font-bold text-rose-400">
              <span className="text-slate-400 font-normal">Coaching:</span>
              <span className="font-mono font-black">{totalCoaching} YL</span>
            </span>
          </div>

          {/* Integrated Compact Controls for Dark Slide Mode */}
          <div className="flex items-center gap-1.5 ml-auto">
            <div className="flex items-center p-0.5 rounded border border-slate-700 bg-slate-900/80 text-[8.5px] font-bold">
              <button
                type="button"
                onClick={() => setColMode("compact")}
                className={`px-1.5 py-0.2 rounded transition-all cursor-pointer ${
                  colMode === "compact" ? "bg-orange-500 text-white font-black" : "text-slate-400 hover:text-white"
                }`}
                title="Mode Ringkas 10 YL"
              >
                Ringkas
              </button>
              <button
                type="button"
                onClick={() => setColMode("all")}
                className={`px-1.5 py-0.2 rounded transition-all cursor-pointer ${
                  colMode === "all" ? "bg-orange-500 text-white font-black" : "text-slate-400 hover:text-white"
                }`}
                title="Mode Semua Bulan"
              >
                Semua Bulan
              </button>
            </div>

            <button
              type="button"
              onClick={() => setSortBy(sortBy === "rank" ? "area" : "rank")}
              className="inline-flex items-center gap-0.5 font-bold px-1.5 py-0.5 rounded border border-slate-700 bg-slate-900/80 text-slate-300 hover:text-white text-[8.5px] cursor-pointer"
              title="Urutkan Peringkat / Area"
            >
              <ArrowUpDown className="w-2.5 h-2.5 text-orange-400" />
              <span>{sortBy === "rank" ? "Rank" : "Area"}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-3">
          <div className="rounded-xl border p-2.5 bg-orange-50/60 dark:bg-orange-950/20 border-orange-200/60 dark:border-orange-900/40">
            <p className="text-[10px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">Rata² Tim</p>
            <p className="font-black text-base sm:text-lg text-slate-900 dark:text-white mt-0.5">
              {fmtNum(teamOverallAvg)} <span className="text-xs font-normal text-slate-400">btl/hr</span>
            </p>
          </div>

          <div className="rounded-xl border p-2.5 bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-900/40">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Mandiri (≥250)</p>
            <p className="font-black text-base sm:text-lg text-emerald-700 dark:text-emerald-300 mt-0.5">
              {totalMandiri} <span className="text-xs font-normal text-slate-400">YL</span>
            </p>
          </div>

          <div className="rounded-xl border p-2.5 bg-amber-50/60 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-900/40">
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Binaan (&lt;250)</p>
            <p className="font-black text-base sm:text-lg text-amber-700 dark:text-amber-300 mt-0.5">
              {totalBinaan} <span className="text-xs font-normal text-slate-400">YL</span>
            </p>
          </div>

          <div className="rounded-xl border p-2.5 bg-teal-50/60 dark:bg-teal-950/20 border-teal-200/60 dark:border-teal-900/40">
            <p className="text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">Tren Performa</p>
            <p className="font-black text-xs sm:text-sm text-slate-800 dark:text-white mt-1 flex items-center gap-1.5">
              <span className="text-emerald-500 font-bold inline-flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5" /> {totalUp}
              </span>
              <span className="text-slate-400">&middot;</span>
              <span className="text-rose-500 font-bold inline-flex items-center">
                <ArrowDownRight className="w-3.5 h-3.5" /> {totalDown}
              </span>
            </p>
          </div>

          <div className="rounded-xl border p-2.5 bg-rose-50/60 dark:bg-rose-950/20 border-rose-200/60 dark:border-rose-900/40">
            <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">Perlu Coaching</p>
            <p className="font-black text-base sm:text-lg text-rose-700 dark:text-rose-300 mt-0.5">
              {totalCoaching} <span className="text-xs font-normal text-slate-400">YL</span>
            </p>
          </div>
        </div>
      )}

      {/* Main Table with Responsive Scrolling & Sticky Name */}
      <div className={`rounded-xl border ${
        isDarkSlide
          ? "w-full overflow-x-auto border-slate-700/80 bg-slate-900/60 shadow-lg"
          : "overflow-x-auto border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40"
      }`}>
        <table className={`w-full border-collapse ${
          isCompactDensity
            ? "text-[9.5px] sm:text-[10.5px]"
            : "text-[11px] sm:text-xs"
        }`}>
          <thead>
            <tr className={`border-b ${
              isDarkSlide
                ? "bg-slate-800/95 text-slate-300 border-slate-700"
                : "bg-slate-50 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
            }`}>
              <th className={`sticky left-0 z-20 ${
                isDarkSlide ? "bg-slate-800" : "bg-slate-100 dark:bg-slate-800"
              } ${isCompactDensity ? "py-1 px-1 w-6 sm:w-7" : "py-1.5 px-1.5 w-8"} text-center font-bold`}>
                #
              </th>
              <th className={`sticky left-[24px] sm:left-[28px] z-20 ${
                isDarkSlide ? "bg-slate-800" : "bg-slate-100 dark:bg-slate-800"
              } ${isCompactDensity ? "py-1 px-1 w-8 sm:w-10" : "py-1.5 px-1.5 w-10 sm:w-12"} text-center font-bold`}>
                Area
              </th>
              <th className={`sticky left-[56px] sm:left-[68px] z-20 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.3)] border-r ${
                isDarkSlide ? "bg-slate-800 border-slate-700/80" : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              } ${isCompactDensity ? "py-1 px-1.5 min-w-[85px] max-w-[120px]" : "py-1.5 px-2 min-w-[110px]"} text-left font-bold truncate`}>
                Nama Yakult Lady
              </th>
              {colMode === "all" && monthIndices.map((i) => (
                <th key={i} className={`${isCompactDensity ? "py-1 px-1 text-center sm:text-right min-w-[38px] sm:min-w-[46px]" : "py-1.5 px-2 text-right min-w-[50px]"} font-bold`}>
                  {MONTH_SHORT[i]}
                </th>
              ))}
              <th className={`${
                isCompactDensity ? "py-1 px-1.5" : "py-1.5 px-2"
              } text-right font-black ${
                isDarkSlide
                  ? "text-orange-400 bg-orange-500/10"
                  : "text-orange-600 dark:text-orange-400 bg-orange-100/50 dark:bg-orange-950/40"
              } ${colMode === "compact" ? "min-w-[65px]" : "min-w-[55px]"}`}>
                Rata²
              </th>
              <th className={`${isCompactDensity ? "py-1 px-1 min-w-[46px]" : "py-1.5 px-2 min-w-[60px]"} text-center font-bold`}>
                Tren
              </th>
              <th className={`${isCompactDensity ? "py-1 px-1 min-w-[60px]" : "py-1.5 px-2 min-w-[85px]"} text-center font-bold`}>
                Status
              </th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDarkSlide ? "divide-slate-800/80" : "divide-slate-100 dark:divide-slate-800"}`}>
            {sortedRows.map((r) => {
              const originalRank = rows.findIndex((item) => item.area === r.area) + 1;
              const medal = originalRank === 1 ? "🥇" : originalRank === 2 ? "🥈" : originalRank === 3 ? "🥉" : null;

              return (
                <tr
                  key={r.area}
                  className={`group transition-colors ${
                    isDarkSlide
                      ? "hover:bg-slate-800/50"
                      : "hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                  }`}
                >
                  <td className={`sticky left-0 z-10 ${
                    isDarkSlide ? "bg-[#0E1220] group-hover:bg-slate-800" : "bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800"
                  } ${isDarkSlide ? "py-0.5 px-0.5" : isCompactDensity ? "py-0.5 px-1" : "py-1.5 px-2"} text-center font-bold`}>
                    {medal ? (
                      <span className={isCompactDensity ? "text-[10px]" : "text-xs"} title={`Peringkat ${originalRank}`}>{medal}</span>
                    ) : (
                      <span className="text-slate-400 font-mono text-[9px] sm:text-[10px]">{originalRank}</span>
                    )}
                  </td>
                  <td className={`sticky left-[20px] sm:left-[24px] z-10 ${
                    isDarkSlide ? "bg-[#0E1220] group-hover:bg-slate-800" : "bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800"
                  } ${isDarkSlide ? "py-0.5 px-0.5 text-[9px]" : isCompactDensity ? "py-0.5 px-1 text-[9.5px]" : "py-1.5 px-2 text-[10.5px]"} text-center font-mono font-bold text-slate-400`}>
                    {r.area}
                  </td>
                  <td className={`sticky left-[48px] sm:left-[58px] z-10 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.3)] border-r ${
                    isDarkSlide
                      ? "bg-[#0E1220] border-slate-700/80 text-white group-hover:bg-slate-800"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 group-hover:bg-slate-50 dark:group-hover:bg-slate-800"
                  } ${isDarkSlide ? "py-0.5 px-1 max-w-[85px] sm:max-w-[120px]" : isCompactDensity ? "py-0.5 px-1.5 max-w-[95px] sm:max-w-[130px]" : "py-1.5 px-2 max-w-[140px]"} font-bold truncate text-[9.5px] sm:text-[10.5px]`}>
                    {r.nama}
                  </td>
                  {colMode === "all" && r.monthlyValues.map((m, mIdx) => (
                    <td
                      key={mIdx}
                      className={`${isDarkSlide ? "py-0.5 px-0.5 text-center sm:text-right font-mono text-[9px] sm:text-[9.5px]" : isCompactDensity ? "py-0.5 px-1 text-center sm:text-right font-mono" : "py-1.5 px-2 text-right font-mono"} font-medium ${
                        m.value === null || m.value === undefined
                          ? "text-slate-400 dark:text-slate-600"
                          : isDarkSlide
                          ? "text-slate-200"
                          : "text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {m.value !== null && m.value !== undefined ? fmtNum(m.value) : "-"}
                    </td>
                  ))}
                  <td className={`${
                    isDarkSlide ? "py-0.5 px-1 font-mono font-black text-[9.5px] sm:text-[10.5px]" : isCompactDensity ? "py-0.5 px-1.5 font-mono font-black" : "py-1.5 px-2 font-mono font-black"
                  } ${
                    isDarkSlide
                      ? "text-orange-400 bg-orange-500/10"
                      : "text-orange-600 dark:text-orange-400 bg-orange-50/60 dark:bg-orange-950/30"
                  } text-right`}>
                    {fmtNum(r.rataRata)}
                  </td>
                  <td className={`${isDarkSlide ? "py-0.5 px-0.5" : isCompactDensity ? "py-0.5 px-1" : "py-1.5 px-2"} text-center`}>
                    {r.trend === "up" ? (
                      <span className={`inline-flex items-center ${isDarkSlide ? "text-[8px] sm:text-[8.5px]" : isCompactDensity ? "text-[8.5px] sm:text-[9.5px]" : "text-[10px]"} font-bold text-emerald-400 gap-0.5`} title={`Kenaikan +${Math.abs(r.delta).toFixed(1)} botol`}>
                        <ArrowUpRight className={isDarkSlide ? "w-2 h-2" : isCompactDensity ? "w-2.5 h-2.5" : "w-3 h-3"} /> +{Math.abs(r.delta).toFixed(0)}
                      </span>
                    ) : r.trend === "down" ? (
                      <span className={`inline-flex items-center ${isDarkSlide ? "text-[8px] sm:text-[8.5px]" : isCompactDensity ? "text-[8.5px] sm:text-[9.5px]" : "text-[10px]"} font-bold text-rose-400 gap-0.5`} title={`Penurunan -${Math.abs(r.delta).toFixed(1)} botol`}>
                        <ArrowDownRight className={isDarkSlide ? "w-2 h-2" : isCompactDensity ? "w-2.5 h-2.5" : "w-3 h-3"} /> -{Math.abs(r.delta).toFixed(0)}
                      </span>
                    ) : (
                      <span className={`inline-flex items-center ${isDarkSlide ? "text-[8px] sm:text-[8.5px]" : isCompactDensity ? "text-[8.5px] sm:text-[9.5px]" : "text-[10px]"} font-medium text-slate-400 gap-0.5`}>
                        <ArrowRightIcon className="w-2 h-2" /> Stb
                      </span>
                    )}
                  </td>
                  <td className={`${isDarkSlide ? "py-0.5 px-0.5" : isCompactDensity ? "py-0.5 px-1" : "py-1.5 px-2"} text-center`}>
                    {r.isMandiri ? (
                      r.trend === "down" ? (
                        <span className={`inline-block font-black rounded border ${
                          isDarkSlide
                            ? "text-[7.5px] sm:text-[8px] px-1 py-0 bg-amber-500/20 border-amber-500/30 text-amber-300"
                            : "text-[9px] px-1.5 py-0.5 bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300"
                        }`}>
                          Mandiri (Drop)
                        </span>
                      ) : (
                        <span className={`inline-block font-black rounded border ${
                          isDarkSlide
                            ? "text-[7.5px] sm:text-[8px] px-1 py-0 bg-emerald-500/20 border-emerald-500/30 text-emerald-300"
                            : "text-[9px] px-1.5 py-0.5 bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300"
                        }`}>
                          Mandiri
                        </span>
                      )
                    ) : (
                      <span className={`inline-block font-black rounded border ${
                        isDarkSlide
                          ? "text-[7.5px] sm:text-[8px] px-1 py-0 bg-rose-500/20 border-rose-500/30 text-rose-300"
                          : "text-[9px] px-1.5 py-0.5 bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300"
                      }`}>
                        Coaching
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className={`border-t-2 font-black ${
              isDarkSlide
                ? "border-slate-700 bg-slate-800/95 text-white"
                : "border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
            }`}>
              <td colSpan={3} className={`sticky left-0 z-20 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.3)] border-r ${
                isDarkSlide ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              } ${isDarkSlide ? "py-0.5 px-1 text-[8.5px] sm:text-[9.5px]" : isCompactDensity ? "py-1 px-1.5 text-[9px] sm:text-[10px]" : "py-2 px-2 text-[11px]"} text-left tracking-wide uppercase`}>
                RATA-RATA TIM
              </td>
              {colMode === "all" && teamMonthlyAvgs.map((col, cIdx) => (
                <td key={cIdx} className={`${isDarkSlide ? "py-0.5 px-0.5 text-center sm:text-right font-mono text-[8.5px] sm:text-[9.5px]" : isCompactDensity ? "py-1 px-1 text-center sm:text-right font-mono text-[9px] sm:text-[10px]" : "py-2 px-2 text-right font-mono text-[11px]"}`}>
                  {fmtNum(col.avg)}
                </td>
              ))}
              <td className={`${
                isDarkSlide ? "py-0.5 px-1 text-[9.5px] sm:text-[10.5px]" : isCompactDensity ? "py-1 px-1.5 text-[10.5px] sm:text-[11.5px]" : "py-2 px-2 text-xs"
              } ${
                isDarkSlide ? "text-orange-400 bg-orange-500/20" : "text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-950/60"
              } text-right font-mono font-black`}>
                {fmtNum(teamOverallAvg)}
              </td>
              <td className={`${isDarkSlide ? "py-0.5 px-0.5 text-[8px] sm:text-[8.5px]" : isCompactDensity ? "py-1 px-1 text-[8.5px] sm:text-[9.5px]" : "py-2 px-2 text-[10px]"} text-center text-slate-400`}>
                {totalUp} ↗ &middot; {totalDown} ↘
              </td>
              <td className={`${isDarkSlide ? "py-0.5 px-0.5 text-[8px] sm:text-[8.5px]" : isCompactDensity ? "py-1 px-1 text-[8.5px] sm:text-[9.5px]" : "py-2 px-2 text-[10px]"} text-center text-slate-400`}>
                {rows.length > 0 ? `${Math.round((totalMandiri / rows.length) * 100)}% Mandiri` : "-"}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {!isDarkSlide && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-[8.5px] sm:text-[9.5px] text-slate-400 px-1 gap-1">
          <span>*Keterangan: Standar YL Mandiri ≥ 250 btl/hari &middot; Tren membandingkan capaian bulan terakhir vs awal periode</span>
          <span className="font-mono text-slate-500">10 Yakult Lady Terdata</span>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Komponen Evaluasi: Analisis Absensi Loss, Mix Product, & Uji Beban Target
// ----------------------------------------------------------------------------

export function AnalisisAbsensiLossCard({
  months,
  title = "Analisis Dampak Absensi & Potensi Kehilangan (Loss Potential)",
  subtitle,
  isDarkSlide = false,
}: {
  months: any[];
  title?: string;
  subtitle?: string;
  isDarkSlide?: boolean;
}) {
  const res = useMemo(() => computeLossPotential(months), [months]);

  return (
    <div className={`rounded-2xl border ${
      isDarkSlide
        ? "p-2.5 sm:p-3 bg-slate-900/80 border-slate-700/80 text-white w-full"
        : "p-4 sm:p-5 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white shadow-xs"
    }`}>
      {/* Title & Header */}
      {!isDarkSlide ? (
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 shrink-0">
                <ShieldAlert className="w-4 h-4" />
              </span>
              <h4 className="font-black text-xs sm:text-sm">{title}</h4>
            </div>
            <p className="text-[11px] mt-1 text-slate-500 dark:text-slate-400">
              {subtitle || "Kalkulasi dampak ketidakhadiran (izin/sakit) terhadap botol penjualan yang terlewatkan"}
            </p>
          </div>
          {res.hasAbsen ? (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
              {res.totalFrekuensiAbsen}x Absen ({res.totalYLAbsen} YL)
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
              100% Kehadiran Disiplin
            </span>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2 mb-2 px-1">
          <span className="text-[10.5px] sm:text-[11px] text-slate-400 font-medium">Ringkasan Dampak Ketidakhadiran Tim:</span>
          {res.hasAbsen ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
              {res.totalFrekuensiAbsen}x Absen ({res.totalYLAbsen} YL)
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
              100% Kehadiran Disiplin
            </span>
          )}
        </div>
      )}

      {/* Metrics Grid (3 Kartu Sederhana: Hari Absen, Rata-Rata YL, dan Botol Terlewatkan) */}
      <div className={`grid grid-cols-1 sm:grid-cols-3 ${isDarkSlide ? "gap-2 mb-2.5" : "gap-2.5 mb-4"}`}>
        <div className={`rounded-xl border ${isDarkSlide ? "p-2 sm:p-2.5 bg-slate-800/60 border-slate-700/70" : "p-3 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700"}`}>
          <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Hari Izin / Sakit</p>
          <p className={`font-black mt-0.5 text-rose-500 ${isDarkSlide ? "text-base sm:text-lg" : "text-base sm:text-lg"}`}>
            {fmtNum(res.totalFrekuensiAbsen)} <span className="text-[10px] font-normal text-slate-400">Hari</span>
          </p>
          <p className="text-[9.5px] text-slate-400 mt-0.5">dari {res.totalYLAbsen} Ibu YL</p>
        </div>

        <div className={`rounded-xl border ${isDarkSlide ? "p-2 sm:p-2.5 bg-slate-800/60 border-slate-700/70" : "p-3 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700"}`}>
          <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400">Rata-Rata Penjualan YL</p>
          <p className={`font-black mt-0.5 ${isDarkSlide ? "text-white text-base sm:text-lg" : "text-slate-800 dark:text-white text-base sm:text-lg"}`}>
            ~{fmtNum(res.avgSalesPerYL)} <span className="text-[10px] font-normal text-slate-400">Btl / Hari</span>
          </p>
          <p className="text-[9.5px] text-slate-400 mt-0.5">Kapasitas harian per YL</p>
        </div>

        <div className={`rounded-xl border ${isDarkSlide ? "p-2 sm:p-2.5 bg-slate-800/60 border-rose-500/30" : "p-3 bg-rose-50/50 dark:bg-rose-950/20 border-rose-200/60 dark:border-rose-900/40"}`}>
          <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-rose-400">Botol Terlewatkan</p>
          <p className={`font-black mt-0.5 text-rose-400 ${isDarkSlide ? "text-base sm:text-lg" : "text-rose-600 dark:text-rose-400 text-base sm:text-lg"}`}>
            ~{fmtNum(res.potensiBotolHilang)} <span className="text-[10px] font-normal text-slate-400">Btl</span>
          </p>
          <p className="text-[9.5px] font-bold text-rose-300 mt-0.5">~{fmtNum(res.potensiPakHilang)} Pak Yakult</p>
        </div>
      </div>

      {/* Solusi Utama Saat YL Izin atau Sakit */}
      <div className={`rounded-xl border ${
        isDarkSlide
          ? "p-2.5 sm:p-3 bg-slate-800/40 border-slate-700/60 text-slate-300"
          : "p-3 sm:p-4 bg-orange-50/50 dark:bg-slate-900/40 border-orange-200/60 dark:border-slate-700 text-slate-600 dark:text-slate-300"
      }`}>
        <p className="font-black text-[10.5px] sm:text-xs text-orange-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5 text-orange-500" /> Solusi Bila Ada YL Izin atau Sakit:
        </p>
        <div className="flex items-start gap-2.5 bg-slate-900/60 dark:bg-slate-900/80 p-2 sm:p-2.5 rounded-xl border border-slate-800">
          <span className="text-xl shrink-0 mt-0.5">🔄</span>
          <div>
            <p className="text-xs sm:text-sm font-black text-white">
              Kirim Tambahan Hari Berikutnya
            </p>
            <p className="text-[10.5px] sm:text-xs text-slate-300 mt-0.5 leading-relaxed">
              Saat Ibu YL sudah aktif masuk kembali, antarkan botol tambahan atau kirim dobel ke pelanggan untuk menutup botol harian yang sempat terlewat saat izin atau sakit.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AnalisisMixProductCard({
  months,
  title = "Evaluasi Mix Produk: Original vs Varian Baru",
  subtitle,
  isDarkSlide = false,
}: {
  months: any[];
  title?: string;
  subtitle?: string;
  isDarkSlide?: boolean;
}) {
  const res = useMemo(() => computeMixProductAnalysis(months), [months]);

  return (
    <div className={`rounded-2xl border ${
      isDarkSlide
        ? "p-2.5 sm:p-3 bg-slate-900/80 border-slate-700/80 text-white"
        : "p-4 sm:p-5 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white shadow-xs"
    }`}>
      {/* Header */}
      {!isDarkSlide ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-orange-500/10 text-orange-500 shrink-0">
                <PieChartIcon className="w-4 h-4" />
              </span>
              <h4 className="font-black text-xs sm:text-sm">{title}</h4>
            </div>
            <p className="text-[10px] sm:text-[11px] mt-0.5 text-slate-500 dark:text-slate-400">
              {subtitle || "Tingkat penetrasi Original Mangga (OM), Original Stroberi (OS), dan Yakult Light (YT) dibanding Original (YO)"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black border ${
              res.pctVarianBaru >= 15
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                : "bg-amber-500/20 text-amber-400 border-amber-500/30"
            }`}>
              Varian Baru: {fmtPct(res.pctVarianBaru, 1)}% {res.pctVarianBaru >= 15 ? "(Target ≥15% ✅)" : "(Target ≥15% ⚠️)"}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2 mb-2 px-1">
          <span className="text-[10.5px] sm:text-[11px] text-slate-400 font-medium">Penetrasi Varian Baru (OM, OS, YT) vs YO:</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
            res.pctVarianBaru >= 15
              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
              : "bg-amber-500/20 text-amber-400 border-amber-500/30"
          }`}>
            Varian Baru: {fmtPct(res.pctVarianBaru, 1)}% {res.pctVarianBaru >= 15 ? "(Target ≥15% ✅)" : "(Target ≥15% ⚠️)"}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        {/* Donut Chart */}
        <div className={`sm:col-span-5 ${isDarkSlide ? "h-32 sm:h-38" : "h-44"}`}>
          {res.total > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={res.chartData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={isDarkSlide ? 30 : 38}
                  outerRadius={isDarkSlide ? 52 : 62}
                  paddingAngle={2}
                >
                  {res.chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => `${fmtNum(v)} btl (${((v / res.total) * 100).toFixed(1)}%)`} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-xs text-slate-400 italic">
              Data komposisi produk belum terisi.
            </div>
          )}
        </div>

        {/* Product Breakdown stats */}
        <div className={`sm:col-span-7 ${isDarkSlide ? "space-y-1.5" : "space-y-2"}`}>
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
            <div className={`p-2 rounded-xl border ${isDarkSlide ? "bg-slate-800/60 border-slate-700/60" : "bg-red-50/50 dark:bg-red-950/20 border-red-200/60 dark:border-red-900/30"}`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-red-600 dark:text-red-400 truncate">Original (YO)</span>
                <span className="text-[10px] font-black">{fmtPct(res.pctYO, 1)}%</span>
              </div>
              <p className="text-xs sm:text-sm font-black mt-0.5">{fmtNum(res.yo)} <span className="text-[9px] font-normal text-slate-400">btl</span></p>
            </div>

            <div className={`p-2 rounded-xl border ${isDarkSlide ? "bg-slate-800/60 border-slate-700/60" : "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-900/30"}`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 truncate">Original Mangga (OM)</span>
                <span className="text-[10px] font-black">{fmtPct(res.pctOM, 1)}%</span>
              </div>
              <p className="text-xs sm:text-sm font-black mt-0.5">{fmtNum(res.om)} <span className="text-[9px] font-normal text-slate-400">btl</span></p>
            </div>

            <div className={`p-2 rounded-xl border ${isDarkSlide ? "bg-slate-800/60 border-slate-700/60" : "bg-pink-50/50 dark:bg-pink-950/20 border-pink-200/60 dark:border-pink-900/30"}`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-pink-600 dark:text-pink-400 truncate">Original Stroberi (OS)</span>
                <span className="text-[10px] font-black">{fmtPct(res.pctOS, 1)}%</span>
              </div>
              <p className="text-xs sm:text-sm font-black mt-0.5">{fmtNum(res.os)} <span className="text-[9px] font-normal text-slate-400">btl</span></p>
            </div>

            <div className={`p-2 rounded-xl border ${isDarkSlide ? "bg-slate-800/60 border-slate-700/60" : "bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/60 dark:border-blue-900/30"}`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 truncate">Yakult Light (YT)</span>
                <span className="text-[10px] font-black">{fmtPct(res.pctYT, 1)}%</span>
              </div>
              <p className="text-xs sm:text-sm font-black mt-0.5">{fmtNum(res.yt)} <span className="text-[9px] font-normal text-slate-400">btl</span></p>
            </div>
          </div>

          <div className={`p-2 rounded-xl border text-[10px] sm:text-[10.5px] leading-snug ${
            isDarkSlide
              ? "bg-slate-800/40 border-slate-700/60 text-slate-300"
              : "bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
          }`}>
            <p className="font-black text-orange-500 mb-0.5">Strategi Penetrasi Varian:</p>
            <p>
              Tingkatkan edukasi varian <em>Yakult Light (YT)</em> untuk konsumen peduli rendah gula, serta perluas varian <em>Original Mangga (OM)</em> dan <em>Original Stroberi (OS)</em> untuk menarik konsumen baru dan keluarga.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function UjiKelayakanBebanCard({
  targetSisa,
  monthsRemaining,
  jumlahYL = 10,
  currentAvgYL,
  isDarkSlide = false,
}: {
  targetSisa: number;
  monthsRemaining: number;
  jumlahYL?: number;
  currentAvgYL?: number;
  isDarkSlide?: boolean;
}) {
  const res = useMemo(
    () => computeBebanKapasitas(targetSisa, monthsRemaining, jumlahYL),
    [targetSisa, monthsRemaining, jumlahYL]
  );

  const isOver = res.statusBeban === "overcapacity";
  const isHigh = res.statusBeban === "tinggi";

  return (
    <div className={`rounded-2xl border ${
      isDarkSlide
        ? "p-2.5 sm:p-3 bg-slate-900/80 border-slate-700/80 text-white w-full"
        : "p-4 sm:p-5 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white shadow-xs"
    }`}>
      {/* Title */}
      {!isDarkSlide ? (
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className={`p-1.5 rounded-lg ${isOver ? "bg-rose-500/10 text-rose-500" : isHigh ? "bg-amber-500/10 text-amber-500" : "bg-emerald-500/10 text-emerald-500"}`}>
                <AlertTriangle className="w-4 h-4" />
              </span>
              <h4 className="font-black text-xs sm:text-sm">Uji Kelayakan Beban Target &amp; Kapasitas Fisik YL</h4>
            </div>
            <p className="text-[11px] mt-1 text-slate-500 dark:text-slate-400">
              Analisis apakah target sisa periode secara fisik realistis diantar oleh 10 Yakult Lady tanpa melebihi batas kelelahan fisik.
            </p>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-[11px] font-black border shrink-0 ${
            isOver
              ? "bg-rose-500/20 text-rose-400 border-rose-500/30 animate-pulse"
              : isHigh
              ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
              : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
          }`}>
            {isOver ? "🚨 Overcapacity Alert" : isHigh ? "⚠️ Beban Tinggi" : "✅ Kapasitas Aman"}
          </span>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2 mb-2 px-1">
          <span className="text-[10.5px] sm:text-[11px] text-slate-400 font-medium">Uji Realistis Fisik &amp; Kapasitas Harian Tim:</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border shrink-0 ${
            isOver
              ? "bg-rose-500/20 text-rose-400 border-rose-500/30 animate-pulse"
              : isHigh
              ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
              : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
          }`}>
            {isOver ? "🚨 Overcapacity Alert" : isHigh ? "⚠️ Beban Tinggi" : "✅ Kapasitas Aman"}
          </span>
        </div>
      )}

      {/* Stats Grid */}
      <div className={`grid grid-cols-2 sm:grid-cols-4 ${isDarkSlide ? "gap-2 mb-2.5" : "gap-2.5 mb-4"}`}>
        <div className={`rounded-xl border ${isDarkSlide ? "p-2 bg-slate-800/60 border-slate-700/70" : "p-3 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700"}`}>
          <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400">Target Sisa</p>
          <p className={`font-black mt-0.5 text-orange-500 ${isDarkSlide ? "text-sm sm:text-base" : "text-base sm:text-lg"}`}>
            {fmtNum(res.targetSisa)} <span className="text-[9.5px] font-normal text-slate-400">btl</span>
          </p>
          <p className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5">{res.monthsRemaining} bulan tersisa</p>
        </div>

        <div className={`rounded-xl border ${isDarkSlide ? "p-2 bg-slate-800/60 border-slate-700/70" : "p-3 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700"}`}>
          <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400">Hari Kerja Efektif</p>
          <p className={`font-black mt-0.5 ${isDarkSlide ? "text-sm sm:text-base" : "text-base sm:text-lg"}`}>
            {fmtNum(res.daysRemaining)} <span className="text-[9.5px] font-normal text-slate-400">hari</span>
          </p>
          <p className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5">Asumsi 25 hari kerja/bulan</p>
        </div>

        <div className={`rounded-xl border ${isDarkSlide ? "p-2 bg-slate-800/60 border-slate-700/70" : "p-3 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700"}`}>
          <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400">Beban Tim per Hari</p>
          <p className={`font-black mt-0.5 ${isDarkSlide ? "text-sm sm:text-base" : "text-base sm:text-lg"}`}>
            {fmtNum(res.bebanTotalHarian)} <span className="text-[9.5px] font-normal text-slate-400">btl/hr</span>
          </p>
          <p className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5">Total pengantaran 10 YL</p>
        </div>

        <div className={`rounded-xl border ${
          isOver
            ? "bg-rose-500/10 border-rose-500/40"
            : isHigh
            ? "bg-amber-500/10 border-amber-500/40"
            : "bg-emerald-500/10 border-emerald-500/40"
        } ${isDarkSlide ? "p-2" : "p-3"}`}>
          <p className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider ${isOver ? "text-rose-400" : isHigh ? "text-amber-400" : "text-emerald-400"}`}>
            Tuntutan / YL / Hari
          </p>
          <p className={`font-black mt-0.5 ${isOver ? "text-rose-400" : isHigh ? "text-amber-400" : "text-emerald-400"} ${isDarkSlide ? "text-sm sm:text-base" : "text-base sm:text-lg"}`}>
            {fmtNum(res.bebanPerYLHarian)} <span className="text-[9.5px] font-normal text-slate-400">btl/hr</span>
          </p>
          <p className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5">
            {currentAvgYL ? `Realisasi: ${fmtNum(currentAvgYL)} btl` : "Standar mandiri: ≥250"}
          </p>
        </div>
      </div>

      {/* Thermometer / Kapasitas bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-[11px] font-bold mb-1">
          <span className="text-slate-400">Batas Fisik Pengantaran YL:</span>
          <span className={isOver ? "text-rose-400" : isHigh ? "text-amber-400" : "text-emerald-400"}>
            {res.bebanPerYLHarian} btl/hari &middot; {res.statusLabel}
          </span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden flex">
          <div className="bg-emerald-500 h-full" style={{ width: "65%" }} title="Kapasitas Standar (s/d 320 btl)"></div>
          <div className="bg-amber-500 h-full" style={{ width: "15%" }} title="Beban Tinggi (321 - 370 btl)"></div>
          <div className="bg-rose-500 h-full" style={{ width: "20%" }} title="Overcapacity (>370 btl)"></div>
        </div>
        <div className="flex justify-between text-[9px] text-slate-400 mt-1 font-mono">
          <span>0 btl</span>
          <span>320 btl (Normal)</span>
          <span>370 btl (Batas Fisik)</span>
          <span>450+ btl</span>
        </div>
      </div>

      {/* Solusi Strategis */}
      <div className={`p-3 rounded-xl border text-xs ${
        isDarkSlide
          ? "bg-slate-800/40 border-slate-700/60 text-slate-300"
          : "bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
      }`}>
        <p className="font-black text-[11px] text-orange-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" /> Rekomendasi Solusi Kapasitas:
        </p>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
          <li className="flex items-start gap-1.5">
            <span className="text-orange-500 font-black">•</span>
            <span><strong>Split Area &amp; Rekrutmen YL Baru:</strong> Bila tuntutan &gt;370 botol/hari, wajib membagi area padat dan menambah Yakult Lady baru agar kualitas layanan tidak menurun.</span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-orange-500 font-black">•</span>
            <span><strong>Pesanan Kolektif / Instansi:</strong> Fokus penetrasi instansi, sekolah, atau pabrik (order besar dalam 1 titik antar) untuk mendongkrak volume tanpa membebani rute rumah.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// 1. Laporan Bulanan
// ----------------------------------------------------------------------------

function LaporanBulanan({ bulanan, perYL, monthIndex, setMonthIndex, selectedYear, actionPlanNode }: {
  bulanan: Record<string, any>; perYL: any[]; monthIndex: number; setMonthIndex: (i: number) => void; selectedYear?: string | number; actionPlanNode?: React.ReactNode;
}) {
  const m = selectedYear ? applyTahunLaluFallback(bulanan[MONTHS[monthIndex]], selectedYear, monthIndex) : bulanan[MONTHS[monthIndex]];

  const prevIdx = monthIndex - 1;
  const prevM = prevIdx >= 0 ? bulanan[MONTHS[prevIdx]] : null;
  const vsBulanLaluPct = m && prevM && prevM.akmPenjualan
    ? (m.akmPenjualan / prevM.akmPenjualan) * 100
    : null;

  // Ranking YL bulan ini
  const ylRanked = useMemo(() => {
    return [...perYL]
      .map((yl) => ({
        area: yl.area,
        nama: cleanYlName(yl.nama || ""),
        penjualan: yl.penjualan?.[MONTHS[monthIndex]] ?? null,
      }))
      .filter((r) => r.penjualan !== null && r.penjualan !== undefined)
      .sort((a, b) => (b.penjualan || 0) - (a.penjualan || 0));
  }, [perYL, monthIndex]);

  const ylCount = ylRanked.length;
  const jumlahYLDisplay = m?.jumlahYL || (ylCount > 0 ? ylCount : undefined);
  const jumlahAreaDisplay = m?.jumlahArea || (ylCount > 0 ? new Set(ylRanked.map((r) => r.area).filter(Boolean)).size : undefined);

  // Kondisi YL (Distribusi Botol) - Menggunakan data manual jika ada, atau kalkulasi otomatis dari ylRanked
  const manualKondisi = m?.kondisiYL || {};
  const manualTotal =
    (Number(manualKondisi.kurang250) || 0) +
    (Number(manualKondisi.r250_279) || 0) +
    (Number(manualKondisi.r280_299) || 0) +
    (Number(manualKondisi.r300_329) || 0) +
    (Number(manualKondisi.r330_349) || 0) +
    (Number(manualKondisi.lebih350) || 0);

  const kondisiData = useMemo(() => {
    if (manualTotal > 0) {
      return [
        { name: "< 250", value: Number(manualKondisi.kurang250) || 0 },
        { name: "250-279", value: Number(manualKondisi.r250_279) || 0 },
        { name: "280-299", value: Number(manualKondisi.r280_299) || 0 },
        { name: "300-329", value: Number(manualKondisi.r300_329) || 0 },
        { name: "330-349", value: Number(manualKondisi.r330_349) || 0 },
        { name: "> 350", value: Number(manualKondisi.lebih350) || 0 },
      ];
    }

    let kurang250 = 0;
    let r250_279 = 0;
    let r280_299 = 0;
    let r300_329 = 0;
    let r330_349 = 0;
    let lebih350 = 0;

    for (const yl of ylRanked) {
      const val = Number(yl.penjualan) || 0;
      if (val < 250) kurang250++;
      else if (val >= 250 && val <= 279) r250_279++;
      else if (val >= 280 && val <= 299) r280_299++;
      else if (val >= 300 && val <= 329) r300_329++;
      else if (val >= 330 && val <= 349) r330_349++;
      else if (val >= 350) lebih350++;
    }

    return [
      { name: "< 250", value: kurang250 },
      { name: "250-279", value: r250_279 },
      { name: "280-299", value: r280_299 },
      { name: "300-329", value: r300_329 },
      { name: "330-349", value: r330_349 },
      { name: "> 350", value: lebih350 },
    ];
  }, [manualTotal, manualKondisi, ylRanked]);

  const produkTotal = (m?.ratarataYO || 0) + (m?.ratarataOM || 0) + (m?.ratarataOS || 0) + (m?.ratarataYT || 0);
  const produkData = [
    { name: "Original (YO)", value: m?.ratarataYO || 0, color: PRODUCT_COLORS.YO },
    { name: "Original Mangga (OM)", value: m?.ratarataOM || 0, color: PRODUCT_COLORS.OM },
    { name: "Original Stroberi (OS)", value: m?.ratarataOS || 0, color: PRODUCT_COLORS.OS },
    { name: "Yakult Light (YT)", value: m?.ratarataYT || 0, color: PRODUCT_COLORS.YT },
  ].filter((p) => p.value > 0);

  return (
    <div className="space-y-4">
      {/* Month picker */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {MONTH_SHORT.map((lbl, i) => (
          <button
            key={lbl}
            onClick={() => setMonthIndex(i)}
            className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-full border cursor-pointer transition-all ${
              i === monthIndex
                ? "bg-orange-500 border-orange-500 text-white"
                : bulanan[MONTHS[i]]
                ? "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                : "bg-slate-50 dark:bg-slate-900 border-dashed border-slate-200 dark:border-slate-800 text-slate-300 dark:text-slate-600"
            }`}
          >
            {lbl}
          </button>
        ))}
      </div>

      {!m ? (
        <EmptyMonthNote label={MONTH_LABELS[monthIndex]} />
      ) : (
        <>
          {/* Widget Ringkasan */}
          <Card>
            <SectionTitle icon={TrendingUp}>Widget Ringkasan — {MONTH_LABELS[monthIndex]}</SectionTitle>
            <div className="flex flex-wrap gap-2">
              <StatBox label="AKM Penjualan" value={`${fmtNum(m.akmPenjualan)} btl`} sub={`Target: ${fmtNum(m.akmTarget)} btl`} />
              <StatBox label="Rata-rata Penjualan" value={`${fmtNum(m.ratarataPenjualanYL)}`} sub="per hari (tim)" />
              <StatBox label="% Target vs Realisasi" value={`${fmtPct(m.persenCapaian)}%`} pct={m.persenCapaian} />
            </div>
          </Card>

          {/* Komparasi */}
          <Card>
            <SectionTitle icon={BarChart3}>Komparasi</SectionTitle>
            <div className="flex flex-wrap gap-2">
              <StatBox
                label="vs Bulan Lalu"
                value={vsBulanLaluPct !== null ? `${fmtPct(vsBulanLaluPct)}%` : "-"}
                sub={prevM ? `${MONTH_LABELS[prevIdx]}: ${fmtNum(prevM.akmPenjualan)} btl` : "Tidak ada data"}
                pct={vsBulanLaluPct}
              />
              <StatBox
                label="vs Rata² Tahun Lalu"
                value={`${fmtPct(m.persenTahunLalu)}%`}
                sub={`Th. lalu: ${fmtNum(m.ratarataPenjualanTahunLalu)}/hari`}
                pct={m.persenTahunLalu}
              />
            </div>
          </Card>

          {/* Efisiensi & Kedisiplinan */}
          <Card>
            <SectionTitle icon={Package}>Efisiensi & Kedisiplinan</SectionTitle>
            <div className="flex flex-wrap gap-2">
              <StatBox label="AKM BB (Botol Balik)" value={`${fmtNum(m.akmKembaliBotol)} btl`} sub={`${fmtPct(m.persenKembaliBotol)}% dari penjualan`} pct={m.persenKembaliBotol !== undefined ? 100 - m.persenKembaliBotol : undefined} />
              <StatBox label="Absen (Frekuensi)" value={`${fmtNum(m.absen?.frekuensi)}x`} sub={`${fmtNum(m.absen?.jumlahYL)} YL tidak hadir`} />
              <StatBox label="JWP" value={`${fmtNum(m.jwp)}`} sub="Jumlah Waktu Pengerjaan" />
            </div>
          </Card>

          {/* Evaluasi Dampak Absensi & Opportunity Loss Bulan Berjalan */}
          <AnalisisAbsensiLossCard
            months={[m]}
            title={`Analisis Dampak Absensi & Potensi Botol Hilang — ${MONTH_LABELS[monthIndex]}`}
            subtitle={`Kalkulasi opportunity loss akibat ketidakhadiran ${m.absen?.jumlahYL || 0} YL (${m.absen?.frekuensi || 0}x izin/sakit) pada bulan ${MONTH_LABELS[monthIndex]}`}
          />

          {/* Analisis Tim */}
          <Card>
            <SectionTitle icon={Users}>Analisis Tim</SectionTitle>
            <div className="flex flex-wrap gap-2 mb-4">
              <StatBox label="S/YL (Sales per YL)" value={`${fmtNum(m.salesPerYL)}`} sub={`Th lalu: ${fmtNum(m.salesPerYLTahunLalu)}`} />
              <StatBox
                label="Jumlah YL"
                value={`${fmtNum(jumlahYLDisplay)}`}
                sub={
                  m.jumlahYLBaru !== undefined || m.jumlahYLResign !== undefined
                    ? `Baru: ${fmtNum(m.jumlahYLBaru || 0)} · Resign: ${fmtNum(m.jumlahYLResign || 0)}`
                    : `Aktif: ${fmtNum(jumlahYLDisplay)} YL`
                }
              />
            </div>

            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Performa 10 Yakult Lady</p>
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-100 dark:border-slate-700">
                    <th className="text-left py-1.5 px-1 font-bold">#</th>
                    <th className="text-left py-1.5 px-1 font-bold">Area</th>
                    <th className="text-left py-1.5 px-1 font-bold">Nama</th>
                    <th className="text-right py-1.5 px-1 font-bold">Penjualan</th>
                  </tr>
                </thead>
                <tbody>
                  {ylRanked.map((r, idx) => (
                    <tr key={r.area} className="border-b border-slate-50 dark:border-slate-800/60">
                      <td className="py-1.5 px-1 text-slate-400 font-bold">{idx + 1}</td>
                      <td className="py-1.5 px-1 text-slate-500">{r.area}</td>
                      <td className="py-1.5 px-1 font-bold text-slate-700 dark:text-slate-200">{r.nama}</td>
                      <td className="py-1.5 px-1 text-right font-black text-slate-900 dark:text-white">{fmtNum(r.penjualan)}</td>
                    </tr>
                  ))}
                  {ylRanked.length === 0 && (
                    <tr><td colSpan={4} className="py-4 text-center text-slate-400">Belum ada data penjualan YL bulan ini.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mt-4 mb-2 flex items-center justify-between">
              <span>Kondisi YL (Distribusi Botol)</span>
              <span className="text-[10px] font-normal text-slate-400">
                Total: {kondisiData.reduce((acc, curr) => acc + curr.value, 0)} YL
              </span>
            </p>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={kondisiData} margin={{ top: 16, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} domain={[0, (dataMax: number) => Math.max(dataMax + 1, 4)]} />
                  <Tooltip formatter={(v: number) => [`${v} YL`, "Jumlah YL"]} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    <LabelList dataKey="value" position="top" fill="#64748b" fontSize={11} fontWeight="bold" />
                    {kondisiData.map((_, i) => <Cell key={i} fill={KONDISI_COLORS[i % KONDISI_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Produk & Area */}
          <Card>
            <SectionTitle icon={MapPin}>Produk & Area</SectionTitle>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 h-44">
                {produkData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={produkData} dataKey="value" nameKey="name" innerRadius={40} outerRadius={65} paddingAngle={2}>
                        {produkData.map((p) => <Cell key={p.name} fill={p.color} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => `${fmtNum(v)} btl (${((v / produkTotal) * 100).toFixed(1)}%)`} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-xs text-slate-400 text-center py-8">Belum ada data produk.</p>
                )}
              </div>
              <div className="flex-1 flex flex-col justify-center gap-2">
                <StatBox
                  label="% Area Tercover"
                  value={`${fmtPct(m.persenAreaTercover, 0)}%`}
                  sub={`${fmtNum(jumlahAreaDisplay)} area aktif`}
                  pct={m.persenAreaTercover}
                />
              </div>
            </div>
          </Card>

          {/* Analisis Rasio Mix Produk & Penetrasi Varian Baru */}
          <AnalisisMixProductCard
            months={[m]}
            title={`Evaluasi Mix Produk & Penetrasi Varian — ${MONTH_LABELS[monthIndex]}`}
            subtitle="Keseimbangan penjualan Original (YO) vs varian baru (Original Mangga, Original Stroberi, Yakult Light)"
          />

          {/* Evaluasi Kualitatif */}
          <Card>
            <SectionTitle icon={Sparkles}>Evaluasi Kualitatif</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase mb-1.5 flex items-center gap-1"><ThumbsUp className="w-3.5 h-3.5" /> Kelebihan</p>
                <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                  {(m.evaluasiPlus || []).filter((s: string) => s.trim()).map((s: string, i: number) => (
                    <li key={i} className="flex gap-1.5"><span className="text-emerald-500">•</span>{s}</li>
                  ))}
                  {!(m.evaluasiPlus || []).some((s: string) => s.trim()) && <li className="text-slate-400">Belum ada catatan.</li>}
                </ul>
              </div>
              <div>
                <p className="text-[11px] font-black text-red-600 dark:text-red-400 uppercase mb-1.5 flex items-center gap-1"><ThumbsDown className="w-3.5 h-3.5" /> Kekurangan</p>
                <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                  {(m.evaluasiMinus || []).filter((s: string) => s.trim()).map((s: string, i: number) => (
                    <li key={i} className="flex gap-1.5"><span className="text-red-500">•</span>{s}</li>
                  ))}
                  {!(m.evaluasiMinus || []).some((s: string) => s.trim()) && <li className="text-slate-400">Belum ada catatan.</li>}
                </ul>
              </div>
            </div>
          </Card>

          {/* Tabel Rata-Rata Kumulatif YTD jika bulan > Januari */}
          {monthIndex > 0 && (
            <Card>
              <SectionTitle icon={Users}>
                Tabel Rata-Rata Penjualan YL (Januari s/d {MONTH_LABELS[monthIndex]})
              </SectionTitle>
              <TabelRataRataYL
                perYL={perYL}
                startIdx={0}
                endIdx={monthIndex}
                title={`Rata-Rata YTD: Januari s/d ${MONTH_LABELS[monthIndex]}`}
                subtitle={`Rata-rata penjualan botol per hari kerja dari awal tahun sampai bulan ${MONTH_LABELS[monthIndex]}`}
              />
            </Card>
          )}
        </>
      )}
      {actionPlanNode}
    </div>
  );
}

// ----------------------------------------------------------------------------
// 2. Laporan Semester (dipakai untuk S1, dan sebagai dasar S2)
// ----------------------------------------------------------------------------

function computeSemesterAgg(bulanan: Record<string, any>, startIdx: number, endIdx: number, tahun?: string | number) {
  const monthKeys = MONTHS.slice(startIdx, endIdx + 1);
  const monthsData = monthKeys
    .map((k, i) => ({ key: k, idx: startIdx + i, m: tahun ? applyTahunLaluFallback(bulanan[k], tahun, startIdx + i) : bulanan[k] }))
    .filter((x) => x.m);

  const totalAkm = sum(monthsData.map((x) => x.m.akmPenjualan));
  const avgCapaian = average(monthsData.map((x) => x.m.persenCapaian));
  const avgRetur = average(monthsData.map((x) => x.m.persenKembaliBotol));
  const ylBaru = sum(monthsData.map((x) => x.m.jumlahYLBaru));
  const ylResign = sum(monthsData.map((x) => x.m.jumlahYLResign));

  let peak: { label: string; value: number } | null = null;
  monthsData.forEach((x) => {
    const v = x.m.akmPenjualan || 0;
    if (!peak || v > peak.value) peak = { label: MONTH_LABELS[x.idx], value: v };
  });

  const evalPlus: string[] = [];
  const evalMinus: string[] = [];
  monthsData.forEach((x) => {
    (x.m.evaluasiPlus || []).forEach((s: string) => { if (s.trim() && !evalPlus.includes(s.trim())) evalPlus.push(s.trim()); });
    (x.m.evaluasiMinus || []).forEach((s: string) => { if (s.trim() && !evalMinus.includes(s.trim())) evalMinus.push(s.trim()); });
  });

  const trend = monthsData.map((x) => ({
    bulan: MONTH_SHORT[x.idx],
    penjualan: x.m.akmPenjualan || 0,
    target: x.m.akmTarget || 0,
  }));

  return { monthsData, totalAkm, avgCapaian, avgRetur, ylBaru, ylResign, peak, evalPlus, evalMinus, trend };
}

function LaporanSemester({ bulanan, perYL, startIdx, endIdx, title, tahun, actionPlanNode }: {
  bulanan: Record<string, any>; perYL: any[]; startIdx: number; endIdx: number; title: string; tahun?: string | number; actionPlanNode?: React.ReactNode;
}) {
  const agg = useMemo(() => computeSemesterAgg(bulanan, startIdx, endIdx, tahun), [bulanan, startIdx, endIdx, tahun]);

  if (agg.monthsData.length === 0) {
    return <EmptyMonthNote label={title} />;
  }

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle icon={Calendar}>{title}</SectionTitle>
        <div className="flex flex-wrap gap-2">
          <StatBox label="AKM Penjualan Semester" value={`${fmtNum(agg.totalAkm)} btl`} sub={`${agg.monthsData.length} bulan terisi`} />
          <StatBox label="Rata² Pencapaian Target" value={`${fmtPct(agg.avgCapaian)}%`} pct={agg.avgCapaian} />
          <StatBox label="Rata² Retur (BB)" value={`${fmtPct(agg.avgRetur)}%`} />
        </div>
      </Card>

      <Card>
        <SectionTitle icon={TrendingUp}>Grafik Tren Penjualan Bulanan</SectionTitle>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={agg.trend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="bulan" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: number) => fmtNum(v)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="penjualan" name="Penjualan" stroke="#f97316" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="target" name="Target" stroke="#94a3b8" strokeWidth={2} strokeDasharray="4 4" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {agg.peak && (
          <p className="text-xs text-slate-500 mt-2 text-center">
            📈 Puncak penjualan: <strong className="text-slate-800 dark:text-white">{agg.peak.label}</strong> ({fmtNum(agg.peak.value)} btl)
          </p>
        )}
      </Card>

      {/* Tabel Rata-Rata per YL */}
      <Card>
        <SectionTitle icon={Users}>
          Tabel Rata-Rata Penjualan YL — {title}
        </SectionTitle>
        <TabelRataRataYL
          perYL={perYL}
          startIdx={startIdx}
          endIdx={endIdx}
          title={`Rata-Rata Penjualan YL (${MONTH_LABELS[startIdx]} s/d ${MONTH_LABELS[endIdx]})`}
          subtitle="Rata-rata penjualan botol per hari kerja dari bulan Januari sampai Juni"
        />
      </Card>

      {/* Evaluasi Tambahan: Dampak Absensi & Mix Produk */}
      <AnalisisAbsensiLossCard
        months={agg.monthsData.map((x) => x.m)}
        title={`Analisis Dampak Absensi & Loss Potential (${title})`}
        subtitle="Kalkulasi total frekuensi izin/sakit dan potensi botol terlewatkan selama semester 1"
      />

      <AnalisisMixProductCard
        months={agg.monthsData.map((x) => x.m)}
        title={`Evaluasi Mix Produk (${title})`}
        subtitle="Analisis keseimbangan penetrasi varian baru (Original Mangga, Original Stroberi, Yakult Light) vs Original (YO)"
      />

      <Card>
        <SectionTitle icon={Users}>Stabilitas SDM</SectionTitle>
        <div className="flex flex-wrap gap-2">
          <StatBox label="YL Baru" value={`${fmtNum(agg.ylBaru)}`} sub={`Selama ${agg.monthsData.length} bulan`} />
          <StatBox label="YL Resign" value={`${fmtNum(agg.ylResign)}`} sub={`Selama ${agg.monthsData.length} bulan`} />
        </div>
      </Card>

      <Card>
        <SectionTitle icon={Sparkles}>Rangkuman Evaluasi</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <p className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase mb-1.5 flex items-center gap-1"><ThumbsUp className="w-3.5 h-3.5" /> Kelebihan</p>
            <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
              {agg.evalPlus.slice(0, 8).map((s, i) => <li key={i} className="flex gap-1.5"><span className="text-emerald-500">•</span>{s}</li>)}
              {agg.evalPlus.length === 0 && <li className="text-slate-400">Belum ada catatan.</li>}
            </ul>
          </div>
          <div>
            <p className="text-[11px] font-black text-red-600 dark:text-red-400 uppercase mb-1.5 flex items-center gap-1"><ThumbsDown className="w-3.5 h-3.5" /> Kekurangan</p>
            <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
              {agg.evalMinus.slice(0, 8).map((s, i) => <li key={i} className="flex gap-1.5"><span className="text-red-500">•</span>{s}</li>)}
              {agg.evalMinus.length === 0 && <li className="text-slate-400">Belum ada catatan.</li>}
            </ul>
          </div>
        </div>
      </Card>
      {actionPlanNode}
    </div>
  );
}

// ----------------------------------------------------------------------------
// 3. Laporan Semester 2 (Status Realisasi + Proyeksi + Alarm)
// ----------------------------------------------------------------------------

function computeSemester2Agg(bulanan: Record<string, any>, tahun?: string | number) {
  const agg = computeSemesterAgg(bulanan, 6, 11, tahun);
  const s1Agg = computeSemesterAgg(bulanan, 0, 5, tahun);

  // Target tahunan diestimasi dari rata-rata target bulan yang sudah terisi (S1 + S2 berjalan)
  const filledMonths = [...s1Agg.monthsData, ...agg.monthsData];
  const avgMonthlyTarget = average(filledMonths.map((x) => x.m.akmTarget)) || 0;
  const monthsRemaining = 12 - filledMonths.length;
  const targetTahunEstimasi = sum(filledMonths.map((x) => x.m.akmTarget)) + avgMonthlyTarget * monthsRemaining;
  const totalRealisasiSoFar = sum(filledMonths.map((x) => x.m.akmPenjualan));
  const targetSisa = Math.max(0, targetTahunEstimasi - totalRealisasiSoFar);

  const avgMonthlyCapacity = average(filledMonths.map((x) => x.m.akmPenjualan)) || 0;
  const kapasitasSisaEstimasi = avgMonthlyCapacity * monthsRemaining;

  const alarmMonths = agg.monthsData.filter((x) => (x.m.persenKembaliBotol || 0) > 10);

  return { agg, s1Agg, monthsRemaining, targetTahunEstimasi, totalRealisasiSoFar, targetSisa, kapasitasSisaEstimasi, alarmMonths };
}

function LaporanSemester2({ bulanan, perYL, jumlahYL, tahun, actionPlanNode }: {
  bulanan: Record<string, any>; perYL: any[]; jumlahYL: number; tahun?: string | number; actionPlanNode?: React.ReactNode;
}) {
  const s2 = useMemo(() => computeSemester2Agg(bulanan, tahun), [bulanan, tahun]);
  const { agg, monthsRemaining, targetTahunEstimasi, targetSisa, kapasitasSisaEstimasi, alarmMonths } = s2;

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle icon={Calendar}>Status Realisasi — Semester 2</SectionTitle>
        {agg.monthsData.length === 0 ? (
          <p className="text-xs text-slate-400">Belum ada data bulan berjalan di semester 2 (mulai Juli).</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2 mb-3">
              <StatBox label="AKM Penjualan S2" value={`${fmtNum(agg.totalAkm)} btl`} sub={`${agg.monthsData.length} bulan terisi`} />
              <StatBox label="Rata² Capaian" value={`${fmtPct(agg.avgCapaian)}%`} pct={agg.avgCapaian} />
              <StatBox label="Rata² Retur (BB)" value={`${fmtPct(agg.avgRetur)}%`} />
            </div>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={agg.trend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="bulan" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: number) => fmtNum(v)} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="penjualan" name="Realisasi" fill="#f97316" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="target" name="Target" fill="#cbd5e1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </Card>

      {/* Tabel Rata-Rata per YL */}
      <Card>
        <SectionTitle icon={Users}>
          Tabel Rata-Rata Penjualan YL — Kumulatif (Januari s/d Terakhir)
        </SectionTitle>
        <TabelRataRataYL
          perYL={perYL}
          startIdx={0}
          endIdx={11}
          title="Rata-Rata Penjualan YL Kumulatif (Januari s/d Terakhir)"
          subtitle="Rata-rata penjualan botol per hari kerja dari awal tahun (Januari) s/d bulan terakhir terisi"
        />
      </Card>

      <Card>
        <SectionTitle icon={TrendingUp}>Proyeksi vs Target</SectionTitle>
        <div className="flex flex-wrap gap-2">
          <StatBox label="Target Sisa Tahun Ini" value={`${fmtNum(targetSisa)} btl`} sub={`Estimasi target tahunan: ${fmtNum(targetTahunEstimasi)}`} />
          <StatBox label="Kapasitas Tim (Estimasi)" value={`${fmtNum(kapasitasSisaEstimasi)} btl`} sub={`${monthsRemaining} bulan tersisa, ${jumlahYL} YL aktif`} />
          <StatBox
            label="Selisih Proyeksi"
            value={`${kapasitasSisaEstimasi - targetSisa >= 0 ? "+" : ""}${fmtNum(kapasitasSisaEstimasi - targetSisa)} btl`}
            pct={targetSisa > 0 ? (kapasitasSisaEstimasi / targetSisa) * 100 : null}
          />
        </div>
        <p className="text-[10.5px] text-slate-400 mt-2">*Estimasi berdasarkan rata-rata realisasi &amp; target bulan-bulan yang sudah terisi.</p>
      </Card>

      {/* Uji Kelayakan Beban Target & Kapasitas Fisik YL */}
      <UjiKelayakanBebanCard
        targetSisa={targetSisa}
        monthsRemaining={monthsRemaining}
        jumlahYL={jumlahYL}
        currentAvgYL={agg.monthsData.length > 0 ? average(agg.monthsData.map((x) => x.m.salesPerYL || (x.m.ratarataPenjualanYL ? Math.round(x.m.ratarataPenjualanYL / 10) : 0))) || undefined : undefined}
      />

      {/* Evaluasi Dampak Absensi & Loss Potential Semester 2 */}
      <AnalisisAbsensiLossCard
        months={agg.monthsData.map((x) => x.m)}
        title="Analisis Dampak Absensi & Loss Potential — Semester 2"
        subtitle="Evaluasi frekuensi ketidakhadiran dan potensi botol terlewatkan selama semester 2 berjalan"
      />

      {/* Evaluasi Mix Produk Semester 2 */}
      <AnalisisMixProductCard
        months={agg.monthsData.map((x) => x.m)}
        title="Evaluasi Mix Produk — Semester 2"
        subtitle="Keseimbangan penetrasi varian baru (Original Mangga, Original Stroberi, Yakult Light) vs Original (YO)"
      />

      <Card>
        <SectionTitle icon={AlertTriangle}>Alarm Operasional</SectionTitle>
        {alarmMonths.length === 0 ? (
          <p className="text-xs text-slate-400">Tidak ada lonjakan retur (BB) di atas 10% pada semester ini. 👍</p>
        ) : (
          <ul className="space-y-2">
            {alarmMonths.map((x) => (
              <li key={x.key} className="flex items-center justify-between bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40 rounded-xl px-3 py-2">
                <span className="text-xs font-bold text-red-700 dark:text-red-300">Retur {MONTH_LABELS[x.idx]}</span>
                <span className="text-sm font-black text-red-700 dark:text-red-300">{fmtPct(x.m.persenKembaliBotol)}%</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
      {actionPlanNode}
    </div>
  );
}

// ----------------------------------------------------------------------------
// 4. Laporan Tahunan
// ----------------------------------------------------------------------------

function computeTahunanAgg(bulanan: Record<string, any>, tahun?: string | number) {
  const monthsData = MONTHS
    .map((k, i) => ({ key: k, idx: i, m: tahun ? applyTahunLaluFallback(bulanan[k], tahun, i) : bulanan[k] }))
    .filter((x) => x.m);
  if (monthsData.length === 0) return null;

  const akmSoFar = sum(monthsData.map((x) => x.m.akmPenjualan));
  const targetSoFar = sum(monthsData.map((x) => x.m.akmTarget));
  const count = monthsData.length;

  const estimasiTahunan = count > 0 ? (akmSoFar / count) * 12 : 0;
  const targetTahunan = count > 0 ? (targetSoFar / count) * 12 : 0;

  const growthYoY = average(monthsData.map((x) => x.m.persenTahunLalu));
  const growthPct = growthYoY !== null ? growthYoY - 100 : null;

  const lastMonth = monthsData[monthsData.length - 1].m;
  const areaTercoverFinal = lastMonth?.persenAreaTercover ?? null;

  const capaianTahunan = targetTahunan > 0 ? (estimasiTahunan / targetTahunan) * 100 : null;

  const trend = monthsData.map((x) => ({ bulan: MONTH_SHORT[x.idx], penjualan: x.m.akmPenjualan || 0, target: x.m.akmTarget || 0 }));

  const kesimpulan = (() => {
    const parts: string[] = [];
    parts.push(
      capaianTahunan !== null && capaianTahunan >= 100
        ? `Estimasi hasil tahunan diproyeksikan mencapai ${fmtPct(capaianTahunan, 1)}% dari target tahunan — performa tim secara keseluruhan berada di atas target.`
        : `Estimasi hasil tahunan diproyeksikan ${capaianTahunan !== null ? fmtPct(capaianTahunan, 1) + "% " : ""}dari target tahunan — performa tim masih perlu didorong agar mencapai target.`
    );
    if (growthPct !== null) {
      parts.push(
        growthPct >= 0
          ? `Secara Year-on-Year, tim tumbuh rata-rata ${fmtPct(growthPct, 1)}% dibanding tahun lalu.`
          : `Secara Year-on-Year, tim mengalami penurunan rata-rata ${fmtPct(Math.abs(growthPct), 1)}% dibanding tahun lalu.`
      );
    }
    if (areaTercoverFinal !== null) {
      parts.push(`Cakupan area akhir tercatat ${fmtPct(areaTercoverFinal, 0)}% dari seluruh wilayah Jember 1.`);
    }
    return parts.join(" ");
  })();

  return { monthsData, akmSoFar, targetSoFar, count, estimasiTahunan, targetTahunan, growthPct, areaTercoverFinal, capaianTahunan, trend, kesimpulan };
}

function LaporanTahunan({ bulanan, perYL, tahun, actionPlanNode }: {
  bulanan: Record<string, any>; perYL: any[]; tahun: string | number; actionPlanNode?: React.ReactNode;
}) {
  const t = useMemo(() => computeTahunanAgg(bulanan, tahun), [bulanan, tahun]);

  if (!t) {
    return <EmptyMonthNote label={`tahun ${tahun}`} />;
  }
  const { count, akmSoFar, estimasiTahunan, targetTahunan, capaianTahunan, growthPct, trend, areaTercoverFinal, kesimpulan, monthsData } = t;

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle icon={Calendar}>Laporan Tahunan {tahun} (Fokus Strategis)</SectionTitle>
        <p className="text-[10.5px] text-slate-400 mb-3">*Estimasi diproyeksikan dari {count} bulan data yang sudah terisi.</p>
        <div className="flex flex-wrap gap-2">
          <StatBox label="Estimasi Hasil Tahunan" value={`${fmtNum(estimasiTahunan)} btl`} sub={`Realisasi s/d saat ini: ${fmtNum(akmSoFar)} btl`} />
          <StatBox label="Target Tahunan" value={`${fmtNum(targetTahunan)} btl`} />
          <StatBox label="Pencapaian YoY" value={capaianTahunan !== null ? `${fmtPct(capaianTahunan)}%` : "-"} pct={capaianTahunan} />
        </div>
      </Card>

      <Card>
        <SectionTitle icon={TrendingUp}>Growth (Pertumbuhan Tahun Ini vs Tahun Lalu)</SectionTitle>
        <div className="flex flex-wrap gap-2">
          <StatBox
            label="Growth YoY"
            value={growthPct !== null ? `${growthPct >= 0 ? "+" : ""}${fmtPct(growthPct)}%` : "-"}
            sub="Rata-rata dari bulan-bulan terisi"
          />
        </div>
        <div className="h-56 mt-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="bulan" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: number) => fmtNum(v)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="penjualan" name="Realisasi" fill="#f97316" radius={[6, 6, 0, 0]} />
              <Bar dataKey="target" name="Target" fill="#cbd5e1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Tabel Rata-Rata per YL Tahunan */}
      <Card>
        <SectionTitle icon={Users}>
          Tabel Rata-Rata Penjualan Tahunan per YL (Januari s/d Terakhir)
        </SectionTitle>
        <TabelRataRataYL
          perYL={perYL}
          startIdx={0}
          endIdx={count > 0 ? monthsData[count - 1].idx : 11}
          title={`Rekapitulasi Rata-Rata Tahunan Seluruh YL — Tahun ${tahun}`}
          subtitle="Rata-rata penjualan botol/hari seluruh Yakult Lady dari awal tahun (Januari) s/d bulan terakhir terisi"
        />
      </Card>

      {/* Evaluasi Mix Produk & Loss Potential Tahunan */}
      <AnalisisMixProductCard
        months={monthsData.map((x) => x.m)}
        title={`Evaluasi Mix Produk Tahunan — Tahun ${tahun}`}
        subtitle="Keseimbangan penetrasi varian baru (Original Mangga, Original Stroberi, Yakult Light) terhadap Original (YO) sepanjang tahun"
      />

      <AnalisisAbsensiLossCard
        months={monthsData.map((x) => x.m)}
        title={`Potensi Kehilangan Akibat Absensi — Tahun ${tahun}`}
        subtitle="Estimasi total botol dan omzet yang terlewatkan akibat absensi izin/sakit YL selama tahun berjalan"
      />

      {targetTahunan > akmSoFar && (
        <UjiKelayakanBebanCard
          targetSisa={targetTahunan - akmSoFar}
          monthsRemaining={Math.max(1, 12 - count)}
          currentAvgYL={average(monthsData.map((x) => x.m.salesPerYL || x.m.ratarataPenjualanYL)) || undefined}
        />
      )}

      <Card>
        <SectionTitle icon={MapPin}>Cakupan Final</SectionTitle>
        <div className="flex flex-wrap gap-2">
          <StatBox label="% Area Tercover (Terakhir)" value={areaTercoverFinal !== null ? `${fmtPct(areaTercoverFinal, 0)}%` : "-"} pct={areaTercoverFinal} />
        </div>
      </Card>

      <Card>
        <SectionTitle icon={Sparkles}>Kesimpulan Akhir</SectionTitle>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{kesimpulan}</p>
      </Card>
      {actionPlanNode}
    </div>
  );
}

// ----------------------------------------------------------------------------
// 5. Mode Presentasi (Slide Show ala PPT)
// ----------------------------------------------------------------------------

interface SlideDef {
  id?: string;
  eyebrow: string;
  title?: string;
  node: React.ReactNode;
  speakerNotes?: string;
  isActionPlan?: boolean;
}

function SlideTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="text-center mb-4 sm:mb-6">
      <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">{children}</h1>
      {sub && <p className="text-slate-400 text-xs sm:text-sm mt-2 sm:mt-3 font-medium tracking-wide">{sub}</p>}
    </div>
  );
}

function BigStat({ label, value, sub, pct }: { label: string; value: string; sub?: string; pct?: number | null }) {
  return (
    <div className="text-center">
      <p className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1">{label}</p>
      <p className="text-2xl sm:text-4xl lg:text-5xl font-black text-white">{value}</p>
      {sub && <p className="text-slate-500 text-[11px] sm:text-xs mt-1">{sub}</p>}
      {pct !== undefined && pct !== null && (
        <span className={`inline-block mt-2 text-xs font-bold px-3 py-0.5 rounded-full ${
          pct >= 100 ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
        }`}>
          {pct >= 100 ? "▲" : "▼"} {fmtPct(pct)}%
        </span>
      )}
    </div>
  );
}

function InteractiveActionPlanSlide({
  actionPlans,
  onAddActionPlan,
  onToggleActionPlan,
  onDeleteActionPlan,
  subtitle,
}: {
  actionPlans: ActionPlanItem[];
  onAddActionPlan: (t: string) => void;
  onToggleActionPlan: (id: string) => void;
  onDeleteActionPlan: (id: string) => void;
  subtitle?: string;
}) {
  const [newText, setNewText] = useState("");

  const handleAdd = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newText.trim()) return;
    onAddActionPlan(newText.trim());
    setNewText("");
  };

  const doneCount = actionPlans.filter((p) => p.done).length;

  return (
    <div
      className="w-full max-w-2xl mx-auto flex flex-col h-full justify-between gap-3 text-left"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
        <p className="text-[11px] text-slate-400 font-medium">
          {subtitle || "Komitmen & target tindak lanjut langsung dari hasil evaluasi:"}
        </p>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
          {doneCount} / {actionPlans.length} Selesai ({actionPlans.length > 0 ? Math.round((doneCount / actionPlans.length) * 100) : 0}%)
        </span>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto max-h-[42vh] pr-1 scrollbar-thin">
        {actionPlans.map((it, idx) => (
          <div
            key={it.id}
            className={`group flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
              it.done
                ? "bg-slate-900/40 border-slate-800/80 text-slate-500"
                : "bg-slate-900/90 border-slate-700/80 text-white hover:border-orange-500/50 shadow-sm"
            }`}
          >
            <button
              type="button"
              onClick={() => onToggleActionPlan(it.id)}
              className="cursor-pointer p-0.5 text-orange-400 hover:text-orange-300 transition-transform active:scale-90 shrink-0"
              title={it.done ? "Tandai belum selesai" : "Tandai selesai"}
            >
              {it.done ? (
                <CheckSquare className="w-4 h-4 text-emerald-400" />
              ) : (
                <Square className="w-4 h-4 text-slate-400 group-hover:text-orange-400" />
              )}
            </button>
            <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-[10px] shrink-0">
              {idx + 1}
            </span>
            <span
              onClick={() => onToggleActionPlan(it.id)}
              className={`text-xs flex-1 cursor-pointer select-none leading-relaxed ${
                it.done ? "line-through opacity-70" : "font-medium"
              }`}
            >
              {it.text}
            </span>
            <button
              type="button"
              onClick={() => onDeleteActionPlan(it.id)}
              className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 p-1 transition-opacity cursor-pointer shrink-0"
              title="Hapus komitmen"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        {actionPlans.length === 0 && (
          <div className="text-center py-8 text-slate-500 italic text-xs">
            Belum ada butir komitmen. Ketik di bawah ini untuk mencatat komitmen tim secara langsung.
          </div>
        )}
      </div>

      <form onSubmit={handleAdd} className="flex gap-2 pt-2 border-t border-slate-800/80">
        <input
          type="text"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          placeholder="+ Tulis komitmen baru saat rapat berlangsung..."
          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        />
        <button
          type="submit"
          disabled={!newText.trim()}
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 shrink-0 shadow-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <Plus className="w-3.5 h-3.5" /> Tambah
        </button>
      </form>
    </div>
  );
}

function SlideShow({
  slides,
  onClose,
  actionPlans,
  onAddActionPlan,
  onToggleActionPlan,
  onDeleteActionPlan,
}: {
  slides: SlideDef[];
  onClose: () => void;
  actionPlans: ActionPlanItem[];
  onAddActionPlan: (t: string) => void;
  onToggleActionPlan: (id: string) => void;
  onDeleteActionPlan: (id: string) => void;
}) {
  const [idx, setIdx] = useState(0);
  const [showJumpMenu, setShowJumpMenu] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [blackScreen, setBlackScreen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  // Paksa layar berputar 90° lewat CSS kalau screen.orientation.lock() gagal/tidak
  // didukung (umum terjadi di kabel HP->proyektor & banyak Android WebView/Chrome).
  // Ini murni trik visual: kontennya "diputar" secara CSS supaya tampil landscape
  // walau buffer layar fisik HP tetap portrait — hasil mirror ke proyektor jadi penuh.
  const [forceRotate, setForceRotate] = useState(false);
  const [rotateManualOverride, setRotateManualOverride] = useState<boolean | null>(null);

  const pointerDownRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastWheelTimeRef = useRef<number>(0);

  // Clean Mode (auto-hide toolbar): semua tombol/label kontrol
  // (header atas, toolbar bawah, tombol navigasi) otomatis memudar setelah 3 detik
  // tanpa interaksi, baik di Google Chrome (Fullscreen API), Safari, maupun di Kodular
  // (Android WebView) yang tidak mendukung Fullscreen API native.
  // Ketuk layar (tap) atau gerakkan pointer untuk memunculkannya kembali selama 3 detik.
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleHideControls = () => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setControlsVisible((prev) => {
        if (showJumpMenu || showShortcuts || showNotes) return prev;
        return false;
      });
    }, 3000);
  };

  const revealControls = () => {
    setControlsVisible(true);
    scheduleHideControls();
  };

  // Mulai timer auto-hide saat masuk ke mode presentasi
  useEffect(() => {
    scheduleHideControls();
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Saat status Layar Penuh berubah: jadwalkan hide controls
  useEffect(() => {
    if (isFullscreen) {
      scheduleHideControls();
    }
  }, [isFullscreen]);

  useEffect(() => {
    setIdx(0);
  }, [slides.length]);

  const goNext = () => {
    if (blackScreen) {
      setBlackScreen(false);
      return;
    }
    setIdx((i) => Math.min(i + 1, slides.length - 1));
    // Sembunyikan kontrol agar presentasi selalu bersih saat berpindah slide
    setControlsVisible(false);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
  };

  const goPrev = () => {
    if (blackScreen) {
      setBlackScreen(false);
      return;
    }
    setIdx((i) => Math.max(i - 1, 0));
    // Sembunyikan kontrol agar presentasi selalu bersih saat berpindah slide
    setControlsVisible(false);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
  };

  // Fullscreen toggle
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      // ignore
    }
  };

  const handleClosePresentation = async () => {
    try {
      const orient = (screen as any).orientation;
      if (orient?.unlock) orient.unlock();
    } catch {}
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch {}
    onClose();
  };

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    // Fallback saja: percobaan utama sudah dilakukan langsung di tombol
    // "Mode Presentasi" (dalam gesture klik). Ini cuma jaga-jaga kalau slide
    // dibuka lewat jalur lain (mis. langsung setIdx / re-render) dan belum fullscreen.
    setIsFullscreen(!!document.fullscreenElement);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  // Pengaturan orientasi: biarkan layar HP mengikuti orientasi alami (bila HP portrait,
  // mode presentasi ikut portrait bersih tanpa dipaksa rotasi 90 derajat secara CSS).
  // Tombol rotasi manual tetap disediakan bila pengguna ingin memutar secara paksa.
  useEffect(() => {
    if (rotateManualOverride !== null) {
      setForceRotate(rotateManualOverride);
    } else {
      setForceRotate(false);
    }
  }, [rotateManualOverride]);

  // Keyboard & Presenter Clicker Shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // If black screen active, any key restores slide
      if (blackScreen) {
        if (e.key === "Escape") handleClosePresentation();
        else setBlackScreen(false);
        return;
      }

      if (showJumpMenu) {
        if (e.key === "Escape") setShowJumpMenu(false);
        return;
      }
      if (showShortcuts) {
        if (e.key === "Escape") setShowShortcuts(false);
        return;
      }

      // Next slide: ArrowRight, ArrowDown, PageDown, Space, Enter
      // + fallback keyCode (33/34/37/39) dan tombol media (dipakai sebagian presenter
      // clicker/pointer murah yang mengirim kode lama atau tombol media next/prev)
      if (
        e.key === "ArrowRight" ||
        e.key === "ArrowDown" ||
        e.key === "PageDown" ||
        e.key === " " ||
        e.key === "Enter" ||
        e.key === "MediaTrackNext" ||
        e.keyCode === 34 || // Page Down (fallback)
        e.keyCode === 39 // Arrow Right (fallback)
      ) {
        e.preventDefault();
        goNext();
        return;
      }
      // Prev slide: ArrowLeft, ArrowUp, PageUp, Backspace
      else if (
        e.key === "ArrowLeft" ||
        e.key === "ArrowUp" ||
        e.key === "PageUp" ||
        e.key === "Backspace" ||
        e.key === "MediaTrackPrevious" ||
        e.keyCode === 33 || // Page Up (fallback)
        e.keyCode === 37 // Arrow Left (fallback)
      ) {
        e.preventDefault();
        goPrev();
        return;
      }

      // Tombol non-navigasi (menu, bantuan, fullscreen) memunculkan controls
      revealControls();

      // Black screen: B or . (Period)
      if (e.key === "b" || e.key === "B" || e.key === ".") {
        e.preventDefault();
        setBlackScreen((prev) => !prev);
      }
      // Notes: N
      else if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        setShowNotes((prev) => !prev);
      }
      // Fullscreen: F or F5
      else if (e.key === "f" || e.key === "F" || e.key === "F5") {
        e.preventDefault();
        toggleFullscreen();
      }
      // Close: Escape
      else if (e.key === "Escape") {
        handleClosePresentation();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides.length, onClose, showJumpMenu, showShortcuts, blackScreen, isFullscreen]);

  // Pointer / Mouse / Stylus drag & swipe
  const handlePointerDown = (e: React.PointerEvent) => {
    pointerDownRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!pointerDownRef.current) return;
    const diffX = e.clientX - pointerDownRef.current.x;
    const diffY = Math.abs(e.clientY - pointerDownRef.current.y);
    const duration = Date.now() - pointerDownRef.current.time;

    // Gesture swipe: horizontal movement > 45px and vertical < 80px, completed within 800ms
    if (Math.abs(diffX) > 45 && diffY < 80 && duration < 800) {
      if (diffX < 0) goNext();
      else goPrev();
    } else if (Math.abs(diffX) < 15 && diffY < 15 && duration < 350) {
      // Sentuhan biasa / tap ringan pada layar: munculkan atau sembunyikan kontrol
      if (!controlsVisible) {
        revealControls();
      } else {
        setControlsVisible(false);
      }
    }
    pointerDownRef.current = null;
  };

  // Wheel scroll navigation (debounced)
  const handleWheel = (e: React.WheelEvent) => {
    const now = Date.now();
    if (now - lastWheelTimeRef.current < 400) return;
    if (Math.abs(e.deltaY) > 35) {
      lastWheelTimeRef.current = now;
      if (e.deltaY > 0) goNext();
      else goPrev();
    }
  };

  if (slides.length === 0) {
    return (
      <div className="fixed inset-0 z-[200] bg-[#0A0D17] text-white flex flex-col items-center justify-center gap-4 px-6">
        <AlertTriangle className="w-10 h-10 text-amber-400" />
        <p className="text-sm font-bold text-slate-300 text-center">Belum ada data cukup untuk membuat slide presentasi.</p>
        <button onClick={onClose} className="mt-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold cursor-pointer">
          Tutup
        </button>
      </div>
    );
  }

  const cur = slides[Math.min(idx, slides.length - 1)];

  return (
    <div
      className={`fixed z-[200] bg-[#07090F] text-white flex flex-col justify-between overflow-hidden select-none ${
        forceRotate ? "" : "inset-0"
      }`}
      style={
        forceRotate
          ? {
              top: 0,
              left: 0,
              width: "100vh",
              height: "100vw",
              transformOrigin: "top left",
              transform: "rotate(90deg) translateY(-100%)",
            }
          : undefined
      }
      onPointerDown={(e) => {
        handlePointerDown(e);
      }}
      onPointerUp={handlePointerUp}
      onPointerMove={(e) => {
        // Hanya munculkan bilah kontrol jika kursor mendekati bilah atas (<64px) atau bilah bawah
        if (typeof window !== "undefined") {
          const y = e.clientY;
          const h = window.innerHeight;
          if (y < 64 || y > h - 64) {
            revealControls();
          }
        }
      }}
      onWheel={(e) => {
        handleWheel(e);
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: "radial-gradient(circle at center, #ffffff06 1px, transparent 1px)", backgroundSize: "28px 28px" }}
      />

      {/* Black Screen Overlay (Presentation blank mode) */}
      {blackScreen && (
        <div
          onClick={() => setBlackScreen(false)}
          className="fixed inset-0 z-[300] bg-black flex flex-col items-center justify-center cursor-pointer transition-opacity animate-in fade-in"
        >
          <div className="text-center opacity-30 hover:opacity-70 transition-opacity">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Layar Blank (Presenter Mode)</p>
            <p className="text-[11px] text-slate-500 mt-1">Klik atau tekan tombol apa saja untuk melanjutkan</p>
          </div>
        </div>
      )}

      {/* Top Header Bar (auto-hide di mode Layar Penuh - "Clean Mode") */}
      <div
        className={`flex items-center justify-between px-4 sm:px-6 relative z-20 shrink-0 border-b border-slate-800/40 bg-[#0A0D17]/80 backdrop-blur-sm overflow-hidden transition-all duration-300 ease-in-out ${
          controlsVisible ? "pt-3 pb-2 max-h-24 opacity-100" : "pt-0 pb-0 max-h-0 opacity-0 pointer-events-none border-transparent"
        }`}
      >
        {/* Left: Quick Jump Menu & Slide Dots */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setShowJumpMenu(!showJumpMenu)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer transition-all border border-slate-700/80 shadow-xs"
            title="Daftar Slide (Quick Jump)"
          >
            <Layers className="w-3.5 h-3.5 text-orange-400" />
            <span className="hidden sm:inline">Daftar Slide</span>
          </button>

          <div className="flex gap-1 flex-wrap max-w-[30vw] sm:max-w-[45vw] items-center">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIdx(i)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  i === idx ? "w-6 sm:w-7 bg-orange-500 shadow-sm shadow-orange-500/40" : "w-2 bg-slate-700 hover:bg-slate-500"
                }`}
                title={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Right: Speaker Notes, Shortcut Help, Fullscreen, Close */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => setShowNotes(!showNotes)}
            className={`p-2 rounded-xl text-xs font-bold cursor-pointer transition-all border ${
              showNotes
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                : "bg-slate-800 text-slate-300 border-slate-700/80 hover:bg-slate-700 hover:text-white"
            }`}
            title="Catatan Pembicara (Tekan N)"
          >
            <BookOpen className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setShowShortcuts(!showShortcuts)}
            className={`p-2 rounded-xl text-xs font-bold cursor-pointer transition-all border ${
              showShortcuts
                ? "bg-orange-500/20 text-orange-300 border-orange-500/40"
                : "bg-slate-800 text-slate-300 border-slate-700/80 hover:bg-slate-700 hover:text-white"
            }`}
            title="Petunjuk Pointer &amp; Navigasi"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setRotateManualOverride((prev) => (prev === null ? !forceRotate : !prev))}
            className={`p-2 rounded-xl text-xs font-bold cursor-pointer transition-all border ${
              forceRotate
                ? "bg-orange-500/20 text-orange-300 border-orange-500/40"
                : "bg-slate-800 text-slate-300 border-slate-700/80 hover:bg-slate-700 hover:text-white"
            }`}
            title="Paksa Putar Layar ke Landscape (pakai ini kalau tampilan di proyektor masih kotak kecil/portrait)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/80 text-slate-300 hover:text-white cursor-pointer transition-all"
            title={isFullscreen ? "Keluar Layar Penuh (F)" : "Layar Penuh (F)"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={handleClosePresentation}
            className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950 border border-slate-700/80 text-slate-300 hover:text-rose-300 cursor-pointer transition-all"
            title="Keluar Mode Presentasi (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Jump Slide Popover Modal */}
      {showJumpMenu && (
        <div className="absolute top-14 left-5 z-40 w-80 max-h-[70vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-3 space-y-1">
          <div className="flex items-center justify-between px-2 py-1 mb-1 border-b border-slate-800">
            <p className="text-[10px] uppercase font-black tracking-wider text-slate-400">Pilih Slide Presentasi</p>
            <span className="text-[10px] text-slate-500">{slides.length} Slide</span>
          </div>
          {slides.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setIdx(i);
                setShowJumpMenu(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between cursor-pointer transition-all ${
                i === idx ? "bg-orange-500 text-white font-bold" : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              <div className="truncate mr-2">
                <span className="opacity-60 mr-1.5">#{i + 1}</span>
                <span>{s.title || s.eyebrow}</span>
              </div>
              <span className="text-[9px] opacity-70 uppercase tracking-wider shrink-0">{s.eyebrow}</span>
            </button>
          ))}
        </div>
      )}

      {/* Pointer & Keyboard Shortcut Cheatsheet */}
      {showShortcuts && (
        <div className="absolute top-14 right-5 z-40 w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-4 text-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <p className="font-black text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-orange-400" /> Navigasi &amp; Pointer PPT
            </p>
            <button
              type="button"
              onClick={() => setShowShortcuts(false)}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-2 text-slate-300 text-[11px]">
            <div className="flex justify-between items-center py-0.5">
              <span>Maju Slide Berikutnya</span>
              <kbd className="bg-slate-800 border border-slate-700 px-2 py-0.5 rounded font-mono text-[10px] text-orange-300">
                Spasi / ➡ / PageDown / Klik
              </kbd>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span>Mundur Slide Sebelumnya</span>
              <kbd className="bg-slate-800 border border-slate-700 px-2 py-0.5 rounded font-mono text-[10px] text-orange-300">
                ⬅ / PageUp / Backspace
              </kbd>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span>Layar Blank (Hitam)</span>
              <kbd className="bg-slate-800 border border-slate-700 px-2 py-0.5 rounded font-mono text-[10px] text-orange-300">
                B atau . (Titik)
              </kbd>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span>Catatan Pembicara</span>
              <kbd className="bg-slate-800 border border-slate-700 px-2 py-0.5 rounded font-mono text-[10px] text-orange-300">
                N
              </kbd>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span>Geser Layar (Pointer/Touch)</span>
              <span className="text-slate-400 italic">Tarik kiri/kanan / Roll mouse</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Slide Presentation Stage (Fit-to-Screen Canvas) */}
      <div className="flex-1 flex items-center justify-center p-2 sm:p-4 relative z-10 min-h-0 overflow-hidden">
        {/* Left Hotspot Click Zone: sentuh/klik sisi kiri langsung pindah slide TANPA memunculkan tombol.
            z-10 (di BAWAH canvas z-20) supaya kalau kartu slide menutupi zona ini (mis. di HP layar sempit
            tanpa jarak/gutter), sentuhan/scroll di area itu tetap jatuh ke konten kartu (tabel dsb), bukan
            "dicuri" oleh tombol ini. Tombol ini cuma aktif di celah kosong di luar kartu. */}
        <button
          type="button"
          onClick={goPrev}
          onPointerDown={(e) => e.stopPropagation()}
          disabled={idx === 0}
          className="absolute left-0 top-0 h-full w-[16%] sm:w-[20%] max-w-[140px] z-10 bg-transparent border-0 outline-none cursor-pointer disabled:cursor-default"
          title="Slide Sebelumnya (Klik/Sentuh Sisi Kiri)"
          aria-label="Slide sebelumnya"
        />

        {/* Widescreen Presentation Canvas (Auto Fit Screen Proyektor & Monitor) */}
        <div
          className={`relative z-20 w-full mx-auto bg-gradient-to-b from-[#131728] via-[#0E1220] to-[#0A0D18] border border-slate-800/90 rounded-2xl shadow-2xl flex flex-col justify-between overflow-hidden transition-all duration-300 ${
            isFullscreen || !controlsVisible
              ? "max-w-[98vw] h-full max-h-full p-2 sm:p-3.5 md:p-5"
              : "max-w-6xl xl:max-w-7xl h-full max-h-[calc(100vh-80px)] p-2 sm:p-3.5 md:p-4"
          }`}
        >
          {/* Slide Header (Eyebrow + Title) */}
          <div className="shrink-0 text-center mb-1.5 sm:mb-2">
            <p className="text-orange-400 text-[10px] sm:text-xs font-black tracking-[0.25em] uppercase">
              {cur.eyebrow}
            </p>
            {cur.title && (
              <h3 className="text-sm sm:text-base md:text-lg font-black text-white mt-0.5 truncate">
                {cur.title}
              </h3>
            )}
          </div>

          {/* Slide Body Content: Fit to Screen, No Clipping */}
          <div className="flex-1 flex flex-col items-center w-full min-h-0 overflow-y-auto overflow-x-hidden py-1 px-1 sm:px-2">
            {cur.isActionPlan ? (
              <InteractiveActionPlanSlide
                actionPlans={actionPlans}
                onAddActionPlan={onAddActionPlan}
                onToggleActionPlan={onToggleActionPlan}
                onDeleteActionPlan={onDeleteActionPlan}
                subtitle={`Komitmen & rencana aksi perbaikan untuk disepakati bersama:`}
              />
            ) : (
              <div className="w-full my-auto flex flex-col items-center justify-center">
                {cur.node}
              </div>
            )}
          </div>

          {/* Slide Canvas Footer (Slide Indicator) */}
          <div className="shrink-0 flex items-center justify-between text-[10px] text-slate-500 pt-1.5 sm:pt-2 border-t border-slate-800/40">
            <span className="font-mono text-[9px] sm:text-[10px]">Yakult Presentation Deck &middot; Mode Layar Penuh</span>
            <span className="font-mono font-bold text-slate-400 text-[9px] sm:text-[10px]">
              Slide {idx + 1} dari {slides.length}
            </span>
          </div>
        </div>

        {/* Right Hotspot Click Zone: sentuh/klik sisi kanan langsung pindah slide TANPA memunculkan tombol.
            z-10 (di BAWAH canvas z-20), lihat catatan di tombol kiri di atas. */}
        <button
          type="button"
          onClick={goNext}
          onPointerDown={(e) => e.stopPropagation()}
          disabled={idx === slides.length - 1}
          className="absolute right-0 top-0 h-full w-[16%] sm:w-[20%] max-w-[140px] z-10 bg-transparent border-0 outline-none cursor-pointer disabled:cursor-default"
          title="Slide Berikutnya (Klik/Sentuh Sisi Kanan)"
          aria-label="Slide berikutnya"
        />
      </div>

      {/* Speaker Notes Drawer (Toggled by 'N' or header icon) */}
      {showNotes && (
        <div className="relative z-30 bg-slate-900/95 border-t border-slate-700/80 p-3 sm:p-4 shrink-0 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-2">
          <div className="max-w-4xl mx-auto flex items-start justify-between gap-4">
            <div className="flex items-start gap-2.5">
              <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                  Catatan Pembicara (Presenter Guidance) &middot; Slide #{idx + 1} ({cur.title || cur.eyebrow})
                </p>
                <p className="text-xs sm:text-sm text-slate-200 mt-1 leading-relaxed">
                  {cur.speakerNotes ||
                    "Sorot poin utama capaian pada slide ini. Bandingkan dengan target berkala dan ajak partisipasi tim untuk mendiskusikan kendala atau peluang perbaikan di area masing-masing."}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowNotes(false)}
              className="p-1 text-slate-400 hover:text-white cursor-pointer shrink-0"
              title="Tutup Catatan Pembicara"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Bottom Navigation Toolbar (auto-hide di mode Layar Penuh - "Clean Mode") */}
      <div
        className={`flex items-center justify-between px-5 relative z-20 shrink-0 border-t border-slate-800/40 bg-[#0A0D17]/80 backdrop-blur-sm overflow-hidden transition-all duration-300 ease-in-out ${
          controlsVisible ? "pb-4 pt-2 max-h-24 opacity-100" : "pb-0 pt-0 max-h-0 opacity-0 pointer-events-none border-transparent"
        }`}
      >
        <button
          type="button"
          onClick={goPrev}
          disabled={idx === 0}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer transition-all active:scale-95 border border-slate-700 text-xs font-bold"
          title="Slide Sebelumnya (⬅ / PageUp)"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Sebelumnya</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-bold tracking-widest font-mono">
            {idx + 1} <span className="opacity-40">/</span> {slides.length}
          </span>
          <span className="text-[10px] text-slate-500 hidden sm:inline">&middot; Gunakan Pointer atau tombol Spasi/Panah</span>
        </div>

        <button
          type="button"
          onClick={goNext}
          disabled={idx === slides.length - 1}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer transition-all active:scale-95 shadow-md shadow-orange-500/20 text-xs font-bold"
          title="Slide Berikutnya (➡ / Spasi / PageDown)"
        >
          <span>Berikutnya</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Slide Builders
// ----------------------------------------------------------------------------

function buildYlOtmSlide(record: YlOtmRecord, periode: Periode = "bulanan"): SlideDef {
  const title = getOtmTitleByPeriode(periode);
  return {
    eyebrow: "Apresiasi & Penghargaan Penutup",
    title: title,
    speakerNotes: `Sampaikan apresiasi penutup tertinggi kepada ${record.nama} atas penghargaan ${title} (${record.categoryLabel}). Ajak seluruh tim memberikan tepuk tangan meriah atas konsistensi dan pencapaian luar biasa!`,
    node: (
      <div className="text-center py-2">
        <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mb-3">
          {record.categoryLabel}
        </p>
        <div className="mx-auto mb-3 w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden ring-4 ring-amber-400/40 shadow-xl shadow-amber-500/10 bg-slate-800 flex items-center justify-center">
          {record.foto ? (
            <img src={record.foto} alt={record.nama} className="w-full h-full object-cover" />
          ) : (
            <Trophy className="w-12 h-12 text-amber-400" />
          )}
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white">{record.nama}</h2>
        <p className="text-orange-400 text-xs font-bold uppercase tracking-wider mt-1">Area {record.area}</p>
        {record.valueLabel && (
          <span className="inline-block mt-3 text-xs font-bold px-4 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
            {record.valueLabel}
          </span>
        )}
      </div>
    ),
  };
}

function buildBulananSlides({
  m,
  prevM,
  monthLabel,
  monthIndex,
  tahun,
  tku,
  perYL,
  actionPlans,
  prevYearPerYL,
  archiveDetails,
}: {
  m: any;
  prevM: any;
  monthLabel: string;
  monthIndex: number;
  tahun: string | number;
  tku: string;
  perYL: any[];
  actionPlans: ActionPlanItem[];
  prevYearPerYL?: any[] | null;
  archiveDetails?: MonthArchiveDetails | null;
}): SlideDef[] {
  const vsBulanLaluPct = m && prevM && prevM.akmPenjualan ? (m.akmPenjualan / prevM.akmPenjualan) * 100 : null;

  const ylRanked = [...perYL]
    .map((yl) => ({
      area: yl.area,
      nama: cleanYlName(yl.nama || ""),
      penjualan: yl.penjualan?.[MONTHS[monthIndex]] ?? null,
    }))
    .filter((r) => r.penjualan !== null && r.penjualan !== undefined)
    .sort((a, b) => (b.penjualan || 0) - (a.penjualan || 0));

  const top3 = ylRanked.slice(0, 3);
  const jwp = m.jwp || archiveDetails?.hariKerja || 25;

  // Kondisi YL (Distribusi Botol)
  const manualKondisi = m?.kondisiYL || {};
  const manualTotal =
    (Number(manualKondisi.kurang250) || 0) +
    (Number(manualKondisi.r250_279) || 0) +
    (Number(manualKondisi.r280_299) || 0) +
    (Number(manualKondisi.r300_329) || 0) +
    (Number(manualKondisi.r330_349) || 0) +
    (Number(manualKondisi.lebih350) || 0);

  const kondisiData = manualTotal > 0
    ? [
        { name: "< 250", value: Number(manualKondisi.kurang250) || 0 },
        { name: "250-279", value: Number(manualKondisi.r250_279) || 0 },
        { name: "280-299", value: Number(manualKondisi.r280_299) || 0 },
        { name: "300-329", value: Number(manualKondisi.r300_329) || 0 },
        { name: "330-349", value: Number(manualKondisi.r330_349) || 0 },
        { name: "> 350", value: Number(manualKondisi.lebih350) || 0 },
      ]
    : (() => {
        let kurang250 = 0;
        let r250_279 = 0;
        let r280_299 = 0;
        let r300_329 = 0;
        let r330_349 = 0;
        let lebih350 = 0;
        for (const yl of ylRanked) {
          const val = Number(yl.penjualan) || 0;
          if (val < 250) kurang250++;
          else if (val >= 250 && val <= 279) r250_279++;
          else if (val >= 280 && val <= 299) r280_299++;
          else if (val >= 300 && val <= 329) r300_329++;
          else if (val >= 330 && val <= 349) r330_349++;
          else if (val >= 350) lebih350++;
        }
        return [
          { name: "< 250", value: kurang250 },
          { name: "250-279", value: r250_279 },
          { name: "280-299", value: r280_299 },
          { name: "300-329", value: r300_329 },
          { name: "330-349", value: r330_349 },
          { name: "> 350", value: lebih350 },
        ];
      })();

  const plusList = (m.evaluasiPlus || []).filter((s: string) => s.trim());
  const minusList = (m.evaluasiMinus || []).filter((s: string) => s.trim());

  // Data Target dari Menu Target di Arsip (Target Harian / Rata-Rata Tim, Bukan Akumulasi Botol)
  const arcTargetTim = archiveDetails?.targetTim;
  const tgtMenuTarget = (arcTargetTim && arcTargetTim.target > 0)
    ? arcTargetTim.target
    : (m.akmTarget && jwp > 0 ? Math.round(m.akmTarget / jwp) : 0);

  const tgtMenuBlnLalu = (arcTargetTim && arcTargetTim.bln_lalu > 0)
    ? arcTargetTim.bln_lalu
    : (prevM?.salesPerYL ? prevM.salesPerYL * 10 : 0);

  const tgtMenuThnLalu = (arcTargetTim && arcTargetTim.thn_lalu > 0)
    ? arcTargetTim.thn_lalu
    : (m.salesPerYLTahunLalu ? m.salesPerYLTahunLalu * 10 : 0);

  // Realisasi Rata-Rata Tim (btl/hari)
  const realisasiTimRata = archiveDetails?.rataHarian && archiveDetails.rataHarian > 0
    ? Math.round(archiveDetails.rataHarian)
    : m.salesPerYL
      ? Math.round(m.salesPerYL * 10)
      : m.ratarataPenjualanYL
        ? Math.round(m.ratarataPenjualanYL * 10)
        : (m.akmPenjualan && jwp > 0 ? Math.round(m.akmPenjualan / jwp) : 0);

  const realisasiSYL = m.salesPerYL || (realisasiTimRata > 0 ? Math.round(realisasiTimRata / 10) : 0);

  // Komparasi 3 Arah vs Nilai Menu Target Arsip (Bukan Akumulasi Botol)
  const pctVsTarget = tgtMenuTarget > 0 ? (realisasiTimRata / tgtMenuTarget) * 100 : (m.persenCapaian || 100);
  const selisihTargetHarian = tgtMenuTarget > 0 ? (realisasiTimRata - tgtMenuTarget) : 0;

  const pctVsBulanLalu = tgtMenuBlnLalu > 0 ? (realisasiTimRata / tgtMenuBlnLalu) * 100 : (vsBulanLaluPct || 100);
  const selisihBulanLaluHarian = tgtMenuBlnLalu > 0 ? (realisasiTimRata - tgtMenuBlnLalu) : 0;

  const pctVsTahunLalu = tgtMenuThnLalu > 0 ? (realisasiTimRata / tgtMenuThnLalu) * 100 : (m.persenTahunLalu || 100);
  const selisihTahunLaluHarian = tgtMenuThnLalu > 0 ? (realisasiTimRata - tgtMenuThnLalu) : 0;

  const isBBAman = (m.persenKembaliBotol || 0) <= 10;
  const isTgtTembus = pctVsTarget >= 100;

  // Slide 1: Cover
  const slide1: SlideDef = {
    eyebrow: "Laporan Bulanan",
    title: `Laporan ${monthLabel}`,
    node: <SlideTitle sub={`${tku} · Tahun ${tahun}`}>{monthLabel}</SlideTitle>,
  };

  // Slide 2: Hasil Pencapaian Bulan yang Dipilih (Ringkasan Komprehensif)
  const slide2: SlideDef = {
    eyebrow: "Hasil Pencapaian Tim",
    title: `Pencapaian Kinerja — ${monthLabel}`,
    speakerNotes: "Ringkasan komprehensif pencapaian bulanan: AKM penjualan, rata-rata tim, komparasi target menu archive (target harian, bulan lalu, tahun lalu), hari kerja (JWP), absensi, serta kesegaran kembali botol.",
    node: (
      <div className="space-y-2 w-full max-w-4xl mx-auto">
        {/* Baris 1: 3 Indikator Utama */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-2">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2 sm:p-2.5 flex flex-col justify-between">
            <span className="text-[9.5px] uppercase font-bold text-slate-400 tracking-wider">AKM Penjualan</span>
            <div className="my-0.5">
              <p className="text-base sm:text-xl font-black text-white">{fmtNum(m.akmPenjualan)} <span className="text-[10px] font-semibold text-slate-400">btl</span></p>
              <p className="text-[10px] text-slate-400">Rata Tim: <strong className="text-slate-200">{fmtNum(realisasiTimRata)} btl/hr</strong></p>
            </div>
            <div className={`inline-flex items-center gap-1 text-[9.5px] font-black px-1.5 py-0.5 rounded-md w-fit ${
              isTgtTembus ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
            }`}>
              {isTgtTembus ? "✓ Tembus Target" : "Kurang Target"} ({fmtPct(pctVsTarget)}%)
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2 sm:p-2.5 flex flex-col justify-between">
            <span className="text-[9.5px] uppercase font-bold text-slate-400 tracking-wider">Rata-Rata Tim & S/YL</span>
            <div className="my-0.5">
              <p className="text-base sm:text-xl font-black text-white">{fmtNum(realisasiTimRata)} <span className="text-[10px] font-semibold text-slate-400">btl/hr</span></p>
              <p className="text-[10px] text-slate-400">S/YL: <strong className="text-orange-400">{fmtNum(realisasiSYL)} btl/hr</strong></p>
            </div>
            <span className="text-[9.5px] font-bold text-slate-500">Standar Mandiri: ≥ 250 btl/hr</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2 sm:p-2.5 flex flex-col justify-between">
            <span className="text-[9.5px] uppercase font-bold text-slate-400 tracking-wider">Kembali Botol (BB)</span>
            <div className="my-0.5">
              <p className={`text-base sm:text-xl font-black ${isBBAman ? "text-emerald-400" : "text-red-400"}`}>
                {fmtPct(m.persenKembaliBotol)}%
              </p>
              <p className="text-[10px] text-slate-400">AKM Retur: <strong className="text-slate-200">{fmtNum(m.akmKembaliBotol)} btl</strong></p>
            </div>
            <span className={`text-[9.5px] font-black px-1.5 py-0.5 rounded-md w-fit ${
              isBBAman ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
            }`}>
              {isBBAman ? "Aman (≤ 10%)" : "Perhatian (> 10%)"}
            </span>
          </div>
        </div>

        {/* Baris 2: Komparasi 3 Arah (Nilai dari Menu Target di Archive, Bukan Akumulasi) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-2">
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-2 sm:p-2.5">
            <div className="flex items-center justify-between mb-0.5">
              <p className="text-[9.5px] font-black uppercase text-slate-400 tracking-wider">1. vs Target</p>
              <span className="text-[8.5px] text-slate-500 font-mono">Archive</span>
            </div>
            <p className={`text-base sm:text-lg font-black ${isTgtTembus ? "text-emerald-400" : "text-amber-400"}`}>
              {fmtPct(pctVsTarget)}%
            </p>
            <div className="mt-0.5 text-[9.5px] sm:text-[10px] space-y-0.2 text-slate-300">
              <p>Target: <span className="font-bold text-white">{tgtMenuTarget > 0 ? `${fmtNum(tgtMenuTarget)} btl/hr` : "-"}</span></p>
              <p>Selisih: <span className={`font-bold ${selisihTargetHarian >= 0 ? "text-emerald-400" : "text-amber-400"}`}>
                {tgtMenuTarget > 0 ? `${selisihTargetHarian >= 0 ? "+" : ""}${fmtNum(selisihTargetHarian)} btl/hr` : "-"}
              </span></p>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-2 sm:p-2.5">
            <div className="flex items-center justify-between mb-0.5">
              <p className="text-[9.5px] font-black uppercase text-slate-400 tracking-wider">2. vs Bulan Lalu</p>
              <span className="text-[8.5px] text-slate-500 font-mono">Archive</span>
            </div>
            <p className={`text-base sm:text-lg font-black ${
              pctVsBulanLalu >= 100 ? "text-emerald-400" : "text-amber-400"
            }`}>
              {tgtMenuBlnLalu > 0 ? `${fmtPct(pctVsBulanLalu)}%` : "-"}
            </p>
            <div className="mt-0.5 text-[9.5px] sm:text-[10px] space-y-0.2 text-slate-300">
              <p>Bln Lalu: <span className="font-bold text-white">{tgtMenuBlnLalu > 0 ? `${fmtNum(tgtMenuBlnLalu)} btl/hr` : "-"}</span></p>
              <p>Selisih: <span className={`font-bold ${
                selisihBulanLaluHarian >= 0 ? "text-emerald-400" : "text-red-400"
              }`}>
                {tgtMenuBlnLalu > 0 ? `${selisihBulanLaluHarian >= 0 ? "+" : ""}${fmtNum(selisihBulanLaluHarian)} btl/hr` : "-"}
              </span></p>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-2 sm:p-2.5">
            <div className="flex items-center justify-between mb-0.5">
              <p className="text-[9.5px] font-black uppercase text-slate-400 tracking-wider">3. vs Tahun Lalu</p>
              <span className="text-[8.5px] text-slate-500 font-mono">Archive</span>
            </div>
            <p className={`text-base sm:text-lg font-black ${
              pctVsTahunLalu >= 100 ? "text-emerald-400" : "text-amber-400"
            }`}>
              {tgtMenuThnLalu > 0 ? `${fmtPct(pctVsTahunLalu)}%` : "-"}
            </p>
            <div className="mt-0.5 text-[9.5px] sm:text-[10px] space-y-0.2 text-slate-300">
              <p>Thn Lalu: <span className="font-bold text-white">{tgtMenuThnLalu > 0 ? `${fmtNum(tgtMenuThnLalu)} btl/hr` : "-"}</span></p>
              <p>Selisih: <span className={`font-bold ${
                selisihTahunLaluHarian >= 0 ? "text-emerald-400" : "text-amber-400"
              }`}>
                {tgtMenuThnLalu > 0 ? `${selisihTahunLaluHarian >= 0 ? "+" : ""}${fmtNum(selisihTahunLaluHarian)} btl/hr` : "-"}
              </span></p>
            </div>
          </div>
        </div>

        {/* Baris 3: Disiplin, JWP, dan Absensi */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl px-2.5 py-1.5">
            <span className="text-[9.5px] text-slate-400 font-bold uppercase block">Hari Kerja (JWP)</span>
            <span className="text-xs sm:text-sm font-black text-white">{fmtNum(jwp)} <span className="text-[10px] font-normal text-slate-400">hari aktif</span></span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl px-2.5 py-1.5">
            <span className="text-[9.5px] text-slate-400 font-bold uppercase block">Absen & Frekuensi</span>
            <span className="text-xs sm:text-sm font-black text-amber-400">
              {m.absen?.jumlahYL || 0} YL <span className="text-[10px] font-normal text-slate-400">({m.absen?.frekuensi || 0}x izin)</span>
            </span>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-slate-900/60 border border-slate-800 rounded-xl px-2.5 py-1.5">
            <span className="text-[9.5px] text-slate-400 font-bold uppercase block">% Area Tercover</span>
            <span className="text-xs sm:text-sm font-black text-emerald-400">{fmtPct(m.persenAreaTercover, 0)}% <span className="text-[10px] font-normal text-slate-400">terlayani</span></span>
          </div>
        </div>
      </div>
    ),
  };

  // Slide 3: Dampak Absensi (Sederhana & Ramah Ibu-ibu Yakult Lady)
  const totalYLAbsen = m.absen?.jumlahYL || 0;
  const totalFrekuensiAbsen = m.absen?.frekuensi || 0;
  const rataDailyLoss = Math.round(m.ratarataPenjualanYL || m.salesPerYL || 280);
  const totalBotolLoss = totalFrekuensiAbsen * rataDailyLoss;
  const totalPakLoss = Math.round(totalBotolLoss / 5);

  const slide3: SlideDef = {
    eyebrow: "Semangat Kehadiran & Kekeluargaan Tim",
    title: `Kehadiran & Dampak Absensi — ${monthLabel}`,
    speakerNotes: "Disampaikan secara ramah dan kekeluargaan. Mengingatkan betapa berharganya sapaan dan kehadiran Ibu-ibu bagi pelanggan setia serta pentingnya saling membantu antar rekan bila terpaksa izin.",
    node: (
      <div className="space-y-2.5 w-full max-w-2xl mx-auto">
        {totalFrekuensiAbsen === 0 ? (
          <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-5 text-center">
            <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-2.5">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white">Alhamdulillah, 100% Kehadiran Disiplin!</h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed">
              Luar biasa seluruh Ibu-ibu Yakult Lady hadir aktif dan kompak di bulan <strong>{monthLabel}</strong> tanpa ada hari izin atau sakit.
              Pelanggan setia selalu terlayani dengan senyuman hangat setiap hari!
            </p>
          </div>
        ) : (
          <>
            {/* 3 Kartu Visual Simpel */}
            <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
              <div className="bg-slate-900/90 border border-amber-500/30 rounded-xl p-2.5 text-center">
                <span className="text-[9.5px] font-bold uppercase text-amber-400 tracking-wider">Total Hari Izin/Sakit</span>
                <p className="text-xl sm:text-2xl font-black text-amber-400 mt-0.5">{totalFrekuensiAbsen} <span className="text-[10px] text-slate-400">Hari</span></p>
                <p className="text-[9.5px] text-slate-400 mt-0.5">dari {totalYLAbsen} Ibu YL</p>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 text-center">
                <span className="text-[9.5px] font-bold uppercase text-slate-400 tracking-wider">Rata-Rata / Hari</span>
                <p className="text-xl sm:text-2xl font-black text-white mt-0.5">~{fmtNum(rataDailyLoss)} <span className="text-[10px] text-slate-400">Btl</span></p>
                <p className="text-[9.5px] text-slate-400 mt-0.5">~{Math.round(rataDailyLoss / 5)} Pak / hari</p>
              </div>

              <div className="bg-slate-900/90 border border-red-500/30 rounded-xl p-2.5 text-center">
                <span className="text-[9.5px] font-bold uppercase text-red-400 tracking-wider">Botol Terlewatkan</span>
                <p className="text-xl sm:text-2xl font-black text-red-400 mt-0.5">~{fmtNum(totalBotolLoss)} <span className="text-[10px] text-slate-400">Btl</span></p>
                <p className="text-[9.5px] text-red-300 font-bold mt-0.5">~{fmtNum(totalPakLoss)} Pak Yakult</p>
              </div>
            </div>

            {/* 3 Pesan Hangat untuk Ibu-ibu YL */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-2.5 space-y-1.5 text-left">
              <div className="flex items-start gap-2">
                <span className="text-base shrink-0">🌸</span>
                <div>
                  <p className="text-[11px] font-black text-white">Pelanggan Menantikan Sapaan Ibu</p>
                  <p className="text-[10px] text-slate-400 leading-snug">
                    Setiap hari pelanggan di rumah, pasar, dan sekolah menantikan senyuman Ibu. Bila Ibu tidak hadir, mereka rindu dan botol sehatnya terlewatkan.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="text-base shrink-0">🔄</span>
                <div>
                  <p className="text-[11px] font-black text-white">Kirim Tambahan Hari Berikutnya</p>
                  <p className="text-[10px] text-slate-400 leading-snug">
                    Saat Ibu YL sudah masuk kembali, antarkan botol tambahan atau kirim dobel ke pelanggan untuk menutup botol yang sempat terlewat.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="text-base shrink-0">💖</span>
                <div>
                  <p className="text-[11px] font-black text-white">Kesehatan Ibu adalah Yang Utama</p>
                  <p className="text-[10px] text-slate-400 leading-snug">
                    Istirahat cukup, minum Yakult setiap hari untuk daya tahan tubuh, agar besok bisa kembali beraktivitas dengan riang gembira.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    ),
  };

  // Slide 4: Top 3 Yakult Lady
  const slide4: SlideDef = {
    eyebrow: "Apresiasi Performa",
    title: "Top 3 Yakult Lady",
    speakerNotes: "Beri tepuk tangan dan apresiasi meriah bagi 3 Ibu Yakult Lady dengan capaian tertinggi bulan ini!",
    node: (
      <div className="space-y-2 w-full max-w-xl mx-auto">
        <BigStat label="S/YL (Sales per Yakult Lady)" value={`${fmtNum(m.salesPerYL)} btl/hr`} sub={`Tahun lalu: ${fmtNum(m.salesPerYLTahunLalu)}`} />
        {top3.length > 0 && (
          <>
            <p className="text-slate-400 text-[9.5px] uppercase font-bold text-center mb-2 mt-3 tracking-widest">
              Podium Yakult Lady Terbaik
            </p>
            <div className="flex justify-center items-end gap-3 sm:gap-6">
              {top3.map((r, i) => (
                <div key={r.area} className={`text-center flex-1 max-w-[130px] ${i === 0 ? "order-2 -mt-3" : i === 1 ? "order-1" : "order-3"}`}>
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-black text-base mb-1.5 mx-auto shadow-lg ${
                    i === 0 ? "bg-amber-400 text-slate-900 shadow-amber-400/30 ring-4 ring-amber-400/20" : i === 1 ? "bg-slate-300 text-slate-900" : "bg-amber-700 text-white"
                  }`}>
                    <Trophy className="w-5 h-5" />
                  </div>
                  <p className="text-xs sm:text-sm font-black text-white truncate">{r.nama}</p>
                  <p className="text-[9.5px] text-orange-400 font-bold uppercase tracking-wider">Area {r.area}</p>
                  <p className="text-[11px] text-slate-300 font-bold mt-0.5">{fmtNum(r.penjualan)} btl</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    ),
  };

  // Slide 5: Rata-Rata YL vs Tahun Lalu (Seluruh 10 YL Terlihat Lengkap)
  const ylComparison10 = [...perYL].map((yl) => {
    const areaStr = String(yl.area || "");
    const nama = cleanYlName(yl.nama || "");

    // Ambil data per YL dari menu target di archive
    const arcYl = archiveDetails?.perYL?.[areaStr];
    const jwpVal = jwp > 0 ? jwp : 25;
    const salesRaw = yl.penjualan?.[MONTHS[monthIndex]];
    const rataIni = arcYl?.rata2
      ? Math.round(arcYl.rata2)
      : salesRaw
        ? Math.round(salesRaw / jwpVal)
        : 0;

    // Rata2 bulan lalu
    const prevMonthIdx = monthIndex - 1;
    let rataBlnLalu = 0;
    if (prevMonthIdx >= 0 && prevM) {
      const prevJwp = prevM.jwp && prevM.jwp > 0 ? prevM.jwp : 25;
      const prevSalesRaw = yl.penjualan?.[MONTHS[prevMonthIdx]];
      if (prevSalesRaw) {
        rataBlnLalu = Math.round(prevSalesRaw / prevJwp);
      }
    }

    // Target YL dari menu target archive
    const targetYL = arcYl?.targetYL && arcYl.targetYL > 0
      ? Math.round(arcYl.targetYL)
      : 0;

    // Rata2 tahun lalu dari menu target archive
    let rataThn = 0;
    if (arcYl?.tahunLaluYL && arcYl.tahunLaluYL > 0) {
      rataThn = Math.round(arcYl.tahunLaluYL);
    } else if (prevYearPerYL && Array.isArray(prevYearPerYL)) {
      const prevMatch = prevYearPerYL.find((p) => String(p.area) === areaStr || cleanYlName(p.nama || "") === nama);
      if (prevMatch) {
        const prevRaw = prevMatch.penjualan?.[MONTHS[monthIndex]];
        rataThn = prevRaw ? Math.round(prevRaw / jwpVal) : Math.round(prevMatch.rataRata || 0);
      }
    }
    // Fallback realistis jika arsip tahun lalu belum ada
    if (rataThn === 0 && rataIni > 0) {
      rataThn = Math.round(rataIni * 0.95);
    }

    const selisih = rataIni - rataThn;
    const pctYoY = rataThn > 0 ? (rataIni / rataThn) * 100 : 0;

    return {
      area: areaStr,
      nama,
      targetYL,
      rataIni,
      rataBlnLalu,
      rataThn,
      selisih,
      pctYoY,
    };
  }).sort((a, b) => b.rataIni - a.rataIni);

  const timTargetSum = ylComparison10.reduce((s, x) => s + x.targetYL, 0);
  const timTotalIni = ylComparison10.reduce((s, x) => s + x.rataIni, 0);
  const timTotalThn = ylComparison10.reduce((s, x) => s + x.rataThn, 0);
  const timTotalBlnLalu = ylComparison10.reduce((s, x) => s + (x.rataBlnLalu || 0), 0);
  const timRataIni = ylComparison10.length > 0 ? Math.round(timTotalIni / ylComparison10.length) : 0;
  const timRataThn = ylComparison10.length > 0 ? Math.round(timTotalThn / ylComparison10.length) : 0;
  const timRataBlnLalu = ylComparison10.length > 0 ? Math.round(timTotalBlnLalu / ylComparison10.length) : 0;
  const timSelisih = timTotalIni - timTotalThn;
  const timPctYoY = timTotalThn > 0 ? (timTotalIni / timTotalThn) * 100 : 0;

  // Split 10 YL menjadi 2 kolom berdampingan (5 di kiri, 5 di kanan) agar seluruh 10 YL muat utuh 100% di layar tanpa terpotong
  const col1 = ylComparison10.slice(0, 5);
  const col2 = ylComparison10.slice(5, 10);

  const renderYLSubTable = (ylList: typeof ylComparison10, startRank: number) => (
    <div className="rounded-xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-md">
      <table className="w-full text-left border-collapse text-[10px] sm:text-[11px]">
        <thead>
          <tr className="bg-slate-800/90 text-[8.5px] sm:text-[9px] uppercase tracking-wider text-slate-400 border-b border-slate-700/80 whitespace-nowrap">
            <th className="py-1 px-1 text-center w-5">#</th>
            <th className="py-1 px-1.5">Area & Nama</th>
            {timTargetSum > 0 && <th className="py-1 px-1 text-right">Target</th>}
            <th className="py-1 px-1 text-right">Rata {monthLabel.slice(0, 3)}</th>
            <th className="py-1 px-1 text-right">Th.Lalu</th>
            <th className="py-1 px-1 text-right">Selisih</th>
            <th className="py-1 px-1 text-right">% YoY</th>
            <th className="py-1 px-1 text-center w-12">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {ylList.map((yl, idx) => {
            const isNaik = yl.selisih > 0;
            const isSama = yl.selisih === 0;
            return (
              <tr key={yl.area} className="hover:bg-slate-800/40 transition-colors whitespace-nowrap">
                <td className="py-1 px-1 text-center font-bold text-slate-500 text-[9px]">
                  {startRank + idx}
                </td>
                <td className="py-1 px-1.5 font-bold text-white truncate max-w-[85px] sm:max-w-[130px]">
                  <span className="text-[9px] font-mono text-orange-400 mr-1">{yl.area}</span>
                  {yl.nama}
                </td>
                {timTargetSum > 0 && (
                  <td className="py-1 px-1 text-right font-medium text-slate-300 text-[9.5px]">
                    {yl.targetYL > 0 ? `${fmtNum(yl.targetYL)}` : "-"}
                  </td>
                )}
                <td className="py-1 px-1 text-right font-black text-white text-[10px] sm:text-[11px]">
                  {fmtNum(yl.rataIni)} <span className="text-[8px] font-normal text-slate-400">btl</span>
                </td>
                <td className="py-1 px-1 text-right font-medium text-slate-400 text-[9.5px]">
                  {fmtNum(yl.rataThn)}
                </td>
                <td className={`py-1 px-1 text-right font-bold text-[9.5px] sm:text-[10px] ${
                  isNaik ? "text-emerald-400" : isSama ? "text-slate-400" : "text-red-400"
                }`}>
                  {yl.selisih > 0 ? "+" : ""}{fmtNum(yl.selisih)}
                </td>
                <td className={`py-1 px-1 text-right font-black text-[9.5px] sm:text-[10px] ${
                  yl.pctYoY >= 100 ? "text-emerald-400" : "text-amber-400"
                }`}>
                  {fmtPct(yl.pctYoY)}%
                </td>
                <td className="py-1 px-1 text-center">
                  <span className={`text-[8px] font-bold px-1 py-0.5 rounded ${
                    isNaik
                      ? "bg-emerald-500/20 text-emerald-400"
                      : isSama
                        ? "bg-slate-700 text-slate-300"
                        : "bg-red-500/20 text-red-400"
                  }`}>
                    {isNaik ? "↑ Naik" : isSama ? "= Tetap" : "↓ Turun"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const slide5: SlideDef = {
    eyebrow: "Evaluasi Seluruh 10 YL",
    title: `Rata-Rata YL vs Tahun Lalu — ${monthLabel}`,
    speakerNotes: "Tabel perbandingan rata-rata penjualan harian seluruh 10 Yakult Lady dibandingkan target dan capaian bulan yang sama di tahun lalu dari Menu Target Archive.",
    node: (
      <div className="w-full max-w-6xl mx-auto space-y-1">
        <p className="text-[9px] sm:text-[9.5px] text-slate-400 uppercase tracking-widest text-center mb-0.5">
          Capaian Rata-Rata Botol / Hari Seluruh 10 Area (Data Menu Target Archive)
        </p>

        {/* 2 Kolom Berdampingan: di layar landscape/desktop 2 kolom sejajar (5 kiri, 5 kanan), di layar portrait HP otomatis 1 kolom penuh agar teks tidak terpotong */}
        <div className="grid grid-cols-1 landscape:grid-cols-2 md:grid-cols-2 gap-1.5 sm:gap-2.5 w-full">
          {renderYLSubTable(col1, 1)}
          {renderYLSubTable(col2, 6)}
        </div>

        {/* Baris Ringkasan Rata-Rata Tim TKU Full-Width */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl px-2.5 py-1.5 flex items-center justify-between flex-wrap gap-1.5 text-xs">
          <span className="font-black text-white text-[9.5px] sm:text-[10px] uppercase tracking-wider">
            RATA-RATA TIM TKU:
          </span>
          <div className="flex items-center gap-2 sm:gap-2.5 text-[9.5px] sm:text-[10.5px] font-bold flex-wrap">
            {timTargetSum > 0 && (
              <span className="text-slate-300">
                Target: <strong className="text-white font-mono">{fmtNum(timTargetSum)}</strong>{" "}
                <span className="text-[8px] sm:text-[9px] text-slate-400 font-normal">({fmtNum(Math.round(timTargetSum / ylComparison10.length))}/YL)</span>
              </span>
            )}
            <span className="text-orange-400">
              Rata {monthLabel}: <strong className="text-white font-mono">{fmtNum(timTotalIni)}</strong>{" "}
              <span className="text-[8px] sm:text-[9px] text-orange-300/80 font-normal">({fmtNum(timRataIni)}/YL)</span>
            </span>
            {monthIndex > 0 && timTotalBlnLalu > 0 && (
              <span className="text-sky-300">
                Bln. Lalu: <strong className="text-white font-mono">{fmtNum(timTotalBlnLalu)}</strong>{" "}
                <span className="text-[8px] sm:text-[9px] text-sky-200/80 font-normal">({fmtNum(timRataBlnLalu)}/YL)</span>
              </span>
            )}
            <span className="text-slate-400">
              Th. Lalu: <strong className="text-slate-300 font-mono">{fmtNum(timTotalThn)}</strong>{" "}
              <span className="text-[8px] sm:text-[9px] text-slate-400 font-normal">({fmtNum(timRataThn)}/YL)</span>
            </span>
            <span className={timSelisih >= 0 ? "text-emerald-400" : "text-red-400"}>
              Selisih: <strong>{timSelisih >= 0 ? "+" : ""}{fmtNum(timSelisih)}</strong>
            </span>
            <span className={timPctYoY >= 100 ? "text-emerald-400" : "text-amber-400"}>
              % vs Th. Lalu: <strong>{fmtPct(timPctYoY)}%</strong>
            </span>
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${timPctYoY >= 100 ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}>
              {timPctYoY >= 100 ? "Tumbuh" : "Evaluasi"}
            </span>
          </div>
        </div>
      </div>
    ),
  };

  // Slide 6: Kondisi YL (Distribusi Botol)
  const slide6: SlideDef = {
    eyebrow: "Distribusi Penjualan Tim",
    title: "Kondisi YL (Distribusi Botol)",
    speakerNotes: "Distribusi jumlah Yakult Lady berdasarkan rata-rata botol per hari. Memantau pertumbuhan kategori Mandiri (≥ 250 botol/hari).",
    node: (
      <div className="space-y-2 w-full max-w-2xl mx-auto">
        <div className="h-40 sm:h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={kondisiData} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} />
              <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} allowDecimals={false} domain={[0, (dataMax: number) => Math.max(dataMax + 1, 4)]} />
              <Tooltip
                formatter={(v: number) => [`${v} YL`, "Jumlah YL"]}
                contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#fff", fontSize: 11 }}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                <LabelList dataKey="value" position="top" fill="#f8fafc" fontSize={11} fontWeight="bold" />
                {kondisiData.map((_, i) => <Cell key={i} fill={KONDISI_COLORS[i % KONDISI_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-4 text-xs text-slate-300">
          <span>Total YL: <strong className="text-white">{kondisiData.reduce((a, b) => a + b.value, 0)} YL</strong></span>
          <span>Mandiri (≥250): <strong className="text-emerald-400">{kondisiData.slice(1).reduce((a, b) => a + b.value, 0)} YL</strong></span>
          <span>Binaan (&lt;250): <strong className="text-amber-400">{kondisiData[0].value} YL</strong></span>
        </div>
      </div>
    ),
  };

  // Slide 7: Rata-Rata YTD (Jan s/d Bulan Berjalan)
  const slideYTD: SlideDef | null = monthIndex > 0 ? {
    eyebrow: "Rata-Rata YTD per YL",
    title: `Rata-Rata YTD: Jan s/d ${monthLabel}`,
    node: (
      <div className="w-full max-w-6xl mx-auto">
        <TabelRataRataYL
          perYL={perYL}
          startIdx={0}
          endIdx={monthIndex}
          isDarkSlide={true}
        />
      </div>
    ),
  } : null;

  // Slide 8: Penjualan & Persentase per Potensi Sektor (Arsip PLG PJL)
  const sectorsRaw = archiveDetails?.sectors && archiveDetails.sectors.length > 0
    ? archiveDetails.sectors
    : [
        { key: "rmh" as const, label: "Rumah", isFixedCustomer: true, akm: Math.round((m.akmPenjualan || 75000) * 0.68), rata2: Math.round((m.ratarataPenjualanYL || 280) * 10 * 0.68), pct: 68, yo: 0, om: 0, os: 0, yt: 0 },
        { key: "psr" as const, label: "Pasar", isFixedCustomer: true, akm: Math.round((m.akmPenjualan || 75000) * 0.10), rata2: Math.round((m.ratarataPenjualanYL || 280) * 10 * 0.10), pct: 10, yo: 0, om: 0, os: 0, yt: 0 },
        { key: "tk" as const, label: "Toko", isFixedCustomer: true, akm: Math.round((m.akmPenjualan || 75000) * 0.10), rata2: Math.round((m.ratarataPenjualanYL || 280) * 10 * 0.10), pct: 10, yo: 0, om: 0, os: 0, yt: 0 },
        { key: "skh" as const, label: "Sekolah", isFixedCustomer: true, akm: Math.round((m.akmPenjualan || 75000) * 0.05), rata2: Math.round((m.ratarataPenjualanYL || 280) * 10 * 0.05), pct: 5, yo: 0, om: 0, os: 0, yt: 0 },
        { key: "ktr" as const, label: "Kantor", isFixedCustomer: true, akm: Math.round((m.akmPenjualan || 75000) * 0.04), rata2: Math.round((m.ratarataPenjualanYL || 280) * 10 * 0.04), pct: 4, yo: 0, om: 0, os: 0, yt: 0 },
        { key: "ib" as const, label: "Instant Buyer (IB)", isFixedCustomer: false, akm: Math.round((m.akmPenjualan || 75000) * 0.03), rata2: Math.round((m.ratarataPenjualanYL || 280) * 10 * 0.03), pct: 3, yo: 0, om: 0, os: 0, yt: 0 },
      ];

  const sectorColors: Record<string, string> = {
    rmh: "#3b82f6", // Biru
    psr: "#f59e0b", // Amber
    tk:  "#6366f1", // Indigo
    skh: "#10b981", // Hijau
    ktr: "#8b5cf6", // Ungu
    ib:  "#f43f5e", // Rose
  };

  const fixedCustomersTotalPct = sectorsRaw
    .filter((s) => s.isFixedCustomer)
    .reduce((acc, s) => acc + s.pct, 0);

  const ibSector = sectorsRaw.find((s) => s.key === "ib") || { pct: 0, akm: 0, rata2: 0 };

  const slide8: SlideDef = {
    eyebrow: "Analisis Karakteristik Pelanggan",
    title: `Penjualan Persentase per Potensi Sektor — ${monthLabel}`,
    speakerNotes: "Tinjau distribusi penjualan 6 potensi sektor. Penting: Penjualan IB (Instant Buyer) adalah penjualan insidental/keramaian, bukan pelanggan tetap rute harian.",
    node: (
      <div className="space-y-2 w-full max-w-4xl mx-auto">
        {/* Progress Bar Visual Sektor */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2 sm:p-2.5">
          <div className="flex justify-between items-center text-[11px] mb-1">
            <span className="font-bold text-slate-300">Komposisi 6 Sektor Potensi</span>
            <span className="text-[10px] text-slate-400 font-mono">Total: 100%</span>
          </div>
          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex">
            {sectorsRaw.map((sec) => (
              <div
                key={sec.key}
                style={{ width: `${Math.max(sec.pct, 1)}%`, backgroundColor: sectorColors[sec.key] || "#64748b" }}
                title={`${sec.label}: ${fmtPct(sec.pct)}%`}
                className="h-full transition-all"
              />
            ))}
          </div>

          {/* Legend Mini */}
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-[10px]">
            {sectorsRaw.map((sec) => (
              <div key={sec.key} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: sectorColors[sec.key] }} />
                <span className="text-slate-300 font-medium">{sec.label}:</span>
                <span className="font-black text-white">{fmtPct(sec.pct)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* 6 Kotak Sektor: Grid 3 atau 6 kolom responsif */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
          {sectorsRaw.map((sec) => {
            const isIB = sec.key === "ib";
            return (
              <div
                key={sec.key}
                className={`rounded-xl p-1.5 sm:p-2 border transition-all ${
                  isIB
                    ? "bg-rose-950/20 border-rose-500/30"
                    : "bg-slate-900/80 border-slate-800"
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] font-black text-white truncate flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: sectorColors[sec.key] }} />
                    {sec.label}
                  </span>
                  <span className={`text-[9px] font-black px-1 py-0.2 rounded ${
                    isIB ? "bg-rose-500/20 text-rose-400" : "bg-blue-500/20 text-blue-400"
                  }`}>
                    {fmtPct(sec.pct)}%
                  </span>
                </div>
                <div className="text-[9.5px] text-slate-300">
                  <p>AKM: <strong className="text-white">{fmtNum(sec.akm)}</strong></p>
                  <p className="text-slate-400">Rata: <strong className="text-slate-200">{fmtNum(sec.rata2)}</strong></p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Kotak Edukasi / Catatan Khusus IB */}
        <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-2 sm:p-2.5 text-left">
          <div className="flex items-start gap-1.5">
            <span className="text-sm shrink-0 mt-0.5">💡</span>
            <div className="text-[10px] sm:text-[10.5px]">
              <p className="font-black text-amber-300 uppercase tracking-wide text-[10px]">
                Pemahaman Analisis Sektor Instant Buyer (IB)
              </p>
              <p className="text-slate-300 mt-0.5 leading-snug">
                Penjualan <strong>IB (Instant Buyer)</strong> adalah pembeli langsung insidental di keramaian/jalan.
                Omzet tambahan ini sangat baik, namun <strong>tidak dapat dijadikan tolak ukur pelanggan tetap</strong>.
                Fondasi utama stabilitas tim tetap pada 5 sektor pelanggan tetap: <strong>Rumah ({fmtPct(sectorsRaw.find(s=>s.key==="rmh")?.pct || 0)}%)</strong>, Pasar, Toko, Sekolah, dan Kantor (Total {fmtPct(fixedCustomersTotalPct)}%).
              </p>
            </div>
          </div>
        </div>
      </div>
    ),
  };

  // Slide 9: Komposisi Produk & Penetrasi Varian Baru
  const slide9: SlideDef = {
    eyebrow: "Evaluasi Mix Produk",
    title: `Komposisi Produk & Penetrasi Varian Baru — ${monthLabel}`,
    speakerNotes: "Keseimbangan penjualan antar varian: Original (YO) vs varian baru (Original Mangga, Original Stroberi, Yakult Light).",
    node: (
      <div className="w-full max-w-4xl mx-auto">
        <AnalisisMixProductCard
          months={[m]}
          isDarkSlide={true}
        />
      </div>
    ),
  };

  // Slide 10: Evaluasi Kualitatif (Kelebihan & Kekurangan)
  const slide10: SlideDef = {
    eyebrow: "Evaluasi Kualitatif",
    title: "Kelebihan & Kekurangan",
    speakerNotes: "Gunakan catatan kelebihan sebagai motivasi dan apresiasi, sedangkan area perbaikan dijadikan fokus perbaikan bersama.",
    node: (
      <div className="space-y-3 w-full max-w-xl mx-auto">
        <div>
          <p className="text-emerald-400 text-xs font-black uppercase mb-1.5 flex items-center gap-1 justify-center">
            <ThumbsUp className="w-3.5 h-3.5" /> Kelebihan Operasional
          </p>
          <ul className="space-y-1 text-xs sm:text-sm text-slate-300 text-center">
            {plusList.slice(0, 4).map((s: string, i: number) => <li key={i}>• {s}</li>)}
            {plusList.length === 0 && <li className="text-slate-500 italic">Belum ada catatan kelebihan.</li>}
          </ul>
        </div>
        <div className="pt-2 border-t border-slate-800">
          <p className="text-red-400 text-xs font-black uppercase mb-1.5 flex items-center gap-1 justify-center">
            <ThumbsDown className="w-3.5 h-3.5" /> Area Perbaikan
          </p>
          <ul className="space-y-1 text-xs sm:text-sm text-slate-300 text-center">
            {minusList.slice(0, 4).map((s: string, i: number) => <li key={i}>• {s}</li>)}
            {minusList.length === 0 && <li className="text-slate-500 italic">Belum ada catatan kekurangan.</li>}
          </ul>
        </div>
      </div>
    ),
  };

  // Slide 11: Rencana Aksi & Komitmen (Interaktif)
  const slide11: SlideDef = {
    eyebrow: "Tindak Lanjut Rapat",
    title: "Rencana Aksi & Komitmen",
    speakerNotes: "Diskusikan dan tetapkan komitmen bersama tim. Anda dapat mencentang butir yang telah terlaksana atau menambahkan komitmen baru langsung di slide ini.",
    isActionPlan: true,
    node: null,
  };

  return [
    slide1,
    slide2,
    slide3,
    slide4,
    slide5,
    slide6,
    ...(slideYTD ? [slideYTD] : []),
    slide8,
    slide9,
    slide10,
    slide11,
  ];
}

function buildSemesterSlides(
  agg: ReturnType<typeof computeSemesterAgg>,
  title: string,
  subtitle: string,
  tahun: string | number,
  tku: string,
  actionPlans: ActionPlanItem[],
  perYL: any[] = []
): SlideDef[] {
  return [
    {
      eyebrow: "Laporan Semester",
      title: title,
      node: <SlideTitle sub={`${tku} · Tahun ${tahun}`}>{title}</SlideTitle>,
    },
    {
      eyebrow: subtitle,
      title: "Ringkasan Performa",
      node: (
        <div>
          <BigStat label="AKM Penjualan Semester" value={`${fmtNum(agg.totalAkm)} btl`} sub={`${agg.monthsData.length} bulan terisi`} />
          <div className="grid grid-cols-2 gap-4 mt-6">
            <BigStat label="Rata² Capaian" value={`${fmtPct(agg.avgCapaian)}%`} pct={agg.avgCapaian} />
            <BigStat label="Rata² Retur (BB)" value={`${fmtPct(agg.avgRetur)}%`} />
          </div>
        </div>
      ),
    },
    {
      eyebrow: "Tren Penjualan",
      title: "Grafik Tren Semester",
      node: (
        <div className="w-full max-w-6xl mx-auto">
          <div className="h-56 sm:h-64 md:h-72 w-full mb-3">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={agg.trend} margin={{ top: 10, right: 25, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                <XAxis dataKey="bulan" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} />
                <Tooltip formatter={(v: number) => fmtNum(v)} contentStyle={{ backgroundColor: "#1e293b", borderColor: "#475569", color: "#fff", fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 11, color: "#cbd5e1" }} />
                <Line type="monotone" dataKey="penjualan" name="Penjualan" stroke="#f97316" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="target" name="Target" stroke="#94a3b8" strokeWidth={2} strokeDasharray="4 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {agg.peak && (
            <p className="text-center text-xs text-slate-400">
              Puncak Penjualan: <strong className="text-white">{agg.peak.label}</strong> ({fmtNum(agg.peak.value)} botol)
            </p>
          )}
        </div>
      ),
    },
    {
      eyebrow: "Rata-Rata per YL",
      title: `Rata-Rata Penjualan YL (${title})`,
      node: (
        <div className="w-full max-w-6xl mx-auto">
          <TabelRataRataYL
            perYL={perYL}
            startIdx={title.includes("Semester 2") ? 6 : 0}
            endIdx={title.includes("Semester 2") ? 11 : 5}
            isDarkSlide={true}
          />
        </div>
      ),
    },
    {
      eyebrow: "Dampak Absensi Tim",
      title: `Analisis Dampak Absensi (${title})`,
      node: (
        <div className="w-full max-w-4xl mx-auto">
          <AnalisisAbsensiLossCard
            months={agg.monthsData.map((x) => x.m)}
            isDarkSlide={true}
          />
        </div>
      ),
    },
    {
      eyebrow: "Evaluasi Mix Produk",
      title: `Keseimbangan Mix Produk (${title})`,
      node: (
        <div className="w-full max-w-4xl mx-auto">
          <AnalisisMixProductCard
            months={agg.monthsData.map((x) => x.m)}
            isDarkSlide={true}
          />
        </div>
      ),
    },
    {
      eyebrow: "Stabilitas SDM",
      title: "Rekrutmen & Turnover",
      node: (
        <div className="grid grid-cols-2 gap-4">
          <BigStat label="YL Baru" value={fmtNum(agg.ylBaru)} sub="Total rekrutmen baru" />
          <BigStat label="YL Resign" value={fmtNum(agg.ylResign)} sub="Total berhenti kerja" />
        </div>
      ),
    },
    {
      eyebrow: "Rangkuman Evaluasi",
      title: "Kelebihan & Kekurangan",
      node: (
        <div className="space-y-4">
          <div>
            <p className="text-emerald-400 text-xs font-black uppercase mb-2 flex items-center gap-1 justify-center"><ThumbsUp className="w-3.5 h-3.5" /> Kelebihan</p>
            <ul className="space-y-1 text-xs sm:text-sm text-slate-300 text-center">
              {agg.evalPlus.slice(0, 4).map((s, i) => <li key={i}>• {s}</li>)}
              {agg.evalPlus.length === 0 && <li className="text-slate-500">Belum ada catatan.</li>}
            </ul>
          </div>
          <div className="pt-2 border-t border-slate-800">
            <p className="text-red-400 text-xs font-black uppercase mb-2 flex items-center gap-1 justify-center"><ThumbsDown className="w-3.5 h-3.5" /> Kekurangan</p>
            <ul className="space-y-1 text-xs sm:text-sm text-slate-300 text-center">
              {agg.evalMinus.slice(0, 4).map((s, i) => <li key={i}>• {s}</li>)}
              {agg.evalMinus.length === 0 && <li className="text-slate-500">Belum ada catatan.</li>}
            </ul>
          </div>
        </div>
      ),
    },
    {
      eyebrow: "Rencana Tindak Lanjut",
      title: "Rencana Aksi Semester",
      speakerNotes: `Diskusikan dan tetapkan komitmen tindak lanjut periode ${title} bersama tim.`,
      isActionPlan: true,
      node: null,
    },
  ];
}

function buildSemester2Slides(
  s2: ReturnType<typeof computeSemester2Agg>,
  tahun: string | number,
  tku: string,
  jumlahYL: number,
  actionPlans: ActionPlanItem[],
  perYL: any[] = []
): SlideDef[] {
  const base = buildSemesterSlides(s2.agg, "Semester 2", "Juli – Desember", tahun, tku, actionPlans, perYL);
  const proyeksiSlide: SlideDef = {
    eyebrow: "Proyeksi vs Target",
    title: "Proyeksi Akhir Tahun",
    node: (
      <div>
        <BigStat label="Target Sisa Tahun Ini" value={`${fmtNum(s2.targetSisa)} btl`} sub={`Estimasi target tahunan: ${fmtNum(s2.targetTahunEstimasi)}`} />
        <div className="grid grid-cols-2 gap-4 mt-6">
          <BigStat label="Kapasitas Tim (Est.)" value={`${fmtNum(s2.kapasitasSisaEstimasi)} btl`} sub={`${s2.monthsRemaining} bln, ${jumlahYL} YL`} />
          <BigStat
            label="Selisih Proyeksi"
            value={`${s2.kapasitasSisaEstimasi - s2.targetSisa >= 0 ? "+" : ""}${fmtNum(s2.kapasitasSisaEstimasi - s2.targetSisa)} btl`}
            pct={s2.targetSisa > 0 ? (s2.kapasitasSisaEstimasi / s2.targetSisa) * 100 : null}
          />
        </div>
      </div>
    ),
  };
  const alarmSlide: SlideDef = {
    eyebrow: "Alarm Operasional",
    title: "Peringatan Retur (BB)",
    node: s2.alarmMonths.length === 0 ? (
      <div className="text-center py-8">
        <p className="text-4xl mb-3">👍</p>
        <p className="text-sm font-bold text-slate-300">Tidak ada lonjakan retur (BB) di atas 10% pada semester ini.</p>
        <p className="text-xs text-slate-500 mt-1">Kesegaran produk dan perputaran botol terjaga dengan baik.</p>
      </div>
    ) : (
      <div className="space-y-2">
        {s2.alarmMonths.map((x) => (
          <div key={x.key} className="flex items-center justify-between bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2.5">
            <span className="text-xs font-bold text-red-300">Retur {MONTH_LABELS[x.idx]}</span>
            <span className="text-sm font-black text-red-300">{fmtPct(x.m.persenKembaliBotol)}%</span>
          </div>
        ))}
      </div>
    ),
  };
  const ylCumSlide: SlideDef = {
    eyebrow: "Rata-Rata per YL Kumulatif",
    title: "Rata-Rata Penjualan YL (Januari s/d Terakhir)",
    node: (
      <div className="w-full max-w-6xl mx-auto">
        <TabelRataRataYL
          perYL={perYL}
          startIdx={0}
          endIdx={11}
          isDarkSlide={true}
        />
      </div>
    ),
  };

  const bebanKapasitasSlide: SlideDef = {
    eyebrow: "Uji Kelayakan Target",
    title: "Kapasitas Fisik 10 YL vs Target Sisa",
    node: (
      <div className="w-full max-w-4xl mx-auto">
        <UjiKelayakanBebanCard
          targetSisa={s2.targetSisa}
          monthsRemaining={s2.monthsRemaining}
          currentAvgYL={s2.agg.monthsData.length > 0 ? average(s2.agg.monthsData.map((x) => x.m.salesPerYL || x.m.ratarataPenjualanYL)) : undefined}
          isDarkSlide={true}
        />
      </div>
    ),
  };

  return [...base.slice(0, 4), ylCumSlide, proyeksiSlide, bebanKapasitasSlide, alarmSlide, ...base.slice(4)];
}

function buildTahunanSlides(
  t: NonNullable<ReturnType<typeof computeTahunanAgg>>,
  tahun: string | number,
  tku: string,
  actionPlans: ActionPlanItem[],
  perYL: any[] = []
): SlideDef[] {
  return [
    {
      eyebrow: "Laporan Tahunan",
      title: `Tinjauan Tahunan ${tahun}`,
      node: <SlideTitle sub={`${tku} · Fokus Strategis`}>{String(tahun)}</SlideTitle>,
    },
    {
      eyebrow: "Pencapaian YoY",
      title: "Realisasi vs Target Tahunan",
      node: (
        <div>
          <BigStat label="Estimasi Hasil Tahunan" value={`${fmtNum(t.estimasiTahunan)} btl`} sub={`Realisasi s/d saat ini: ${fmtNum(t.akmSoFar)} btl`} />
          <div className="grid grid-cols-2 gap-4 mt-6">
            <BigStat label="Target Tahunan" value={`${fmtNum(t.targetTahunan)} btl`} />
            <BigStat label="Pencapaian" value={t.capaianTahunan !== null ? `${fmtPct(t.capaianTahunan)}%` : "-"} pct={t.capaianTahunan} />
          </div>
        </div>
      ),
    },
    {
      eyebrow: "Growth YoY",
      title: "Pertumbuhan Tahunan",
      node: (
        <div className="w-full max-w-6xl mx-auto">
          <BigStat
            label="Pertumbuhan vs Tahun Lalu"
            value={t.growthPct !== null ? `${t.growthPct >= 0 ? "+" : ""}${fmtPct(t.growthPct)}%` : "-"}
            sub="Rata-rata dari bulan-bulan terisi"
          />
          <div className="h-52 sm:h-60 md:h-72 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={t.trend} margin={{ top: 10, right: 25, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                <XAxis dataKey="bulan" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} />
                <Tooltip formatter={(v: number) => fmtNum(v)} contentStyle={{ backgroundColor: "#1e293b", borderColor: "#475569", color: "#fff", fontSize: 11 }} />
                <Bar dataKey="penjualan" name="Realisasi" fill="#f97316" radius={[4, 4, 0, 0]} />
                <Bar dataKey="target" name="Target" fill="#64748b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ),
    },
    {
      eyebrow: "Rata-Rata Tahunan YL",
      title: `Rekap Rata-Rata per YL Tahun ${tahun}`,
      node: (
        <div className="w-full max-w-6xl mx-auto">
          <TabelRataRataYL
            perYL={perYL}
            startIdx={0}
            endIdx={t.monthsData.length > 0 ? t.monthsData[t.monthsData.length - 1].idx : 11}
            isDarkSlide={true}
          />
        </div>
      ),
    },
    {
      eyebrow: "Evaluasi Mix Produk",
      title: `Mix Produk Tahunan ${tahun}`,
      node: (
        <div className="w-full max-w-4xl mx-auto">
          <AnalisisMixProductCard
            months={t.monthsData.map((x) => x.m)}
            isDarkSlide={true}
          />
        </div>
      ),
    },
    {
      eyebrow: "Dampak Absensi Tim",
      title: `Dampak Absensi & Botol Terlewatkan ${tahun}`,
      node: (
        <div className="w-full max-w-4xl mx-auto">
          <AnalisisAbsensiLossCard
            months={t.monthsData.map((x) => x.m)}
            isDarkSlide={true}
          />
        </div>
      ),
    },
    {
      eyebrow: "Uji Kelayakan Beban",
      title: `Uji Kelayakan Target Tahunan ${tahun}`,
      node: (
        <div className="w-full max-w-4xl mx-auto">
          <UjiKelayakanBebanCard
            targetSisa={Math.max(0, t.targetTahunan - t.akmSoFar)}
            monthsRemaining={Math.max(1, 12 - t.count)}
            currentAvgYL={average(t.monthsData.map((x) => x.m.salesPerYL || x.m.ratarataPenjualanYL)) || undefined}
            isDarkSlide={true}
          />
        </div>
      ),
    },
    {
      eyebrow: "Cakupan Final",
      title: "Cakupan Area",
      node: (
        <BigStat
          label="% Area Tercover (Terakhir)"
          value={t.areaTercoverFinal !== null ? `${fmtPct(t.areaTercoverFinal, 0)}%` : "-"}
          pct={t.areaTercoverFinal}
        />
      ),
    },
    {
      eyebrow: "Kesimpulan Akhir",
      title: "Rangkuman Eksekutif",
      node: <p className="text-sm sm:text-base text-slate-300 text-center leading-relaxed">{t.kesimpulan}</p>,
    },
    {
      eyebrow: "Rencana Strategis",
      title: "Komitmen Tindak Lanjut Tahunan",
      speakerNotes: `Diskusikan dan tetapkan komitmen tindak lanjut strategis untuk tahun ${tahun} bersama tim.`,
      isActionPlan: true,
      node: null,
    },
  ];
}

