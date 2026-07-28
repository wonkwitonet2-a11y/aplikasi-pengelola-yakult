import re

def process_managerview():
    with open("src/components/ManagerView.tsx", "r") as f:
        lines = f.readlines()

    # Lines to remove (1-indexed)
    to_remove = set()
    to_remove.update(range(703, 705))
    to_remove.update(range(738, 749))
    to_remove.add(756)
    to_remove.add(792)
    to_remove.add(840)
    to_remove.update(range(1085, 1103))
    to_remove.update(range(1242, 1274))
    to_remove.update(range(1289, 1293))
    to_remove.update(range(1392, 1467))
    to_remove.update(range(1620, 1635))
    to_remove.update(range(1665, 1712))  # wait, up to 1711 (closing brace of handleSaveMotivasiConfig)
    to_remove.update(range(4077, 4141)) # dp1 modal

    # handle v unused parameter
    for i in range(1492, 1496): # approx 1494
        if "isWinner = (v: number) => false;" in lines[i]:
            lines[i] = lines[i].replace("(v: number)", "()")
        if "isLoser = (v: number) => false;" in lines[i]:
            lines[i] = lines[i].replace("(v: number)", "()")
        if "getScore = (v: number) => 0;" in lines[i]:
            lines[i] = lines[i].replace("(v: number)", "()")

    new_lines = []
    for i, line in enumerate(lines):
        if (i + 1) not in to_remove:
            new_lines.append(line)

    with open("src/components/ManagerView.tsx", "w") as f:
        f.writelines(new_lines)


def process_plgpjlview():
    with open("src/components/PlgPjlView.tsx", "r") as f:
        content = f.read()
    
    # unused imports
    content = re.sub(r'parseJsonResponse,\s*', '', content)
    content = re.sub(r'Home,\s*', '', content)
    content = re.sub(r'ShoppingBag,\s*', '', content)
    content = re.sub(r'Briefcase,\s*', '', content)
    content = re.sub(r'Save,\s*', '', content)
    content = re.sub(r'RefreshCw,\s*', '', content)
    content = re.sub(r'CheckCircle2,\s*', '', content)
    content = re.sub(r'TrendingUp,\s*', '', content)
    
    # unused type
    content = re.sub(r'export type ManualPlgPjlData = Record<string, {[^}]+}>;\n?', '', content)

    # unused props
    content = re.sub(r'motivasiConfig,\n\s*', '', content)
    content = re.sub(r'theme\s*\n\s*', '', content)
    
    with open("src/components/PlgPjlView.tsx", "w") as f:
        f.write(content)


def process_useSimpleGrid():
    with open("src/components/useSimpleGrid.ts", "r") as f:
        content = f.read()
    
    content = re.sub(r'useRef,\s*', '', content)
    content = re.sub(r'\(e: any\) =>', '() =>', content)
    
    with open("src/components/useSimpleGrid.ts", "w") as f:
        f.write(content)

process_managerview()
process_plgpjlview()
process_useSimpleGrid()
