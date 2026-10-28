# Signal

Creator and brand discovery powered by Qloo audience affinity. Choose whether
you are an influencer looking for a brand or a brand looking for an influencer.

## Run locally

1. Run `npm install` if dependencies are not installed yet.
2. Add your Qloo API key and Apify token to `.env` in the repository root:

   ```env
   QLOO_API_KEY=your_qloo_api_key
   APIFY_TOKEN=your_apify_api_token
   ```

3. Run `npm run dev` and open the URL printed by Vite.

The development command runs both the Vite client and the Express API server.
The client sends searches to the local server, which keeps the Qloo API key out
of browser code and proxies the requests to Qloo. For each influencer, use
**Fetch Instagram details** to start a server-side Apify run. The server
retrieves the follower count and calculates the median of the per-post
engagement rates ((likes + comments) / followers) for up to the latest 6 posts
with available counts using the Apify Instagram Scraper. The Apify token stays
on the server.
Creator recommendations use only the selected creator categories; Influencer is
selected by default and is used as the fallback if all categories are cleared.
On the brand search path, select creator cards to collect them in the outreach
cart. Begin outreach opens a card-only view for the selected creators.

## Deploy to Vercel

The app is configured for Vercel: Vite builds the frontend into `dist`, and
the Express API is exposed as a Node.js Function under `/api`. The function
allows up to 300 seconds for Apify's Instagram actor; your Vercel plan must
support that configured maximum.

1. Import this repository into [Vercel](https://vercel.com/new), or install the
   Vercel CLI and run `vercel` from the repository root.
2. In the Vercel project settings, add `QLOO_API_KEY` and `APIFY_TOKEN` as
   environment variables for the deployments you will use. Use the values from
   your local `.env`; do not commit `.env` or put secrets in `vercel.json`.
3. Deploy with the Vercel dashboard or run `vercel --prod`. The project
   configuration uses `npm run build` and `dist` as the output directory.
4. Open the deployment URL and check `<deployment-url>/api/health`. The
   frontend and `/api` endpoints share the same domain.

Instagram details launch a paid Apify Actor run when a visitor clicks the
button. Monitor Apify usage and protect the public endpoint from abuse before
sharing the deployment widely.
