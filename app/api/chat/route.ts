import OpenAI from "openai";
import {
  OpenAIStream,
  StreamingTextResponse,
  AnthropicStream,
  AIStream,
  readableFromAsyncIterable,
} from "ai";
import Anthropic from "@anthropic-ai/sdk";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const client = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

export const runtime = 'edge'; // 'nodejs' is the default

const createSystemPrompt = (language: string) =>
  `Your name is Brick Bot! You are an expert ${language} tutor mentoring a pupil. Start at a really easy, basic level, and practice speaking with the pupil. Make sure to adjust to their level! Try to keep the conversation interesting. Ask them about their lives / their day and engage with them as much as possible. Ignore any mistakes they make and just keep the conversation going. Let me reiterate, DO NOT correct their mistakes. Make sure to speak in ${language} instead of English.`;

export async function POST(req: Request) {
  console.log('chat hit')
  try {
    const { messages, language } = await req.json();

    const latestMessage = messages[messages?.length - 1]?.content;

   
    let fullMessage = "";
    const res = client.messages
      .stream({
        model: "claude-3-opus-20240229",
        messages: [...messages],
        max_tokens: 4096,
        system: createSystemPrompt(language),
      })
      .on("text", (text) => {
      fullMessage += text;
      })
      .on("end", () => console.log(JSON.stringify(fullMessage)));

    return new StreamingTextResponse(
      AnthropicStream(res, {
      })
    );
  } catch (e) {
    throw e;
  }
}

