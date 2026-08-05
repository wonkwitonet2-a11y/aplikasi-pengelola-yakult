import re

with open('src/components/LhppRealisasiView.tsx', 'r') as f:
    content = f.read()

# Let's extract the tr part into a new Component
