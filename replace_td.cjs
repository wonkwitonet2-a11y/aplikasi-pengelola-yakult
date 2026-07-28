const fs = require('fs');
let content = fs.readFileSync('src/components/YLView.tsx', 'utf8');

const regex = /const rmh_yo = tx\?\.rmh_yo\|\|0, rmh_om = tx\?\.rmh_om\|\|0[\s\S]*?<\/tr>/g;
const match = regex.exec(content);

if (match) {
  let inner = match[0];

  // We can inject code to either render the normal row or the editable row.
  const newRowCode = `const dData = editDataRealisasi[d] || {};
                            const editChange = (field: string, val: number) => {
                              setEditDataRealisasi(prev => ({ ...prev, [d]: { ...prev[d], [field]: val } }));
                            };

                            const val = (f: string) => isEditRealisasi ? (dData[f] || 0) : (tx?.[f as keyof typeof tx] || 0);

                            const rmh_yo = val('rmh_yo'), rmh_om = val('rmh_om'), rmh_os = val('rmh_os'), rmh_yt = val('rmh_yt');
                            const psr_yo = val('psr_yo'), psr_om = val('psr_om'), psr_os = val('psr_os'), psr_yt = val('psr_yt');
                            const skh_yo = val('skh_yo'), skh_om = val('skh_om'), skh_os = val('skh_os'), skh_yt = val('skh_yt');
                            const ktr_yo = val('ktr_yo'), ktr_om = val('ktr_om'), ktr_os = val('ktr_os'), ktr_yt = val('ktr_yt');
                            const tk_yo  = val('tk_yo'),  tk_om  = val('tk_om'),  tk_os  = val('tk_os'),  tk_yt  = val('tk_yt');
                            const ib_yo  = val('ib_yo'),  ib_om  = val('ib_om'),  ib_os  = val('ib_os'),  ib_yt  = val('ib_yt');
                            
                            const rmh = rmh_yo + rmh_om + rmh_os + rmh_yt;
                            const psr = psr_yo + psr_om + psr_os + psr_yt;
                            const skh = skh_yo + skh_om + skh_os + skh_yt;
                            const ktr = ktr_yo + ktr_om + ktr_os + ktr_yt;
                            const tk = tk_yo + tk_om + tk_os + tk_yt;
                            const ib = ib_yo + ib_om + ib_os + ib_yt;
                            
                            const bb_yo = val('bb_yo'), bb_om = val('bb_om'), bb_os = val('bb_os'), bb_yt = val('bb_yt');
                            const bb = bb_yo + bb_om + bb_os + bb_yt;
                            
                            const pbPagi = val('pb_p');
                            const pbSore = val('pb_s');
                            const plgApk = val('apk_plg');
                            const sampahBtl = val('apk_botol');
                            const plg = val('f_plg');
                            const rk = val('f_rk');
                            const ra = val('f_ra');
                            const rb = val('f_rb');

                            const dayTot = rmh + psr + skh + ktr + tk + ib;

                            const renderCell = (field: string, v: number, className: string) => {
                              if (isEditRealisasi) {
                                return (
                                  <td className="p-1">
                                    <input type="number" min="0" value={v} onChange={(e) => editChange(field, parseInt(e.target.value)||0)} className="w-10 text-center text-[9px] border border-slate-300 rounded p-0.5" />
                                  </td>
                                );
                              }
                              return <td className={className}>{v || "-"}</td>;
                            };

                            const renderBbCell = () => {
                              if (isEditRealisasi) {
                                return (
                                  <td className="p-1 text-center bg-rose-50 flex gap-0.5 max-w-[80px] flex-wrap justify-center">
                                    <input type="number" min="0" value={bb_yo} onChange={(e) => editChange('bb_yo', parseInt(e.target.value)||0)} className="w-8 text-[8px] border border-slate-300 rounded p-0.5" title="BB YO" />
                                    <input type="number" min="0" value={bb_om} onChange={(e) => editChange('bb_om', parseInt(e.target.value)||0)} className="w-8 text-[8px] border border-slate-300 rounded p-0.5" title="BB OM" />
                                    <input type="number" min="0" value={bb_os} onChange={(e) => editChange('bb_os', parseInt(e.target.value)||0)} className="w-8 text-[8px] border border-slate-300 rounded p-0.5" title="BB OS" />
                                    <input type="number" min="0" value={bb_yt} onChange={(e) => editChange('bb_yt', parseInt(e.target.value)||0)} className="w-8 text-[8px] border border-slate-300 rounded p-0.5" title="BB YT" />
                                  </td>
                                );
                              }
                              return <td className="p-2 text-center text-rose-700 bg-rose-50/50">{bb || "-"}</td>;
                            };

                            totRmh += rmh; totPsr += psr; totSkh += skh; totKtr += ktr; totTk += tk; totIb += ib;
                            totBb += bb; totPbPagi += pbPagi; totPbSore += pbSore; totPlgApk += plgApk; totSampahBtl += sampahBtl;
                            totPlg += plg; totRk += rk; totRa += ra; totRb += rb;

                            return (
                              <tr key={d} className="hover:bg-slate-50/80 transition-colors">
                                <td className="p-2 border-r border-slate-200 sticky left-0 bg-white z-10 text-center text-slate-500 font-mono font-black">{dayStrPadded}</td>
                                
                                {renderCell('rmh_yo', rmh_yo, "p-2 text-center text-slate-500")}
                                {renderCell('rmh_om', rmh_om, "p-2 text-center text-slate-500")}
                                {renderCell('rmh_os', rmh_os, "p-2 text-center text-slate-500")}
                                {renderCell('rmh_yt', rmh_yt, "p-2 text-center font-bold text-slate-900 border-r border-slate-200 bg-slate-50")}
                                
                                {renderCell('psr_yo', psr_yo, "p-2 text-center text-slate-500")}
                                {renderCell('psr_om', psr_om, "p-2 text-center text-slate-500")}
                                {renderCell('psr_os', psr_os, "p-2 text-center text-slate-500")}
                                {renderCell('psr_yt', psr_yt, "p-2 text-center font-bold text-slate-900 border-r border-slate-200 bg-slate-50")}
                                
                                {renderCell('skh_yo', skh_yo, "p-2 text-center text-slate-500")}
                                {renderCell('skh_om', skh_om, "p-2 text-center text-slate-500")}
                                {renderCell('skh_os', skh_os, "p-2 text-center text-slate-500")}
                                {renderCell('skh_yt', skh_yt, "p-2 text-center font-bold text-slate-900 border-r border-slate-200 bg-slate-50")}
                                
                                {renderCell('ktr_yo', ktr_yo, "p-2 text-center text-slate-500")}
                                {renderCell('ktr_om', ktr_om, "p-2 text-center text-slate-500")}
                                {renderCell('ktr_os', ktr_os, "p-2 text-center text-slate-500")}
                                {renderCell('ktr_yt', ktr_yt, "p-2 text-center font-bold text-slate-900 border-r border-slate-200 bg-slate-50")}
                                
                                {renderCell('tk_yo', tk_yo, "p-2 text-center text-slate-500")}
                                {renderCell('tk_om', tk_om, "p-2 text-center text-slate-500")}
                                {renderCell('tk_os', tk_os, "p-2 text-center text-slate-500")}
                                {renderCell('tk_yt', tk_yt, "p-2 text-center font-bold text-slate-900 border-r border-slate-200 bg-slate-50")}
                                
                                {renderCell('ib_yo', ib_yo, "p-2 text-center text-slate-500")}
                                {renderCell('ib_om', ib_om, "p-2 text-center text-slate-500")}
                                {renderCell('ib_os', ib_os, "p-2 text-center text-slate-500")}
                                {renderCell('ib_yt', ib_yt, "p-2 text-center font-bold text-slate-900 border-r border-slate-200 bg-slate-50")}

                                {renderBbCell()}
                                {renderCell('pb_p', pbPagi, "p-2 text-center text-lime-700")}
                                {renderCell('pb_s', pbSore, "p-2 text-center text-lime-700")}
                                {renderCell('apk_plg', plgApk, "p-2 text-center text-sky-700")}
                                {renderCell('apk_botol', sampahBtl, "p-2 text-center text-cyan-700")}
                                {renderCell('f_plg', plg, "p-2 text-center text-orange-700 bg-orange-50/50")}
                                {renderCell('f_rk', rk, "p-2 text-center text-blue-700")}
                                {renderCell('f_ra', ra, "p-2 text-center text-violet-700")}
                                {renderCell('f_rb', rb, "p-2 text-center text-fuchsia-700 bg-fuchsia-50/50")}
                                <td className="p-2 text-right bg-amber-50 text-amber-900 font-black">{dayTot || "-"}</td>
                              </tr>`;
  content = content.replace(inner, newRowCode);
  fs.writeFileSync('src/components/YLView.tsx', content);
} else {
  console.log("Could not match the table inner loop");
}

