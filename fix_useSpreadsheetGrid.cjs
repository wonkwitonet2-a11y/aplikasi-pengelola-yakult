const fs = require('fs');
let content = fs.readFileSync('src/components/useSpreadsheetGrid.ts', 'utf8');

content = content.replace("const handlePaste = useCallback(\n    (pastedText?: string) => {", 
"const handlePaste = useCallback(\n    (pastedText?: any) => {");

content = content.replace("if (pastedText) {", 
"if (typeof pastedText === 'string' && pastedText) {");

fs.writeFileSync('src/components/useSpreadsheetGrid.ts', content);
