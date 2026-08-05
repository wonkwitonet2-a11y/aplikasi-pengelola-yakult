const fs = require('fs');
let code = fs.readFileSync('src/components/archive/ArchiveEditor.tsx', 'utf8');

const targetTkuUI = `
                   <div className="mb-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                     <h3 className="text-xs font-black text-slate-800 uppercase mb-3">Target Tim (Total)</h3>
                     <div className="grid grid-cols-3 gap-4">
                       <div>
                         <label className="text-[10px] font-bold text-slate-600 block mb-1">Target Bulan Ini</label>
                         <input type="number" className="w-full p-2 text-sm font-black text-slate-900 border border-slate-300 rounded" 
                            value={snapshot.targetTKU?.target || 0}
                            onChange={(e) => setSnapshot(prev => ({ ...prev, targetTKU: { ...(prev.targetTKU || {}), target: parseInt(e.target.value) || 0 } }))}
                         />
                       </div>
                       <div>
                         <label className="text-[10px] font-bold text-slate-600 block mb-1">Target Bulan Lalu</label>
                         <input type="number" className="w-full p-2 text-sm font-black text-slate-900 border border-slate-300 rounded" 
                            value={snapshot.targetTKU?.bln_lalu || 0}
                            onChange={(e) => setSnapshot(prev => ({ ...prev, targetTKU: { ...(prev.targetTKU || {}), bln_lalu: parseInt(e.target.value) || 0 } }))}
                         />
                       </div>
                       <div>
                         <label className="text-[10px] font-bold text-slate-600 block mb-1">Target Tahun Lalu</label>
                         <input type="number" className="w-full p-2 text-sm font-black text-slate-900 border border-slate-300 rounded" 
                            value={snapshot.targetTKU?.thn_lalu || 0}
                            onChange={(e) => setSnapshot(prev => ({ ...prev, targetTKU: { ...(prev.targetTKU || {}), thn_lalu: parseInt(e.target.value) || 0 } }))}
                         />
                       </div>
                     </div>
                   </div>
`;

code = code.replace(/<TargetManagerRow[\s\S]*?onChange=\{[\s\S]*?\}[\s\S]*?\/>\s*<div className="h-4"><\/div>/, targetTkuUI);

fs.writeFileSync('src/components/archive/ArchiveEditor.tsx', code);
