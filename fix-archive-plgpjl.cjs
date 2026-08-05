const fs = require('fs');
let code = fs.readFileSync('src/components/archive/ArchiveEditor.tsx', 'utf8');

const plgPjlViewStr = `<PlgPjlView ylList={ylList} historicalMonth={selectedMonth} historicalData={snapshot} />`;

const editableStr = `
                <div>
                   <div className="flex items-center justify-between mb-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                     <p className="text-xs font-bold text-slate-600">
                       💡 Mode Edit Aktif: Anda dapat klik kolom "AKM" untuk mengetik manual, atau <strong className="text-sky-600">Paste (Ctrl+V)</strong> sekumpulan data dari Spreadsheet (Excel/Google Sheets) ke sel AKM RUMAH YO dsb.
                     </p>
                     <div className="flex gap-2">
                       <button
                         onClick={() => {
                           if (confirm("Hapus semua nilai BB (Botol Bawa) dari transaksi di bulan ini?")) {
                             setSnapshot(prev => {
                               const next = { ...prev };
                               if (next.transactions) {
                                 next.transactions.forEach(t => {
                                   t.bb_yo = 0; t.bb_om = 0; t.bb_os = 0; t.bb_yt = 0;
                                   t.tot_yo = 0; t.tot_om = 0; t.tot_os = 0; t.tot_yt = 0;
                                 });
                               }
                               if (next.lhppPdm) {
                                  Object.values(next.lhppPdm).forEach(dt => {
                                      Object.values(dt).forEach(yl => {
                                         if (yl.bb) { yl.bb.yo = 0; yl.bb.om = 0; yl.bb.os = 0; yl.bb.yt = 0; }
                                      });
                                  });
                               }
                               return next;
                             });
                           }
                         }}
                         className="px-3 py-1.5 bg-rose-100 text-rose-700 font-bold rounded shadow-sm hover:bg-rose-200 text-xs flex items-center gap-1"
                       >
                         🗑️ Hapus BB (9000)
                       </button>
                     </div>
                   </div>
                   <PlgPjlView 
                     ylList={ylList} 
                     historicalMonth={selectedMonth} 
                     historicalData={{
                       ...snapshot,
                       editableAkm: true,
                       onAkmChange: (ylKey, secKey, prodCode, val) => {
                          const txKey = \`\${secKey}_\${prodCode}\`;
                          const dummyDate = selectedMonth + "-99";
                          const cleanYl = ylKey.replace(/^\\d+\\s*/, "").toUpperCase();
                          setSnapshot(prev => {
                            const next = { ...prev };
                            if (!next.transactions) next.transactions = [];
                            
                            let otherSum = 0;
                            next.transactions.forEach(t => {
                              if (t.tanggal !== dummyDate && (t.nama === ylKey || (t.nama && t.nama.includes(cleanYl)))) {
                                otherSum += (Number(t[txKey]) || 0);
                              }
                            });
                            
                            let dummyTx = next.transactions.find(t => t.tanggal === dummyDate && (t.nama === ylKey || (t.nama && t.nama.includes(cleanYl))));
                            if (!dummyTx) {
                               dummyTx = { id: "manual-" + cleanYl, tanggal: dummyDate, nama: ylKey, area: "" };
                               next.transactions.push(dummyTx);
                            }
                            dummyTx[txKey] = val - otherSum;
                            return next;
                          });
                       },
                       onAkmPaste: (e, ylKey, startIndex) => {
                          e.preventDefault();
                          const pastedData = e.clipboardData.getData("text/plain");
                          const rows = pastedData.split(/\\r?\\n/).filter(r => r.trim() !== "");
                          const parsedValues = rows.map(r => parseInt(r.replace(/\\D/g, "")) || 0);
                          if (parsedValues.length === 0) return;

                          const cleanYl = ylKey.replace(/^\\d+\\s*/, "").toUpperCase();
                          const txKeys = [
                            "rmh_yo", "rmh_om", "rmh_os", "rmh_yt",
                            "psr_yo", "psr_om", "psr_os", "psr_yt",
                            "skh_yo", "skh_om", "skh_os", "skh_yt",
                            "ktr_yo", "ktr_om", "ktr_os", "ktr_yt",
                            "tk_yo",  "tk_om",  "tk_os",  "tk_yt",
                            "ib_yo",  "ib_om",  "ib_os",  "ib_yt",
                          ];

                          const dummyDate = selectedMonth + "-99";
                          setSnapshot(prev => {
                            const next = { ...prev };
                            if (!next.transactions) next.transactions = [];

                            let otherSum = {};
                            txKeys.forEach(k => otherSum[k] = 0);
                            next.transactions.forEach(t => {
                              if (t.tanggal !== dummyDate && (t.nama === ylKey || (t.nama && t.nama.includes(cleanYl)))) {
                                txKeys.forEach(k => {
                                  otherSum[k] += (Number(t[k]) || 0);
                                });
                              }
                            });

                            let dummyTx = next.transactions.find(t => t.tanggal === dummyDate && (t.nama === ylKey || (t.nama && t.nama.includes(cleanYl))));
                            if (!dummyTx) {
                               dummyTx = { id: "manual-" + cleanYl, tanggal: dummyDate, nama: ylKey, area: "" };
                               next.transactions.push(dummyTx);
                            }

                            parsedValues.forEach((val, idx) => {
                               const kIdx = startIndex + idx;
                               if (kIdx < txKeys.length) {
                                  dummyTx[txKeys[kIdx]] = val - otherSum[txKeys[kIdx]];
                               }
                            });
                            return next;
                          });
                       }
                     }} 
                   />
                </div>
`;

code = code.replace(plgPjlViewStr, editableStr);

fs.writeFileSync('src/components/archive/ArchiveEditor.tsx', code);
