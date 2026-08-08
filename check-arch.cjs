const fs = require('fs');
const arch = JSON.parse(fs.readFileSync('arch-08.json', 'utf-8'));
console.log(Object.keys(arch));
if (arch.transactions) console.log("Transactions:", arch.transactions.length);
if (arch.potensiTembus) console.log("potensiTembus keys:", Object.keys(arch.potensiTembus));
if (arch.lhppRealisasi) console.log("lhppRealisasi keys:", Object.keys(arch.lhppRealisasi));
