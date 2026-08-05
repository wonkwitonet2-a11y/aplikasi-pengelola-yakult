const fs = require("fs");
let code = fs.readFileSync("server.ts", "utf8");

// Fix 1: Relax name matching
code = code.replace(
  /const ylTxs = db\.transactions\.filter\(\(t: any\) => t\.nama === name && t\.tanggal && t\.tanggal\.startsWith\(currentMonth\)\);/g,
  `const ylTxs = db.transactions.filter((t: any) => (t.nama === name || (t.area && String(t.area) === String(area)) || (t.nama && t.nama.startsWith(String(area)))) && t.tanggal && t.tanggal.startsWith(currentMonth));`
);

// Fix 2: pastTxs for plg calculation
code = code.replace(
  /const ylTxsSorted = \[\.\.\.ylTxs\]\.sort\(\(a: any, b: any\) => \(a\.tanggal \|\| ""\)\.localeCompare\(b\.tanggal \|\| ""\)\);\s*const last3Txs = ylTxsSorted\.slice\(-3\);/g,
  `const pastTxs = ylTxs.filter((t: any) => t.tanggal <= hariIniDateStr);\n    const ylTxsSorted = [...pastTxs].sort((a: any, b: any) => (a.tanggal || "").localeCompare(b.tanggal || ""));\n    const last3Txs = ylTxsSorted.slice(-3);`
);

fs.writeFileSync("server.ts", code);
console.log("Fixed server.ts");
