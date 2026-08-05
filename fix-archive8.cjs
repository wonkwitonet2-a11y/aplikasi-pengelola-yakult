const fs = require('fs');
let code = fs.readFileSync('src/components/archive/ArchiveEditor.tsx', 'utf8');

code = code.replace(/const currentMonthTotal = useCallback\(\(perYL, key\) => \{/, 'const currentMonthTotal = useCallback((perYL: any, key: any) => {');
code = code.replace(/return Object\.values\(perYL \|\| \{\}\)\.reduce\(\(acc, curr\) => acc \+ \(Number\(curr\?\.\[key\]\) \|\| 0\), 0\);/, 'return Object.values(perYL || {}).reduce((acc: any, curr: any) => acc + (Number(curr?.[key]) || 0), 0);');
code = code.replace(/const calculateSektorTotals = useCallback\(\(dashboard\) => \{/, 'const calculateSektorTotals = useCallback((dashboard: any) => {');
code = code.replace(/Object\.values\(dashboard\.perYL\)\.forEach\(\(yl\) => \{/, 'Object.values(dashboard.perYL).forEach((yl: any) => {');
code = code.replace(/const parseSec = \(val\) => \{/, 'const parseSec = (val: any) => {');

fs.writeFileSync('src/components/archive/ArchiveEditor.tsx', code);
