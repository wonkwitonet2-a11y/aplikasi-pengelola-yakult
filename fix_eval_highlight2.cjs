const fs = require('fs');
let content = fs.readFileSync('src/components/ManagerView.tsx', 'utf8');

// The faulty section:
// })()}}
//   </tr>
// ))}

content = content.replace(/\}\)\(\)\}\}\s*<\/tr>\s*\}\)\}/, '})()}');
fs.writeFileSync('src/components/ManagerView.tsx', content);
