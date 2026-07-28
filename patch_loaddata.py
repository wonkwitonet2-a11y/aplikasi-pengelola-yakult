with open("server.ts", "r") as f:
    content = f.read()

import re

# Remove the blocks that auto-seed 2026-07
content = re.sub(r'  if \(!db\.breakdownPlan\["2026-07"\]\) \{.*?fs\.writeFileSync\(DATA_FILE, JSON\.stringify\(db, null, 2\)\);\n  \}\n', '', content, flags=re.DOTALL)
content = re.sub(r'  if \(!db\.breakdownRealisasi\["2026-07"\]\) \{.*?fs\.writeFileSync\(DATA_FILE, JSON\.stringify\(db, null, 2\)\);\n  \}\n', '', content, flags=re.DOTALL)

with open("server.ts", "w") as f:
    f.write(content)
