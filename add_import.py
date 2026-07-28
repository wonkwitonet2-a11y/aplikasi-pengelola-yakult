import re

with open("src/components/YLView.tsx", "r") as f:
    content = f.read()

import_statement = """import { useSimpleGrid } from "./useSimpleGrid";
import { GridSelectionToolbar } from "./GridSelectionToolbar";
"""

content = content.replace('import { NumberInput } from "./NumberInput";', 'import { NumberInput } from "./NumberInput";\n' + import_statement)

with open("src/components/YLView.tsx", "w") as f:
    f.write(content)
