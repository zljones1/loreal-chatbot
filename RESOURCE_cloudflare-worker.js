// Copy this code into your Cloudflare Worker script

export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json'
    };

    // Small helper: send back a JSON error the chatbot page can show
    const errorResponse = (message, status) =>
      new Response(JSON.stringify({ error: { message } }), { status, headers: corsHeaders });

    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // The chatbot only ever POSTs, so turn away anything else
    if (request.method !== 'POST') {
      return errorResponse('Please send a POST request with a messages array.', 405);
    }

    const apiKey = env.OPENAI_API_KEY; // Make sure to name your secret OPENAI_API_KEY in the Cloudflare Workers dashboard
    if (!apiKey) {
      return errorResponse('The Worker is missing its OPENAI_API_KEY secret.', 500);
    }

    // Read the conversation sent by the page
    let userInput;
    try {
      userInput = await request.json();
    } catch {
      return errorResponse('The request body must be JSON.', 400);
    }
    if (!Array.isArray(userInput.messages)) {
      return errorResponse('The request body needs a messages array.', 400);
    }

    const apiUrl = 'https://api.openai.com/v1/chat/completions';
    const requestBody = {
      model: 'gpt-4o',
      messages: userInput.messages,
      max_completion_tokens: 600, // room for a full routine without getting cut off
    };

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      // Pass OpenAI's answer (or its error) and status code back to the page
      return new Response(JSON.stringify(data), { status: response.status, headers: corsHeaders });
    } catch {
      return errorResponse('The Worker could not reach OpenAI. Try again in a moment.', 502);
    }
  }
};
