const fs = require('fs');
let code = fs.readFileSync('src/lib/storage.ts', 'utf8');
code = code.replace(
  /localStorage\.setItem\("yakult_yl_list", JSON\.stringify\(newList\)\);/m,
  `const listToStore = newList.map(y => {
      const { foto, ...rest } = y as any;
      return rest;
    });
    localStorage.setItem("yakult_yl_list", JSON.stringify(listToStore));`
);
fs.writeFileSync('src/lib/storage.ts', code);
