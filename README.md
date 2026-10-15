# Signal

Creator-to-brand discovery powered by Qloo audience affinity.

## Run locally

1. Run `npm install` if dependencies are not installed yet.
2. Run `npm run dev` and open the URL printed by Vite.
3. Enter your Qloo API key in the **Qloo access** field before searching.

The app sends requests directly to Qloo from your browser. Your API key is held only in page memory and is sent to Qloo as a request header; it is not saved by the app. Because requests originate in the browser, Qloo must allow browser requests from the app's origin.

## Deploy to GitHub Pages

The GitHub Actions workflow in `.github/workflows/deploy.yml` builds and deploys the app to GitHub Pages whenever changes are pushed to the default branch. In the repository's **Settings → Pages**, set the build and deployment source to **GitHub Actions**. The workflow automatically configures the correct base path for project pages and user or organization pages.

After deployment, open the Pages URL, enter your Qloo API key, and test a creator brief. Do not put a personal API key into the source code or GitHub Actions configuration.
