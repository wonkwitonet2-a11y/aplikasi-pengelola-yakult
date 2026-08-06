const fs = require('fs');
let content = fs.readFileSync('src/components/ManagerView.tsx', 'utf8');

// replace all usages of activeEval with activeEvaluasiData, 
// EXCPET where it is defined or where activeEvaluasiData is defined.

// To be safe, let's just replace `activeEval` with `activeEvaluasiData` in the parts of the code AFTER `activeEvaluasiData` is defined.

// Wait, the hook `useMemo` for normalizedAnalisis uses `activeEval`. But `activeEvaluasiData` is defined later in the file!
// This means we must move the definition of `activeEvaluasiData` to the top, before it's used.

