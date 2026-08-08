import re

with open('src/components/useSimpleGrid.ts', 'r') as f:
    content = f.read()

# Modify onTouchStart
pattern_start = r'(onTouchStart:\s*\(e:\s*React\.TouchEvent\)\s*=>\s*\{.*?)else if \(!wasInsideSelection\) \{\s*setIsMenuOpen\(false\);\s*setSelection\(\{ startR: r, startC: c, endR: r, endC: c \}\);\s*\}(.*?)(onTouchMove)'

replacement_start = r'\1else if (!wasInsideSelection) {\n            setIsMenuOpen(false);\n            // Do not set selection immediately to allow scrolling without "ngeblok"\n          }\2\3'
content = re.sub(pattern_start, replacement_start, content, flags=re.DOTALL)

# Modify onTouchEnd
pattern_end = r'(onTouchEnd:\s*\(\)\s*=>\s*\{\s*if \(touchStartRef\.current\) \{\s*if \(!touchStartRef\.current\.isMoved\)\s*\{\s*if\s*\(touchStartRef\.current\.isInsideSelection\)\s*\{\s*setIsMenuOpen\(true\);\s*setMenuPos\(\{ x: touchStartRef\.current\.x, y: touchStartRef\.current\.y \}\);\s*\})(\s*\}\s*touchStartRef\.current = null;)'

replacement_end = r'\1 else {\n                setSelection({ startR: touchStartRef.current.r, startC: touchStartRef.current.c, endR: touchStartRef.current.r, endC: touchStartRef.current.c });\n              }\2'

content = re.sub(pattern_end, replacement_end, content, flags=re.DOTALL)

with open('src/components/useSimpleGrid.ts', 'w') as f:
    f.write(content)

print("useSimpleGrid.ts patched!")
