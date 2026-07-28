import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { MotivasiConfig, cleanYlName } from "../types";
import { useSimpleGrid } from "./useSimpleGrid";
import { GridSelectionToolbar } from "./GridSelectionToolbar";
import {
  FileSpreadsheet,
  Copy,
  Printer,
  Calendar,
  ShieldCheck,
  Undo2,
  Redo2
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

// Default initial rows matching user's exact screenshot reference
const INITIAL_LHPP_ROWS: LhppRow[] = [];


const INITIAL_YLM_SUMMARY: LhppYlmSummary = {
  pdmYlm: { yo: 0, om: 0, os: 0, yt: 0 },
  sisaYlm: { yo: 0, om: 0, os: 0, yt: 0 },
  botolRusak: 0
};

const parseInputInt = (val: string | number): number => {
  if (val === "" || val === null || val === undefined) return 0;
  const str = val.toString().trim().split(/[.,]/)[0].replace(/^-?0+(?=\d)/, val.toString().startsWith("-") ? "-" : "");
  const num = parseInt(str, 10);
  return isNaN(num) ? 0 : num;
};

function LhppRealisasiViewInner({
  ylList,
  selectedMonth = "2026-07",
  motivasiConfig,
  theme = "light"
}: LhppRealisasiViewProps) {
  const [selectedDay, setSelectedDay] = useState<number>(24);
  const [rows, setRows] = useState<LhppRow[]>(INITIAL_LHPP_ROWS);
  const [summary, setSummary] = useState<LhppYlmSummary>(INITIAL_YLM_SUMMARY);
  const [msg, setMsg] = useState<string>("");

  // Undo / Redo Stacks
  const [undoStack, setUndoStack] = useState<Array<{ rows: LhppRow[]; summary: LhppYlmSummary }>>([]);
  const [redoStack, setRedoStack] = useState<Array<{ rows: LhppRow[]; summary: LhppYlmSummary }>>([]);

  // Save state snapshot for Undo
  const recordHistory = useCallback(() => {
    setUndoStack(u => [...u.slice(-19), JSON.parse(JSON.stringify({ rows, summary }))]);
    setRedoStack([]);
  }, [rows, summary]);

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




  // LHPP murni tabel input manual (copy-paste) — tidak menarik/mengirim data ke server manapun.
  // Hanya sinkronkan nama & area YL dari daftar YL aktif (data lokal, bukan fetch jaringan).
  useEffect(() => {
    if (rows.length === 0 || rows.every(r => r.area === "TKU")) {
      syncWithYlList();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ylList]);

  const syncWithYlList = () => {
    const activeYls = (ylList || []).filter(y => y.status !== "Resign");
    if (activeYls.length === 0) return;

    const newRows: LhppRow[] = activeYls.map(yl => {
      const existing = rows.find(r => r.area === yl.area || r.nama.includes(yl.nama));
      if (existing) {
        return { ...existing, area: yl.area, nama: yl.nama };
      }
      return {
        area: yl.area,
        nama: yl.nama,
        pdmSebelum: { yo: 0, om: 0, os: 0, yt: 0 },
        bb: { yo: 0, om: 0, os: 0, yt: 0 },
        setoran: { setor: 0, bank1: 0, bank2: 0 },
        pdmHariIni: { yo: 0, om: 0, os: 0, yt: 0 }
      };
    });

    // Filter out TKU row if present
    const cleanRows = newRows.filter(r => r.area !== "TKU");

    setRows(cleanRows);
  };

  // Catatan: fitur "Tarik dari Breakdown" sudah dihapus — LHPP kini murni tabel input manual (copy-paste).

  // Handler for cell edits in Main Table
  const handleCellChange = (
    rIdx: number,
    section: "pdmSebelum" | "bb" | "pdmHariIni",
    field: string,
    val: number
  ) => {
    recordHistory();
    const cleanVal = parseInputInt(val);
    setRows(prev => {
      const next = [...prev];
      const targetRow = { ...next[rIdx] };

      if (section === "pdmSebelum" || section === "bb" || section === "pdmHariIni") {
        targetRow[section] = {
          ...targetRow[section],
          [field]: cleanVal
        };
      }
      // Setoran TIDAK LAGI diinput manual — dihitung otomatis dari kolom Terjual (lihat computedRows).

      next[rIdx] = targetRow;
      return next;
    });
  };

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

  // SISA YLM Calculations: PDM YLM - Total Turun (bisa minus jika Turun > PDM YLM)
  const sisaYlm = useMemo(() => {
    const yo = summary.pdmYlm.yo - totals.turun.yo;
    const om = summary.pdmYlm.om - totals.turun.om;
    const os = summary.pdmYlm.os - totals.turun.os;
    const yt = summary.pdmYlm.yt - totals.turun.yt;
    const total = yo + om + os + yt;
    return { yo, om, os, yt, total };
  }, [summary.pdmYlm, totals.turun]);

  // Spreadsheet Grid Integration
  const gridContainerRef = useRef<HTMLDivElement>(null);

  const isLhppCellEditable = useCallback((r: number, c: number) => {
    if (r >= computedRows.length) return false;
    if (computedRows[r]?.area === "TKU") return false;
    if (c >= 8 && c <= 11) return false; // Terjual read-only
    if (c === 12) return false; // Setoran read-only (formula dari Terjual)
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

        if (c >= 0 && c <= 3) {
          const fields = ["yo", "om", "os", "yt"] as const;
          row.pdmSebelum[fields[c]] = numVal;
        } else if (c >= 4 && c <= 7) {
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
    getCellProps,
    selectColumn,
    selectRow,
    setIsDragging,
    handleCopy,
    handleCut,
    handlePaste,
    handleClear
  } = useSimpleGrid({
    totalRows: computedRows.length,
    totalCols: 21,
    isCellEditable: isLhppCellEditable,
    getCellValue: getLhppCellValue,
    setBatchCellValues: setLhppBatchCellValues,
    onRecordUndo: recordHistory
  });

  // Dedicated paste handler for PDM YLM inputs (allows pasting single or multi tab-delimited values)
  const handlePdmYlmPaste = (e: React.ClipboardEvent, startField: "yo" | "om" | "os" | "yt") => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    if (!text) return;
    const clean = text.trim();
    const tokens = clean.split(/[\t\n\r,;\s]+/).map(t => parseInputInt(t));
    if (tokens.length === 0) return;
    const fields: ("yo" | "om" | "os" | "yt")[] = ["yo", "om", "os", "yt"];
    const startIdx = fields.indexOf(startField);

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
    // If multi-cell or tabbed content or focused outside text selection, intercept paste into grid
    if (/[\t\n\r,;/|\s]/.test(clean) || clean.length > 0) {
      e.preventDefault();
      setSelection({ startR: rIdx, startC: cIdx, endR: rIdx, endC: cIdx });
      setTimeout(() => {
        handlePaste(text);
      }, 0);
    }
  };

  // Global Keyboard Shortcuts (Ctrl+Z, Ctrl+Y / Ctrl+Shift+Z, Copy/Paste/Delete)
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
        if (selection) {
           handleCopy();
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
        // Allow intercepting paste if not on input, or if multi-cell/tabs/newlines
        if (targetTag !== "input" || /[\t\n\r,;/|\s]/.test(clean)) {
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
    }
  }, [handleUndo, handleRedo, selection, handleCopy, handlePaste, handleClear]);


  const totalPdmYlm = summary.pdmYlm.yo + summary.pdmYlm.om + summary.pdmYlm.os + summary.pdmYlm.yt;

  // Catatan: LHPP tidak lagi mengirim data ke server manapun — murni tabel lokal untuk copy-paste manual
  // (gunakan tombol "Salin Rekap" untuk menyalin teks ringkasan, atau blok+copy sel tabel).

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
      {/* Top Action Bar & Date Controls - White Card */}
      <div className="bg-white text-slate-900 p-4 rounded-2xl shadow-md border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black tracking-wide text-slate-900 uppercase flex items-center gap-2">
              <span>4) LHPP & LPPBJ (Input PJL & PDM)</span>
              <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[10px] font-black uppercase">Acuan & Kalkulator Manager</span>
            </h2>
            <p className="text-[11px] text-slate-600 font-semibold">
              Kalkulator & acuan simulasi harian Manager {motivasiConfig?.tkuName || "DP Jember 1"} (murni kalkulator — tidak menarik/mengirim data otomatis ke YL)
            </p>
          </div>
        </div>

        {/* Date / Day Picker & Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* UNDO / REDO Buttons */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-300">
            <button
              onClick={handleUndo}
              disabled={undoStack.length === 0}
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 hover:bg-white disabled:opacity-40 transition-all flex items-center gap-1 cursor-pointer"
              title="Undo Edit (Ctrl+Z)"
            >
              <Undo2 className="w-3.5 h-3.5 text-amber-600" />
              <span>Undo ({undoStack.length})</span>
            </button>
            <div className="w-[1px] h-4 bg-slate-300 mx-0.5" />
            <button
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 hover:bg-white disabled:opacity-40 transition-all flex items-center gap-1 cursor-pointer"
              title="Redo Edit (Ctrl+Y)"
            >
              <Redo2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Redo ({redoStack.length})</span>
            </button>
          </div>
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-300">
            <Calendar className="w-4 h-4 text-red-600 ml-1.5 mr-1" />
            <span className="text-[10px] font-black text-slate-700 mr-1.5">TGL:</span>
            <select
              value={selectedDay}
              onChange={e => setSelectedDay(Number(e.target.value))}
              className="bg-white text-slate-900 font-mono font-black text-xs px-2.5 py-1 rounded-lg border border-slate-300 outline-none cursor-pointer shadow-sm focus:border-emerald-500"
            >
              {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleCopyText}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] px-3.5 py-2 rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Salin Rekap</span>
          </button>

          <button
            onClick={() => window.print()}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] px-3 py-2 rounded-xl border border-slate-300 transition-all cursor-pointer"
            title="Cetak Laporan"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {msg && (
        <div className="bg-emerald-100 border border-emerald-400 text-emerald-900 font-black text-xs px-4 py-2.5 rounded-xl text-center shadow-sm animate-pulse">
          {msg}
        </div>
      )}

      {/* Top Banner & Side Tables Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Side Header Banner Info - White Card */}
        <div className="lg:col-span-6 bg-white text-slate-900 p-4 rounded-2xl border border-slate-200 shadow-md space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <span className="text-[11px] font-black uppercase text-emerald-800 tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> REKAP HARI KUNJUNG MANAGER & YL
            </span>
            <span className="text-[10px] font-mono font-black bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded border border-emerald-200">
              Tgl {selectedDay} ({selectedMonth})
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2.5 text-center pt-1">
            <div className="bg-emerald-50/80 p-2 rounded-xl border border-emerald-200 shadow-xs flex flex-col justify-between">
              <span className="text-[10px] text-slate-600 block font-bold">TOTAL TERJUAL</span>
              <span className="text-base font-black text-emerald-700 font-mono">{totals.terjual.sum} btl</span>
              <div className="text-[9px] font-mono font-bold text-slate-700 flex items-center justify-center gap-1 mt-0.5 pt-0.5 border-t border-emerald-200/60">
                <span className="text-red-600">YO:{totals.terjual.yo}</span>
                <span className="text-amber-600">OM:{totals.terjual.om}</span>
                <span className="text-pink-600">OS:{totals.terjual.os}</span>
                <span className="text-blue-600">YT:{totals.terjual.yt}</span>
              </div>
            </div>
            <div className="bg-amber-50/80 p-2 rounded-xl border border-amber-200 shadow-xs flex flex-col justify-between">
              <span className="text-[10px] text-slate-600 block font-bold">TOTAL SETORAN</span>
              <span className="text-xs font-black text-amber-800 font-mono my-auto">Rp {totals.setoran.sum.toLocaleString("id-ID")}</span>
            </div>
            <div className="bg-cyan-50/80 p-2 rounded-xl border border-cyan-200 shadow-xs flex flex-col justify-between">
              <span className="text-[10px] text-slate-600 block font-bold">TURUN PDM</span>
              <span className="text-base font-black text-cyan-800 font-mono">{totals.turun.sum} btl</span>
              <div className="text-[9px] font-mono font-bold text-slate-700 flex items-center justify-center gap-1 mt-0.5 pt-0.5 border-t border-cyan-200/60">
                <span className="text-red-600">YO:{totals.turun.yo}</span>
                <span className="text-amber-600">OM:{totals.turun.om}</span>
                <span className="text-pink-600">OS:{totals.turun.os}</span>
                <span className="text-blue-600">YT:{totals.turun.yt}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side Summary Table (PDM YLM & SISA YLM & PDM DD) - White Card */}
        <div className="lg:col-span-6 bg-white p-3 rounded-2xl border border-slate-200 shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-center text-[11px] font-mono border-collapse border border-slate-300">
              <thead>
                <tr className="bg-cyan-500 text-slate-950 font-black text-[10px] uppercase">
                  <th className="p-1 border border-slate-300 bg-cyan-400">Tgl</th>
                  <th className="p-1 border border-slate-300 text-center font-extrabold text-[12px]" colSpan={2}>
                    {selectedDay}
                  </th>
                  <th className="p-1 border border-slate-300 bg-cyan-400">YO</th>
                  <th className="p-1 border border-slate-300 bg-cyan-400">OM</th>
                  <th className="p-1 border border-slate-300 bg-cyan-400">OS</th>
                  <th className="p-1 border border-slate-300 bg-cyan-400">YT</th>
                  <th className="p-1 border border-slate-300 bg-cyan-400 text-slate-950 font-black">TOTAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 font-bold">
                {/* PDM YLM Row */}
                <tr className="bg-amber-200 text-slate-950">
                  <td className="p-1 border border-slate-300 font-black text-left bg-amber-300 px-2" colSpan={3}>
                    PDM YLM
                  </td>
                  <td className="p-1 border border-slate-300">
                    <input
                      type="number"
                      value={summary.pdmYlm.yo}
                      onChange={e => setSummary(s => ({ ...s, pdmYlm: { ...s.pdmYlm, yo: parseInputInt(e.target.value) } }))}
                      onPaste={e => handlePdmYlmPaste(e, "yo")}
                      onFocus={e => e.target.select()}
                      className="w-full text-center bg-white/90 text-slate-950 font-black outline-none border border-amber-300 rounded px-1"
                    />
                  </td>
                  <td className="p-1 border border-slate-300">
                    <input
                      type="number"
                      value={summary.pdmYlm.om}
                      onChange={e => setSummary(s => ({ ...s, pdmYlm: { ...s.pdmYlm, om: parseInputInt(e.target.value) } }))}
                      onPaste={e => handlePdmYlmPaste(e, "om")}
                      onFocus={e => e.target.select()}
                      className="w-full text-center bg-white/90 text-slate-950 font-black outline-none border border-amber-300 rounded px-1"
                    />
                  </td>
                  <td className="p-1 border border-slate-300">
                    <input
                      type="number"
                      value={summary.pdmYlm.os}
                      onChange={e => setSummary(s => ({ ...s, pdmYlm: { ...s.pdmYlm, os: parseInputInt(e.target.value) } }))}
                      onPaste={e => handlePdmYlmPaste(e, "os")}
                      onFocus={e => e.target.select()}
                      className="w-full text-center bg-white/90 text-slate-950 font-black outline-none border border-amber-300 rounded px-1"
                    />
                  </td>
                  <td className="p-1 border border-slate-300">
                    <input
                      type="number"
                      value={summary.pdmYlm.yt}
                      onChange={e => setSummary(s => ({ ...s, pdmYlm: { ...s.pdmYlm, yt: parseInputInt(e.target.value) } }))}
                      onPaste={e => handlePdmYlmPaste(e, "yt")}
                      onFocus={e => e.target.select()}
                      className="w-full text-center bg-white/90 text-slate-950 font-black outline-none border border-amber-300 rounded px-1"
                    />
                  </td>
                  <td className="p-1 border border-slate-300 font-black bg-amber-300">{totalPdmYlm}</td>
                </tr>

                {/* SISA YLM Row (Auto formula: PDM YLM - Total Turun) */}
                <tr className="bg-orange-200 text-slate-950 font-black">
                  <td className="p-1 border border-slate-300 text-left bg-orange-300 px-2" colSpan={3}>
                    SISA YLM
                  </td>
                  <td className={`p-1 border border-slate-300 ${sisaYlm.yo < 0 ? 'text-red-600' : ''}`}>{sisaYlm.yo}</td>
                  <td className={`p-1 border border-slate-300 ${sisaYlm.om < 0 ? 'text-red-600' : ''}`}>{sisaYlm.om}</td>
                  <td className={`p-1 border border-slate-300 ${sisaYlm.os < 0 ? 'text-red-600' : ''}`}>{sisaYlm.os}</td>
                  <td className={`p-1 border border-slate-300 ${sisaYlm.yt < 0 ? 'text-red-600' : ''}`}>{sisaYlm.yt}</td>
                  <td className={`p-1 border border-slate-300 bg-orange-300 font-black ${sisaYlm.total < 0 ? 'text-red-700' : ''}`}>{sisaYlm.total}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MAIN SPREADSHEET TABLE - WHITE CARD CONTAINER */}
      <div ref={gridContainerRef} className="bg-white border border-slate-300 rounded-2xl shadow-md overflow-hidden relative">
        <GridSelectionToolbar
          selection={selection}
          onCopy={handleCopy}
          onCut={handleCut}
          onPaste={handlePaste}
          onClear={handleClear}
          onClose={() => setSelection(null)}
        />
        <div className="overflow-x-auto max-h-[680px]">
          <table className="w-full text-left text-[11px] font-mono border-collapse select-none">
            {/* Header Level 1 */}
            <thead className="sticky top-0 bg-emerald-800 text-white z-30 shadow-md">
              <tr className="bg-emerald-800 text-white font-black uppercase text-[10px] divide-x divide-slate-700">
                <th className="p-2 sticky left-0 bg-emerald-800 z-40 min-w-[50px] text-center border-r border-slate-700">
                  Area
                </th>
                <th className="p-2 sticky left-[50px] bg-emerald-800 z-40 min-w-[120px] text-left border-r border-slate-700">
                  Nama
                </th>
                <th
                  colSpan={4}
                  className="p-1.5 text-center bg-emerald-700 border-r border-slate-700 text-white cursor-pointer hover:bg-emerald-600 transition-colors"
                  onClick={() => setSelection({ startR: 0, startC: 0, endR: Math.max(0, computedRows.length - 1), endC: 3 })}
                >
                  PDM SEBELUMNYA
                </th>
                <th
                  colSpan={4}
                  className="p-1.5 text-center bg-emerald-700 border-r border-slate-700 text-white cursor-pointer hover:bg-emerald-600 transition-colors"
                  onClick={() => setSelection({ startR: 0, startC: 4, endR: Math.max(0, computedRows.length - 1), endC: 7 })}
                >
                  BB
                </th>
                <th
                  colSpan={4}
                  className="p-1.5 text-center bg-emerald-700 border-r border-slate-700 text-white cursor-pointer hover:bg-emerald-600 transition-colors"
                  onClick={() => setSelection({ startR: 0, startC: 8, endR: Math.max(0, computedRows.length - 1), endC: 11 })}
                >
                  TERJUAL
                </th>
                <th
                  colSpan={1}
                  className="p-1.5 text-center bg-emerald-700 border-r border-slate-700 text-white cursor-pointer hover:bg-emerald-600 transition-colors"
                  onClick={() => selectColumn(12)}
                >
                  SETORAN
                </th>
                <th
                  colSpan={4}
                  className="p-1.5 text-center bg-emerald-700 border-r border-slate-700 text-white cursor-pointer hover:bg-emerald-600 transition-colors"
                  onClick={() => setSelection({ startR: 0, startC: 13, endR: Math.max(0, computedRows.length - 1), endC: 16 })}
                >
                  PDM HARI INI
                </th>
                <th
                  colSpan={4}
                  className="p-1.5 text-center bg-emerald-700 text-white cursor-pointer hover:bg-emerald-600 transition-colors"
                  onClick={() => setSelection({ startR: 0, startC: 17, endR: Math.max(0, computedRows.length - 1), endC: 20 })}
                >
                  TURUN
                </th>
              </tr>

              {/* Header Level 2 Sub-columns */}
              <tr className="bg-cyan-400 text-slate-950 font-black uppercase text-[9px] border-t border-slate-800 divide-x divide-slate-800">
                <th className="p-1 sticky left-0 bg-cyan-400 z-40 border-r border-slate-800"></th>
                <th className="p-1 sticky left-[50px] bg-cyan-400 z-40 border-r border-slate-800"></th>

                {/* Helper subheader generator */}
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
                    className={`p-1 text-center bg-cyan-400 cursor-pointer hover:bg-cyan-300 transition-colors select-none ${col.minW ? "min-w-[120px]" : "w-11"} ${col.borderRight ? "border-r border-slate-800" : ""}`}
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
                    className={`hover:bg-amber-100/60 transition-colors ${
                      isTku ? "bg-slate-200 font-black text-slate-900" : "bg-white"
                    }`}
                  >
                    {/* Area Column */}
                    <td
                      data-r={rIdx}
                      className="p-1.5 sticky left-0 bg-emerald-100/90 z-20 font-black text-red-700 border-r border-slate-300 text-center cursor-pointer hover:bg-emerald-200 transition-colors select-none"
                      onClick={() => selectRow(rIdx)}
                    >
                      {row.area}
                    </td>

                    {/* Nama Column */}
                    <td
                      data-r={rIdx}
                      className="p-1.5 sticky left-[50px] bg-emerald-100/90 z-20 font-black text-slate-900 truncate max-w-[120px] border-r border-slate-300 cursor-pointer hover:bg-emerald-200 transition-colors select-none"
                      onClick={() => selectRow(rIdx)}
                    >
                      {cleanYlName(row.nama)}
                    </td>

                    {/* PDM SEBELUMNYA Inputs */}
                    <td {...getCellProps(rIdx, 0)} className={`p-1 text-center text-red-700 font-extrabold bg-white border-r border-slate-200 ${getCellProps(rIdx, 0).className}`}>
                      <input
                        type="number"
                        min={0}
                        value={row.pdmSebelum.yo || ""}
                        onChange={e => handleCellChange(rIdx, "pdmSebelum", "yo", parseInputInt(e.target.value))}
                        onPaste={e => handleCellPaste(e, rIdx, 0)}
                        onFocus={e => e.target.select()}
                        onDragStart={e => e.preventDefault()}
                        className="w-full text-center bg-transparent outline-none focus:bg-amber-200 rounded font-black text-red-700"
                      />
                    </td>
                    <td {...getCellProps(rIdx, 1)} className={`p-1 text-center text-amber-800 font-extrabold bg-white border-r border-slate-200 ${getCellProps(rIdx, 1).className}`}>
                      <input
                        type="number"
                        min={0}
                        value={row.pdmSebelum.om || ""}
                        onChange={e => handleCellChange(rIdx, "pdmSebelum", "om", parseInputInt(e.target.value))}
                        onPaste={e => handleCellPaste(e, rIdx, 1)}
                        onFocus={e => e.target.select()}
                        onDragStart={e => e.preventDefault()}
                        className="w-full text-center bg-transparent outline-none focus:bg-amber-200 rounded font-black text-amber-800"
                      />
                    </td>
                    <td {...getCellProps(rIdx, 2)} className={`p-1 text-center text-fuchsia-800 font-extrabold bg-white border-r border-slate-200 ${getCellProps(rIdx, 2).className}`}>
                      <input
                        type="number"
                        min={0}
                        value={row.pdmSebelum.os || ""}
                        onChange={e => handleCellChange(rIdx, "pdmSebelum", "os", parseInputInt(e.target.value))}
                        onPaste={e => handleCellPaste(e, rIdx, 2)}
                        onFocus={e => e.target.select()}
                        onDragStart={e => e.preventDefault()}
                        className="w-full text-center bg-transparent outline-none focus:bg-amber-200 rounded font-black text-fuchsia-800"
                      />
                    </td>
                    <td {...getCellProps(rIdx, 3)} className={`p-1 text-center text-blue-800 font-extrabold bg-white border-r-2 border-slate-400 ${getCellProps(rIdx, 3).className}`}>
                      <input
                        type="number"
                        min={0}
                        value={row.pdmSebelum.yt || ""}
                        onChange={e => handleCellChange(rIdx, "pdmSebelum", "yt", parseInputInt(e.target.value))}
                        onPaste={e => handleCellPaste(e, rIdx, 3)}
                        onFocus={e => e.target.select()}
                        onDragStart={e => e.preventDefault()}
                        className="w-full text-center bg-transparent outline-none focus:bg-amber-200 rounded font-black text-blue-800"
                      />
                    </td>

                    {/* BB (Barang Bawaan) Inputs - Soft Red / Pink Highlights */}
                    <td {...getCellProps(rIdx, 4)} className={`p-1 text-center text-red-700 font-bold bg-rose-50 border-r border-slate-200 ${getCellProps(rIdx, 4).className}`}>
                      <input
                        type="number"
                        min={0}
                        value={row.bb.yo || ""}
                        onChange={e => handleCellChange(rIdx, "bb", "yo", parseInputInt(e.target.value))}
                        onPaste={e => handleCellPaste(e, rIdx, 4)}
                        onFocus={e => e.target.select()}
                        onDragStart={e => e.preventDefault()}
                        className="w-full text-center bg-transparent font-black outline-none focus:bg-rose-200 rounded text-red-700"
                      />
                    </td>
                    <td {...getCellProps(rIdx, 5)} className={`p-1 text-center text-amber-800 font-bold bg-rose-50 border-r border-slate-200 ${getCellProps(rIdx, 5).className}`}>
                      <input
                        type="number"
                        min={0}
                        value={row.bb.om || ""}
                        onChange={e => handleCellChange(rIdx, "bb", "om", parseInputInt(e.target.value))}
                        onPaste={e => handleCellPaste(e, rIdx, 5)}
                        onFocus={e => e.target.select()}
                        onDragStart={e => e.preventDefault()}
                        className="w-full text-center bg-transparent font-black outline-none focus:bg-rose-200 rounded text-amber-800"
                      />
                    </td>
                    <td {...getCellProps(rIdx, 6)} className={`p-1 text-center text-fuchsia-800 font-bold bg-rose-50 border-r border-slate-200 ${getCellProps(rIdx, 6).className}`}>
                      <input
                        type="number"
                        min={0}
                        value={row.bb.os || ""}
                        onChange={e => handleCellChange(rIdx, "bb", "os", parseInputInt(e.target.value))}
                        onPaste={e => handleCellPaste(e, rIdx, 6)}
                        onFocus={e => e.target.select()}
                        onDragStart={e => e.preventDefault()}
                        className="w-full text-center bg-transparent font-black outline-none focus:bg-rose-200 rounded text-fuchsia-800"
                      />
                    </td>
                    <td {...getCellProps(rIdx, 7)} className={`p-1 text-center text-blue-800 font-bold bg-rose-50 border-r-2 border-slate-400 ${getCellProps(rIdx, 7).className}`}>
                      <input
                        type="number"
                        min={0}
                        value={row.bb.yt || ""}
                        onChange={e => handleCellChange(rIdx, "bb", "yt", parseInputInt(e.target.value))}
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

                    {/* SETORAN Column (Auto Formula: Terjual x Harga per Produk) */}
                    <td {...getCellProps(rIdx, 12)} className={`p-1 text-right font-bold text-slate-900 bg-amber-50 border-r-2 border-slate-400 font-mono ${getCellProps(rIdx, 12).className}`}>
                      Rp {row.totalSetoran.toLocaleString("id-ID")}
                    </td>

                    {/* PDM HARI INI Inputs */}
                    <td {...getCellProps(rIdx, 13)} className={`p-1 text-center text-red-700 font-bold bg-white border-r border-slate-200 ${getCellProps(rIdx, 13).className}`}>
                      <input
                        type="number"
                        min={0}
                        value={row.pdmHariIni.yo || ""}
                        onChange={e => handleCellChange(rIdx, "pdmHariIni", "yo", parseInputInt(e.target.value))}
                        onPaste={e => handleCellPaste(e, rIdx, 13)}
                        onFocus={e => e.target.select()}
                        className="w-full text-center bg-transparent outline-none focus:bg-amber-200 rounded font-black text-red-700"
                      />
                    </td>
                    <td {...getCellProps(rIdx, 14)} className={`p-1 text-center text-amber-800 font-bold bg-white border-r border-slate-200 ${getCellProps(rIdx, 14).className}`}>
                      <input
                        type="number"
                        min={0}
                        value={row.pdmHariIni.om || ""}
                        onChange={e => handleCellChange(rIdx, "pdmHariIni", "om", parseInputInt(e.target.value))}
                        onPaste={e => handleCellPaste(e, rIdx, 14)}
                        onFocus={e => e.target.select()}
                        className="w-full text-center bg-transparent outline-none focus:bg-amber-200 rounded font-black text-amber-800"
                      />
                    </td>
                    <td {...getCellProps(rIdx, 15)} className={`p-1 text-center text-fuchsia-800 font-bold bg-white border-r border-slate-200 ${getCellProps(rIdx, 15).className}`}>
                      <input
                        type="number"
                        min={0}
                        value={row.pdmHariIni.os || ""}
                        onChange={e => handleCellChange(rIdx, "pdmHariIni", "os", parseInputInt(e.target.value))}
                        onPaste={e => handleCellPaste(e, rIdx, 15)}
                        onFocus={e => e.target.select()}
                        className="w-full text-center bg-transparent outline-none focus:bg-amber-200 rounded font-black text-fuchsia-800"
                      />
                    </td>
                    <td {...getCellProps(rIdx, 16)} className={`p-1 text-center text-blue-800 font-bold bg-white border-r-2 border-slate-400 ${getCellProps(rIdx, 16).className}`}>
                      <input
                        type="number"
                        min={0}
                        value={row.pdmHariIni.yt || ""}
                        onChange={e => handleCellChange(rIdx, "pdmHariIni", "yt", parseInputInt(e.target.value))}
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
            <tfoot className="bg-amber-200 font-black text-slate-950 border-t-2 border-slate-800">
              {/* Row 1: Subtotal Item Totals */}
              <tr className="text-[11px] divide-x divide-slate-400">
                <td className="p-2 sticky left-0 bg-amber-300 z-20 italic text-left" colSpan={2}>
                  Total
                </td>

                {/* PDM SEBELUM Total */}
                <td className="p-1.5 text-center text-red-700 font-black">{totals.pdmSebelum.yo}</td>
                <td className="p-1.5 text-center text-amber-800 font-black">{totals.pdmSebelum.om}</td>
                <td className="p-1.5 text-center text-fuchsia-800 font-black">{totals.pdmSebelum.os}</td>
                <td className="p-1.5 text-center text-blue-800 font-black border-r-2 border-slate-400">
                  {totals.pdmSebelum.yt}
                </td>

                {/* BB Total */}
                <td className="p-1.5 text-center text-red-700 font-black">{totals.bb.yo}</td>
                <td className="p-1.5 text-center text-amber-800 font-black">{totals.bb.om}</td>
                <td className="p-1.5 text-center text-fuchsia-800 font-black">{totals.bb.os}</td>
                <td className="p-1.5 text-center text-blue-800 font-black border-r-2 border-slate-400">
                  {totals.bb.yt}
                </td>

                {/* TERJUAL Total */}
                <td className="p-1.5 text-center text-red-700 font-black">{totals.terjual.yo}</td>
                <td className="p-1.5 text-center text-amber-800 font-black">{totals.terjual.om}</td>
                <td className="p-1.5 text-center text-fuchsia-800 font-black">{totals.terjual.os}</td>
                <td className="p-1.5 text-center text-blue-800 font-black border-r-2 border-slate-400">
                  {totals.terjual.yt}
                </td>

                {/* SETORAN Total */}
                <td className="p-1 text-right text-xs bg-emerald-300 text-emerald-950 font-black border-r-2 border-slate-400">
                  Rp {totals.setoran.setor.toLocaleString("id-ID")}
                </td>

                {/* PDM HARI INI Total */}
                <td className="p-1.5 text-center text-red-700 font-black">{totals.pdmHariIni.yo}</td>
                <td className="p-1.5 text-center text-amber-800 font-black">{totals.pdmHariIni.om}</td>
                <td className="p-1.5 text-center text-fuchsia-800 font-black">{totals.pdmHariIni.os}</td>
                <td className="p-1.5 text-center text-blue-800 font-black border-r-2 border-slate-400">
                  {totals.pdmHariIni.yt}
                </td>

                {/* TURUN Total */}
                <td className="p-1.5 text-center text-red-700 font-black">{totals.turun.yo}</td>
                <td className="p-1.5 text-center text-amber-800 font-black">{totals.turun.om}</td>
                <td className="p-1.5 text-center text-fuchsia-800 font-black">{totals.turun.os}</td>
                <td className="p-1.5 text-center text-blue-800 font-black">{totals.turun.yt}</td>
              </tr>

              {/* Row 2: Grand Total Combined Bottle Sum (Total Yo, Om, Os & Yt) */}
              <tr className="bg-emerald-600 text-slate-950 font-black text-xs uppercase divide-x divide-slate-800">
                <td className="p-2 sticky left-0 bg-emerald-500 z-20 text-left" colSpan={2}>
                  Total Yo, Om, Os & Yt
                </td>

                <td colSpan={4} className="p-2 text-center bg-emerald-300 border-r-2 border-slate-800 font-black text-slate-950">
                  {totals.pdmSebelum.sum}
                </td>

                <td colSpan={4} className="p-2 text-center bg-emerald-300 border-r-2 border-slate-800 font-black text-slate-950">
                  {totals.bb.sum}
                </td>

                <td colSpan={4} className="p-2 text-center bg-emerald-300 border-r-2 border-slate-800 font-black text-slate-950">
                  {totals.terjual.sum}
                </td>

                <td colSpan={1} className="p-2 text-center bg-emerald-200 border-r-2 border-slate-800 font-black text-slate-950">
                  Rp {totals.setoran.setor.toLocaleString("id-ID")}
                </td>

                <td colSpan={4} className="p-2 text-center bg-emerald-300 border-r-2 border-slate-800 font-black text-slate-950">
                  {totals.pdmHariIni.sum}
                </td>

                <td colSpan={4} className="p-2 text-center bg-emerald-300 font-black text-slate-950">
                  {totals.turun.sum}
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
