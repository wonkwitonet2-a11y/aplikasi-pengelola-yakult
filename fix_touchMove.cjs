const fs = require('fs');
let content = fs.readFileSync('src/components/useSpreadsheetGrid.ts', 'utf8');

content = content.replace("const handleTouchMove = (e: TouchEvent) => {\n      if (e.touches.length > 0) {", 
"const handleTouchMove = (e: TouchEvent) => {\n      if (touchStartRef.current) touchStartRef.current.hasMoved = true;\n      if (e.touches.length > 0) {");

fs.writeFileSync('src/components/useSpreadsheetGrid.ts', content);
