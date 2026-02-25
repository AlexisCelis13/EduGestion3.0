# Update Supabase Keys

It looks like your Supabase keys are mismatched or incorrect. Please follow these steps to fix the authentication error:

1.  **Go to your Supabase Dashboard**: 
    - Navigate to **Project Settings** -> **API**.

2.  **Update `src/environments/environment.ts`**:
    - Copy the **Project URL** and paste it into `supabaseUrl`.
    - Copy the **anon public** key and paste it into `supabaseAnonKey`.

3.  **Update Secrets for the Edge Function**:
    - Copy the **service_role secret** key (reveal it first).
    - Open your terminal and run the following command, replacing `YOUR_SERVICE_ROLE_KEY` and `YOUR_RESEND_API_KEY` with the actual values:

    ```powershell
    npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY RESEND_API_KEY=YOUR_RESEND_API_KEY
    ```
    *(Note: You can omit `RESEND_API_KEY` if you are okay using the hardcoded default, but setting it is safer).*

4.  **Redeploy the Function**:
    ```powershell
    npx supabase functions deploy send-magic-link
    ```

Once done, try logging in again.
