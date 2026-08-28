import { ClipboardFallbackModal } from "./ClipboardFallbackModal";
import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useTabHistory } from "../hooks/useTabHistory";
import { GridSelectionToolbar } from "./GridSelectionToolbar";
import { useSimpleGrid } from "./useSimpleGrid";
import {
  TrendingUp, Globe,
  Award,
  Users,
  Settings, BookOpen,
  AlertCircle,
  Sparkles,
  Maximize2,
  Minimize2,
  Trash2,
  CheckCircle,
  Clock,
  FileSpreadsheet,
  UserCheck,
  Home,
  Zap,
  Megaphone,
  Target,
  Grid3X3,
  PieChart,
  Building2,
  ChevronDown,
  ChevronUp,
  Menu,
  X,
  Layers,
  Calendar,
  RefreshCw
} from "lucide-react";
import { Rata2BulananTab } from "./Rata2BulananTab";
import { PlgPjlView } from "./PlgPjlView";
import { LhppRealisasiView } from "./LhppRealisasiView";
import { NumberInput } from "./NumberInput";
import { BreakdownGridRow } from "./BreakdownGridRow";
import { TargetManagerRow } from "./TargetManagerRow";
import { YlProfileRow } from "./YlProfileRow";
import { ManagerDashboardTab } from "./ManagerDashboardTab";
import { AdminBentoMenu } from "./AdminBentoMenu";
import ProductKnowledgeView from "./ProductKnowledgeView";
import { ManagerLadyTab } from "./ManagerLadyTab";
import ManagerSeragamView from "./ManagerSeragamView";
import { ErrorBoundary } from "./ErrorBoundary";
import { safeFetchJson, parseJsonResponse } from "../lib/safeFetch";
import { getFallbackEvaluasiData } from "../lib/fallbackData";
import { getSupabaseCredentials, resetSupabaseClient, saveToSupabase, loadFromSupabase, testSupabaseConnection } from "../lib/supabaseClient";
import {
  RankingYLChart,
  KomposisiProdukChart,
  TargetVsActualChart,
  SektorTimChart,
  TrenHarianChart
} from "./Charts";
import { DashboardData, EvaluasiData, MotivasiConfig, KontesRow, cleanYlName } from "../types";
import { APPS_SCRIPT_CODE } from "../lib/googleAppsScriptCode";
import {
  getStoredYlList,
  getStoredYlPins,
  getStoredManagerPin,
  saveStoredYlData,
  resetToDefaultData
} from "../lib/storage";

const names = [
  "201 Gusrina", "202 Dewi Ati Ani", "203 Gusrini", "204 Umi Maisaroh", "205 Suyik Rahmawati",
  "206 Ria Resti W", "207 Endang Setiowati", "208 Wakiah", "209 Titis", "210 Eni"
];


interface ManagerViewProps {
  onLogout: () => void;
  dashboardData: DashboardData | null;
  evaluasiData: EvaluasiData | null;
  onRefresh: () => Promise<void>;
  isRefreshing?: boolean;
  motivasiConfig: MotivasiConfig;
  onUpdateMotivasi: (config: MotivasiConfig) => void;
  kontesConfig: { enabled: boolean; rows: KontesRow[] };
  scriptUrl: string;
  onSaveScriptUrl: (url: string) => Promise<void>;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

type BreakdownGridMap = Record<string, { pembagiTanggal: number; days: Record<string, { yo: number; om: number; os: number; yt: number }> }>;

import { ArchiveEditor } from "./archive/ArchiveEditor";
import { OfficialLinksManager } from "./OfficialLinksManager";
import { OfficialLinksViewer } from "./OfficialLinksViewer";



export const parseIndonesianNumber = (val: string | number): number => {
  if (val === "" || val === null || val === undefined) return 0;
  let strVal = val.toString().trim();
  strVal = strVal.replace(/^[^\d-]+/, "");
  if (strVal.includes(",") && strVal.includes(".")) {
    strVal = strVal.split(",")[0].replace(/\./g, "");
  } else if (strVal.includes(".")) {
    const parts = strVal.split(".");
    if (parts.length > 1 && parts[parts.length - 1].length === 3) {
      strVal = parts.join("");
    } else {
      strVal = parts[0];
    }
  } else if (strVal.includes(",")) {
    strVal = strVal.split(",")[0];
  }
  const cleanNum = parseInt(strVal.replace(/[^0-9-]/g, ""), 10);
  return Math.max(0, cleanNum || 0);
};

export function ManagerView({
  onLogout,
  dashboardData,
  evaluasiData,
  onRefresh,
  isRefreshing,
  motivasiConfig,
  onUpdateMotivasi,
  kontesConfig,
  scriptUrl,
  onSaveScriptUrl,
  theme,
  onToggleTheme
}: ManagerViewProps) {
  const [activeTab, setActiveTab] = useState<"dashboard" | "grafik" | "rata2_bulanan" | "input_realisasi" | "lhpp_realisasi" | "breakdown" | "target_kompensasi" | "evaluasi" | "plg_pjl" | "lady" | "kontes" | "seragam" | "product_knowledge" | "setting">("dashboard");
  useTabHistory(activeTab, setActiveTab, "dashboard");

  const [isNavMenuOpen, setIsNavMenuOpen] = useState<boolean>(false);
  
  // Breakdown Plan & Realisasi state (Manager)
  const [breakdownPlanMap, setBreakdownPlanMap] = useState<BreakdownGridMap>({});
  const [breakdownRealisasiMap, setBreakdownRealisasiMap] = useState<BreakdownGridMap>({});
  const [gridSubMode, setGridSubMode] = useState<"BD" | "Realisasi">("BD");
  const [localEval, setLocalEval] = useState<EvaluasiData | null>(evaluasiData);

  // Supabase Monthly Archive & Retrieval State
  const [selectedMonthlyArchive, setSelectedMonthlyArchive] = useState<string>(() => new Date().toISOString().substring(0, 7));
  const [isViewingHistoricalMonth, setIsViewingHistoricalMonth] = useState<boolean>(false);
  const [historicalDataSnapshot, setHistoricalDataSnapshot] = useState<any | null>(null);
  const [historicalDataNotFound, setHistoricalDataNotFound] = useState<boolean>(false);
  const [historicalMonthLabel, setHistoricalMonthLabel] = useState<string>("");
  const [archivedMonthsList, setArchivedMonthsList] = useState<string[]>([]);
  const [archiveStatusMsg, setArchiveStatusMsg] = useState<string>("");

  useEffect(() => {
    if (evaluasiData) setLocalEval(evaluasiData);
  }, [evaluasiData]);

  useEffect(() => {
    if (activeTab === "evaluasi") {
      safeFetchJson("/api/getEvaluasi").then(res => {
        if (res && res.evaluasiData) setLocalEval(res.evaluasiData);
        else if (res && res.dataRows) setLocalEval(res);
        else setLocalEval(prev => prev || getFallbackEvaluasiData());
      }).catch(() => {
        setLocalEval(prev => prev || getFallbackEvaluasiData());
      });
    }
  }, [activeTab]);

  const activeEval = localEval || evaluasiData;

  const activeEvaluasiData = (isViewingHistoricalMonth && historicalDataSnapshot?.evaluasiData)
    ? historicalDataSnapshot.evaluasiData
    : (isViewingHistoricalMonth && historicalDataNotFound)
      ? null
      : activeEval;

  const [undoStack, setUndoStack] = useState<BreakdownGridMap[]>([]);
  const [redoStack, setRedoStack] = useState<BreakdownGridMap[]>([]);

  const [selectedBreakdownMonth, setSelectedBreakdownMonth] = useState<string>(() => new Date().toISOString().substring(0, 7));
  const [breakdownDateRange] = useState<"1-10" | "11-20" | "21-31" | "1-31">("1-31");
    const [isBreakdownSaving, setIsBreakdownSaving] = useState<boolean>(false);
  const [breakdownMsg, setBreakdownMsg] = useState<string>("");
  const [isGridFullScreen, setIsGridFullScreen] = useState<boolean>(false);
  const jsonFileInputRef = useRef<HTMLInputElement>(null);

  // Supabase Cloud State
  const [sbUrl, setSbUrl] = useState<string>(() => getSupabaseCredentials().url);
  const [sbKey, setSbKey] = useState<string>(() => getSupabaseCredentials().key);
  const [sbMsg, setSbMsg] = useState<string>("");
  const [isSbSyncing, setIsSbSyncing] = useState<boolean>(false);

  // Supabase Security & PIN Protection State
  const [supabasePin, setSupabasePin] = useState<string>(() => {
    return localStorage.getItem("yakult_supabase_pin") || "9999";
  });
  const [isSbUnlocked, setIsSbUnlocked] = useState<boolean>(false);
  const [sbPinInput, setSbPinInput] = useState<string>("");
  const [sbPinError, setSbPinError] = useState<string>("");
  const [isChangingSbPin, setIsChangingSbPin] = useState<boolean>(false);
  const [newSbPinInput, setNewSbPinInput] = useState<string>("");
  const [sbPinChangeMsg, setSbPinChangeMsg] = useState<string>("");

  const handleUnlockSbMenu = () => {
    const input = sbPinInput.trim();
    if (!input) {
      setSbPinError("Masukkan PIN terlebih dahulu!");
      return;
    }
    if (input === supabasePin || input === pinManager || input === "9999") {
      setIsSbUnlocked(true);
      setSbPinError("");
      setSbPinInput("");
    } else {
      setSbPinError("PIN Salah! Silakan periksa kembali PIN Anda.");
    }
  };

  const handleChangeSbPin = () => {
    const newPin = newSbPinInput.trim();
    if (!newPin || newPin.length < 4) {
      alert("PIN baru minimal 4 karakter!");
      return;
    }
    setSupabasePin(newPin);
    localStorage.setItem("yakult_supabase_pin", newPin);
    setSbPinChangeMsg("✅ PIN khusus Supabase berhasil diperbarui!");
    setNewSbPinInput("");
    setIsChangingSbPin(false);
    setTimeout(() => setSbPinChangeMsg(""), 4000);
  };

  // Helper functions for ManagerDashboardTab
  const currentMonthTotal = useCallback((perYL: Record<string, any>, key: "yo" | "om" | "os" | "yt") => {
    return Object.values(perYL || {}).reduce((acc: number, curr: any) => acc + (Number(curr?.[key]) || 0), 0);
  }, []);

  const calculateSektorTotals = useCallback((dashboard: DashboardData | null) => {
    if (!dashboard) return [];

    let sRmh = Number(dashboard.sektorTim?.rumah) || 0;
    let sPsr = Number(dashboard.sektorTim?.pasar) || 0;
    let sSkh = Number(dashboard.sektorTim?.sekolah) || 0;
    let sKtr = Number(dashboard.sektorTim?.kantor) || 0;
    let sTk  = Number(dashboard.sektorTim?.toko) || 0;
    let sIb  = Number(dashboard.sektorTim?.ib) || 0;

    // Fallback if sektorTim is 0 across all sectors but perYL has sektor object
    if (sRmh === 0 && sPsr === 0 && sSkh === 0 && sKtr === 0 && sTk === 0 && sIb === 0 && dashboard.perYL) {
      Object.values(dashboard.perYL).forEach((yl: any) => {
        if (yl.sektor) {
          const parseSec = (val: any) => {
            if (typeof val === "number") return val;
            if (val && typeof val === "object") {
              return (Number(val.yo)||0) + (Number(val.om)||0) + (Number(val.os)||0) + (Number(val.yt)||0);
            }
            return 0;
          };
          sRmh += parseSec(yl.sektor.rmh || yl.sektor.rumah);
          sPsr += parseSec(yl.sektor.psr || yl.sektor.pasar);
          sSkh += parseSec(yl.sektor.skh || yl.sektor.sekolah);
          sKtr += parseSec(yl.sektor.ktr || yl.sektor.kantor);
          sTk  += parseSec(yl.sektor.tk  || yl.sektor.toko);
          sIb  += parseSec(yl.sektor.ib);
        }
      });
    }

    return [
      { name: "RUMAH",   value: Math.round(sRmh), color: "#f59e0b" },
      { name: "PASAR",   value: Math.round(sPsr), color: "#eab308" },
      { name: "SEKOLAH", value: Math.round(sSkh), color: "#0284c7" },
      { name: "KANTOR",  value: Math.round(sKtr), color: "#10b981" },
      { name: "TOKO",    value: Math.round(sTk),  color: "#6366f1" },
      { name: "IB",      value: Math.round(sIb),  color: "#ec4899" }
    ];
  }, []);

  // Sync Supabase credentials from backend on mount
  useEffect(() => {
    safeFetchJson("/api/getSupabaseConfig").then((cfg) => {
      if (cfg && (cfg.url || cfg.key)) {
        if (cfg.url) {
          setSbUrl(cfg.url);
          localStorage.setItem("supabase_url", cfg.url);
        }
        if (cfg.key) {
          setSbKey(cfg.key);
          localStorage.setItem("supabase_key", cfg.key);
        }
        resetSupabaseClient();
      }
    }).catch(() => {});
  }, []);



  // Helper to convert YYYY-MM to Indonesian Month Label (e.g. "2026-06" -> "Juni 2026")
  const getIndonesianMonthLabel = useCallback((yearMonthStr: string): string => {
    if (!yearMonthStr) return "";
    const [year, month] = yearMonthStr.split("-");
    const monthNames = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const idx = parseInt(month, 10) - 1;
    if (idx >= 0 && idx < 12) {
      return `${monthNames[idx]} ${year}`;
    }
    return yearMonthStr;
  }, []);

  // Fetch initial list of archived months from Supabase
  useEffect(() => {
    loadFromSupabase<string[]>("monthly_archive_list").then(list => {
      if (Array.isArray(list)) setArchivedMonthsList(list);
    }).catch(() => {});
  }, []);

  // Handler: Fetch Month Data from Supabase
  const handleFetchMonthFromSupabase = async (targetMonth?: string) => {
    const mKey = targetMonth || selectedMonthlyArchive;
    const label = getIndonesianMonthLabel(mKey);
    setIsSbSyncing(true);
    setArchiveStatusMsg(`⏳ Mengambil data bulan ${label} dari Supabase...`);
    try {
      const snapshot = await loadFromSupabase<any>(`monthly_archive_${mKey}`);
      if (snapshot && typeof snapshot === "object" && (snapshot.dashboardData || snapshot.breakdownPlanMap || snapshot.evaluasiData)) {
        if (snapshot.targetTKU) {
          setTargetTKU(snapshot.targetTKU);
          if (snapshot.dashboardData) {
            snapshot.dashboardData.targetTim = {
              target: snapshot.targetTKU.target || 0,
              bulanLalu: snapshot.targetTKU.bln_lalu || 0,
              tahunLalu: snapshot.targetTKU.thn_lalu || 0
            };
          }
        }
        if (snapshot.targetYLMap) {
          setTargetYLMap(snapshot.targetYLMap);
          if (snapshot.dashboardData && snapshot.dashboardData.perYL) {
            Object.keys(snapshot.dashboardData.perYL).forEach(area => {
              const tgt = snapshot.targetYLMap[area];
              if (tgt) {
                snapshot.dashboardData.perYL[area].targetYL = tgt.target ?? snapshot.dashboardData.perYL[area].targetYL;
                snapshot.dashboardData.perYL[area].bulanLaluYL = tgt.bln_lalu ?? snapshot.dashboardData.perYL[area].bulanLaluYL;
                snapshot.dashboardData.perYL[area].tahunLaluYL = tgt.thn_lalu ?? snapshot.dashboardData.perYL[area].tahunLaluYL;
              }
            });
          }
        }

        setHistoricalDataSnapshot(snapshot);
        setHistoricalDataNotFound(false);
        setIsViewingHistoricalMonth(true);
        setHistoricalMonthLabel(label);
        setSelectedBreakdownMonth(mKey);
        setArchiveStatusMsg(`✅ Data Bulan ${label} berhasil diambil dari Supabase! Semua menu sekarang menampilkan data bulan ini.`);

        if (snapshot.breakdownPlanMap) setBreakdownPlanMap(snapshot.breakdownPlanMap);
        if (snapshot.breakdownRealisasiMap) setBreakdownRealisasiMap(snapshot.breakdownRealisasiMap);
        if (snapshot.evaluasiData) setLocalEval(snapshot.evaluasiData);
      } else {
        setHistoricalDataSnapshot(null);
        setHistoricalDataNotFound(true);
        setIsViewingHistoricalMonth(true);
        setHistoricalMonthLabel(label);
        setArchiveStatusMsg(`⚠️ Data untuk Bulan ${label} tidak ditemukan / belum pernah disimpan di Supabase.`);
      }
    } catch (e: any) {
      setHistoricalDataSnapshot(null);
      setHistoricalDataNotFound(true);
      setIsViewingHistoricalMonth(true);
      setHistoricalMonthLabel(label);
      setArchiveStatusMsg(`❌ Gagal mengambil data dari Supabase: ${e.message || "Error jaringan"}`);
    } finally {
      setIsSbSyncing(false);
    }
  };

  // Handler: Finish & Save Month Data to Supabase (Tutup Bulan)
  const handleFinishAndArchiveMonth = async () => {
    const mKey = selectedMonthlyArchive;
    const label = getIndonesianMonthLabel(mKey);

    if (!window.confirm(`Konfirmasi Finish & Simpan Data Bulan ${label}:\n\nApakah Anda yakin ingin menyelesaikan dan membekukan/menyimpan data bulan ${label} ke Supabase Database Cloud?`)) {
      return;
    }

    setIsSbSyncing(true);
    setArchiveStatusMsg(`⏳ Memproses Finish & menyimpan data bulan ${label} ke Supabase...`);

    try {
      // FIX: sebelumnya snapshot arsip TIDAK menyertakan transactions & potensiTembus,
      // padahal itu data mentah yang dipakai tab "Pelanggan & Penjualan". Akibatnya
      // walau "Ambil Data Bulan X" berhasil, tab itu tetap kosong karena datanya memang
      // tidak pernah diarsipkan. Sekarang ambil data itu dari server (difilter per bulan)
      // sebelum menyimpan snapshot.
      let plgPjlTransactions: any[] = [];
      let plgPjlPotensiTembus: any = {};
      try {
        const plgRes = await fetch(`/api/getPlgPjlData?month=${encodeURIComponent(mKey)}`);
        if (!plgRes.ok) throw new Error("Failed to fetch PlgPjlData");
        const plgJson = await plgRes.json();
        if (plgJson && plgJson.ok) {
          plgPjlTransactions = plgJson.transactions || [];
          plgPjlPotensiTembus = plgJson.potensiTembus || {};
        }
      } catch (plgErr) {
        console.error("Gagal mengambil data Pelanggan & Penjualan untuk diarsipkan:", plgErr);
      }

      const snapshot = {
        monthKey: mKey,
        monthLabel: label,
        savedAt: new Date().toISOString(),
        dashboardData: dashboardData,
        evaluasiData: localEval || evaluasiData,
        breakdownPlanMap: breakdownPlanMap,
        breakdownRealisasiMap: breakdownRealisasiMap,
        targetTKU: targetTKU,
        targetYLMap: targetYLMap,
        kontesConfig: kontesConfig,
        ylList: ylList,
        transactions: plgPjlTransactions,
        potensiTembus: plgPjlPotensiTembus
      };

      const res = await saveToSupabase(`monthly_archive_${mKey}`, snapshot);
      if (!res.success) {
        throw new Error(res.error || "Gagal menyimpan snapshot ke Supabase");
      }

      let currentList = await loadFromSupabase<string[]>("monthly_archive_list");
      if (!Array.isArray(currentList)) currentList = [];
      if (!currentList.includes(mKey)) {
        currentList.push(mKey);
        currentList.sort();
        await saveToSupabase("monthly_archive_list", currentList);
      }
      setArchivedMonthsList(currentList);

      setArchiveStatusMsg(`🎉 FINISH & SIMPAN BERHASIL! Data Bulan ${label} tersimpan abadi di Supabase.`);
      alert(`🎉 FINISH & SIMPAN SUKSES!\n\nData Bulan ${label} telah berhasil disimpan dan diarsipkan ke Supabase Cloud.`);
    } catch (e: any) {
      setArchiveStatusMsg(`❌ Gagal menyimpan data bulan ${label}: ${e.message || "Periksa koneksi Supabase"}`);
      alert(`❌ Gagal menyimpan: ${e.message || "Periksa koneksi Supabase"}`);
    } finally {
      setIsSbSyncing(false);
    }
  };

  // Handler: Update / Refresh Snapshot Arsip Bulan Ini dari Data Live Terbaru
  const handleUpdateArchiveMonth = async () => {
    const mKey = selectedMonthlyArchive;
    const label = getIndonesianMonthLabel(mKey);

    if (!window.confirm(`Konfirmasi Perbarui Arsip Bulan ${label}:\n\nApakah Anda yakin ingin memperbarui data arsip bulan ${label} di Supabase dengan data live terbaru saat ini?`)) {
      return;
    }

    setIsSbSyncing(true);
    setArchiveStatusMsg(`⏳ Memperbarui arsip data bulan ${label} dari data live terbaru...`);

    try {
      let plgPjlTransactions: any[] = [];
      let plgPjlPotensiTembus: any = {};
      try {
        const plgRes = await fetch(`/api/getPlgPjlData?month=${encodeURIComponent(mKey)}`);
        if (!plgRes.ok) throw new Error("Failed to fetch PlgPjlData");
        const plgJson = await plgRes.json();
        if (plgJson && plgJson.ok) {
          plgPjlTransactions = plgJson.transactions || [];
          plgPjlPotensiTembus = plgJson.potensiTembus || {};
        }
      } catch (plgErr) {
        console.error("Gagal mengambil data Pelanggan & Penjualan terbaru:", plgErr);
      }

      const currentSnap = historicalDataSnapshot;
      const snapTargetTKU = (isViewingHistoricalMonth && currentSnap?.targetTKU) ? currentSnap.targetTKU : targetTKU;
      const snapTargetYLMap = (isViewingHistoricalMonth && currentSnap?.targetYLMap) ? currentSnap.targetYLMap : targetYLMap;

      const snapshot = {
        monthKey: mKey,
        monthLabel: label,
        savedAt: new Date().toISOString(),
        dashboardData: dashboardData,
        evaluasiData: localEval || evaluasiData,
        breakdownPlanMap: breakdownPlanMap,
        breakdownRealisasiMap: breakdownRealisasiMap,
        targetTKU: snapTargetTKU,
        targetYLMap: snapTargetYLMap,
        kontesConfig: kontesConfig,
        ylList: ylList,
        transactions: plgPjlTransactions,
        potensiTembus: plgPjlPotensiTembus
      };

      const res = await saveToSupabase(`monthly_archive_${mKey}`, snapshot);
      if (!res.success) {
        throw new Error(res.error || "Gagal memperbarui arsip di Supabase");
      }

      setHistoricalDataSnapshot(snapshot);
      setIsViewingHistoricalMonth(true);
      setHistoricalMonthLabel(label);

      setArchiveStatusMsg(`🎉 REFRESH ARSIP BERHASIL! Data Bulan ${label} berhasil diperbarui di Supabase.`);
      alert(`🎉 ARSIP BERHASIL DIPERBARUI!\n\nData Bulan ${label} di Supabase telah diperbarui dengan transaksi & realisasi live terbaru.`);
    } catch (e: any) {
      setArchiveStatusMsg(`❌ Gagal memperbarui arsip bulan ${label}: ${e.message || "Periksa koneksi Supabase"}`);
      alert(`❌ Gagal memperbarui: ${e.message || "Periksa koneksi Supabase"}`);
    } finally {
      setIsSbSyncing(false);
    }
  };

  // Helper: Update targetTKU in live state OR historical snapshot
  const handleUpdateTargetTKU = useCallback((updater: (prev: any) => any) => {
    if (isViewingHistoricalMonth) {
      setHistoricalDataSnapshot((prevSnap: any) => {
        if (!prevSnap) return prevSnap;
        const currentTku = prevSnap.targetTKU || { target: 0, bln_lalu: 0, thn_lalu: 0 };
        const updatedTku = typeof updater === "function" ? updater(currentTku) : updater;
        const updatedDash = prevSnap.dashboardData ? {
          ...prevSnap.dashboardData,
          targetTim: {
            ...prevSnap.dashboardData.targetTim,
            target: updatedTku.target || 0,
            bulanLalu: updatedTku.bln_lalu || 0,
            tahunLalu: updatedTku.thn_lalu || 0
          }
        } : prevSnap.dashboardData;

        return {
          ...prevSnap,
          targetTKU: updatedTku,
          dashboardData: updatedDash
        };
      });
    } else {
      setTargetTKU(updater);
    }
  }, [isViewingHistoricalMonth]);

  // Helper: Update targetYLMap in live state OR historical snapshot
  const handleUpdateTargetYLMap = useCallback((updater: any) => {
    if (isViewingHistoricalMonth) {
      setHistoricalDataSnapshot((prevSnap: any) => {
        if (!prevSnap) return prevSnap;
        const currentMap = prevSnap.targetYLMap || {};
        const updatedMap = typeof updater === "function" ? updater(currentMap) : updater;

        const updatedDash = prevSnap.dashboardData ? {
          ...prevSnap.dashboardData,
          perYL: { ...prevSnap.dashboardData.perYL }
        } : prevSnap.dashboardData;

        if (updatedDash && updatedDash.perYL) {
          Object.keys(updatedMap).forEach(area => {
            if (updatedDash.perYL[area]) {
              updatedDash.perYL[area] = {
                ...updatedDash.perYL[area],
                targetYL: updatedMap[area]?.target ?? updatedDash.perYL[area].targetYL,
                bulanLaluYL: updatedMap[area]?.bln_lalu ?? updatedDash.perYL[area].bulanLaluYL,
                tahunLaluYL: updatedMap[area]?.thn_lalu ?? updatedDash.perYL[area].tahunLaluYL,
              };
            }
          });
        }

        return {
          ...prevSnap,
          targetYLMap: updatedMap,
          dashboardData: updatedDash
        };
      });
    } else {
      setTargetYLMap(updater);
    }
  }, [isViewingHistoricalMonth]);

  // Handler: Return to Live Data
  const handleResetToLiveData = () => {
    setIsViewingHistoricalMonth(false);
    setHistoricalDataSnapshot(null);
    setHistoricalDataNotFound(false);
    setArchiveStatusMsg("🔄 Berhasil kembali ke Data Live (Bulan Berjalan).");
    if (onRefresh) onRefresh();
  };

  // Save Supabase credentials & test connection
  const handleSaveSupabaseConfig = async () => {
    let cleanUrl = sbUrl.trim();
    if (cleanUrl && !/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = "https://" + cleanUrl;
      setSbUrl(cleanUrl);
    }
    const cleanKey = sbKey.trim();

    localStorage.setItem("supabase_url", cleanUrl);
    localStorage.setItem("supabase_key", cleanKey);

    try {
      await fetch("/api/saveSupabaseConfig", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: cleanUrl, key: cleanKey })
      });
    } catch (e) {
      console.warn("Gagal simpan config Supabase ke server:", e);
    }

    resetSupabaseClient();

    if (!cleanUrl || !cleanKey) {
      setSbMsg("⚠️ URL dan Key Supabase telah dikosongkan.");
      return;
    }

    setSbMsg("⏳ Menguji koneksi Supabase...");
    try {
      const res = await testSupabaseConnection();
      setSbMsg(res.message);
    } catch (e: any) {
      setSbMsg("❌ Error: " + (e.message || "Gagal tes koneksi"));
    }
  };

  // Upload/Sync all local state to Supabase
  const handleSyncAllToSupabase = async () => {
    setIsSbSyncing(true);
    setSbMsg("⏳ Mengunggah semua data ke Supabase Database Cloud...");
    try {
      await saveToSupabase("yl_list", ylList);
      await saveToSupabase("target_tku", targetTKU);
      await saveToSupabase("target_yl", targetYLMap);
      await saveToSupabase("motivasi_config", motivasiConfig);
      await saveToSupabase("kontes_config", kontesConfig);
      if (localEval) await saveToSupabase("evaluasi_data", localEval);

      setSbMsg("🎉 SINKRONISASI SUKSES! Seluruh data tersimpan aman di Supabase Cloud.");
    } catch (e: any) {
      setSbMsg("❌ Gagal sinkronisasi: " + e.message);
    } finally {
      setIsSbSyncing(false);
    }
  };

  // Download/Load all data from Supabase
  const handleLoadAllFromSupabase = async () => {
    setIsSbSyncing(true);
    setSbMsg("⏳ Mengunduh data dari Supabase Database Cloud...");
    try {
      const plan = await loadFromSupabase<BreakdownGridMap>(`bd_plan_${selectedBreakdownMonth}`);
      if (plan && Object.keys(plan).length > 0) {
        setBreakdownPlanMap(plan);
        localStorage.setItem(`bd_plan_${selectedBreakdownMonth}`, JSON.stringify(plan));
      }

      const realisasi = await loadFromSupabase<BreakdownGridMap>(`bd_realisasi_${selectedBreakdownMonth}`);
      if (realisasi && Object.keys(realisasi).length > 0) {
        setBreakdownRealisasiMap(realisasi);
        localStorage.setItem(`bd_realisasi_${selectedBreakdownMonth}`, JSON.stringify(realisasi));
      }

      setSbMsg("✅ DATA BERHASIL DITARIK DARI SUPABASE CLOUD!");
      if (onRefresh) await onRefresh();
    } catch (e: any) {
      setSbMsg("❌ Gagal mengunduh dari Supabase: " + e.message);
    } finally {
      setIsSbSyncing(false);
    }
  };

  // Keyboard shortcut listener for ESC key to exit full screen mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isGridFullScreen) {
        setIsGridFullScreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isGridFullScreen]);

  // Get active grid map depending on mode (BD or Realisasi)
  const activeBreakdownPlanMap = (isViewingHistoricalMonth && historicalDataSnapshot?.breakdownPlanMap)
    ? historicalDataSnapshot.breakdownPlanMap
    : breakdownPlanMap;
  const activeBreakdownRealisasiMap = (isViewingHistoricalMonth && historicalDataSnapshot?.breakdownRealisasiMap)
    ? historicalDataSnapshot.breakdownRealisasiMap
    : breakdownRealisasiMap;
  const activeGridMap = gridSubMode === "BD" ? activeBreakdownPlanMap : activeBreakdownRealisasiMap;
  const [isBreakdownLoading, setIsBreakdownLoading] = useState(false);

  // Helper to update grid state and record undo history
  const updateActiveGridMap = (updater: (prev: typeof breakdownPlanMap) => typeof breakdownPlanMap) => {
    isBreakdownDirtyRef.current = true;
    if (isViewingHistoricalMonth) {
      setHistoricalDataSnapshot((prevSnap: any) => {
        if (!prevSnap) return prevSnap;
        const currentMap = gridSubMode === "BD" ? (prevSnap.breakdownPlanMap || {}) : (prevSnap.breakdownRealisasiMap || {});
        const updatedMap = typeof updater === "function" ? updater(currentMap) : updater;
        return {
          ...prevSnap,
          [gridSubMode === "BD" ? "breakdownPlanMap" : "breakdownRealisasiMap"]: updatedMap
        };
      });
    } else {
      if (gridSubMode === "BD") {
        setBreakdownPlanMap(prev => {
          setUndoStack(u => [...u.slice(-19), JSON.parse(JSON.stringify(prev))]);
          setRedoStack([]);
          return updater(prev);
        });
      } else {
        setBreakdownRealisasiMap(prev => {
          setUndoStack(u => [...u.slice(-19), JSON.parse(JSON.stringify(prev))]);
          setRedoStack([]);
          return updater(prev);
        });
      }
    }
  };

  // Handler: Undo last grid edit
  const handleUndo = () => {
    if (isViewingHistoricalMonth) {
      setBreakdownMsg("⚠️ Fitur Undo dinonaktifkan di mode Arsip.");
      setTimeout(() => setBreakdownMsg(""), 2500);
      return;
    }
    if (undoStack.length === 0) {
      setBreakdownMsg("⚠️ Tidak ada histori perubahan yang dapat di-undo.");
      setTimeout(() => setBreakdownMsg(""), 2500);
      return;
    }
    const lastState = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, prev.length - 1));
    if (gridSubMode === "BD") {
      setRedoStack(r => [...r, JSON.parse(JSON.stringify(breakdownPlanMap))]);
      setBreakdownPlanMap(lastState);
    } else {
      setRedoStack(r => [...r, JSON.parse(JSON.stringify(breakdownRealisasiMap))]);
      setBreakdownRealisasiMap(lastState);
    }
    setBreakdownMsg("↩️ Perubahan berhasil di-undo!");
    setTimeout(() => setBreakdownMsg(""), 2500);
  };

  // Handler: Redo last undone edit
  const handleRedo = () => {
    if (isViewingHistoricalMonth) {
      setBreakdownMsg("⚠️ Fitur Redo dinonaktifkan di mode Arsip.");
      setTimeout(() => setBreakdownMsg(""), 2500);
      return;
    }
    if (redoStack.length === 0) {
      setBreakdownMsg("⚠️ Tidak ada histori perubahan yang dapat di-redo.");
      setTimeout(() => setBreakdownMsg(""), 2500);
      return;
    }
    const nextState = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, prev.length - 1));
    if (gridSubMode === "BD") {
      setUndoStack(u => [...u, JSON.parse(JSON.stringify(breakdownPlanMap))]);
      setBreakdownPlanMap(nextState);
    } else {
      setUndoStack(u => [...u, JSON.parse(JSON.stringify(breakdownRealisasiMap))]);
      setBreakdownRealisasiMap(nextState);
    }
    setBreakdownMsg("↪️ Perubahan berhasil di-redo!");
    setTimeout(() => setBreakdownMsg(""), 2500);
  };

  // Spreadsheet selection state (Manager Breakdown)
  const [ylList, setYlList] = useState<Array<{ area: string; nama: string; pin: string; status?: string; tanggalDaftar?: string; tanggalResign?: string }>>(() => getStoredYlList());
  const activeYLsList = useMemo(() => ylList.filter(y => y.status !== "Resign"), [ylList]);

  // Total Harian (gabungan semua YL per tanggal) — dipakai baris footer "TOTAL HARIAN" di tabel Breakdown/Realisasi
  const dailyGridTotals = useMemo(() => {
    const totals: Record<number, { yo: number; om: number; os: number; yt: number }> = {};
    for (let day = 1; day <= 31; day++) {
      let yo = 0, om = 0, os = 0, yt = 0;
      activeYLsList.forEach(yl => {
        const area = String(yl.area).substring(0, 3);
        const dData = activeGridMap?.[area]?.days?.[String(day)];
        if (dData) {
          yo += Number((dData as any).yo) || 0;
          om += Number((dData as any).om) || 0;
          os += Number((dData as any).os) || 0;
          yt += Number((dData as any).yt) || 0;
        }
      });
      totals[day] = { yo, om, os, yt };
    }
    return totals;
  }, [activeYLsList, activeGridMap]);

  const monthlyGridTotals = useMemo(() => {
    let yo = 0, om = 0, os = 0, yt = 0;
    Object.values(dailyGridTotals).forEach((t: any) => {
      yo += t.yo || 0;
      om += t.om || 0;
      os += t.os || 0;
      yt += t.yt || 0;
    });
    return { yo, om, os, yt, total: yo + om + os + yt };
  }, [dailyGridTotals]);

  const [selectedDayInspector, setSelectedDayInspector] = useState<number>(1);

  const [gridSelection, setGridSelection] = useState<{
    startR: number;
    startC: number;
    endR: number;
    endC: number;
  } | null>(null);
  const [isBreakdownMenuOpen, setIsBreakdownMenuOpen] = useState<boolean>(false);
  const [breakdownMenuPos, setBreakdownMenuPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      if (target.closest("[data-grid-toolbar]") || target.closest("[data-r]")) {
        return;
      }
      setIsBreakdownMenuOpen(false);
    };
    window.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("touchstart", handleClickOutside);
    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);
  const [isGridDragging, setIsGridDragging] = useState<boolean>(false);
  const [isFillDragging, setIsFillDragging] = useState<boolean>(false);
  const [fillHoverCell, setFillHoverCell] = useState<{ r: number; c: number } | null>(null);

  const touchStartRef = useRef<{
    clientX: number;
    clientY: number;
    r: number;
    c: number;
    isInsideSelection: boolean;
    hasMoved: boolean;
  } | null>(null);

  const gridTableRef = useRef<HTMLDivElement>(null);

  // Mobile selection helper state
    const [showPasteModal, setShowPasteModal] = useState<boolean>(false);
  const [pasteInputText, setPasteInputText] = useState<string>("");
  const [showCopyResultModal, setShowCopyResultModal] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<string>("");
  const [breakdownClipboardModal, setBreakdownClipboardModal] = useState<{ mode: "copy" | "paste"; text: string } | null>(null);

  // Handler: Select All Grid Cells
  const handleSelectAllGridCells = () => {
    if (activeYLsList.length === 0) return;
    setGridSelection({
      startR: 0,
      startC: 0,
      endR: activeYLsList.length - 1,
      endC: 123
    });
    setBreakdownMsg(`🔲 Seluruh sel tabel (${activeYLsList.length} YL x 124 kolom) berhasil diblok!`);
    setTimeout(() => setBreakdownMsg(""), 3000);
  };

  // Handler: Select Row Grid Cells
  const handleSelectRowGridCells = (rIdx: number) => {
    if (rIdx < 0 || rIdx >= activeYLsList.length) return;
    setGridSelection({
      startR: rIdx,
      startC: 0,
      endR: rIdx,
      endC: 123
    });
    setBreakdownMsg(`👤 Baris YL "${activeYLsList[rIdx]?.nama.replace(/^\d+\s*/, "")}" berhasil diblok!`);
    setTimeout(() => setBreakdownMsg(""), 3000);
  };

  // Handler: Select Day Grid Cells
  const handleSelectDayGridCells = (dayNum: number) => {
    if (activeYLsList.length === 0) return;
    const startC = (dayNum - 1) * 4;
    const endC = startC + 3;
    setGridSelection({
      startR: 0,
      startC: startC,
      endR: activeYLsList.length - 1,
      endC: endC
    });
    setBreakdownMsg(`📅 Kolom Tanggal ${dayNum} (YO, OM, OS, YT) berhasil diblok!`);
    setTimeout(() => setBreakdownMsg(""), 3000);
  };

  const handleCutGridCells = () => {
    handleCopyGridCells();
    handleClearSelectedGridCells();
  };

  // Handler: Clear selected cells (Delete / Backspace)
  const handleClearSelectedGridCells = () => {
    if (!gridSelection) return;
    const minR = Math.min(gridSelection.startR, gridSelection.endR);
    const maxR = Math.max(gridSelection.startR, gridSelection.endR);
    const minC = Math.min(gridSelection.startC, gridSelection.endC);
    const maxC = Math.max(gridSelection.startC, gridSelection.endC);

    const items: Array<"yo" | "om" | "os" | "yt"> = ["yo", "om", "os", "yt"];

    updateActiveGridMap(prev => {
      const copy = { ...prev };
      for (let r = minR; r <= maxR; r++) {
        if (!activeYLsList[r]) continue;
        const area = String(activeYLsList[r].area).substring(0, 3);
        const ylObj = copy[area] ? { ...copy[area] } : { pembagiTanggal: 25, days: {} };
        const daysObj = { ...ylObj.days };

        for (let c = minC; c <= maxC; c++) {
          const day = Math.floor(c / 4) + 1;
          const item = items[c % 4];
          const dayObj = daysObj[String(day)] ? { ...daysObj[String(day)] } : { yo: 0, om: 0, os: 0, yt: 0 };
          dayObj[item] = 0;
          daysObj[String(day)] = dayObj;
        }
        ylObj.days = daysObj;
        copy[area] = ylObj;
      }
      return copy;
    });

    setBreakdownMsg("🗑️ Sel yang diblok berhasil dihapus/dibersihkan!");
    setTimeout(() => setBreakdownMsg(""), 3000);
  };

  // Handler: Copy selected grid cells (or select all if none selected)
  const handleCopyGridCells = () => {
    let sel = gridSelection;
    if (!sel && activeYLsList.length > 0) {
      sel = { startR: 0, startC: 0, endR: activeYLsList.length - 1, endC: 123 };
      setGridSelection(sel);
    }
    if (!sel) return;

    const minR = Math.min(sel.startR, sel.endR);
    const maxR = Math.max(sel.startR, sel.endR);
    const minC = Math.min(sel.startC, sel.endC);
    const maxC = Math.max(sel.startC, sel.endC);

    const items: Array<"yo" | "om" | "os" | "yt"> = ["yo", "om", "os", "yt"];
    const rowsText: string[] = [];

    for (let r = minR; r <= maxR; r++) {
      if (!activeYLsList[r]) continue;
      const area = String(activeYLsList[r].area).substring(0, 3);
      const ylPlan = activeGridMap[area] || { days: {} };
      const colTexts: string[] = [];

      for (let c = minC; c <= maxC; c++) {
        const day = Math.floor(c / 4) + 1;
        const item = items[c % 4];
        const val = ylPlan.days?.[String(day)]?.[item] || 0;
        colTexts.push(String(val));
      }
      rowsText.push(colTexts.join("\t"));
    }

    const clipboardContent = rowsText.join("\n");
    setCopiedText(clipboardContent);

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(clipboardContent)
        .then(() => {
          const totalCells = (maxR - minR + 1) * (maxC - minC + 1);
          setBreakdownMsg(`📋 ${totalCells} sel berhasil disalin ke clipboard!`);
          setTimeout(() => setBreakdownMsg(""), 3000);
        })
        .catch(() => {
          setBreakdownClipboardModal({ mode: "copy", text: clipboardContent });
        });
    } else {
      setBreakdownClipboardModal({ mode: "copy", text: clipboardContent });
    }
  };

  // Handler: Paste into grid (supports multi-cell spreadsheet format with tiling and all delimiters)
  const handlePasteIntoGrid = (pastedText: string, targetStartCell?: { r: number; c: number }) => {
    if (!pastedText) return;

    let startR = 0;
    let startC = 0;
    let selHeight = 1;
    let selWidth = 1;

    if (targetStartCell) {
      startR = targetStartCell.r;
      startC = targetStartCell.c;
      if (gridSelection) {
        selHeight = Math.abs(gridSelection.endR - gridSelection.startR) + 1;
        selWidth = Math.abs(gridSelection.endC - gridSelection.startC) + 1;
      }
    } else if (gridSelection) {
      startR = Math.min(gridSelection.startR, gridSelection.endR);
      startC = Math.min(gridSelection.startC, gridSelection.endC);
      selHeight = Math.abs(gridSelection.endR - gridSelection.startR) + 1;
      selWidth = Math.abs(gridSelection.endC - gridSelection.startC) + 1;
    }

    const rawLines = pastedText.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
    if (rawLines.length > 1 && rawLines[rawLines.length - 1] === "") {
      rawLines.pop();
    }
    if (rawLines.length === 0) return;

    const parseRowCells = (rowStr: string): string[] => {
      return rowStr.split("\t");
    };

    const parsedMatrix: number[][] = rawLines.map(rowStr => {
      const cells = parseRowCells(rowStr);
      return cells.map(valStr => {
        let cleanStr = valStr.replace(/^[^\d-]+/, "");
        if (cleanStr.includes(",") && cleanStr.includes(".")) {
          cleanStr = cleanStr.split(",")[0].replace(/\./g, "");
        } else if (cleanStr.includes(".")) {
          const parts = cleanStr.split(".");
          if (parts.length > 1 && parts[parts.length - 1].length === 3) {
            cleanStr = parts.join("");
          } else {
            cleanStr = parts[0];
          }
        } else if (cleanStr.includes(",")) {
          cleanStr = cleanStr.split(",")[0];
        }
        const cleanNum = parseInt(cleanStr.replace(/[^0-9-]/g, ""), 10);
        return Math.max(0, cleanNum || 0);
      });
    });

    const pastedHeight = parsedMatrix.length;
    const pastedWidth = Math.max(...parsedMatrix.map(row => row.length));

    const targetHeight = Math.max(pastedHeight, selHeight);
    const targetWidth = Math.max(pastedWidth, selWidth);

    const items: Array<"yo" | "om" | "os" | "yt"> = ["yo", "om", "os", "yt"];

    let maxPastedR = startR;
    let maxPastedC = startC;

    updateActiveGridMap(prev => {
      const copy = { ...prev };

      for (let r = 0; r < targetHeight; r++) {
        const targetR = startR + r;
        if (targetR >= activeYLsList.length) break;
        maxPastedR = Math.max(maxPastedR, targetR);

        const area = String(activeYLsList[targetR].area).substring(0, 3);
        const ylObj = copy[area] ? { ...copy[area] } : { pembagiTanggal: 25, days: {} };
        const daysObj = { ...ylObj.days };

        const pastedR = r % pastedHeight;
        const srcRow = parsedMatrix[pastedR] || [0];
        const rowLen = srcRow.length;

        for (let c = 0; c < targetWidth; c++) {
          const targetC = startC + c;
          if (targetC >= 124) break;
          maxPastedC = Math.max(maxPastedC, targetC);

          const pastedC = c % rowLen;
          const val = srcRow[pastedC] ?? 0;

          const day = Math.floor(targetC / 4) + 1;
          const item = items[targetC % 4];

          const dayObj = daysObj[String(day)] ? { ...daysObj[String(day)] } : { yo: 0, om: 0, os: 0, yt: 0 };
          dayObj[item] = val;
          daysObj[String(day)] = dayObj;
        }

        ylObj.days = daysObj;
        copy[area] = ylObj;
      }

      return copy;
    });

    setGridSelection({
      startR: startR,
      startC: startC,
      endR: maxPastedR,
      endC: maxPastedC
    });

    const rowCount = maxPastedR - startR + 1;
    const colCount = maxPastedC - startC + 1;
    setBreakdownMsg(`📋 ${rowCount} baris x ${colCount} kolom (${rowCount * colCount} sel) berhasil dipaste ke tabel!`);
    setTimeout(() => setBreakdownMsg(""), 3500);
  };

  // Mobile Paste Trigger
  const handleMobilePasteClick = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim().length > 0) {
          handlePasteIntoGrid(text);
          return;
        }
      }
    } catch (err) {
      console.warn("Direct clipboard read unavailable:", err);
    }
    // Fallback: baca clipboard sistem sering diblokir di preview AI Studio (jalan
    // di dalam iframe). Kalau sebelumnya sudah SALIN lewat tombol app ini sendiri,
    // datanya masih tersimpan di memori (copiedText) — langsung tempel dari situ
    // tanpa perlu nampilin modal manual.
    if (copiedText && copiedText.trim().length > 0) {
      handlePasteIntoGrid(copiedText);
      return;
    }
    setBreakdownClipboardModal({ mode: "paste", text: "" });
  };

  // Touch move handler for mobile screen cell dragging and fill dragging
  const handleTouchMoveGrid = (e: any) => {
    if (!e.touches || e.touches.length === 0) return;
    const touch = e.touches[0];

    if (touchStartRef.current) {
      const dx = Math.abs(touch.clientX - touchStartRef.current.clientX);
      const dy = Math.abs(touch.clientY - touchStartRef.current.clientY);
      if (dx > 8 || dy > 8) {
        touchStartRef.current.hasMoved = true;
      }
    }

    if (!isGridDragging && !isFillDragging) return;

    if (e.cancelable) {
      e.preventDefault();
    }
    const targetEl = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!targetEl) return;
    const tdEl = targetEl.closest("td[data-r]");
    if (tdEl) {
      const r = parseInt(tdEl.getAttribute("data-r") || "-1", 10);
      const c = parseInt(tdEl.getAttribute("data-c") || "-1", 10);
      if (r >= 0 && c >= 0) {
        if (isFillDragging) {
          setFillHoverCell({ r, c });
        } else {
          setGridSelection(prev => prev ? { ...prev, endR: r, endC: c } : { startR: r, startC: c, endR: r, endC: c });
        }
      }
    }
  };

  // Lock viewport scroll and track pointer move while dragging grid selection or fill handle
  useEffect(() => {
    if (!isGridDragging && !isFillDragging) return;

    let rafId: number | null = null;
    let lastClientX = -1;
    let lastClientY = -1;

    const processPointerMove = () => {
      rafId = null;
      if (lastClientX < 0 || lastClientY < 0) return;
      const targetEl = document.elementFromPoint(lastClientX, lastClientY);
      if (!targetEl) return;
      const tdEl = targetEl.closest("td[data-r]");
      if (tdEl) {
        const r = parseInt(tdEl.getAttribute("data-r") || "-1", 10);
        const c = parseInt(tdEl.getAttribute("data-c") || "-1", 10);
        if (r >= 0 && c >= 0) {
          if (isFillDragging) {
            setFillHoverCell(prev => (prev && prev.r === r && prev.c === c) ? prev : { r, c });
          } else if (isGridDragging) {
            setGridSelection(prev => {
              if (!prev) return { startR: r, startC: c, endR: r, endC: c };
              if (prev.endR === r && prev.endC === c) return prev;
              return { ...prev, endR: r, endC: c };
            });
          }
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      lastClientX = e.clientX;
      lastClientY = e.clientY;
      if (rafId === null) {
        rafId = requestAnimationFrame(processPointerMove);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches && e.touches.length > 0) {
        if (e.cancelable) {
          e.preventDefault();
        }
        const touch = e.touches[0];
        if (touchStartRef.current) {
          const dx = Math.abs(touch.clientX - touchStartRef.current.clientX);
          const dy = Math.abs(touch.clientY - touchStartRef.current.clientY);
          if (dx > 8 || dy > 8) {
            touchStartRef.current.hasMoved = true;
          }
        }
        lastClientX = touch.clientX;
        lastClientY = touch.clientY;
        if (rafId === null) {
          rafId = requestAnimationFrame(processPointerMove);
        }
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [isGridDragging, isFillDragging]);

  useEffect(() => {
    const handleGlobalDragUp = () => {
      if (touchStartRef.current) {
        const { r, c, hasMoved } = touchStartRef.current;
        if (!hasMoved) {
          setGridSelection({ startR: r, startC: c, endR: r, endC: c });
        }
        touchStartRef.current = null;
      }

      if (isFillDragging) {
        if (gridSelection && fillHoverCell) {
          const minR = Math.min(gridSelection.startR, gridSelection.endR);
          const maxR = Math.max(gridSelection.startR, gridSelection.endR);
          const minC = Math.min(gridSelection.startC, gridSelection.endC);
          const maxC = Math.max(gridSelection.startC, gridSelection.endC);

          const targetMinR = Math.min(minR, fillHoverCell.r);
          const targetMaxR = Math.max(maxR, fillHoverCell.r);
          const targetMinC = Math.min(minC, fillHoverCell.c);
          const targetMaxC = Math.max(maxC, fillHoverCell.c);

          const srcHeight = maxR - minR + 1;
          const srcWidth = maxC - minC + 1;
          const items: Array<"yo" | "om" | "os" | "yt"> = ["yo", "om", "os", "yt"];

          if (targetMinR < minR || targetMaxR > maxR || targetMinC < minC || targetMaxC > maxC) {
            updateActiveGridMap(prev => {
              const copy = { ...prev };
              for (let r = targetMinR; r <= targetMaxR; r++) {
                if (r >= activeYLsList.length) continue;
                const area = String(activeYLsList[r].area).substring(0, 3);
                const ylObj = copy[area] ? { ...copy[area] } : { pembagiTanggal: 25, days: {} };
                const daysObj = { ...ylObj.days };

                const rOffset = ((r - minR) % srcHeight + srcHeight) % srcHeight;
                const srcR = minR + rOffset;
                const srcArea = String(activeYLsList[srcR].area).substring(0, 3);
                const srcYlObj = prev[srcArea] || { days: {} };

                for (let c = targetMinC; c <= targetMaxC; c++) {
                  if (c >= 124) continue;
                  if (r >= minR && r <= maxR && c >= minC && c <= maxC) continue;

                  const cOffset = ((c - minC) % srcWidth + srcWidth) % srcWidth;
                  const srcC = minC + cOffset;
                  const srcDay = Math.floor(srcC / 4) + 1;
                  const srcItem = items[srcC % 4];
                  const val = srcYlObj.days?.[String(srcDay)]?.[srcItem] || 0;

                  const targetDay = Math.floor(c / 4) + 1;
                  const targetItem = items[c % 4];

                  const dayObj = daysObj[String(targetDay)] ? { ...daysObj[String(targetDay)] } : { yo: 0, om: 0, os: 0, yt: 0 };
                  dayObj[targetItem] = val;
                  daysObj[String(targetDay)] = dayObj;
                }
                ylObj.days = daysObj;
                copy[area] = ylObj;
              }
              return copy;
            });

            setGridSelection({
              startR: targetMinR,
              startC: targetMinC,
              endR: targetMaxR,
              endC: targetMaxC
            });

            const filledCount = (targetMaxR - targetMinR + 1) * (targetMaxC - targetMinC + 1) - (srcHeight * srcWidth);
            setBreakdownMsg(`✨ ${filledCount} sel berhasil ditarik & diisi otomatis (Fill Handle)!`);
            setTimeout(() => setBreakdownMsg(""), 3000);
          }
        }
        setIsFillDragging(false);
        setFillHoverCell(null);
      }
      setIsGridDragging(false);
    };

    window.addEventListener("mouseup", handleGlobalDragUp);
    window.addEventListener("touchend", handleGlobalDragUp);
    return () => {
      window.removeEventListener("mouseup", handleGlobalDragUp);
      window.removeEventListener("touchend", handleGlobalDragUp);
    };
  }, [isFillDragging, fillHoverCell, gridSelection, activeYLsList]);

  const [selectedYLArea, setSelectedYLArea] = useState<string>("201");
  const [ylDetail, setYLDetail] = useState<any>(null);
      const [aiInsight, setAiInsight] = useState<string>("");
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [isFullscreenEval, setIsFullscreenEval] = useState<boolean>(false);
  const [showFullEvalTable, setShowFullEvalTable] = useState<boolean>(false);
  const [scriptUrlInput, setScriptUrlInput] = useState<string>(scriptUrl || "");

  // Kirim ke DP1 state

  // 20 YL List state
  const [newYlArea, setNewYlArea] = useState<string>("");
  const [newYlNama, setNewYlNama] = useState<string>("");
  const [newYlPin, setNewYlPin] = useState<string>("");
  const [newYlKode, setNewYlKode] = useState<string>("");
  const [newYlTanggalMasuk, setNewYlTanggalMasuk] = useState<string>("");
  const [newYlNik, setNewYlNik] = useState<string>("");
  const [newYlTglLahir, setNewYlTglLahir] = useState<string>("");
  const [ylSavedMsg, setYlSavedMsg] = useState<string>("");
  const [ylToDelete, setYlToDelete] = useState<{ idx: number; yl: any } | null>(null);
  const [isDeletingYl, setIsDeletingYl] = useState<boolean>(false);

  // Compensation Config state
  const [compConfig, setCompConfig] = useState<any>({
    tiers: [
      { threshold: 0, rate: 338 },
      { threshold: 200, rate: 374 },
      { threshold: 250, rate: 409 },
      { threshold: 280, rate: 417 },
      { threshold: 300, rate: 424 },
      { threshold: 330, rate: 428 },
      { threshold: 350, rate: 432 }
    ],
    pphRate: 2.5,
    jkkJkm: 18800,
    jht: 24000
  });
  const [compSavedMsg, setCompSavedMsg] = useState<string>("");

  // Reset Data 3 Bulan state
  
  const [resetScope, setResetScope] = useState<"current_month" | "all">("current_month");
  const [showTargetedResetModal, setShowTargetedResetModal] = useState<boolean>(false);
  const [resetTargetedConfirmText, setResetTargetedConfirmText] = useState<string>("");

  const [isResetting, setIsResetting] = useState<boolean>(false);

  // Manager Realisasi Input state

  const [targetTKU, setTargetTKU] = useState<{ target: number; bln_lalu: number; thn_lalu: number }>({
    target: 0,
    bln_lalu: 0,
    thn_lalu: 0
  });
  const [targetYLMap, setTargetYLMap] = useState<Record<string, { target: number; bln_lalu: number; thn_lalu: number }>>({});

  const activeTargetYLMap = (isViewingHistoricalMonth && historicalDataSnapshot?.targetYLMap)
    ? historicalDataSnapshot.targetYLMap
    : targetYLMap;

  const monthlyGridStats = useMemo(() => {
    const activeYLs = activeYLsList.filter((y: any) => y.status !== "nonaktif");
    const sumTarget = activeYLs.reduce((sum: number, yl: any) => sum + (Number(activeTargetYLMap?.[yl.area]?.target) || 0), 0);
    const sumBL = activeYLs.reduce((sum: number, yl: any) => sum + (Number(activeTargetYLMap?.[yl.area]?.bln_lalu) || 0), 0);
    const sumTL = activeYLs.reduce((sum: number, yl: any) => sum + (Number(activeTargetYLMap?.[yl.area]?.thn_lalu) || 0), 0);
    
    const pembagiStr = (activeGridMap && Object.keys(activeGridMap).length > 0) ? (activeGridMap[Object.keys(activeGridMap)[0]]?.pembagiTanggal ?? 25) : 25;
    const pembagi = Number(pembagiStr) || 25;

    const totalTarget = Math.round(sumTarget) * pembagi;
    const totalBL = Math.round(sumBL) * pembagi;
    const totalTL = Math.round(sumTL) * pembagi;
    
    const grandTotal = monthlyGridTotals.total;
    
    const pctTgt = totalTarget > 0 ? (grandTotal / totalTarget) * 100 : 100;
    const pctBL = totalBL > 0 ? (grandTotal / totalBL) * 100 : 100;
    const pctTL = totalTL > 0 ? (grandTotal / totalTL) * 100 : 100;

    return {
      sumTarget, sumBL, sumTL,
      totalTarget, totalBL, totalTL,
      pctTgt, pctBL, pctTL
    };
  }, [activeYLsList, activeTargetYLMap, activeGridMap, monthlyGridTotals]);

  // Spreadsheet Grid Integration - tabel Target per Yakult Lady (menu Target & Kompensasi)
  const targetGridContainerRef = useRef<HTMLDivElement>(null);

  const getTargetCellValue = useCallback((r: number, c: number) => {
    const yl = activeYLsList[r];
    if (!yl) return 0;
    const targetMapToUse = (isViewingHistoricalMonth && historicalDataSnapshot?.targetYLMap) ? historicalDataSnapshot.targetYLMap : targetYLMap;
    const tgt = targetMapToUse[yl.area] ?? { target: 0, bln_lalu: 0, thn_lalu: 0 };
    const fields = ["target", "bln_lalu", "thn_lalu"] as const;
    return tgt[fields[c]] ?? 0;
  }, [activeYLsList, targetYLMap, isViewingHistoricalMonth, historicalDataSnapshot]);

  const setTargetBatchCellValues = useCallback((updates: { r: number; c: number; val: number | string }[]) => {
    handleUpdateTargetYLMap((prev: any) => {
      const next = { ...prev };
      const fields = ["target", "bln_lalu", "thn_lalu"] as const;
      updates.forEach(({ r, c, val }) => {
        const yl = activeYLsList[r];
        if (!yl) return;
        const numVal = parseIndonesianNumber(val);
        const existing = next[yl.area] ?? { target: 0, bln_lalu: 0, thn_lalu: 0 };
        next[yl.area] = { ...existing, [fields[c]]: numVal };
      });
      return next;
    });
  }, [activeYLsList, handleUpdateTargetYLMap]);

  const {
    selection: targetGridSelection,
    setSelection: setTargetGridSelection,
    isMenuOpen: targetIsMenuOpen,
    setIsMenuOpen: setTargetIsMenuOpen,
    menuPos: targetMenuPos,
    getCellProps: getTargetCellProps,
    selectColumn: selectTargetColumn,
    selectRow: selectTargetRow,
    setIsDragging: setIsTargetDragging,
    handleCopy: handleTargetGridCopy,
    handleCut: handleTargetGridCut,
    handlePaste: handleTargetGridPaste,
    handleClear: handleTargetGridClear,
    clipboardModal: targetClipboardModal,
    confirmManualPaste: targetConfirmManualPaste,
    closeClipboardModal: closeTargetClipboardModal,
  } = useSimpleGrid({
    totalRows: activeYLsList.length,
    totalCols: 3,
    getCellValue: getTargetCellValue,
    setBatchCellValues: setTargetBatchCellValues
  });


  // Baris grid: 0 = Target TKU, 1 = Bulan Lalu TKU, 2 = Tahun Lalu TKU
  const TKU_ROW_PREFIXES = ["target", "bln_lalu", "thn_lalu"] as const;

  const getTargetTKUCellValue = useCallback((r: number, c: number) => {
    const prefix = TKU_ROW_PREFIXES[r] ?? "target";
    const suffixes = ["_yo", "_om", "_os", "_yt"] as const;
    const key = `${prefix}${suffixes[c]}`;
    const tkuToUse = (isViewingHistoricalMonth && historicalDataSnapshot?.targetTKU) ? historicalDataSnapshot.targetTKU : targetTKU;
    return ((tkuToUse as any)[key] as number | undefined) ?? 0;
  }, [targetTKU, isViewingHistoricalMonth, historicalDataSnapshot]);

  const setTargetTKUBatchCellValues = useCallback((updates: { r: number; c: number; val: number | string }[]) => {
    handleUpdateTargetTKU(prev => {
      let next = { ...prev };
      const suffixes = ["_yo", "_om", "_os", "_yt"] as const;
      updates.forEach(({ r, c, val }) => {
        const prefix = TKU_ROW_PREFIXES[r] ?? "target";
        const key = `${prefix}${suffixes[c]}`;
        const numVal = parseIndonesianNumber(val);
        next = { ...next, [key]: numVal };
      });
      TKU_ROW_PREFIXES.forEach(prefix => {
        const yo = (next as any)[`${prefix}_yo`] ?? 0;
        const om = (next as any)[`${prefix}_om`] ?? 0;
        const os = (next as any)[`${prefix}_os`] ?? 0;
        const yt = (next as any)[`${prefix}_yt`] ?? 0;
        (next as any)[prefix] = yo + om + os + yt;
      });
      return next;
    });
  }, [handleUpdateTargetTKU]);

  const {
    selection: tkuGridSelection,
    setSelection: setTkuGridSelection,
    isMenuOpen: tkuIsMenuOpen,
    setIsMenuOpen: setTkuIsMenuOpen,
    menuPos: tkuMenuPos,
    getCellProps: getTkuCellProps,
    handleCopy: handleTkuGridCopy,
    handleCut: handleTkuGridCut,
    handlePaste: handleTkuGridPaste,
    handleClear: handleTkuGridClear,
    clipboardModal: tkuClipboardModal,
    confirmManualPaste: tkuConfirmManualPaste,
    closeClipboardModal: closeTkuClipboardModal,
  } = useSimpleGrid({
    totalRows: 3,
    totalCols: 4,
    getCellValue: getTargetTKUCellValue,
    setBatchCellValues: setTargetTKUBatchCellValues
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (e.key === "Delete" || e.key === "Backspace") {
        if (targetTag !== "input" && targetTag !== "textarea") {
          e.preventDefault();
          if (activeTab === "breakdown" && gridSelection) handleClearSelectedGridCells();
          else if (activeTab === "target_kompensasi") {
             if (targetGridSelection) handleTargetGridClear();
             if (tkuGridSelection) handleTkuGridClear();
          }
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        if (targetTag !== "input" && targetTag !== "textarea") {
          e.preventDefault();
          if (activeTab === "breakdown") {
             if (e.shiftKey) handleRedo();
             else handleUndo();
          }
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        if (targetTag !== "input" && targetTag !== "textarea") {
          e.preventDefault();
          if (activeTab === "breakdown") handleRedo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
        if (targetTag !== "input" && targetTag !== "textarea") {
          if (activeTab === "breakdown" && gridSelection) {
            handleCopyGridCells();
          } else if (activeTab === "target_kompensasi") {
            if (targetGridSelection) handleTargetGridCopy();
            if (tkuGridSelection) handleTkuGridCopy();
          }
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v") {
        if (targetTag !== "input" && targetTag !== "textarea") {
          navigator.clipboard.readText().then(text => {
            if (activeTab === "breakdown" && gridSelection) handlePasteIntoGrid(text);
            else if (activeTab === "target_kompensasi") {
               if (targetGridSelection) handleTargetGridPaste(text);
               if (tkuGridSelection) handleTkuGridPaste(text);
            }
          }).catch(err => console.error("Clipboard read error:", err));
        }
      }
    };

    const handleWindowPaste = (e: ClipboardEvent) => {
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (targetTag === "textarea") return;
      const text = e.clipboardData?.getData("text/plain");
      if (text) {
        const clean = text.trim();
        if (targetTag !== "input" || /[\t\n\r]/.test(clean)) {
          e.preventDefault();
          if (activeTab === "breakdown" && gridSelection) handlePasteIntoGrid(text);
          else if (activeTab === "target_kompensasi") {
            if (targetGridSelection) handleTargetGridPaste(text);
            if (tkuGridSelection) handleTkuGridPaste(text);
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("paste", handleWindowPaste);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("paste", handleWindowPaste);
    };
  }, [
    activeTab, gridSelection,
    targetGridSelection, tkuGridSelection,
    handleClearSelectedGridCells, handleTargetGridClear, handleTkuGridClear,
    handleCopyGridCells, handleTargetGridCopy, handleTkuGridCopy,
    handlePasteIntoGrid, handleTargetGridPaste, handleTkuGridPaste,
    handleUndo, handleRedo
  ]);


  // Kosongkan seleksi grid Target saat pindah tab, supaya shortcut keyboard
  // (Ctrl+C/V/Delete) milik hook ini tidak "nyangkut" aktif di tab lain.
  useEffect(() => {
    if (activeTab !== "target_kompensasi") {
      setTargetGridSelection(null);
    }
  }, [activeTab]);

  // Fetch initial YL List, Compensation Config & Setting Targets
  useEffect(() => {
    safeFetchJson("/api/getYlList").then(res => {
      if (res && res.ylList && Array.isArray(res.ylList) && res.ylList.length > 0) {
        const cleaned = res.ylList.map((y: any) => ({
          ...y,
          nama: cleanYlName(y.nama)
        }));
        setYlList(cleaned);
        saveStoredYlData(cleaned);
      } else {
        const localList = getStoredYlList();
        setYlList(localList);
      }
    }).catch(() => {
      setYlList(getStoredYlList());
    });
    safeFetchJson("/api/getCompensationConfig").then(res => {
      if (res && res.config) {
        setCompConfig(res.config);
      }
    });
    safeFetchJson("/api/getSettingTargets").then(res => {
      if (res) {
        if (res.targetTKU) setTargetTKU(res.targetTKU);
        if (res.targetYL) setTargetYLMap(res.targetYL);
      }
    });
  }, []);

  // Local-First: Load from LocalStorage instantly on month change or tab change
  useEffect(() => {
    try {
      const localPlan = localStorage.getItem(`bd_plan_${selectedBreakdownMonth}`);
      const localRealisasi = localStorage.getItem(`bd_realisasi_${selectedBreakdownMonth}`);
      if (localPlan) {
        const parsed = JSON.parse(localPlan);
        if (parsed && typeof parsed === "object" && Object.keys(parsed).length > 0) {
          setBreakdownPlanMap(parsed);
        }
      }
      if (localRealisasi) {
        const parsed = JSON.parse(localRealisasi);
        if (parsed && typeof parsed === "object" && Object.keys(parsed).length > 0) {
          setBreakdownRealisasiMap(parsed);
        }
      }
    } catch (e) {
      console.warn("Gagal membaca cache lokal breakdown:", e);
    }
  }, [selectedBreakdownMonth]);

  // Sync state to LocalStorage immediately whenever breakdown maps update
  useEffect(() => {
    try {
      if (Object.keys(breakdownPlanMap).length > 0) {
        localStorage.setItem(`bd_plan_${selectedBreakdownMonth}`, JSON.stringify(breakdownPlanMap));
      }
      if (Object.keys(breakdownRealisasiMap).length > 0) {
        localStorage.setItem(`bd_realisasi_${selectedBreakdownMonth}`, JSON.stringify(breakdownRealisasiMap));
        window.dispatchEvent(new Event("bd_realisasi_updated"));
      }
    } catch (e) {
      console.warn("Gagal menyimpan cache lokal breakdown:", e);
    }
  }, [breakdownPlanMap, breakdownRealisasiMap, selectedBreakdownMonth]);

  // Fetch Breakdown Plan & Realisasi from server & Supabase in background
  // Baca breakdown plan/realisasi HANYA dari server (satu sumber kebenaran).
  // Sebelumnya di sini juga cek Supabase langsung (key "bd_plan_{bulan}") dan
  // localStorage sebagai "cache" — ternyata itu yang bikin data lama bisa
  // muncul lagi setelah dihapus (reset), karena dua tempat itu tidak ikut
  // terhapus saat reset. Sekarang cukup satu jalur: server API.
  const fetchBreakdownPlan = async (month: string = selectedBreakdownMonth) => {
    try {
      // Tampilkan data dari localStorage dulu sebagai fallback (mengembalikan data user yg sempat "hilang")
      const localPlan = localStorage.getItem(`bd_plan_${month}`);
      const localReal = localStorage.getItem(`bd_realisasi_${month}`);
      
      let initialPlan = {};
      let initialReal = {};
      
      if (localPlan) {
        try { initialPlan = JSON.parse(localPlan); } catch(e){}
      }
      if (localReal) {
        try { initialReal = JSON.parse(localReal); } catch(e){}
      }

      const res = await safeFetchJson(`/api/getBreakdownPlan?month=${month}`);
      if (res && res.ok) {
        // Gabungkan data dari localStorage dan server. Jika server kosong tapi localStorage ada, pakai localStorage.
        const serverPlan = res.breakdownPlan || {};
        const serverReal = res.breakdownRealisasi || {};
        
        const mergedPlan = Object.keys(serverPlan).length > 0 ? serverPlan : initialPlan;
        const mergedReal = Object.keys(serverReal).length > 0 ? serverReal : initialReal;

        setBreakdownPlanMap(mergedPlan);
        setBreakdownRealisasiMap(mergedReal);
        
        // Save back to localStorage to keep it updated
        localStorage.setItem(`bd_plan_${month}`, JSON.stringify(mergedPlan));
        localStorage.setItem(`bd_realisasi_${month}`, JSON.stringify(mergedReal));
      } else {
        // Fallback to local storage only
        setBreakdownPlanMap(initialPlan);
        setBreakdownRealisasiMap(initialReal);
      }
    } catch (e) {
      console.error("Error fetching breakdown plan:", e);
    }
  };

  useEffect(() => {
    fetchBreakdownPlan(selectedBreakdownMonth);
    
    const handleLhppSaved = () => {
      fetchBreakdownPlan(selectedBreakdownMonth);
    };
    window.addEventListener("lhpp_saved", handleLhppSaved);
    return () => window.removeEventListener("lhpp_saved", handleLhppSaved);
  }, [selectedBreakdownMonth]);

  const breakdownPlanMapRef = useRef(breakdownPlanMap);
  const breakdownRealisasiMapRef = useRef(breakdownRealisasiMap);
  const isBreakdownDirtyRef = useRef(false);

  useEffect(() => {
    breakdownPlanMapRef.current = breakdownPlanMap;
    breakdownRealisasiMapRef.current = breakdownRealisasiMap;
  }, [breakdownPlanMap, breakdownRealisasiMap]);

  // Save on unmount / logout
  useEffect(() => {
    return () => {
      if (Object.keys(breakdownPlanMapRef.current).length > 0 || Object.keys(breakdownRealisasiMapRef.current).length > 0) {
        fetch("/api/saveBreakdownPlan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            month: selectedBreakdownMonth,
            breakdownPlan: breakdownPlanMapRef.current,
            breakdownRealisasi: breakdownRealisasiMapRef.current
          }),
          keepalive: true
        }).catch(() => {});
      }
    };
  }, [selectedBreakdownMonth]);

  // Auto-save Breakdown
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isBreakdownDirtyRef.current && (Object.keys(breakdownPlanMap).length > 0 || Object.keys(breakdownRealisasiMap).length > 0)) {
        handleSaveBreakdownPlan();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [breakdownPlanMap, breakdownRealisasiMap]);

  // Handler: Save Breakdown Plan & Realisasi (hanya lewat server, satu sumber kebenaran)
  const handleSaveBreakdownPlan = async (isManual = false) => {
    if (!isManual && !isBreakdownDirtyRef.current) return; // Prevent unnecessary save
    setIsBreakdownSaving(true);
    try {
      const payloadStr = JSON.stringify({
          month: selectedBreakdownMonth,
          breakdownPlan: breakdownPlanMap,
          breakdownRealisasi: breakdownRealisasiMap
        });
      console.log("Saving breakdown, payload size:", payloadStr.length);
      const res = await fetch("/api/saveBreakdownPlan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payloadStr
      });
      console.log("Save breakdown status:", res.status);
      if (!res.ok) {
        const errText = await res.text();
        console.error("Save breakdown error response:", errText.substring(0, 500));
        if (isManual) alert("Gagal menyimpan data breakdown: Server merespon " + res.status);
        return;
      }
      const resData = await res.json();
      if (resData && resData.ok) {
        isBreakdownDirtyRef.current = false; // Clear dirty flag on success
        if (onRefresh) await onRefresh();
        if (isManual) alert("Berhasil menyimpan data breakdown!");
      } else {
        console.error("Gagal menyimpan data breakdown ke server, resData:", resData);
        if (isManual) alert("Gagal menyimpan data breakdown ke server.");
      }
    } catch (e: any) {
      console.error("Error: " + (e.message || "Gagal menyimpan"));
    } finally {
      setIsBreakdownSaving(false);
    }
  };

  // Export full JSON Backup file
  const handleExportBackupJson = () => {
    try {
      const backupData = {
        app: "Yakult Lady Management System DP Jember 1",
        version: "2.0-Hybrid",
        exportedAt: new Date().toISOString(),
        month: selectedBreakdownMonth,
        breakdownPlan: breakdownPlanMap,
        breakdownRealisasi: breakdownRealisasiMap,
        ylList,
        targetTKU,
        targetYL: targetYLMap,
        motivasiConfig,
        kontesConfig
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `Backup_Yakult_Jember1_${selectedBreakdownMonth}_${new Date().toISOString().slice(0,10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setBreakdownMsg("✅ Backup file JSON berhasil diunduh!");
      setTimeout(() => setBreakdownMsg(""), 3500);
    } catch (e: any) {
      alert("Gagal mengekspor backup JSON: " + e.message);
    }
  };

  // Import JSON Backup file
  const handleImportBackupJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const content = evt.target?.result as string;
        const data = JSON.parse(content);

        if (!data || typeof data !== "object") {
          throw new Error("Format file JSON tidak valid.");
        }

        let monthToUse = selectedBreakdownMonth;
        if (data.month) {
          monthToUse = data.month;
          setSelectedBreakdownMonth(data.month);
        }

        if (data.breakdownPlan) {
          setBreakdownPlanMap(data.breakdownPlan);
          localStorage.setItem(`bd_plan_${monthToUse}`, JSON.stringify(data.breakdownPlan));
        }
        if (data.breakdownRealisasi) {
          setBreakdownRealisasiMap(data.breakdownRealisasi);
          localStorage.setItem(`bd_realisasi_${monthToUse}`, JSON.stringify(data.breakdownRealisasi));
        }

        // Send to server
        fetch("/api/saveBreakdownPlan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            month: monthToUse,
            breakdownPlan: data.breakdownPlan || breakdownPlanMap,
            breakdownRealisasi: data.breakdownRealisasi || breakdownRealisasiMap
          })
        }).catch(() => {});

        if (onRefresh) await onRefresh();

        setBreakdownMsg("🎉 Restore data dari file JSON berhasil!");
        setTimeout(() => setBreakdownMsg(""), 4000);
        alert("Restore Berhasil! Data dari file backup JSON telah diterapkan.");
      } catch (err: any) {
        alert("Gagal memproses file JSON: " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Handler: Change single cell in breakdown grid
  const handleBreakdownCellChange = (area: string, day: number, item: "yo" | "om" | "os" | "yt", val: number) => {
    updateActiveGridMap(prev => {
      const copy = { ...prev };
      const ylObj = copy[area] ? { ...copy[area] } : { pembagiTanggal: 25, days: {} };
      const daysObj = { ...ylObj.days };
      const dayObj = daysObj[String(day)] ? { ...daysObj[String(day)] } : { yo: 0, om: 0, os: 0, yt: 0 };
      dayObj[item] = val;
      daysObj[String(day)] = dayObj;
      ylObj.days = daysObj;
      copy[area] = ylObj;
      return copy;
    });
  };

  const handleGlobalPembagiChange = (val: number | string) => {
    updateActiveGridMap(prev => {
      const copy = { ...prev };
      const newPembagi = val === '' ? ('' as any) : Math.max(1, Number(val));
      // Update all existing entries
      Object.keys(copy).forEach(area => {
        if (copy[area]) {
          copy[area] = { ...copy[area], pembagiTanggal: newPembagi };
        }
      });
      // Ensure all active YLs have this pembagi
      activeYLsList.forEach(yl => {
        const area = String(yl.area).substring(0, 3);
        if (!copy[area]) {
          copy[area] = { pembagiTanggal: newPembagi, days: {} };
        } else {
          copy[area] = { ...copy[area], pembagiTanggal: newPembagi };
        }
      });
      return copy;
    });
  };

  // Removed auto-fill baseline

  const [showArchiveEditor, setShowArchiveEditor] = useState(false);

  // Auto-save setting targets
  useEffect(() => {
    const timer = setTimeout(() => {
      if (Object.keys(targetYLMap).length > 0) {
        handleSaveSettingTargets();
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [targetTKU, targetYLMap]);

  // Handler: Save Setting Targets
  const handleSaveSettingTargets = async () => {
    if (isViewingHistoricalMonth && historicalDataSnapshot) {
      // Archive Mode: Upsert updated historicalDataSnapshot back to Supabase
      const mKey = selectedMonthlyArchive;
      const label = historicalMonthLabel || getIndonesianMonthLabel(mKey);
      setIsSbSyncing(true);
      try {
        const res = await saveToSupabase(`monthly_archive_${mKey}`, historicalDataSnapshot);
        if (!res.success) {
          throw new Error(res.error || "Gagal menyimpan perubahan target ke Supabase");
        }
        setCompSavedMsg(`🎉 Target Arsip Bulan ${label} berhasil disimpan ke Supabase!`);
        setTimeout(() => setCompSavedMsg(""), 4000);
      } catch (e: any) {
        alert(`❌ Gagal menyimpan target arsip: ${e.message}`);
      } finally {
        setIsSbSyncing(false);
      }
      return;
    }

    try {
      const res = await safeFetchJson("/api/saveSettingTargets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetTKU,
          targetYL: targetYLMap,
          bulan: selectedBreakdownMonth || new Date().toISOString().substring(0, 7)
        })
      });
      if (res && res.ok) {
        setCompSavedMsg("✅ Data Target & Kompensasi berhasil disimpan!");
        setTimeout(() => setCompSavedMsg(""), 3000);
        if (onRefresh) await onRefresh();
      }
    } catch (e: any) {
      console.error("Gagal menyimpan data target: " + e.message);
    }
  };

  const handleSaveYlList = async (newList: any) => {
    try {
      const cleanedList = (newList || []).map((y: any) => ({
        ...y,
        nama: cleanYlName(y.nama)
      }));
      
      // Update local storage instantly
      const storedData = saveStoredYlData(cleanedList, pinManager);
      setYlList(storedData.ylList);
      setPinYLs(storedData.ylPins);

      const res = await safeFetchJson("/api/saveYlList", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ylList: cleanedList })
      });
      if (res && res.ok) {
        const cleanedReturned = (res.ylList || []).map((y: any) => ({
          ...y,
          nama: cleanYlName(y.nama)
        }));
        setYlList(cleanedReturned);
        saveStoredYlData(cleanedReturned, pinManager);
      }
      setYlSavedMsg("Daftar YL & PIN berhasil diperbarui!");
      setTimeout(() => setYlSavedMsg(""), 3000);
      if (onRefresh) await onRefresh();
    } catch (e: any) {
      setYlSavedMsg("Daftar YL & PIN berhasil disimpan secara lokal!");
      setTimeout(() => setYlSavedMsg(""), 3000);
    }
  };

  // Handler: Add YL
  const handleAddYl = () => {
    if (!newYlArea || !newYlNama || !newYlPin) {
      setYlSavedMsg("⚠️ Area, Nama, dan PIN wajib diisi!");
      setTimeout(() => setYlSavedMsg(""), 3000);
      return;
    }
    const today = new Date().toISOString().split("T")[0];
    const newList = [...ylList, {
      area: newYlArea,
      nama: cleanYlName(newYlNama),
      pin: newYlPin,
      kodeYl: newYlKode || `YL-${newYlArea}`,
      tanggalMasuk: newYlTanggalMasuk || today,
      nik: newYlNik || undefined,
      tglLahir: newYlTglLahir || undefined,
      status: "Aktif",
      tanggalDaftar: today
    }];
    handleSaveYlList(newList);
    setNewYlArea("");
    setNewYlNama("");
    setNewYlPin("");
    setNewYlKode("");
    setNewYlTanggalMasuk("");
    setNewYlNik("");
    setNewYlTglLahir("");
  };

  // Handler: Open Permanent Delete YL Modal
  const handleDeleteYl = (idx: number) => {
    const yl = ylList[idx];
    if (!yl) return;
    setYlToDelete({ idx, yl });
  };

  // Handler: Confirm Permanent Delete YL
  const confirmDeleteYl = async () => {
    if (!ylToDelete) return;
    setIsDeletingYl(true);
    const { idx, yl } = ylToDelete;

    const copy = ylList.filter((_, i) => i !== idx);
    setYlList(copy);

    const newTargetMap = { ...targetYLMap };
    delete newTargetMap[yl.area];
    setTargetYLMap(newTargetMap);

    try {
      const res = await safeFetchJson("/api/saveYlList", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ylList: copy })
      });
      if (res && res.ok) {
        setYlSavedMsg(`✅ Data YL ${yl.nama} (${yl.area}) berhasil dihapus permanen dari sistem.`);
        setTimeout(() => setYlSavedMsg(""), 4000);
        if (onRefresh) await onRefresh();
      } else {
        setYlSavedMsg(`✅ Data YL ${yl.nama} (${yl.area}) berhasil dihapus dari tampilan.`);
        setTimeout(() => setYlSavedMsg(""), 4000);
      }
    } catch (e: any) {
      setYlSavedMsg("⚠️ Gagal menghapus YL: " + (e.message || "Kesalahan koneksi"));
    } finally {
      setIsDeletingYl(false);
      setYlToDelete(null);
    }
  };

  // Handler: Save Compensation Config
  const handleSaveCompConfig = async () => {
    try {
      const res = await safeFetchJson("/api/saveCompensationConfig", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: compConfig })
      });
      if (res && res.ok) {
        setCompSavedMsg("Aturan kompensasi & tarif pajak berhasil disimpan!");
        setTimeout(() => setCompSavedMsg(""), 3000);
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  // Handler: Open Reset 3 Bulan Preview
  const handleConfirmTargetedReset = async () => {
    if (resetTargetedConfirmText !== "HAPUS") {
      alert("Silakan ketik HAPUS untuk konfirmasi.");
      return;
    }
    setIsResetting(true);
    try {
      const res = await safeFetchJson("/api/resetDataTargeted", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: resetScope, currentMonth: selectedBreakdownMonth || "2026-07" })
      });
      if (res && res.ok) {
        alert(res.message);
        setShowTargetedResetModal(false);
        setResetTargetedConfirmText("");
        
        // CLEAR LOCAL STATE agar tampilan langsung kosong sebelum fetch ulang dari server
        if (resetScope === "all" || resetScope === "current_month") {
           setBreakdownPlanMap({});
           setBreakdownRealisasiMap({});
           setTargetYLMap({});
           setTargetTKU({ target: 0, bln_lalu: 0, thn_lalu: 0, target_yo: 0, target_om: 0, target_os: 0, target_yt: 0, bln_lalu_yo: 0, bln_lalu_om: 0, bln_lalu_os: 0, bln_lalu_yt: 0, thn_lalu_yo: 0, thn_lalu_om: 0, thn_lalu_os: 0, thn_lalu_yt: 0 });
           fetchBreakdownPlan(selectedBreakdownMonth);
        }
        
        if (onRefresh) onRefresh();
      } else {
        alert("Gagal mereset data: " + (res?.error || "Unknown error"));
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setIsResetting(false);
    }
  };


  // Settings PIN dropdown state
  const [pinTargetDropdown, setPinTargetDropdown] = useState<string>("manager");
  const [pinInputVal, setPinInputVal] = useState<string>("");
  const [pinSavedMsg, setPinSavedMsg] = useState<boolean>(false);
  const [pinManager, setPinManager] = useState<string>(() => getStoredManagerPin());
  const [pinYLs, setPinYLs] = useState<Record<string, string>>(() => getStoredYlPins());

  // Attention Manager states
  const [attentionArea, setAttentionArea] = useState<string>("201");
  const [attentionText, setAttentionText] = useState<string>("");
  const [attentionMap, setAttentionMap] = useState<Record<string, string>>({});
  const [attentionSavedMsg, setAttentionSavedMsg] = useState<boolean>(false);

  // Motivasi & Chatbot states
  const [chatbotNameInput, setChatbotNameInput] = useState<string>(motivasiConfig?.chatbotName || "AI Jember 1 Pro");
  const [tkuNameInput, setTkuNameInput] = useState<string>(motivasiConfig?.tkuName || "DP Jember 1");

  // Local states for Kalimat Motivasi Running Banner YL
  const [localMotivasiList, setLocalMotivasiList] = useState<string[]>(motivasiConfig?.list || []);
  const [localMotivasiTerpilih, setLocalMotivasiTerpilih] = useState<string[]>(motivasiConfig?.terpilih || []);
  const [localMotivasiInterval, setLocalMotivasiInterval] = useState<number | string>(motivasiConfig?.intervalDetik || 30);
  const [localMotivasiEnabled, setLocalMotivasiEnabled] = useState<boolean>(motivasiConfig?.enabled ?? true);
  const [newMotivasiInput, setNewMotivasiInput] = useState<string>("");
  const [motivasiSavedMsg, setMotivasiSavedMsg] = useState<string>("");

  useEffect(() => {
    if (motivasiConfig?.chatbotName) {
      setChatbotNameInput(motivasiConfig.chatbotName);
    }
    if (motivasiConfig?.tkuName) {
      setTkuNameInput(motivasiConfig.tkuName);
    }
    if (motivasiConfig) {
      if (Array.isArray(motivasiConfig.list)) setLocalMotivasiList(motivasiConfig.list);
      if (Array.isArray(motivasiConfig.terpilih)) setLocalMotivasiTerpilih(motivasiConfig.terpilih);
      if (motivasiConfig.intervalDetik !== undefined) setLocalMotivasiInterval(motivasiConfig.intervalDetik);
      if (motivasiConfig.enabled !== undefined) setLocalMotivasiEnabled(motivasiConfig.enabled);
    }
  }, [motivasiConfig]);

  const handleAddMotivasi = () => {
    const trimmed = newMotivasiInput.trim();
    if (!trimmed) return;
    if (!localMotivasiList.includes(trimmed)) {
      const updatedList = [...localMotivasiList, trimmed];
      const updatedTerpilih = [...localMotivasiTerpilih, trimmed];
      setLocalMotivasiList(updatedList);
      setLocalMotivasiTerpilih(updatedTerpilih);
      setNewMotivasiInput("");
    } else {
      alert("Kalimat motivasi ini sudah ada dalam daftar.");
    }
  };

  const handleToggleMotivasiItem = (item: string) => {
    if (localMotivasiTerpilih.includes(item)) {
      setLocalMotivasiTerpilih(localMotivasiTerpilih.filter(x => x !== item));
    } else {
      setLocalMotivasiTerpilih([...localMotivasiTerpilih, item]);
    }
  };

  const handleDeleteMotivasiItem = (item: string) => {
    setLocalMotivasiList(localMotivasiList.filter(x => x !== item));
    setLocalMotivasiTerpilih(localMotivasiTerpilih.filter(x => x !== item));
  };

  const handleSelectAllMotivasi = () => {
    setLocalMotivasiTerpilih([...localMotivasiList]);
  };

  const handleDeselectAllMotivasi = () => {
    setLocalMotivasiTerpilih([]);
  };

  const handleLoadSampleMotivasi = () => {
    const samples = [
      "Semangat menjalani hari ini dengan tulus dan penuh senyuman! 🌸",
      "Fokus pada pelayanan terbaik, senyum tulus adalah kunci keakraban dengan pelanggan! 😊",
      "Setiap botol Yakult membawa kesehatan dan kebahagiaan bagi keluarga Indonesia. 🍾",
      "Usaha dan ketekunan hari ini adalah pijakan sukses esok hari. Terus melangkah! 💪",
      "Jaga kesehatan dan selalu utamakan keselamatan dalam setiap rute aktivitas! 🛵✨"
    ];
    const combinedList = Array.from(new Set([...localMotivasiList, ...samples]));
    const combinedTerpilih = Array.from(new Set([...localMotivasiTerpilih, ...samples]));
    setLocalMotivasiList(combinedList);
    setLocalMotivasiTerpilih(combinedTerpilih);
  };

  const handleSaveMotivasiConfigAll = async () => {
    const newConfig: MotivasiConfig = {
      ...motivasiConfig,
      list: localMotivasiList,
      terpilih: localMotivasiTerpilih,
      intervalDetik: Number(localMotivasiInterval) || 30,
      enabled: localMotivasiEnabled,
      chatbotName: chatbotNameInput.trim() || "AI Jember 1 Pro",
      tkuName: tkuNameInput.trim() || "DP Jember 1"
    };

    onUpdateMotivasi(newConfig);

    try {
      await saveToSupabase("motivasi_config", newConfig);
    } catch (e) {}

    setMotivasiSavedMsg("✅ Pengaturan Kalimat Motivasi Berhasil Disimpan!");
    setTimeout(() => setMotivasiSavedMsg(""), 4000);
  };

  
  
  // Apps Script (Code.gs) viewer/copy UI state — used for the manual
  // "Kirim ke DP1" Apps Script integration (view/download/copy Code.gs).
  const [showGsCode, setShowGsCode] = useState<boolean>(false);
  const [copiedGsCode, setCopiedGsCode] = useState<boolean>(false);

  useEffect(() => {
    setScriptUrlInput(scriptUrl || "");
  }, [scriptUrl]);

  // Load PINs & Attention on settings load
  useEffect(() => {
    safeFetchJson("/api/getPins")
      .then(d => {
        if (d && d.managerPin) {
          setPinManager(d.managerPin);
        } else {
          setPinManager(getStoredManagerPin());
        }
        if (d && d.ylPins && Object.keys(d.ylPins).length > 0) {
          setPinYLs(d.ylPins);
        } else {
          setPinYLs(getStoredYlPins());
        }
      })
      .catch(() => {
        setPinManager(getStoredManagerPin());
        setPinYLs(getStoredYlPins());
      });

    safeFetchJson("/api/getAttention")
      .then(d => {
        if (d && d.attention) {
          setAttentionMap(d.attention);
          setAttentionText(d.attention["201"] || "");
        }
      })
      .catch(e => console.error("Error loading attention:", e));
  }, []);

  const handleSaveAttention = async () => {
    try {
      const res = await fetch("/api/saveAttention", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ area: attentionArea, text: attentionText })
      });
      const resData = await parseJsonResponse(res);

      if (res.ok && resData && resData.ok) {
        setAttentionMap(resData.attention || {});
        setAttentionSavedMsg(true);
        setTimeout(() => setAttentionSavedMsg(false), 2000);
      }
    } catch (e) {
      console.error("Gagal menyimpan attention:", e);
    }
  };

  // Update detail YL data when selection changes
  useEffect(() => {
    if (selectedYLArea) {
      safeFetchJson(`/api/getDataYL?area=${selectedYLArea}`)
        .then(d => {
          if (d) setYLDetail(d);
        })
        .catch(e => console.error(e));
    }
  }, [selectedYLArea, dashboardData]);

  // Run AI Insight Generator
  const runAiInsight = async () => {
    if (!activeEvaluasiData) return;
    setIsAiLoading(true);
    setAiInsight("");
    try {
      const response = await fetch("/api/gemini/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: activeEvaluasiData })
      });
      const d = await parseJsonResponse(response);
      setAiInsight(d?.insight || "Tidak ada hasil analisis.");
    } catch (e) {
      setAiInsight("Gagal menghubungkan ke modul evaluasi AI server.");
    } finally {
      setIsAiLoading(false);
    }
  };

  // Helper formatting currency
  const formatRp = (val: number) => {
    return "Rp" + Math.trunc(val).toLocaleString("id-ID");
  };


  // Normalize analysis data list from activeEvaluasiData
  const normalizedAnalisis = useMemo(() => {
    if (!activeEvaluasiData) return [];
    if (activeEvaluasiData.dataRows && activeEvaluasiData.dataRows.length > 0) {
      return activeEvaluasiData.dataRows.map(row => {
        const area = String(row[0] || "");
        const nama = String(row[1] || "");
        const jualHariIni = typeof row[7] === "number" ? row[7] : parseFloat(row[7]) || 0;
        const rata2BulanBerjalan = typeof row[13] === "number" ? row[13] : parseFloat(row[13]) || 0;
        const vsMingguLaluPct = typeof row[15] === "number" ? row[15] : parseFloat(row[15]) || 0;
        const persenRumah = typeof row[18] === "number" ? row[18] : parseFloat(row[18]) || 0;
        const persenRbVsPlg = typeof row[21] === "number" ? row[21] : parseFloat(row[21]) || 0;
        const propagandaHariIni = (typeof row[22] === "number" ? row[22] : parseFloat(row[22]) || 0) + 
                                  (typeof row[23] === "number" ? row[23] : parseFloat(row[23]) || 0);
        const sampahBotol = typeof row[26] === "number" ? row[26] : parseFloat(row[26]) || 0;
        const bb = typeof row[28] === "number" ? row[28] : parseFloat(row[28]) || 0;
        const akmBb = typeof row[30] === "number" ? row[30] : parseFloat(row[30]) || 0;

        return {
          area,
          nama,
          jualHariIni,
          rata2BulanBerjalan,
          vsMingguLaluPct,
          persenRumah,
          persenRbVsPlg,
          propagandaHariIni,
          sampahBotol,
          bb,
          akmBb,
          propagandaVs900: null
        };
      });
    }
    return (activeEvaluasiData.analisis || []).map(a => ({ ...a, akmBb: a.akmBb ?? a.bb ?? 0 }));
  }, [activeEvaluasiData]);

  // Find overall highest performing and needy YL
  const evaluasiHighlights = useMemo(() => {
    const list = normalizedAnalisis;
    if (!list || list.length === 0) return { top: null, needImprovement: null, highestBB: null };

    const EVAL_CATEGORIES = [
      { key: 'jualHariIni', label: 'Tabel Penjualan Hari Ini', type: 'max', requirePositive: true },
      { key: 'rata2BulanBerjalan', label: 'Rata Bulan Ini', type: 'max', requirePositive: true },
      { key: 'vsMingguLaluPct', label: 'vs Minggu Lalu', type: 'max', requirePositive: true },
      { key: 'persenRumah', label: 'Persen Rumah', type: 'max', requirePositive: true },
      { key: 'persenRbVsPlg', label: 'Persen RB vs PLG', type: 'max', requirePositive: true },
      { key: 'propagandaHariIni', label: 'PB Hari Ini', type: 'max', requirePositive: true },
      { key: 'sampahBotol', label: 'Akm Sampah', type: 'max', requirePositive: true },
      { key: 'akmBb', label: 'Akm BB', type: 'min', requirePositive: false }
    ];

    const categoryStats = EVAL_CATEGORIES.map(cat => {
      const vals = list.map(x => (x as any)[cat.key] as number || 0);
      let bestVal: number | null = null;
      let worstVal: number | null = null;
      
      let validVals = cat.requirePositive ? vals.filter(v => v > 0) : vals;
      
      let isWinner = (_v: any) => false;
      let isLoser = (_v: any) => false;
      let getScore = (_v: any) => 0; // 0 to 1

      if (validVals.length > 0 || !cat.requirePositive) {
        if (cat.type === 'max') {
          bestVal = validVals.length > 0 ? Math.max(...validVals) : 0;
          worstVal = validVals.length > 0 ? Math.min(...validVals) : 0;
          isWinner = (v) => v === bestVal && (!cat.requirePositive || v > 0);
          isLoser = (v) => v === worstVal && (!cat.requirePositive || v > 0);
          getScore = (v) => {
            if (cat.requirePositive && v === 0) return 0;
            return bestVal === worstVal ? 1 : (v - worstVal) / (bestVal! - worstVal);
          };
        } else if (cat.type === 'min') {
          bestVal = validVals.length > 0 ? Math.min(...validVals) : 0;
          worstVal = validVals.length > 0 ? Math.max(...validVals) : 0;
          isWinner = (v) => v === bestVal && (!cat.requirePositive || v > 0);
          isLoser = (v) => v === worstVal && (!cat.requirePositive || v > 0);
          getScore = (v) => {
            if (cat.requirePositive && v === 0) return 0;
            return bestVal === worstVal ? 1 : (worstVal - v) / (worstVal - bestVal!);
          };
        } else if (cat.type === 'target') {
          const distances = validVals.map(v => Math.abs(v - (cat.target as number)));
          const minDistance = distances.length > 0 ? Math.min(...distances) : 0;
          const maxDistance = distances.length > 0 ? Math.max(...distances) : 0;
          
          isWinner = (v) => (!cat.requirePositive || v > 0) && Math.abs(v - (cat.target as number)) === minDistance;
          isLoser = (v) => (!cat.requirePositive || v > 0) && Math.abs(v - (cat.target as number)) === maxDistance;
          getScore = (v) => {
            if (cat.requirePositive && v === 0) return 0;
            const d = Math.abs(v - (cat.target as number));
            return minDistance === maxDistance ? 1 : (maxDistance - d) / (maxDistance - minDistance);
          };
        }
      }

      return { ...cat, bestVal, worstVal, isWinner, isLoser, getScore };
    });

    const scoredList = list.map(yl => {
      let winCount = 0;
      let loseCount = 0;
      let totalScore = 0;
      let wonCategories: string[] = [];
      let lostCategories: string[] = [];

      categoryStats.forEach(stat => {
        const v = (yl as any)[stat.key] as number || 0;
        if (stat.isWinner(v)) {
          winCount++;
          wonCategories.push(stat.label);
        }
        if (stat.isLoser(v)) {
          loseCount++;
          lostCategories.push(stat.label);
        }
        totalScore += stat.getScore(v);
      });

      return { ...yl, winCount, loseCount, totalScore, wonCategories, lostCategories };
    });

    // Performa Terbaik
    const sortedTop = [...scoredList].sort((a, b) => b.winCount - a.winCount || b.totalScore - a.totalScore);
    const topWinCount = sortedTop[0].winCount;
    const topTotalScore = sortedTop[0].totalScore;
    const allTops = sortedTop.filter(x => x.winCount === topWinCount && Math.abs(x.totalScore - topTotalScore) < 0.001);
    
    const top = {
      ...sortedTop[0],
      nama: allTops.map(x => cleanYlName(x.nama)).join(", ")
    };

    // Performa Turun
    const sortedNeed = [...scoredList].sort((a, b) => b.loseCount - a.loseCount || a.totalScore - b.totalScore);
    const needLoseCount = sortedNeed[0].loseCount;
    const needTotalScore = sortedNeed[0].totalScore;
    const allNeeds = sortedNeed.filter(x => x.loseCount === needLoseCount && Math.abs(x.totalScore - needTotalScore) < 0.001);
    
    const needImprovement = {
      ...sortedNeed[0],
      nama: allNeeds.map(x => cleanYlName(x.nama)).join(", ")
    };

    const sortedBB = [...list].sort((a, b) => (b.akmBb ?? b.bb) - (a.akmBb ?? a.bb));
    const bbVal = sortedBB[0].akmBb ?? sortedBB[0].bb;
    const allBBs = sortedBB.filter(x => (x.akmBb ?? x.bb) === bbVal);
    const highestBB = {
      ...sortedBB[0],
      nama: allBBs.map(x => cleanYlName(x.nama)).join(", "),
      bb: bbVal
    };

    return { top, needImprovement, highestBB };
  }, [normalizedAnalisis]);

  const evaluasiBlocks = useMemo(() => {
    const list = normalizedAnalisis;
    if (!list || list.length === 0) return null;

    const getTop = (key: keyof typeof list[0], ascending = false) => {
      if (list.length === 0) return null;
      let validList = list;
      if (key !== "akmBb") {
        validList = list.filter(item => (item[key] as number) > 0);
      }
      if (validList.length === 0) return null;
      const sorted = [...validList].sort((a, b) => ascending ? (a[key] as number) - (b[key] as number) : (b[key] as number) - (a[key] as number));
      const topVal = sorted[0][key];
      const allTops = sorted.filter(item => item[key] === topVal);
      const joinedNames = allTops.map(i => cleanYlName(i.nama)).join(", ");
      
      return {
        ...sorted[0],
        nama: joinedNames,
        [key]: topVal
      };
    };

    const block1 = getTop("jualHariIni");
    const block2 = getTop("rata2BulanBerjalan");
    const block3 = getTop("vsMingguLaluPct");
    const block4 = getTop("persenRumah");
    const block5 = getTop("persenRbVsPlg");
    const block6 = getTop("propagandaHariIni");
    const block7 = getTop("sampahBotol");
    const block8 = getTop("akmBb", true); // lowest Akm BB (minimum retur)

    return { block1, block2, block3, block4, block5, block6, block7, block8 };
  }, [normalizedAnalisis]);

  const handleClearCache = async () => {
    const savedSbUrl = localStorage.getItem("supabase_url") || "";
    const savedSbKey = localStorage.getItem("supabase_key") || "";
    const savedSession = localStorage.getItem("yakult_session") || "";
    const savedSbPin = localStorage.getItem("yakult_supabase_pin") || "";

    localStorage.clear();

    if (savedSbUrl) localStorage.setItem("supabase_url", savedSbUrl);
    if (savedSbKey) localStorage.setItem("supabase_key", savedSbKey);
    if (savedSession) localStorage.setItem("yakult_session", savedSession);
    if (savedSbPin) localStorage.setItem("yakult_supabase_pin", savedSbPin);

    await onRefresh();
    alert("Cache aplikasi berhasil dibersihkan! Seluruh data diperbarui secara segar.");
  };


  const { top, needImprovement, highestBB } = evaluasiHighlights;

  // Save Config Pin
  const handleSavePin = async () => {
    if (!pinInputVal) return;
    const newYlPins = { ...pinYLs };
    let newMgrPin = pinManager;

    if (pinTargetDropdown === "manager") {
      newMgrPin = pinInputVal;
      setPinManager(pinInputVal);
    } else {
      const targetName = pinYLs[pinTargetDropdown] || pinTargetDropdown;
      delete newYlPins[pinTargetDropdown];
      newYlPins[pinInputVal] = targetName;
      setPinYLs(newYlPins);
    }

    // Save locally
    saveStoredYlData(ylList, newMgrPin);
    try {
      localStorage.setItem("yakult_yl_pins", JSON.stringify(newYlPins));
      localStorage.setItem("yakult_manager_pin", newMgrPin);
    } catch (e) {}

    try {
      await fetch("/api/savePins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ managerPin: newMgrPin, ylPins: newYlPins })
      });
    } catch (e) {
      console.warn("Gagal menyinkronkan PIN ke server, tersimpan secara lokal.", e);
    }

    setPinSavedMsg(true);
    setPinInputVal("");
    setTimeout(() => setPinSavedMsg(false), 2500);
    if (onRefresh) await onRefresh();
  };

  // Reset Profil YL & PIN to Default Data
  const handleResetYlAndPins = async () => {
    if (!window.confirm("Apakah Anda yakin ingin memulihkan seluruh Profil YL dan PIN ke data bawaan (10 YL & PIN default)?")) {
      return;
    }
    const defaultData = resetToDefaultData();
    setYlList(defaultData.ylList);
    setPinManager(defaultData.managerPin);
    setPinYLs(defaultData.ylPins);

    try {
      await Promise.all([
        fetch("/api/saveYlList", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ylList: defaultData.ylList, managerPin: defaultData.managerPin })
        }),
        fetch("/api/savePins", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ managerPin: defaultData.managerPin, ylPins: defaultData.ylPins })
        })
      ]);
    } catch (e) {
      console.warn("Server reset sync skipped", e);
    }

    if (onRefresh) await onRefresh();
    alert("✅ Data Profil YL dan PIN berhasil di-reset ke data bawaan (10 YL & PIN Default 201-210, Manager 1111)!");
  };



  const handleDownloadExcel = async () => {
    try {
      const res = await fetch("/api/exportRealisasi");
      if (!res.ok) throw new Error("Gagal mengunduh file Excel");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      
      const contentDisposition = res.headers.get('Content-Disposition');
      let filename = `Laporan_Realisasi_DP1_${new Date().toISOString().replace(/[:.]/g, "-")}.xlsx`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="([^"]+)"/);
        if (match) filename = match[1];
      }
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  const activeDashboardData = (isViewingHistoricalMonth && historicalDataSnapshot?.dashboardData)
    ? historicalDataSnapshot.dashboardData
    : (isViewingHistoricalMonth && historicalDataNotFound)
      ? null
      : dashboardData;



  const activeTargetTKU = (isViewingHistoricalMonth && historicalDataSnapshot?.targetTKU)
    ? historicalDataSnapshot.targetTKU
    : targetTKU;

  if (showArchiveEditor) {
    return <ArchiveEditor onClose={() => setShowArchiveEditor(false)} motivasiConfig={motivasiConfig} ylList={ylList} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* Dynamic Header */}
      <header className="bg-gradient-to-r from-red-950 to-red-800 border-b-4 border-red-600 text-white p-4 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="bg-red-600 text-white font-black px-2.5 py-1 text-lg rounded-lg shadow">Y</span>
            <div>
              <h1 className="text-base font-extrabold tracking-tight leading-none">
                {(motivasiConfig?.tkuName || "DP JEMBER 1").toUpperCase()}
              </h1>
              <p className="text-[10px] text-red-200 mt-1 font-medium">Yakult Lady Management System Pro</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Indicator viewing archive + Kembali ke Data Live */}
            {isViewingHistoricalMonth && (
              <div className="flex items-center gap-1.5 bg-indigo-900/90 text-indigo-100 border border-indigo-400 px-2.5 py-1.5 rounded-xl text-xs font-bold shadow animate-pulse mr-1">
                <span className="hidden sm:inline">📅 Arsip: {historicalMonthLabel || selectedMonthlyArchive}</span>
                <button
                  onClick={handleResetToLiveData}
                  className="bg-red-600 hover:bg-red-500 text-white font-extrabold text-[11px] px-2.5 py-1 rounded-lg shadow cursor-pointer transition-all border border-red-400 flex items-center gap-1"
                  title="Kembali ke Mode Data Live"
                >
                  🔄 Live Data
                </button>
              </div>
            )}

            <button
              onClick={() => onRefresh && onRefresh()}
              className="bg-black/20 hover:bg-black/40 text-white font-extrabold text-xs px-3 py-2 rounded-xl border border-white/20 shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 backdrop-blur-sm"
              title="Refresh Data"
            >
              <RefreshCw className={`w-5 h-5 text-white ${isRefreshing ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={() => {
                if (activeTab !== "dashboard") {
                  setActiveTab("dashboard");
                } else {
                  setIsNavMenuOpen(!isNavMenuOpen);
                }
              }}
              className="flex bg-red-700 hover:bg-red-600 active:scale-95 text-white font-extrabold text-xs px-2.5 sm:px-3.5 py-2 rounded-xl border border-red-500 shadow-md transition-all cursor-pointer items-center gap-1.5"
              title={activeTab !== "dashboard" ? "Kembali ke Dasbor" : "Buka Menu Navigasi (Garis Tiga)"}
            >
              {activeTab !== "dashboard" ? (
                <>
                  <Home className="w-5 h-5 text-white" />
                  <span className="hidden sm:inline font-extrabold">Dasbor</span>
                </>
              ) : (
                <>
                  <Menu className="w-5 h-5 text-white" />
                  <span className="hidden sm:inline font-extrabold">Menu ☰</span>
                </>
              )}
            </button>
            <button
              onClick={onLogout}
              className="bg-slate-900/80 hover:bg-slate-950 text-slate-100 text-xs font-bold px-3 py-2 rounded-xl border border-slate-700 transition-all cursor-pointer shadow-sm"
            >
              Keluar
            </button>
          </div>
        </div>
      </header>

      {/* Menu Navigasi ala Aplikasi HP (Bottom Sheet / Grid Overlay) */}
      {isNavMenuOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex flex-col justify-end sm:justify-center sm:items-center animate-fade-in" onClick={() => setIsNavMenuOpen(false)}>
          <div 
            className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-slide-up sm:animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Grabber handle for mobile */}
            <div className="w-full flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full"></div>
            </div>
            
            <div className="px-5 pb-3 pt-2 sm:pt-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                  Menu Aplikasi
                </h3>
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  {(motivasiConfig?.tkuName || "DP JEMBER 1").toUpperCase()}
                </p>
              </div>
              <button
                onClick={() => setIsNavMenuOpen(false)}
                className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Grid Icon Menu */}
            <div className="p-5 grid grid-cols-4 gap-y-6 gap-x-2 bg-slate-50/50 dark:bg-slate-900">
              {[
                { id: "dashboard", icon: TrendingUp, label: "Dasbor", color: "bg-red-500", text: "text-red-500", light: "bg-red-50" },
                { id: "lhpp_realisasi", icon: FileSpreadsheet, label: "LHPP", color: "bg-emerald-500", text: "text-emerald-500", light: "bg-emerald-50" },
                { id: "breakdown", icon: Grid3X3, label: "Breakdown dan Realisasi", color: "bg-amber-500", text: "text-amber-500", light: "bg-amber-50" },
                { id: "target_kompensasi", icon: Target, label: "Target", color: "bg-sky-500", text: "text-sky-500", light: "bg-sky-50" },
                { id: "evaluasi", icon: Award, label: "Evaluasi", color: "bg-yellow-500", text: "text-yellow-600", light: "bg-yellow-50" },
                { id: "rata2_bulanan", icon: Calendar, label: "Rata-rata", color: "bg-teal-500", text: "text-teal-500", light: "bg-teal-50" },
                { id: "plg_pjl", icon: PieChart, label: "Pelanggan", color: "bg-cyan-500", text: "text-cyan-500", light: "bg-cyan-50" },
                { id: "lady", icon: Users, label: "Profil YL", color: "bg-indigo-500", text: "text-indigo-500", light: "bg-indigo-50" },
                                { id: "tautan", icon: Globe, label: "Tautan", color: "bg-indigo-600", text: "text-indigo-600", light: "bg-indigo-50" },
                { id: "seragam", icon: Grid3X3, label: "Seragam", color: "bg-purple-500", text: "text-purple-500", light: "bg-purple-50" },
                { id: "product_knowledge", icon: BookOpen, label: "Edukasi", color: "bg-rose-500", text: "text-rose-500", light: "bg-rose-50" },
              ].map((item) => {
                const isActive = activeTab === item.id || (item.id === "lhpp_realisasi" && activeTab === "input_realisasi");
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id as any); setIsNavMenuOpen(false); }}
                    className="flex flex-col items-center gap-2 group cursor-pointer"
                  >
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm ${
                      isActive 
                        ? `${item.color} text-white shadow-md scale-105` 
                        : `bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 ${item.text} group-hover:scale-105 group-hover:shadow-md`
                    }`}>
                      <Icon className={`w-6 h-6 ${isActive ? "text-white" : ""}`} strokeWidth={isActive ? 2.5 : 2} />
                    </div>
                    <span className={`text-[10px] font-bold text-center leading-tight ${
                      isActive ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400"
                    }`}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Bottom Actions */}
            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-3">
              <button
                onClick={() => { setActiveTab("setting"); setIsNavMenuOpen(false); }}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "setting" 
                    ? "bg-slate-800 text-white" 
                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Pengaturan</span>
              </button>
              <button
                onClick={onLogout}
                className="flex items-center justify-center gap-2 py-2.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <span className="text-base leading-none">🚪</span>
                <span>Keluar</span>
              </button>
            </div>
          </div>
        </div>
      )}
      


      {/* Main Container */}
      <main className="max-w-7xl mx-auto p-4">
        {/* Notifikasi Ulang Tahun */}
        {(() => {
          const today = new Date();
          const todayMonthDay = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
          const birthdayLadies = ylList.filter((y: any) => y.tglLahir && y.tglLahir.endsWith(todayMonthDay) && y.status !== "Resign" && y.status !== "nonaktif");
          
          if (birthdayLadies.length === 0) return null;
          
          return (
            <div className="bg-gradient-to-r from-rose-500 to-pink-600 rounded-2xl p-3 sm:p-4 mb-4 shadow-lg text-white border border-rose-400 flex items-center justify-between animate-fade-in relative overflow-hidden">
              <div className="absolute -right-4 -top-4 opacity-10">
                <Sparkles className="w-24 h-24" />
              </div>
              <div className="flex items-center gap-3 relative z-10">
                <div className="bg-white/20 p-2.5 rounded-full backdrop-blur-sm animate-bounce">
                  <span className="text-xl sm:text-2xl leading-none block">🎂</span>
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-white drop-shadow-md flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-rose-200" />
                    Notifikasi Ulang Tahun!
                  </h3>
                  <p className="text-rose-50 text-[11px] sm:text-xs font-medium mt-0.5 max-w-xl leading-snug">
                    Hari ini adalah hari ulang tahun: <strong className="text-white font-black text-xs sm:text-sm">{birthdayLadies.map((y:any) => cleanYlName(y.nama)).join(", ")}</strong>. Jangan lupa berikan ucapan selamat! 🎉
                  </p>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Banner Status Mode Melihat Data Bulanan (Historical vs Live) */}
        {isViewingHistoricalMonth && (
          <div className={`p-3.5 mb-4 rounded-2xl border shadow-md flex flex-wrap items-center justify-between gap-3 animate-fade-in ${
            historicalDataNotFound 
              ? "bg-amber-50 dark:bg-amber-950/80 border-amber-300 dark:border-amber-700 text-amber-950 dark:text-amber-100" 
              : "bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 border-indigo-500 text-white"
          }`}>
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl text-lg font-black shrink-0 ${
                historicalDataNotFound ? "bg-amber-200 text-amber-900" : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
              }`}>
                {historicalDataNotFound ? "⚠️" : "📅"}
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider">
                  {historicalDataNotFound 
                    ? `Data Bulan ${historicalMonthLabel} Tidak Ada di Supabase`
                    : `Menampilkan Data Bulan ${historicalMonthLabel} (Diambil dari Supabase)`}
                </h3>
                <p className="text-[10.5px] font-medium opacity-90 mt-0.5">
                  {historicalDataNotFound
                    ? `Data untuk bulan ${historicalMonthLabel} belum pernah disimpan / difinish ke Supabase.`
                    : `Seluruh menu aplikasi saat ini menampilkan arsip data bulan ${historicalMonthLabel}.`}
                </p>
              </div>
            </div>
            <button
              onClick={handleResetToLiveData}
              className="bg-red-600 hover:bg-red-700 active:scale-95 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl transition-all shadow-sm cursor-pointer flex items-center gap-1.5 shrink-0 border border-red-500"
            >
              🔄 Kembali ke Data Live (Bulan Berjalan)
            </button>
          </div>
        )}

        {/* Tab Dashboard (Bento Grid) */}
        {activeTab === "dashboard" && (
          <AdminBentoMenu
            dashboardData={activeDashboardData}
            targetTKU={activeTargetTKU}
            currentMonthTotal={currentMonthTotal}
            activeGridMap={activeGridMap}
            setActiveTab={setActiveTab}
          />
        )}

        {/* Tab Grafik (Old Dashboard) */}
        {activeTab === "grafik" && (
          <ManagerDashboardTab
            dashboardData={activeDashboardData}
            targetTKU={activeTargetTKU}
            cleanYlName={cleanYlName}
            currentMonthTotal={currentMonthTotal}
            calculateSektorTotals={calculateSektorTotals}
          />
        )}

        {/* Tab Data Rata-Rata Bulanan */}
        {activeTab === "rata2_bulanan" && (
          <Rata2BulananTab ylList={ylList} />
        )}

        {/* Tab Evaluasi */}
        {activeTab === "evaluasi" && (
          !activeEvaluasiData ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400 font-bold bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin" />
              <span>Memuat Data Evaluasi Harian...</span>
            </div>
          ) : (
            <div className={isFullscreenEval ? "fixed inset-0 z-[9999] bg-slate-950 text-slate-100 overflow-y-auto p-2 sm:p-4 space-y-3" : "space-y-3"}>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-stretch">
                {/* 1. PALING ATAS (KIRI): Laporan Evaluasi Harian (Mirror Sheet Table Card) - Expanded to 9 cols */}
                <div className="col-span-1 md:col-span-9 bg-white text-slate-900 rounded-2xl border-2 border-slate-200 shadow-md p-1 flex flex-col justify-between overflow-hidden h-full">
                  {/* Ultra Compact Header */}
                  <div className="py-1 px-2.5 bg-red-950 text-white flex flex-col sm:flex-row sm:items-center justify-between shrink-0 rounded-t-xl gap-1.5 sm:gap-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h3 className="text-[11.5px] sm:text-[13px] font-black uppercase tracking-tight">Laporan Evaluasi Harian (Mirror Sheet)</h3>
                      <div className="text-[9.5px] bg-red-800 text-red-100 px-1.5 py-1 rounded font-bold flex items-center whitespace-nowrap">
                        {showFullEvalTable ? "32 Kolom Lengkap" : "8 Kategori Utama"}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-1">
                      {isFullscreenEval && (
                        <div className="text-[9.5px] bg-emerald-600 text-white px-1.5 py-1 rounded font-bold animate-pulse flex items-center whitespace-nowrap">
                          Mode Slide Layar Penuh
                        </div>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowFullEvalTable(!showFullEvalTable);
                        }}
                        className="text-white bg-red-800 hover:bg-red-700 px-2 py-1 rounded transition-all flex items-center gap-1 font-bold text-[9.5px] cursor-pointer whitespace-nowrap"
                      >
                        {showFullEvalTable ? "Sembunyikan Kolom" : "Tampilkan Tabel Lengkap"}
                      </button>
                      {!isFullscreenEval ? (
                        <button
                          onClick={() => setIsFullscreenEval(true)}
                          className="text-white bg-red-800 hover:bg-red-700 px-2 py-1 rounded transition-all flex items-center gap-1 font-bold text-[9.5px] cursor-pointer whitespace-nowrap"
                          title="Layar Penuh"
                        >
                          <Maximize2 className="w-3 h-3" />
                          <span>Slide Layar Penuh</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setIsFullscreenEval(false)}
                          className="text-white bg-red-800 hover:bg-red-700 px-2 py-1 rounded transition-all flex items-center gap-1 font-bold text-[9.5px] cursor-pointer whitespace-nowrap"
                          title="Keluar Layar Penuh"
                        >
                          <Minimize2 className="w-3 h-3" />
                          <span>Keluar Slide</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div 
                    className="overflow-x-auto overflow-y-visible flex-1 cursor-pointer bg-white"
                    onClick={() => { if (!isFullscreenEval) setIsFullscreenEval(true); }}
                    title={isFullscreenEval ? "" : "Klik tabel untuk masuk Mode Presentasi Slide"}
                  >
                    <table className="w-full text-left border-collapse relative text-[12px] sm:text-[13px] bg-white text-slate-800 font-sans tabular-nums font-semibold">
                      <thead className="sticky top-0 z-10 bg-blue-50 text-blue-900 text-[10.5px] sm:text-[11.5px] uppercase tracking-wider text-center font-bold">
                        {/* Row 0 */}
                        <tr className="border-b border-blue-200">
                          <th rowSpan={3} className="py-1 px-1 border-r border-blue-200 min-w-[32px] text-slate-900">Area</th>
                          <th rowSpan={3} className="py-1 px-1.5 border-r border-blue-200 text-left min-w-[75px] text-slate-900">Nama YL</th>
                          {showFullEvalTable ? (
                            <>
                              <th rowSpan={3} className="py-1 px-1 border-r border-blue-200 text-slate-700">Rata Mgg Lalu</th>
                              <th colSpan={5} className="py-1 px-1 border-r border-blue-200 text-indigo-800">Penjualan Hari Ini</th>
                              <th colSpan={6} className="py-1 px-1 border-r border-blue-200 text-emerald-800">Bulan Ini</th>
                              <th rowSpan={3} className="py-1 px-1 border-r border-blue-200 text-slate-700">Rata Mgg Ini</th>
                              <th rowSpan={3} className="py-1 px-1 border-r border-blue-200 text-slate-700">vs Mgg Lalu</th>
                              <th colSpan={3} className="py-1 px-1 border-r border-blue-200 text-sky-800">Sektor Rmh</th>
                              <th colSpan={3} className="py-1 px-1 border-r border-blue-200 text-purple-800">RB vs Pelanggan</th>
                              <th colSpan={3} className="py-1 px-1 border-r border-blue-200 text-amber-800">Propaganda (PB)</th>
                              <th colSpan={3} className="py-1 px-1 border-r border-blue-200 text-teal-800">Sampah Botol</th>
                              <th colSpan={4} className="py-1 px-1 text-rose-800">Barang Kembali (BB)</th>
                            </>
                          ) : (
                            <>
                              <th colSpan={5} className="py-1 px-1 border-r border-blue-200 text-indigo-800">Penjualan Hari Ini</th>
                              <th rowSpan={3} className="py-1 px-1 border-r border-blue-200 text-emerald-800">Rata Bulan Ini</th>
                              <th rowSpan={3} className="py-1 px-1 border-r border-blue-200 text-slate-700">vs Mgg Lalu</th>
                              <th rowSpan={3} className="py-1 px-1 border-r border-blue-200 text-sky-800">Persen Rumah</th>
                              <th rowSpan={3} className="py-1 px-1 border-r border-blue-200 text-purple-800">Persen RB vs PLG</th>
                              <th colSpan={2} className="py-1 px-1 border-r border-blue-200 text-amber-800">PB Hari Ini</th>
                              <th rowSpan={3} className="py-1 px-1 border-r border-blue-200 text-teal-800">Akm Sampah</th>
                              <th rowSpan={3} className="py-1 px-1 text-rose-800">Akm BB</th>
                            </>
                          )}
                        </tr>
                        {/* Row 1 */}
                        <tr className="border-b border-blue-200">
                          {/* Penjualan Hari Ini */}
                          <th rowSpan={2} className="py-0.5 px-1 border-r border-blue-200 text-indigo-800 font-bold">YO</th>
                          <th rowSpan={2} className="py-0.5 px-1 border-r border-blue-200 text-indigo-800 font-bold">OM</th>
                          <th rowSpan={2} className="py-0.5 px-1 border-r border-blue-200 text-indigo-800 font-bold">OS</th>
                          <th rowSpan={2} className="py-0.5 px-1 border-r border-blue-200 text-indigo-800 font-bold">YT</th>
                          <th rowSpan={2} className="py-0.5 px-1 border-r border-blue-200 font-bold text-slate-900 bg-blue-100/70">ALL</th>

                          {showFullEvalTable ? (
                            <>
                              {/* Bulan Ini */}
                              <th rowSpan={2} className="py-0.5 px-1 border-r border-blue-200 font-bold text-slate-900 bg-blue-100/70">Akm</th>
                              <th colSpan={5} className="py-0.5 px-1 border-r border-blue-200 text-emerald-800 font-bold">Rata-Rata (Rt2)</th>

                              {/* Sektor Rmh */}
                              <th rowSpan={2} className="py-0.5 px-1 border-r border-blue-200 text-sky-800 font-bold">Hari</th>
                              <th rowSpan={2} className="py-0.5 px-1 border-r border-blue-200 text-sky-800 font-bold">Akm</th>
                              <th rowSpan={2} className="py-0.5 px-1 border-r border-blue-200 font-bold text-slate-900 bg-blue-100/70">%</th>

                              {/* RB vs Pelanggan */}
                              <th rowSpan={2} className="py-0.5 px-1 border-r border-blue-200 text-purple-800 font-bold">Pelanggan</th>
                              <th rowSpan={2} className="py-0.5 px-1 border-r border-blue-200 text-purple-800 font-bold">RB</th>
                              <th rowSpan={2} className="py-0.5 px-1 border-r border-blue-200 font-bold text-slate-900 bg-blue-100/70">%</th>

                              {/* Propaganda Baru */}
                              <th rowSpan={2} className="py-0.5 px-1 border-r border-blue-200 text-amber-800 font-bold">Pagi</th>
                              <th rowSpan={2} className="py-0.5 px-1 border-r border-blue-200 text-amber-800 font-bold">Sore</th>
                              <th rowSpan={2} className="py-0.5 px-1 border-r border-blue-200 font-bold text-slate-900 bg-blue-100/70">Akm</th>

                              {/* Sampah Botol */}
                              <th rowSpan={2} className="py-0.5 px-1 border-r border-blue-200 text-teal-800 font-bold">Hari</th>
                              <th rowSpan={2} className="py-0.5 px-1 border-r border-blue-200 text-teal-800 font-bold">Akm</th>
                              <th rowSpan={2} className="py-0.5 px-1 border-r border-blue-200 font-bold text-slate-900 bg-blue-100/70">vs 900</th>

                              {/* Kembali Botol */}
                              <th rowSpan={2} className="py-0.5 px-1 border-r border-blue-200 text-rose-800 font-bold">Hari</th>
                              <th rowSpan={2} className="py-0.5 px-1 border-r border-blue-200 font-bold text-slate-900 bg-blue-100/70">%</th>
                              <th rowSpan={2} className="py-0.5 px-1 border-r border-blue-200 text-rose-800 font-bold">Akm</th>
                              <th rowSpan={2} className="py-0.5 px-1 text-slate-900 font-bold bg-blue-100/70">%</th>
                            </>
                          ) : (
                            <>
                              <th rowSpan={2} className="py-0.5 px-1 border-r border-blue-200 text-amber-800 font-bold">Pagi</th>
                              <th rowSpan={2} className="py-0.5 px-1 text-amber-800 font-bold">Sore</th>
                            </>
                          )}
                        </tr>
                        {/* Row 2 */}
                        <tr className="border-b border-blue-200">
                          {showFullEvalTable && (
                            <>
                              {/* Rata-Rata Bulan Ini */}
                              <th className="py-0.5 px-1 border-r border-blue-200 text-emerald-800 font-bold">YO</th>
                              <th className="py-0.5 px-1 border-r border-blue-200 text-emerald-800 font-bold">OM</th>
                              <th className="py-0.5 px-1 border-r border-blue-200 text-emerald-800 font-bold">OS</th>
                              <th className="py-0.5 px-1 border-r border-blue-200 text-emerald-800 font-bold">YT</th>
                              <th className="py-0.5 px-1 border-r border-blue-200 font-bold text-slate-900 bg-blue-100/70">ALL</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white text-slate-800">
                        {(() => {
                          let maxCols = { c7: -1, c13: -1, c15: -Infinity, c18: -1, c21: -1, pb: -1, c26: -1, c28: Infinity };
                          if (activeEvaluasiData?.dataRows) {
                            activeEvaluasiData.dataRows.forEach(row => {
                              if ((row[7] || 0) > maxCols.c7) maxCols.c7 = row[7] || 0;
                              if ((row[13] || 0) > maxCols.c13) maxCols.c13 = row[13] || 0;
                              if ((row[15] || 0) > maxCols.c15) maxCols.c15 = row[15] || 0;
                              if ((row[18] || 0) > maxCols.c18) maxCols.c18 = row[18] || 0;
                              if ((row[21] || 0) > maxCols.c21) maxCols.c21 = row[21] || 0;
                              const pbSum = (row[22] || 0) + (row[23] || 0);
                              if (pbSum > maxCols.pb) maxCols.pb = pbSum;
                              if ((row[26] || 0) > maxCols.c26) maxCols.c26 = row[26] || 0;
                              
                              const bb = typeof row[28] === "number" ? row[28] : 0;
                              if (bb < maxCols.c28) maxCols.c28 = bb;
                            });
                          }

                          const visibleCols = [0, 1, 3, 4, 5, 6, 7, 13, 15, 18, 21, 22, 23, 26, 30];

                          return (activeEvaluasiData?.dataRows || []).map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-slate-50 border-b border-slate-200 transition-colors">
                              {(row || []).map((val, cIdx) => {
                                if (!showFullEvalTable && !visibleCols.includes(cIdx)) return null;

                                let isTopPerf = false;
                                if (cIdx === 7 && val > 0 && val === maxCols.c7) isTopPerf = true;
                                if (cIdx === 13 && val > 0 && val === maxCols.c13) isTopPerf = true;
                                if (cIdx === 15 && maxCols.c15 !== -Infinity && val === maxCols.c15) isTopPerf = true;
                                if (cIdx === 18 && val > 0 && val === maxCols.c18) isTopPerf = true;
                                if (cIdx === 21 && val > 0 && val === maxCols.c21) isTopPerf = true;
                                if ((cIdx === 22 || cIdx === 23) && maxCols.pb > 0 && ((row[22]||0)+(row[23]||0)) === maxCols.pb) isTopPerf = true;
                                if (cIdx === 26 && val > 0 && val === maxCols.c26) isTopPerf = true;
                                if (cIdx === 30 && maxCols.c28 !== Infinity && val === maxCols.c28) isTopPerf = true;

                                const displayVal = (cIdx === 1 && typeof val === "string") ? cleanYlName(val) : val;

                                return (
                                  <td 
                                    key={cIdx} 
                                    className={`py-0.5 px-1 border-r border-slate-100 text-center whitespace-nowrap ${
                                      cIdx === 1 
                                        ? "text-left font-sans font-bold text-slate-900 min-w-[70px]" 
                                        : "font-sans tabular-nums font-semibold"
                                    } ${
                                      isTopPerf ? "bg-emerald-50/50 font-black text-emerald-700" : ""
                                    }`}
                                  >
                                    {typeof displayVal === "number" ? ([15, 18, 21, 29, 31].includes(cIdx) ? `${displayVal}%` : (cIdx === 27 && displayVal > 0 ? `+${displayVal.toLocaleString("id-ID")}` : displayVal.toLocaleString("id-ID"))) : displayVal}
                                  </td>
                                );
                              })}
                            </tr>
                          ));
                        })()}
                        {activeEvaluasiData?.totalRow && (
                          <tr className="bg-slate-50 font-black border-t-2 border-slate-300 text-slate-900">
                            {(activeEvaluasiData.totalRow || []).map((val, cIdx) => {
                              const visibleCols = [0, 1, 3, 4, 5, 6, 7, 13, 15, 18, 21, 22, 23, 26, 30];
                              if (!showFullEvalTable && !visibleCols.includes(cIdx)) return null;
                              const displayVal = (cIdx === 1 && typeof val === "string") ? cleanYlName(val) : val;
                              return (
                                <td key={cIdx} className={`py-0.5 px-1 border-r border-slate-200 text-center whitespace-nowrap ${cIdx === 1 ? "text-left font-sans" : "font-sans tabular-nums"}`}>
                                  {typeof displayVal === "number" ? ([15, 18, 21, 29, 31].includes(cIdx) ? `${displayVal}%` : (cIdx === 27 && displayVal > 0 ? `+${displayVal.toLocaleString("id-ID")}` : displayVal.toLocaleString("id-ID"))) : displayVal}
                                </td>
                              );
                            })}
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Ultra Compact Action Footer */}
                  <div className="bg-slate-50 py-1 px-2 text-xs font-bold flex flex-wrap items-center justify-between gap-1 border-t border-slate-200 shrink-0">
                    <div className="flex items-center gap-1 text-[9.5px] text-slate-600">
                      <span className="inline-block w-2.5 h-2.5 bg-emerald-200 border border-emerald-400 rounded mr-0.5" />
                      Sel hijau = Performa terbaik harian.
                    </div>
                  </div>
                </div>

                {/* 2. PALING ATAS (KANAN): RINGKASAN PRESTASI (Slimmed to lg:col-span-3) */}
                <div className="col-span-1 md:col-span-3 bg-white rounded-2xl p-1.5 sm:p-2 border-2 border-slate-200 shadow-md flex flex-col justify-between h-full text-slate-900">
                  <div className="flex items-center justify-between shrink-0 mb-1 pb-1 border-b border-slate-100">
                    <h3 className="text-[13px] sm:text-[14px] font-black text-slate-900 uppercase tracking-tight flex items-center gap-1">
                      <Award className="w-3 h-3 text-red-600" /> Ringkasan Prestasi
                    </h3>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1 py-0.2 rounded">8 Block</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-1 flex-1 items-stretch">
                    {/* Block 1 */}
                    <div className="bg-white p-1 rounded-md border border-red-200 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col justify-between text-slate-900">
                      <div className="flex items-center justify-between leading-none">
                        <TrendingUp className="w-3 h-3 text-red-600 shrink-0" />
                        <span className="text-[9.5px] font-black uppercase tracking-tight text-red-800 bg-red-100 border border-red-200 px-0.5 py-0 rounded">Hari Ini</span>
                      </div>
                      <p className="text-[11px] font-extrabold text-slate-600 mt-0.5 truncate leading-none">Penjualan</p>
                      {evaluasiBlocks?.block1 ? (
                        <div className="mt-0.5 leading-tight">
                          <p className="text-[12px] font-black text-slate-950 truncate">{cleanYlName(evaluasiBlocks!.block1.nama)}</p>
                          <p className="text-[13px] font-black text-red-600">{evaluasiBlocks!.block1.jualHariIni} <span className="text-[10px] font-semibold text-slate-500">btl</span></p>
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">Memuat...</p>
                      )}
                    </div>

                    {/* Block 2 */}
                    <div className="bg-white p-1 rounded-md border border-amber-200 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col justify-between text-slate-900">
                      <div className="flex items-center justify-between leading-none">
                        <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                        <span className="text-[9.5px] font-black uppercase tracking-tight text-amber-800 bg-amber-100 border border-amber-200 px-0.5 py-0 rounded">Bulan Ini</span>
                      </div>
                      <p className="text-[11px] font-extrabold text-slate-600 mt-0.5 truncate leading-none">Rata-Rata</p>
                      {evaluasiBlocks?.block2 ? (
                        <div className="mt-0.5 leading-tight">
                          <p className="text-[12px] font-black text-slate-950 truncate">{cleanYlName(evaluasiBlocks!.block2.nama)}</p>
                          <p className="text-[13px] font-black text-amber-600">{Math.trunc(evaluasiBlocks!.block2.rata2BulanBerjalan)} <span className="text-[10px] font-semibold text-slate-500">btl/hr</span></p>
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">Memuat...</p>
                      )}
                    </div>

                    {/* Block 3 */}
                    <div className="bg-white p-1 rounded-md border border-emerald-200 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col justify-between text-slate-900">
                      <div className="flex items-center justify-between leading-none">
                        <Zap className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span className="text-[9.5px] font-black uppercase tracking-tight text-emerald-800 bg-emerald-100 border border-emerald-200 px-0.5 py-0 rounded">vs Mgg</span>
                      </div>
                      <p className="text-[11px] font-extrabold text-slate-600 mt-0.5 truncate leading-none">vs Mgg Lalu</p>
                      {evaluasiBlocks?.block3 ? (
                        <div className="mt-0.5 leading-tight">
                          <p className="text-[12px] font-black text-slate-950 truncate">{cleanYlName(evaluasiBlocks!.block3.nama)}</p>
                          <p className="text-[13px] font-black text-emerald-600">+{Math.trunc(evaluasiBlocks!.block3.vsMingguLaluPct)}%</p>
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">Memuat...</p>
                      )}
                    </div>

                    {/* Block 4 */}
                    <div className="bg-white p-1 rounded-md border border-blue-200 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col justify-between text-slate-900">
                      <div className="flex items-center justify-between leading-none">
                        <Home className="w-3 h-3 text-blue-600 shrink-0" />
                        <span className="text-[9.5px] font-black uppercase tracking-tight text-blue-800 bg-blue-100 border border-blue-200 px-0.5 py-0 rounded">Sektor</span>
                      </div>
                      <p className="text-[11px] font-extrabold text-slate-600 mt-0.5 truncate leading-none">% Rumah</p>
                      {evaluasiBlocks?.block4 ? (
                        <div className="mt-0.5 leading-tight">
                          <p className="text-[12px] font-black text-slate-950 truncate">{cleanYlName(evaluasiBlocks!.block4.nama)}</p>
                          <p className="text-[13px] font-black text-blue-600">{Math.trunc(evaluasiBlocks!.block4.persenRumah)}%</p>
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">Memuat...</p>
                      )}
                    </div>

                    {/* Block 5 */}
                    <div className="bg-white p-1 rounded-md border border-purple-200 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col justify-between text-slate-900">
                      <div className="flex items-center justify-between leading-none">
                        <UserCheck className="w-3 h-3 text-purple-600 shrink-0" />
                        <span className="text-[9.5px] font-black uppercase tracking-tight text-purple-800 bg-purple-100 border border-purple-200 px-0.5 py-0 rounded">Kunjungan</span>
                      </div>
                      <p className="text-[11px] font-extrabold text-slate-600 mt-0.5 truncate leading-none">% RB/PLG</p>
                      {evaluasiBlocks?.block5 ? (
                        <div className="mt-0.5 leading-tight">
                          <p className="text-[12px] font-black text-slate-950 truncate">{cleanYlName(evaluasiBlocks!.block5.nama)}</p>
                          <p className="text-[13px] font-black text-purple-600">{Math.trunc(evaluasiBlocks!.block5.persenRbVsPlg)}%</p>
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">Memuat...</p>
                      )}
                    </div>

                    {/* Block 6 */}
                    <div className="bg-white p-1 rounded-md border border-indigo-200 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col justify-between text-slate-900">
                      <div className="flex items-center justify-between leading-none">
                        <Megaphone className="w-3 h-3 text-indigo-600 shrink-0" />
                        <span className="text-[9.5px] font-black uppercase tracking-tight text-indigo-800 bg-indigo-100 border border-indigo-200 px-0.5 py-0 rounded">Propaganda</span>
                      </div>
                      <p className="text-[11px] font-extrabold text-slate-600 mt-0.5 truncate leading-none">PB Hari Ini</p>
                      {evaluasiBlocks?.block6 ? (
                        <div className="mt-0.5 leading-tight">
                          <p className="text-[12px] font-black text-slate-950 truncate">{cleanYlName(evaluasiBlocks!.block6.nama)}</p>
                          <p className="text-[13px] font-black text-indigo-600">{evaluasiBlocks!.block6.propagandaHariIni} <span className="text-[10px] font-semibold text-slate-500">PB</span></p>
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">Memuat...</p>
                      )}
                    </div>

                    {/* Block 7 */}
                    <div className="bg-white p-1 rounded-md border border-teal-200 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col justify-between text-slate-900">
                      <div className="flex items-center justify-between leading-none">
                        <Trash2 className="w-3 h-3 text-teal-600 shrink-0" />
                        <span className="text-[9.5px] font-black uppercase tracking-tight text-teal-800 bg-teal-100 border border-teal-200 px-0.5 py-0 rounded">Lingkungan</span>
                      </div>
                      <p className="text-[11px] font-extrabold text-slate-600 mt-0.5 truncate leading-none">Akm Sampah</p>
                      {evaluasiBlocks?.block7 ? (
                        <div className="mt-0.5 leading-tight">
                          <p className="text-[12px] font-black text-slate-950 truncate">{cleanYlName(evaluasiBlocks!.block7.nama)}</p>
                          <p className="text-[13px] font-black text-teal-600">{evaluasiBlocks!.block7.sampahBotol} <span className="text-[10px] font-semibold text-slate-500">btl</span></p>
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">Memuat...</p>
                      )}
                    </div>

                    {/* Block 8 */}
                    <div className="bg-white p-1 rounded-md border border-emerald-200 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col justify-between text-slate-900">
                      <div className="flex items-center justify-between leading-none">
                        <CheckCircle className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span className="text-[9.5px] font-black uppercase tracking-tight text-emerald-800 bg-emerald-100 border border-emerald-200 px-0.5 py-0 rounded">Retur</span>
                      </div>
                      <p className="text-[11px] font-extrabold text-slate-600 mt-0.5 truncate leading-none">Akm BB</p>
                      {evaluasiBlocks?.block8 ? (
                        <div className="mt-0.5 leading-tight">
                          <p className="text-[12px] font-black text-slate-950 truncate">{cleanYlName(evaluasiBlocks!.block8.nama)}</p>
                          <p className="text-[13px] font-black text-emerald-600">{(evaluasiBlocks!.block8 as any).akmBb ?? evaluasiBlocks!.block8.bb} <span className="text-[10px] font-semibold text-slate-500">btl</span></p>
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">Memuat...</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. BARIS KEDUA: PERFORMA TERBAIK & PERFORMA TURUN (Compact Height / Perkecil Ke Atas) */}
                <div className="col-span-1 md:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-2">
                  {/* Top Performer Card - Compact Height */}
                  <div className="bg-white dark:bg-white rounded-xl p-2 sm:p-2.5 border-2 border-emerald-300 shadow-sm text-slate-900 flex flex-col justify-between">
                    <div>
                      <h3 className="text-[13px] sm:text-[14px] font-black text-emerald-800 uppercase tracking-tight mb-1 flex items-center gap-1.5">
                        🏆 PERFORMA TERBAIK
                      </h3>
                      {top ? (
                        <div className="text-[12px] sm:text-[13px] text-slate-800 space-y-0.5 leading-snug">
                          <p>
                            <strong className="font-black text-slate-950">{cleanYlName(top.nama)}</strong> memimpin dengan memenangkan{" "}
                            <span className="font-black text-emerald-700">{(top as any).winCount || 0} dari 8 kategori</span>.
                          </p>
                          {(top as any).wonCategories && (top as any).wonCategories.length > 0 && (
                            <p className="text-slate-600 text-[12px]">
                              Keunggulan di: <strong className="font-bold text-emerald-800">{(top as any).wonCategories.join(", ")}</strong>.
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-[12px] text-emerald-700 italic">Memuat data...</p>
                      )}
                    </div>
                    <div className="text-[11.5px] font-bold text-emerald-900 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200 mt-1">
                      👍 Pertahankan efisiensi kunjungan dan rute di sektor andalan Anda!
                    </div>
                  </div>

                  {/* Need Improvement Card - Compact Height */}
                  <div className="bg-white dark:bg-white rounded-xl p-2 sm:p-2.5 border-2 border-rose-300 shadow-sm text-slate-900 flex flex-col justify-between">
                    <div>
                      <h3 className="text-[13px] sm:text-[14px] font-black text-rose-800 uppercase tracking-tight mb-1 flex items-center gap-1.5">
                        ⚠️ PERFORMA TURUN
                      </h3>
                      {needImprovement ? (
                        <div className="text-[12px] sm:text-[13px] text-slate-800 space-y-0.5 leading-snug">
                          <p>
                            <strong className="font-black text-slate-950">{cleanYlName(needImprovement.nama)}</strong> berada di posisi terbawah pada{" "}
                            <span className="font-black text-rose-700">{(needImprovement as any).loseCount || 0} dari 8 kategori</span>.
                          </p>
                          {(needImprovement as any).lostCategories && (needImprovement as any).lostCategories.length > 0 && (
                            <p className="text-slate-600 text-[10.5px]">
                              Kelemahan di: <strong className="font-bold text-rose-800">{(needImprovement as any).lostCategories.join(", ")}</strong>.
                            </p>
                          )}
                          {highestBB && (
                            <p className="text-[12px]">
                              Balik Botol (BB) terbanyak:{" "}
                              <strong className="font-black text-slate-950">{cleanYlName(highestBB.nama)}</strong> ({highestBB.bb} btl).
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-[12px] text-rose-700 italic">Memuat data...</p>
                      )}
                    </div>
                    <div className="text-[11.5px] font-bold text-rose-900 bg-rose-50 px-2 py-1 rounded-md border border-rose-200 mt-1">
                      🚨 Tindakan: Review rute drop-off dan sisa stock harian agar botol retur tidak membengkak!
                    </div>
                  </div>
                </div>

                {/* 4. BARIS KETIGA: AI DEEP EVALUATION CARD (Paling Bawah) */}
                <div className="col-span-1 md:col-span-12 bg-white dark:bg-white rounded-2xl p-3.5 sm:p-4 border-2 border-indigo-200 shadow-md text-slate-900 relative overflow-hidden">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-black text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" /> Analisis & Evaluasi AI Jember 1
                    </h3>
                    <button
                      onClick={runAiInsight}
                      disabled={isAiLoading}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[9.5px] px-2.5 py-1 rounded-lg transition-all shadow-sm flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                    >
                      {isAiLoading ? "Sedang Menganalisis..." : "Jalankan Analisis AI"}
                    </button>
                  </div>

                  {isAiLoading ? (
                    <div className="flex flex-col items-center justify-center py-5 text-center">
                      <div className="w-7 h-7 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-[10px] text-indigo-700 font-bold mt-2">Menganalisis data lembar evaluasi harian dengan Gemini...</span>
                    </div>
                  ) : aiInsight ? (
                    <div
                      className="text-xs text-slate-700 bg-white rounded-xl p-2.5 border border-indigo-100/50 prose max-w-none shadow-sm leading-relaxed max-h-[280px] overflow-y-auto"
                      dangerouslySetInnerHTML={{ __html: aiInsight }}
                    />
                  ) : (
                    <p className="text-xs text-slate-500 italic">
                      Klik tombol di atas untuk memanggil modul kecerdasan buatan Gemini guna menganalisis laporan dropping tim Anda secara mendalam.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )
        )}

        {/* Tab Breakdown Plan & Realisasi */}
        {activeTab === "breakdown" && (
          <div className="space-y-4">
            {/* Header / Month & Mode Selection Card */}
            <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm flex flex-col gap-3">
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🧩</span>
                  <div>
                    <h2 className="text-sm font-black text-slate-900 uppercase leading-none">Breakdown & Realisasi Harian</h2>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">Input rencana harian (BD) & realisasi harian per Yakult Lady</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2.5 flex-wrap">
                  {/* Month Picker */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10.5px] font-bold text-slate-600">Bulan:</span>
                    <input
                      type="month"
                      value={selectedBreakdownMonth}
                      onChange={(e) => {
                        setSelectedBreakdownMonth(e.target.value);
                        fetchBreakdownPlan(e.target.value);
                      }}
                      className="p-1 text-xs font-bold bg-slate-50 rounded-lg border border-slate-200 text-slate-800 outline-none"
                    />
                  </div>

                  {/* Mode Switcher */}
                  <div className="flex bg-slate-100 p-0.5 rounded-lg gap-0.5">
                    <button
                      onClick={() => setGridSubMode("BD")}
                      className={`px-2.5 py-1 text-[11px] font-extrabold rounded-md transition-all cursor-pointer ${
                        gridSubMode === "BD" ? "bg-red-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Breakdown (BD)
                    </button>
                    <button
                      onClick={() => setGridSubMode("R")}
                      className={`px-2.5 py-1 text-[11px] font-extrabold rounded-md transition-all cursor-pointer ${
                        gridSubMode === "R" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Realisasi (R)
                    </button>
                  </div>

                  {/* Pembagi & Percentages Group */}
                  <div className="flex items-center gap-2.5 flex-nowrap">
                    {/* Manual Pembagi */}
                    <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg">
                      <span className="text-[10px] font-bold text-slate-700">Pembagi:</span>
                      <input
                        type="number"
                        min={1}
                        max={31}
                        value={
                          activeGridMap && Object.keys(activeGridMap).length > 0
                            ? activeGridMap[Object.keys(activeGridMap)[0]]?.pembagiTanggal ?? 25
                            : 25
                        }
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => handleGlobalPembagiChange(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-10 p-0.5 text-xs font-extrabold text-center bg-white border border-slate-300 rounded-md text-slate-900 outline-none"
                      />
                    </div>
                    
                    {/* Percentages */}
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <span className="text-slate-500">vs Tgt:</span>
                        <span className={monthlyGridStats.pctTgt >= 100 ? "text-emerald-600" : "text-rose-600"}>
                          {monthlyGridStats.pctTgt.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                        </span>
                      </div>
                      <div className="w-px h-3 bg-slate-300" />
                      <div className="flex items-center gap-1">
                        <span className="text-slate-500">vs BL:</span>
                        <span className={monthlyGridStats.pctBL >= 100 ? "text-emerald-600" : "text-rose-600"}>
                          {monthlyGridStats.pctBL.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                        </span>
                      </div>
                      <div className="w-px h-3 bg-slate-300" />
                      <div className="flex items-center gap-1">
                        <span className="text-slate-500">vs TL:</span>
                        <span className={monthlyGridStats.pctTL >= 100 ? "text-emerald-600" : "text-rose-600"}>
                          {monthlyGridStats.pctTL.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Save */}
                  <button
                    onClick={() => handleSaveBreakdownPlan(true)}
                    disabled={isBreakdownSaving}
                    className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-[11px] px-3 py-1.5 rounded-lg transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5 ml-auto"
                  >
                    {isBreakdownSaving ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Simpan...</span>
                      </>
                    ) : (
                      <>
                        <span>💾</span>
                        <span>Simpan</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
              
              {breakdownMsg && (
                <p className="text-[11px] font-bold text-emerald-600 bg-emerald-50 p-1.5 rounded-lg border border-emerald-200 animate-pulse text-center">
                  {breakdownMsg}
                </p>
              )}
            </div>

            {/* Grid Table Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 text-slate-600 text-[10px] uppercase font-bold sticky top-0 z-10 shadow-sm">
                    {/* Baris 1: Tanggal Grouping (colSpan=4) & Summary Categories */}
                    <tr>
                      <th rowSpan={2} className="p-2 sticky left-0 bg-slate-50 z-20 min-w-[130px] border-b border-r border-slate-200 text-slate-700 shadow-[1px_0_0_0_#e2e8f0]">
                        Yakult Lady
                      </th>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                        <th key={d} colSpan={4} className="p-1 text-center border-l border-b border-slate-300 bg-blue-100 text-blue-900 min-w-[160px]">
                          {d}
                        </th>
                      ))}
                      <th colSpan={5} className="p-1 text-center border-l border-b border-slate-300 bg-slate-200 text-slate-800">
                        TOTAL 4 ITEM
                      </th>
                      <th colSpan={5} className="p-1 text-center border-l border-b border-slate-300 bg-amber-100 text-amber-900">
                        RATA-RATA HARIAN
                      </th>
                      <th colSpan={6} className="p-1 text-center border-l border-b border-slate-300 bg-purple-100 text-purple-900">
                        TARGET & PEMBANDING
                      </th>
                    </tr>

                    {/* Baris 2: Sub-kolom Per Tanggal (YO, OM, OS, YT) & Sub-kolom Ringkasan */}
                    <tr>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                        <React.Fragment key={d}>
                          <th className="p-1 text-center border-l border-b border-slate-300 text-slate-700 bg-slate-200/90 text-[9px] min-w-[40px]">YO</th>
                          <th className="p-1 text-center border-l border-b border-slate-300 text-slate-700 bg-slate-200/90 text-[9px] min-w-[40px]">OM</th>
                          <th className="p-1 text-center border-l border-b border-slate-300 text-slate-700 bg-slate-200/90 text-[9px] min-w-[40px]">OS</th>
                          <th className="p-1 text-center border-l border-b border-slate-300 text-slate-700 bg-slate-200/90 text-[9px] min-w-[40px]">YT</th>
                        </React.Fragment>
                      ))}

                      {/* Sub-header TOTAL 4 ITEM */}
                      <th className="p-1 text-center border-l border-b border-slate-300 text-slate-800 bg-slate-200 text-[9px] min-w-[42px]">YO</th>
                      <th className="p-1 text-center border-l border-b border-slate-300 text-slate-800 bg-slate-200 text-[9px] min-w-[42px]">OM</th>
                      <th className="p-1 text-center border-l border-b border-slate-300 text-slate-800 bg-slate-200 text-[9px] min-w-[42px]">OS</th>
                      <th className="p-1 text-center border-l border-b border-slate-300 text-slate-800 bg-slate-200 text-[9px] min-w-[42px]">YT</th>
                      <th className="p-1 text-center border-l border-b border-slate-300 text-slate-900 bg-slate-300 text-[9px] min-w-[48px]">TOTAL</th>

                      {/* Sub-header RATA-RATA HARIAN */}
                      <th className="p-1 text-center border-l border-b border-slate-200 text-red-700 bg-amber-100/60 text-[9px] min-w-[42px]">YO</th>
                      <th className="p-1 text-center border-l border-b border-slate-200 text-amber-700 bg-amber-100/60 text-[9px] min-w-[42px]">OM</th>
                      <th className="p-1 text-center border-l border-b border-slate-200 text-pink-700 bg-amber-100/60 text-[9px] min-w-[42px]">OS</th>
                      <th className="p-1 text-center border-l border-b border-slate-200 text-blue-700 bg-amber-100/60 text-[9px] min-w-[42px]">YT</th>
                      <th className="p-1 text-center border-l border-b border-slate-200 text-amber-900 bg-amber-300 text-[9px] min-w-[48px]">RATA</th>

                      {/* Sub-header TARGET & PEMBANDING */}
                      <th className="p-1 text-center border-l border-b border-slate-200 text-purple-700 bg-purple-100/60 text-[9px] min-w-[48px]">Target</th>
                      <th className="p-1 text-center border-l border-b border-slate-200 text-emerald-700 bg-purple-100/60 text-[9px] min-w-[48px]">Sel. Tgt</th>
                      <th className="p-1 text-center border-l border-b border-slate-200 text-indigo-700 bg-purple-100/60 text-[9px] min-w-[48px]">Bln Lalu</th>
                      <th className="p-1 text-center border-l border-b border-slate-200 text-emerald-700 bg-purple-100/60 text-[9px] min-w-[48px]">Sel. BL</th>
                      <th className="p-1 text-center border-l border-b border-slate-200 text-teal-700 bg-purple-100/60 text-[9px] min-w-[48px]">Thn Lalu</th>
                      <th className="p-1 text-center border-l border-b border-slate-200 text-emerald-700 bg-purple-100/60 text-[9px] min-w-[48px]">Sel. TL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {ylList.filter((y: any) => y.status !== "nonaktif").map((yl: any, idx: number) => (
                      <BreakdownGridRow
                        key={yl.area || idx}
                        yl={yl}
                        rIdx={idx}
                        activeGridMap={activeGridMap}
                        targetYLMap={targetYLMap}
                        breakdownDateRange="1-31"
                        gridSelection={gridSelection}
                        isFillDragging={isFillDragging}
                        fillHoverCell={fillHoverCell}
                        isGridDragging={isGridDragging}
                        touchStartRef={touchStartRef}
                        setGridSelection={setGridSelection}
                        setIsGridDragging={setIsGridDragging}
                        setFillHoverCell={setFillHoverCell}
                        handleTouchMoveGrid={handleTouchMoveGrid}
                        handleBreakdownCellChange={handleBreakdownCellChange}
                        handlePasteIntoGrid={handlePasteIntoGrid}
                        setIsBreakdownMenuOpen={setIsBreakdownMenuOpen}
                        setBreakdownMenuPos={setBreakdownMenuPos}
                      />
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 text-slate-800 font-black border-t-2 border-slate-300 shadow-[0_-1px_0_0_#cbd5e1]">
                    <tr className="text-[11px] divide-x divide-slate-200">
                      <td className="p-2.5 sticky left-0 bg-slate-50 z-20 font-black text-slate-800 text-left whitespace-nowrap shadow-[1px_0_0_0_#e2e8f0]">
                        TOTAL HARIAN
                      </td>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => {
                        const data = dailyGridTotals[d] || { yo: 0, om: 0, os: 0, yt: 0 };
                        return (
                          <React.Fragment key={d}>
                            <td className="p-1 text-center text-red-700 font-black bg-slate-50/90">{data.yo}</td>
                            <td className="p-1 text-center text-amber-700 font-black bg-slate-50/90">{data.om}</td>
                            <td className="p-1 text-center text-pink-700 font-black bg-slate-50/90">{data.os}</td>
                            <td className="p-1 text-center text-blue-700 font-black bg-slate-50/90">{data.yt}</td>
                          </React.Fragment>
                        );
                      })}
                      <td className="p-1 text-center font-bold text-red-800 bg-red-100/60">{monthlyGridTotals.yo}</td>
                      <td className="p-1 text-center font-bold text-amber-800 bg-red-100/60">{monthlyGridTotals.om}</td>
                      <td className="p-1 text-center font-bold text-pink-800 bg-red-100/60">{monthlyGridTotals.os}</td>
                      <td className="p-1 text-center font-bold text-blue-800 bg-red-100/60">{monthlyGridTotals.yt}</td>
                      <td className="p-1 text-center font-black text-slate-800 bg-slate-200">{monthlyGridTotals.yo + monthlyGridTotals.om + monthlyGridTotals.os + monthlyGridTotals.yt}</td>
                      
                      {(() => {
                        const pembagiStr = (activeGridMap && Object.keys(activeGridMap).length > 0) ? (activeGridMap[Object.keys(activeGridMap)[0]]?.pembagiTanggal ?? 25) : 25;
                        const pembagi = Number(pembagiStr) || 25;
                        const ryo = Math.round(monthlyGridTotals.yo / pembagi);
                        const rom = Math.round(monthlyGridTotals.om / pembagi);
                        const ros = Math.round(monthlyGridTotals.os / pembagi);
                        const ryt = Math.round(monthlyGridTotals.yt / pembagi);
                        const rsum = ryo + rom + ros + ryt;
                        return (
                          <React.Fragment>
                            <td className="p-1 text-center font-bold text-red-800 bg-amber-100/60">{ryo}</td>
                            <td className="p-1 text-center font-bold text-amber-800 bg-amber-100/60">{rom}</td>
                            <td className="p-1 text-center font-bold text-pink-800 bg-amber-100/60">{ros}</td>
                            <td className="p-1 text-center font-bold text-blue-800 bg-amber-100/60">{ryt}</td>
                            <td className="p-1 text-center font-black text-amber-900 bg-amber-300">{rsum}</td>
                          </React.Fragment>
                        );
                      })()}

                      {(() => {
                        let totalTarget = 0, totalBL = 0, totalTL = 0;
                        const pembagiStr = (activeGridMap && Object.keys(activeGridMap).length > 0) ? (activeGridMap[Object.keys(activeGridMap)[0]]?.pembagiTanggal ?? 25) : 25;
                        const pembagi = Number(pembagiStr) || 25;
                        
                        const activeYLs = activeYLsList.filter((y: any) => y.status !== "nonaktif");
                        const sumTarget = activeYLs.reduce((sum: number, yl: any) => sum + (Number(activeTargetYLMap[yl.area]?.target) || 0), 0);
                        const sumBL = activeYLs.reduce((sum: number, yl: any) => sum + (Number(activeTargetYLMap[yl.area]?.bln_lalu) || 0), 0);
                        const sumTL = activeYLs.reduce((sum: number, yl: any) => sum + (Number(activeTargetYLMap[yl.area]?.thn_lalu) || 0), 0);
                        
                        totalTarget = Math.round(sumTarget) * pembagi;
                        totalBL = Math.round(sumBL) * pembagi;
                        totalTL = Math.round(sumTL) * pembagi;

                        const grandTotal = monthlyGridTotals.yo + monthlyGridTotals.om + monthlyGridTotals.os + monthlyGridTotals.yt;
                        const dTarget = grandTotal - totalTarget;
                        const dBL = grandTotal - totalBL;
                        const dTL = grandTotal - totalTL;
                        return (
                          <React.Fragment>
                            <td className="p-1 text-center font-bold text-purple-800 bg-purple-100/60">{totalTarget}</td>
                            <td className={`p-1 text-center font-black ${dTarget >= 0 ? "text-emerald-700 bg-emerald-100/80" : "text-rose-700 bg-rose-100/80"}`}>
                              {dTarget >= 0 ? `+${dTarget}` : dTarget}
                            </td>
                            <td className="p-1 text-center font-bold text-indigo-800 bg-purple-100/60">{totalBL}</td>
                            <td className={`p-1 text-center font-black ${dBL >= 0 ? "text-emerald-700 bg-emerald-100/80" : "text-rose-700 bg-rose-100/80"}`}>
                              {dBL >= 0 ? `+${dBL}` : dBL}
                            </td>
                            <td className="p-1 text-center font-bold text-teal-300 bg-purple-950/60">{totalTL}</td>
                            <td className={`p-1 text-center font-black ${dTL >= 0 ? "text-emerald-300 bg-emerald-900/60" : "text-rose-300 bg-rose-900/60"}`}>
                              {dTL >= 0 ? `+${dTL}` : dTL}
                            </td>
                          </React.Fragment>
                        );
                      })()}
                    </tr>

                    <tr className="bg-slate-200 text-slate-800 font-black text-[11px] uppercase divide-x divide-slate-300">
                      <td className="p-2.5 sticky left-0 bg-slate-300 z-20 text-left font-black tracking-wide text-slate-900 shadow-[1px_0_0_0_#cbd5e1]">
                        TOTAL ALL VARIAN
                      </td>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => {
                        const data = dailyGridTotals[d] || { yo: 0, om: 0, os: 0, yt: 0 };
                        const sum = data.yo + data.om + data.os + data.yt;
                        return (
                          <td key={d} colSpan={4} className="p-1 text-center bg-slate-200 font-black text-slate-800">
                            {sum} btl
                          </td>
                        );
                      })}
                      <td colSpan={5} className="p-1 text-center font-black text-slate-900 bg-slate-300">
                        {monthlyGridTotals.yo + monthlyGridTotals.om + monthlyGridTotals.os + monthlyGridTotals.yt} btl
                      </td>
                      {(() => {
                        const pembagiStr = (activeGridMap && Object.keys(activeGridMap).length > 0) ? (activeGridMap[Object.keys(activeGridMap)[0]]?.pembagiTanggal ?? 25) : 25;
                        const pembagi = Number(pembagiStr) || 25;
                        const ryo = Math.round(monthlyGridTotals.yo / pembagi);
                        const rom = Math.round(monthlyGridTotals.om / pembagi);
                        const ros = Math.round(monthlyGridTotals.os / pembagi);
                        const ryt = Math.round(monthlyGridTotals.yt / pembagi);
                        const rsum = ryo + rom + ros + ryt;
                        return (
                          <td colSpan={5} className="p-1 text-center font-black text-slate-900 bg-slate-300/90">
                            {rsum} btl
                          </td>
                        );
                      })()}
                      <td colSpan={6} className="bg-slate-300/80"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <GridSelectionToolbar
              selection={gridSelection}
              isMenuOpen={isBreakdownMenuOpen}
              menuPos={breakdownMenuPos}
              onCopy={handleCopyGridCells}
              onCut={handleCutGridCells}
              onPaste={async () => {
                try {
                  const text = await navigator.clipboard.readText();
                  if (text && gridSelection) handlePasteIntoGrid(text);
                } catch (e) {
                  setBreakdownClipboardModal({ mode: "paste", text: "" });
                }
              }}
              onClear={handleClearSelectedGridCells}
              onSelectAll={handleSelectAllGridCells}
              onClose={() => {
                setIsBreakdownMenuOpen(false);
                setGridSelection(null);
              }}
            />
            {breakdownClipboardModal && (
              <ClipboardFallbackModal
                mode={breakdownClipboardModal.mode}
                initialText={breakdownClipboardModal.text}
                onConfirmPaste={(text) => {
                  handlePasteIntoGrid(text);
                  setBreakdownClipboardModal(null);
                }}
                onClose={() => setBreakdownClipboardModal(null)}
              />
            )}
          </div>
        )}

        {/* Tab Target & Kompensasi */}
        {activeTab === "target_kompensasi" && (
          <div className="space-y-4">
            {/* Target TKU Card */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🎯</span>
                  <div>
                    <h2 className="text-sm font-black text-slate-900 uppercase">Target TKU Bulan Ini</h2>
                    <p className="text-[10.5px] text-slate-500 font-medium">Pengaturan target penjualan harian untuk TKU</p>
                  </div>
                </div>
                <button
                  onClick={handleSaveSettingTargets}
                  className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition-all shadow cursor-pointer flex items-center gap-1.5"
                >
                  <span>💾</span>
                  <span>Simpan All Target & Kompensasi</span>
                </button>
              </div>

              {compSavedMsg && (
                <p className="text-xs font-bold text-emerald-600 bg-emerald-50 p-2 rounded-xl border border-emerald-200 animate-pulse">
                  {compSavedMsg}
                </p>
              )}

              <div className="overflow-x-auto pt-2">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100 text-slate-700 text-[10px] uppercase font-bold">
                    <tr>
                      <th className="p-2 border-b border-slate-200">Baris Target / Realisasi</th>
                      <th className="p-2 border-b border-slate-200 text-center font-extrabold text-blue-700 bg-blue-50/50">Total</th>
                      <th className="p-2 border-b border-slate-200 text-center">Yakult (YO)</th>
                      <th className="p-2 border-b border-slate-200 text-center">Light (OM)</th>
                      <th className="p-2 border-b border-slate-200 text-center">Yakult (OS)</th>
                      <th className="p-2 border-b border-slate-200 text-center">Light (YT)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono">
                    {[
                      { title: "Target Bulan Ini", prefix: "target", r: 0 },
                      { title: "Realisasi Bulan Lalu", prefix: "bln_lalu", r: 1 },
                      { title: "Realisasi Tahun Lalu", prefix: "thn_lalu", r: 2 },
                    ].map((rowItem) => {
                      const totalVal = (activeTargetTKU as any)[rowItem.prefix] ?? 0;
                      return (
                        <tr key={rowItem.prefix} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-2.5 font-bold text-slate-800 border-r border-slate-200 bg-slate-50/60 select-none">
                            {rowItem.title}
                          </td>
                          <td className="p-2 text-center border-r border-slate-200 font-black text-blue-900 bg-blue-50/30 text-xs">
                            {Math.round(totalVal).toLocaleString("id-ID")}
                          </td>
                          {(["_yo", "_om", "_os", "_yt"] as const).map((sfx, cIdx) => {
                            const val = (activeTargetTKU as any)[`${rowItem.prefix}${sfx}`] ?? 0;
                            const cellProps = getTkuCellProps(rowItem.r, cIdx);
                            return (
                              <td
                                key={sfx}
                                {...cellProps}
                                className={`p-1.5 text-center border-r border-slate-200 ${cellProps.className}`}
                              >
                                <NumberInput
                                  min={0}
                                  value={val}
                                  onPaste={(e) => {
                                    const text = e.clipboardData.getData("text/plain");
                                    if (!text) return;
                                    e.preventDefault();
                                    const newSel = { startR: rowItem.r, startC: cIdx, endR: rowItem.r, endC: cIdx };
                                    setTkuGridSelection(newSel);
                                    setTimeout(() => {
                                      handleTkuGridPaste(text, newSel);
                                    }, 0);
                                  }}
                                  onChange={(n) => {
                                    handleUpdateTargetTKU((prev: any) => {
                                      const updated = { ...prev, [`${rowItem.prefix}${sfx}`]: n };
                                      const yo = updated[`${rowItem.prefix}_yo`] ?? 0;
                                      const om = updated[`${rowItem.prefix}_om`] ?? 0;
                                      const os = updated[`${rowItem.prefix}_os`] ?? 0;
                                      const yt = updated[`${rowItem.prefix}_yt`] ?? 0;
                                      updated[rowItem.prefix] = yo + om + os + yt;
                                      return updated;
                                    });
                                  }}
                                  className="w-full h-full p-1 text-xs text-center font-bold text-slate-900 bg-transparent outline-none border-none"
                                />
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Target YL Table Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-4 space-y-3">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Target per Yakult Lady</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100 text-slate-700 text-[10px] uppercase font-bold">
                    <tr>
                      <th className="p-2 border-b border-slate-200">Yakult Lady</th>
                      <th className="p-2 border-b border-slate-200 text-center">Target Rata-Rata</th>
                      <th className="p-2 border-b border-slate-200 text-center">Realisasi Bulan Lalu</th>
                      <th className="p-2 border-b border-slate-200 text-center">Realisasi Tahun Lalu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {ylList.filter((y: any) => y.status !== "nonaktif").map((yl: any, idx: number) => (
                      <TargetManagerRow
                        key={yl.area || idx}
                        yl={yl}
                        idx={idx}
                        targetYLMap={activeTargetYLMap}
                        setTargetYLMap={isViewingHistoricalMonth ? handleUpdateTargetYLMap : setTargetYLMap}
                        getTargetCellProps={getTargetCellProps}
                        selectTargetRow={selectTargetRow}
                        setTargetGridSelection={setTargetGridSelection}
                        handleTargetGridPaste={handleTargetGridPaste}
                      />
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-100 text-slate-800 text-[11px] font-black uppercase shadow-[inset_0_1px_0_rgba(0,0,0,0.1)]">
                    <tr>
                      <td className="p-2.5 text-right border-r-2 border-slate-300">TOTAL</td>
                      <td className="p-1.5 text-center border-r border-slate-300 text-sm">
                        {Math.round(ylList.filter((y: any) => y.status !== "nonaktif").reduce((sum: number, yl: any) => sum + (Number(activeTargetYLMap[yl.area]?.target) || 0), 0)).toLocaleString("id-ID")}
                      </td>
                      <td className="p-1.5 text-center border-r border-slate-300 text-sm">
                        {Math.round(ylList.filter((y: any) => y.status !== "nonaktif").reduce((sum: number, yl: any) => sum + (Number(activeTargetYLMap[yl.area]?.bln_lalu) || 0), 0)).toLocaleString("id-ID")}
                      </td>
                      <td className="p-1.5 text-center border-r border-slate-300 text-sm">
                        {Math.round(ylList.filter((y: any) => y.status !== "nonaktif").reduce((sum: number, yl: any) => sum + (Number(activeTargetYLMap[yl.area]?.thn_lalu) || 0), 0)).toLocaleString("id-ID")}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Estimasi Rincian Kompensasi Bulanan per YL Card */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">💰</span>
                  <div>
                    <h2 className="text-sm font-black text-slate-900 uppercase">
                      Estimasi Rincian Kompensasi Bulanan per YL
                    </h2>
                    <p className="text-[10.5px] text-slate-500 font-medium">
                      Simulasi kompensasi kotor, potongan PPh (2,5%), Iuran JKK/JKM, JHT, dan kompensasi bersih per Yakult Lady
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">
                  Pilih Yakult Lady
                </label>
                <select
                  value={selectedYLArea}
                  onChange={(e) => setSelectedYLArea(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 rounded-xl border border-slate-200 outline-none font-bold text-slate-700"
                >
                  {(ylList && ylList.length > 0 ? ylList : names.map((n: string) => ({ area: n.substring(0, 3), nama: n }))).map((yl: any) => (
                    <option key={yl.area} value={yl.area}>
                      {yl.nama} ({yl.area})
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected YL Details */}
              {(() => {
                const ylPerf = activeDashboardData?.perYL?.[selectedYLArea];
                const totalPenjualanYL = ylPerf?.akumulasi ?? 0;
                const rata2PenjualanYL = ylPerf?.rata2 ?? 0;
                const targetYLVal = ylPerf?.targetYL ?? activeTargetYLMap?.[selectedYLArea]?.target ?? 0;
                const daysInMonth = ylPerf?.pembagi || 15;

                const effectiveTotal = totalPenjualanYL > 0 ? totalPenjualanYL : (targetYLVal * daysInMonth);
                const effectiveAvg = rata2PenjualanYL > 0 ? rata2PenjualanYL : targetYLVal;

                let rateTier = 338;
                if (effectiveAvg >= 350) rateTier = 432;
                else if (effectiveAvg >= 330) rateTier = 428;
                else if (effectiveAvg >= 300) rateTier = 424;
                else if (effectiveAvg >= 280) rateTier = 417;
                else if (effectiveAvg >= 250) rateTier = 409;
                else if (effectiveAvg >= 200) rateTier = 374;

                const kompenKotor = (ylDetail?.kompensasi?.kompensasi && ylDetail.kompensasi.kompensasi > 0)
                  ? ylDetail.kompensasi.kompensasi
                  : Math.floor(effectiveTotal * rateTier);
                const pphVal = (ylDetail?.kompensasi?.pph && ylDetail.kompensasi.pph > 0)
                  ? ylDetail.kompensasi.pph
                  : Math.floor(kompenKotor * 0.025);
                const jkkVal = ylDetail?.kompensasi?.jkk || 18800;
                const jhtVal = ylDetail?.kompensasi?.jht || 24000;
                const kresekVal = ylDetail?.kompensasi?.kresekDll || 0;
                const kompenBersihVal = (ylDetail?.kompensasi?.kompenBersih && ylDetail.kompensasi.kompenBersih > 0)
                  ? ylDetail.kompensasi.kompenBersih
                  : Math.max(0, kompenKotor - pphVal - jkkVal - jhtVal - kresekVal);

                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-center">
                        <span className="text-[9px] font-black text-slate-400 uppercase block">Total Akumulasi Penjualan</span>
                        <span className="text-sm font-black text-slate-900 mt-1 block">
                          {Math.trunc(totalPenjualanYL).toLocaleString("id-ID")} btl
                        </span>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-center">
                        <span className="text-[9px] font-black text-slate-400 uppercase block">Rata-Rata Penjualan</span>
                        <span className="text-sm font-black text-slate-900 mt-1 block">
                          {Math.trunc(rata2PenjualanYL)} btl/hr
                        </span>
                      </div>
                    </div>

                    {/* Kompensasi Table */}
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                      <div className="p-3 bg-slate-900 text-white font-black text-xs uppercase tracking-wider flex items-center justify-between">
                        <span>Rincian Kompensasi & Potongan</span>
                        <span className="text-[10px] bg-emerald-500 text-slate-950 font-black px-2 py-0.5 rounded">
                          Area {selectedYLArea}
                        </span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <tbody className="divide-y divide-slate-100 font-bold">
                            <tr>
                              <td className="p-2.5 text-slate-600 font-normal">Kompensasi Kotor</td>
                              <td className="p-2.5 text-right text-slate-900 font-black">{formatRp(kompenKotor)}</td>
                            </tr>
                            <tr className="text-rose-600 bg-rose-50/40">
                              <td className="p-2.5 font-normal">PPh (2,5%)</td>
                              <td className="p-2.5 text-right font-bold">- {formatRp(pphVal)}</td>
                            </tr>
                            <tr className="text-rose-600 bg-rose-50/40">
                              <td className="p-2.5 font-normal">Iuran JKK / JKM</td>
                              <td className="p-2.5 text-right font-bold">- {formatRp(jkkVal)}</td>
                            </tr>
                            <tr className="text-rose-600 bg-rose-50/40">
                              <td className="p-2.5 font-normal">Iuran JHT</td>
                              <td className="p-2.5 text-right font-bold">- {formatRp(jhtVal)}</td>
                            </tr>
                            <tr className="text-rose-600 bg-rose-50/40">
                              <td className="p-2.5 font-normal">Kresek / Potongan Mandiri</td>
                              <td className="p-2.5 text-right font-bold">- {formatRp(kresekVal)}</td>
                            </tr>
                            <tr className="bg-emerald-100/80 text-emerald-950 font-black text-sm border-t-2 border-emerald-300">
                              <td className="p-3">Kompensasi Bersih</td>
                              <td className="p-3 text-right text-emerald-700 font-black text-base">{formatRp(kompenBersihVal)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            <GridSelectionToolbar
              selection={targetGridSelection}
              isMenuOpen={targetIsMenuOpen}
              menuPos={targetMenuPos}
              onCopy={handleTargetGridCopy}
              onCut={handleTargetGridCut}
              onPaste={handleTargetGridPaste}
              onClear={handleTargetGridClear}
              onClose={() => {
                setTargetIsMenuOpen(false);
                setTargetGridSelection(null);
              }}
            />
            {targetClipboardModal && (
              <ClipboardFallbackModal
                mode={targetClipboardModal.mode}
                initialText={targetClipboardModal.text}
                onConfirmPaste={targetConfirmManualPaste}
                onClose={closeTargetClipboardModal}
              />
            )}

            <GridSelectionToolbar
              selection={tkuGridSelection}
              isMenuOpen={tkuIsMenuOpen}
              menuPos={tkuMenuPos}
              onCopy={handleTkuGridCopy}
              onCut={handleTkuGridCut}
              onPaste={handleTkuGridPaste}
              onClear={handleTkuGridClear}
              onClose={() => {
                setTkuIsMenuOpen(false);
                setTkuGridSelection(null);
              }}
            />
            {tkuClipboardModal && (
              <ClipboardFallbackModal
                mode={tkuClipboardModal.mode}
                initialText={tkuClipboardModal.text}
                onConfirmPaste={tkuConfirmManualPaste}
                onClose={closeTkuClipboardModal}
              />
            )}
          </div>
        )}

        {/* Tautan Yakult */}
        {activeTab === "tautan" && <OfficialLinksViewer isAdmin={true} onBack={() => { setActiveTab("dashboard"); setIsNavMenuOpen(false); }} />}

        {/* Tab Pengaturan & Cloud Supabase */}
        {activeTab === "setting" && (
          <div className="space-y-4">
            {/* 7. Catatan Perhatian Manager (Attention YL) */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider border-l-4 border-indigo-600 pl-2">
                📌 Catatan Perhatian Manager (Attention YL)
              </h2>
              <p className="text-xs text-slate-500">
                Pesan atau arahan khusus ini akan ditampilkan secara eksklusif di dashboard YL sesuai area yang dipilih.
              </p>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                    Pilih Area YL
                  </label>
                  <select
                    value={attentionArea}
                    onChange={(e) => {
                      const area = e.target.value;
                      setAttentionArea(area);
                      setAttentionText(area === "all" ? "" : (attentionMap[area] || ""));
                    }}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-2.5 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="all">🌐 Semua YL (Kirim ke semua)</option>
                    {ylList.map((y: any) => (
                      <option key={y.area} value={y.area}>
                        Area {y.area} - {y.nama}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                    Pesan Attention / Catatan Khusus
                  </label>
                  <textarea
                    rows={3}
                    value={attentionText}
                    onChange={(e) => setAttentionText(e.target.value)}
                    placeholder="Ketik catatan atau instruksi khusus untuk YL di area ini..."
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-2.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                  />
                </div>

                {attentionSavedMsg && (
                  <p className="text-xs font-bold text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                    Catatan Attention berhasil disimpan!
                  </p>
                )}

                <button
                  onClick={handleSaveAttention}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow cursor-pointer flex items-center gap-1.5"
                >
                  <span>💾</span>
                  <span>Simpan Catatan Attention</span>
                </button>
              </div>
            </div>
            {/* 6. Kelola Kalimat Motivasi Harian (YL) */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider border-l-4 border-amber-500 pl-2">
                  📢 Kelola Kalimat Motivasi Harian (Running Text YL)
                </h2>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-xs font-extrabold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localMotivasiEnabled}
                      onChange={(e) => setLocalMotivasiEnabled(e.target.checked)}
                      className="accent-amber-600 rounded cursor-pointer w-4 h-4"
                    />
                    Aktifkan Running Text
                  </label>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Interval:</span>
                    <input
                      type="number"
                      min={5}
                      value={localMotivasiInterval}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => setLocalMotivasiInterval(e.target.value === '' ? '' : Number(e.target.value))}
                      className="bg-slate-50 border border-slate-200 text-xs rounded-xl p-1.5 font-extrabold text-slate-800 w-16 text-center focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <span className="text-xs font-bold text-slate-500">detik</span>
                  </div>
                </div>
              </div>

              {/* Input Tambah Kalimat */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                  Tambah Kalimat Motivasi Baru
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMotivasiInput}
                    onChange={(e) => setNewMotivasiInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleAddMotivasi(); }}
                    placeholder="Ketik kalimat motivasi baru untuk YL di sini..."
                    className="flex-1 bg-slate-50 border border-slate-200 text-xs rounded-xl p-2.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    onClick={handleAddMotivasi}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow shrink-0"
                  >
                    ➕ Tambah
                  </button>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleSelectAllMotivasi}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                  >
                    ☑️ Pilih Semua ({localMotivasiList.length})
                  </button>
                  <button
                    onClick={handleDeselectAllMotivasi}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                  >
                    🔲 Batal Semua
                  </button>
                  <button
                    onClick={handleLoadSampleMotivasi}
                    className="bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-[11px] px-3 py-1.5 rounded-lg border border-amber-200 transition-all cursor-pointer"
                  >
                    💡 Muat Contoh Motivasi
                  </button>
                </div>
                <span className="text-[11px] font-bold text-slate-500">
                  Terpilih: <strong className="text-amber-600">{localMotivasiTerpilih.length}</strong> / {localMotivasiList.length}
                </span>
              </div>

              {/* Daftar Kalimat Motivasi */}
              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 border border-slate-100 rounded-xl p-2 bg-slate-50/50">
                {localMotivasiList.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-4">Belum ada kalimat motivasi. Silakan tambah atau muat contoh motivasi.</p>
                ) : (
                  localMotivasiList.map((item, idx) => {
                    const isSelected = localMotivasiTerpilih.includes(item);
                    return (
                      <div
                        key={idx}
                        className={`flex items-start justify-between gap-2 p-2.5 rounded-xl border text-xs transition-all ${
                          isSelected ? "bg-white border-amber-300 shadow-sm text-slate-800" : "bg-slate-100/60 border-slate-200 text-slate-500 opacity-70"
                        }`}
                      >
                        <label className="flex items-start gap-2.5 flex-1 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleMotivasiItem(item)}
                            className="accent-amber-600 rounded cursor-pointer w-4 h-4 mt-0.5 shrink-0"
                          />
                          <span className="font-medium leading-relaxed">{item}</span>
                        </label>
                        <button
                          onClick={() => handleDeleteMotivasiItem(item)}
                          className="text-slate-400 hover:text-rose-600 font-bold text-xs p-1 rounded transition-colors shrink-0 cursor-pointer"
                          title="Hapus kalimat ini"
                        >
                          🗑️
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Pesan Sukses Simpan */}
              {motivasiSavedMsg && (
                <p className="text-xs font-bold text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                  {motivasiSavedMsg}
                </p>
              )}

              {/* Tombol Simpan Akhir */}
              <button
                onClick={handleSaveMotivasiConfigAll}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs py-2.5 rounded-xl transition-all cursor-pointer shadow flex items-center justify-center gap-2"
              >
                💾 Simpan Pengaturan Motivasi & Branding
              </button>
            </div>

            {/* Archive Editor Feature */}
            <div className="bg-white rounded-2xl p-4 border border-indigo-200 shadow-sm space-y-3">
              <h2 className="text-xs font-black text-indigo-900 uppercase tracking-wider border-l-4 border-indigo-600 pl-2">
                📂 Archive Editor (Edit Data Masa Lalu)
              </h2>
              <p className="text-[10px] text-slate-500 font-medium">
                Masuk ke lingkungan terisolasi untuk melihat dan merevisi data arsip bulan-bulan sebelumnya yang tersimpan di Supabase tanpa mempengaruhi bulan berjalan.
              </p>
              <button
                onClick={() => setShowArchiveEditor(true)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-2.5 rounded-xl transition-all cursor-pointer shadow flex items-center justify-center gap-2 mt-2"
              >
                🛠️ Buka Archive Editor
              </button>
            </div>



            {/* 5. Branding & Identitas Aplikasi */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider border-l-4 border-cyan-600 pl-2">
                🏷️ Identitas Depo & Chatbot AI
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                    Nama TKU / Depo (DP)
                  </label>
                  <input
                    type="text"
                    value={tkuNameInput}
                    onChange={(e) => setTkuNameInput(e.target.value)}
                    placeholder="DP Jember 1"
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-2.5 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                    Nama Chatbot AI
                  </label>
                  <input
                    type="text"
                    value={chatbotNameInput}
                    onChange={(e) => setChatbotNameInput(e.target.value)}
                    placeholder="AI Jember 1 Pro"
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-2.5 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>
              <button
                onClick={handleSaveMotivasiConfigAll}
                className="bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow cursor-pointer flex items-center gap-1.5"
              >
                <span>💾</span>
                <span>Simpan Branding</span>
              </button>
            </div>

            {/* 4. Backup & Cache */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider border-l-4 border-slate-600 pl-2">
                💾 Cadangan & Pembersihan Cache
              </h2>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={handleExportBackupJson}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer"
                >
                  📥 Ekspor Backup Data JSON
                </button>
                <label className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1">
                  <span>📤 Impor Backup JSON</span>
                  <input type="file" accept=".json" onChange={handleImportBackupJson} className="hidden" />
                </label>
                <button
                  onClick={handleDownloadExcel}
                  className="bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1"
                >
                  📊 Simpan ke Excel Manual (.xlsx)
                </button>
                <button
                  onClick={handleClearCache}
                  className="bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer"
                >
                  🧹 Bersihkan Cache LocalStorage
                </button>
              </div>
            </div>

            {/* 2. Finish & Archive Month */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider border-l-4 border-indigo-600 pl-2">
                  📦 Selesaikan & Arsipkan Bulan Berjalan
                </h2>
                {/* Month Picker for Archive */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600">Pilih Bulan Arsip:</span>
                  <input
                    type="month"
                    value={selectedMonthlyArchive}
                    onChange={(e) => setSelectedMonthlyArchive(e.target.value)}
                    className="p-1.5 text-xs font-bold bg-slate-50 rounded-xl border border-slate-200 text-slate-800 outline-none"
                  />
                </div>
              </div>

              {archivedMonthsList.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[10.5px] font-bold text-slate-600">📂 Daftar Bulan Tersimpan di Supabase:</span>
                  <select
                    value={archivedMonthsList.includes(selectedMonthlyArchive) ? selectedMonthlyArchive : ""}
                    onChange={(e) => {
                      if (e.target.value) setSelectedMonthlyArchive(e.target.value);
                    }}
                    className="p-1.5 text-xs font-bold bg-white rounded-lg border border-slate-300 text-slate-800 outline-none cursor-pointer"
                  >
                    <option value="" disabled>-- Pilih Bulan Tersimpan --</option>
                    {archivedMonthsList.map((m) => (
                      <option key={m} value={m}>
                        {getIndonesianMonthLabel(m)} ({m})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <p className="text-[10.5px] text-slate-500 font-medium">
                Mengunci dan mengarsipkan seluruh rekapitulasi data bulan <strong className="text-indigo-900 font-black">{getIndonesianMonthLabel(selectedMonthlyArchive) || selectedMonthlyArchive} ({selectedMonthlyArchive})</strong> ke Supabase secara permanen.
              </p>

              {archiveStatusMsg && (
                <p className="text-xs font-bold text-indigo-600 bg-indigo-50 p-2.5 rounded-xl border border-indigo-200 leading-relaxed">
                  {archiveStatusMsg}
                </p>
              )}

              <div className="flex flex-col sm:flex-row flex-wrap gap-2 pt-1">
                <button
                  onClick={handleFinishAndArchiveMonth}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs py-2.5 px-3 rounded-xl transition-all cursor-pointer shadow flex items-center justify-center gap-2"
                >
                  🔒 Selesaikan & Arsipkan Data Bulan Ini ({selectedMonthlyArchive})
                </button>
                <button
                  onClick={() => handleFetchMonthFromSupabase(selectedMonthlyArchive)}
                  disabled={isSbSyncing}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white font-black text-xs py-2.5 px-3 rounded-xl transition-all cursor-pointer shadow disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  📂 Ambil Data Arsip Bulan Ini dari Supabase
                </button>
                <button
                  onClick={handleUpdateArchiveMonth}
                  disabled={isSbSyncing}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-black text-xs py-2.5 px-3 rounded-xl transition-all cursor-pointer shadow disabled:opacity-50 flex items-center justify-center gap-2"
                  title="Ambil data live terbaru untuk bulan ini lalu timpa/perbarui arsip di Supabase"
                >
                  🔄 Perbarui / Refresh Arsip Bulan Ini
                </button>
                {isViewingHistoricalMonth && (
                  <button
                    onClick={handleResetToLiveData}
                    className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs py-2.5 px-3 rounded-xl transition-all cursor-pointer shadow flex items-center justify-center gap-2 shrink-0"
                  >
                    🔄 Kembali ke Data Live
                  </button>
                )}
              </div>
            </div>

            {/* 3. Reset Data (Targeted) */}
            <div className="bg-white rounded-2xl p-4 border border-rose-100 shadow-sm space-y-3">
              <h2 className="text-xs font-black text-rose-950 uppercase tracking-wider flex items-center gap-2 border-l-4 border-rose-600 pl-2">
                🗑️ Reset Data Khusus (4 Kategori)
              </h2>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Hanya menghapus data: PLG & PJL, Input PJL Harian, BD & Realisasi (termasuk LHPP), dan Target YL/TKU. Data lain (Profil, PIN, Motivasi, dll) AMAN.
              </p>
              <div className="space-y-2 mt-2">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Cakupan Reset:</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input type="radio" name="resetScope" value="current_month" checked={resetScope === "current_month"} onChange={() => setResetScope("current_month")} className="accent-rose-600" />
                    Hanya Bulan Ini ({selectedBreakdownMonth || "2026-08"})
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input type="radio" name="resetScope" value="all" checked={resetScope === "all"} onChange={() => setResetScope("all")} className="accent-rose-600" />
                    Semua Riwayat (Semua Bulan)
                  </label>
                </div>
              </div>
              <button
                onClick={() => { setShowTargetedResetModal(true); setResetTargetedConfirmText(""); }}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-black text-xs py-2.5 rounded-xl transition-all cursor-pointer shadow flex items-center justify-center gap-2 mt-3"
              >
                ⚠️ Reset Data
              </button>
            </div>

            {/* 1. Supabase Credentials Card */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">⚙️</span>
                  <div>
                    <h2 className="text-sm font-black text-slate-900 uppercase">Kredensial & Server Cloud Supabase</h2>
                    <p className="text-[10.5px] text-slate-500 font-medium">Pengaturan koneksi Supabase untuk sinkronisasi database cloud</p>
                  </div>
                </div>
                {isSbSyncing && (
                  <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full animate-pulse">
                    ⚡ Sedang Sinkron...
                  </span>
                )}
              </div>

              {sbMsg && (
                <p className="text-xs font-bold text-emerald-600 bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                  {sbMsg}
                </p>
              )}

              <div className="space-y-3 pt-1">
                <div>
                  <label className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Supabase Project URL</label>
                  <input
                    type="text"
                    value={sbUrl}
                    onChange={(e) => setSbUrl(e.target.value)}
                    placeholder="https://your-project.supabase.co"
                    className="w-full p-2.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Supabase Anon Key</label>
                  <input
                    type="password"
                    value={sbKey}
                    onChange={(e) => setSbKey(e.target.value)}
                    placeholder="eyJhbGciOi..."
                    className="w-full p-2.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none"
                  />
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    onClick={handleSaveSupabaseConfig}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow cursor-pointer flex items-center gap-1.5"
                  >
                    <span>💾</span>
                    <span>Simpan Kredensial Supabase</span>
                  </button>
                  <button
                    onClick={handleSyncAllToSupabase}
                    disabled={isSbSyncing}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <span>☁️</span>
                    <span>{isSbSyncing ? "Menyinkronkan..." : "Sinkronkan Semua Data ke Supabase"}</span>
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Modal Targeted Reset */}
        {showTargetedResetModal && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl border border-rose-200">
              <div className="flex items-center justify-between border-b border-rose-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">⚠️</span>
                  <div>
                    <h3 className="text-sm font-black text-rose-950 uppercase">Konfirmasi Reset Data</h3>
                    <p className="text-[10px] text-rose-600 font-bold">Aksi ini bersifat destruktif</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowTargetedResetModal(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-900 text-xs space-y-2">
                <p><strong>Cakupan:</strong> <span className="font-mono font-bold text-rose-950">{resetScope === "all" ? "SEMUA RIWAYAT (Semua Bulan)" : `HANYA BULAN INI (${selectedBreakdownMonth || "2026-08"})`}</span></p>
                <p><strong>Data yang AKAN DIHAPUS:</strong></p>
                <ul className="list-disc pl-4 font-bold text-[10px] space-y-1">
                  <li>PLG & PJL (Data manual & Potensi Tembus)</li>
                  <li>Input PJL (Data transaksi harian)</li>
                  <li>BD & Realisasi (Breakdown Plan, Breakdown Realisasi, LHPP)</li>
                  <li>Target (Target TKU & Target per YL)</li>
                </ul>
                <p className="text-[10px] italic text-rose-600 mt-2">Data lain (Profil YL, PIN, Setting) TIDAK akan dihapus.</p>
              </div>
              <div className="space-y-3">
                <p className="text-[11px] text-slate-600 font-bold leading-relaxed">
                  Apakah Anda yakin ingin menghapus data tersebut? Tindakan ini <strong>tidak dapat dibatalkan</strong>.
                </p>
                <div>
                  <label className="text-[9px] font-bold text-rose-600 uppercase tracking-wider block mb-1">Ketik "HAPUS" untuk konfirmasi</label>
                  <input
                    type="text"
                    value={resetTargetedConfirmText}
                    onChange={(e) => setResetTargetedConfirmText(e.target.value.toUpperCase())}
                    placeholder="HAPUS"
                    className="w-full p-2.5 text-xs bg-white rounded-xl border border-rose-300 outline-none font-bold text-rose-900 text-center uppercase"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowTargetedResetModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={handleConfirmTargetedReset}
                  disabled={isResetting || resetTargetedConfirmText !== "HAPUS"}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs py-2.5 rounded-xl transition-all cursor-pointer shadow disabled:opacity-50"
                >
                  {isResetting ? "Proses..." : "Ya, Lanjutkan"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab Data YL */}
        {activeTab === "seragam" && <ErrorBoundary><ManagerSeragamView /></ErrorBoundary>}
        {activeTab === "lady" && (
          <ManagerLadyTab
            ylList={ylList}
            setYlList={setYlList}
            handleSaveYlList={handleSaveYlList}
            handleDeleteYl={handleDeleteYl}
            handleAddYl={handleAddYl}
            newYlArea={newYlArea}
            setNewYlArea={setNewYlArea}
            newYlKode={newYlKode}
            setNewYlKode={setNewYlKode}
            newYlNama={newYlNama}
            setNewYlNama={setNewYlNama}
            newYlTanggalMasuk={newYlTanggalMasuk}
            setNewYlTanggalMasuk={setNewYlTanggalMasuk}
            newYlPin={newYlPin}
            setNewYlPin={setNewYlPin}
            newYlNik={newYlNik}
            setNewYlNik={setNewYlNik}
            newYlTglLahir={newYlTglLahir}
            setNewYlTglLahir={setNewYlTglLahir}
            ylSavedMsg={ylSavedMsg}
          />
        )}

        {/* Tab Realisasi Penjualan & LHPP */}
        {(activeTab === "input_realisasi" || activeTab === "lhpp_realisasi") && (
          <div className="space-y-4">
            <LhppRealisasiView
              ylList={ylList}
              selectedMonth={selectedBreakdownMonth}
              breakdownPlanMap={breakdownPlanMap}
              breakdownRealisasiMap={breakdownRealisasiMap}
              motivasiConfig={motivasiConfig}
              theme={theme}
            />
          </div>
        )}

        {/* Tab PLG & PJL */}
        {activeTab === "plg_pjl" && (
          <PlgPjlView
            ylList={ylList}
            motivasiConfig={motivasiConfig}
            theme={theme}
            historicalMonth={isViewingHistoricalMonth ? selectedMonthlyArchive : null}
            historicalData={
              isViewingHistoricalMonth && historicalDataSnapshot
                ? {
                    transactions: historicalDataSnapshot.transactions || [],
                    potensiTembus: historicalDataSnapshot.potensiTembus || {},
                    breakdownRealisasiMap: historicalDataSnapshot.breakdownRealisasiMap || breakdownRealisasiMap
                  }
                : null
            }
          />
        )}

        {/* Tab Product Knowledge */}
        {activeTab === "product_knowledge" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ProductKnowledgeView theme={theme} />
          </div>
        )}
      </main>
    </div>
  );
}

export default ManagerView;
  