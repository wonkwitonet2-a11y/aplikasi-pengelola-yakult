const fs = require('fs');
let code = fs.readFileSync('src/components/PlgPjlView.tsx', 'utf8');

const editableMetric = (val, fieldName) => {
   return `{historicalData?.editableAkm && !isTkuDp1 ? (
      <input type="number" className="w-full text-sm font-black text-slate-950 bg-white border border-slate-300 rounded px-1 outline-none focus:ring-2 focus:ring-cyan-500" value={${val} === 0 ? "" : ${val}} onChange={(e) => historicalData.onTxFieldChange?.(currentYl.nama, "${fieldName}", parseInt(e.target.value) || 0)} />
   ) : (
      <span className="text-sm font-black text-slate-950">{fmtInt(${val})}</span>
   )}`;
}
const editableMetricColor = (val, fieldName, color) => {
   return `{historicalData?.editableAkm && !isTkuDp1 ? (
      <input type="number" className={\`w-full text-sm font-black text-\${color}-950 bg-white border border-\${color}-300 rounded px-1 outline-none focus:ring-2 focus:ring-\${color}-500\`} value={${val} === 0 ? "" : ${val}} onChange={(e) => historicalData.onTxFieldChange?.(currentYl.nama, "${fieldName}", parseInt(e.target.value) || 0)} />
   ) : (
      <span className={\`text-sm font-black text-\${color}-950\`}>{fmtInt(${val})}</span>
   )}`;
}

code = code.replace(/<span className="text-sm font-black text-slate-950">\{fmtInt\(totalPlg\)\}<\/span>/, editableMetric("totalPlg", "f_plg"));
code = code.replace(/<span className="text-sm font-black text-slate-950">\{fmtInt\(totalRk\)\}<\/span>/, editableMetric("totalRk", "f_rk"));
code = code.replace(/<span className="text-sm font-black text-slate-950">\{fmtInt\(totalRa\)\}<\/span>/, editableMetric("totalRa", "f_ra"));
code = code.replace(/<span className="text-sm font-black text-amber-950">\{fmtInt\(totalRb\)\}<\/span>/, editableMetricColor("totalRb", "f_rb", "amber"));
code = code.replace(/<span className="text-sm font-black text-emerald-950">\{fmtInt\(totalPb\)\}<\/span>/, editableMetricColor("totalPb", "pb_p", "emerald"));
code = code.replace(/<span className="text-sm font-black text-rose-950">\{fmtInt\(totalBb\)\}<\/span>/, editableMetricColor("totalBb", "bb_yo", "rose"));

// For manual forms, we need to update `disabled` and add `onChange`
code = code.replace(/disabled=\{true\}\n\s*value=\{manualSklhTotal\}\n\s*onChange=\{\(\) => \{\}\}/, 
  `disabled={!historicalData?.editableAkm || isTkuDp1}\n                      value={manualSklhTotal}\n                      onChange={(val) => historicalData?.onPotensiChange?.(currentYl.nama, "skhTotal", val)}`);
code = code.replace(/disabled=\{true\}\n\s*value=\{manualSklhTembus\}\n\s*onChange=\{\(\) => \{\}\}/, 
  `disabled={!historicalData?.editableAkm || isTkuDp1}\n                      value={manualSklhTembus}\n                      onChange={(val) => historicalData?.onPotensiChange?.(currentYl.nama, "skhTembus", val)}`);
  
code = code.replace(/disabled=\{true\}\n\s*value=\{manualKntrTotal\}\n\s*onChange=\{\(\) => \{\}\}/, 
  `disabled={!historicalData?.editableAkm || isTkuDp1}\n                      value={manualKntrTotal}\n                      onChange={(val) => historicalData?.onPotensiChange?.(currentYl.nama, "kntrTotal", val)}`);
code = code.replace(/disabled=\{true\}\n\s*value=\{manualKntrTembus\}\n\s*onChange=\{\(\) => \{\}\}/, 
  `disabled={!historicalData?.editableAkm || isTkuDp1}\n                      value={manualKntrTembus}\n                      onChange={(val) => historicalData?.onPotensiChange?.(currentYl.nama, "kntrTembus", val)}`);
  
code = code.replace(/disabled=\{true\}\n\s*value=\{manualTkoTotal\}\n\s*onChange=\{\(\) => \{\}\}/, 
  `disabled={!historicalData?.editableAkm || isTkuDp1}\n                      value={manualTkoTotal}\n                      onChange={(val) => historicalData?.onPotensiChange?.(currentYl.nama, "tkoTotal", val)}`);
code = code.replace(/disabled=\{true\}\n\s*value=\{manualTkoTembus\}\n\s*onChange=\{\(\) => \{\}\}/, 
  `disabled={!historicalData?.editableAkm || isTkuDp1}\n                      value={manualTkoTembus}\n                      onChange={(val) => historicalData?.onPotensiChange?.(currentYl.nama, "tkoTembus", val)}`);


fs.writeFileSync('src/components/PlgPjlView.tsx', code);
