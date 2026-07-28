import re

with open("src/components/ManagerView.tsx", "r") as f:
    content = f.read()

# Remove multiple excel buttons, keep just one.
# It looks like:
#             <button
#               onClick={handleDownloadExcel}
#               ...
#               📥 Laporan Excel
#             </button>

btn_pattern = re.compile(r'            <button\s+onClick=\{handleDownloadExcel\}\s+className="bg-emerald-[^"]+"\s+title="Download Laporan Excel \(DP1\)"\s*>\s*📥 Laporan Excel\s*</button>\n', re.DOTALL)

# Replace all with nothing, then just inject one before Pembersih Cache
content = btn_pattern.sub('', content)

btn_insertion = """            <button
              onClick={handleDownloadExcel}
              className="bg-emerald-700/80 hover:bg-emerald-600 text-emerald-50 text-[10px] sm:text-xs font-bold px-2.5 py-1.5 rounded-lg border border-emerald-600/50 transition-all flex items-center gap-1 shadow-sm"
              title="Download Laporan Excel (DP1)"
            >
              📥 Laporan Excel
            </button>
            <button
              onClick={handleClearCache}"""
content = content.replace("            <button\n              onClick={handleClearCache}", btn_insertion)

with open("src/components/ManagerView.tsx", "w") as f:
    f.write(content)

