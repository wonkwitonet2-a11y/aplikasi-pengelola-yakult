const fs = require('fs');
let content = fs.readFileSync('src/components/YLView.tsx', 'utf8');

// 1. Add states
content = content.replace(
  /const \[apkBotol, setApkBotol\] = useState<number>\(0\);/,
  `const [apkBotol, setApkBotol] = useState<number>(0);
  const [skhTotal, setSkhTotal] = useState<number>(0);
  const [skhTembus, setSkhTembus] = useState<number>(0);
  const [kntrTotal, setKntrTotal] = useState<number>(0);
  const [kntrTembus, setKntrTembus] = useState<number>(0);
  const [tkoTotal, setTkoTotal] = useState<number>(0);
  const [tkoTembus, setTkoTembus] = useState<number>(0);`
);

// 2. Load existing data
content = content.replace(
  /setApkPlg\(existing\.apk_plg \|\| 0\);\n        setApkBotol\(existing\.apk_botol \|\| 0\);/,
  `setApkPlg(existing.apk_plg || 0);
        setApkBotol(existing.apk_botol || 0);
        setSkhTotal(existing.skh_total || 0);
        setSkhTembus(existing.skh_tembus || 0);
        setKntrTotal(existing.kntr_total || 0);
        setKntrTembus(existing.kntr_tembus || 0);
        setTkoTotal(existing.tko_total || 0);
        setTkoTembus(existing.tko_tembus || 0);`
);

// 3. Clear data
content = content.replace(
  /setPbP\(0\); setPbS\(0\); setApkPlg\(0\); setApkBotol\(0\);/,
  `setPbP(0); setPbS(0); setApkPlg(0); setApkBotol(0);
        setSkhTotal(0); setSkhTembus(0); setKntrTotal(0); setKntrTembus(0); setTkoTotal(0); setTkoTembus(0);`
);

// 4. Save data payload
content = content.replace(
  /apk_plg: apkPlg,\n      apk_botol: apkBotol\n    };/,
  `apk_plg: apkPlg,
      apk_botol: apkBotol,
      skh_total: skhTotal,
      skh_tembus: skhTembus,
      kntr_total: kntrTotal,
      kntr_tembus: kntrTembus,
      tko_total: tkoTotal,
      tko_tembus: tkoTembus
    };`
);

fs.writeFileSync('src/components/YLView.tsx', content);
