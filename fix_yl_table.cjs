const fs = require('fs');
let content = fs.readFileSync('src/components/YLView.tsx', 'utf8');

// Change table headers
content = content.replace(
  /<th className="p-2 text-center text-rose-400">BB<\/th>\s*<th className="p-2 text-center text-lime-400">PB<\/th>/,
  '<th className="p-2 text-center text-rose-400">BB</th>\n                            <th className="p-2 text-center text-lime-400">PB Pagi</th>\n                            <th className="p-2 text-center text-lime-400">PB Sore</th>'
);

// Change table values
content = content.replace(
  /const pb = \(tx\?\.pb_p\|\|0\) \+ \(tx\?\.pb_s\|\|0\);/,
  'const pbPagi = tx?.pb_p || 0;\n                            const pbSore = tx?.pb_s || 0;'
);

content = content.replace(
  /totBb \+= bb; totPb \+= pb;/,
  'totBb += bb; totPbPagi += pbPagi; totPbSore += pbSore;'
);

// We also need to add totPbPagi and totPbSore in the let declarations
content = content.replace(
  /let totBb = 0; let totPb = 0;/,
  'let totBb = 0; let totPbPagi = 0; let totPbSore = 0;'
);

// Change table cells
content = content.replace(
  /<td className="p-1\.5 text-center text-rose-700 font-semibold">\{bb \|\| "-"}<\/td>\s*<td className="p-1\.5 text-center text-lime-700 font-semibold">\{pb \|\| "-"}<\/td>/,
  '<td className="p-1.5 text-center text-rose-700 font-semibold">{bb || "-"}</td>\n                                <td className="p-1.5 text-center text-lime-700 font-semibold">{pbPagi || "-"}</td>\n                                <td className="p-1.5 text-center text-lime-700 font-semibold">{pbSore || "-"}</td>'
);

// And update the total row
content = content.replace(
  /<td className="p-1\.5 text-center">\{totBb \|\| "-"}<\/td>\s*<td className="p-1\.5 text-center">\{totPb \|\| "-"}<\/td>/,
  '<td className="p-1.5 text-center">{totBb || "-"}</td>\n                          <td className="p-1.5 text-center">{totPbPagi || "-"}</td>\n                          <td className="p-1.5 text-center">{totPbSore || "-"}</td>'
);

fs.writeFileSync('src/components/YLView.tsx', content);
