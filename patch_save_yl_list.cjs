const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  /res\.json\(\{ ok: true, ylList: db\.ylList, managerPin: db\.managerPin, ylPins: db\.ylPins \}\);/m,
  `const listWithoutFotos = (db.ylList || []).map((y: any) => {
    const { foto, ...rest } = y;
    return rest;
  });
  res.json({ ok: true, ylList: listWithoutFotos, managerPin: db.managerPin, ylPins: db.ylPins });`
);

fs.writeFileSync('server.ts', code);
