const fs = require('fs');
let content = fs.readFileSync('src/components/YLView.tsx', 'utf8');

const comparisonUi = `
              {/* Perbandingan Acuan Admin */}
              {(() => {
                const selectedDay = parseInt(selectedDate.split("-")[2], 10);
                const adminData = ylBreakdownRealisasi?.days?.[String(selectedDay)];
                
                const compare = (prodKey, userTotal) => {
                  const adminTotal = adminData?.[prodKey] || 0;
                  if (adminTotal === 0) return { status: "Data tidak ada", color: "text-slate-400" };
                  if (userTotal === adminTotal) return { status: "Pas", color: "text-emerald-600" };
                  if (userTotal > adminTotal) return { status: \`Lebih \${userTotal - adminTotal}\`, color: "text-rose-600" };
                  return { status: \`Kurang \${adminTotal - userTotal}\`, color: "text-rose-600" };
                };

                return (
                  <div className="p-3.5 rounded-2xl border-2 bg-slate-50 border-slate-200 space-y-2 mt-4">
                    <div className="flex items-center justify-between text-xs font-black">
                      <span>Perbandingan Acuan Admin (Hari {selectedDay})</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10px] font-bold text-slate-500">
                      {["yo", "om", "os", "yt"].map(prod => {
                        const userTotal = getSectorTotal(prod);
                        const adminTotal = adminData?.[prod] || 0;
                        const res = compare(prod, userTotal);
                        return (
                          <div key={prod} className="flex justify-between items-center">
                            <span className="uppercase">{prod}: {userTotal} / {adminTotal}</span>
                            <span className={res.color}>
                              {res.status}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
            
            {/* Kunjungan, PB & Sampah */}`;

content = content.replace(/<\/div>\n\s*<\/div>\n\s*<\/div>\n\n\s*\{\/\* Kunjungan, PB & Sampah \*\/\}/, comparisonUi);
fs.writeFileSync('src/components/YLView.tsx', content);
