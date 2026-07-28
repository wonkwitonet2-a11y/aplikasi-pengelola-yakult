import re

with open("src/components/YLView.tsx", "r") as f:
    content = f.read()

pattern = re.compile(r'            </div>\n</div>\n</div>')

if pattern.search(content):
    content = pattern.sub('            </div>\n</div>', content)
    print("Replaced!")
else:
    print("Not found")

with open("src/components/YLView.tsx", "w") as f:
    f.write(content)
