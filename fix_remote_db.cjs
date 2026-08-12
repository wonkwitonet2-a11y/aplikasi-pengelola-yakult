async function fix() {
  const res = await fetch("http://localhost:3000/api/getBreakdownPlan?month=2026-08");
  const data = await res.json();
  
  if (data.breakdownRealisasi && Object.keys(data.breakdownRealisasi).length > 0) {
    const payload = {
      month: "2026-08",
      breakdownPlan: data.breakdownRealisasi,
      breakdownRealisasi: data.breakdownRealisasi
    };
    
    const saveRes = await fetch("http://localhost:3000/api/saveBreakdownPlan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    
    const saveText = await saveRes.text();
    console.log("Save status:", saveRes.status, saveText);
  } else {
    console.log("No realisasi data found for 2026-08");
  }
}
fix();
