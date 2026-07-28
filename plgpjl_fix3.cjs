const fs = require('fs');
let content = fs.readFileSync('src/components/PlgPjlView.tsx', 'utf8');

// The remnant of successMsg
const regex2 = /\s*\{\/\* Save Button & Notification Toast \*\/\}([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*\);\s*\}/g;

content = content.replace(regex2, '\n        </div>\n      </div>\n    </div>\n  );\n}');

fs.writeFileSync('src/components/PlgPjlView.tsx', content);
