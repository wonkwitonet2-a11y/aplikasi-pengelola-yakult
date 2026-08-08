const fs = require("fs");
const db = JSON.parse(fs.readFileSync("data.json", "utf-8"));
for (const k of Object.keys(db)) {
  console.log(k, JSON.stringify(db[k]).length);
}
