import re

with open("src/components/ManagerView.tsx", "r") as f:
    content = f.read()

# Add GridSelectionToolbar for TKU Target
target = """            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-4">
              <div className="border-l-4 border-red-600 pl-2">"""

replacement = """            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-4 relative">
              <GridSelectionToolbar
                selection={tkuGridSelection}
                onCopy={handleTkuGridCopy}
                onCut={handleTkuGridCut}
                onPaste={handleTkuGridPaste}
                onClear={handleTkuGridClear}
              />
              <div className="border-l-4 border-red-600 pl-2">"""

content = content.replace(target, replacement)

with open("src/components/ManagerView.tsx", "w") as f:
    f.write(content)

