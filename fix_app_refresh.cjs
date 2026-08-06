const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');
content = content.replaceAll('onRefresh={refreshAllData}', 'onRefresh={refreshAllData}\n        isRefreshing={loading}');
// To clean up if it got double added on the first one:
content = content.replace('isRefreshing={loading}\n          isRefreshing={loading}', 'isRefreshing={loading}');
fs.writeFileSync('src/App.tsx', content);
