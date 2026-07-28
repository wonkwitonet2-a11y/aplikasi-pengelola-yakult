const fs = require('fs');
let content = fs.readFileSync('src/components/PlgPjlView.tsx', 'utf8');

// The prompt wants a button "📤 Kirim ke Spreadsheet" that replaces the refresh button and the Kinerja Akumulatif menu.

// Let's create the handleKirimSpreadsheet function to be injected before the return statement.
const injection = `
  const [sendingSpreadsheet, setSendingSpreadsheet] = useState(false);

  const handleKirimSpreadsheet = async () => {
    setSendingSpreadsheet(true);
    try {
      const currentMonth = new Date().toISOString().substring(0, 7);
      
      const payloadData = await Promise.all(activeYlList.map(async (yl) => {
        // Filter transactions for this YL
        const ylTxs = transactions.filter(t => cleanYlName(t.nama) === cleanYlName(yl.nama));
        
        const sumKey = (key: keyof Transaction) => ylTxs.reduce((acc, t) => acc + (Number(t[key]) || 0), 0);
        
        const yo = sumKey("rmh_yo") + sumKey("psr_yo") + sumKey("skh_yo") + sumKey("ktr_yo") + sumKey("tk_yo") + sumKey("ib_yo");
        const om = sumKey("rmh_om") + sumKey("psr_om") + sumKey("skh_om") + sumKey("ktr_om") + sumKey("tk_om") + sumKey("ib_om");
        const os = sumKey("rmh_os") + sumKey("psr_os") + sumKey("skh_os") + sumKey("ktr_os") + sumKey("tk_os") + sumKey("ib_os");
        const yt = sumKey("rmh_yt") + sumKey("psr_yt") + sumKey("skh_yt") + sumKey("ktr_yt") + sumKey("tk_yt") + sumKey("ib_yt");
        
        const totalSales = yo + om + os + yt;
        const avgSales = pembagi > 0 ? totalSales / pembagi : 0;
        
        const yoPct = totalSales > 0 ? (yo / totalSales) * 100 : 0;
        const omPct = totalSales > 0 ? (om / totalSales) * 100 : 0;
        const osPct = totalSales > 0 ? (os / totalSales) * 100 : 0;
        const ytPct = totalSales > 0 ? (yt / totalSales) * 100 : 0;
        
        const plg = sumKey("f_plg");
        const rk = sumKey("f_rk");
        const ra = sumKey("f_ra");
        const rb = sumKey("f_rb");
        
        const rkRatio = plg > 0 ? (rk / plg) * 100 : 0;
        const raRatio = rk > 0 ? (ra / rk) * 100 : 0;
        const rbRaRatio = ra > 0 ? (rb / ra) * 100 : 0;
        const rbPlgRatio = plg > 0 ? (rb / plg) * 100 : 0;

        let pt = { skhTotal: 0, skhTembus: 0, kntrTotal: 0, kntrTembus: 0, tkoTotal: 0, tkoTembus: 0 };
        try {
          const res = await fetch(\`/api/getPotensiTembus?bulan=\${currentMonth}&nama=\${encodeURIComponent(yl.nama)}\`);
          const data = await res.json();
          if (data && data.data) {
             pt = data.data;
          }
        } catch(e) {}

        return {
          nama: cleanYlName(yl.nama),
          akumulasi: { yo, om, os, yt, total: totalSales },
          rataRata: avgSales,
          persentase: { yo: yoPct, om: omPct, os: osPct, yt: ytPct },
          pelanggan: { plg, rk, ra, rb },
          rasioPelanggan: { rkPlg: rkRatio, raRk: raRatio, rbRa: rbRaRatio, rbPlg: rbPlgRatio },
          potensiTembus: pt
        };
      }));

      const res = await fetch("/api/kirimPlgPjlKeSpreadsheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bulan: currentMonth,
          data: payloadData
        })
      });

      if (res.ok) {
        alert("✅ Data berhasil dikirim ke spreadsheet!");
      } else {
        alert("❌ Gagal mengirim data ke spreadsheet.");
      }
    } catch (e: any) {
      alert("❌ Error: " + e.message);
    } finally {
      setSendingSpreadsheet(false);
    }
  };
`;

content = content.replace(/return \(/, injection + '\n  return (');

// Now replace the "Muat Ulang" button with "Kirim ke Spreadsheet".
const btnRegex = /<button[\s\S]*?onClick=\{loadData\}[\s\S]*?<\/button>/;
const btnReplacement = `
            <button
              onClick={handleKirimSpreadsheet}
              disabled={sendingSpreadsheet}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              <span className="text-[14px]">📤</span>
              <span>{sendingSpreadsheet ? "Mengirim..." : "Kirim ke Spreadsheet"}</span>
            </button>
`;
content = content.replace(btnRegex, btnReplacement);

// Remove Kinerja Akumulatif section (lines ~318 to 395)
// Let's find the boundaries:
// from {/* Kinerja Akumulatif & Estimasi Rincian Kompensasi Cards */}
// to before {/* Main Table Container matching Excel Layout */}
const removeRegex = /\{\/\* Kinerja Akumulatif & Estimasi Rincian Kompensasi Cards \*\/\}[\s\S]*?\{\/\* Main Table Container matching Excel Layout \*\/\}/;
content = content.replace(removeRegex, '{/* Main Table Container matching Excel Layout */}');

// Finally, remove the unused 'loading' state if we want, or just leave it for loadData. We can leave it or remove it. The prompt says "Jika ada state loading yang hanya digunakan untuk tombol tersebut, hapus juga."
// Wait, loading is used inside loadData and the button. Since the button is gone, we can just remove setLoading(true) and setLoading(false) in loadData.
content = content.replace(/const \[loading, setLoading\] = useState<boolean>\(true\);/, '');
content = content.replace(/setLoading\(true\);/g, '');
content = content.replace(/setLoading\(false\);/g, '');

fs.writeFileSync('src/components/PlgPjlView.tsx', content);
