with open("server.ts", "r") as f:
    content = f.read()

import re

new_content = content.replace("db.breakdownRealisasi = {};", "db.breakdownRealisasi = {};\n    db.breakdownPlan = {};")
new_content = new_content.replace("if (db.breakdownRealisasi) delete db.breakdownRealisasi[currentMonth];", "if (db.breakdownRealisasi) delete db.breakdownRealisasi[currentMonth];\n    if (db.breakdownPlan) delete db.breakdownPlan[currentMonth];")

with open("server.ts", "w") as f:
    f.write(new_content)
