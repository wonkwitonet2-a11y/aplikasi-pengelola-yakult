const fs = require('fs');
if (fs.existsSync('data.json')) {
  const db = JSON.parse(fs.readFileSync('data.json', 'utf8'));
  if (db.breakdownPlan && db.breakdownPlan["2026-07"]) {
    delete db.breakdownPlan["2026-07"];
  }
  if (db.breakdownRealisasi && db.breakdownRealisasi["2026-07"]) {
    delete db.breakdownRealisasi["2026-07"];
  }
  db.transactions = db.transactions.filter(t => !t.tanggal.startsWith("2026-07"));
  fs.writeFileSync('data.json', JSON.stringify(db, null, 2));
  console.log("data.json cleaned");
}
