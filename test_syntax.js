const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['src/main.tsx'],
  bundle: true,
  outfile: 'dist/out.js',
  external: ['react', 'react-dom']
}).catch(() => process.exit(1));
