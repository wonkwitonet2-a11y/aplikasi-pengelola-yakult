import re

with open("src/components/ManagerView.tsx", "r") as f:
    content = f.read()

# Replace all occurrences of handleDownloadExcel up to return (
pattern = re.compile(r'  const handleDownloadExcel = async \(\) => \{.*?\n  return \(\n', re.DOTALL)
match = pattern.search(content)

if match:
    single_func = """  const handleDownloadExcel = async () => {
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
    content = pattern.sub(single_func, content)
    with open("src/components/ManagerView.tsx", "w") as f:
        f.write(content)
    print("Success")
else:
    print("Not found")

