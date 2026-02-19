# Supabase Email Templates for QiOne

These templates are designed to match the premium, glassmorphic aesthetic of the QiOne web application.

## How to use:
1.  Log in to your **Supabase Dashboard**.
2.  Go to **Authentication** -> **Email Templates**.
3.  Select the relevant template (e.g., Magic Link, Confirm Signup, Invite User).
4.  Copy the HTML from the files in this folder and paste it into the **Message Body** section of the Supabase dashboard.
5.  Save your changes.

## Templates in this folder:
-   `magic_link.html`: Used for the "Magic Link" / "Sign In with OTP" flow.
-   `otp.html`: Used if you want to send a 6-digit code instead of a link.
-   `invite.html`: Used when inviting new members to a tenant via the Worker.

## Important: Fixing Redirects
If your magic links are redirecting back to `localhost` when you want them to go to `one.qially.com`:

1.  **Site URL**: In Supabase Dashboard, go to **Authentication** -> **URL Configuration**. Make sure your **Site URL** is set to `https://one.qially.com`.
2.  **Redirect URLs**: Add `https://one.qially.com/**` to the **Redirect URLs** list.
3.  **Wrangler Config**: Ensure your `wrangler.toml` in the worker has `SUPABASE_REDIRECT_TO = "https://one.qially.com"`.
4.  **Confirm Flow**: If you use the `magic_link.html` provided here, it uses the `/auth/confirm` path. You should ensure your app (or worker) handles this route to exchange the `token_hash` for a session.

### OTP vs Magic Link
By default, Supabase sends a link. If you want to switch to a 6-digit code:
1.  Use the `otp.html` code in the **Magic Link** template section.
2.  In your `SignIn` logic on the frontend, you'll need to call `supabase.auth.verifyOtp` with the code the user enters.
