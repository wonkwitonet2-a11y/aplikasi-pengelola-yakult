const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const regex = /const vsMingguLalu = rataMingguIni - rataMingguLalu;\s*const vsMingguLaluPct = rataMingguLalu > 0 \? Math\.trunc\(\(vsMingguLalu \/ rataMingguLalu\) \* 100\) : 0;/;

const replacement = `const vsMingguLaluPct = rataMingguLalu > 0 ? Math.trunc((rataMingguIni / rataMingguLalu) * 100) : 0;`;

content = content.replace(regex, replacement);
fs.writeFileSync('server.ts', content);
