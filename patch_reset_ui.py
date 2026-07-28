with open("src/components/ManagerView.tsx", "r") as f:
    content = f.read()

import re

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
        
        // CLEAR LOCAL STATE TO PREVENT AUTO-SAVE FROM RESTORING IT
        if (resetScope === "all" || resetScope === "current_month") {
           setBreakdownPlanMap({});
           setBreakdownRealisasiMap({});
           fetchBreakdownPlan(selectedBreakdownMonth);
        }
        
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

content = re.sub(r'  const handleConfirmTargetedReset = async \(\) => \{.*?finally \{\n      setIsResetting\(false\);\n    \}\n  \};', new_func, content, flags=re.DOTALL)

with open("src/components/ManagerView.tsx", "w") as f:
    f.write(content)
