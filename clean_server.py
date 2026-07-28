import re

with open("server.ts", "r") as f:
    content = f.read()

# _req in express routes
content = re.sub(r'\(req: Request', r'(_req: Request', content)
content = re.sub(r'\(req, res\)', r'(_req, res)', content)

content = re.sub(r'const { action, payload, method } = req.body;\n?', '', content)

content = re.sub(r'const realTotalYo = [^;]+;\n?', '', content)
content = re.sub(r'const realTotalOm = [^;]+;\n?', '', content)
content = re.sub(r'const realTotalOs = [^;]+;\n?', '', content)
content = re.sub(r'const realTotalYt = [^;]+;\n?', '', content)

content = re.sub(r'const pm = [^;]+;\n?', '', content)

with open("server.ts", "w") as f:
    f.write(content)

with open("src/components/YLView.tsx", "r") as f:
    content = f.read()

content = re.sub(r'const bbYo = [^;]+;\n?', '', content)
content = re.sub(r'const bbOm = [^;]+;\n?', '', content)
content = re.sub(r'const bbOs = [^;]+;\n?', '', content)
content = re.sub(r'const bbYt = [^;]+;\n?', '', content)
content = re.sub(r'const fPlg = [^;]+;\n?', '', content)
content = re.sub(r'const fRk = [^;]+;\n?', '', content)
content = re.sub(r'const fRa = [^;]+;\n?', '', content)
content = re.sub(r'const fRb = [^;]+;\n?', '', content)
content = re.sub(r'const pbP = [^;]+;\n?', '', content)
content = re.sub(r'const pbS = [^;]+;\n?', '', content)
content = re.sub(r'const apkPlg = [^;]+;\n?', '', content)
content = re.sub(r'const apkBotol = [^;]+;\n?', '', content)
content = re.sub(r'const \[isBreakdownLoading, setIsBreakdownLoading\] = useState[^;]+;\n?', '', content)
content = re.sub(r'const getSectorTotal = [^;]+(?:;\n|\}\n)', '', content) # might be tricky, let's use a simpler regex or manual removal

with open("src/components/YLView.tsx", "w") as f:
    f.write(content)
