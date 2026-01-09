# Deploy Supabase Edge Function for Email Sending

The magic link system uses a Supabase Edge Function to send emails via Resend. Currently, the function is not deployed, so emails are not being sent. This guide will help you deploy the function.

## Prerequisites

1. A Supabase project (you already have one, as the app is using Supabase).
2. Access to the Supabase Dashboard (https://supabase.com/dashboard).
3. A Resend API key (if you haven't already, sign up at https://resend.com and create an API key).

## Steps

### 1. Set Environment Variables in Supabase

- Go to your Supabase project dashboard.
- Navigate to **Settings** → **API** → **Edge Functions**.
- Under **Environment Variables**, add the following:
  - `RESEND_API_KEY`: Your Resend API key.
  - `MAGIC_LINK_BASE_URL`: The base URL for magic links (e.g., `https://magic-link-nine.vercel.app`). This should match the `VITE_MAGIC_LINK_BASE_URL` in your frontend `.env` file.

### 2. Deploy the Edge Function

You have two options:

#### Option A: Deploy via Supabase Dashboard (Manual Upload)

1. In the Supabase Dashboard, go to **Edge Functions**.
2. Click **Create a new function**.
3. Name it `send-email`.
4. Copy the contents of `supabase/functions/send-email/index.ts` (from this project) into the editor.
5. Click **Deploy**.

#### Option B: Deploy via Supabase CLI (Recommended for future updates)

If you have Supabase CLI installed, you can deploy from the terminal:

```bash
# Install Supabase CLI (if not installed)
# Follow instructions at https://supabase.com/docs/guides/cli

# Login to Supabase
supabase login

# Link your project (run inside the project root)
supabase link --project-ref your-project-ref

# Deploy the function
supabase functions deploy send-email
```

### 3. Verify Deployment

After deployment, the Edge Function will be available at:
`https://<project-ref>.supabase.co/functions/v1/send-email`

You can test it using the Supabase Dashboard's **Edge Function** page (click "Invoke").

### 4. Update Frontend Configuration

Ensure your frontend `.env` file has the correct `VITE_MAGIC_LINK_BASE_URL` (the same as the magic link base URL). The Edge Function URL is automatically used by the `magicLinkService.ts` (it constructs the URL using the Supabase client).

### 5. Test Email Sending

Go to the User Management page, select a profile, and click "Send Magic Link". If the Edge Function is deployed and environment variables are set, the email should be sent. If there's an error, check the Edge Function logs in the Supabase Dashboard.

## Troubleshooting

- **CORS errors**: The Edge Function already includes CORS headers. If you still encounter CORS, ensure the function is deployed and the URL is correct.
- **Missing RESEND_API_KEY**: The function will fallback to simulation mode and return a simulated success (the magic link will be displayed for manual copying).
- **Function not found (404)**: The function may not be deployed. Deploy it as described above.

## Fallback Behavior

If the Edge Function cannot be reached (e.g., not deployed), the system will automatically fallback to simulation mode, generate a magic link, and display it for manual copying. This ensures the admin can still share the link even if email sending fails.

## Next Steps

After deploying, test the email sending with a real email address. If everything works, you can consider the magic link system fully operational.

For any issues, refer to the Supabase Edge Function logs or contact support.
