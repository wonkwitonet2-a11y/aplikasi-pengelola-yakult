const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const targetStr = `  let frekuensiAbsen = 0;
  let ylAbsenSet = new Set();
  const activeNames = ylList.filter((y: any) => y.status !== "nonaktif").map((y: any) => ({ name: y.nama, area: y.area || (y.nama.match(/^(\\d{3})/) ? y.nama.match(/^(\\d{3})/)[1] : "") }));

  graphDates.forEach((dayStr: string) => {
    activeNames.forEach((yl: any) => {
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
  });`;

const insertStr = `  let frekuensiAbsen = 0;
  let ylAbsenSet = new Set();
  const activeNames = ylList.filter((y: any) => y.status !== "nonaktif").map((y: any) => ({ name: y.nama, area: y.area || (y.nama.match(/^(\\d{3})/) ? y.nama.match(/^(\\d{3})/)[1] : "") }));

  let hariKunjunganTim = [];
  for (let d = 1; d <= 31; d++) {
    let daySales = 0;
    Object.keys(realisasiMonth).forEach(area => {
      const rData = realisasiMonth[area];
      const days = rData && rData.days ? rData.days : rData;
      if (days && days[String(d)]) {
        const dObj = days[String(d)];
        daySales += (Number(dObj.yo) || 0) + (Number(dObj.om) || 0) + (Number(dObj.os) || 0) + (Number(dObj.yt) || 0);
      }
    });
    if (daySales > 0) {
      hariKunjunganTim.push(String(d));
    }
  }

  hariKunjunganTim.forEach(dayStr => {
    activeNames.forEach((yl: any) => {
      const area = yl.area;
      const rData = realisasiMonth[area];
      const days = rData && rData.days ? rData.days : rData;
      let ylDaySales = 0;
      if (days && days[dayStr]) {
        const dObj = days[dayStr];
        ylDaySales = (Number(dObj.yo) || 0) + (Number(dObj.om) || 0) + (Number(dObj.os) || 0) + (Number(dObj.yt) || 0);
      }
      if (ylDaySales === 0) {
        frekuensiAbsen++;
        ylAbsenSet.add(area);
      }
    });
  });`;

if(content.includes(targetStr)) {
  fs.writeFileSync('server.ts', content.replace(targetStr, insertStr));
  console.log('Fixed abs calculation.');
} else {
  console.log('Target string not found.');
}
