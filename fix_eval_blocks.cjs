const fs = require('fs');
let content = fs.readFileSync('src/components/ManagerView.tsx', 'utf8');

const regex = /const getEvaluasiBlocks = \(\) => \{[\s\S]*?return \{ block1, block2, block3, block4, block5, block6, block7, block8 \};\n  \};/;

const replacement = `const getEvaluasiBlocks = () => {
    if (!evaluasiData || !evaluasiData.analisis) return null;
    const list = evaluasiData.analisis;

    const getTop = (key: keyof typeof list[0], ascending = false) => {
      if (list.length === 0) return null;
      const sorted = [...list].sort((a, b) => ascending ? (a[key] as number) - (b[key] as number) : (b[key] as number) - (a[key] as number));
      const topVal = sorted[0][key];
      const allTops = sorted.filter(item => item[key] === topVal);
      const joinedNames = allTops.map(i => cleanYlName(i.nama)).join(", ");
      
      // Return a mocked object with the joined names and the top value
      return {
        ...sorted[0],
        nama: joinedNames,
        [key]: topVal
      };
    };

    const block1 = getTop("jualHariIni");
    const block2 = getTop("rata2BulanBerjalan");
    const block3 = getTop("vsMingguLaluPct");
    const block4 = getTop("persenRumah");
    const block5 = getTop("persenRbVsPlg");
    const block6 = getTop("propagandaHariIni");
    const block7 = getTop("sampahBotol");
    const block8 = getTop("bb", true);

    return { block1, block2, block3, block4, block5, block6, block7, block8 };
  };`;

content = content.replace(regex, replacement);
fs.writeFileSync('src/components/ManagerView.tsx', content);
