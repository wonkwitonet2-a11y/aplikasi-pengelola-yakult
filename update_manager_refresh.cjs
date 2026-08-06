const fs = require('fs');

let content = fs.readFileSync('src/components/ManagerView.tsx', 'utf8');

const search = `<button
              onClick={() => setIsNavMenuOpen(!isNavMenuOpen)}`;
const replace = `<button
              onClick={() => onRefresh && onRefresh()}
              className="bg-black/20 hover:bg-black/40 text-white font-extrabold text-xs px-3 py-2 rounded-xl border border-white/20 shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 backdrop-blur-sm"
              title="Refresh Data"
            >
              <RefreshCw className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={() => setIsNavMenuOpen(!isNavMenuOpen)}`;

if (content.includes(search) && !content.includes('title="Refresh Data"')) {
    content = content.replace(search, replace);
    fs.writeFileSync('src/components/ManagerView.tsx', content);
    console.log("Updated ManagerView");
} else {
    console.log("Could not find search string in ManagerView");
}
