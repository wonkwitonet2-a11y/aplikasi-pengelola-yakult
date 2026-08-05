const fs = require('fs');
let code = fs.readFileSync('src/components/PlgPjlView.tsx', 'utf8');

// 1. Remove the handleKirimSpreadsheet function and the state
code = code.replace(/const \[sendingSpreadsheet, setSendingSpreadsheet\] = useState\(false\);\n[\s\S]*?const handlePrint = \(\) => \{/, 'const handlePrint = () => {');

// 2. Remove the button from JSX
code = code.replace(/<button\s+onClick=\{handleKirimSpreadsheet\}[\s\S]*?<\/button>/, '');

// 3. Update the historicalData type
code = code.replace(/onAkmPaste\?: \(e: React.ClipboardEvent, ylKey: string, startIndex: number\) => void;/,
`onAkmPaste?: (e: React.ClipboardEvent, ylKey: string, startIndex: number) => void;
    onTxFieldChange?: (ylKey: string, field: string, val: number) => void;
    onPotensiChange?: (ylKey: string, field: string, val: number) => void;`);

// 4. Override potensiTembusData if historicalData has it
code = code.replace(/const \{ dataList, transactions, potensiTembus: potensiTembusData, cleanYlName \} = useData\(\);/,
`const { dataList, transactions, potensiTembus: globalPotensiTembus, cleanYlName } = useData();
  const potensiTembusData = historicalData?.potensiTembus || globalPotensiTembus;`);

fs.writeFileSync('src/components/PlgPjlView.tsx', code);
