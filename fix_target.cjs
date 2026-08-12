const fs = require('fs');
let content = fs.readFileSync('src/components/ManagerView.tsx', 'utf8');

const oldCode = `                        let totalTargetBase = 0, totalBLBase = 0, totalTLBase = 0;
                        activeYLsList.forEach((yl: any) => {
                          const tgtObj = activeTargetYLMap[String(yl.area).substring(0, 3)] || { target: 0, bln_lalu: 0, thn_lalu: 0 };
                          totalTargetBase += Number(tgtObj.target) || 0;
                          totalBLBase += Number(tgtObj.bln_lalu) || 0;
                          totalTLBase += Number(tgtObj.thn_lalu) || 0;
                        });
                        
                        totalTarget = Math.round(totalTargetBase) * pembagi;
                        totalBL = Math.round(totalBLBase) * pembagi;
                        totalTL = Math.round(totalTLBase) * pembagi;`;

const newCode = `                        const activeYLs = activeYLsList.filter((y: any) => y.status !== "nonaktif");
                        const sumTarget = activeYLs.reduce((sum: number, yl: any) => sum + (Number(activeTargetYLMap[yl.area]?.target) || 0), 0);
                        const sumBL = activeYLs.reduce((sum: number, yl: any) => sum + (Number(activeTargetYLMap[yl.area]?.bln_lalu) || 0), 0);
                        const sumTL = activeYLs.reduce((sum: number, yl: any) => sum + (Number(activeTargetYLMap[yl.area]?.thn_lalu) || 0), 0);
                        
                        totalTarget = Math.round(sumTarget) * pembagi;
                        totalBL = Math.round(sumBL) * pembagi;
                        totalTL = Math.round(sumTL) * pembagi;`;

if(content.includes(oldCode)) {
  fs.writeFileSync('src/components/ManagerView.tsx', content.replace(oldCode, newCode));
  console.log('Fixed target calculation in ManagerView.tsx');
} else {
  console.log('Old code not found.');
}
