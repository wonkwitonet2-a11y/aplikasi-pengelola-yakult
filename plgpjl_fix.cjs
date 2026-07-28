const fs = require('fs');
let content = fs.readFileSync('src/components/PlgPjlView.tsx', 'utf8');

// 1. Remove manualMap references
content = content.replace(/const \[manualMap, setManualMap\].*;\n/g, '');
content = content.replace(/setManualMap\(data\.plgPjlManual \|\| \{\}\);\n/g, '');

content = content.replace(/const \[manualSklhTotal, setManualSklhTotal\].*;\n/g, '');
content = content.replace(/const \[manualSklhTembus, setManualSklhTembus\].*;\n/g, '');
content = content.replace(/const \[manualKntrTotal, setManualKntrTotal\].*;\n/g, '');
content = content.replace(/const \[manualKntrTembus, setManualKntrTembus\].*;\n/g, '');
content = content.replace(/const \[manualTkoTotal, setManualTkoTotal\].*;\n/g, '');
content = content.replace(/const \[manualTkoTembus, setManualTkoTembus\].*;\n/g, '');

content = content.replace(/const \[savingManual, setSavingManual\].*;\n/g, '');
content = content.replace(/const \[successMsg, setSuccessMsg\].*;\n/g, '');

// 2. Remove useEffect that depends on manualMap
content = content.replace(/\/\/ Update manual form fields[\s\S]*?\}, \[selectedArea, manualMap, activeYlList\]\);\n/g, '');

// 3. Remove handleSaveManual
content = content.replace(/const handleSaveManual = async \(\) => \{[\s\S]*?  \};\n/g, '');

// 4. In PlgPjlView, calculate totals directly from transactions
content = content.replace(
  /\/\/ Ratios/,
  `const manualSklhTotal = sumTxKey("skh_total");
  const manualSklhTembus = sumTxKey("skh_tembus");
  const manualKntrTotal = sumTxKey("kntr_total");
  const manualKntrTembus = sumTxKey("kntr_tembus");
  const manualTkoTotal = sumTxKey("tko_total");
  const manualTkoTembus = sumTxKey("tko_tembus");

  // Ratios`
);

// 5. Change "disabled={isTkuDp1}" to "disabled={true}" or just remove inputs?
// Actually, since they are now derived, we should make them readonly.
content = content.replace(/disabled=\{isTkuDp1\}/g, 'disabled={true}');

// 6. Remove the save button UI
content = content.replace(/\{!isTkuDp1 \? \([\s\S]*?<\/button>\n\s*\) : \(\n\s*<div.*?>[\s\S]*?<\/div>\n\s*\)\}/g, '');

// Change the title slightly to reflect it is automated
content = content.replace(/INPUT MANUAL LEMBAGA & TEMBUS/g, 'AKUMULASI LEMBAGA & TEMBUS');
content = content.replace(/Khusus jumlah total dan tembus Sekolah, Kantor, dan Toko diisi secara manual per YL\./g, 'Menampilkan total kunjungan lembaga dan tembus dari YL yang dipilih.');
content = content.replace(/Menampilkan total gabungan lembaga & tembus dari seluruh \{activeYlList\.length\} YL aktif\./g, 'Menampilkan total akumulasi kunjungan lembaga dan tembus.');
content = content.replace(/Manual Input/g, 'Otomatis dari YL');

fs.writeFileSync('src/components/PlgPjlView.tsx', content);
