with open("server.ts", "r") as f:
    content = f.read()

import re

# Remove the old resetDataManual
content = re.sub(r'// Reset Data Manual\napp\.post\("/api/resetDataManual", \(req, res\) => \{.*?\n\}\);\n', '', content, flags=re.DOTALL)

with open("server.ts", "w") as f:
    f.write(content)
