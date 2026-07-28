import re

with open("server.ts", "r") as f:
    content = f.read()

export_code = """
app.get("/api/exportRealisasi", async (req, res) => {
  try {
    const XLSX = require("xlsx");
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

    // 2. Sheet "Potensi vs Tembus"
    const potensiTembusData = [];
    const potensiTembus = db.potensiTembus || {};
    for (const [bulan, yls] of Object.entries(potensiTembus)) {
      for (const [nama, data] of Object.entries(yls as any)) {
        const p = data as any;
        potensiTembusData.push({
          "Bulan": bulan,
          "Nama": nama,
          "Sekolah Total": p.skhTotal || 0,
          "Sekolah Tembus": p.skhTembus || 0,
          "Kantor Total": p.kntrTotal || 0,
          "Kantor Tembus": p.kntrTembus || 0,
          "Toko Total": p.tkoTotal || 0,
          "Toko Tembus": p.tkoTembus || 0
        });
      }
    }
    // Also include plgPjlManual data if user wants it, we can put it in a separate sheet or same
    const ws2 = XLSX.utils.json_to_sheet(potensiTembusData);
    XLSX.utils.book_append_sheet(wb, ws2, "Potensi vs Tembus");

    // 2b. Sheet "Plg PJL Manual"
    const plgPjlData = [];
    const plgPjlManual = db.plgPjlManual || {};
    for (const [area, data] of Object.entries(plgPjlManual)) {
      const p = data as any;
      plgPjlData.push({
        "Area": area,
        "Sekolah Total": p.sklh_total || 0,
        "Sekolah Tembus": p.sklh_tembus || 0,
        "Kantor Total": p.kntr_total || 0,
        "Kantor Tembus": p.kntr_tembus || 0,
        "Toko Total": p.tko_total || 0,
        "Toko Tembus": p.tko_tembus || 0
      });
    }
    const ws2b = XLSX.utils.json_to_sheet(plgPjlData);
    XLSX.utils.book_append_sheet(wb, ws2b, "Plg PJL Manual");

    // 3. Sheet "Breakdown Harian"
    const breakdownData = [];
    const breakdownRealisasi = db.breakdownRealisasi || {};
    for (const [month, areas] of Object.entries(breakdownRealisasi)) {
      for (const [area, areaData] of Object.entries(areas as any)) {
        const days = (areaData as any).days || areaData;
        for (const [day, dData] of Object.entries(days as any)) {
          const d = dData as any;
          const total = (d.yo || 0) + (d.om || 0) + (d.os || 0) + (d.yt || 0);
          breakdownData.push({
            "Bulan": month,
            "Area": area,
            "Tanggal": day,
            "YO": d.yo || 0,
            "OM": d.om || 0,
            "OS": d.os || 0,
            "YT": d.yt || 0,
            "Total Botol": total
          });
        }
      }
    }
    const ws3 = XLSX.utils.json_to_sheet(breakdownData);
    XLSX.utils.book_append_sheet(wb, ws3, "Breakdown Harian");

    // Send file
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    res.setHeader("Content-Disposition", `attachment; filename="Laporan_Realisasi_DP1_${timestamp}.xlsx"`);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.send(buffer);
  } catch (error: any) {
    console.error("Export error:", error);
    res.status(500).json({ error: "Failed to export data" });
  }
});

"""

# Insert before `app.post("/api/savePlgPjlManual",`
insert_target = 'app.post("/api/savePlgPjlManual", async (req, res) => {'
if insert_target in content:
    content = content.replace(insert_target, export_code + insert_target)
    with open("server.ts", "w") as f:
        f.write(content)
    print("Success")
else:
    print("Could not find insert target")

