const fs = require('fs');
let content = fs.readFileSync('src/components/YLView.tsx', 'utf8');

// The replacement replaced 3 </div> with 1 </div>. Let's add them back.
content = content.replace(/<\/div>\n\s*\{\/\* Kunjungan, PB & Sampah \*\/\}/, '</div>\n</div>\n</div>\n\n            {/* Kunjungan, PB & Sampah */}');

// Let's check the bottom of the input tab. We removed Lembaga & Tembus, but maybe we missed a closing div for activeTab?
// The input tab has `<div className="space-y-4">`.
content = content.replace(/<\/button>\n\s*<\/div>\n\s*<\/div>\n\s*\)\}\n\s*\{\/\* RINGKASAN TAB \*\/\}/, '</button>\n            </div>\n          </div>\n        )}\n\n        {/* RINGKASAN TAB */}');

// I also see an error around 1699: "Unexpected closing main tag does not match opening div tag"
// Let's print out lines 1690 to 1705.
fs.writeFileSync('src/components/YLView.tsx', content);
