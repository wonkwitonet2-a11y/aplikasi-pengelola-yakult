const fs = require('fs');
let content = fs.readFileSync('src/components/ManagerView.tsx', 'utf8');

content = content.replace(/{kontesConfig\.enabled && \(\n          <button/g, '');

fs.writeFileSync('src/components/ManagerView.tsx', content);
