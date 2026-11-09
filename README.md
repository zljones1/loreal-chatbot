# Project 8: L'Oréal Chatbot

L’Oréal is exploring the power of AI, and your job is to showcase what's possible. Your task is to build a chatbot that helps users discover and understand L’Oréal’s extensive range of products—makeup, skincare, haircare, and fragrances—as well as provide personalized routines and recommendations.

## 🚀 Launch via GitHub Codespaces

1. In the GitHub repo, click the **Code** button and select **Open with Codespaces → New codespace**.
2. Once your codespace is ready, open the `index.html` file via the live preview.

## ☁️ Cloudflare Note

When deploying through Cloudflare, make sure your API request body (in `script.js`) includes a `messages` array and handle the response by extracting `data.choices[0].message.content`.

Enjoy building your L’Oréal beauty assistant! 💄

## ✅ What's built

- **L'Oréal branding:** official logo, black / gold / white palette, Montserrat type.
- **Beauty-only assistant:** a system prompt keeps answers to L'Oréal products, routines, and recommendations, and politely declines unrelated questions.
- **Secure API calls:** `script.js` sends a `messages` array to a Cloudflare Worker (`RESOURCE_cloudflare-worker.js`), which holds the OpenAI key as a secret and returns `data.choices[0].message.content`. No API key is in the frontend.

### LevelUps

- **Conversation history:** the full `messages` array is sent every turn, so the bot remembers details like your name and skin type.
- **Latest question display:** your most recent question appears above the chat and resets with each new question.
- **Chat bubbles:** user messages are black bubbles on the right; advisor replies are white bubbles with a gold border on the left.

See **WORKER_SETUP.md** to connect your own Cloudflare Worker.
