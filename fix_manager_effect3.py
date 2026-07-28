import re

with open("src/components/ManagerView.tsx", "r") as f:
    content = f.read()

pattern = re.compile(r'  useEffect\(\(\) => \{\n\s*if \(activeTab !== "breakdown"\) return;\n\s*const handleKeyDown = \(e: KeyboardEvent\) => \{.*?  \}, \[activeTab, gridSelection, activeYLsList, breakdownPlanMap\]\);\n', re.DOTALL)

match = pattern.search(content)
if match:
    content = content.replace(match.group(0), "")
    
    insert_target_pattern = re.compile(r'(  const \{\s*selection: tkuGridSelection,.*?handleSelectAll: handleTkuGridSelectAll\s*\} = useSimpleGrid\(\{.*?\}\);)', re.DOTALL)
    
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

    match_insert = insert_target_pattern.search(content)
    if match_insert:
        content = content.replace(match_insert.group(1), match_insert.group(1) + "\n" + new_effect_str)
        with open("src/components/ManagerView.tsx", "w") as f:
            f.write(content)
        print("Success")
    else:
        print("Failed to find insert point")
else:
    print("Failed to match block")

