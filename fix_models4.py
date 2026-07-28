import re

with open("server.ts", "r") as f:
    content = f.read()

content = content.replace('const modelsToTry = ["gemini-2.0-flash", "gemini-1.5-pro", "gemini-1.5-flash-8b"];', 'const modelsToTry = ["gemini-1.5-flash-002", "gemini-1.5-pro-002", "gemini-1.0-pro", "gemini-1.5-flash-latest"];')

with open("server.ts", "w") as f:
    f.write(content)
