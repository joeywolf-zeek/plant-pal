// App configuration. This file is loaded as a plain <script> before the app,
// so everything here lives on window.APP_CONFIG.
//
// NOTE: anything in this file is PUBLIC once deployed (anyone can view source).
// That's why the README tells you to restrict your Pl@ntNet key to your
// GitHub Pages domain — a restricted key is useless on other sites.
window.APP_CONFIG = {
  // Display name used in the header, page title, and calendar events.
  // (Also change it in manifest.webmanifest and index.html <title> if you rename.)
  appName: "Plant Pal",

  // Get a free key at https://my.plantnet.org/ (see README).
  // Leave empty to disable photo identification — typing a name still works.
  plantnetApiKey: "2b10tCDMnPnIVIkSW1crXAJuO",

  plantnetEndpoint: "https://my-api.plantnet.org/v2/identify/all",

  // "north" -> Nov–Feb is winter. "south" -> May–Aug is winter.
  hemisphere: "north",
};
