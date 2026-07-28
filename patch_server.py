with open("server.ts", "r") as f:
    content = f.read()

import re

# We will modify resetDataThreeMonths to accept cutoffDate in preview and confirm

new_reset = """// Reset Data Manual
app.post("/api/resetDataManual", (req, res) => {
  const { action, cutoffDate } = req.body;
  const db = loadData();
  const txs = db.transactions || [];

  if (!cutoffDate) {
    return res.status(400).json({ error: "Tanggal cutoff tidak valid." });
  }

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
    const keptTxs = txs.filter((t: any) => t.tanggal >= cutoffDate);
    db.transactions = keptTxs;
    saveData(db);
    return res.json({
      ok: true,
      message: `Data transaksi sebelum ${cutoffDate} berhasil dihapus.`,
      remainingRecords: keptTxs.length
    });
  }

  res.status(400).json({ error: "Aksi tidak valid." });
});"""

content = re.sub(r'// Reset Data 3 Bulan.*?res\.status\(400\)\.json\({ error: "Aksi tidak valid\." }\);\n}\);', new_reset, content, flags=re.DOTALL)

with open("server.ts", "w") as f:
    f.write(content)
