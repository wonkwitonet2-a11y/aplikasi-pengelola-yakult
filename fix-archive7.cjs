const fs = require('fs');
let code = fs.readFileSync('src/components/archive/ArchiveEditor.tsx', 'utf8');

const importCleanYlName = `import { cleanYlName } from "../../types";`;
code = code.replace(/import \{ loadFromSupabase, saveToSupabase \} from "\.\.\/\.\.\/lib\/supabaseClient";/,
`import { loadFromSupabase, saveToSupabase } from "../../lib/supabaseClient";
${importCleanYlName}`);

const helpers = `
  const currentMonthTotal = useCallback((perYL, key) => {
    return Object.values(perYL || {}).reduce((acc, curr) => acc + (Number(curr?.[key]) || 0), 0);
  }, []);

  const calculateSektorTotals = useCallback((dashboard) => {
    if (!dashboard) return [];

    let sRmh = Number(dashboard.sektorTim?.rumah) || 0;
    let sPsr = Number(dashboard.sektorTim?.pasar) || 0;
    let sSkh = Number(dashboard.sektorTim?.sekolah) || 0;
    let sKtr = Number(dashboard.sektorTim?.kantor) || 0;
    let sTk  = Number(dashboard.sektorTim?.toko) || 0;
    let sIb  = Number(dashboard.sektorTim?.ib) || 0;

    if (sRmh === 0 && sPsr === 0 && sSkh === 0 && sKtr === 0 && sTk === 0 && sIb === 0 && dashboard.perYL) {
      Object.values(dashboard.perYL).forEach((yl) => {
        if (yl.sektor) {
          const parseSec = (val) => {
            if (typeof val === "number") return val;
            if (val && typeof val === "object") {
              return (Number(val.yo)||0) + (Number(val.om)||0) + (Number(val.os)||0) + (Number(val.yt)||0);
            }
            return 0;
          };
          sRmh += parseSec(yl.sektor.rmh || yl.sektor.rumah);
          sPsr += parseSec(yl.sektor.psr || yl.sektor.pasar);
          sSkh += parseSec(yl.sektor.skh || yl.sektor.sekolah);
          sKtr += parseSec(yl.sektor.ktr || yl.sektor.kantor);
          sTk  += parseSec(yl.sektor.tk  || yl.sektor.toko);
          sIb  += parseSec(yl.sektor.ib);
        }
      });
    }

    return [
      { name: "RUMAH",   value: Math.round(sRmh), color: "#f59e0b" },
      { name: "PASAR",   value: Math.round(sPsr), color: "#eab308" },
      { name: "SEKOLAH", value: Math.round(sSkh), color: "#0284c7" },
      { name: "KANTOR",  value: Math.round(sKtr), color: "#0f766e" },
      { name: "TOKO",    value: Math.round(sTk),  color: "#c026d3" },
      { name: "IB",      value: Math.round(sIb),  color: "#be123c" }
    ];
  }, []);
`;
code = code.replace(/const activeGridMap = snapshot\?\.breakdownRealisasiMap \|\| \{\};/, helpers + '\n  const activeGridMap = snapshot?.breakdownRealisasiMap || {};');

const replacedRender = `<ManagerDashboardTab 
                  dashboardData={snapshot.dashboardData}
                  targetTKU={snapshot.targetTKU || { target: 0, bln_lalu: 0, thn_lalu: 0 }}
                  cleanYlName={cleanYlName}
                  currentMonthTotal={currentMonthTotal}
                  calculateSektorTotals={calculateSektorTotals}
                />`;
code = code.replace(/<ManagerDashboardTab dashboardData=\{snapshot\.dashboardData\} \/>/, replacedRender);

fs.writeFileSync('src/components/archive/ArchiveEditor.tsx', code);
