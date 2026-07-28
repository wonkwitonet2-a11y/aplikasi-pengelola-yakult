import re

with open("src/components/ManagerView.tsx", "r") as f:
    content = f.read()

target = """    const handleKeyDown = (e: KeyboardEvent) => {
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (e.key === "Delete" || e.key === "Backspace") {
        if (targetTag !== "input" && targetTag !== "textarea") {
          e.preventDefault();
          handleClearSelectedGridCells();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        if (targetTag !== "input" && targetTag !== "textarea") {
          e.preventDefault();
          if (e.shiftKey) {
            handleRedo();
          } else {
            handleUndo();
          }
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        if (targetTag !== "input" && targetTag !== "textarea") {
          e.preventDefault();
          handleRedo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
        if (gridSelection) {
          handleCopyGridCells();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v") {
        if (targetTag !== "input" && targetTag !== "textarea") {
          navigator.clipboard.readText().then(text => {
            handlePasteIntoGrid(text);
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
          handlePasteIntoGrid(text);
        }
      }
    };"""

replacement = """    const handleKeyDown = (e: KeyboardEvent) => {
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (e.key === "Delete" || e.key === "Backspace") {
        if (targetTag !== "input" && targetTag !== "textarea") {
          e.preventDefault();
          if (activeTab === "breakdown") handleClearSelectedGridCells();
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
            if (activeTab === "breakdown") handlePasteIntoGrid(text);
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
          if (activeTab === "breakdown") handlePasteIntoGrid(text);
          else if (activeTab === "target_kompensasi") {
            if (targetGridSelection) handleTargetGridPaste(text);
            if (tkuGridSelection) handleTkuGridPaste(text);
          }
        }
      }
    };"""

content = content.replace(target, replacement)

with open("src/components/ManagerView.tsx", "w") as f:
    f.write(content)

