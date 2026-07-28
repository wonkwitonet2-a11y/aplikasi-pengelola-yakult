import re

with open("src/components/YLView.tsx", "r") as f:
    content = f.read()

content = re.sub(r'\btanggalValid:\s*boolean;\n?', '', content)
content = re.sub(r'\bonSaveTransaction:\s*\([^)]*\)\s*=>\s*any;\n?', '', content)
content = re.sub(r'\bonSaveTargetYL:\s*\([^)]*\)\s*=>\s*any;\n?', '', content)

content = re.sub(r'\btanggalValid,\s*\n?', '', content)
content = re.sub(r'\bonSaveTransaction,\s*\n?', '', content)
content = re.sub(r'\bonSaveTargetYL,\s*\n?', '', content)

with open("src/components/YLView.tsx", "w") as f:
    f.write(content)
