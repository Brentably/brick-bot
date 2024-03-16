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
  `Hey, I'm a new ${language} language learner. Can we start at a really easy, basic level, and you can practice speaking with me? Make sure to adjust to my level! Correct any mistakes as I go, and tutor me in learning the language. Be encouraging. Try to keep the conversation interesting and educational.`;

export async function POST(req: Request) {
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
      .on("end", () => console.log(fullMessage));


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

