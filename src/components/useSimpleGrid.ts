import React, { useState, useEffect, useCallback, } from "react";

export interface GridSelection {
  startR: number;
  startC: number;
  endR: number;
  endC: number;
}

export interface UseSimpleGridProps {
  totalRows: number;
  totalCols: number;
  isCellEditable?: (r: number, c: number) => boolean;
  getCellValue?: (r: number, c: number) => number | string;
  setCellValue?: (r: number, c: number, val: number | string) => void;
  setBatchCellValues?: (updates: { r: number; c: number; val: number | string }[]) => void;
  onRecordUndo?: () => void;
}

export function useSimpleGrid({
  totalRows,
  totalCols,
  isCellEditable = () => true,
  getCellValue,
  setCellValue,
  setBatchCellValues,
  onRecordUndo,
}: UseSimpleGridProps) {
  const [selection, setSelection] = useState<GridSelection | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [internalClipboard, setInternalClipboard] = useState<string[][] | null>(null);

  const minR = selection ? Math.min(selection.startR, selection.endR) : 0;
  const maxR = selection ? Math.max(selection.startR, selection.endR) : 0;
  const minC = selection ? Math.min(selection.startC, selection.endC) : 0;
  const maxC = selection ? Math.max(selection.startC, selection.endC) : 0;

  const isSelected = useCallback(
    (r: number, c: number) => {
      if (!selection) return false;
      return r >= minR && r <= maxR && c >= minC && c <= maxC;
    },
    [selection, minR, maxR, minC, maxC]
  );

  const isActiveCell = useCallback(
    (r: number, c: number) => {
      if (!selection) return false;
      return r === selection.endR && c === selection.endC;
    },
    [selection]
  );

  const showToast = useCallback((msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  }, []);

  const handleCopy = useCallback(() => {
    if (!selection || !getCellValue) return;
    const rowsArr: string[][] = [];
    for (let r = minR; r <= maxR; r++) {
      const rowData: string[] = [];
      for (let c = minC; c <= maxC; c++) {
        rowData.push(String(getCellValue(r, c) ?? ""));
      }
      rowsArr.push(rowData);
    }
    const tsv = rowsArr.map(row => row.join("\t")).join("\n");
    navigator.clipboard.writeText(tsv).catch(() => {});
    setInternalClipboard(rowsArr);
    
    const cellCount = (maxR - minR + 1) * (maxC - minC + 1);
    showToast(`📋 ${cellCount} sel berhasil disalin`);
  }, [selection, minR, maxR, minC, maxC, getCellValue, showToast]);

  const handleClear = useCallback(() => {
    if (!selection || (!setCellValue && !setBatchCellValues)) return;
    onRecordUndo?.();

    let clearedCount = 0;
    const updates: { r: number; c: number; val: number | string }[] = [];

    for (let r = minR; r <= maxR; r++) {
      for (let c = minC; c <= maxC; c++) {
        if (isCellEditable(r, c)) {
          updates.push({ r, c, val: 0 });
          clearedCount++;
        }
      }
    }

    if (setBatchCellValues) {
      setBatchCellValues(updates);
    } else if (setCellValue) {
      updates.forEach(u => setCellValue(u.r, u.c, u.val));
    }
    if (clearedCount > 0) showToast(`🗑️ ${clearedCount} sel dikosongkan`);
  }, [selection, minR, maxR, minC, maxC, isCellEditable, setCellValue, setBatchCellValues, onRecordUndo, showToast]);

  const handleCut = useCallback(() => {
    handleCopy();
    handleClear();
  }, [handleCopy, handleClear]);

  const handlePaste = useCallback(
    (pastedText?: any) => {
      if (!selection || (!setCellValue && !setBatchCellValues)) return;

      const processPaste = (text: string) => {
        const rawLines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
        if (rawLines.length > 1 && rawLines[rawLines.length - 1] === "") {
          rawLines.pop();
        }
        if (rawLines.length === 0) return;

        const isTabDelimited = rawLines.some(l => l.includes("\t"));

        const srcMatrix = rawLines.map(line => {
          if (isTabDelimited) {
            return line.split("\t");
          } else if (line.includes(";")) {
            return line.split(";");
          } else if (line.includes(",")) {
            return line.split(",");
          } else {
            return line.trim() ? line.trim().split(/\s+/) : [""];
          }
        });

        const srcHeight = srcMatrix.length;
        const srcWidth = Math.max(...srcMatrix.map(r => r.length));

        let pasteHeight = maxR - minR + 1;
        let pasteWidth = maxC - minC + 1;

        if (pasteHeight === 1 && pasteWidth === 1) {
          pasteHeight = srcHeight;
          pasteWidth = srcWidth;
        }

        onRecordUndo?.();

        const updates: { r: number; c: number; val: number | string }[] = [];
        let updatedCount = 0;

        for (let r = 0; r < pasteHeight; r++) {
          const targetR = minR + r;
          if (targetR >= totalRows) break;

          const srcR = r % srcHeight;
          const srcRow = srcMatrix[srcR] || [];

          for (let c = 0; c < pasteWidth; c++) {
            const targetC = minC + c;
            if (targetC >= totalCols) break;

            if (!isCellEditable(targetR, targetC)) continue;

            const srcC = c % srcWidth;
            let valStr = String(srcRow[srcC] || "0").trim();
            
            // Smart cleaning for numbers (currency symbols, thousand dots, decimal commas)
            let cleanStr = valStr.replace(/^[^\d-]+/, ""); // remove prefix non-digits like Rp
            if (cleanStr.includes(",") && cleanStr.includes(".")) {
              // Format 14.138,00 -> 14138
              cleanStr = cleanStr.split(",")[0].replace(/\./g, "");
            } else if (cleanStr.includes(".")) {
              // Could be 14.138 (thousand separator)
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
            const finalVal = isNaN(cleanNum) ? valStr : Math.max(0, cleanNum);

            updates.push({ r: targetR, c: targetC, val: finalVal });
            updatedCount++;
          }
        }

        if (setBatchCellValues) {
          setBatchCellValues(updates);
        } else if (setCellValue) {
          updates.forEach(u => setCellValue(u.r, u.c, u.val));
        }

        setSelection({
          startR: minR,
          startC: minC,
          endR: Math.min(totalRows - 1, minR + pasteHeight - 1),
          endC: Math.min(totalCols - 1, minC + pasteWidth - 1)
        });

        if (updatedCount > 0) showToast(`📥 ${updatedCount} sel dipaste`);
      };

      if (typeof pastedText === "string") {
        processPaste(pastedText);
      } else {
        navigator.clipboard.readText()
          .then(processPaste)
          .catch(() => {
            if (internalClipboard) {
              const text = internalClipboard.map(r => r.join("\t")).join("\n");
              processPaste(text);
            }
          });
      }
    },
    [selection, minR, maxR, minC, maxC, totalRows, totalCols, isCellEditable, setCellValue, setBatchCellValues, internalClipboard, onRecordUndo, showToast]
  );

  const handleSelectAll = useCallback(() => {
    setSelection({
      startR: 0,
      startC: 0,
      endR: totalRows - 1,
      endC: totalCols - 1
    });
    showToast(`🔲 Seluruh tabel terpilih`);
  }, [totalRows, totalCols, showToast]);

  const isDraggingRef = React.useRef(false);

  // Global mouse drag listener to ensure smooth block selection across inputs and devices
  useEffect(() => {
    const handlePointerMove = (x: number, y: number) => {
      if (!isDraggingRef.current) return;
      const elem = document.elementFromPoint(x, y);
      if (!elem) return;
      const cellElem = elem.closest("[data-r]");
      if (!cellElem) return;
      const tr = parseInt(cellElem.getAttribute("data-r") || "-1", 10);
      const tc = parseInt(cellElem.getAttribute("data-c") || "-1", 10);
      if (tr >= 0 && tc >= 0) {
        setSelection(prev => {
          if (!prev) return { startR: tr, startC: tc, endR: tr, endC: tc };
          if (prev.endR === tr && prev.endC === tc) return prev;

          // If mouse moved beyond starting cell, blur active input so focus doesn't lock drag
          if ((tr !== prev.startR || tc !== prev.startC) && document.activeElement) {
            const activeTag = (document.activeElement as HTMLElement).tagName?.toLowerCase();
            if (activeTag === "input") {
              (document.activeElement as HTMLElement).blur();
            }
          }

          // Clear native text selection while dragging across grid cells
          if (window.getSelection) {
            window.getSelection()?.removeAllRanges();
          }
          return { ...prev, endR: tr, endC: tc };
        });
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      handlePointerMove(e.clientX, e.clientY);
    };

    const onMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        setIsDragging(false);
      }
    };

    const preventNativeDrag = (e: Event) => {
      if (isDraggingRef.current) {
        e.preventDefault();
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("selectstart", preventNativeDrag);
    window.addEventListener("dragstart", preventNativeDrag);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("selectstart", preventNativeDrag);
      window.removeEventListener("dragstart", preventNativeDrag);
    };
  }, []);

  const selectColumn = useCallback((c: number) => {
    setSelection({
      startR: 0,
      startC: c,
      endR: totalRows - 1,
      endC: c
    });
    showToast(`📍 Kolom ${c + 1} diblok`);
  }, [totalRows, showToast]);

  const selectRow = useCallback((r: number) => {
    setSelection({
      startR: r,
      startC: 0,
      endR: r,
      endC: totalCols - 1
    });
    showToast(`📍 Baris ${r + 1} diblok`);
  }, [totalCols, showToast]);

  // Keyboard navigation & shortcuts

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (activeTag === "input" || !selection) return;

      const key = e.key.toLowerCase();

      // Shortcuts
      if (e.ctrlKey || e.metaKey) {
        if (key === "c") { e.preventDefault(); handleCopy(); return; }
        if (key === "x") { e.preventDefault(); handleCut(); return; }
        if (key === "v") { e.preventDefault(); handlePaste(); return; }
        if (key === "a") { e.preventDefault(); handleSelectAll(); return; }
      }

      if (key === "delete" || key === "backspace") {
        e.preventDefault();
        handleClear();
        return;
      }

      if (key === "escape") {
        e.preventDefault();
        setSelection(null);
        return;
      }

      // Arrows
      let { startR, startC, endR, endC } = selection;
      let moved = false;

      if (key === "arrowup") {
        if (e.shiftKey) { endR = Math.max(0, endR - 1); } 
        else { startR = Math.max(0, startR - 1); endR = startR; startC = endC; }
        moved = true;
      } else if (key === "arrowdown") {
        if (e.shiftKey) { endR = Math.min(totalRows - 1, endR + 1); } 
        else { startR = Math.min(totalRows - 1, startR + 1); endR = startR; startC = endC; }
        moved = true;
      } else if (key === "arrowleft") {
        if (e.shiftKey) { endC = Math.max(0, endC - 1); } 
        else { startC = Math.max(0, startC - 1); endC = startC; startR = endR; }
        moved = true;
      } else if (key === "arrowright") {
        if (e.shiftKey) { endC = Math.min(totalCols - 1, endC + 1); } 
        else { startC = Math.min(totalCols - 1, startC + 1); endC = startC; startR = endR; }
        moved = true;
      }

      if (moved) {
        e.preventDefault();
        setSelection({ startR, startC, endR, endC });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selection, totalRows, totalCols, handleCopy, handleCut, handlePaste, handleClear, handleSelectAll]);

  const touchStartRef = React.useRef<{ x: number; y: number; r: number; c: number; isMoved: boolean; isInsideSelection: boolean } | null>(null);

  const getCellProps = useCallback(
    (r: number, c: number) => {
      const selected = isSelected(r, c);
      const active = isActiveCell(r, c);

      return {
        "data-r": r,
        "data-c": c,
        className: `relative transition-colors ${selected ? active ? "!bg-blue-300/90 ring-2 ring-blue-600 ring-inset z-20 shadow-sm" : "!bg-blue-200/70 ring-1 ring-blue-400 ring-inset z-10" : ""}`,
        onMouseDown: (e: React.MouseEvent) => {
          if (e.button !== 0) return;
          isDraggingRef.current = true;
          setIsDragging(true);
          const isInput = (e.target as HTMLElement)?.tagName?.toLowerCase() === "input";
          if (!isInput) {
            e.preventDefault();
          }
          if (e.shiftKey && selection) {
            setSelection(prev => (prev ? { ...prev, endR: r, endC: c } : { startR: r, startC: c, endR: r, endC: c }));
          } else {
            setSelection({ startR: r, startC: c, endR: r, endC: c });
          }
        },
        onMouseEnter: (e: React.MouseEvent) => {
          if (isDraggingRef.current && (e.buttons === 1 || e.buttons === 3)) {
            if (document.activeElement && (document.activeElement as HTMLElement).tagName?.toLowerCase() === "input") {
              (document.activeElement as HTMLElement).blur();
            }
            if (window.getSelection) {
              window.getSelection()?.removeAllRanges();
            }
            setSelection(prev => (prev ? { ...prev, endR: r, endC: c } : { startR: r, startC: c, endR: r, endC: c }));
          }
        },
        onDragStart: (e: React.DragEvent) => {
          e.preventDefault();
        },
        onTouchStart: (e: React.TouchEvent) => {
          if (!e.touches || e.touches.length === 0) return;
          const touch = e.touches[0];
          // Cek dulu apakah sel yang disentuh ini SUDAH bagian dari seleksi yang ada,
          // SEBELUM seleksi ditimpa. Ini menentukan apakah sentuhan ini boleh dipakai
          // untuk menggeser/memperluas blok (persis seperti grid Breakdown Manager).
          const wasInsideSelection = isSelected(r, c);
          touchStartRef.current = { x: touch.clientX, y: touch.clientY, r, c, isMoved: false, isInsideSelection: wasInsideSelection };

          if (e.shiftKey && selection) {
            setSelection(prev => (prev ? { ...prev, endR: r, endC: c } : { startR: r, startC: c, endR: r, endC: c }));
          } else if (!wasInsideSelection) {
            // Sentuhan baru di luar seleksi lama: cuma pilih 1 sel ini (tap biasa).
            // Blok tidak langsung meluas dari sentuhan pertama ini.
            setSelection({ startR: r, startC: c, endR: r, endC: c });
          }
          // Kalau sentuhan dimulai DI DALAM seleksi yang sudah ada, seleksi lama
          // dibiarkan apa adanya supaya geseran berikutnya (onTouchMove) memperluas
          // blok dari titik jangkarnya (startR/startC), bukan mereset ke sel ini.
        },
        onTouchMove: (e: React.TouchEvent) => {
          if (!touchStartRef.current || !e.touches || e.touches.length === 0) return;
          const touch = e.touches[0];
          const dx = Math.abs(touch.clientX - touchStartRef.current.x);
          const dy = Math.abs(touch.clientY - touchStartRef.current.y);

          // Threshold check to distinguish scroll gesture vs block drag
          if (!touchStartRef.current.isMoved) {
            if (dx > 12 || dy > 12) {
              touchStartRef.current.isMoved = true;
            } else {
              return;
            }
          }

          // Blok hanya boleh meluas kalau sentuhan ini DIMULAI di sel yang sudah
          // terpilih sebelumnya (tap pertama). Kalau ini tap pertama di sel baru,
          // geseran dibiarkan jadi scroll biasa, tidak langsung ngeblok.
          if (!touchStartRef.current.isInsideSelection) return;

          if (e.cancelable && dx > dy * 0.8) {
            e.preventDefault(); // keep screen stationary if dragging block horizontally
          }
          const elem = document.elementFromPoint(touch.clientX, touch.clientY);
          if (elem) {
            const cellElem = elem.closest("[data-r]");
            if (cellElem) {
              const tr = parseInt(cellElem.getAttribute("data-r") || "-1", 10);
              const tc = parseInt(cellElem.getAttribute("data-c") || "-1", 10);
              if (tr >= 0 && tc >= 0) {
                setSelection(prev => (prev ? { ...prev, endR: tr, endC: tc } : { startR: tr, startC: tc, endR: tr, endC: tc }));
              }
            }
          }
        },
        onTouchEnd: () => {
          touchStartRef.current = null;
          isDraggingRef.current = false;
          setIsDragging(false);
        }
      };
    },
    [isSelected, isActiveCell, selection, isDragging]
  );

  return {
    selection,
    setSelection,
    minR,
    maxR,
    minC,
    maxC,
    isSelected,
    isActiveCell,
    message,
    getCellProps,
    selectColumn,
    selectRow,
    setIsDragging,
    handleCopy,
    handleCut,
    handlePaste,
    handleClear,
    handleSelectAll,
    // Dummy for backward compatibility with older components expecting toolbarPos
    toolbarPos: null 
  };

}
