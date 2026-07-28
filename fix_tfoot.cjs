const fs = require('fs');
let content = fs.readFileSync('src/components/YLView.tsx', 'utf8');

content = content.replace(
  /<td className="p-2 text-center text-rose-300">\{totBb\}<\/td>\s*<td className="p-2 text-center text-lime-300">\{totPb\}<\/td>/,
  '<td className="p-2 text-center text-rose-300">{totBb}</td>\n                            <td className="p-2 text-center text-lime-300">{totPbPagi}</td>\n                            <td className="p-2 text-center text-lime-300">{totPbSore}</td>'
);

fs.writeFileSync('src/components/YLView.tsx', content);
