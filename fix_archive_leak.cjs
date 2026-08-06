const fs = require('fs');
let content = fs.readFileSync('src/components/ManagerView.tsx', 'utf8');

// 1. In handleFetchMonthFromSupabase, remove state overrides
const fetchSearch = `        if (snapshot.targetTKU) {
          setTargetTKU(snapshot.targetTKU);
          if (snapshot.dashboardData) {
            snapshot.dashboardData.targetTim = {
              target: snapshot.targetTKU.target || 0,
              bulanLalu: snapshot.targetTKU.bln_lalu || 0,
              tahunLalu: snapshot.targetTKU.thn_lalu || 0
            };
          }
        }
        if (snapshot.targetYLMap) {
          setTargetYLMap(snapshot.targetYLMap);
          if (snapshot.dashboardData && snapshot.dashboardData.perYL) {
            Object.keys(snapshot.dashboardData.perYL).forEach(yl => {
              if (snapshot.targetYLMap[yl]) {
                snapshot.dashboardData.perYL[yl].target = snapshot.targetYLMap[yl].target;
              }
            });
          }
        }
        
        setHistoricalDataSnapshot(snapshot);
        setHistoricalDataNotFound(false);
        setIsViewingHistoricalMonth(true);
        setHistoricalMonthLabel(label);
        setSelectedBreakdownMonth(mKey);
        setArchiveStatusMsg(\`✅ Data Bulan \${label} berhasil diambil dari Supabase! Semua menu sekarang menampilkan data bulan ini.\`);

        if (snapshot.breakdownPlanMap) setBreakdownPlanMap(snapshot.breakdownPlanMap);
        if (snapshot.breakdownRealisasiMap) setBreakdownRealisasiMap(snapshot.breakdownRealisasiMap);
        if (snapshot.evaluasiData) setLocalEval(snapshot.evaluasiData);`;

const fetchReplace = `        if (snapshot.targetTKU) {
          if (snapshot.dashboardData) {
            snapshot.dashboardData.targetTim = {
              target: snapshot.targetTKU.target || 0,
              bulanLalu: snapshot.targetTKU.bln_lalu || 0,
              tahunLalu: snapshot.targetTKU.thn_lalu || 0
            };
          }
        }
        if (snapshot.targetYLMap) {
          if (snapshot.dashboardData && snapshot.dashboardData.perYL) {
            Object.keys(snapshot.dashboardData.perYL).forEach(yl => {
              if (snapshot.targetYLMap[yl]) {
                snapshot.dashboardData.perYL[yl].target = snapshot.targetYLMap[yl].target;
              }
            });
          }
        }
        
        setHistoricalDataSnapshot(snapshot);
        setHistoricalDataNotFound(false);
        setIsViewingHistoricalMonth(true);
        setHistoricalMonthLabel(label);
        setSelectedBreakdownMonth(mKey);
        setArchiveStatusMsg(\`✅ Data Bulan \${label} berhasil diambil dari Supabase! Semua menu sekarang menampilkan data bulan ini.\`);`;

content = content.replace(fetchSearch, fetchReplace);

// 2. Active Grid Map definitions
const activeGridMapSearch = `  // Get active grid map depending on mode (BD or Realisasi)
  const activeGridMap = gridSubMode === "BD" ? breakdownPlanMap : breakdownRealisasiMap;`;

const activeGridMapReplace = `  // Get active grid map depending on mode (BD or Realisasi)
  const activeBreakdownPlanMap = (isViewingHistoricalMonth && historicalDataSnapshot?.breakdownPlanMap)
    ? historicalDataSnapshot.breakdownPlanMap
    : breakdownPlanMap;
  const activeBreakdownRealisasiMap = (isViewingHistoricalMonth && historicalDataSnapshot?.breakdownRealisasiMap)
    ? historicalDataSnapshot.breakdownRealisasiMap
    : breakdownRealisasiMap;
  const activeGridMap = gridSubMode === "BD" ? activeBreakdownPlanMap : activeBreakdownRealisasiMap;`;

content = content.replace(activeGridMapSearch, activeGridMapReplace);

// 3. updateActiveGridMap
const updateActiveGridMapSearch = `  const updateActiveGridMap = (updater: (prev: typeof breakdownPlanMap) => typeof breakdownPlanMap) => {
    if (gridSubMode === "BD") {
      setBreakdownPlanMap(prev => {
        setUndoStack(u => [...u.slice(-19), JSON.parse(JSON.stringify(prev))]);
        setRedoStack([]);
        return updater(prev);
      });
    } else {
      setBreakdownRealisasiMap(prev => {
        setUndoStack(u => [...u.slice(-19), JSON.parse(JSON.stringify(prev))]);
        setRedoStack([]);
        return updater(prev);
      });
    }
  };`;

const updateActiveGridMapReplace = `  const updateActiveGridMap = (updater: (prev: typeof breakdownPlanMap) => typeof breakdownPlanMap) => {
    if (isViewingHistoricalMonth) {
      setHistoricalDataSnapshot((prevSnap: any) => {
        if (!prevSnap) return prevSnap;
        const currentMap = gridSubMode === "BD" ? (prevSnap.breakdownPlanMap || {}) : (prevSnap.breakdownRealisasiMap || {});
        const updatedMap = typeof updater === "function" ? updater(currentMap) : updater;
        return {
          ...prevSnap,
          [gridSubMode === "BD" ? "breakdownPlanMap" : "breakdownRealisasiMap"]: updatedMap
        };
      });
    } else {
      if (gridSubMode === "BD") {
        setBreakdownPlanMap(prev => {
          setUndoStack(u => [...u.slice(-19), JSON.parse(JSON.stringify(prev))]);
          setRedoStack([]);
          return updater(prev);
        });
      } else {
        setBreakdownRealisasiMap(prev => {
          setUndoStack(u => [...u.slice(-19), JSON.parse(JSON.stringify(prev))]);
          setRedoStack([]);
          return updater(prev);
        });
      }
    }
  };`;

content = content.replace(updateActiveGridMapSearch, updateActiveGridMapReplace);

// 4. Disable undo/redo in archive mode
const undoSearch = `  const handleUndo = () => {
    if (undoStack.length === 0) {`;
const undoReplace = `  const handleUndo = () => {
    if (isViewingHistoricalMonth) {
      setBreakdownMsg("⚠️ Fitur Undo dinonaktifkan di mode Arsip.");
      setTimeout(() => setBreakdownMsg(""), 2500);
      return;
    }
    if (undoStack.length === 0) {`;
content = content.replace(undoSearch, undoReplace);

const redoSearch = `  const handleRedo = () => {
    if (redoStack.length === 0) {`;
const redoReplace = `  const handleRedo = () => {
    if (isViewingHistoricalMonth) {
      setBreakdownMsg("⚠️ Fitur Redo dinonaktifkan di mode Arsip.");
      setTimeout(() => setBreakdownMsg(""), 2500);
      return;
    }
    if (redoStack.length === 0) {`;
content = content.replace(redoSearch, redoReplace);

// 5. activeGridMap instead of breakdownPlanMap/breakdownRealisasiMap in BreakdownGridRow and ManagerLadyTab
// ManagerView renders <BreakdownGridRow ... />
// wait, ManagerView passes activeGridMap:
// breakdownMap={activeGridMap}

fs.writeFileSync('src/components/ManagerView.tsx', content);
console.log("Archive leak fixed");
