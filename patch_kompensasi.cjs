const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const targetStr = `  // Tiered Kompensasi Bulanan factor: <200=338, >=200=374, >=250=409, >=280=417, >=300=424, >=330=428, >=350=432
  let factor = 338;
  if (avgSales >= 350) factor = 432;
  else if (avgSales >= 330) factor = 428;
  else if (avgSales >= 300) factor = 424;
  else if (avgSales >= 280) factor = 417;
  else if (avgSales >= 250) factor = 409;
  else if (avgSales >= 200) factor = 374;

  const kompensasiBulanan = ylTotalActual * factor;

  // Laba Harian = (Penjualan Item - Toko Item) * Profit (YO:60, OM:70, OS:70, YT:140)
  let totalLabaHarian = 0;
  ylTxs.forEach((t: any) => {
    const nonTokoYo = Math.max(0, (t.tot_yo || 0) - (t.tk_yo || 0));
    const nonTokoOm = Math.max(0, (t.tot_om || 0) - (t.tk_om || 0));
    const nonTokoOs = Math.max(0, (t.tot_os || 0) - (t.tk_os || 0));
    const nonTokoYt = Math.max(0, (t.tot_yt || 0) - (t.tk_yt || 0));
    totalLabaHarian += (nonTokoYo * 60) + (nonTokoOm * 70) + (nonTokoOs * 70) + (nonTokoYt * 140);
  });

  const kompensasiKotor = kompensasiBulanan + totalLabaHarian;
  const pph = Math.floor(kompensasiKotor * 0.025); // PPh 2.5%
  const jkk = 18800; // JKK/JKM 18.800
  const jht = 24000; // JHT 24.000
  const kompenBersih = kompensasiKotor - pph - jkk - jht;`;

const newStr = `  const compCfg = db.compensationConfig || DEFAULT_COMP_CONFIG;
  let factor = compCfg.tiers[0].rate;
  const sortedTiers = [...compCfg.tiers].sort((a, b) => b.threshold - a.threshold);
  for (const t of sortedTiers) {
    if (avgSales >= t.threshold) {
      factor = t.rate;
      break;
    }
  }

  const kompensasi = ylTotalActual * factor;
  const pph = Math.floor(kompensasi * (compCfg.pphRate / 100));
  const jkk = compCfg.jkkJkm;
  const jht = compCfg.jht;
  const kresekDll = 0;
  const kompenBersih = kompensasi - pph - jkk - jht - kresekDll;`;

const targetResStr = `    kompensasi: {
      kompensasiBulanan,
      labaHarian: totalLabaHarian,
      kompensasiKotor,
      pph,
      jkk,
      jht,
      kompenBersih
    }`;

const newResStr = `    kompensasi: {
      kompensasi,
      pph,
      jkk,
      jht,
      kresekDll,
      kompenBersih
    }`;

code = code.replace(targetStr, newStr);
code = code.replace(targetResStr, newResStr);

const areaRealisasiTarget = `const ca25 = tgtObj.e6 || 12; // Hari Aktif sel CA25
  const avgSales = ca25 > 0 ? ylTotalActual / ca25 : 0;`;

const areaRealisasiNew = `  const areaStr = String(area).substring(0, 3);
  let pembagi = tgtObj.e6 || 12;
  if (db.breakdownRealisasi && db.breakdownRealisasi[currentMonth] && db.breakdownRealisasi[currentMonth][areaStr]) {
    pembagi = db.breakdownRealisasi[currentMonth][areaStr].pembagiTanggal || pembagi;
  }
  const avgSales = pembagi > 0 ? ylTotalActual / pembagi : 0;`;

code = code.replace(areaRealisasiTarget, areaRealisasiNew);

fs.writeFileSync('server.ts', code);
