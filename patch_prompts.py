import re

with open('server.ts', 'r') as f:
    content = f.read()

# Pattern 1 for evaluate
pattern1 = r'(Anda adalah konsultan bisnis senior khusus manajemen sales Yakult Lady \(YL\) Unit DP Jember 1\.)'
replacement1 = r'\1\n\nPENTING UNTUK DIPAHAMI TERKAIT METRIK:\n- "BB" atau "Balik Botol" adalah sisa botol/produk yang tidak terjual di lapangan dan harus dikembalikan (retur).\n- Semakin TINGGI nilai BB, artinya semakin BURUK/NEGATIF kinerjanya (karena botol tidak laku).\n- Nilai BB yang KECIL atau 0 adalah indikator KINERJA SANGAT BAGUS/POSITIF.\n- Tolong pastikan analisis Anda menyoroti BB yang tinggi sebagai masalah (kerugian) dan BB yang rendah sebagai prestasi.\n'

content = re.sub(pattern1, replacement1, content)

# Pattern 2 for evaluate-yl
pattern2 = r'(4\. Format dalam HTML bersih \(<p>, <b>, <ul>, <li>\) dengan emoji yang hangat\.)'
replacement2 = r'\1\n5. PENGERTIAN BB (Balik Botol): BB adalah botol sisa yang tidak laku terjual. Nilai BB yang BESAR itu SANGAT JELEK/MERUGIKAN (berikan saran lembut untuk menghabiskan stok), sedangkan BB yang KECIL atau NOL itu SANGAT BAGUS (berikan pujian). JANGAN PERNAH memuji jika BB-nya tinggi!'

content = re.sub(pattern2, replacement2, content)

with open('server.ts', 'w') as f:
    f.write(content)

print("Prompts patched successfully!")
