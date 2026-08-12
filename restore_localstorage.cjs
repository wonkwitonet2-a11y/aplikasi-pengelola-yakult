const fs = require('fs');
let content = fs.readFileSync('src/components/ManagerView.tsx', 'utf8');

const search = `  const fetchBreakdownPlan = async (month: string = selectedBreakdownMonth) => {
    try {
      const res = await safeFetchJson(\`/api/getBreakdownPlan?month=\${month}\`);
      if (res && res.ok) {
        setBreakdownPlanMap(res.breakdownPlan || {});
        setBreakdownRealisasiMap(res.breakdownRealisasi || {});
      }
    } catch (e) {
      console.error("Error fetching breakdown plan:", e);
    }
  };`;

const replace = `  const fetchBreakdownPlan = async (month: string = selectedBreakdownMonth) => {
    try {
      // Tampilkan data dari localStorage dulu sebagai fallback (mengembalikan data user yg sempat "hilang")
      const localPlan = localStorage.getItem(\`bd_plan_\${month}\`);
      const localReal = localStorage.getItem(\`bd_realisasi_\${month}\`);
      
      let initialPlan = {};
      let initialReal = {};
      
      if (localPlan) {
        try { initialPlan = JSON.parse(localPlan); } catch(e){}
      }
      if (localReal) {
        try { initialReal = JSON.parse(localReal); } catch(e){}
      }

      const res = await safeFetchJson(\`/api/getBreakdownPlan?month=\${month}\`);
      if (res && res.ok) {
        // Gabungkan data dari localStorage dan server. Jika server kosong tapi localStorage ada, pakai localStorage.
        const serverPlan = res.breakdownPlan || {};
        const serverReal = res.breakdownRealisasi || {};
        
        const mergedPlan = Object.keys(serverPlan).length > 0 ? serverPlan : initialPlan;
        const mergedReal = Object.keys(serverReal).length > 0 ? serverReal : initialReal;

        setBreakdownPlanMap(mergedPlan);
        setBreakdownRealisasiMap(mergedReal);
        
        // Save back to localStorage to keep it updated
        localStorage.setItem(\`bd_plan_\${month}\`, JSON.stringify(mergedPlan));
        localStorage.setItem(\`bd_realisasi_\${month}\`, JSON.stringify(mergedReal));
      } else {
        // Fallback to local storage only
        setBreakdownPlanMap(initialPlan);
        setBreakdownRealisasiMap(initialReal);
      }
    } catch (e) {
      console.error("Error fetching breakdown plan:", e);
    }
  };`;

if (content.includes(search)) {
    fs.writeFileSync('src/components/ManagerView.tsx', content.replace(search, replace));
    console.log("Patched successfully");
} else {
    console.log("Could not find search string");
}
