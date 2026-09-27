<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/c53aae40-b65d-46ba-9dba-b51f522cc553

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
## Free GitHub Hosting (GitHub Pages)

This project is pre-configured and 100% optimized for free hosting on GitHub Pages:

1. Push this repository to GitHub (`main` or `master` branch).
2. Go to your repository on GitHub: **Settings** → **Pages**.
3. Under **Build and deployment**:
   - Set **Source** to **GitHub Actions**.
4. The included `.github/workflows/deploy.yml` workflow will automatically build and publish your game to `https://<username>.github.io/<repo>/`!

All assets use relative paths (`base: './'`), storage runs on a high-capacity compact LZW engine that safely fits within browser quotas, and all game features (scouting, contract talks, biographies, match engine) function 100% offline and statically.
