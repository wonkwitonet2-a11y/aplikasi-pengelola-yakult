const fs = require('fs');
let code = fs.readFileSync('src/components/PlgPjlView.tsx', 'utf8');

if(!code.includes('editableAkm')) {
    code = code.replace(/historicalData\?: \{\n    transactions: Transaction\[\];/m, 
`historicalData?: {
    transactions: Transaction[];
    editableAkm?: boolean;
    onAkmChange?: (ylKey: string, secKey: string, prodCode: string, val: number) => void;
    onAkmPaste?: (e: React.ClipboardEvent, ylKey: string, startIndex: number) => void;`);

    // In the interface destruction
    code = code.replace(/  historicalMonth = null,\n  historicalData = null/m,
`  historicalMonth = null,
  historicalData = null`);

    const akmRowStr = `{/* 2. AKM Row */}
                          <td className="p-2 text-right border-r border-slate-400 font-black text-slate-900">
                            {fmtInt(valAkm)}
                          </td>`;

    const editableAkmStr = `{/* 2. AKM Row */}
                          <td className="p-0 border-r border-slate-400 font-black text-slate-900">
                            {historicalData?.editableAkm && !isTkuDp1 ? (
                              <input
                                type="number"
                                className="w-full h-full p-2 text-right bg-yellow-50 outline-none focus:bg-yellow-200 focus:ring-2 focus:ring-yellow-500 font-black text-slate-900 border-none"
                                value={valAkm === 0 ? "" : valAkm}
                                onChange={(e) => historicalData.onAkmChange?.(currentYl.nama, sec.key, prod.code, parseInt(e.target.value) || 0)}
                                onPaste={(e) => {
                                  // Compute global row index for paste (24 rows total)
                                  const secIndex = sectorConfigs.findIndex(s => s.key === sec.key);
                                  const startIndex = secIndex * 4 + pIdx;
                                  historicalData.onAkmPaste?.(e, currentYl.nama, startIndex);
                                }}
                              />
                            ) : (
                              <div className="p-2 text-right">{fmtInt(valAkm)}</div>
                            )}
                          </td>`;
    
    code = code.replace(akmRowStr, editableAkmStr);
    
    fs.writeFileSync('src/components/PlgPjlView.tsx', code);
    console.log("PlgPjlView patched!");
} else {
    console.log("Already patched");
}
