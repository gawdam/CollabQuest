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
The client sends searches to the local server, which keeps the Qloo API key out
of browser code and proxies the requests to Qloo.
For creator searches, the server uses Puppeteer to retrieve public Instagram
follower counts and an estimated median engagement rate from the latest nine
posts. Per-post engagement rate is calculated as (likes + comments) / followers;
the displayed rate is the median of posts with available counts. Instagram may
round these public counts or limit profile access, so metrics can be approximate
or unavailable.
Puppeteer installs a compatible browser as part of setup.
Creator recommendations use only the selected creator categories; Influencer is
selected by default and is used as the fallback if all categories are cleared.
On the brand search path, select creator cards to collect them in the outreach
cart. Begin outreach opens a card-only view for the selected creators.

## Deployment

Both discovery flows require the Express API server as well as the static
client. The GitHub Pages workflow publishes only the client and cannot serve
the `/api` routes. For a working deployment, host the Node server with
`QLOO_API_KEY` configured as a server environment variable and configure the
client host to proxy `/api` requests to it. Do not put a personal API key in
source code or GitHub Actions configuration.

## Deploy to GitHub Pages

The GitHub Actions workflow in `.github/workflows/deploy.yml` builds and deploys the app to GitHub Pages whenever changes are pushed to the default branch. In the repository's **Settings → Pages**, set the build and deployment source to **GitHub Actions**. The workflow automatically configures the correct base path for project pages and user or organization pages.

GitHub Pages can host a static preview of the interface, but searches will work
only when the API server is deployed separately and `/api` is routed to it.
