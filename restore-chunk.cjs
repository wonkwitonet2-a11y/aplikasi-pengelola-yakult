const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");

const db = JSON.parse(fs.readFileSync("data.json", "utf-8"));
const url = "https://ddjbxxfzqeikmsdejlih.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkamJ4eGZ6cWVpa21zZGVqbGloIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTI1MzEzMCwiZXhwIjoyMTAwODI5MTMwfQ.mTxcqMg_nJWz0gd1TNbPUeZiJBkgDv28QaDIQKOzvfY";
const supabase = createClient(url, key);

async function restore() {
  for (const k of Object.keys(db)) {
    const data = db[k];
    console.log(`Uploading ${k} ... size: ${JSON.stringify(data).length}`);
    const { error } = await supabase.from("app_store").upsert({
      key: `main_db_${k}`,
      data: data,
      updated_at: new Date().toISOString()
    }, { onConflict: "key" });
    if (error) {
      console.error(`Failed ${k}:`, error);
    } else {
      console.log(`Success ${k}`);
    }
  }
}
restore();
