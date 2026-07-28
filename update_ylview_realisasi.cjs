const fs = require('fs');
let content = fs.readFileSync('src/components/YLView.tsx', 'utf8');

const injection = `
  const [isEditRealisasi, setIsEditRealisasi] = useState(false);
  const [editDataRealisasi, setEditDataRealisasi] = useState<Record<number, any>>({});
  const [isSavingRealisasi, setIsSavingRealisasi] = useState(false);

  const handleToggleEditRealisasi = () => {
    if (isEditRealisasi) {
      setIsEditRealisasi(false);
      setEditDataRealisasi({});
    } else {
      const initial: Record<number, any> = {};
      const daysList = Array.from({ length: 31 }, (_, i) => i + 1);
      const currentMonth = selectedDate.substring(0, 8);
      daysList.forEach(d => {
        const dayStrPadded = String(d).padStart(2, '0');
        const tx = transactions.find(t => t.tanggal.endsWith(\`-\${dayStrPadded}\`) || t.tanggal === String(d));
        if (tx) {
          initial[d] = { ...tx };
        } else {
          initial[d] = {
            tanggal: \`\${currentMonth}\${dayStrPadded}\`,
            rmh_yo: 0, rmh_om: 0, rmh_os: 0, rmh_yt: 0,
            psr_yo: 0, psr_om: 0, psr_os: 0, psr_yt: 0,
            skh_yo: 0, skh_om: 0, skh_os: 0, skh_yt: 0,
            ktr_yo: 0, ktr_om: 0, ktr_os: 0, ktr_yt: 0,
            tk_yo: 0, tk_om: 0, tk_os: 0, tk_yt: 0,
            ib_yo: 0, ib_om: 0, ib_os: 0, ib_yt: 0,
            bb_yo: 0, bb_om: 0, bb_os: 0, bb_yt: 0,
            pb_p: 0, pb_s: 0, apk_plg: 0, apk_botol: 0,
            f_plg: 0, f_rk: 0, f_ra: 0, f_rb: 0
          };
        }
      });
      setEditDataRealisasi(initial);
      setIsEditRealisasi(true);
    }
  };

  const handleSaveEditRealisasi = async () => {
    setIsSavingRealisasi(true);
    try {
      const updates = Object.values(editDataRealisasi).map((data: any) => ({
        tanggal: data.tanggal,
        nama: ylName,
        sektor: {
          rmh: { yo: data.rmh_yo||0, om: data.rmh_om||0, os: data.rmh_os||0, yt: data.rmh_yt||0 },
          psr: { yo: data.psr_yo||0, om: data.psr_om||0, os: data.psr_os||0, yt: data.psr_yt||0 },
          skh: { yo: data.skh_yo||0, om: data.skh_om||0, os: data.skh_os||0, yt: data.skh_yt||0 },
          ktr: { yo: data.ktr_yo||0, om: data.ktr_om||0, os: data.ktr_os||0, yt: data.ktr_yt||0 },
          tk:  { yo: data.tk_yo||0,  om: data.tk_om||0,  os: data.tk_os||0,  yt: data.tk_yt||0 },
          ib:  { yo: data.ib_yo||0,  om: data.ib_om||0,  os: data.ib_os||0,  yt: data.ib_yt||0 }
        },
        bb_yo: data.bb_yo||0, bb_om: data.bb_om||0, bb_os: data.bb_os||0, bb_yt: data.bb_yt||0,
        pb_p: data.pb_p||0, pb_s: data.pb_s||0,
        apk_plg: data.apk_plg||0, apk_botol: data.apk_botol||0,
        f_plg: data.f_plg||0, f_rk: data.f_rk||0, f_ra: data.f_ra||0, f_rb: data.f_rb||0
      }));
      
      await Promise.all(updates.map(upd => 
        fetch('/api/saveRealisasiPotensiYL', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(upd)
        })
      ));
      
      setIsEditRealisasi(false);
      onRefresh(); 
      alert("✅ Data berhasil disimpan!");
    } catch (e) {
      alert("❌ Error menyimpan data.");
    } finally {
      setIsSavingRealisasi(false);
    }
  };
`;

content = content.replace(/\/\/ YL AI Insight states/, injection + '\n  // YL AI Insight states');

const editButtonInjection = `
              <div className="border-l-4 border-indigo-600 pl-3 flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                  <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <span>🏘️ Tabel Realisasi Potensi Sektor (Pertanggal)</span>
                  </h2>
                  <p className="text-[10px] text-slate-500 font-bold leading-relaxed mt-0.5">
                    Data realisasi potensi penjualan per sektor (Rumah, Pasar, Sekolah, Kantor, Toko, IB) otomatis tersimpan pertanggal sesuai input YL.
                  </p>
                </div>
                <div className="flex gap-2 items-center">
                  {isEditRealisasi && (
                    <button onClick={handleSaveEditRealisasi} disabled={isSavingRealisasi} className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black px-3 py-1.5 rounded-lg shadow-sm">
                      {isSavingRealisasi ? "Menyimpan..." : "💾 Simpan Perubahan"}
                    </button>
                  )}
                  <button onClick={handleToggleEditRealisasi} className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-[10px] font-black px-3 py-1.5 rounded-lg shadow-sm">
                    {isEditRealisasi ? "❌ Batal" : "✏️ Edit Tabel"}
                  </button>
                  <span className="text-[10px] font-mono bg-indigo-100 text-indigo-800 font-black px-2.5 py-1 rounded-lg shrink-0">
                    📌 Per Yakult Lady
                  </span>
                </div>
              </div>`;

content = content.replace(/<div className="border-l-4 border-indigo-600 pl-3 flex flex-col md:flex-row md:items-center justify-between gap-2">[\s\S]*?<\/span>\n\s*<\/div>/, editButtonInjection);
fs.writeFileSync('src/components/YLView.tsx', content);
