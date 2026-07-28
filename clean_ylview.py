import re

with open("src/components/YLView.tsx", "r") as f:
    content = f.read()

content = re.sub(r'TrendingUp,\s*', '', content)
content = re.sub(r'Save,\s*', '', content)
content = re.sub(r'CheckCircle,\s*', '', content)
content = re.sub(r'XCircle,\s*', '', content)
content = re.sub(r'FileText,\s*', '', content)
content = re.sub(r'PieChart as PieIcon,\s*', '', content)
content = re.sub(r'ChevronRight,\s*', '', content)
content = re.sub(r'TrendingDown,\s*', '', content)
content = re.sub(r'Sun,\s*', '', content)
content = re.sub(r'Moon,\s*', '', content)
content = re.sub(r'Award,\s*', '', content)

content = re.sub(r'export interface YLTarget {[^}]+}\n?', '', content)
content = re.sub(r'theme\s*\n\s*', '', content)
content = re.sub(r'onToggleTheme\s*\n\s*', '', content)
content = re.sub(r',\s*setSelectedDate', '', content)
content = re.sub(r',\s*handleSelectAll:\s*handleRealisasiGridSelectAll', '', content)

# I shouldn't just regex everything, let's carefully target variables and functions
