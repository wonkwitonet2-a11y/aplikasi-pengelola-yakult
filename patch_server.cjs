const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const search = `app.get("/api/getBreakdownPlan", async (req, res) => {
  const db = loadData();
  const reqMonth = (req.query.month as string) || new Date().toISOString().substring(0, 7);
  
  if (!db.breakdownPlan) db.breakdownPlan = {};
  if (!db.breakdownRealisasi) db.breakdownRealisasi = {};

  let plan = db.breakdownPlan[reqMonth];
  let realisasi = db.breakdownRealisasi[reqMonth];

  // If requested month has no data, fallback to latest available month with data or sample month "2026-07"
  if ((!plan || Object.keys(plan).length === 0) && (!realisasi || Object.keys(realisasi).length === 0)) {
    const availableMonths = Array.from(new Set([
      ...Object.keys(db.breakdownPlan),
      ...Object.keys(db.breakdownRealisasi)
    ])).sort().reverse();

    if (availableMonths.length > 0) {
      const fallbackMonth = availableMonths[0];
      plan = db.breakdownPlan[fallbackMonth] || {};
      realisasi = db.breakdownRealisasi[fallbackMonth] || {};
    }
  }

  res.json({
    ok: true,
    month: reqMonth,
    breakdownPlan: plan || {},
    breakdownRealisasi: realisasi || {}
  });
});`;

if (content.includes(search)) {
    content = content.replace(search, '');
    fs.writeFileSync('server.ts', content);
    console.log("Patched server.ts successfully");
} else {
    console.log("Could not find search string in server.ts");
}
