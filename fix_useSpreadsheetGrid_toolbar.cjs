const fs = require('fs');
let content = fs.readFileSync('src/components/useSpreadsheetGrid.ts', 'utf8');

const regexToolbarState = /const \[toolbarPos, setToolbarPos\] = useState[\s\S]*?;/;
const replaceToolbarState = `const [toolbarPos, setToolbarPos] = useState<{ top: number; left: number; position: "above" | "below" } | null>(null);
  const [toolbarVisible, setToolbarVisible] = useState<boolean>(false);`;

content = content.replace(regexToolbarState, replaceToolbarState);

const regexReturn = /toolbarPos,/;
const replaceReturn = `toolbarPos: toolbarVisible ? toolbarPos : null,\n    setToolbarVisible,`;
content = content.replace(regexReturn, replaceReturn);

const regexSelectionReset = /setSelection\(\{ startR: r, startC: c, endR: r, endC: c \}\);\n\s*setDragMode\("grid"\);/g;
const replaceSelectionReset = `if (isSelected(r, c)) {
            setToolbarVisible(true);
            setDragMode(null);
          } else {
            setSelection({ startR: r, startC: c, endR: r, endC: c });
            setDragMode("grid");
            setToolbarVisible(false);
          }`;

content = content.replace(regexSelectionReset, replaceSelectionReset);

// ContextMenu
const regexGetCellProps = /onTouchStart: \(e: React\.TouchEvent\) => \{/;
const replaceGetCellProps = `onContextMenu: (e: React.MouseEvent) => {
          e.preventDefault();
          if (isSelected(r, c)) {
            setToolbarVisible(true);
          } else {
            setSelection({ startR: r, startC: c, endR: r, endC: c });
            setToolbarVisible(true);
          }
        },
        onTouchStart: (e: React.TouchEvent) => {`;
content = content.replace(regexGetCellProps, replaceGetCellProps);

fs.writeFileSync('src/components/useSpreadsheetGrid.ts', content);
