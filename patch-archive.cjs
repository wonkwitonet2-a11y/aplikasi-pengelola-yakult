const fs = require('fs');
let code = fs.readFileSync('src/components/archive/ArchiveEditor.tsx', 'utf8');

const potensiHandler = `
                       onTxFieldChange: (ylKey, field, val) => {
                          const dummyDate = selectedMonth + "-99";
                          const cleanYl = ylKey.replace(/^\\d+\\s*/, "").toUpperCase();
                          setSnapshot(prev => {
                            const next = { ...prev };
                            if (!next.transactions) next.transactions = [];
                            
                            let dummyTx = next.transactions.find(t => t.tanggal === dummyDate && (t.nama === ylKey || (t.nama && t.nama.includes(cleanYl))));
                            if (!dummyTx) {
                               dummyTx = { id: "manual-" + cleanYl, tanggal: dummyDate, nama: ylKey, area: "" };
                               next.transactions.push(dummyTx);
                            }
                            
                            // For aggregate metrics, we just set the whole value on the dummyTx since other real txs are ignored in total calculations (if they don't exist in archive)
                            dummyTx[field] = val;
                            return next;
                          });
                       },
                       onPotensiChange: (ylKey, field, val) => {
                          const cleanYl = ylKey.replace(/^\\d+\\s*/, "").toUpperCase();
                          setSnapshot(prev => {
                            const next = { ...prev };
                            if (!next.potensiTembus) next.potensiTembus = {};
                            if (!next.potensiTembus[selectedMonth]) next.potensiTembus[selectedMonth] = {};
                            
                            const monthData = next.potensiTembus[selectedMonth];
                            if (!monthData[cleanYl]) monthData[cleanYl] = { nama: ylKey };
                            monthData[cleanYl][field] = val;
                            return next;
                          });
                       }
`;

code = code.replace(/onAkmPaste: \(e, ylKey, startIndex\) => \{/, 
  potensiHandler + '\n                       onAkmPaste: (e, ylKey, startIndex) => {');

// 2. Add TargetManagerRow to target tab
const targetTabStr = `<h2 className="text-sm font-black text-slate-900 mb-4">Target Yakult Lady (ARSIP)</h2>
                   <table className="w-full border-collapse text-xs">`;

const targetManagerRowStr = `<h2 className="text-sm font-black text-slate-900 mb-4">Target Yakult Lady (ARSIP)</h2>
                   
                   {/* Target Manager Row for Archive */}
                   <TargetManagerRow 
                      targetTKU={snapshot.targetTKU || { target: 0, bln_lalu: 0, thn_lalu: 0 }}
                      onChange={(field, val) => {
                        setSnapshot(prev => ({
                           ...prev,
                           targetTKU: { ...(prev.targetTKU || {}), [field]: val }
                        }));
                      }}
                   />
                   
                   <div className="h-4"></div>

                   <table className="w-full border-collapse text-xs">`;

code = code.replace(targetTabStr, targetManagerRowStr);

fs.writeFileSync('src/components/archive/ArchiveEditor.tsx', code);
