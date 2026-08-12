const fs = require('fs');
const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));
if (data.breakdownRealisasi && data.breakdownRealisasi["2026-08"]) {
  if (!data.breakdownPlan) data.breakdownPlan = {};
  data.breakdownPlan["2026-08"] = JSON.parse(JSON.stringify(data.breakdownRealisasi["2026-08"]));
  fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
  console.log("Restored breakdownPlan for 2026-08 from breakdownRealisasi.");
} else {
  console.log("No breakdownRealisasi for 2026-08 found.");
}
