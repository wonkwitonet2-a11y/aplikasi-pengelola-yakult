const fs = require('fs');
const db = JSON.parse(fs.readFileSync('data.json'));
const txs = db.transactions || [];
const currentMonth = '2026-08';
const currentMonthTxs = txs.filter(t => t.tanggal && t.tanggal.startsWith(currentMonth));
const realisasiAcc = { realisasiMonth: db.breakdownRealisasi && db.breakdownRealisasi[currentMonth] ? db.breakdownRealisasi[currentMonth] : {} };
const realisasiMonth = realisasiAcc.realisasiMonth;

let graphDates = [];
for (let d = 1; d <= 31; d++) {
    let daySales = 0;
    Object.keys(realisasiMonth).forEach(day => {
        // Wait, breakdownRealisasi is indexed by DAY? or AREA?
    });
}
console.log(Object.keys(realisasiMonth));
