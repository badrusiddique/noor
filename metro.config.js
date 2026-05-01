const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Allow Metro to bundle `assets/db/quran.db` (and friends) as a binary
// asset rather than try to parse them as source.
config.resolver.assetExts.push('db', 'sqlite', 'sqlite3');

// Web bundling is supported for theme + design-system iteration. Mushaf
// rendering itself stays mobile-only — see `src/data/db/client.web.ts`
// and `app/reader/[page].web.tsx` which short-circuit the native-only
// modules. Adding `web` to the platforms list lets Metro pick those
// `.web.ts(x)` files via the standard platform-extension resolver.
config.resolver.platforms = Array.from(new Set([...(config.resolver.platforms ?? []), 'web']));

module.exports = config;
