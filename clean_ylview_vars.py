import re

with open("src/components/YLView.tsx", "r") as f:
    content = f.read()

imports_to_remove = ['TrendingUp', 'Save', 'CheckCircle', 'XCircle', 'FileText', 'PieIcon', 'ChevronRight', 'TrendingDown', 'Sun', 'Moon', 'Award']
for imp in imports_to_remove:
    content = re.sub(r'\b' + imp + r',\s*', '', content)

content = re.sub(r'import \{\s*YLTarget\s*\} from "\.\./types";\n?', '', content)

# Unused destructured props
content = re.sub(r'\btanggalValid,\s*\n?', '', content)
content = re.sub(r'\bonSaveTransaction,\s*\n?', '', content)
content = re.sub(r'\bonSaveTargetYL,\s*\n?', '', content)
content = re.sub(r'\btheme,\s*\n?', '', content)
content = re.sub(r'\bonToggleTheme,\s*\n?', '', content)

# Unused states
content = re.sub(r'const \[potensiTembus, setPotensiTembus\] = useState[^;]+;\n?', '', content)
content = re.sub(r'const \[isPotensiTembusSaving, setIsPotensiTembusSaving\] = useState[^;]+;\n?', '', content)
content = re.sub(r'const \[potensiTembusMsg, setPotensiTembusMsg\] = useState[^;]+;\n?', '', content)

with open("src/components/YLView.tsx", "w") as f:
    f.write(content)
