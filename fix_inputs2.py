import re

with open("src/components/LhppRealisasiView.tsx", "r") as f:
    content = f.read()

# Let's just find all onFocus={e => e.target.select()} that is missing className
# and we know exactly which lines need them by looking at the output above.

def replace(match):
    # if it already has a className on the next line, leave it alone
    return match.group(0)

# Replace <input ... />
pattern = re.compile(r'(<input\s+type="number"\s+min=\{0\}\s+value=\{[^}]+\}\s+onChange=\{[^}]+\}\s+onFocus=\{e => e\.target\.select\(\)\})([^>]*\n\s*className="[^"]*")?', re.DOTALL)

def replacer(m):
    if m.group(2):
        return m.group(0)
    else:
        return m.group(1) + '\n                        className="w-full h-full bg-transparent outline-none text-center font-black"'

content = pattern.sub(replacer, content)

with open("src/components/LhppRealisasiView.tsx", "w") as f:
    f.write(content)

