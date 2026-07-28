const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

// replace plg and rb logic
content = content.replace(
  /const plg = latestTx\.f_plg \|\| 0;\n    const rb = latestTx\.f_rb \|\| 0;/,
  'const plg = ylTxs.reduce((sum: number, t: any) => sum + (t.f_plg||0), 0);\n    const rb = ylTxs.reduce((sum: number, t: any) => sum + (t.f_rb||0), 0);'
);

fs.writeFileSync('server.ts', content);
