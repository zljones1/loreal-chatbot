# Cloudflare Worker Setup (keeps the OpenAI key secret)

The chatbot page never contains the OpenAI API key. Instead, the page sends
the conversation to a Cloudflare Worker, and the Worker adds the key and
forwards the request to OpenAI.

## What you need

- An **OpenAI API key** (https://platform.openai.com/api-keys). Your account needs billing or credits set up.
- A free **Cloudflare account** (https://dash.cloudflare.com/sign-up).

## Steps

1. **Create the Worker**
   - Log in to https://dash.cloudflare.com.
   - In the left menu, open **Compute (Workers) → Workers & Pages**.
   - Click **Create** → **Create Worker** (choose the "Hello World" starter).
   - Name it something like `loreal-chatbot`, then click **Deploy**.

2. **Paste the code**
   - Click **Edit code**.
   - Delete everything in the editor.
   - Copy all of `RESOURCE_cloudflare-worker.js` from this repo and paste it in.
   - Click **Deploy** (top right).

3. **Add the OpenAI key as a secret**
   - Go back to the Worker's page → **Settings** → **Variables and Secrets** → **Add**.
   - Type: **Secret**
   - Variable name: `OPENAI_API_KEY` (exactly this, all caps)
   - Value: your OpenAI key (starts with `sk-`)
   - Click **Deploy** / **Save**.

4. **Copy the Worker URL**
   - On the Worker's overview page, copy its URL. It looks like
     `https://loreal-chatbot.<your-subdomain>.workers.dev`.

5. **Paste the URL into the chatbot**
   - Open `script.js`.
   - Near the top, replace the placeholder text:
     ```js
     const WORKER_URL = "PASTE_YOUR_CLOUDFLARE_WORKER_URL_HERE";
     ```
     with your URL, for example:
     ```js
     const WORKER_URL = "https://loreal-chatbot.your-subdomain.workers.dev/";
     ```
   - Save, refresh the page, and ask a question to test it.

## Important

- **Never** paste your OpenAI key into `script.js` or any other file in this repo.
  The key only goes into the Cloudflare secret in step 3.
- If the chat says "something went wrong", check that the secret name is exactly
  `OPENAI_API_KEY` and that your OpenAI account has credits.
