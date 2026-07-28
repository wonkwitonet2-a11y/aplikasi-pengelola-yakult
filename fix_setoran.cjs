const fs = require('fs');
let content = fs.readFileSync('src/components/YLView.tsx', 'utf8');

content = content.replace("2. Input Balik Botol / Barang Kembali (BB) - Memotong Setoran", 
"2. Input Balik Botol / Barang Kembali (BB)");

content = content.replace("BB adalah <span className=\"text-rose-600 font-black\">Barang Kembali saja</span> (produk tidak terjual, bukan botol return/kosong). Masukkan jumlah botol di bawah, nilai rupiah BB akan secara otomatis memotong jumlah setoran di atas.", 
"BB adalah <span className=\"text-rose-600 font-black\">Barang Kembali saja</span> (produk tidak terjual, bukan botol return/kosong). Masukkan jumlah botol di bawah.");

const regex = /\{\/\* Formula Deduction Box \*\/\}[\s\S]*?<\/div>\n\s*\)\;\n\s*\}\)\(\)\}/;
content = content.replace(regex, '');

fs.writeFileSync('src/components/YLView.tsx', content);
