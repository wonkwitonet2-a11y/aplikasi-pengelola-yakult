import fs from "fs";
const db = JSON.parse(fs.readFileSync("data.json", "utf-8"));
console.log("Global keys:", Object.keys(db));
console.log("pembagiTanggal:", db.pembagiTanggal);
if (db.targetTKU) console.log("targetTKU e6 (pembagi?):", db.targetTKU.e6);
