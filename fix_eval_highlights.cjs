const fs = require('fs');
let content = fs.readFileSync('src/components/ManagerView.tsx', 'utf8');

const regex = /const getEvaluasiHighlights = \(\) => \{[\s\S]*?return \{ top, needImprovement, highestBB \};\n  \};/;

const replacement = `const getEvaluasiHighlights = () => {
    if (!evaluasiData || !evaluasiData.analisis) return { top: null, needImprovement: null, highestBB: null };
    const list = evaluasiData.analisis;

    if (list.length === 0) return { top: null, needImprovement: null, highestBB: null };

    const sortedTop = [...list].sort((a, b) => b.vsMingguLaluPct - a.vsMingguLaluPct);
    const topVal = sortedTop[0].vsMingguLaluPct;
    const allTops = sortedTop.filter(x => x.vsMingguLaluPct === topVal);
    const top = {
      ...sortedTop[0],
      nama: allTops.map(x => cleanYlName(x.nama)).join(", ")
    };

    const sortedNeed = [...list].sort((a, b) => a.vsMingguLaluPct - b.vsMingguLaluPct);
    const needVal = sortedNeed[0].vsMingguLaluPct;
    const allNeeds = sortedNeed.filter(x => x.vsMingguLaluPct === needVal);
    const needImprovement = {
      ...sortedNeed[0],
      nama: allNeeds.map(x => cleanYlName(x.nama)).join(", ")
    };

    const sortedBB = [...list].sort((a, b) => b.bb - a.bb);
    const bbVal = sortedBB[0].bb;
    const allBBs = sortedBB.filter(x => x.bb === bbVal);
    const highestBB = {
      ...sortedBB[0],
      nama: allBBs.map(x => cleanYlName(x.nama)).join(", ")
    };

    return { top, needImprovement, highestBB };
  };`;

content = content.replace(regex, replacement);
fs.writeFileSync('src/components/ManagerView.tsx', content);
