const fs = require('fs');
let content = fs.readFileSync('src/components/useSpreadsheetGrid.ts', 'utf8');

const regexGetCellProps = /const getCellProps = useCallback\([\s\S]*?\[selection, minR, maxR, minC, maxC, isSelected, isActiveCell\]\n  \);/;

const replacement = `const getCellProps = useCallback(
    (r: number, c: number) => {
      const selected = isSelected(r, c);
      const active = isActiveCell(r, c);
      return {
        "data-r": r,
        "data-c": c,
        className: \`relative select-none transition-colors \${
          selected
            ? active
              ? "bg-blue-300/90 ring-2 ring-blue-600 z-20 shadow-sm"
              : "bg-blue-200/70 ring-1 ring-blue-400 z-10"
            : ""
        }\`,
        onMouseDown: (e: React.MouseEvent) => {
          if (e.shiftKey && selection) {
            setSelection(prev => (prev ? { ...prev, endR: r, endC: c } : { startR: r, startC: c, endR: r, endC: c }));
            setToolbarVisible(false);
          } else {
            setSelection({ startR: r, startC: c, endR: r, endC: c });
            setDragMode("grid");
            setToolbarVisible(false);
          }
        },
        onContextMenu: (e: React.MouseEvent) => {
          e.preventDefault();
          if (!isSelected(r, c)) {
            setSelection({ startR: r, startC: c, endR: r, endC: c });
          }
          setToolbarVisible(true);
        },
        onClick: (e: React.MouseEvent) => {
          setToolbarVisible(true);
        },
        onTouchStart: (e: React.TouchEvent) => {
          const touch = e.touches[0];
          touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now(), hasMoved: false };
          setSelection({ startR: r, startC: c, endR: r, endC: c });
          setDragMode("grid");
          setToolbarVisible(false);
        },
        onTouchEnd: (e: React.TouchEvent) => {
          if (touchStartRef.current && !touchStartRef.current.hasMoved && (Date.now() - touchStartRef.current.time < 500)) {
            setToolbarVisible(true);
          } else if (touchStartRef.current && !touchStartRef.current.hasMoved && (Date.now() - touchStartRef.current.time >= 500)) {
             setToolbarVisible(true); // long press
          }
        }
      };
    },
    [selection, minR, maxR, minC, maxC, isSelected, isActiveCell]
  );`;

content = content.replace(regexGetCellProps, replacement);
fs.writeFileSync('src/components/useSpreadsheetGrid.ts', content);
