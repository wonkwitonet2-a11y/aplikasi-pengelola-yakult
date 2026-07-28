with open("server.ts", "r") as f:
    content = f.read()

import re

new_reset = """// Reset Data Manual
app.post("/api/resetDataManual", (req, res) => {
  const { action, cutoffDate } = req.body;
  const db = loadData();
  const txs = db.transactions || [];

  if (!cutoffDate) {
    return res.status(400).json({ error: "Tanggal cutoff tidak valid." });
  }

  const cutoffMonth = cutoffDate.substring(0, 7);

  if (action === "preview") {
    const olderTxs = txs.filter((t: any) => t.tanggal < cutoffDate);
    const dates = txs.map((t: any) => t.tanggal).sort();
    return res.json({
      totalRecords: txs.length,
      olderRecordsCount: olderTxs.length,
      earliestDate: dates[0] || "-",
      latestDate: dates[dates.length - 1] || "-",
      cutoffDate: cutoffDate,
      activeYlCount: (db.ylList || []).length
    });
  }

  if (action === "confirm") {
    // 1. Transactions
    const keptTxs = txs.filter((t: any) => t.tanggal >= cutoffDate);
    db.transactions = keptTxs;

    // 2. Month-based stores
    const monthStores = ["breakdownPlan", "breakdownRealisasi", "managerRealisasi", "plgPjlManual", "potensiTembus"];
    monthStores.forEach(storeKey => {
      if (db[storeKey]) {
        const keptData: any = {};
        Object.keys(db[storeKey]).forEach(month => {
          if (month >= cutoffMonth) {
            keptData[month] = db[storeKey][month];
          }
        });
        db[storeKey] = keptData;
      }
    });

    // 3. Date-based stores
    const dateStores = ["lhppRealisasi"];
    dateStores.forEach(storeKey => {
      if (db[storeKey]) {
        const keptData: any = {};
        Object.keys(db[storeKey]).forEach(date => {
          if (date >= cutoffDate) {
            keptData[date] = db[storeKey][date];
          }
        });
        db[storeKey] = keptData;
      }
    });

    saveData(db);
    return res.json({
      ok: true,
      message: `Data transaksi dan rekap sebelum ${cutoffDate} berhasil dihapus secara keseluruhan.`,
      remainingRecords: keptTxs.length
    });
  }

  res.status(400).json({ error: "Aksi tidak valid." });
});"""

content = re.sub(r'// Reset Data Manual\napp\.post\("/api/resetDataManual", \(req, res\) => \{.*?\n\}\);', new_reset, content, flags=re.DOTALL)

with open("server.ts", "w") as f:
    f.write(content)
