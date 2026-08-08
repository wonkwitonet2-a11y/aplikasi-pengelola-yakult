const fs = require("fs");
const db = JSON.parse(fs.readFileSync("data.json", "utf-8"));
console.log(db.supabaseConfig);
