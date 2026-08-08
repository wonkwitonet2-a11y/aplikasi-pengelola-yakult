import re

with open('src/components/LhppRealisasiView.tsx', 'r') as f:
    content = f.read()

pattern_row = r'\{\/\*\s*Area Column\s*\*\/\}.*?\{\/\*\s*PDM SEBELUMNYA'
replacement_row = r'''{/* YAKULT LADY Column */}
                    <td
                      data-r={rIdx}
                      className="p-1.5 sticky left-0 bg-slate-50 z-20 border-r border-slate-200 cursor-pointer hover:bg-slate-200 transition-colors select-none min-w-[140px] max-w-[140px] truncate shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]"
                      onClick={() => selectRow(rIdx)}
                    >
                      <span className="text-rose-700 font-black mr-1">[{row.area}]</span>
                      <span className="font-extrabold text-slate-900 text-[10px] sm:text-[11px]">{cleanYlName(row.nama)}</span>
                    </td>
                    {/* PDM SEBELUMNYA'''

content = re.sub(pattern_row, replacement_row, content, flags=re.DOTALL)

# Add shadow to level 1 header
pattern_header1 = r'<th className="p-2 sticky left-0 bg-slate-800 z-40 min-w-\[140px\] max-w-\[140px\] text-left border-r border-slate-700">'
replacement_header1 = r'<th className="p-2 sticky left-0 bg-slate-800 z-40 min-w-[140px] max-w-[140px] text-left border-r border-slate-700 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)]">'
content = re.sub(pattern_header1, replacement_header1, content)

# Add shadow to level 2 header
pattern_header2 = r'<th className="p-1 sticky left-0 bg-slate-100 z-40 border-r border-slate-300 shadow-r"></th>'
replacement_header2 = r'<th className="p-1 sticky left-0 bg-slate-100 z-40 border-r border-slate-300 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]"></th>'
content = re.sub(pattern_header2, replacement_header2, content)


with open('src/components/LhppRealisasiView.tsx', 'w') as f:
    f.write(content)

print("Rows patched!")
