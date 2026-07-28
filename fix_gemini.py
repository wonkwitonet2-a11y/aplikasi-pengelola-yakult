import re

with open("server.ts", "r") as f:
    content = f.read()

old_isTransient = 'const isTransient = status === "UNAVAILABLE" || msg.includes("503") || msg.includes("high demand") || msg.includes("UNAVAILABLE");'
new_isTransient = 'const isTransient = status === "UNAVAILABLE" || status === "RESOURCE_EXHAUSTED" || msg.includes("503") || msg.includes("high demand") || msg.includes("UNAVAILABLE") || msg.includes("429");'

if old_isTransient in content:
    content = content.replace(old_isTransient, new_isTransient)
    print("Replaced isTransient")
else:
    print("Not found isTransient")
    
old_delay = 'await sleep(1500);'
new_delay = 'await sleep(status === "RESOURCE_EXHAUSTED" || msg.includes("429") ? 6000 : 1500);'

if old_delay in content:
    content = content.replace(old_delay, new_delay)
    print("Replaced delay")
else:
    print("Not found delay")

with open("server.ts", "w") as f:
    f.write(content)
