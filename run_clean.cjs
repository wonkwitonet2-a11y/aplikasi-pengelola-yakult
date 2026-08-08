const { createClient } = require("@supabase/supabase-js");
const url = "https://ddjbxxfzqeikmsdejlih.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkamJ4eGZ6cWVpa21zZGVqbGloIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTI1MzEzMCwiZXhwIjoyMTAwODI5MTMwfQ.mTxcqMg_nJWz0gd1TNbPUeZiJBkgDv28QaDIQKOzvfY";
const supabase = createClient(url, key);

async function run() {
  const { data: tx } = await supabase.from("app_store").select("data").eq("key", "main_db_transactions").single();
  let count = 0;
  if(tx && tx.data) {
    const freshTx = tx.data.filter(t => {
      if (t.tanggal === "2026-08-08") { count++; return false; }
      return true;
    });
    console.log("Removing", count, "txs");
    await supabase.from("app_store").upsert({ key: "main_db_transactions", data: freshTx, updated_at: new Date().toISOString() }, { onConflict: "key" });
  }

  const { data: bd } = await supabase.from("app_store").select("data").eq("key", "main_db_breakdownRealisasi").single();
  let bdCount = 0;
  if(bd && bd.data && bd.data["2026-08"]) {
    const md = bd.data["2026-08"];
    for (const a of Object.keys(md)) {
      if (md[a] && md[a].days && md[a].days["8"]) {
         // check if there's any value > 0
         const d = md[a].days["8"];
         if(d.om > 0 || d.os > 0 || d.yo > 0 || d.yt > 0) {
            bdCount++;
            md[a].days["8"] = { om: 0, os: 0, yo: 0, yt: 0 };
         }
      }
    }
    console.log("Fixing", bdCount, "BD entries");
    await supabase.from("app_store").upsert({ key: "main_db_breakdownRealisasi", data: bd.data, updated_at: new Date().toISOString() }, { onConflict: "key" });
  }
}
run();
