import { auth } from "@/auth";
import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are an expert F-1 immigration assistant specializing in OPT and STEM OPT.
You help international students understand their work authorization, deadlines, and compliance requirements.
Be concise, accurate, and always remind users to consult their DSO for official guidance.`;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { messages } = await req.json();
  const capped = Array.isArray(messages) ? messages.slice(-20) : [];

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "system", content: SYSTEM_PROMPT }, ...capped],
    max_tokens: 500,
  });

  return NextResponse.json({ reply: completion.choices[0].message.content });
}
