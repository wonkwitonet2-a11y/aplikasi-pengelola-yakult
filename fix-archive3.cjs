const fs = require('fs');
let code = fs.readFileSync('src/components/archive/ArchiveEditor.tsx', 'utf8');

// Restore handleBreakdownCellChange and fix grid props
const correctHandleBreakdown = `
  const handleBreakdownCellChange = (area, day, item, val) => {
     setSnapshot(prev => {
        if (!prev) return prev;
        const next = { ...prev };
        if (!next.breakdownRealisasiMap) next.breakdownRealisasiMap = {};
        if (!next.breakdownRealisasiMap[area]) next.breakdownRealisasiMap[area] = { pembagiTanggal: 25, days: {} };
        if (!next.breakdownRealisasiMap[area].days[String(day)]) next.breakdownRealisasiMap[area].days[String(day)] = { yo: 0, om: 0, os: 0, yt: 0 };
        next.breakdownRealisasiMap[area].days[String(day)][item] = val;
        return next;
     });
  };
`;
code = code.replace(/const setCellValue = \(area, day, item, val\) => \{[\s\S]*?\}\);[\s]*\};/, correctHandleBreakdown);

// Fix gridSelection references in BreakdownGridRow
code = code.replace(/gridSelection=\{selection\}/g, "gridSelection={gridSelection}");
code = code.replace(/isGridDragging=\{isDragging\}/g, "isGridDragging={isGridDragging}");
code = code.replace(/setGridSelection=\{setSelection\}/g, "setGridSelection={setGridSelection}");
code = code.replace(/setIsGridDragging=\{setIsDragging\}/g, "setIsGridDragging={setIsGridDragging}");

fs.writeFileSync('src/components/archive/ArchiveEditor.tsx', code);
