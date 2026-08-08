import re

with open('src/components/useSimpleGrid.ts', 'r') as f:
    content = f.read()

pattern = r'''(onTouchEnd:\s*\(\)\s*=>\s*\{\s*if\s*\(touchStartRef\.current\)\s*\{\s*if\s*\(!touchStartRef\.current\.isMoved\s*&&\s*touchStartRef\.current\.isInsideSelection\)\s*\{\s*setIsMenuOpen\(true\);\s*setMenuPos\(\{ x: touchStartRef\.current\.x, y: touchStartRef\.current\.y \}\);\s*\})(\s*\}\s*touchStartRef\.current = null;)'''
replacement = r'\1 else if (!touchStartRef.current.isMoved) {\n              setSelection({ startR: touchStartRef.current.r, startC: touchStartRef.current.c, endR: touchStartRef.current.r, endC: touchStartRef.current.c });\n            }\2'

content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open('src/components/useSimpleGrid.ts', 'w') as f:
    f.write(content)

print("useSimpleGrid.ts patched!")
