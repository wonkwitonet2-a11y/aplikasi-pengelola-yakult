import re
with open("src/components/ManagerView.tsx", "r") as f:
    content = f.read()

if "ManagerSeragamView" not in content:
    content = content.replace(
        'import { ManagerLadyTab } from "./ManagerLadyTab";',
        'import { ManagerLadyTab } from "./ManagerLadyTab";\nimport ManagerSeragamView from "./ManagerSeragamView";'
    )
    
    content = content.replace(
        '          {activeTab === "setting" && (',
        '          {activeTab === "seragam" && <ManagerSeragamView />}\n          {activeTab === "setting" && ('
    )
    
    with open("src/components/ManagerView.tsx", "w") as f:
        f.write(content)
