import { ClipboardFallbackModal } from "./ClipboardFallbackModal";
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { MotivasiConfig, cleanYlName } from "../types";
import { useSimpleGrid } from "./useSimpleGrid";
import { GridSelectionToolbar } from "./GridSelectionToolbar";
import { NumberInput } from "./NumberInput";
import { safeFetchJson } from "../lib/safeFetch";
import {
  FileSpreadsheet,
  Copy,
  Printer,
  Calendar,
  ShieldCheck,
  Undo2,
  Redo2,
  Save,
  Loader2
} from "lucide-react";

export interface LhppRow {
  area: string;
  nama: string;
  pdmSebelum: { yo: number; om: number; os: number; yt: number };
  bb: { yo: number; om: number; os: number; yt: number };
  setoran: { setor: number; bank1?: number; bank2?: number };
  pdmHariIni: { yo: number; om: number; os: number; yt: number };
}

export interface LhppYlmSummary {
  pdmYlm: { yo: number; om: number; os: number; yt: number };
  sisaYlm?: { yo: number; om: number; os: number; yt: number };
  botolRusak?: number;
}

interface LhppRealisasiViewProps {
  ylList: Array<{ area: string; nama: string; status?: string }>;
  selectedMonth?: string; // e.g. "2026-07"
  breakdownPlanMap?: Record<string, { days: Record<string, { yo: number; om: number; os: number; yt: number }> }>;
  breakdownRealisasiMap?: Record<string, { days: Record<string, { yo: number; om: number; os: number; yt: number }> }>;
  onSaveLhpp?: (data: { date: string; rows: LhppRow[]; summary: LhppYlmSummary }) => Promise<void>;
  motivasiConfig?: MotivasiConfig;
  theme?: "light" | "dark";
}

const parseInputInt = (val: string | number): number => {
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
  const cleaned = strVal.replace(/^-?0+(?=\d)/, strVal.startsWith("-") ? "-" : "");
  const num = parseInt(cleaned.replace(/[^0-9-]/g, ""), 10);
  return isNaN(num) ? 0 : num;
};

function LhppRealisasiViewInner({
  ylList,
  selectedMonth = "2026-07",
}: LhppRealisasiViewProps) {
  // 1. Tanggal berjalan: Default = Tanggal Hari Ini (device / server time)
  const [selectedDay, setSelectedDay] = useState<number>(() => {
    const today = new Date().getDate();
    return today >= 1 && today <= 31 ? today : 1;
  });

  const [rows, setRows] = useState<LhppRow[]>([]);
  const [summary, setSummary] = useState<LhppYlmSummary>({
    pdmYlm: { yo: 0, om: 0, os: 0, yt: 0 },
    sisaYlm: { yo: 0, om: 0, os: 0, yt: 0 },
    botolRusak: 0
  });
  const [msg, setMsg] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Fetch data from server when date or month changes
  const loadDataFromServer = useCallback(async (month: string, day: number) => {
    setIsLoading(true);
    try {
      const res = await safeFetchJson<any>(`/api/getLhppPdm?month=${month}&day=${day}`);
      if (res && res.ok) {
        const summaryData: LhppYlmSummary = {
          pdmYlm: res.pdmYlm || { yo: 0, om: 0, os: 0, yt: 0 },
          sisaYlm: { yo: 0, om: 0, os: 0, yt: 0 },
          botolRusak: 0
        };

        const activeYls = (ylList || []).filter((y: any) => y.status !== "Resign" && y.area !== "TKU");
        const rowsData = res.rowsData || {};
        const prevPdmMap = res.prevPdmMap || {};

        const newRows: LhppRow[] = activeYls.map((yl: any) => {
          const cleanName = cleanYlName(yl.nama || "");
          const savedYlData = rowsData[yl.area] || rowsData[cleanName] || rowsData[yl.nama] || null;

          // PDM Sebelum (PDM YL) diambil otomatis dari PDM Hari Ini tanggal sebelumnya
          const prevPdm = prevPdmMap[yl.area] || prevPdmMap[cleanName] || prevPdmMap[yl.nama] || { yo: 0, om: 0, os: 0, yt: 0 };
          const hasSavedPdmSebelum = savedYlData?.pdmSebelum && (savedYlData.pdmSebelum.yo > 0 || savedYlData.pdmSebelum.om > 0 || savedYlData.pdmSebelum.os > 0 || savedYlData.pdmSebelum.yt > 0);

          return {
            area: yl.area,
            nama: yl.nama,
            pdmSebelum: hasSavedPdmSebelum ? { ...savedYlData.pdmSebelum } : { ...prevPdm },
            bb: savedYlData?.bb ? { ...savedYlData.bb } : { yo: 0, om: 0, os: 0, yt: 0 },
            setoran: { setor: 0, bank1: 0, bank2: 0 },
            pdmHariIni: savedYlData?.pdmHariIni ? { ...savedYlData.pdmHariIni } : { yo: 0, om: 0, os: 0, yt: 0 }
          };
        });

        setRows(newRows);
        setSummary(summaryData);
        setUndoStack([]);
        setRedoStack([]);
      }
    } catch (err) {
      console.error("Error loading LHPP data from server:", err);
    } finally {
      setIsLoading(false);
    }
  }, [ylList]);

  useEffect(() => {
    loadDataFromServer(selectedMonth, selectedDay);
  }, [selectedMonth, selectedDay, loadDataFromServer]);

  // Undo / Redo Stacks (Draft mode in memory)
  const [undoStack, setUndoStack] = useState<Array<{ rows: LhppRow[]; summary: LhppYlmSummary }>>([]);
  const [redoStack, setRedoStack] = useState<Array<{ rows: LhppRow[]; summary: LhppYlmSummary }>>([]);

  const isDirtyRef = useRef(false);

  const recordHistory = useCallback(() => {
    isDirtyRef.current = true;
    setUndoStack(u => [...u.slice(-19), JSON.parse(JSON.stringify({ rows, summary }))]);
    setRedoStack([]);
  }, [rows, summary]);

  const handlePdmYlmChange = (field: "yo" | "om" | "os" | "yt", val: number) => {
    recordHistory();
    setSummary(s => ({ ...s, pdmYlm: { ...s.pdmYlm, [field]: val } }));
  };

  const handleCellChange = (
    rIdx: number,
    section: "bb" | "pdmHariIni",
    field: "yo" | "om" | "os" | "yt",
    val: number
  ) => {
    recordHistory();
    const cleanVal = parseInputInt(val);
    setRows(prev => {
      const next = [...prev];
      const targetRow = { ...next[rIdx] };
      if (section === "bb" || section === "pdmHariIni") {
        targetRow[section] = {
          ...targetRow[section],
          [field]: cleanVal
        };
      }
      next[rIdx] = targetRow;
      return next;
    });
  };

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const last = undoStack[undoStack.length - 1];
    setUndoStack(u => u.slice(0, u.length - 1));
    setRedoStack(r => [...r, JSON.parse(JSON.stringify({ rows, summary }))]);
    setRows(JSON.parse(JSON.stringify(last.rows)));
    setSummary(JSON.parse(JSON.stringify(last.summary)));
    setMsg("↩️ Undone edit terakhir!");
    setTimeout(() => setMsg(""), 2000);
  }, [undoStack, rows, summary]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack(r => r.slice(0, r.length - 1));
    setUndoStack(u => [...u, JSON.parse(JSON.stringify({ rows, summary }))]);
    setRows(JSON.parse(JSON.stringify(next.rows)));
    setSummary(JSON.parse(JSON.stringify(next.summary)));
    setMsg("↪️ Redone edit!");
    setTimeout(() => setMsg(""), 2000);
  }, [redoStack, rows, summary]);

  // Calculations for each row
  const computedRows = useMemo(() => {
    return rows.map(r => {
      const terjual = {
        yo: Math.max(0, r.pdmSebelum.yo - r.bb.yo),
        om: Math.max(0, r.pdmSebelum.om - r.bb.om),
        os: Math.max(0, r.pdmSebelum.os - r.bb.os),
        yt: Math.max(0, r.pdmSebelum.yt - r.bb.yt)
      };

      const totalSetoran = (terjual.yo * 2040) + (terjual.om * 2130) + (terjual.os * 2130) + (terjual.yt * 2460);

      const turun = {
        yo: Math.max(0, r.pdmHariIni.yo - r.bb.yo),
        om: Math.max(0, r.pdmHariIni.om - r.bb.om),
        os: Math.max(0, r.pdmHariIni.os - r.bb.os),
        yt: Math.max(0, r.pdmHariIni.yt - r.bb.yt)
      };

      return {
        ...r,
        terjual,
        totalSetoran,
        turun
      };
    });
  }, [rows]);

  // Main Table Column Totals
  const totals = useMemo(() => {
    const init = {
      pdmSebelum: { yo: 0, om: 0, os: 0, yt: 0, sum: 0 },
      bb: { yo: 0, om: 0, os: 0, yt: 0, sum: 0 },
      terjual: { yo: 0, om: 0, os: 0, yt: 0, sum: 0 },
      setoran: { setor: 0, sum: 0 },
      pdmHariIni: { yo: 0, om: 0, os: 0, yt: 0, sum: 0 },
      turun: { yo: 0, om: 0, os: 0, yt: 0, sum: 0 }
    };

    computedRows.forEach(r => {
      init.pdmSebelum.yo += r.pdmSebelum.yo;
      init.pdmSebelum.om += r.pdmSebelum.om;
      init.pdmSebelum.os += r.pdmSebelum.os;
      init.pdmSebelum.yt += r.pdmSebelum.yt;

      init.bb.yo += r.bb.yo;
      init.bb.om += r.bb.om;
      init.bb.os += r.bb.os;
      init.bb.yt += r.bb.yt;

      init.terjual.yo += r.terjual.yo;
      init.terjual.om += r.terjual.om;
      init.terjual.os += r.terjual.os;
      init.terjual.yt += r.terjual.yt;

      init.setoran.setor += r.totalSetoran;

      init.pdmHariIni.yo += r.pdmHariIni.yo;
      init.pdmHariIni.om += r.pdmHariIni.om;
      init.pdmHariIni.os += r.pdmHariIni.os;
      init.pdmHariIni.yt += r.pdmHariIni.yt;

      init.turun.yo += r.turun.yo;
      init.turun.om += r.turun.om;
      init.turun.os += r.turun.os;
      init.turun.yt += r.turun.yt;
    });

    init.pdmSebelum.sum = init.pdmSebelum.yo + init.pdmSebelum.om + init.pdmSebelum.os + init.pdmSebelum.yt;
    init.bb.sum = init.bb.yo + init.bb.om + init.bb.os + init.bb.yt;
    init.terjual.sum = init.terjual.yo + init.terjual.om + init.terjual.os + init.terjual.yt;
    init.setoran.sum = init.setoran.setor;
    init.pdmHariIni.sum = init.pdmHariIni.yo + init.pdmHariIni.om + init.pdmHariIni.os + init.pdmHariIni.yt;
    init.turun.sum = init.turun.yo + init.turun.om + init.turun.os + init.turun.yt;

    return init;
  }, [computedRows]);

  // SISA YLM Calculations: PDM YLM - Total Turun
  const sisaYlm = useMemo(() => {
    const yo = summary.pdmYlm.yo - totals.turun.yo;
    const om = summary.pdmYlm.om - totals.turun.om;
    const os = summary.pdmYlm.os - totals.turun.os;
    const yt = summary.pdmYlm.yt - totals.turun.yt;
    const total = yo + om + os + yt;
    return { yo, om, os, yt, total };
  }, [summary.pdmYlm, totals.turun]);

  // Auto-save Effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isDirtyRef.current && rows.length > 0) {
        handleSaveLhpp(true);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [rows, summary, selectedDay, selectedMonth]);

  // Save Handler: Save PDM to server & patch Realisasi db.transactions
  const handleSaveLhpp = async (isAutoSave = false) => {
    if (isSaving || (!isAutoSave && !isDirtyRef.current)) return;
    setIsSaving(true);
    if (!isAutoSave) setMsg("⏳ Menyimpan data LHPP & memperbarui Realisasi...");

    try {
      const formattedDate = `${selectedMonth}-${String(selectedDay).padStart(2, "0")}`;
      const payload = {
        month: selectedMonth,
        day: selectedDay,
        tanggal: formattedDate,
        summary,
        rows: computedRows.map(r => ({
          area: r.area,
          nama: r.nama,
          pdmSebelum: r.pdmSebelum,
          bb: r.bb,
          pdmHariIni: r.pdmHariIni,
          terjual: r.terjual
        }))
      };

      const res = await safeFetchJson<{ ok: boolean; message?: string; error?: string }>("/api/saveLhppPdm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res && res.ok) {
        isDirtyRef.current = false;
        if (!isAutoSave) {
          setMsg("✅ Data LHPP tersimpan & tersambung ke Realisasi");
          setTimeout(() => setMsg(""), 4000);
        }
        window.dispatchEvent(new Event("lhpp_saved"));
      } else {
        if (!isAutoSave) setMsg(`⚠️ ${res?.error || "Gagal menyimpan data LHPP ke server."}`);
      }
    } catch (err: any) {
      console.error("Failed to save LHPP:", err);
      if (!isAutoSave) setMsg("❌ Gagal menyimpan data LHPP. Periksa koneksi jaringan.");
    } finally {
      setIsSaving(false);
    }
  };

  // Spreadsheet Grid Integration
  const gridContainerRef = useRef<HTMLDivElement>(null);

  const isLhppCellEditable = useCallback((r: number, c: number) => {
    if (r >= computedRows.length) return false;
    if (computedRows[r]?.area === "TKU") return false;
    if (c >= 0 && c <= 3) return false; // PDM Sebelum is READ-ONLY
    if (c >= 8 && c <= 11) return false; // Terjual read-only
    if (c === 12) return false; // Setoran read-only
    if (c >= 17 && c <= 20) return false; // Turun read-only
    return true;
  }, [computedRows]);

  const getLhppCellValue = useCallback((r: number, c: number) => {
    const row = computedRows[r];
    if (!row) return 0;
    if (c >= 0 && c <= 3) {
      const fields = ["yo", "om", "os", "yt"] as const;
      return row.pdmSebelum[fields[c]] || 0;
    }
    if (c >= 4 && c <= 7) {
      const fields = ["yo", "om", "os", "yt"] as const;
      return row.bb[fields[c - 4]] || 0;
    }
    if (c >= 8 && c <= 11) {
      const fields = ["yo", "om", "os", "yt"] as const;
      return row.terjual[fields[c - 8]] || 0;
    }
    if (c === 12) {
      return row.totalSetoran || 0;
    }
    if (c >= 13 && c <= 16) {
      const fields = ["yo", "om", "os", "yt"] as const;
      return row.pdmHariIni[fields[c - 13]] || 0;
    }
    if (c >= 17 && c <= 20) {
      const fields = ["yo", "om", "os", "yt"] as const;
      return row.turun[fields[c - 17]] || 0;
    }
    return 0;
  }, [computedRows]);

  const setLhppBatchCellValues = useCallback((updates: { r: number; c: number; val: number | string }[]) => {
    recordHistory();
    setRows(prevRows => {
      const nextRows = JSON.parse(JSON.stringify(prevRows));
      updates.forEach(({ r, c, val }) => {
        if (!isLhppCellEditable(r, c)) return;
        const numVal = parseInputInt(val);
        const row = nextRows[r];
        if (!row) return;

        if (c >= 4 && c <= 7) {
          const fields = ["yo", "om", "os", "yt"] as const;
          row.bb[fields[c - 4]] = numVal;
        } else if (c >= 13 && c <= 16) {
          const fields = ["yo", "om", "os", "yt"] as const;
          row.pdmHariIni[fields[c - 13]] = numVal;
        }
      });
      return nextRows;
    });
  }, [isLhppCellEditable, recordHistory]);

  const {
    selection,
    setSelection,
    isMenuOpen,
    setIsMenuOpen,
    menuPos,
    getCellProps,
    selectColumn,
    selectRow,
    handleCopy,
    handleCut,
    handlePaste,
    handleClear,
    clipboardModal,
    confirmManualPaste,
    closeClipboardModal,
  } = useSimpleGrid({
    totalRows: computedRows.length,
    totalCols: 21,
    isCellEditable: isLhppCellEditable,
    getCellValue: getLhppCellValue,
    setBatchCellValues: setLhppBatchCellValues,
    onRecordUndo: recordHistory
  });

  // Dedicated paste handler for PDM YLM inputs
  const handlePdmYlmPaste = (e: React.ClipboardEvent, startField: "yo" | "om" | "os" | "yt") => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    if (!text) return;
    const clean = text.trim();
    const tokens = clean.split(/[\t\n\r,;\s]+/).map(t => parseInputInt(t));
    if (tokens.length === 0) return;
    const fields: ("yo" | "om" | "os" | "yt")[] = ["yo", "om", "os", "yt"];
    const startIdx = fields.indexOf(startField);

    recordHistory();
    setSummary(s => {
      const nextYlm = { ...s.pdmYlm };
      tokens.forEach((val, i) => {
        const fieldIdx = startIdx + i;
        if (fieldIdx < fields.length) {
          nextYlm[fields[fieldIdx]] = val;
        }
      });
      return { ...s, pdmYlm: nextYlm };
    });
  };

  // Dedicated paste handler for grid inputs
  const handleCellPaste = (e: React.ClipboardEvent, rIdx: number, cIdx: number) => {
    const text = e.clipboardData.getData("text/plain");
    if (!text) return;
    const clean = text.trim();
    if (/[\t\n\r,;/|\s]/.test(clean) || clean.length > 0) {
      e.preventDefault();
      const newSelection = { startR: rIdx, startC: cIdx, endR: rIdx, endC: cIdx };
      setSelection(newSelection);
      setTimeout(() => {
        handlePaste(text, newSelection);
      }, 0);
    }
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        if (targetTag !== "input" && targetTag !== "textarea") {
          if (e.shiftKey) {
            e.preventDefault();
            handleRedo();
          } else {
            e.preventDefault();
            handleUndo();
          }
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        if (targetTag !== "input" && targetTag !== "textarea") {
          e.preventDefault();
          handleRedo();
        }
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (targetTag !== "input" && targetTag !== "textarea") {
          e.preventDefault();
          if (selection) handleClear();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
        if (targetTag !== "input" && targetTag !== "textarea") {
          if (selection) {
             handleCopy();
          }
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v") {
        if (targetTag !== "input" && targetTag !== "textarea") {
          navigator.clipboard.readText().then(text => {
            handlePaste(text);
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
          handlePaste(text);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("paste", handleWindowPaste);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("paste", handleWindowPaste);
    };
  }, [handleUndo, handleRedo, selection, handleCopy, handlePaste, handleClear]);

  const totalPdmYlm = summary.pdmYlm.yo + summary.pdmYlm.om + summary.pdmYlm.os + summary.pdmYlm.yt;

  // Copy Summary text for WhatsApp or Sheets
  const handleCopyText = () => {
    let t = `*LHPP & LPPBJ - REKAP REALISASI TANGGAL ${selectedDay} (${selectedMonth})*\n\n`;
    t += `*PDM YLM (KANTOR)*: ${totalPdmYlm} btl (YO:${summary.pdmYlm.yo}, OM:${summary.pdmYlm.om}, OS:${summary.pdmYlm.os}, YT:${summary.pdmYlm.yt})\n`;
    t += `*TOTAL TURUN PDM*: ${totals.turun.sum} btl\n`;
    t += `*SISA YLM (KEMBALI)*: ${sisaYlm.total} btl (YO:${sisaYlm.yo}, OM:${sisaYlm.om}, OS:${sisaYlm.os}, YT:${sisaYlm.yt})\n\n`;
    t += `*RINGKASAN TOTAL TIM*:\n`;
    t += `• Total PDM Sebelum : ${totals.pdmSebelum.sum} btl\n`;
    t += `• Total BB (Retur)  : ${totals.bb.sum} btl\n`;
    t += `• Total Terjual     : ${totals.terjual.sum} btl\n`;
    t += `• Total Setoran Rp  : Rp ${totals.setoran.sum.toLocaleString("id-ID")}\n`;
    t += `• Total PDM Hari Ini: ${totals.pdmHariIni.sum} btl\n`;
    t += `• Total Turun PDM   : ${totals.turun.sum} btl\n`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(t);
      setMsg("📋 Ringkasan LHPP & LPPBJ berhasil disalin ke clipboard!");
      setTimeout(() => setMsg(""), 3000);
    }
  };

  return (
    <div className="space-y-4 font-sans select-none">
      {/* Top Action Bar & Date Controls */}
      <div className="bg-white text-slate-900 p-2 sm:p-2.5 rounded-xl shadow-2xs border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg shrink-0">
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xs sm:text-sm font-black tracking-wide text-slate-900 uppercase flex flex-wrap items-center gap-1.5 leading-tight">
              <span>4) LHPP & LPPBJ (Input PJL & PDM)</span>
              <span className="px-1.5 py-0.2 bg-amber-100 text-amber-900 border border-amber-300 rounded text-[9px] font-extrabold uppercase whitespace-nowrap">Acuan Manager</span>
            </h2>
          </div>
        </div>

        {/* Date / Day Picker & Action Controls */}
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-slate-100 pt-1.5 sm:pt-0">
          {/* UNDO / REDO Buttons */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={handleUndo}
              disabled={undoStack.length === 0}
              className="px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold text-slate-700 hover:bg-white disabled:opacity-40 transition-all flex items-center gap-1 cursor-pointer"
              title="Undo Edit (Ctrl+Z)"
            >
              <Undo2 className="w-3 h-3 text-amber-600" />
              <span>Undo ({undoStack.length})</span>
            </button>
            <div className="w-[1px] h-3 bg-slate-300 mx-0.5" />
            <button
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              className="px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold text-slate-700 hover:bg-white disabled:opacity-40 transition-all flex items-center gap-1 cursor-pointer"
              title="Redo Edit (Ctrl+Y)"
            >
              <Redo2 className="w-3 h-3 text-blue-600" />
              <span>Redo ({redoStack.length})</span>
            </button>
          </div>

          <div className="flex items-center bg-slate-100 px-1.5 py-0.5 rounded-lg border border-slate-200">
            <Calendar className="w-3 h-3 text-red-600 mr-1 shrink-0" />
            <span className="text-[10px] font-black text-slate-700 mr-1">TGL:</span>
            <select
              value={selectedDay}
              onChange={e => setSelectedDay(Number(e.target.value))}
              className="bg-white text-slate-900 font-mono font-black text-[11px] px-1.5 py-0.5 rounded border border-slate-300 outline-none cursor-pointer shadow-2xs focus:border-emerald-500"
            >
              {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 ml-auto sm:ml-0">
            {/* Tombol Simpan - Utama */}
            <button
              onClick={handleSaveLhpp}
              disabled={isSaving}
              className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 text-white font-extrabold text-[10px] sm:text-[11px] px-2.5 py-1 rounded-lg shadow-2xs transition-all cursor-pointer flex items-center gap-1"
              title="Simpan LHPP & update Realisasi ke Server"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>{isSaving ? "Menyimpan..." : "Simpan"}</span>
            </button>

            <button
              onClick={handleCopyText}
              className="bg-slate-700 hover:bg-slate-800 active:scale-95 text-white font-extrabold text-[10px] sm:text-[11px] px-2 py-1 rounded-lg shadow-2xs transition-all cursor-pointer flex items-center gap-1"
            >
              <Copy className="w-3 h-3" />
              <span>Salin Rekap</span>
            </button>

            <button
              onClick={() => window.print()}
              className="bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-bold text-[10px] sm:text-[11px] px-2 py-1 rounded-lg border border-slate-200 transition-all cursor-pointer"
              title="Cetak Laporan"
            >
              <Printer className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {msg && (
        <div className={`border font-black text-xs px-3 py-2 rounded-xl text-center shadow-2xs animate-pulse ${
          msg.includes("❌") || msg.includes("⚠️") 
            ? "bg-rose-100 border-rose-400 text-rose-900" 
            : "bg-emerald-100 border-emerald-400 text-emerald-900"
        }`}>
          {msg}
        </div>
      )}

      {isLoading && (
        <div className="text-center py-2 text-xs font-bold text-slate-500 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
          <span>Memuat data LHPP tanggal {selectedDay}...</span>
        </div>
      )}

      {/* Top Banner & Side Tables Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-stretch">
        {/* Left Side Header Banner Info */}
        <div className="lg:col-span-6 bg-white text-slate-900 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs space-y-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-[11px] sm:text-xs font-black uppercase text-emerald-700 tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
              <span>REKAP HARI KUNJUNG MANAGER & YL</span>
            </span>
            <span className="text-[10px] sm:text-[11px] font-mono font-black bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-lg border border-emerald-200 shadow-2xs">
              Tgl {selectedDay} ({selectedMonth})
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-center pt-0.5">
            <div className="bg-slate-50 p-2 sm:p-2.5 rounded-lg sm:rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <span className="text-[9px] sm:text-[10px] text-slate-500 block font-bold uppercase tracking-wider">TOTAL TERJUAL</span>
              <span className="text-base sm:text-lg font-black text-emerald-700 font-mono my-0.5 sm:my-1">{totals.terjual.sum} <span className="text-[10px] sm:text-xs font-bold">btl</span></span>
              <div className="text-[8px] sm:text-[9px] font-mono font-extrabold text-slate-700 flex items-center justify-center gap-0.5 sm:gap-1 mt-0.5 pt-0.5 sm:pt-1 border-t border-slate-200">
                <span className="text-rose-600">YO:{totals.terjual.yo}</span>
                <span className="text-amber-600">OM:{totals.terjual.om}</span>
                <span className="text-fuchsia-600">OS:{totals.terjual.os}</span>
                <span className="text-sky-600">YT:{totals.terjual.yt}</span>
              </div>
            </div>

            <div className="bg-slate-50 p-2 sm:p-2.5 rounded-lg sm:rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <span className="text-[9px] sm:text-[10px] text-slate-500 block font-bold uppercase tracking-wider">TOTAL SETORAN</span>
              <span className="text-xs sm:text-sm font-black text-amber-700 font-mono my-auto">Rp {totals.setoran.sum.toLocaleString("id-ID")}</span>
            </div>

            <div className="bg-slate-50 p-2 sm:p-2.5 rounded-lg sm:rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <span className="text-[9px] sm:text-[10px] text-slate-500 block font-bold uppercase tracking-wider">PDM HARI INI</span>
              <span className="text-base sm:text-lg font-black text-sky-700 font-mono my-0.5 sm:my-1">{totals.pdmHariIni.sum} <span className="text-[10px] sm:text-xs font-bold">btl</span></span>
              <div className="text-[8px] sm:text-[9px] font-mono font-extrabold text-slate-700 flex items-center justify-center gap-0.5 sm:gap-1 mt-0.5 pt-0.5 sm:pt-1 border-t border-slate-200">
                <span className="text-rose-600">YO:{totals.pdmHariIni.yo}</span>
                <span className="text-amber-600">OM:{totals.pdmHariIni.om}</span>
                <span className="text-fuchsia-600">OS:{totals.pdmHariIni.os}</span>
                <span className="text-sky-600">YT:{totals.pdmHariIni.yt}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side Summary Table (PDM YLM & SISA YLM) */}
        <div className="lg:col-span-6 bg-white text-slate-900 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-center">
          <div className="overflow-x-auto rounded-lg sm:rounded-xl border border-slate-200 shadow-2xs">
            <table className="w-full text-center text-[11px] font-mono border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-black text-[10px] uppercase border-b border-slate-200">
                  <th className="p-2 border-r border-slate-200 bg-slate-100 text-slate-700 text-left px-3">TGL</th>
                  <th className="p-2 border-r border-slate-200 text-center font-extrabold text-[12px] text-cyan-700" colSpan={2}>
                    {selectedDay}
                  </th>
                  <th className="p-2 border-r border-slate-200 text-rose-700">YO</th>
                  <th className="p-2 border-r border-slate-200 text-amber-800">OM</th>
                  <th className="p-2 border-r border-slate-200 text-fuchsia-800">OS</th>
                  <th className="p-2 border-r border-slate-200 text-sky-800">YT</th>
                  <th className="p-2 text-emerald-800 font-black">TOTAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-bold bg-white text-slate-900">
                {/* PDM YLM Row */}
                <tr className="bg-white text-slate-900">
                  <td className="p-2 font-black text-left bg-white text-slate-900 px-3 border-r border-slate-200" colSpan={3}>
                    PDM YLM
                  </td>
                  <td className="p-1 border-r border-slate-200">
                    <NumberInput
                      value={summary.pdmYlm.yo || ""}
                      onChange={(val) => handlePdmYlmChange("yo", val)}
                      onPaste={e => handlePdmYlmPaste(e, "yo")}
                      onFocus={e => e.target.select()}
                      className="w-full text-center bg-white text-slate-900 font-black outline-none border border-slate-200 rounded px-1 py-0.5 focus:ring-2 focus:ring-amber-500"
                    />
                  </td>
                  <td className="p-1 border-r border-slate-200">
                    <NumberInput
                      value={summary.pdmYlm.om || ""}
                      onChange={(val) => handlePdmYlmChange("om", val)}
                      onPaste={e => handlePdmYlmPaste(e, "om")}
                      onFocus={e => e.target.select()}
                      className="w-full text-center bg-white text-slate-900 font-black outline-none border border-slate-200 rounded px-1 py-0.5 focus:ring-2 focus:ring-amber-500"
                    />
                  </td>
                  <td className="p-1 border-r border-slate-200">
                    <NumberInput
                      value={summary.pdmYlm.os || ""}
                      onChange={(val) => handlePdmYlmChange("os", val)}
                      onPaste={e => handlePdmYlmPaste(e, "os")}
                      onFocus={e => e.target.select()}
                      className="w-full text-center bg-white text-slate-900 font-black outline-none border border-slate-200 rounded px-1 py-0.5 focus:ring-2 focus:ring-amber-500"
                    />
                  </td>
                  <td className="p-1 border-r border-slate-200">
                    <NumberInput
                      value={summary.pdmYlm.yt || ""}
                      onChange={(val) => handlePdmYlmChange("yt", val)}
                      onPaste={e => handlePdmYlmPaste(e, "yt")}
                      onFocus={e => e.target.select()}
                      className="w-full text-center bg-white text-slate-900 font-black outline-none border border-slate-200 rounded px-1 py-0.5 focus:ring-2 focus:ring-amber-500"
                    />
                  </td>
                  <td className="p-2 font-black bg-white text-slate-900">{totalPdmYlm}</td>
                </tr>

                {/* SISA YLM Row */}
                <tr className="bg-slate-50 text-slate-900 font-black">
                  <td className="p-2 text-left bg-slate-50 text-slate-900 px-3 border-r border-slate-200" colSpan={3}>
                    SISA YLM
                  </td>
                  <td className={`p-2 border-r border-slate-200 ${sisaYlm.yo < 0 ? 'text-rose-600 font-extrabold' : ''}`}>{sisaYlm.yo}</td>
                  <td className={`p-2 border-r border-slate-200 ${sisaYlm.om < 0 ? 'text-rose-600 font-extrabold' : ''}`}>{sisaYlm.om}</td>
                  <td className={`p-2 border-r border-slate-200 ${sisaYlm.os < 0 ? 'text-rose-600 font-extrabold' : ''}`}>{sisaYlm.os}</td>
                  <td className={`p-2 border-r border-slate-200 ${sisaYlm.yt < 0 ? 'text-rose-600 font-extrabold' : ''}`}>{sisaYlm.yt}</td>
                  <td className={`p-2 bg-slate-50 font-black ${sisaYlm.total < 0 ? 'text-rose-600' : 'text-slate-900'}`}>{sisaYlm.total}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MAIN SPREADSHEET TABLE */}
      <div ref={gridContainerRef} className="bg-white border border-slate-200 rounded-2xl shadow-md overflow-hidden relative">
        <GridSelectionToolbar
          selection={selection}
          isMenuOpen={isMenuOpen}
          menuPos={menuPos}
          onCopy={handleCopy}
          onCut={handleCut}
          onPaste={handlePaste}
          onClear={handleClear}
          onClose={() => {
            setIsMenuOpen(false);
            setSelection(null);
          }}
        />
        {clipboardModal && (
          <ClipboardFallbackModal
            mode={clipboardModal.mode}
            initialText={clipboardModal.text}
            onConfirmPaste={confirmManualPaste}
            onClose={closeClipboardModal}
          />
        )}
        <div className="overflow-x-auto max-h-[680px]">
          <table className="w-full text-left text-[11px] font-mono border-collapse select-none">
            {/* Header Level 1 */}
            <thead className="sticky top-0 bg-slate-50 text-slate-700 z-30 shadow-sm">
              <tr className="bg-slate-50 text-slate-800 font-black uppercase text-[10px] divide-x divide-slate-200">
                <th className="p-2 sticky left-0 bg-slate-50 z-40 min-w-[140px] max-w-[140px] text-left border-r border-slate-200 shadow-[1px_0_0_0_#e2e8f0]">
                  YAKULT LADY
                </th>
                <th
                  colSpan={4}
                  className="p-2 text-center bg-slate-50 text-slate-600 border-r border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors font-extrabold tracking-wide"
                  onClick={() => setSelection({ startR: 0, startC: 0, endR: Math.max(0, computedRows.length - 1), endC: 3 })}
                >
                  PDM SEBELUMNYA
                </th>
                <th
                  colSpan={4}
                  className="p-2 text-center bg-red-50 text-red-800 border-r border-slate-200 cursor-pointer hover:bg-red-100 transition-colors font-extrabold tracking-wide"
                  onClick={() => setSelection({ startR: 0, startC: 4, endR: Math.max(0, computedRows.length - 1), endC: 7 })}
                >
                  BB
                </th>
                <th
                  colSpan={4}
                  className="p-2 text-center bg-emerald-50 text-emerald-800 border-r border-slate-200 cursor-pointer hover:bg-emerald-100 transition-colors font-extrabold tracking-wide"
                  onClick={() => setSelection({ startR: 0, startC: 8, endR: Math.max(0, computedRows.length - 1), endC: 11 })}
                >
                  TERJUAL
                </th>
                <th
                  colSpan={1}
                  className="p-2 text-center bg-amber-50 text-amber-800 border-r border-slate-200 cursor-pointer hover:bg-amber-100 transition-colors font-extrabold tracking-wide"
                  onClick={() => selectColumn(12)}
                >
                  SETORAN
                </th>
                <th
                  colSpan={4}
                  className="p-2 text-center bg-indigo-50 text-indigo-800 border-r border-slate-200 cursor-pointer hover:bg-indigo-100 transition-colors font-extrabold tracking-wide"
                  onClick={() => setSelection({ startR: 0, startC: 13, endR: Math.max(0, computedRows.length - 1), endC: 16 })}
                >
                  PDM HARI INI
                </th>
                <th
                  colSpan={4}
                  className="p-2 text-center bg-sky-50 text-sky-800 cursor-pointer hover:bg-sky-100 transition-colors font-extrabold tracking-wide"
                  onClick={() => setSelection({ startR: 0, startC: 17, endR: Math.max(0, computedRows.length - 1), endC: 20 })}
                >
                  TURUN PDM
                </th>
              </tr>

              {/* Header Level 2 Sub-columns */}
              <tr className="bg-slate-50/80 text-slate-700 font-black uppercase text-[9px] border-t border-slate-200 divide-x divide-slate-200">
                <th className="p-1 sticky left-0 bg-slate-50/80 z-40 border-r border-slate-200 shadow-[1px_0_0_0_#e2e8f0]"></th>

                {[
                  { label: "YO", c: 0 }, { label: "OM", c: 1 }, { label: "OS", c: 2 }, { label: "YT", c: 3, borderRight: true },
                  { label: "YO", c: 4 }, { label: "OM", c: 5 }, { label: "OS", c: 6 }, { label: "YT", c: 7, borderRight: true },
                  { label: "YO", c: 8 }, { label: "OM", c: 9 }, { label: "OS", c: 10 }, { label: "YT", c: 11, borderRight: true },
                  { label: "SETORAN (RP)", c: 12, borderRight: true, minW: true },
                  { label: "YO", c: 13 }, { label: "OM", c: 14 }, { label: "OS", c: 15 }, { label: "YT", c: 16, borderRight: true },
                  { label: "YO", c: 17 }, { label: "OM", c: 18 }, { label: "OS", c: 19 }, { label: "YT", c: 20 }
                ].map((col) => (
                  <th
                    key={col.c}
                    data-c={col.c}
                    className={`p-1 text-center bg-slate-50/80 text-slate-700 cursor-pointer hover:bg-slate-100 transition-colors select-none ${col.minW ? "min-w-[125px]" : "w-11"} ${col.borderRight ? "border-r border-slate-200" : ""}`}
                    onClick={() => selectColumn(col.c)}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 font-bold bg-white text-slate-900">
              {computedRows.map((row, rIdx) => {
                const isTku = row.area === "TKU";
                return (
                  <tr
                    key={row.area + rIdx}
                    className={`hover:bg-indigo-50/50 transition-colors ${
                      isTku ? "bg-slate-100 font-black text-slate-900" : "bg-white text-slate-900"
                    }`}
                  >
                    {/* YAKULT LADY Column */}
                    <td
                      data-r={rIdx}
                      className="p-1.5 sticky left-0 bg-slate-50 z-20 border-r border-slate-200 cursor-pointer hover:bg-slate-200 transition-colors select-none min-w-[140px] max-w-[140px] truncate shadow-[1px_0_0_0_#e2e8f0]"
                      onClick={() => selectRow(rIdx)}
                    >
                      <span className="text-rose-700 font-black mr-1">[{row.area}]</span>
                      <span className="font-extrabold text-slate-900 text-[10px] sm:text-[11px]">{cleanYlName(row.nama)}</span>
                    </td>
                    {/* PDM SEBELUMNYA (Auto / Read-Only dari PDM Hari Ini tanggal sebelumnya) */}
                    <td {...getCellProps(rIdx, 0)} className={`p-1 text-center text-red-700 font-extrabold bg-slate-50 border-r border-slate-200 ${getCellProps(rIdx, 0).className}`}>
                      {row.pdmSebelum.yo}
                    </td>
                    <td {...getCellProps(rIdx, 1)} className={`p-1 text-center text-amber-800 font-extrabold bg-slate-50 border-r border-slate-200 ${getCellProps(rIdx, 1).className}`}>
                      {row.pdmSebelum.om}
                    </td>
                    <td {...getCellProps(rIdx, 2)} className={`p-1 text-center text-fuchsia-800 font-extrabold bg-slate-50 border-r border-slate-200 ${getCellProps(rIdx, 2).className}`}>
                      {row.pdmSebelum.os}
                    </td>
                    <td {...getCellProps(rIdx, 3)} className={`p-1 text-center text-blue-800 font-extrabold bg-slate-50 border-r-2 border-slate-400 ${getCellProps(rIdx, 3).className}`}>
                      {row.pdmSebelum.yt}
                    </td>

                    {/* BB (Barang Bawaan) Inputs - Manual Input Manager */}
                    <td {...getCellProps(rIdx, 4)} className={`p-1 text-center text-red-700 font-bold bg-rose-50 border-r border-slate-200 ${getCellProps(rIdx, 4).className}`}>
                      <NumberInput
                        min={0}
                        value={row.bb.yo || ""}
                        onChange={(val) => handleCellChange(rIdx, "bb", "yo", val)}
                        onPaste={e => handleCellPaste(e, rIdx, 4)}
                        onFocus={e => e.target.select()}
                        onDragStart={e => e.preventDefault()}
                        className="w-full text-center bg-transparent font-black outline-none focus:bg-rose-200 rounded text-red-700"
                      />
                    </td>
                    <td {...getCellProps(rIdx, 5)} className={`p-1 text-center text-amber-800 font-bold bg-rose-50 border-r border-slate-200 ${getCellProps(rIdx, 5).className}`}>
                      <NumberInput
                        min={0}
                        value={row.bb.om || ""}
                        onChange={(val) => handleCellChange(rIdx, "bb", "om", val)}
                        onPaste={e => handleCellPaste(e, rIdx, 5)}
                        onFocus={e => e.target.select()}
                        onDragStart={e => e.preventDefault()}
                        className="w-full text-center bg-transparent font-black outline-none focus:bg-rose-200 rounded text-amber-800"
                      />
                    </td>
                    <td {...getCellProps(rIdx, 6)} className={`p-1 text-center text-fuchsia-800 font-bold bg-rose-50 border-r border-slate-200 ${getCellProps(rIdx, 6).className}`}>
                      <NumberInput
                        min={0}
                        value={row.bb.os || ""}
                        onChange={(val) => handleCellChange(rIdx, "bb", "os", val)}
                        onPaste={e => handleCellPaste(e, rIdx, 6)}
                        onFocus={e => e.target.select()}
                        onDragStart={e => e.preventDefault()}
                        className="w-full text-center bg-transparent font-black outline-none focus:bg-rose-200 rounded text-fuchsia-800"
                      />
                    </td>
                    <td {...getCellProps(rIdx, 7)} className={`p-1 text-center text-blue-800 font-bold bg-rose-50 border-r-2 border-slate-400 ${getCellProps(rIdx, 7).className}`}>
                      <NumberInput
                        min={0}
                        value={row.bb.yt || ""}
                        onChange={(val) => handleCellChange(rIdx, "bb", "yt", val)}
                        onPaste={e => handleCellPaste(e, rIdx, 7)}
                        onFocus={e => e.target.select()}
                        onDragStart={e => e.preventDefault()}
                        className="w-full text-center bg-transparent font-black outline-none focus:bg-rose-200 rounded text-blue-800"
                      />
                    </td>

                    {/* TERJUAL (Auto Formula: PDM SEBELUMNYA - BB) */}
                    <td {...getCellProps(rIdx, 8)} className={`p-1 text-center text-red-700 font-black bg-white border-r border-slate-200 ${getCellProps(rIdx, 8).className}`}>
                      {row.terjual.yo}
                    </td>
                    <td {...getCellProps(rIdx, 9)} className={`p-1 text-center text-amber-800 font-black bg-white border-r border-slate-200 ${getCellProps(rIdx, 9).className}`}>
                      {row.terjual.om}
                    </td>
                    <td {...getCellProps(rIdx, 10)} className={`p-1 text-center text-fuchsia-800 font-black bg-white border-r border-slate-200 ${getCellProps(rIdx, 10).className}`}>
                      {row.terjual.os}
                    </td>
                    <td {...getCellProps(rIdx, 11)} className={`p-1 text-center text-blue-800 font-black bg-white border-r-2 border-slate-400 ${getCellProps(rIdx, 11).className}`}>
                      {row.terjual.yt}
                    </td>

                    {/* SETORAN Column (Auto Formula: Terjual x Harga) */}
                    <td {...getCellProps(rIdx, 12)} className={`p-1 text-right font-bold text-slate-900 bg-amber-50 border-r-2 border-slate-400 font-mono ${getCellProps(rIdx, 12).className}`}>
                      Rp {row.totalSetoran.toLocaleString("id-ID")}
                    </td>

                    {/* PDM HARI INI Inputs */}
                    <td {...getCellProps(rIdx, 13)} className={`p-1 text-center text-red-700 font-bold bg-white border-r border-slate-200 ${getCellProps(rIdx, 13).className}`}>
                      <NumberInput
                        min={0}
                        value={row.pdmHariIni.yo || ""}
                        onChange={(val) => handleCellChange(rIdx, "pdmHariIni", "yo", val)}
                        onPaste={e => handleCellPaste(e, rIdx, 13)}
                        onFocus={e => e.target.select()}
                        className="w-full text-center bg-transparent outline-none focus:bg-amber-200 rounded font-black text-red-700"
                      />
                    </td>
                    <td {...getCellProps(rIdx, 14)} className={`p-1 text-center text-amber-800 font-bold bg-white border-r border-slate-200 ${getCellProps(rIdx, 14).className}`}>
                      <NumberInput
                        min={0}
                        value={row.pdmHariIni.om || ""}
                        onChange={(val) => handleCellChange(rIdx, "pdmHariIni", "om", val)}
                        onPaste={e => handleCellPaste(e, rIdx, 14)}
                        onFocus={e => e.target.select()}
                        className="w-full text-center bg-transparent outline-none focus:bg-amber-200 rounded font-black text-amber-800"
                      />
                    </td>
                    <td {...getCellProps(rIdx, 15)} className={`p-1 text-center text-fuchsia-800 font-bold bg-white border-r border-slate-200 ${getCellProps(rIdx, 15).className}`}>
                      <NumberInput
                        min={0}
                        value={row.pdmHariIni.os || ""}
                        onChange={(val) => handleCellChange(rIdx, "pdmHariIni", "os", val)}
                        onPaste={e => handleCellPaste(e, rIdx, 15)}
                        onFocus={e => e.target.select()}
                        className="w-full text-center bg-transparent outline-none focus:bg-amber-200 rounded font-black text-fuchsia-800"
                      />
                    </td>
                    <td {...getCellProps(rIdx, 16)} className={`p-1 text-center text-blue-800 font-bold bg-white border-r-2 border-slate-400 ${getCellProps(rIdx, 16).className}`}>
                      <NumberInput
                        min={0}
                        value={row.pdmHariIni.yt || ""}
                        onChange={(val) => handleCellChange(rIdx, "pdmHariIni", "yt", val)}
                        onPaste={e => handleCellPaste(e, rIdx, 16)}
                        onFocus={e => e.target.select()}
                        className="w-full text-center bg-transparent outline-none focus:bg-amber-200 rounded font-black text-blue-800"
                      />
                    </td>

                    {/* TURUN (Auto Formula: PDM HARI INI - BB) */}
                    <td {...getCellProps(rIdx, 17)} className={`p-1 text-center text-red-700 font-black bg-cyan-50 border-r border-slate-200 ${getCellProps(rIdx, 17).className}`}>
                      {row.turun.yo}
                    </td>
                    <td {...getCellProps(rIdx, 18)} className={`p-1 text-center text-amber-800 font-black bg-cyan-50 border-r border-slate-200 ${getCellProps(rIdx, 18).className}`}>
                      {row.turun.om}
                    </td>
                    <td {...getCellProps(rIdx, 19)} className={`p-1 text-center text-fuchsia-800 font-black bg-cyan-50 border-r border-slate-200 ${getCellProps(rIdx, 19).className}`}>
                      {row.turun.os}
                    </td>
                    <td {...getCellProps(rIdx, 20)} className={`p-1 text-center text-blue-800 font-black bg-cyan-50 ${getCellProps(rIdx, 20).className}`}>
                      {row.turun.yt}
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Bottom Row Totals */}
            <tfoot className="bg-slate-50 text-slate-800 font-black border-t-2 border-slate-300 shadow-[0_-1px_0_0_#cbd5e1]">
              {/* Row 1: Subtotal Item Totals */}
              <tr className="text-[11px] divide-x divide-slate-200">
                <td className="p-2.5 sticky left-0 bg-slate-50 z-20 font-black text-slate-800 text-left shadow-[1px_0_0_0_#e2e8f0]">
                  Subtotal
                </td>

                {/* PDM SEBELUM Total */}
                <td className="p-2 text-center text-slate-600 font-black">{totals.pdmSebelum.yo}</td>
                <td className="p-2 text-center text-slate-600 font-black">{totals.pdmSebelum.om}</td>
                <td className="p-2 text-center text-slate-600 font-black">{totals.pdmSebelum.os}</td>
                <td className="p-2 text-center text-slate-600 font-black border-r border-slate-300">
                  {totals.pdmSebelum.yt}
                </td>

                {/* BB Total */}
                <td className="p-2 text-center text-red-700 font-black">{totals.bb.yo}</td>
                <td className="p-2 text-center text-amber-700 font-black">{totals.bb.om}</td>
                <td className="p-2 text-center text-fuchsia-700 font-black">{totals.bb.os}</td>
                <td className="p-2 text-center text-blue-700 font-black border-r border-slate-300">
                  {totals.bb.yt}
                </td>

                {/* TERJUAL Total */}
                <td className="p-2 text-center text-emerald-700 font-black">{totals.terjual.yo}</td>
                <td className="p-2 text-center text-emerald-700 font-black">{totals.terjual.om}</td>
                <td className="p-2 text-center text-emerald-700 font-black">{totals.terjual.os}</td>
                <td className="p-2 text-center text-emerald-700 font-black border-r border-slate-300">
                  {totals.terjual.yt}
                </td>

                {/* SETORAN Total */}
                <td className="p-2 text-right text-xs bg-amber-100/60 text-amber-800 font-black border-r border-slate-300 font-mono">
                  Rp {totals.setoran.setor.toLocaleString("id-ID")}
                </td>

                {/* PDM HARI INI Total */}
                <td className="p-2 text-center text-indigo-700 font-black">{totals.pdmHariIni.yo}</td>
                <td className="p-2 text-center text-indigo-700 font-black">{totals.pdmHariIni.om}</td>
                <td className="p-2 text-center text-indigo-700 font-black">{totals.pdmHariIni.os}</td>
                <td className="p-2 text-center text-indigo-700 font-black border-r border-slate-300">
                  {totals.pdmHariIni.yt}
                </td>

                {/* TURUN Total */}
                <td className="p-2 text-center text-sky-700 font-black">{totals.turun.yo}</td>
                <td className="p-2 text-center text-sky-700 font-black">{totals.turun.om}</td>
                <td className="p-2 text-center text-sky-700 font-black">{totals.turun.os}</td>
                <td className="p-2 text-center text-sky-700 font-black">{totals.turun.yt}</td>
              </tr>

              {/* Row 2: Grand Total Combined Bottle Sum */}
              <tr className="bg-slate-200 text-slate-800 font-black text-xs uppercase divide-x divide-slate-300 border-t border-slate-200">
                <td className="p-2.5 sticky left-0 bg-slate-300 z-20 text-left font-black tracking-wide text-slate-900 shadow-[1px_0_0_0_#cbd5e1]">
                  Total Yo, Om, Os & Yt
                </td>

                <td colSpan={4} className="p-2 text-center bg-slate-200 border-r border-slate-300 font-black text-slate-800">
                  {totals.pdmSebelum.sum} btl
                </td>

                <td colSpan={4} className="p-2 text-center bg-slate-200 border-r border-slate-300 font-black text-slate-800">
                  {totals.bb.sum} btl
                </td>

                <td colSpan={4} className="p-2 text-center bg-slate-200 border-r border-slate-300 font-black text-slate-800">
                  {totals.terjual.sum} btl
                </td>

                <td colSpan={1} className="p-2 text-center bg-amber-100/80 border-r border-slate-300 font-black text-amber-900">
                  Rp {totals.setoran.setor.toLocaleString("id-ID")}
                </td>

                <td colSpan={4} className="p-2 text-center bg-slate-200 border-r border-slate-300 font-black text-slate-800">
                  {totals.pdmHariIni.sum} btl
                </td>

                <td colSpan={4} className="p-2 text-center bg-slate-200 font-black text-slate-800">
                  {totals.turun.sum} btl
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

export const LhppRealisasiView = React.memo(LhppRealisasiViewInner);
