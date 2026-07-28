with open("src/components/ManagerView.tsx", "r") as f:
    content = f.read()

import re

new_modal = """        {resetModal && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl border border-rose-200">
              <div className="flex items-center justify-between border-b border-rose-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">⚠️</span>
                  <div>
                    <h3 className="text-sm font-black text-rose-950 uppercase">Pratinjau Reset Data Manual</h3>
                    <p className="text-[10px] text-rose-600 font-bold">Pembersihan Data Lama</p>
                  </div>
                </div>
                <button
                  onClick={() => setResetModal(null)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-lg"
                >
                  ✕
                </button>
              </div>

              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-900 text-xs font-medium space-y-2">
                <p><strong>Batas Tanggal Retensi (Cutoff):</strong> <span className="font-mono font-bold text-rose-950">{resetModal.cutoffDate}</span></p>
                <p><strong>Total Record Transaksi di Server:</strong> <span className="font-mono font-bold">{resetModal.totalRecords} record</span></p>
                <p><strong>Data Lama (Sebelum Cutoff):</strong> <span className="font-mono font-black text-rose-600 text-sm">{resetModal.olderRecordsCount} record</span></p>
              </div>

              {resetModal.olderRecordsCount === 0 ? (
                <p className="text-xs text-slate-500 font-bold text-center py-2">
                  ✅ Tidak ada data transaksi sebelum tanggal {resetModal.cutoffDate}.
                </p>
              ) : (
                <div className="space-y-3">
                  <p className="text-[11px] text-slate-600 font-bold leading-relaxed">
                    Apakah Anda yakin ingin menghapus <span className="text-rose-600 font-black">{resetModal.olderRecordsCount} record</span> data transaksi lama sebelum tanggal <span className="font-mono font-black">{resetModal.cutoffDate}</span>? Tindakan ini tidak dapat dibatalkan.
                  </p>
                  <div>
                    <label className="text-[9px] font-bold text-rose-600 uppercase tracking-wider block mb-1">Ketik "HAPUS" untuk konfirmasi</label>
                    <input
                      type="text"
                      value={resetConfirmText}
                      onChange={(e) => setResetConfirmText(e.target.value)}
                      placeholder="HAPUS"
                      className="w-full p-2.5 text-xs bg-white rounded-xl border border-rose-300 outline-none font-bold text-rose-900 text-center uppercase"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setResetModal(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 rounded-xl transition-all"
                >
                  Batal
                </button>
                {resetModal.olderRecordsCount > 0 && (
                  <button
                    onClick={handleConfirmReset}
                    disabled={isResetting || resetConfirmText !== "HAPUS"}
                    className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs py-2.5 rounded-xl transition-all cursor-pointer shadow disabled:opacity-50"
                  >
                    {isResetting ? "Proses..." : "Ya, Hapus Data LAMA"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}"""

content = re.sub(r'        \{resetModal && \(.*?\{/\* Modal Konfirmasi Hapus YL Permanen \*/\}', new_modal + '\n        {/* Modal Konfirmasi Hapus YL Permanen */}', content, flags=re.DOTALL)

with open("src/components/ManagerView.tsx", "w") as f:
    f.write(content)
