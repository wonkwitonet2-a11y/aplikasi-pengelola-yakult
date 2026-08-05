import re

with open('src/components/LhppRealisasiView.tsx', 'r') as f:
    content = f.read()

# Replace onChange={e => handleCellChange(..., parseInputInt(e.target.value))}
# with onChange={(val) => handleCellChange(..., val)}

# We can use regex for this
pattern = re.compile(r'onChange=\{e => handleCellChange\(([^,]+),\s*"([^"]+)",\s*"([^"]+)",\s*parseInputInt\(e\.target\.value\)\)\}')
content = pattern.sub(r'onChange={(val) => handleCellChange(\1, "\2", "\3", val)}', content)

# For Botol Rusak in YLM Summary, it might be different
pattern2 = re.compile(r'onChange=\{e => setSummary\(prev => \(\{ \.\.\.prev, botolRusak: parseInputInt\(e\.target\.value\) \}\)\)\}')
content = pattern2.sub(r'onChange={(val) => setSummary(prev => ({ ...prev, botolRusak: val }))}', content)

with open('src/components/LhppRealisasiView.tsx', 'w') as f:
    f.write(content)
