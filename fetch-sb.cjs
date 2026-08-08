const { createClient } = require("@supabase/supabase-js");
const url = "https://ddjbxxfzqeikmsdejlih.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkamJ4eGZ6cWVpa21zZGVqbGloIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTI1MzEzMCwiZXhwIjoyMTAwODI5MTMwfQ.mTxcqMg_nJWz0gd1TNbPUeZiJBkgDv28QaDIQKOzvfY";
const supabase = createClient(url, key);

async function check() {
  const { data, error } = await supabase.from("app_store").select("key").limit(100);
  console.log(error ? "Error: " + error.message : "Keys in Supabase: " + data.map(d => d.key).join(", "));
  
  const tx = await supabase.from("app_store").select("data").eq("key", "main_db_transactions").single();
  if (tx.data && tx.data.data) {
    console.log("Supabase Transactions count:", tx.data.data.length);
  } else {
    console.log("No transactions in supabase");
  }
}
check();
