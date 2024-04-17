import OpenAI from "openai";
import {
  OpenAIStream,
  StreamingTextResponse,
  AnthropicStream,
  AIStream,
  readableFromAsyncIterable,
} from "ai";
import Anthropic from "@anthropic-ai/sdk";
import { createChatSystemPrompt } from "../../../lib/prompts";

if (!process.env.OPENAI_API_KEY) throw new Error("no openai api key");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const client = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

export const runtime = "edge"; // 'nodejs' is the default

export async function POST(req: Request) {
  try {
    const { messages, language, topic } = await req.json();

    const latestMessage = messages[messages?.length - 1]?.content;

    const system = createChatSystemPrompt(language, topic);
    console.log("chat hit");
    console.log("w/ language", language);
    console.log("and topic: ", topic);
    // console.log("w/ system: ", system);
    // console.log("and messages: ", messages);

    const response = await openai.chat.completions.create({
      model: "gpt-4-0125-preview",
      stream: true,
      messages: [...messages],
    });



    // const resText = response.choices[0].message.content

    const singleItemStream = new ReadableStream({
      start(controller) {
        controller.enqueue('response');
        controller.close();
      }
    });
    return new StreamingTextResponse(singleItemStream);

  } catch (e) {
    throw e;
  }
}
