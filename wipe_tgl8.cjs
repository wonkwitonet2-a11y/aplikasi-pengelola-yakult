const { createClient } = require("@supabase/supabase-js");

const url = "https://ddjbxxfzqeikmsdejlih.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkamJ4eGZ6cWVpa21zZGVqbGloIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTI1MzEzMCwiZXhwIjoyMTAwODI5MTMwfQ.mTxcqMg_nJWz0gd1TNbPUeZiJBkgDv28QaDIQKOzvfY";
const supabase = createClient(url, key);

async function wipe() {
  console.log("Fetching transactions...");
  let { data: txRow } = await supabase.from("app_store").select("data").eq("key", "main_db_transactions").single();
  if (txRow && txRow.data) {
    const origCount = txRow.data.length;
    txRow.data = txRow.data.filter(t => t.tanggal !== '2026-08-08');
    const newCount = txRow.data.length;
    console.log(`Deleted ${origCount - newCount} transactions.`);
    await supabase.from("app_store").upsert({ key: "main_db_transactions", data: txRow.data, updated_at: new Date().toISOString() });
  }

  console.log("Fetching breakdownRealisasi...");
  let { data: bdRow } = await supabase.from("app_store").select("data").eq("key", "main_db_breakdownRealisasi").single();
  if (bdRow && bdRow.data && bdRow.data['2026-08']) {
    let count = 0;
    const monthData = bdRow.data['2026-08'];
    for (const area of Object.keys(monthData)) {
      if (monthData[area] && monthData[area].days && monthData[area].days['8']) {
        monthData[area].days['8'] = { om:0, os:0, yo:0, yt:0 };
        count++;
      }
    }
    console.log(`Zeroed out ${count} breakdownRealisasi items.`);
    await supabase.from("app_store").upsert({ key: "main_db_breakdownRealisasi", data: bdRow.data, updated_at: new Date().toISOString() });
  }

  console.log("Fetching lhppRealisasi...");
  let { data: lhppRow } = await supabase.from("app_store").select("data").eq("key", "main_db_lhppRealisasi").single();
  if (lhppRow && lhppRow.data && lhppRow.data['2026-08']) {
    let count = 0;
    const monthData = lhppRow.data['2026-08'];
    for (const area of Object.keys(monthData)) {
      if (monthData[area] && monthData[area]['2026-08-08']) {
        delete monthData[area]['2026-08-08'];
        count++;
      }
    }
    console.log(`Deleted ${count} lhppRealisasi items.`);
    await supabase.from("app_store").upsert({ key: "main_db_lhppRealisasi", data: lhppRow.data, updated_at: new Date().toISOString() });
  }
  
  console.log("Wipe complete!");
}

wipe().catch(console.error);
