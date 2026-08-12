const fs = require('fs');
const db = JSON.parse(fs.readFileSync('data.json'));
const currentMonth = '2026-08';
const realisasiMonth = db.breakdownRealisasi[currentMonth] || {};
// Force 201 day 3 to be 0
realisasiMonth['201'].days['3'] = { yo: 0, om: 0, os: 0, yt: 0 };

let graphDates = ['3', '5', '7', '10'];

let frekuensiAbsen = 0;
let ylAbsenSet = new Set();
const ylList = db.ylList || [];
const activeNames = ylList.filter(y => y.status !== "nonaktif").map(y => ({ name: y.nama, area: y.area || (y.nama.match(/^(\d{3})/) ? y.nama.match(/^(\d{3})/)[1] : "") }));

graphDates.forEach(dayStr => {
    activeNames.forEach(yl => {
        const area = yl.area;
        const rData = realisasiMonth[area];
        const days = rData && rData.days ? rData.days : rData;
        let daySales = 0;
        if (days && days[dayStr]) {
            const dObj = days[dayStr];
            daySales = (Number(dObj.yo) || 0) + (Number(dObj.om) || 0) + (Number(dObj.os) || 0) + (Number(dObj.yt) || 0);
        }
        if (daySales === 0) {
            frekuensiAbsen++;
            ylAbsenSet.add(area);
        }
    });
});
console.log('ylAbsen:', ylAbsenSet.size);
console.log('frekuensiAbsen:', frekuensiAbsen);
