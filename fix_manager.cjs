const fs = require('fs');
let content = fs.readFileSync('src/components/ManagerView.tsx', 'utf8');

content = content.replace(/activeEvaluasiDatauasiData/g, 'activeEvaluasiData');

// Now, move isViewingHistoricalMonth and related states UP.
const statesToMove = `  // Supabase Monthly Archive & Retrieval State
  const [selectedMonthlyArchive, setSelectedMonthlyArchive] = useState<string>(() => new Date().toISOString().substring(0, 7));
  const [isViewingHistoricalMonth, setIsViewingHistoricalMonth] = useState<boolean>(false);
  const [historicalDataSnapshot, setHistoricalDataSnapshot] = useState<any | null>(null);
  const [historicalDataNotFound, setHistoricalDataNotFound] = useState<boolean>(false);
  const [historicalMonthLabel, setHistoricalMonthLabel] = useState<string>("");
  const [archivedMonthsList, setArchivedMonthsList] = useState<string[]>([]);
  const [archiveStatusMsg, setArchiveStatusMsg] = useState<string>("");`;

content = content.replace(statesToMove, '');

const insertionPoint = `  const [localEval, setLocalEval] = useState<EvaluasiData | null>(evaluasiData);`;

content = content.replace(insertionPoint, insertionPoint + '\n\n' + statesToMove);

// Next, what about activeTargetTKU, activeTargetYLMap, activeDashboardData? 
// targetTKU is declared at line 1337, but is it used before that? 
// Let's check where targetTKU is declared.

fs.writeFileSync('src/components/ManagerView.tsx', content);
