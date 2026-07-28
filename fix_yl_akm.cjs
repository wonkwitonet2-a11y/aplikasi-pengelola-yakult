const fs = require('fs');
let content = fs.readFileSync('src/components/YLView.tsx', 'utf8');

const regex = /let mYo = 0, mOm = 0, mOs = 0, mYt = 0;/;
const replacement = `let mYo = 0, mOm = 0, mOs = 0, mYt = 0;
  
  if (ylBreakdownRealisasi && ylBreakdownRealisasi.days) {
    Object.values(ylBreakdownRealisasi.days).forEach(d => {
      mYo += d.yo || 0;
      mOm += d.om || 0;
      mOs += d.os || 0;
      mYt += d.yt || 0;
    });
  } else {
    currentMonthTxs.forEach(t => {
      mYo += t.tot_yo || 0;
      mOm += t.tot_om || 0;
      mOs += t.tot_os || 0;
      mYt += t.tot_yt || 0;
    });
  }`;

content = content.replace(regex, replacement);

const regex2 = /mYo \+= t\.tot_yo \|\| 0;\n\s*mOm \+= t\.tot_om \|\| 0;\n\s*mOs \+= t\.tot_os \|\| 0;\n\s*mYt \+= t\.tot_yt \|\| 0;/;
content = content.replace(regex2, '');

fs.writeFileSync('src/components/YLView.tsx', content);
