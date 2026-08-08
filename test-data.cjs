const fs = require("fs");
const db = JSON.parse(fs.readFileSync("data.json", "utf-8"));
console.log("Transactions count:", db.transactions?.length);
const months = {};
if (db.transactions) {
  for (const t of db.transactions) {
    const month = (t.tanggal || "").substring(0, 7);
    months[month] = (months[month] || 0) + 1;
  }
}
console.log("Months:", months);
