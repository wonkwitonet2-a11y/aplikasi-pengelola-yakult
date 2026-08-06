const fs = require('fs');
let content = fs.readFileSync('src/components/ManagerView.tsx', 'utf8');

const activeEvalSearch = `  const activeEval = localEval || evaluasiData;`;
const activeEvalReplace = `  const activeEval = localEval || evaluasiData;

  const activeEvaluasiData = (isViewingHistoricalMonth && historicalDataSnapshot?.evaluasiData)
    ? historicalDataSnapshot.evaluasiData
    : (isViewingHistoricalMonth && historicalDataNotFound)
      ? null
      : activeEval;`;

if(content.includes(activeEvalSearch)) {
    content = content.replace(activeEvalSearch, activeEvalReplace);
}

const activeEvaluasiDataSearch = `  const activeEvaluasiData = (isViewingHistoricalMonth && historicalDataSnapshot?.evaluasiData)
    ? historicalDataSnapshot.evaluasiData
    : (isViewingHistoricalMonth && historicalDataNotFound)
      ? null
      : activeEval;`;

// Remove the old definition
const idx = content.lastIndexOf(activeEvaluasiDataSearch);
if (idx !== -1) {
    content = content.substring(0, idx) + content.substring(idx + activeEvaluasiDataSearch.length);
}

// Replace activeEval with activeEvaluasiData in the whole file, except where it's being defined or used as a fallback.
content = content.replace(/activeEval/g, 'activeEvaluasiData');
// Now fix the definitions:
content = content.replace(/const activeEvaluasiData = localEval \|\| evaluasiData;/g, 'const activeEval = localEval || evaluasiData;');
content = content.replace(/: activeEvaluasiData;/g, ': activeEval;');

fs.writeFileSync('src/components/ManagerView.tsx', content);
