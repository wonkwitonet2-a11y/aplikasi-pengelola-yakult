import React from "react";
import { NumberInput } from "./NumberInput";
import { cleanYlName } from "../types";

interface TargetManagerRowProps {
  yl: any;
  idx: number;
  targetYLMap: Record<string, { target: number; bln_lalu: number; thn_lalu: number }>;
  setTargetYLMap: React.Dispatch<
    React.SetStateAction<Record<string, { target: number; bln_lalu: number; thn_lalu: number }>>
  >;
  getTargetCellProps: (r: number, c: number) => { className?: string; [key: string]: any };
  selectTargetRow: (idx: number) => void;
  setTargetGridSelection: any;
  handleTargetGridPaste: any;
}

// One row of the "Target Manager" table (Target / Bulan Lalu / Tahun Lalu per
// YL). Same idea as BreakdownGridRow: pulled out of ManagerView's giant render
// function and memoized so it only re-renders when its own data actually
// changes, not on every unrelated state update elsewhere in the page.
function TargetManagerRowInner({
  yl,
  idx,
  targetYLMap,
  setTargetYLMap,
  getTargetCellProps,
  selectTargetRow,
  setTargetGridSelection,
  handleTargetGridPaste
}: TargetManagerRowProps) {
  const ylTgt = targetYLMap[yl.area] ?? { target: 0, bln_lalu: 0, thn_lalu: 0 };

  return (
    <tr className="hover:bg-amber-50/50 transition-colors">
      <td
        data-r={idx}
        className="p-2.5 border-r-2 border-slate-300 bg-slate-50/80 cursor-pointer hover:bg-amber-100 transition-colors select-none"
        onClick={() => selectTargetRow(idx)}
      >
        <span className="text-red-700 font-black mr-2">{yl.area}</span>
        <span className="text-slate-950 font-black">{cleanYlName(yl.nama)}</span>
      </td>
      <td {...getTargetCellProps(idx, 0)} className={`p-1.5 text-center border-r border-slate-300 ${getTargetCellProps(idx, 0).className}`}>
        <NumberInput
          min={0}
          value={ylTgt.target}
          onPaste={(e) => {
            const text = e.clipboardData.getData("text/plain");
            if (!text) return;
            e.preventDefault();
            const newSel = { startR: idx, startC: 0, endR: idx, endC: 0 };
            setTargetGridSelection(newSel);
            setTimeout(() => {
              handleTargetGridPaste(text, newSel);
            }, 0);
          }}
          onChange={(val) => {
            setTargetYLMap((prev: any) => ({
              ...prev,
              [yl.area]: { ...prev[yl.area], target: val }
            }));
          }}
          className="w-full h-full p-1.5 text-xs sm:text-sm bg-transparent outline-none border-none text-center font-black text-slate-900"
        />
      </td>
      <td {...getTargetCellProps(idx, 1)} className={`p-1.5 text-center border-r border-slate-300 ${getTargetCellProps(idx, 1).className}`}>
        <NumberInput
          min={0}
          value={ylTgt.bln_lalu}
          onPaste={(e) => {
            const text = e.clipboardData.getData("text/plain");
            if (!text) return;
            e.preventDefault();
            const newSel = { startR: idx, startC: 1, endR: idx, endC: 1 };
            setTargetGridSelection(newSel);
            setTimeout(() => {
              handleTargetGridPaste(text, newSel);
            }, 0);
          }}
          onChange={(val) => {
            setTargetYLMap((prev: any) => ({
              ...prev,
              [yl.area]: { ...prev[yl.area], bln_lalu: val }
            }));
          }}
          className="w-full h-full p-1.5 text-xs sm:text-sm bg-transparent outline-none border-none text-center font-black text-slate-900"
        />
      </td>
      <td {...getTargetCellProps(idx, 2)} className={`p-1.5 text-center border-r border-slate-300 ${getTargetCellProps(idx, 2).className}`}>
        <NumberInput
          min={0}
          value={ylTgt.thn_lalu}
          onPaste={(e) => {
            const text = e.clipboardData.getData("text/plain");
            if (!text) return;
            e.preventDefault();
            const newSel = { startR: idx, startC: 2, endR: idx, endC: 2 };
            setTargetGridSelection(newSel);
            setTimeout(() => {
              handleTargetGridPaste(text, newSel);
            }, 0);
          }}
          onChange={(val) => {
            setTargetYLMap((prev: any) => ({
              ...prev,
              [yl.area]: { ...prev[yl.area], thn_lalu: val }
            }));
          }}
          className="w-full h-full p-1.5 text-xs sm:text-sm bg-transparent outline-none border-none text-center font-black text-slate-900"
        />
      </td>
    </tr>
  );
}

export const TargetManagerRow = React.memo(TargetManagerRowInner);
