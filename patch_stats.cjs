const fs = require('fs');
let code = fs.readFileSync('src/components/ManagerView.tsx', 'utf8');

const statsHook = `  const monthlyGridTotals = useMemo(() => {
    let yo = 0, om = 0, os = 0, yt = 0;
    Object.values(dailyGridTotals).forEach((t: any) => {
      yo += t.yo || 0;
      om += t.om || 0;
      os += t.os || 0;
      yt += t.yt || 0;
    });
    return { yo, om, os, yt, total: yo + om + os + yt };
  }, [dailyGridTotals]);

  const monthlyGridStats = useMemo(() => {
    const activeYLs = activeYLsList.filter((y: any) => y.status !== "nonaktif");
    const sumTarget = activeYLs.reduce((sum: number, yl: any) => sum + (Number(activeTargetYLMap[yl.area]?.target) || 0), 0);
    const sumBL = activeYLs.reduce((sum: number, yl: any) => sum + (Number(activeTargetYLMap[yl.area]?.bln_lalu) || 0), 0);
    const sumTL = activeYLs.reduce((sum: number, yl: any) => sum + (Number(activeTargetYLMap[yl.area]?.thn_lalu) || 0), 0);
    
    const pembagiStr = (activeGridMap && Object.keys(activeGridMap).length > 0) ? (activeGridMap[Object.keys(activeGridMap)[0]]?.pembagiTanggal ?? 25) : 25;
    const pembagi = Number(pembagiStr) || 25;

    const totalTarget = Math.round(sumTarget) * pembagi;
    const totalBL = Math.round(sumBL) * pembagi;
    const totalTL = Math.round(sumTL) * pembagi;
    
    const grandTotal = monthlyGridTotals.total;
    
    const pctTgt = totalTarget > 0 ? (grandTotal / totalTarget) * 100 : 100;
    const pctBL = totalBL > 0 ? (grandTotal / totalBL) * 100 : 100;
    const pctTL = totalTL > 0 ? (grandTotal / totalTL) * 100 : 100;

    return {
      sumTarget, sumBL, sumTL,
      totalTarget, totalBL, totalTL,
      pctTgt, pctBL, pctTL
    };
  }, [activeYLsList, activeTargetYLMap, activeGridMap, monthlyGridTotals]);`;

code = code.replace(/  const monthlyGridTotals = useMemo\(\(\) => \{[\s\S]*?  \}, \[dailyGridTotals\]\);/, statsHook);
fs.writeFileSync('src/components/ManagerView.tsx', code);
console.log("Patched monthlyGridStats");
