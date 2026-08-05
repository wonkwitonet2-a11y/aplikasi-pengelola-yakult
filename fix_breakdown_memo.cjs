const fs = require('fs');

let content = fs.readFileSync('src/components/BreakdownGridRow.tsx', 'utf8');

const replacement = `
function areEqual(prev, next) {
  if (prev.yl.area !== next.yl.area) return false;
  if (prev.breakdownDateRange !== next.breakdownDateRange) return false;
  
  const area = String(prev.yl.area).substring(0, 3);
  if (prev.activeGridMap[area] !== next.activeGridMap[area]) return false;
  if (prev.targetYLMap[area] !== next.targetYLMap[area]) return false;

  const isRowInSelection = (sel, rIdx) => {
    if (!sel) return false;
    return rIdx >= Math.min(sel.startR, sel.endR) && rIdx <= Math.max(sel.startR, sel.endR);
  };
  
  const wasSelected = isRowInSelection(prev.gridSelection, prev.rIdx);
  const isSelected = isRowInSelection(next.gridSelection, next.rIdx);
  
  // If selection changed and this row is involved in either the old or new selection
  if ((wasSelected || isSelected) && prev.gridSelection !== next.gridSelection) return false;

  const isRowInFill = (sel, hover, rIdx) => {
    if (!sel || !hover) return false;
    const baseMin = Math.min(sel.startR, sel.endR);
    const baseMax = Math.max(sel.startR, sel.endR);
    const actMin = Math.min(baseMin, hover.r);
    const actMax = Math.max(baseMax, hover.r);
    return rIdx >= actMin && rIdx <= actMax;
  };

  const wasInFill = prev.isFillDragging && isRowInFill(prev.gridSelection, prev.fillHoverCell, prev.rIdx);
  const isInFill = next.isFillDragging && isRowInFill(next.gridSelection, next.fillHoverCell, next.rIdx);
  
  if ((wasInFill || isInFill) && (prev.fillHoverCell !== next.fillHoverCell || prev.isFillDragging !== next.isFillDragging)) return false;

  return true;
}

export const BreakdownGridRow = React.memo(BreakdownGridRowInner, areEqual);
`;

content = content.replace("export const BreakdownGridRow = React.memo(BreakdownGridRowInner);", replacement);
fs.writeFileSync('src/components/BreakdownGridRow.tsx', content);
