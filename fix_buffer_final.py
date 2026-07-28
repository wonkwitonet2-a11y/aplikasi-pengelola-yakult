import re

with open("server.ts", "r") as f:
    content = f.read()

content = content.replace('// Send file\n    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");\n    res.send(buffer);', '// Send file\n    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });\n    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");\n    res.send(buffer);')

with open("server.ts", "w") as f:
    f.write(content)
