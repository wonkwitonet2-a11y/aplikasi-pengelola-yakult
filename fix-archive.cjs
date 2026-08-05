const fs = require('fs');
let code = fs.readFileSync('src/components/archive/ArchiveEditor.tsx', 'utf8');

code = code.replace(/maxR:/g, 'totalRows:');
code = code.replace(/maxC:/g, 'totalCols:');
code = code.replace(/gridSelection/g, 'selection');
code = code.replace(/isGridDragging/g, 'isDragging');
code = code.replace(/setGridSelection/g, 'setSelection');
code = code.replace(/setIsGridDragging/g, 'setIsDragging');
code = code.replace(/handleBreakdownCellChange =/g, 'setCellValue =');

fs.writeFileSync('src/components/archive/ArchiveEditor.tsx', code);
