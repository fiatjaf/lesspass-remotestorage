
Links
-----

  * The [Firefox extension](https://addons.mozilla.org/firefox/addon/lesspass-remotestorage/)
  * The [Chrome extension](https://chrome.google.com/webstore/detail/lesspass-remotestorage/aogdpopejodechblppdkpiimchbmdcmc)
  * The [site](https://lesspass.alhur.es/) (you can see it working without installing a thing)


How to build
------------

  1. `npm install`
  2. `npm run build`
  3. Load the extension from the root folder.

All `.js` files in the root folder are sources and will be bundled/browserified on the build process. After the build, browserified files for `background.js`, `content-script.js` and `options.js` will be on `dist/`. Their paths at wherever they're needed in the extension context are already pointing to that directory.
