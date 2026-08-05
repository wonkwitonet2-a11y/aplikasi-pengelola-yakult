import re

with open('src/components/LhppRealisasiView.tsx', 'r') as f:
    content = f.read()

# I will find the map and extract it, but it might be complex.
# Instead, maybe I can just wrap the `<tr>` block in a component that I define inside the file.
