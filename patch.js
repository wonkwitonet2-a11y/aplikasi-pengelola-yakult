const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(
  /app\.get\("\/api\/getBreakdownPlan", \(req, res\) => {[\s\S]*?res\.json\({ ok: true, month, breakdownPlan: planData, breakdownRealisasi: realisasiData }\);\n}\);/m,
  `app.get("/api/getBreakdownPlan", (req, res) => {
  const month = (req.query.month as string) || new Date().toISOString().substring(0, 7);
  const db = loadData();
  let planData = (db.breakdownPlan && db.breakdownPlan[month]) ? db.breakdownPlan[month] : {};
  const realisasiData = (db.breakdownRealisasi && db.breakdownRealisasi[month]) ? db.breakdownRealisasi[month] : {};
  
  if (Object.keys(planData).length === 0 && Object.keys(realisasiData).length > 0) {
    planData = realisasiData;
    if (!db.breakdownPlan) db.breakdownPlan = {};
    db.breakdownPlan[month] = planData;
    saveData(db);
  }

  res.json({ ok: true, month, breakdownPlan: planData, breakdownRealisasi: realisasiData });
});`
);
fs.writeFileSync('server.ts', code);
