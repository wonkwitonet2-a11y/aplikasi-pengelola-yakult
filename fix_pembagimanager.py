import re

with open("server.ts", "r") as f:
    content = f.read()

start_marker = 'app.get("/api/getPlgPjlData", async (req, res) => {'
end_marker = 'res.json({'

start_idx = content.find(start_marker)
end_idx = content.find(end_marker, start_idx)

if start_idx == -1 or end_idx == -1:
    print("Could not find markers")
    exit(1)

new_logic = """app.get("/api/getPlgPjlData", async (req, res) => {
  const db = loadData();
  const ylList = db.ylList || INITIAL_YL_LIST;
  const currentMonth = new Date().toISOString().substring(0, 7);
  const breakdownRealisasiMonth = db.breakdownRealisasi && (db.breakdownRealisasi[currentMonth] || db.breakdownRealisasi["2026-07"]) || {};
  
  let realisasiPembagi = 15;
  const brKeys = Object.keys(breakdownRealisasiMonth);
  if (brKeys.length > 0) {
    const p = breakdownRealisasiMonth[brKeys[0]]?.pembagiTanggal;
    if (p && Number(p) > 0) realisasiPembagi = Number(p);
  }

  const pembagiManager = realisasiPembagi;

  """

with open("server.ts", "w") as f:
    f.write(content[:start_idx] + new_logic + content[end_idx:])
