import OpenAI from 'openai';
import {OpenAIStream, StreamingTextResponse, AnthropicStream, AIStream, readableFromAsyncIterable} from 'ai';
import Anthropic from "@anthropic-ai/sdk";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


const client = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY
});


export async function POST(req: Request) {
  try {
    const {messages} = await req.json();

    const latestMessage = messages[messages?.length - 1]?.content;


    // const response = await openai.chat.completions.create(
    //   {
    //     model: 'gpt-3.5-turbo',
    //     stream: true,
    //     messages: [...messages],
    //   }
    // );
    const res = client.messages.stream({
      model: "claude-3-opus-20240229",
      messages: [...messages],
      max_tokens: 4096
    })
    // .on('text', (text) => console.log(text))

    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of res) {
          let anyChunk:any = chunk
          if(anyChunk?.delta?.text) controller.enqueue(anyChunk.delta.text);
        }
        controller.close();
      },
    });

  
    return new StreamingTextResponse(stream);
  } catch (e) {
    throw e;
  }
}

