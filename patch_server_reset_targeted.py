with open("server.ts", "r") as f:
    content = f.read()

import re

new_endpoint = """// Reset Data Khusus (4 Kategori)
app.post("/api/resetDataTargeted", (req, res) => {
  const { scope, currentMonth } = req.body;
  const db = loadData();

  if (scope === "all") {
    db.plgPjlManual = {};
    db.potensiTembus = {};
    db.transactions = [];
    db.breakdownRealisasi = {};
    db.lhppRealisasi = {};
    db.targetTKU = { target: 0, bln_lalu: 0, thn_lalu: 0, target_yo: 0, target_om: 0, target_os: 0, target_yt: 0, bln_lalu_yo: 0, bln_lalu_om: 0, bln_lalu_os: 0, bln_lalu_yt: 0, thn_lalu_yo: 0, thn_lalu_om: 0, thn_lalu_os: 0, thn_lalu_yt: 0 };
    db.targetYL = {};
  } else if (scope === "current_month" && currentMonth) {
    if (db.plgPjlManual) delete db.plgPjlManual[currentMonth];
    if (db.potensiTembus) delete db.potensiTembus[currentMonth];
    if (db.transactions) {
      db.transactions = db.transactions.filter((t: any) => !t.tanggal.startsWith(currentMonth));
    }
    if (db.breakdownRealisasi) delete db.breakdownRealisasi[currentMonth];
    if (db.lhppRealisasi) {
      Object.keys(db.lhppRealisasi).forEach(date => {
        if (date.startsWith(currentMonth)) delete db.lhppRealisasi[date];
      });
    }
    db.targetTKU = { target: 0, bln_lalu: 0, thn_lalu: 0, target_yo: 0, target_om: 0, target_os: 0, target_yt: 0, bln_lalu_yo: 0, bln_lalu_om: 0, bln_lalu_os: 0, bln_lalu_yt: 0, thn_lalu_yo: 0, thn_lalu_om: 0, thn_lalu_os: 0, thn_lalu_yt: 0 };
    if (db.targetYL) {
      Object.keys(db.targetYL).forEach(key => {
        if (key.endsWith(currentMonth)) delete db.targetYL[key];
      });
    }
  } else {
    return res.status(400).json({ error: "Parameter tidak valid." });
  }

  saveData(db);
  res.json({ ok: true, message: `Data PLG & PJL, Input PJL, BD & Realisasi, dan Target (${scope === "all" ? "SEMUA RIWAYAT" : "BULAN " + currentMonth}) berhasil dihapus.` });
});"""

content = content + "\n\n" + new_endpoint

with open("server.ts", "w") as f:
    f.write(content)
