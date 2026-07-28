const fs = require('fs');
let content = fs.readFileSync('src/components/YLView.tsx', 'utf8');

content = content.replace(
  /let totBb = 0, totPb = 0, totPlgApk = 0, totSampahBtl = 0, totPlg = 0, totRk = 0, totRa = 0, totRb = 0;/,
  'let totBb = 0, totPbPagi = 0, totPbSore = 0, totPlgApk = 0, totSampahBtl = 0, totPlg = 0, totRk = 0, totRa = 0, totRb = 0;'
);

fs.writeFileSync('src/components/YLView.tsx', content);
