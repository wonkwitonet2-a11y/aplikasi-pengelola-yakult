import re

with open("server.ts", "r") as f:
    content = f.read()

content = content.replace('"gemini-2.5-flash", "gemini-1.5-flash", "gemini-2.0-flash"', '"gemini-2.0-flash"')

with open("server.ts", "w") as f:
    f.write(content)
