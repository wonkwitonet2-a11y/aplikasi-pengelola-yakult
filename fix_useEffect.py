import re

with open("src/components/LhppRealisasiView.tsx", "r") as f:
    content = f.read()

effect_pattern = re.compile(r'(  // Global Keyboard Shortcuts \(Ctrl\+Z, Ctrl\+Y / Ctrl\+Shift\+Z, Copy/Paste/Delete\)\n  useEffect\(\(\) => \{.*?  \}, \[handleUndo, handleRedo, selection, handleCopy, handlePaste, handleClear\]\);\n)', re.DOTALL)

match = effect_pattern.search(content)
if match:
    effect_str = match.group(1)
    # Remove from original location
    content = content.replace(effect_str, "")
    
    # Find insertion point: after onRecordUndo: recordHistory  });
    insert_target = """    onRecordUndo: recordHistory
  });"""
    if insert_target in content:
        content = content.replace(insert_target, insert_target + "\n\n" + effect_str)
    else:
        print("Could not find insert target")
        
    with open("src/components/LhppRealisasiView.tsx", "w") as f:
        f.write(content)
else:
    print("Could not find effect block")

