import re

with open("src/components/ManagerView.tsx", "r") as f:
    mv_content = f.read()

mv_content = mv_content.replace(
"""              <GridSelectionToolbar
                selection={tkuGridSelection}
                onCopy={handleTkuGridCopy}
                onCut={handleTkuGridCut}
                onPaste={handleTkuGridPaste}
                onClear={handleTkuGridClear}
              />""",
"""              <GridSelectionToolbar
                selection={tkuGridSelection}
                onCopy={handleTkuGridCopy}
                onCut={handleTkuGridCut}
                onPaste={handleTkuGridPaste}
                onClear={handleTkuGridClear}
                onClose={() => setTkuGridSelection(null)}
              />""")

with open("src/components/ManagerView.tsx", "w") as f:
    f.write(mv_content)
