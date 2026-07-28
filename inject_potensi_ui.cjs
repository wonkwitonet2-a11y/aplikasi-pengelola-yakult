const fs = require('fs');
let content = fs.readFileSync('src/components/YLView.tsx', 'utf8');

const ui = `
        {/* TAB POTENSI VS TEMBUS */}
        {activeTab === "potensi_tembus" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
              <h2 className="text-sm font-black text-slate-900 border-l-4 border-indigo-600 pl-3">
                Potensi vs Tembus (Bulan Ini)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Sekolah */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                  <h3 className="text-xs font-bold text-slate-700 mb-2 border-b border-slate-200 pb-1">Sekolah</h3>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500">Total Kunjungan</label>
                    <NumberInput min={0} value={potensiTembus.skhTotal} onChange={(val) => setPotensiTembus(prev => ({...prev, skhTotal: val}))} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-emerald-600">Total Tembus</label>
                    <NumberInput min={0} value={potensiTembus.skhTembus} onChange={(val) => setPotensiTembus(prev => ({...prev, skhTembus: val}))} className="w-full p-2 bg-white border border-emerald-200 rounded-lg text-xs font-bold text-emerald-800" />
                  </div>
                </div>
                {/* Kantor */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                  <h3 className="text-xs font-bold text-slate-700 mb-2 border-b border-slate-200 pb-1">Kantor</h3>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500">Total Kunjungan</label>
                    <NumberInput min={0} value={potensiTembus.kntrTotal} onChange={(val) => setPotensiTembus(prev => ({...prev, kntrTotal: val}))} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-emerald-600">Total Tembus</label>
                    <NumberInput min={0} value={potensiTembus.kntrTembus} onChange={(val) => setPotensiTembus(prev => ({...prev, kntrTembus: val}))} className="w-full p-2 bg-white border border-emerald-200 rounded-lg text-xs font-bold text-emerald-800" />
                  </div>
                </div>
                {/* Toko */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                  <h3 className="text-xs font-bold text-slate-700 mb-2 border-b border-slate-200 pb-1">Toko</h3>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500">Total Kunjungan</label>
                    <NumberInput min={0} value={potensiTembus.tkoTotal} onChange={(val) => setPotensiTembus(prev => ({...prev, tkoTotal: val}))} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-emerald-600">Total Tembus</label>
                    <NumberInput min={0} value={potensiTembus.tkoTembus} onChange={(val) => setPotensiTembus(prev => ({...prev, tkoTembus: val}))} className="w-full p-2 bg-white border border-emerald-200 rounded-lg text-xs font-bold text-emerald-800" />
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <button
                  onClick={handleSavePotensiTembus}
                  disabled={isPotensiTembusSaving}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs py-3 rounded-xl transition-all disabled:opacity-50"
                >
                  {isPotensiTembusSaving ? "Menyimpan..." : "💾 Simpan Potensi vs Tembus"}
                </button>
                {potensiTembusMsg && (
                  <p className={\`mt-2 text-[10px] font-bold text-center \${potensiTembusMsg.includes('Error') || potensiTembusMsg.includes('Gagal') ? 'text-red-600' : 'text-emerald-600'}\`}>
                    {potensiTembusMsg}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>`;

content = content.replace(/<\/main>/, ui);
fs.writeFileSync('src/components/YLView.tsx', content);
