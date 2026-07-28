const fs = require('fs');
let content = fs.readFileSync('src/components/YLView.tsx', 'utf8');

// 1. activeTab type update
content = content.replace(
  /const \[activeTab, setActiveTab\] = useState<"input" \| "ringkasan" \| "breakdown" \| "realisasi_potensi">/,
  'const [activeTab, setActiveTab] = useState<"input" | "ringkasan" | "breakdown" | "realisasi_potensi" | "potensi_tembus">'
);

// 2. Remove states skhTotal, skhTembus, etc. and add new ones
content = content.replace(
  /const \[skhTotal, setSkhTotal\] = useState<number>\(0\);\n\s*const \[skhTembus, setSkhTembus\] = useState<number>\(0\);\n\s*const \[kntrTotal, setKntrTotal\] = useState<number>\(0\);\n\s*const \[kntrTembus, setKntrTembus\] = useState<number>\(0\);\n\s*const \[tkoTotal, setTkoTotal\] = useState<number>\(0\);\n\s*const \[tkoTembus, setTkoTembus\] = useState<number>\(0\);/,
  `const [potensiTembus, setPotensiTembus] = useState({ skhTotal: 0, skhTembus: 0, kntrTotal: 0, kntrTembus: 0, tkoTotal: 0, tkoTembus: 0 });
  const [isPotensiTembusSaving, setIsPotensiTembusSaving] = useState(false);
  const [potensiTembusMsg, setPotensiTembusMsg] = useState("");`
);

// Remove setSkhTotal calls from useEffects (around lines 230-260)
content = content.replace(/\s*setSkhTotal\(.*?\);/g, '');
content = content.replace(/\s*setSkhTembus\(.*?\);/g, '');
content = content.replace(/\s*setKntrTotal\(.*?\);/g, '');
content = content.replace(/\s*setKntrTembus\(.*?\);/g, '');
content = content.replace(/\s*setTkoTotal\(.*?\);/g, '');
content = content.replace(/\s*setTkoTembus\(.*?\);/g, '');

// 3. handleSaveReport Validation
content = content.replace(
  /const handleSaveReport = async \(\) => \{/,
  `const handleSaveReport = async () => {\n    const existingTransaction = transactions.find(t => t.tanggal === selectedDate);\n    if (!existingTransaction) {\n      alert("⚠️ Data tidak ada untuk tanggal ini. Tidak bisa disimpan.");\n      return;\n    }`
);

// Remove these fields from the payload in handleSaveReport
content = content.replace(
  /skh_total: skhTotal,\s*skh_tembus: skhTembus,\s*kntr_total: kntrTotal,\s*kntr_tembus: kntrTembus,\s*tko_total: tkoTotal,\s*tko_tembus: tkoTembus,/g,
  ''
);

// 4. Perbandingan Cocok / Tidak Cocok dengan Acuan Admin
// In realisasi_potensi tab, inside "Sektor breakdown"
// Let's first find the exact position.
// There is a section `{/* Sektor breakdown */}`
fs.writeFileSync('src/components/YLView.tsx', content);
