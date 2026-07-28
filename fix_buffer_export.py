import re

with open("server.ts", "r") as f:
    content = f.read()

content = content.replace('// Send file\n  } catch (error: any) {', '// Send file\n    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });\n    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");\n    res.send(buffer);\n  } catch (error: any) {')

with open("server.ts", "w") as f:
    f.write(content)
