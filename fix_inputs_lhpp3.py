import re

with open('src/components/LhppRealisasiView.tsx', 'r') as f:
    content = f.read()

pattern3 = re.compile(r'onChange=\{e => setSummary\(s => \(\{ \.\.\.s, pdmYlm: \{ \.\.\.s\.pdmYlm, ([a-z]+): parseInputInt\(e\.target\.value\) \} \}\)\)\}')
content = pattern3.sub(r'onChange={(val) => setSummary(s => ({ ...s, pdmYlm: { ...s.pdmYlm, \1: val } }))}', content)

with open('src/components/LhppRealisasiView.tsx', 'w') as f:
    f.write(content)
