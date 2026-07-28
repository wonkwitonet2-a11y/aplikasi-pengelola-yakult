import re

with open("src/components/LhppRealisasiView.tsx", "r") as f:
    content = f.read()

# Add copy/paste global event listeners
target = """  // Global Keyboard Shortcuts (Ctrl+Z, Ctrl+Y / Ctrl+Shift+Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo]);"""

replacement = """  // Global Keyboard Shortcuts (Ctrl+Z, Ctrl+Y / Ctrl+Shift+Z, Copy/Paste/Delete)
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
        // Allow intercepting paste if not on input, or if we have tabs/newlines (pasting multiple cells into one input)
        if (targetTag !== "input" || /[\\t\\n\\r,;/|\\s]/.test(clean)) {
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
  }, [handleUndo, handleRedo, selection, handleCopy, handlePaste, handleClear]);"""

content = content.replace(target, replacement)

with open("src/components/LhppRealisasiView.tsx", "w") as f:
    f.write(content)

