const fs = require('fs');
let content = fs.readFileSync('src/components/YLView.tsx', 'utf8');

const startIndex = content.indexOf('<table className="w-full text-left text-xs border-collapse font-mono min-w-[900px]">');
const endIndex = content.indexOf('</table>', startIndex) + 8;

const before = content.substring(0, startIndex);
const after = content.substring(endIndex);

const newTable = `
                      <table className="w-full text-left text-xs border-collapse font-mono min-w-[900px]">
                        <thead>
                          <tr className="bg-slate-900 text-slate-200 font-bold uppercase text-[9px] border-b border-slate-700">
                            <th rowSpan={2} className="p-2 border-r border-slate-800 sticky left-0 bg-slate-900 z-10 min-w-[70px]">Tgl</th>
                            <th colSpan={4} className="p-1 text-center border-r border-slate-700 text-emerald-400 bg-emerald-950/30">Rumah</th>
                            <th colSpan={4} className="p-1 text-center border-r border-slate-700 text-amber-400 bg-amber-950/30">Pasar</th>
                            <th colSpan={4} className="p-1 text-center border-r border-slate-700 text-pink-400 bg-pink-950/30">Sekolah</th>
                            <th colSpan={4} className="p-1 text-center border-r border-slate-700 text-purple-400 bg-purple-950/30">Kantor</th>
                            <th colSpan={4} className="p-1 text-center border-r border-slate-700 text-teal-400 bg-teal-950/30">Toko</th>
                            <th colSpan={4} className="p-1 text-center border-r border-slate-700 text-indigo-400 bg-indigo-950/30">IB</th>
                            <th rowSpan={2} className="p-2 text-center text-rose-400 border-l border-slate-700">BB</th>
                            <th rowSpan={2} className="p-2 text-center text-lime-400 border-l border-slate-700">PB Pg</th>
                            <th rowSpan={2} className="p-2 text-center text-lime-400 border-l border-slate-700">PB Sr</th>
                            <th rowSpan={2} className="p-2 text-center text-sky-400 border-l border-slate-700">PLG APK</th>
                            <th rowSpan={2} className="p-2 text-center text-cyan-400 border-l border-slate-700">Smpah</th>
                            <th rowSpan={2} className="p-2 text-center text-orange-400 border-l border-slate-700">PLG</th>
                            <th rowSpan={2} className="p-2 text-center text-blue-400 border-l border-slate-700">RK</th>
                            <th rowSpan={2} className="p-2 text-center text-violet-400 border-l border-slate-700">RA</th>
                            <th rowSpan={2} className="p-2 text-center text-fuchsia-400 border-l border-slate-700">RB</th>
                            <th rowSpan={2} className="p-2 text-right text-yellow-300 bg-slate-800 border-l border-slate-700">Total Jual</th>
                          </tr>
                          <tr className="bg-slate-800 text-slate-300 font-bold uppercase text-[8px]">
                            <th className="p-1 text-center">YO</th><th className="p-1 text-center">OM</th><th className="p-1 text-center">OS</th><th className="p-1 text-center border-r border-slate-700">YT</th>
                            <th className="p-1 text-center">YO</th><th className="p-1 text-center">OM</th><th className="p-1 text-center">OS</th><th className="p-1 text-center border-r border-slate-700">YT</th>
                            <th className="p-1 text-center">YO</th><th className="p-1 text-center">OM</th><th className="p-1 text-center">OS</th><th className="p-1 text-center border-r border-slate-700">YT</th>
                            <th className="p-1 text-center">YO</th><th className="p-1 text-center">OM</th><th className="p-1 text-center">OS</th><th className="p-1 text-center border-r border-slate-700">YT</th>
                            <th className="p-1 text-center">YO</th><th className="p-1 text-center">OM</th><th className="p-1 text-center">OS</th><th className="p-1 text-center border-r border-slate-700">YT</th>
                            <th className="p-1 text-center">YO</th><th className="p-1 text-center">OM</th><th className="p-1 text-center">OS</th><th className="p-1 text-center border-r border-slate-700">YT</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-bold text-slate-800 text-[10px]">
                          {daysList.map(d => {
                            const dayStrPadded = String(d).padStart(2, '0');
                            const tx = transactions.find(t => t.tanggal.endsWith(\`-\${dayStrPadded}\`) || t.tanggal === String(d));
                            const rmh_yo = tx?.rmh_yo||0, rmh_om = tx?.rmh_om||0, rmh_os = tx?.rmh_os||0, rmh_yt = tx?.rmh_yt||0;
                            const psr_yo = tx?.psr_yo||0, psr_om = tx?.psr_om||0, psr_os = tx?.psr_os||0, psr_yt = tx?.psr_yt||0;
                            const skh_yo = tx?.skh_yo||0, skh_om = tx?.skh_om||0, skh_os = tx?.skh_os||0, skh_yt = tx?.skh_yt||0;
                            const ktr_yo = tx?.ktr_yo||0, ktr_om = tx?.ktr_om||0, ktr_os = tx?.ktr_os||0, ktr_yt = tx?.ktr_yt||0;
                            const tk_yo = tx?.tk_yo||0, tk_om = tx?.tk_om||0, tk_os = tx?.tk_os||0, tk_yt = tx?.tk_yt||0;
                            const ib_yo = tx?.ib_yo||0, ib_om = tx?.ib_om||0, ib_os = tx?.ib_os||0, ib_yt = tx?.ib_yt||0;
                            
                            const rmh = rmh_yo + rmh_om + rmh_os + rmh_yt;
                            const psr = psr_yo + psr_om + psr_os + psr_yt;
                            const skh = skh_yo + skh_om + skh_os + skh_yt;
                            const ktr = ktr_yo + ktr_om + ktr_os + ktr_yt;
                            const tk = tk_yo + tk_om + tk_os + tk_yt;
                            const ib = ib_yo + ib_om + ib_os + ib_yt;

                            const bb = (tx?.bb_yo||0) + (tx?.bb_om||0) + (tx?.bb_os||0) + (tx?.bb_yt||0);
                            const pbPagi = tx?.pb_p || 0;
                            const pbSore = tx?.pb_s || 0;
                            const plgApk = tx?.apk_plg || 0;
                            const sampahBtl = tx?.apk_botol || 0;
                            const plg = tx?.f_plg || 0;
                            const rk = tx?.f_rk || 0;
                            const ra = tx?.f_ra || 0;
                            const rb = tx?.f_rb || 0;
                            const dayTot = rmh + psr + skh + ktr + tk + ib;
                            
                            totRmh += rmh; totPsr += psr; totSkh += skh; totKtr += ktr; totTk += tk; totIb += ib;
                            totRb += rb;
                            totBb += bb; totPbPagi += pbPagi; totPbSore += pbSore; totPlgApk += plgApk; totSampahBtl += sampahBtl; totPlg += plg; totRk += rk; totRa += ra;

                            return (
                              <tr key={d} className="hover:bg-indigo-50/50">
                                <td className="p-1.5 border-r border-slate-200 font-black text-slate-900 sticky left-0 bg-white">Tgl {d}</td>
                                
                                <td className="p-1 text-center font-normal">{rmh_yo || "-"}</td><td className="p-1 text-center font-normal">{rmh_om || "-"}</td><td className="p-1 text-center font-normal">{rmh_os || "-"}</td><td className="p-1 text-center font-bold text-slate-900 border-r border-slate-200 bg-slate-50">{rmh_yt || "-"}</td>
                                <td className="p-1 text-center font-normal">{psr_yo || "-"}</td><td className="p-1 text-center font-normal">{psr_om || "-"}</td><td className="p-1 text-center font-normal">{psr_os || "-"}</td><td className="p-1 text-center font-bold text-slate-900 border-r border-slate-200 bg-slate-50">{psr_yt || "-"}</td>
                                <td className="p-1 text-center font-normal">{skh_yo || "-"}</td><td className="p-1 text-center font-normal">{skh_om || "-"}</td><td className="p-1 text-center font-normal">{skh_os || "-"}</td><td className="p-1 text-center font-bold text-slate-900 border-r border-slate-200 bg-slate-50">{skh_yt || "-"}</td>
                                <td className="p-1 text-center font-normal">{ktr_yo || "-"}</td><td className="p-1 text-center font-normal">{ktr_om || "-"}</td><td className="p-1 text-center font-normal">{ktr_os || "-"}</td><td className="p-1 text-center font-bold text-slate-900 border-r border-slate-200 bg-slate-50">{ktr_yt || "-"}</td>
                                <td className="p-1 text-center font-normal">{tk_yo || "-"}</td><td className="p-1 text-center font-normal">{tk_om || "-"}</td><td className="p-1 text-center font-normal">{tk_os || "-"}</td><td className="p-1 text-center font-bold text-slate-900 border-r border-slate-200 bg-slate-50">{tk_yt || "-"}</td>
                                <td className="p-1 text-center font-normal">{ib_yo || "-"}</td><td className="p-1 text-center font-normal">{ib_om || "-"}</td><td className="p-1 text-center font-normal">{ib_os || "-"}</td><td className="p-1 text-center font-bold text-slate-900 border-r border-slate-200 bg-slate-50">{ib_yt || "-"}</td>
                                
                                <td className="p-2 text-center text-rose-700 bg-rose-50/50">{bb || "-"}</td>
                                <td className="p-2 text-center text-lime-700">{pbPagi || "-"}</td>
                                <td className="p-2 text-center text-lime-700">{pbSore || "-"}</td>
                                <td className="p-2 text-center text-sky-700">{plgApk || "-"}</td>
                                <td className="p-2 text-center text-cyan-700">{sampahBtl || "-"}</td>
                                <td className="p-2 text-center text-orange-700 bg-orange-50/50">{plg || "-"}</td>
                                <td className="p-2 text-center text-blue-700">{rk || "-"}</td>
                                <td className="p-2 text-center text-violet-700">{ra || "-"}</td>
                                <td className="p-2 text-center text-fuchsia-700 bg-fuchsia-50/50">{rb || "-"}</td>
                                <td className="p-2 text-right bg-amber-50 text-amber-900 font-black">{dayTot || "-"}</td>
                              </tr>
                            );
                          })}
                          <tr className="bg-slate-900 text-amber-300 font-black text-[10px]">
                            <td className="p-2 border-r border-slate-800 sticky left-0 bg-slate-900 z-10">Total</td>
                            <td colSpan={4} className="p-2 text-center border-r border-slate-700">{totRmh}</td>
                            <td colSpan={4} className="p-2 text-center border-r border-slate-700">{totPsr}</td>
                            <td colSpan={4} className="p-2 text-center border-r border-slate-700">{totSkh}</td>
                            <td colSpan={4} className="p-2 text-center border-r border-slate-700">{totKtr}</td>
                            <td colSpan={4} className="p-2 text-center border-r border-slate-700">{totTk}</td>
                            <td colSpan={4} className="p-2 text-center border-r border-slate-700">{totIb}</td>
                            <td className="p-2 text-center border-l border-slate-700 text-rose-300">{totBb}</td>
                            <td className="p-2 text-center border-l border-slate-700 text-lime-300">{totPbPagi}</td>
                            <td className="p-2 text-center border-l border-slate-700 text-lime-300">{totPbSore}</td>
                            <td className="p-2 text-center border-l border-slate-700 text-sky-300">{totPlgApk}</td>
                            <td className="p-2 text-center border-l border-slate-700 text-cyan-300">{totSampahBtl}</td>
                            <td className="p-2 text-center border-l border-slate-700 text-orange-300">{totPlg}</td>
                            <td className="p-2 text-center border-l border-slate-700 text-blue-300">{totRk}</td>
                            <td className="p-2 text-center border-l border-slate-700 text-violet-300">{totRa}</td>
                            <td className="p-2 text-center border-l border-slate-700 text-fuchsia-300">{totRb}</td>
                            <td className="p-2 text-right border-l border-slate-700">{totRmh + totPsr + totSkh + totKtr + totTk + totIb}</td>
                          </tr>
                        </tbody>
                      </table>
`;

fs.writeFileSync('src/components/YLView.tsx', before + newTable + after);
