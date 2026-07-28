import re

with open("src/components/LhppRealisasiView.tsx", "r") as f:
    content = f.read()

# Fix the duplicate classname ones
content = re.sub(r'onFocus=\{e => e\.target\.select\(\)\} className="w-full h-full bg-transparent outline-none text-center"\n\s*className="', r'onFocus={e => e.target.select()}\n                      className="', content)

# Now for the ones that don't have className, add it
def replace_func(match):
    return match.group(0) + '\n                        className="w-full h-full bg-transparent outline-none text-center"'

# Find onFocus={e => e.target.select()} that is NOT followed by className=
content = re.sub(r'onFocus=\{e => e\.target\.select\(\)\}(?!\s*className)', replace_func, content)

with open("src/components/LhppRealisasiView.tsx", "w") as f:
    f.write(content)
