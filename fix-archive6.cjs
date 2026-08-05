const fs = require('fs');
let code = fs.readFileSync('src/components/archive/ArchiveEditor.tsx', 'utf8');

code = code.replace(/\(window\)\.__ARCHIVE_MOCK_HANDLER__/g, "(window as any).__ARCHIVE_MOCK_HANDLER__");

fs.writeFileSync('src/components/archive/ArchiveEditor.tsx', code);
