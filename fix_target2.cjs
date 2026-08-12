const fs = require('fs');
let content = fs.readFileSync('src/components/ManagerView.tsx', 'utf8');

const oldCode = `                        const activeYLs = activeYLsList.filter((y: any) => y.status !== "nonaktif");
                        const sumTarget = activeYLs.reduce((sum: number, yl: any) => sum + (Number(activeTargetYLMap[yl.area]?.target) || 0), 0);
                        const sumBL = activeYLs.reduce((sum: number, yl: any) => sum + (Number(activeTargetYLMap[yl.area]?.bln_lalu) || 0), 0);
                        const sumTL = activeYLs.reduce((sum: number, yl: any) => sum + (Number(activeTargetYLMap[yl.area]?.thn_lalu) || 0), 0);
                        
                        totalTarget = Math.round(sumTarget) * pembagi;
                        totalBL = Math.round(sumBL) * pembagi;
                        totalTL = Math.round(sumTL) * pembagi;`;

const newCode = `                        totalTarget = Math.round((activeTargetTKU?.target || 0) * pembagi);
                        totalBL = Math.round((activeTargetTKU?.bln_lalu || 0) * pembagi);
                        totalTL = Math.round((activeTargetTKU?.thn_lalu || 0) * pembagi);`;

if(content.includes(oldCode)) {
  fs.writeFileSync('src/components/ManagerView.tsx', content.replace(oldCode, newCode));
  console.log('Fixed target calculation in ManagerView.tsx');
} else {
  console.log('Old code not found.');
}
