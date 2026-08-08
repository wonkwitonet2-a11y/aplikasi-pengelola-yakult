import re

with open('src/components/LhppRealisasiView.tsx', 'r') as f:
    content = f.read()

pattern1 = r'<td className="p-2.5 sticky left-0 bg-slate-900 z-20 font-black text-slate-200 text-left" colSpan=\{2\}>'
replacement1 = r'<td className="p-2.5 sticky left-0 bg-slate-900 z-20 font-black text-slate-200 text-left shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)]">'
content = re.sub(pattern1, replacement1, content)

pattern2 = r'<td className="p-2.5 sticky left-0 bg-emerald-950 z-20 text-left font-black tracking-wide text-emerald-200" colSpan=\{2\}>'
replacement2 = r'<td className="p-2.5 sticky left-0 bg-emerald-950 z-20 text-left font-black tracking-wide text-emerald-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)]">'
content = re.sub(pattern2, replacement2, content)

with open('src/components/LhppRealisasiView.tsx', 'w') as f:
    f.write(content)

print("Footer patched successfully!")
