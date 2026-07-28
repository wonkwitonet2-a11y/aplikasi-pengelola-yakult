import re

with open("server.ts", "r") as f:
    content = f.read()

content = content.replace('const modelsToTry = ["gemini-2.0-flash"];', 'const modelsToTry = ["gemini-2.0-flash", "gemini-1.5-pro", "gemini-1.5-flash-8b"];')

content = content.replace('await sleep(status === "RESOURCE_EXHAUSTED" || msg.includes("429") ? 6000 : 1500);', 'await sleep(status === "RESOURCE_EXHAUSTED" || msg.includes("429") ? 17000 : 1500);')

with open("server.ts", "w") as f:
    f.write(content)
