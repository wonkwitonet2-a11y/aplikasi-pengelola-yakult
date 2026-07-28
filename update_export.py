import re

with open("server.ts", "r") as f:
    content = f.read()

# We need to replace the content of app.get("/api/exportRealisasi", ...)

start_marker = 'app.get("/api/exportRealisasi", async (req, res) => {'
end_marker = 'res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");'

start_idx = content.find(start_marker)
end_idx = content.find(end_marker, start_idx)

if start_idx == -1 or end_idx == -1:
    print("Could not find markers")
    exit(1)

new_logic = """app.get("/api/exportRealisasi", async (req, res) => {
  try {
    const XLSX = await import("xlsx");
    const db = loadData();
    const wb = XLSX.utils.book_new();

    // 1. Sheet "Realisasi Harian"
    const txs = db.transactions || [];
    const sheet1Data = txs.map((t: any) => ({
      "Tanggal": t.tanggal,
      "Area": t.area || "",
      "Nama": t.nama || "",
      "Rmh YO": t.rmh_yo || 0, "Rmh OM": t.rmh_om || 0, "Rmh OS": t.rmh_os || 0, "Rmh YT": t.rmh_yt || 0,
      "Psr YO": t.psr_yo || 0, "Psr OM": t.psr_om || 0, "Psr OS": t.psr_os || 0, "Psr YT": t.psr_yt || 0,
      "Skh YO": t.skh_yo || 0, "Skh OM": t.skh_om || 0, "Skh OS": t.skh_os || 0, "Skh YT": t.skh_yt || 0,
      "Ktr YO": t.ktr_yo || 0, "Ktr OM": t.ktr_om || 0, "Ktr OS": t.ktr_os || 0, "Ktr YT": t.ktr_yt || 0,
      "Tk YO": t.tk_yo || 0, "Tk OM": t.tk_om || 0, "Tk OS": t.tk_os || 0, "Tk YT": t.tk_yt || 0,
      "Ib YO": t.ib_yo || 0, "Ib OM": t.ib_om || 0, "Ib OS": t.ib_os || 0, "Ib YT": t.ib_yt || 0,
      "BB YO": t.bb_yo || 0, "BB OM": t.bb_om || 0, "BB OS": t.bb_os || 0, "BB YT": t.bb_yt || 0,
      "PB Pagi": t.pb_p || 0,
      "PB Sore": t.pb_s || 0,
      "Plg APK": t.apk_plg || 0,
      "Sampah Botol": t.apk_botol || 0,
      "F. Plg": t.f_plg || 0,
      "F. RK": t.f_rk || 0,
      "F. RA": t.f_ra || 0,
      "F. RB": t.f_rb || 0
    }));
    const ws1 = XLSX.utils.json_to_sheet(sheet1Data);
    XLSX.utils.book_append_sheet(wb, ws1, "Realisasi Harian");

    // 2. Sheet "Laporan DP1"
    const aoa: any[][] = [];
    const pembagi = db.pembagiTanggal || 24;
    aoa.push(["Pembagi", pembagi]);
    aoa.push([]);
    aoa.push([]);
    aoa.push([]);

    const uniqueYLs = new Map();
    if (db.ylList) {
      db.ylList.forEach((y: any) => {
        if (y.status !== "Resign") {
          uniqueYLs.set(y.nama, { area: y.area, nama: y.nama });
        }
      });
    }
    txs.forEach((t: any) => {
      if (t.nama && !uniqueYLs.has(t.nama)) {
        uniqueYLs.set(t.nama, { area: t.area || "", nama: t.nama });
      }
    });

    const yls = Array.from(uniqueYLs.values()).sort((a: any, b: any) => String(a.area).localeCompare(String(b.area)));

    const ylData = yls.map(yl => {
      const myTxs = txs.filter((t: any) => t.nama === yl.nama);
      const data = {
        rmh_yo: 0, rmh_om: 0, rmh_os: 0, rmh_yt: 0,
        psr_yo: 0, psr_om: 0, psr_os: 0, psr_yt: 0,
        skh_yo: 0, skh_om: 0, skh_os: 0, skh_yt: 0,
        ktr_yo: 0, ktr_om: 0, ktr_os: 0, ktr_yt: 0,
        tk_yo: 0, tk_om: 0, tk_os: 0, tk_yt: 0,
        ib_yo: 0, ib_om: 0, ib_os: 0, ib_yt: 0,
        f_plg: 0, f_rb: 0, pb: 0
      };
      myTxs.forEach((t: any) => {
        data.rmh_yo += Number(t.rmh_yo) || 0; data.rmh_om += Number(t.rmh_om) || 0; data.rmh_os += Number(t.rmh_os) || 0; data.rmh_yt += Number(t.rmh_yt) || 0;
        data.psr_yo += Number(t.psr_yo) || 0; data.psr_om += Number(t.psr_om) || 0; data.psr_os += Number(t.psr_os) || 0; data.psr_yt += Number(t.psr_yt) || 0;
        data.skh_yo += Number(t.skh_yo) || 0; data.skh_om += Number(t.skh_om) || 0; data.skh_os += Number(t.skh_os) || 0; data.skh_yt += Number(t.skh_yt) || 0;
        data.ktr_yo += Number(t.ktr_yo) || 0; data.ktr_om += Number(t.ktr_om) || 0; data.ktr_os += Number(t.ktr_os) || 0; data.ktr_yt += Number(t.ktr_yt) || 0;
        data.tk_yo += Number(t.tk_yo) || 0; data.tk_om += Number(t.tk_om) || 0; data.tk_os += Number(t.tk_os) || 0; data.tk_yt += Number(t.tk_yt) || 0;
        data.ib_yo += Number(t.ib_yo) || 0; data.ib_om += Number(t.ib_om) || 0; data.ib_os += Number(t.ib_os) || 0; data.ib_yt += Number(t.ib_yt) || 0;
        data.f_plg += Number(t.f_plg) || 0;
        data.f_rb += Number(t.f_rb) || 0;
        data.pb += (Number(t.pb_p) || 0) + (Number(t.pb_s) || 0);
      });

      let skhT = 0, skhTm = 0, ktrT = 0, ktrTm = 0, tkoT = 0, tkoTm = 0;
      if (db.potensiTembus) {
        const months = Object.keys(db.potensiTembus).sort();
        if (months.length > 0) {
          const latestMonth = months[months.length - 1];
          const p = db.potensiTembus[latestMonth]?.[yl.nama];
          if (p) {
            skhT = Number(p.skhTotal) || 0; skhTm = Number(p.skhTembus) || 0;
            ktrT = Number(p.kntrTotal) || 0; ktrTm = Number(p.kntrTembus) || 0;
            tkoT = Number(p.tkoTotal) || 0; tkoTm = Number(p.tkoTembus) || 0;
          } else if (db.plgPjlManual?.[yl.nama]) {
            const plg = db.plgPjlManual[yl.nama];
            skhT = Number(plg.skhTgt) || 0; ktrT = Number(plg.kntrTgt) || 0; tkoT = Number(plg.tkTgt) || 0;
          }
        }
      } else if (db.plgPjlManual?.[yl.nama]) {
        const plg = db.plgPjlManual[yl.nama];
        skhT = Number(plg.skhTgt) || 0; ktrT = Number(plg.kntrTgt) || 0; tkoT = Number(plg.tkTgt) || 0;
      }

      return { yl, data, potensi: { skhT, skhTm, ktrT, ktrTm, tkoT, tkoTm } };
    });

    const buildBlock = (ylItem: any) => {
      const b: any[][] = [];
      b.push([ `${ylItem.yl.area}   ${ylItem.yl.nama}`, "AKM", "", "RATA RATA", "", "PERSEN", "" ]);
      const d = ylItem.data;
      const sectors = [
        { label: "RUMAH", keys: ["rmh_yo", "rmh_om", "rmh_os", "rmh_yt"] as const },
        { label: "PASAR", keys: ["psr_yo", "psr_om", "psr_os", "psr_yt"] as const },
        { label: "SEKOLAH", keys: ["skh_yo", "skh_om", "skh_os", "skh_yt"] as const },
        { label: "KANTOR", keys: ["ktr_yo", "ktr_om", "ktr_os", "ktr_yt"] as const },
        { label: "TOKO", keys: ["tk_yo", "tk_om", "tk_os", "tk_yt"] as const },
        { label: "IB", keys: ["ib_yo", "ib_om", "ib_os", "ib_yt"] as const }
      ];

      const totProd = {
        yo: sectors.reduce((sum, s) => sum + (d[s.keys[0]] || 0), 0),
        om: sectors.reduce((sum, s) => sum + (d[s.keys[1]] || 0), 0),
        os: sectors.reduce((sum, s) => sum + (d[s.keys[2]] || 0), 0),
        yt: sectors.reduce((sum, s) => sum + (d[s.keys[3]] || 0), 0),
      };
      const grandTotal = totProd.yo + totProd.om + totProd.os + totProd.yt;
      const fmtP = (num: number, den: number) => den ? `${((num/den)*100).toFixed(2).replace('.',',')}%` : "0,00%";
      const fmtN = (num: number) => num ? Number(num.toFixed(2)) : 0;

      sectors.forEach(sec => {
        const sYo = d[sec.keys[0]] || 0, sOm = d[sec.keys[1]] || 0, sOs = d[sec.keys[2]] || 0, sYt = d[sec.keys[3]] || 0;
        const subTotal = sYo + sOm + sOs + sYt;
        
        b.push([ `${sec.label} YO`, sYo || 0, "", fmtN(sYo/pembagi), "", fmtP(sYo, totProd.yo), "" ]);
        b.push([ `${sec.label} OM`, sOm || 0, "", fmtN(sOm/pembagi), "", fmtP(sOm, totProd.om), "" ]);
        b.push([ `${sec.label} OS`, sOs || 0, "", fmtN(sOs/pembagi), "", fmtP(sOs, totProd.os), "" ]);
        b.push([ `${sec.label} YT`, sYt || 0, subTotal || 0, fmtN(sYt/pembagi), fmtN(subTotal/pembagi), fmtP(sYt, totProd.yt), fmtP(subTotal, grandTotal) ]);
      });

      b.push([ "", totProd.yo || 0, "", fmtN(totProd.yo/pembagi), "", fmtP(totProd.yo, totProd.yo), "" ]);
      b.push([ "", totProd.om || 0, "", fmtN(totProd.om/pembagi), "", fmtP(totProd.om, totProd.om), "" ]);
      b.push([ "", totProd.os || 0, "", fmtN(totProd.os/pembagi), "", fmtP(totProd.os, totProd.os), "" ]);
      b.push([ "total", totProd.yt || 0, grandTotal || 0, fmtN(totProd.yt/pembagi), fmtN(grandTotal/pembagi), fmtP(totProd.yt, totProd.yt), fmtP(grandTotal, grandTotal) ]);

      b.push([ "JLM PLG", d.f_plg || 0, "", "", "", "", "" ]);
      b.push([ "PLG RUTIN", "", "0,00%", "", "", "", "" ]);
      b.push([ "RB", d.f_rb || 0, "", "", "", "", "" ]);
      b.push([ "PB", d.pb || 0, "", "", "", "", "" ]);
      b.push([ "TTL SKLH/TMBS", `${ylItem.potensi.skhT}/${ylItem.potensi.skhTm}`, "", "", "", "", "" ]);
      b.push([ "TTL KNTR/TMBS", `${ylItem.potensi.ktrT}/${ylItem.potensi.ktrTm}`, "", "", "", "", "" ]);
      b.push([ "TTL TKO/TMBS", `${ylItem.potensi.tkoT}/${ylItem.potensi.tkoTm}`, "", "", "", "", "" ]);

      return b;
    };

    for (let i = 0; i < ylData.length; i += 2) {
      const block1 = buildBlock(ylData[i]);
      const block2 = (i + 1 < ylData.length) ? buildBlock(ylData[i+1]) : null;

      for (let r = 0; r < 35; r++) {
        const row = [""]; // Col A
        if (block1 && block1[r]) {
          row.push(...block1[r]);
        } else {
          row.push("", "", "", "", "", "", "");
        }
        row.push(""); // Col I

        if (block2 && block2[r]) {
          row.push(...block2[r]);
        } else {
          row.push("", "", "", "", "", "", "");
        }
        aoa.push(row);
      }
      aoa.push([]);
      aoa.push([]);
    }

    const ws2 = XLSX.utils.aoa_to_sheet(aoa);
    XLSX.utils.book_append_sheet(wb, ws2, "Laporan DP1");

    // Send file
    """

with open("server.ts", "w") as f:
    f.write(content[:start_idx] + new_logic + content[end_idx:])
