const { createClient } = require("@supabase/supabase-js");
const url = "https://ddjbxxfzqeikmsdejlih.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkamJ4eGZ6cWVpa21zZGVqbGloIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTI1MzEzMCwiZXhwIjoyMTAwODI5MTMwfQ.mTxcqMg_nJWz0gd1TNbPUeZiJBkgDv28QaDIQKOzvfY";
const supabase = createClient(url, key);

async function check() {
  const { data, error } = await supabase.from("app_store").select("data").eq("key", "monthly_archive_2026-08").single();
  if (data) {
    const fs = require('fs');
    fs.writeFileSync("arch-08.json", JSON.stringify(data.data));
    console.log("Saved arch-08.json");
  } else {
    console.log("Not found or error", error);
  }
}
check();
