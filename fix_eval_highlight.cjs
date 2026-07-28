const fs = require('fs');
let content = fs.readFileSync('src/components/ManagerView.tsx', 'utf8');

const regex = /\{\(evaluasiData\?\.dataRows \|\| \[\]\)\.map\(\(row, rIdx\) => \([\s\S]*?\}\)/;

const replacement = `{(() => {
                      let maxCols = { c7: -1, c13: -1, c15: -Infinity, c18: -1, c21: -1, pb: -1, c25: -1, c28: Infinity };
                      if (evaluasiData?.dataRows) {
                        evaluasiData.dataRows.forEach(row => {
                          if ((row[7] || 0) > maxCols.c7) maxCols.c7 = row[7] || 0;
                          if ((row[13] || 0) > maxCols.c13) maxCols.c13 = row[13] || 0;
                          if ((row[15] || 0) > maxCols.c15) maxCols.c15 = row[15] || 0;
                          if ((row[18] || 0) > maxCols.c18) maxCols.c18 = row[18] || 0;
                          if ((row[21] || 0) > maxCols.c21) maxCols.c21 = row[21] || 0;
                          const pbSum = (row[22] || 0) + (row[23] || 0);
                          if (pbSum > maxCols.pb) maxCols.pb = pbSum;
                          if ((row[25] || 0) > maxCols.c25) maxCols.c25 = row[25] || 0;
                          
                          const bb = typeof row[28] === "number" ? row[28] : 0;
                          if (bb < maxCols.c28) maxCols.c28 = bb;
                        });
                      }

                      return (evaluasiData?.dataRows || []).map((row, rIdx) => (
                        <tr key={rIdx} className={isFullscreenEval ? (theme === "dark" ? "hover:bg-slate-800 border-b border-slate-800 text-slate-300" : "hover:bg-slate-100 border-b border-slate-200 text-slate-700") : "hover:bg-red-50 dark:hover:bg-red-950/20 border-b border-slate-100 dark:border-slate-800"}>
                          {(row || []).map((val, cIdx) => {
                            let isTopPerf = false;
                            if (cIdx === 7 && val > 0 && val === maxCols.c7) isTopPerf = true;
                            if (cIdx === 13 && val > 0 && val === maxCols.c13) isTopPerf = true;
                            if (cIdx === 15 && maxCols.c15 !== -Infinity && val === maxCols.c15) isTopPerf = true;
                            if (cIdx === 18 && val > 0 && val === maxCols.c18) isTopPerf = true;
                            if (cIdx === 21 && val > 0 && val === maxCols.c21) isTopPerf = true;
                            if ((cIdx === 22 || cIdx === 23) && maxCols.pb > 0 && ((row[22]||0)+(row[23]||0)) === maxCols.pb) isTopPerf = true;
                            if (cIdx === 25 && val > 0 && val === maxCols.c25) isTopPerf = true;
                            if (cIdx === 28 && maxCols.c28 !== Infinity && val === maxCols.c28) isTopPerf = true;

                            return (
                              <td key={cIdx} className={\`p-2 border-r text-center font-mono \${isFullscreenEval ? (theme === "dark" ? "border-slate-800" : "border-slate-200") : "border-slate-100 dark:border-slate-800"} \${isTopPerf ? (isFullscreenEval ? (theme === "dark" ? "bg-emerald-950 text-emerald-400 font-extrabold" : "bg-emerald-100 text-emerald-800 font-extrabold") : "bg-emerald-100 dark:bg-emerald-950 font-bold text-emerald-800 dark:text-emerald-400") : ""}\`}>
                                {typeof val === "number" ? val.toLocaleString("id-ID") : val}
                              </td>
                            );
                          })}
                        </tr>
                      ));
                    })()}`;

content = content.replace(regex, replacement);
fs.writeFileSync('src/components/ManagerView.tsx', content);
