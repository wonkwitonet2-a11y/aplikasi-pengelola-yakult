import os, re

for root, dirs, files in os.walk('.'):
    if 'node_modules' in root or '.git' in root or 'dist' in root:
        continue
    for fname in files:
        if fname.endswith(('.py', '.cjs', '.js', '.txt', '.tsx', '.json', '.patch')):
            path = os.path.join(root, fname)
            try:
                with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                matches = re.findall(r'activeTab === ["\'][a-z_0-9]+["\']', content)
                if matches:
                    print(path, set(matches))
            except Exception as e:
                pass
