import re

with open("src/components/ManagerView.tsx", "r") as f:
    content = f.read()

# Add download function to ManagerView
# Just put it around line 1600 before `return (`

download_func = """
  const handleDownloadExcel = async () => {
    try {
      const res = await fetch("/api/exportRealisasi");
      if (!res.ok) throw new Error("Gagal mengunduh file Excel");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      
      const contentDisposition = res.headers.get('Content-Disposition');
      let filename = `Laporan_Realisasi_DP1_${new Date().toISOString().replace(/[:.]/g, "-")}.xlsx`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="([^"]+)"/);
        if (match) filename = match[1];
      }
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  return (
"""

return_target = """  return (
    <div"""
if return_target in content:
    content = content.replace(return_target, download_func + "    <div")
else:
    print("Could not find return_target")

btn_target = """            <button
              onClick={handleClearCache}
              className="bg-red-800/50 hover:bg-red-800 text-red-100 text-[10px] sm:text-xs font-bold px-2.5 py-1.5 rounded-lg border border-red-700/50 transition-all flex items-center gap-1"
              title="Bersihkan cache lokal"
            >
              🧹 Pembersih Cache
            </button>"""

btn_insertion = """            <button
              onClick={handleDownloadExcel}
              className="bg-emerald-700/80 hover:bg-emerald-600 text-emerald-50 text-[10px] sm:text-xs font-bold px-2.5 py-1.5 rounded-lg border border-emerald-600/50 transition-all flex items-center gap-1 shadow-sm"
              title="Download Laporan Excel (DP1)"
            >
              📥 Laporan Excel
            </button>
            <button
              onClick={handleClearCache}
              className="bg-red-800/50 hover:bg-red-800 text-red-100 text-[10px] sm:text-xs font-bold px-2.5 py-1.5 rounded-lg border border-red-700/50 transition-all flex items-center gap-1"
              title="Bersihkan cache lokal"
            >
              🧹 Pembersih Cache
            </button>"""

if btn_target in content:
    content = content.replace(btn_target, btn_insertion)
else:
    print("Could not find button_target")

with open("src/components/ManagerView.tsx", "w") as f:
    f.write(content)

