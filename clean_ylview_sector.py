import re

with open("src/components/YLView.tsx", "r") as f:
    content = f.read()

# find where getSectorTotal starts
idx = content.find("const getSectorTotal")
if idx != -1:
    end_idx = content.find("};", idx)
    if end_idx != -1:
        content = content[:idx] + content[end_idx+2:]

with open("src/components/YLView.tsx", "w") as f:
    f.write(content)

