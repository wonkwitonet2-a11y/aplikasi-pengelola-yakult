import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { GridSelectionToolbar } from "./GridSelectionToolbar";
import { useSimpleGrid } from "./useSimpleGrid";
import {
  TrendingUp,
  Award,
  Users,
  Settings,
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
  Building2
} from "lucide-react";
import { PlgPjlView } from "./PlgPjlView";
import { LhppRealisasiView } from "./LhppRealisasiView";
import { NumberInput } from "./NumberInput";
import { BreakdownGridRow } from "./BreakdownGridRow";
import { TargetManagerRow } from "./TargetManagerRow";
import { YlProfileRow } from "./YlProfileRow";
import { ManagerDashboardTab } from "./ManagerDashboardTab";
import { ManagerLadyTab } from "./ManagerLadyTab";
import { safeFetchJson, parseJsonResponse } from "../lib/safeFetch";
import {
  RankingYLChart,
  KomposisiProdukChart,
  TargetVsActualChart,
  SektorTimChart,
  TrenHarianChart
} from "./Charts";
import { DashboardData, EvaluasiData, MotivasiConfig, KontesRow, cleanYlName } from "../types";
import { APPS_SCRIPT_CODE } from "../lib/googleAppsScriptCode";

const names = [
  "201 Gusrina", "202 Dewi Ati Ani", "203 Gusrini", "204 Umi Maisaroh", "205 Suyik Rahmawati",
  "206 Ria Resti W", "207 Endang Setiowati", "208 Wakiah", "209 Titis", "210 Eni"
];


interface ManagerViewProps {
  onLogout: () => void;
  dashboardData: DashboardData | null;
  evaluasiData: EvaluasiData | null;
  onRefresh: () => Promise<void>;
  motivasiConfig: MotivasiConfig;
  onUpdateMotivasi: (config: MotivasiConfig) => void;
  kontesConfig: { enabled: boolean; rows: KontesRow[] };
  scriptUrl: string;
  onSaveScriptUrl: (url: string) => Promise<void>;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

type BreakdownGridMap = Record<string, { pembagiTanggal: number; days: Record<string, { yo: number; om: number; os: number; yt: number }> }>;

export function ManagerView({
  onLogout,
  dashboardData,
  evaluasiData,
  onRefresh,
  motivasiConfig,
  onUpdateMotivasi,
    scriptUrl,
  onSaveScriptUrl,
  theme,
  onToggleTheme
}: ManagerViewProps) {
  const [activeTab, setActiveTab] = useState<"dashboard" | "input_realisasi" | "lhpp_realisasi" | "breakdown" | "target_kompensasi" | "evaluasi" | "plg_pjl" | "lady" | "kontes" | "setting">("lhpp_realisasi");
  
  // Breakdown Plan & Realisasi state (Manager)
  const [breakdownPlanMap, setBreakdownPlanMap] = useState<BreakdownGridMap>({});
  const [breakdownRealisasiMap, setBreakdownRealisasiMap] = useState<BreakdownGridMap>({});
  const [gridSubMode, setGridSubMode] = useState<"BD" | "Realisasi">("BD");
  const [localEval, setLocalEval] = useState<EvaluasiData | null>(evaluasiData);

  useEffect(() => {
    if (evaluasiData) setLocalEval(evaluasiData);
  }, [evaluasiData]);

  useEffect(() => {
    if (activeTab === "evaluasi") {
      safeFetchJson("/api/getEvaluasi").then(res => {
        if (res && res.evaluasiData) setLocalEval(res.evaluasiData);
        else if (res && res.dataRows) setLocalEval(res);
      });
    }
  }, [activeTab]);

  const activeEval = localEval || evaluasiData;

  const [undoStack, setUndoStack] = useState<BreakdownGridMap[]>([]);
  const [redoStack, setRedoStack] = useState<BreakdownGridMap[]>([]);

  const [selectedBreakdownMonth, setSelectedBreakdownMonth] = useState<string>("2026-07");
  const [breakdownDateRange] = useState<"1-10" | "11-20" | "21-31" | "1-31">("1-31");
    const [isBreakdownSaving, setIsBreakdownSaving] = useState<boolean>(false);
  const [breakdownMsg, setBreakdownMsg] = useState<string>("");
  const [isGridFullScreen, setIsGridFullScreen] = useState<boolean>(false);

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
  const activeGridMap = gridSubMode === "BD" ? breakdownPlanMap : breakdownRealisasiMap;
  const [isBreakdownLoading, setIsBreakdownLoading] = useState(false);

  // Helper to update grid state and record undo history
  const updateActiveGridMap = (updater: (prev: typeof breakdownPlanMap) => typeof breakdownPlanMap) => {
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
  };

  // Handler: Undo last grid edit
  const handleUndo = () => {
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
  const [ylList, setYlList] = useState<Array<{ area: string; nama: string; pin: string; status?: string; tanggalDaftar?: string; tanggalResign?: string }>>([]);
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
          setShowCopyResultModal(true);
        });
    } else {
      setShowCopyResultModal(true);
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

    const isTabDelimited = rawLines.some(l => l.includes("\t"));

    const parseRowCells = (rowStr: string): string[] => {
      if (isTabDelimited) {
        return rowStr.split("\t");
      }
      if (rowStr.includes(";")) {
        return rowStr.split(";");
      }
      if (rowStr.includes("/")) {
        return rowStr.split("/");
      }
      if (rowStr.includes("|")) {
        return rowStr.split("|");
      }
      if (rowStr.includes(",")) {
        return rowStr.split(",");
      }
      return rowStr.trim() ? rowStr.trim().split(/\s+/) : [""];
    };

    const parsedMatrix: number[][] = rawLines.map(rowStr => {
      const cells = parseRowCells(rowStr);
      return cells.map(valStr => {
        const cleanStr = valStr.replace(/[^0-9-]/g, "");
        return Math.max(0, parseInt(cleanStr, 10) || 0);
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
    setShowPasteModal(true);
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
  const [scriptUrlInput, setScriptUrlInput] = useState<string>(scriptUrl || "");

  // Kirim ke DP1 state

  // 20 YL List state
  const [newYlArea, setNewYlArea] = useState<string>("");
  const [newYlNama, setNewYlNama] = useState<string>("");
  const [newYlPin, setNewYlPin] = useState<string>("");
  const [newYlKode, setNewYlKode] = useState<string>("");
  const [newYlTanggalMasuk, setNewYlTanggalMasuk] = useState<string>("");
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

  // Spreadsheet Grid Integration - tabel Target per Yakult Lady (menu Target & Kompensasi)
  const targetGridContainerRef = useRef<HTMLDivElement>(null);

  const getTargetCellValue = useCallback((r: number, c: number) => {
    const yl = activeYLsList[r];
    if (!yl) return 0;
    const tgt = targetYLMap[yl.area] ?? { target: 0, bln_lalu: 0, thn_lalu: 0 };
    const fields = ["target", "bln_lalu", "thn_lalu"] as const;
    return tgt[fields[c]] ?? 0;
  }, [activeYLsList, targetYLMap]);

  const setTargetBatchCellValues = useCallback((updates: { r: number; c: number; val: number | string }[]) => {
    setTargetYLMap(prev => {
      const next = { ...prev };
      const fields = ["target", "bln_lalu", "thn_lalu"] as const;
      updates.forEach(({ r, c, val }) => {
        const yl = activeYLsList[r];
        if (!yl) return;
        const numVal = Math.max(0, Math.round(Number(val)) || 0);
        const existing = next[yl.area] ?? { target: 0, bln_lalu: 0, thn_lalu: 0 };
        next[yl.area] = { ...existing, [fields[c]]: numVal };
      });
      return next;
    });
  }, [activeYLsList]);

  const {
    selection: targetGridSelection,
    setSelection: setTargetGridSelection,
    getCellProps: getTargetCellProps,
    selectColumn: selectTargetColumn,
    selectRow: selectTargetRow,
    setIsDragging: setIsTargetDragging,
    handleCopy: handleTargetGridCopy,
    handleCut: handleTargetGridCut,
    handlePaste: handleTargetGridPaste,
    handleClear: handleTargetGridClear,
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
    return ((targetTKU as any)[key] as number | undefined) ?? 0;
  }, [targetTKU]);

  const setTargetTKUBatchCellValues = useCallback((updates: { r: number; c: number; val: number | string }[]) => {
    setTargetTKU(prev => {
      let next = { ...prev };
      const suffixes = ["_yo", "_om", "_os", "_yt"] as const;
      updates.forEach(({ r, c, val }) => {
        const prefix = TKU_ROW_PREFIXES[r] ?? "target";
        const key = `${prefix}${suffixes[c]}`;
        const numVal = Math.max(0, Math.round(Number(val)) || 0);
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
  }, []);

  const {
    selection: tkuGridSelection,
    setSelection: setTkuGridSelection,
    getCellProps: getTkuCellProps,
    handleCopy: handleTkuGridCopy,
    handleCut: handleTkuGridCut,
    handlePaste: handleTkuGridPaste,
    handleClear: handleTkuGridClear,
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
        if (activeTab === "breakdown" && gridSelection) {
          handleCopyGridCells();
        } else if (activeTab === "target_kompensasi") {
          if (targetGridSelection) handleTargetGridCopy();
          if (tkuGridSelection) handleTkuGridCopy();
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
        if (targetTag !== "input" || /[\t\n\r,;/|\s]/.test(clean)) {
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
      if (res && res.ylList) {
        const cleaned = res.ylList.map((y: any) => ({
          ...y,
          nama: cleanYlName(y.nama)
        }));
        setYlList(cleaned);
      }
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

  // Fetch Breakdown Plan & Realisasi
  const fetchBreakdownPlan = async (month: string = selectedBreakdownMonth) => {
    try {
      const res = await safeFetchJson(`/api/getBreakdownPlan?month=${month}`);
      if (res && res.ok) {
        if (res.breakdownPlan) setBreakdownPlanMap(res.breakdownPlan);
        if (res.breakdownRealisasi) setBreakdownRealisasiMap(res.breakdownRealisasi);
      }
    } catch (e) {
      console.error("Error fetching breakdown plan:", e);
    } finally {
    }
  };

  useEffect(() => {
    if (activeTab === "breakdown") {
      fetchBreakdownPlan(selectedBreakdownMonth);
    }
  }, [activeTab, selectedBreakdownMonth]);

  const breakdownPlanMapRef = useRef(breakdownPlanMap);
  const breakdownRealisasiMapRef = useRef(breakdownRealisasiMap);
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
      if (Object.keys(breakdownPlanMap).length > 0 || Object.keys(breakdownRealisasiMap).length > 0) {
        handleSaveBreakdownPlan();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [breakdownPlanMap, breakdownRealisasiMap]);

  // Handler: Save Breakdown Plan & Realisasi
  const handleSaveBreakdownPlan = async () => {
    setIsBreakdownSaving(true);
    try {
      const res = await fetch("/api/saveBreakdownPlan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: selectedBreakdownMonth,
          breakdownPlan: breakdownPlanMap,
          breakdownRealisasi: breakdownRealisasiMap
        })
      });
      const resData = await parseJsonResponse(res);
      if (resData && resData.ok) {
        if (onRefresh) await onRefresh();
      } else {
        console.error("Gagal menyimpan data breakdown.");
      }
    } catch (e: any) {
      console.error("Error: " + (e.message || "Gagal menyimpan"));
    } finally {
      setIsBreakdownSaving(false);
    }
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

  const handleGlobalPembagiChange = (val: number) => {
    updateActiveGridMap(prev => {
      const copy = { ...prev };
      const newPembagi = Math.max(1, val);
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
    try {
      const res = await safeFetchJson("/api/saveSettingTargets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetTKU,
          targetYL: targetYLMap
        })
      });
      if (res && res.ok) {
        // Silent success for auto-save
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
        setYlSavedMsg("Daftar YL & PIN berhasil diperbarui!");
        setTimeout(() => setYlSavedMsg(""), 3000);
        if (onRefresh) await onRefresh();
      }
    } catch (e: any) {
      setYlSavedMsg("⚠️ Gagal menyimpan data YL: " + (e.message || "Error"));
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
      status: "Aktif",
      tanggalDaftar: today
    }];
    handleSaveYlList(newList);
    setNewYlArea("");
    setNewYlNama("");
    setNewYlPin("");
    setNewYlKode("");
    setNewYlTanggalMasuk("");
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
        
        // CLEAR LOCAL STATE TO PREVENT AUTO-SAVE FROM RESTORING IT
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
  const [pinManager, setPinManager] = useState<string>("1111");
  const [pinYLs, setPinYLs] = useState<Record<string, string>>({});

  // Attention Manager states
  const [attentionArea, setAttentionArea] = useState<string>("201");
  const [attentionText, setAttentionText] = useState<string>("");
  const [attentionMap, setAttentionMap] = useState<Record<string, string>>({});
  const [attentionSavedMsg, setAttentionSavedMsg] = useState<boolean>(false);

  // Motivasi & Chatbot states

  const [chatbotNameInput, setChatbotNameInput] = useState<string>(motivasiConfig?.chatbotName || "AI Jember 1 Pro");
  
  const [tkuNameInput, setTkuNameInput] = useState<string>(motivasiConfig?.tkuName || "DP Jember 1");
  
  useEffect(() => {
    if (motivasiConfig?.chatbotName) {
      setChatbotNameInput(motivasiConfig.chatbotName);
    }
    if (motivasiConfig?.tkuName) {
      setTkuNameInput(motivasiConfig.tkuName);
    }
  }, [motivasiConfig?.chatbotName, motivasiConfig?.tkuName]);

  
  
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
        if (d && d.managerPin) setPinManager(d.managerPin);
        if (d && d.ylPins) setPinYLs(d.ylPins);
      })
      .catch(e => console.error(e));

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
    if (!activeEval) return;
    setIsAiLoading(true);
    setAiInsight("");
    try {
      const response = await fetch("/api/gemini/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: activeEval })
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


  // Find overall highest performing and needy YL
  // (dulu fungsi biasa yg dipanggil tiap render — sekarang useMemo supaya
  // sort/filter/map di dalamnya hanya dihitung ulang saat activeEval berubah)
  const evaluasiHighlights = useMemo(() => {
    if (!activeEval || !activeEval.analisis) return { top: null, needImprovement: null, highestBB: null };
    const list = activeEval.analisis;

    if (list.length === 0) return { top: null, needImprovement: null, highestBB: null };

    const EVAL_CATEGORIES = [
      { key: 'jualHariIni', label: 'Penjualan Hari Ini', type: 'max', requirePositive: true },
      { key: 'rata2BulanBerjalan', label: 'Rata-rata Bulan Berjalan', type: 'max', requirePositive: true },
      { key: 'vsMingguLaluPct', label: 'Pertumbuhan vs Minggu Lalu', type: 'max', requirePositive: false },
      { key: 'persenRumah', label: 'Sektor Rumah', type: 'max', requirePositive: true },
      { key: 'persenRbVsPlg', label: 'Rasio RB vs PLG', type: 'max', requirePositive: true },
      { key: 'propagandaHariIni', label: 'Propaganda Hari Ini', type: 'max', requirePositive: true },
      { key: 'sampahBotol', label: 'Sampah Botol Akumulasi', type: 'target', target: 900, requirePositive: false },
      { key: 'bb', label: 'BB / Balik Botol', type: 'min', requirePositive: false }
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
          worstVal = Math.min(...vals);
          isWinner = (v) => v === bestVal && (!cat.requirePositive || v > 0);
          isLoser = (v) => v === worstVal;
          getScore = (v) => bestVal === worstVal ? 1 : (v - worstVal) / (bestVal! - worstVal);
        } else if (cat.type === 'min') {
          bestVal = validVals.length > 0 ? Math.min(...validVals) : 0;
          worstVal = Math.max(...vals);
          isWinner = (v) => v === bestVal && (!cat.requirePositive || v > 0);
          isLoser = (v) => v === worstVal;
          getScore = (v) => bestVal === worstVal ? 1 : (worstVal - v) / (worstVal - bestVal!);
        } else if (cat.type === 'target') {
          const distances = vals.map(v => Math.abs(v - (cat.target as number)));
          const minDistance = Math.min(...distances);
          const maxDistance = Math.max(...distances);
          
          isWinner = (v) => Math.abs(v - (cat.target as number)) === minDistance;
          isLoser = (v) => Math.abs(v - (cat.target as number)) === maxDistance;
          getScore = (v) => {
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

    const sortedBB = [...list].sort((a, b) => b.bb - a.bb);
    const bbVal = sortedBB[0].bb;
    const allBBs = sortedBB.filter(x => x.bb === bbVal);
    const highestBB = {
      ...sortedBB[0],
      nama: allBBs.map(x => cleanYlName(x.nama)).join(", ")
    };

    return { top, needImprovement, highestBB };
  }, [activeEval]);

  // Sama seperti di atas: dulu fungsi biasa dipanggil ULANG 19x langsung di
  // JSX di bawah (tiap panggilan mengulang 8x sort+filter+map dari nol) —
  // salah satu penyebab render ManagerView berat. Sekarang cukup dihitung
  // sekali per perubahan activeEval.
  const evaluasiBlocks = useMemo(() => {
    if (!activeEval || !activeEval.analisis) return null;
    const list = activeEval.analisis;

    const getTop = (key: keyof typeof list[0], ascending = false) => {
      if (list.length === 0) return null;
      const sorted = [...list].sort((a, b) => ascending ? (a[key] as number) - (b[key] as number) : (b[key] as number) - (a[key] as number));
      const topVal = sorted[0][key];
      const allTops = sorted.filter(item => item[key] === topVal);
      const joinedNames = allTops.map(i => cleanYlName(i.nama)).join(", ");
      
      // Return a mocked object with the joined names and the top value
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
    const block8 = getTop("bb", true);

    return { block1, block2, block3, block4, block5, block6, block7, block8 };
  }, [activeEval]);

  const handleClearCache = async () => {
    localStorage.clear();
    await onRefresh();
    alert("Cache aplikasi berhasil dibersihkan! Seluruh data diperbarui secara segar.");
  };


  const { top, needImprovement, highestBB } = evaluasiHighlights;

  // Save Config Pin
  const handleSavePin = async () => {
    if (!pinInputVal) return;
    const newYlPins = { ...pinYLs };
    if (pinTargetDropdown === "manager") {
      setPinManager(pinInputVal);
    } else {
      newYlPins[pinInputVal] = pinYLs[pinTargetDropdown] || pinTargetDropdown;
    }
    try {
      const response = await fetch("/api/savePins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ managerPin: pinTargetDropdown === "manager" ? pinInputVal : pinManager, ylPins: pinTargetDropdown !== "manager" ? newYlPins : pinYLs })
      });
      const res = await parseJsonResponse(response);
      if (res && res.ok) {
        setPinSavedMsg(true);
        setPinInputVal("");
        setTimeout(() => setPinSavedMsg(false), 2500);
      }
    } catch (e) {
      alert("Gagal menyinkronkan PIN.");
    }
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* Dynamic Header */}
      <header className="bg-gradient-to-r from-red-950 to-red-800 border-b-4 border-red-600 text-white p-4 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="bg-red-600 text-white font-black px-2.5 py-1 text-lg rounded-lg shadow">Y</span>
            <div>
              <h1 className="text-base font-extrabold tracking-tight leading-none">
                {(motivasiConfig?.tkuName || "DP JEMBER 1").toUpperCase()}
              </h1>
              <p className="text-[10px] text-red-200 mt-1 font-medium">Yakult Lady Management System Pro</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={handleDownloadExcel}
              className="bg-emerald-700/80 hover:bg-emerald-600 text-emerald-50 text-[10px] sm:text-xs font-bold px-2.5 py-1.5 rounded-lg border border-emerald-600/50 transition-all flex items-center gap-1 shadow-sm"
              title="Download Laporan Excel (DP1)"
            >
              📥 Laporan Excel
            </button>
            <button
              onClick={handleClearCache}
              className="bg-red-800/50 hover:bg-red-800 text-red-100 text-[10px] sm:text-xs font-bold px-2.5 py-1.5 rounded-lg border border-red-700/50 transition-all flex items-center gap-1"
              title="Bersihkan cache lokal"
            >
              🧹 Pembersih Cache
            </button>
            <button
              onClick={onLogout}
              className="bg-slate-900/60 hover:bg-slate-950 text-slate-200 text-[10px] sm:text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-800 transition-all"
            >
              Keluar
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto p-4">
        {/* Tab Dashboard */}
        {activeTab === "dashboard" && (
          <ManagerDashboardTab
            dashboardData={dashboardData}
            targetTKU={targetTKU}
            cleanYlName={cleanYlName}
            currentMonthTotal={currentMonthTotal}
            calculateSektorTotals={calculateSektorTotals}
          />
        )}

        {/* Tab Evaluasi */}
        {activeTab === "evaluasi" && (
          !activeEval ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400 font-bold bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin" />
              <span>Memuat Data Evaluasi Harian...</span>
            </div>
          ) : (
          <div className="space-y-4">
            {/* 1. PALING ATAS: Laporan Evaluasi Harian (Mirror Sheet Table) */}
            <div className={`rounded-2xl border shadow-sm overflow-hidden transition-all duration-300 ${
              isFullscreenEval 
                ? `fixed inset-0 z-[9999] rounded-none flex flex-col h-screen ${theme === "dark" ? "bg-slate-950 border-slate-900 text-slate-100" : "bg-white border-slate-200 text-slate-900"}` 
                : "flex flex-col max-h-[440px] bg-white border-2 border-slate-200 text-slate-900 shadow-md p-1"
            }`}>
              <div className="p-3 bg-red-950 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-black uppercase tracking-wider">Laporan Evaluasi Harian (Mirror Sheet)</h3>
                  {isFullscreenEval && (
                    <span className="text-[9px] bg-emerald-600 text-white px-2 py-0.5 rounded font-bold animate-pulse">
                      Mode Presentasi Slide
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {isFullscreenEval && (
                    <span className="hidden md:inline text-[10px] text-red-200 font-bold mr-2">
                      💡 Putar HP ke Landscape / perlebar layar untuk melihat seluruh 32 kolom secara penuh
                    </span>
                  )}
                  <button
                    onClick={() => setIsFullscreenEval(!isFullscreenEval)}
                    className="text-white bg-red-800 hover:bg-red-700 p-1.5 rounded-lg transition-all flex items-center gap-1 font-bold text-[10px]"
                    title="Toggle Fullscreen"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    {isFullscreenEval ? "Keluar Slide" : "Slide Layar Penuh"}
                  </button>
                </div>
              </div>
              <div 
                className={`overflow-auto flex-1 ${!isFullscreenEval ? "cursor-pointer" : ""}`}
                onClick={() => { if (!isFullscreenEval) setIsFullscreenEval(true); }}
                title={isFullscreenEval ? "" : "Klik tabel untuk masuk Mode Presentasi Slide"}
              >
                <table className={`w-full text-left border-collapse relative ${
                  isFullscreenEval
                    ? `text-[11px] ${theme === "dark" ? "text-slate-100" : "text-slate-800"} font-mono`
                    : "text-[10px]"
                }`}>
                  <thead className="sticky top-0 z-10 bg-slate-950 text-white text-[9px] uppercase tracking-wider text-center font-bold">
                    {/* Row 0 */}
                    <tr className="border-b border-slate-800">
                      <th rowSpan={3} className="p-1.5 border-r border-slate-800 bg-slate-950">Area</th>
                      <th rowSpan={3} className="p-1.5 border-r border-slate-800 bg-slate-950">Nama YL</th>
                      <th rowSpan={3} className="p-1.5 border-r border-slate-800 bg-slate-900">Rata Mgg Lalu</th>
                      <th colSpan={5} className="p-1.5 border-r border-slate-800 bg-red-950 text-red-200">Penjualan Hari Ini</th>
                      <th colSpan={6} className="p-1.5 border-r border-slate-800 bg-emerald-950 text-emerald-200">Bulan Ini</th>
                      <th rowSpan={3} className="p-1.5 border-r border-slate-800 bg-slate-900">Rata Mgg Ini</th>
                      <th rowSpan={3} className="p-1.5 border-r border-slate-800 bg-slate-900">vs Mgg Lalu</th>
                      <th colSpan={3} className="p-1.5 border-r border-slate-800 bg-blue-950 text-blue-200">Sektor Rmh</th>
                      <th colSpan={3} className="p-1.5 border-r border-slate-800 bg-purple-950 text-purple-200">RB vs Pelanggan</th>
                      <th colSpan={3} className="p-1.5 border-r border-slate-800 bg-amber-950 text-amber-200">Propaganda (PB)</th>
                      <th colSpan={3} className="p-1.5 border-r border-slate-800 bg-teal-950 text-teal-200">Sampah Botol</th>
                      <th colSpan={4} className="p-1.5 bg-rose-950 text-rose-200">Barang Kembali (BB)</th>
                    </tr>
                    {/* Row 1 */}
                    <tr className="border-b border-slate-800">
                      {/* Penjualan Hari Ini */}
                      <th rowSpan={2} className="p-1 border-r border-slate-800 text-red-300">YO</th>
                      <th rowSpan={2} className="p-1 border-r border-slate-800 text-red-300">OM</th>
                      <th rowSpan={2} className="p-1 border-r border-slate-800 text-red-300">OS</th>
                      <th rowSpan={2} className="p-1 border-r border-slate-800 text-red-300">YT</th>
                      <th rowSpan={2} className="p-1 border-r border-slate-800 font-bold bg-slate-950">ALL</th>

                      {/* Bulan Ini */}
                      <th rowSpan={2} className="p-1 border-r border-slate-800 font-bold text-emerald-300 bg-slate-950">Akm</th>
                      <th colSpan={5} className="p-1 border-r border-slate-800 text-emerald-300">Rata-Rata (Rt2)</th>

                      {/* Sektor Rmh */}
                      <th rowSpan={2} className="p-1 border-r border-slate-800 text-blue-300">Hari</th>
                      <th rowSpan={2} className="p-1 border-r border-slate-800 text-blue-300">Akm</th>
                      <th rowSpan={2} className="p-1 border-r border-slate-800 text-blue-300 font-bold bg-slate-950">%</th>

                      {/* RB vs Pelanggan */}
                      <th rowSpan={2} className="p-1 border-r border-slate-800 text-purple-300">Pelanggan</th>
                      <th rowSpan={2} className="p-1 border-r border-slate-800 text-purple-300">RB</th>
                      <th rowSpan={2} className="p-1 border-r border-slate-800 text-purple-300 font-bold bg-slate-950">%</th>

                      {/* Propaganda Baru */}
                      <th rowSpan={2} className="p-1 border-r border-slate-800 text-amber-300">Pagi</th>
                      <th rowSpan={2} className="p-1 border-r border-slate-800 text-amber-300">Sore</th>
                      <th rowSpan={2} className="p-1 border-r border-slate-800 text-amber-300 font-bold bg-slate-950">Akm</th>

                      {/* Sampah Botol */}
                      <th rowSpan={2} className="p-1 border-r border-slate-800 text-teal-300">Hari</th>
                      <th rowSpan={2} className="p-1 border-r border-slate-800 text-teal-300">Akm</th>
                      <th rowSpan={2} className="p-1 border-r border-slate-800 text-teal-300 font-bold bg-slate-950">vs 900</th>

                      {/* Kembali Botol */}
                      <th rowSpan={2} className="p-1 border-r border-slate-800 text-rose-300">Hari</th>
                      <th rowSpan={2} className="p-1 border-r border-slate-800 text-rose-300 font-bold bg-slate-950">%</th>
                      <th rowSpan={2} className="p-1 border-r border-slate-800 text-rose-300">Akm</th>
                      <th rowSpan={2} className="p-1 text-rose-300 font-bold bg-slate-950">%</th>
                    </tr>
                    {/* Row 2 */}
                    <tr className="border-b border-slate-800">
                      {/* Rata-Rata Bulan Ini */}
                      <th className="p-1 border-r border-slate-800 text-emerald-400">YO</th>
                      <th className="p-1 border-r border-slate-800 text-emerald-400">OM</th>
                      <th className="p-1 border-r border-slate-800 text-emerald-400">OS</th>
                      <th className="p-1 border-r border-slate-800 text-emerald-400">YT</th>
                      <th className="p-1 border-r border-slate-800 font-bold text-emerald-400 bg-slate-950">ALL</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${
                    isFullscreenEval
                      ? (theme === "dark" ? "divide-slate-800 bg-slate-950" : "divide-slate-200 bg-white")
                      : "divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                  }`}>
                    {(() => {
                      let maxCols = { c7: -1, c13: -1, c15: -Infinity, c18: -1, c21: -1, pb: -1, c26: -1, c28: Infinity };
                      if (activeEval?.dataRows) {
                        activeEval.dataRows.forEach(row => {
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

                      return (activeEval?.dataRows || []).map((row, rIdx) => (
                        <tr key={rIdx} className={isFullscreenEval ? (theme === "dark" ? "hover:bg-slate-800 border-b border-slate-800 text-slate-300" : "hover:bg-slate-100 border-b border-slate-200 text-slate-700") : "hover:bg-red-50 dark:hover:bg-red-950/20 border-b border-slate-100 dark:border-slate-800"}>
                          {(row || []).map((val, cIdx) => {
                            let isTopPerf = false;
                            if (cIdx === 7 && val > 0 && val === maxCols.c7) isTopPerf = true;
                            if (cIdx === 13 && val > 0 && val === maxCols.c13) isTopPerf = true;
                            if (cIdx === 15 && maxCols.c15 !== -Infinity && val === maxCols.c15) isTopPerf = true;
                            if (cIdx === 18 && val > 0 && val === maxCols.c18) isTopPerf = true;
                            if (cIdx === 21 && val > 0 && val === maxCols.c21) isTopPerf = true;
                            if ((cIdx === 22 || cIdx === 23) && maxCols.pb > 0 && ((row[22]||0)+(row[23]||0)) === maxCols.pb) isTopPerf = true;
                            if (cIdx === 26 && val > 0 && val === maxCols.c26) isTopPerf = true;
                            if (cIdx === 28 && maxCols.c28 !== Infinity && val === maxCols.c28) isTopPerf = true;

                            return (
                              <td key={cIdx} className={`p-2 border-r text-center font-mono ${isFullscreenEval ? (theme === "dark" ? "border-slate-800" : "border-slate-200") : "border-slate-100 dark:border-slate-800"} ${isTopPerf ? (isFullscreenEval ? (theme === "dark" ? "bg-emerald-950 text-emerald-400 font-extrabold" : "bg-emerald-100 text-emerald-800 font-extrabold") : "bg-emerald-100 dark:bg-emerald-950 font-bold text-emerald-800 dark:text-emerald-400") : ""}`}>
                                {typeof val === "number" ? ([15, 18, 21, 29, 31].includes(cIdx) ? `${val}%` : (cIdx === 27 && val > 0 ? `+${val.toLocaleString("id-ID")}` : val.toLocaleString("id-ID"))) : val}
                              </td>
                            );
                          })}
                        </tr>
                      ));
                    })()}
                    {activeEval?.totalRow && (
                      <tr className={`${isFullscreenEval ? (theme === "dark" ? "bg-slate-900 border-t-2 border-slate-700 text-amber-400 font-black" : "bg-amber-100 border-t-2 border-amber-300 text-amber-800 font-black") : "bg-amber-100 dark:bg-amber-950/40 font-bold border-t-2 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-400"}`}>
                        {(activeEval.totalRow || []).map((val, cIdx) => (
                          <td key={cIdx} className={`p-2 border-r text-center font-mono ${isFullscreenEval ? (theme === "dark" ? "border-slate-800" : "border-slate-200") : "border-amber-200 dark:border-amber-800"}`}>
                            {typeof val === "number" ? ([15, 18, 21, 29, 31].includes(cIdx) ? `${val}%` : (cIdx === 27 && val > 0 ? `+${val.toLocaleString("id-ID")}` : val.toLocaleString("id-ID"))) : val}
                          </td>
                        ))}
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 p-2 text-[9px] text-slate-400 dark:text-slate-500 font-bold text-center border-t border-slate-100 dark:border-slate-800 shrink-0">
                <span className="inline-block w-2.5 h-2.5 bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800 rounded mr-1" /> Sel hijau melambangkan pencapaian performa terbaik harian.
              </div>
            </div>

            {/* Combined highlights "Performa Terbaik" & "Perlu Perbaikan" */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Combined Top Performer + Positives */}
              <div className="bg-white dark:bg-white rounded-2xl p-4 border border-emerald-300 shadow-md text-slate-900">
                <h3 className="text-xs font-black text-emerald-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  🏆 PERFORMA TERBAIK
                </h3>
                {top ? (
                  <div className="text-xs text-slate-800 space-y-1.5">
                    <p>
                      <strong className="font-black text-slate-950">{top.nama}</strong> memimpin dengan memenangkan{" "}
                      <span className="font-black text-emerald-700">{(top as any).winCount || 0} dari 8 kategori</span>.
                    </p>
                    {(top as any).wonCategories && (top as any).wonCategories.length > 0 && (
                      <p className="text-slate-600">
                        Keunggulan di: <strong className="font-bold text-emerald-800">{(top as any).wonCategories.join(", ")}</strong>.
                      </p>
                    )}
                    <div className="text-[11px] font-bold text-emerald-900 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                      👍 Pertahankan efisiensi kunjungan dan rute di sektor andalan Anda!
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-emerald-700 italic">Memuat data...</p>
                )}
              </div>

              {/* Combined Lowest + Negatives (BB) */}
              <div className="bg-white dark:bg-white rounded-2xl p-4 border border-rose-300 shadow-md text-slate-900">
                <h3 className="text-xs font-black text-rose-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  ⚠️ PERFORMA TURUN
                </h3>
                {needImprovement ? (
                  <div className="text-xs text-slate-800 space-y-1.5">
                    <p>
                      <strong className="font-black text-slate-950">{needImprovement.nama}</strong> berada di posisi terbawah pada{" "}
                      <span className="font-black text-rose-700">{(needImprovement as any).loseCount || 0} dari 8 kategori</span>.
                    </p>
                    {(needImprovement as any).lostCategories && (needImprovement as any).lostCategories.length > 0 && (
                      <p className="text-slate-600">
                        Kelemahan di: <strong className="font-bold text-rose-800">{(needImprovement as any).lostCategories.join(", ")}</strong>.
                      </p>
                    )}
                    {highestBB && (
                      <p>
                        Sorotan negatif terbesar pada tingkat Balik Botol (BB) terbanyak dialami oleh{" "}
                        <strong className="font-black text-slate-950">{highestBB.nama}</strong> dengan total{" "}
                        <span className="font-black text-rose-700">{highestBB.bb} btl retur</span> hari ini.
                      </p>
                    )}
                    <div className="text-[11px] font-bold text-rose-900 bg-rose-50 p-2 rounded-lg border border-rose-200">
                      🚨 Tindakan: Segera review rute drop-off dan sisa stock harian agar botol retur tidak membengkak!
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-rose-700 italic">Memuat data...</p>
                )}
              </div>
            </div>

            {/* 8 BENTO GRID METRIC BLOCKS */}
            <div className="bg-white dark:bg-white rounded-2xl p-4 border border-slate-200 shadow-md space-y-3 text-slate-900">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-red-600" /> Ringkasan Prestasi & Sorotan Utama Hari Ini
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* Block 1 */}
                <div className="bg-white dark:bg-white p-3 rounded-xl border border-red-200 shadow-sm text-slate-900">
                  <div className="flex items-center justify-between">
                    <TrendingUp className="w-4 h-4 text-red-600" />
                    <span className="text-[9px] font-black uppercase tracking-wider text-red-800 bg-red-100 border border-red-200 px-2 py-0.5 rounded">Hari Ini</span>
                  </div>
                  <p className="text-xs font-extrabold text-slate-800 mt-2">1. Jual Terbanyak</p>
                  {evaluasiBlocks?.block1 ? (
                    <div className="mt-1">
                      <p className="text-sm font-black text-slate-950 truncate">{cleanYlName(evaluasiBlocks!.block1.nama)}</p>
                      <p className="text-sm font-black text-red-600 mt-0.5">{evaluasiBlocks!.block1.jualHariIni} <span className="text-[10px] font-semibold text-slate-600">btl</span></p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Memuat...</p>
                  )}
                </div>

                {/* Block 2 */}
                <div className="bg-white dark:bg-white p-3 rounded-xl border border-amber-200 shadow-sm text-slate-900">
                  <div className="flex items-center justify-between">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span className="text-[9px] font-black uppercase tracking-wider text-amber-800 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded">Bulan Ini</span>
                  </div>
                  <p className="text-xs font-extrabold text-slate-800 mt-2">2. Rata-rata Tertinggi</p>
                  {evaluasiBlocks?.block2 ? (
                    <div className="mt-1">
                      <p className="text-sm font-black text-slate-950 truncate">{cleanYlName(evaluasiBlocks!.block2.nama)}</p>
                      <p className="text-sm font-black text-amber-600 mt-0.5">{Math.trunc(evaluasiBlocks!.block2.rata2BulanBerjalan)} <span className="text-[10px] font-semibold text-slate-600">btl/hari</span></p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Memuat...</p>
                  )}
                </div>

                {/* Block 3 */}
                <div className="bg-white dark:bg-white p-3 rounded-xl border border-emerald-200 shadow-sm text-slate-900">
                  <div className="flex items-center justify-between">
                    <Zap className="w-4 h-4 text-emerald-600" />
                    <span className="text-[9px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded">vs Mgg Lalu</span>
                  </div>
                  <p className="text-xs font-extrabold text-slate-800 mt-2">3. Kenaikan Tertinggi</p>
                  {evaluasiBlocks?.block3 ? (
                    <div className="mt-1">
                      <p className="text-sm font-black text-slate-950 truncate">{cleanYlName(evaluasiBlocks!.block3.nama)}</p>
                      <p className="text-sm font-black text-emerald-600 mt-0.5">+{Math.trunc(evaluasiBlocks!.block3.vsMingguLaluPct)}%</p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Memuat...</p>
                  )}
                </div>

                {/* Block 4 */}
                <div className="bg-white dark:bg-white p-3 rounded-xl border border-blue-200 shadow-sm text-slate-900">
                  <div className="flex items-center justify-between">
                    <Home className="w-4 h-4 text-blue-600" />
                    <span className="text-[9px] font-black uppercase tracking-wider text-blue-800 bg-blue-100 border border-blue-200 px-2 py-0.5 rounded">Sektor</span>
                  </div>
                  <p className="text-xs font-extrabold text-slate-800 mt-2">4. Persen Rumah Tertinggi</p>
                  {evaluasiBlocks?.block4 ? (
                    <div className="mt-1">
                      <p className="text-sm font-black text-slate-950 truncate">{cleanYlName(evaluasiBlocks!.block4.nama)}</p>
                      <p className="text-sm font-black text-blue-600 mt-0.5">{Math.trunc(evaluasiBlocks!.block4.persenRumah)}%</p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Memuat...</p>
                  )}
                </div>

                {/* Block 5 */}
                <div className="bg-white dark:bg-white p-3 rounded-xl border border-purple-200 shadow-sm text-slate-900">
                  <div className="flex items-center justify-between">
                    <UserCheck className="w-4 h-4 text-purple-600" />
                    <span className="text-[9px] font-black uppercase tracking-wider text-purple-800 bg-purple-100 border border-purple-200 px-2 py-0.5 rounded">Kunjungan</span>
                  </div>
                  <p className="text-xs font-extrabold text-slate-800 mt-2">5. RB vs Pelanggan Tertinggi</p>
                  {evaluasiBlocks?.block5 ? (
                    <div className="mt-1">
                      <p className="text-sm font-black text-slate-950 truncate">{cleanYlName(evaluasiBlocks!.block5.nama)}</p>
                      <p className="text-sm font-black text-purple-600 mt-0.5">{Math.trunc(evaluasiBlocks!.block5.persenRbVsPlg)}%</p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Memuat...</p>
                  )}
                </div>

                {/* Block 6 */}
                <div className="bg-white dark:bg-white p-3 rounded-xl border border-indigo-200 shadow-sm text-slate-900">
                  <div className="flex items-center justify-between">
                    <Megaphone className="w-4 h-4 text-indigo-600" />
                    <span className="text-[9px] font-black uppercase tracking-wider text-indigo-800 bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded">Propaganda</span>
                  </div>
                  <p className="text-xs font-extrabold text-slate-800 mt-2">6. PB Hari Ini Tertinggi</p>
                  {evaluasiBlocks?.block6 ? (
                    <div className="mt-1">
                      <p className="text-sm font-black text-slate-950 truncate">{cleanYlName(evaluasiBlocks!.block6.nama)}</p>
                      <p className="text-sm font-black text-indigo-600 mt-0.5">{evaluasiBlocks!.block6.propagandaHariIni} <span className="text-[10px] font-semibold text-slate-600">PB</span></p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Memuat...</p>
                  )}
                </div>

                {/* Block 7 */}
                <div className="bg-white dark:bg-white p-3 rounded-xl border border-teal-200 shadow-sm text-slate-900">
                  <div className="flex items-center justify-between">
                    <Trash2 className="w-4 h-4 text-teal-600" />
                    <span className="text-[9px] font-black uppercase tracking-wider text-teal-800 bg-teal-100 border border-teal-200 px-2 py-0.5 rounded">Lingkungan</span>
                  </div>
                  <p className="text-xs font-extrabold text-slate-800 mt-2">7. Sampah Botol Terbanyak</p>
                  {evaluasiBlocks?.block7 ? (
                    <div className="mt-1">
                      <p className="text-sm font-black text-slate-950 truncate">{cleanYlName(evaluasiBlocks!.block7.nama)}</p>
                      <p className="text-sm font-black text-teal-600 mt-0.5">{evaluasiBlocks!.block7.sampahBotol} <span className="text-[10px] font-semibold text-slate-600">btl</span></p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Memuat...</p>
                  )}
                </div>

                {/* Block 8 */}
                <div className="bg-white dark:bg-white p-3 rounded-xl border border-emerald-200 shadow-sm text-slate-900">
                  <div className="flex items-center justify-between">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span className="text-[9px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded">Retur</span>
                  </div>
                  <p className="text-xs font-extrabold text-slate-800 mt-2">8. BB Paling Sedikit/Nol</p>
                  {evaluasiBlocks?.block8 ? (
                    <div className="mt-1">
                      <p className="text-sm font-black text-slate-950 truncate">{cleanYlName(evaluasiBlocks!.block8.nama)}</p>
                      <p className="text-sm font-black text-emerald-600 mt-0.5">{evaluasiBlocks!.block8.bb} <span className="text-[10px] font-semibold text-slate-600">btl</span></p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Memuat...</p>
                  )}
                </div>
              </div>
            </div>

            {/* AI Deep Evaluation Card */}
            <div className="bg-white dark:bg-white rounded-2xl p-4 border border-indigo-200 shadow-md text-slate-900 relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-black text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" /> Analisis & Evaluasi AI Jember 1
                </h3>
                <button
                  onClick={runAiInsight}
                  disabled={isAiLoading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg transition-all shadow-sm flex items-center gap-1 disabled:opacity-50"
                >
                  {isAiLoading ? "Sedang Menganalisis..." : "Jalankan Analisis AI"}
                </button>
              </div>

              {isAiLoading ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-[11px] text-indigo-700 font-bold mt-2">Menganalisis data lembar evaluasi harian dengan Gemini...</span>
                </div>
              ) : aiInsight ? (
                <div
                  className="text-xs text-slate-700 bg-white rounded-xl p-3 border border-indigo-100/50 prose max-w-none shadow-sm leading-relaxed max-h-[300px] overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: aiInsight }}
                />
              ) : (
                <p className="text-xs text-slate-500 italic">
                  Klik tombol di atas untuk memanggil modul kecerdasan buatan Gemini guna menganalisis laporan dropping tim Anda secara mendalam.
                </p>
              )}
            </div>
          </div>
        ))}

        {/* Tab Data YL */}
        {activeTab === "lady" && (
          <ManagerLadyTab
            ylList={ylList}
            setYlList={setYlList}
            names={names}
            selectedYLArea={selectedYLArea}
            setSelectedYLArea={setSelectedYLArea}
            ylDetail={ylDetail}
            dashboardData={dashboardData}
            formatRp={formatRp}
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

        {/* Tab Breakdown Rencana Penjualan & Realisasi Manager */}
        {activeTab === "breakdown" && (
          <div className={isGridFullScreen ? "fixed inset-0 z-[100] bg-slate-950 flex flex-col h-screen w-screen overflow-hidden m-0 p-0" : "space-y-4"}>
            {isGridFullScreen ? (
              /* --- FULLSCREEN COMPACT STICKY HEADER --- */
              <div className="sticky top-0 z-50 bg-slate-900 text-white px-1.5 py-0.5 border-b border-slate-800 shadow-md flex flex-wrap items-center justify-between gap-1 text-[9px] shrink-0 select-none">
                <div className="flex flex-wrap items-center gap-1">
                  <div className="inline-flex bg-slate-800 p-0.5 rounded border border-slate-700">
                    <button
                      onClick={() => {
                        setGridSubMode("BD");
                        setUndoStack([]);
                        setRedoStack([]);
                        setGridSelection(null);
                      }}
                      className={`px-1.5 py-0.5 rounded text-[9px] font-black transition-all cursor-pointer ${
                        gridSubMode === "BD" ? "bg-red-600 text-white" : "text-slate-300 hover:text-white"
                      }`}
                    >
                      📊 BD
                    </button>
                    <button
                      onClick={() => {
                        setGridSubMode("Realisasi");
                        setUndoStack([]);
                        setRedoStack([]);
                        setGridSelection(null);
                      }}
                      className={`px-1.5 py-0.5 rounded text-[9px] font-black transition-all cursor-pointer ${
                        gridSubMode === "Realisasi" ? "bg-emerald-600 text-white" : "text-slate-300 hover:text-white"
                      }`}
                    >
                      📈 Realisasi
                    </button>
                  </div>

                  <input
                    type="month"
                    value={selectedBreakdownMonth}
                    onChange={(e) => setSelectedBreakdownMonth(e.target.value)}
                    className="px-1 py-0.5 bg-slate-800 border border-slate-700 rounded text-[9px] font-black text-white font-mono outline-none"
                  />



                  {gridSelection && (
                    <span className="bg-blue-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full shadow">
                      📌 {Math.abs(gridSelection.endR - gridSelection.startR) + 1}x{Math.abs(gridSelection.endC - gridSelection.startC) + 1} Sel
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-0.5 ml-auto flex-wrap">
                  <button
                    onClick={handleSelectAllGridCells}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[9px] px-1.5 py-0.5 rounded transition-all cursor-pointer shadow"
                  >
                    🔲 Blok Semua
                  </button>

                  <select
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val !== "") {
                        handleSelectRowGridCells(Number(val));
                        e.target.value = "";
                      }
                    }}
                    defaultValue=""
                    className="bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-[9px] px-1 py-0.5 rounded border border-slate-700 outline-none cursor-pointer"
                  >
                    <option value="" disabled>👤 YL...</option>
                    {activeYLsList.map((y, idx) => (
                      <option key={y.area} value={idx}>[{y.area}] {y.nama.replace(/^\d+\s*/, "")}</option>
                    ))}
                  </select>

                  <select
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val !== "") {
                        handleSelectDayGridCells(Number(val));
                        e.target.value = "";
                      }
                    }}
                    defaultValue=""
                    className="bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold text-[9px] px-1 py-0.5 rounded border border-slate-700 outline-none cursor-pointer"
                  >
                    <option value="" disabled>📅 Tgl...</option>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                      <option key={day} value={day}>Tgl {day}</option>
                    ))}
                  </select>

                  <button
                    onClick={handleUndo}
                    disabled={undoStack.length === 0}
                    className="bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white font-black text-[9px] px-1.5 py-0.5 rounded transition-all cursor-pointer shadow"
                    title="Undo (Batal Edit)"
                  >
                    ↩️ UNDO ({undoStack.length})
                  </button>

                  <button
                    onClick={handleRedo}
                    disabled={redoStack.length === 0}
                    className="bg-purple-800 hover:bg-purple-900 disabled:opacity-40 text-white font-black text-[9px] px-1.5 py-0.5 rounded transition-all cursor-pointer shadow"
                    title="Redo (Ulangi Edit)"
                  >
                    ↪️ REDO ({redoStack.length})
                  </button>

                  <button
                    onClick={handleCopyGridCells}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[9px] px-1.5 py-0.5 rounded transition-all cursor-pointer shadow"
                  >
                    📋 SALIN
                  </button>

                  <button
                    onClick={handleMobilePasteClick}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-black text-[9px] px-1.5 py-0.5 rounded transition-all cursor-pointer shadow"
                  >
                    📥 TEMPEL
                  </button>

                  {gridSelection && (
                    <button
                      onClick={handleClearSelectedGridCells}
                      className="bg-rose-600 hover:bg-rose-700 text-white font-black text-[9px] px-1 py-0.5 rounded transition-all cursor-pointer shadow"
                    >
                      🗑️ HAPUS
                    </button>
                  )}

                  <button
                    onClick={handleSaveBreakdownPlan}
                    disabled={isBreakdownSaving}
                    className="bg-red-600 hover:bg-red-700 text-white font-black text-[9px] px-1.5 py-0.5 rounded transition-all cursor-pointer shadow disabled:opacity-50"
                  >
                    💾 SIMPAN
                  </button>

                  <button
                    onClick={() => setIsGridFullScreen(false)}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-black text-[9px] px-1.5 py-0.5 rounded transition-all cursor-pointer shadow flex items-center gap-0.5"
                    title="Keluar Layar Penuh (ESC)"
                  >
                    <Minimize2 className="w-2.5 h-2.5" />
                    <span>KELUAR</span>
                  </button>
                </div>
              </div>
            ) : (
              /* --- NORMAL CARD HEADER --- */
              <div className="rounded-2xl p-4 border shadow-sm space-y-3 transition-all bg-white border-slate-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-l-4 border-red-600 pl-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">PILIH MODE:</span>
                      <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                        <button
                          onClick={() => {
                            setGridSubMode("BD");
                            setUndoStack([]);
                            setRedoStack([]);
                            setGridSelection(null);
                          }}
                          className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                            gridSubMode === "BD"
                              ? "bg-red-600 text-white shadow-sm"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          📊 BD (Breakdown Rencana)
                        </button>
                        <button
                          onClick={() => {
                            setGridSubMode("Realisasi");
                            setUndoStack([]);
                            setRedoStack([]);
                            setGridSelection(null);
                          }}
                          className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                            gridSubMode === "Realisasi"
                              ? "bg-emerald-600 text-white shadow-sm"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          📈 Realisasi Penjualan
                        </button>
                        <button
                          onClick={() => setIsGridFullScreen(true)}
                          className="bg-slate-800 hover:bg-slate-900 text-white font-black text-[10px] px-2 py-1 rounded-lg transition-all cursor-pointer shadow-sm flex items-center gap-1 ml-1"
                          title="Tampilkan Mode Layar Penuh"
                        >
                          <Maximize2 className="w-3 h-3 text-white" />
                          <span>Fullscreen</span>
                        </button>
                      </div>
                    </div>
                    <h2 className="text-xs md:text-sm font-black uppercase tracking-wider flex items-center gap-2 text-red-950">
                      <Grid3X3 className="w-4 h-4 text-red-600" />
                      {gridSubMode === "BD"
                        ? "📊 TABEL BD (BREAKDOWN RENCANA PENJUALAN YL)"
                        : "📈 TABEL REALISASI PENJUALAN YL"}
                    </h2>
                    <p className="text-[10px] font-bold leading-relaxed text-slate-500">
                      {gridSubMode === "BD"
                        ? "Input & edit rencana harian per YL. Mendukung blok sel, Hapus, Copy-Paste, Undo & Redo."
                        : "Input & edit realisasi harian per YL. Acuan pembagi adalah Pembagi Tanggal per YL."}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 p-1 rounded-xl">
                      <span className="text-[10px] font-bold text-amber-700 pl-1 uppercase">Pembagi {gridSubMode}:</span>
                      <NumberInput
                        min={1} max={31}
                        value={Object.keys(activeGridMap).length > 0 ? (activeGridMap[Object.keys(activeGridMap)[0]]?.pembagiTanggal || 25) : 25}
                        onChange={handleGlobalPembagiChange}
                        className="w-12 p-1 bg-white border border-amber-300 rounded text-xs font-black text-amber-900 text-center outline-none focus:border-amber-500"
                      />
                    </div>
                    <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 p-1 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-500 pl-1">Bulan:</span>
                      <input
                        type="month"
                        value={selectedBreakdownMonth}
                        onChange={(e) => setSelectedBreakdownMonth(e.target.value)}
                        className="p-1 bg-white border border-slate-200 rounded text-xs font-black text-slate-800 font-mono outline-none"
                      />
                    </div>
                    {isBreakdownSaving && (
                      <span className="text-[10px] font-black text-emerald-600 animate-pulse ml-2">Menyimpan...</span>
                    )}
                  </div>
                </div>

                {breakdownMsg && (
                  <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-black text-emerald-800 text-center animate-pulse">
                    {breakdownMsg}
                  </div>
                )}

                {/* Mobile & Spreadsheet Control Toolbar */}
                <div className="bg-white text-slate-900 border-2 border-slate-200 p-3.5 rounded-2xl shadow-md space-y-3">
                  {/* Status Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-amber-700 font-black text-xs uppercase flex items-center gap-1">
                        📱 Kontrol Blok HP & Spreadsheet:
                      </span>
                      {gridSelection ? (
                        <span className="bg-blue-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full animate-pulse shadow">
                          📌 {Math.abs(gridSelection.endR - gridSelection.startR) + 1} Baris YL x {Math.abs(gridSelection.endC - gridSelection.startC) + 1} Sel Diblok
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[10px] font-bold">
                          Belum ada sel diblok (Gunakan tombol "Blok Semua" atau Tarik Sel)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Main Control Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    {/* Left Controls: Selection Tools */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        onClick={handleSelectAllGridCells}
                        className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black text-[9px] px-2 py-1 rounded-lg transition-all shadow flex items-center gap-1 cursor-pointer"
                      >
                        <span>🔲 Blok Semua {gridSubMode === 'BD' ? 'BD' : 'Realisasi'}</span>
                      </button>

                      <div className="relative inline-block">
                        <select
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val !== "") {
                              handleSelectRowGridCells(Number(val));
                              e.target.value = "";
                            }
                          }}
                          defaultValue=""
                          className="bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-[9px] px-2 py-1 rounded-lg border border-slate-700 outline-none cursor-pointer"
                        >
                          <option value="" disabled>👤 Blok Baris YL...</option>
                          {activeYLsList.map((y, idx) => (
                            <option key={y.area} value={idx}>[{y.area}] {y.nama.replace(/^\d+\s*/, "")}</option>
                          ))}
                        </select>
                      </div>

                      <div className="relative inline-block">
                        <select
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val !== "") {
                              handleSelectDayGridCells(Number(val));
                              e.target.value = "";
                            }
                          }}
                          defaultValue=""
                          className="bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold text-[9px] px-2 py-1 rounded-lg border border-slate-700 outline-none cursor-pointer"
                        >
                          <option value="" disabled>📅 Blok Tanggal...</option>
                          {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                            <option key={day} value={day}>Tanggal {day}</option>
                          ))}
                        </select>
                      </div>

                      {gridSelection && (
                        <button
                          onClick={() => setGridSelection(null)}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[9px] px-2 py-1 rounded-lg border border-slate-700 cursor-pointer"
                        >
                          <span>🧹 Batal Blok</span>
                        </button>
                      )}
                    </div>

                    {/* Right Controls: Undo, Redo, Copy, Paste, Delete */}
                    <div className="flex items-center gap-1.5 ml-auto">
                      <button
                        onClick={handleUndo}
                        disabled={undoStack.length === 0}
                        className="bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 text-white font-black text-xs px-3 py-1.5 rounded-xl transition-all shadow flex items-center gap-1 cursor-pointer"
                        title="Undo edit terakhir"
                      >
                        <span>↩️ UNDO ({undoStack.length})</span>
                      </button>

                      <button
                        onClick={handleRedo}
                        disabled={redoStack.length === 0}
                        className="bg-purple-800 hover:bg-purple-900 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 text-white font-black text-xs px-3 py-1.5 rounded-xl transition-all shadow flex items-center gap-1 cursor-pointer"
                        title="Redo edit terakhir"
                      >
                        <span>↪️ REDO ({redoStack.length})</span>
                      </button>

                      <button
                        onClick={handleCopyGridCells}
                        className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs px-3 py-1.5 rounded-xl transition-all shadow flex items-center gap-1 cursor-pointer"
                      >
                        <span>📋 SALIN (COPY)</span>
                      </button>

                      <button
                        onClick={handleMobilePasteClick}
                        className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black text-xs px-3 py-1.5 rounded-xl transition-all shadow flex items-center gap-1 cursor-pointer"
                      >
                        <span>📥 TEMPEL (PASTE)</span>
                      </button>

                      {gridSelection && (
                        <button
                          onClick={handleClearSelectedGridCells}
                          className="bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-black text-xs px-2.5 py-1.5 rounded-xl transition-all shadow flex items-center gap-1 cursor-pointer"
                        >
                          <span>🗑️ HAPUS</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}



            {/* Full Width Grid Table */}
            <div ref={gridTableRef} className={`bg-white border-2 border-slate-200 rounded-2xl shadow-md p-2 overflow-x-auto fast-scroll ${isGridFullScreen ? "flex-1 w-full overflow-y-auto" : "max-h-[620px] overflow-y-auto"} select-none relative`}>
              <GridSelectionToolbar
                selection={gridSelection}
                onCopy={handleCopyGridCells}
                onCut={handleCutGridCells}
                onPaste={handleMobilePasteClick}
                onClear={handleClearSelectedGridCells}
                onClose={() => setGridSelection(null)}
              />

                <table className="w-full text-left text-[11px] border-collapse font-mono">
                  <thead className="sticky top-0 bg-slate-900 text-white z-30 shadow-md sticky-header-gpu">
                    <tr className="text-[8.5px] uppercase font-black tracking-wider divide-x divide-slate-800">
                      <th className="py-0.5 px-1 sticky left-0 bg-slate-900 z-40 min-w-[120px] shadow-r text-red-400 border-r border-slate-700">
                        Nama / Area YL
                      </th>
                      {/* Dates Column Group */}
                      {(
                        breakdownDateRange === "1-10" ? Array.from({ length: 10 }, (_, i) => i + 1) :
                        breakdownDateRange === "11-20" ? Array.from({ length: 10 }, (_, i) => i + 11) :
                        breakdownDateRange === "21-31" ? Array.from({ length: 11 }, (_, i) => i + 21) :
                        Array.from({ length: 31 }, (_, i) => i + 1)
                      ).map(day => {
                        const dayTot = dailyGridTotals[day] ? (dailyGridTotals[day].yo + dailyGridTotals[day].om + dailyGridTotals[day].os + dailyGridTotals[day].yt) : 0;
                        return (
                          <th key={day} colSpan={4} className="py-1 px-0.5 text-center bg-slate-900 border-b border-slate-700 text-slate-200 border-x border-slate-800">
                            <div className="flex flex-col items-center justify-center gap-0.5">
                              <span>Tgl {day}</span>
                              <span className="text-[8px] font-mono font-black text-cyan-300 bg-slate-800 px-1 py-0.2 rounded border border-slate-700">
                                {dayTot} btl
                              </span>
                            </div>
                          </th>
                        );
                      })}
                      {/* Akumulasi 4 Item + Total Header */}
                      <th colSpan={5} className={`py-0.5 px-1 text-center border-l ${gridSubMode === "BD" ? "bg-red-950 text-red-200 border-red-800" : "bg-emerald-950 text-emerald-200 border-emerald-800"}`}>
                        AKUMULASI {gridSubMode === "BD" ? "BD" : "REALISASI"} (TOTAL)
                      </th>
                      {/* Rata-rata 4 Item + Total Header */}
                      <th colSpan={5} className="py-0.5 px-1 text-center bg-amber-950 text-amber-200 border-l border-amber-800">
                        RATA-RATA {gridSubMode === "BD" ? "BD" : "REALISASI"}
                      </th>
                      {/* Valuation vs Target / LM / LY Header */}
                      <th colSpan={6} className="py-0.5 px-1 text-center bg-purple-950 text-purple-200 border-l border-purple-800">
                        VALUASI vs TARGET MANAGER
                      </th>
                    </tr>
                    <tr className="text-[7.5px] uppercase font-bold text-slate-400 border-t border-slate-800 divide-x divide-slate-800">
                      <th className="py-0.5 px-0.5 sticky left-0 bg-slate-900 z-40 min-w-[120px] border-r border-slate-700"></th>
                      {(
                        breakdownDateRange === "1-10" ? Array.from({ length: 10 }, (_, i) => i + 1) :
                        breakdownDateRange === "11-20" ? Array.from({ length: 10 }, (_, i) => i + 11) :
                        breakdownDateRange === "21-31" ? Array.from({ length: 11 }, (_, i) => i + 21) :
                        Array.from({ length: 31 }, (_, i) => i + 1)
                      ).flatMap(day => [
                        <th key={`${day}-yo`} className="py-0.5 px-0.5 text-center text-red-400 bg-slate-900/90 w-9">YO</th>,
                        <th key={`${day}-om`} className="py-0.5 px-0.5 text-center text-amber-400 bg-slate-900/90 w-9">OM</th>,
                        <th key={`${day}-os`} className="py-0.5 px-0.5 text-center text-pink-400 bg-slate-900/90 w-9">OS</th>,
                        <th key={`${day}-yt`} className="py-0.5 px-0.5 text-center text-blue-400 bg-slate-900/90 w-9">YT</th>
                      ])}
                      {/* Akumulasi Sub-columns */}
                      <th className="py-0.5 px-0.5 text-center bg-red-900/90 text-red-300 w-10">YO</th>
                      <th className="py-0.5 px-0.5 text-center bg-amber-900/90 text-amber-300 w-10">OM</th>
                      <th className="py-0.5 px-0.5 text-center bg-pink-900/90 text-pink-300 w-10">OS</th>
                      <th className="py-0.5 px-0.5 text-center bg-blue-900/90 text-blue-300 w-10">YT</th>
                      <th className="py-0.5 px-0.5 text-center bg-red-950 text-white w-12 font-black">TOTAL</th>

                      {/* Rata-rata Sub-columns */}
                      <th className="py-0.5 px-0.5 text-center bg-amber-900/80 text-red-300 w-10">YO</th>
                      <th className="py-0.5 px-0.5 text-center bg-amber-900/80 text-amber-300 w-10">OM</th>
                      <th className="py-0.5 px-0.5 text-center bg-amber-900/80 text-pink-300 w-10">OS</th>
                      <th className="py-0.5 px-0.5 text-center bg-amber-900/80 text-blue-300 w-10">YT</th>
                      <th className="py-0.5 px-0.5 text-center bg-amber-950 text-amber-200 w-12 font-black">TOTAL</th>

                      {/* Valuation Sub-columns */}
                      <th className="py-0.5 px-0.5 text-center bg-purple-900 text-purple-200 w-12">Target</th>
                      <th className="py-0.5 px-0.5 text-center bg-purple-900 text-purple-100 w-12 font-black">+/- Tgt</th>
                      <th className="py-0.5 px-0.5 text-center bg-indigo-900 text-indigo-200 w-12">B.Lalu</th>
                      <th className="py-0.5 px-0.5 text-center bg-indigo-900 text-indigo-100 w-12 font-black">+/- LM</th>
                      <th className="py-0.5 px-0.5 text-center bg-teal-900 text-teal-200 w-12">T.Lalu</th>
                      <th className="py-0.5 px-0.5 text-center bg-teal-900 text-teal-100 w-12 font-black">+/- LY</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800">
                    {activeYLsList.map((yl, rIdx) => (
                      <BreakdownGridRow
                        key={rIdx}
                        yl={yl}
                        rIdx={rIdx}
                        activeGridMap={activeGridMap}
                        targetYLMap={targetYLMap}
                        breakdownDateRange={breakdownDateRange}
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
                      />
                    ))}
                    {/* BARIS TOTAL HARIAN (gabungan semua YL, per tanggal & grand total) */}
                    {(() => {
                      const daysListFooter = (
                        breakdownDateRange === "1-10" ? Array.from({ length: 10 }, (_, i) => i + 1) :
                        breakdownDateRange === "11-20" ? Array.from({ length: 10 }, (_, i) => i + 11) :
                        breakdownDateRange === "21-31" ? Array.from({ length: 11 }, (_, i) => i + 21) :
                        Array.from({ length: 31 }, (_, i) => i + 1)
                      );

                      let grandAkumYo = 0, grandAkumOm = 0, grandAkumOs = 0, grandAkumYt = 0;
                      let grandAvgYo = 0, grandAvgOm = 0, grandAvgOs = 0, grandAvgYt = 0;
                      let grandTargetTotal = 0, grandBlnLaluTotal = 0, grandThnLaluTotal = 0;

                      activeYLsList.forEach((yl) => {
                        const area = String(yl.area).substring(0, 3);
                        const ylPlan = activeGridMap[area] || { pembagiTanggal: 25, days: {} };

                        let totYo = 0, totOm = 0, totOs = 0, totYt = 0;
                        Object.values(ylPlan.days || {}).forEach((d: any) => {
                          totYo += Number(d.yo) || 0;
                          totOm += Number(d.om) || 0;
                          totOs += Number(d.os) || 0;
                          totYt += Number(d.yt) || 0;
                        });

                        const activePembagi = ylPlan.pembagiTanggal || 25;

                        grandAkumYo += totYo;
                        grandAkumOm += totOm;
                        grandAkumOs += totOs;
                        grandAkumYt += totYt;

                        if (activePembagi > 0) {
                          grandAvgYo += Math.round(totYo / activePembagi);
                          grandAvgOm += Math.round(totOm / activePembagi);
                          grandAvgOs += Math.round(totOs / activePembagi);
                          grandAvgYt += Math.round(totYt / activePembagi);
                        }

                        const tgtObj = targetYLMap[area] || { target: 0, bln_lalu: 0, thn_lalu: 0 };
                        grandTargetTotal += (tgtObj.target ?? 0) * activePembagi;
                        grandBlnLaluTotal += (tgtObj.bln_lalu ?? 0) * activePembagi;
                        grandThnLaluTotal += (tgtObj.thn_lalu ?? 0) * activePembagi;
                      });

                      const grandAkumTotal = grandAkumYo + grandAkumOm + grandAkumOs + grandAkumYt;
                      const grandAvgTotal = grandAvgYo + grandAvgOm + grandAvgOs + grandAvgYt;
                      const grandDiffTarget = grandAkumTotal - grandTargetTotal;
                      const grandDiffLM = grandAkumTotal - grandBlnLaluTotal;
                      const grandDiffLY = grandAkumTotal - grandThnLaluTotal;

                      return (
                        <>
                          {/* ROW 1: TOTAL HARIAN SUB-ITEMS (YO, OM, OS, YT) PER TANGGAL */}
                          <tr className="bg-slate-900 text-white font-black text-[10px] divide-x divide-slate-800 sticky bottom-7 z-20 shadow-md border-t-2 border-slate-700">
                            <td className="p-1.5 sticky left-0 bg-slate-900 z-30 min-w-[120px] text-cyan-300 uppercase tracking-wide">
                              Total Harian (YO, OM, OS, YT)
                            </td>
                            {daysListFooter.flatMap(day => {
                              const t = dailyGridTotals[day] || { yo: 0, om: 0, os: 0, yt: 0 };
                              return [
                                <td key={`${day}-tot-yo`} className="p-0.5 text-center text-red-300 bg-slate-900/90">{t.yo}</td>,
                                <td key={`${day}-tot-om`} className="p-0.5 text-center text-amber-300 bg-slate-900/90">{t.om}</td>,
                                <td key={`${day}-tot-os`} className="p-0.5 text-center text-pink-300 bg-slate-900/90">{t.os}</td>,
                                <td key={`${day}-tot-yt`} className="p-0.5 text-center text-blue-300 bg-slate-900/90">{t.yt}</td>
                              ];
                            })}

                            {/* Akumulasi Totals */}
                            <td className="p-1 text-center font-black text-red-300 bg-red-950/80">{grandAkumYo}</td>
                            <td className="p-1 text-center font-black text-amber-300 bg-amber-950/80">{grandAkumOm}</td>
                            <td className="p-1 text-center font-black text-pink-300 bg-pink-950/80">{grandAkumOs}</td>
                            <td className="p-1 text-center font-black text-blue-300 bg-blue-950/80">{grandAkumYt}</td>
                            <td className="p-1 text-center font-black text-white bg-red-800">{grandAkumTotal}</td>

                            {/* Rata-Rata Totals */}
                            <td className="p-1 text-center font-black text-red-300 bg-amber-900/80">{grandAvgYo}</td>
                            <td className="p-1 text-center font-black text-amber-300 bg-amber-900/80">{grandAvgOm}</td>
                            <td className="p-1 text-center font-black text-pink-300 bg-amber-900/80">{grandAvgOs}</td>
                            <td className="p-1 text-center font-black text-blue-300 bg-amber-900/80">{grandAvgYt}</td>
                            <td className="p-1 text-center font-black text-amber-200 bg-amber-950">{grandAvgTotal}</td>

                            {/* Valuasi vs Target Totals */}
                            <td className="p-1 text-center font-black text-purple-200 bg-purple-950">{grandTargetTotal}</td>
                            <td className={`p-1 text-center font-black ${grandDiffTarget >= 0 ? "text-emerald-300 bg-emerald-950" : "text-rose-300 bg-rose-950"}`}>
                              {grandDiffTarget >= 0 ? `+${grandDiffTarget}` : grandDiffTarget}
                            </td>
                            <td className="p-1 text-center font-black text-indigo-200 bg-indigo-950">{grandBlnLaluTotal}</td>
                            <td className={`p-1 text-center font-black ${grandDiffLM >= 0 ? "text-emerald-300 bg-emerald-950" : "text-rose-300 bg-rose-950"}`}>
                              {grandDiffLM >= 0 ? `+${grandDiffLM}` : grandDiffLM}
                            </td>
                            <td className="p-1 text-center font-black text-teal-200 bg-teal-950">{grandThnLaluTotal}</td>
                            <td className={`p-1 text-center font-black ${grandDiffLY >= 0 ? "text-emerald-300 bg-emerald-950" : "text-rose-300 bg-rose-950"}`}>
                              {grandDiffLY >= 0 ? `+${grandDiffLY}` : grandDiffLY}
                            </td>
                          </tr>

                          {/* ROW 2: TOTAL BOTOL HARIAN (GABUNGAN BOTOL YO+OM+OS+YT PER TANGGAL) */}
                          <tr className="bg-cyan-950 text-cyan-200 font-black text-[10px] divide-x divide-cyan-900 sticky bottom-0 z-20 shadow-lg border-t border-cyan-800">
                            <td className="p-1.5 sticky left-0 bg-cyan-950 z-30 min-w-[120px] text-amber-300 uppercase tracking-wide">
                              Total Botol / Hari
                            </td>
                            {daysListFooter.map(day => {
                              const t = dailyGridTotals[day] || { yo: 0, om: 0, os: 0, yt: 0 };
                              const sumDay = t.yo + t.om + t.os + t.yt;
                              return (
                                <td key={`${day}-tot-combined`} colSpan={4} className="p-1 text-center text-amber-300 font-mono font-extrabold bg-cyan-950">
                                  {sumDay} btl
                                </td>
                              );
                            })}
                            <td colSpan={16} className="p-1 text-center text-cyan-200 font-mono font-extrabold bg-cyan-900/90">
                              TOT AKUMULASI BULAN INI: <span className="text-amber-300 font-black">{grandAkumTotal} btl</span>
                            </td>
                          </tr>
                        </>
                      );
                    })()}
                  </tbody>
                </table>
              </div>
          </div>
        )}

        {/* Tab Target & Kompensasi */}
        {activeTab === "target_kompensasi" && (
          <div className="space-y-4">
            {/* 1. Target TKU DP Jember 1 */}
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-4 relative">
              <GridSelectionToolbar
                selection={tkuGridSelection}
                onCopy={handleTkuGridCopy}
                onCut={handleTkuGridCut}
                onPaste={handleTkuGridPaste}
                onClear={handleTkuGridClear}
                onClose={() => setTkuGridSelection(null)}
              />
              <div className="border-l-4 border-red-600 pl-2">
                <h2 className="text-xs font-black text-red-950 uppercase tracking-wider flex items-center gap-2">
                  <Target className="w-4 h-4 text-red-600" />
                  🎯 Target & Pembanding TKU DP Jember 1 (Total Tim)
                </h2>
                <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
                  Tentukan rincian Target, Bulan Lalu, dan Tahun Lalu untuk tim (TKU).
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-300 space-y-3">
                <div className="overflow-x-auto border-2 border-slate-400 rounded-xl bg-white shadow-sm">
                  <table className="w-full text-left text-xs sm:text-sm border-collapse font-mono">
                    <thead>
                      <tr className="bg-slate-900 text-slate-100 font-black uppercase text-xs border-b-2 border-slate-800 divide-x divide-slate-700">
                        <th className="p-3 border-r-2 border-slate-700">Kategori Tim (TKU)</th>
                        <th className="p-3 text-center border-r border-slate-700 text-red-400">YO (btl)</th>
                        <th className="p-3 text-center border-r border-slate-700 text-amber-400">OM (btl)</th>
                        <th className="p-3 text-center border-r border-slate-700 text-pink-400">OS (btl)</th>
                        <th className="p-3 text-center border-r border-slate-700 text-blue-400">YT (btl)</th>
                        <th className="p-3 text-right bg-slate-950 text-emerald-400">Total TKU (btl)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300 font-bold text-slate-900">
                      {/* Target TKU Row */}
                      <tr className="hover:bg-amber-50/50 transition-colors">
                        <td className="p-3 font-black text-red-700 uppercase text-xs border-r-2 border-slate-300 bg-slate-50/80">Target TKU</td>
                        <td {...getTkuCellProps(0, 0)} className={`p-1.5 text-center border-r border-slate-300 ${getTkuCellProps(0, 0).className}`}>
                          <NumberInput
                            min={0}
                            value={targetTKU.target_yo ?? Math.trunc((targetTKU.target ?? 0) * 0.85)}
                            onChange={(yo) => {
                              const om = targetTKU.target_om ?? Math.trunc((targetTKU.target ?? 0) * 0.08);
                              const os = targetTKU.target_os ?? Math.trunc((targetTKU.target ?? 0) * 0.05);
                              const yt = targetTKU.target_yt ?? Math.trunc((targetTKU.target ?? 0) * 0.02);
                              setTargetTKU({ ...targetTKU, target_yo: yo, target: yo + om + os + yt });
                            }}
                            className="p-1.5 w-full h-full text-xs sm:text-sm bg-transparent outline-none border-none text-center text-slate-900 font-black"
                          />
                        </td>
                        <td {...getTkuCellProps(0, 1)} className={`p-1.5 text-center border-r border-slate-300 ${getTkuCellProps(0, 1).className}`}>
                          <NumberInput
                            min={0}
                            value={targetTKU.target_om ?? Math.trunc((targetTKU.target ?? 0) * 0.08)}
                            onChange={(om) => {
                              const yo = targetTKU.target_yo ?? Math.trunc((targetTKU.target ?? 0) * 0.85);
                              const os = targetTKU.target_os ?? Math.trunc((targetTKU.target ?? 0) * 0.05);
                              const yt = targetTKU.target_yt ?? Math.trunc((targetTKU.target ?? 0) * 0.02);
                              setTargetTKU({ ...targetTKU, target_om: om, target: yo + om + os + yt });
                            }}
                            className="p-1.5 w-full h-full text-xs sm:text-sm bg-transparent outline-none border-none text-center text-slate-900 font-black"
                          />
                        </td>
                        <td {...getTkuCellProps(0, 2)} className={`p-1.5 text-center border-r border-slate-300 ${getTkuCellProps(0, 2).className}`}>
                          <NumberInput
                            min={0}
                            value={targetTKU.target_os ?? Math.trunc((targetTKU.target ?? 0) * 0.05)}
                            onChange={(os) => {
                              const yo = targetTKU.target_yo ?? Math.trunc((targetTKU.target ?? 0) * 0.85);
                              const om = targetTKU.target_om ?? Math.trunc((targetTKU.target ?? 0) * 0.08);
                              const yt = targetTKU.target_yt ?? Math.trunc((targetTKU.target ?? 0) * 0.02);
                              setTargetTKU({ ...targetTKU, target_os: os, target: yo + om + os + yt });
                            }}
                            className="p-1.5 w-full h-full text-xs sm:text-sm bg-transparent outline-none border-none text-center text-slate-900 font-black"
                          />
                        </td>
                        <td {...getTkuCellProps(0, 3)} className={`p-1.5 text-center border-r border-slate-300 ${getTkuCellProps(0, 3).className}`}>
                          <NumberInput
                            min={0}
                            value={targetTKU.target_yt ?? Math.trunc((targetTKU.target ?? 0) * 0.02)}
                            onChange={(yt) => {
                              const yo = targetTKU.target_yo ?? Math.trunc((targetTKU.target ?? 0) * 0.85);
                              const om = targetTKU.target_om ?? Math.trunc((targetTKU.target ?? 0) * 0.08);
                              const os = targetTKU.target_os ?? Math.trunc((targetTKU.target ?? 0) * 0.05);
                              setTargetTKU({ ...targetTKU, target_yt: yt, target: yo + om + os + yt });
                            }}
                            className="p-1.5 w-full h-full text-xs sm:text-sm bg-transparent outline-none border-none text-center text-slate-900 font-black"
                          />
                        </td>
                        <td className="p-3 text-right font-black text-red-600 text-sm sm:text-base bg-red-50/50">
                          {targetTKU.target ?? 0} btl
                        </td>
                      </tr>

                      {/* Bulan Lalu TKU Row */}
                      <tr className="hover:bg-purple-50/50 transition-colors">
                        <td className="p-3 font-black text-purple-800 uppercase text-xs border-r-2 border-slate-300 bg-slate-50/80">Bulan Lalu TKU</td>
                        <td {...getTkuCellProps(1, 0)} className={`p-1.5 text-center border-r border-slate-300 ${getTkuCellProps(1, 0).className}`}>
                          <NumberInput
                            min={0}
                            value={targetTKU.bln_lalu_yo ?? Math.trunc((targetTKU.bln_lalu ?? 0) * 0.85)}
                            onChange={(yo) => {
                              const om = targetTKU.bln_lalu_om ?? Math.trunc((targetTKU.bln_lalu ?? 0) * 0.08);
                              const os = targetTKU.bln_lalu_os ?? Math.trunc((targetTKU.bln_lalu ?? 0) * 0.05);
                              const yt = targetTKU.bln_lalu_yt ?? Math.trunc((targetTKU.bln_lalu ?? 0) * 0.02);
                              setTargetTKU({ ...targetTKU, bln_lalu_yo: yo, bln_lalu: yo + om + os + yt });
                            }}
                            className="p-1.5 w-full h-full text-xs sm:text-sm bg-transparent outline-none border-none text-center text-slate-900 font-black"
                          />
                        </td>
                        <td {...getTkuCellProps(1, 1)} className={`p-1.5 text-center border-r border-slate-300 ${getTkuCellProps(1, 1).className}`}>
                          <NumberInput
                            min={0}
                            value={targetTKU.bln_lalu_om ?? Math.trunc((targetTKU.bln_lalu ?? 0) * 0.08)}
                            onChange={(om) => {
                              const yo = targetTKU.bln_lalu_yo ?? Math.trunc((targetTKU.bln_lalu ?? 0) * 0.85);
                              const os = targetTKU.bln_lalu_os ?? Math.trunc((targetTKU.bln_lalu ?? 0) * 0.05);
                              const yt = targetTKU.bln_lalu_yt ?? Math.trunc((targetTKU.bln_lalu ?? 0) * 0.02);
                              setTargetTKU({ ...targetTKU, bln_lalu_om: om, bln_lalu: yo + om + os + yt });
                            }}
                            className="p-1.5 w-full h-full text-xs sm:text-sm bg-transparent outline-none border-none text-center text-slate-900 font-black"
                          />
                        </td>
                        <td {...getTkuCellProps(1, 2)} className={`p-1.5 text-center border-r border-slate-300 ${getTkuCellProps(1, 2).className}`}>
                          <NumberInput
                            min={0}
                            value={targetTKU.bln_lalu_os ?? Math.trunc((targetTKU.bln_lalu ?? 0) * 0.05)}
                            onChange={(os) => {
                              const yo = targetTKU.bln_lalu_yo ?? Math.trunc((targetTKU.bln_lalu ?? 0) * 0.85);
                              const om = targetTKU.bln_lalu_om ?? Math.trunc((targetTKU.bln_lalu ?? 0) * 0.08);
                              const yt = targetTKU.bln_lalu_yt ?? Math.trunc((targetTKU.bln_lalu ?? 0) * 0.02);
                              setTargetTKU({ ...targetTKU, bln_lalu_os: os, bln_lalu: yo + om + os + yt });
                            }}
                            className="p-1.5 w-full h-full text-xs sm:text-sm bg-transparent outline-none border-none text-center text-slate-900 font-black"
                          />
                        </td>
                        <td {...getTkuCellProps(1, 3)} className={`p-1.5 text-center border-r border-slate-300 ${getTkuCellProps(1, 3).className}`}>
                          <NumberInput
                            min={0}
                            value={targetTKU.bln_lalu_yt ?? Math.trunc((targetTKU.bln_lalu ?? 0) * 0.02)}
                            onChange={(yt) => {
                              const yo = targetTKU.bln_lalu_yo ?? Math.trunc((targetTKU.bln_lalu ?? 0) * 0.85);
                              const om = targetTKU.bln_lalu_om ?? Math.trunc((targetTKU.bln_lalu ?? 0) * 0.08);
                              const os = targetTKU.bln_lalu_os ?? Math.trunc((targetTKU.bln_lalu ?? 0) * 0.05);
                              setTargetTKU({ ...targetTKU, bln_lalu_yt: yt, bln_lalu: yo + om + os + yt });
                            }}
                            className="p-1 w-full h-full text-xs bg-transparent outline-none border-none text-center text-slate-900 font-bold"
                          />
                        </td>
                        <td className="p-2.5 text-right font-black text-purple-600 text-sm">
                          {targetTKU.bln_lalu ?? 0} btl
                        </td>
                      </tr>

                      {/* Tahun Lalu TKU Row */}
                      <tr className="hover:bg-teal-50/50 transition-colors border-b border-slate-300">
                        <td className="p-2.5 font-black text-teal-700 uppercase text-[10px] border-r-2 border-slate-300 bg-slate-50/80">Tahun Lalu TKU</td>
                        <td {...getTkuCellProps(2, 0)} className={`p-1 text-center border-r border-slate-300 ${getTkuCellProps(2, 0).className}`}>
                          <NumberInput
                            min={0}
                            value={targetTKU.thn_lalu_yo ?? Math.trunc((targetTKU.thn_lalu ?? 0) * 0.85)}
                            onChange={(yo) => {
                              const om = targetTKU.thn_lalu_om ?? Math.trunc((targetTKU.thn_lalu ?? 0) * 0.08);
                              const os = targetTKU.thn_lalu_os ?? Math.trunc((targetTKU.thn_lalu ?? 0) * 0.05);
                              const yt = targetTKU.thn_lalu_yt ?? Math.trunc((targetTKU.thn_lalu ?? 0) * 0.02);
                              setTargetTKU({ ...targetTKU, thn_lalu_yo: yo, thn_lalu: yo + om + os + yt });
                            }}
                            className="p-1 w-full h-full text-xs bg-transparent outline-none border-none text-center text-slate-900 font-bold"
                          />
                        </td>
                        <td {...getTkuCellProps(2, 1)} className={`p-1 text-center border-r border-slate-300 ${getTkuCellProps(2, 1).className}`}>
                          <NumberInput
                            min={0}
                            value={targetTKU.thn_lalu_om ?? Math.trunc((targetTKU.thn_lalu ?? 0) * 0.08)}
                            onChange={(om) => {
                              const yo = targetTKU.thn_lalu_yo ?? Math.trunc((targetTKU.thn_lalu ?? 0) * 0.85);
                              const os = targetTKU.thn_lalu_os ?? Math.trunc((targetTKU.thn_lalu ?? 0) * 0.05);
                              const yt = targetTKU.thn_lalu_yt ?? Math.trunc((targetTKU.thn_lalu ?? 0) * 0.02);
                              setTargetTKU({ ...targetTKU, thn_lalu_om: om, thn_lalu: yo + om + os + yt });
                            }}
                            className="p-1 w-full h-full text-xs bg-transparent outline-none border-none text-center text-slate-900 font-bold"
                          />
                        </td>
                        <td {...getTkuCellProps(2, 2)} className={`p-1 text-center border-r border-slate-300 ${getTkuCellProps(2, 2).className}`}>
                          <NumberInput
                            min={0}
                            value={targetTKU.thn_lalu_os ?? Math.trunc((targetTKU.thn_lalu ?? 0) * 0.05)}
                            onChange={(os) => {
                              const yo = targetTKU.thn_lalu_yo ?? Math.trunc((targetTKU.thn_lalu ?? 0) * 0.85);
                              const om = targetTKU.thn_lalu_om ?? Math.trunc((targetTKU.thn_lalu ?? 0) * 0.08);
                              const yt = targetTKU.thn_lalu_yt ?? Math.trunc((targetTKU.thn_lalu ?? 0) * 0.02);
                              setTargetTKU({ ...targetTKU, thn_lalu_os: os, thn_lalu: yo + om + os + yt });
                            }}
                            className="p-1 w-full h-full text-xs bg-transparent outline-none border-none text-center text-slate-900 font-bold"
                          />
                        </td>
                        <td {...getTkuCellProps(2, 3)} className={`p-1 text-center border-r border-slate-300 ${getTkuCellProps(2, 3).className}`}>
                          <NumberInput
                            min={0}
                            value={targetTKU.thn_lalu_yt ?? Math.trunc((targetTKU.thn_lalu ?? 0) * 0.02)}
                            onChange={(yt) => {
                              const yo = targetTKU.thn_lalu_yo ?? Math.trunc((targetTKU.thn_lalu ?? 0) * 0.85);
                              const om = targetTKU.thn_lalu_om ?? Math.trunc((targetTKU.thn_lalu ?? 0) * 0.08);
                              const os = targetTKU.thn_lalu_os ?? Math.trunc((targetTKU.thn_lalu ?? 0) * 0.05);
                              setTargetTKU({ ...targetTKU, thn_lalu_yt: yt, thn_lalu: yo + om + os + yt });
                            }}
                            className="p-1 w-full h-full text-xs bg-transparent outline-none border-none text-center text-slate-900 font-bold"
                          />
                        </td>
                        <td className="p-2.5 text-right font-black text-teal-600 text-sm">
                          {targetTKU.thn_lalu ?? 0} btl
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 2. Target & Pembanding per Yakult Lady (Aktif) */}
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-l-4 border-red-600 pl-2">
                <div>
                  <h2 className="text-xs font-black text-red-950 uppercase tracking-wider">
                    🎯 Target & Pembanding per Yakult Lady (Aktif)
                  </h2>
                  <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
                    Input rincian Target, Bulan Lalu, dan Tahun Lalu untuk setiap YL aktif. Data ini otomatis tersinkronisasi ke akun YL masing-masing.
                  </p>
                </div>
                <span className="text-[10px] font-black bg-red-100 text-red-800 px-2.5 py-1 rounded-lg">
                  {activeYLsList.length} YL Aktif
                </span>
              </div>

              <p className="text-[9px] text-slate-400 font-bold -mt-1">
                💡 Tips: Klik/tap judul kolom atau nama YL untuk ngeblok seluruh kolom/baris, atau ketuk sel & tarik untuk ngeblok area (drag selection).
              </p>

              <div ref={targetGridContainerRef} className="relative">
                <GridSelectionToolbar
                  selection={targetGridSelection}
                  onCopy={handleTargetGridCopy}
                  onCut={handleTargetGridCut}
                  onPaste={handleTargetGridPaste}
                  onClear={handleTargetGridClear}
                  onClose={() => setTargetGridSelection(null)}
                />
                <div className="overflow-x-auto max-h-[480px] overflow-y-auto border-2 border-slate-400 rounded-xl bg-white shadow-sm">
                  <table className="w-full text-left text-xs sm:text-sm border-collapse font-mono select-none">
                    <thead>
                      <tr className="bg-slate-900 text-slate-100 font-black uppercase text-xs sticky top-0 z-10 border-b-2 border-slate-800 divide-x divide-slate-700">
                        <th className="p-3 border-r-2 border-slate-700 bg-slate-900 min-w-[150px]">Area & Nama YL</th>
                        <th
                          data-c={0}
                          className="p-3 text-center border-r border-slate-700 text-red-400 bg-slate-900 cursor-pointer hover:bg-slate-800 transition-colors select-none"
                          onClick={() => selectTargetColumn(0)}
                        >
                          Target (btl)
                        </th>
                        <th
                          data-c={1}
                          className="p-3 text-center border-r border-slate-700 text-purple-400 bg-slate-900 cursor-pointer hover:bg-slate-800 transition-colors select-none"
                          onClick={() => selectTargetColumn(1)}
                        >
                          Bln Lalu (btl)
                        </th>
                        <th
                          data-c={2}
                          className="p-3 text-center border-r border-slate-700 text-teal-400 bg-slate-900 cursor-pointer hover:bg-slate-800 transition-colors select-none"
                          onClick={() => selectTargetColumn(2)}
                        >
                          Thn Lalu (btl)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300 font-bold text-slate-900">
                      {activeYLsList.map((yl, idx) => (
                        <TargetManagerRow
                          key={idx}
                          yl={yl}
                          idx={idx}
                          targetYLMap={targetYLMap}
                          setTargetYLMap={setTargetYLMap}
                          getTargetCellProps={getTargetCellProps}
                          selectTargetRow={selectTargetRow}
                        />
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-900 text-white font-black text-xs sm:text-sm border-t-2 border-slate-800 divide-x divide-slate-700">
                        <td className="p-3 uppercase border-r-2 border-slate-700">TOTAL TIM (TKU)</td>
                        <td className="p-3 text-center text-red-400 font-mono text-sm sm:text-base border-r border-slate-700">
                          {activeYLsList.reduce((sum, y) => sum + (targetYLMap[y.area]?.target ?? 0), 0)} btl
                        </td>
                        <td className="p-3 text-center text-purple-400 font-mono text-sm sm:text-base border-r border-slate-700">
                          {activeYLsList.reduce((sum, y) => sum + (targetYLMap[y.area]?.bln_lalu ?? 0), 0)} btl
                        </td>
                        <td className="p-3 text-center text-teal-400 font-mono text-sm sm:text-base">
                          {activeYLsList.reduce((sum, y) => sum + (targetYLMap[y.area]?.thn_lalu ?? 0), 0)} btl
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Target & Kompensasi Action Removed */}
            </div>

            {/* 3. Aturan Kompensasi Tiers & Potongan Pajak (Di Bawahnya) */}
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3">
              <h2 className="text-xs font-black text-red-950 uppercase tracking-wider flex items-center gap-2 border-l-4 border-red-600 pl-2">
                💰 Aturan Kompensasi Tiers & Potongan Pajak
              </h2>
              <p className="text-[10px] text-slate-500 leading-relaxed font-bold">
                Penetapan nilai pengali kompensasi bulanan berdasarkan rata-rata harian (Step Lookup) dan besaran potongan wajib (PPh, JKK/JKM, JHT).
              </p>

              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-slate-200 font-bold uppercase text-[9px]">
                      <th className="p-2">Minimal Rata-Rata (btl/hr)</th>
                      <th className="p-2 text-right">Pengali Kompensasi (Rp)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-bold">
                    {(compConfig.tiers || []).map((t: any, idx: number) => (
                      <tr key={idx}>
                        <td className="p-2 text-slate-700 font-mono">
                          {t.threshold === 0 ? "< 200 btl" : `≥ ${t.threshold} btl/hr`}
                        </td>
                        <td className="p-2 text-right">
                          <NumberInput
                            min={0}
                            value={t.rate}
                            onChange={(val) => {
                              const copy = { ...compConfig };
                              copy.tiers[idx].rate = val;
                              setCompConfig(copy);
                            }}
                            className="p-1 text-xs bg-slate-50 border border-slate-200 rounded outline-none font-black text-right w-24 text-slate-900 font-mono"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Potongan Flat & Rate */}
              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <label className="text-[9px] font-bold text-slate-500 block mb-1">Tarif PPh (%)</label>
                  <NumberInput
                    min={0}
                    allowDecimal={true}
                    value={compConfig.pphRate}
                    onChange={(val) => setCompConfig({ ...compConfig, pphRate: val })}
                    className="p-2 bg-white border border-slate-200 rounded-lg text-xs font-black outline-none w-full text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-500 block mb-1">Iuran JKK/JKM (Rp)</label>
                  <NumberInput
                    min={0}
                    value={compConfig.jkkJkm}
                    onChange={(val) => setCompConfig({ ...compConfig, jkkJkm: val })}
                    className="p-2 bg-white border border-slate-200 rounded-lg text-xs font-black outline-none w-full text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-500 block mb-1">Iuran JHT (Rp)</label>
                  <NumberInput
                    min={0}
                    value={compConfig.jht}
                    onChange={(val) => setCompConfig({ ...compConfig, jht: val })}
                    className="p-2 bg-white border border-slate-200 rounded-lg text-xs font-black outline-none w-full text-slate-900 font-mono"
                  />
                </div>
              </div>

              <button
                onClick={handleSaveCompConfig}
                className="w-full bg-slate-900 hover:bg-slate-950 text-white font-black text-xs py-3 rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5"
              >
                💾 Simpan Aturan Kompensasi & Potongan Pajak
              </button>
              {compSavedMsg && (
                <p className="text-[10px] font-bold text-emerald-600 text-center animate-pulse">
                  {compSavedMsg}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Tab PLG & PJL */}
        {activeTab === "plg_pjl" && (
          <PlgPjlView ylList={ylList} motivasiConfig={motivasiConfig} theme={theme} />
        )}

        {/* ================= TAB 5: SETTING ================= */}
        {activeTab === "setting" && (
          <div className="space-y-4">
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
                    Hanya Bulan Ini ({selectedBreakdownMonth || "2026-07"})
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

            {/* PIN Ganti - Dropdown Layout */}
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
              <h2 className="text-xs font-black text-red-950 uppercase tracking-wider flex items-center gap-2 mb-3 border-l-4 border-red-600 pl-2">
                Ganti PIN Login (Dropdown Mode)
              </h2>
              <p className="text-[10px] text-slate-400 font-medium mb-3">
                Pilih pengguna melalui dropdown di bawah ini untuk mengubah atau memperbarui sandi login dengan aman.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Target Pengguna</label>
                  <select
                    value={pinTargetDropdown}
                    onChange={(e) => setPinTargetDropdown(e.target.value)}
                    className="w-full p-2.5 text-xs bg-slate-50 rounded-xl border border-slate-200 outline-none font-bold text-slate-900"
                  >
                    <option value="manager">Manager DP Jember 1</option>
                    {Object.keys(pinYLs || {}).map((pin) => (
                      <option key={pin} value={pin}>
                        {pinYLs[pin]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">PIN Sandi Baru (Maks 6 digit)</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={pinInputVal}
                    onChange={(e) => setPinInputVal(e.target.value.replace(/\D/g, ""))}
                    placeholder="Masukkan PIN baru"
                    className="w-full p-2.5 text-xs bg-slate-50 rounded-xl border border-slate-200 outline-none font-bold text-slate-900 placeholder:text-slate-400"
                  />
                </div>
                <button
                  onClick={handleSavePin}
                  className="w-full bg-slate-900 hover:bg-slate-950 text-white font-bold text-xs p-2.5 rounded-xl transition-all"
                >
                  Simpan PIN Baru
                </button>
                {pinSavedMsg && (
                  <p className="text-[10px] font-bold text-emerald-600 text-center animate-pulse">PIN Berhasil Disimpan!</p>
                )}
              </div>
            </div>

            {/* Catatan Perhatian Manager (Attention) */}
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
              <h2 className="text-xs font-black text-amber-950 uppercase tracking-wider flex items-center gap-2 mb-3 border-l-4 border-amber-500 pl-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                Catatan Perhatian Manager (Attention Note per Area YL)
              </h2>
              <p className="text-[10px] text-slate-500 mb-3">
                Pesan perhatian khusus ini akan langsung muncul di halaman utama YL yang bersangkutan sebagai arahan khusus harian dari Manager.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Pilih Lady YK (Area)</label>
                  <select
                    value={attentionArea}
                    onChange={(e) => {
                      const a = e.target.value;
                      setAttentionArea(a);
                      setAttentionText(attentionMap[a] || "");
                    }}
                    className="w-full p-2.5 text-xs bg-slate-50 rounded-xl border border-slate-200 outline-none font-bold text-slate-900"
                  >
                    {(ylList && ylList.length > 0 ? ylList : names.map(n => ({ area: n.substring(0, 3), nama: n }))).map((yl: any) => (
                      <option key={yl.area} value={yl.area}>
                        Area {yl.area} - {yl.nama}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Isi Pesan Perhatian Khusus</label>
                  <textarea
                    value={attentionText}
                    onChange={(e) => setAttentionText(e.target.value)}
                    rows={3}
                    placeholder="Contoh: Fokuskan pembukaan pelanggan baru di rute pasar pagi dan pastikan Balik Botol tidak melebihi 10 btl."
                    className="w-full p-2.5 text-xs bg-slate-50 rounded-xl border border-slate-200 outline-none text-slate-900 resize-none font-bold placeholder:text-slate-400"
                  />
                </div>
                <button
                  onClick={handleSaveAttention}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs p-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  Simpan Catatan Perhatian Area {attentionArea}
                </button>
                {attentionSavedMsg && (
                  <p className="text-[10px] font-bold text-emerald-600 text-center animate-pulse">Catatan Perhatian Berhasil Disimpan!</p>
                )}
              </div>
            </div>

            {/* Pengaturan Nama Chatbot AI */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 border-l-4 border-indigo-600 pl-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                Pengaturan Nama Chatbot AI
              </h2>
              <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                Kustomisasi nama panggil asisten AI kecerdasan buatan yang muncul pada header obrolan dan tombol utama.
              </p>
              <div className="space-y-2">
                <label className="text-[9px] font-bold text-slate-400 uppercase block">Nama Chatbot AI</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatbotNameInput}
                    onChange={(e) => setChatbotNameInput(e.target.value)}
                    placeholder="Contoh: AI Jember 1 Pro / Ibu Supervisor AI"
                    className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-indigo-500 placeholder:text-slate-400"
                  />
                  <button
                    onClick={() => {
                      const newName = chatbotNameInput.trim() || "AI Jember 1 Pro";
                      onUpdateMotivasi({ ...motivasiConfig, chatbotName: newName });
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
                  >
                    💾 Simpan Nama
                  </button>
                </div>
              </div>
            </div>

            {/* Pengaturan Nama TKU / Unit (Header System) */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 border-l-4 border-red-600 pl-2">
                <Building2 className="w-4 h-4 text-red-600" />
                Pengaturan Nama TKU / Unit (Header)
              </h2>
              <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                Kustomisasi nama TKU / Unit (misal: DP Jember 1, Unit Banyuwangi 1, dsb) yang tampil pada header utama aplikasi.
              </p>
              <div className="space-y-2">
                <label className="text-[9px] font-bold text-slate-400 uppercase block">Nama TKU (Header System)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tkuNameInput}
                    onChange={(e) => setTkuNameInput(e.target.value)}
                    placeholder="Contoh: DP Jember 1 / Unit Banyuwangi"
                    className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-red-500 placeholder:text-slate-400"
                  />
                  <button
                    onClick={() => {
                      const newName = tkuNameInput.trim() || "DP Jember 1";
                      onUpdateMotivasi({ ...motivasiConfig, tkuName: newName });
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white font-black text-xs px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
                  >
                    💾 Simpan TKU
                  </button>
                </div>
              </div>
            </div>

            {/* Standalone Local Database Status */}
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3">
              <h2 className="text-xs font-black text-red-950 uppercase tracking-wider flex items-center gap-2 border-l-4 border-red-600 pl-2">
                <FileSpreadsheet className="w-4 h-4 text-red-600" />
                Penyimpanan Database Server Lokal (Standalone)
              </h2>
              <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                Seluruh data transaksi, PIN login, target bulanan, kontes, dan motivasi tersimpan secara otomatis di server lokal aplikasi ini.
              </p>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <p className="font-extrabold text-slate-800">Status Database</p>
                  <p className="text-[10px] text-emerald-600 font-bold mt-0.5">● Terhubung & Aktif (Local JSON Storage)</p>
                </div>
                <button
                  onClick={onRefresh}
                  className="bg-slate-900 hover:bg-slate-950 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg transition-all"
                >
                  Refresh Data
                </button>
              </div>
            </div>

            {/* Google Sheets API SCRIPT_URL Setup & GS Code Generator */}
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3">
              <h2 className="text-xs font-black text-red-950 uppercase tracking-wider flex items-center gap-2 border-l-4 border-red-600 pl-2">
                <FileSpreadsheet className="w-4 h-4 text-red-600" />
                Integrasi Apps Script (Kode .gs Spreadsheet)
              </h2>
              <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                Salin kode Google Apps Script berikut dan tempelkan ke menu <b>Ekstensi &gt; Apps Script</b> di Google Sheets Anda untuk menghubungkan data spreadsheet secara langsung.
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowGsCode(!showGsCode)}
                  className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 font-black text-xs py-2.5 rounded-xl border border-red-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {showGsCode ? "🙈 Sembunyikan Kode GS" : "📜 Lihat Kode Apps Script (Code.gs)"}
                </button>

                <button
                  onClick={() => {
                    const blob = new Blob([APPS_SCRIPT_CODE], { type: "text/plain;charset=utf-8" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "Code.gs";
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-3 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Unduh file Code.gs ke komputer"
                >
                  📥 Download Code.gs
                </button>
              </div>

              {showGsCode && (
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">File: Code.gs (Versi Baru)</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(APPS_SCRIPT_CODE);
                        setCopiedGsCode(true);
                        setTimeout(() => setCopiedGsCode(false), 2000);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-3 py-1 rounded-lg transition-all cursor-pointer"
                    >
                      {copiedGsCode ? "✓ Kode Berhasil Disalin!" : "📋 Salin Seluruh Kode GS"}
                    </button>
                  </div>
                  <textarea
                    readOnly
                    rows={14}
                    className="w-full p-2.5 bg-slate-900 text-slate-100 font-mono text-[10px] rounded-xl outline-none leading-relaxed"
                    value={APPS_SCRIPT_CODE}
                  />
                </div>
              )}

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Web App URL Hasil Deploy (Opsional)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={scriptUrlInput}
                    onChange={(e) => setScriptUrlInput(e.target.value)}
                    placeholder="https://script.google.com/macros/s/..."
                    className="flex-1 p-2 text-xs bg-slate-50 rounded-xl border border-slate-200 outline-none font-bold text-slate-900 placeholder:text-slate-400"
                  />
                  <button
                    onClick={() => onSaveScriptUrl(scriptUrlInput)}
                    className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-3 py-2 rounded-xl transition-all cursor-pointer"
                  >
                    Simpan URL
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
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
                  className="text-slate-400 hover:text-slate-600 font-bold text-lg"
                >
                  ✕
                </button>
              </div>

              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-900 text-xs space-y-2">
                <p><strong>Cakupan:</strong> <span className="font-mono font-bold text-rose-950">{resetScope === "all" ? "SEMUA RIWAYAT (Semua Bulan)" : `HANYA BULAN INI (${selectedBreakdownMonth || "2026-07"})`}</span></p>
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
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 rounded-xl transition-all"
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
        {/* Modal Konfirmasi Hapus YL Permanen */}
        {ylToDelete && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl border border-rose-200">
              <div className="flex items-center justify-between border-b border-rose-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-black shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-rose-950 uppercase">Hapus Yakult Lady Permanen</h3>
                    <p className="text-[10px] text-rose-600 font-bold">Konfirmasi Hapus Data YL</p>
                  </div>
                </div>
                <button
                  onClick={() => setYlToDelete(null)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer p-1"
                >
                  ✕
                </button>
              </div>

              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-950 text-xs space-y-2">
                <p className="font-medium">
                  Apakah Anda yakin ingin menghapus Yakult Lady ini secara <span className="font-black text-rose-600 uppercase">PERMANEN</span>?
                </p>
                <div className="bg-white p-2.5 rounded-lg border border-rose-200 font-mono text-xs space-y-1">
                  <p><span className="text-slate-500 font-sans font-bold">Nama YL:</span> <strong className="text-slate-900 font-black">{ylToDelete.yl.nama}</strong></p>
                  <p><span className="text-slate-500 font-sans font-bold">Area YL:</span> <strong className="text-red-600 font-black">{ylToDelete.yl.area}</strong></p>
                  <p><span className="text-slate-500 font-sans font-bold">PIN Login:</span> <strong className="text-slate-800 font-bold">{ylToDelete.yl.pin}</strong></p>
                </div>
                <p className="text-[10px] text-rose-700 font-bold leading-relaxed">
                  ⚠️ Yakult Lady ini akan langsung dihapus dari sistem, PIN login dinonaktifkan, dan target YL terkait akan dibersihkan.
                </p>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setYlToDelete(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={confirmDeleteYl}
                  disabled={isDeletingYl}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs py-2.5 rounded-xl transition-all cursor-pointer shadow flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isDeletingYl ? "Menghapus..." : "Ya, Hapus Permanen"}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modern Bottom Navigation with Scrollable Support for All Menus */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-slate-950 border-t border-red-900/80 flex justify-between items-center z-50 text-white px-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`flex flex-col items-center justify-center gap-1 min-w-[56px] flex-1 h-full text-[10px] font-bold transition-all ${activeTab === "dashboard" ? "text-red-400 scale-105" : "text-slate-400 hover:text-white"}`}
        >
          <TrendingUp className="w-5 h-5" />
          <span>Dasbor</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("lhpp_realisasi");
            
          }}
          className={`flex flex-col items-center justify-center gap-1 min-w-[56px] flex-1 h-full text-[10px] font-bold transition-all ${(activeTab === "input_realisasi" || activeTab === "lhpp_realisasi") ? "text-emerald-400 font-extrabold scale-105" : "text-slate-400 hover:text-white"}`}
        >
          <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
          <span>Input PJL</span>
        </button>

        <button
          onClick={() => setActiveTab("breakdown")}
          className={`flex flex-col items-center justify-center gap-1 min-w-[56px] flex-1 h-full text-[10px] font-bold transition-all ${activeTab === "breakdown" ? "text-red-400 scale-105" : "text-slate-400 hover:text-white"}`}
        >
          <Grid3X3 className="w-5 h-5" />
          <span>BD & Realisasi</span>
        </button>

        <button
          onClick={() => setActiveTab("target_kompensasi")}
          className={`flex flex-col items-center justify-center gap-1 min-w-[56px] flex-1 h-full text-[10px] font-bold transition-all ${activeTab === "target_kompensasi" ? "text-red-400 scale-105" : "text-slate-400 hover:text-white"}`}
        >
          <Target className="w-5 h-5" />
          <span>Target</span>
        </button>

        <button
          onClick={() => setActiveTab("evaluasi")}
          className={`flex flex-col items-center justify-center gap-1 min-w-[56px] flex-1 h-full text-[10px] font-bold transition-all ${activeTab === "evaluasi" ? "text-red-400 scale-105" : "text-slate-400 hover:text-white"}`}
        >
          <Award className="w-5 h-5" />
          <span>Evaluasi</span>
        </button>

        <button
          onClick={() => setActiveTab("plg_pjl")}
          className={`flex flex-col items-center justify-center gap-1 min-w-[56px] flex-1 h-full text-[10px] font-bold transition-all ${activeTab === "plg_pjl" ? "text-red-400 scale-105" : "text-slate-400 hover:text-white"}`}
        >
          <PieChart className="w-5 h-5 text-cyan-400" />
          <span className="truncate w-full text-center px-1">Pelanggan & Penjualan</span>
        </button>

        <button
          onClick={() => setActiveTab("lady")}
          className={`flex flex-col items-center justify-center gap-1 min-w-[56px] flex-1 h-full text-[10px] font-bold transition-all ${activeTab === "lady" ? "text-red-400 scale-105" : "text-slate-400 hover:text-white"}`}
        >
          <Users className="w-5 h-5" />
          <span>Profil YL</span>
        </button>

        

        <button
          onClick={() => setActiveTab("setting")}
          className={`flex flex-col items-center justify-center gap-1 min-w-[56px] flex-1 h-full text-[10px] font-bold transition-all ${activeTab === "setting" ? "text-red-400 scale-105" : "text-slate-400 hover:text-white"}`}
        >
          <Settings className="w-5 h-5" />
          <span>Setting</span>
        </button>
      {/* Mobile Paste Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 uppercase flex items-center gap-2">
                <span>📥 Tempel Data Clipboard ke Tabel (HP)</span>
              </h3>
              <button
                onClick={() => setShowPasteModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer p-1"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tempelkan (paste) teks/tabel dari Excel, Google Sheets, atau hasil copy di bawah ini, lalu klik tombol <strong>Tempelkan ke Sel Diblok</strong>.
            </p>
            <textarea
              value={pasteInputText}
              onChange={(e) => setPasteInputText(e.target.value)}
              placeholder="Tempelkan data di sini (Tab separated / angka per baris)..."
              rows={6}
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowPasteModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  if (pasteInputText.trim()) {
                    handlePasteIntoGrid(pasteInputText);
                    setPasteInputText("");
                    setShowPasteModal(false);
                  }
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow cursor-pointer"
              >
                📥 Tempelkan ke Sel Diblok
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Copy Result Modal Fallback */}
      {showCopyResultModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 uppercase flex items-center gap-2">
                <span>📋 Hasil Salin Data Sel (HP)</span>
              </h3>
              <button
                onClick={() => setShowCopyResultModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer p-1"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Sel-sel terpilih berhasil dirangkum. Tekan dan tahan pada teks di bawah ini untuk menyalin secara manual ke aplikasi lain:
            </p>
            <textarea
              value={copiedText}
              readOnly
              onFocus={(e) => e.target.select()}
              rows={6}
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText(copiedText);
                  }
                  setShowCopyResultModal(false);
                  setBreakdownMsg("📋 Berhasil disalin!");
                  setTimeout(() => setBreakdownMsg(""), 3000);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow cursor-pointer"
              >
                📋 Salin Semua Teks
              </button>
            </div>
          </div>
        </div>
      )}

      </nav>
    </div>
  );
}

// Utility functions
function currentMonthTotal(perYL: Record<string, any>, key: "yo" | "om" | "os" | "yt") {
  return Object.values(perYL).reduce((sum, yl) => {
    return sum + (yl[key] || 0);
  }, 0);
}

function calculateSektorTotals(dashboard: DashboardData | null) {
  const s = dashboard?.sektorTim || { rumah: 0, pasar: 0, sekolah: 0, kantor: 0, toko: 0, ib: 0 };
  return [
    { name: "Rumah", value: s.rumah || 0, color: "#eab308" },
    { name: "Pasar", value: s.pasar || 0, color: "#ec4899" },
    { name: "Sekolah", value: s.sekolah || 0, color: "#3b82f6" },
    { name: "Kantor", value: s.kantor || 0, color: "#86efac" },
    { name: "Toko", value: s.toko || 0, color: "#dc2626" },
    { name: "IB", value: s.ib || 0, color: "#94a3b8" }
  ];
}
