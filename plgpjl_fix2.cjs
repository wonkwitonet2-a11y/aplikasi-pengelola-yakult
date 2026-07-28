const fs = require('fs');
let content = fs.readFileSync('src/components/PlgPjlView.tsx', 'utf8');

// The remnant of handleSaveManual:
const regex = /\s*const res = await safeFetchJson[\s\S]*?\} finally \{\s*setSavingManual\(false\);\s*\}\s*\};\n/g;
content = content.replace(regex, '');

fs.writeFileSync('src/components/PlgPjlView.tsx', content);
