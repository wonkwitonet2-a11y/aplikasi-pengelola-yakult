const fs = require('fs');
let code = fs.readFileSync('src/components/archive/ArchiveEditor.tsx', 'utf8');

// Fix loadFromSupabase return types
code = code.replace(/const res = await loadFromSupabase\("monthly_archive_list"\);\s*if \(res\.success && Array\.isArray\(res\.data\)\) \{\s*setArchiveList\(res\.data\);\s*if \(res\.data\.length > 0\) setSelectedMonth\(res\.data\[res\.data\.length - 1\]\);\s*\}/, 
`const list = await loadFromSupabase("monthly_archive_list");
     if (Array.isArray(list)) {
        setArchiveList(list);
        if (list.length > 0) setSelectedMonth(list[list.length - 1]);
     }`);

code = code.replace(/const res = await loadFromSupabase\(\`monthly_archive_\$\{selectedMonth\}\`\);\s*if \(res\.success && res\.data\) \{\s*setSnapshot\(res\.data\);\s*\}\s*else\s*\{/,
`const snapshot = await loadFromSupabase(\`monthly_archive_\$\{selectedMonth\}\`);
     if (snapshot) {
        setSnapshot(snapshot);
     } else {`);

fs.writeFileSync('src/components/archive/ArchiveEditor.tsx', code);
