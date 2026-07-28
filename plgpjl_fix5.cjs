const fs = require('fs');
let content = fs.readFileSync('src/components/PlgPjlView.tsx', 'utf8');

content = content.replace(/onChange=\{\(val\) => setManualSklhTotal\(val\)\}/g, 'onChange={() => {}}');
content = content.replace(/onChange=\{\(val\) => setManualSklhTembus\(val\)\}/g, 'onChange={() => {}}');
content = content.replace(/onChange=\{\(val\) => setManualKntrTotal\(val\)\}/g, 'onChange={() => {}}');
content = content.replace(/onChange=\{\(val\) => setManualKntrTembus\(val\)\}/g, 'onChange={() => {}}');
content = content.replace(/onChange=\{\(val\) => setManualTkoTotal\(val\)\}/g, 'onChange={() => {}}');
content = content.replace(/onChange=\{\(val\) => setManualTkoTembus\(val\)\}/g, 'onChange={() => {}}');

fs.writeFileSync('src/components/PlgPjlView.tsx', content);
