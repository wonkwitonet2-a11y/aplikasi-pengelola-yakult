with open("src/components/ManagerView.tsx", "r") as f:
    content = f.read()

import re

new_ui = """            {/* 3. Reset Data Manual (Retensi Data) */}
            <div className="bg-white rounded-2xl p-4 border border-rose-100 shadow-sm space-y-3">
              <h2 className="text-xs font-black text-rose-950 uppercase tracking-wider flex items-center gap-2 border-l-4 border-rose-600 pl-2">
                🗑️ Reset Data Transaksi LAMA (Manual)
              </h2>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Pilih tanggal cutoff. Semua data transaksi sebelum tanggal ini akan dihapus secara permanen untuk menjaga performa sistem.
              </p>
              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Tanggal Cutoff (Hapus Sebelum)</label>
                <input
                  type="date"
                  value={manualCutoffDate}
                  onChange={(e) => setManualCutoffDate(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 rounded-xl border border-slate-200 outline-none font-bold text-slate-900"
                />
              </div>
              <button
                onClick={handleOpenResetPreview}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-black text-xs py-2.5 rounded-xl transition-all cursor-pointer shadow flex items-center justify-center gap-2"
              >
                🔍 Pratinjau & Hapus Data
              </button>
            </div>"""

content = re.sub(r'\{\/\* 3\. Reset Data 3 Bulan \(Retensi Data Manual\) \*\/\}.*?Pratinjau & Reset Data 3 Bulan\n              </button>\n            </div>', new_ui, content, flags=re.DOTALL)

with open("src/components/ManagerView.tsx", "w") as f:
    f.write(content)
