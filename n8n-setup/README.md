# n8n & Telegram Bot Setup Guide

## Status
- **n8n** is running at [http://localhost:5678](http://localhost:5678).
- **Docker** container is active.

## Next Steps

### 1. Cloudflare Tunnel
Since you want to use Cloudflare for dynamic links:
- Ensure your Cloudflare Tunnel points to `http://localhost:5678`.
- Note your public Cloudflare URL (e.g., `https://your-app.trycloudflare.com`).

### 2. Configure Webhook URL
n8n needs to know your public URL to set up Telegram webhooks correctly.
1.  Open `n8n-setup/docker-compose.yml`.
2.  Uncomment or add the `WEBHOOK_URL` environment variable:
    ```yaml
    environment:
      - WEBHOOK_URL=https://your-public-cloudflare-url.com/
    ```
3.  Restart n8n:
    ```bash
    docker compose up -d --force-recreate
    ```

### 3. Create Telegram Bot
1.  Open Telegram and search for **@BotFather**.
2.  Send `/newbot`.
3.  Follow the prompts.
4.  Copy the **HTTP API Token**.

### 4. Configure n8n
1.  Open [http://localhost:5678](http://localhost:5678).
2.  Set up your owner account.
3.  Go to **Workflows** -> **Import from File** and select `telegram-echo-workflow.json` (in this folder).
4.  In the workflow, open the **Telegram Trigger** node.
5.  Create new Credentials using your **HTTP API Token**.
6.  Activate the workflow!
