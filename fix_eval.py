import re

with open("src/components/ManagerView.tsx", "r") as f:
    content = f.read()

# Replace getEvaluasiHighlights
new_highlight = """  const getEvaluasiHighlights = () => {
    if (!evaluasiData || !evaluasiData.analisis) return { top: null, needImprovement: null, highestBB: null };
    const list = evaluasiData.analisis;

    if (list.length === 0) return { top: null, needImprovement: null, highestBB: null };

    const EVAL_CATEGORIES = [
      { key: 'jualHariIni', label: 'Penjualan Hari Ini', type: 'max', requirePositive: true },
      { key: 'rata2BulanBerjalan', label: 'Rata-rata Bulan Berjalan', type: 'max', requirePositive: true },
      { key: 'vsMingguLaluPct', label: 'Pertumbuhan vs Minggu Lalu', type: 'max', requirePositive: false },
      { key: 'persenRumah', label: 'Sektor Rumah', type: 'max', requirePositive: true },
      { key: 'persenRbVsPlg', label: 'Rasio RB vs PLG', type: 'max', requirePositive: true },
      { key: 'propagandaHariIni', label: 'Propaganda Hari Ini', type: 'max', requirePositive: true },
      { key: 'sampahBotol', label: 'Sampah Botol Akumulasi', type: 'target', target: 900, requirePositive: false },
      { key: 'bb', label: 'BB / Balik Botol', type: 'min', requirePositive: false }
    ];

    const categoryStats = EVAL_CATEGORIES.map(cat => {
      const vals = list.map(x => (x as any)[cat.key] as number || 0);
      let bestVal: number | null = null;
      let worstVal: number | null = null;
      
      let validVals = cat.requirePositive ? vals.filter(v => v > 0) : vals;
      
      let isWinner = (v: number) => false;
      let isLoser = (v: number) => false;
      let getScore = (v: number) => 0; // 0 to 1

      if (validVals.length > 0 || !cat.requirePositive) {
        if (cat.type === 'max') {
          bestVal = validVals.length > 0 ? Math.max(...validVals) : 0;
          worstVal = Math.min(...vals);
          isWinner = (v) => v === bestVal && (!cat.requirePositive || v > 0);
          isLoser = (v) => v === worstVal;
          getScore = (v) => bestVal === worstVal ? 1 : (v - worstVal) / (bestVal! - worstVal);
        } else if (cat.type === 'min') {
          bestVal = validVals.length > 0 ? Math.min(...validVals) : 0;
          worstVal = Math.max(...vals);
          isWinner = (v) => v === bestVal && (!cat.requirePositive || v > 0);
          isLoser = (v) => v === worstVal;
          getScore = (v) => bestVal === worstVal ? 1 : (worstVal - v) / (worstVal - bestVal!);
        } else if (cat.type === 'target') {
          const distances = vals.map(v => Math.abs(v - (cat.target as number)));
          const minDistance = Math.min(...distances);
          const maxDistance = Math.max(...distances);
          
          isWinner = (v) => Math.abs(v - (cat.target as number)) === minDistance;
          isLoser = (v) => Math.abs(v - (cat.target as number)) === maxDistance;
          getScore = (v) => {
            const d = Math.abs(v - (cat.target as number));
            return minDistance === maxDistance ? 1 : (maxDistance - d) / (maxDistance - minDistance);
          };
        }
      }

      return { ...cat, bestVal, worstVal, isWinner, isLoser, getScore };
    });

    const scoredList = list.map(yl => {
      let winCount = 0;
      let loseCount = 0;
      let totalScore = 0;
      let wonCategories: string[] = [];
      let lostCategories: string[] = [];

      categoryStats.forEach(stat => {
        const v = (yl as any)[stat.key] as number || 0;
        if (stat.isWinner(v)) {
          winCount++;
          wonCategories.push(stat.label);
        }
        if (stat.isLoser(v)) {
          loseCount++;
          lostCategories.push(stat.label);
        }
        totalScore += stat.getScore(v);
      });

      return { ...yl, winCount, loseCount, totalScore, wonCategories, lostCategories };
    });

    // Performa Terbaik
    const sortedTop = [...scoredList].sort((a, b) => b.winCount - a.winCount || b.totalScore - a.totalScore);
    const topWinCount = sortedTop[0].winCount;
    const topTotalScore = sortedTop[0].totalScore;
    const allTops = sortedTop.filter(x => x.winCount === topWinCount && Math.abs(x.totalScore - topTotalScore) < 0.001);
    
    const top = {
      ...sortedTop[0],
      nama: allTops.map(x => cleanYlName(x.nama)).join(", ")
    };

    // Performa Turun
    const sortedNeed = [...scoredList].sort((a, b) => b.loseCount - a.loseCount || a.totalScore - b.totalScore);
    const needLoseCount = sortedNeed[0].loseCount;
    const needTotalScore = sortedNeed[0].totalScore;
    const allNeeds = sortedNeed.filter(x => x.loseCount === needLoseCount && Math.abs(x.totalScore - needTotalScore) < 0.001);
    
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
  };"""

content = re.sub(r'  const getEvaluasiHighlights = \(\) => \{.*?\n  \};\n', new_highlight + "\n", content, flags=re.DOTALL)

with open("src/components/ManagerView.tsx", "w") as f:
    f.write(content)

