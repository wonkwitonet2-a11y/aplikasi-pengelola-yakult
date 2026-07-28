with open("src/components/ManagerView.tsx", "r") as f:
    content = f.read()

import re

new_state = """  const [resetScope, setResetScope] = useState<"current_month" | "all">("current_month");
  const [showTargetedResetModal, setShowTargetedResetModal] = useState<boolean>(false);
  const [resetTargetedConfirmText, setResetTargetedConfirmText] = useState<string>("");
"""

content = re.sub(r'  const \[manualCutoffDate, setManualCutoffDate\] = useState<string>\(""\);\n  const \[resetConfirmText, setResetConfirmText\] = useState<string>\(""\);', new_state, content)

new_func = """  const handleConfirmTargetedReset = async () => {
    if (resetTargetedConfirmText !== "HAPUS") {
      alert("Silakan ketik HAPUS untuk konfirmasi.");
      return;
    }
    setIsResetting(true);
    try {
      const res = await safeFetchJson("/api/resetDataTargeted", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: resetScope, currentMonth: selectedBreakdownMonth || "2026-07" })
      });
      if (res && res.ok) {
        alert(res.message);
        setShowTargetedResetModal(false);
        setResetTargetedConfirmText("");
        if (onRefresh) onRefresh();
      } else {
        alert("Gagal mereset data: " + (res?.error || "Unknown error"));
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setIsResetting(false);
    }
  };"""

content = re.sub(r'  const handleOpenResetPreview = async \(\) => \{.*?finally \{\n      setIsResetting\(false\);\n    \}\n  \};', new_func, content, flags=re.DOTALL)

new_ui = """            {/* 3. Reset Data (Targeted) */}
            <div className="bg-white rounded-2xl p-4 border border-rose-100 shadow-sm space-y-3">
              <h2 className="text-xs font-black text-rose-950 uppercase tracking-wider flex items-center gap-2 border-l-4 border-rose-600 pl-2">
                🗑️ Reset Data Khusus (4 Kategori)
              </h2>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Hanya menghapus data: PLG & PJL, Input PJL Harian, BD & Realisasi (termasuk LHPP), dan Target YL/TKU. Data lain (Profil, PIN, Motivasi, dll) AMAN.
              </p>
              <div className="space-y-2 mt-2">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Cakupan Reset:</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input type="radio" name="resetScope" value="current_month" checked={resetScope === "current_month"} onChange={() => setResetScope("current_month")} className="accent-rose-600" />
                    Hanya Bulan Ini ({selectedBreakdownMonth || "2026-07"})
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input type="radio" name="resetScope" value="all" checked={resetScope === "all"} onChange={() => setResetScope("all")} className="accent-rose-600" />
                    Semua Riwayat (Semua Bulan)
                  </label>
                </div>
              </div>
              <button
                onClick={() => { setShowTargetedResetModal(true); setResetTargetedConfirmText(""); }}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-black text-xs py-2.5 rounded-xl transition-all cursor-pointer shadow flex items-center justify-center gap-2 mt-3"
              >
                ⚠️ Reset Data
              </button>
            </div>"""

content = re.sub(r'            \{\/\* 3\. Reset Data Manual \(Retensi Data\) \*\/\}.*?🔍 Pratinjau \& Hapus Data\n              </button>\n            </div>', new_ui, content, flags=re.DOTALL)

new_modal = """        {showTargetedResetModal && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl border border-rose-200">
              <div className="flex items-center justify-between border-b border-rose-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">⚠️</span>
                  <div>
                    <h3 className="text-sm font-black text-rose-950 uppercase">Konfirmasi Reset Data</h3>
                    <p className="text-[10px] text-rose-600 font-bold">Aksi ini bersifat destruktif</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowTargetedResetModal(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-lg"
                >
                  ✕
                </button>
              </div>

              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-900 text-xs space-y-2">
                <p><strong>Cakupan:</strong> <span className="font-mono font-bold text-rose-950">{resetScope === "all" ? "SEMUA RIWAYAT (Semua Bulan)" : `HANYA BULAN INI (${selectedBreakdownMonth || "2026-07"})`}</span></p>
                <p><strong>Data yang AKAN DIHAPUS:</strong></p>
                <ul className="list-disc pl-4 font-bold text-[10px] space-y-1">
                  <li>PLG & PJL (Data manual & Potensi Tembus)</li>
                  <li>Input PJL (Data transaksi harian)</li>
                  <li>BD & Realisasi (Breakdown Plan, Breakdown Realisasi, LHPP)</li>
                  <li>Target (Target TKU & Target per YL)</li>
                </ul>
                <p className="text-[10px] italic text-rose-600 mt-2">Data lain (Profil YL, PIN, Setting) TIDAK akan dihapus.</p>
              </div>

              <div className="space-y-3">
                <p className="text-[11px] text-slate-600 font-bold leading-relaxed">
                  Apakah Anda yakin ingin menghapus data tersebut? Tindakan ini <strong>tidak dapat dibatalkan</strong>.
                </p>
                <div>
                  <label className="text-[9px] font-bold text-rose-600 uppercase tracking-wider block mb-1">Ketik "HAPUS" untuk konfirmasi</label>
                  <input
                    type="text"
                    value={resetTargetedConfirmText}
                    onChange={(e) => setResetTargetedConfirmText(e.target.value.toUpperCase())}
                    placeholder="HAPUS"
                    className="w-full p-2.5 text-xs bg-white rounded-xl border border-rose-300 outline-none font-bold text-rose-900 text-center uppercase"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowTargetedResetModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 rounded-xl transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={handleConfirmTargetedReset}
                  disabled={isResetting || resetTargetedConfirmText !== "HAPUS"}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs py-2.5 rounded-xl transition-all cursor-pointer shadow disabled:opacity-50"
                >
                  {isResetting ? "Proses..." : "Ya, Lanjutkan"}
                </button>
              </div>
            </div>
          </div>
        )}"""

content = re.sub(r'        \{resetModal && \(.*?\{/\* Modal Konfirmasi Hapus YL Permanen \*/\}', new_modal + '\n        {/* Modal Konfirmasi Hapus YL Permanen */}', content, flags=re.DOTALL)

with open("src/components/ManagerView.tsx", "w") as f:
    f.write(content)
