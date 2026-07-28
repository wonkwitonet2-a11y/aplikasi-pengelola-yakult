const fs = require('fs');
let content = fs.readFileSync('src/components/ManagerView.tsx', 'utf8');

const regex = /\{\/\* Tab Kontes \*\/\}\s*\{activeTab === "kontes"[\s\S]*?<\/div>\s*\)\}\s*\{\/\* Tab Realisasi Penjualan & LHPP \*\/\}/;
const replacement = `{/* Tab Realisasi Penjualan & LHPP */}`;

content = content.replace(regex, replacement);
fs.writeFileSync('src/components/ManagerView.tsx', content);
