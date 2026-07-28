with open("server.ts", "r") as f:
    content = f.read()

import re

# Remove INITIAL_REALISASI_SEEDS completely
content = re.sub(r'// INITIAL REALISASI SEEDS\nconst INITIAL_REALISASI_SEEDS:.*?};\n', '', content, flags=re.DOTALL)

with open("server.ts", "w") as f:
    f.write(content)
