import re

with open('src/components/LhppRealisasiView.tsx', 'r') as f:
    content = f.read()

# Replace Header Area and Nama
pattern_header = r'<th className="p-2 sticky left-0 bg-slate-800 z-40 min-w-\[50px\] text-center border-r border-slate-700">\s*Area\s*</th>\s*<th className="p-2 sticky left-\[50px\] bg-slate-800 z-40 min-w-\[125px\] text-left border-r border-slate-700">\s*Nama\s*</th>'
replacement_header = r'<th className="p-2 sticky left-0 bg-slate-800 z-40 min-w-[140px] max-w-[140px] text-left border-r border-slate-700">\n                  YAKULT LADY\n                </th>'

content = re.sub(pattern_header, replacement_header, content)

# Replace Subheader Area and Nama
pattern_subheader = r'<th className="p-1 sticky left-0 bg-slate-700 z-40 border-r border-slate-600"></th>\s*<th className="p-1 sticky left-\[50px\] bg-slate-700 z-40 border-r border-slate-600"></th>'
replacement_subheader = r'<th className="p-1 sticky left-0 bg-slate-700 z-40 border-r border-slate-600"></th>'

content = re.sub(pattern_subheader, replacement_subheader, content)

# Replace Row Area and Nama
pattern_row = r'<td\s*data-r=\{rIdx\}\s*className="p-1\.5 sticky left-0 bg-slate-100 z-20 font-black border-r border-slate-200 text-center cursor-pointer hover:bg-slate-200 transition-colors select-none"\s*onClick=\{([^}]+)\}\s*>\s*<span className="px-1\.5 py-0\.5 bg-rose-100 text-rose-800 rounded font-mono font-bold text-\[11px\]">\s*\{row\.area\}\s*</span>\s*</td>\s*<td\s*data-r=\{rIdx\}\s*className="p-1\.5 sticky left-\[50px\] bg-slate-50 z-20 font-extrabold text-slate-900 truncate max-w-\[125px\] border-r border-slate-200 cursor-pointer hover:bg-slate-200 transition-colors select-none"\s*onClick=\{([^}]+)\}\s*>\s*\{cleanYlName\(row\.nama\)\}\s*</td>'

replacement_row = r'''<td
                      data-r={rIdx}
                      className="p-1.5 sticky left-0 bg-slate-100 z-20 border-r border-slate-200 cursor-pointer hover:bg-slate-200 transition-colors select-none min-w-[140px] max-w-[140px] truncate"
                      onClick={\1}
                    >
                      <span className="text-rose-700 font-black mr-1">[{row.area}]</span>
                      <span className="font-extrabold text-slate-900 text-[10px] sm:text-[11px]">{cleanYlName(row.nama)}</span>
                    </td>'''

content = re.sub(pattern_row, replacement_row, content)

with open('src/components/LhppRealisasiView.tsx', 'w') as f:
    f.write(content)

print("Replaced successfully!")
