const fs = require('fs');
let code = fs.readFileSync('src/components/YLView.tsx', 'utf8');

code = code.replace(
  /const reader = new FileReader\(\);\n\s*reader\.onload = async \(\) => \{\n\s*const base64 = reader\.result as string;\n\s*setYlFoto\(base64\);\n\s*try \{\n\s*localStorage\.setItem\(`yl_foto_\$\{ylName\}`\, base64\);\n\s*\} catch \(e\) \{\}\n\n\s*try \{\n\s*await fetch\("\/api\/saveYlFoto"\, \{\n\s*method: "POST",\n\s*headers: \{ "Content-Type": "application\/json" \},\n\s*body: JSON\.stringify\(\{ nama: ylName, foto: base64 \}\)\n\s*\}\);\n\s*\} catch \(err\) \{\n\s*console\.error\("Gagal simpan foto YL ke server:", err\);\n\s*\}\n\s*\};\n\s*reader\.readAsDataURL\(file\);/m,
  `const reader = new FileReader();
    reader.onload = async () => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 500;
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        const base64 = canvas.toDataURL('image/jpeg', 0.7);
        setYlFoto(base64);
        try {
          localStorage.setItem(\`yl_foto_\${ylName}\`, base64);
        } catch (e) {}

        try {
          await fetch("/api/saveYlFoto", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nama: ylName, foto: base64 })
          });
        } catch (err) {
          console.error("Gagal simpan foto YL ke server:", err);
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);`
);

fs.writeFileSync('src/components/YLView.tsx', code);
