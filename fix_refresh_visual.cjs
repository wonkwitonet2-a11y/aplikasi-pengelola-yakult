const fs = require('fs');

function updateManagerView() {
    let content = fs.readFileSync('src/components/ManagerView.tsx', 'utf8');
    
    // Add isRefreshing prop
    if (!content.includes('isRefreshing: boolean;')) {
        content = content.replace('onRefresh: () => Promise<void>;', 'onRefresh: () => Promise<void>;\n  isRefreshing?: boolean;');
    }
    if (!content.includes('isRefreshing,')) {
        content = content.replace('onRefresh,\n  motivasiConfig', 'onRefresh,\n  isRefreshing,\n  motivasiConfig');
    }
    
    // Make icon spin
    if (content.includes('<RefreshCw className="w-5 h-5 text-white" />')) {
        content = content.replace('<RefreshCw className="w-5 h-5 text-white" />', '<RefreshCw className={`w-5 h-5 text-white ${isRefreshing ? "animate-spin" : ""}`} />');
    }
    
    fs.writeFileSync('src/components/ManagerView.tsx', content);
}

function updateYLView() {
    let content = fs.readFileSync('src/components/YLView.tsx', 'utf8');
    
    if (!content.includes('isRefreshing?: boolean;')) {
        content = content.replace('onRefresh?: () => Promise<void>;', 'onRefresh?: () => Promise<void>;\n  isRefreshing?: boolean;');
    }
    if (!content.includes('isRefreshing,')) {
        content = content.replace('onRefresh,\n  transactions', 'onRefresh,\n  isRefreshing,\n  transactions');
    }
    
    if (content.includes('<RefreshCw className="w-5 h-5 sm:w-6 sm:h-6 text-white" />')) {
        content = content.replace('<RefreshCw className="w-5 h-5 sm:w-6 sm:h-6 text-white" />', '<RefreshCw className={`w-5 h-5 sm:w-6 sm:h-6 text-white ${isRefreshing ? "animate-spin" : ""}`} />');
    }
    
    fs.writeFileSync('src/components/YLView.tsx', content);
}

function updateApp() {
    let content = fs.readFileSync('src/App.tsx', 'utf8');
    
    if (!content.includes('isRefreshing={loading}')) {
        content = content.replace('onRefresh={refreshAllData}', 'onRefresh={refreshAllData}\n          isRefreshing={loading}');
    }
    fs.writeFileSync('src/App.tsx', content);
}

updateManagerView();
updateYLView();
updateApp();
