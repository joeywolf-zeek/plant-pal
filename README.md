# Plant Pal 🪴

*(working title)*

A mobile-first plant care app. Snap a photo, identify the plant, and get a watering schedule adjusted for light, pot size, and season.

- **Static site.** Plain HTML, CSS, and JavaScript, with no build step, no backend, and no accounts.
- **Installable PWA** that works offline after the first visit.
- **Private.** Plants are stored in your browser's `localStorage`, and nothing leaves your device except the photo you send to Pl@ntNet for identification.

## Project layout

```
index.html              page structure + templates
styles.css              all styling (light/dark tokens at the top)
config.js               app name, Pl@ntNet API key, hemisphere   ← you edit this
manifest.webmanifest    PWA metadata (name, icons, colors)
sw.js                   service worker (offline cache)
icons/                  app icons (SVG source + PNGs)
js/
  app.js                UI: plant list, add-plant sheet, buttons
  plants-data.js        care table: ~70 plants with interval, soil tip, pet toxicity
  schedule.js           plant matching, interval math, date helpers
  identify.js           Pl@ntNet API call
  image.js              client-side photo resizing
  storage.js            localStorage + JSON backup export/import
  ics.js                .ics calendar file builder
```

## How the watering schedule works

1. **Match the plant** in `js/plants-data.js`, trying the most specific level first: species, then genus, then family, then a 7-day default.
2. **Adjust the base interval:**

   | Condition | Change |
   |---|---|
   | Bright light | −20% |
   | Low light | +25% |
   | Small pot | −20% |
   | Large pot | +20% |
   | Winter (Nov–Feb in the north) | +40% |

3. **You can edit the result** before saving.
4. **Winter is applied automatically.** The app stores the interval without the winter adjustment and re-applies it whenever you water. A 7-day plant becomes 10 days in November and goes back to 7 in March.
5. **"Still damp"** reminds you again in 2 days. Two damp checks in a row add 1 day to the plant's interval.

## Run it locally

ES modules don't load from `file://` URLs, so you need a tiny local server:

```bash
cd ~/plant-app
python3 -m http.server 8000
```

Then open <http://localhost:8000>. Press Ctrl+C in the terminal to stop the server.

> The service worker caches files. If an edit doesn't show up, do a hard reload (Cmd+Shift+R), or open DevTools → Application → Service Workers and tick **Update on reload**.

## Get a Pl@ntNet API key

Photo identification uses the [Pl@ntNet API](https://my.plantnet.org/). A free account comes with a daily identification quota; check your account page for the current limit.

1. Go to **<https://my.plantnet.org/>** and create an account, then confirm your email and log in.
2. Open your account **Settings** and copy your **API key**.
3. Paste it into `config.js`:
   ```js
   plantnetApiKey: "2b10abc...your key...",
   ```

Without a key the app still works. You can add plants by typing their name, and the Identify step is skipped.

### Restrict the key to your domain

Your key sits in `config.js`, and anyone can read that file on a public site. To make a copied key useless elsewhere, tell Pl@ntNet which websites may use it:

1. In your Pl@ntNet account **Settings**, tick **Expose my API key**. Browser apps need this; without it, every request from a website is rejected.
2. Under **Authorized domains**, add one full origin per line, including the scheme. Leave out any path and any trailing slash:
   ```
   https://yourusername.github.io
   http://localhost:8000
   http://localhost
   ```
   The `localhost` lines let you test on your computer, and you can remove them later.
3. Save.

If identification fails with *"This website isn't authorized for the API key"*, the origin is missing from that list or doesn't match exactly. `http` and `https` count as different origins, and so do different ports.

> A domain restriction stops casual reuse, but it isn't a vault: it checks which site a request claims to come from. The worst someone could do with your key is use up your free daily quota, so keep it on the free tier with no billing attached.

## Deploy to GitHub Pages

1. Create a new **public** repository on GitHub, for example `plant-pal`. Don't add a README, since you already have one.
2. Push this folder to it:
   ```bash
   cd ~/plant-app
   git init
   git add .
   git commit -m "Initial version"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/plant-pal.git
   git push -u origin main
   ```
3. On GitHub, go to **Settings → Pages**. Under **Build and deployment**, set Source to **Deploy from a branch**, Branch to **main**, and folder to **/ (root)**. Then click **Save**.
4. After a minute or two the site is live at `https://YOUR-USERNAME.github.io/plant-pal/`.
5. Make sure `YOUR-USERNAME.github.io` is in your Pl@ntNet authorized domains.

All paths in the app are relative, so it works from a `/repo-name/` subfolder without changes.

### Install it on your phone

- **iPhone (Safari):** tap Share, then **Add to Home Screen**.
- **Android (Chrome):** tap ⋮, then **Install app** (or **Add to Home screen**).

### Publishing updates

Edit, commit, and push. GitHub Pages redeploys automatically. Because of the offline cache, users see the new version on their **second** visit after the deploy.

If you add, rename, or remove files, update the `ASSETS` list in `sw.js` and bump `CACHE` (for example `plant-app-v2`) so the old cache gets cleared.

## Backups & reminders

- **Export backup** downloads a `.json` file with all your plants, including photo thumbnails. **Import backup** merges a backup into the current list; plants with the same ID are replaced. Plants live only in this browser on this device, so clearing site data or switching phones loses them unless you have a backup.
- **📅 Add to calendar** downloads an `.ics` file with a repeating 9:00 am event every *N* days. Open it to add it to Apple Calendar, Google Calendar, or Outlook.
  - The event is a fixed copy. It won't follow later schedule changes, such as winter adjustments or "Still damp".
  - When the interval changes, delete the old event and add a new one.

## Renaming the app

"Plant Pal" is a working title. To rename, change it in:

1. `config.js` → `appName`, which sets the header, page title, calendar events, and backup file name.
2. `index.html` → `<title>` and `<h1 id="app-name">`, which are shown for a split second before the JavaScript loads.
3. `manifest.webmanifest` → `name` and `short_name`, the name under the home-screen icon. Keep `short_name` to about 12 characters.
4. This README's heading.

Saved data uses neutral keys (`plantApp.v1`), so renaming won't lose anyone's plants.

## Southern Hemisphere

Set `hemisphere: "south"` in `config.js`. Winter then becomes May–August.

## Disclaimer

Watering intervals are starting estimates, and the finger test should always win. Pet toxicity information is general guidance based on the ASPCA lists. If a pet has eaten a plant, contact your vet or the ASPCA Animal Poison Control Center.
