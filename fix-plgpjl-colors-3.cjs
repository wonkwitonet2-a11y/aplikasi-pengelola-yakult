const fs = require('fs');
let code = fs.readFileSync('src/components/PlgPjlView.tsx', 'utf8');

code = code.replace(/<input type="number" className=\{`w-full text-sm font-black text-\$\{color\}-950 bg-white border border-\$\{color\}-300 rounded px-1 outline-none focus:ring-2 focus:ring-\$\{color\}-500`\} value=\{totalRb === 0 \? "" : totalRb\} onChange=\{\(e\) => historicalData.onTxFieldChange\?\.\(currentYl.nama, "f_rb", parseInt\(e.target.value\) \|\| 0\)\} \/>/g, 
  '<input type="number" className="w-full text-sm font-black text-amber-950 bg-white border border-amber-300 rounded px-1 outline-none focus:ring-2 focus:ring-amber-500" value={totalRb === 0 ? "" : totalRb} onChange={(e) => historicalData.onTxFieldChange?.(currentYl.nama, "f_rb", parseInt(e.target.value) || 0)} />');

code = code.replace(/<input type="number" className=\{`w-full text-sm font-black text-\$\{color\}-950 bg-white border border-\$\{color\}-300 rounded px-1 outline-none focus:ring-2 focus:ring-\$\{color\}-500`\} value=\{totalPb === 0 \? "" : totalPb\} onChange=\{\(e\) => historicalData.onTxFieldChange\?\.\(currentYl.nama, "pb_p", parseInt\(e.target.value\) \|\| 0\)\} \/>/g, 
  '<input type="number" className="w-full text-sm font-black text-emerald-950 bg-white border border-emerald-300 rounded px-1 outline-none focus:ring-2 focus:ring-emerald-500" value={totalPb === 0 ? "" : totalPb} onChange={(e) => historicalData.onTxFieldChange?.(currentYl.nama, "pb_p", parseInt(e.target.value) || 0)} />');

code = code.replace(/<input type="number" className=\{`w-full text-sm font-black text-\$\{color\}-950 bg-white border border-\$\{color\}-300 rounded px-1 outline-none focus:ring-2 focus:ring-\$\{color\}-500`\} value=\{totalBb === 0 \? "" : totalBb\} onChange=\{\(e\) => historicalData.onTxFieldChange\?\.\(currentYl.nama, "bb_yo", parseInt\(e.target.value\) \|\| 0\)\} \/>/g, 
  '<input type="number" className="w-full text-sm font-black text-rose-950 bg-white border border-rose-300 rounded px-1 outline-none focus:ring-2 focus:ring-rose-500" value={totalBb === 0 ? "" : totalBb} onChange={(e) => historicalData.onTxFieldChange?.(currentYl.nama, "bb_yo", parseInt(e.target.value) || 0)} />');

code = code.replace(/<span "text-sm font-black text-amber-950">/g, '<span className="text-sm font-black text-amber-950">');
code = code.replace(/<span "text-sm font-black text-emerald-950">/g, '<span className="text-sm font-black text-emerald-950">');
code = code.replace(/<span "text-sm font-black text-rose-950">/g, '<span className="text-sm font-black text-rose-950">');

fs.writeFileSync('src/components/PlgPjlView.tsx', code);
