const fs = require('fs');
let content = fs.readFileSync('src/components/ManagerView.tsx', 'utf8');

content = content.replace(
  /\{typeof val === "number" \? val\.toLocaleString\("id-ID"\) : val\}/g,
  `{typeof val === "number" ? ([15, 18, 21, 27, 29, 31].includes(cIdx) ? \`\${val}%\` : val.toLocaleString("id-ID")) : val}`
);

fs.writeFileSync('src/components/ManagerView.tsx', content);
