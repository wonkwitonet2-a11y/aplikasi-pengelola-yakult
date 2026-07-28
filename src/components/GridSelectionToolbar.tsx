import React from "react";
import { Copy, Scissors, ClipboardPaste, Trash2, X, CheckSquare } from "lucide-react";

export interface GridSelectionToolbarProps {
  selection: any;
  onCopy: () => void;
  onCut: () => void;
  onPaste: () => void;
  onClear: () => void;
  onClose: () => void;
  onSelectAll?: () => void;
}

export function GridSelectionToolbar({
  selection,
  onCopy,
  onCut,
  onPaste,
  onClear,
  onClose,
  onSelectAll
}: GridSelectionToolbarProps) {
  if (!selection) return null;

  const rows = Math.abs(selection.endR - selection.startR) + 1;
  const cols = Math.abs(selection.endC - selection.startC) + 1;
  const totalCells = rows * cols;

  return (
    <div className="sticky top-0 left-0 right-0 z-50 bg-slate-900 text-white p-2 px-3 flex flex-wrap items-center justify-between gap-2 shadow-2xl mb-2 rounded-xl border border-slate-700/80 backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-150">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold bg-blue-600/30 text-blue-300 border border-blue-500/40 px-2 py-0.5 rounded-md flex items-center gap-1 font-mono">
          <span>{rows}x{cols}</span>
          <span className="text-[10px] text-slate-300 font-normal">({totalCells} sel)</span>
        </span>
        <span className="text-[11px] font-medium text-slate-300 hidden sm:inline">
          Blok Terpilih
        </span>
      </div>

      <div className="flex items-center gap-1">
        {onSelectAll && (
          <button
            onClick={onSelectAll}
            className="px-2 py-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition-colors text-xs flex items-center gap-1 font-medium"
            title="Pilih Semua Sel Tabel (Ctrl+A)"
          >
            <CheckSquare size={14} className="text-indigo-400" />
            <span className="hidden md:inline">Semua</span>
          </button>
        )}

        <button
          onClick={onCopy}
          className="px-2 py-1 hover:bg-slate-800 rounded text-blue-400 hover:text-blue-300 transition-colors text-xs flex items-center gap-1 font-semibold"
          title="Salin ke Clipboard (Ctrl+C)"
        >
          <Copy size={14} />
          <span className="hidden sm:inline">Salin</span>
        </button>

        <button
          onClick={onCut}
          className="px-2 py-1 hover:bg-slate-800 rounded text-amber-400 hover:text-amber-300 transition-colors text-xs flex items-center gap-1 font-semibold"
          title="Potong (Ctrl+X)"
        >
          <Scissors size={14} />
          <span className="hidden sm:inline">Potong</span>
        </button>

        <button
          onClick={onPaste}
          className="px-2 py-1 hover:bg-slate-800 rounded text-emerald-400 hover:text-emerald-300 transition-colors text-xs flex items-center gap-1 font-semibold"
          title="Tempel Teks/Tabel (Ctrl+V)"
        >
          <ClipboardPaste size={14} />
          <span className="hidden sm:inline">Tempel</span>
        </button>

        <button
          onClick={onClear}
          className="px-2 py-1 hover:bg-slate-800 rounded text-rose-400 hover:text-rose-300 transition-colors text-xs flex items-center gap-1 font-semibold"
          title="Kosongkan Nilai Sel (Delete / Backspace)"
        >
          <Trash2 size={14} />
          <span className="hidden sm:inline">Hapus</span>
        </button>

        <div className="w-px h-5 bg-slate-700 mx-1"></div>

        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
          title="Tutup Seleksi (Esc)"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

