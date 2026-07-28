const fs = require('fs');
let content = fs.readFileSync('src/components/useSpreadsheetGrid.ts', 'utf8');

const regex = /const \[toolbarPos: toolbarVisible \? toolbarPos : null,\n\s*setToolbarVisible, setToolbarPos\] = useState[\s\S]*?;\n\s*const \[toolbarVisible, setToolbarVisible\] = useState<boolean>\(false\); left: number; position: "above" \| "below" \} \| null>\(null\);/;

const replacement = `const [toolbarPos, setToolbarPos] = useState<{ top: number; left: number; position: "above" | "below" } | null>(null);
  const [toolbarVisible, setToolbarVisible] = useState<boolean>(false);`;

content = content.replace(regex, replacement);
fs.writeFileSync('src/components/useSpreadsheetGrid.ts', content);
