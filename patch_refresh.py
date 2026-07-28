with open("src/components/ManagerView.tsx", "r") as f:
    content = f.read()

import re

new_text = """      if (res && res.ok) {
        alert(res.message);
        setResetModal(null);
        if (onRefresh) onRefresh();
      } else {"""

content = re.sub(r'      if \(res && res\.ok\) \{\n        alert\(res\.message\);\n        setResetModal\(null\);\n              \} else \{', new_text, content)

with open("src/components/ManagerView.tsx", "w") as f:
    f.write(content)
