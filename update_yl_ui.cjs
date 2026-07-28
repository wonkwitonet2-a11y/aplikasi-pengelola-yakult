const fs = require('fs');
let content = fs.readFileSync('src/components/YLView.tsx', 'utf8');

const additionalHtml = `
              </div>

              {/* Lembaga & Tembus */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-4">
                <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider border-l-4 border-slate-500 pl-2">
                  5. Lembaga Kunjungan & Tembus
                </h2>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[9px] font-black text-slate-400 uppercase block mb-2 text-center">Sekolah</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-center">
                        <span className="text-[8px] font-bold text-slate-400 block mb-0.5">Kunj</span>
                        <NumberInput min={0} value={skhTotal} onChange={(val) => setSkhTotal(Math.max(0, val))} className="w-full p-1 bg-white border border-slate-200 rounded text-center text-xs font-bold text-slate-800" />
                      </div>
                      <div className="text-center">
                        <span className="text-[8px] font-bold text-slate-400 block mb-0.5">Tmbus</span>
                        <NumberInput min={0} value={skhTembus} onChange={(val) => setSkhTembus(Math.max(0, val))} className="w-full p-1 bg-white border border-slate-200 rounded text-center text-xs font-bold text-slate-800" />
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[9px] font-black text-slate-400 uppercase block mb-2 text-center">Kantor</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-center">
                        <span className="text-[8px] font-bold text-slate-400 block mb-0.5">Kunj</span>
                        <NumberInput min={0} value={kntrTotal} onChange={(val) => setKntrTotal(Math.max(0, val))} className="w-full p-1 bg-white border border-slate-200 rounded text-center text-xs font-bold text-slate-800" />
                      </div>
                      <div className="text-center">
                        <span className="text-[8px] font-bold text-slate-400 block mb-0.5">Tmbus</span>
                        <NumberInput min={0} value={kntrTembus} onChange={(val) => setKntrTembus(Math.max(0, val))} className="w-full p-1 bg-white border border-slate-200 rounded text-center text-xs font-bold text-slate-800" />
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[9px] font-black text-slate-400 uppercase block mb-2 text-center">Toko</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-center">
                        <span className="text-[8px] font-bold text-slate-400 block mb-0.5">Kunj</span>
                        <NumberInput min={0} value={tkoTotal} onChange={(val) => setTkoTotal(Math.max(0, val))} className="w-full p-1 bg-white border border-slate-200 rounded text-center text-xs font-bold text-slate-800" />
                      </div>
                      <div className="text-center">
                        <span className="text-[8px] font-bold text-slate-400 block mb-0.5">Tmbus</span>
                        <NumberInput min={0} value={tkoTembus} onChange={(val) => setTkoTembus(Math.max(0, val))} className="w-full p-1 bg-white border border-slate-200 rounded text-center text-xs font-bold text-slate-800" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
`;

content = content.replace(
  /<\/div>\n\n              \{successMsg && \(/,
  additionalHtml + '\n\n              {successMsg && ('
);

fs.writeFileSync('src/components/YLView.tsx', content);
