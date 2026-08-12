import React from "react";
import { NumberInput } from "./NumberInput";
import type { GridSelection } from "./useSimpleGrid";

interface BreakdownGridRowProps {
  yl: any;
  rIdx: number;
  activeGridMap: any;
  targetYLMap: any;
  breakdownDateRange: string;
  gridSelection: GridSelection | null;
  isFillDragging: boolean;
  fillHoverCell: { r: number; c: number } | null;
  isGridDragging: boolean;
  touchStartRef: React.MutableRefObject<any>;
  setGridSelection: React.Dispatch<React.SetStateAction<GridSelection | null>>;
  setIsGridDragging: (val: boolean) => void;
  setFillHoverCell: React.Dispatch<React.SetStateAction<{ r: number; c: number } | null>>;
  handleTouchMoveGrid: (e: React.TouchEvent) => void;
  handleBreakdownCellChange: (area: string, day: number, item: "yo" | "om" | "os" | "yt", val: number) => void;
  handlePasteIntoGrid: (text: string, origin: { r: number; c: number }) => void;
  setIsBreakdownMenuOpen?: (open: boolean) => void;
  setBreakdownMenuPos?: (pos: { x: number; y: number } | null) => void;
}

// This is the heaviest part of ManagerView: one <tr> per YL, each with up to
// 31 days x 4 items = 124 editable cells (~1,240 cells total across all YLs).
// It used to be rendered inline inside ManagerView's giant render function,
// which meant ANY unrelated state change anywhere in ManagerView (e.g. the
// 20s background data refresh, opening the AI chatbot, toggling something in
// a totally different tab) forced React to re-evaluate every single one of
// these cells. Extracting it into its own React.memo'd component means it
// only re-renders when something it actually depends on changes.
function BreakdownGridRowInner({
  yl,
  rIdx,
  activeGridMap,
  targetYLMap,
  breakdownDateRange,
  gridSelection,
  isFillDragging,
  fillHoverCell,
  isGridDragging,
  touchStartRef,
  setGridSelection,
  setIsGridDragging,
  setFillHoverCell,
  handleTouchMoveGrid,
  handleBreakdownCellChange,
  handlePasteIntoGrid,
  setIsBreakdownMenuOpen,
  setBreakdownMenuPos,
}: BreakdownGridRowProps) {
  const clickStartRef = React.useRef<{ r: number; c: number; x: number; y: number; wasInside: boolean; isMoved: boolean } | null>(null);
  const area = String(yl.area).substring(0, 3);
  const ylPlan = activeGridMap[area] || { pembagiTanggal: 25, days: {} };

  // Compute grand totals
  let totYo = 0, totOm = 0, totOs = 0, totYt = 0;
  Object.values(ylPlan.days || {}).forEach((d: any) => {
    totYo += Number(d.yo) || 0;
    totOm += Number(d.om) || 0;
    totOs += Number(d.os) || 0;
    totYt += Number(d.yt) || 0;
  });
  const grandTotal = totYo + totOm + totOs + totYt;

  // Active pembagi calculation
  const activePembagi = ylPlan.pembagiTanggal || 25;

  // Rata-rata 4 Item + Total
  const avgYo = activePembagi > 0 ? Math.round(totYo / activePembagi) : 0;
  const avgOm = activePembagi > 0 ? Math.round(totOm / activePembagi) : 0;
  const avgOs = activePembagi > 0 ? Math.round(totOs / activePembagi) : 0;
  const avgYt = activePembagi > 0 ? Math.round(totYt / activePembagi) : 0;
  const avgTotal = activePembagi > 0 ? Math.round(grandTotal / activePembagi) : 0;

  // Target calculation: Target manager per day * activePembagi
  const tgtObj = targetYLMap[area] || { target: 0, bln_lalu: 0, thn_lalu: 0 };
  const targetTotal = Math.round(tgtObj.target ?? 0) * activePembagi;
  const diffTarget = grandTotal - targetTotal;

  const blnLaluTotal = Math.round(tgtObj.bln_lalu ?? 0) * activePembagi;
  const diffLM = grandTotal - blnLaluTotal;

  const thnLaluTotal = Math.round(tgtObj.thn_lalu ?? 0) * activePembagi;
  const diffLY = grandTotal - thnLaluTotal;

  const daysList = (
    breakdownDateRange === "1-10" ? Array.from({ length: 10 }, (_, i) => i + 1) :
    breakdownDateRange === "11-20" ? Array.from({ length: 10 }, (_, i) => i + 11) :
    breakdownDateRange === "21-31" ? Array.from({ length: 11 }, (_, i) => i + 21) :
    Array.from({ length: 31 }, (_, i) => i + 1)
  );

  const items: Array<"yo" | "om" | "os" | "yt"> = ["yo", "om", "os", "yt"];

  return (
    <tr className="hover:bg-red-50/40 transition-colors divide-x divide-slate-100 optimized-table-row">
      {/* YL Name Sticky Cell */}
      <td className="p-2 sticky left-0 bg-white z-20 font-black text-slate-900 truncate min-w-[120px] max-w-[140px] shadow-r border-r border-slate-200">
        <span className="text-red-600 font-mono mr-1">[{area}]</span>
        <span>{yl.nama.replace(/^\d+\s*/, "")}</span>
      </td>

      {/* Day inputs with spreadsheet block selection */}
      {daysList.flatMap(day => {
        const dData = ylPlan.days?.[String(day)] || { yo: 0, om: 0, os: 0, yt: 0 };

        return items.map((item, itemIdx) => {
          const cIdx = (day - 1) * 4 + itemIdx;

          const baseMinR = gridSelection ? Math.min(gridSelection.startR, gridSelection.endR) : -1;
          const baseMaxR = gridSelection ? Math.max(gridSelection.startR, gridSelection.endR) : -1;
          const baseMinC = gridSelection ? Math.min(gridSelection.startC, gridSelection.endC) : -1;
          const baseMaxC = gridSelection ? Math.max(gridSelection.startC, gridSelection.endC) : -1;

          // Target fill drag range includes original range and dragged extension
          const activeMinR = isFillDragging && fillHoverCell ? Math.min(baseMinR, fillHoverCell.r) : baseMinR;
          const activeMaxR = isFillDragging && fillHoverCell ? Math.max(baseMaxR, fillHoverCell.r) : baseMaxR;
          const activeMinC = isFillDragging && fillHoverCell ? Math.min(baseMinC, fillHoverCell.c) : baseMinC;
          const activeMaxC = isFillDragging && fillHoverCell ? Math.max(baseMaxC, fillHoverCell.c) : baseMaxC;

          const isSelected = gridSelection && rIdx >= activeMinR && rIdx <= activeMaxR && cIdx >= activeMinC && cIdx <= activeMaxC;
          const isOriginalSelection = gridSelection && rIdx >= baseMinR && rIdx <= baseMaxR && cIdx >= baseMinC && cIdx <= baseMaxC;
          const isFillExtended = isFillDragging && isSelected && !isOriginalSelection;

          const isCornerCell = gridSelection && rIdx === activeMaxR && cIdx === activeMaxC;

          const itemColors = {
            yo: "text-red-600 focus:border-red-500",
            om: "text-amber-600 focus:border-amber-500",
            os: "text-pink-600 focus:border-pink-500",
            yt: "text-blue-600 focus:border-blue-500"
          };

          return (
            <td
              key={`${area}-${day}-${item}`}
              data-r={rIdx}
              data-c={cIdx}
              className={`p-0.5 text-center transition-colors cursor-cell relative select-none ${
                isGridDragging || isFillDragging ? "touch-none" : ""
              } ${
                isCornerCell
                  ? "bg-blue-200/90 ring-2 ring-blue-600 z-30"
                  : isFillExtended
                  ? "bg-blue-100/90 ring-2 ring-blue-400 border-2 border-dashed border-blue-500 z-20"
                  : isSelected
                  ? "bg-blue-200/80 ring-2 ring-blue-500 z-10"
                  : "hover:bg-slate-100"
              }`}
              onMouseDown={(e) => {
                if (touchStartRef.current) return;
                const wasInside = Boolean(isSelected);
                clickStartRef.current = { r: rIdx, c: cIdx, x: e.clientX, y: e.clientY, wasInside, isMoved: false };
                if (!wasInside) {
                  setIsBreakdownMenuOpen?.(false);
                }
                if (e.shiftKey && gridSelection) {
                  setGridSelection(prev => prev ? { ...prev, endR: rIdx, endC: cIdx } : { startR: rIdx, startC: cIdx, endR: rIdx, endC: cIdx });
                } else if (!wasInside) {
                  setGridSelection({ startR: rIdx, startC: cIdx, endR: rIdx, endC: cIdx });
                  setIsGridDragging(true);
                } else {
                  setIsGridDragging(true);
                }
              }}
              onMouseEnter={() => {
                if (clickStartRef.current) clickStartRef.current.isMoved = true;
                setIsBreakdownMenuOpen?.(false);
                if (isFillDragging) {
                  setFillHoverCell(prev => (prev && prev.r === rIdx && prev.c === cIdx) ? prev : { r: rIdx, c: cIdx });
                } else if (isGridDragging) {
                  setGridSelection(prev => {
                    if (!prev) return { startR: rIdx, startC: cIdx, endR: rIdx, endC: cIdx };
                    if (prev.endR === rIdx && prev.endC === cIdx) return prev;
                    return { ...prev, endR: rIdx, endC: cIdx };
                  });
                }
              }}
              onClick={(e) => {
                if (clickStartRef.current && clickStartRef.current.wasInside && !clickStartRef.current.isMoved) {
                  setIsBreakdownMenuOpen?.(true);
                  setBreakdownMenuPos?.({ x: e.clientX || clickStartRef.current.x, y: e.clientY || clickStartRef.current.y });
                }
                clickStartRef.current = null;
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                if (!isSelected) {
                  setGridSelection({ startR: rIdx, startC: cIdx, endR: rIdx, endC: cIdx });
                }
                setIsBreakdownMenuOpen?.(true);
                setBreakdownMenuPos?.({ x: e.clientX, y: e.clientY });
              }}
              onTouchStart={(e) => {
                if (!e.touches || e.touches.length === 0) return;
                const touch = e.touches[0];
                let isInside = Boolean(isSelected);
                touchStartRef.current = {
                  clientX: touch.clientX,
                  clientY: touch.clientY,
                  r: rIdx,
                  c: cIdx,
                  isInsideSelection: isInside,
                  hasMoved: false
                };
                if (!isInside) {
                  setIsBreakdownMenuOpen?.(false);
                  setIsGridDragging(false);
                } else {
                  setIsGridDragging(true);
                }
              }}
              onTouchEnd={() => {
                if (touchStartRef.current && !touchStartRef.current.hasMoved && touchStartRef.current.isInsideSelection) {
                  setIsBreakdownMenuOpen?.(true);
                  setBreakdownMenuPos?.({ x: touchStartRef.current.clientX, y: touchStartRef.current.clientY });
                }
                touchStartRef.current = null;
              }}
              onTouchMove={handleTouchMoveGrid}
            >
              <NumberInput
                min={0}
                value={dData[item] || 0}
                onChange={(val) => handleBreakdownCellChange(area, day, item, Math.max(0, val))}
                onPaste={(e) => {
                  const text = e.clipboardData.getData("text/plain");
                  if (!text) return;
                  const clean = text.trim();
                  if (/[\t\n\r,;/|\s]/.test(clean) || clean.length > 0) {
                    e.preventDefault();
                    setGridSelection({ startR: rIdx, startC: cIdx, endR: rIdx, endC: cIdx });
                    setTimeout(() => {
                      handlePasteIntoGrid(text, { r: rIdx, c: cIdx });
                    }, 0);
                  }
                }}
                onFocus={() => {
                  if (!gridSelection) {
                    setGridSelection({ startR: rIdx, startC: cIdx, endR: rIdx, endC: cIdx });
                  }
                }}
                className={`w-10 text-center text-[11px] font-bold py-1 border rounded outline-none ${
                  isSelected ? "bg-blue-100 border-blue-400 ring-1 ring-blue-400" : "bg-slate-50 focus:bg-white border-slate-200"
                } ${itemColors[item]}`}
              />
            </td>
          );
        });
      })}

      {/* AKUMULASI 4 ITEM + TOTAL */}
      <td className="p-1 text-center font-bold text-red-700 bg-red-50/50 select-text cursor-text">{totYo}</td>
      <td className="p-1 text-center font-bold text-amber-700 bg-amber-50/50 select-text cursor-text">{totOm}</td>
      <td className="p-1 text-center font-bold text-pink-700 bg-pink-50/50 select-text cursor-text">{totOs}</td>
      <td className="p-1 text-center font-bold text-blue-700 bg-blue-50/50 select-text cursor-text">{totYt}</td>
      <td className="p-1 text-center font-black text-white bg-red-800 select-text cursor-text">{grandTotal}</td>

      {/* RATA-RATA 4 ITEM + TOTAL */}
      <td className="p-1 text-center font-bold text-red-800 bg-amber-50/30 select-text cursor-text">{avgYo}</td>
      <td className="p-1 text-center font-bold text-amber-800 bg-amber-50/30 select-text cursor-text">{avgOm}</td>
      <td className="p-1 text-center font-bold text-pink-800 bg-amber-50/30 select-text cursor-text">{avgOs}</td>
      <td className="p-1 text-center font-bold text-blue-800 bg-amber-50/30 select-text cursor-text">{avgYt}</td>
      <td className="p-1 text-center font-black text-amber-950 bg-amber-200 select-text cursor-text">{avgTotal}</td>

      {/* VALUASI vs TARGET MANAGER */}
      <td className="p-1 text-center font-bold text-purple-900 bg-purple-50 select-text cursor-text">{targetTotal}</td>
      <td className={`p-1 text-center font-black select-text cursor-text ${diffTarget >= 0 ? "text-emerald-700 bg-emerald-100" : "text-rose-700 bg-rose-100"}`}>
        {diffTarget >= 0 ? `+${diffTarget}` : diffTarget}
      </td>
      <td className="p-1 text-center font-bold text-indigo-900 bg-indigo-50 select-text cursor-text">{blnLaluTotal}</td>
      <td className={`p-1 text-center font-black select-text cursor-text ${diffLM >= 0 ? "text-emerald-700 bg-emerald-50" : "text-rose-700 bg-rose-50"}`}>
        {diffLM >= 0 ? `+${diffLM}` : diffLM}
      </td>
      <td className="p-1 text-center font-bold text-teal-900 bg-teal-50 select-text cursor-text">{thnLaluTotal}</td>
      <td className={`p-1 text-center font-black select-text cursor-text ${diffLY >= 0 ? "text-emerald-700 bg-emerald-50" : "text-rose-700 bg-rose-50"}`}>
        {diffLY >= 0 ? `+${diffLY}` : diffLY}
      </td>
    </tr>
  );
}


function areEqual(prev, next) {
  if (prev.yl.area !== next.yl.area) return false;
  if (prev.breakdownDateRange !== next.breakdownDateRange) return false;
  
  const area = String(prev.yl.area).substring(0, 3);
  if (prev.activeGridMap[area] !== next.activeGridMap[area]) return false;
  if (prev.targetYLMap[area] !== next.targetYLMap[area]) return false;

  const isRowInSelection = (sel, rIdx) => {
    if (!sel) return false;
    return rIdx >= Math.min(sel.startR, sel.endR) && rIdx <= Math.max(sel.startR, sel.endR);
  };
  
  const wasSelected = isRowInSelection(prev.gridSelection, prev.rIdx);
  const isSelected = isRowInSelection(next.gridSelection, next.rIdx);
  
  // If selection changed and this row is involved in either the old or new selection
  if ((wasSelected || isSelected) && prev.gridSelection !== next.gridSelection) return false;

  const isRowInFill = (sel, hover, rIdx) => {
    if (!sel || !hover) return false;
    const baseMin = Math.min(sel.startR, sel.endR);
    const baseMax = Math.max(sel.startR, sel.endR);
    const actMin = Math.min(baseMin, hover.r);
    const actMax = Math.max(baseMax, hover.r);
    return rIdx >= actMin && rIdx <= actMax;
  };

  const wasInFill = prev.isFillDragging && isRowInFill(prev.gridSelection, prev.fillHoverCell, prev.rIdx);
  const isInFill = next.isFillDragging && isRowInFill(next.gridSelection, next.fillHoverCell, next.rIdx);
  
  if ((wasInFill || isInFill) && (prev.fillHoverCell !== next.fillHoverCell || prev.isFillDragging !== next.isFillDragging)) return false;

  return true;
}

export const BreakdownGridRow = React.memo(BreakdownGridRowInner, areEqual);

