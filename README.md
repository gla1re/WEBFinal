# SmartBank — Your Digital Banking Experience
Demo multi-page banking website (university Web Technologies project). Fictional bank; no real transactions or credentials. Auth is a localStorage simulation and is **not secure**.

## Pages
index, deposits (calculator + comparison), cards, payments (transfers, history, live FX via open.er-api.com), auth (sign up / log in), profile.

## Run locally
Open `index.html` in a browser (or `python -m http.server`).

## Deploy (GitHub Pages)
1. Create a GitHub repository `smartbank` and upload the project files (index.html at the repo root).
2. Repository **Settings → Pages → Build and deployment**: Source = *Deploy from a branch*, Branch = `main`, folder `/ (root)`, Save.
3. After ~1 minute the live link is `https://<your-username>.github.io/smartbank/`. The repository link is `https://github.com/<your-username>/smartbank`.

Netlify: drag the folder onto app.netlify.com/drop. Vercel: import the repo, framework "Other".

## Test checklist
All nav links; sign up → log in → profile; calculator and compare; transfer/payment/history filters; theme toggle persists on all pages; FX rates load (internet needed).
