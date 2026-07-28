import re

with open("src/components/YLView.tsx", "r") as f:
    content = f.read()

# Add useSimpleGrid hook inside YLView component, near `editDataRealisasi` state.
insert_target = "  const [editDataRealisasi, setEditDataRealisasi] = useState<Record<number, any>>({});"
grid_hook = """  const realisasiFields = useMemo(() => [
    "rmh_yo", "rmh_om", "rmh_os", "rmh_yt",
    "psr_yo", "psr_om", "psr_os", "psr_yt",
    "skh_yo", "skh_om", "skh_os", "skh_yt",
    "ktr_yo", "ktr_om", "ktr_os", "ktr_yt",
    "tk_yo",  "tk_om",  "tk_os",  "tk_yt",
    "ib_yo",  "ib_om",  "ib_os",  "ib_yt",
    "bb_yo",  "bb_om",  "bb_os",  "bb_yt",
    "pb_p", "pb_s", "apk_plg", "apk_botol",
    "f_plg", "f_rk", "f_ra", "f_rb"
  ], []);

  const getRealisasiCellValue = useCallback((r: number, c: number) => {
    const day = r + 1;
    const field = realisasiFields[c];
    return editDataRealisasi[day]?.[field] ?? 0;
  }, [editDataRealisasi, realisasiFields]);

  const setRealisasiBatchCellValues = useCallback((updates: { r: number; c: number; val: number | string }[]) => {
    setEditDataRealisasi(prev => {
      let next = { ...prev };
      updates.forEach(({ r, c, val }) => {
        const day = r + 1;
        const field = realisasiFields[c];
        const numVal = Math.max(0, Math.round(Number(val)) || 0);
        if (next[day]) {
          next[day] = { ...next[day], [field]: numVal };
        }
      });
      return next;
    });
  }, [realisasiFields]);

  const {
    selection: realisasiGridSelection,
    setSelection: setRealisasiGridSelection,
    getCellProps: getRealisasiCellProps,
    handleCopy: handleRealisasiGridCopy,
    handleCut: handleRealisasiGridCut,
    handlePaste: handleRealisasiGridPaste,
    handleClear: handleRealisasiGridClear,
    handleSelectAll: handleRealisasiGridSelectAll
  } = useSimpleGrid({
    totalRows: 31,
    totalCols: 36,
    getCellValue: getRealisasiCellValue,
    setBatchCellValues: setRealisasiBatchCellValues
  });
"""

if insert_target in content:
    content = content.replace(insert_target, insert_target + "\n\n" + grid_hook)
else:
    print("Could not find insert_target")

# Add global effect for copy/paste
effect_target = "  // Fetch data periodically or on date change"
effect_hook = """  // Global Keyboard Shortcuts (Ctrl+Z, Ctrl+Y / Ctrl+Shift+Z, Copy/Paste/Delete)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      
      if (e.key === "Delete" || e.key === "Backspace") {
        if (targetTag !== "input" && targetTag !== "textarea") {
          e.preventDefault();
          if (activeTab === "realisasi_potensi" && isEditRealisasi && realisasiGridSelection) handleRealisasiGridClear();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
        if (activeTab === "realisasi_potensi" && isEditRealisasi && realisasiGridSelection) {
           handleRealisasiGridCopy();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v") {
        if (targetTag !== "input" && targetTag !== "textarea") {
          navigator.clipboard.readText().then(text => {
            if (activeTab === "realisasi_potensi" && isEditRealisasi && realisasiGridSelection) handleRealisasiGridPaste(text);
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
        // Allow intercepting paste if not on input, or if we have tabs/newlines (pasting multiple cells into one input)
        if (targetTag !== "input" || /[\\t\\n\\r,;/|\\s]/.test(clean)) {
          e.preventDefault();
          if (activeTab === "realisasi_potensi" && isEditRealisasi && realisasiGridSelection) handleRealisasiGridPaste(text);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("paste", handleWindowPaste);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("paste", handleWindowPaste);
    }
  }, [activeTab, isEditRealisasi, realisasiGridSelection, handleRealisasiGridClear, handleRealisasiGridCopy, handleRealisasiGridPaste]);

"""

if effect_target in content:
    content = content.replace(effect_target, effect_hook + effect_target)
else:
    print("Could not find effect_target")
    
with open("src/components/YLView.tsx", "w") as f:
    f.write(content)

