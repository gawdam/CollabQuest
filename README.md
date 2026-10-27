# Signal

Creator and brand discovery powered by Qloo audience affinity. Choose whether
you are an influencer looking for a brand or a brand looking for an influencer.

## Run locally

1. Run `npm install` if dependencies are not installed yet.
2. Add your Qloo API key to `.env` in the repository root:

   ```env
   QLOO_API_KEY=your_qloo_api_key
   ```

3. Run `npm run dev` and open the URL printed by Vite.

The development command runs both the Vite client and the Express API server.
For local development, the client can use the server-side key from `.env`.
Alternatively, enter your own Qloo API key in the app to send requests directly
from the browser. The key stays in page memory, is sent in the Qloo request
header, and is not stored or included in the built client.
For creator searches, the server uses Puppeteer to retrieve public Instagram
follower counts and an estimated median engagement rate from the latest nine
posts. Per-post engagement rate is calculated as (likes + comments) / followers;
the displayed rate is the median of posts with available counts. Instagram may
round these public counts or limit profile access, so metrics can be approximate
or unavailable. These Instagram metrics are only available when searches use
the server; direct browser searches on GitHub Pages show metrics as unavailable.
Puppeteer installs a compatible browser as part of setup.
Creator recommendations use only the selected creator categories; Influencer is
selected by default and is used as the fallback if all categories are cleared.
On the brand search path, select creator cards to collect them in the outreach
cart. Begin outreach opens a card-only view for the selected creators.

## Deployment

The Express API server is optional when visitors provide their own Qloo API
keys. In that mode, searches are sent directly from each visitor's browser to
Qloo; the visitor's key is visible to them in their browser's network tools and
is not shared with the site. Qloo must allow browser cross-origin requests from
the Pages domain for direct searches to work. Without that support, host the
Express server separately and route `/api` requests to it instead.

## Deploy to GitHub Pages

The GitHub Actions workflow in `.github/workflows/deploy.yml` builds and deploys the app to GitHub Pages whenever changes are pushed to the default branch. In the repository's **Settings → Pages**, set the build and deployment source to **GitHub Actions**. The workflow automatically configures the correct base path for project pages and user or organization pages.

GitHub Pages hosts the static client. Visitors can run searches by entering
their own Qloo API key in the app; no shared key is needed in GitHub Actions or
the published client. Direct searches do not include the server-only Instagram
metrics enrichment.
