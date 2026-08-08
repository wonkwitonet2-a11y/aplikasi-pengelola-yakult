const { createClient } = require("@supabase/supabase-js");
const url = "https://ddjbxxfzqeikmsdejlih.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkamJ4eGZ6cWVpa21zZGVqbGloIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTI1MzEzMCwiZXhwIjoyMTAwODI5MTMwfQ.mTxcqMg_nJWz0gd1TNbPUeZiJBkgDv28QaDIQKOzvfY";
const supabase = createClient(url, key);

async function check() {
  const { data } = await supabase.from("app_store").select("data").eq("key", "main_db_transactions").single();
  let count = 0;
  if(data && data.data) {
    data.data.forEach(t => {
      if (t.tanggal === "2026-08-08") count++;
    });
  }
  console.log("DB tgl 8 transactions:", count);

  const { data: bdData } = await supabase.from("app_store").select("data").eq("key", "main_db_breakdownRealisasi").single();
  if (bdData && bdData.data && bdData.data["2026-08"]) {
    const md = bdData.data["2026-08"];
    let sum = 0;
    for (const a of Object.keys(md)) {
      if (md[a] && md[a].days && md[a].days["8"]) {
        sum += md[a].days["8"].om;
      }
    }
    console.log("BD 8 om total:", sum);
  }
}
check();
