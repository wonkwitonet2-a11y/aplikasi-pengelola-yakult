const fs = require('fs');
let code = fs.readFileSync('src/components/archive/ArchiveEditor.tsx', 'utf8');

code = code.replace(/<input type="number" className="w-full p-2 text-sm font-black text-slate-900 border border-slate-300 rounded"\s*value=\{snapshot\.targetTKU\?\.target \|\| 0\}\s*onChange=\{\(e\) => setSnapshot\(prev => \(\{ \.\.\.prev, targetTKU: \{ \.\.\.\(prev\.targetTKU \|\| \{\}\), target: parseInt\(e\.target\.value\) \|\| 0 \} \}\)\)\}\s*\/>/g, 
`<input type="number" className="w-full p-2 text-sm font-black text-slate-900 border border-slate-300 rounded" 
                            value={snapshot.targetTKU?.target || 0}
                            onChange={(e) => setSnapshot(prev => ({ 
                                ...prev, 
                                targetTKU: { ...(prev.targetTKU || {}), target: parseInt(e.target.value) || 0 },
                                dashboardData: {
                                   ...(prev.dashboardData || {}),
                                   targetTim: {
                                      ...(prev.dashboardData?.targetTim || {}),
                                      target: parseInt(e.target.value) || 0
                                   }
                                }
                            }))}
                         />`);

code = code.replace(/<input type="number" className="w-full p-2 text-sm font-black text-slate-900 border border-slate-300 rounded"\s*value=\{snapshot\.targetTKU\?\.bln_lalu \|\| 0\}\s*onChange=\{\(e\) => setSnapshot\(prev => \(\{ \.\.\.prev, targetTKU: \{ \.\.\.\(prev\.targetTKU \|\| \{\}\), bln_lalu: parseInt\(e\.target\.value\) \|\| 0 \} \}\)\)\}\s*\/>/g, 
`<input type="number" className="w-full p-2 text-sm font-black text-slate-900 border border-slate-300 rounded" 
                            value={snapshot.targetTKU?.bln_lalu || 0}
                            onChange={(e) => setSnapshot(prev => ({ 
                                ...prev, 
                                targetTKU: { ...(prev.targetTKU || {}), bln_lalu: parseInt(e.target.value) || 0 },
                                dashboardData: {
                                   ...(prev.dashboardData || {}),
                                   targetTim: {
                                      ...(prev.dashboardData?.targetTim || {}),
                                      bulanLalu: parseInt(e.target.value) || 0
                                   }
                                }
                            }))}
                         />`);

code = code.replace(/<input type="number" className="w-full p-2 text-sm font-black text-slate-900 border border-slate-300 rounded"\s*value=\{snapshot\.targetTKU\?\.thn_lalu \|\| 0\}\s*onChange=\{\(e\) => setSnapshot\(prev => \(\{ \.\.\.prev, targetTKU: \{ \.\.\.\(prev\.targetTKU \|\| \{\}\), thn_lalu: parseInt\(e\.target\.value\) \|\| 0 \} \}\)\)\}\s*\/>/g, 
`<input type="number" className="w-full p-2 text-sm font-black text-slate-900 border border-slate-300 rounded" 
                            value={snapshot.targetTKU?.thn_lalu || 0}
                            onChange={(e) => setSnapshot(prev => ({ 
                                ...prev, 
                                targetTKU: { ...(prev.targetTKU || {}), thn_lalu: parseInt(e.target.value) || 0 },
                                dashboardData: {
                                   ...(prev.dashboardData || {}),
                                   targetTim: {
                                      ...(prev.dashboardData?.targetTim || {}),
                                      tahunLalu: parseInt(e.target.value) || 0
                                   }
                                }
                            }))}
                         />`);

fs.writeFileSync('src/components/archive/ArchiveEditor.tsx', code);
