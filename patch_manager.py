import re

with open("src/components/ManagerView.tsx", "r") as f:
    content = f.read()

# 1. import
if "import ManagerSeragamView" not in content:
    content = content.replace(
        'import PlgPjlView from "./PlgPjlView";',
        'import PlgPjlView from "./PlgPjlView";\nimport ManagerSeragamView from "./ManagerSeragamView";'
    )

# 2. Render component
content = content.replace(
    '          {activeTab === "setting" && (',
    '          {activeTab === "seragam" && <ManagerSeragamView />}\n          {activeTab === "setting" && ('
)

with open("src/components/ManagerView.tsx", "w") as f:
    f.write(content)
