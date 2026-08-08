const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// replace local safeFetchJson
code = code.replace(
  /\s*const safeFetchJson = async \(url: string\) => \{\n\s*try \{\n\s*const r = await fetch\(url\);\n\s*if \(!r\.ok\) return null;\n\s*return await r\.json\(\);\n\s*\} catch \(e\) \{\n\s*console\.warn\(`Fetch failed for \$\{url\}`\, e\);\n\s*return null;\n\s*\}\n\s*\};\n/,
  '\n'
);
code = code.replace(
  /\s*const safeFetchJson = async \(url: string\) => \{\n\s*try \{\n\s*const r = await fetch\(url\);\n\s*if \(!r\.ok\) return null;\n\s*return await r\.json\(\);\n\s*\} catch \(e\) \{\n\s*console\.warn\(`Fetch failed for \$\{url\}`\, e\);\n\s*return null;\n\s*\}\n\s*\};\n/,
  '\n'
);

fs.writeFileSync('src/App.tsx', code);
