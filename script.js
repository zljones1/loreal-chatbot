/* ============================================================
   L'Oréal Smart Product Advisor
   The page sends the conversation to a Cloudflare Worker.
   The Worker holds the OpenAI API key (as a secret) and talks
   to OpenAI for us, so NO API key ever lives in this file.
   ============================================================ */

/* 🔧 PASTE YOUR CLOUDFLARE WORKER URL HERE
   After you deploy your Worker (see WORKER_SETUP.md), copy its URL
   (it looks like https://loreal-chatbot.your-name.workers.dev/)
   and replace the placeholder text below. */
const WORKER_URL = "PASTE_YOUR_CLOUDFLARE_WORKER_URL_HERE";

/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const sendBtn = document.getElementById("sendBtn");
const latestQuestionText = document.getElementById("latestQuestionText");

/* System prompt: keeps the assistant focused on L'Oréal only */
const systemPrompt = `You are the L'Oréal Smart Product Advisor, a friendly and elegant beauty assistant.
You ONLY help with:
- L'Oréal products and brands (makeup, skincare, haircare, fragrance)
- beauty routines that use L'Oréal products
- personalized product recommendations
If the user asks about anything unrelated (for example math, coding, sports, politics, other companies' products, or general trivia), politely decline in one or two sentences and invite them to ask about L'Oréal beauty products or routines instead.
Remember details the user shares earlier in the conversation (like their name, skin type, hair type, or concerns) and use them in later answers.
Keep answers clear and concise, use short lists for routines, and never invent prices or claim medical results.`;

/* LevelUp: conversation history.
   We keep every message in this array and send the whole thing
   to the Worker each time, so the AI remembers the conversation. */
const messages = [{ role: "system", content: systemPrompt }];

/* Helper: add one chat bubble to the chat window.
   role is "user" or "ai". We use textContent (not innerHTML)
   so any text from the user or AI is shown safely as plain text. */
function addMessage(role, text) {
  const bubble = document.createElement("div");
  bubble.className = `msg ${role}`;

  // small label: "You" or "L'Oréal Advisor"
  const sender = document.createElement("span");
  sender.className = "sender";
  sender.textContent = role === "user" ? "You" : "L'Oréal Advisor";

  const body = document.createElement("span");
  body.className = "msg-text";
  body.textContent = text;

  bubble.appendChild(sender);
  bubble.appendChild(body);
  chatWindow.appendChild(bubble);

  // scroll to the newest message
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return bubble;
}

/* Initial greeting */
addMessage(
  "ai",
  "👋 Bonjour! I'm your L'Oréal Smart Product Advisor. Ask me about makeup, skincare, haircare, or fragrance, and I'll suggest products and routines for you."
);

/* Handle form submit */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // 1. Read and clean up what the user typed
  const question = userInput.value.trim();
  if (!question) return;

  // 2. LevelUp: show the latest question above the response
  //    (it resets every time a new question is asked)
  latestQuestionText.textContent = question;

  // 3. Show the user's message as a bubble and save it to history
  addMessage("user", question);
  messages.push({ role: "user", content: question });

  // 4. Clear the input and show a "thinking" bubble
  userInput.value = "";
  sendBtn.disabled = true;
  const loadingBubble = addMessage("ai", "Thinking…");
  loadingBubble.classList.add("loading");

  try {
    // Stop early with a clear message if the Worker URL isn't set yet
    if (WORKER_URL.startsWith("PASTE_")) {
      throw new Error(
        "The Cloudflare Worker URL hasn't been added yet. Paste it into WORKER_URL at the top of script.js."
      );
    }

    // 5. Send the whole conversation to the Cloudflare Worker
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: messages }),
    });

    const data = await response.json();

    // If OpenAI sent back an error, show it
    if (data.error) {
      throw new Error(data.error.message || "The AI service returned an error.");
    }

    // 6. Read the AI's reply
    const reply = data.choices[0].message.content;

    // 7. Replace the "thinking" bubble with the reply and save it to history
    loadingBubble.remove();
    addMessage("ai", reply);
    messages.push({ role: "assistant", content: reply });
  } catch (error) {
    // Show a friendly error in the chat
    loadingBubble.remove();
    addMessage("ai", `⚠️ Sorry, something went wrong: ${error.message}`);
    console.error(error);
  } finally {
    // Let the user type again
    sendBtn.disabled = false;
    userInput.focus();
  }
});
