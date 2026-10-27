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

Both discovery flows need the Express API server as well as the static client.
GitHub Pages hosts only the client; it cannot run the `/api` routes or keep a
Qloo key secret. The repository includes a Render Blueprint in `render.yaml`
to deploy the API separately.

1. In Render, create a new Blueprint from this repository and deploy the
   `collabquest-api` service.
2. Set `QLOO_API_KEY` in the Render service's environment settings. The
   Blueprint prompts for this value; it is deliberately not stored in the
   repository.
3. Keep `FRONTEND_ORIGIN` set to `https://gawdam.github.io` on the Render
   service so the API accepts requests from the GitHub Pages site.
4. After the API is healthy at `https://<your-render-service>.onrender.com`,
   add a repository Actions variable named `VITE_API_BASE_URL` with that full
   HTTPS URL (no trailing slash). Go to **Settings → Secrets and variables →
   Actions → Variables**.
5. In **Settings → Pages**, choose **GitHub Actions** as the deployment
   source. Push to the default branch or manually run the Pages workflow.

The Pages build uses `VITE_API_BASE_URL` for API requests. This variable is
public and should contain only the Render service URL. Never put `QLOO_API_KEY`
in a `VITE_*` variable, the frontend, or a GitHub Pages build secret: client
build values are visible to everyone. Store the Qloo key only in Render's
server environment.

## Deploy to GitHub Pages

The GitHub Actions workflow in `.github/workflows/deploy.yml` builds and deploys the app to GitHub Pages whenever changes are pushed to the default branch. In the repository's **Settings → Pages**, set the build and deployment source to **GitHub Actions**. The workflow automatically configures the correct base path for project pages and user or organization pages.

The development server continues to proxy `/api` to the local Express server,
so no `VITE_API_BASE_URL` is needed for local development.
