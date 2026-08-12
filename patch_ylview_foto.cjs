const fs = require('fs');
let code = fs.readFileSync('src/components/YLView.tsx', 'utf8');

code = code.replace(
  /safeFetchJson<\{ ok: boolean; foto\?: string \}>\(`\/api\/getYlFoto\?nama=\$\{encodeURIComponent\(ylName\)\}`\)/m,
  `safeFetchJson<{ ok: boolean; foto?: string }>(\`/api/getYlFoto?nama=\${encodeURIComponent(ylName)}&t=\${Date.now()}\`)`
);

fs.writeFileSync('src/components/YLView.tsx', code);
