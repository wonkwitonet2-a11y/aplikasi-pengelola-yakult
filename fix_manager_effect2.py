import re

with open("src/components/ManagerView.tsx", "r") as f:
    content = f.read()

# Let's extract between `  useEffect(() => {\n    if (activeTab !== "breakdown") return;\n    const handleKeyDown = (e: KeyboardEvent) => {` and `  }, [activeTab, gridSelection, activeYLsList, breakdownPlanMap]);\n`
start_str = '  useEffect(() => {\n    if (activeTab !== "breakdown") return;\n    const handleKeyDown = (e: KeyboardEvent) => {'
end_str = '  }, [activeTab, gridSelection, activeYLsList, breakdownPlanMap]);\n'

start_idx = content.find(start_str)
end_idx = content.find(end_str, start_idx) + len(end_str)

if start_idx != -1 and end_idx != -1:
    effect_str = content[start_idx:end_idx]
    
    # Remove it
    content = content[:start_idx] + content[end_idx:]
    
    # Now find where to insert
    insert_target = "handleSelectAll: handleTkuGridSelectAll\n  } = useSimpleGrid({\n    totalRows: 1,\n    totalCols: 4,\n    getCellValue: getTargetTKUCellValue,\n    setBatchCellValues: setTargetTKUBatchCellValues\n  });"
    
    new_effect_str = """
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
        if (targetTag !== "input" || /[\\t\\n\\r,;/|\\s]/.test(clean)) {
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
"""

    if insert_target in content:
        content = content.replace(insert_target, insert_target + "\n" + new_effect_str)
        with open("src/components/ManagerView.tsx", "w") as f:
            f.write(content)
        print("Success")
    else:
        print("Could not find insert_target")
else:
    print("Could not find effect block via simple search")

