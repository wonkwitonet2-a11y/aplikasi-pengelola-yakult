import re

with open("src/components/ManagerView.tsx", "r") as f:
    content = f.read()

# unused imports
for imp in ['AlertTriangle', 'RotateCcw', 'ArrowRight', 'ChevronDown', 'EyeOff', 'Eye', 'HelpCircle', 'RefreshCw', 'Link2', 'LogOut', 'Download', 'Upload', 'Sun', 'Moon', 'ClipboardCheck', 'Calculator']:
    content = re.sub(r'\b' + imp + r',\s*', '', content)

# unused props
content = re.sub(r'\bkontesConfig,\s*\n', '', content)
content = re.sub(r'\bonToggleTheme,\s*\n', '', content)

# unused state variables
content = re.sub(r'const \[realisasiSubTab, setRealisasiSubTab\] = useState[^;]+;\n?', '', content)
content = re.sub(r'const \[isBreakdownLoading, setIsBreakdownLoading\] = useState[^;]+;\n?', '', content)
content = re.sub(r'const \[mobileBlockMode, setMobileBlockMode\] = useState[^;]+;\n?', '', content)
content = re.sub(r'const \[evalFilter, setEvalFilter\] = useState[^;]+;\n?', '', content)
content = re.sub(r'const \[evalResult, setEvalResult\] = useState[^;]+;\n?', '', content)
content = re.sub(r',\s*setBreakdownDateRange', '', content)

with open("src/components/ManagerView.tsx", "w") as f:
    f.write(content)
