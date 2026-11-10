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
const WORKER_URL = "https://loreal-chatbot.zljones1.workers.dev/";

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
Keep answers clear and concise, use short numbered lists for routines, and never invent prices or claim medical results.
Write in plain text only: no Markdown symbols like ** or #, because the chat window shows text exactly as written.`;

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

  // scroll so the top of the newest message is visible
  // (for long replies, the user starts reading from the beginning)
  chatWindow.scrollTop = bubble.offsetTop - 10;
  return bubble;
}

/* Initial greeting */
addMessage(
  "ai",
  "👋 Bonjour! I'm your L'Oréal Smart Product Advisor. Ask me about makeup, skincare, haircare, or fragrance, and I'll suggest products and routines for you."
);

/* true while we are waiting for a reply, so the same question
   can't be sent twice by double-clicking or pressing Enter again */
let isWaiting = false;

/* Handle form submit */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // 1. Read and clean up what the user typed
  const question = userInput.value.trim();
  if (!question || isWaiting) return;
  isWaiting = true;

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

    // Read the answer. If the Worker crashed it may send back
    // something that isn't JSON, so we catch that and explain it simply.
    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error(
        `The Worker sent an unexpected response (status ${response.status}). Check the Worker code and its OPENAI_API_KEY secret.`
      );
    }

    // If OpenAI (or the Worker) sent back an error, show it
    if (data.error) {
      const msg = data.error.message || (typeof data.error === "string" ? data.error : "");
      throw new Error(msg || "The AI service returned an error.");
    }
    if (!response.ok || !data.choices || !data.choices[0]) {
      throw new Error(`The Worker returned an unexpected answer (status ${response.status}).`);
    }

    // 6. Read the AI's reply
    let reply = data.choices[0].message.content;

    // If the reply hit the length limit, let the user know it was cut short
    if (data.choices[0].finish_reason === "length") {
      reply += "\n\n(Reply shortened. Ask me to continue for the rest.)";
    }

    // 7. Replace the "thinking" bubble with the reply and save it to history
    loadingBubble.remove();
    addMessage("ai", reply);
    messages.push({ role: "assistant", content: reply });
  } catch (error) {
    // The question didn't get an answer, so take it back out of the
    // history. That way a failed question isn't sent again next time.
    messages.pop();

    // Show a friendly error in the chat
    loadingBubble.remove();
    addMessage("ai", `⚠️ Sorry, something went wrong: ${error.message}`);
    console.error(error);
  } finally {
    // Let the user type again
    isWaiting = false;
    sendBtn.disabled = false;
    userInput.focus();
  }
});
