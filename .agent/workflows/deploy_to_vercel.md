---
description: Deploy the portfolio to Vercel
---

Follow these steps to deploy your Next.js portfolio to Vercel.

# 1. Prepare your Codebase
Ensure all your changes are committed and pushed to your GitHub repository.

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

# 2. Deploy on Vercel

1.  Go to [Vercel Dashboard](https://vercel.com/dashboard) and log in.
2.  Click **"Add New..."** -> **"Project"**.
3.  Import your `my-portfolio` repository from GitHub.

# 3. Configure Project

In the "Configure Project" screen:

1.  **Framework Preset**: Ensure it is set to `Next.js`.
2.  **Root Directory**: `./` (Default is fine).
3.  **Environment Variables**:
    *   Expand the "Environment Variables" section.
    *   Add the following variables (copy values from your `.env.local` file):
        *   `NEXT_PUBLIC_SUPABASE_URL`: (Your Supabase URL)
        *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: (Your Supabase Anon Key)

# 4. Deploy

1.  Click **"Deploy"**.
2.  Wait for the build to complete. It usually takes 1-2 minutes.
3.  Once finished, you will see a "Congratulations!" screen with your live URL.

# 5. Verify

1.  Visit your live URL (e.g., `https://my-portfolio-xyz.vercel.app`).
2.  Check the following:
    *   **Home Page**: Does it load?
    *   **Visitor Stats**: Does the counter increment? (Check Supabase `daily_stats` table to verify)
    *   **Admin Access**: Go to `/login`, sign in, and verify you can access the dashboard.
    *   **Images**: Ensure profile and project images load correctly.

---

> [!NOTE]
> If you make changes to your code later, simply push to GitHub (`git push`), and Vercel will automatically redeploy your site!
