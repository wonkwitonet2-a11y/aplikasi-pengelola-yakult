const fs = require('fs');
let code = fs.readFileSync('src/components/archive/ArchiveEditor.tsx', 'utf8');

code = code.replace(/return next;\n                          \}\);\n                       \}\n                       onAkmPaste/g, 'return next; }); }, onAkmPaste');

// Let's use a simpler replace
code = code.split('onAkmPaste: (e, ylKey, startIndex) => {');
if(code.length > 1) {
  let firstPart = code[0];
  if(firstPart.trim().endsWith('}')) {
     firstPart = firstPart.trimEnd() + ',\n                       ';
  }
  code = firstPart + 'onAkmPaste: (e, ylKey, startIndex) => {' + code[1];
}

fs.writeFileSync('src/components/archive/ArchiveEditor.tsx', code);
