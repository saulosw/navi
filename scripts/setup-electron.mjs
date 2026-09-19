import { createRequire } from 'node:module';
import { URL } from 'node:url';

// electron-vite needs path.txt before it starts; Electron downloads lazily on require.
const require = createRequire(new URL('../apps/desktop/package.json', import.meta.url));
require('electron');
