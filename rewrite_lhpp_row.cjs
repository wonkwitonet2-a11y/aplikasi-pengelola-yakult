const fs = require('fs');

let content = fs.readFileSync('src/components/LhppRealisasiView.tsx', 'utf8');

// We will extract the inner row to a Memoized component.
// This is a complex refactor for a single file, it might be easier to just use `view_file` and `multi_edit_file` to do it manually.
