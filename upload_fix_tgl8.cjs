const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const db = JSON.parse(fs.readFileSync('data.json', 'utf-8'));
const url = db.supabaseConfig.url;
const key = db.supabaseConfig.key;
const supabase = createClient(url, key);

async function upload() {
  const { error: e1 } = await supabase.from('app_store').upsert({
    key: 'main_db_transactions',
    data: db.transactions,
    updated_at: new Date().toISOString()
  }, { onConflict: 'key' });
  console.log("Upload transactions error:", e1);

  const { error: e2 } = await supabase.from('app_store').upsert({
    key: 'main_db_breakdownRealisasi',
    data: db.breakdownRealisasi,
    updated_at: new Date().toISOString()
  }, { onConflict: 'key' });
  console.log("Upload breakdownRealisasi error:", e2);

  const { error: e3 } = await supabase.from('app_store').upsert({
    key: 'main_db_lhppRealisasi',
    data: db.lhppRealisasi,
    updated_at: new Date().toISOString()
  }, { onConflict: 'key' });
  console.log("Upload lhppRealisasi error:", e3);
}
upload();
