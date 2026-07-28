import re

with open("server.ts", "r") as f:
    content = f.read()

# Fix buffer
content = content.replace('// Send file\n    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");\n    res.send(buffer);', '// Send file\n    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });\n    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");\n    res.send(buffer);')

# Fix models
content = content.replace('const modelsToTry = ["gemini-1.5-flash-002", "gemini-1.5-pro-002", "gemini-1.0-pro", "gemini-1.5-flash-latest"];', 'const modelsToTry = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"];')

with open("server.ts", "w") as f:
    f.write(content)
