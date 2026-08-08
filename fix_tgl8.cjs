const fs = require('fs');
const db = JSON.parse(fs.readFileSync('data.json', 'utf-8'));
let count = 0;
if (db.transactions) {
  db.transactions = db.transactions.filter(t => {
    if (t.tanggal === '2026-08-08') {
      count++;
      return false; // remove
    }
    return true;
  });
}

// Check breakdownRealisasi
let bdCount = 0;
if (db.breakdownRealisasi && db.breakdownRealisasi['2026-08']) {
  const monthData = db.breakdownRealisasi['2026-08'];
  for (const area of Object.keys(monthData)) {
    if (monthData[area] && monthData[area].days && monthData[area].days['8']) {
      monthData[area].days['8'] = { om:0, os:0, yo:0, yt:0 };
      bdCount++;
    }
  }
}

// Check lhppRealisasi
let lhppCount = 0;
if (db.lhppRealisasi && db.lhppRealisasi['2026-08']) {
  const monthData = db.lhppRealisasi['2026-08'];
  for (const area of Object.keys(monthData)) {
    if (monthData[area] && monthData[area]['2026-08-08']) {
      delete monthData[area]['2026-08-08'];
      lhppCount++;
    }
  }
}

fs.writeFileSync('data.json', JSON.stringify(db, null, 2));
console.log(`Deleted ${count} transactions, ${bdCount} breakdownRealisasi entries, ${lhppCount} lhppRealisasi entries for 2026-08-08`);
