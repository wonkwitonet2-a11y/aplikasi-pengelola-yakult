const fs = require('fs');
let manager = fs.readFileSync('src/components/ManagerView.tsx', 'utf8');
if (manager.includes('<RefreshCw')) {
    console.log("ManagerView has RefreshCw");
}
let yl = fs.readFileSync('src/components/YLView.tsx', 'utf8');
if (yl.includes('<RefreshCw')) {
    console.log("YLView has RefreshCw");
}
