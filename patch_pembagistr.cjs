const fs = require('fs');
let code = fs.readFileSync('src/components/ManagerView.tsx', 'utf8');

code = code.replace(
  /const pembagiStr = Object\.values\(activeGridMap \|\| \{\}\)\.reduce\(\(acc: number, curr: any\) => Math\.max\(acc, Number\(curr\.pembagiTanggal\) \|\| 25\), 25\);/g,
  `const pembagiStr = (activeGridMap && Object.keys(activeGridMap).length > 0) ? (activeGridMap[Object.keys(activeGridMap)[0]]?.pembagiTanggal ?? 25) : 25;`
);

fs.writeFileSync('src/components/ManagerView.tsx', code);
