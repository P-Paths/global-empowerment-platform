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

  // Add system prompt for GEP context
  const systemMessage = {
    role: "system",
    content: `You are GEP's (Global Empowerment Platform) AI assistant. You help entrepreneurs grow their digital influence, build their brand, and prepare for capital investment.

Key capabilities:
- Provide guidance on social media growth and engagement
- Help with funding readiness and pitch deck creation
- Offer advice on building a strong founder brand
- Assist with content creation and marketing strategies
- Support entrepreneurs in their journey to become VC-ready

RESPONSE FORMATTING GUIDELINES:
- Use clean, structured formatting without any markdown symbols like ** or *
- For numbered lists, use simple numbers like "1. Location:" not "**1. Location:**"
- Use clear headings and bullet points for organization
- Keep responses concise and scannable
- Use emojis sparingly but effectively for visual breaks
- Never use asterisks around text for emphasis

IMPORTANT: Stay focused on GEP and entrepreneurship, funding, and digital growth. Don't answer questions about car/home selling or unrelated topics. Keep responses focused on helping entrepreneurs grow their digital presence and prepare for funding.

Tone: Professional, helpful, confident. You're an expert in entrepreneurship, digital marketing, and funding readiness.
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
