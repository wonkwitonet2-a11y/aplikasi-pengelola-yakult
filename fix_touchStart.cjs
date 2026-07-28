const fs = require('fs');
let content = fs.readFileSync('src/components/useSpreadsheetGrid.ts', 'utf8');

const regex = /onTouchStart: \(e: React\.TouchEvent\) => \{\n\s*const touch = e\.touches\[0\];\n\s*touchStartRef\.current = \{ x: touch\.clientX, y: touch\.clientY, time: Date\.now\(\), hasMoved: false \};\n\s*setSelection\(\{ startR: r, startC: c, endR: r, endC: c \}\);\n\s*setDragMode\("grid"\);\n\s*setToolbarVisible\(false\);\n\s*\}/;

const replacement = `onTouchStart: (e: React.TouchEvent) => {
          const touch = e.touches[0];
          touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now(), hasMoved: false };
          if (isSelected(r, c)) {
            // Already selected
          } else {
            setSelection({ startR: r, startC: c, endR: r, endC: c });
            setToolbarVisible(false);
          }
        }`;

content = content.replace(regex, replacement);
fs.writeFileSync('src/components/useSpreadsheetGrid.ts', content);
