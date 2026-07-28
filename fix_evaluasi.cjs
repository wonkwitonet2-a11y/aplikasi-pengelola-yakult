const fs = require('fs');
const content = fs.readFileSync('server.ts', 'utf8');

const regex = /\/\/ 6\. Evaluasi Harian\napp\.get\("\/api\/getEvaluasi", async \(req, res\) => \{[\s\S]*?(?=\n\/\/ 7\.|\napp\.post\("\/api\/savePlgPjlManual)/;
const replacement = `// 6. Evaluasi Harian
app.get("/api/getEvaluasi", async (req, res) => {
  const db = loadData();
  const dashboard = calculateDashboardDP1(db);
  const currentMonth = new Date().toISOString().substring(0, 7);
  const ylList = db.ylList || INITIAL_YL_LIST;
  const names = ylList.map((y: any) => y.nama);
  
  const breakdownRealisasiMonth = db.breakdownRealisasi && (db.breakdownRealisasi[currentMonth] || db.breakdownRealisasi["2026-07"]) || {};
  const plgPjlManual = db.plgPjlManual || {};

  const tableData = names.map(name => {
    const area = name.substring(0, 3);
    const yl = dashboard.perYL[area] || { yo:0, om:0, os:0, yt:0, akumulasi:0, bbYL:0, rata2:0 };
    const ylTxs = db.transactions.filter((t: any) => t.nama === name && t.tanggal && t.tanggal.startsWith(currentMonth));
    
    const areaData = breakdownRealisasiMonth[area];
    const pembagi = areaData && areaData.pembagiTanggal > 0 ? Number(areaData.pembagiTanggal) : 15;
    
    // Hari ini is date = pembagi
    const hariIniDateStr = currentMonth + "-" + String(pembagi).padStart(2, '0');
    const latestTx = ylTxs.find((t: any) => t.tanggal === hariIniDateStr) || {};
    
    // Rata2 Minggu Ini (7 days ending at pembagi)
    let sumMingguIni = 0;
    for (let i = 0; i < 7; i++) {
      let d = pembagi - i;
      if (d > 0) {
        let dStr = currentMonth + "-" + String(d).padStart(2, '0');
        let tx = ylTxs.find((t: any) => t.tanggal === dStr);
        if (tx) sumMingguIni += (tx.tot_yo||0) + (tx.tot_om||0) + (tx.tot_os||0) + (tx.tot_yt||0);
      }
    }
    const rataMingguIni = Math.trunc(sumMingguIni / 7);

    // Rata2 Minggu Lalu (7 days before that)
    let sumMingguLalu = 0;
    for (let i = 0; i < 7; i++) {
      let d = pembagi - 7 - i;
      if (d > 0) {
        let dStr = currentMonth + "-" + String(d).padStart(2, '0');
        let tx = ylTxs.find((t: any) => t.tanggal === dStr);
        if (tx) sumMingguLalu += (tx.tot_yo||0) + (tx.tot_om||0) + (tx.tot_os||0) + (tx.tot_yt||0);
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
    const persenRumah = yl.akumulasi > 0 ? Math.trunc((rumahAkm / yl.akumulasi) * 100) : 0;
    
    // Plg pjl manual logic for rb vs plg
    const pm = plgPjlManual[area] || { tko_total: 0, tko_tembus: 0 };
    const plg = latestTx.f_plg || 0;
    const rb = latestTx.f_rb || 0;
    const persenRbPlg = plg > 0 ? Math.trunc((rb / plg) * 100) : 0;
    
    const pbPagi = latestTx.pb_p || 0;
    const pbSore = latestTx.pb_s || 0;
    const pbAkm = ylTxs.reduce((sum: number, t: any) => sum + (t.pb_p||0) + (t.pb_s||0), 0);
    
    const sampahHariIni = latestTx.apk_botol || 0;
    const sampahAkm = ylTxs.reduce((sum: number, t: any) => sum + (t.apk_botol||0), 0);
    const vs900 = Math.trunc((sampahAkm / 900) * 100);
    
    const bbHariIni = (latestTx.bb_yo||0) + (latestTx.bb_om||0) + (latestTx.bb_os||0) + (latestTx.bb_yt||0);
    const bbPersenHariIni = todayAll > 0 ? Math.trunc((bbHariIni / todayAll) * 100) : 0;
    const bbAkm = yl.bbYL || 0;
    const bbPersenAkm = yl.akumulasi > 0 ? Math.trunc((bbAkm / yl.akumulasi) * 100) : 0;

    return [
      area,
      name,
      rataMingguLalu,
      mainYo,
      mainOm,
      mainOs,
      mainYt,
      todayAll,
      yl.akumulasi,
      yl.yo,
      yl.om,
      yl.os,
      yl.yt,
      Math.trunc(yl.rata2),
      rataMingguIni,
      vsMingguLaluPct,
      rumahHariIni,
      rumahAkm,
      persenRumah,
      plg,
      rb,
      persenRbPlg,
      pbPagi,
      pbSore,
      pbAkm,
      sampahHariIni,
      sampahAkm,
      vs900,
      bbHariIni,
      bbPersenHariIni,
      bbAkm,
      bbPersenAkm
    ];
  });

  const totalRow = [
    "TOTAL", "",
    tableData.reduce((s: number, r: any) => s + (r[2]||0), 0),
    tableData.reduce((s: number, r: any) => s + (r[3]||0), 0),
    tableData.reduce((s: number, r: any) => s + (r[4]||0), 0),
    tableData.reduce((s: number, r: any) => s + (r[5]||0), 0),
    tableData.reduce((s: number, r: any) => s + (r[6]||0), 0),
    tableData.reduce((s: number, r: any) => s + (r[7]||0), 0),
    tableData.reduce((s: number, r: any) => s + (r[8]||0), 0),
    tableData.reduce((s: number, r: any) => s + (r[9]||0), 0),
    tableData.reduce((s: number, r: any) => s + (r[10]||0), 0),
    tableData.reduce((s: number, r: any) => s + (r[11]||0), 0),
    tableData.reduce((s: number, r: any) => s + (r[12]||0), 0),
    tableData.reduce((s: number, r: any) => s + (r[13]||0), 0),
    tableData.reduce((s: number, r: any) => s + (r[14]||0), 0),
    "0",
    tableData.reduce((s: number, r: any) => s + (r[16]||0), 0),
    tableData.reduce((s: number, r: any) => s + (r[17]||0), 0),
    "0",
    tableData.reduce((s: number, r: any) => s + (r[19]||0), 0),
    tableData.reduce((s: number, r: any) => s + (r[20]||0), 0),
    "0",
    tableData.reduce((s: number, r: any) => s + (r[22]||0), 0),
    tableData.reduce((s: number, r: any) => s + (r[23]||0), 0),
    tableData.reduce((s: number, r: any) => s + (r[24]||0), 0),
    tableData.reduce((s: number, r: any) => s + (r[25]||0), 0),
    tableData.reduce((s: number, r: any) => s + (r[26]||0), 0),
    "0",
    tableData.reduce((s: number, r: any) => s + (r[28]||0), 0),
    "0",
    tableData.reduce((s: number, r: any) => s + (r[30]||0), 0),
    "0"
  ];

  const analisis = tableData.map(r => ({
    area: r[0],
    nama: r[1],
    jualHariIni: r[7],
    rata2BulanBerjalan: r[13],
    vsMingguLaluPct: r[15],
    persenRumah: r[18],
    persenRbVsPlg: r[21],
    propagandaHariIni: r[22] + r[23],
    sampahBotol: r[25],
    bb: r[28]
  }));

  res.json({
    ok: true,
    evaluasiData: {
      dataRows: tableData,
      totalRow,
      analisis
    }
  });
});`;

const newContent = content.replace(regex, replacement);
fs.writeFileSync('server.ts', newContent);
