const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  /app\.get\("\/api\/getYlList", \(req, res\) => \{\n\s*const db = loadData\(\);\n\s*res\.json\(\{ ylList: db\.ylList \|\| INITIAL_YL_LIST, managerPin: db\.managerPin \|\| "1111" \}\);\n\}\);/m,
  `app.get("/api/getYlList", (req, res) => {
  const db = loadData();
  const listWithoutFotos = (db.ylList || INITIAL_YL_LIST).map((y: any) => {
    const { foto, ...rest } = y;
    return rest;
  });
  res.json({ ylList: listWithoutFotos, managerPin: db.managerPin || "1111" });
});`
);

// also let's check for any other places where ylList is returned, e.g., in /api/getDashboard, /api/auth
// In /api/auth, the YL login returns the yl list? No, it shouldn't.

fs.writeFileSync('server.ts', code);
