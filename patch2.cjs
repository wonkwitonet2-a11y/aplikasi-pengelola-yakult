const fs = require('fs');
let content = fs.readFileSync('src/components/ManagerView.tsx', 'utf8');
const search = `    const getTop = (key: keyof typeof list[0], ascending = false) => {
      if (list.length === 0) return null;
      const sorted = [...list].sort((a, b) => ascending ? (a[key] as number) - (b[key] as number) : (b[key] as number) - (a[key] as number));`;
const replace = `    const getTop = (key: keyof typeof list[0], ascending = false) => {
      if (list.length === 0) return null;
      let validList = list;
      if (key !== "akmBb") {
        validList = list.filter(item => (item[key] as number) > 0);
      }
      if (validList.length === 0) return null;
      const sorted = [...validList].sort((a, b) => ascending ? (a[key] as number) - (b[key] as number) : (b[key] as number) - (a[key] as number));`;
if (content.includes(search)) {
    fs.writeFileSync('src/components/ManagerView.tsx', content.replace(search, replace));
    console.log("Patched successfully");
} else {
    console.log("Could not find content");
}
