const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const db = JSON.parse(fs.readFileSync('data.json', 'utf-8'));
const url = db.supabaseConfig.url;
const key = db.supabaseConfig.key;
const supabase = createClient(url, key);

async function fixPotensi() {
  const { data } = await supabase.from('app_store').select('data').eq('key', 'main_db_potensiTembus').single();
  let pt = data ? data.data : {};
  let deleted = 0;
  
  // if they save per month in potensiTembus
  // wait, potensiTembus structure is: potensiTembus[month][area]
  // Did they save for date 8? No, potensiTembus is per month! (e.g., '2026-08')
  // So there is no "tgl 8" for potensiTembus.
}
fixPotensi();
