const fs = require('fs');
let content = fs.readFileSync('src/components/YLView.tsx', 'utf8');

const newButton = `
          <button
            onClick={() => setActiveTab("potensi_tembus")}
            className={\`py-2 text-[8px] leading-tight font-black rounded-xl transition-all \${activeTab === "potensi_tembus" ? "bg-red-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"}\`}
          >
            POTENSI VS TEMBUS
          </button>
        </div>`;

content = content.replace(/<\/button>\n\s*<\/div>\n\n\s*\{\/\* INPUT DATA TAB \*\/\}/, newButton + '\n\n        {/* INPUT DATA TAB */}');
fs.writeFileSync('src/components/YLView.tsx', content);
