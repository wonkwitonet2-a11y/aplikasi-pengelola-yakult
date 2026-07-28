const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const regex = /\/\/ Rata2 Minggu Ini \(7 days ending at pembagi\)[\s\S]*?const persenRumah = [^;]+;/;

const replacement = `// Rata2 Minggu Ini (7 days ending at pembagi)
    let sumMingguIni = 0;
    for (let i = 0; i < 7; i++) {
      let d = pembagi - i;
      if (d > 0 && areaData && areaData.days && areaData.days[String(d)]) {
        let dx = areaData.days[String(d)];
        sumMingguIni += (dx.yo||0) + (dx.om||0) + (dx.os||0) + (dx.yt||0);
      }
    }
    const rataMingguIni = Math.trunc(sumMingguIni / 7);

    // Rata2 Minggu Lalu (7 days before that)
    let sumMingguLalu = 0;
    for (let i = 0; i < 7; i++) {
      let d = pembagi - 7 - i;
      if (d > 0 && areaData && areaData.days && areaData.days[String(d)]) {
        let dx = areaData.days[String(d)];
        sumMingguLalu += (dx.yo||0) + (dx.om||0) + (dx.os||0) + (dx.yt||0);
      }
    }
    const rataMingguLalu = Math.trunc(sumMingguLalu / 7);

    const mainYo = latestTx.tot_yo || 0;
    const mainOm = latestTx.tot_om || 0;
    const mainOs = latestTx.tot_os || 0;
    const mainYt = latestTx.tot_yt || 0;
    const todayAll = mainYo + mainOm + mainOs + mainYt;

    const vsMingguLalu = rataMingguIni - rataMingguLalu;
    const vsMingguLaluPct = rataMingguLalu > 0 ? Math.trunc((vsMingguLalu / rataMingguLalu) * 100) : 0;

    const rumahHariIni = (latestTx.rmh_yo||0) + (latestTx.rmh_om||0) + (latestTx.rmh_os||0) + (latestTx.rmh_yt||0);
    const rumahAkm = ylTxs.reduce((sum: number, t: any) => sum + (t.rmh_yo||0) + (t.rmh_om||0) + (t.rmh_os||0) + (t.rmh_yt||0), 0);
    const allAkmSektor = ylTxs.reduce((sum: number, t: any) => sum +
      ((t.rmh_yo||0) + (t.rmh_om||0) + (t.rmh_os||0) + (t.rmh_yt||0)) +
      ((t.psr_yo||0) + (t.psr_om||0) + (t.psr_os||0) + (t.psr_yt||0)) +
      ((t.skh_yo||0) + (t.skh_om||0) + (t.skh_os||0) + (t.skh_yt||0)) +
      ((t.ktr_yo||0) + (t.ktr_om||0) + (t.ktr_os||0) + (t.ktr_yt||0)) +
      ((t.tk_yo||0)  + (t.tk_om||0)  + (t.tk_os||0)  + (t.tk_yt||0)) +
      ((t.ib_yo||0)  + (t.ib_om||0)  + (t.ib_os||0)  + (t.ib_yt||0)), 0);
    const persenRumah = allAkmSektor > 0 ? Math.trunc((rumahAkm / allAkmSektor) * 100) : 0;`;

content = content.replace(regex, replacement);
fs.writeFileSync('server.ts', content);
