const fs = require('fs');
let content = fs.readFileSync('src/components/YLView.tsx', 'utf8');

content = content.replace(/\{\["yo", "om", "os", "yt"\]\.map\(prod => \{/, '{ (["yo", "om", "os", "yt"] as const).map(prod => {');
fs.writeFileSync('src/components/YLView.tsx', content);
