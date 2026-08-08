import re

with open('src/components/useSimpleGrid.ts', 'r') as f:
    content = f.read()

# Replace onTouchEnd
pattern = r'(onTouchEnd:\s*\(\)\s*=>\s*\{\s*if \(touchStartRef\.current\) \{\s*if \(!touchStartRef\.current\.isMoved\) \{\s*if \(touchStartRef\.current\.isInsideSelection\) \{\s*setIsMenuOpen\(true\);\s*setMenuPos\(\{ x: touchStartRef\.current\.x, y: touchStartRef\.current\.y \}\);\s*\})(\s*\}\s*\}\s*touchStartRef\.current = null;)'
replacement = r'\1 else {\n                setSelection({ startR: touchStartRef.current.r, startC: touchStartRef.current.c, endR: touchStartRef.current.r, endC: touchStartRef.current.c });\n              }\2'

content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open('src/components/useSimpleGrid.ts', 'w') as f:
    f.write(content)
