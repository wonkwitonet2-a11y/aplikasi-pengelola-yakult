import re

with open("src/components/YLView.tsx", "r") as f:
    content = f.read()

old = "    const existingTransaction = transactions.find(t => t.tanggal === selectedDate);"
new = """    const existingTransaction = transactions.find(t => t.tanggal === selectedDate);
    if (!existingTransaction) {
      alert("⚠️ Data tidak ada untuk tanggal ini. Tidak bisa disimpan.");
      return;
    }"""

if old in content:
    # only replace the first occurrence after handleSaveReport
    idx = content.find("const handleSaveReport = async () => {")
    if idx != -1:
        part1 = content[:idx]
        part2 = content[idx:]
        part2 = part2.replace(old, new, 1)
        content = part1 + part2
        print("Restored safety check")

with open("src/components/YLView.tsx", "w") as f:
    f.write(content)

