const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(
  /if \(breakdownPlan && typeof breakdownPlan === "object"\) {\n\s*if \(\!db\.breakdownPlan\) db\.breakdownPlan = \{\};\n\s*db\.breakdownPlan\[month\] = breakdownPlan;\n\s*}/m,
  `if (breakdownPlan && typeof breakdownPlan === "object") {
      if (!db.breakdownPlan) db.breakdownPlan = {};
      // ONLY overwrite if the incoming plan has keys, or if the current plan is already empty
      if (Object.keys(breakdownPlan).length > 0 || !db.breakdownPlan[month] || Object.keys(db.breakdownPlan[month]).length === 0) {
        db.breakdownPlan[month] = breakdownPlan;
      }
    }`
);
fs.writeFileSync('server.ts', code);
