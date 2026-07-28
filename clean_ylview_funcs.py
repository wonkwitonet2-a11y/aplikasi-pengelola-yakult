import re

with open("src/components/YLView.tsx", "r") as f:
    content = f.read()

# removing variables
content = re.sub(r'const \[saving, setSaving\] = useState[^;]+;\n?', '', content)
content = re.sub(r'const \[successMsg, setSuccessMsg\] = useState[^;]+;\n?', '', content)
content = re.sub(r'const \[isBreakdownLoading, setIsBreakdownLoading\] = useState[^;]+;\n?', '', content)

# getSectorsGrandTotal (approx 10 lines)
content = re.sub(r'const getSectorsGrandTotal = \(\) => {[^}]+};\n?', '', content)

# isMatched
content = re.sub(r'const isMatched = getSectorsGrandTotal\(\) === grandTarget;\n?', '', content)

# handleSectorChange
content = re.sub(r'const handleSectorChange = \(sector: keyof typeof sectorTargets, val: string\) => {[^}]+};\n?', '', content)

# handleSaveTargets (async block)
content = re.sub(r'const handleSaveTargets = async \(\) => {[\s\S]*?};\n?(?=\s*const|\s*//)', '', content)

# handleSaveReport
content = re.sub(r'const handleSaveReport = async \(\) => {[\s\S]*?};\n?(?=\s*const|\s*//)', '', content)

# grandSetoran
content = re.sub(r'const grandSetoran =[^;]+;\n?', '', content)

# isTanggalValid
content = re.sub(r'const isTanggalValid =[^;]+;\n?', '', content)

# handleRealisasiGridSelectAll
content = re.sub(r',\s*handleSelectAll:\s*handleRealisasiGridSelectAll', '', content)

with open("src/components/YLView.tsx", "w") as f:
    f.write(content)

