const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const search = `    setDashboardData(null);
    setEvaluasiData(null);`;

const replace = `    setDashboardData(getFallbackDashboardData());
    setEvaluasiData(getFallbackEvaluasiData());`;

if (content.includes(search)) {
    content = content.replace(search, replace);
    fs.writeFileSync('src/App.tsx', content);
    console.log("Fixed App.tsx handleLogout");
} else {
    console.log("Could not find the search string in App.tsx");
}
