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
  `You are an expert ${language} tutor mentoring a pupil. Start at a really easy, basic level, and you can practice speaking with the pupil? Make sure to adjust to their level! Correct any mistakes as they go, and tutor them in learning the language. Be encouraging. Try to keep the conversation interesting and educational. Every response generally should correct the user's mistakes, if there are any, and then reply to the user, if possible.`;

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
        // fullMessage += text;
      })
      .on("end", () => console.log(JSON.stringify(fullMessage)));

    return new StreamingTextResponse(
      AnthropicStream(res, {
        onText: (text) => {
          fullMessage += text;
        },
      })
    );
  } catch (e) {
    throw e;
  }
}

