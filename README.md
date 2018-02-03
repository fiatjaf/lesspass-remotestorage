How to build
------------

  1. `npm install`
  2. `npm run build`
  3. Load the extension from the root folder.

All `.js` files in the root folder are sources and will be bundled/browserified on the build process. After the build, browserified files for `background.js`, `content-script.js` and `options.js` will be on `dist/`. Their paths at wherever they're needed in the extension context are already pointing to that directory.
