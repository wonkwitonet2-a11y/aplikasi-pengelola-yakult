const fs = require('fs');
let content = fs.readFileSync('src/components/YLView.tsx', 'utf8');

const injection = `
  useEffect(() => {
    if (activeTab === "potensi_tembus") {
      const month = selectedDate.substring(0, 7);
      fetch(\`/api/getPotensiTembus?bulan=\${month}&nama=\${encodeURIComponent(ylName)}\`)
        .then(res => res.json())
        .then(data => {
          if (data && data.data) {
            setPotensiTembus(data.data);
          } else {
             setPotensiTembus({
                skhTotal: 0, skhTembus: 0,
                kntrTotal: 0, kntrTembus: 0,
                tkoTotal: 0, tkoTembus: 0
             });
          }
        })
        .catch(console.error);
    }
  }, [activeTab, selectedDate, ylName]);

  const handleSavePotensiTembus = async () => {
    setIsPotensiTembusSaving(true);
    setPotensiTembusMsg("");
    try {
      const month = selectedDate.substring(0, 7);
      const res = await fetch("/api/savePotensiTembus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
           bulan: month,
           nama: ylName,
           ...potensiTembus
        })
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setPotensiTembusMsg("✅ Berhasil menyimpan data Potensi & Tembus.");
      } else {
        setPotensiTembusMsg("❌ Gagal menyimpan data.");
      }
    } catch(e: any) {
      setPotensiTembusMsg("❌ Error: " + e.message);
    } finally {
      setIsPotensiTembusSaving(false);
      setTimeout(() => setPotensiTembusMsg(""), 3000);
    }
  };

  // Save report
`;

content = content.replace(/\/\/ Save report\n/g, injection);
fs.writeFileSync('src/components/YLView.tsx', content);
