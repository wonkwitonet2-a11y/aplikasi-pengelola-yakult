with open("server.ts", "r") as f:
  code = f.read()

import re
code = re.sub(r'app\.post\("/api/resetData", async \(req, res\) => \{.*?\n\}\);',
'''app.post("/api/resetData", async (req, res) => {
  res.status(403).json({ error: "Fitur reset global dinonaktifkan demi keamanan data." });
});''', code, flags=re.DOTALL)

with open("server.ts", "w") as f:
  f.write(code)
