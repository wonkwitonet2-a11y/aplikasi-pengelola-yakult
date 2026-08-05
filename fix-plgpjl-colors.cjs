const fs = require('fs');
let code = fs.readFileSync('src/components/PlgPjlView.tsx', 'utf8');

code = code.replace(/text-\\\$\{color\}-950/g, 'text-amber-950'); // Temporary string match to fix the broken template literals, wait, let's just do a clean regex over the exact strings that were injected.

code = code.replace(/className=\{\`w-full text-sm font-black text-\\\$\{color\}-950 bg-white border border-\\\$\{color\}-300 rounded px-1 outline-none focus:ring-2 focus:ring-\\\$\{color\}-500\`\}/g, function(match, offset, string) {
    if (string.substring(offset - 100, offset).includes('"f_rb"')) return '"w-full text-sm font-black text-amber-950 bg-white border border-amber-300 rounded px-1 outline-none focus:ring-2 focus:ring-amber-500"';
    if (string.substring(offset - 100, offset).includes('"pb_p"')) return '"w-full text-sm font-black text-emerald-950 bg-white border border-emerald-300 rounded px-1 outline-none focus:ring-2 focus:ring-emerald-500"';
    if (string.substring(offset - 100, offset).includes('"bb_yo"')) return '"w-full text-sm font-black text-rose-950 bg-white border border-rose-300 rounded px-1 outline-none focus:ring-2 focus:ring-rose-500"';
    return match;
});

code = code.replace(/className=\{\`text-sm font-black text-\\\$\{color\}-950\`\}/g, function(match, offset, string) {
    if (string.substring(offset - 250, offset).includes('"f_rb"')) return '"text-sm font-black text-amber-950"';
    if (string.substring(offset - 250, offset).includes('"pb_p"')) return '"text-sm font-black text-emerald-950"';
    if (string.substring(offset - 250, offset).includes('"bb_yo"')) return '"text-sm font-black text-rose-950"';
    return match;
});

fs.writeFileSync('src/components/PlgPjlView.tsx', code);
