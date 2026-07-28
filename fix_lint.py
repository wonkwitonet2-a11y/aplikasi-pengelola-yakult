import re

# Fix ManagerView.tsx onClose
with open("src/components/ManagerView.tsx", "r") as f:
    mv_content = f.read()

mv_content = mv_content.replace(
"""                <GridSelectionToolbar 
                  selection={targetGridSelection}
                  onCopy={handleTargetGridCopy}
                  onCut={handleTargetGridCut}
                  onPaste={handleTargetGridPaste}
                  onClear={handleTargetGridClear}
                />""",
"""                <GridSelectionToolbar 
                  selection={targetGridSelection}
                  onCopy={handleTargetGridCopy}
                  onCut={handleTargetGridCut}
                  onPaste={handleTargetGridPaste}
                  onClear={handleTargetGridClear}
                  onClose={() => setTargetGridSelection(null)}
                />""")
with open("src/components/ManagerView.tsx", "w") as f:
    f.write(mv_content)

# Fix YLView.tsx onClose and extra arguments
with open("src/components/YLView.tsx", "r") as f:
    yl_content = f.read()

yl_content = yl_content.replace(
"""                  <GridSelectionToolbar 
                    selection={realisasiGridSelection}
                    onCopy={handleRealisasiGridCopy}
                    onPaste={handleRealisasiGridPaste}
                    onClear={handleRealisasiGridClear}
                  />""",
"""                  <GridSelectionToolbar 
                    selection={realisasiGridSelection}
                    onCopy={handleRealisasiGridCopy}
                    onCut={handleRealisasiGridCut}
                    onPaste={handleRealisasiGridPaste}
                    onClear={handleRealisasiGridClear}
                    onClose={() => setRealisasiGridSelection(null)}
                  />""")

yl_content = re.sub(r'\{renderCell\(([^,]+),([^,]+),\s*"([^"]+)",\s*\d+\s*,\s*(\d+)\)\}', r'{renderCell(\1,\2, "\3", \4)}', yl_content)

with open("src/components/YLView.tsx", "w") as f:
    f.write(yl_content)

print("Success")
