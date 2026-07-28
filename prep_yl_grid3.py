import re

with open("src/components/YLView.tsx", "r") as f:
    content = f.read()

effect_target = "  // YL Breakdown Plan & Realisasi state (from Admin)"
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
    with open("src/components/YLView.tsx", "w") as f:
        f.write(content)
    print("Success")
else:
    print("Could not find effect_target")
