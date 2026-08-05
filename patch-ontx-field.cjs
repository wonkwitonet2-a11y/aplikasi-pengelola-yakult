const fs = require('fs');
let code = fs.readFileSync('src/components/archive/ArchiveEditor.tsx', 'utf8');

const oldTxField = `                       onTxFieldChange: (ylKey, field, val) => {
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
                       },`;

const newTxField = `                       onTxFieldChange: (ylKey, field, val) => {
                          const dummyDate = selectedMonth + "-99";
                          const cleanYl = ylKey.replace(/^\\d+\\s*/, "").toUpperCase();
                          setSnapshot(prev => {
                            const next = { ...prev };
                            if (!next.transactions) next.transactions = [];
                            
                            let otherSum = 0;
                            next.transactions.forEach(t => {
                               if (t.tanggal !== dummyDate && (t.nama === ylKey || (t.nama && t.nama.includes(cleanYl)))) {
                                  otherSum += (Number(t[field]) || 0);
                               }
                            });
                            
                            let dummyTx = next.transactions.find(t => t.tanggal === dummyDate && (t.nama === ylKey || (t.nama && t.nama.includes(cleanYl))));
                            if (!dummyTx) {
                               dummyTx = { id: "manual-" + cleanYl, tanggal: dummyDate, nama: ylKey, area: "" };
                               next.transactions.push(dummyTx);
                            }
                            
                            dummyTx[field] = val - otherSum;
                            return next;
                          });
                       },`;

code = code.replace(oldTxField, newTxField);

fs.writeFileSync('src/components/archive/ArchiveEditor.tsx', code);
