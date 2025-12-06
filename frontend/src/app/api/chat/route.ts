import { NextRequest } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  // SECURITY: never expose your API key to the client
  const apiKey = process.env.OPENAI_API_KEY!;
  if (!apiKey) return new Response("Missing OPENAI_API_KEY", { status: 500 });

  // Basic guardrails
  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response("Bad request", { status: 400 });
  }

  // Add system prompt for Accorria context
  const systemMessage = {
    role: "system",
    content: `You are Accorria's AI deal agent. You help people list cars and homes for sale on the Accorria platform.

Key capabilities:
- Generate professional listings from photos/specs
- Provide pricing guidance based on market data
- Coach negotiation strategies
- Explain escrow and closing processes
- Help with listing optimization and marketing

RESPONSE FORMATTING GUIDELINES:
- Use clean, structured formatting without any markdown symbols like ** or *
- For numbered lists, use simple numbers like "1. Location:" not "**1. Location:**"
- Use clear headings and bullet points for organization
- Keep responses concise and scannable
- Use emojis sparingly but effectively for visual breaks
- Never use asterisks around text for emphasis

IMPORTANT: Stay focused on Accorria and car/home selling. Don't answer questions about changing the world, philosophy, or unrelated topics. Keep responses focused on helping users sell cars and homes faster with Accorria.

Tone: Professional, helpful, confident. You're an expert in real estate and automotive sales.
Keep responses concise and actionable. Always offer to help with specific next steps.`
  };

  const messagesWithSystem = [systemMessage, ...messages];

  // Stream back a response
  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",          // pick your model
      stream: true,
      temperature: 0.4,
      messages: messagesWithSystem,   // [{role:'system'|'user'|'assistant',content:'...'}]
    }),
  });

  if (!resp.ok) {
    return new Response(`OpenAI API error: ${resp.status}`, { status: 500 });
  }

  // Proxy the SSE stream back to the browser
  return new Response(resp.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
    },
  });
}
