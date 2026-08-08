import re

with open("server.ts", "r") as f:
    content = f.read()

endpoints = """
app.get("/api/getSeragam", async (req, res) => {
  res.json(cachedDb.seragam || { images: {}, schedules: {} });
});

app.post("/api/saveSeragam", async (req, res) => {
  if (!cachedDb.seragam) cachedDb.seragam = { images: {}, schedules: {} };
  
  if (req.body.images) {
    cachedDb.seragam.images = { ...cachedDb.seragam.images, ...req.body.images };
  }
  
  if (req.body.schedules) {
    cachedDb.seragam.schedules = req.body.schedules;
  }
  
  debouncedWriteDb();
  res.json({ success: true, seragam: cachedDb.seragam });
});
"""

if "/api/getSeragam" not in content:
    content = content.replace('app.get("/api/getKontes",', endpoints + '\napp.get("/api/getKontes",')
    with open("server.ts", "w") as f:
        f.write(content)
