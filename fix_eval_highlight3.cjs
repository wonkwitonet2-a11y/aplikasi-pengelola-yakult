const fs = require('fs');
let content = fs.readFileSync('src/components/ManagerView.tsx', 'utf8');

content = content.replace(/let maxCols = \{ c7: -1, c13: -1, c15: -Infinity, c18: -1, c21: -1, pb: -1, c25: -1, c28: Infinity \};/g, 'let maxCols = { c7: -1, c13: -1, c15: -Infinity, c18: -1, c21: -1, pb: -1, c26: -1, c28: Infinity };');

content = content.replace(/if \(\(row\[25\] \|\| 0\) > maxCols\.c25\) maxCols\.c25 = row\[25\] \|\| 0;/g, 'if ((row[26] || 0) > maxCols.c26) maxCols.c26 = row[26] || 0;');

content = content.replace(/if \(cIdx === 25 \&\& val > 0 \&\& val === maxCols\.c25\) isTopPerf = true;/g, 'if (cIdx === 26 && val > 0 && val === maxCols.c26) isTopPerf = true;');

fs.writeFileSync('src/components/ManagerView.tsx', content);
