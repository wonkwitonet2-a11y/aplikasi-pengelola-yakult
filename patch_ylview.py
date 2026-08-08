import re

with open('src/components/YLView.tsx', 'r') as f:
    content = f.read()

# Pattern to remove System Maintenance Card
pattern = r'\s*\{\/\*\s*System Maintenance Card\s*\*\/\}.*?🧹 Bersihkan Cache\s*<\/button>\s*<\/div>\s*<\/div>'

content = re.sub(pattern, '', content, flags=re.DOTALL)

with open('src/components/YLView.tsx', 'w') as f:
    f.write(content)

print("Patched successfully")
