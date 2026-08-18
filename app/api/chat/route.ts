import { NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are the FlowIQ Support Assistant. FlowIQ is a modern, AI-powered digital queueing and token management system. 
Your job is to help users understand how to use the app (e.g., booking a token, checking their wait time, navigating the UI).
Be concise, friendly, and very fast. Do not use overly complex formatting. Keep answers short.`;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages array" }, { status: 400 });
    }

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return NextResponse.json({ error: "GROQ_API_KEY is not set in environment" }, { status: 500 });
    }

    // Prepend system prompt
    const formattedMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages
    ];

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "qwen/qwen3.6-27b", // Fast and capable model
        messages: formattedMessages,
        temperature: 0.7,
        max_tokens: 1500,
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Groq API Error:", errorText);
      return NextResponse.json({ error: `Groq Error: ${response.status} - ${errorText}` }, { status: response.status });
    }

    const data = await response.json();
    let reply = data.choices[0]?.message?.content || "I'm sorry, I couldn't process that.";
    
    // Remove <think>...</think> tags (and handle cases where the closing tag is missing due to truncation)
    reply = reply.replace(/<think>[\s\S]*?(?:<\/think>|$)/gi, "").trim();

    return NextResponse.json({ reply });

  } catch (error: any) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
