const fs = require('fs');
let code = fs.readFileSync('src/components/archive/ArchiveEditor.tsx', 'utf8');

code = code.replace(/selection=\{selection\}/g, "gridSelection={gridSelection}");
code = code.replace(/isDragging=\{isDragging\}/g, "isGridDragging={isGridDragging}");
code = code.replace(/setSelection=\{setSelection\}/g, "setGridSelection={setGridSelection}");
code = code.replace(/setIsDragging=\{setIsDragging\}/g, "setIsGridDragging={setIsGridDragging}");

fs.writeFileSync('src/components/archive/ArchiveEditor.tsx', code);
