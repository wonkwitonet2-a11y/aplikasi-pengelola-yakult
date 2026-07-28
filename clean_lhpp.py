import re

with open("src/components/LhppRealisasiView.tsx", "r") as f:
    content = f.read()

content = re.sub(r'\bbreakdownPlanMap,\s*', '', content)
content = re.sub(r'\bbreakdownRealisasiMap,\s*', '', content)
content = re.sub(r'\bonSaveLhpp,\s*', '', content)
content = re.sub(r'\btheme,\s*', '', content)
content = re.sub(r',\s*handleSelectAll', '', content)

with open("src/components/LhppRealisasiView.tsx", "w") as f:
    f.write(content)
