import re

with open('src/components/YLView.tsx', 'r') as f:
    content = f.read()

replacements = {
    '"Yakult Lady Pemula"': '"🌱 Kuncup"',
    '"Yakult Lady Pratama"': '"🌿 Tuwuh"',
    '"Yakult Lady Madya"': '"🌸 Mekar"',
    '"Yakult Lady Utama"': '"🌳 Mantep"',
    '"Yakult Lady Senior"': '"🐓 Wes Jago"',
    '"Yakult Lady Veteran"': '"🏅 Panutan"',
    '"Yakult Lady Master"': '"👑 Sesepuh"',
    '"Yakult Lady Legend"': '"⚔️ Pusaka"'
}

for old, new in replacements.items():
    content = content.replace(old, new)

with open('src/components/YLView.tsx', 'w') as f:
    f.write(content)

print("Titles updated!")
