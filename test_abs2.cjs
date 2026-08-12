const fs = require('fs');
const db = JSON.parse(fs.readFileSync('data.json'));
const currentMonth = '2026-08';
const realisasiMonth = db.breakdownRealisasi[currentMonth] || {};
console.log('Keys in db:', Object.keys(realisasiMonth));
