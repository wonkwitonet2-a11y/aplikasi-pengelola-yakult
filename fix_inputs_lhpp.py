import re

with open('src/components/LhppRealisasiView.tsx', 'r') as f:
    content = f.read()

if 'import { NumberInput }' not in content:
    content = content.replace('import { GridSelectionToolbar } from "./GridSelectionToolbar";', 'import { GridSelectionToolbar } from "./GridSelectionToolbar";\nimport { NumberInput } from "./NumberInput";')

# We can replace `<input type="number"` with `<NumberInput`
content = content.replace('<input\n                        type="number"', '<NumberInput')
content = content.replace('<input\n                      type="number"', '<NumberInput')
content = content.replace('<input type="number"', '<NumberInput')

with open('src/components/LhppRealisasiView.tsx', 'w') as f:
    f.write(content)
