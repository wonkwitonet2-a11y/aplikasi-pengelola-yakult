import re

with open("src/components/YLView.tsx", "r") as f:
    content = f.read()

old_check = """    const existingTransaction = transactions.find(t => t.tanggal === selectedDate);
    if (!existingTransaction) {
      alert("⚠️ Data tidak ada untuk tanggal ini. Tidak bisa disimpan.");
      return;
    }"""

if old_check in content:
    content = content.replace(old_check, "    const existingTransaction = transactions.find(t => t.tanggal === selectedDate);")
    print("Removed existingTransaction block")
else:
    print("Block not found")

with open("src/components/YLView.tsx", "w") as f:
    f.write(content)

