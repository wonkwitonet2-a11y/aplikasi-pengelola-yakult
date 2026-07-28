import re

with open("src/components/YLView.tsx", "r") as f:
    content = f.read()

# Replace the block from Sektor Match Verification Block to the end of the IIFE
# The regex will match exactly what we need to replace

pattern = re.compile(
    r'\{/\* Sektor Match Verification Block \*/\}.*?\{/\* Perbandingan Acuan Admin \*/\}',
    re.DOTALL
)

# Wait, we want to replace the whole `p-3.5 rounded-2xl border-2 space-y-2 ...` block
# Let's replace the whole section starting from `{/* Sektor Match Verification Block */}` down to `})()}\n            </div>`

pattern2 = re.compile(
    r'\{/\* Sektor Match Verification Block \*/\}.*?\}\)\(\)\}\n            </div>',
    re.DOTALL
)

new_ui = """{/* Sektor Match Verification Block - Diganti menjadi Perbandingan Acuan Admin Saja */}
              <div className={`p-3.5 rounded-2xl border-2 space-y-2 ${isAllSectorsMatched() ? "bg-emerald-50 border-emerald-300" : "bg-rose-50 border-rose-200"}`}>
                <div className="flex items-center justify-between text-xs font-black">
                  <span>Pencocokan Acuan Admin</span>
                  <span className={isAllSectorsMatched() ? "text-emerald-700 font-extrabold flex items-center gap-0.5" : "text-rose-600 font-extrabold"}>
                    {isAllSectorsMatched() ? "✓ COCOK" : "❌ BELUM COCOK"}
                  </span>
                </div>
              {(() => {
                const selectedDay = parseInt(selectedDate.split("-")[2], 10);
                const adminData = ylBreakdownRealisasi?.days?.[String(selectedDay)];
                
                const compare = (prodKey: string, userTotal: number) => {
                  const adminTotal = (adminData as any)?.[prodKey] || 0;
                  if (adminTotal === 0) return { status: "Data tidak ada", color: "text-slate-400" };
                  if (userTotal === adminTotal) return { status: "Pas", color: "text-emerald-600" };
                  if (userTotal > adminTotal) return { status: `Lebih ${userTotal - adminTotal}`, color: "text-rose-600" };
                  return { status: `Kurang ${adminTotal - userTotal}`, color: "text-rose-600" };
                };
                return (
                  <div className="bg-white rounded-xl p-3 space-y-2 mt-2">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10px] font-bold text-slate-500">
                      { (["yo", "om", "os", "yt"] as const).map(prod => {
                        const userTotal = getSectorTotal(prod);
                        const adminTotal = (adminData as any)?.[prod] || 0;
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
            </div>"""

if pattern2.search(content):
    content = pattern2.sub(new_ui, content)
    print("Replaced UI")
else:
    print("UI pattern not found")

with open("src/components/YLView.tsx", "w") as f:
    f.write(content)
