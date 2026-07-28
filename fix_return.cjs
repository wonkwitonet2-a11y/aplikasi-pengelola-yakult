const fs = require('fs');
let content = fs.readFileSync('src/components/useSpreadsheetGrid.ts', 'utf8');

const regex = /dragMode,\n\s*setDragMode,\n\s*toolbarPos,\n\s*message,/;
const replacement = `dragMode,\n    setDragMode,\n    toolbarPos: toolbarVisible ? toolbarPos : null,\n    message,`;

content = content.replace(regex, replacement);
fs.writeFileSync('src/components/useSpreadsheetGrid.ts', content);
