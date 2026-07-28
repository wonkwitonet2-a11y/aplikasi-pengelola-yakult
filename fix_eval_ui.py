import re

with open("src/components/ManagerView.tsx", "r") as f:
    content = f.read()

top_old = """                {top ? (
                  <div className="text-xs text-slate-800 space-y-1.5">
                    <p>
                      <strong className="font-black text-slate-950">{top.nama}</strong> memimpin dengan kenaikan vs minggu lalu sebesar{" "}
                      <span className="font-black text-emerald-700">{Math.trunc(top.vsMingguLaluPct)}%</span>.
                    </p>
                    <p>
                      Rata-rata penjualan harian bulan berjalan mencapai{" "}
                      <strong className="font-black text-slate-950">{top.rata2BulanBerjalan} btl/hari</strong> dengan propaganda terkumpul{" "}
                      <strong className="font-black text-slate-950">{top.propagandaHariIni} pelanggan baru</strong>.
                    </p>
                    <div className="text-[11px] font-bold text-emerald-900 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                      👍 Pertahankan efisiensi kunjungan dan rute di sektor andalan Anda!
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-emerald-700 italic">Memuat data...</p>
                )}"""

top_new = """                {top ? (
                  <div className="text-xs text-slate-800 space-y-1.5">
                    <p>
                      <strong className="font-black text-slate-950">{top.nama}</strong> memimpin dengan memenangkan{" "}
                      <span className="font-black text-emerald-700">{(top as any).winCount || 0} dari 8 kategori</span>.
                    </p>
                    {(top as any).wonCategories && (top as any).wonCategories.length > 0 && (
                      <p className="text-slate-600">
                        Keunggulan di: <strong className="font-bold text-emerald-800">{(top as any).wonCategories.join(", ")}</strong>.
                      </p>
                    )}
                    <div className="text-[11px] font-bold text-emerald-900 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                      👍 Pertahankan efisiensi kunjungan dan rute di sektor andalan Anda!
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-emerald-700 italic">Memuat data...</p>
                )}"""

need_old = """                {needImprovement ? (
                  <div className="text-xs text-slate-800 space-y-1.5">
                    <p>
                      <strong className="font-black text-slate-950">{needImprovement.nama}</strong> berada di posisi terendah dengan capaian vs minggu lalu{" "}
                      <span className="font-black text-rose-700">{Math.trunc(needImprovement.vsMingguLaluPct)}%</span>.
                    </p>
                    {highestBB && (
                      <p>
                        Sorotan negatif terbesar pada tingkat Balik Botol (BB) terbanyak dialami oleh{" "}
                        <strong className="font-black text-slate-950">{highestBB.nama}</strong> dengan total{" "}
                        <span className="font-black text-rose-700">{highestBB.bb} btl retur</span> hari ini.
                      </p>
                    )}
                    <div className="text-[11px] font-bold text-rose-900 bg-rose-50 p-2 rounded-lg border border-rose-200">
                      🚨 Tindakan: Segera review rute drop-off dan sisa stock harian agar botol retur tidak membengkak!
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-rose-700 italic">Memuat data...</p>
                )}"""

need_new = """                {needImprovement ? (
                  <div className="text-xs text-slate-800 space-y-1.5">
                    <p>
                      <strong className="font-black text-slate-950">{needImprovement.nama}</strong> berada di posisi terbawah pada{" "}
                      <span className="font-black text-rose-700">{(needImprovement as any).loseCount || 0} dari 8 kategori</span>.
                    </p>
                    {(needImprovement as any).lostCategories && (needImprovement as any).lostCategories.length > 0 && (
                      <p className="text-slate-600">
                        Kelemahan di: <strong className="font-bold text-rose-800">{(needImprovement as any).lostCategories.join(", ")}</strong>.
                      </p>
                    )}
                    {highestBB && (
                      <p>
                        Sorotan negatif terbesar pada tingkat Balik Botol (BB) terbanyak dialami oleh{" "}
                        <strong className="font-black text-slate-950">{highestBB.nama}</strong> dengan total{" "}
                        <span className="font-black text-rose-700">{highestBB.bb} btl retur</span> hari ini.
                      </p>
                    )}
                    <div className="text-[11px] font-bold text-rose-900 bg-rose-50 p-2 rounded-lg border border-rose-200">
                      🚨 Tindakan: Segera review rute drop-off dan sisa stock harian agar botol retur tidak membengkak!
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-rose-700 italic">Memuat data...</p>
                )}"""

if top_old in content:
    content = content.replace(top_old, top_new)
    print("Replaced top")
else:
    print("Could not find top_old")

if need_old in content:
    content = content.replace(need_old, need_new)
    print("Replaced need")
else:
    print("Could not find need_old")

with open("src/components/ManagerView.tsx", "w") as f:
    f.write(content)

