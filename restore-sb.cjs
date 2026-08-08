const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");

const db = JSON.parse(fs.readFileSync("data.json", "utf-8"));
const url = "https://ddjbxxfzqeikmsdejlih.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkamJ4eGZ6cWVpa21zZGVqbGloIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTI1MzEzMCwiZXhwIjoyMTAwODI5MTMwfQ.mTxcqMg_nJWz0gd1TNbPUeZiJBkgDv28QaDIQKOzvfY";
const supabase = createClient(url, key);

async function restore() {
  const updates = [];
  for (const k of Object.keys(db)) {
    updates.push({
      key: `main_db_${k}`,
      data: db[k],
      updated_at: new Date().toISOString()
    });
  }
  
  const { error } = await supabase.from("app_store").upsert(updates, { onConflict: "key" });
  if (error) {
    console.error("Restore failed:", error);
  } else {
    console.log("Restore successful! Keys restored:", updates.length);
  }
}
restore();
