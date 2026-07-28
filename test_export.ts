import fs from "fs";
const file = fs.readFileSync("data.json", "utf-8");
const db = JSON.parse(file);
console.log(Object.keys(db));
