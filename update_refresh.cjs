const fs = require('fs');

function updateManagerView() {
    let content = fs.readFileSync('src/components/ManagerView.tsx', 'utf8');
    
    // Add RefreshCw to lucide imports
    if (!content.includes('RefreshCw,')) {
        content = content.replace('Calendar\n} from "lucide-react";', 'Calendar,\n  RefreshCw\n} from "lucide-react";');
    }

    // Add button
    const search = `<button\n              onClick={() => setIsNavMenuOpen(true)}`;
    const replace = `<button
              onClick={() => onRefresh && onRefresh()}
              className="flex items-center justify-center p-2 bg-black/20 hover:bg-black/40 text-white rounded-xl border border-white/10 transition-all cursor-pointer backdrop-blur-sm shadow-sm"
              title="Refresh Data"
            >
              <RefreshCw className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={() => setIsNavMenuOpen(true)}`;
    
    if (content.includes(search) && !content.includes('title="Refresh Data"')) {
        content = content.replace(search, replace);
    }
    fs.writeFileSync('src/components/ManagerView.tsx', content);
}

function updateYLView() {
    let content = fs.readFileSync('src/components/YLView.tsx', 'utf8');
    
    if (!content.includes('RefreshCw')) {
        content = content.replace('Camera\n} from "lucide-react";', 'Camera,\n  RefreshCw\n} from "lucide-react";');
    }

    const search = `<button\n              onClick={onLogout}`;
    const replace = `<button
              onClick={() => onRefresh && onRefresh()}
              className="flex items-center justify-center p-2 bg-black/20 hover:bg-black/40 text-white rounded-xl border border-red-500/40 transition-all cursor-pointer shadow-sm active:scale-95"
              title="Refresh Data"
            >
              <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </button>
            <button
              onClick={onLogout}`;
              
    if (content.includes(search) && !content.includes('title="Refresh Data"')) {
        content = content.replace(search, replace);
    }
    fs.writeFileSync('src/components/YLView.tsx', content);
}

updateManagerView();
updateYLView();
