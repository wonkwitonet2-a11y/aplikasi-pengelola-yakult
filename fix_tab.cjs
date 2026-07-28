const fs = require('fs');
let content = fs.readFileSync('src/components/YLView.tsx', 'utf8');

content = content.replace(/REALISASI POTENSI\s*<button/, 'REALISASI POTENSI\n          </button>\n          <button');
fs.writeFileSync('src/components/YLView.tsx', content);
