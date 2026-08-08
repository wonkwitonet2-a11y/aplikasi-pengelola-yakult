import re

with open('src/components/useSimpleGrid.ts', 'r') as f:
    content = f.read()

pattern = r'onTouchEnd: \(\) => \{.*?isDraggingRef\.current = false;\s*setIsDragging\(false\);\s*\}'

replacement = r'''onTouchEnd: () => {
          if (touchStartRef.current) {
            if (!touchStartRef.current.isMoved) {
              if (touchStartRef.current.isInsideSelection) {
                setIsMenuOpen(true);
                setMenuPos({ x: touchStartRef.current.x, y: touchStartRef.current.y });
              } else {
                setSelection({ startR: touchStartRef.current.r, startC: touchStartRef.current.c, endR: touchStartRef.current.r, endC: touchStartRef.current.c });
              }
            }
            touchStartRef.current = null;
          }
          isDraggingRef.current = false;
          setIsDragging(false);
        }'''

content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open('src/components/useSimpleGrid.ts', 'w') as f:
    f.write(content)

print("useSimpleGrid.ts patched completely!")
