import re

with open('src/components/LhppRealisasiView.tsx', 'r') as f:
    content = f.read()

# Replace Subheader Area and Nama
pattern_subheader = r'<th className="p-1 sticky left-0 bg-slate-100 z-40 border-r border-slate-300"></th>\s*<th className="p-1 sticky left-\[50px\] bg-slate-100 z-40 border-r border-slate-300"></th>'
replacement_subheader = r'<th className="p-1 sticky left-0 bg-slate-100 z-40 border-r border-slate-300 shadow-r"></th>'

content = re.sub(pattern_subheader, replacement_subheader, content)

with open('src/components/LhppRealisasiView.tsx', 'w') as f:
    f.write(content)

print("Subheader replaced successfully!")
