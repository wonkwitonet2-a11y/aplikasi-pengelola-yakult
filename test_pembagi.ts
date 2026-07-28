import fs from "fs";
const db = JSON.parse(fs.readFileSync("data.json", "utf-8"));
console.log("Global pembagiTanggal:", db.pembagiTanggal);
const br = db.breakdownRealisasi || {};
const months = Object.keys(br);
console.log("breakdownRealisasi months:", months);
if (months.length > 0) {
  const m = months[months.length - 1];
  console.log(`Month ${m} sample keys:`, Object.keys(br[m]).slice(0, 3));
  console.log(`Month ${m} sample data:`, br[m][Object.keys(br[m])[0]]?.pembagiTanggal);
}
