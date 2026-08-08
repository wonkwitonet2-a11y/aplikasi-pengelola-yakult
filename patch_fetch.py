import re
import os

for file in ["src/components/ManagerSeragamView.tsx", "src/components/YLSeragamView.tsx"]:
    with open(file, "r") as f:
        content = f.read()
    
    content = content.replace('import { fetchApi } from "../utils/api";', '')
    content = content.replace('fetchApi("/api/getSeragam")', 'fetch("/api/getSeragam").then(r => r.json())')
    content = content.replace('fetchApi("/api/saveSeragam", "POST",', 'fetch("/api/saveSeragam", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(')
    
    # We need to close the fetch call
    content = re.sub(r'fetch\("/api/saveSeragam", \{ method: "POST", headers: \{ "Content-Type": "application/json" \}, body: JSON.stringify\((.*?)\) \}\)', r'fetch("/api/saveSeragam", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(\1) })', content)
    # Wait, the regex might not capture it well. Let's do it manually.
    
    with open(file, "w") as f:
        f.write(content)
