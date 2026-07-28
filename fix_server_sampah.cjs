const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const regex = /sampahBotol:\s*r\[25\]/;
const replacement = 'sampahBotol: r[26]';

content = content.replace(regex, replacement);
fs.writeFileSync('server.ts', content);
