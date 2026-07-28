import fs from "fs";
const db = JSON.parse(fs.readFileSync("data.json", "utf-8"));
console.log("breakdownRealisasi Keys:", Object.keys(db.breakdownRealisasi || {}));
if (db.breakdownRealisasi) {
  const m = Object.keys(db.breakdownRealisasi)[0];
  if (m) console.log("pembagi:", db.breakdownRealisasi[m]["201"]?.pembagiTanggal);
}
