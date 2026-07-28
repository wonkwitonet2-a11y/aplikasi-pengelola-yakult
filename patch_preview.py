with open("src/components/ManagerView.tsx", "r") as f:
    content = f.read()

import re

new_func = """  const handleOpenResetPreview = async () => {
    if (!manualCutoffDate) {
      alert("Silakan pilih tanggal cutoff terlebih dahulu.");
      return;
    }
    try {
      const res = await safeFetchJson("/api/resetDataManual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "preview", cutoffDate: manualCutoffDate })
      });
      if (res && !res.error) {
        setResetModal(res);
        setResetConfirmText("");
      } else {
        alert(res?.error || "Gagal memuat pratinjau reset data.");
      }
    } catch (e: any) {
      alert("Gagal memuat pratinjau reset data: " + e.message);
    }
  };

  const handleConfirmReset = async () => {
    if (resetConfirmText !== "HAPUS") {
      alert("Silakan ketik HAPUS untuk konfirmasi.");
      return;
    }
    setIsResetting(true);
    try {
      const res = await safeFetchJson("/api/resetDataManual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm", cutoffDate: manualCutoffDate })
      });
      if (res && res.ok) {
        alert(res.message);
        setResetModal(null);
        fetchTransactions(selectedDate);
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

with open("src/components/ManagerView.tsx", "w") as f:
    f.write(content)
