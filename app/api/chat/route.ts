import OpenAI from 'openai';
import {OpenAIStream, StreamingTextResponse} from 'ai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


export async function POST(req: Request) {
  try {
    const {messages} = await req.json();

    const latestMessage = messages[messages?.length - 1]?.content;


    const response = await openai.chat.completions.create(
      {
        model: 'gpt-3.5-turbo',
        stream: true,
        messages: [...messages],
      }
    );
    const stream = OpenAIStream(response);
    return new StreamingTextResponse(stream);
  } catch (e) {
    throw e;
  }
}

