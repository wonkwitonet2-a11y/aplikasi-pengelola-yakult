const fs = require('fs');
let code = fs.readFileSync('src/components/archive/ArchiveEditor.tsx', 'utf8');

const oldTxField = `                       onTxFieldChange: (ylKey, field, val) => {
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

const newTxField = `                       onTxFieldChange: (ylKey, field, val) => {
                          const dummyDate = selectedMonth + "-99";
                          const cleanYl = ylKey.replace(/^\\d+\\s*/, "").toUpperCase();
                          setSnapshot(prev => {
                            const next = { ...prev };
                            if (!next.transactions) next.transactions = [];
                            
                            // Fields that contribute to the total
                            let fieldsToSum = [field];
                            let fieldsToZero = [];
                            if (field === "bb_yo") {
                               fieldsToSum = ["bb_yo", "bb_om", "bb_os", "bb_yt"];
                               fieldsToZero = ["bb_om", "bb_os", "bb_yt"];
                            } else if (field === "pb_p") {
                               fieldsToSum = ["pb_p", "pb_s"];
                               fieldsToZero = ["pb_s"];
                            }
                            
                            let otherSum = 0;
                            next.transactions.forEach(t => {
                               if (t.tanggal !== dummyDate && (t.nama === ylKey || (t.nama && t.nama.includes(cleanYl)))) {
                                  fieldsToSum.forEach(f => {
                                     otherSum += (Number(t[f]) || 0);
                                  });
                               }
                            });
                            
                            let dummyTx = next.transactions.find(t => t.tanggal === dummyDate && (t.nama === ylKey || (t.nama && t.nama.includes(cleanYl))));
                            if (!dummyTx) {
                               dummyTx = { id: "manual-" + cleanYl, tanggal: dummyDate, nama: ylKey, area: "" };
                               next.transactions.push(dummyTx);
                            }
                            
                            dummyTx[field] = val - otherSum;
                            fieldsToZero.forEach(f => {
                               dummyTx[f] = 0;
                            });
                            return next;
                          });
                       },`;

code = code.replace(oldTxField, newTxField);

fs.writeFileSync('src/components/archive/ArchiveEditor.tsx', code);
