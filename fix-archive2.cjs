const fs = require('fs');
let code = fs.readFileSync('src/components/archive/ArchiveEditor.tsx', 'utf8');

// Replace the useSimpleGrid call with dummy React states
const dummyStates = `
  const [gridSelection, setGridSelection] = useState(null);
  const [isGridDragging, setIsGridDragging] = useState(false);
  const [isFillDragging, setIsFillDragging] = useState(false);
  const [fillHoverCell, setFillHoverCell] = useState(null);
  const touchStartRef = useRef(null);
  const handleTouchMoveGrid = () => {};
  const handlePasteIntoGrid = () => {};
`;

code = code.replace(/const \{\s*selection[\s\S]*?\}\s*=\s*useSimpleGrid\(\{[\s\S]*?\}\);/m, dummyStates);
code = code.replace(/import \{ useSimpleGrid \} from "\.\.\/useSimpleGrid";/, "");

fs.writeFileSync('src/components/archive/ArchiveEditor.tsx', code);
