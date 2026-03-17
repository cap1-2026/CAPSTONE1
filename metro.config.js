const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Block the paymongo-project directory inside app/.
// It's a standalone Node.js test script that accidentally ended up inside
// the app/ folder. Without this block, Expo Router picks up
// app/paymongo-project/node_modules/server.js as a route, executes it
// during SSR (triggering live PayMongo API calls), and crashes the renderer
// in a continuous re-bundle loop.
config.resolver.blockList = [
  /.*[/\\]app[/\\]paymongo-project[/\\].*/,
];

module.exports = config;
